const express = require("express");
const router = express.Router();
const { getConnection } = require("../db");

const {
    cursorToRows,
    outCursor,
    outNumber,
    outString,
    normalizarTexto,
} = require("../plsql");

function esFechaValida(fecha) {
    return /^\d{4}-\d{2}-\d{2}$/.test(fecha || "");
}

function normalizarNumero(valor) {
    if (valor === null || valor === undefined || valor === "") {
        return null;
    }

    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : NaN;
}

function validarConsulta({
    idCita,
    idServicio,
    temperatura,
    pesoConsulta,
    fechaAtencionReal,
}) {
    if (!idCita?.trim()) {
        return "La cita es obligatoria.";
    }

    if (!idServicio?.trim()) {
        return "El servicio es obligatorio.";
    }

    if (!fechaAtencionReal?.trim()) {
        return "La fecha de atención real es obligatoria.";
    }

    if (!esFechaValida(fechaAtencionReal)) {
        return "La fecha de atención real debe tener formato YYYY-MM-DD.";
    }

    const temperaturaNormalizada = normalizarNumero(temperatura);
    const pesoNormalizado = normalizarNumero(pesoConsulta);

    if (Number.isNaN(temperaturaNormalizada)) {
        return "La temperatura debe ser un número válido.";
    }

    if (Number.isNaN(pesoNormalizado)) {
        return "El peso en consulta debe ser un número válido.";
    }

    if (temperaturaNormalizada !== null && temperaturaNormalizada < 0) {
        return "La temperatura no puede ser negativa.";
    }

    if (pesoNormalizado !== null && pesoNormalizado < 0) {
        return "El peso en consulta no puede ser negativo.";
    }

    return null;
}

