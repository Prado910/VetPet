const express = require("express");
const router = express.Router();
const { getConnection } = require("../db");

const tiposEmpleadoValidos = ["VETERINARIO", "RECEPCIONISTA"];
const estadosLaboralesValidos = ["ACTIVO", "INACTIVO", "SUSPENDIDO"];
const turnosValidos = ["DIURNO", "NOCTURNO"];

function validarFecha(fecha) {
    return /^\d{4}-\d{2}-\d{2}$/.test(fecha || "");
}

function validarEmpleado(
    {
        id,
        nombre,
        fechaIngreso,
        estadoLaboral,
        tipoEmpleado,
        salario,
        turno,
    },
    esCreacion = true
) {
    if (esCreacion && !id?.trim()) {
        return "El ID del empleado es obligatorio.";
    }

    if (!nombre?.trim()) {
        return "El nombre del empleado es obligatorio.";
    }

    if (!fechaIngreso?.trim()) {
        return "La fecha de ingreso es obligatoria.";
    }

    if (!validarFecha(fechaIngreso)) {
        return "La fecha de ingreso debe tener formato YYYY-MM-DD.";
    }

    if (!estadosLaboralesValidos.includes(estadoLaboral)) {
        return "Estado laboral inválido. Usa ACTIVO, INACTIVO o SUSPENDIDO.";
    }

    if (!tiposEmpleadoValidos.includes(tipoEmpleado)) {
        return "Tipo de empleado inválido. Usa VETERINARIO o RECEPCIONISTA.";
    }

    if (salario === null || salario === undefined || salario === "") {
        return "El salario es obligatorio.";
    }

    if (Number(salario) < 0 || Number.isNaN(Number(salario))) {
        return "El salario debe ser un número mayor o igual a cero.";
    }

    if (tipoEmpleado === "RECEPCIONISTA" && !turnosValidos.includes(turno)) {
        return "Turno inválido. Usa DIURNO o NOCTURNO.";
    }

    return null;
}

