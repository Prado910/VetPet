
-- ============================================================
-- 1. CATALOGO_SERVICIOS
-- ============================================================
INSERT INTO CATALOGO_SERVICIOS (idServicio, nombre, tipoServicio, precio, descripcion, activo)
VALUES ('SVC001','Consulta General','CONSULTA',50000,'Consulta básica','S');
INSERT INTO CATALOGO_SERVICIOS (idServicio, nombre, tipoServicio, precio, descripcion, activo)
VALUES ('SVC002','Consulta Especializada','CONSULTA',80000,'Consulta avanzada','S');
INSERT INTO CATALOGO_SERVICIOS (idServicio, nombre, tipoServicio, precio, descripcion, activo)
VALUES ('SVC003','Cirugía Ambulatoria','PROCEDIMIENTO',200000,'Cirugía menor','S');
INSERT INTO CATALOGO_SERVICIOS (idServicio, nombre, tipoServicio, precio, descripcion, activo)
VALUES ('SVC004','Fisioterapia','TERAPIA',60000,'Rehabilitación','S');
INSERT INTO CATALOGO_SERVICIOS (idServicio, nombre, tipoServicio, precio, descripcion, activo)
VALUES ('SVC005','Vacunación Básica','VACUNACION',30000,'Vacunas comunes','S');

-- ============================================================
-- 2. CLIENTE
-- ============================================================
INSERT INTO CLIENTE (idCliente, nombreCompleto, direccion, correoElectronico, telefono, estado)
VALUES ('CLI001','Juan Pérez','Calle 1','juan@mail.com','3001111111','ACTIVO');
INSERT INTO CLIENTE (idCliente, nombreCompleto, direccion, correoElectronico, telefono, estado)
VALUES ('CLI002','Ana Gómez','Calle 2','ana@mail.com','3002222222','ACTIVO');
INSERT INTO CLIENTE (idCliente, nombreCompleto, direccion, correoElectronico, telefono, estado)
VALUES ('CLI003','Carlos Ruiz','Calle 3','carlos@mail.com','3003333333','ACTIVO');
INSERT INTO CLIENTE (idCliente, nombreCompleto, direccion, correoElectronico, telefono, estado)
VALUES ('CLI004','Laura Díaz','Calle 4','laura@mail.com','3004444444','ACTIVO');
INSERT INTO CLIENTE (idCliente, nombreCompleto, direccion, correoElectronico, telefono, estado)
VALUES ('CLI005','Pedro López','Calle 5','pedro@mail.com','3005555555','ACTIVO');

-- ============================================================
-- 3. EMPLEADO
-- ============================================================
INSERT INTO EMPLEADO (idEmpleado, nombreCompleto, telefono, fechaIngreso, estadoLaboral, tipoEmpleado, salario)
VALUES ('EMP001','Dr. Luis Torres','3001110000',SYSDATE,'ACTIVO','VETERINARIO',3000000);
INSERT INTO EMPLEADO (idEmpleado, nombreCompleto, telefono, fechaIngreso, estadoLaboral, tipoEmpleado, salario)
VALUES ('EMP002','Dra. Marta Silva','3002220000',SYSDATE,'ACTIVO','VETERINARIO',3200000);
INSERT INTO EMPLEADO (idEmpleado, nombreCompleto, telefono, fechaIngreso, estadoLaboral, tipoEmpleado, salario)
VALUES ('EMP003','Laura Recepción','3003330000',SYSDATE,'ACTIVO','RECEPCIONISTA',1500000);
INSERT INTO EMPLEADO (idEmpleado, nombreCompleto, telefono, fechaIngreso, estadoLaboral, tipoEmpleado, salario)
VALUES ('EMP004','Carlos Recepción','3004440000',SYSDATE,'ACTIVO','RECEPCIONISTA',1500000);
INSERT INTO EMPLEADO (idEmpleado, nombreCompleto, telefono, fechaIngreso, estadoLaboral, tipoEmpleado, salario)
VALUES ('EMP005','Pedro Vet','3005550000',SYSDATE,'ACTIVO','VETERINARIO',3100000);

-- ============================================================
-- 4. VETERINARIO
-- ============================================================
INSERT INTO VETERINARIO (idEmpleado, especialidad, nroMatricula)
VALUES ('EMP001','Cirugía','MAT001');
INSERT INTO VETERINARIO (idEmpleado, especialidad, nroMatricula)
VALUES ('EMP002','Dermatología','MAT002');
INSERT INTO VETERINARIO (idEmpleado, especialidad, nroMatricula)
VALUES ('EMP005','General','MAT003');

-- ============================================================
-- 5. RECEPCIONISTA
-- ============================================================
INSERT INTO RECEPCIONISTA (idEmpleado, turno)
VALUES ('EMP003','DIURNO');
INSERT INTO RECEPCIONISTA (idEmpleado, turno)
VALUES ('EMP004','NOCTURNO');

