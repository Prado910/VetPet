const express = require("express");
const router = express.Router();
const { getConnection } = require("../db");

const {
    cursorToRows,
    outCursor,
    outNumber,
    outString,
    normalizarTexto,
    normalizarId,
    normalizarRows,
} = require("../plsql");

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

    if (error.errorNum === 20001 || error.errorNum === 20999) {
        return res.status(404).json({
            message: "Empleado no encontrado",
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

async function obtenerEmpleado(connection, id) {
    const result = await connection.execute(
        `
        BEGIN
            PKG_PERSONAL.pr_obtener_empleado(
                :p_idEmpleado,
                :p_cursor
            );
        END;
        `,
        {
            p_idEmpleado: id,
            p_cursor: outCursor(),
        }
    );

    const rows = await cursorToRows(result.outBinds.p_cursor);
    return rows[0] || null;
}

async function insertarSubtipoEmpleado(connection, empleado) {
    const {
        id,
        tipoEmpleado,
        especialidad = null,
        nroMatricula = null,
        turno = null,
    } = empleado;

    if (tipoEmpleado === "VETERINARIO") {
        await connection.execute(
            `
            BEGIN
                PKG_PERSONAL.pr_insertar_veterinario(
                    :p_idEmpleado,
                    :p_especialidad,
                    :p_nroMatricula,
                    :p_idEmpleado_out
                );
            END;
            `,
            {
                p_idEmpleado: id,
                p_especialidad: normalizarTexto(especialidad),
                p_nroMatricula: normalizarTexto(nroMatricula),
                p_idEmpleado_out: outString(30),
            }
        );
    }

    if (tipoEmpleado === "RECEPCIONISTA") {
        await connection.execute(
            `
            BEGIN
                PKG_PERSONAL.pr_insertar_recepcionista(
                    :p_idEmpleado,
                    :p_turno,
                    :p_idEmpleado_out
                );
            END;
            `,
            {
                p_idEmpleado: id,
                p_turno: turno,
                p_idEmpleado_out: outString(30),
            }
        );
    }
}

async function modificarSubtipoEmpleado(connection, empleado) {
    const {
        id,
        tipoEmpleado,
        especialidad = null,
        nroMatricula = null,
        turno = null,
    } = empleado;

    if (tipoEmpleado === "VETERINARIO") {
        await connection.execute(
            `
            BEGIN
                PKG_PERSONAL.pr_modificar_veterinario(
                    :p_idEmpleado,
                    :p_especialidad,
                    :p_nroMatricula,
                    :p_filas_afectadas
                );
            END;
            `,
            {
                p_idEmpleado: id,
                p_especialidad: normalizarTexto(especialidad),
                p_nroMatricula: normalizarTexto(nroMatricula),
                p_filas_afectadas: outNumber(),
            }
        );
    }

    if (tipoEmpleado === "RECEPCIONISTA") {
        await connection.execute(
            `
            BEGIN
                PKG_PERSONAL.pr_modificar_recepcionista(
                    :p_idEmpleado,
                    :p_turno,
                    :p_filas_afectadas
                );
            END;
            `,
            {
                p_idEmpleado: id,
                p_turno: turno,
                p_filas_afectadas: outNumber(),
            }
        );
    }
}

async function eliminarSubtipoEmpleado(connection, id, tipoEmpleado) {
    if (tipoEmpleado === "VETERINARIO") {
        await connection.execute(
            `
            BEGIN
                PKG_PERSONAL.pr_eliminar_veterinario(
                    :p_idEmpleado,
                    :p_filas_afectadas
                );
            END;
            `,
            {
                p_idEmpleado: id,
                p_filas_afectadas: outNumber(),
            }
        );
    }

    if (tipoEmpleado === "RECEPCIONISTA") {
        await connection.execute(
            `
            BEGIN
                PKG_PERSONAL.pr_eliminar_recepcionista(
                    :p_idEmpleado,
                    :p_filas_afectadas
                );
            END;
            `,
            {
                p_idEmpleado: id,
                p_filas_afectadas: outNumber(),
            }
        );
    }
}

router.get("/veterinarios", async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_PERSONAL.pr_listar_veterinarios(
                    :p_soloActivos,
                    :p_cursor
                );
            END;
            `,
            {
                p_soloActivos: 1,
                p_cursor: outCursor(),
            }
        );

        const rows = await cursorToRows(result.outBinds.p_cursor);
        res.json(normalizarRows(rows));
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

        const result = await connection.execute(
            `
            BEGIN
                PKG_PERSONAL.pr_listar_recepcionistas(
                    :p_soloActivos,
                    :p_cursor
                );
            END;
            `,
            {
                p_soloActivos: 1,
                p_cursor: outCursor(),
            }
        );

        const rows = await cursorToRows(result.outBinds.p_cursor);
        res.json(normalizarRows(rows));
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

        const result = await connection.execute(
            `
            BEGIN
                PKG_PERSONAL.pr_listar_empleados(:p_cursor);
            END;
            `,
            {
                p_cursor: outCursor(),
            }
        );

        const rows = await cursorToRows(result.outBinds.p_cursor);
        res.json(normalizarRows(rows));
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando empleados");
    } finally {
        if (connection) await connection.close();
    }
});

router.get("/:id", async (req, res) => {
    let connection;

    const id = normalizarId(req.params.id);

    try {
        connection = await getConnection();

        const empleado = await obtenerEmpleado(connection, id);

        if (!empleado) {
            return res.status(404).json({
                message: "Empleado no encontrado",
            });
        }

        res.json(empleado);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando empleado");
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

        const idEmpleado = normalizarId(id);

        await connection.execute(
            `
            BEGIN
                PKG_PERSONAL.pr_insertar_empleado(
                    :p_idEmpleado,
                    :p_nombreCompleto,
                    :p_telefono,
                    TO_DATE(:p_fechaIngreso, 'YYYY-MM-DD'),
                    :p_estadoLaboral,
                    :p_tipoEmpleado,
                    :p_salario,
                    :p_idEmpleado_out
                );
            END;
            `,
            {
                p_idEmpleado: idEmpleado,
                p_nombreCompleto: nombre.trim(),
                p_telefono: normalizarTexto(telefono),
                p_fechaIngreso: fechaIngreso,
                p_estadoLaboral: estadoLaboral,
                p_tipoEmpleado: tipoEmpleado,
                p_salario: Number(salario),
                p_idEmpleado_out: outString(30),
            }
        );

        await insertarSubtipoEmpleado(connection, {
            id: idEmpleado,
            tipoEmpleado,
            especialidad,
            nroMatricula,
            turno,
        });

        await connection.commit();

        res.status(201).json({
            ok: true,
            action: "CREATED",
            message: "Empleado creado correctamente",
            id: idEmpleado,
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

    const id = normalizarId(req.params.id);

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

        const empleadoActual = await obtenerEmpleado(connection, id);

        if (!empleadoActual) {
            return res.status(404).json({
                message: "Empleado no encontrado",
            });
        }

        const tipoAnterior =
            empleadoActual.tipoEmpleado || empleadoActual.TIPOEMPLEADO;

        await connection.execute(
            `
            BEGIN
                PKG_PERSONAL.pr_modificar_empleado(
                    :p_idEmpleado,
                    :p_nombreCompleto,
                    :p_telefono,
                    TO_DATE(:p_fechaIngreso, 'YYYY-MM-DD'),
                    :p_estadoLaboral,
                    :p_tipoEmpleado,
                    :p_salario,
                    :p_filas_afectadas
                );
            END;
            `,
            {
                p_idEmpleado: id,
                p_nombreCompleto: nombre.trim(),
                p_telefono: normalizarTexto(telefono),
                p_fechaIngreso: fechaIngreso,
                p_estadoLaboral: estadoLaboral,
                p_tipoEmpleado: tipoEmpleado,
                p_salario: Number(salario),
                p_filas_afectadas: outNumber(),
            }
        );

        if (tipoAnterior !== tipoEmpleado) {
            await eliminarSubtipoEmpleado(connection, id, tipoAnterior);

            await insertarSubtipoEmpleado(connection, {
                id,
                tipoEmpleado,
                especialidad,
                nroMatricula,
                turno,
            });
        } else {
            await modificarSubtipoEmpleado(connection, {
                id,
                tipoEmpleado,
                especialidad,
                nroMatricula,
                turno,
            });
        }

        await connection.commit();

        res.json({
            ok: true,
            action: "UPDATED",
            message: "Empleado actualizado correctamente",
            id,
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

    const id = normalizarId(req.params.id);

    try {
        connection = await getConnection();

        const empleadoActual = await obtenerEmpleado(connection, id);

        if (!empleadoActual) {
            return res.status(404).json({
                message: "Empleado no encontrado",
            });
        }

        const tipoEmpleado =
            empleadoActual.tipoEmpleado || empleadoActual.TIPOEMPLEADO;

        await eliminarSubtipoEmpleado(connection, id, tipoEmpleado);

        const result = await connection.execute(
            `
            BEGIN
                PKG_PERSONAL.pr_eliminar_empleado(
                    :p_idEmpleado,
                    :p_filas_afectadas
                );
            END;
            `,
            {
                p_idEmpleado: id,
                p_filas_afectadas: outNumber(),
            }
        );

        await connection.commit();

        res.json({
            ok: true,
            action: "DELETED",
            message: "Empleado eliminado correctamente",
            id,
            filasAfectadas: result.outBinds.p_filas_afectadas,
        });
    } catch (error) {
        if (connection) await connection.rollback();
        manejarErrorOracle(error, res, "Error eliminando empleado");
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;