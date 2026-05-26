
SET SERVEROUTPUT ON SIZE UNLIMITED;

-- ============================================================
-- TIPOS GLOBALES DE ESQUEMA
-- ============================================================
CREATE OR REPLACE TYPE T_FILA_HISTORIAL AS OBJECT (
    idConsulta        VARCHAR2(12),
    fechaAtencion     DATE,
    motivoConsulta    VARCHAR2(500),
    observaciones     VARCHAR2(2000),
    idDiagnostico     VARCHAR2(12),
    descripCondicion  VARCHAR2(2000),
    nivelGravedad     VARCHAR2(20),
    estadoDiag        VARCHAR2(15),
    idTratamiento     VARCHAR2(12),
    tipoTratamiento   VARCHAR2(30),
    estadoTratamiento VARCHAR2(30)
);
/

CREATE OR REPLACE TYPE T_TAB_HISTORIAL AS TABLE OF T_FILA_HISTORIAL;
/

CREATE OR REPLACE TYPE T_FILA_CITA AS OBJECT (
    idCita          VARCHAR2(12),
    horaCita        VARCHAR2(10),
    nombreMascota   VARCHAR2(80),
    especieMascota  VARCHAR2(30),
    nombreCliente   VARCHAR2(100),
    telefonoCliente VARCHAR2(20),
    nombreVet       VARCHAR2(100),
    motivoConsulta  VARCHAR2(500),
    estadoCita      VARCHAR2(15)
);
/

CREATE OR REPLACE TYPE T_TAB_CITAS AS TABLE OF T_FILA_CITA;
/

CREATE OR REPLACE TYPE T_FILA_SERVICIO AS OBJECT (
    posicion       NUMBER,
    idServicio     VARCHAR2(10),
    nombreSvc      VARCHAR2(100),
    tipoSvc        VARCHAR2(30),
    vecesFacturado NUMBER,
    ingresoTotal   NUMBER(14,2)
);
/

CREATE OR REPLACE TYPE T_VARRAY_TOP_SERVICIOS AS VARRAY(5) OF T_FILA_SERVICIO;
/

CREATE OR REPLACE TYPE T_DETALLE_INPUT AS OBJECT (
    idDetalle       VARCHAR2(14),
    descripcion     VARCHAR2(200),
    tipoConcepto    VARCHAR2(20),
    cantidad        INTEGER,
    precioUnitario  NUMBER(10,2)
);
/

CREATE OR REPLACE TYPE T_TAB_DETALLES_INPUT AS TABLE OF T_DETALLE_INPUT;
/

CREATE OR REPLACE TYPE T_FILA_RESUMEN_CLIENTE AS OBJECT (
    idCliente          VARCHAR2(15),
    nombreCliente      VARCHAR2(100),
    totalFacturas      NUMBER,
    facturasPagadas    NUMBER,
    facturasPendientes NUMBER,
    ingresoTotal       NUMBER(14,2),
    ingresoPendiente   NUMBER(14,2)
);
/

CREATE OR REPLACE TYPE T_TAB_RESUMEN_CLIENTES AS TABLE OF T_FILA_RESUMEN_CLIENTE;
/

-- ============================================================
-- 1. PKG_UTILIDADES
-- ============================================================
CREATE OR REPLACE PACKAGE PKG_UTILIDADES AS
    ex_no_encontrado       EXCEPTION;
    ex_operacion_invalida  EXCEPTION;
    PRAGMA EXCEPTION_INIT(ex_no_encontrado,      -20001);
    PRAGMA EXCEPTION_INIT(ex_operacion_invalida, -20002);

    PROCEDURE lanzar_no_encontrado(p_entidad IN VARCHAR2, p_id IN VARCHAR2);
    PROCEDURE lanzar_operacion_invalida(p_entidad IN VARCHAR2, p_detalle IN VARCHAR2);
    PROCEDURE manejar(p_entidad IN VARCHAR2, p_operacion IN VARCHAR2, p_sqlcode IN NUMBER, p_sqlerrm IN VARCHAR2);

    FUNCTION fn_existe_registro(p_tabla IN VARCHAR2, p_col_pk IN VARCHAR2, p_valor IN VARCHAR2) RETURN NUMBER;
    FUNCTION fn_validar_estado(p_estado IN VARCHAR2, p_estados_validos IN VARCHAR2) RETURN BOOLEAN;
    FUNCTION fn_validar_fecha(p_fecha IN DATE, p_min_fecha IN DATE DEFAULT NULL, p_max_fecha IN DATE DEFAULT NULL) RETURN BOOLEAN;
END PKG_UTILIDADES;
/

CREATE OR REPLACE PACKAGE BODY PKG_UTILIDADES AS
    PROCEDURE lanzar_no_encontrado(p_entidad IN VARCHAR2, p_id IN VARCHAR2) IS
    BEGIN
        RAISE_APPLICATION_ERROR(-20001, 'Registro no encontrado en ' || p_entidad || ' con identificador: ' || p_id);
    END;

    PROCEDURE lanzar_operacion_invalida(p_entidad IN VARCHAR2, p_detalle IN VARCHAR2) IS
    BEGIN
        RAISE_APPLICATION_ERROR(-20002, 'Operación inválida en ' || p_entidad || ': ' || p_detalle);
    END;

    PROCEDURE manejar(p_entidad IN VARCHAR2, p_operacion IN VARCHAR2, p_sqlcode IN NUMBER, p_sqlerrm IN VARCHAR2) IS
    BEGIN
        RAISE_APPLICATION_ERROR(-20999,
            'Error en ' || p_entidad || ' [' || p_operacion || ']: SQLCODE=' || p_sqlcode || ' - ' || p_sqlerrm);
    END;

    FUNCTION fn_existe_registro(p_tabla IN VARCHAR2, p_col_pk IN VARCHAR2, p_valor IN VARCHAR2) RETURN NUMBER IS
        v_total NUMBER;
        v_sql   VARCHAR2(1000);
    BEGIN
        v_sql := 'SELECT COUNT(*) FROM ' || DBMS_ASSERT.SIMPLE_SQL_NAME(p_tabla) ||
                 ' WHERE ' || DBMS_ASSERT.SIMPLE_SQL_NAME(p_col_pk) || ' = :1';
        EXECUTE IMMEDIATE v_sql INTO v_total USING p_valor;
        RETURN CASE WHEN v_total > 0 THEN 1 ELSE 0 END;
    EXCEPTION
        WHEN OTHERS THEN
            PKG_UTILIDADES.manejar(p_tabla, 'FN_EXISTE_REGISTRO', SQLCODE, SQLERRM);
    END;

    FUNCTION fn_validar_estado(p_estado IN VARCHAR2, p_estados_validos IN VARCHAR2) RETURN BOOLEAN IS
    BEGIN
        RETURN INSTR(',' || p_estados_validos || ',', ',' || p_estado || ',') > 0;
    END;

    FUNCTION fn_validar_fecha(p_fecha IN DATE, p_min_fecha IN DATE DEFAULT NULL, p_max_fecha IN DATE DEFAULT NULL) RETURN BOOLEAN IS
    BEGIN
        IF p_fecha IS NULL THEN RETURN FALSE; END IF;
        IF p_min_fecha IS NOT NULL AND p_fecha < p_min_fecha THEN RETURN FALSE; END IF;
        IF p_max_fecha IS NOT NULL AND p_fecha > p_max_fecha THEN RETURN FALSE; END IF;
        RETURN TRUE;
    END;
END PKG_UTILIDADES;
/

CREATE OR REPLACE PACKAGE PKG_EXCEPCIONES AS
    PROCEDURE lanzar_no_encontrado(p_entidad IN VARCHAR2, p_id IN VARCHAR2);
    PROCEDURE lanzar_operacion_invalida(p_entidad IN VARCHAR2, p_detalle IN VARCHAR2);
    PROCEDURE manejar(p_entidad IN VARCHAR2, p_operacion IN VARCHAR2, p_sqlcode IN NUMBER, p_sqlerrm IN VARCHAR2);
END PKG_EXCEPCIONES;
/

CREATE OR REPLACE PACKAGE BODY PKG_EXCEPCIONES AS
    PROCEDURE lanzar_no_encontrado(p_entidad IN VARCHAR2, p_id IN VARCHAR2) IS
    BEGIN PKG_UTILIDADES.lanzar_no_encontrado(p_entidad, p_id); END;
    PROCEDURE lanzar_operacion_invalida(p_entidad IN VARCHAR2, p_detalle IN VARCHAR2) IS
    BEGIN PKG_UTILIDADES.lanzar_operacion_invalida(p_entidad, p_detalle); END;
    PROCEDURE manejar(p_entidad IN VARCHAR2, p_operacion IN VARCHAR2, p_sqlcode IN NUMBER, p_sqlerrm IN VARCHAR2) IS
    BEGIN PKG_UTILIDADES.manejar(p_entidad, p_operacion, p_sqlcode, p_sqlerrm); END;
END PKG_EXCEPCIONES;
/

-- ============================================================
-- 2. PKG_PERSONAL
-- ============================================================
CREATE OR REPLACE PACKAGE PKG_PERSONAL AS
        PROCEDURE pr_listar_clientes(
        p_cursor OUT SYS_REFCURSOR
    );

    PROCEDURE pr_obtener_cliente(
        p_idCliente IN CLIENTE.idCliente%TYPE,
        p_cursor OUT SYS_REFCURSOR
    );

    PROCEDURE pr_insertar_cliente(
        p_idCliente IN CLIENTE.idCliente%TYPE,
        p_nombreCompleto IN CLIENTE.nombreCompleto%TYPE,
        p_direccion IN CLIENTE.direccion%TYPE,
        p_correoElectronico IN CLIENTE.correoElectronico%TYPE,
        p_telefono IN CLIENTE.telefono%TYPE,
        p_estado IN CLIENTE.estado%TYPE DEFAULT 'ACTIVO',
        p_idCliente_out OUT CLIENTE.idCliente%TYPE
    );

    PROCEDURE pr_modificar_cliente(
        p_idCliente IN CLIENTE.idCliente%TYPE,
        p_nombreCompleto IN CLIENTE.nombreCompleto%TYPE,
        p_direccion IN CLIENTE.direccion%TYPE,
        p_correoElectronico IN CLIENTE.correoElectronico%TYPE,
        p_telefono IN CLIENTE.telefono%TYPE,
        p_estado IN CLIENTE.estado%TYPE,
        p_filas_afectadas OUT NUMBER
    );

    PROCEDURE pr_eliminar_cliente(
        p_idCliente IN CLIENTE.idCliente%TYPE,
        p_filas_afectadas OUT NUMBER
    );

    PROCEDURE pr_insertar_empleado(
        p_idEmpleado IN EMPLEADO.idEmpleado%TYPE,
        p_nombreCompleto IN EMPLEADO.nombreCompleto%TYPE,
        p_telefono IN EMPLEADO.telefono%TYPE,
        p_fechaIngreso IN EMPLEADO.fechaIngreso%TYPE,
        p_estadoLaboral IN EMPLEADO.estadoLaboral%TYPE,
        p_tipoEmpleado IN EMPLEADO.tipoEmpleado%TYPE,
        p_salario IN EMPLEADO.salario%TYPE,
        p_idEmpleado_out OUT EMPLEADO.idEmpleado%TYPE
    );
    PROCEDURE pr_modificar_empleado(
        p_idEmpleado IN EMPLEADO.idEmpleado%TYPE,
        p_nombreCompleto IN EMPLEADO.nombreCompleto%TYPE,
        p_telefono IN EMPLEADO.telefono%TYPE,
        p_fechaIngreso IN EMPLEADO.fechaIngreso%TYPE,
        p_estadoLaboral IN EMPLEADO.estadoLaboral%TYPE,
        p_tipoEmpleado IN EMPLEADO.tipoEmpleado%TYPE,
        p_salario IN EMPLEADO.salario%TYPE,
        p_filas_afectadas OUT NUMBER
    );
    PROCEDURE pr_eliminar_empleado(p_idEmpleado IN EMPLEADO.idEmpleado%TYPE, p_filas_afectadas OUT NUMBER);

    PROCEDURE pr_insertar_veterinario(
        p_idEmpleado IN VETERINARIO.idEmpleado%TYPE,
        p_especialidad IN VETERINARIO.especialidad%TYPE,
        p_nroMatricula IN VETERINARIO.nroMatricula%TYPE,
        p_idEmpleado_out OUT VETERINARIO.idEmpleado%TYPE
    );
    PROCEDURE pr_modificar_veterinario(
        p_idEmpleado IN VETERINARIO.idEmpleado%TYPE,
        p_especialidad IN VETERINARIO.especialidad%TYPE,
        p_nroMatricula IN VETERINARIO.nroMatricula%TYPE,
        p_filas_afectadas OUT NUMBER
    );
    PROCEDURE pr_eliminar_veterinario(p_idEmpleado IN VETERINARIO.idEmpleado%TYPE, p_filas_afectadas OUT NUMBER);

    PROCEDURE pr_insertar_recepcionista(
        p_idEmpleado IN RECEPCIONISTA.idEmpleado%TYPE,
        p_turno IN RECEPCIONISTA.turno%TYPE,
        p_idEmpleado_out OUT RECEPCIONISTA.idEmpleado%TYPE
    );
    PROCEDURE pr_modificar_recepcionista(
        p_idEmpleado IN RECEPCIONISTA.idEmpleado%TYPE,
        p_turno IN RECEPCIONISTA.turno%TYPE,
        p_filas_afectadas OUT NUMBER
    );
    PROCEDURE pr_eliminar_recepcionista(p_idEmpleado IN RECEPCIONISTA.idEmpleado%TYPE, p_filas_afectadas OUT NUMBER);
END PKG_PERSONAL;
/

