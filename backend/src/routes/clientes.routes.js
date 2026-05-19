const express = require("express");
const router = express.Router();
const { getConnection } = require("../db");

const estadosValidos = ["ACTIVO", "INACTIVO", "SUSPENDIDO"];

function validarCliente({ id, nombre, estado }, esCreacion = true) {
    if (esCreacion && !id?.trim()) {
        return "El ID del cliente es obligatorio.";
    }

    if (!nombre?.trim()) {
        return "El nombre del cliente es obligatorio.";
    }

    if (estado && !estadosValidos.includes(estado)) {
        return "Estado inválido. Usa ACTIVO, INACTIVO o SUSPENDIDO.";
    }

    return null;
}

function manejarErrorOracle(error, res, mensajeBase) {
    console.error(mensajeBase, error);

    if (error.errorNum === 1) {
        return res.status(409).json({
            message: "Ya existe un registro con ese ID.",
            error: error.message,
        });
    }

    if (error.errorNum === 2292) {
        return res.status(409).json({
            message: "No se puede eliminar porque el registro tiene información relacionada.",
            error: error.message,
        });
    }

    if (error.errorNum === 2290) {
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
        TRIM(idCliente) AS "id",
        nombreCompleto AS "nombre",
        direccion AS "direccion",
        correoElectronico AS "email",
        telefono AS "telefono",
        estado AS "estado"
      FROM CLIENTE
      ORDER BY nombreCompleto
    `);

        res.json(result.rows);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando clientes");
    } finally {
        if (connection) await connection.close();
    }
});

router.post("/", async (req, res) => {
    let connection;

    const {
        id,
        nombre,
        direccion = null,
        email = null,
        telefono = null,
        estado = "ACTIVO",
    } = req.body;

    const errorValidacion = validarCliente({ id, nombre, estado }, true);

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        await connection.execute(
            `
      INSERT INTO CLIENTE (
        idCliente,
        nombreCompleto,
        direccion,
        correoElectronico,
        telefono,
        estado
      ) VALUES (
        :id,
        :nombre,
        :direccion,
        :email,
        :telefono,
        :estado
      )
      `,
            {
                id: id.trim(),
                nombre: nombre.trim(),
                direccion,
                email,
                telefono,
                estado,
            },
            { autoCommit: true }
        );

        res.status(201).json({
            message: "Cliente creado correctamente",
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error creando cliente");
    } finally {
        if (connection) await connection.close();
    }
});

router.put("/:id", async (req, res) => {
    let connection;

    const id = req.params.id;
    const {
        nombre,
        direccion = null,
        email = null,
        telefono = null,
        estado = "ACTIVO",
    } = req.body;

    const errorValidacion = validarCliente({ nombre, estado }, false);

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
      UPDATE CLIENTE
      SET
        nombreCompleto = :nombre,
        direccion = :direccion,
        correoElectronico = :email,
        telefono = :telefono,
        estado = :estado
      WHERE idCliente = :id
      `,
            {
                id,
                nombre: nombre.trim(),
                direccion,
                email,
                telefono,
                estado,
            },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                message: "Cliente no encontrado",
            });
        }

        res.json({
            message: "Cliente actualizado correctamente",
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error actualizando cliente");
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
      DELETE FROM CLIENTE
      WHERE idCliente = :id
      `,
            { id },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                message: "Cliente no encontrado",
            });
        }

        res.json({
            message: "Cliente eliminado correctamente",
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error eliminando cliente");
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;