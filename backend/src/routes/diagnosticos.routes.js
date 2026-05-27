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

const estadosDiagnosticoValidos = ["PRESUNTIVO", "CONFIRMADO", "DESCARTADO"];

function validarDiagnostico({
    idConsulta,
    descripcionCondicion,
    estado,
}) {
    if (!idConsulta?.trim()) {
        return "La consulta es obligatoria.";
    }

    if (!descripcionCondicion?.trim()) {
        return "La descripción de la condición es obligatoria.";
    }

    if (!estadosDiagnosticoValidos.includes(estado)) {
        return "Estado inválido. Usa PRESUNTIVO, CONFIRMADO o DESCARTADO.";
    }

    return null;
}

function manejarErrorOracle(error, res, mensajeBase) {
    console.error(mensajeBase, error);

    if (error.errorNum === 1) {
        return res.status(409).json({
            message: "Ya existe un diagnóstico con ese ID.",
            error: error.message,
        });
    }

    if (error.errorNum === 20001 || error.errorNum === 20999) {
        return res.status(404).json({
            message: "Diagnóstico no encontrado",
            error: error.message,
        });
    }

    if (error.errorNum === 2291) {
        return res.status(400).json({
            message: "La consulta seleccionada no existe.",
            error: error.message,
        });
    }

    if (error.errorNum === 2292) {
        return res.status(409).json({
            message:
                "No se puede eliminar porque el diagnóstico tiene tratamientos u otros registros relacionados.",
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
 * GET /api/diagnosticos/catalogos
 */
router.get("/catalogos", async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_CONSULTAS_MEDICAS.pr_catalogos_diagnosticos(
                    :p_consultas
                );
            END;
            `,
            {
                p_consultas: outCursor(),
            }
        );

        const consultas = await cursorToRows(result.outBinds.p_consultas);

        res.json({
            consultas,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando catálogos de diagnósticos");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * GET /api/diagnosticos
 */
router.get("/", async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_CONSULTAS_MEDICAS.pr_listar_diagnosticos(:p_cursor);
            END;
            `,
            {
                p_cursor: outCursor(),
            }
        );

        const rows = await cursorToRows(result.outBinds.p_cursor);

        res.json(rows);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando diagnósticos");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * GET /api/diagnosticos/:id
 */
router.get("/:id", async (req, res) => {
    let connection;

    const id = normalizarId(req.params.id);

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_CONSULTAS_MEDICAS.pr_obtener_diagnostico(
                    :p_idDiagnostico,
                    :p_cursor
                );
            END;
            `,
            {
                p_idDiagnostico: id,
                p_cursor: outCursor(),
            }
        );

        const rows = await cursorToRows(result.outBinds.p_cursor);

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Diagnóstico no encontrado",
            });
        }

        res.json(rows[0]);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando diagnóstico");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * POST /api/diagnosticos
 */
router.post("/", async (req, res) => {
    let connection;

    const {
        id = null,
        idConsulta,
        descripcionCondicion,
        nivelGravedad = null,
        tipoAfeccion = null,
        estado = "PRESUNTIVO",
    } = req.body;

    const errorValidacion = validarDiagnostico({
        idConsulta,
        descripcionCondicion,
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
                PKG_CONSULTAS_MEDICAS.pr_insertar_diagnostico(
                    :p_idDiagnostico,
                    :p_idConsulta,
                    :p_descripcionCondicion,
                    :p_nivelGravedad,
                    :p_tipoAfeccion,
                    :p_estado,
                    :p_idDiagnostico_out
                );
            END;
            `,
            {
                p_idDiagnostico: normalizarTexto(id),
                p_idConsulta: normalizarId(idConsulta),
                p_descripcionCondicion: descripcionCondicion.trim(),
                p_nivelGravedad: normalizarTexto(nivelGravedad),
                p_tipoAfeccion: normalizarTexto(tipoAfeccion),
                p_estado: estado,
                p_idDiagnostico_out: outString(30),
            },
            { autoCommit: true }
        );

        res.status(201).json({
            ok: true,
            action: "CREATED",
            message: "Diagnóstico creado correctamente",
            id: result.outBinds.p_idDiagnostico_out,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error creando diagnóstico");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * PUT /api/diagnosticos/:id
 */
router.put("/:id", async (req, res) => {
    let connection;

    const id = normalizarId(req.params.id);

    const {
        idConsulta,
        descripcionCondicion,
        nivelGravedad = null,
        tipoAfeccion = null,
        estado = "PRESUNTIVO",
    } = req.body;

    const errorValidacion = validarDiagnostico({
        idConsulta,
        descripcionCondicion,
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
                PKG_CONSULTAS_MEDICAS.pr_modificar_diagnostico(
                    :p_idDiagnostico,
                    :p_idConsulta,
                    :p_descripcionCondicion,
                    :p_nivelGravedad,
                    :p_tipoAfeccion,
                    :p_estado,
                    :p_filas_afectadas
                );
            END;
            `,
            {
                p_idDiagnostico: id,
                p_idConsulta: normalizarId(idConsulta),
                p_descripcionCondicion: descripcionCondicion.trim(),
                p_nivelGravedad: normalizarTexto(nivelGravedad),
                p_tipoAfeccion: normalizarTexto(tipoAfeccion),
                p_estado: estado,
                p_filas_afectadas: outNumber(),
            },
            { autoCommit: true }
        );

        res.json({
            ok: true,
            action: "UPDATED",
            message: "Diagnóstico actualizado correctamente",
            id,
            filasAfectadas: result.outBinds.p_filas_afectadas,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error actualizando diagnóstico");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * DELETE /api/diagnosticos/:id
 */
router.delete("/:id", async (req, res) => {
    let connection;

    const id = normalizarId(req.params.id);

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_CONSULTAS_MEDICAS.pr_eliminar_diagnostico(
                    :p_idDiagnostico,
                    :p_filas_afectadas
                );
            END;
            `,
            {
                p_idDiagnostico: id,
                p_filas_afectadas: outNumber(),
            },
            { autoCommit: true }
        );

        res.json({
            ok: true,
            action: "DELETED",
            message: "Diagnóstico eliminado correctamente",
            id,
            filasAfectadas: result.outBinds.p_filas_afectadas,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error eliminando diagnóstico");
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;