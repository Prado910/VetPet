const express = require("express");
const oracledb = require("oracledb");
const router = express.Router();
const { getConnection } = require("../db");

const estadosValidos = ["ACTIVO", "INACTIVO", "SUSPENDIDO"];

function normalizarId(valor) {
    return String(valor || "").trim().toUpperCase();
}

function normalizarTexto(valor) {
    if (valor === null || valor === undefined) return null;

    const texto = String(valor).trim();
    return texto === "" ? null : texto;
}

function validarCliente({ id, nombre, estado }, esCreacion = true) {
    if (esCreacion && !id?.trim()) {
        return "El ID del cliente es obligatorio.";
    }

    if (!nombre?.trim()) {
        return "El nombre del cliente es obligatorio.";
    }

    if (estado && !estadosValidos.includes(estado)) {
        return "Estado inválido. Usa ACTIVO, INACTIVO o SUSPENDIDO.";
    }

    return null;
}

async function cursorToRows(cursor) {
    const rows = [];

    try {
        let row;

        while ((row = await cursor.getRow())) {
            rows.push(row);
        }

        return rows;
    } finally {
        if (cursor) {
            await cursor.close();
        }
    }
}

function mapCliente(row) {
    return {
        id: row.id || row.ID,
        nombre: row.nombre || row.NOMBRE,
        direccion: row.direccion || row.DIRECCION || null,
        email: row.email || row.EMAIL || null,
        telefono: row.telefono || row.TELEFONO || null,
        estado: row.estado || row.ESTADO,
    };
}

function manejarErrorOracle(error, res, mensajeBase) {
    console.error(mensajeBase, error);

    if (error.errorNum === 1) {
        return res.status(409).json({
            message: "Ya existe un cliente con ese ID.",
            error: error.message,
        });
    }

    if (error.errorNum === 20001) {
        return res.status(404).json({
            message: "Cliente no encontrado",
            error: error.message,
        });
    }

    if (error.errorNum === 2292) {
        return res.status(409).json({
            message: "No se puede eliminar porque el cliente tiene información relacionada.",
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

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_PERSONAL.pr_listar_clientes(:p_cursor);
            END;
            `,
            {
                p_cursor: {
                    dir: oracledb.BIND_OUT,
                    type: oracledb.CURSOR,
                },
            }
        );

        const rows = await cursorToRows(result.outBinds.p_cursor);
        const clientes = rows.map(mapCliente);

        res.json(clientes);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando clientes");
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
                PKG_PERSONAL.pr_obtener_cliente(
                    :p_idCliente,
                    :p_cursor
                );
            END;
            `,
            {
                p_idCliente: id,
                p_cursor: {
                    dir: oracledb.BIND_OUT,
                    type: oracledb.CURSOR,
                },
            }
        );

        const rows = await cursorToRows(result.outBinds.p_cursor);
        const clientes = rows.map(mapCliente);

        if (clientes.length === 0) {
            return res.status(404).json({
                message: "Cliente no encontrado",
            });
        }

        res.json(clientes[0]);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando cliente");
    } finally {
        if (connection) await connection.close();
    }
});

router.post("/", async (req, res) => {
    let connection;

    const {
        id,
        nombre,
        direccion = null,
        email = null,
        telefono = null,
        estado = "ACTIVO",
    } = req.body;

    const errorValidacion = validarCliente({ id, nombre, estado }, true);

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_PERSONAL.pr_insertar_cliente(
                    :p_idCliente,
                    :p_nombreCompleto,
                    :p_direccion,
                    :p_correoElectronico,
                    :p_telefono,
                    :p_estado,
                    :p_idCliente_out
                );
            END;
            `,
            {
                p_idCliente: normalizarId(id),
                p_nombreCompleto: nombre.trim(),
                p_direccion: normalizarTexto(direccion),
                p_correoElectronico: normalizarTexto(email),
                p_telefono: normalizarTexto(telefono),
                p_estado: estado,
                p_idCliente_out: {
                    dir: oracledb.BIND_OUT,
                    type: oracledb.STRING,
                    maxSize: 30,
                },
            },
            {
                autoCommit: true,
            }
        );

        const idClienteCreado = result.outBinds.p_idCliente_out;

        res.status(201).json({
            ok: true,
            action: "CREATED",
            message: `Cliente ${idClienteCreado} creado correctamente.`,
            id: idClienteCreado,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error creando cliente");
    } finally {
        if (connection) await connection.close();
    }
});

router.put("/:id", async (req, res) => {
    let connection;

    const id = normalizarId(req.params.id);

    const {
        nombre,
        direccion = null,
        email = null,
        telefono = null,
        estado = "ACTIVO",
    } = req.body;

    const errorValidacion = validarCliente({ nombre, estado }, false);

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_PERSONAL.pr_modificar_cliente(
                    :p_idCliente,
                    :p_nombreCompleto,
                    :p_direccion,
                    :p_correoElectronico,
                    :p_telefono,
                    :p_estado,
                    :p_filas_afectadas
                );
            END;
            `,
            {
                p_idCliente: id,
                p_nombreCompleto: nombre.trim(),
                p_direccion: normalizarTexto(direccion),
                p_correoElectronico: normalizarTexto(email),
                p_telefono: normalizarTexto(telefono),
                p_estado: estado,
                p_filas_afectadas: {
                    dir: oracledb.BIND_OUT,
                    type: oracledb.NUMBER,
                },
            },
            {
                autoCommit: true,
            }
        );

        const filasAfectadas = result.outBinds.p_filas_afectadas;

        res.json({
            ok: true,
            action: "UPDATED",
            message: `Cliente ${id} actualizado correctamente.`,
            id,
            filasAfectadas,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error actualizando cliente");
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
                PKG_PERSONAL.pr_eliminar_cliente(
                    :p_idCliente,
                    :p_filas_afectadas
                );
            END;
            `,
            {
                p_idCliente: id,
                p_filas_afectadas: {
                    dir: oracledb.BIND_OUT,
                    type: oracledb.NUMBER,
                },
            },
            {
                autoCommit: true,
            }
        );

        const filasAfectadas = result.outBinds.p_filas_afectadas;

        res.json({
            ok: true,
            action: "DELETED",
            message: `Cliente ${id} eliminado correctamente.`,
            id,
            filasAfectadas,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error eliminando cliente");
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;