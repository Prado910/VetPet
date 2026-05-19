const express = require("express");
const router = express.Router();
const { getConnection } = require("../db");

function esFechaValida(fecha) {
    return /^\d{4}-\d{2}-\d{2}$/.test(fecha || "");
}

function normalizarTexto(valor) {
    return valor?.trim() || null;
}

function validarVacuna(
    { id, nombre, fechaVencimiento, precio },
    esCreacion = true
) {
    if (esCreacion && !id?.trim()) {
        return "El ID de la vacuna es obligatorio.";
    }

    if (!nombre?.trim()) {
        return "El nombre de la vacuna es obligatorio.";
    }

    if (fechaVencimiento && !esFechaValida(fechaVencimiento)) {
        return "La fecha de vencimiento debe tener formato YYYY-MM-DD.";
    }

    if (precio === null || precio === undefined || precio === "") {
        return "El precio de la vacuna es obligatorio.";
    }

    if (Number(precio) < 0) {
        return "El precio de la vacuna no puede ser negativo.";
    }

    return null;
}

function validarAplicacionVacuna({
    codigoMascota,
    idVacuna,
    fechaAplicacion,
}) {
    if (!codigoMascota?.trim()) {
        return "La mascota es obligatoria.";
    }

    if (!idVacuna?.trim()) {
        return "La vacuna es obligatoria.";
    }

    if (!fechaAplicacion?.trim()) {
        return "La fecha de aplicación es obligatoria.";
    }

    if (!esFechaValida(fechaAplicacion)) {
        return "La fecha de aplicación debe tener formato YYYY-MM-DD.";
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

    if (error.errorNum === 2291) {
        return res.status(400).json({
            message: "La mascota o vacuna seleccionada no existe.",
            error: error.message,
        });
    }

    if (error.errorNum === 2292) {
        return res.status(409).json({
            message:
                "No se puede eliminar porque el registro tiene información relacionada.",
            error: error.message,
        });
    }

    if (error.errorNum === 2290 || error.errorNum === 1400) {
        return res.status(400).json({
            message: "Los datos no cumplen una restricción de la base de datos.",
            error: error.message,
        });
    }

    if (error.errorNum === 20004) {
        return res.status(400).json({
            message:
                "La vacuna no corresponde a la especie de la mascota seleccionada.",
            error: error.message,
        });
    }

    return res.status(500).json({
        message: mensajeBase,
        error: error.message,
    });
}

/**
 * GET /api/vacunas/catalogos
 * Devuelve mascotas y vacunas para selects.
 */
router.get("/catalogos", async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const [mascotasResult, vacunasResult] = await Promise.all([
            connection.execute(`
        SELECT
          TRIM(m.codigoMascota) AS "id",
          m.nombre AS "nombre",
          m.especie AS "especie",
          TRIM(c.idCliente) AS "clienteId",
          c.nombreCompleto AS "clienteNombre"
        FROM MASCOTA m
        JOIN CLIENTE c ON c.idCliente = m.idCliente
        ORDER BY m.nombre
      `),
            connection.execute(`
        SELECT
          TRIM(idVacuna) AS "id",
          nombre AS "nombre",
          laboratorio AS "laboratorio",
          lote AS "lote",
          TO_CHAR(fechaVencimiento, 'YYYY-MM-DD') AS "fechaVencimiento",
          especieObjetivo AS "especieObjetivo",
          precio AS "precio"
        FROM VACUNA
        ORDER BY nombre
      `),
        ]);

        res.json({
            mascotas: mascotasResult.rows,
            vacunas: vacunasResult.rows,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando catálogos de vacunas");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * GET /api/vacunas
 */
router.get("/", async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(`
      SELECT
        TRIM(idVacuna) AS "id",
        nombre AS "nombre",
        laboratorio AS "laboratorio",
        lote AS "lote",
        TO_CHAR(fechaVencimiento, 'YYYY-MM-DD') AS "fechaVencimiento",
        especieObjetivo AS "especieObjetivo",
        precio AS "precio"
      FROM VACUNA
      ORDER BY nombre
    `);

        res.json(result.rows);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando vacunas");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * POST /api/vacunas
 */
router.post("/", async (req, res) => {
    let connection;

    const {
        id,
        nombre,
        laboratorio = null,
        lote = null,
        fechaVencimiento = null,
        especieObjetivo = null,
        precio = 0,
    } = req.body;

    const errorValidacion = validarVacuna(
        { id, nombre, fechaVencimiento, precio },
        true
    );

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        await connection.execute(
            `
      INSERT INTO VACUNA (
        idVacuna,
        nombre,
        laboratorio,
        lote,
        fechaVencimiento,
        especieObjetivo,
        precio
      ) VALUES (
        :id,
        :nombre,
        :laboratorio,
        :lote,
        CASE
          WHEN :fechaVencimiento IS NULL THEN NULL
          ELSE TO_DATE(:fechaVencimiento, 'YYYY-MM-DD')
        END,
        :especieObjetivo,
        :precio
      )
      `,
            {
                id: id.trim(),
                nombre: nombre.trim(),
                laboratorio: normalizarTexto(laboratorio),
                lote: normalizarTexto(lote),
                fechaVencimiento: normalizarTexto(fechaVencimiento),
                especieObjetivo: normalizarTexto(especieObjetivo)?.toUpperCase() || null,
                precio: Number(precio),
            },
            { autoCommit: true }
        );

        res.status(201).json({
            message: "Vacuna creada correctamente",
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error creando vacuna");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * PUT /api/vacunas/:id
 */
router.put("/:id", async (req, res) => {
    let connection;

    const id = req.params.id;

    const {
        nombre,
        laboratorio = null,
        lote = null,
        fechaVencimiento = null,
        especieObjetivo = null,
        precio = 0,
    } = req.body;

    const errorValidacion = validarVacuna(
        { nombre, fechaVencimiento, precio },
        false
    );

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
      UPDATE VACUNA
      SET
        nombre = :nombre,
        laboratorio = :laboratorio,
        lote = :lote,
        fechaVencimiento = CASE
          WHEN :fechaVencimiento IS NULL THEN NULL
          ELSE TO_DATE(:fechaVencimiento, 'YYYY-MM-DD')
        END,
        especieObjetivo = :especieObjetivo,
        precio = :precio
      WHERE idVacuna = :id
      `,
            {
                id,
                nombre: nombre.trim(),
                laboratorio: normalizarTexto(laboratorio),
                lote: normalizarTexto(lote),
                fechaVencimiento: normalizarTexto(fechaVencimiento),
                especieObjetivo: normalizarTexto(especieObjetivo)?.toUpperCase() || null,
                precio: Number(precio),
            },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                message: "Vacuna no encontrada",
            });
        }

        res.json({
            message: "Vacuna actualizada correctamente",
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error actualizando vacuna");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * DELETE /api/vacunas/:id
 */
router.delete("/:id", async (req, res) => {
    let connection;

    const id = req.params.id;

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
      DELETE FROM VACUNA
      WHERE idVacuna = :id
      `,
            { id },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                message: "Vacuna no encontrada",
            });
        }

        res.json({
            message: "Vacuna eliminada correctamente",
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error eliminando vacuna");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * GET /api/vacunas/aplicaciones
 */
router.get("/aplicaciones", async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(`
      SELECT
        TRIM(av.codigoMascota) AS "codigoMascota",
        TRIM(av.idVacuna) AS "idVacuna",
        TO_CHAR(av.fechaAplicacion, 'YYYY-MM-DD') AS "fechaAplicacion",
        av.observacion AS "observacion",
        m.nombre AS "mascotaNombre",
        m.especie AS "mascotaEspecie",
        TRIM(c.idCliente) AS "clienteId",
        c.nombreCompleto AS "clienteNombre",
        v.nombre AS "vacunaNombre",
        v.laboratorio AS "laboratorio",
        v.lote AS "lote",
        v.especieObjetivo AS "especieObjetivo",
        v.precio AS "precio"
      FROM APLICACION_VACUNA av
      JOIN MASCOTA m ON m.codigoMascota = av.codigoMascota
      JOIN CLIENTE c ON c.idCliente = m.idCliente
      JOIN VACUNA v ON v.idVacuna = av.idVacuna
      ORDER BY av.fechaAplicacion DESC, m.nombre, v.nombre
    `);

        const rows = result.rows.map((row) => ({
            ...row,
            id: `${row.codigoMascota}|${row.idVacuna}|${row.fechaAplicacion}`,
        }));

        res.json(rows);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando aplicaciones de vacunas");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * POST /api/vacunas/aplicaciones
 */
router.post("/aplicaciones", async (req, res) => {
    let connection;

    const {
        codigoMascota,
        idVacuna,
        fechaAplicacion,
        observacion = null,
    } = req.body;

    const errorValidacion = validarAplicacionVacuna({
        codigoMascota,
        idVacuna,
        fechaAplicacion,
    });

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        await connection.execute(
            `
      INSERT INTO APLICACION_VACUNA (
        codigoMascota,
        idVacuna,
        fechaAplicacion,
        observacion
      ) VALUES (
        :codigoMascota,
        :idVacuna,
        TO_DATE(:fechaAplicacion, 'YYYY-MM-DD'),
        :observacion
      )
      `,
            {
                codigoMascota: codigoMascota.trim(),
                idVacuna: idVacuna.trim(),
                fechaAplicacion,
                observacion: normalizarTexto(observacion),
            },
            { autoCommit: true }
        );

        res.status(201).json({
            message: "Aplicación de vacuna registrada correctamente",
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error registrando aplicación de vacuna");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * PUT /api/vacunas/aplicaciones
 *
 * Nota:
 * La clave compuesta no se edita. Este endpoint actualiza la observación.
 */
router.put("/aplicaciones", async (req, res) => {
    let connection;

    const {
        codigoMascota,
        idVacuna,
        fechaAplicacion,
        observacion = null,
    } = req.body;

    const errorValidacion = validarAplicacionVacuna({
        codigoMascota,
        idVacuna,
        fechaAplicacion,
    });

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
      UPDATE APLICACION_VACUNA
      SET observacion = :observacion
      WHERE codigoMascota = :codigoMascota
        AND idVacuna = :idVacuna
        AND TRUNC(fechaAplicacion) = TO_DATE(:fechaAplicacion, 'YYYY-MM-DD')
      `,
            {
                codigoMascota: codigoMascota.trim(),
                idVacuna: idVacuna.trim(),
                fechaAplicacion,
                observacion: normalizarTexto(observacion),
            },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                message: "Aplicación de vacuna no encontrada",
            });
        }

        res.json({
            message: "Aplicación de vacuna actualizada correctamente",
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error actualizando aplicación de vacuna");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * DELETE /api/vacunas/aplicaciones?codigoMascota=&idVacuna=&fechaAplicacion=
 */
router.delete("/aplicaciones", async (req, res) => {
    let connection;

    const codigoMascota = req.query.codigoMascota || req.body.codigoMascota;
    const idVacuna = req.query.idVacuna || req.body.idVacuna;
    const fechaAplicacion =
        req.query.fechaAplicacion || req.body.fechaAplicacion;

    const errorValidacion = validarAplicacionVacuna({
        codigoMascota,
        idVacuna,
        fechaAplicacion,
    });

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
      DELETE FROM APLICACION_VACUNA
      WHERE codigoMascota = :codigoMascota
        AND idVacuna = :idVacuna
        AND TRUNC(fechaAplicacion) = TO_DATE(:fechaAplicacion, 'YYYY-MM-DD')
      `,
            {
                codigoMascota: String(codigoMascota).trim(),
                idVacuna: String(idVacuna).trim(),
                fechaAplicacion: String(fechaAplicacion),
            },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                message: "Aplicación de vacuna no encontrada",
            });
        }

        res.json({
            message: "Aplicación de vacuna eliminada correctamente",
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error eliminando aplicación de vacuna");
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;