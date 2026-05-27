const express = require("express");
const router = express.Router();
const { getConnection } = require("../db");

const {
  cursorToRows,
  outCursor,
} = require("../plsql");

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

    const result = await connection.execute(
      `
      BEGIN
          PKG_DASHBOARD.pr_resumen_dashboard(:p_cursor);
      END;
      `,
      {
        p_cursor: outCursor(),
      }
    );

    const rows = await cursorToRows(result.outBinds.p_cursor);

    res.json(rows[0] || {});
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

    const result = await connection.execute(
      `
      BEGIN
          PKG_DASHBOARD.pr_citas_hoy(:p_cursor);
      END;
      `,
      {
        p_cursor: outCursor(),
      }
    );

    const rows = await cursorToRows(result.outBinds.p_cursor);

    res.json(rows);
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

    const result = await connection.execute(
      `
      BEGIN
          PKG_DASHBOARD.pr_actividad_reciente(
              :p_limite,
              :p_cursor
          );
      END;
      `,
      {
        p_limite: limite,
        p_cursor: outCursor(),
      }
    );

    const rows = await cursorToRows(result.outBinds.p_cursor);

    res.json(rows);
  } catch (error) {
    manejarErrorOracle(error, res, "Error consultando actividad reciente");
  } finally {
    if (connection) await connection.close();
  }
});

module.exports = router;