CREATE OR REPLACE PACKAGE BODY PKG_PERSONAL AS
    PROCEDURE pr_listar_clientes(
        p_cursor OUT SYS_REFCURSOR
    ) IS
    BEGIN
        OPEN p_cursor FOR
            SELECT
                TRIM(idCliente) AS id,
                nombreCompleto AS nombre,
                direccion AS direccion,
                correoElectronico AS email,
                telefono AS telefono,
                estado AS estado
            FROM CLIENTE
            ORDER BY nombreCompleto;
    EXCEPTION
        WHEN OTHERS THEN
            PKG_UTILIDADES.manejar('CLIENTE', 'LISTAR', SQLCODE, SQLERRM);
    END pr_listar_clientes;

    PROCEDURE pr_obtener_cliente(
        p_idCliente IN CLIENTE.idCliente%TYPE,
        p_cursor OUT SYS_REFCURSOR
    ) IS
    BEGIN
        OPEN p_cursor FOR
            SELECT
                TRIM(idCliente) AS id,
                nombreCompleto AS nombre,
                direccion AS direccion,
                correoElectronico AS email,
                telefono AS telefono,
                estado AS estado
            FROM CLIENTE
            WHERE TRIM(UPPER(idCliente)) = TRIM(UPPER(p_idCliente));
    EXCEPTION
        WHEN OTHERS THEN
            PKG_UTILIDADES.manejar('CLIENTE', 'OBTENER', SQLCODE, SQLERRM);
    END pr_obtener_cliente;

        PROCEDURE pr_insertar_cliente(
        p_idCliente IN CLIENTE.idCliente%TYPE,
        p_nombreCompleto IN CLIENTE.nombreCompleto%TYPE,
        p_direccion IN CLIENTE.direccion%TYPE,
        p_correoElectronico IN CLIENTE.correoElectronico%TYPE,
        p_telefono IN CLIENTE.telefono%TYPE,
        p_estado IN CLIENTE.estado%TYPE DEFAULT 'ACTIVO',
        p_idCliente_out OUT CLIENTE.idCliente%TYPE
    ) IS
    BEGIN
        INSERT INTO CLIENTE (
            idCliente,
            nombreCompleto,
            direccion,
            correoElectronico,
            telefono,
            estado
        ) VALUES (
            TRIM(UPPER(p_idCliente)),
            p_nombreCompleto,
            p_direccion,
            p_correoElectronico,
            p_telefono,
            p_estado
        )
        RETURNING idCliente INTO p_idCliente_out;
    EXCEPTION
        WHEN OTHERS THEN
            PKG_UTILIDADES.manejar('CLIENTE', 'INSERTAR', SQLCODE, SQLERRM);
    END pr_insertar_cliente;

    PROCEDURE pr_modificar_cliente(
        p_idCliente IN CLIENTE.idCliente%TYPE,
        p_nombreCompleto IN CLIENTE.nombreCompleto%TYPE,
        p_direccion IN CLIENTE.direccion%TYPE,
        p_correoElectronico IN CLIENTE.correoElectronico%TYPE,
        p_telefono IN CLIENTE.telefono%TYPE,
        p_estado IN CLIENTE.estado%TYPE,
        p_filas_afectadas OUT NUMBER
    ) IS
    BEGIN
        UPDATE CLIENTE
        SET
            nombreCompleto = p_nombreCompleto,
            direccion = p_direccion,
            correoElectronico = p_correoElectronico,
            telefono = p_telefono,
            estado = p_estado
        WHERE TRIM(UPPER(idCliente)) = TRIM(UPPER(p_idCliente));

        p_filas_afectadas := SQL%ROWCOUNT;

        IF p_filas_afectadas = 0 THEN
            PKG_UTILIDADES.lanzar_no_encontrado('CLIENTE', p_idCliente);
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLCODE BETWEEN -20999 AND -20000 THEN
                RAISE;
            END IF;

            PKG_UTILIDADES.manejar('CLIENTE', 'MODIFICAR', SQLCODE, SQLERRM);
    END pr_modificar_cliente;

    PROCEDURE pr_eliminar_cliente(
        p_idCliente IN CLIENTE.idCliente%TYPE,
        p_filas_afectadas OUT NUMBER
    ) IS
    BEGIN
        DELETE FROM CLIENTE
        WHERE TRIM(UPPER(idCliente)) = TRIM(UPPER(p_idCliente));

        p_filas_afectadas := SQL%ROWCOUNT;

        IF p_filas_afectadas = 0 THEN
            PKG_UTILIDADES.lanzar_no_encontrado('CLIENTE', p_idCliente);
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLCODE BETWEEN -20999 AND -20000 THEN
                RAISE;
            END IF;

            PKG_UTILIDADES.manejar('CLIENTE', 'ELIMINAR', SQLCODE, SQLERRM);
    END pr_eliminar_cliente;

    PROCEDURE pr_insertar_empleado(p_idEmpleado IN EMPLEADO.idEmpleado%TYPE, p_nombreCompleto IN EMPLEADO.nombreCompleto%TYPE,
        p_telefono IN EMPLEADO.telefono%TYPE, p_fechaIngreso IN EMPLEADO.fechaIngreso%TYPE,
        p_estadoLaboral IN EMPLEADO.estadoLaboral%TYPE, p_tipoEmpleado IN EMPLEADO.tipoEmpleado%TYPE,
        p_salario IN EMPLEADO.salario%TYPE, p_idEmpleado_out OUT EMPLEADO.idEmpleado%TYPE) IS
    BEGIN
        INSERT INTO EMPLEADO (idEmpleado, nombreCompleto, telefono, fechaIngreso, estadoLaboral, tipoEmpleado, salario)
        VALUES (p_idEmpleado, p_nombreCompleto, p_telefono, p_fechaIngreso, p_estadoLaboral, p_tipoEmpleado, p_salario)
        RETURNING idEmpleado INTO p_idEmpleado_out;
    EXCEPTION WHEN OTHERS THEN PKG_UTILIDADES.manejar('EMPLEADO','INSERTAR',SQLCODE,SQLERRM); END;

    PROCEDURE pr_modificar_empleado(p_idEmpleado IN EMPLEADO.idEmpleado%TYPE, p_nombreCompleto IN EMPLEADO.nombreCompleto%TYPE,
        p_telefono IN EMPLEADO.telefono%TYPE, p_fechaIngreso IN EMPLEADO.fechaIngreso%TYPE,
        p_estadoLaboral IN EMPLEADO.estadoLaboral%TYPE, p_tipoEmpleado IN EMPLEADO.tipoEmpleado%TYPE,
        p_salario IN EMPLEADO.salario%TYPE, p_filas_afectadas OUT NUMBER) IS
    BEGIN
        UPDATE EMPLEADO SET nombreCompleto=p_nombreCompleto, telefono=p_telefono, fechaIngreso=p_fechaIngreso,
               estadoLaboral=p_estadoLaboral, tipoEmpleado=p_tipoEmpleado, salario=p_salario WHERE idEmpleado=p_idEmpleado;
        p_filas_afectadas := SQL%ROWCOUNT;
        IF p_filas_afectadas = 0 THEN PKG_UTILIDADES.lanzar_no_encontrado('EMPLEADO', p_idEmpleado); END IF;
    EXCEPTION WHEN OTHERS THEN IF SQLCODE BETWEEN -20999 AND -20000 THEN RAISE; END IF; PKG_UTILIDADES.manejar('EMPLEADO','MODIFICAR',SQLCODE,SQLERRM); END;

    PROCEDURE pr_eliminar_empleado(p_idEmpleado IN EMPLEADO.idEmpleado%TYPE, p_filas_afectadas OUT NUMBER) IS
    BEGIN
        DELETE FROM EMPLEADO WHERE idEmpleado=p_idEmpleado;
        p_filas_afectadas := SQL%ROWCOUNT;
        IF p_filas_afectadas = 0 THEN PKG_UTILIDADES.lanzar_no_encontrado('EMPLEADO', p_idEmpleado); END IF;
    EXCEPTION WHEN OTHERS THEN IF SQLCODE BETWEEN -20999 AND -20000 THEN RAISE; END IF; PKG_UTILIDADES.manejar('EMPLEADO','ELIMINAR',SQLCODE,SQLERRM); END;

    PROCEDURE pr_insertar_veterinario(p_idEmpleado IN VETERINARIO.idEmpleado%TYPE, p_especialidad IN VETERINARIO.especialidad%TYPE,
        p_nroMatricula IN VETERINARIO.nroMatricula%TYPE, p_idEmpleado_out OUT VETERINARIO.idEmpleado%TYPE) IS
    BEGIN
        INSERT INTO VETERINARIO (idEmpleado, especialidad, nroMatricula)
        VALUES (p_idEmpleado, p_especialidad, p_nroMatricula)
        RETURNING idEmpleado INTO p_idEmpleado_out;
    EXCEPTION WHEN OTHERS THEN PKG_UTILIDADES.manejar('VETERINARIO','INSERTAR',SQLCODE,SQLERRM); END;

    PROCEDURE pr_modificar_veterinario(p_idEmpleado IN VETERINARIO.idEmpleado%TYPE, p_especialidad IN VETERINARIO.especialidad%TYPE,
        p_nroMatricula IN VETERINARIO.nroMatricula%TYPE, p_filas_afectadas OUT NUMBER) IS
    BEGIN
        UPDATE VETERINARIO SET especialidad=p_especialidad, nroMatricula=p_nroMatricula WHERE idEmpleado=p_idEmpleado;
        p_filas_afectadas := SQL%ROWCOUNT;
        IF p_filas_afectadas = 0 THEN PKG_UTILIDADES.lanzar_no_encontrado('VETERINARIO', p_idEmpleado); END IF;
    EXCEPTION WHEN OTHERS THEN IF SQLCODE BETWEEN -20999 AND -20000 THEN RAISE; END IF; PKG_UTILIDADES.manejar('VETERINARIO','MODIFICAR',SQLCODE,SQLERRM); END;

    PROCEDURE pr_eliminar_veterinario(p_idEmpleado IN VETERINARIO.idEmpleado%TYPE, p_filas_afectadas OUT NUMBER) IS
    BEGIN
        DELETE FROM VETERINARIO WHERE idEmpleado=p_idEmpleado;
        p_filas_afectadas := SQL%ROWCOUNT;
        IF p_filas_afectadas = 0 THEN PKG_UTILIDADES.lanzar_no_encontrado('VETERINARIO', p_idEmpleado); END IF;
    EXCEPTION WHEN OTHERS THEN IF SQLCODE BETWEEN -20999 AND -20000 THEN RAISE; END IF; PKG_UTILIDADES.manejar('VETERINARIO','ELIMINAR',SQLCODE,SQLERRM); END;

    PROCEDURE pr_insertar_recepcionista(p_idEmpleado IN RECEPCIONISTA.idEmpleado%TYPE, p_turno IN RECEPCIONISTA.turno%TYPE,
        p_idEmpleado_out OUT RECEPCIONISTA.idEmpleado%TYPE) IS
    BEGIN
        INSERT INTO RECEPCIONISTA (idEmpleado, turno) VALUES (p_idEmpleado, p_turno)
        RETURNING idEmpleado INTO p_idEmpleado_out;
    EXCEPTION WHEN OTHERS THEN PKG_UTILIDADES.manejar('RECEPCIONISTA','INSERTAR',SQLCODE,SQLERRM); END;

    PROCEDURE pr_modificar_recepcionista(p_idEmpleado IN RECEPCIONISTA.idEmpleado%TYPE, p_turno IN RECEPCIONISTA.turno%TYPE,
        p_filas_afectadas OUT NUMBER) IS
    BEGIN
        UPDATE RECEPCIONISTA SET turno=p_turno WHERE idEmpleado=p_idEmpleado;
        p_filas_afectadas := SQL%ROWCOUNT;
        IF p_filas_afectadas = 0 THEN PKG_UTILIDADES.lanzar_no_encontrado('RECEPCIONISTA', p_idEmpleado); END IF;
    EXCEPTION WHEN OTHERS THEN IF SQLCODE BETWEEN -20999 AND -20000 THEN RAISE; END IF; PKG_UTILIDADES.manejar('RECEPCIONISTA','MODIFICAR',SQLCODE,SQLERRM); END;

    PROCEDURE pr_eliminar_recepcionista(p_idEmpleado IN RECEPCIONISTA.idEmpleado%TYPE, p_filas_afectadas OUT NUMBER) IS
    BEGIN
        DELETE FROM RECEPCIONISTA WHERE idEmpleado=p_idEmpleado;
        p_filas_afectadas := SQL%ROWCOUNT;
        IF p_filas_afectadas = 0 THEN PKG_UTILIDADES.lanzar_no_encontrado('RECEPCIONISTA', p_idEmpleado); END IF;
    EXCEPTION WHEN OTHERS THEN IF SQLCODE BETWEEN -20999 AND -20000 THEN RAISE; END IF; PKG_UTILIDADES.manejar('RECEPCIONISTA','ELIMINAR',SQLCODE,SQLERRM); END;
END PKG_PERSONAL;
/

-- ============================================================
-- 3. PKG_MASCOTAS
-- ============================================================
CREATE OR REPLACE PACKAGE PKG_MASCOTAS AS
    PROCEDURE pr_insertar_mascota(
        p_codigoMascota IN MASCOTA.codigoMascota%TYPE,
        p_idCliente IN MASCOTA.idCliente%TYPE,
        p_nombre IN MASCOTA.nombre%TYPE,
        p_fechaNacimiento IN MASCOTA.fechaNacimiento%TYPE,
        p_sexo IN MASCOTA.sexo%TYPE,
        p_peso IN MASCOTA.peso%TYPE,
        p_especie IN MASCOTA.especie%TYPE,
        p_raza IN MASCOTA.raza%TYPE,
        p_codigoMascota_out OUT MASCOTA.codigoMascota%TYPE
    );
    PROCEDURE pr_modificar_mascota(
        p_codigoMascota IN MASCOTA.codigoMascota%TYPE,
        p_idCliente IN MASCOTA.idCliente%TYPE,
        p_nombre IN MASCOTA.nombre%TYPE,
        p_fechaNacimiento IN MASCOTA.fechaNacimiento%TYPE,
        p_sexo IN MASCOTA.sexo%TYPE,
        p_peso IN MASCOTA.peso%TYPE,
        p_especie IN MASCOTA.especie%TYPE,
        p_raza IN MASCOTA.raza%TYPE,
        p_filas_afectadas OUT NUMBER
    );
    PROCEDURE pr_eliminar_mascota(p_codigoMascota IN MASCOTA.codigoMascota%TYPE, p_filas_afectadas OUT NUMBER);
    FUNCTION fn_existe_mascota(p_codigoMascota IN MASCOTA.codigoMascota%TYPE) RETURN NUMBER;
    FUNCTION fn_edad_mascota_anios(p_codigoMascota IN MASCOTA.codigoMascota%TYPE) RETURN NUMBER;

    PROCEDURE pr_insertar_estado_salud(
        p_codigoMascota IN ESTADO_SALUD_MASCOTA.codigoMascota%TYPE,
        p_estadoSalud IN ESTADO_SALUD_MASCOTA.estadoSalud%TYPE,
        p_fechaRegistro IN ESTADO_SALUD_MASCOTA.fechaRegistro%TYPE DEFAULT SYSDATE,
        p_idEstadoSalud OUT ESTADO_SALUD_MASCOTA.idEstadoSalud%TYPE
    );
    PROCEDURE pr_modificar_estado_salud(
        p_idEstadoSalud IN ESTADO_SALUD_MASCOTA.idEstadoSalud%TYPE,
        p_codigoMascota IN ESTADO_SALUD_MASCOTA.codigoMascota%TYPE,
        p_estadoSalud IN ESTADO_SALUD_MASCOTA.estadoSalud%TYPE,
        p_fechaRegistro IN ESTADO_SALUD_MASCOTA.fechaRegistro%TYPE,
        p_filas_afectadas OUT NUMBER
    );
    PROCEDURE pr_eliminar_estado_salud(p_idEstadoSalud IN ESTADO_SALUD_MASCOTA.idEstadoSalud%TYPE, p_filas_afectadas OUT NUMBER);
    FUNCTION fn_ultimo_estado_salud(p_codigoMascota IN MASCOTA.codigoMascota%TYPE) RETURN ESTADO_SALUD_MASCOTA.estadoSalud%TYPE;
    FUNCTION fn_historial_clinico_mascota(p_codigoMascota IN MASCOTA.codigoMascota%TYPE) RETURN T_TAB_HISTORIAL;
END PKG_MASCOTAS;
/

