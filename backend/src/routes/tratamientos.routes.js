const express = require("express");
const router = express.Router();
const { getConnection } = require("../db");

const tiposTratamientoValidos = [
    "MEDICACION",
    "OBSERVACION",
    "TERAPIA",
    "PROCEDIMIENTO_AMBULATORIO",
    "PLAN_VACUNACION",
];

const estadosTratamientoValidos = [
    "ACTIVO",
    "FINALIZADO",
    "SUSPENDIDO",
    "CANCELADO",
    null,
    "",
];

function esFechaValida(fecha) {
    return /^\d{4}-\d{2}-\d{2}$/.test(fecha || "");
}

function normalizarTexto(valor) {
    return valor?.trim() || null;
}

function validarTratamiento({
    idDiagnostico,
    idVeterinario,
    tipo,
    fechaInicio,
    fechaFinEstimada,
    estado,
}) {
    if (!idDiagnostico?.trim()) {
        return "El diagnóstico es obligatorio.";
    }

    if (!idVeterinario?.trim()) {
        return "El veterinario es obligatorio.";
    }

    if (!tiposTratamientoValidos.includes(tipo)) {
        return "Tipo de tratamiento inválido.";
    }

    if (!fechaInicio?.trim()) {
        return "La fecha de inicio es obligatoria.";
    }

    if (!esFechaValida(fechaInicio)) {
        return "La fecha de inicio debe tener formato YYYY-MM-DD.";
    }

    if (fechaFinEstimada && !esFechaValida(fechaFinEstimada)) {
        return "La fecha fin estimada debe tener formato YYYY-MM-DD.";
    }

    if (!estadosTratamientoValidos.includes(estado)) {
        return "Estado de tratamiento inválido.";
    }

    return null;
}

