const express = require("express");
const router = express.Router();
const { getConnection } = require("../db");

function esFechaValida(fecha) {
    return /^\d{4}-\d{2}-\d{2}$/.test(fecha || "");
}

function normalizarTexto(valor) {
    return valor?.trim() || null;
}

function normalizarNumero(valor) {
    if (valor === null || valor === undefined || valor === "") {
        return null;
    }

    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : NaN;
}

function validarConsulta(
    {
        idCita,
        idServicio,
        temperatura,
        pesoConsulta,
        fechaAtencionReal,
    },
) {
    if (!idCita?.trim()) {
        return "La cita es obligatoria.";
    }

    if (!idServicio?.trim()) {
        return "El servicio es obligatorio.";
    }

    if (!fechaAtencionReal?.trim()) {
        return "La fecha de atención real es obligatoria.";
    }

    if (!esFechaValida(fechaAtencionReal)) {
        return "La fecha de atención real debe tener formato YYYY-MM-DD.";
    }

    const temperaturaNormalizada = normalizarNumero(temperatura);
    const pesoNormalizado = normalizarNumero(pesoConsulta);

    if (Number.isNaN(temperaturaNormalizada)) {
        return "La temperatura debe ser un número válido.";
    }

    if (Number.isNaN(pesoNormalizado)) {
        return "El peso en consulta debe ser un número válido.";
    }

    if (temperaturaNormalizada !== null && temperaturaNormalizada < 0) {
        return "La temperatura no puede ser negativa.";
    }

    if (pesoNormalizado !== null && pesoNormalizado < 0) {
        return "El peso en consulta no puede ser negativo.";
    }

    return null;
}

