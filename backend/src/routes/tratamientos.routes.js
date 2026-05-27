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
    normalizarRows,
} = require("../plsql");

const tiposTratamientoValidos = [
    "MEDICACION",
    "OBSERVACION",
    "TERAPIA",
    "PROCEDIMIENTO_AMBULATORIO",
    "PLAN_VACUNACION",
];

const estadosTratamientoValidos = [
    "ACTIVO",
    "FINALIZADO",
    "SUSPENDIDO",
    "CANCELADO",
    null,
    "",
];

function esFechaValida(fecha) {
    return /^\d{4}-\d{2}-\d{2}$/.test(fecha || "");
}

function validarTratamiento({
    idDiagnostico,
    idVeterinario,
    tipo,
    fechaInicio,
    fechaFinEstimada,
    estado,
}) {
    if (!idDiagnostico?.trim()) {
        return "El diagnóstico es obligatorio.";
    }

    if (!idVeterinario?.trim()) {
        return "El veterinario es obligatorio.";
    }

    if (!tiposTratamientoValidos.includes(tipo)) {
        return "Tipo de tratamiento inválido.";
    }

    if (!fechaInicio?.trim()) {
        return "La fecha de inicio es obligatoria.";
    }

    if (!esFechaValida(fechaInicio)) {
        return "La fecha de inicio debe tener formato YYYY-MM-DD.";
    }

    if (fechaFinEstimada && !esFechaValida(fechaFinEstimada)) {
        return "La fecha fin estimada debe tener formato YYYY-MM-DD.";
    }

    if (!estadosTratamientoValidos.includes(estado)) {
        return "Estado de tratamiento inválido.";
    }

    return null;
}

function validarTratamientoMedicamento({
    idMedicamento,
    dosis,
    frecuencia,
}) {
    if (!idMedicamento?.trim()) {
        return "El medicamento es obligatorio.";
    }

    if (!dosis?.trim()) {
        return "La dosis es obligatoria.";
    }

    if (!frecuencia?.trim()) {
        return "La frecuencia es obligatoria.";
    }

    return null;
}