function validarTratamientoMedicamento({
    idMedicamento,
    dosis,
    frecuencia,
}) {
    if (!idMedicamento?.trim()) {
        return "El medicamento es obligatorio.";
    }

    if (!dosis?.trim()) {
        return "La dosis es obligatoria.";
    }

    if (!frecuencia?.trim()) {
        return "La frecuencia es obligatoria.";
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
            message: "El diagnóstico, veterinario, servicio o medicamento seleccionado no existe.",
            error: error.message,
        });
    }

    if (error.errorNum === 2292) {
        return res.status(409).json({
            message:
                "No se puede eliminar porque el tratamiento tiene medicamentos u otros registros relacionados.",
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

async function generarIdTratamiento(connection) {
    const result = await connection.execute(`
    SELECT
      'TRAT' ||
      LPAD(
        NVL(MAX(TO_NUMBER(REGEXP_SUBSTR(TRIM(idTratamiento), '[0-9]+$'))), 0) + 1,
        6,
        '0'
      ) AS "id"
    FROM TRATAMIENTO
    WHERE REGEXP_LIKE(TRIM(idTratamiento), '^TRAT[0-9]+$')
  `);

    return result.rows[0].id;
}

router.get("/catalogos", async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const [
            diagnosticosResult,
            veterinariosResult,
            serviciosResult,
            medicamentosResult,
        ] = await Promise.all([
            connection.execute(`
        SELECT
          TRIM(d.idDiagnostico) AS "id",
          TRIM(d.idConsulta) AS "idConsulta",
          d.descripcionCondicion AS "descripcionCondicion",
          d.nivelGravedad AS "nivelGravedad",
          d.tipoAfeccion AS "tipoAfeccion",
          d.estado AS "estado",
          TO_CHAR(cv.fechaAtencionReal, 'YYYY-MM-DD') AS "fechaAtencionReal",
          ma.nombre AS "mascotaNombre",
          ma.especie AS "mascotaEspecie",
          cl.nombreCompleto AS "clienteNombre",
          ev.nombreCompleto AS "veterinarioConsultaNombre"
        FROM DIAGNOSTICO d
        JOIN CONSULTA_VETERINARIA cv ON cv.idConsulta = d.idConsulta
        JOIN CITA ci ON ci.idCita = cv.idCita
        JOIN MASCOTA ma ON ma.codigoMascota = ci.codigoMascota
        JOIN CLIENTE cl ON cl.idCliente = ma.idCliente
        JOIN EMPLEADO ev ON ev.idEmpleado = ci.idVeterinario
        ORDER BY cv.fechaAtencionReal DESC, d.idDiagnostico DESC
      `),
            connection.execute(`
        SELECT
          TRIM(v.idEmpleado) AS "id",
          e.nombreCompleto AS "nombre",
          e.telefono AS "telefono",
          v.especialidad AS "especialidad",
          v.nroMatricula AS "nroMatricula"
        FROM VETERINARIO v
        JOIN EMPLEADO e ON e.idEmpleado = v.idEmpleado
        WHERE e.estadoLaboral = 'ACTIVO'
        ORDER BY e.nombreCompleto
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
            connection.execute(`
        SELECT
          TRIM(idMedicamento) AS "id",
          nombre AS "nombre",
          descripcion AS "descripcion",
          precioUnitario AS "precioUnitario"
        FROM MEDICAMENTO
        ORDER BY nombre
      `),
        ]);

        res.json({
            diagnosticos: diagnosticosResult.rows,
            veterinarios: veterinariosResult.rows,
            servicios: serviciosResult.rows,
            medicamentos: medicamentosResult.rows,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando catálogos de tratamientos");
    } finally {
        if (connection) await connection.close();
    }
});

router.get("/:id/medicamentos", async (req, res) => {
    let connection;
    const id = req.params.id;

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
      SELECT
        TRIM(tm.idTratamiento) AS "idTratamiento",
        TRIM(tm.idMedicamento) AS "idMedicamento",
        tm.dosis AS "dosis",
        tm.frecuencia AS "frecuencia",
        tm.viaAdministracion AS "viaAdministracion",
        tm.duracion AS "duracion",
        m.nombre AS "medicamentoNombre",
        m.descripcion AS "medicamentoDescripcion",
        m.precioUnitario AS "precioUnitario"
      FROM TRATAMIENTO_MEDICAMENTO tm
      JOIN MEDICAMENTO m ON m.idMedicamento = tm.idMedicamento
      WHERE tm.idTratamiento = :id
      ORDER BY m.nombre
      `,
            { id }
        );

        res.json(result.rows);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando medicamentos del tratamiento");
    } finally {
        if (connection) await connection.close();
    }
});

router.post("/:id/medicamentos", async (req, res) => {
    let connection;

    const idTratamiento = req.params.id;
    const {
        idMedicamento,
        dosis,
        frecuencia,
        viaAdministracion = null,
        duracion = null,
    } = req.body;

    const errorValidacion = validarTratamientoMedicamento({
        idMedicamento,
        dosis,
        frecuencia,
    });

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        await connection.execute(
            `
      INSERT INTO TRATAMIENTO_MEDICAMENTO (
        idTratamiento,
        idMedicamento,
        dosis,
        frecuencia,
        viaAdministracion,
        duracion
      ) VALUES (
        :idTratamiento,
        :idMedicamento,
        :dosis,
        :frecuencia,
        :viaAdministracion,
        :duracion
      )
      `,
            {
                idTratamiento: idTratamiento.trim(),
                idMedicamento: idMedicamento.trim(),
                dosis: dosis.trim(),
                frecuencia: frecuencia.trim(),
                viaAdministracion: normalizarTexto(viaAdministracion),
                duracion: normalizarTexto(duracion),
            },
            { autoCommit: true }
        );

        res.status(201).json({
            message: "Medicamento asociado correctamente al tratamiento",
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error asociando medicamento al tratamiento");
    } finally {
        if (connection) await connection.close();
    }
});

router.put("/:id/medicamentos/:idMedicamento", async (req, res) => {
    let connection;

    const idTratamiento = req.params.id;
    const idMedicamentoParam = req.params.idMedicamento;

    const {
        dosis,
        frecuencia,
        viaAdministracion = null,
        duracion = null,
    } = req.body;

    const errorValidacion = validarTratamientoMedicamento({
        idMedicamento: idMedicamentoParam,
        dosis,
        frecuencia,
    });

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
      UPDATE TRATAMIENTO_MEDICAMENTO
      SET
        dosis = :dosis,
        frecuencia = :frecuencia,
        viaAdministracion = :viaAdministracion,
        duracion = :duracion
      WHERE idTratamiento = :idTratamiento
        AND idMedicamento = :idMedicamento
      `,
            {
                idTratamiento: idTratamiento.trim(),
                idMedicamento: idMedicamentoParam.trim(),
                dosis: dosis.trim(),
                frecuencia: frecuencia.trim(),
                viaAdministracion: normalizarTexto(viaAdministracion),
                duracion: normalizarTexto(duracion),
            },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                message: "Medicamento del tratamiento no encontrado",
            });
        }

        res.json({
            message: "Medicamento del tratamiento actualizado correctamente",
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error actualizando medicamento del tratamiento");
    } finally {
        if (connection) await connection.close();
    }
});

router.delete("/:id/medicamentos/:idMedicamento", async (req, res) => {
    let connection;

    const idTratamiento = req.params.id;
    const idMedicamento = req.params.idMedicamento;

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
      DELETE FROM TRATAMIENTO_MEDICAMENTO
      WHERE idTratamiento = :idTratamiento
        AND idMedicamento = :idMedicamento
      `,
            {
                idTratamiento,
                idMedicamento,
            },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                message: "Medicamento del tratamiento no encontrado",
            });
        }

        res.json({
            message: "Medicamento eliminado del tratamiento correctamente",
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error eliminando medicamento del tratamiento");
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
        TRIM(t.idTratamiento) AS "id",
        TRIM(t.idDiagnostico) AS "idDiagnostico",
        TRIM(t.idVeterinario) AS "idVeterinario",
        TRIM(t.idServicio) AS "idServicio",
        t.tipo AS "tipo",
        TO_CHAR(t.fechaInicio, 'YYYY-MM-DD') AS "fechaInicio",
        TO_CHAR(t.fechaFinEstimada, 'YYYY-MM-DD') AS "fechaFinEstimada",
        t.indicaciones AS "indicaciones",
        t.estado AS "estado",

        d.descripcionCondicion AS "descripcionCondicion",
        d.nivelGravedad AS "nivelGravedad",
        d.tipoAfeccion AS "tipoAfeccion",
        d.estado AS "diagnosticoEstado",

        TRIM(cv.idConsulta) AS "idConsulta",
        TO_CHAR(cv.fechaAtencionReal, 'YYYY-MM-DD') AS "fechaAtencionReal",

        ma.nombre AS "mascotaNombre",
        ma.especie AS "mascotaEspecie",
        cl.nombreCompleto AS "clienteNombre",

        ev.nombreCompleto AS "veterinarioNombre",

        cs.nombre AS "servicioNombre",
        cs.tipoServicio AS "servicioTipo",
        cs.precio AS "servicioPrecio",

        (
          SELECT COUNT(*)
          FROM TRATAMIENTO_MEDICAMENTO tm
          WHERE tm.idTratamiento = t.idTratamiento
        ) AS "medicamentosCount",

        (
          SELECT LISTAGG(m.nombre, ', ') WITHIN GROUP (ORDER BY m.nombre)
          FROM TRATAMIENTO_MEDICAMENTO tm
          JOIN MEDICAMENTO m ON m.idMedicamento = tm.idMedicamento
          WHERE tm.idTratamiento = t.idTratamiento
        ) AS "medicamentos"
      FROM TRATAMIENTO t
      JOIN DIAGNOSTICO d ON d.idDiagnostico = t.idDiagnostico
      JOIN CONSULTA_VETERINARIA cv ON cv.idConsulta = d.idConsulta
      JOIN CITA ci ON ci.idCita = cv.idCita
      JOIN MASCOTA ma ON ma.codigoMascota = ci.codigoMascota
      JOIN CLIENTE cl ON cl.idCliente = ma.idCliente
      JOIN EMPLEADO ev ON ev.idEmpleado = t.idVeterinario
      LEFT JOIN CATALOGO_SERVICIOS cs ON cs.idServicio = t.idServicio
      ORDER BY t.fechaInicio DESC, t.idTratamiento DESC
    `);

        res.json(result.rows);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando tratamientos");
    } finally {
        if (connection) await connection.close();
    }
});

router.post("/", async (req, res) => {
    let connection;

    const {
        id = null,
        idDiagnostico,
        idVeterinario,
        idServicio = null,
        tipo,
        fechaInicio,
        fechaFinEstimada = null,
        indicaciones = null,
        estado = "ACTIVO",
    } = req.body;

    const errorValidacion = validarTratamiento({
        idDiagnostico,
        idVeterinario,
        tipo,
        fechaInicio,
        fechaFinEstimada,
        estado,
    });

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        const idTratamiento =
            normalizarTexto(id) || (await generarIdTratamiento(connection));

        await connection.execute(
            `
      INSERT INTO TRATAMIENTO (
        idTratamiento,
        idDiagnostico,
        idVeterinario,
        idServicio,
        tipo,
        fechaInicio,
        fechaFinEstimada,
        indicaciones,
        estado
      ) VALUES (
        :idTratamiento,
        :idDiagnostico,
        :idVeterinario,
        :idServicio,
        :tipo,
        TO_DATE(:fechaInicio, 'YYYY-MM-DD'),
        CASE
          WHEN :fechaFinEstimada IS NULL THEN NULL
          ELSE TO_DATE(:fechaFinEstimada, 'YYYY-MM-DD')
        END,
        :indicaciones,
        :estado
      )
      `,
            {
                idTratamiento,
                idDiagnostico: idDiagnostico.trim(),
                idVeterinario: idVeterinario.trim(),
                idServicio: normalizarTexto(idServicio),
                tipo,
                fechaInicio,
                fechaFinEstimada: normalizarTexto(fechaFinEstimada),
                indicaciones: normalizarTexto(indicaciones),
                estado: normalizarTexto(estado),
            },
            { autoCommit: true }
        );

        res.status(201).json({
            message: "Tratamiento creado correctamente",
            id: idTratamiento,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error creando tratamiento");
    } finally {
        if (connection) await connection.close();
    }
});

router.put("/:id", async (req, res) => {
    let connection;

    const id = req.params.id;

    const {
        idDiagnostico,
        idVeterinario,
        idServicio = null,
        tipo,
        fechaInicio,
        fechaFinEstimada = null,
        indicaciones = null,
        estado = "ACTIVO",
    } = req.body;

    const errorValidacion = validarTratamiento({
        idDiagnostico,
        idVeterinario,
        tipo,
        fechaInicio,
        fechaFinEstimada,
        estado,
    });

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
      UPDATE TRATAMIENTO
      SET
        idDiagnostico = :idDiagnostico,
        idVeterinario = :idVeterinario,
        idServicio = :idServicio,
        tipo = :tipo,
        fechaInicio = TO_DATE(:fechaInicio, 'YYYY-MM-DD'),
        fechaFinEstimada = CASE
          WHEN :fechaFinEstimada IS NULL THEN NULL
          ELSE TO_DATE(:fechaFinEstimada, 'YYYY-MM-DD')
        END,
        indicaciones = :indicaciones,
        estado = :estado
      WHERE idTratamiento = :id
      `,
            {
                id,
                idDiagnostico: idDiagnostico.trim(),
                idVeterinario: idVeterinario.trim(),
                idServicio: normalizarTexto(idServicio),
                tipo,
                fechaInicio,
                fechaFinEstimada: normalizarTexto(fechaFinEstimada),
                indicaciones: normalizarTexto(indicaciones),
                estado: normalizarTexto(estado),
            },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                message: "Tratamiento no encontrado",
            });
        }

        res.json({
            message: "Tratamiento actualizado correctamente",
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error actualizando tratamiento");
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
      DELETE FROM TRATAMIENTO
      WHERE idTratamiento = :id
      `,
            { id },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                message: "Tratamiento no encontrado",
            });
        }

        res.json({
            message: "Tratamiento eliminado correctamente",
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error eliminando tratamiento");
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;