const express = require("express");
const router = express.Router();
const { getConnection } = require("../db");

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
        console.error("Error GET /clientes:", error);
        res.status(500).json({
            message: "Error consultando clientes",
            error: error.message,
        });
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

router.post("/", async (req, res) => {
    let connection;

    const { id, nombre, direccion, email, telefono, estado } = req.body;

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
                id,
                nombre,
                direccion,
                email,
                telefono,
                estado: estado || "ACTIVO",
            },
            { autoCommit: true }
        );

        res.status(201).json({
            message: "Cliente creado correctamente",
        });
    } catch (error) {
        console.error("Error POST /clientes:", error);
        res.status(500).json({
            message: "Error creando cliente",
            error: error.message,
        });
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

module.exports = router;