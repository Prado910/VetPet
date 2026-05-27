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

const estadosPagoValidos = ["PENDIENTE", "PAGADA", "ANULADA"];

const tiposConceptoValidos = [
    "CONSULTA",
    "MEDICAMENTO",
    "VACUNA",
    "PROCEDIMIENTO",
    "OTRO",
];

function esFechaValida(fecha) {
    return /^\d{4}-\d{2}-\d{2}$/.test(fecha || "");
}

function normalizarNumero(valor) {
    if (valor === null || valor === undefined || valor === "") return null;

    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : NaN;
}

function validarFactura({ idConsulta, fecha, estadoPago }) {
    if (!idConsulta?.trim()) return "La consulta es obligatoria.";

    if (!fecha?.trim()) return "La fecha de la factura es obligatoria.";

    if (!esFechaValida(fecha)) {
        return "La fecha debe tener formato YYYY-MM-DD.";
    }

    if (!estadosPagoValidos.includes(estadoPago)) {
        return "Estado de pago inválido. Usa PENDIENTE, PAGADA o ANULADA.";
    }

    return null;
}

function validarDetalle({ descripcion, tipoConcepto, cantidad, precioUnitario }) {
    if (!descripcion?.trim()) return "La descripción del detalle es obligatoria.";

    if (!tiposConceptoValidos.includes(tipoConcepto)) {
        return "Tipo de concepto inválido. Usa CONSULTA, MEDICAMENTO, VACUNA, PROCEDIMIENTO u OTRO.";
    }

    const cantidadNumero = normalizarNumero(cantidad);
    const precioNumero = normalizarNumero(precioUnitario);

    if (Number.isNaN(cantidadNumero) || cantidadNumero === null) {
        return "La cantidad debe ser un número válido.";
    }

    if (!Number.isInteger(cantidadNumero) || cantidadNumero <= 0) {
        return "La cantidad debe ser un entero mayor que cero.";
    }

    if (Number.isNaN(precioNumero) || precioNumero === null) {
        return "El precio unitario debe ser un número válido.";
    }

    if (precioNumero < 0) {
        return "El precio unitario no puede ser negativo.";
    }

    return null;
}