function manejarErrorOracle(error, res, mensajeBase) {
    console.error(mensajeBase, error);

    if (error.errorNum === 1) {
        return res.status(409).json({
            message: "Ya existe un registro con esos datos.",
            error: error.message,
        });
    }

    if (error.errorNum === 20001 || error.errorNum === 20999) {
        return res.status(404).json({
            message: "Registro no encontrado.",
            error: error.message,
        });
    }

    if (error.errorNum === 2291) {
        return res.status(400).json({
            message:
                "El diagnóstico, veterinario, servicio o medicamento seleccionado no existe.",
            error: error.message,
        });
    }

    if (error.errorNum === 2292) {
        return res.status(409).json({
            message:
                "No se puede eliminar porque el tratamiento tiene medicamentos u otros registros relacionados.",
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

router.get("/catalogos", async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_CONSULTAS_MEDICAS.pr_catalogos_tratamientos(
                    :p_diagnosticos,
                    :p_veterinarios,
                    :p_servicios,
                    :p_medicamentos
                );
            END;
            `,
            {
                p_diagnosticos: outCursor(),
                p_veterinarios: outCursor(),
                p_servicios: outCursor(),
                p_medicamentos: outCursor(),
            }
        );

        const diagnosticos = await cursorToRows(result.outBinds.p_diagnosticos);
        const veterinarios = await cursorToRows(result.outBinds.p_veterinarios);
        const servicios = await cursorToRows(result.outBinds.p_servicios);
        const medicamentos = await cursorToRows(result.outBinds.p_medicamentos);

        res.json({
            diagnosticos,
            veterinarios,
            servicios,
            medicamentos,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando catálogos de tratamientos");
    } finally {
        if (connection) await connection.close();
    }
});

router.get("/:id/medicamentos", async (req, res) => {
    let connection;
    const id = normalizarId(req.params.id);

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_CONSULTAS_MEDICAS.pr_listar_medicamentos_tratamiento(
                    :p_idTratamiento,
                    :p_cursor
                );
            END;
            `,
            {
                p_idTratamiento: id,
                p_cursor: outCursor(),
            }
        );

        const rows = await cursorToRows(result.outBinds.p_cursor);
        res.json(normalizarRows(rows));
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando medicamentos del tratamiento");
    } finally {
        if (connection) await connection.close();
    }
});

router.post("/:id/medicamentos", async (req, res) => {
    let connection;

    const idTratamiento = normalizarId(req.params.id);
    const {
        idMedicamento,
        dosis,
        frecuencia,
        viaAdministracion = null,
        duracion = null,
    } = req.body;

    const errorValidacion = validarTratamientoMedicamento({
        idMedicamento,
        dosis,
        frecuencia,
    });

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        await connection.execute(
            `
            BEGIN
                PKG_CONSULTAS_MEDICAS.pr_insertar_tratamiento_medicamento(
                    :p_idTratamiento,
                    :p_idMedicamento,
                    :p_dosis,
                    :p_frecuencia,
                    :p_viaAdministracion,
                    :p_duracion
                );
            END;
            `,
            {
                p_idTratamiento: idTratamiento,
                p_idMedicamento: normalizarId(idMedicamento),
                p_dosis: dosis.trim(),
                p_frecuencia: frecuencia.trim(),
                p_viaAdministracion: normalizarTexto(viaAdministracion),
                p_duracion: normalizarTexto(duracion),
            },
            { autoCommit: true }
        );

        res.status(201).json({
            ok: true,
            action: "CREATED",
            message: "Medicamento asociado correctamente al tratamiento",
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error asociando medicamento al tratamiento");
    } finally {
        if (connection) await connection.close();
    }
});

router.put("/:id/medicamentos/:idMedicamento", async (req, res) => {
    let connection;

    const idTratamiento = normalizarId(req.params.id);
    const idMedicamentoParam = normalizarId(req.params.idMedicamento);

    const {
        dosis,
        frecuencia,
        viaAdministracion = null,
        duracion = null,
    } = req.body;

    const errorValidacion = validarTratamientoMedicamento({
        idMedicamento: idMedicamentoParam,
        dosis,
        frecuencia,
    });

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_CONSULTAS_MEDICAS.pr_modificar_tratamiento_medicamento(
                    :p_idTratamiento,
                    :p_idMedicamento,
                    :p_dosis,
                    :p_frecuencia,
                    :p_viaAdministracion,
                    :p_duracion,
                    :p_filas_afectadas
                );
            END;
            `,
            {
                p_idTratamiento: idTratamiento,
                p_idMedicamento: idMedicamentoParam,
                p_dosis: dosis.trim(),
                p_frecuencia: frecuencia.trim(),
                p_viaAdministracion: normalizarTexto(viaAdministracion),
                p_duracion: normalizarTexto(duracion),
                p_filas_afectadas: outNumber(),
            },
            { autoCommit: true }
        );

        res.json({
            ok: true,
            action: "UPDATED",
            message: "Medicamento del tratamiento actualizado correctamente",
            filasAfectadas: result.outBinds.p_filas_afectadas,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error actualizando medicamento del tratamiento");
    } finally {
        if (connection) await connection.close();
    }
});

router.delete("/:id/medicamentos/:idMedicamento", async (req, res) => {
    let connection;

    const idTratamiento = normalizarId(req.params.id);
    const idMedicamento = normalizarId(req.params.idMedicamento);

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_CONSULTAS_MEDICAS.pr_eliminar_tratamiento_medicamento(
                    :p_idTratamiento,
                    :p_idMedicamento,
                    :p_filas_afectadas
                );
            END;
            `,
            {
                p_idTratamiento: idTratamiento,
                p_idMedicamento: idMedicamento,
                p_filas_afectadas: outNumber(),
            },
            { autoCommit: true }
        );

        res.json({
            ok: true,
            action: "DELETED",
            message: "Medicamento eliminado del tratamiento correctamente",
            filasAfectadas: result.outBinds.p_filas_afectadas,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error eliminando medicamento del tratamiento");
    } finally {
        if (connection) await connection.close();
    }
});

router.get("/", async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_CONSULTAS_MEDICAS.pr_listar_tratamientos(:p_cursor);
            END;
            `,
            {
                p_cursor: outCursor(),
            }
        );

        const rows = await cursorToRows(result.outBinds.p_cursor);
        res.json(normalizarRows(rows));
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando tratamientos");
    } finally {
        if (connection) await connection.close();
    }
});

router.get("/:id", async (req, res) => {
    let connection;

    const id = normalizarId(req.params.id);

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_CONSULTAS_MEDICAS.pr_obtener_tratamiento(
                    :p_idTratamiento,
                    :p_cursor
                );
            END;
            `,
            {
                p_idTratamiento: id,
                p_cursor: outCursor(),
            }
        );

        const rows = await cursorToRows(result.outBinds.p_cursor);

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Tratamiento no encontrado",
            });
        }

        res.json(normalizarRows(rows)[0]);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando tratamiento");
    } finally {
        if (connection) await connection.close();
    }
});

