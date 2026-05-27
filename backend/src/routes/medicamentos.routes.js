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

function validarMedicamento({ id, nombre, precioUnitario }, esCreacion = true) {
    if (esCreacion && !id?.trim()) {
        return "El ID del medicamento es obligatorio.";
    }

    if (!nombre?.trim()) {
        return "El nombre del medicamento es obligatorio.";
    }

    if (
        precioUnitario === null ||
        precioUnitario === undefined ||
        precioUnitario === ""
    ) {
        return "El precio unitario es obligatorio.";
    }

    if (Number(precioUnitario) < 0 || Number.isNaN(Number(precioUnitario))) {
        return "El precio unitario debe ser un número mayor o igual a cero.";
    }

    return null;
}

function manejarErrorOracle(error, res, mensajeBase) {
    console.error(mensajeBase, error);

    if (error.errorNum === 1) {
        return res.status(409).json({
            message: "Ya existe un medicamento con ese ID.",
            error: error.message,
        });
    }

    if (error.errorNum === 20001 || error.errorNum === 20999) {
        return res.status(404).json({
            message: "Medicamento no encontrado",
            error: error.message,
        });
    }

    if (error.errorNum === 2292) {
        return res.status(409).json({
            message:
                "No se puede eliminar porque el medicamento está relacionado con uno o más tratamientos.",
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

router.get("/", async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_INVENTARIO_MEDICO.pr_listar_medicamentos(:p_cursor);
            END;
            `,
            {
                p_cursor: outCursor(),
            }
        );

        const rows = await cursorToRows(result.outBinds.p_cursor);

        res.json(rows);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando medicamentos");
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
                PKG_INVENTARIO_MEDICO.pr_obtener_medicamento(
                    :p_idMedicamento,
                    :p_cursor
                );
            END;
            `,
            {
                p_idMedicamento: id,
                p_cursor: outCursor(),
            }
        );

        const rows = await cursorToRows(result.outBinds.p_cursor);

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Medicamento no encontrado",
            });
        }

        res.json(rows[0]);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando medicamento");
    } finally {
        if (connection) await connection.close();
    }
});

router.post("/", async (req, res) => {
    let connection;

    const {
        id,
        nombre,
        descripcion = null,
        precioUnitario = 0,
    } = req.body;

    const errorValidacion = validarMedicamento(
        { id, nombre, precioUnitario },
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
                PKG_INVENTARIO_MEDICO.pr_insertar_medicamento(
                    :p_idMedicamento,
                    :p_nombre,
                    :p_descripcion,
                    :p_precioUnitario,
                    :p_idMed_out
                );
            END;
            `,
            {
                p_idMedicamento: normalizarId(id),
                p_nombre: nombre.trim(),
                p_descripcion: normalizarTexto(descripcion),
                p_precioUnitario: Number(precioUnitario),
                p_idMed_out: outString(30),
            },
            { autoCommit: true }
        );

        res.status(201).json({
            ok: true,
            action: "CREATED",
            message: "Medicamento creado correctamente",
            id: result.outBinds.p_idMed_out,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error creando medicamento");
    } finally {
        if (connection) await connection.close();
    }
});

router.put("/:id", async (req, res) => {
    let connection;

    const id = normalizarId(req.params.id);

    const {
        nombre,
        descripcion = null,
        precioUnitario = 0,
    } = req.body;

    const errorValidacion = validarMedicamento(
        { nombre, precioUnitario },
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
                PKG_INVENTARIO_MEDICO.pr_modificar_medicamento(
                    :p_idMedicamento,
                    :p_nombre,
                    :p_descripcion,
                    :p_precioUnitario,
                    :p_filas_afectadas
                );
            END;
            `,
            {
                p_idMedicamento: id,
                p_nombre: nombre.trim(),
                p_descripcion: normalizarTexto(descripcion),
                p_precioUnitario: Number(precioUnitario),
                p_filas_afectadas: outNumber(),
            },
            { autoCommit: true }
        );

        res.json({
            ok: true,
            action: "UPDATED",
            message: "Medicamento actualizado correctamente",
            id,
            filasAfectadas: result.outBinds.p_filas_afectadas,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error actualizando medicamento");
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
                PKG_INVENTARIO_MEDICO.pr_eliminar_medicamento(
                    :p_idMedicamento,
                    :p_filas_afectadas
                );
            END;
            `,
            {
                p_idMedicamento: id,
                p_filas_afectadas: outNumber(),
            },
            { autoCommit: true }
        );

        res.json({
            ok: true,
            action: "DELETED",
            message: "Medicamento eliminado correctamente",
            id,
            filasAfectadas: result.outBinds.p_filas_afectadas,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error eliminando medicamento");
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;