function manejarErrorOracle(error, res, mensajeBase) {
    console.error(mensajeBase, error);

    if (error.errorNum === 1) {
        return res.status(409).json({
            message: "Ya existe una consulta para esa cita o un registro con ese ID.",
            error: error.message,
        });
    }

    if (error.errorNum === 2291) {
        return res.status(400).json({
            message: "La cita o el servicio seleccionado no existe.",
            error: error.message,
        });
    }

    if (error.errorNum === 2292) {
        return res.status(409).json({
            message:
                "No se puede eliminar porque la consulta tiene diagnósticos, tratamientos, facturas u otros registros relacionados.",
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

async function generarIdConsulta(connection) {
    const result = await connection.execute(`
    SELECT
      'CON' ||
      LPAD(
        NVL(MAX(TO_NUMBER(REGEXP_SUBSTR(TRIM(idConsulta), '[0-9]+$'))), 0) + 1,
        6,
        '0'
      ) AS "id"
    FROM CONSULTA_VETERINARIA
    WHERE REGEXP_LIKE(TRIM(idConsulta), '^CON[0-9]+$')
  `);

    return result.rows[0].id;
}

/**
 * GET /api/consultas/catalogos
 * Devuelve citas sin consulta y servicios activos para selects.
 */
router.get("/catalogos", async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const [citasResult, serviciosResult] = await Promise.all([
            connection.execute(`
        SELECT
          TRIM(ci.idCita) AS "id",
          TO_CHAR(ci.fecha, 'YYYY-MM-DD') AS "fecha",
          TO_CHAR(EXTRACT(HOUR FROM ci.hora), 'FM00') || ':' ||
          TO_CHAR(EXTRACT(MINUTE FROM ci.hora), 'FM00') AS "hora",
          ci.motivoConsulta AS "motivo",
          ci.estadoCita AS "estado",
          TRIM(ma.codigoMascota) AS "mascotaId",
          ma.nombre AS "mascotaNombre",
          ma.especie AS "mascotaEspecie",
          TRIM(cl.idCliente) AS "clienteId",
          cl.nombreCompleto AS "clienteNombre",
          cl.telefono AS "clienteTelefono",
          TRIM(ev.idEmpleado) AS "veterinarioId",
          ev.nombreCompleto AS "veterinarioNombre"
        FROM CITA ci
        JOIN MASCOTA ma ON ma.codigoMascota = ci.codigoMascota
        JOIN CLIENTE cl ON cl.idCliente = ma.idCliente
        JOIN EMPLEADO ev ON ev.idEmpleado = ci.idVeterinario
        WHERE ci.estadoCita IN ('PROGRAMADA', 'CONFIRMADA', 'ATENDIDA')
          AND NOT EXISTS (
            SELECT 1
            FROM CONSULTA_VETERINARIA cv
            WHERE cv.idCita = ci.idCita
          )
        ORDER BY ci.fecha DESC, ci.hora DESC
      `),
            connection.execute(`
        SELECT
          TRIM(idServicio) AS "id",
          nombre AS "nombre",
          tipoServicio AS "tipoServicio",
          precio AS "precio",
          descripcion AS "descripcion",
          activo AS "activo"
        FROM CATALOGO_SERVICIOS
        WHERE activo = 'S'
        ORDER BY nombre
      `),
        ]);

        res.json({
            citasDisponibles: citasResult.rows,
            servicios: serviciosResult.rows,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando catálogos de consultas");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * GET /api/consultas
 */
router.get("/", async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(`
      SELECT
        TRIM(cv.idConsulta) AS "id",
        TRIM(cv.idCita) AS "idCita",
        TRIM(cv.idServicio) AS "idServicio",
        cv.temperatura AS "temperatura",
        cv.pesoConsulta AS "pesoConsulta",
        cv.observaciones AS "observaciones",
        cv.recomendaciones AS "recomendaciones",
        TO_CHAR(cv.fechaAtencionReal, 'YYYY-MM-DD') AS "fechaAtencionReal",

        TO_CHAR(ci.fecha, 'YYYY-MM-DD') AS "citaFecha",
        TO_CHAR(EXTRACT(HOUR FROM ci.hora), 'FM00') || ':' ||
        TO_CHAR(EXTRACT(MINUTE FROM ci.hora), 'FM00') AS "citaHora",
        ci.motivoConsulta AS "motivo",
        ci.estadoCita AS "citaEstado",

        TRIM(ma.codigoMascota) AS "mascotaId",
        ma.nombre AS "mascotaNombre",
        ma.especie AS "mascotaEspecie",

        TRIM(cl.idCliente) AS "clienteId",
        cl.nombreCompleto AS "clienteNombre",
        cl.telefono AS "clienteTelefono",

        TRIM(ev.idEmpleado) AS "veterinarioId",
        ev.nombreCompleto AS "veterinarioNombre",

        cs.nombre AS "servicioNombre",
        cs.tipoServicio AS "servicioTipo",
        cs.precio AS "servicioPrecio"
      FROM CONSULTA_VETERINARIA cv
      JOIN CITA ci ON ci.idCita = cv.idCita
      JOIN MASCOTA ma ON ma.codigoMascota = ci.codigoMascota
      JOIN CLIENTE cl ON cl.idCliente = ma.idCliente
      JOIN EMPLEADO ev ON ev.idEmpleado = ci.idVeterinario
      JOIN CATALOGO_SERVICIOS cs ON cs.idServicio = cv.idServicio
      ORDER BY cv.fechaAtencionReal DESC, ci.fecha DESC, ci.hora DESC
    `);

        res.json(result.rows);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando consultas veterinarias");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * POST /api/consultas
 */
router.post("/", async (req, res) => {
    let connection;

    const {
        id = null,
        idCita,
        idServicio,
        temperatura = null,
        pesoConsulta = null,
        observaciones = null,
        recomendaciones = null,
        fechaAtencionReal,
    } = req.body;

    const errorValidacion = validarConsulta({
        idCita,
        idServicio,
        temperatura,
        pesoConsulta,
        fechaAtencionReal,
    });

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        const idConsulta = normalizarTexto(id) || (await generarIdConsulta(connection));

        await connection.execute(
            `
      INSERT INTO CONSULTA_VETERINARIA (
        idConsulta,
        idCita,
        idServicio,
        temperatura,
        pesoConsulta,
        observaciones,
        recomendaciones,
        fechaAtencionReal
      ) VALUES (
        :idConsulta,
        :idCita,
        :idServicio,
        :temperatura,
        :pesoConsulta,
        :observaciones,
        :recomendaciones,
        TO_DATE(:fechaAtencionReal, 'YYYY-MM-DD')
      )
      `,
            {
                idConsulta,
                idCita: idCita.trim(),
                idServicio: idServicio.trim(),
                temperatura: normalizarNumero(temperatura),
                pesoConsulta: normalizarNumero(pesoConsulta),
                observaciones: normalizarTexto(observaciones),
                recomendaciones: normalizarTexto(recomendaciones),
                fechaAtencionReal,
            },
        );

        await connection.execute(
            `
      UPDATE CITA
      SET estadoCita = 'ATENDIDA'
      WHERE idCita = :idCita
      `,
            {
                idCita: idCita.trim(),
            },
        );

        await connection.commit();

        res.status(201).json({
            message: "Consulta veterinaria creada correctamente",
            id: idConsulta,
        });
    } catch (error) {
        if (connection) await connection.rollback();
        manejarErrorOracle(error, res, "Error creando consulta veterinaria");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * PUT /api/consultas/:id
 */
router.put("/:id", async (req, res) => {
    let connection;

    const id = req.params.id;

    const {
        idCita,
        idServicio,
        temperatura = null,
        pesoConsulta = null,
        observaciones = null,
        recomendaciones = null,
        fechaAtencionReal,
    } = req.body;

    const errorValidacion = validarConsulta({
        idCita,
        idServicio,
        temperatura,
        pesoConsulta,
        fechaAtencionReal,
    });

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
      UPDATE CONSULTA_VETERINARIA
      SET
        idCita = :idCita,
        idServicio = :idServicio,
        temperatura = :temperatura,
        pesoConsulta = :pesoConsulta,
        observaciones = :observaciones,
        recomendaciones = :recomendaciones,
        fechaAtencionReal = TO_DATE(:fechaAtencionReal, 'YYYY-MM-DD')
      WHERE idConsulta = :id
      `,
            {
                id,
                idCita: idCita.trim(),
                idServicio: idServicio.trim(),
                temperatura: normalizarNumero(temperatura),
                pesoConsulta: normalizarNumero(pesoConsulta),
                observaciones: normalizarTexto(observaciones),
                recomendaciones: normalizarTexto(recomendaciones),
                fechaAtencionReal,
            },
        );

        if (result.rowsAffected === 0) {
            await connection.rollback();
            return res.status(404).json({
                message: "Consulta veterinaria no encontrada",
            });
        }

        await connection.execute(
            `
      UPDATE CITA
      SET estadoCita = 'ATENDIDA'
      WHERE idCita = :idCita
      `,
            {
                idCita: idCita.trim(),
            },
        );

        await connection.commit();

        res.json({
            message: "Consulta veterinaria actualizada correctamente",
        });
    } catch (error) {
        if (connection) await connection.rollback();
        manejarErrorOracle(error, res, "Error actualizando consulta veterinaria");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * DELETE /api/consultas/:id
 */
router.delete("/:id", async (req, res) => {
    let connection;

    const id = req.params.id;

    try {
        connection = await getConnection();

        const consultaActual = await connection.execute(
            `
      SELECT TRIM(idCita) AS "idCita"
      FROM CONSULTA_VETERINARIA
      WHERE idConsulta = :id
      `,
            { id },
        );

        if (consultaActual.rows.length === 0) {
            return res.status(404).json({
                message: "Consulta veterinaria no encontrada",
            });
        }

        const idCita = consultaActual.rows[0].idCita;

        const result = await connection.execute(
            `
      DELETE FROM CONSULTA_VETERINARIA
      WHERE idConsulta = :id
      `,
            { id },
        );

        if (result.rowsAffected === 0) {
            await connection.rollback();
            return res.status(404).json({
                message: "Consulta veterinaria no encontrada",
            });
        }

        await connection.execute(
            `
      UPDATE CITA
      SET estadoCita = 'CONFIRMADA'
      WHERE idCita = :idCita
      `,
            { idCita },
        );

        await connection.commit();

        res.json({
            message: "Consulta veterinaria eliminada correctamente",
        });
    } catch (error) {
        if (connection) await connection.rollback();
        manejarErrorOracle(error, res, "Error eliminando consulta veterinaria");
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;