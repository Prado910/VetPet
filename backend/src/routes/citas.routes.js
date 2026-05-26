const express = require("express");
const router = express.Router();
const { getConnection } = require("../db");

const estadosValidos = [
    "PROGRAMADA",
    "CONFIRMADA",
    "ATENDIDA",
    "CANCELADA",
    "REPROGRAMADA",
];

function normalizarId(valor) {
    return String(valor || "").trim().toUpperCase();
}

function horaAMinutos(hora) {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hora || "");

    if (!match) {
        return null;
    }

    return Number(match[1]) * 60 + Number(match[2]);
}

function validarCita(
    {
        id,
        mascotaId,
        veterinarioId,
        recepcionistaId,
        fecha,
        hora,
        estado,
    },
    esCreacion = true
) {
    if (esCreacion && !id?.trim()) {
        return "El ID de la cita es obligatorio.";
    }

    if (!mascotaId?.trim()) {
        return "La mascota es obligatoria.";
    }

    if (!veterinarioId?.trim()) {
        return "El veterinario es obligatorio.";
    }

    if (!recepcionistaId?.trim()) {
        return "El recepcionista es obligatorio.";
    }

    if (!fecha?.trim()) {
        return "La fecha es obligatoria.";
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return "La fecha debe tener formato YYYY-MM-DD.";
    }

    if (horaAMinutos(hora) === null) {
        return "La hora debe tener formato HH:mm.";
    }

    if (!estadosValidos.includes(estado)) {
        return "Estado inválido. Usa PROGRAMADA, CONFIRMADA, ATENDIDA, CANCELADA o REPROGRAMADA.";
    }

    return null;
}