function manejarErrorOracle(error, res, mensajeBase) {
    console.error(mensajeBase, error);

    if (error.errorNum === 1) {
        return res.status(409).json({
            message: "Ya existe un empleado con ese ID o un dato único repetido.",
            error: error.message,
        });
    }

    if (error.errorNum === 2291) {
        return res.status(400).json({
            message: "El registro relacionado seleccionado no existe.",
            error: error.message,
        });
    }

    if (error.errorNum === 2292) {
        return res.status(409).json({
            message:
                "No se puede eliminar o cambiar el tipo porque el empleado tiene citas, consultas, tratamientos u otros registros relacionados.",
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

router.get("/veterinarios", async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(`
      SELECT
        TRIM(v.idEmpleado) AS "id",
        e.nombreCompleto AS "nombre",
        e.telefono AS "telefono",
        TO_CHAR(e.fechaIngreso, 'YYYY-MM-DD') AS "fechaIngreso",
        e.estadoLaboral AS "estadoLaboral",
        e.salario AS "salario",
        v.especialidad AS "especialidad",
        v.nroMatricula AS "nroMatricula"
      FROM VETERINARIO v
      JOIN EMPLEADO e ON e.idEmpleado = v.idEmpleado
      WHERE e.estadoLaboral = 'ACTIVO'
      ORDER BY e.nombreCompleto
    `);

        res.json(result.rows);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando veterinarios");
    } finally {
        if (connection) await connection.close();
    }
});

router.get("/recepcionistas", async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(`
      SELECT
        TRIM(r.idEmpleado) AS "id",
        e.nombreCompleto AS "nombre",
        e.telefono AS "telefono",
        TO_CHAR(e.fechaIngreso, 'YYYY-MM-DD') AS "fechaIngreso",
        e.estadoLaboral AS "estadoLaboral",
        e.salario AS "salario",
        r.turno AS "turno"
      FROM RECEPCIONISTA r
      JOIN EMPLEADO e ON e.idEmpleado = r.idEmpleado
      WHERE e.estadoLaboral = 'ACTIVO'
      ORDER BY e.nombreCompleto
    `);

        res.json(result.rows);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando recepcionistas");
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
        TRIM(e.idEmpleado) AS "id",
        e.nombreCompleto AS "nombre",
        e.telefono AS "telefono",
        TO_CHAR(e.fechaIngreso, 'YYYY-MM-DD') AS "fechaIngreso",
        e.estadoLaboral AS "estadoLaboral",
        e.tipoEmpleado AS "tipoEmpleado",
        e.salario AS "salario",
        v.especialidad AS "especialidad",
        v.nroMatricula AS "nroMatricula",
        r.turno AS "turno"
      FROM EMPLEADO e
      LEFT JOIN VETERINARIO v ON v.idEmpleado = e.idEmpleado
      LEFT JOIN RECEPCIONISTA r ON r.idEmpleado = e.idEmpleado
      ORDER BY e.nombreCompleto
    `);

        res.json(result.rows);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando empleados");
    } finally {
        if (connection) await connection.close();
    }
});

router.post("/", async (req, res) => {
    let connection;

    const {
        id,
        nombre,
        telefono = null,
        fechaIngreso,
        estadoLaboral = "ACTIVO",
        tipoEmpleado,
        salario,
        especialidad = null,
        nroMatricula = null,
        turno = null,
    } = req.body;

    const errorValidacion = validarEmpleado(
        { id, nombre, fechaIngreso, estadoLaboral, tipoEmpleado, salario, turno },
        true
    );

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        await connection.execute(
            `
      INSERT INTO EMPLEADO (
        idEmpleado,
        nombreCompleto,
        telefono,
        fechaIngreso,
        estadoLaboral,
        tipoEmpleado,
        salario
      ) VALUES (
        :id,
        :nombre,
        :telefono,
        TO_DATE(:fechaIngreso, 'YYYY-MM-DD'),
        :estadoLaboral,
        :tipoEmpleado,
        :salario
      )
      `,
            {
                id: id.trim(),
                nombre: nombre.trim(),
                telefono: telefono?.trim() || null,
                fechaIngreso,
                estadoLaboral,
                tipoEmpleado,
                salario: Number(salario),
            }
        );

        if (tipoEmpleado === "VETERINARIO") {
            await connection.execute(
                `
        INSERT INTO VETERINARIO (idEmpleado, especialidad, nroMatricula)
        VALUES (:id, :especialidad, :nroMatricula)
        `,
                {
                    id: id.trim(),
                    especialidad: especialidad?.trim() || null,
                    nroMatricula: nroMatricula?.trim() || null,
                }
            );
        }

        if (tipoEmpleado === "RECEPCIONISTA") {
            await connection.execute(
                `
        INSERT INTO RECEPCIONISTA (idEmpleado, turno)
        VALUES (:id, :turno)
        `,
                {
                    id: id.trim(),
                    turno,
                }
            );
        }

        await connection.commit();

        res.status(201).json({
            message: "Empleado creado correctamente",
        });
    } catch (error) {
        if (connection) await connection.rollback();
        manejarErrorOracle(error, res, "Error creando empleado");
    } finally {
        if (connection) await connection.close();
    }
});

router.put("/:id", async (req, res) => {
    let connection;

    const id = req.params.id;
    const {
        nombre,
        telefono = null,
        fechaIngreso,
        estadoLaboral = "ACTIVO",
        tipoEmpleado,
        salario,
        especialidad = null,
        nroMatricula = null,
        turno = null,
    } = req.body;

    const errorValidacion = validarEmpleado(
        { nombre, fechaIngreso, estadoLaboral, tipoEmpleado, salario, turno },
        false
    );

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        const empleadoActual = await connection.execute(
            `
      SELECT tipoEmpleado AS "tipoEmpleado"
      FROM EMPLEADO
      WHERE idEmpleado = :id
      `,
            { id }
        );

        if (empleadoActual.rows.length === 0) {
            return res.status(404).json({ message: "Empleado no encontrado" });
        }

        const tipoAnterior = empleadoActual.rows[0].tipoEmpleado;

        const result = await connection.execute(
            `
      UPDATE EMPLEADO
      SET
        nombreCompleto = :nombre,
        telefono = :telefono,
        fechaIngreso = TO_DATE(:fechaIngreso, 'YYYY-MM-DD'),
        estadoLaboral = :estadoLaboral,
        tipoEmpleado = :tipoEmpleado,
        salario = :salario
      WHERE idEmpleado = :id
      `,
            {
                id,
                nombre: nombre.trim(),
                telefono: telefono?.trim() || null,
                fechaIngreso,
                estadoLaboral,
                tipoEmpleado,
                salario: Number(salario),
            }
        );

        if (result.rowsAffected === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Empleado no encontrado" });
        }

        if (tipoAnterior !== tipoEmpleado) {
            if (tipoAnterior === "VETERINARIO") {
                await connection.execute(`DELETE FROM VETERINARIO WHERE idEmpleado = :id`, { id });
            }

            if (tipoAnterior === "RECEPCIONISTA") {
                await connection.execute(`DELETE FROM RECEPCIONISTA WHERE idEmpleado = :id`, { id });
            }

            if (tipoEmpleado === "VETERINARIO") {
                await connection.execute(
                    `
          INSERT INTO VETERINARIO (idEmpleado, especialidad, nroMatricula)
          VALUES (:id, :especialidad, :nroMatricula)
          `,
                    {
                        id,
                        especialidad: especialidad?.trim() || null,
                        nroMatricula: nroMatricula?.trim() || null,
                    }
                );
            }

            if (tipoEmpleado === "RECEPCIONISTA") {
                await connection.execute(
                    `
          INSERT INTO RECEPCIONISTA (idEmpleado, turno)
          VALUES (:id, :turno)
          `,
                    { id, turno }
                );
            }
        } else if (tipoEmpleado === "VETERINARIO") {
            await connection.execute(
                `
        MERGE INTO VETERINARIO v
        USING (
          SELECT :id AS idEmpleado, :especialidad AS especialidad, :nroMatricula AS nroMatricula
          FROM dual
        ) src
        ON (v.idEmpleado = src.idEmpleado)
        WHEN MATCHED THEN UPDATE SET
          v.especialidad = src.especialidad,
          v.nroMatricula = src.nroMatricula
        WHEN NOT MATCHED THEN INSERT (idEmpleado, especialidad, nroMatricula)
          VALUES (src.idEmpleado, src.especialidad, src.nroMatricula)
        `,
                {
                    id,
                    especialidad: especialidad?.trim() || null,
                    nroMatricula: nroMatricula?.trim() || null,
                }
            );
        } else if (tipoEmpleado === "RECEPCIONISTA") {
            await connection.execute(
                `
        MERGE INTO RECEPCIONISTA r
        USING (
          SELECT :id AS idEmpleado, :turno AS turno
          FROM dual
        ) src
        ON (r.idEmpleado = src.idEmpleado)
        WHEN MATCHED THEN UPDATE SET
          r.turno = src.turno
        WHEN NOT MATCHED THEN INSERT (idEmpleado, turno)
          VALUES (src.idEmpleado, src.turno)
        `,
                { id, turno }
            );
        }

        await connection.commit();

        res.json({
            message: "Empleado actualizado correctamente",
        });
    } catch (error) {
        if (connection) await connection.rollback();
        manejarErrorOracle(error, res, "Error actualizando empleado");
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
      DELETE FROM EMPLEADO
      WHERE idEmpleado = :id
      `,
            { id },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                message: "Empleado no encontrado",
            });
        }

        res.json({
            message: "Empleado eliminado correctamente",
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error eliminando empleado");
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;
