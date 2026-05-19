
-- ============================================================
-- 1. CATALOGO_SERVICIOS
-- ============================================================
CREATE TABLE CATALOGO_SERVICIOS (
    idServicio          CHAR(10)        NOT NULL,
    nombre              VARCHAR2(100)   NOT NULL,
    tipoServicio        VARCHAR2(30)    NOT NULL,
    precio              NUMBER(10,2)    NOT NULL,
    descripcion         VARCHAR2(500),
    activo              CHAR(1)         DEFAULT 'S' NOT NULL,
    CONSTRAINT PK_CATALOGO_SERVICIOS PRIMARY KEY (idServicio),
    CONSTRAINT CK_TIPO_SERVICIO CHECK (tipoServicio IN (
        'CONSULTA', 'PROCEDIMIENTO', 'TERAPIA',
        'VACUNACION', 'PLAN_VACUNACION', 'OTRO'
    )),
    CONSTRAINT CK_PRECIO_SERVICIO CHECK (precio >= 0),
    CONSTRAINT CK_ACTIVO_SERVICIO CHECK (activo IN ('S', 'N'))
);

-- ============================================================
-- 2. CLIENTE
-- ============================================================
CREATE TABLE CLIENTE (
    idCliente           CHAR(15)        NOT NULL,
    nombreCompleto      VARCHAR2(100)   NOT NULL,
    direccion           VARCHAR2(200),
    correoElectronico   VARCHAR2(100),
    telefono            VARCHAR2(20),
    estado              VARCHAR2(20)    DEFAULT 'ACTIVO' NOT NULL,
    CONSTRAINT PK_CLIENTE PRIMARY KEY (idCliente),
    CONSTRAINT CK_ESTADO_CLIENTE CHECK (estado IN ('ACTIVO', 'INACTIVO', 'SUSPENDIDO'))
);

-- ============================================================
-- 3. EMPLEADO
-- ============================================================
CREATE TABLE EMPLEADO (
    idEmpleado          CHAR(15)        NOT NULL,
    nombreCompleto      VARCHAR2(100)   NOT NULL,
    telefono            VARCHAR2(20),
    fechaIngreso        DATE            NOT NULL,
    estadoLaboral       VARCHAR2(30)    NOT NULL,
    tipoEmpleado        VARCHAR2(15)    NOT NULL,
    salario             NUMBER(12,2)    NOT NULL,
    CONSTRAINT PK_EMPLEADO PRIMARY KEY (idEmpleado),
    CONSTRAINT CK_TIPO_EMPLEADO CHECK (tipoEmpleado IN ('VETERINARIO', 'RECEPCIONISTA')),
    CONSTRAINT CK_SALARIO_EMPLEADO CHECK (salario >= 0)
);

-- ============================================================
-- 4. VETERINARIO
-- ============================================================
CREATE TABLE VETERINARIO (
    idEmpleado          CHAR(15)        NOT NULL,
    especialidad        VARCHAR2(80),
    nroMatricula        VARCHAR2(30),
    CONSTRAINT PK_VETERINARIO PRIMARY KEY (idEmpleado),
    CONSTRAINT FK_VET_EMPLEADO FOREIGN KEY (idEmpleado)
        REFERENCES EMPLEADO (idEmpleado)
        ON DELETE CASCADE
);

-- ============================================================
-- 5. RECEPCIONISTA
-- ============================================================
CREATE TABLE RECEPCIONISTA (
    idEmpleado          CHAR(15)        NOT NULL,
    turno               VARCHAR2(20)    NOT NULL,
    CONSTRAINT PK_RECEPCIONISTA PRIMARY KEY (idEmpleado),
    CONSTRAINT FK_REC_EMPLEADO FOREIGN KEY (idEmpleado)
        REFERENCES EMPLEADO (idEmpleado)
        ON DELETE CASCADE,
    CONSTRAINT CK_TURNO_RECEPCIONISTA CHECK (turno IN ('DIURNO', 'NOCTURNO'))
);

-- ============================================================
-- 6. MASCOTA
-- ============================================================
CREATE TABLE MASCOTA (
    codigoMascota       CHAR(10)        NOT NULL,
    idCliente           CHAR(15)        NOT NULL,
    nombre              VARCHAR2(80)    NOT NULL,
    fechaNacimiento     DATE,
    sexo                CHAR(1),
    peso                NUMBER(6,2),
    especie             VARCHAR2(30)    NOT NULL,
    raza                VARCHAR2(60),
    CONSTRAINT PK_MASCOTA PRIMARY KEY (codigoMascota),
    CONSTRAINT FK_MASCOTA_CLIENTE FOREIGN KEY (idCliente)
        REFERENCES CLIENTE (idCliente),
    CONSTRAINT CK_SEXO_MASCOTA CHECK (sexo IN ('M', 'H')),
    CONSTRAINT CK_PESO_MASCOTA CHECK (peso IS NULL OR peso >= 0)
);

