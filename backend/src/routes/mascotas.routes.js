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

const sexosValidos = ["M", "H", null, ""];

function validarFecha(fecha) {
    if (!fecha) return true;
    return /^\d{4}-\d{2}-\d{2}$/.test(fecha);
}

function validarMascota(
    { clienteId, nombre, sexo, peso, especie, fechaNacimiento },
    esCreacion = true
) {
    if (!clienteId?.trim()) {
        return "El cliente es obligatorio.";
    }

    if (!nombre?.trim()) {
        return "El nombre de la mascota es obligatorio.";
    }

    if (!especie?.trim()) {
        return "La especie es obligatoria.";
    }

    if (!sexosValidos.includes(sexo)) {
        return "Sexo inválido. Usa M, H o vacío.";
    }

    if (!validarFecha(fechaNacimiento)) {
        return "La fecha de nacimiento debe tener formato YYYY-MM-DD.";
    }

    if (
        peso !== null &&
        peso !== undefined &&
        peso !== "" &&
        (Number(peso) < 0 || Number.isNaN(Number(peso)))
    ) {
        return "El peso debe ser un número mayor o igual a cero.";
    }

    return null;
}

function manejarErrorOracle(error, res, mensajeBase) {
    console.error(mensajeBase, error);

    if (error.errorNum === 1) {
        return res.status(409).json({
            message: "Ya existe una mascota con ese código.",
            error: error.message,
        });
    }

    if (error.errorNum === 20001 || error.errorNum === 20999) {
        return res.status(404).json({
            message: "Mascota no encontrada",
            error: error.message,
        });
    }

    if (error.errorNum === 2291) {
        return res.status(400).json({
            message: "El cliente seleccionado no existe.",
            error: error.message,
        });
    }

    if (error.errorNum === 2292) {
        return res.status(409).json({
            message:
                "No se puede eliminar porque la mascota tiene citas, consultas, vacunas u otros registros relacionados.",
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
                PKG_MASCOTAS.pr_listar_mascotas(:p_cursor);
            END;
            `,
            {
                p_cursor: outCursor(),
            }
        );

        const rows = await cursorToRows(result.outBinds.p_cursor);

        res.json(rows);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando mascotas");
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
                PKG_MASCOTAS.pr_obtener_mascota(
                    :p_codigoMascota,
                    :p_cursor
                );
            END;
            `,
            {
                p_codigoMascota: id,
                p_cursor: outCursor(),
            }
        );

        const rows = await cursorToRows(result.outBinds.p_cursor);

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Mascota no encontrada",
            });
        }

        res.json(rows[0]);
    } catch (error) {
        manejarErrorOracle(error, res, "Error consultando mascota");
    } finally {
        if (connection) await connection.close();
    }
});

router.post("/", async (req, res) => {
    let connection;

    const {
        clienteId,
        nombre,
        fechaNacimiento = null,
        sexo = null,
        peso = null,
        especie,
        raza = null,
    } = req.body;

    const errorValidacion = validarMascota(
        { clienteId, nombre, sexo, peso, especie, fechaNacimiento },
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
                PKG_MASCOTAS.pr_insertar_mascota(
                    :p_idCliente,
                    :p_nombre,
                    CASE
                        WHEN :p_fechaNacimiento IS NULL THEN NULL
                        ELSE TO_DATE(:p_fechaNacimiento, 'YYYY-MM-DD')
                    END,
                    :p_sexo,
                    :p_peso,
                    :p_especie,
                    :p_raza,
                    :p_codigoMascota
                );
            END;
            `,
            {
                p_idCliente: normalizarId(clienteId),
                p_nombre: nombre.trim(),
                p_fechaNacimiento: normalizarTexto(fechaNacimiento),
                p_sexo: normalizarTexto(sexo),
                p_peso:
                    peso === "" || peso === null || peso === undefined
                        ? null
                        : Number(peso),
                p_especie: especie.trim(),
                p_raza: normalizarTexto(raza),
                p_codigoMascota: outString(30),
            },
            { autoCommit: true }
        );

        res.status(201).json({
            ok: true,
            action: "CREATED",
            message: "Mascota creada correctamente",
            id: result.outBinds.p_codigoMascota,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error creando mascota");
    } finally {
        if (connection) await connection.close();
    }
});

router.put("/:id", async (req, res) => {
    let connection;

    const id = normalizarId(req.params.id);

    const {
        clienteId,
        nombre,
        fechaNacimiento = null,
        sexo = null,
        peso = null,
        especie,
        raza = null,
    } = req.body;

    const errorValidacion = validarMascota(
        { clienteId, nombre, sexo, peso, especie, fechaNacimiento },
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
                PKG_MASCOTAS.pr_modificar_mascota(
                    :p_codigoMascota,
                    :p_idCliente,
                    :p_nombre,
                    CASE
                        WHEN :p_fechaNacimiento IS NULL THEN NULL
                        ELSE TO_DATE(:p_fechaNacimiento, 'YYYY-MM-DD')
                    END,
                    :p_sexo,
                    :p_peso,
                    :p_especie,
                    :p_raza,
                    :p_filas_afectadas
                );
            END;
            `,
            {
                p_codigoMascota: id,
                p_idCliente: normalizarId(clienteId),
                p_nombre: nombre.trim(),
                p_fechaNacimiento: normalizarTexto(fechaNacimiento),
                p_sexo: normalizarTexto(sexo),
                p_peso:
                    peso === "" || peso === null || peso === undefined
                        ? null
                        : Number(peso),
                p_especie: especie.trim(),
                p_raza: normalizarTexto(raza),
                p_filas_afectadas: outNumber(),
            },
            { autoCommit: true }
        );

        res.json({
            ok: true,
            action: "UPDATED",
            message: "Mascota actualizada correctamente",
            id,
            filasAfectadas: result.outBinds.p_filas_afectadas,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error actualizando mascota");
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
                PKG_MASCOTAS.pr_eliminar_mascota(
                    :p_codigoMascota,
                    :p_filas_afectadas
                );
            END;
            `,
            {
                p_codigoMascota: id,
                p_filas_afectadas: outNumber(),
            },
            { autoCommit: true }
        );

        res.json({
            ok: true,
            action: "DELETED",
            message: "Mascota eliminada correctamente",
            id,
            filasAfectadas: result.outBinds.p_filas_afectadas,
        });
    } catch (error) {
        manejarErrorOracle(error, res, "Error eliminando mascota");
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;