const express = require("express");
const router = express.Router();
const { getConnection } = require("../db");

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

    if (Number(precioUnitario) < 0) {
        return "El precio unitario no puede ser negativo.";
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

    return res.status(500).json({
        message: mensajeBase,
        error: error.message,
    });
}

router.get("/", async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(`
      SELECT
        TRIM(idMedicamento) AS "id",
        nombre AS "nombre",
        descripcion AS "descripcion",
        precioUnitario AS "precioUnitario"
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

router.post("/", async (req, res) => {
    let connection;

    const { id, nombre, descripcion = null, precioUnitario = 0 } = req.body;

    const errorValidacion = validarMedicamento(
        { id, nombre, precioUnitario },
        true
    );

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        await connection.execute(
            `
      INSERT INTO MEDICAMENTO (
        idMedicamento,
        nombre,
        descripcion,
        precioUnitario
      ) VALUES (
        :id,
        :nombre,
        :descripcion,
        :precioUnitario
      )
      `,
            {
                id: id.trim(),
                nombre: nombre.trim(),
                descripcion: descripcion?.trim() || null,
                precioUnitario: Number(precioUnitario),
            },
            { autoCommit: true }
        );

        res.status(201).json({
            message: "Medicamento creado correctamente",
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error creando medicamento");
    } finally {
        if (connection) await connection.close();
    }
});

router.put("/:id", async (req, res) => {
    let connection;

    const id = req.params.id;
    const { nombre, descripcion = null, precioUnitario = 0 } = req.body;

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
      UPDATE MEDICAMENTO
      SET
        nombre = :nombre,
        descripcion = :descripcion,
        precioUnitario = :precioUnitario
      WHERE idMedicamento = :id
      `,
            {
                id,
                nombre: nombre.trim(),
                descripcion: descripcion?.trim() || null,
                precioUnitario: Number(precioUnitario),
            },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                message: "Medicamento no encontrado",
            });
        }

        res.json({
            message: "Medicamento actualizado correctamente",
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error actualizando medicamento");
    } finally {
        if (connection) await connection.close();
    }
});

router.delete("/:id", async (req, res) => {
    let connection;

    const id = req.params.id;

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
      DELETE FROM MEDICAMENTO
      WHERE idMedicamento = :id
      `,
            { id },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                message: "Medicamento no encontrado",
            });
        }

        res.json({
            message: "Medicamento eliminado correctamente",
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error eliminando medicamento");
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;