-- ============================================================
-- 7. ESTADO_SALUD_MASCOTA
-- ============================================================
CREATE TABLE ESTADO_SALUD_MASCOTA (
    idEstadoSalud       NUMBER(10,0)    NOT NULL,
    codigoMascota       CHAR(10)        NOT NULL,
    estadoSalud         VARCHAR2(30)    NOT NULL,
    fechaRegistro       DATE            DEFAULT SYSDATE NOT NULL,
    CONSTRAINT PK_ESTADO_SALUD PRIMARY KEY (idEstadoSalud),
    CONSTRAINT FK_ESTSAL_MASCOTA FOREIGN KEY (codigoMascota)
        REFERENCES MASCOTA (codigoMascota),
    CONSTRAINT CK_ESTADO_SALUD CHECK (estadoSalud IN (
        'SANA', 'ENFERMA', 'EN_TRATAMIENTO', 'RECUPERADA'
    ))
);

CREATE SEQUENCE SEQ_ESTADO_SALUD
    START WITH 1
    INCREMENT BY 1
    NOCACHE
    NOCYCLE;

-- ============================================================
-- 8. CITA
-- ============================================================
CREATE TABLE CITA (
    idCita              CHAR(12)        NOT NULL,
    codigoMascota       CHAR(10)        NOT NULL,
    idVeterinario       CHAR(15)        NOT NULL,
    idRecepcionista     CHAR(15)        NOT NULL,
    fecha               DATE            NOT NULL,
    hora                INTERVAL DAY(0) TO SECOND(0) NOT NULL,
    motivoConsulta      VARCHAR2(500),
    estadoCita          VARCHAR2(15)    NOT NULL,
    CONSTRAINT PK_CITA PRIMARY KEY (idCita),
    CONSTRAINT FK_CITA_MASCOTA FOREIGN KEY (codigoMascota)
        REFERENCES MASCOTA (codigoMascota),
    CONSTRAINT FK_CITA_VETERINARIO FOREIGN KEY (idVeterinario)
        REFERENCES VETERINARIO (idEmpleado),
    CONSTRAINT FK_CITA_RECEPCIONISTA FOREIGN KEY (idRecepcionista)
        REFERENCES RECEPCIONISTA (idEmpleado),
    CONSTRAINT CK_ESTADO_CITA CHECK (estadoCita IN (
        'PROGRAMADA', 'CONFIRMADA', 'ATENDIDA', 'CANCELADA', 'REPROGRAMADA'
    ))
);

-- ============================================================
-- 9. CONSULTA_VETERINARIA
-- ============================================================
CREATE TABLE CONSULTA_VETERINARIA (
    idConsulta          CHAR(12)        NOT NULL,
    idCita              CHAR(12)        NOT NULL,
    idServicio          CHAR(10)        NOT NULL,
    temperatura         NUMBER(4,1),
    pesoConsulta        NUMBER(6,2),
    observaciones       VARCHAR2(2000),
    recomendaciones     VARCHAR2(2000),
    fechaAtencionReal   DATE            NOT NULL,
    CONSTRAINT PK_CONSULTA PRIMARY KEY (idConsulta),
    CONSTRAINT FK_CONSULTA_CITA FOREIGN KEY (idCita)
        REFERENCES CITA (idCita),
    CONSTRAINT FK_CONSULTA_SERVICIO FOREIGN KEY (idServicio)
        REFERENCES CATALOGO_SERVICIOS (idServicio),
    CONSTRAINT UQ_CONSULTA_CITA UNIQUE (idCita),
    CONSTRAINT CK_TEMP_CONSULTA CHECK (temperatura IS NULL OR temperatura >= 0),
    CONSTRAINT CK_PESO_CONSULTA CHECK (pesoConsulta IS NULL OR pesoConsulta >= 0)
);

-- ============================================================
-- 10. DIAGNOSTICO
-- ============================================================
CREATE TABLE DIAGNOSTICO (
    idDiagnostico           CHAR(12)        NOT NULL,
    idConsulta              CHAR(12)        NOT NULL,
    descripcionCondicion    VARCHAR2(2000)  NOT NULL,
    nivelGravedad           VARCHAR2(20),
    tipoAfeccion            VARCHAR2(60),
    estado                  VARCHAR2(15)    NOT NULL,
    CONSTRAINT PK_DIAGNOSTICO PRIMARY KEY (idDiagnostico),
    CONSTRAINT FK_DIAG_CONSULTA FOREIGN KEY (idConsulta)
        REFERENCES CONSULTA_VETERINARIA (idConsulta),
    CONSTRAINT CK_ESTADO_DIAGNOSTICO CHECK (estado IN (
        'PRESUNTIVO', 'CONFIRMADO', 'DESCARTADO'
    ))
);