CREATE OR REPLACE PACKAGE BODY PKG_MASCOTAS AS
    PROCEDURE pr_insertar_mascota(p_codigoMascota IN MASCOTA.codigoMascota%TYPE, p_idCliente IN MASCOTA.idCliente%TYPE,
        p_nombre IN MASCOTA.nombre%TYPE, p_fechaNacimiento IN MASCOTA.fechaNacimiento%TYPE, p_sexo IN MASCOTA.sexo%TYPE,
        p_peso IN MASCOTA.peso%TYPE, p_especie IN MASCOTA.especie%TYPE, p_raza IN MASCOTA.raza%TYPE,
        p_codigoMascota_out OUT MASCOTA.codigoMascota%TYPE) IS
    BEGIN
        INSERT INTO MASCOTA (codigoMascota, idCliente, nombre, fechaNacimiento, sexo, peso, especie, raza)
        VALUES (p_codigoMascota, p_idCliente, p_nombre, p_fechaNacimiento, p_sexo, p_peso, p_especie, p_raza)
        RETURNING codigoMascota INTO p_codigoMascota_out;
    EXCEPTION WHEN OTHERS THEN PKG_UTILIDADES.manejar('MASCOTA','INSERTAR',SQLCODE,SQLERRM); END;

    PROCEDURE pr_modificar_mascota(p_codigoMascota IN MASCOTA.codigoMascota%TYPE, p_idCliente IN MASCOTA.idCliente%TYPE,
        p_nombre IN MASCOTA.nombre%TYPE, p_fechaNacimiento IN MASCOTA.fechaNacimiento%TYPE, p_sexo IN MASCOTA.sexo%TYPE,
        p_peso IN MASCOTA.peso%TYPE, p_especie IN MASCOTA.especie%TYPE, p_raza IN MASCOTA.raza%TYPE,
        p_filas_afectadas OUT NUMBER) IS
    BEGIN
        UPDATE MASCOTA SET idCliente=p_idCliente, nombre=p_nombre, fechaNacimiento=p_fechaNacimiento,
               sexo=p_sexo, peso=p_peso, especie=p_especie, raza=p_raza WHERE codigoMascota=p_codigoMascota;
        p_filas_afectadas := SQL%ROWCOUNT;
        IF p_filas_afectadas = 0 THEN PKG_UTILIDADES.lanzar_no_encontrado('MASCOTA', p_codigoMascota); END IF;
    EXCEPTION WHEN OTHERS THEN IF SQLCODE BETWEEN -20999 AND -20000 THEN RAISE; END IF; PKG_UTILIDADES.manejar('MASCOTA','MODIFICAR',SQLCODE,SQLERRM); END;

    PROCEDURE pr_eliminar_mascota(p_codigoMascota IN MASCOTA.codigoMascota%TYPE, p_filas_afectadas OUT NUMBER) IS
    BEGIN
        DELETE FROM MASCOTA WHERE codigoMascota=p_codigoMascota;
        p_filas_afectadas := SQL%ROWCOUNT;
        IF p_filas_afectadas = 0 THEN PKG_UTILIDADES.lanzar_no_encontrado('MASCOTA', p_codigoMascota); END IF;
    EXCEPTION WHEN OTHERS THEN IF SQLCODE BETWEEN -20999 AND -20000 THEN RAISE; END IF; PKG_UTILIDADES.manejar('MASCOTA','ELIMINAR',SQLCODE,SQLERRM); END;

    FUNCTION fn_existe_mascota(p_codigoMascota IN MASCOTA.codigoMascota%TYPE) RETURN NUMBER IS v_total NUMBER;
    BEGIN SELECT COUNT(*) INTO v_total FROM MASCOTA WHERE codigoMascota=p_codigoMascota; RETURN CASE WHEN v_total>0 THEN 1 ELSE 0 END; END;

    FUNCTION fn_edad_mascota_anios(p_codigoMascota IN MASCOTA.codigoMascota%TYPE) RETURN NUMBER IS v_fecha DATE;
    BEGIN
        SELECT fechaNacimiento INTO v_fecha FROM MASCOTA WHERE codigoMascota=p_codigoMascota;
        IF v_fecha IS NULL THEN RETURN NULL; END IF;
        RETURN FLOOR(MONTHS_BETWEEN(SYSDATE, v_fecha) / 12);
    EXCEPTION WHEN NO_DATA_FOUND THEN PKG_UTILIDADES.lanzar_no_encontrado('MASCOTA', p_codigoMascota); END;

    PROCEDURE pr_insertar_estado_salud(p_codigoMascota IN ESTADO_SALUD_MASCOTA.codigoMascota%TYPE,
        p_estadoSalud IN ESTADO_SALUD_MASCOTA.estadoSalud%TYPE, p_fechaRegistro IN ESTADO_SALUD_MASCOTA.fechaRegistro%TYPE DEFAULT SYSDATE,
        p_idEstadoSalud OUT ESTADO_SALUD_MASCOTA.idEstadoSalud%TYPE) IS
    BEGIN
        INSERT INTO ESTADO_SALUD_MASCOTA (idEstadoSalud, codigoMascota, estadoSalud, fechaRegistro)
        VALUES (SEQ_ESTADO_SALUD.NEXTVAL, p_codigoMascota, p_estadoSalud, NVL(p_fechaRegistro, SYSDATE))
        RETURNING idEstadoSalud INTO p_idEstadoSalud;
    EXCEPTION WHEN OTHERS THEN PKG_UTILIDADES.manejar('ESTADO_SALUD_MASCOTA','INSERTAR',SQLCODE,SQLERRM); END;

    PROCEDURE pr_modificar_estado_salud(p_idEstadoSalud IN ESTADO_SALUD_MASCOTA.idEstadoSalud%TYPE,
        p_codigoMascota IN ESTADO_SALUD_MASCOTA.codigoMascota%TYPE, p_estadoSalud IN ESTADO_SALUD_MASCOTA.estadoSalud%TYPE,
        p_fechaRegistro IN ESTADO_SALUD_MASCOTA.fechaRegistro%TYPE, p_filas_afectadas OUT NUMBER) IS
    BEGIN
        UPDATE ESTADO_SALUD_MASCOTA SET codigoMascota=p_codigoMascota, estadoSalud=p_estadoSalud, fechaRegistro=p_fechaRegistro
        WHERE idEstadoSalud=p_idEstadoSalud;
        p_filas_afectadas := SQL%ROWCOUNT;
        IF p_filas_afectadas = 0 THEN PKG_UTILIDADES.lanzar_no_encontrado('ESTADO_SALUD_MASCOTA', TO_CHAR(p_idEstadoSalud)); END IF;
    EXCEPTION WHEN OTHERS THEN IF SQLCODE BETWEEN -20999 AND -20000 THEN RAISE; END IF; PKG_UTILIDADES.manejar('ESTADO_SALUD_MASCOTA','MODIFICAR',SQLCODE,SQLERRM); END;

    PROCEDURE pr_eliminar_estado_salud(p_idEstadoSalud IN ESTADO_SALUD_MASCOTA.idEstadoSalud%TYPE, p_filas_afectadas OUT NUMBER) IS
    BEGIN
        DELETE FROM ESTADO_SALUD_MASCOTA WHERE idEstadoSalud=p_idEstadoSalud;
        p_filas_afectadas := SQL%ROWCOUNT;
        IF p_filas_afectadas = 0 THEN PKG_UTILIDADES.lanzar_no_encontrado('ESTADO_SALUD_MASCOTA', TO_CHAR(p_idEstadoSalud)); END IF;
    EXCEPTION WHEN OTHERS THEN IF SQLCODE BETWEEN -20999 AND -20000 THEN RAISE; END IF; PKG_UTILIDADES.manejar('ESTADO_SALUD_MASCOTA','ELIMINAR',SQLCODE,SQLERRM); END;

    FUNCTION fn_ultimo_estado_salud(p_codigoMascota IN MASCOTA.codigoMascota%TYPE) RETURN ESTADO_SALUD_MASCOTA.estadoSalud%TYPE IS v_estado ESTADO_SALUD_MASCOTA.estadoSalud%TYPE;
    BEGIN
        SELECT estadoSalud INTO v_estado FROM (
            SELECT estadoSalud FROM ESTADO_SALUD_MASCOTA WHERE codigoMascota=p_codigoMascota ORDER BY fechaRegistro DESC, idEstadoSalud DESC
        ) WHERE ROWNUM=1;
        RETURN v_estado;
    EXCEPTION WHEN NO_DATA_FOUND THEN RETURN NULL; END;

    FUNCTION fn_historial_clinico_mascota(p_codigoMascota IN MASCOTA.codigoMascota%TYPE) RETURN T_TAB_HISTORIAL IS
        v_historial T_TAB_HISTORIAL := T_TAB_HISTORIAL();
    BEGIN
        IF fn_existe_mascota(p_codigoMascota) = 0 THEN PKG_UTILIDADES.lanzar_no_encontrado('MASCOTA', p_codigoMascota); END IF;
        FOR r IN (
            SELECT cv.idConsulta, cv.fechaAtencionReal, ci.motivoConsulta, cv.observaciones,
                   d.idDiagnostico, d.descripcionCondicion, d.nivelGravedad, d.estado AS estadoDiag,
                   t.idTratamiento, t.tipo AS tipoTratamiento, t.estado AS estadoTratamiento
              FROM CITA ci
              JOIN CONSULTA_VETERINARIA cv ON cv.idCita = ci.idCita
              LEFT JOIN DIAGNOSTICO d ON d.idConsulta = cv.idConsulta
              LEFT JOIN TRATAMIENTO t ON t.idDiagnostico = d.idDiagnostico
             WHERE ci.codigoMascota = p_codigoMascota
             ORDER BY cv.fechaAtencionReal DESC, d.idDiagnostico, t.idTratamiento
        ) LOOP
            v_historial.EXTEND;
            v_historial(v_historial.LAST) := T_FILA_HISTORIAL(r.idConsulta, r.fechaAtencionReal, r.motivoConsulta, r.observaciones,
                r.idDiagnostico, r.descripcionCondicion, r.nivelGravedad, r.estadoDiag, r.idTratamiento, r.tipoTratamiento, r.estadoTratamiento);
        END LOOP;
        RETURN v_historial;
    EXCEPTION WHEN OTHERS THEN IF SQLCODE BETWEEN -20999 AND -20000 THEN RAISE; END IF; PKG_UTILIDADES.manejar('MASCOTA','HISTORIAL',SQLCODE,SQLERRM); END;
END PKG_MASCOTAS;
/

-- ============================================================
-- 4. PKG_AGENDAMIENTO
-- ============================================================
CREATE OR REPLACE PACKAGE PKG_AGENDAMIENTO AS
    PROCEDURE pr_insertar_cita(
        p_idCita IN CITA.idCita%TYPE,
        p_codigoMascota IN CITA.codigoMascota%TYPE,
        p_idVeterinario IN CITA.idVeterinario%TYPE,
        p_idRecepcionista IN CITA.idRecepcionista%TYPE,
        p_fecha IN CITA.fecha%TYPE,
        p_hora IN CITA.hora%TYPE,
        p_motivoConsulta IN CITA.motivoConsulta%TYPE,
        p_estadoCita IN CITA.estadoCita%TYPE,
        p_idCita_out OUT CITA.idCita%TYPE
    );
    PROCEDURE pr_modificar_cita(
        p_idCita IN CITA.idCita%TYPE,
        p_codigoMascota IN CITA.codigoMascota%TYPE,
        p_idVeterinario IN CITA.idVeterinario%TYPE,
        p_idRecepcionista IN CITA.idRecepcionista%TYPE,
        p_fecha IN CITA.fecha%TYPE,
        p_hora IN CITA.hora%TYPE,
        p_motivoConsulta IN CITA.motivoConsulta%TYPE,
        p_estadoCita IN CITA.estadoCita%TYPE,
        p_filas_afectadas OUT NUMBER
    );
    PROCEDURE pr_eliminar_cita(p_idCita IN CITA.idCita%TYPE, p_filas_afectadas OUT NUMBER);
    PROCEDURE pr_agenda_citas_dia(p_fecha IN DATE DEFAULT TRUNC(SYSDATE));
END PKG_AGENDAMIENTO;
/

CREATE OR REPLACE PACKAGE BODY PKG_AGENDAMIENTO AS
    PROCEDURE pr_insertar_cita(p_idCita IN CITA.idCita%TYPE, p_codigoMascota IN CITA.codigoMascota%TYPE,
        p_idVeterinario IN CITA.idVeterinario%TYPE, p_idRecepcionista IN CITA.idRecepcionista%TYPE,
        p_fecha IN CITA.fecha%TYPE, p_hora IN CITA.hora%TYPE, p_motivoConsulta IN CITA.motivoConsulta%TYPE,
        p_estadoCita IN CITA.estadoCita%TYPE, p_idCita_out OUT CITA.idCita%TYPE) IS
    BEGIN
        INSERT INTO CITA (idCita, codigoMascota, idVeterinario, idRecepcionista, fecha, hora, motivoConsulta, estadoCita)
        VALUES (p_idCita, p_codigoMascota, p_idVeterinario, p_idRecepcionista, p_fecha, p_hora, p_motivoConsulta, p_estadoCita)
        RETURNING idCita INTO p_idCita_out;
    EXCEPTION WHEN OTHERS THEN PKG_UTILIDADES.manejar('CITA','INSERTAR',SQLCODE,SQLERRM); END;

    PROCEDURE pr_modificar_cita(p_idCita IN CITA.idCita%TYPE, p_codigoMascota IN CITA.codigoMascota%TYPE,
        p_idVeterinario IN CITA.idVeterinario%TYPE, p_idRecepcionista IN CITA.idRecepcionista%TYPE,
        p_fecha IN CITA.fecha%TYPE, p_hora IN CITA.hora%TYPE, p_motivoConsulta IN CITA.motivoConsulta%TYPE,
        p_estadoCita IN CITA.estadoCita%TYPE, p_filas_afectadas OUT NUMBER) IS
    BEGIN
        UPDATE CITA SET codigoMascota=p_codigoMascota, idVeterinario=p_idVeterinario, idRecepcionista=p_idRecepcionista,
               fecha=p_fecha, hora=p_hora, motivoConsulta=p_motivoConsulta, estadoCita=p_estadoCita WHERE idCita=p_idCita;
        p_filas_afectadas := SQL%ROWCOUNT;
        IF p_filas_afectadas = 0 THEN PKG_UTILIDADES.lanzar_no_encontrado('CITA', p_idCita); END IF;
    EXCEPTION WHEN OTHERS THEN IF SQLCODE BETWEEN -20999 AND -20000 THEN RAISE; END IF; PKG_UTILIDADES.manejar('CITA','MODIFICAR',SQLCODE,SQLERRM); END;

    PROCEDURE pr_eliminar_cita(p_idCita IN CITA.idCita%TYPE, p_filas_afectadas OUT NUMBER) IS
    BEGIN
        DELETE FROM CITA WHERE idCita=p_idCita;
        p_filas_afectadas := SQL%ROWCOUNT;
        IF p_filas_afectadas = 0 THEN PKG_UTILIDADES.lanzar_no_encontrado('CITA', p_idCita); END IF;
    EXCEPTION WHEN OTHERS THEN IF SQLCODE BETWEEN -20999 AND -20000 THEN RAISE; END IF; PKG_UTILIDADES.manejar('CITA','ELIMINAR',SQLCODE,SQLERRM); END;

    PROCEDURE pr_agenda_citas_dia(p_fecha IN DATE DEFAULT TRUNC(SYSDATE)) IS
        v_agenda T_TAB_CITAS := T_TAB_CITAS();
    BEGIN
        FOR r IN (
            SELECT ci.idCita,
                   TO_CHAR(EXTRACT(HOUR FROM ci.hora), 'FM00') || ':' || TO_CHAR(EXTRACT(MINUTE FROM ci.hora), 'FM00') AS horaCita,
                   ma.nombre AS nombreMascota, ma.especie AS especieMascota, cl.nombreCompleto AS nombreCliente,
                   cl.telefono AS telefonoCliente, ev.nombreCompleto AS nombreVet, ci.motivoConsulta, ci.estadoCita
              FROM CITA ci
              JOIN MASCOTA ma ON ma.codigoMascota=ci.codigoMascota
              JOIN CLIENTE cl ON cl.idCliente=ma.idCliente
              JOIN EMPLEADO ev ON ev.idEmpleado=ci.idVeterinario
             WHERE TRUNC(ci.fecha)=TRUNC(p_fecha)
               AND ci.estadoCita IN ('PROGRAMADA','CONFIRMADA')
             ORDER BY ci.hora
        ) LOOP
            v_agenda.EXTEND;
            v_agenda(v_agenda.LAST) := T_FILA_CITA(r.idCita, r.horaCita, r.nombreMascota, r.especieMascota, r.nombreCliente,
                r.telefonoCliente, r.nombreVet, r.motivoConsulta, r.estadoCita);
        END LOOP;
        DBMS_OUTPUT.PUT_LINE('========================================');
        DBMS_OUTPUT.PUT_LINE('  AGENDA: ' || TO_CHAR(p_fecha, 'DD/MM/YYYY') || '  (' || v_agenda.COUNT || ' cita(s))');
        DBMS_OUTPUT.PUT_LINE('========================================');
        IF v_agenda.COUNT = 0 THEN
            DBMS_OUTPUT.PUT_LINE('  Sin citas programadas o confirmadas.');
        ELSE
            FOR i IN 1 .. v_agenda.COUNT LOOP
                DBMS_OUTPUT.PUT_LINE('[' || v_agenda(i).horaCita || '] ' || v_agenda(i).idCita || ' | ' ||
                    v_agenda(i).nombreMascota || ' (' || v_agenda(i).especieMascota || ') - ' || v_agenda(i).nombreCliente ||
                    ' Tel: ' || NVL(v_agenda(i).telefonoCliente, '-'));
                DBMS_OUTPUT.PUT_LINE('   Vet: ' || v_agenda(i).nombreVet || ' | Motivo: ' || NVL(v_agenda(i).motivoConsulta, '-') || ' | ' || v_agenda(i).estadoCita);
                DBMS_OUTPUT.PUT_LINE('----------------------------------------');
            END LOOP;
        END IF;
    EXCEPTION WHEN OTHERS THEN PKG_UTILIDADES.manejar('CITA','AGENDA DIA',SQLCODE,SQLERRM); END;
