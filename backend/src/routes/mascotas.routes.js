const express = require("express");
const router = express.Router();
const { getConnection } = require("../db");

const sexosValidos = ["M", "H", null, ""];

function normalizarId(valor) {
    return String(valor || "").trim().toUpperCase();
}

function validarMascota({ id, clienteId, nombre, sexo, peso, especie }, esCreacion = true) {
    if (esCreacion && !id?.trim()) {
        return "El código de la mascota es obligatorio.";
    }

    if (!clienteId?.trim()) {
        return "El cliente es obligatorio.";
    }

    if (!nombre?.trim()) {
        return "El nombre de la mascota es obligatorio.";
    }

    if (!especie?.trim()) {
        return "La especie es obligatoria.";
    }

    if (!sexosValidos.includes(sexo)) {
        return "Sexo inválido. Usa M, H o vacío.";
    }

    if (peso !== null && peso !== undefined && peso !== "" && Number(peso) < 0) {
        return "El peso no puede ser negativo.";
    }

    return null;
}

function manejarErrorOracle(error, res, mensajeBase) {
    console.error(mensajeBase, error);

    if (error.errorNum === 1) {
        return res.status(409).json({
            message: "Ya existe una mascota con ese código.",
            error: error.message,
        });
    }

    if (error.errorNum === 2291) {
        return res.status(400).json({
            message: "El cliente seleccionado no existe.",
            error: error.message,
        });
    }

    if (error.errorNum === 2292) {
        return res.status(409).json({
            message: "No se puede eliminar porque la mascota tiene citas, consultas o registros relacionados.",
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
        TRIM(m.codigoMascota) AS "id",
        TRIM(m.idCliente) AS "clienteId",
        m.nombre AS "nombre",
        TO_CHAR(m.fechaNacimiento, 'YYYY-MM-DD') AS "fechaNacimiento",
        CASE
          WHEN m.fechaNacimiento IS NULL THEN NULL
          ELSE FLOOR(MONTHS_BETWEEN(SYSDATE, m.fechaNacimiento) / 12)
        END AS "edad",
        m.sexo AS "sexo",
        m.peso AS "peso",
        m.especie AS "especie",
        m.raza AS "raza",
        c.nombreCompleto AS "clienteNombre",
        es.estadoSalud AS "estadoSalud"
      FROM MASCOTA m
      JOIN CLIENTE c ON c.idCliente = m.idCliente
      LEFT JOIN (
        SELECT
          codigoMascota,
          estadoSalud,
          ROW_NUMBER() OVER (
            PARTITION BY codigoMascota
            ORDER BY fechaRegistro DESC, idEstadoSalud DESC
          ) AS rn
        FROM ESTADO_SALUD_MASCOTA
      ) es ON es.codigoMascota = m.codigoMascota AND es.rn = 1
      ORDER BY m.nombre
    `);

        res.json(result.rows);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando mascotas");
    } finally {
        if (connection) await connection.close();
    }
});

router.post("/", async (req, res) => {
    let connection;

    const {
        id,
        clienteId,
        nombre,
        fechaNacimiento = null,
        sexo = null,
        peso = null,
        especie,
        raza = null,
    } = req.body;

    const errorValidacion = validarMascota(
        { id, clienteId, nombre, sexo, peso, especie },
        true
    );

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        await connection.execute(
            `
      INSERT INTO MASCOTA (
        codigoMascota,
        idCliente,
        nombre,
        fechaNacimiento,
        sexo,
        peso,
        especie,
        raza
      ) VALUES (
        :id,
        :clienteId,
        :nombre,
        TO_DATE(:fechaNacimiento, 'YYYY-MM-DD'),
        :sexo,
        :peso,
        :especie,
        :raza
      )
      `,
            {
                id: id.trim(),
                clienteId: clienteId.trim(),
                nombre: nombre.trim(),
                fechaNacimiento,
                sexo: sexo || null,
                peso: peso === "" ? null : peso,
                especie: especie.trim(),
                raza,
            },
            { autoCommit: true }
        );

        res.status(201).json({
            message: "Mascota creada correctamente",
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error creando mascota");
    } finally {
        if (connection) await connection.close();
    }
});

router.put("/:id", async (req, res) => {
    let connection;

    const id = normalizarId(req.params.id);

    const {
        clienteId,
        nombre,
        fechaNacimiento = null,
        sexo = null,
        peso = null,
        especie,
        raza = null,
    } = req.body;

    const errorValidacion = validarMascota(
        { clienteId, nombre, sexo, peso, especie },
        false
    );

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
      UPDATE MASCOTA
      SET
        idCliente = :clienteId,
        nombre = :nombre,
        fechaNacimiento = TO_DATE(:fechaNacimiento, 'YYYY-MM-DD'),
        sexo = :sexo,
        peso = :peso,
        especie = :especie,
        raza = :raza
      WHERE TRIM(UPPER(codigoMascota)) = :id
      `,
            {
                id,
                clienteId: clienteId.trim(),
                nombre: nombre.trim(),
                fechaNacimiento,
                sexo: sexo || null,
                peso: peso === "" ? null : peso,
                especie: especie.trim(),
                raza,
            },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                message: "Mascota no encontrada",
            });
        }

        res.json({
            message: "Mascota actualizada correctamente",
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error actualizando mascota");
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
            DELETE FROM MASCOTA
            WHERE TRIM(UPPER(codigoMascota)) = :id
            `,
            { id },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                message: "Mascota no encontrada",
            });
        }

        res.json({
            message: "Mascota eliminada correctamente",
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error eliminando mascota");
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;