const oracledb = require("oracledb");

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

function outCursor() {
    return {
        dir: oracledb.BIND_OUT,
        type: oracledb.CURSOR,
    };
}

function outNumber() {
    return {
        dir: oracledb.BIND_OUT,
        type: oracledb.NUMBER,
    };
}

function outString(maxSize = 50) {
    return {
        dir: oracledb.BIND_OUT,
        type: oracledb.STRING,
        maxSize,
    };
}

function normalizarTexto(valor) {
    if (valor === null || valor === undefined) return null;

    const texto = String(valor).trim();
    return texto === "" ? null : texto;
}

function normalizarId(valor) {
    return String(valor || "").trim().toUpperCase();
}

module.exports = {
    cursorToRows,
    outCursor,
    outNumber,
    outString,
    normalizarTexto,
    normalizarId,
};