function manejarErrorOracle(error, res, mensajeBase) {
    console.error(mensajeBase, error);

    if (error.errorNum === 1) {
        return res.status(409).json({
            message: "Ya existe una consulta para esa cita o un registro con ese ID.",
            error: error.message,
        });
    }

    if (error.errorNum === 20001 || error.errorNum === 20999) {
        return res.status(404).json({
            message: "Consulta veterinaria no encontrada",
            error: error.message,
        });
    }

    if (error.errorNum === 2291) {
        return res.status(400).json({
            message: "La cita o el servicio seleccionado no existe.",
            error: error.message,
        });
    }

    if (error.errorNum === 2292) {
        return res.status(409).json({
            message:
                "No se puede eliminar porque la consulta tiene diagnósticos, tratamientos, facturas u otros registros relacionados.",
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
 * GET /api/consultas/catalogos
 */
router.get("/catalogos", async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_CONSULTAS_MEDICAS.pr_catalogos_consultas(
                    :p_citas,
                    :p_servicios
                );
            END;
            `,
            {
                p_citas: outCursor(),
                p_servicios: outCursor(),
            }
        );

        const citasDisponibles = await cursorToRows(result.outBinds.p_citas);
        const servicios = await cursorToRows(result.outBinds.p_servicios);

        res.json({
            citasDisponibles,
            servicios,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando catálogos de consultas");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * GET /api/consultas
 */
router.get("/", async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_CONSULTAS_MEDICAS.pr_listar_consultas(:p_cursor);
            END;
            `,
            {
                p_cursor: outCursor(),
            }
        );

        const rows = await cursorToRows(result.outBinds.p_cursor);

        res.json(normalizarRows(rows));
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando consultas veterinarias");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * GET /api/consultas/:id
 */
router.get("/:id", async (req, res) => {
    let connection;

    const id = String(req.params.id || "").trim().toUpperCase();

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_CONSULTAS_MEDICAS.pr_obtener_consulta(
                    :p_idConsulta,
                    :p_cursor
                );
            END;
            `,
            {
                p_idConsulta: id,
                p_cursor: outCursor(),
            }
        );

        const rows = await cursorToRows(result.outBinds.p_cursor);

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Consulta veterinaria no encontrada",
            });
        }

        res.json(normalizarRows(rows)[0]);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando consulta veterinaria");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * POST /api/consultas
 */
router.post("/", async (req, res) => {
    let connection;

    const {
        id = null,
        idCita,
        idServicio,
        temperatura = null,
        pesoConsulta = null,
        observaciones = null,
        recomendaciones = null,
        fechaAtencionReal,
    } = req.body;

    const errorValidacion = validarConsulta({
        idCita,
        idServicio,
        temperatura,
        pesoConsulta,
        fechaAtencionReal,
    });

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_CONSULTAS_MEDICAS.pr_insertar_consulta(
                    :p_idConsulta,
                    :p_idCita,
                    :p_idServicio,
                    :p_temperatura,
                    :p_pesoConsulta,
                    :p_observaciones,
                    :p_recomendaciones,
                    TO_DATE(:p_fechaAtencionReal, 'YYYY-MM-DD'),
                    :p_idConsulta_out
                );
            END;
            `,
            {
                p_idConsulta: normalizarTexto(id),
                p_idCita: String(idCita).trim(),
                p_idServicio: String(idServicio).trim(),
                p_temperatura: normalizarNumero(temperatura),
                p_pesoConsulta: normalizarNumero(pesoConsulta),
                p_observaciones: normalizarTexto(observaciones),
                p_recomendaciones: normalizarTexto(recomendaciones),
                p_fechaAtencionReal: fechaAtencionReal,
                p_idConsulta_out: outString(30),
            },
            { autoCommit: true }
        );

        res.status(201).json({
            ok: true,
            action: "CREATED",
            message: "Consulta veterinaria creada correctamente",
            id: result.outBinds.p_idConsulta_out,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error creando consulta veterinaria");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * PUT /api/consultas/:id
 */
router.put("/:id", async (req, res) => {
    let connection;

    const id = String(req.params.id || "").trim().toUpperCase();

    const {
        idCita,
        idServicio,
        temperatura = null,
        pesoConsulta = null,
        observaciones = null,
        recomendaciones = null,
        fechaAtencionReal,
    } = req.body;

    const errorValidacion = validarConsulta({
        idCita,
        idServicio,
        temperatura,
        pesoConsulta,
        fechaAtencionReal,
    });

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_CONSULTAS_MEDICAS.pr_modificar_consulta(
                    :p_idConsulta,
                    :p_idCita,
                    :p_idServicio,
                    :p_temperatura,
                    :p_pesoConsulta,
                    :p_observaciones,
                    :p_recomendaciones,
                    TO_DATE(:p_fechaAtencionReal, 'YYYY-MM-DD'),
                    :p_filas_afectadas
                );
            END;
            `,
            {
                p_idConsulta: id,
                p_idCita: String(idCita).trim(),
                p_idServicio: String(idServicio).trim(),
                p_temperatura: normalizarNumero(temperatura),
                p_pesoConsulta: normalizarNumero(pesoConsulta),
                p_observaciones: normalizarTexto(observaciones),
                p_recomendaciones: normalizarTexto(recomendaciones),
                p_fechaAtencionReal: fechaAtencionReal,
                p_filas_afectadas: outNumber(),
            },
            { autoCommit: true }
        );

        res.json({
            ok: true,
            action: "UPDATED",
            message: "Consulta veterinaria actualizada correctamente",
            id,
            filasAfectadas: result.outBinds.p_filas_afectadas,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error actualizando consulta veterinaria");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * DELETE /api/consultas/:id
 */
router.delete("/:id", async (req, res) => {
    let connection;

    const id = String(req.params.id || "").trim().toUpperCase();

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_CONSULTAS_MEDICAS.pr_eliminar_consulta(
                    :p_idConsulta,
                    :p_filas_afectadas
                );
            END;
            `,
            {
                p_idConsulta: id,
                p_filas_afectadas: outNumber(),
            },
            { autoCommit: true }
        );

        res.json({
            ok: true,
            action: "DELETED",
            message: "Consulta veterinaria eliminada correctamente",
            id,
            filasAfectadas: result.outBinds.p_filas_afectadas,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error eliminando consulta veterinaria");
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;