END PKG_AGENDAMIENTO;
/

-- ============================================================
-- 5. PKG_CONSULTAS_MEDICAS
-- ============================================================
CREATE OR REPLACE PACKAGE PKG_CONSULTAS_MEDICAS AS
    PROCEDURE pr_insertar_consulta(p_idConsulta IN CONSULTA_VETERINARIA.idConsulta%TYPE, p_idCita IN CONSULTA_VETERINARIA.idCita%TYPE,
        p_idServicio IN CONSULTA_VETERINARIA.idServicio%TYPE, p_temperatura IN CONSULTA_VETERINARIA.temperatura%TYPE,
        p_pesoConsulta IN CONSULTA_VETERINARIA.pesoConsulta%TYPE, p_observaciones IN CONSULTA_VETERINARIA.observaciones%TYPE,
        p_recomendaciones IN CONSULTA_VETERINARIA.recomendaciones%TYPE, p_fechaAtencionReal IN CONSULTA_VETERINARIA.fechaAtencionReal%TYPE,
        p_idConsulta_out OUT CONSULTA_VETERINARIA.idConsulta%TYPE);
    PROCEDURE pr_modificar_consulta(p_idConsulta IN CONSULTA_VETERINARIA.idConsulta%TYPE, p_idCita IN CONSULTA_VETERINARIA.idCita%TYPE,
        p_idServicio IN CONSULTA_VETERINARIA.idServicio%TYPE, p_temperatura IN CONSULTA_VETERINARIA.temperatura%TYPE,
        p_pesoConsulta IN CONSULTA_VETERINARIA.pesoConsulta%TYPE, p_observaciones IN CONSULTA_VETERINARIA.observaciones%TYPE,
        p_recomendaciones IN CONSULTA_VETERINARIA.recomendaciones%TYPE, p_fechaAtencionReal IN CONSULTA_VETERINARIA.fechaAtencionReal%TYPE,
        p_filas_afectadas OUT NUMBER);
    PROCEDURE pr_eliminar_consulta(p_idConsulta IN CONSULTA_VETERINARIA.idConsulta%TYPE, p_filas_afectadas OUT NUMBER);

    PROCEDURE pr_insertar_diagnostico(p_idDiagnostico IN DIAGNOSTICO.idDiagnostico%TYPE, p_idConsulta IN DIAGNOSTICO.idConsulta%TYPE,
        p_descripcionCondicion IN DIAGNOSTICO.descripcionCondicion%TYPE, p_nivelGravedad IN DIAGNOSTICO.nivelGravedad%TYPE,
        p_tipoAfeccion IN DIAGNOSTICO.tipoAfeccion%TYPE, p_estado IN DIAGNOSTICO.estado%TYPE,
        p_idDiagnostico_out OUT DIAGNOSTICO.idDiagnostico%TYPE);
    PROCEDURE pr_modificar_diagnostico(p_idDiagnostico IN DIAGNOSTICO.idDiagnostico%TYPE, p_idConsulta IN DIAGNOSTICO.idConsulta%TYPE,
        p_descripcionCondicion IN DIAGNOSTICO.descripcionCondicion%TYPE, p_nivelGravedad IN DIAGNOSTICO.nivelGravedad%TYPE,
        p_tipoAfeccion IN DIAGNOSTICO.tipoAfeccion%TYPE, p_estado IN DIAGNOSTICO.estado%TYPE, p_filas_afectadas OUT NUMBER);
    PROCEDURE pr_eliminar_diagnostico(p_idDiagnostico IN DIAGNOSTICO.idDiagnostico%TYPE, p_filas_afectadas OUT NUMBER);

    PROCEDURE pr_insertar_tratamiento(p_idTratamiento IN TRATAMIENTO.idTratamiento%TYPE, p_idDiagnostico IN TRATAMIENTO.idDiagnostico%TYPE,
        p_idVeterinario IN TRATAMIENTO.idVeterinario%TYPE, p_idServicio IN TRATAMIENTO.idServicio%TYPE, p_tipo IN TRATAMIENTO.tipo%TYPE,
        p_fechaInicio IN TRATAMIENTO.fechaInicio%TYPE, p_fechaFinEstimada IN TRATAMIENTO.fechaFinEstimada%TYPE,
        p_indicaciones IN TRATAMIENTO.indicaciones%TYPE, p_estado IN TRATAMIENTO.estado%TYPE,
        p_idTratamiento_out OUT TRATAMIENTO.idTratamiento%TYPE);
    PROCEDURE pr_modificar_tratamiento(p_idTratamiento IN TRATAMIENTO.idTratamiento%TYPE, p_idDiagnostico IN TRATAMIENTO.idDiagnostico%TYPE,
        p_idVeterinario IN TRATAMIENTO.idVeterinario%TYPE, p_idServicio IN TRATAMIENTO.idServicio%TYPE, p_tipo IN TRATAMIENTO.tipo%TYPE,
        p_fechaInicio IN TRATAMIENTO.fechaInicio%TYPE, p_fechaFinEstimada IN TRATAMIENTO.fechaFinEstimada%TYPE,
        p_indicaciones IN TRATAMIENTO.indicaciones%TYPE, p_estado IN TRATAMIENTO.estado%TYPE, p_filas_afectadas OUT NUMBER);
    PROCEDURE pr_eliminar_tratamiento(p_idTratamiento IN TRATAMIENTO.idTratamiento%TYPE, p_filas_afectadas OUT NUMBER);

    PROCEDURE pr_insertar_tratamiento_medicamento(p_idTratamiento IN TRATAMIENTO_MEDICAMENTO.idTratamiento%TYPE,
        p_idMedicamento IN TRATAMIENTO_MEDICAMENTO.idMedicamento%TYPE, p_dosis IN TRATAMIENTO_MEDICAMENTO.dosis%TYPE,
        p_frecuencia IN TRATAMIENTO_MEDICAMENTO.frecuencia%TYPE, p_viaAdministracion IN TRATAMIENTO_MEDICAMENTO.viaAdministracion%TYPE,
        p_duracion IN TRATAMIENTO_MEDICAMENTO.duracion%TYPE);
    PROCEDURE pr_modificar_tratamiento_medicamento(p_idTratamiento IN TRATAMIENTO_MEDICAMENTO.idTratamiento%TYPE,
        p_idMedicamento IN TRATAMIENTO_MEDICAMENTO.idMedicamento%TYPE, p_dosis IN TRATAMIENTO_MEDICAMENTO.dosis%TYPE,
        p_frecuencia IN TRATAMIENTO_MEDICAMENTO.frecuencia%TYPE, p_viaAdministracion IN TRATAMIENTO_MEDICAMENTO.viaAdministracion%TYPE,
        p_duracion IN TRATAMIENTO_MEDICAMENTO.duracion%TYPE, p_filas_afectadas OUT NUMBER);
    PROCEDURE pr_eliminar_tratamiento_medicamento(p_idTratamiento IN TRATAMIENTO_MEDICAMENTO.idTratamiento%TYPE,
        p_idMedicamento IN TRATAMIENTO_MEDICAMENTO.idMedicamento%TYPE, p_filas_afectadas OUT NUMBER);
END PKG_CONSULTAS_MEDICAS;
/

