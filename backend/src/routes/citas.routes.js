const express = require("express");
const router = express.Router();
const { getConnection } = require("../db");

const {
    cursorToRows,
    outCursor,
    outNumber,
    outString,
    normalizarTexto,
    normalizarId,
} = require("../plsql");

const estadosValidos = [
    "PROGRAMADA",
    "CONFIRMADA",
    "ATENDIDA",
    "CANCELADA",
    "REPROGRAMADA",
];

function horaAMinutos(hora) {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hora || "");

    if (!match) {
        return null;
    }

    return Number(match[1]) * 60 + Number(match[2]);
}

function validarCita(
    {
        id,
        mascotaId,
        veterinarioId,
        recepcionistaId,
        fecha,
        hora,
        estado,
    },
    esCreacion = true
) {
    if (esCreacion && !id?.trim()) {
        return "El ID de la cita es obligatorio.";
    }

    if (!mascotaId?.trim()) {
        return "La mascota es obligatoria.";
    }

    if (!veterinarioId?.trim()) {
        return "El veterinario es obligatorio.";
    }

    if (!recepcionistaId?.trim()) {
        return "El recepcionista es obligatorio.";
    }

    if (!fecha?.trim()) {
        return "La fecha es obligatoria.";
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return "La fecha debe tener formato YYYY-MM-DD.";
    }

    if (horaAMinutos(hora) === null) {
        return "La hora debe tener formato HH:mm.";
    }

    if (!estadosValidos.includes(estado)) {
        return "Estado inválido. Usa PROGRAMADA, CONFIRMADA, ATENDIDA, CANCELADA o REPROGRAMADA.";
    }

    return null;
}

function manejarErrorOracle(error, res, mensajeBase) {
    console.error(mensajeBase, error);

    if (error.errorNum === 1) {
        return res.status(409).json({
            message: "Ya existe una cita con ese ID.",
            error: error.message,
        });
    }

    if (error.errorNum === 20001 || error.errorNum === 20999) {
        return res.status(404).json({
            message: "Cita no encontrada",
            error: error.message,
        });
    }

    if (error.errorNum === 2291) {
        return res.status(400).json({
            message:
                "La mascota, el veterinario o el recepcionista seleccionado no existe.",
            error: error.message,
        });
    }

    if (error.errorNum === 2292) {
        return res.status(409).json({
            message:
                "No se puede eliminar porque la cita tiene consultas, facturas u otros registros relacionados.",
            error: error.message,
        });
    }

    if (error.errorNum === 2290 || error.errorNum === 1400) {
        return res.status(400).json({
            message: "Los datos no cumplen una restricción de la base de datos.",
            error: error.message,
        });
    }

    if (error.errorNum === 12899) {
        return res.status(400).json({
            message: "Uno de los campos supera la longitud permitida por la base de datos.",
            error: error.message,
        });
    }

    return res.status(500).json({
        message: mensajeBase,
        error: error.message,
    });
}

/**
 * GET /api/citas/catalogos
 */
router.get("/catalogos", async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_AGENDAMIENTO.pr_catalogos_citas(
                    :p_mascotas,
                    :p_veterinarios,
                    :p_recepcionistas
                );
            END;
            `,
            {
                p_mascotas: outCursor(),
                p_veterinarios: outCursor(),
                p_recepcionistas: outCursor(),
            }
        );

        const mascotas = await cursorToRows(result.outBinds.p_mascotas);
        const veterinarios = await cursorToRows(result.outBinds.p_veterinarios);
        const recepcionistas = await cursorToRows(result.outBinds.p_recepcionistas);

        res.json({
            mascotas,
            veterinarios,
            recepcionistas,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando catálogos de citas");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * GET /api/citas
 */
router.get("/", async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_AGENDAMIENTO.pr_listar_citas(:p_cursor);
            END;
            `,
            {
                p_cursor: outCursor(),
            }
        );

        const rows = await cursorToRows(result.outBinds.p_cursor);

        res.json(rows);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando citas");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * GET /api/citas/:id
 */
