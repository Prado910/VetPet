const express = require("express");
const router = express.Router();
const { getConnection } = require("../db");

const tiposServicioValidos = [
    "CONSULTA",
    "PROCEDIMIENTO",
    "TERAPIA",
    "VACUNACION",
    "PLAN_VACUNACION",
    "OTRO",
];

const activosValidos = ["S", "N"];

function validarServicio(
    { id, nombre, tipoServicio, precio, activo },
    esCreacion = true
) {
    if (esCreacion && !id?.trim()) {
        return "El ID del servicio es obligatorio.";
    }

    if (!nombre?.trim()) {
        return "El nombre del servicio es obligatorio.";
    }

    if (!tiposServicioValidos.includes(tipoServicio)) {
        return "Tipo de servicio inválido. Usa CONSULTA, PROCEDIMIENTO, TERAPIA, VACUNACION, PLAN_VACUNACION u OTRO.";
    }

    if (precio === null || precio === undefined || precio === "") {
        return "El precio del servicio es obligatorio.";
    }

    if (Number(precio) < 0) {
        return "El precio del servicio no puede ser negativo.";
    }

    if (!activosValidos.includes(activo)) {
        return "Estado activo inválido. Usa S o N.";
    }

    return null;
}

function manejarErrorOracle(error, res, mensajeBase) {
    console.error(mensajeBase, error);

    if (error.errorNum === 1) {
        return res.status(409).json({
            message: "Ya existe un servicio con ese ID.",
            error: error.message,
        });
    }

    if (error.errorNum === 2292) {
        return res.status(409).json({
            message:
                "No se puede eliminar porque el servicio tiene consultas, tratamientos o facturas relacionadas.",
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

    const soloActivos =
        req.query.activos === "true" ||
        req.query.activos === "S" ||
        req.query.activo === "S";

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
      SELECT
        TRIM(idServicio) AS "id",
        nombre AS "nombre",
        tipoServicio AS "tipoServicio",
        precio AS "precio",
        descripcion AS "descripcion",
        activo AS "activo"
      FROM CATALOGO_SERVICIOS
      WHERE (:soloActivos = 0 OR activo = 'S')
      ORDER BY nombre
      `,
            {
                soloActivos: soloActivos ? 1 : 0,
            }
        );

        res.json(result.rows);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando servicios");
    } finally {
        if (connection) await connection.close();
    }
});

router.post("/", async (req, res) => {
    let connection;

    const {
        id,
        nombre,
        tipoServicio,
        precio,
        descripcion = null,
        activo = "S",
    } = req.body;

    const errorValidacion = validarServicio(
        { id, nombre, tipoServicio, precio, activo },
        true
    );

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        await connection.execute(
            `
      INSERT INTO CATALOGO_SERVICIOS (
        idServicio,
        nombre,
        tipoServicio,
        precio,
        descripcion,
        activo
      ) VALUES (
        :id,
        :nombre,
        :tipoServicio,
        :precio,
        :descripcion,
        :activo
      )
      `,
            {
                id: id.trim(),
                nombre: nombre.trim(),
                tipoServicio,
                precio: Number(precio),
                descripcion: descripcion?.trim() || null,
                activo,
            },
            { autoCommit: true }
        );

        res.status(201).json({
            message: "Servicio creado correctamente",
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error creando servicio");
    } finally {
        if (connection) await connection.close();
    }
});

router.put("/:id", async (req, res) => {
    let connection;

    const id = req.params.id;

    const {
        nombre,
        tipoServicio,
        precio,
        descripcion = null,
        activo = "S",
    } = req.body;

    const errorValidacion = validarServicio(
        { nombre, tipoServicio, precio, activo },
        false
    );

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
      UPDATE CATALOGO_SERVICIOS
      SET
        nombre = :nombre,
        tipoServicio = :tipoServicio,
        precio = :precio,
        descripcion = :descripcion,
        activo = :activo
      WHERE idServicio = :id
      `,
            {
                id,
                nombre: nombre.trim(),
                tipoServicio,
                precio: Number(precio),
                descripcion: descripcion?.trim() || null,
                activo,
            },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                message: "Servicio no encontrado",
            });
        }

        res.json({
            message: "Servicio actualizado correctamente",
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error actualizando servicio");
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
      DELETE FROM CATALOGO_SERVICIOS
      WHERE idServicio = :id
      `,
            { id },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                message: "Servicio no encontrado",
            });
        }

        res.json({
            message: "Servicio eliminado correctamente",
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error eliminando servicio");
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;