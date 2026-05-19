const express = require("express");
const router = express.Router();
const { getConnection } = require("../db");

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

function normalizarTexto(valor) {
    return valor?.trim() || null;
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

async function generarIdFactura(connection) {
    const result = await connection.execute(`
    SELECT
      'FAC' ||
      LPAD(
        NVL(MAX(TO_NUMBER(REGEXP_SUBSTR(TRIM(idFactura), '[0-9]+$'))), 0) + 1,
        6,
        '0'
      ) AS "id"
    FROM FACTURA
    WHERE REGEXP_LIKE(TRIM(idFactura), '^FAC[0-9]+$')
  `);

    return result.rows[0].id;
}

async function generarIdDetalle(connection) {
    const result = await connection.execute(`
    SELECT
      'DET' ||
      LPAD(
        NVL(MAX(TO_NUMBER(REGEXP_SUBSTR(TRIM(idDetalle), '[0-9]+$'))), 0) + 1,
        8,
        '0'
      ) AS "id"
    FROM DETALLE_FACTURA
    WHERE REGEXP_LIKE(TRIM(idDetalle), '^DET[0-9]+$')
  `);

    return result.rows[0].id;
}

async function recalcularTotalFactura(connection, idFactura) {
    await connection.execute(
        `
    UPDATE FACTURA f
    SET valorTotal = (
      SELECT NVL(SUM(d.cantidad * d.precioUnitario), 0)
      FROM DETALLE_FACTURA d
      WHERE d.idFactura = f.idFactura
    )
    WHERE f.idFactura = :idFactura
    `,
        { idFactura }
    );

    const result = await connection.execute(
        `
    SELECT valorTotal AS "valorTotal"
    FROM FACTURA
    WHERE idFactura = :idFactura
    `,
        { idFactura }
    );

    return result.rows[0]?.valorTotal || 0;
}

async function obtenerConsultaParaFactura(connection, idConsulta) {
    const result = await connection.execute(
        `
    SELECT
      TRIM(cv.idConsulta) AS "idConsulta",
      TRIM(ci.idCita) AS "idCita",
      TRIM(cl.idCliente) AS "idCliente",
      cl.nombreCompleto AS "clienteNombre",
      ma.nombre AS "mascotaNombre",
      ma.especie AS "mascotaEspecie",
      cs.nombre AS "servicioNombre",
      cs.precio AS "servicioPrecio"
    FROM CONSULTA_VETERINARIA cv
    JOIN CITA ci ON ci.idCita = cv.idCita
    JOIN MASCOTA ma ON ma.codigoMascota = ci.codigoMascota
    JOIN CLIENTE cl ON cl.idCliente = ma.idCliente
    JOIN CATALOGO_SERVICIOS cs ON cs.idServicio = cv.idServicio
    WHERE cv.idConsulta = :idConsulta
    `,
        { idConsulta }
    );

    return result.rows[0] || null;
}

router.get("/catalogos", async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const consultasResult = await connection.execute(`
      SELECT
        TRIM(cv.idConsulta) AS "id",
        TRIM(ci.idCita) AS "idCita",
        TO_CHAR(cv.fechaAtencionReal, 'YYYY-MM-DD') AS "fechaAtencionReal",
        TRIM(cl.idCliente) AS "clienteId",
        cl.nombreCompleto AS "clienteNombre",
        cl.telefono AS "clienteTelefono",
        TRIM(ma.codigoMascota) AS "mascotaId",
        ma.nombre AS "mascotaNombre",
        ma.especie AS "mascotaEspecie",
        TRIM(cs.idServicio) AS "servicioId",
        cs.nombre AS "servicioNombre",
        cs.tipoServicio AS "servicioTipo",
        cs.precio AS "servicioPrecio"
      FROM CONSULTA_VETERINARIA cv
      JOIN CITA ci ON ci.idCita = cv.idCita
      JOIN MASCOTA ma ON ma.codigoMascota = ci.codigoMascota
      JOIN CLIENTE cl ON cl.idCliente = ma.idCliente
      JOIN CATALOGO_SERVICIOS cs ON cs.idServicio = cv.idServicio
      WHERE NOT EXISTS (
        SELECT 1
        FROM FACTURA f
        WHERE f.idConsulta = cv.idConsulta
      )
      ORDER BY cv.fechaAtencionReal DESC
    `);

        res.json({
            consultasDisponibles: consultasResult.rows,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando catálogos de facturación");
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
        TRIM(f.idFactura) AS "id",
        TRIM(f.idConsulta) AS "idConsulta",
        TRIM(f.idCliente) AS "idCliente",
        TO_CHAR(f.fecha, 'YYYY-MM-DD') AS "fecha",
        f.valorTotal AS "valorTotal",
        f.metodoPago AS "metodoPago",
        f.estadoPago AS "estadoPago",

        cl.nombreCompleto AS "clienteNombre",
        cl.telefono AS "clienteTelefono",
        cl.correoElectronico AS "clienteEmail",

        TRIM(ci.idCita) AS "idCita",
        TO_CHAR(cv.fechaAtencionReal, 'YYYY-MM-DD') AS "fechaAtencionReal",

        TRIM(ma.codigoMascota) AS "mascotaId",
        ma.nombre AS "mascotaNombre",
        ma.especie AS "mascotaEspecie",

        cs.nombre AS "servicioNombre",
        cs.tipoServicio AS "servicioTipo",
        cs.precio AS "servicioPrecio",

        (
          SELECT COUNT(*)
          FROM DETALLE_FACTURA d
          WHERE d.idFactura = f.idFactura
        ) AS "detallesCount",

        (
          SELECT NVL(SUM(d.cantidad * d.precioUnitario), 0)
          FROM DETALLE_FACTURA d
          WHERE d.idFactura = f.idFactura
        ) AS "totalCalculado"
      FROM FACTURA f
      JOIN CLIENTE cl ON cl.idCliente = f.idCliente
      JOIN CONSULTA_VETERINARIA cv ON cv.idConsulta = f.idConsulta
      JOIN CITA ci ON ci.idCita = cv.idCita
      JOIN MASCOTA ma ON ma.codigoMascota = ci.codigoMascota
      JOIN CATALOGO_SERVICIOS cs ON cs.idServicio = cv.idServicio
      ORDER BY f.fecha DESC, f.idFactura DESC
    `);

        res.json(result.rows);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando facturas");
    } finally {
        if (connection) await connection.close();
    }
});

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

        const consulta = await obtenerConsultaParaFactura(
            connection,
            idConsulta.trim()
        );

        if (!consulta) {
            return res.status(404).json({
                message: "Consulta no encontrada",
            });
        }

        const idFactura = normalizarTexto(id) || (await generarIdFactura(connection));

        await connection.execute(
            `
      INSERT INTO FACTURA (
        idFactura,
        idConsulta,
        idCliente,
        fecha,
        valorTotal,
        metodoPago,
        estadoPago
      ) VALUES (
        :idFactura,
        :idConsulta,
        :idCliente,
        TO_DATE(:fecha, 'YYYY-MM-DD'),
        0,
        :metodoPago,
        :estadoPago
      )
      `,
            {
                idFactura,
                idConsulta: consulta.idConsulta,
                idCliente: consulta.idCliente,
                fecha,
                metodoPago: normalizarTexto(metodoPago),
                estadoPago,
            }
        );

        if (crearDetalleConsulta && Number(consulta.servicioPrecio || 0) >= 0) {
            const idDetalle = await generarIdDetalle(connection);

            await connection.execute(
                `
        INSERT INTO DETALLE_FACTURA (
          idDetalle,
          idFactura,
          descripcion,
          tipoConcepto,
          cantidad,
          precioUnitario
        ) VALUES (
          :idDetalle,
          :idFactura,
          :descripcion,
          'CONSULTA',
          1,
          :precioUnitario
        )
        `,
                {
                    idDetalle,
                    idFactura,
                    descripcion: `Consulta veterinaria - ${consulta.servicioNombre}`,
                    precioUnitario: Number(consulta.servicioPrecio || 0),
                }
            );
        }

        const valorTotal = await recalcularTotalFactura(connection, idFactura);

        await connection.commit();

        res.status(201).json({
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

router.put("/:id", async (req, res) => {
    let connection;

    const id = req.params.id;
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

        const consulta = await obtenerConsultaParaFactura(
            connection,
            idConsulta.trim()
        );

        if (!consulta) {
            return res.status(404).json({
                message: "Consulta no encontrada",
            });
        }

        const result = await connection.execute(
            `
      UPDATE FACTURA
      SET
        idConsulta = :idConsulta,
        idCliente = :idCliente,
        fecha = TO_DATE(:fecha, 'YYYY-MM-DD'),
        metodoPago = :metodoPago,
        estadoPago = :estadoPago
      WHERE idFactura = :id
      `,
            {
                id,
                idConsulta: consulta.idConsulta,
                idCliente: consulta.idCliente,
                fecha,
                metodoPago: normalizarTexto(metodoPago),
                estadoPago,
            }
        );

        if (result.rowsAffected === 0) {
            await connection.rollback();
            return res.status(404).json({
                message: "Factura no encontrada",
            });
        }

        const valorTotal = await recalcularTotalFactura(connection, id);

        await connection.commit();

        res.json({
            message: "Factura actualizada correctamente",
            valorTotal,
        });
    } catch (error) {
        if (connection) await connection.rollback();
        manejarErrorOracle(error, res, "Error actualizando factura");
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
      DELETE FROM FACTURA
      WHERE idFactura = :id
      `,
            { id },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                message: "Factura no encontrada",
            });
        }

        res.json({
            message: "Factura eliminada correctamente",
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error eliminando factura");
    } finally {
        if (connection) await connection.close();
    }
});