CREATE OR REPLACE PACKAGE BODY PKG_CONSULTAS_MEDICAS AS
    PROCEDURE pr_insertar_consulta(p_idConsulta IN CONSULTA_VETERINARIA.idConsulta%TYPE, p_idCita IN CONSULTA_VETERINARIA.idCita%TYPE,
        p_idServicio IN CONSULTA_VETERINARIA.idServicio%TYPE, p_temperatura IN CONSULTA_VETERINARIA.temperatura%TYPE,
        p_pesoConsulta IN CONSULTA_VETERINARIA.pesoConsulta%TYPE, p_observaciones IN CONSULTA_VETERINARIA.observaciones%TYPE,
        p_recomendaciones IN CONSULTA_VETERINARIA.recomendaciones%TYPE, p_fechaAtencionReal IN CONSULTA_VETERINARIA.fechaAtencionReal%TYPE,
        p_idConsulta_out OUT CONSULTA_VETERINARIA.idConsulta%TYPE) IS
    BEGIN
        INSERT INTO CONSULTA_VETERINARIA (idConsulta,idCita,idServicio,temperatura,pesoConsulta,observaciones,recomendaciones,fechaAtencionReal)
        VALUES (p_idConsulta,p_idCita,p_idServicio,p_temperatura,p_pesoConsulta,p_observaciones,p_recomendaciones,p_fechaAtencionReal)
        RETURNING idConsulta INTO p_idConsulta_out;
    EXCEPTION WHEN OTHERS THEN PKG_UTILIDADES.manejar('CONSULTA_VETERINARIA','INSERTAR',SQLCODE,SQLERRM); END;

    PROCEDURE pr_modificar_consulta(p_idConsulta IN CONSULTA_VETERINARIA.idConsulta%TYPE, p_idCita IN CONSULTA_VETERINARIA.idCita%TYPE,
        p_idServicio IN CONSULTA_VETERINARIA.idServicio%TYPE, p_temperatura IN CONSULTA_VETERINARIA.temperatura%TYPE,
        p_pesoConsulta IN CONSULTA_VETERINARIA.pesoConsulta%TYPE, p_observaciones IN CONSULTA_VETERINARIA.observaciones%TYPE,
        p_recomendaciones IN CONSULTA_VETERINARIA.recomendaciones%TYPE, p_fechaAtencionReal IN CONSULTA_VETERINARIA.fechaAtencionReal%TYPE,
        p_filas_afectadas OUT NUMBER) IS
    BEGIN
        UPDATE CONSULTA_VETERINARIA SET idCita=p_idCita,idServicio=p_idServicio,temperatura=p_temperatura,pesoConsulta=p_pesoConsulta,
            observaciones=p_observaciones,recomendaciones=p_recomendaciones,fechaAtencionReal=p_fechaAtencionReal WHERE idConsulta=p_idConsulta;
        p_filas_afectadas := SQL%ROWCOUNT;
        IF p_filas_afectadas=0 THEN PKG_UTILIDADES.lanzar_no_encontrado('CONSULTA_VETERINARIA', p_idConsulta); END IF;
    EXCEPTION WHEN OTHERS THEN IF SQLCODE BETWEEN -20999 AND -20000 THEN RAISE; END IF; PKG_UTILIDADES.manejar('CONSULTA_VETERINARIA','MODIFICAR',SQLCODE,SQLERRM); END;

    PROCEDURE pr_eliminar_consulta(p_idConsulta IN CONSULTA_VETERINARIA.idConsulta%TYPE, p_filas_afectadas OUT NUMBER) IS
    BEGIN DELETE FROM CONSULTA_VETERINARIA WHERE idConsulta=p_idConsulta; p_filas_afectadas:=SQL%ROWCOUNT; IF p_filas_afectadas=0 THEN PKG_UTILIDADES.lanzar_no_encontrado('CONSULTA_VETERINARIA',p_idConsulta); END IF;
    EXCEPTION WHEN OTHERS THEN IF SQLCODE BETWEEN -20999 AND -20000 THEN RAISE; END IF; PKG_UTILIDADES.manejar('CONSULTA_VETERINARIA','ELIMINAR',SQLCODE,SQLERRM); END;

    PROCEDURE pr_insertar_diagnostico(p_idDiagnostico IN DIAGNOSTICO.idDiagnostico%TYPE, p_idConsulta IN DIAGNOSTICO.idConsulta%TYPE,
        p_descripcionCondicion IN DIAGNOSTICO.descripcionCondicion%TYPE, p_nivelGravedad IN DIAGNOSTICO.nivelGravedad%TYPE,
        p_tipoAfeccion IN DIAGNOSTICO.tipoAfeccion%TYPE, p_estado IN DIAGNOSTICO.estado%TYPE,
        p_idDiagnostico_out OUT DIAGNOSTICO.idDiagnostico%TYPE) IS
    BEGIN
        INSERT INTO DIAGNOSTICO (idDiagnostico,idConsulta,descripcionCondicion,nivelGravedad,tipoAfeccion,estado)
        VALUES (p_idDiagnostico,p_idConsulta,p_descripcionCondicion,p_nivelGravedad,p_tipoAfeccion,p_estado)
        RETURNING idDiagnostico INTO p_idDiagnostico_out;
    EXCEPTION WHEN OTHERS THEN PKG_UTILIDADES.manejar('DIAGNOSTICO','INSERTAR',SQLCODE,SQLERRM); END;

    PROCEDURE pr_modificar_diagnostico(p_idDiagnostico IN DIAGNOSTICO.idDiagnostico%TYPE, p_idConsulta IN DIAGNOSTICO.idConsulta%TYPE,
        p_descripcionCondicion IN DIAGNOSTICO.descripcionCondicion%TYPE, p_nivelGravedad IN DIAGNOSTICO.nivelGravedad%TYPE,
        p_tipoAfeccion IN DIAGNOSTICO.tipoAfeccion%TYPE, p_estado IN DIAGNOSTICO.estado%TYPE, p_filas_afectadas OUT NUMBER) IS
    BEGIN
        UPDATE DIAGNOSTICO SET idConsulta=p_idConsulta,descripcionCondicion=p_descripcionCondicion,nivelGravedad=p_nivelGravedad,tipoAfeccion=p_tipoAfeccion,estado=p_estado WHERE idDiagnostico=p_idDiagnostico;
        p_filas_afectadas:=SQL%ROWCOUNT; IF p_filas_afectadas=0 THEN PKG_UTILIDADES.lanzar_no_encontrado('DIAGNOSTICO',p_idDiagnostico); END IF;
    EXCEPTION WHEN OTHERS THEN IF SQLCODE BETWEEN -20999 AND -20000 THEN RAISE; END IF; PKG_UTILIDADES.manejar('DIAGNOSTICO','MODIFICAR',SQLCODE,SQLERRM); END;

    PROCEDURE pr_eliminar_diagnostico(p_idDiagnostico IN DIAGNOSTICO.idDiagnostico%TYPE, p_filas_afectadas OUT NUMBER) IS
    BEGIN DELETE FROM DIAGNOSTICO WHERE idDiagnostico=p_idDiagnostico; p_filas_afectadas:=SQL%ROWCOUNT; IF p_filas_afectadas=0 THEN PKG_UTILIDADES.lanzar_no_encontrado('DIAGNOSTICO',p_idDiagnostico); END IF;
    EXCEPTION WHEN OTHERS THEN IF SQLCODE BETWEEN -20999 AND -20000 THEN RAISE; END IF; PKG_UTILIDADES.manejar('DIAGNOSTICO','ELIMINAR',SQLCODE,SQLERRM); END;

    PROCEDURE pr_insertar_tratamiento(p_idTratamiento IN TRATAMIENTO.idTratamiento%TYPE, p_idDiagnostico IN TRATAMIENTO.idDiagnostico%TYPE,
        p_idVeterinario IN TRATAMIENTO.idVeterinario%TYPE, p_idServicio IN TRATAMIENTO.idServicio%TYPE, p_tipo IN TRATAMIENTO.tipo%TYPE,
        p_fechaInicio IN TRATAMIENTO.fechaInicio%TYPE, p_fechaFinEstimada IN TRATAMIENTO.fechaFinEstimada%TYPE,
        p_indicaciones IN TRATAMIENTO.indicaciones%TYPE, p_estado IN TRATAMIENTO.estado%TYPE,
        p_idTratamiento_out OUT TRATAMIENTO.idTratamiento%TYPE) IS
    BEGIN
        INSERT INTO TRATAMIENTO (idTratamiento,idDiagnostico,idVeterinario,idServicio,tipo,fechaInicio,fechaFinEstimada,indicaciones,estado)
        VALUES (p_idTratamiento,p_idDiagnostico,p_idVeterinario,p_idServicio,p_tipo,p_fechaInicio,p_fechaFinEstimada,p_indicaciones,p_estado)
        RETURNING idTratamiento INTO p_idTratamiento_out;
    EXCEPTION WHEN OTHERS THEN PKG_UTILIDADES.manejar('TRATAMIENTO','INSERTAR',SQLCODE,SQLERRM); END;

    PROCEDURE pr_modificar_tratamiento(p_idTratamiento IN TRATAMIENTO.idTratamiento%TYPE, p_idDiagnostico IN TRATAMIENTO.idDiagnostico%TYPE,
        p_idVeterinario IN TRATAMIENTO.idVeterinario%TYPE, p_idServicio IN TRATAMIENTO.idServicio%TYPE, p_tipo IN TRATAMIENTO.tipo%TYPE,
        p_fechaInicio IN TRATAMIENTO.fechaInicio%TYPE, p_fechaFinEstimada IN TRATAMIENTO.fechaFinEstimada%TYPE,
        p_indicaciones IN TRATAMIENTO.indicaciones%TYPE, p_estado IN TRATAMIENTO.estado%TYPE, p_filas_afectadas OUT NUMBER) IS
    BEGIN
        UPDATE TRATAMIENTO SET idDiagnostico=p_idDiagnostico,idVeterinario=p_idVeterinario,idServicio=p_idServicio,tipo=p_tipo,
            fechaInicio=p_fechaInicio,fechaFinEstimada=p_fechaFinEstimada,indicaciones=p_indicaciones,estado=p_estado WHERE idTratamiento=p_idTratamiento;
        p_filas_afectadas:=SQL%ROWCOUNT; IF p_filas_afectadas=0 THEN PKG_UTILIDADES.lanzar_no_encontrado('TRATAMIENTO',p_idTratamiento); END IF;
    EXCEPTION WHEN OTHERS THEN IF SQLCODE BETWEEN -20999 AND -20000 THEN RAISE; END IF; PKG_UTILIDADES.manejar('TRATAMIENTO','MODIFICAR',SQLCODE,SQLERRM); END;

    PROCEDURE pr_eliminar_tratamiento(p_idTratamiento IN TRATAMIENTO.idTratamiento%TYPE, p_filas_afectadas OUT NUMBER) IS
    BEGIN DELETE FROM TRATAMIENTO WHERE idTratamiento=p_idTratamiento; p_filas_afectadas:=SQL%ROWCOUNT; IF p_filas_afectadas=0 THEN PKG_UTILIDADES.lanzar_no_encontrado('TRATAMIENTO',p_idTratamiento); END IF;
    EXCEPTION WHEN OTHERS THEN IF SQLCODE BETWEEN -20999 AND -20000 THEN RAISE; END IF; PKG_UTILIDADES.manejar('TRATAMIENTO','ELIMINAR',SQLCODE,SQLERRM); END;

    PROCEDURE pr_insertar_tratamiento_medicamento(p_idTratamiento IN TRATAMIENTO_MEDICAMENTO.idTratamiento%TYPE,
        p_idMedicamento IN TRATAMIENTO_MEDICAMENTO.idMedicamento%TYPE, p_dosis IN TRATAMIENTO_MEDICAMENTO.dosis%TYPE,
        p_frecuencia IN TRATAMIENTO_MEDICAMENTO.frecuencia%TYPE, p_viaAdministracion IN TRATAMIENTO_MEDICAMENTO.viaAdministracion%TYPE,
        p_duracion IN TRATAMIENTO_MEDICAMENTO.duracion%TYPE) IS
    BEGIN
        INSERT INTO TRATAMIENTO_MEDICAMENTO (idTratamiento,idMedicamento,dosis,frecuencia,viaAdministracion,duracion)
        VALUES (p_idTratamiento,p_idMedicamento,p_dosis,p_frecuencia,p_viaAdministracion,p_duracion);
    EXCEPTION WHEN OTHERS THEN PKG_UTILIDADES.manejar('TRATAMIENTO_MEDICAMENTO','INSERTAR',SQLCODE,SQLERRM); END;

    PROCEDURE pr_modificar_tratamiento_medicamento(p_idTratamiento IN TRATAMIENTO_MEDICAMENTO.idTratamiento%TYPE,
        p_idMedicamento IN TRATAMIENTO_MEDICAMENTO.idMedicamento%TYPE, p_dosis IN TRATAMIENTO_MEDICAMENTO.dosis%TYPE,
        p_frecuencia IN TRATAMIENTO_MEDICAMENTO.frecuencia%TYPE, p_viaAdministracion IN TRATAMIENTO_MEDICAMENTO.viaAdministracion%TYPE,
        p_duracion IN TRATAMIENTO_MEDICAMENTO.duracion%TYPE, p_filas_afectadas OUT NUMBER) IS
    BEGIN
        UPDATE TRATAMIENTO_MEDICAMENTO SET dosis=p_dosis,frecuencia=p_frecuencia,viaAdministracion=p_viaAdministracion,duracion=p_duracion
        WHERE idTratamiento=p_idTratamiento AND idMedicamento=p_idMedicamento;
        p_filas_afectadas:=SQL%ROWCOUNT; IF p_filas_afectadas=0 THEN PKG_UTILIDADES.lanzar_no_encontrado('TRATAMIENTO_MEDICAMENTO',p_idTratamiento||'/'||p_idMedicamento); END IF;
    EXCEPTION WHEN OTHERS THEN IF SQLCODE BETWEEN -20999 AND -20000 THEN RAISE; END IF; PKG_UTILIDADES.manejar('TRATAMIENTO_MEDICAMENTO','MODIFICAR',SQLCODE,SQLERRM); END;

    PROCEDURE pr_eliminar_tratamiento_medicamento(p_idTratamiento IN TRATAMIENTO_MEDICAMENTO.idTratamiento%TYPE,
        p_idMedicamento IN TRATAMIENTO_MEDICAMENTO.idMedicamento%TYPE, p_filas_afectadas OUT NUMBER) IS
    BEGIN DELETE FROM TRATAMIENTO_MEDICAMENTO WHERE idTratamiento=p_idTratamiento AND idMedicamento=p_idMedicamento; p_filas_afectadas:=SQL%ROWCOUNT; IF p_filas_afectadas=0 THEN PKG_UTILIDADES.lanzar_no_encontrado('TRATAMIENTO_MEDICAMENTO',p_idTratamiento||'/'||p_idMedicamento); END IF;
    EXCEPTION WHEN OTHERS THEN IF SQLCODE BETWEEN -20999 AND -20000 THEN RAISE; END IF; PKG_UTILIDADES.manejar('TRATAMIENTO_MEDICAMENTO','ELIMINAR',SQLCODE,SQLERRM); END;
END PKG_CONSULTAS_MEDICAS;
/

-- ============================================================
-- 6. PKG_INVENTARIO_MEDICO
-- ============================================================
CREATE OR REPLACE PACKAGE PKG_INVENTARIO_MEDICO AS
    PROCEDURE pr_insertar_medicamento(p_idMedicamento IN MEDICAMENTO.idMedicamento%TYPE, p_nombre IN MEDICAMENTO.nombre%TYPE,
        p_descripcion IN MEDICAMENTO.descripcion%TYPE, p_precioUnitario IN MEDICAMENTO.precioUnitario%TYPE,
        p_idMed_out OUT MEDICAMENTO.idMedicamento%TYPE);
    PROCEDURE pr_modificar_medicamento(p_idMedicamento IN MEDICAMENTO.idMedicamento%TYPE, p_nombre IN MEDICAMENTO.nombre%TYPE,
        p_descripcion IN MEDICAMENTO.descripcion%TYPE, p_precioUnitario IN MEDICAMENTO.precioUnitario%TYPE, p_filas_afectadas OUT NUMBER);
    PROCEDURE pr_eliminar_medicamento(p_idMedicamento IN MEDICAMENTO.idMedicamento%TYPE, p_filas_afectadas OUT NUMBER);

    PROCEDURE pr_insertar_vacuna(p_idVacuna IN VACUNA.idVacuna%TYPE, p_nombre IN VACUNA.nombre%TYPE,
        p_laboratorio IN VACUNA.laboratorio%TYPE, p_lote IN VACUNA.lote%TYPE, p_fechaVencimiento IN VACUNA.fechaVencimiento%TYPE,
        p_especieObjetivo IN VACUNA.especieObjetivo%TYPE, p_precio IN VACUNA.precio%TYPE, p_idVacuna_out OUT VACUNA.idVacuna%TYPE);
    PROCEDURE pr_modificar_vacuna(p_idVacuna IN VACUNA.idVacuna%TYPE, p_nombre IN VACUNA.nombre%TYPE,
        p_laboratorio IN VACUNA.laboratorio%TYPE, p_lote IN VACUNA.lote%TYPE, p_fechaVencimiento IN VACUNA.fechaVencimiento%TYPE,
        p_especieObjetivo IN VACUNA.especieObjetivo%TYPE, p_precio IN VACUNA.precio%TYPE, p_filas_afectadas OUT NUMBER);
    PROCEDURE pr_eliminar_vacuna(p_idVacuna IN VACUNA.idVacuna%TYPE, p_filas_afectadas OUT NUMBER);
END PKG_INVENTARIO_MEDICO;
/

CREATE OR REPLACE PACKAGE BODY PKG_INVENTARIO_MEDICO AS
    PROCEDURE pr_insertar_medicamento(p_idMedicamento IN MEDICAMENTO.idMedicamento%TYPE, p_nombre IN MEDICAMENTO.nombre%TYPE,
        p_descripcion IN MEDICAMENTO.descripcion%TYPE, p_precioUnitario IN MEDICAMENTO.precioUnitario%TYPE,
        p_idMed_out OUT MEDICAMENTO.idMedicamento%TYPE) IS
    BEGIN INSERT INTO MEDICAMENTO (idMedicamento,nombre,descripcion,precioUnitario) VALUES (p_idMedicamento,p_nombre,p_descripcion,p_precioUnitario) RETURNING idMedicamento INTO p_idMed_out;
    EXCEPTION WHEN OTHERS THEN PKG_UTILIDADES.manejar('MEDICAMENTO','INSERTAR',SQLCODE,SQLERRM); END;
    PROCEDURE pr_modificar_medicamento(p_idMedicamento IN MEDICAMENTO.idMedicamento%TYPE, p_nombre IN MEDICAMENTO.nombre%TYPE,
        p_descripcion IN MEDICAMENTO.descripcion%TYPE, p_precioUnitario IN MEDICAMENTO.precioUnitario%TYPE, p_filas_afectadas OUT NUMBER) IS
    BEGIN UPDATE MEDICAMENTO SET nombre=p_nombre,descripcion=p_descripcion,precioUnitario=p_precioUnitario WHERE idMedicamento=p_idMedicamento; p_filas_afectadas:=SQL%ROWCOUNT; IF p_filas_afectadas=0 THEN PKG_UTILIDADES.lanzar_no_encontrado('MEDICAMENTO',p_idMedicamento); END IF;
    EXCEPTION WHEN OTHERS THEN IF SQLCODE BETWEEN -20999 AND -20000 THEN RAISE; END IF; PKG_UTILIDADES.manejar('MEDICAMENTO','MODIFICAR',SQLCODE,SQLERRM); END;
    PROCEDURE pr_eliminar_medicamento(p_idMedicamento IN MEDICAMENTO.idMedicamento%TYPE, p_filas_afectadas OUT NUMBER) IS
    BEGIN DELETE FROM MEDICAMENTO WHERE idMedicamento=p_idMedicamento; p_filas_afectadas:=SQL%ROWCOUNT; IF p_filas_afectadas=0 THEN PKG_UTILIDADES.lanzar_no_encontrado('MEDICAMENTO',p_idMedicamento); END IF;
    EXCEPTION WHEN OTHERS THEN IF SQLCODE BETWEEN -20999 AND -20000 THEN RAISE; END IF; PKG_UTILIDADES.manejar('MEDICAMENTO','ELIMINAR',SQLCODE,SQLERRM); END;

    PROCEDURE pr_insertar_vacuna(p_idVacuna IN VACUNA.idVacuna%TYPE, p_nombre IN VACUNA.nombre%TYPE,
        p_laboratorio IN VACUNA.laboratorio%TYPE, p_lote IN VACUNA.lote%TYPE, p_fechaVencimiento IN VACUNA.fechaVencimiento%TYPE,
        p_especieObjetivo IN VACUNA.especieObjetivo%TYPE, p_precio IN VACUNA.precio%TYPE, p_idVacuna_out OUT VACUNA.idVacuna%TYPE) IS
    BEGIN INSERT INTO VACUNA (idVacuna,nombre,laboratorio,lote,fechaVencimiento,especieObjetivo,precio) VALUES (p_idVacuna,p_nombre,p_laboratorio,p_lote,p_fechaVencimiento,p_especieObjetivo,p_precio) RETURNING idVacuna INTO p_idVacuna_out;
    EXCEPTION WHEN OTHERS THEN PKG_UTILIDADES.manejar('VACUNA','INSERTAR',SQLCODE,SQLERRM); END;
    PROCEDURE pr_modificar_vacuna(p_idVacuna IN VACUNA.idVacuna%TYPE, p_nombre IN VACUNA.nombre%TYPE,
        p_laboratorio IN VACUNA.laboratorio%TYPE, p_lote IN VACUNA.lote%TYPE, p_fechaVencimiento IN VACUNA.fechaVencimiento%TYPE,
        p_especieObjetivo IN VACUNA.especieObjetivo%TYPE, p_precio IN VACUNA.precio%TYPE, p_filas_afectadas OUT NUMBER) IS
    BEGIN UPDATE VACUNA SET nombre=p_nombre,laboratorio=p_laboratorio,lote=p_lote,fechaVencimiento=p_fechaVencimiento,especieObjetivo=p_especieObjetivo,precio=p_precio WHERE idVacuna=p_idVacuna; p_filas_afectadas:=SQL%ROWCOUNT; IF p_filas_afectadas=0 THEN PKG_UTILIDADES.lanzar_no_encontrado('VACUNA',p_idVacuna); END IF;
    EXCEPTION WHEN OTHERS THEN IF SQLCODE BETWEEN -20999 AND -20000 THEN RAISE; END IF; PKG_UTILIDADES.manejar('VACUNA','MODIFICAR',SQLCODE,SQLERRM); END;
    PROCEDURE pr_eliminar_vacuna(p_idVacuna IN VACUNA.idVacuna%TYPE, p_filas_afectadas OUT NUMBER) IS
    BEGIN DELETE FROM VACUNA WHERE idVacuna=p_idVacuna; p_filas_afectadas:=SQL%ROWCOUNT; IF p_filas_afectadas=0 THEN PKG_UTILIDADES.lanzar_no_encontrado('VACUNA',p_idVacuna); END IF;
    EXCEPTION WHEN OTHERS THEN IF SQLCODE BETWEEN -20999 AND -20000 THEN RAISE; END IF; PKG_UTILIDADES.manejar('VACUNA','ELIMINAR',SQLCODE,SQLERRM); END;
