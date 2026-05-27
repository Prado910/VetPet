const express = require("express");
const router = express.Router();
const { getConnection } = require("../db");

// ── GET /api/diccionario/objetos ─────────────────────────────────────────────
// Todos los objetos del esquema (tablas, paquetes, triggers, vistas, secuencias…)
router.get("/objetos", async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(`
            SELECT object_name  AS "nombre",
                   object_type  AS "tipo",
                   TO_CHAR(created, 'YYYY-MM-DD') AS "fechaCreacion",
                   status       AS "estado"
            FROM   user_objects
            ORDER  BY object_type, object_name
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: "Error consultando USER_OBJECTS", error: error.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ── GET /api/diccionario/tablas ──────────────────────────────────────────────
// Lista de tablas del esquema
router.get("/tablas", async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(`
            SELECT table_name      AS "tabla",
                   tablespace_name AS "tablespace",
                   num_rows        AS "filas"
            FROM   user_tables
            ORDER  BY table_name
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: "Error consultando USER_TABLES", error: error.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ── GET /api/diccionario/columnas/:tabla ─────────────────────────────────────
// Columnas de una tabla específica
router.get("/columnas/:tabla", async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(`
            SELECT column_name    AS "columna",
                   data_type      AS "tipo",
                   data_length    AS "longitud",
                   data_precision AS "precision",
                   data_scale     AS "escala",
                   nullable       AS "nulo",
                   data_default   AS "valorDefault",
                   column_id      AS "orden"
            FROM   user_tab_columns
            WHERE  table_name = UPPER(:tabla)
            ORDER  BY column_id
        `, { tabla: req.params.tabla });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: "Error consultando USER_TAB_COLUMNS", error: error.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ── GET /api/diccionario/restricciones/:tabla ────────────────────────────────
// Restricciones de una tabla (PK, FK, CHECK, UNIQUE)
router.get("/restricciones/:tabla", async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(`
            SELECT uc.constraint_name   AS "nombre",
                   uc.constraint_type   AS "tipo",
                   uc.search_condition  AS "condicion",
                   uc.r_constraint_name AS "referenciaA",
                   uc.delete_rule       AS "reglaEliminar",
                   uc.status            AS "estado",
                   ucc.column_name      AS "columna"
            FROM   user_constraints  uc
            LEFT JOIN user_cons_columns ucc
                   ON ucc.constraint_name = uc.constraint_name
            WHERE  uc.table_name = UPPER(:tabla)
            ORDER  BY uc.constraint_type, uc.constraint_name
        `, { tabla: req.params.tabla });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: "Error consultando USER_CONSTRAINTS", error: error.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ── GET /api/diccionario/secuencias ─────────────────────────────────────────
// Secuencias del esquema
router.get("/secuencias", async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(`
            SELECT sequence_name  AS "nombre",
                   min_value      AS "minValor",
                   max_value      AS "maxValor",
                   increment_by   AS "incremento",
                   cycle_flag     AS "ciclo",
                   cache_size     AS "cache",
                   last_number    AS "siguienteDisponible"
            FROM   user_sequences
            ORDER  BY sequence_name
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: "Error consultando USER_SEQUENCES", error: error.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ── GET /api/diccionario/triggers ───────────────────────────────────────────
// Triggers del esquema
router.get("/triggers", async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(`
            SELECT trigger_name      AS "nombre",
                   trigger_type      AS "tipo",
                   triggering_event  AS "evento",
                   table_name        AS "tabla",
                   status            AS "estado",
                   trigger_body      AS "cuerpo"
            FROM   user_triggers
            ORDER  BY table_name, trigger_name
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: "Error consultando USER_TRIGGERS", error: error.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ── GET /api/diccionario/vistas ──────────────────────────────────────────────
// Vistas del esquema con su definición SQL
router.get("/vistas", async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(`
            SELECT view_name    AS "nombre",
                   text_length  AS "longitudTexto",
                   text         AS "definicion"
            FROM   user_views
            ORDER  BY view_name
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: "Error consultando USER_VIEWS", error: error.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ── GET /api/diccionario/rendimiento/sesiones ────────────────────────────────
// Vista V$SESSION — sesiones activas (requiere privilegio SELECT on V$SESSION)
router.get("/rendimiento/sesiones", async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(`
            SELECT sid                                    AS "sid",
                   serial#                               AS "serial",
                   username                              AS "usuario",
                   status                                AS "estado",
                   program                               AS "programa",
                   TO_CHAR(logon_time, 'YYYY-MM-DD HH24:MI:SS') AS "horaConexion",
                   machine                               AS "maquina",
                   osuser                                AS "usuarioSO"
            FROM   v$session
            WHERE  username IS NOT NULL
            ORDER  BY logon_time
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: "Error consultando V$SESSION", error: error.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ── GET /api/diccionario/rendimiento/sql-costosos ───────────────────────────
// Vista V$SQL — top 10 sentencias más lentas del esquema actual
router.get("/rendimiento/sql-costosos", async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(`
            SELECT sql_text                                              AS "sqlTexto",
                   executions                                           AS "ejecuciones",
                   ROUND(elapsed_time / 1000000, 4)                    AS "segundosTotales",
                   ROUND(elapsed_time / NULLIF(executions,0) / 1000000, 6) AS "segundosPorEjecucion",
                   buffer_gets                                          AS "lecturas",
                   parsing_schema_name                                  AS "esquema"
            FROM   v$sql
            WHERE  parsing_schema_name = USER
              AND  executions > 0
            ORDER  BY elapsed_time DESC
            FETCH  FIRST 10 ROWS ONLY
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: "Error consultando V$SQL", error: error.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ── GET /api/diccionario/rendimiento/version ────────────────────────────────
// Vista V$VERSION — info del servidor Oracle
router.get("/rendimiento/version", async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(`
            SELECT banner AS "banner"
            FROM   v$version
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: "Error consultando V$VERSION", error: error.message });
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;