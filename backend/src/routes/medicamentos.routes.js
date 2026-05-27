const express = require("express");
const oracledb = require("oracledb");
const router = express.Router();
const { getConnection } = require("../db");

function validarMedicamento({ id, nombre, precioUnitario }, esCreacion = true) {
    if (esCreacion && !id?.trim()) {
        return "El ID del medicamento es obligatorio.";
    }
    if (!nombre?.trim()) {
        return "El nombre del medicamento es obligatorio.";
    }
    if (precioUnitario === null || precioUnitario === undefined || precioUnitario === "") {
        return "El precio unitario es obligatorio.";
    }
    if (Number(precioUnitario) < 0) {
        return "El precio unitario no puede ser negativo.";
    }
    return null;
}

function manejarErrorOracle(error, res, mensajeBase) {
    console.error(mensajeBase, error);

    // ORA-00001: unique constraint violated
    if (error.errorNum === 1) {
        return res.status(409).json({
            message: "Ya existe un medicamento con ese ID.",
            error: error.message,
        });
    }

    // ORA-02292: FK violation (el medicamento está en uso)
    if (error.errorNum === 2292) {
        return res.status(409).json({
            message: "No se puede eliminar porque el medicamento está relacionado con uno o más tratamientos.",
            error: error.message,
        });
    }

    // PKG_UTILIDADES.lanzar_no_encontrado => RAISE_APPLICATION_ERROR(-20001, ...)
    if (error.errorNum === 20001) {
        return res.status(404).json({
            message: "Medicamento no encontrado.",
            error: error.message,
        });
    }

    // PKG_UTILIDADES.lanzar_operacion_invalida => RAISE_APPLICATION_ERROR(-20002, ...)
    if (error.errorNum === 20002) {
        return res.status(400).json({
            message: "Operación inválida sobre el medicamento.",
            error: error.message,
        });
    }

    // ORA-02290 / ORA-01400: check constraint / NOT NULL
    if (error.errorNum === 2290 || error.errorNum === 1400) {
        return res.status(400).json({
            message: "Los datos no cumplen una restricción de la base de datos.",
            error: error.message,
        });
    }

    return res.status(500).json({
        message: mensajeBase,
        error: error.message,
    });
}

// GET / — sin procedimiento en el paquete para listar, se mantiene SELECT directo
router.get("/", async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(`
            SELECT
                TRIM(idMedicamento) AS "id",
                nombre              AS "nombre",
                descripcion         AS "descripcion",
                precioUnitario      AS "precioUnitario"
            FROM MEDICAMENTO
            ORDER BY nombre
        `);

        res.json(result.rows);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando medicamentos");
    } finally {
        if (connection) await connection.close();
    }
});

// POST / — PKG_INVENTARIO_MEDICO.pr_insertar_medicamento
router.post("/", async (req, res) => {
    let connection;

    const { id, nombre, descripcion = null, precioUnitario = 0 } = req.body;

    const errorValidacion = validarMedicamento({ id, nombre, precioUnitario }, true);
    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        await connection.execute(
            `BEGIN
                PKG_INVENTARIO_MEDICO.pr_insertar_medicamento(
                    p_idMedicamento  => :id,
                    p_nombre         => :nombre,
                    p_descripcion    => :descripcion,
                    p_precioUnitario => :precioUnitario,
                    p_idMed_out      => :idMed_out
                );
            END;`,
            {
                id:             id.trim(),
                nombre:         nombre.trim(),
                descripcion:    descripcion?.trim() || null,
                precioUnitario: Number(precioUnitario),
                idMed_out:      { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 12 },
            },
            { autoCommit: true }
        );

        res.status(201).json({ message: "Medicamento creado correctamente" });
    } catch (error) {
        manejarErrorOracle(error, res, "Error creando medicamento");
    } finally {
        if (connection) await connection.close();
    }
});

// PUT /:id — PKG_INVENTARIO_MEDICO.pr_modificar_medicamento
// El paquete lanza ORA-20001 internamente si no existe; rowsAffected ya no se revisa aquí
router.put("/:id", async (req, res) => {
    let connection;

    const id = req.params.id;
    const { nombre, descripcion = null, precioUnitario = 0 } = req.body;

    const errorValidacion = validarMedicamento({ nombre, precioUnitario }, false);
    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        await connection.execute(
            `BEGIN
                PKG_INVENTARIO_MEDICO.pr_modificar_medicamento(
                    p_idMedicamento   => :id,
                    p_nombre          => :nombre,
                    p_descripcion     => :descripcion,
                    p_precioUnitario  => :precioUnitario,
                    p_filas_afectadas => :filasAfectadas
                );
            END;`,
            {
                id:              id,
                nombre:          nombre.trim(),
                descripcion:     descripcion?.trim() || null,
                precioUnitario:  Number(precioUnitario),
                filasAfectadas:  { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
            },
            { autoCommit: true }
        );

        res.json({ message: "Medicamento actualizado correctamente" });
    } catch (error) {
        manejarErrorOracle(error, res, "Error actualizando medicamento");
    } finally {
        if (connection) await connection.close();
    }
});

// DELETE /:id — PKG_INVENTARIO_MEDICO.pr_eliminar_medicamento
// Mismo caso: el paquete lanza ORA-20001 si no existe
router.delete("/:id", async (req, res) => {
    let connection;

    const id = req.params.id;

    try {
        connection = await getConnection();

        await connection.execute(
            `BEGIN
                PKG_INVENTARIO_MEDICO.pr_eliminar_medicamento(
                    p_idMedicamento   => :id,
                    p_filas_afectadas => :filasAfectadas
                );
            END;`,
            {
                id:             id,
                filasAfectadas: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
            },
            { autoCommit: true }
        );

        res.json({ message: "Medicamento eliminado correctamente" });
    } catch (error) {
        manejarErrorOracle(error, res, "Error eliminando medicamento");
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;