END PKG_INVENTARIO_MEDICO;
/

-- ============================================================
-- 7. PKG_VACUNACION
-- ============================================================
CREATE OR REPLACE PACKAGE PKG_VACUNACION AS
    PROCEDURE pr_insertar_aplicacion_vacuna(p_codigoMascota IN APLICACION_VACUNA.codigoMascota%TYPE,
        p_idVacuna IN APLICACION_VACUNA.idVacuna%TYPE, p_fechaAplicacion IN APLICACION_VACUNA.fechaAplicacion%TYPE,
        p_observacion IN APLICACION_VACUNA.observacion%TYPE);
    PROCEDURE pr_modificar_aplicacion_vacuna(p_codigoMascota IN APLICACION_VACUNA.codigoMascota%TYPE,
        p_idVacuna IN APLICACION_VACUNA.idVacuna%TYPE, p_fechaAplicacion IN APLICACION_VACUNA.fechaAplicacion%TYPE,
        p_observacion IN APLICACION_VACUNA.observacion%TYPE, p_filas_afectadas OUT NUMBER);
    PROCEDURE pr_eliminar_aplicacion_vacuna(p_codigoMascota IN APLICACION_VACUNA.codigoMascota%TYPE,
        p_idVacuna IN APLICACION_VACUNA.idVacuna%TYPE, p_fechaAplicacion IN APLICACION_VACUNA.fechaAplicacion%TYPE,
        p_filas_afectadas OUT NUMBER);

    PROCEDURE pr_insertar_diagnostico_vacuna(p_idDiagnostico IN DIAGNOSTICO_VACUNA.idDiagnostico%TYPE,
        p_idVacuna IN DIAGNOSTICO_VACUNA.idVacuna%TYPE);
    PROCEDURE pr_eliminar_diagnostico_vacuna(p_idDiagnostico IN DIAGNOSTICO_VACUNA.idDiagnostico%TYPE,
        p_idVacuna IN DIAGNOSTICO_VACUNA.idVacuna%TYPE, p_filas_afectadas OUT NUMBER);
END PKG_VACUNACION;
/

CREATE OR REPLACE PACKAGE BODY PKG_VACUNACION AS
    PROCEDURE pr_insertar_aplicacion_vacuna(p_codigoMascota IN APLICACION_VACUNA.codigoMascota%TYPE,
        p_idVacuna IN APLICACION_VACUNA.idVacuna%TYPE, p_fechaAplicacion IN APLICACION_VACUNA.fechaAplicacion%TYPE,
        p_observacion IN APLICACION_VACUNA.observacion%TYPE) IS
    BEGIN INSERT INTO APLICACION_VACUNA (codigoMascota,idVacuna,fechaAplicacion,observacion) VALUES (p_codigoMascota,p_idVacuna,p_fechaAplicacion,p_observacion);
    EXCEPTION WHEN OTHERS THEN PKG_UTILIDADES.manejar('APLICACION_VACUNA','INSERTAR',SQLCODE,SQLERRM); END;
    PROCEDURE pr_modificar_aplicacion_vacuna(p_codigoMascota IN APLICACION_VACUNA.codigoMascota%TYPE,
        p_idVacuna IN APLICACION_VACUNA.idVacuna%TYPE, p_fechaAplicacion IN APLICACION_VACUNA.fechaAplicacion%TYPE,
        p_observacion IN APLICACION_VACUNA.observacion%TYPE, p_filas_afectadas OUT NUMBER) IS
    BEGIN UPDATE APLICACION_VACUNA SET observacion=p_observacion WHERE codigoMascota=p_codigoMascota AND idVacuna=p_idVacuna AND fechaAplicacion=p_fechaAplicacion; p_filas_afectadas:=SQL%ROWCOUNT; IF p_filas_afectadas=0 THEN PKG_UTILIDADES.lanzar_no_encontrado('APLICACION_VACUNA',p_codigoMascota||'/'||p_idVacuna); END IF;
    EXCEPTION WHEN OTHERS THEN IF SQLCODE BETWEEN -20999 AND -20000 THEN RAISE; END IF; PKG_UTILIDADES.manejar('APLICACION_VACUNA','MODIFICAR',SQLCODE,SQLERRM); END;
    PROCEDURE pr_eliminar_aplicacion_vacuna(p_codigoMascota IN APLICACION_VACUNA.codigoMascota%TYPE,
        p_idVacuna IN APLICACION_VACUNA.idVacuna%TYPE, p_fechaAplicacion IN APLICACION_VACUNA.fechaAplicacion%TYPE,
        p_filas_afectadas OUT NUMBER) IS
    BEGIN DELETE FROM APLICACION_VACUNA WHERE codigoMascota=p_codigoMascota AND idVacuna=p_idVacuna AND fechaAplicacion=p_fechaAplicacion; p_filas_afectadas:=SQL%ROWCOUNT; IF p_filas_afectadas=0 THEN PKG_UTILIDADES.lanzar_no_encontrado('APLICACION_VACUNA',p_codigoMascota||'/'||p_idVacuna); END IF;
    EXCEPTION WHEN OTHERS THEN IF SQLCODE BETWEEN -20999 AND -20000 THEN RAISE; END IF; PKG_UTILIDADES.manejar('APLICACION_VACUNA','ELIMINAR',SQLCODE,SQLERRM); END;
    PROCEDURE pr_insertar_diagnostico_vacuna(p_idDiagnostico IN DIAGNOSTICO_VACUNA.idDiagnostico%TYPE,
        p_idVacuna IN DIAGNOSTICO_VACUNA.idVacuna%TYPE) IS
    BEGIN INSERT INTO DIAGNOSTICO_VACUNA (idDiagnostico,idVacuna) VALUES (p_idDiagnostico,p_idVacuna);
    EXCEPTION WHEN OTHERS THEN PKG_UTILIDADES.manejar('DIAGNOSTICO_VACUNA','INSERTAR',SQLCODE,SQLERRM); END;
    PROCEDURE pr_eliminar_diagnostico_vacuna(p_idDiagnostico IN DIAGNOSTICO_VACUNA.idDiagnostico%TYPE,
        p_idVacuna IN DIAGNOSTICO_VACUNA.idVacuna%TYPE, p_filas_afectadas OUT NUMBER) IS
    BEGIN DELETE FROM DIAGNOSTICO_VACUNA WHERE idDiagnostico=p_idDiagnostico AND idVacuna=p_idVacuna; p_filas_afectadas:=SQL%ROWCOUNT; IF p_filas_afectadas=0 THEN PKG_UTILIDADES.lanzar_no_encontrado('DIAGNOSTICO_VACUNA',p_idDiagnostico||'/'||p_idVacuna); END IF;
    EXCEPTION WHEN OTHERS THEN IF SQLCODE BETWEEN -20999 AND -20000 THEN RAISE; END IF; PKG_UTILIDADES.manejar('DIAGNOSTICO_VACUNA','ELIMINAR',SQLCODE,SQLERRM); END;
END PKG_VACUNACION;
/

-- ============================================================
-- 8. PKG_SERVICIOS
-- ============================================================
CREATE OR REPLACE PACKAGE PKG_SERVICIOS AS
    PROCEDURE pr_insertar_servicio(p_idServicio IN CATALOGO_SERVICIOS.idServicio%TYPE,
        p_nombre IN CATALOGO_SERVICIOS.nombre%TYPE, p_tipoServicio IN CATALOGO_SERVICIOS.tipoServicio%TYPE,
        p_precio IN CATALOGO_SERVICIOS.precio%TYPE, p_descripcion IN CATALOGO_SERVICIOS.descripcion%TYPE,
        p_activo IN CATALOGO_SERVICIOS.activo%TYPE DEFAULT 'S', p_idServ_out OUT CATALOGO_SERVICIOS.idServicio%TYPE);
    PROCEDURE pr_modificar_servicio(p_idServicio IN CATALOGO_SERVICIOS.idServicio%TYPE,
        p_nombre IN CATALOGO_SERVICIOS.nombre%TYPE, p_tipoServicio IN CATALOGO_SERVICIOS.tipoServicio%TYPE,
        p_precio IN CATALOGO_SERVICIOS.precio%TYPE, p_descripcion IN CATALOGO_SERVICIOS.descripcion%TYPE,
        p_activo IN CATALOGO_SERVICIOS.activo%TYPE, p_filas_afectadas OUT NUMBER);
    PROCEDURE pr_eliminar_servicio(p_idServicio IN CATALOGO_SERVICIOS.idServicio%TYPE, p_filas_afectadas OUT NUMBER);
END PKG_SERVICIOS;
/

CREATE OR REPLACE PACKAGE BODY PKG_SERVICIOS AS
    PROCEDURE pr_insertar_servicio(p_idServicio IN CATALOGO_SERVICIOS.idServicio%TYPE,
        p_nombre IN CATALOGO_SERVICIOS.nombre%TYPE, p_tipoServicio IN CATALOGO_SERVICIOS.tipoServicio%TYPE,
        p_precio IN CATALOGO_SERVICIOS.precio%TYPE, p_descripcion IN CATALOGO_SERVICIOS.descripcion%TYPE,
        p_activo IN CATALOGO_SERVICIOS.activo%TYPE DEFAULT 'S', p_idServ_out OUT CATALOGO_SERVICIOS.idServicio%TYPE) IS
    BEGIN INSERT INTO CATALOGO_SERVICIOS (idServicio,nombre,tipoServicio,precio,descripcion,activo) VALUES (p_idServicio,p_nombre,p_tipoServicio,p_precio,p_descripcion,p_activo) RETURNING idServicio INTO p_idServ_out;
    EXCEPTION WHEN OTHERS THEN PKG_UTILIDADES.manejar('CATALOGO_SERVICIOS','INSERTAR',SQLCODE,SQLERRM); END;
    PROCEDURE pr_modificar_servicio(p_idServicio IN CATALOGO_SERVICIOS.idServicio%TYPE,
        p_nombre IN CATALOGO_SERVICIOS.nombre%TYPE, p_tipoServicio IN CATALOGO_SERVICIOS.tipoServicio%TYPE,
        p_precio IN CATALOGO_SERVICIOS.precio%TYPE, p_descripcion IN CATALOGO_SERVICIOS.descripcion%TYPE,
        p_activo IN CATALOGO_SERVICIOS.activo%TYPE, p_filas_afectadas OUT NUMBER) IS
    BEGIN UPDATE CATALOGO_SERVICIOS SET nombre=p_nombre,tipoServicio=p_tipoServicio,precio=p_precio,descripcion=p_descripcion,activo=p_activo WHERE idServicio=p_idServicio; p_filas_afectadas:=SQL%ROWCOUNT; IF p_filas_afectadas=0 THEN PKG_UTILIDADES.lanzar_no_encontrado('CATALOGO_SERVICIOS',p_idServicio); END IF;
    EXCEPTION WHEN OTHERS THEN IF SQLCODE BETWEEN -20999 AND -20000 THEN RAISE; END IF; PKG_UTILIDADES.manejar('CATALOGO_SERVICIOS','MODIFICAR',SQLCODE,SQLERRM); END;
    PROCEDURE pr_eliminar_servicio(p_idServicio IN CATALOGO_SERVICIOS.idServicio%TYPE, p_filas_afectadas OUT NUMBER) IS
    BEGIN DELETE FROM CATALOGO_SERVICIOS WHERE idServicio=p_idServicio; p_filas_afectadas:=SQL%ROWCOUNT; IF p_filas_afectadas=0 THEN PKG_UTILIDADES.lanzar_no_encontrado('CATALOGO_SERVICIOS',p_idServicio); END IF;
    EXCEPTION WHEN OTHERS THEN IF SQLCODE BETWEEN -20999 AND -20000 THEN RAISE; END IF; PKG_UTILIDADES.manejar('CATALOGO_SERVICIOS','ELIMINAR',SQLCODE,SQLERRM); END;
END PKG_SERVICIOS;
/

-- ============================================================
-- 9. PKG_FACTURACION
-- ============================================================
CREATE OR REPLACE PACKAGE PKG_FACTURACION AS
    PROCEDURE pr_insertar_factura(p_idFactura IN FACTURA.idFactura%TYPE, p_idConsulta IN FACTURA.idConsulta%TYPE,
        p_idCliente IN FACTURA.idCliente%TYPE, p_fecha IN FACTURA.fecha%TYPE, p_valorTotal IN FACTURA.valorTotal%TYPE,
        p_metodoPago IN FACTURA.metodoPago%TYPE, p_estadoPago IN FACTURA.estadoPago%TYPE, p_idFactura_out OUT FACTURA.idFactura%TYPE);
    PROCEDURE pr_modificar_factura(p_idFactura IN FACTURA.idFactura%TYPE, p_idConsulta IN FACTURA.idConsulta%TYPE,
        p_idCliente IN FACTURA.idCliente%TYPE, p_fecha IN FACTURA.fecha%TYPE, p_valorTotal IN FACTURA.valorTotal%TYPE,
        p_metodoPago IN FACTURA.metodoPago%TYPE, p_estadoPago IN FACTURA.estadoPago%TYPE, p_filas_afectadas OUT NUMBER);
    PROCEDURE pr_eliminar_factura(p_idFactura IN FACTURA.idFactura%TYPE, p_filas_afectadas OUT NUMBER);
    FUNCTION fn_existe_factura(p_idFactura IN FACTURA.idFactura%TYPE) RETURN NUMBER;
    FUNCTION fn_total_factura(p_idFactura IN FACTURA.idFactura%TYPE) RETURN NUMBER;
    PROCEDURE pr_recalcular_total_factura(p_idFactura IN FACTURA.idFactura%TYPE, p_filas_afectadas OUT NUMBER);

    PROCEDURE pr_insertar_detalle_factura(p_idDetalle IN DETALLE_FACTURA.idDetalle%TYPE, p_idFactura IN DETALLE_FACTURA.idFactura%TYPE,
        p_descripcion IN DETALLE_FACTURA.descripcion%TYPE, p_tipoConcepto IN DETALLE_FACTURA.tipoConcepto%TYPE,
        p_cantidad IN DETALLE_FACTURA.cantidad%TYPE, p_precioUnitario IN DETALLE_FACTURA.precioUnitario%TYPE,
        p_idDetalle_out OUT DETALLE_FACTURA.idDetalle%TYPE);
    PROCEDURE pr_modificar_detalle_factura(p_idDetalle IN DETALLE_FACTURA.idDetalle%TYPE, p_idFactura IN DETALLE_FACTURA.idFactura%TYPE,
        p_descripcion IN DETALLE_FACTURA.descripcion%TYPE, p_tipoConcepto IN DETALLE_FACTURA.tipoConcepto%TYPE,
        p_cantidad IN DETALLE_FACTURA.cantidad%TYPE, p_precioUnitario IN DETALLE_FACTURA.precioUnitario%TYPE,
        p_filas_afectadas OUT NUMBER);
    PROCEDURE pr_eliminar_detalle_factura(p_idDetalle IN DETALLE_FACTURA.idDetalle%TYPE, p_filas_afectadas OUT NUMBER);
    PROCEDURE pr_insertar_detalles_lote(p_id_factura IN FACTURA.idFactura%TYPE, p_detalles IN T_TAB_DETALLES_INPUT, p_insertados OUT NUMBER);
    FUNCTION fn_resumen_financiero_clientes RETURN T_TAB_RESUMEN_CLIENTES;
    FUNCTION fn_top_servicios_facturados(p_top IN PLS_INTEGER DEFAULT 5) RETURN T_VARRAY_TOP_SERVICIOS;