router.get("/:id", async (req, res) => {
    let connection;

    const id = normalizarId(req.params.id);

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_AGENDAMIENTO.pr_obtener_cita(
                    :p_idCita,
                    :p_cursor
                );
            END;
            `,
            {
                p_idCita: id,
                p_cursor: outCursor(),
            }
        );

        const rows = await cursorToRows(result.outBinds.p_cursor);

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Cita no encontrada",
            });
        }

        res.json(rows[0]);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando cita");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * POST /api/citas
 */
router.post("/", async (req, res) => {
    let connection;

    const {
        id,
        mascotaId,
        veterinarioId,
        recepcionistaId,
        fecha,
        hora,
        motivo = null,
        estado = "PROGRAMADA",
    } = req.body;

    const errorValidacion = validarCita(
        {
            id,
            mascotaId,
            veterinarioId,
            recepcionistaId,
            fecha,
            hora,
            estado,
        },
        true
    );

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_AGENDAMIENTO.pr_insertar_cita(
                    :p_idCita,
                    :p_codigoMascota,
                    :p_idVeterinario,
                    :p_idRecepcionista,
                    TO_DATE(:p_fecha, 'YYYY-MM-DD'),
                    NUMTODSINTERVAL(:p_horaMinutos, 'MINUTE'),
                    :p_motivoConsulta,
                    :p_estadoCita,
                    :p_idCita_out
                );
            END;
            `,
            {
                p_idCita: normalizarId(id),
                p_codigoMascota: normalizarId(mascotaId),
                p_idVeterinario: normalizarId(veterinarioId),
                p_idRecepcionista: normalizarId(recepcionistaId),
                p_fecha: fecha,
                p_horaMinutos: horaAMinutos(hora),
                p_motivoConsulta: normalizarTexto(motivo),
                p_estadoCita: estado,
                p_idCita_out: outString(30),
            },
            { autoCommit: true }
        );

        res.status(201).json({
            ok: true,
            action: "CREATED",
            message: "Cita creada correctamente",
            id: result.outBinds.p_idCita_out,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error creando cita");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * PUT /api/citas/:id
 */
router.put("/:id", async (req, res) => {
    let connection;

    const id = normalizarId(req.params.id);

    const {
        mascotaId,
        veterinarioId,
        recepcionistaId,
        fecha,
        hora,
        motivo = null,
        estado = "PROGRAMADA",
    } = req.body;

    const errorValidacion = validarCita(
        {
            mascotaId,
            veterinarioId,
            recepcionistaId,
            fecha,
            hora,
            estado,
        },
        false
    );

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_AGENDAMIENTO.pr_modificar_cita(
                    :p_idCita,
                    :p_codigoMascota,
                    :p_idVeterinario,
                    :p_idRecepcionista,
                    TO_DATE(:p_fecha, 'YYYY-MM-DD'),
                    NUMTODSINTERVAL(:p_horaMinutos, 'MINUTE'),
                    :p_motivoConsulta,
                    :p_estadoCita,
                    :p_filas_afectadas
                );
            END;
            `,
            {
                p_idCita: id,
                p_codigoMascota: normalizarId(mascotaId),
                p_idVeterinario: normalizarId(veterinarioId),
                p_idRecepcionista: normalizarId(recepcionistaId),
                p_fecha: fecha,
                p_horaMinutos: horaAMinutos(hora),
                p_motivoConsulta: normalizarTexto(motivo),
                p_estadoCita: estado,
                p_filas_afectadas: outNumber(),
            },
            { autoCommit: true }
        );

        res.json({
            ok: true,
            action: "UPDATED",
            message: "Cita actualizada correctamente",
            id,
            filasAfectadas: result.outBinds.p_filas_afectadas,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error actualizando cita");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * DELETE /api/citas/:id
 */
router.delete("/:id", async (req, res) => {
    let connection;

    const id = normalizarId(req.params.id);

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_AGENDAMIENTO.pr_eliminar_cita(
                    :p_idCita,
                    :p_filas_afectadas
                );
            END;
            `,
            {
                p_idCita: id,
                p_filas_afectadas: outNumber(),
            },
            { autoCommit: true }
        );

        res.json({
            ok: true,
            action: "DELETED",
            message: "Cita eliminada correctamente",
            id,
            filasAfectadas: result.outBinds.p_filas_afectadas,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error eliminando cita");
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;