-- ============================================================
-- 11. TRATAMIENTO
-- ============================================================
CREATE TABLE TRATAMIENTO (
    idTratamiento       CHAR(12)        NOT NULL,
    idDiagnostico       CHAR(12)        NOT NULL,
    idVeterinario       CHAR(15)        NOT NULL,
    idServicio          CHAR(10),
    tipo                VARCHAR2(30)    NOT NULL,
    fechaInicio         DATE            NOT NULL,
    fechaFinEstimada    DATE,
    indicaciones        VARCHAR2(2000),
    estado              VARCHAR2(30),
    CONSTRAINT PK_TRATAMIENTO PRIMARY KEY (idTratamiento),
    CONSTRAINT FK_TRAT_DIAGNOSTICO FOREIGN KEY (idDiagnostico)
        REFERENCES DIAGNOSTICO (idDiagnostico),
    CONSTRAINT FK_TRAT_VETERINARIO FOREIGN KEY (idVeterinario)
        REFERENCES VETERINARIO (idEmpleado),
    CONSTRAINT FK_TRAT_SERVICIO FOREIGN KEY (idServicio)
        REFERENCES CATALOGO_SERVICIOS (idServicio),
    CONSTRAINT CK_TIPO_TRATAMIENTO CHECK (tipo IN (
        'MEDICACION', 'OBSERVACION', 'TERAPIA',
        'PROCEDIMIENTO_AMBULATORIO', 'PLAN_VACUNACION'
    )),
    CONSTRAINT CK_ESTADO_TRATAMIENTO CHECK (
        estado IS NULL OR estado IN ('ACTIVO', 'FINALIZADO', 'SUSPENDIDO', 'CANCELADO')
    ),
    CONSTRAINT CK_FECHAS_TRATAMIENTO CHECK (
        fechaFinEstimada IS NULL OR fechaFinEstimada >= fechaInicio
    )
);

-- ============================================================
-- 12. MEDICAMENTO
-- ============================================================
CREATE TABLE MEDICAMENTO (
    idMedicamento       CHAR(10)        NOT NULL,
    nombre              VARCHAR2(100)   NOT NULL,
    descripcion         VARCHAR2(2000),
    precioUnitario      NUMBER(10,2)    DEFAULT 0 NOT NULL,
    CONSTRAINT PK_MEDICAMENTO PRIMARY KEY (idMedicamento),
    CONSTRAINT CK_PRECIO_MEDICAMENTO CHECK (precioUnitario >= 0)
);

-- ============================================================
-- 13. TRATAMIENTO_MEDICAMENTO
-- ============================================================
CREATE TABLE TRATAMIENTO_MEDICAMENTO (
    idTratamiento       CHAR(12)        NOT NULL,
    idMedicamento       CHAR(10)        NOT NULL,
    dosis               VARCHAR2(50)    NOT NULL,
    frecuencia          VARCHAR2(50)    NOT NULL,
    viaAdministracion   VARCHAR2(40),
    duracion            VARCHAR2(40),
    CONSTRAINT PK_TRAT_MED PRIMARY KEY (idTratamiento, idMedicamento),
    CONSTRAINT FK_TM_TRATAMIENTO FOREIGN KEY (idTratamiento)
        REFERENCES TRATAMIENTO (idTratamiento),
    CONSTRAINT FK_TM_MEDICAMENTO FOREIGN KEY (idMedicamento)
        REFERENCES MEDICAMENTO (idMedicamento)
);

-- ============================================================
-- 14. VACUNA
-- ============================================================
CREATE TABLE VACUNA (
    idVacuna            CHAR(10)        NOT NULL,
    nombre              VARCHAR2(100)   NOT NULL,
    laboratorio         VARCHAR2(100),
    lote                VARCHAR2(40),
    fechaVencimiento    DATE,
    especieObjetivo     VARCHAR2(30),
    precio              NUMBER(10,2)    DEFAULT 0 NOT NULL,
    CONSTRAINT PK_VACUNA PRIMARY KEY (idVacuna),
    CONSTRAINT CK_PRECIO_VACUNA CHECK (precio >= 0)
);