function manejarErrorOracle(error, res, mensajeBase) {
    console.error(mensajeBase, error);

    if (error.errorNum === 1) {
        return res.status(409).json({
            message:
                "Ya existe una factura para esa consulta o un registro con ese ID.",
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
            message: "La consulta, cliente o factura seleccionada no existe.",
            error: error.message,
        });
    }

    if (error.errorNum === 2292) {
        return res.status(409).json({
            message:
                "No se puede eliminar porque la factura tiene detalles u otros registros relacionados.",
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

async function obtenerConsultaParaFactura(connection, idConsulta) {
    const result = await connection.execute(
        `
        BEGIN
            PKG_FACTURACION.pr_obtener_consulta_facturacion(
                :p_idConsulta,
                :p_cursor
            );
        END;
        `,
        {
            p_idConsulta: normalizarId(idConsulta),
            p_cursor: outCursor(),
        }
    );

    const rows = await cursorToRows(result.outBinds.p_cursor);
    return rows[0] || null;
}

async function recalcularTotalFactura(connection, idFactura) {
    await connection.execute(
        `
        BEGIN
            PKG_FACTURACION.pr_recalcular_total_factura(
                :p_idFactura,
                :p_filas_afectadas
            );
        END;
        `,
        {
            p_idFactura: normalizarId(idFactura),
            p_filas_afectadas: outNumber(),
        }
    );

    const result = await connection.execute(
        `
        BEGIN
            :p_total := PKG_FACTURACION.fn_total_factura(:p_idFactura);
        END;
        `,
        {
            p_idFactura: normalizarId(idFactura),
            p_total: outNumber(),
        }
    );

    return result.outBinds.p_total || 0;
}

/**
 * GET /api/facturas/catalogos
 */
router.get("/catalogos", async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_FACTURACION.pr_catalogos_facturacion(:p_consultas);
            END;
            `,
            {
                p_consultas: outCursor(),
            }
        );

        const consultasDisponibles = await cursorToRows(result.outBinds.p_consultas);

        res.json({
            consultasDisponibles,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando catálogos de facturación");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * GET /api/facturas
 */
router.get("/", async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_FACTURACION.pr_listar_facturas(:p_cursor);
            END;
            `,
            {
                p_cursor: outCursor(),
            }
        );

        const rows = await cursorToRows(result.outBinds.p_cursor);

        res.json(normalizarRows(rows));
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando facturas");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * GET /api/facturas/:id
 */
router.get("/:id", async (req, res) => {
    let connection;

    const id = normalizarId(req.params.id);

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_FACTURACION.pr_obtener_factura(
                    :p_idFactura,
                    :p_cursor
                );
            END;
            `,
            {
                p_idFactura: id,
                p_cursor: outCursor(),
            }
        );

        const rows = await cursorToRows(result.outBinds.p_cursor);

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Factura no encontrada",
            });
        }

        res.json(normalizarRows(rows)[0]);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando factura");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * POST /api/facturas
 */
router.post("/", async (req, res) => {
    let connection;

    const {
        id = null,
        idConsulta,
        fecha,
        metodoPago = null,
        estadoPago = "PENDIENTE",
        crearDetalleConsulta = true,
    } = req.body;

    const errorValidacion = validarFactura({ idConsulta, fecha, estadoPago });

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        const consulta = await obtenerConsultaParaFactura(connection, idConsulta);

        if (!consulta) {
            return res.status(404).json({
                message: "Consulta no encontrada",
            });
        }

        const result = await connection.execute(
            `
            BEGIN
                PKG_FACTURACION.pr_insertar_factura(
                    :p_idFactura,
                    :p_idConsulta,
                    :p_idCliente,
                    TO_DATE(:p_fecha, 'YYYY-MM-DD'),
                    :p_valorTotal,
                    :p_metodoPago,
                    :p_estadoPago,
                    :p_idFactura_out
                );
            END;
            `,
            {
                p_idFactura: normalizarTexto(id),
                p_idConsulta: consulta.idConsulta || consulta.IDCONSULTA,
                p_idCliente: consulta.idCliente || consulta.IDCLIENTE,
                p_fecha: fecha,
                p_valorTotal: 0,
                p_metodoPago: normalizarTexto(metodoPago),
                p_estadoPago: estadoPago,
                p_idFactura_out: outString(30),
            }
        );

        const idFactura = result.outBinds.p_idFactura_out;

        if (crearDetalleConsulta && Number(consulta.servicioPrecio || consulta.SERVICIOPRECIO || 0) >= 0) {
            await connection.execute(
                `
                BEGIN
                    PKG_FACTURACION.pr_insertar_detalle_factura(
                        :p_idDetalle,
                        :p_idFactura,
                        :p_descripcion,
                        :p_tipoConcepto,
                        :p_cantidad,
                        :p_precioUnitario,
                        :p_idDetalle_out
                    );
                END;
                `,
                {
                    p_idDetalle: null,
                    p_idFactura: idFactura,
                    p_descripcion: `Consulta veterinaria - ${consulta.servicioNombre || consulta.SERVICIONOMBRE}`,
                    p_tipoConcepto: "CONSULTA",
                    p_cantidad: 1,
                    p_precioUnitario: Number(consulta.servicioPrecio || consulta.SERVICIOPRECIO || 0),
                    p_idDetalle_out: outString(30),
                }
            );
        }

        const valorTotal = await recalcularTotalFactura(connection, idFactura);

        await connection.commit();

        res.status(201).json({
            ok: true,
            action: "CREATED",
            message: "Factura creada correctamente",
            id: idFactura,
            valorTotal,
        });
    } catch (error) {
        if (connection) await connection.rollback();
        manejarErrorOracle(error, res, "Error creando factura");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * PUT /api/facturas/:id
 */
router.put("/:id", async (req, res) => {
    let connection;

    const id = normalizarId(req.params.id);

    const {
        idConsulta,
        fecha,
        metodoPago = null,
        estadoPago = "PENDIENTE",
    } = req.body;

    const errorValidacion = validarFactura({ idConsulta, fecha, estadoPago });

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        const consulta = await obtenerConsultaParaFactura(connection, idConsulta);

        if (!consulta) {
            return res.status(404).json({
                message: "Consulta no encontrada",
            });
        }

        const valorTotalActual = await recalcularTotalFactura(connection, id);

        const result = await connection.execute(
            `
            BEGIN
                PKG_FACTURACION.pr_modificar_factura(
                    :p_idFactura,
                    :p_idConsulta,
                    :p_idCliente,
                    TO_DATE(:p_fecha, 'YYYY-MM-DD'),
                    :p_valorTotal,
                    :p_metodoPago,
                    :p_estadoPago,
                    :p_filas_afectadas
                );
            END;
            `,
            {
                p_idFactura: id,
                p_idConsulta: consulta.idConsulta || consulta.IDCONSULTA,
                p_idCliente: consulta.idCliente || consulta.IDCLIENTE,
                p_fecha: fecha,
                p_valorTotal: valorTotalActual,
                p_metodoPago: normalizarTexto(metodoPago),
                p_estadoPago: estadoPago,
                p_filas_afectadas: outNumber(),
            }
        );

        const valorTotal = await recalcularTotalFactura(connection, id);

        await connection.commit();

        res.json({
            ok: true,
            action: "UPDATED",
            message: "Factura actualizada correctamente",
            id,
            filasAfectadas: result.outBinds.p_filas_afectadas,
            valorTotal,
        });
    } catch (error) {
        if (connection) await connection.rollback();
        manejarErrorOracle(error, res, "Error actualizando factura");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * DELETE /api/facturas/:id
 */
router.delete("/:id", async (req, res) => {
    let connection;

    const id = normalizarId(req.params.id);

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_FACTURACION.pr_eliminar_factura(
                    :p_idFactura,
                    :p_filas_afectadas
                );
            END;
            `,
            {
                p_idFactura: id,
                p_filas_afectadas: outNumber(),
            },
            { autoCommit: true }
        );

        res.json({
            ok: true,
            action: "DELETED",
            message: "Factura eliminada correctamente",
            id,
            filasAfectadas: result.outBinds.p_filas_afectadas,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error eliminando factura");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * GET /api/facturas/:id/detalles
 */
router.get("/:id/detalles", async (req, res) => {
    let connection;

    const idFactura = normalizarId(req.params.id);

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_FACTURACION.pr_listar_detalles_factura(
                    :p_idFactura,
                    :p_cursor
                );
            END;
            `,
            {
                p_idFactura: idFactura,
                p_cursor: outCursor(),
            }
        );

        const rows = await cursorToRows(result.outBinds.p_cursor);

        res.json(normalizarRows(rows));
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando detalles de factura");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * POST /api/facturas/:id/detalles
 */
router.post("/:id/detalles", async (req, res) => {
    let connection;

    const idFactura = normalizarId(req.params.id);

    const {
        id = null,
        descripcion,
        tipoConcepto = "OTRO",
        cantidad = 1,
        precioUnitario = 0,
    } = req.body;

    const errorValidacion = validarDetalle({
        descripcion,
        tipoConcepto,
        cantidad,
        precioUnitario,
    });

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_FACTURACION.pr_insertar_detalle_factura(
                    :p_idDetalle,
                    :p_idFactura,
                    :p_descripcion,
                    :p_tipoConcepto,
                    :p_cantidad,
                    :p_precioUnitario,
                    :p_idDetalle_out
                );
            END;
            `,
            {
                p_idDetalle: normalizarTexto(id),
                p_idFactura: idFactura,
                p_descripcion: descripcion.trim(),
                p_tipoConcepto: tipoConcepto,
                p_cantidad: Number(cantidad),
                p_precioUnitario: Number(precioUnitario),
                p_idDetalle_out: outString(30),
            }
        );

        const valorTotal = await recalcularTotalFactura(connection, idFactura);

        await connection.commit();

        res.status(201).json({
            ok: true,
            action: "CREATED",
            message: "Detalle agregado correctamente",
            id: result.outBinds.p_idDetalle_out,
            valorTotal,
        });
    } catch (error) {
        if (connection) await connection.rollback();
        manejarErrorOracle(error, res, "Error agregando detalle de factura");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * PUT /api/facturas/:id/detalles/:idDetalle
 */
router.put("/:id/detalles/:idDetalle", async (req, res) => {
    let connection;

    const idFactura = normalizarId(req.params.id);
    const idDetalle = normalizarId(req.params.idDetalle);

    const {
        descripcion,
        tipoConcepto = "OTRO",
        cantidad = 1,
        precioUnitario = 0,
    } = req.body;

    const errorValidacion = validarDetalle({
        descripcion,
        tipoConcepto,
        cantidad,
        precioUnitario,
    });

    if (errorValidacion) {
        return res.status(400).json({ message: errorValidacion });
    }

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_FACTURACION.pr_modificar_detalle_factura(
                    :p_idDetalle,
                    :p_idFactura,
                    :p_descripcion,
                    :p_tipoConcepto,
                    :p_cantidad,
                    :p_precioUnitario,
                    :p_filas_afectadas
                );
            END;
            `,
            {
                p_idDetalle: idDetalle,
                p_idFactura: idFactura,
                p_descripcion: descripcion.trim(),
                p_tipoConcepto: tipoConcepto,
                p_cantidad: Number(cantidad),
                p_precioUnitario: Number(precioUnitario),
                p_filas_afectadas: outNumber(),
            }
        );

        const valorTotal = await recalcularTotalFactura(connection, idFactura);

        await connection.commit();

        res.json({
            ok: true,
            action: "UPDATED",
            message: "Detalle actualizado correctamente",
            id: idDetalle,
            filasAfectadas: result.outBinds.p_filas_afectadas,
            valorTotal,
        });
    } catch (error) {
        if (connection) await connection.rollback();
        manejarErrorOracle(error, res, "Error actualizando detalle de factura");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * DELETE /api/facturas/:id/detalles/:idDetalle
 */
router.delete("/:id/detalles/:idDetalle", async (req, res) => {
    let connection;

    const idFactura = normalizarId(req.params.id);
    const idDetalle = normalizarId(req.params.idDetalle);

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
            BEGIN
                PKG_FACTURACION.pr_eliminar_detalle_factura(
                    :p_idDetalle,
                    :p_filas_afectadas
                );
            END;
            `,
            {
                p_idDetalle: idDetalle,
                p_filas_afectadas: outNumber(),
            }
        );

        const valorTotal = await recalcularTotalFactura(connection, idFactura);

        await connection.commit();

        res.json({
            ok: true,
            action: "DELETED",
            message: "Detalle eliminado correctamente",
            id: idDetalle,
            filasAfectadas: result.outBinds.p_filas_afectadas,
            valorTotal,
        });
    } catch (error) {
        if (connection) await connection.rollback();
        manejarErrorOracle(error, res, "Error eliminando detalle de factura");
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * POST /api/facturas/:id/recalcular
 */
router.post("/:id/recalcular", async (req, res) => {
    let connection;

    const idFactura = normalizarId(req.params.id);

    try {
        connection = await getConnection();

        const valorTotal = await recalcularTotalFactura(connection, idFactura);

        await connection.commit();

        res.json({
            ok: true,
            message: "Total recalculado correctamente",
            id: idFactura,
            valorTotal,
        });
    } catch (error) {
        if (connection) await connection.rollback();
        manejarErrorOracle(error, res, "Error recalculando total de factura");
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;