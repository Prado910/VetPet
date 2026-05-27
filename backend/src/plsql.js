const oracledb = require("oracledb");

/**
 * Mapa general para convertir campos Oracle/PLSQL
 * a campos amigables que ya espera el frontend React.
 */
const FIELD_MAP = {
    // Genéricos
    ID: "id",
    NOMBRE: "nombre",
    DESCRIPCION: "descripcion",
    DIRECCION: "direccion",
    TELEFONO: "telefono",
    EMAIL: "email",
    CORREO: "email",
    CORREOELECTRONICO: "email",
    ESTADO: "estado",
    FECHA: "fecha",
    HORA: "hora",
    MOTIVO: "motivo",
    OBSERVACIONES: "observaciones",
    RECOMENDACIONES: "recomendaciones",
    ACTIVO: "activo",
    PRECIO: "precio",
    SALARIO: "salario",
    TURNO: "turno",
    ESPECIALIDAD: "especialidad",
    TIPO: "tipo",
    INDICACIONES: "indicaciones",
    CANTIDAD: "cantidad",

    // Clientes
    IDCLIENTE: "clienteId",
    CLIENTEID: "clienteId",
    NOMBRECLIENTE: "clienteNombre",
    CLIENTENOMBRE: "clienteNombre",
    DUENO: "clienteNombre",
    DUEÑO: "clienteNombre",
    TELEFONOCLIENTE: "clienteTelefono",
    CLIENTETELEFONO: "clienteTelefono",
    ESTADOCLIENTE: "estado",

    // Mascotas
    CODIGOMASCOTA: "id",
    CODIGO_MASCOTA: "id",
    IDMASCOTA: "mascotaId",
    MASCOTAID: "mascotaId",
    NOMBREMASCOTA: "nombre",
    MASCOTANOMBRE: "mascotaNombre",
    FECHANACIMIENTO: "fechaNacimiento",
    FECHA_NACIMIENTO: "fechaNacimiento",
    SEXO: "sexo",
    PESO: "peso",
    ESPECIE: "especie",
    RAZA: "raza",
    EDAD: "edad",
    ESTADOSALUD: "estadoSalud",
    ESTADO_SALUD: "estadoSalud",
    ESPECIEMASCOTA: "mascotaEspecie",
    MASCOTAESPECIE: "mascotaEspecie",

    // Citas
    IDCITA: "id",
    CITAID: "idCita",
    ID_CITA: "idCita",
    ESTADOCITA: "estado",
    ESTADO_CITA: "estado",
    FECHACITA: "fecha",
    FECHA_CITA: "fecha",
    HORACITA: "hora",
    HORA_CITA: "hora",
    MOTIVOCONSULTA: "motivo",
    MOTIVO_CONSULTA: "motivo",
    IDVETERINARIO: "veterinarioId",
    VETERINARIOID: "veterinarioId",
    NOMBREVETERINARIO: "veterinarioNombre",
    VETERINARIONOMBRE: "veterinarioNombre",
    IDRECEPCIONISTA: "recepcionistaId",
    RECEPCIONISTAID: "recepcionistaId",
    NOMBRERECEPCIONISTA: "recepcionistaNombre",
    RECEPCIONISTANOMBRE: "recepcionistaNombre",

    // Empleados
    IDEMPLEADO: "id",
    ID_EMPLEADO: "id",
    NOMBREEMPLEADO: "nombre",
    NOMBRE_EMPLEADO: "nombre",
    NOMBRECOMPLETO: "nombre",
    NOMBRE_COMPLETO: "nombre",
    ESTADOLABORAL: "estadoLaboral",
    ESTADO_LABORAL: "estadoLaboral",
    TIPOEMPLEADO: "tipoEmpleado",
    TIPO_EMPLEADO: "tipoEmpleado",
    FECHAINGRESO: "fechaIngreso",
    FECHA_INGRESO: "fechaIngreso",
    NROMATRICULA: "nroMatricula",
    NRO_MATRICULA: "nroMatricula",
    MATRICULA: "nroMatricula",

    // Servicios
    IDSERVICIO: "id",
    ID_SERVICIO: "idServicio",
    SERVICIOID: "idServicio",
    NOMBRESERVICIO: "nombre",
    NOMBRE_SERVICIO: "servicioNombre",
    SERVICIONOMBRE: "servicioNombre",
    TIPOSERVICIO: "tipoServicio",
    TIPO_SERVICIO: "tipoServicio",
    SERVICIOPRECIO: "servicioPrecio",
    PRECIO_SERVICIO: "servicioPrecio",

    // Consultas
    IDCONSULTA: "id",
    ID_CONSULTA: "idConsulta",
    CONSULTAID: "idConsulta",
    TEMPERATURA: "temperatura",
    PESOCONSULTA: "pesoConsulta",
    PESO_CONSULTA: "pesoConsulta",
    FECHAATENCIONREAL: "fechaAtencionReal",
    FECHA_ATENCION_REAL: "fechaAtencionReal",

    // Diagnósticos
    IDDIAGNOSTICO: "id",
    ID_DIAGNOSTICO: "idDiagnostico",
    DIAGNOSTICOID: "idDiagnostico",
    DESCRIPCIONCONDICION: "descripcionCondicion",
    DESCRIPCION_CONDICION: "descripcionCondicion",
    NIVELGRAVEDAD: "nivelGravedad",
    NIVEL_GRAVEDAD: "nivelGravedad",
    TIPOAFECCION: "tipoAfeccion",
    TIPO_AFECCION: "tipoAfeccion",
    ESTADODIAGNOSTICO: "estado",
    ESTADO_DIAGNOSTICO: "estado",

    // Tratamientos
    IDTRATAMIENTO: "id",
    ID_TRATAMIENTO: "idTratamiento",
    TRATAMIENTOID: "idTratamiento",
    TIPOTRATAMIENTO: "tipo",
    TIPO_TRATAMIENTO: "tipo",
    FECHAINICIO: "fechaInicio",
    FECHA_INICIO: "fechaInicio",
    FECHAFINESTIMADA: "fechaFinEstimada",
    FECHA_FIN_ESTIMADA: "fechaFinEstimada",
    ESTADOTRATAMIENTO: "estado",
    ESTADO_TRATAMIENTO: "estado",

    // Medicamentos
    IDMEDICAMENTO: "id",
    ID_MEDICAMENTO: "idMedicamento",
    MEDICAMENTOID: "idMedicamento",
    NOMBREMEDICAMENTO: "nombre",
    NOMBRE_MEDICAMENTO: "medicamentoNombre",
    MEDICAMENTONOMBRE: "medicamentoNombre",
    PRECIOUNITARIO: "precioUnitario",
    PRECIO_UNITARIO: "precioUnitario",
    VIAADMINISTRACION: "viaAdministracion",
    VIA_ADMINISTRACION: "viaAdministracion",
    DOSIS: "dosis",
    FRECUENCIA: "frecuencia",
    DURACION: "duracion",

    // Vacunas
    IDVACUNA: "id",
    ID_VACUNA: "idVacuna",
    VACUNAID: "idVacuna",
    NOMBREVACUNA: "nombre",
    NOMBRE_VACUNA: "vacunaNombre",
    VACUNANOMBRE: "vacunaNombre",
    FECHAVENCIMIENTO: "fechaVencimiento",
    FECHA_VENCIMIENTO: "fechaVencimiento",
    FECHAAPLICACION: "fechaAplicacion",
    FECHA_APLICACION: "fechaAplicacion",
    OBSERVACION: "observacion",

    // Facturación
    IDFACTURA: "id",
    ID_FACTURA: "idFactura",
    FACTURAID: "idFactura",
    IDDETALLE: "id",
    ID_DETALLE: "idDetalle",
    DETALLEID: "idDetalle",
    FECHAFACTURA: "fecha",
    FECHA_FACTURA: "fecha",
    VALORTOTAL: "valorTotal",
    VALOR_TOTAL: "valorTotal",
    METODOPAGO: "metodoPago",
    METODO_PAGO: "metodoPago",
    ESTADOPAGO: "estadoPago",
    ESTADO_PAGO: "estadoPago",
    TIPOCONCEPTO: "tipoConcepto",
    TIPO_CONCEPTO: "tipoConcepto",

    // Dashboard / Reportes
    TOTALCLIENTES: "totalClientes",
    TOTAL_CLIENTES: "totalClientes",
    TOTALMASCOTAS: "totalMascotas",
    TOTAL_MASCOTAS: "totalMascotas",
    TOTALCITAS: "totalCitas",
    TOTAL_CITAS: "totalCitas",
    CITASHOY: "citasHoy",
    CITAS_HOY: "citasHoy",
    CONSULTASHOY: "consultasHoy",
    CONSULTAS_HOY: "consultasHoy",
    INGRESOSMES: "ingresosMes",
    INGRESOS_MES: "ingresosMes",
    INGRESOSPAGADOS: "ingresosPagados",
    INGRESOS_PAGADOS: "ingresosPagados",
    TRATAMIENTOSACTIVOS: "tratamientosActivos",
    TRATAMIENTOS_ACTIVOS: "tratamientosActivos",
    VACUNASAPLICADAS: "vacunasAplicadas",
    VACUNAS_APLICADAS: "vacunasAplicadas",
    APLICACIONES: "aplicaciones",
    MES: "mes",
    ANIO: "anio",
    AÑO: "anio",
    TOTAL: "total",
};