END PKG_FACTURACION;
/

CREATE OR REPLACE PACKAGE BODY PKG_FACTURACION AS
    PROCEDURE pr_insertar_factura(p_idFactura IN FACTURA.idFactura%TYPE, p_idConsulta IN FACTURA.idConsulta%TYPE,
        p_idCliente IN FACTURA.idCliente%TYPE, p_fecha IN FACTURA.fecha%TYPE, p_valorTotal IN FACTURA.valorTotal%TYPE,
        p_metodoPago IN FACTURA.metodoPago%TYPE, p_estadoPago IN FACTURA.estadoPago%TYPE, p_idFactura_out OUT FACTURA.idFactura%TYPE) IS
    BEGIN INSERT INTO FACTURA (idFactura,idConsulta,idCliente,fecha,valorTotal,metodoPago,estadoPago) VALUES (p_idFactura,p_idConsulta,p_idCliente,p_fecha,p_valorTotal,p_metodoPago,p_estadoPago) RETURNING idFactura INTO p_idFactura_out;
    EXCEPTION WHEN OTHERS THEN PKG_UTILIDADES.manejar('FACTURA','INSERTAR',SQLCODE,SQLERRM); END;
    PROCEDURE pr_modificar_factura(p_idFactura IN FACTURA.idFactura%TYPE, p_idConsulta IN FACTURA.idConsulta%TYPE,
        p_idCliente IN FACTURA.idCliente%TYPE, p_fecha IN FACTURA.fecha%TYPE, p_valorTotal IN FACTURA.valorTotal%TYPE,
        p_metodoPago IN FACTURA.metodoPago%TYPE, p_estadoPago IN FACTURA.estadoPago%TYPE, p_filas_afectadas OUT NUMBER) IS
    BEGIN UPDATE FACTURA SET idConsulta=p_idConsulta,idCliente=p_idCliente,fecha=p_fecha,valorTotal=p_valorTotal,metodoPago=p_metodoPago,estadoPago=p_estadoPago WHERE idFactura=p_idFactura; p_filas_afectadas:=SQL%ROWCOUNT; IF p_filas_afectadas=0 THEN PKG_UTILIDADES.lanzar_no_encontrado('FACTURA',p_idFactura); END IF;
    EXCEPTION WHEN OTHERS THEN IF SQLCODE BETWEEN -20999 AND -20000 THEN RAISE; END IF; PKG_UTILIDADES.manejar('FACTURA','MODIFICAR',SQLCODE,SQLERRM); END;
    PROCEDURE pr_eliminar_factura(p_idFactura IN FACTURA.idFactura%TYPE, p_filas_afectadas OUT NUMBER) IS
    BEGIN DELETE FROM FACTURA WHERE idFactura=p_idFactura; p_filas_afectadas:=SQL%ROWCOUNT; IF p_filas_afectadas=0 THEN PKG_UTILIDADES.lanzar_no_encontrado('FACTURA',p_idFactura); END IF;
    EXCEPTION WHEN OTHERS THEN IF SQLCODE BETWEEN -20999 AND -20000 THEN RAISE; END IF; PKG_UTILIDADES.manejar('FACTURA','ELIMINAR',SQLCODE,SQLERRM); END;
    FUNCTION fn_existe_factura(p_idFactura IN FACTURA.idFactura%TYPE) RETURN NUMBER IS v_total NUMBER;
    BEGIN SELECT COUNT(*) INTO v_total FROM FACTURA WHERE idFactura=p_idFactura; RETURN CASE WHEN v_total>0 THEN 1 ELSE 0 END; END;
    FUNCTION fn_total_factura(p_idFactura IN FACTURA.idFactura%TYPE) RETURN NUMBER IS v_total NUMBER;
    BEGIN IF fn_existe_factura(p_idFactura)=0 THEN PKG_UTILIDADES.lanzar_no_encontrado('FACTURA',p_idFactura); END IF; SELECT NVL(SUM(cantidad*precioUnitario),0) INTO v_total FROM DETALLE_FACTURA WHERE idFactura=p_idFactura; RETURN v_total;
    EXCEPTION WHEN OTHERS THEN IF SQLCODE BETWEEN -20999 AND -20000 THEN RAISE; END IF; PKG_UTILIDADES.manejar('DETALLE_FACTURA','CALCULAR TOTAL',SQLCODE,SQLERRM); END;
    PROCEDURE pr_recalcular_total_factura(p_idFactura IN FACTURA.idFactura%TYPE, p_filas_afectadas OUT NUMBER) IS
    BEGIN UPDATE FACTURA SET valorTotal=fn_total_factura(p_idFactura) WHERE idFactura=p_idFactura; p_filas_afectadas:=SQL%ROWCOUNT; IF p_filas_afectadas=0 THEN PKG_UTILIDADES.lanzar_no_encontrado('FACTURA',p_idFactura); END IF;
    EXCEPTION WHEN OTHERS THEN IF SQLCODE BETWEEN -20999 AND -20000 THEN RAISE; END IF; PKG_UTILIDADES.manejar('FACTURA','RECALCULAR TOTAL',SQLCODE,SQLERRM); END;

    PROCEDURE pr_insertar_detalle_factura(p_idDetalle IN DETALLE_FACTURA.idDetalle%TYPE, p_idFactura IN DETALLE_FACTURA.idFactura%TYPE,
        p_descripcion IN DETALLE_FACTURA.descripcion%TYPE, p_tipoConcepto IN DETALLE_FACTURA.tipoConcepto%TYPE,
        p_cantidad IN DETALLE_FACTURA.cantidad%TYPE, p_precioUnitario IN DETALLE_FACTURA.precioUnitario%TYPE,
        p_idDetalle_out OUT DETALLE_FACTURA.idDetalle%TYPE) IS v_filas NUMBER;
    BEGIN INSERT INTO DETALLE_FACTURA (idDetalle,idFactura,descripcion,tipoConcepto,cantidad,precioUnitario) VALUES (p_idDetalle,p_idFactura,p_descripcion,p_tipoConcepto,p_cantidad,p_precioUnitario) RETURNING idDetalle INTO p_idDetalle_out; pr_recalcular_total_factura(p_idFactura,v_filas);
    EXCEPTION WHEN OTHERS THEN PKG_UTILIDADES.manejar('DETALLE_FACTURA','INSERTAR',SQLCODE,SQLERRM); END;
    PROCEDURE pr_modificar_detalle_factura(p_idDetalle IN DETALLE_FACTURA.idDetalle%TYPE, p_idFactura IN DETALLE_FACTURA.idFactura%TYPE,
        p_descripcion IN DETALLE_FACTURA.descripcion%TYPE, p_tipoConcepto IN DETALLE_FACTURA.tipoConcepto%TYPE,
        p_cantidad IN DETALLE_FACTURA.cantidad%TYPE, p_precioUnitario IN DETALLE_FACTURA.precioUnitario%TYPE,
        p_filas_afectadas OUT NUMBER) IS v_factura_anterior DETALLE_FACTURA.idFactura%TYPE; v_filas NUMBER;
    BEGIN SELECT idFactura INTO v_factura_anterior FROM DETALLE_FACTURA WHERE idDetalle=p_idDetalle; UPDATE DETALLE_FACTURA SET idFactura=p_idFactura,descripcion=p_descripcion,tipoConcepto=p_tipoConcepto,cantidad=p_cantidad,precioUnitario=p_precioUnitario WHERE idDetalle=p_idDetalle; p_filas_afectadas:=SQL%ROWCOUNT; pr_recalcular_total_factura(v_factura_anterior,v_filas); IF TRIM(v_factura_anterior)<>TRIM(p_idFactura) THEN pr_recalcular_total_factura(p_idFactura,v_filas); END IF;
    EXCEPTION WHEN NO_DATA_FOUND THEN PKG_UTILIDADES.lanzar_no_encontrado('DETALLE_FACTURA',p_idDetalle); WHEN OTHERS THEN IF SQLCODE BETWEEN -20999 AND -20000 THEN RAISE; END IF; PKG_UTILIDADES.manejar('DETALLE_FACTURA','MODIFICAR',SQLCODE,SQLERRM); END;
    PROCEDURE pr_eliminar_detalle_factura(p_idDetalle IN DETALLE_FACTURA.idDetalle%TYPE, p_filas_afectadas OUT NUMBER) IS v_idFactura DETALLE_FACTURA.idFactura%TYPE; v_filas NUMBER;
    BEGIN SELECT idFactura INTO v_idFactura FROM DETALLE_FACTURA WHERE idDetalle=p_idDetalle; DELETE FROM DETALLE_FACTURA WHERE idDetalle=p_idDetalle; p_filas_afectadas:=SQL%ROWCOUNT; pr_recalcular_total_factura(v_idFactura,v_filas);
    EXCEPTION WHEN NO_DATA_FOUND THEN PKG_UTILIDADES.lanzar_no_encontrado('DETALLE_FACTURA',p_idDetalle); WHEN OTHERS THEN IF SQLCODE BETWEEN -20999 AND -20000 THEN RAISE; END IF; PKG_UTILIDADES.manejar('DETALLE_FACTURA','ELIMINAR',SQLCODE,SQLERRM); END;
    PROCEDURE pr_insertar_detalles_lote(p_id_factura IN FACTURA.idFactura%TYPE, p_detalles IN T_TAB_DETALLES_INPUT, p_insertados OUT NUMBER) IS v_ok NUMBER:=0; v_filas NUMBER;
    BEGIN SAVEPOINT sp_lote; IF fn_existe_factura(p_id_factura)=0 THEN PKG_UTILIDADES.lanzar_no_encontrado('FACTURA',p_id_factura); END IF; IF p_detalles IS NULL OR p_detalles.COUNT=0 THEN PKG_UTILIDADES.lanzar_operacion_invalida('DETALLE_FACTURA','La colección de detalles está vacía'); END IF; FOR i IN p_detalles.FIRST .. p_detalles.LAST LOOP IF p_detalles(i) IS NOT NULL THEN INSERT INTO DETALLE_FACTURA (idDetalle,idFactura,descripcion,tipoConcepto,cantidad,precioUnitario) VALUES (p_detalles(i).idDetalle,p_id_factura,p_detalles(i).descripcion,p_detalles(i).tipoConcepto,p_detalles(i).cantidad,p_detalles(i).precioUnitario); v_ok:=v_ok+1; END IF; END LOOP; pr_recalcular_total_factura(p_id_factura,v_filas); p_insertados:=v_ok;
    EXCEPTION WHEN OTHERS THEN ROLLBACK TO sp_lote; p_insertados:=0; IF SQLCODE BETWEEN -20999 AND -20000 THEN RAISE; END IF; PKG_UTILIDADES.manejar('DETALLE_FACTURA','LOTE INSERTAR',SQLCODE,SQLERRM); END;
    FUNCTION fn_resumen_financiero_clientes RETURN T_TAB_RESUMEN_CLIENTES IS v_resumen T_TAB_RESUMEN_CLIENTES:=T_TAB_RESUMEN_CLIENTES();
    BEGIN FOR r IN (SELECT cl.idCliente,cl.nombreCompleto,COUNT(f.idFactura) totalFacturas,SUM(CASE WHEN f.estadoPago='PAGADA' THEN 1 ELSE 0 END) facturasPagadas,SUM(CASE WHEN f.estadoPago='PENDIENTE' THEN 1 ELSE 0 END) facturasPendientes,SUM(CASE WHEN f.estadoPago='PAGADA' THEN f.valorTotal ELSE 0 END) ingresoTotal,SUM(CASE WHEN f.estadoPago='PENDIENTE' THEN f.valorTotal ELSE 0 END) ingresoPendiente FROM CLIENTE cl LEFT JOIN FACTURA f ON f.idCliente=cl.idCliente GROUP BY cl.idCliente,cl.nombreCompleto ORDER BY ingresoTotal DESC NULLS LAST) LOOP v_resumen.EXTEND; v_resumen(v_resumen.LAST):=T_FILA_RESUMEN_CLIENTE(r.idCliente,r.nombreCompleto,r.totalFacturas,NVL(r.facturasPagadas,0),NVL(r.facturasPendientes,0),NVL(r.ingresoTotal,0),NVL(r.ingresoPendiente,0)); END LOOP; RETURN v_resumen;
    EXCEPTION WHEN OTHERS THEN PKG_UTILIDADES.manejar('FACTURA','RESUMEN FINANCIERO',SQLCODE,SQLERRM); END;
    FUNCTION fn_top_servicios_facturados(p_top IN PLS_INTEGER DEFAULT 5) RETURN T_VARRAY_TOP_SERVICIOS IS v_ranking T_VARRAY_TOP_SERVICIOS:=T_VARRAY_TOP_SERVICIOS(); v_limite PLS_INTEGER:=LEAST(NVL(p_top,5),5); v_pos PLS_INTEGER:=0;
    BEGIN FOR r IN (SELECT * FROM (SELECT df.descripcion nombreSvc,df.tipoConcepto tipoSvc,COUNT(*) vecesFacturado,SUM(df.cantidad*df.precioUnitario) ingresoTotal FROM DETALLE_FACTURA df JOIN FACTURA f ON f.idFactura=df.idFactura WHERE f.estadoPago='PAGADA' GROUP BY df.descripcion,df.tipoConcepto ORDER BY vecesFacturado DESC, ingresoTotal DESC) WHERE ROWNUM<=v_limite) LOOP v_ranking.EXTEND; v_pos:=v_pos+1; v_ranking(v_pos):=T_FILA_SERVICIO(v_pos,NULL,r.nombreSvc,r.tipoSvc,r.vecesFacturado,r.ingresoTotal); END LOOP; RETURN v_ranking;
    EXCEPTION WHEN OTHERS THEN PKG_UTILIDADES.manejar('DETALLE_FACTURA','TOP SERVICIOS',SQLCODE,SQLERRM); END;
END PKG_FACTURACION;
/

