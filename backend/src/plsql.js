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

/**
 * Traduce nombres que vienen desde Oracle/PLSQL
 * a nombres amigables para React.
 */
const FIELD_MAP = {
    ID: "id",

    IDCLIENTE: "clienteId",
    NOMBRECLIENTE: "clienteNombre",
    CLIENTENOMBRE: "clienteNombre",
    TELEFONOCLIENTE: "clienteTelefono",
    CLIENTETELEFONO: "clienteTelefono",

    CODIGOMASCOTA: "id",
    IDMASCOTA: "mascotaId",
    MASCOTAID: "mascotaId",
    NOMBREMASCOTA: "mascotaNombre",
    MASCOTANOMBRE: "mascotaNombre",
    ESPECIEMASCOTA: "mascotaEspecie",
    MASCOTAESPECIE: "mascotaEspecie",

    IDCITA: "id",
    CITAID: "idCita",
    IDCONSULTA: "id",
    CONSULTAID: "idConsulta",

    IDSERVICIO: "idServicio",
    SERVICIOID: "idServicio",
    NOMBRESERVICIO: "servicioNombre",
    SERVICIONOMBRE: "servicioNombre",
    SERVICIOPRECIO: "servicioPrecio",
    TIPOSERVICIO: "tipoServicio",

    IDDIAGNOSTICO: "id",
    DIAGNOSTICOID: "idDiagnostico",
    DESCRIPCIONCONDICION: "descripcionCondicion",
    NIVELGRAVEDAD: "nivelGravedad",
    TIPOAFECCION: "tipoAfeccion",

    IDTRATAMIENTO: "id",
    TRATAMIENTOID: "idTratamiento",
    IDVETERINARIO: "veterinarioId",
    VETERINARIOID: "veterinarioId",
    NOMBREVETERINARIO: "veterinarioNombre",
    VETERINARIONOMBRE: "veterinarioNombre",

    IDRECEPCIONISTA: "recepcionistaId",
    RECEPCIONISTAID: "recepcionistaId",
    NOMBRERECEPCIONISTA: "recepcionistaNombre",
    RECEPCIONISTANOMBRE: "recepcionistaNombre",

    IDEMPLEADO: "id",
    NOMBREEMPLEADO: "nombre",
    NOMBRECOMPLETO: "nombre",
    ESTADOLABORAL: "estadoLaboral",
    TIPOEMPLEADO: "tipoEmpleado",
    FECHAINGRESO: "fechaIngreso",
    NROMATRICULA: "nroMatricula",

    IDMEDICAMENTO: "id",
    MEDICAMENTOID: "idMedicamento",
    NOMBREMEDICAMENTO: "medicamentoNombre",
    PRECIOUNITARIO: "precioUnitario",

    IDVACUNA: "id",
    VACUNAID: "idVacuna",
    NOMBREVACUNA: "vacunaNombre",
    FECHAVENCIMIENTO: "fechaVencimiento",
    FECHAAPLICACION: "fechaAplicacion",

    IDFACTURA: "id",
    FACTURAID: "idFactura",
    IDDETALLE: "id",
    DETALLEID: "idDetalle",
    FECHAFACTURA: "fecha",
    VALORTOTAL: "valorTotal",
    METODOPAGO: "metodoPago",
    ESTADOPAGO: "estadoPago",
    TIPOCONCEPTO: "tipoConcepto",

    FECHANACIMIENTO: "fechaNacimiento",
    ESTADOSALUD: "estadoSalud",
    PESOCONSULTA: "pesoConsulta",
    FECHAATENCIONREAL: "fechaAtencionReal",
    FECHAINICIO: "fechaInicio",
    FECHAFINESTIMADA: "fechaFinEstimada",

    ESTADOCITA: "estado",
    ESTADODIAGNOSTICO: "estado",
    ESTADOTRATAMIENTO: "estado",

    NOMBRE: "nombre",
    DIRECCION: "direccion",
    EMAIL: "email",
    CORREO: "email",
    CORREOELECTRONICO: "email",
    TELEFONO: "telefono",
    ESTADO: "estado",
    SEXO: "sexo",
    PESO: "peso",
    ESPECIE: "especie",
    RAZA: "raza",
    EDAD: "edad",
    FECHA: "fecha",
    HORA: "hora",
    MOTIVO: "motivo",
    OBSERVACIONES: "observaciones",
    RECOMENDACIONES: "recomendaciones",
    DESCRIPCION: "descripcion",
    ACTIVO: "activo",
    PRECIO: "precio",
    SALARIO: "salario",
    TURNO: "turno",
    ESPECIALIDAD: "especialidad",
    TIPO: "tipo",
    INDICACIONES: "indicaciones",
    DOSIS: "dosis",
    FRECUENCIA: "frecuencia",
    VIAADMINISTRACION: "viaAdministracion",
    DURACION: "duracion",
    CANTIDAD: "cantidad",
};

function lowerCamelFromOracle(key) {
    const limpio = String(key || "").trim();

    if (!limpio) return limpio;

    if (FIELD_MAP[limpio.toUpperCase()]) {
        return FIELD_MAP[limpio.toUpperCase()];
    }

    return limpio
        .toLowerCase()
        .replace(/_([a-z])/g, (_, letra) => letra.toUpperCase());
}

function normalizarFilaOracle(row) {
    if (!row || typeof row !== "object") return row;

    const normalizada = {};

    for (const [key, value] of Object.entries(row)) {
        const nuevoKey = lowerCamelFromOracle(key);
        normalizada[nuevoKey] = value;
    }

    return normalizada;
}

function normalizarRows(rows) {
    return Array.isArray(rows) ? rows.map(normalizarFilaOracle) : [];
}

module.exports = {
    cursorToRows,
    outCursor,
    outNumber,
    outString,
    normalizarTexto,
    normalizarId,
    normalizarFilaOracle,
    normalizarRows,
};