function manejarErrorOracle(error, res, mensajeBase) {
    console.error(mensajeBase, error);

    if (error.errorNum === 1) {
        return res.status(409).json({
            message: "Ya existe una cita con ese ID.",
            error: error.message,
        });
    }

    if (error.errorNum === 2291) {
        return res.status(400).json({
            message:
                "La mascota, el veterinario o el recepcionista seleccionado no existe.",
            error: error.message,
        });
    }

    if (error.errorNum === 2292) {
        return res.status(409).json({
            message:
                "No se puede eliminar porque la cita tiene consultas, facturas u otros registros relacionados.",
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

router.get("/catalogos", async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const [mascotasResult, veterinariosResult, recepcionistasResult] =
            await Promise.all([
                connection.execute(`
          SELECT
            TRIM(m.codigoMascota) AS "id",
            m.nombre AS "nombre",
            m.especie AS "especie",
            c.nombreCompleto AS "clienteNombre"
          FROM MASCOTA m
          JOIN CLIENTE c ON c.idCliente = m.idCliente
          ORDER BY m.nombre
        `),
                connection.execute(`
          SELECT
            TRIM(v.idEmpleado) AS "id",
            e.nombreCompleto AS "nombre",
            v.especialidad AS "especialidad"
          FROM VETERINARIO v
          JOIN EMPLEADO e ON e.idEmpleado = v.idEmpleado
          ORDER BY e.nombreCompleto
        `),
                connection.execute(`
          SELECT
            TRIM(r.idEmpleado) AS "id",
            e.nombreCompleto AS "nombre",
            r.turno AS "turno"
          FROM RECEPCIONISTA r
          JOIN EMPLEADO e ON e.idEmpleado = r.idEmpleado
          ORDER BY e.nombreCompleto
        `),
            ]);

        res.json({
            mascotas: mascotasResult.rows,
            veterinarios: veterinariosResult.rows,
            recepcionistas: recepcionistasResult.rows,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando catálogos de citas");
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
        TRIM(ci.idCita) AS "id",
        TRIM(ci.codigoMascota) AS "mascotaId",
        ma.nombre AS "mascotaNombre",
        ma.especie AS "mascotaEspecie",
        TRIM(cl.idCliente) AS "clienteId",
        cl.nombreCompleto AS "clienteNombre",
        cl.telefono AS "clienteTelefono",
        TRIM(ci.idVeterinario) AS "veterinarioId",
        ev.nombreCompleto AS "veterinarioNombre",
        TRIM(ci.idRecepcionista) AS "recepcionistaId",
        er.nombreCompleto AS "recepcionistaNombre",
        TO_CHAR(ci.fecha, 'YYYY-MM-DD') AS "fecha",
        TO_CHAR(EXTRACT(HOUR FROM ci.hora), 'FM00') || ':' ||
        TO_CHAR(EXTRACT(MINUTE FROM ci.hora), 'FM00') AS "hora",
        ci.motivoConsulta AS "motivo",
        ci.estadoCita AS "estado"
      FROM CITA ci
      JOIN MASCOTA ma ON ma.codigoMascota = ci.codigoMascota
      JOIN CLIENTE cl ON cl.idCliente = ma.idCliente
      JOIN EMPLEADO ev ON ev.idEmpleado = ci.idVeterinario
      JOIN EMPLEADO er ON er.idEmpleado = ci.idRecepcionista
      ORDER BY ci.fecha DESC, ci.hora DESC
    `);

        res.json(result.rows);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando citas");
    } finally {
        if (connection) await connection.close();
    }
});

router.post("/", async (req, res) => {
    let connection;

    const {
        id,
        mascotaId,
        veterinarioId,
        recepcionistaId,
        fecha,
        hora,
        motivo = null,
        estado = "PROGRAMADA",
    } = req.body;

    const errorValidacion = validarCita(
        {
            id,
            mascotaId,
            veterinarioId,
            recepcionistaId,
            fecha,
            hora,
            estado,
        },
        true
    );

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        await connection.execute(
            `
      INSERT INTO CITA (
        idCita,
        codigoMascota,
        idVeterinario,
        idRecepcionista,
        fecha,
        hora,
        motivoConsulta,
        estadoCita
      ) VALUES (
        :id,
        :mascotaId,
        :veterinarioId,
        :recepcionistaId,
        TO_DATE(:fecha, 'YYYY-MM-DD'),
        NUMTODSINTERVAL(:horaMinutos, 'MINUTE'),
        :motivo,
        :estado
      )
      `,
            {
                id: id.trim(),
                mascotaId: mascotaId.trim(),
                veterinarioId: veterinarioId.trim(),
                recepcionistaId: recepcionistaId.trim(),
                fecha,
                horaMinutos: horaAMinutos(hora),
                motivo: motivo?.trim() || null,
                estado,
            },
            { autoCommit: true }
        );

        res.status(201).json({
            message: "Cita creada correctamente",
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error creando cita");
    } finally {
        if (connection) await connection.close();
    }
});

router.put("/:id", async (req, res) => {
    let connection;

    const id = normalizarId(req.params.id);

    const {
        mascotaId,
        veterinarioId,
        recepcionistaId,
        fecha,
        hora,
        motivo = null,
        estado = "PROGRAMADA",
    } = req.body;

    const errorValidacion = validarCita(
        {
            mascotaId,
            veterinarioId,
            recepcionistaId,
            fecha,
            hora,
            estado,
        },
        false
    );

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
      UPDATE CITA
      SET
        codigoMascota = :mascotaId,
        idVeterinario = :veterinarioId,
        idRecepcionista = :recepcionistaId,
        fecha = TO_DATE(:fecha, 'YYYY-MM-DD'),
        hora = NUMTODSINTERVAL(:horaMinutos, 'MINUTE'),
        motivoConsulta = :motivo,
        estadoCita = :estado
      WHERE TRIM(UPPER(idCita)) = :id
      `,
            {
                id,
                mascotaId: mascotaId.trim(),
                veterinarioId: veterinarioId.trim(),
                recepcionistaId: recepcionistaId.trim(),
                fecha,
                horaMinutos: horaAMinutos(hora),
                motivo: motivo?.trim() || null,
                estado,
            },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                message: "Cita no encontrada",
            });
        }

        res.json({
            message: "Cita actualizada correctamente",
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error actualizando cita");
    } finally {
        if (connection) await connection.close();
    }
});

router.delete("/:id", async (req, res) => {
    let connection;

    const id = normalizarId(req.params.id);

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            DELETE FROM CITA
            WHERE TRIM(UPPER(idCita)) = :id
            `,
            { id },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                message: "Cita no encontrada",
            });
        }

        res.json({
            message: "Cita eliminada correctamente",
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error eliminando cita");
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;