-- ============================================================
-- 15. APLICACION_VACUNA
-- ============================================================
CREATE TABLE APLICACION_VACUNA (
    codigoMascota       CHAR(10)        NOT NULL,
    idVacuna            CHAR(10)        NOT NULL,
    fechaAplicacion     DATE            NOT NULL,
    observacion         VARCHAR2(500),
    CONSTRAINT PK_APLIC_VACUNA PRIMARY KEY (codigoMascota, idVacuna, fechaAplicacion),
    CONSTRAINT FK_AV_MASCOTA FOREIGN KEY (codigoMascota)
        REFERENCES MASCOTA (codigoMascota),
    CONSTRAINT FK_AV_VACUNA FOREIGN KEY (idVacuna)
        REFERENCES VACUNA (idVacuna)
);

-- ============================================================
-- 16. DIAGNOSTICO_VACUNA
-- ============================================================
CREATE TABLE DIAGNOSTICO_VACUNA (
    idDiagnostico       CHAR(12)        NOT NULL,
    idVacuna            CHAR(10)        NOT NULL,
    CONSTRAINT PK_DIAG_VACUNA PRIMARY KEY (idDiagnostico, idVacuna),
    CONSTRAINT FK_DV_DIAGNOSTICO FOREIGN KEY (idDiagnostico)
        REFERENCES DIAGNOSTICO (idDiagnostico),
    CONSTRAINT FK_DV_VACUNA FOREIGN KEY (idVacuna)
        REFERENCES VACUNA (idVacuna)
);

-- ============================================================
-- 17. FACTURA
-- ============================================================
CREATE TABLE FACTURA (
    idFactura           CHAR(12)        NOT NULL,
    idConsulta          CHAR(12)        NOT NULL,
    idCliente           CHAR(15)        NOT NULL,
    fecha               DATE            NOT NULL,
    valorTotal          NUMBER(12,2)    DEFAULT 0 NOT NULL,
    metodoPago          VARCHAR2(30),
    estadoPago          VARCHAR2(20)    NOT NULL,
    CONSTRAINT PK_FACTURA PRIMARY KEY (idFactura),
    CONSTRAINT FK_FAC_CONSULTA FOREIGN KEY (idConsulta)
        REFERENCES CONSULTA_VETERINARIA (idConsulta),
    CONSTRAINT FK_FAC_CLIENTE FOREIGN KEY (idCliente)
        REFERENCES CLIENTE (idCliente),
    CONSTRAINT UQ_FACTURA_CONSULTA UNIQUE (idConsulta),
    CONSTRAINT CK_VALOR_FACTURA CHECK (valorTotal >= 0),
    CONSTRAINT CK_ESTADO_PAGO CHECK (estadoPago IN ('PENDIENTE', 'PAGADA', 'ANULADA'))
);

-- ============================================================
-- 18. DETALLE_FACTURA
-- ============================================================
CREATE TABLE DETALLE_FACTURA (
    idDetalle           CHAR(14)        NOT NULL,
    idFactura           CHAR(12)        NOT NULL,
    descripcion         VARCHAR2(200),
    tipoConcepto        VARCHAR2(20),
    cantidad            INTEGER         NOT NULL,
    precioUnitario      NUMBER(10,2)    NOT NULL,
    CONSTRAINT PK_DETALLE_FACTURA PRIMARY KEY (idDetalle),
    CONSTRAINT FK_DET_FACTURA FOREIGN KEY (idFactura)
        REFERENCES FACTURA (idFactura),
    CONSTRAINT CK_CANTIDAD_DET CHECK (cantidad > 0),
    CONSTRAINT CK_PRECIO_DET CHECK (precioUnitario >= 0),
    CONSTRAINT CK_TIPO_CONCEPTO CHECK (tipoConcepto IN (
        'CONSULTA', 'MEDICAMENTO', 'VACUNA', 'PROCEDIMIENTO', 'OTRO'
    ))
);

-- ============================================================
-- 19. LOG_AUDITORIA
-- Necesaria para PKG_AUDITORIA.
-- ============================================================
CREATE TABLE LOG_AUDITORIA (
    idLog       NUMBER(10,0)    NOT NULL,
    tabla       VARCHAR2(60)    NOT NULL,
    operacion   VARCHAR2(30)    NOT NULL,
    idRegistro  VARCHAR2(60),
    datosAntes  CLOB,
    usuario     VARCHAR2(128)   DEFAULT USER NOT NULL,
    fechaHora   TIMESTAMP       DEFAULT SYSTIMESTAMP NOT NULL,
    CONSTRAINT PK_LOG_AUDITORIA PRIMARY KEY (idLog),
    CONSTRAINT CK_LOG_OPERACION CHECK (operacion IN ('INSERTAR','MODIFICAR','ELIMINAR','CONSULTAR','OTRO'))
);

CREATE SEQUENCE SEQ_LOG_AUDITORIA
    START WITH 1
    INCREMENT BY 1
    NOCACHE
    NOCYCLE;