-- ============================================================
-- 10. PKG_REPORTES
-- ============================================================
CREATE OR REPLACE PACKAGE PKG_REPORTES AS
    FUNCTION fn_ingresos_mensuales(p_anio IN NUMBER, p_mes IN NUMBER) RETURN NUMBER;
    FUNCTION fn_mascotas_mas_atendidas(p_top IN PLS_INTEGER DEFAULT 5) RETURN SYS_REFCURSOR;
    FUNCTION fn_vacunas_aplicadas_mes(p_anio IN NUMBER, p_mes IN NUMBER) RETURN NUMBER;
    FUNCTION fn_tratamientos_activos RETURN NUMBER;
    FUNCTION fn_historial_mascota(p_codigoMascota IN MASCOTA.codigoMascota%TYPE) RETURN T_TAB_HISTORIAL;
END PKG_REPORTES;
/

CREATE OR REPLACE PACKAGE BODY PKG_REPORTES AS
    FUNCTION fn_ingresos_mensuales(p_anio IN NUMBER, p_mes IN NUMBER) RETURN NUMBER IS v_total NUMBER;
    BEGIN SELECT NVL(SUM(valorTotal),0) INTO v_total FROM FACTURA WHERE estadoPago='PAGADA' AND EXTRACT(YEAR FROM fecha)=p_anio AND EXTRACT(MONTH FROM fecha)=p_mes; RETURN v_total;
    EXCEPTION WHEN OTHERS THEN PKG_UTILIDADES.manejar('FACTURA','INGRESOS MENSUALES',SQLCODE,SQLERRM); END;
    FUNCTION fn_mascotas_mas_atendidas(p_top IN PLS_INTEGER DEFAULT 5) RETURN SYS_REFCURSOR IS v_cur SYS_REFCURSOR;
    BEGIN OPEN v_cur FOR SELECT * FROM (SELECT ma.codigoMascota,ma.nombre nombreMascota,ma.especie,cl.nombreCompleto nombreCliente,COUNT(ci.idCita) totalCitas FROM MASCOTA ma JOIN CLIENTE cl ON cl.idCliente=ma.idCliente JOIN CITA ci ON ci.codigoMascota=ma.codigoMascota GROUP BY ma.codigoMascota,ma.nombre,ma.especie,cl.nombreCompleto ORDER BY totalCitas DESC) WHERE ROWNUM<=p_top; RETURN v_cur; END;
    FUNCTION fn_vacunas_aplicadas_mes(p_anio IN NUMBER, p_mes IN NUMBER) RETURN NUMBER IS v_total NUMBER;
    BEGIN SELECT COUNT(*) INTO v_total FROM APLICACION_VACUNA WHERE EXTRACT(YEAR FROM fechaAplicacion)=p_anio AND EXTRACT(MONTH FROM fechaAplicacion)=p_mes; RETURN v_total;
    EXCEPTION WHEN OTHERS THEN PKG_UTILIDADES.manejar('APLICACION_VACUNA','VACUNAS MES',SQLCODE,SQLERRM); END;
    FUNCTION fn_tratamientos_activos RETURN NUMBER IS v_total NUMBER;
    BEGIN SELECT COUNT(*) INTO v_total FROM TRATAMIENTO WHERE estado='ACTIVO'; RETURN v_total;
    EXCEPTION WHEN OTHERS THEN PKG_UTILIDADES.manejar('TRATAMIENTO','ACTIVOS',SQLCODE,SQLERRM); END;
    FUNCTION fn_historial_mascota(p_codigoMascota IN MASCOTA.codigoMascota%TYPE) RETURN T_TAB_HISTORIAL IS
    BEGIN RETURN PKG_MASCOTAS.fn_historial_clinico_mascota(p_codigoMascota); END;
END PKG_REPORTES;
/

-- ============================================================
-- 11. PKG_AUDITORIA
-- ============================================================
CREATE OR REPLACE PACKAGE PKG_AUDITORIA AS
    PROCEDURE pr_registrar_log(p_tabla IN VARCHAR2, p_operacion IN VARCHAR2, p_idRegistro IN VARCHAR2, p_usuario IN VARCHAR2 DEFAULT USER);
    PROCEDURE pr_historial_cambios(p_tabla IN VARCHAR2, p_idRegistro IN VARCHAR2, p_resultado OUT SYS_REFCURSOR);
    PROCEDURE pr_auditar_eliminacion(p_tabla IN VARCHAR2, p_idRegistro IN VARCHAR2, p_datos_json IN CLOB DEFAULT NULL, p_usuario IN VARCHAR2 DEFAULT USER);
END PKG_AUDITORIA;
/

CREATE OR REPLACE PACKAGE BODY PKG_AUDITORIA AS
    PROCEDURE pr_registrar_log(p_tabla IN VARCHAR2, p_operacion IN VARCHAR2, p_idRegistro IN VARCHAR2, p_usuario IN VARCHAR2 DEFAULT USER) IS PRAGMA AUTONOMOUS_TRANSACTION;
    BEGIN INSERT INTO LOG_AUDITORIA (idLog,tabla,operacion,idRegistro,usuario,fechaHora) VALUES (SEQ_LOG_AUDITORIA.NEXTVAL,UPPER(p_tabla),UPPER(p_operacion),p_idRegistro,p_usuario,SYSTIMESTAMP); COMMIT;
    EXCEPTION WHEN OTHERS THEN ROLLBACK; END;
    PROCEDURE pr_historial_cambios(p_tabla IN VARCHAR2, p_idRegistro IN VARCHAR2, p_resultado OUT SYS_REFCURSOR) IS
    BEGIN OPEN p_resultado FOR SELECT idLog,tabla,operacion,idRegistro,datosAntes,usuario,fechaHora FROM LOG_AUDITORIA WHERE tabla=UPPER(p_tabla) AND idRegistro=p_idRegistro ORDER BY fechaHora DESC; END;
    PROCEDURE pr_auditar_eliminacion(p_tabla IN VARCHAR2, p_idRegistro IN VARCHAR2, p_datos_json IN CLOB DEFAULT NULL, p_usuario IN VARCHAR2 DEFAULT USER) IS PRAGMA AUTONOMOUS_TRANSACTION;
    BEGIN INSERT INTO LOG_AUDITORIA (idLog,tabla,operacion,idRegistro,datosAntes,usuario,fechaHora) VALUES (SEQ_LOG_AUDITORIA.NEXTVAL,UPPER(p_tabla),'ELIMINAR',p_idRegistro,p_datos_json,p_usuario,SYSTIMESTAMP); COMMIT;
    EXCEPTION WHEN OTHERS THEN ROLLBACK; END;
END PKG_AUDITORIA;
/




CREATE OR REPLACE TRIGGER trg_ai_cliente_auditoria
AFTER INSERT ON CLIENTE
FOR EACH ROW
BEGIN
    PKG_AUDITORIA.pr_registrar_log(
        p_tabla      => 'CLIENTE',
        p_operacion  => 'INSERTAR',
        p_idRegistro => :NEW.idCliente,
        p_usuario    => USER
    );
END;


CREATE OR REPLACE TRIGGER trg_biu_empleado_validar_salario
BEFORE INSERT OR UPDATE OF salario ON EMPLEADO
FOR EACH ROW
BEGIN
    IF :NEW.salario < 0 THEN
        PKG_UTILIDADES.lanzar_operacion_invalida(
            'EMPLEADO',
            'El salario no puede ser negativo.'
        );
    END IF;
END;



//instead of
CREATE OR REPLACE VIEW vw_clientes_activos AS
SELECT
    idCliente,
    nombreCompleto,
    direccion,
    correoElectronico,
    telefono,
    estado
FROM CLIENTE
WHERE estado = 'ACTIVO';


CREATE OR REPLACE TRIGGER trg_ioi_vw_clientes_activos
INSTEAD OF INSERT ON vw_clientes_activos
FOR EACH ROW
BEGIN
    INSERT INTO CLIENTE (
        idCliente,
        nombreCompleto,
        direccion,
        correoElectronico,
        telefono,
        estado
    ) VALUES (
        TRIM(UPPER(:NEW.idCliente)),
        :NEW.nombreCompleto,
        :NEW.direccion,
        :NEW.correoElectronico,
        :NEW.telefono,
        NVL(:NEW.estado, 'ACTIVO')
    );

    PKG_AUDITORIA.pr_registrar_log(
        p_tabla      => 'CLIENTE',
        p_operacion  => 'INSERTAR_DESDE_VISTA',
        p_idRegistro => :NEW.idCliente,
        p_usuario    => USER
    );
END;




//compuesto


CREATE OR REPLACE TRIGGER trg_comp_detalle_factura_total
FOR INSERT OR UPDATE OR DELETE ON DETALLE_FACTURA
COMPOUND TRIGGER

    TYPE t_facturas_afectadas IS TABLE OF FACTURA.idFactura%TYPE INDEX BY VARCHAR2(30);
    v_facturas t_facturas_afectadas;

    PROCEDURE agregar_factura(p_idFactura FACTURA.idFactura%TYPE) IS
    BEGIN
        IF p_idFactura IS NOT NULL THEN
            v_facturas(TRIM(p_idFactura)) := TRIM(p_idFactura);
        END IF;
    END agregar_factura;

AFTER EACH ROW IS
BEGIN
    IF INSERTING THEN
        agregar_factura(:NEW.idFactura);
    ELSIF UPDATING THEN
        agregar_factura(:OLD.idFactura);
        agregar_factura(:NEW.idFactura);
    ELSIF DELETING THEN
        agregar_factura(:OLD.idFactura);
    END IF;
END AFTER EACH ROW;

AFTER STATEMENT IS
    v_key VARCHAR2(30);
    v_filas NUMBER;
BEGIN
    v_key := v_facturas.FIRST;

    WHILE v_key IS NOT NULL LOOP
        PKG_FACTURACION.pr_recalcular_total_factura(
            p_idFactura        => v_facturas(v_key),
            p_filas_afectadas  => v_filas
        );

        v_key := v_facturas.NEXT(v_key);
    END LOOP;
END AFTER STATEMENT;

END trg_comp_detalle_factura_total;


//pruebas

-- ============================================================
-- PRUEBA 1: trg_ai_cliente_auditoria
-- Objetivo: verificar que al insertar un cliente se registre auditoría.
-- ============================================================

SET SERVEROUTPUT ON;

INSERT INTO CLIENTE (
    idCliente,
    nombreCompleto,
    direccion,
    correoElectronico,
    telefono,
    estado
) VALUES (
    'CLI901',
    'Cliente Auditoria Trigger',
    'Popayán',
    'cliente.trigger@correo.com',
    '3001112233',
    'ACTIVO'
);

COMMIT;

SELECT
    idLog,
    tabla,
    operacion,
    idRegistro,
    usuario,
    fechaHora
FROM LOG_AUDITORIA


ORDER BY fechaHora DESC;





INSERT INTO EMPLEADO (
    idEmpleado,
    nombreCompleto,
    telefono,
    fechaIngreso,
    estadoLaboral,
    tipoEmpleado,
    salario
) VALUES (
    'EMP901',
    'Empleado Salario Valido',
    '3002223344',
    SYSDATE,
    'ACTIVO',
    'RECEPCIONISTA',
    -1500000
);

COMMIT;






INSERT INTO vw_clientes_activos (
    idCliente,
    nombreCompleto,
    direccion,
    correoElectronico,
    telefono,
    estado
) VALUES (
    'CLI903',
    'Cliente Insertado Desde Vista',
    'Popayán Centro',
    'vista.trigger@correo.com',
    '3004445566',
    'ACTIVO'
);

COMMIT;




SELECT
    idCliente,
    nombreCompleto,
    direccion,
    correoElectronico,
    telefono,
    estado
FROM CLIENTE
WHERE idCliente = 'CLI903';




commit




SELECT
    idLog,
    tabla,
    operacion,
    idRegistro,
    usuario,
    fechaHora
FROM LOG_AUDITORIA


ORDER BY fechaHora DESC;




-- ============================================================
-- PRUEBA 5A: trg_comp_detalle_factura_total
-- Objetivo: insertar un detalle y verificar recalculo.
-- Cambia FAC001 por una factura existente.
-- ============================================================

SELECT valorTotal AS total_antes
FROM FACTURA
WHERE idFactura = 'FAC001';

INSERT INTO DETALLE_FACTURA (
    idDetalle,
    idFactura,
    descripcion,
    tipoConcepto,
    cantidad,
    precioUnitario
) VALUES (
    'DETTRG901',
    'FAC001',
    'Detalle agregado por trigger compuesto',
    'OTRO',
    2,
    25000
);

COMMIT;

SELECT valorTotal AS total_despues_insert
FROM FACTURA
WHERE idFactura = 'FAC001';



UPDATE DETALLE_FACTURA
SET cantidad = 3,
    precioUnitario = 30000
WHERE idDetalle = 'DETTRG901';

COMMIT;

SELECT valorTotal AS total_despues_update
FROM FACTURA
WHERE idFactura = 'FAC001';




CREATE OR REPLACE TRIGGER trg_comp_detalle_factura_total
FOR INSERT OR UPDATE OR DELETE ON DETALLE_FACTURA
COMPOUND TRIGGER

    TYPE t_facturas_afectadas IS TABLE OF FACTURA.idFactura%TYPE INDEX BY VARCHAR2(30);
    v_facturas t_facturas_afectadas;

    PROCEDURE agregar_factura(p_idFactura FACTURA.idFactura%TYPE) IS
        v_key VARCHAR2(30);
    BEGIN
        IF p_idFactura IS NOT NULL THEN
            v_key := TRIM(p_idFactura);
            v_facturas(v_key) := v_key;
        END IF;
    END agregar_factura;

AFTER EACH ROW IS
BEGIN
    IF INSERTING THEN
        agregar_factura(:NEW.idFactura);

    ELSIF UPDATING THEN
        agregar_factura(:OLD.idFactura);
        agregar_factura(:NEW.idFactura);

    ELSIF DELETING THEN
        agregar_factura(:OLD.idFactura);
    END IF;
END AFTER EACH ROW;

AFTER STATEMENT IS
    v_key   VARCHAR2(30);
    v_total NUMBER(14,2);
BEGIN
    v_key := v_facturas.FIRST;

    WHILE v_key IS NOT NULL LOOP

        SELECT NVL(SUM(cantidad * precioUnitario), 0)
        INTO v_total
        FROM DETALLE_FACTURA
        WHERE TRIM(idFactura) = v_key;

        UPDATE FACTURA
        SET valorTotal = v_total
        WHERE TRIM(idFactura) = v_key;

        v_key := v_facturas.NEXT(v_key);
    END LOOP;
END AFTER STATEMENT;

END trg_comp_detalle_factura_total;
/




SELECT valorTotal AS total_antes
FROM FACTURA
WHERE idFactura = 'FAC001';

INSERT INTO DETALLE_FACTURA (
    idDetalle,
    idFactura,
    descripcion,
    tipoConcepto,
    cantidad,
    precioUnitario
) VALUES (
    'DETTRG901',
    'FAC001',
    'Detalle agregado por trigger compuesto',
    'OTRO',
    2,
    25000
);

COMMIT;

SELECT valorTotal AS total_despues
FROM FACTURA
WHERE idFactura = 'FAC001';





UPDATE DETALLE_FACTURA
SET cantidad = 3,
    precioUnitario = 30000
WHERE idDetalle = 'DETTRG901';

COMMIT;

SELECT valorTotal AS total_despues_update
FROM FACTURA
WHERE idFactura = 'FAC001';



DELETE FROM DETALLE_FACTURA
WHERE idDetalle = 'DETTRG901';

COMMIT;

SELECT valorTotal AS total_despues_delete
FROM FACTURA
WHERE idFactura = 'FAC001';
