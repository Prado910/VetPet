const express = require("express");
const router = express.Router();
const { getConnection } = require("../db");

function numeroEntero(valor, fallback) {
    const numero = Number(valor);
    return Number.isInteger(numero) ? numero : fallback;
}

function obtenerFiltrosFecha(req) {
    const anioActual = new Date().getFullYear();
    const anio = numeroEntero(req.query.anio, anioActual);
    const mes = numeroEntero(req.query.mes, 0);

    return {
        anio,
        mes: mes >= 1 && mes <= 12 ? mes : 0,
    };
}

function obtenerTop(req, fallback = 5, maximo = 20) {
    const top = numeroEntero(req.query.top, fallback);
    return Math.min(Math.max(top, 1), maximo);
}

function manejarErrorOracle(error, res, mensajeBase) {
    console.error(mensajeBase, error);

    return res.status(500).json({
        message: mensajeBase,
        error: error.message,
    });
}

/**
 * GET /api/reportes/ingresos-mensuales?anio=&mes=
 */
router.get("/ingresos-mensuales", async (req, res) => {
    let connection;
    const { anio, mes } = obtenerFiltrosFecha(req);

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
      SELECT
        EXTRACT(MONTH FROM f.fecha) AS "mesNumero",
        INITCAP(TRIM(TO_CHAR(f.fecha, 'FMMonth', 'NLS_DATE_LANGUAGE=SPANISH'))) AS "mes",
        COUNT(*) AS "totalFacturas",
        SUM(CASE WHEN f.estadoPago = 'PAGADA' THEN 1 ELSE 0 END) AS "facturasPagadas",
        SUM(CASE WHEN f.estadoPago = 'PENDIENTE' THEN 1 ELSE 0 END) AS "facturasPendientes",
        SUM(CASE WHEN f.estadoPago = 'ANULADA' THEN 1 ELSE 0 END) AS "facturasAnuladas",
        NVL(SUM(CASE WHEN f.estadoPago = 'PAGADA' THEN f.valorTotal ELSE 0 END), 0) AS "ingresosPagados",
        NVL(SUM(CASE WHEN f.estadoPago = 'PENDIENTE' THEN f.valorTotal ELSE 0 END), 0) AS "ingresosPendientes",
        NVL(SUM(f.valorTotal), 0) AS "valorTotal"
      FROM FACTURA f
      WHERE EXTRACT(YEAR FROM f.fecha) = :anio
        AND (:mes = 0 OR EXTRACT(MONTH FROM f.fecha) = :mes)
      GROUP BY
        EXTRACT(MONTH FROM f.fecha),
        INITCAP(TRIM(TO_CHAR(f.fecha, 'FMMonth', 'NLS_DATE_LANGUAGE=SPANISH')))
      ORDER BY EXTRACT(MONTH FROM f.fecha)
      `,
            { anio, mes }
        );

        res.json(result.rows);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando ingresos mensuales");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * GET /api/reportes/mascotas-mas-atendidas?top=5
 */
router.get("/mascotas-mas-atendidas", async (req, res) => {
    let connection;
    const top = obtenerTop(req, 5, 20);

    try {
        connection = await getConnection();

        const result = await connection.execute(`
      SELECT *
      FROM (
        SELECT
          TRIM(ma.codigoMascota) AS "mascotaId",
          ma.nombre AS "mascotaNombre",
          ma.especie AS "mascotaEspecie",
          ma.raza AS "mascotaRaza",
          TRIM(cl.idCliente) AS "clienteId",
          cl.nombreCompleto AS "clienteNombre",
          COUNT(cv.idConsulta) AS "atenciones",
          MAX(TO_CHAR(cv.fechaAtencionReal, 'YYYY-MM-DD')) AS "ultimaAtencion",
          NVL(SUM(CASE WHEN f.estadoPago = 'PAGADA' THEN f.valorTotal ELSE 0 END), 0) AS "ingresosGenerados"
        FROM CONSULTA_VETERINARIA cv
        JOIN CITA ci ON ci.idCita = cv.idCita
        JOIN MASCOTA ma ON ma.codigoMascota = ci.codigoMascota
        JOIN CLIENTE cl ON cl.idCliente = ma.idCliente
        LEFT JOIN FACTURA f ON f.idConsulta = cv.idConsulta
        GROUP BY
          TRIM(ma.codigoMascota),
          ma.nombre,
          ma.especie,
          ma.raza,
          TRIM(cl.idCliente),
          cl.nombreCompleto
        ORDER BY COUNT(cv.idConsulta) DESC, ma.nombre
      )
      FETCH FIRST ${top} ROWS ONLY
    `);

        res.json(result.rows);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando mascotas más atendidas");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * GET /api/reportes/vacunas-aplicadas?anio=&mes=
 */
router.get("/vacunas-aplicadas", async (req, res) => {
    let connection;
    const { anio, mes } = obtenerFiltrosFecha(req);

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
      SELECT
        TRIM(v.idVacuna) AS "vacunaId",
        v.nombre AS "vacunaNombre",
        v.laboratorio AS "laboratorio",
        v.especieObjetivo AS "especieObjetivo",
        COUNT(*) AS "aplicaciones",
        COUNT(DISTINCT av.codigoMascota) AS "mascotasVacunadas",
        NVL(SUM(v.precio), 0) AS "valorEstimado",
        MIN(TO_CHAR(av.fechaAplicacion, 'YYYY-MM-DD')) AS "primeraAplicacion",
        MAX(TO_CHAR(av.fechaAplicacion, 'YYYY-MM-DD')) AS "ultimaAplicacion"
      FROM APLICACION_VACUNA av
      JOIN VACUNA v ON v.idVacuna = av.idVacuna
      WHERE EXTRACT(YEAR FROM av.fechaAplicacion) = :anio
        AND (:mes = 0 OR EXTRACT(MONTH FROM av.fechaAplicacion) = :mes)
      GROUP BY
        TRIM(v.idVacuna),
        v.nombre,
        v.laboratorio,
        v.especieObjetivo
      ORDER BY COUNT(*) DESC, v.nombre
      `,
            { anio, mes }
        );

        res.json(result.rows);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando vacunas aplicadas");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * GET /api/reportes/tratamientos-activos
 */
router.get("/tratamientos-activos", async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(`
      SELECT
        TRIM(t.idTratamiento) AS "id",
        TRIM(t.idDiagnostico) AS "idDiagnostico",
        t.tipo AS "tipo",
        TO_CHAR(t.fechaInicio, 'YYYY-MM-DD') AS "fechaInicio",
        TO_CHAR(t.fechaFinEstimada, 'YYYY-MM-DD') AS "fechaFinEstimada",
        t.indicaciones AS "indicaciones",
        t.estado AS "estado",

        d.descripcionCondicion AS "descripcionCondicion",
        d.nivelGravedad AS "nivelGravedad",
        d.tipoAfeccion AS "tipoAfeccion",

        TRIM(ma.codigoMascota) AS "mascotaId",
        ma.nombre AS "mascotaNombre",
        ma.especie AS "mascotaEspecie",

        TRIM(cl.idCliente) AS "clienteId",
        cl.nombreCompleto AS "clienteNombre",
        cl.telefono AS "clienteTelefono",

        TRIM(ev.idEmpleado) AS "veterinarioId",
        ev.nombreCompleto AS "veterinarioNombre",

        cs.nombre AS "servicioNombre",

        (
          SELECT COUNT(*)
          FROM TRATAMIENTO_MEDICAMENTO tm
          WHERE tm.idTratamiento = t.idTratamiento
        ) AS "medicamentosCount"
      FROM TRATAMIENTO t
      JOIN DIAGNOSTICO d ON d.idDiagnostico = t.idDiagnostico
      JOIN CONSULTA_VETERINARIA cv ON cv.idConsulta = d.idConsulta
      JOIN CITA ci ON ci.idCita = cv.idCita
      JOIN MASCOTA ma ON ma.codigoMascota = ci.codigoMascota
      JOIN CLIENTE cl ON cl.idCliente = ma.idCliente
      JOIN EMPLEADO ev ON ev.idEmpleado = t.idVeterinario
      LEFT JOIN CATALOGO_SERVICIOS cs ON cs.idServicio = t.idServicio
      WHERE t.estado = 'ACTIVO'
      ORDER BY t.fechaInicio DESC, t.idTratamiento DESC
    `);

        res.json(result.rows);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando tratamientos activos");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * GET /api/reportes/top-servicios?top=5
 */
router.get("/top-servicios", async (req, res) => {
    let connection;
    const top = obtenerTop(req, 5, 20);

    try {
        connection = await getConnection();

        const result = await connection.execute(`
      SELECT *
      FROM (
        SELECT
          TRIM(cs.idServicio) AS "servicioId",
          cs.nombre AS "servicioNombre",
          cs.tipoServicio AS "tipoServicio",
          cs.precio AS "precio",
          COUNT(cv.idConsulta) AS "vecesUsado",
          NVL(SUM(CASE WHEN f.estadoPago = 'PAGADA' THEN f.valorTotal ELSE 0 END), 0) AS "ingresosPagados",
          MAX(TO_CHAR(cv.fechaAtencionReal, 'YYYY-MM-DD')) AS "ultimaAtencion"
        FROM CATALOGO_SERVICIOS cs
        JOIN CONSULTA_VETERINARIA cv ON cv.idServicio = cs.idServicio
        LEFT JOIN FACTURA f ON f.idConsulta = cv.idConsulta
        GROUP BY
          TRIM(cs.idServicio),
          cs.nombre,
          cs.tipoServicio,
          cs.precio
        ORDER BY COUNT(cv.idConsulta) DESC, NVL(SUM(CASE WHEN f.estadoPago = 'PAGADA' THEN f.valorTotal ELSE 0 END), 0) DESC
      )
      FETCH FIRST ${top} ROWS ONLY
    `);

        res.json(result.rows);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando top de servicios");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * GET /api/reportes/resumen-clientes
 */
router.get("/resumen-clientes", async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(`
      SELECT
        TRIM(cl.idCliente) AS "clienteId",
        cl.nombreCompleto AS "clienteNombre",
        cl.telefono AS "telefono",
        cl.correoElectronico AS "email",
        cl.estado AS "estado",
        COUNT(DISTINCT ma.codigoMascota) AS "totalMascotas",
        COUNT(f.idFactura) AS "totalFacturas",
        SUM(CASE WHEN f.estadoPago = 'PAGADA' THEN 1 ELSE 0 END) AS "facturasPagadas",
        SUM(CASE WHEN f.estadoPago = 'PENDIENTE' THEN 1 ELSE 0 END) AS "facturasPendientes",
        SUM(CASE WHEN f.estadoPago = 'ANULADA' THEN 1 ELSE 0 END) AS "facturasAnuladas",
        NVL(SUM(CASE WHEN f.estadoPago = 'PAGADA' THEN f.valorTotal ELSE 0 END), 0) AS "ingresoTotal",
        NVL(SUM(CASE WHEN f.estadoPago = 'PENDIENTE' THEN f.valorTotal ELSE 0 END), 0) AS "ingresoPendiente",
        MAX(TO_CHAR(f.fecha, 'YYYY-MM-DD')) AS "ultimaFactura"
      FROM CLIENTE cl
      LEFT JOIN MASCOTA ma ON ma.idCliente = cl.idCliente
      LEFT JOIN FACTURA f ON f.idCliente = cl.idCliente
      GROUP BY
        TRIM(cl.idCliente),
        cl.nombreCompleto,
        cl.telefono,
        cl.correoElectronico,
        cl.estado
      ORDER BY "ingresoTotal" DESC, cl.nombreCompleto
    `);

        res.json(result.rows);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando resumen de clientes");
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;