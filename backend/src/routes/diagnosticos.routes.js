const express = require("express");
const router = express.Router();
const { getConnection } = require("../db");

const estadosDiagnosticoValidos = ["PRESUNTIVO", "CONFIRMADO", "DESCARTADO"];

function normalizarTexto(valor) {
    return valor?.trim() || null;
}

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

async function generarIdDiagnostico(connection) {
    const result = await connection.execute(`
    SELECT
      'DIA' ||
      LPAD(
        NVL(MAX(TO_NUMBER(REGEXP_SUBSTR(TRIM(idDiagnostico), '[0-9]+$'))), 0) + 1,
        6,
        '0'
      ) AS "id"
    FROM DIAGNOSTICO
    WHERE REGEXP_LIKE(TRIM(idDiagnostico), '^DIA[0-9]+$')
  `);

    return result.rows[0].id;
}

router.get("/catalogos", async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const consultasResult = await connection.execute(`
      SELECT
        TRIM(cv.idConsulta) AS "id",
        TRIM(cv.idCita) AS "idCita",
        TO_CHAR(cv.fechaAtencionReal, 'YYYY-MM-DD') AS "fechaAtencionReal",
        cv.observaciones AS "observaciones",
        cv.recomendaciones AS "recomendaciones",
        ma.nombre AS "mascotaNombre",
        ma.especie AS "mascotaEspecie",
        cl.nombreCompleto AS "clienteNombre",
        ev.nombreCompleto AS "veterinarioNombre",
        cs.nombre AS "servicioNombre"
      FROM CONSULTA_VETERINARIA cv
      JOIN CITA ci ON ci.idCita = cv.idCita
      JOIN MASCOTA ma ON ma.codigoMascota = ci.codigoMascota
      JOIN CLIENTE cl ON cl.idCliente = ma.idCliente
      JOIN EMPLEADO ev ON ev.idEmpleado = ci.idVeterinario
      JOIN CATALOGO_SERVICIOS cs ON cs.idServicio = cv.idServicio
      ORDER BY cv.fechaAtencionReal DESC
    `);

        res.json({
            consultas: consultasResult.rows,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando catálogos de diagnósticos");
    } finally {
        if (connection) await connection.close();
    }
});

router.get("/", async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(`
      SELECT
        TRIM(d.idDiagnostico) AS "id",
        TRIM(d.idConsulta) AS "idConsulta",
        d.descripcionCondicion AS "descripcionCondicion",
        d.nivelGravedad AS "nivelGravedad",
        d.tipoAfeccion AS "tipoAfeccion",
        d.estado AS "estado",

        TO_CHAR(cv.fechaAtencionReal, 'YYYY-MM-DD') AS "fechaAtencionReal",
        TRIM(ci.idCita) AS "idCita",
        ci.motivoConsulta AS "motivoConsulta",

        TRIM(ma.codigoMascota) AS "mascotaId",
        ma.nombre AS "mascotaNombre",
        ma.especie AS "mascotaEspecie",

        TRIM(cl.idCliente) AS "clienteId",
        cl.nombreCompleto AS "clienteNombre",

        TRIM(ev.idEmpleado) AS "veterinarioId",
        ev.nombreCompleto AS "veterinarioNombre",

        cs.nombre AS "servicioNombre",

        (
          SELECT COUNT(*)
          FROM TRATAMIENTO t
          WHERE t.idDiagnostico = d.idDiagnostico
        ) AS "tratamientosCount"
      FROM DIAGNOSTICO d
      JOIN CONSULTA_VETERINARIA cv ON cv.idConsulta = d.idConsulta
      JOIN CITA ci ON ci.idCita = cv.idCita
      JOIN MASCOTA ma ON ma.codigoMascota = ci.codigoMascota
      JOIN CLIENTE cl ON cl.idCliente = ma.idCliente
      JOIN EMPLEADO ev ON ev.idEmpleado = ci.idVeterinario
      JOIN CATALOGO_SERVICIOS cs ON cs.idServicio = cv.idServicio
      ORDER BY cv.fechaAtencionReal DESC, d.idDiagnostico DESC
    `);

        res.json(result.rows);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando diagnósticos");
    } finally {
        if (connection) await connection.close();
    }
});

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

        const idDiagnostico =
            normalizarTexto(id) || (await generarIdDiagnostico(connection));

        await connection.execute(
            `
      INSERT INTO DIAGNOSTICO (
        idDiagnostico,
        idConsulta,
        descripcionCondicion,
        nivelGravedad,
        tipoAfeccion,
        estado
      ) VALUES (
        :idDiagnostico,
        :idConsulta,
        :descripcionCondicion,
        :nivelGravedad,
        :tipoAfeccion,
        :estado
      )
      `,
            {
                idDiagnostico,
                idConsulta: idConsulta.trim(),
                descripcionCondicion: descripcionCondicion.trim(),
                nivelGravedad: normalizarTexto(nivelGravedad),
                tipoAfeccion: normalizarTexto(tipoAfeccion),
                estado,
            },
            { autoCommit: true }
        );

        res.status(201).json({
            message: "Diagnóstico creado correctamente",
            id: idDiagnostico,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error creando diagnóstico");
    } finally {
        if (connection) await connection.close();
    }
});

router.put("/:id", async (req, res) => {
    let connection;

    const id = req.params.id;

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
      UPDATE DIAGNOSTICO
      SET
        idConsulta = :idConsulta,
        descripcionCondicion = :descripcionCondicion,
        nivelGravedad = :nivelGravedad,
        tipoAfeccion = :tipoAfeccion,
        estado = :estado
      WHERE idDiagnostico = :id
      `,
            {
                id,
                idConsulta: idConsulta.trim(),
                descripcionCondicion: descripcionCondicion.trim(),
                nivelGravedad: normalizarTexto(nivelGravedad),
                tipoAfeccion: normalizarTexto(tipoAfeccion),
                estado,
            },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                message: "Diagnóstico no encontrado",
            });
        }

        res.json({
            message: "Diagnóstico actualizado correctamente",
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error actualizando diagnóstico");
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
      DELETE FROM DIAGNOSTICO
      WHERE idDiagnostico = :id
      `,
            { id },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                message: "Diagnóstico no encontrado",
            });
        }

        res.json({
            message: "Diagnóstico eliminado correctamente",
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error eliminando diagnóstico");
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;