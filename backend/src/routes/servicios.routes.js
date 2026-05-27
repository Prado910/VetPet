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

const tiposServicioValidos = [
    "CONSULTA",
    "PROCEDIMIENTO",
    "TERAPIA",
    "VACUNACION",
    "PLAN_VACUNACION",
    "OTRO",
];

const activosValidos = ["S", "N"];

function validarServicio(
    { id, nombre, tipoServicio, precio, activo },
    esCreacion = true
) {
    if (esCreacion && !id?.trim()) {
        return "El ID del servicio es obligatorio.";
    }

    if (!nombre?.trim()) {
        return "El nombre del servicio es obligatorio.";
    }

    if (!tiposServicioValidos.includes(tipoServicio)) {
        return "Tipo de servicio inválido. Usa CONSULTA, PROCEDIMIENTO, TERAPIA, VACUNACION, PLAN_VACUNACION u OTRO.";
    }

    if (precio === null || precio === undefined || precio === "") {
        return "El precio del servicio es obligatorio.";
    }

    if (Number(precio) < 0 || Number.isNaN(Number(precio))) {
        return "El precio del servicio no puede ser negativo.";
    }

    if (!activosValidos.includes(activo)) {
        return "Estado activo inválido. Usa S o N.";
    }

    return null;
}

function manejarErrorOracle(error, res, mensajeBase) {
    console.error(mensajeBase, error);

    if (error.errorNum === 1) {
        return res.status(409).json({
            message: "Ya existe un servicio con ese ID.",
            error: error.message,
        });
    }

    if (error.errorNum === 20001 || error.errorNum === 20999) {
        return res.status(404).json({
            message: "Servicio no encontrado",
            error: error.message,
        });
    }

    if (error.errorNum === 2292) {
        return res.status(409).json({
            message:
                "No se puede eliminar porque el servicio tiene consultas, tratamientos o facturas relacionadas.",
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

router.get("/", async (req, res) => {
    let connection;

    const soloActivos =
        req.query.activos === "true" ||
        req.query.activos === "S" ||
        req.query.activo === "S";

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_SERVICIOS.pr_listar_servicios(
                    :p_soloActivos,
                    :p_cursor
                );
            END;
            `,
            {
                p_soloActivos: soloActivos ? 1 : 0,
                p_cursor: outCursor(),
            }
        );

        const rows = await cursorToRows(result.outBinds.p_cursor);

        res.json(rows);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando servicios");
    } finally {
        if (connection) await connection.close();
    }
});

router.get("/:id", async (req, res) => {
    let connection;

    const id = normalizarId(req.params.id);

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_SERVICIOS.pr_obtener_servicio(
                    :p_idServicio,
                    :p_cursor
                );
            END;
            `,
            {
                p_idServicio: id,
                p_cursor: outCursor(),
            }
        );

        const rows = await cursorToRows(result.outBinds.p_cursor);

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Servicio no encontrado",
            });
        }

        res.json(rows[0]);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando servicio");
    } finally {
        if (connection) await connection.close();
    }
});

router.post("/", async (req, res) => {
    let connection;

    const {
        id,
        nombre,
        tipoServicio,
        precio,
        descripcion = null,
        activo = "S",
    } = req.body;

    const errorValidacion = validarServicio(
        { id, nombre, tipoServicio, precio, activo },
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
                PKG_SERVICIOS.pr_insertar_servicio(
                    :p_idServicio,
                    :p_nombre,
                    :p_tipoServicio,
                    :p_precio,
                    :p_descripcion,
                    :p_activo,
                    :p_idServ_out
                );
            END;
            `,
            {
                p_idServicio: normalizarId(id),
                p_nombre: nombre.trim(),
                p_tipoServicio: tipoServicio,
                p_precio: Number(precio),
                p_descripcion: normalizarTexto(descripcion),
                p_activo: activo,
                p_idServ_out: outString(30),
            },
            { autoCommit: true }
        );

        res.status(201).json({
            ok: true,
            action: "CREATED",
            message: "Servicio creado correctamente",
            id: result.outBinds.p_idServ_out,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error creando servicio");
    } finally {
        if (connection) await connection.close();
    }
});

router.put("/:id", async (req, res) => {
    let connection;

    const id = normalizarId(req.params.id);

    const {
        nombre,
        tipoServicio,
        precio,
        descripcion = null,
        activo = "S",
    } = req.body;

    const errorValidacion = validarServicio(
        { nombre, tipoServicio, precio, activo },
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
                PKG_SERVICIOS.pr_modificar_servicio(
                    :p_idServicio,
                    :p_nombre,
                    :p_tipoServicio,
                    :p_precio,
                    :p_descripcion,
                    :p_activo,
                    :p_filas_afectadas
                );
            END;
            `,
            {
                p_idServicio: id,
                p_nombre: nombre.trim(),
                p_tipoServicio: tipoServicio,
                p_precio: Number(precio),
                p_descripcion: normalizarTexto(descripcion),
                p_activo: activo,
                p_filas_afectadas: outNumber(),
            },
            { autoCommit: true }
        );

        res.json({
            ok: true,
            action: "UPDATED",
            message: "Servicio actualizado correctamente",
            id,
            filasAfectadas: result.outBinds.p_filas_afectadas,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error actualizando servicio");
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
            BEGIN
                PKG_SERVICIOS.pr_eliminar_servicio(
                    :p_idServicio,
                    :p_filas_afectadas
                );
            END;
            `,
            {
                p_idServicio: id,
                p_filas_afectadas: outNumber(),
            },
            { autoCommit: true }
        );

        res.json({
            ok: true,
            action: "DELETED",
            message: "Servicio eliminado correctamente",
            id,
            filasAfectadas: result.outBinds.p_filas_afectadas,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error eliminando servicio");
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;