router.get("/:id/detalles", async (req, res) => {
    let connection;

    const idFactura = req.params.id;

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
      SELECT
        TRIM(idDetalle) AS "id",
        TRIM(idFactura) AS "idFactura",
        descripcion AS "descripcion",
        tipoConcepto AS "tipoConcepto",
        cantidad AS "cantidad",
        precioUnitario AS "precioUnitario",
        cantidad * precioUnitario AS "subtotal"
      FROM DETALLE_FACTURA
      WHERE idFactura = :idFactura
      ORDER BY tipoConcepto, descripcion
      `,
            { idFactura }
        );

        res.json(result.rows);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando detalles de factura");
    } finally {
        if (connection) await connection.close();
    }
});

router.post("/:id/detalles", async (req, res) => {
    let connection;

    const idFactura = req.params.id;
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

        const idDetalle = normalizarTexto(id) || (await generarIdDetalle(connection));

        await connection.execute(
            `
      INSERT INTO DETALLE_FACTURA (
        idDetalle,
        idFactura,
        descripcion,
        tipoConcepto,
        cantidad,
        precioUnitario
      ) VALUES (
        :idDetalle,
        :idFactura,
        :descripcion,
        :tipoConcepto,
        :cantidad,
        :precioUnitario
      )
      `,
            {
                idDetalle,
                idFactura: idFactura.trim(),
                descripcion: descripcion.trim(),
                tipoConcepto,
                cantidad: Number(cantidad),
                precioUnitario: Number(precioUnitario),
            }
        );

        const valorTotal = await recalcularTotalFactura(connection, idFactura);

        await connection.commit();

        res.status(201).json({
            message: "Detalle agregado correctamente",
            id: idDetalle,
            valorTotal,
        });
    } catch (error) {
        if (connection) await connection.rollback();
        manejarErrorOracle(error, res, "Error agregando detalle de factura");
    } finally {
        if (connection) await connection.close();
    }
});

router.put("/:id/detalles/:idDetalle", async (req, res) => {
    let connection;

    const idFactura = req.params.id;
    const idDetalle = req.params.idDetalle;

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
      UPDATE DETALLE_FACTURA
      SET
        descripcion = :descripcion,
        tipoConcepto = :tipoConcepto,
        cantidad = :cantidad,
        precioUnitario = :precioUnitario
      WHERE idDetalle = :idDetalle
        AND idFactura = :idFactura
      `,
            {
                idDetalle,
                idFactura,
                descripcion: descripcion.trim(),
                tipoConcepto,
                cantidad: Number(cantidad),
                precioUnitario: Number(precioUnitario),
            }
        );

        if (result.rowsAffected === 0) {
            await connection.rollback();
            return res.status(404).json({
                message: "Detalle de factura no encontrado",
            });
        }

        const valorTotal = await recalcularTotalFactura(connection, idFactura);

        await connection.commit();

        res.json({
            message: "Detalle actualizado correctamente",
            valorTotal,
        });
    } catch (error) {
        if (connection) await connection.rollback();
        manejarErrorOracle(error, res, "Error actualizando detalle de factura");
    } finally {
        if (connection) await connection.close();
    }
});

router.delete("/:id/detalles/:idDetalle", async (req, res) => {
    let connection;

    const idFactura = req.params.id;
    const idDetalle = req.params.idDetalle;

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `
      DELETE FROM DETALLE_FACTURA
      WHERE idDetalle = :idDetalle
        AND idFactura = :idFactura
      `,
            {
                idDetalle,
                idFactura,
            }
        );

        if (result.rowsAffected === 0) {
            await connection.rollback();
            return res.status(404).json({
                message: "Detalle de factura no encontrado",
            });
        }

        const valorTotal = await recalcularTotalFactura(connection, idFactura);

        await connection.commit();

        res.json({
            message: "Detalle eliminado correctamente",
            valorTotal,
        });
    } catch (error) {
        if (connection) await connection.rollback();
        manejarErrorOracle(error, res, "Error eliminando detalle de factura");
    } finally {
        if (connection) await connection.close();
    }
});

router.post("/:id/recalcular", async (req, res) => {
    let connection;

    const idFactura = req.params.id;

    try {
        connection = await getConnection();

        const valorTotal = await recalcularTotalFactura(connection, idFactura);

        await connection.commit();

        res.json({
            message: "Total recalculado correctamente",
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