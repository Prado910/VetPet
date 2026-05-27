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




router.get("/catalogos", async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const oracledb = require("oracledb");
        const result = await connection.execute(
            `BEGIN PKG_CONSULTAS_MEDICAS.pr_listar_consultas_catalogo(:cursor); END;`,
            { cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR } }
        );
        const rows = await result.outBinds.cursor.getRows();
        await result.outBinds.cursor.close();
        res.json({ consultas: rows });
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
        const oracledb = require("oracledb");
        const result = await connection.execute(
            `BEGIN PKG_CONSULTAS_MEDICAS.pr_listar_diagnosticos(:cursor); END;`,
            { cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR } }
        );
        const rows = await result.outBinds.cursor.getRows();
        await result.outBinds.cursor.close();
        res.json(rows);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando diagnósticos");
    } finally {
        if (connection) await connection.close();
    }
});

// Generación de ID dentro del POST
const idResult = await connection.execute(
    `BEGIN :id := PKG_CONSULTAS_MEDICAS.fn_generar_id_diagnostico(); END;`,
    { id: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 12 } }
);
const idDiagnostico = normalizarTexto(id) || idResult.outBinds.id;

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