function normalizarNombreCampo(key) {
    const original = String(key || "").trim();

    if (!original) return original;

    const upper = original.toUpperCase();

    if (FIELD_MAP[upper]) {
        return FIELD_MAP[upper];
    }

    return original
        .toLowerCase()
        .replace(/_([a-z])/g, (_, letra) => letra.toUpperCase());
}

function normalizarValor(valor) {
    if (valor instanceof Date) {
        return valor.toISOString().slice(0, 10);
    }

    return valor;
}

function normalizarFilaOracle(row) {
    if (!row || typeof row !== "object") return row;

    const normalizada = {};

    for (const [key, value] of Object.entries(row)) {
        const nuevoKey = normalizarNombreCampo(key);

        normalizada[nuevoKey] = normalizarValor(value);

        /**
         * Conservamos también la clave original para no romper lógica interna
         * que todavía use row.IDCONSULTA, row.TIPOEMPLEADO, etc.
         */
        if (!(key in normalizada)) {
            normalizada[key] = normalizarValor(value);
        }
    }

    return normalizada;
}

function normalizarRows(rows) {
    return Array.isArray(rows) ? rows.map(normalizarFilaOracle) : [];
}

async function cursorToRows(cursor) {
    const rows = [];

    try {
        let row;
        while ((row = await cursor.getRow())) {
            rows.push(normalizarFilaOracle(row));
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
    normalizarFilaOracle,
    normalizarRows,
};