-- ============================================================
-- 6. MASCOTA
-- ============================================================
INSERT INTO MASCOTA (codigoMascota, idCliente, nombre, fechaNacimiento, sexo, peso, especie, raza)
VALUES ('MAS001','CLI001','Firulais',DATE '2020-05-10','M',10,'PERRO','Labrador');
INSERT INTO MASCOTA (codigoMascota, idCliente, nombre, fechaNacimiento, sexo, peso, especie, raza)
VALUES ('MAS002','CLI002','Mishi',DATE '2021-03-15','H',5,'GATO','Siamés');
INSERT INTO MASCOTA (codigoMascota, idCliente, nombre, fechaNacimiento, sexo, peso, especie, raza)
VALUES ('MAS003','CLI003','Rocky',DATE '2019-07-20','M',20,'PERRO','Bulldog');
INSERT INTO MASCOTA (codigoMascota, idCliente, nombre, fechaNacimiento, sexo, peso, especie, raza)
VALUES ('MAS004','CLI004','Luna',DATE '2022-01-01','H',3,'GATO','Persa');
INSERT INTO MASCOTA (codigoMascota, idCliente, nombre, fechaNacimiento, sexo, peso, especie, raza)
VALUES ('MAS005','CLI005','Max',DATE '2018-09-09','M',25,'PERRO','Pastor Alemán');

-- ============================================================
-- 7. CITA
-- ============================================================
INSERT INTO CITA (idCita, codigoMascota, idVeterinario, idRecepcionista, fecha, hora, motivoConsulta, estadoCita)
VALUES ('CITA001','MAS001','EMP001','EMP003',TRUNC(SYSDATE),INTERVAL '10' HOUR,'Control','PROGRAMADA');
INSERT INTO CITA (idCita, codigoMascota, idVeterinario, idRecepcionista, fecha, hora, motivoConsulta, estadoCita)
VALUES ('CITA002','MAS002','EMP002','EMP003',TRUNC(SYSDATE),INTERVAL '11' HOUR,'Vacuna','CONFIRMADA');
INSERT INTO CITA (idCita, codigoMascota, idVeterinario, idRecepcionista, fecha, hora, motivoConsulta, estadoCita)
VALUES ('CITA003','MAS003','EMP001','EMP004',TRUNC(SYSDATE),INTERVAL '12' HOUR,'Dolor','ATENDIDA');

-- ============================================================
-- 8. CONSULTA_VETERINARIA
-- ============================================================
INSERT INTO CONSULTA_VETERINARIA (idConsulta, idCita, idServicio, temperatura, pesoConsulta, observaciones, recomendaciones, fechaAtencionReal)
VALUES ('CON001','CITA003','SVC001',38.5,20,'Todo bien','Reposo',SYSDATE);

-- ============================================================
-- 9. DIAGNOSTICO
-- ============================================================
INSERT INTO DIAGNOSTICO (idDiagnostico, idConsulta, descripcionCondicion, nivelGravedad, tipoAfeccion, estado)
VALUES ('DIA001','CON001','Infección leve','BAJA','BACTERIANA','CONFIRMADO');

-- ============================================================
-- 10. MEDICAMENTO
-- ============================================================
INSERT INTO MEDICAMENTO (idMedicamento, nombre, descripcion, precioUnitario)
VALUES ('MED001','Antibiótico','Para infecciones',15000);
INSERT INTO MEDICAMENTO (idMedicamento, nombre, descripcion, precioUnitario)
VALUES ('MED002','Vitaminas','Suplemento',10000);

-- ============================================================
-- 11. TRATAMIENTO
-- ============================================================
INSERT INTO TRATAMIENTO (idTratamiento, idDiagnostico, idVeterinario, idServicio, tipo, fechaInicio, fechaFinEstimada, indicaciones, estado)
VALUES ('TRAT001','DIA001','EMP001',NULL,'MEDICACION',SYSDATE,NULL,'Tomar 2 veces al día','ACTIVO');

-- ============================================================
-- 12. TRATAMIENTO_MEDICAMENTO
-- ============================================================
INSERT INTO TRATAMIENTO_MEDICAMENTO (idTratamiento, idMedicamento, dosis, frecuencia, viaAdministracion, duracion)
VALUES ('TRAT001','MED001','500mg','2 veces día','Oral','7 días');

-- ============================================================
-- 13. VACUNA
-- ============================================================
INSERT INTO VACUNA (idVacuna, nombre, laboratorio, lote, fechaVencimiento, especieObjetivo, precio)
VALUES ('VAC001','Rabia','LabVet','L001',DATE '2027-01-01','PERRO',20000);

-- ============================================================
-- 14. APLICACION_VACUNA
-- ============================================================
INSERT INTO APLICACION_VACUNA (codigoMascota, idVacuna, fechaAplicacion, observacion)
VALUES ('MAS001','VAC001',SYSDATE,'Sin reacción');

-- ============================================================
-- 15. DIAGNOSTICO_VACUNA
-- ============================================================
INSERT INTO DIAGNOSTICO_VACUNA (idDiagnostico, idVacuna)
VALUES ('DIA001','VAC001');

-- ============================================================
-- 16. FACTURA
-- ============================================================
INSERT INTO FACTURA (idFactura, idConsulta, idCliente, fecha, valorTotal, metodoPago, estadoPago)
VALUES ('FAC001','CON001','CLI001',SYSDATE,65000,'EFECTIVO','PAGADA');

-- ============================================================
-- 17. DETALLE_FACTURA
-- ============================================================
INSERT INTO DETALLE_FACTURA (idDetalle, idFactura, descripcion, tipoConcepto, cantidad, precioUnitario)
VALUES ('DET001','FAC001','Consulta General','CONSULTA',1,50000);
INSERT INTO DETALLE_FACTURA (idDetalle, idFactura, descripcion, tipoConcepto, cantidad, precioUnitario)
VALUES ('DET002','FAC001','Antibiótico','MEDICAMENTO',1,15000);

COMMIT;
