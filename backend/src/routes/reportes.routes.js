const express = require("express");
const router = express.Router();
const oracledb = require("oracledb");
const { getConnection } = require("../db");

const {
    cursorToRows,
    outCursor,
} = require("../plsql");

function numeroEntero(valor, fallback) {
    const numero = Number(valor);
    return Number.isInteger(numero) ? numero : fallback;
}

function obtenerFiltrosFecha(req) {
    const anioActual = new Date().getFullYear();
    const anio = numeroEntero(req.query.anio, anioActual);
    const mes = numeroEntero(req.query.mes, new Date().getMonth() + 1);

    return {
        anio,
        mes: mes >= 1 && mes <= 12 ? mes : new Date().getMonth() + 1,
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
 * Usa PKG_REPORTES.fn_ingresos_mensuales.
 * Devuelve total pagado del año/mes.
 */
router.get("/ingresos-mensuales", async (req, res) => {
    let connection;
    const { anio, mes } = obtenerFiltrosFecha(req);

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                :total := PKG_REPORTES.fn_ingresos_mensuales(
                    :p_anio,
                    :p_mes
                );
            END;
            `,
            {
                p_anio: anio,
                p_mes: mes,
                total: {
                    dir: oracledb.BIND_OUT,
                    type: oracledb.NUMBER,
                },
            }
        );

        res.json({
            anio,
            mes,
            ingresosPagados: result.outBinds.total || 0,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando ingresos mensuales");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * Usa PKG_REPORTES.fn_mascotas_mas_atendidas.
 * Esta función sí retorna SYS_REFCURSOR.
 */
router.get("/mascotas-mas-atendidas", async (req, res) => {
    let connection;
    const top = obtenerTop(req, 5, 20);

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                :cursor := PKG_REPORTES.fn_mascotas_mas_atendidas(:p_top);
            END;
            `,
            {
                p_top: top,
                cursor: outCursor(),
            }
        );

        const rows = await cursorToRows(result.outBinds.cursor);

        res.json(rows);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando mascotas más atendidas");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * Usa PKG_REPORTES.fn_vacunas_aplicadas_mes.
 * Devuelve total de vacunas aplicadas en año/mes.
 */
router.get("/vacunas-aplicadas", async (req, res) => {
    let connection;
    const { anio, mes } = obtenerFiltrosFecha(req);

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                :total := PKG_REPORTES.fn_vacunas_aplicadas_mes(
                    :p_anio,
                    :p_mes
                );
            END;
            `,
            {
                p_anio: anio,
                p_mes: mes,
                total: {
                    dir: oracledb.BIND_OUT,
                    type: oracledb.NUMBER,
                },
            }
        );

        res.json({
            anio,
            mes,
            aplicaciones: result.outBinds.total || 0,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando vacunas aplicadas");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * Usa PKG_REPORTES.fn_tratamientos_activos.
 * Devuelve número total de tratamientos activos.
 */
router.get("/tratamientos-activos", async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                :total := PKG_REPORTES.fn_tratamientos_activos;
            END;
            `,
            {
                total: {
                    dir: oracledb.BIND_OUT,
                    type: oracledb.NUMBER,
                },
            }
        );

        res.json({
            tratamientosActivos: result.outBinds.total || 0,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando tratamientos activos");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * No existe como función directa en PKG_REPORTES.
 * Pero sí existe en PKG_FACTURACION.fn_top_servicios_facturados.
 */
router.get("/top-servicios", async (req, res) => {
    let connection;
    const top = obtenerTop(req, 5, 5);

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                :topServicios := PKG_FACTURACION.fn_top_servicios_facturados(:p_top);
            END;
            `,
            {
                p_top: top,
                topServicios: {
                    dir: oracledb.BIND_OUT,
                    type: "T_VARRAY_TOP_SERVICIOS",
                },
            }
        );

        res.json(result.outBinds.topServicios || []);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando top de servicios");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * No existe en PKG_REPORTES.
 * Pero sí existe como función en PKG_FACTURACION.fn_resumen_financiero_clientes.
 */
router.get("/resumen-clientes", async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                :resumen := PKG_FACTURACION.fn_resumen_financiero_clientes;
            END;
            `,
            {
                resumen: {
                    dir: oracledb.BIND_OUT,
                    type: "T_TAB_RESUMEN_CLIENTE",
                },
            }
        );

        res.json(result.outBinds.resumen || []);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando resumen de clientes");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * Usa PKG_REPORTES.fn_historial_mascota.
 * Endpoint extra útil:
 * GET /api/reportes/historial-mascota/:codigoMascota
 */
router.get("/historial-mascota/:codigoMascota", async (req, res) => {
    let connection;

    const codigoMascota = String(req.params.codigoMascota || "")
        .trim()
        .toUpperCase();

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                :historial := PKG_REPORTES.fn_historial_mascota(:p_codigoMascota);
            END;
            `,
            {
                p_codigoMascota: codigoMascota,
                historial: {
                    dir: oracledb.BIND_OUT,
                    type: "T_TAB_HISTORIAL",
                },
            }
        );

        res.json(result.outBinds.historial || []);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando historial de mascota");
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;