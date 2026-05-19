const express = require("express");
const router = express.Router();
const { getConnection } = require("../db");

function manejarErrorOracle(error, res, mensajeBase) {
    console.error(mensajeBase, error);

    return res.status(500).json({
        message: mensajeBase,
        error: error.message,
    });
}

/**
 * GET /api/dashboard/resumen
 */
router.get("/resumen", async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(`
      SELECT
        (SELECT COUNT(*) FROM CLIENTE) AS "totalClientes",
        (SELECT COUNT(*) FROM CLIENTE WHERE estado = 'ACTIVO') AS "clientesActivos",
        (SELECT COUNT(*) FROM MASCOTA) AS "totalMascotas",
        (SELECT COUNT(*) FROM EMPLEADO WHERE estadoLaboral = 'ACTIVO') AS "empleadosActivos",

        (
          SELECT COUNT(*)
          FROM CITA
          WHERE TRUNC(fecha) = TRUNC(SYSDATE)
        ) AS "citasHoy",

        (
          SELECT COUNT(*)
          FROM CITA
          WHERE estadoCita IN ('PROGRAMADA', 'CONFIRMADA')
            AND fecha >= TRUNC(SYSDATE)
        ) AS "citasPendientes",

        (
          SELECT COUNT(*)
          FROM CONSULTA_VETERINARIA
          WHERE fechaAtencionReal >= TRUNC(SYSDATE, 'MM')
            AND fechaAtencionReal < ADD_MONTHS(TRUNC(SYSDATE, 'MM'), 1)
        ) AS "consultasMes",

        (
          SELECT COUNT(*)
          FROM TRATAMIENTO
          WHERE estado = 'ACTIVO'
        ) AS "tratamientosActivos",

        (
          SELECT COUNT(*)
          FROM FACTURA
          WHERE estadoPago = 'PENDIENTE'
        ) AS "facturasPendientes",

        (
          SELECT NVL(SUM(valorTotal), 0)
          FROM FACTURA
          WHERE estadoPago = 'PAGADA'
            AND TRUNC(fecha) = TRUNC(SYSDATE)
        ) AS "ingresosHoy",

        (
          SELECT NVL(SUM(valorTotal), 0)
          FROM FACTURA
          WHERE estadoPago = 'PAGADA'
            AND fecha >= TRUNC(SYSDATE, 'MM')
            AND fecha < ADD_MONTHS(TRUNC(SYSDATE, 'MM'), 1)
        ) AS "ingresosMes",

        (
          SELECT NVL(SUM(valorTotal), 0)
          FROM FACTURA
          WHERE estadoPago = 'PAGADA'
        ) AS "ingresosTotal",

        (
          SELECT COUNT(*)
          FROM APLICACION_VACUNA
          WHERE fechaAplicacion >= TRUNC(SYSDATE, 'MM')
            AND fechaAplicacion < ADD_MONTHS(TRUNC(SYSDATE, 'MM'), 1)
        ) AS "vacunasMes"
      FROM dual
    `);

        res.json(result.rows[0]);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando resumen del dashboard");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * GET /api/dashboard/citas-hoy
 */
router.get("/citas-hoy", async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(`
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
      WHERE TRUNC(ci.fecha) = TRUNC(SYSDATE)
      ORDER BY ci.hora
    `);

        res.json(result.rows);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando citas de hoy");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * GET /api/dashboard/actividad-reciente?limite=10
 */
router.get("/actividad-reciente", async (req, res) => {
    let connection;

    const limite = Math.min(
        Math.max(Number(req.query.limite || 10), 1),
        30
    );

    try {
        connection = await getConnection();

        const result = await connection.execute(`
      SELECT
        tipo AS "tipo",
        id AS "id",
        titulo AS "titulo",
        descripcion AS "descripcion",
        fecha AS "fecha",
        hora AS "hora",
        estado AS "estado"
      FROM (
        SELECT
          'CITA' AS tipo,
          TRIM(ci.idCita) AS id,
          'Cita ' || ci.estadoCita AS titulo,
          ma.nombre || ' · ' || cl.nombreCompleto AS descripcion,
          TO_CHAR(ci.fecha, 'YYYY-MM-DD') AS fecha,
          TO_CHAR(EXTRACT(HOUR FROM ci.hora), 'FM00') || ':' ||
          TO_CHAR(EXTRACT(MINUTE FROM ci.hora), 'FM00') AS hora,
          ci.estadoCita AS estado,
          CAST(ci.fecha AS TIMESTAMP) AS fechaOrden
        FROM CITA ci
        JOIN MASCOTA ma ON ma.codigoMascota = ci.codigoMascota
        JOIN CLIENTE cl ON cl.idCliente = ma.idCliente

        UNION ALL

        SELECT
          'CONSULTA' AS tipo,
          TRIM(cv.idConsulta) AS id,
          'Consulta veterinaria' AS titulo,
          ma.nombre || ' · ' || cl.nombreCompleto AS descripcion,
          TO_CHAR(cv.fechaAtencionReal, 'YYYY-MM-DD') AS fecha,
          NULL AS hora,
          'ATENDIDA' AS estado,
          CAST(cv.fechaAtencionReal AS TIMESTAMP) AS fechaOrden
        FROM CONSULTA_VETERINARIA cv
        JOIN CITA ci ON ci.idCita = cv.idCita
        JOIN MASCOTA ma ON ma.codigoMascota = ci.codigoMascota
        JOIN CLIENTE cl ON cl.idCliente = ma.idCliente

        UNION ALL

        SELECT
          'FACTURA' AS tipo,
          TRIM(f.idFactura) AS id,
          'Factura ' || f.estadoPago AS titulo,
          cl.nombreCompleto || ' · $' || TO_CHAR(f.valorTotal, 'FM999G999G999G990D00') AS descripcion,
          TO_CHAR(f.fecha, 'YYYY-MM-DD') AS fecha,
          NULL AS hora,
          f.estadoPago AS estado,
          CAST(f.fecha AS TIMESTAMP) AS fechaOrden
        FROM FACTURA f
        JOIN CLIENTE cl ON cl.idCliente = f.idCliente

        UNION ALL

        SELECT
          'VACUNA' AS tipo,
          TRIM(av.idVacuna) AS id,
          'Vacuna aplicada' AS titulo,
          ma.nombre || ' · ' || v.nombre AS descripcion,
          TO_CHAR(av.fechaAplicacion, 'YYYY-MM-DD') AS fecha,
          NULL AS hora,
          'APLICADA' AS estado,
          CAST(av.fechaAplicacion AS TIMESTAMP) AS fechaOrden
        FROM APLICACION_VACUNA av
        JOIN MASCOTA ma ON ma.codigoMascota = av.codigoMascota
        JOIN VACUNA v ON v.idVacuna = av.idVacuna

        UNION ALL

        SELECT
          'TRATAMIENTO' AS tipo,
          TRIM(t.idTratamiento) AS id,
          'Tratamiento ' || NVL(t.estado, 'SIN ESTADO') AS titulo,
          ma.nombre || ' · ' || t.tipo AS descripcion,
          TO_CHAR(t.fechaInicio, 'YYYY-MM-DD') AS fecha,
          NULL AS hora,
          NVL(t.estado, 'SIN ESTADO') AS estado,
          CAST(t.fechaInicio AS TIMESTAMP) AS fechaOrden
        FROM TRATAMIENTO t
        JOIN DIAGNOSTICO d ON d.idDiagnostico = t.idDiagnostico
        JOIN CONSULTA_VETERINARIA cv ON cv.idConsulta = d.idConsulta
        JOIN CITA ci ON ci.idCita = cv.idCita
        JOIN MASCOTA ma ON ma.codigoMascota = ci.codigoMascota
      )
      ORDER BY fechaOrden DESC
      FETCH FIRST ${limite} ROWS ONLY
    `);

        res.json(result.rows);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando actividad reciente");
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;