router.post("/", async (req, res) => {
    let connection;

    const {
        id = null,
        idDiagnostico,
        idVeterinario,
        idServicio = null,
        tipo,
        fechaInicio,
        fechaFinEstimada = null,
        indicaciones = null,
        estado = "ACTIVO",
    } = req.body;

    const errorValidacion = validarTratamiento({
        idDiagnostico,
        idVeterinario,
        tipo,
        fechaInicio,
        fechaFinEstimada,
        estado,
    });

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_CONSULTAS_MEDICAS.pr_insertar_tratamiento(
                    :p_idTratamiento,
                    :p_idDiagnostico,
                    :p_idVeterinario,
                    :p_idServicio,
                    :p_tipo,
                    TO_DATE(:p_fechaInicio, 'YYYY-MM-DD'),
                    CASE
                        WHEN :p_fechaFinEstimada IS NULL THEN NULL
                        ELSE TO_DATE(:p_fechaFinEstimada, 'YYYY-MM-DD')
                    END,
                    :p_indicaciones,
                    :p_estado,
                    :p_idTratamiento_out
                );
            END;
            `,
            {
                p_idTratamiento: normalizarTexto(id),
                p_idDiagnostico: normalizarId(idDiagnostico),
                p_idVeterinario: normalizarId(idVeterinario),
                p_idServicio: normalizarTexto(idServicio),
                p_tipo: tipo,
                p_fechaInicio: fechaInicio,
                p_fechaFinEstimada: normalizarTexto(fechaFinEstimada),
                p_indicaciones: normalizarTexto(indicaciones),
                p_estado: normalizarTexto(estado),
                p_idTratamiento_out: outString(30),
            },
            { autoCommit: true }
        );

        res.status(201).json({
            ok: true,
            action: "CREATED",
            message: "Tratamiento creado correctamente",
            id: result.outBinds.p_idTratamiento_out,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error creando tratamiento");
    } finally {
        if (connection) await connection.close();
    }
});

router.put("/:id", async (req, res) => {
    let connection;

    const id = normalizarId(req.params.id);

    const {
        idDiagnostico,
        idVeterinario,
        idServicio = null,
        tipo,
        fechaInicio,
        fechaFinEstimada = null,
        indicaciones = null,
        estado = "ACTIVO",
    } = req.body;

    const errorValidacion = validarTratamiento({
        idDiagnostico,
        idVeterinario,
        tipo,
        fechaInicio,
        fechaFinEstimada,
        estado,
    });

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_CONSULTAS_MEDICAS.pr_modificar_tratamiento(
                    :p_idTratamiento,
                    :p_idDiagnostico,
                    :p_idVeterinario,
                    :p_idServicio,
                    :p_tipo,
                    TO_DATE(:p_fechaInicio, 'YYYY-MM-DD'),
                    CASE
                        WHEN :p_fechaFinEstimada IS NULL THEN NULL
                        ELSE TO_DATE(:p_fechaFinEstimada, 'YYYY-MM-DD')
                    END,
                    :p_indicaciones,
                    :p_estado,
                    :p_filas_afectadas
                );
            END;
            `,
            {
                p_idTratamiento: id,
                p_idDiagnostico: normalizarId(idDiagnostico),
                p_idVeterinario: normalizarId(idVeterinario),
                p_idServicio: normalizarTexto(idServicio),
                p_tipo: tipo,
                p_fechaInicio: fechaInicio,
                p_fechaFinEstimada: normalizarTexto(fechaFinEstimada),
                p_indicaciones: normalizarTexto(indicaciones),
                p_estado: normalizarTexto(estado),
                p_filas_afectadas: outNumber(),
            },
            { autoCommit: true }
        );

        res.json({
            ok: true,
            action: "UPDATED",
            message: "Tratamiento actualizado correctamente",
            id,
            filasAfectadas: result.outBinds.p_filas_afectadas,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error actualizando tratamiento");
    } finally {
        if (connection) await connection.close();
    }
});

router.delete("/:id", async (req, res) => {
    let connection;

    const id = normalizarId(req.params.id);

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_CONSULTAS_MEDICAS.pr_eliminar_tratamiento(
                    :p_idTratamiento,
                    :p_filas_afectadas
                );
            END;
            `,
            {
                p_idTratamiento: id,
                p_filas_afectadas: outNumber(),
            },
            { autoCommit: true }
        );

        res.json({
            ok: true,
            action: "DELETED",
            message: "Tratamiento eliminado correctamente",
            id,
            filasAfectadas: result.outBinds.p_filas_afectadas,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error eliminando tratamiento");
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;