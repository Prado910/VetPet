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
} = require("../plsql");

function esFechaValida(fecha) {
    return /^\d{4}-\d{2}-\d{2}$/.test(fecha || "");
}

function validarVacuna(
    { id, nombre, fechaVencimiento, precio },
    esCreacion = true
) {
    if (esCreacion && !id?.trim()) {
        return "El ID de la vacuna es obligatorio.";
    }

    if (!nombre?.trim()) {
        return "El nombre de la vacuna es obligatorio.";
    }

    if (fechaVencimiento && !esFechaValida(fechaVencimiento)) {
        return "La fecha de vencimiento debe tener formato YYYY-MM-DD.";
    }

    if (precio === null || precio === undefined || precio === "") {
        return "El precio de la vacuna es obligatorio.";
    }

    if (Number(precio) < 0 || Number.isNaN(Number(precio))) {
        return "El precio de la vacuna debe ser un número mayor o igual a cero.";
    }

    return null;
}

function validarAplicacionVacuna({
    codigoMascota,
    idVacuna,
    fechaAplicacion,
}) {
    if (!codigoMascota?.trim()) {
        return "La mascota es obligatoria.";
    }

    if (!idVacuna?.trim()) {
        return "La vacuna es obligatoria.";
    }

    if (!fechaAplicacion?.trim()) {
        return "La fecha de aplicación es obligatoria.";
    }

    if (!esFechaValida(fechaAplicacion)) {
        return "La fecha de aplicación debe tener formato YYYY-MM-DD.";
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

    if (error.errorNum === 20001 || error.errorNum === 20999) {
        return res.status(404).json({
            message: "Registro no encontrado.",
            error: error.message,
        });
    }

    if (error.errorNum === 2291) {
        return res.status(400).json({
            message: "La mascota o vacuna seleccionada no existe.",
            error: error.message,
        });
    }

    if (error.errorNum === 2292) {
        return res.status(409).json({
            message:
                "No se puede eliminar porque el registro tiene información relacionada.",
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

    if (error.errorNum === 20004) {
        return res.status(400).json({
            message:
                "La vacuna no corresponde a la especie de la mascota seleccionada.",
            error: error.message,
        });
    }

    return res.status(500).json({
        message: mensajeBase,
        error: error.message,
    });
}

/**
 * GET /api/vacunas/catalogos
 */
router.get("/catalogos", async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_VACUNACION.pr_catalogos_vacunacion(
                    :p_mascotas,
                    :p_vacunas
                );
            END;
            `,
            {
                p_mascotas: outCursor(),
                p_vacunas: outCursor(),
            }
        );

        const mascotas = await cursorToRows(result.outBinds.p_mascotas);
        const vacunas = await cursorToRows(result.outBinds.p_vacunas);

        res.json({
            mascotas,
            vacunas,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando catálogos de vacunas");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * GET /api/vacunas/aplicaciones
 */
router.get("/aplicaciones", async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_VACUNACION.pr_listar_aplicaciones_vacuna(:p_cursor);
            END;
            `,
            {
                p_cursor: outCursor(),
            }
        );

        const rows = await cursorToRows(result.outBinds.p_cursor);

        res.json(rows);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando aplicaciones de vacunas");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * POST /api/vacunas/aplicaciones
 */
router.post("/aplicaciones", async (req, res) => {
    let connection;

    const {
        codigoMascota,
        idVacuna,
        fechaAplicacion,
        observacion = null,
    } = req.body;

    const errorValidacion = validarAplicacionVacuna({
        codigoMascota,
        idVacuna,
        fechaAplicacion,
    });

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        await connection.execute(
            `
            BEGIN
                PKG_VACUNACION.pr_insertar_aplicacion_vacuna(
                    :p_codigoMascota,
                    :p_idVacuna,
                    TO_DATE(:p_fechaAplicacion, 'YYYY-MM-DD'),
                    :p_observacion
                );
            END;
            `,
            {
                p_codigoMascota: normalizarId(codigoMascota),
                p_idVacuna: normalizarId(idVacuna),
                p_fechaAplicacion: fechaAplicacion,
                p_observacion: normalizarTexto(observacion),
            },
            { autoCommit: true }
        );

        res.status(201).json({
            ok: true,
            action: "CREATED",
            message: "Aplicación de vacuna registrada correctamente",
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error registrando aplicación de vacuna");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * PUT /api/vacunas/aplicaciones
 */
router.put("/aplicaciones", async (req, res) => {
    let connection;

    const {
        codigoMascota,
        idVacuna,
        fechaAplicacion,
        observacion = null,
    } = req.body;

    const errorValidacion = validarAplicacionVacuna({
        codigoMascota,
        idVacuna,
        fechaAplicacion,
    });

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_VACUNACION.pr_modificar_aplicacion_vacuna(
                    :p_codigoMascota,
                    :p_idVacuna,
                    TO_DATE(:p_fechaAplicacion, 'YYYY-MM-DD'),
                    :p_observacion,
                    :p_filas_afectadas
                );
            END;
            `,
            {
                p_codigoMascota: normalizarId(codigoMascota),
                p_idVacuna: normalizarId(idVacuna),
                p_fechaAplicacion: fechaAplicacion,
                p_observacion: normalizarTexto(observacion),
                p_filas_afectadas: outNumber(),
            },
            { autoCommit: true }
        );

        res.json({
            ok: true,
            action: "UPDATED",
            message: "Aplicación de vacuna actualizada correctamente",
            filasAfectadas: result.outBinds.p_filas_afectadas,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error actualizando aplicación de vacuna");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * DELETE /api/vacunas/aplicaciones
 */
router.delete("/aplicaciones", async (req, res) => {
    let connection;

    const {
        codigoMascota,
        idVacuna,
        fechaAplicacion,
    } = req.body;

    const errorValidacion = validarAplicacionVacuna({
        codigoMascota,
        idVacuna,
        fechaAplicacion,
    });

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_VACUNACION.pr_eliminar_aplicacion_vacuna(
                    :p_codigoMascota,
                    :p_idVacuna,
                    TO_DATE(:p_fechaAplicacion, 'YYYY-MM-DD'),
                    :p_filas_afectadas
                );
            END;
            `,
            {
                p_codigoMascota: normalizarId(codigoMascota),
                p_idVacuna: normalizarId(idVacuna),
                p_fechaAplicacion: fechaAplicacion,
                p_filas_afectadas: outNumber(),
            },
            { autoCommit: true }
        );

        res.json({
            ok: true,
            action: "DELETED",
            message: "Aplicación de vacuna eliminada correctamente",
            filasAfectadas: result.outBinds.p_filas_afectadas,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error eliminando aplicación de vacuna");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * GET /api/vacunas
 */
router.get("/", async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_INVENTARIO_MEDICO.pr_listar_vacunas(:p_cursor);
            END;
            `,
            {
                p_cursor: outCursor(),
            }
        );

        const rows = await cursorToRows(result.outBinds.p_cursor);

        res.json(rows);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando vacunas");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * GET /api/vacunas/:id
 */
router.get("/:id", async (req, res) => {
    let connection;

    const id = normalizarId(req.params.id);

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_INVENTARIO_MEDICO.pr_obtener_vacuna(
                    :p_idVacuna,
                    :p_cursor
                );
            END;
            `,
            {
                p_idVacuna: id,
                p_cursor: outCursor(),
            }
        );

        const rows = await cursorToRows(result.outBinds.p_cursor);

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Vacuna no encontrada",
            });
        }

        res.json(rows[0]);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando vacuna");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * POST /api/vacunas
 */
router.post("/", async (req, res) => {
    let connection;

    const {
        id,
        nombre,
        laboratorio = null,
        lote = null,
        fechaVencimiento = null,
        especieObjetivo = null,
        precio = 0,
    } = req.body;

    const errorValidacion = validarVacuna(
        { id, nombre, fechaVencimiento, precio },
        true
    );

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_INVENTARIO_MEDICO.pr_insertar_vacuna(
                    :p_idVacuna,
                    :p_nombre,
                    :p_laboratorio,
                    :p_lote,
                    CASE
                        WHEN :p_fechaVencimiento IS NULL THEN NULL
                        ELSE TO_DATE(:p_fechaVencimiento, 'YYYY-MM-DD')
                    END,
                    :p_especieObjetivo,
                    :p_precio,
                    :p_idVacuna_out
                );
            END;
            `,
            {
                p_idVacuna: normalizarId(id),
                p_nombre: nombre.trim(),
                p_laboratorio: normalizarTexto(laboratorio),
                p_lote: normalizarTexto(lote),
                p_fechaVencimiento: normalizarTexto(fechaVencimiento),
                p_especieObjetivo: normalizarTexto(especieObjetivo),
                p_precio: Number(precio),
                p_idVacuna_out: outString(30),
            },
            { autoCommit: true }
        );

        res.status(201).json({
            ok: true,
            action: "CREATED",
            message: "Vacuna creada correctamente",
            id: result.outBinds.p_idVacuna_out,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error creando vacuna");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * PUT /api/vacunas/:id
 */
router.put("/:id", async (req, res) => {
    let connection;

    const id = normalizarId(req.params.id);

    const {
        nombre,
        laboratorio = null,
        lote = null,
        fechaVencimiento = null,
        especieObjetivo = null,
        precio = 0,
    } = req.body;

    const errorValidacion = validarVacuna(
        { nombre, fechaVencimiento, precio },
        false
    );

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_INVENTARIO_MEDICO.pr_modificar_vacuna(
                    :p_idVacuna,
                    :p_nombre,
                    :p_laboratorio,
                    :p_lote,
                    CASE
                        WHEN :p_fechaVencimiento IS NULL THEN NULL
                        ELSE TO_DATE(:p_fechaVencimiento, 'YYYY-MM-DD')
                    END,
                    :p_especieObjetivo,
                    :p_precio,
                    :p_filas_afectadas
                );
            END;
            `,
            {
                p_idVacuna: id,
                p_nombre: nombre.trim(),
                p_laboratorio: normalizarTexto(laboratorio),
                p_lote: normalizarTexto(lote),
                p_fechaVencimiento: normalizarTexto(fechaVencimiento),
                p_especieObjetivo: normalizarTexto(especieObjetivo),
                p_precio: Number(precio),
                p_filas_afectadas: outNumber(),
            },
            { autoCommit: true }
        );

        res.json({
            ok: true,
            action: "UPDATED",
            message: "Vacuna actualizada correctamente",
            id,
            filasAfectadas: result.outBinds.p_filas_afectadas,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error actualizando vacuna");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * DELETE /api/vacunas/:id
 */
router.delete("/:id", async (req, res) => {
    let connection;

    const id = normalizarId(req.params.id);

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_INVENTARIO_MEDICO.pr_eliminar_vacuna(
                    :p_idVacuna,
                    :p_filas_afectadas
                );
            END;
            `,
            {
                p_idVacuna: id,
                p_filas_afectadas: outNumber(),
            },
            { autoCommit: true }
        );

        res.json({
            ok: true,
            action: "DELETED",
            message: "Vacuna eliminada correctamente",
            id,
            filasAfectadas: result.outBinds.p_filas_afectadas,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error eliminando vacuna");
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;