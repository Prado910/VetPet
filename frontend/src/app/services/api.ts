const API_URL = "http://localhost:3000/api";

export interface ApiMutationResponse {
  ok?: boolean;
  action?: "CREATED" | "UPDATED" | "DELETED" | string;
  message: string;
  id?: string;
  filasAfectadas?: number;
  valorTotal?: number;
}

/* ============================================================
  TIPOS GENERALES
============================================================ */

export type EstadoCliente = "ACTIVO" | "INACTIVO" | "SUSPENDIDO";

export type EstadoCita =
  | "PROGRAMADA"
  | "CONFIRMADA"
  | "ATENDIDA"
  | "CANCELADA"
  | "REPROGRAMADA";

export type SexoMascota = "M" | "H" | "" | null;

export type TipoEmpleado = "VETERINARIO" | "RECEPCIONISTA";

export type EstadoLaboral = "ACTIVO" | "INACTIVO" | "SUSPENDIDO";

export type TurnoRecepcionista = "DIURNO" | "NOCTURNO";

export type TipoServicio =
  | "CONSULTA"
  | "PROCEDIMIENTO"
  | "TERAPIA"
  | "VACUNACION"
  | "PLAN_VACUNACION"
  | "OTRO";

export type EstadoPago = "PENDIENTE" | "PAGADA" | "ANULADA";

export type TipoConceptoFactura =
  | "CONSULTA"
  | "MEDICAMENTO"
  | "VACUNA"
  | "PROCEDIMIENTO"
  | "OTRO";

/* ============================================================
   REQUEST BASE
============================================================ */

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.message ||
        errorData?.error ||
        `Error HTTP ${response.status}`
    );
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

function encodeId(id: string | number) {
  return encodeURIComponent(String(id).trim());
}

/* ============================================================
   CLIENTES
============================================================ */

export interface Cliente {
  id: string;
  nombre: string;
  direccion?: string | null;
  email?: string | null;
  telefono?: string | null;
  estado: EstadoCliente;
}

export interface ClienteInput {
  id?: string;
  nombre: string;
  direccion?: string | null;
  email?: string | null;
  telefono?: string | null;
  estado: EstadoCliente;
}

export function getClientes() {
  return request<Cliente[]>("/clientes");
}

export function getClienteById(id: string) {
  return request<Cliente>(`/clientes/${encodeId(id)}`);
}

export function createCliente(cliente: ClienteInput) {
  return request<ApiMutationResponse>("/clientes", {
    method: "POST",
    body: JSON.stringify(cliente),
  });
}

export function updateCliente(id: string, cliente: ClienteInput) {
  return request<ApiMutationResponse>(`/clientes/${encodeId(id)}`, {
    method: "PUT",
    body: JSON.stringify(cliente),
  });
}

export function deleteCliente(id: string) {
  return request<ApiMutationResponse>(`/clientes/${encodeId(id)}`, {
    method: "DELETE",
  });
}

/* ============================================================
   MASCOTAS
============================================================ */

export interface Mascota {
  id: string;
  clienteId: string;
  nombre: string;
  fechaNacimiento?: string | null;
  edad?: number | null;
  sexo?: "M" | "H" | null;
  peso?: number | null;
  especie: string;
  raza?: string | null;
  clienteNombre?: string | null;
  estadoSalud?: string | null;
}

export interface MascotaInput {
  id?: string;
  clienteId: string;
  nombre: string;
  fechaNacimiento?: string | null;
  sexo?: SexoMascota;
  peso?: number | string | null;
  especie: string;
  raza?: string | null;
}

export function getMascotas() {
  return request<Mascota[]>("/mascotas");
}

export function createMascota(mascota: MascotaInput) {
  return request<ApiMutationResponse>("/mascotas", {
    method: "POST",
    body: JSON.stringify(mascota),
  });
}

export function updateMascota(id: string, mascota: MascotaInput) {
  return request<ApiMutationResponse>(`/mascotas/${encodeId(id)}`, {
    method: "PUT",
    body: JSON.stringify(mascota),
  });
}

export function deleteMascota(id: string) {
  return request<ApiMutationResponse>(`/mascotas/${encodeId(id)}`, {
    method: "DELETE",
  });
}

/* ============================================================
   CITAS
============================================================ */

export interface Cita {
  id: string;
  mascotaId: string;
  mascotaNombre?: string | null;
  mascotaEspecie?: string | null;
  clienteId?: string | null;
  clienteNombre?: string | null;
  clienteTelefono?: string | null;
  veterinarioId: string;
  veterinarioNombre?: string | null;
  recepcionistaId: string;
  recepcionistaNombre?: string | null;
  fecha: string;
  hora: string;
  motivo?: string | null;
  estado: EstadoCita;
}

export interface CitaInput {
  id?: string;
  mascotaId: string;
  veterinarioId: string;
  recepcionistaId: string;
  fecha: string;
  hora: string;
  motivo?: string | null;
  estado: EstadoCita;
}

export interface CitasCatalogos {
  mascotas: Array<{
    id: string;
    nombre: string;
    especie: string;
    clienteNombre?: string | null;
  }>;
  veterinarios: Array<{
    id: string;
    nombre: string;
    especialidad?: string | null;
  }>;
  recepcionistas: Array<{
    id: string;
    nombre: string;
    turno?: string | null;
  }>;
}

export function getCitas() {
  return request<Cita[]>("/citas");
}

export function getCitasCatalogos() {
  return request<CitasCatalogos>("/citas/catalogos");
}

export function createCita(cita: CitaInput) {
  return request<ApiMutationResponse>("/citas", {
    method: "POST",
    body: JSON.stringify(cita),
  });
}

export function updateCita(id: string, cita: CitaInput) {
  return request<ApiMutationResponse>(`/citas/${encodeId(id)}`, {
    method: "PUT",
    body: JSON.stringify(cita),
  });
}

export function deleteCita(id: string) {
  return request<ApiMutationResponse>(`/citas/${encodeId(id)}`, {
    method: "DELETE",
  });
}

/* ============================================================
   EMPLEADOS
============================================================ */

export interface Empleado {
  id: string;
  nombre: string;
  telefono?: string | null;
  fechaIngreso: string;
  estadoLaboral: EstadoLaboral;
  tipoEmpleado: TipoEmpleado;
  salario: number;
  especialidad?: string | null;
  nroMatricula?: string | null;
  turno?: TurnoRecepcionista | null;
}

export interface EmpleadoInput {
  id?: string;
  nombre: string;
  telefono?: string | null;
  fechaIngreso: string;
  estadoLaboral: EstadoLaboral;
  tipoEmpleado: TipoEmpleado;
  salario: number | string;
  especialidad?: string | null;
  nroMatricula?: string | null;
  turno?: TurnoRecepcionista | null;
}

export function getEmpleados() {
  return request<Empleado[]>("/empleados");
}

export function getVeterinarios() {
  return request<Empleado[]>("/empleados/veterinarios");
}

export function getRecepcionistas() {
  return request<Empleado[]>("/empleados/recepcionistas");
}

export function createEmpleado(empleado: EmpleadoInput) {
  return request<ApiMutationResponse>("/empleados", {
    method: "POST",
    body: JSON.stringify(empleado),
  });
}

export function updateEmpleado(id: string, empleado: EmpleadoInput) {
  return request<ApiMutationResponse>(`/empleados/${encodeId(id)}`, {
    method: "PUT",
    body: JSON.stringify(empleado),
  });
}

export function deleteEmpleado(id: string) {
  return request<ApiMutationResponse>(`/empleados/${encodeId(id)}`, {
    method: "DELETE",
  });
}

/* ============================================================
   SERVICIOS
============================================================ */

export interface Servicio {
  id: string;
  nombre: string;
  tipoServicio: TipoServicio;
  precio: number;
  descripcion?: string | null;
  activo: "S" | "N";
}

export interface ServicioInput {
  id?: string;
  nombre: string;
  tipoServicio: TipoServicio;
  precio: number | string;
  descripcion?: string | null;
  activo: "S" | "N";
}

export function getServicios(soloActivos = false) {
  const query = soloActivos ? "?activos=true" : "";
  return request<Servicio[]>(`/servicios${query}`);
}

export function createServicio(servicio: ServicioInput) {
  return request<ApiMutationResponse>("/servicios", {
    method: "POST",
    body: JSON.stringify(servicio),
  });
}

export function updateServicio(id: string, servicio: ServicioInput) {
  return request<ApiMutationResponse>(`/servicios/${encodeId(id)}`, {
    method: "PUT",
    body: JSON.stringify(servicio),
  });
}

export function deleteServicio(id: string) {
  return request<ApiMutationResponse>(`/servicios/${encodeId(id)}`, {
    method: "DELETE",
  });
}

/* ============================================================
   MEDICAMENTOS
============================================================ */

export interface Medicamento {
  id: string;
  nombre: string;
  descripcion?: string | null;
  precioUnitario: number;
}

export interface MedicamentoInput {
  id?: string;
  nombre: string;
  descripcion?: string | null;
  precioUnitario: number | string;
}

export function getMedicamentos() {
  return request<Medicamento[]>("/medicamentos");
}

export function createMedicamento(medicamento: MedicamentoInput) {
  return request<ApiMutationResponse>("/medicamentos", {
    method: "POST",
    body: JSON.stringify(medicamento),
  });
}

export function updateMedicamento(id: string, medicamento: MedicamentoInput) {
  return request<ApiMutationResponse>(`/medicamentos/${encodeId(id)}`, {
    method: "PUT",
    body: JSON.stringify(medicamento),
  });
}

export function deleteMedicamento(id: string) {
  return request<ApiMutationResponse>(`/medicamentos/${encodeId(id)}`, {
    method: "DELETE",
  });
}

/* ============================================================
   VACUNAS
============================================================ */

export interface Vacuna {
  id: string;
  nombre: string;
  laboratorio?: string | null;
  lote?: string | null;
  fechaVencimiento?: string | null;
  especieObjetivo?: string | null;
  precio: number;
}

export interface VacunaInput {
  id?: string;
  nombre: string;
  laboratorio?: string | null;
  lote?: string | null;
  fechaVencimiento?: string | null;
  especieObjetivo?: string | null;
  precio: number | string;
}

export interface AplicacionVacuna {
  id: string;
  codigoMascota: string;
  idVacuna: string;
  fechaAplicacion: string;
  observacion?: string | null;
  mascotaNombre?: string | null;
  mascotaEspecie?: string | null;
  clienteId?: string | null;
  clienteNombre?: string | null;
  vacunaNombre?: string | null;
  laboratorio?: string | null;
  lote?: string | null;
  especieObjetivo?: string | null;
  precio?: number | null;
}

export interface AplicacionVacunaInput {
  codigoMascota: string;
  idVacuna: string;
  fechaAplicacion: string;
  observacion?: string | null;
}

export interface VacunasCatalogos {
  mascotas: Array<{
    id: string;
    nombre: string;
    especie: string;
    clienteId: string;
    clienteNombre: string;
  }>;
  vacunas: Vacuna[];
}

export function getVacunas() {
  return request<Vacuna[]>("/vacunas");
}

export function getVacunasCatalogos() {
  return request<VacunasCatalogos>("/vacunas/catalogos");
}

export function createVacuna(vacuna: VacunaInput) {
  return request<ApiMutationResponse>("/vacunas", {
    method: "POST",
    body: JSON.stringify(vacuna),
  });
}

export function updateVacuna(id: string, vacuna: VacunaInput) {
  return request<ApiMutationResponse>(`/vacunas/${encodeId(id)}`, {
    method: "PUT",
    body: JSON.stringify(vacuna),
  });
}

export function deleteVacuna(id: string) {
  return request<ApiMutationResponse>(`/vacunas/${encodeId(id)}`, {
    method: "DELETE",
  });
}

export function getAplicacionesVacunas() {
  return request<AplicacionVacuna[]>("/vacunas/aplicaciones");
}

export function createAplicacionVacuna(aplicacion: AplicacionVacunaInput) {
  return request<ApiMutationResponse>("/vacunas/aplicaciones", {
    method: "POST",
    body: JSON.stringify(aplicacion),
  });
}

export function updateAplicacionVacuna(aplicacion: AplicacionVacunaInput) {
  return request<ApiMutationResponse>("/vacunas/aplicaciones", {
    method: "PUT",
    body: JSON.stringify(aplicacion),
  });
}

export function deleteAplicacionVacuna(aplicacion: AplicacionVacunaInput) {
  const params = new URLSearchParams();

  params.set("codigoMascota", aplicacion.codigoMascota);
  params.set("idVacuna", aplicacion.idVacuna);
  params.set("fechaAplicacion", aplicacion.fechaAplicacion);

  return request<ApiMutationResponse>(`/vacunas/aplicaciones?${params.toString()}`, {
    method: "DELETE",
  });
}

/* ============================================================
   CONSULTAS VETERINARIAS
============================================================ */

export interface Consulta {
  id: string;
  idCita: string;
  idServicio: string;
  temperatura?: number | null;
  pesoConsulta?: number | null;
  observaciones?: string | null;
  recomendaciones?: string | null;
  fechaAtencionReal: string;

  citaFecha?: string | null;
  citaHora?: string | null;
  motivo?: string | null;
  citaEstado?: string | null;

  mascotaId?: string | null;
  mascotaNombre?: string | null;
  mascotaEspecie?: string | null;

  clienteId?: string | null;
  clienteNombre?: string | null;
  clienteTelefono?: string | null;

  veterinarioId?: string | null;
  veterinarioNombre?: string | null;

  servicioNombre?: string | null;
  servicioTipo?: string | null;
  servicioPrecio?: number | null;
}

export interface ConsultaInput {
  id?: string | null;
  idCita: string;
  idServicio: string;
  temperatura?: number | string | null;
  pesoConsulta?: number | string | null;
  observaciones?: string | null;
  recomendaciones?: string | null;
  fechaAtencionReal: string;
}

export interface ConsultasCatalogos {
  citasDisponibles: Cita[];
  servicios: Servicio[];
}

export function getConsultas() {
  return request<Consulta[]>("/consultas");
}

export function getConsultasCatalogos() {
  return request<ConsultasCatalogos>("/consultas/catalogos");
}

export function createConsulta(consulta: ConsultaInput) {
  return request<ApiMutationResponse>("/consultas", {
    method: "POST",
    body: JSON.stringify(consulta),
  });
}

export function updateConsulta(id: string, consulta: ConsultaInput) {
  return request<ApiMutationResponse>(`/consultas/${encodeId(id)}`, {
    method: "PUT",
    body: JSON.stringify(consulta),
  });
}

export function deleteConsulta(id: string) {
  return request<ApiMutationResponse>(`/consultas/${encodeId(id)}`, {
    method: "DELETE",
  });
}

/* ============================================================
   DIAGNÓSTICOS
============================================================ */

export interface Diagnostico {
  id: string;
  idConsulta: string;
  descripcionCondicion: string;
  nivelGravedad?: string | null;
  tipoAfeccion?: string | null;
  estado: "PRESUNTIVO" | "CONFIRMADO" | "DESCARTADO" | string;

  fechaAtencionReal?: string | null;
  idCita?: string | null;
  motivoConsulta?: string | null;

  mascotaId?: string | null;
  mascotaNombre?: string | null;
  mascotaEspecie?: string | null;

  clienteId?: string | null;
  clienteNombre?: string | null;

  veterinarioId?: string | null;
  veterinarioNombre?: string | null;

  servicioNombre?: string | null;
  tratamientosCount?: number;
}

export interface DiagnosticoInput {
  id?: string | null;
  idConsulta: string;
  descripcionCondicion: string;
  nivelGravedad?: string | null;
  tipoAfeccion?: string | null;
  estado: "PRESUNTIVO" | "CONFIRMADO" | "DESCARTADO" | string;
}

export interface DiagnosticosCatalogos {
  consultas: Consulta[];
}

export function getDiagnosticos() {
  return request<Diagnostico[]>("/diagnosticos");
}

export function getDiagnosticosCatalogos() {
  return request<DiagnosticosCatalogos>("/diagnosticos/catalogos");
}

export function createDiagnostico(diagnostico: DiagnosticoInput) {
  return request<ApiMutationResponse>("/diagnosticos", {
    method: "POST",
    body: JSON.stringify(diagnostico),
  });
}

export function updateDiagnostico(id: string, diagnostico: DiagnosticoInput) {
  return request<ApiMutationResponse>(`/diagnosticos/${encodeId(id)}`, {
    method: "PUT",
    body: JSON.stringify(diagnostico),
  });
}

export function deleteDiagnostico(id: string) {
  return request<ApiMutationResponse>(`/diagnosticos/${encodeId(id)}`, {
    method: "DELETE",
  });
}

/* ============================================================
   TRATAMIENTOS
============================================================ */

export interface Tratamiento {
  id: string;
  idDiagnostico: string;
  idVeterinario: string;
  idServicio?: string | null;
  tipo: string;
  fechaInicio: string;
  fechaFinEstimada?: string | null;
  indicaciones?: string | null;
  estado?: string | null;

  descripcionCondicion?: string | null;
  nivelGravedad?: string | null;
  tipoAfeccion?: string | null;
  diagnosticoEstado?: string | null;

  idConsulta?: string | null;
  fechaAtencionReal?: string | null;

  mascotaNombre?: string | null;
  mascotaEspecie?: string | null;
  clienteNombre?: string | null;

  veterinarioNombre?: string | null;

  servicioNombre?: string | null;
  servicioTipo?: string | null;
  servicioPrecio?: number | null;

  medicamentosCount?: number;
  medicamentos?: string | null;
}

export interface TratamientoInput {
  id?: string | null;
  idDiagnostico: string;
  idVeterinario: string;
  idServicio?: string | null;
  tipo: string;
  fechaInicio: string;
  fechaFinEstimada?: string | null;
  indicaciones?: string | null;
  estado?: string | null;
}

export interface TratamientoMedicamento {
  idTratamiento: string;
  idMedicamento: string;
  dosis: string;
  frecuencia: string;
  viaAdministracion?: string | null;
  duracion?: string | null;
  medicamentoNombre?: string | null;
  medicamentoDescripcion?: string | null;
  precioUnitario?: number | null;
}

export interface TratamientoMedicamentoInput {
  idMedicamento: string;
  dosis: string;
  frecuencia: string;
  viaAdministracion?: string | null;
  duracion?: string | null;
}

export interface TratamientosCatalogos {
  diagnosticos: Diagnostico[];
  veterinarios: Empleado[];
  servicios: Servicio[];
  medicamentos: Medicamento[];
}

export function getTratamientos() {
  return request<Tratamiento[]>("/tratamientos");
}

export function getTratamientosCatalogos() {
  return request<TratamientosCatalogos>("/tratamientos/catalogos");
}

export function createTratamiento(tratamiento: TratamientoInput) {
  return request<ApiMutationResponse>("/tratamientos", {
    method: "POST",
    body: JSON.stringify(tratamiento),
  });
}

export function updateTratamiento(id: string, tratamiento: TratamientoInput) {
  return request<ApiMutationResponse>(`/tratamientos/${encodeId(id)}`, {
    method: "PUT",
    body: JSON.stringify(tratamiento),
  });
}

export function deleteTratamiento(id: string) {
  return request<ApiMutationResponse>(`/tratamientos/${encodeId(id)}`, {
    method: "DELETE",
  });
}

export function getMedicamentosTratamiento(idTratamiento: string) {
  return request<TratamientoMedicamento[]>(
    `/tratamientos/${encodeId(idTratamiento)}/medicamentos`
  );
}

export function addMedicamentoTratamiento(
  idTratamiento: string,
  medicamento: TratamientoMedicamentoInput
) {
  return request<ApiMutationResponse>(
    `/tratamientos/${encodeId(idTratamiento)}/medicamentos`,
    {
      method: "POST",
      body: JSON.stringify(medicamento),
    }
  );
}

export function updateMedicamentoTratamiento(
  idTratamiento: string,
  idMedicamento: string,
  medicamento: TratamientoMedicamentoInput
) {
  return request<ApiMutationResponse>(
    `/tratamientos/${encodeId(idTratamiento)}/medicamentos/${encodeId(
      idMedicamento
    )}`,
    {
      method: "PUT",
      body: JSON.stringify(medicamento),
    }
  );
}

export function deleteMedicamentoTratamiento(
  idTratamiento: string,
  idMedicamento: string
) {
  return request<ApiMutationResponse>(
    `/tratamientos/${encodeId(idTratamiento)}/medicamentos/${encodeId(
      idMedicamento
    )}`,
    {
      method: "DELETE",
    }
  );
}

/* ============================================================
   FACTURACIÓN
============================================================ */

export interface Factura {
  id: string;
  idConsulta: string;
  idCliente: string;
  fecha: string;
  valorTotal: number;
  metodoPago?: string | null;
  estadoPago: EstadoPago;

  clienteNombre?: string | null;
  clienteTelefono?: string | null;
  clienteEmail?: string | null;

  idCita?: string | null;
  fechaAtencionReal?: string | null;

  mascotaId?: string | null;
  mascotaNombre?: string | null;
  mascotaEspecie?: string | null;

  servicioNombre?: string | null;
  servicioTipo?: string | null;
  servicioPrecio?: number | null;

  detallesCount?: number;
  totalCalculado?: number;
}

export interface FacturaInput {
  id?: string | null;
  idConsulta: string;
  fecha: string;
  metodoPago?: string | null;
  estadoPago: EstadoPago;
  crearDetalleConsulta?: boolean;
}

export interface DetalleFactura {
  id: string;
  idFactura: string;
  descripcion: string;
  tipoConcepto: TipoConceptoFactura;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface DetalleFacturaInput {
  id?: string | null;
  descripcion: string;
  tipoConcepto: TipoConceptoFactura;
  cantidad: number | string;
  precioUnitario: number | string;
}

export interface FacturasCatalogos {
  consultasDisponibles: Consulta[];
}

export function getFacturas() {
  return request<Factura[]>("/facturas");
}

export function getFacturasCatalogos() {
  return request<FacturasCatalogos>("/facturas/catalogos");
}

export function createFactura(factura: FacturaInput) {
  return request<ApiMutationResponse>("/facturas", {
    method: "POST",
    body: JSON.stringify(factura),
  });
}

export function updateFactura(id: string, factura: FacturaInput) {
  return request<ApiMutationResponse>(`/facturas/${encodeId(id)}`, {
    method: "PUT",
    body: JSON.stringify(factura),
  });
}

export function deleteFactura(id: string) {
  return request<ApiMutationResponse>(`/facturas/${encodeId(id)}`, {
    method: "DELETE",
  });
}

export function getDetallesFactura(idFactura: string) {
  return request<DetalleFactura[]>(`/facturas/${encodeId(idFactura)}/detalles`);
}

export function createDetalleFactura(
  idFactura: string,
  detalle: DetalleFacturaInput
) {
  return request<ApiMutationResponse>(
    `/facturas/${encodeId(idFactura)}/detalles`,
    {
      method: "POST",
      body: JSON.stringify(detalle),
    }
  );
}

export function updateDetalleFactura(
  idFactura: string,
  idDetalle: string,
  detalle: DetalleFacturaInput
) {
  return request<ApiMutationResponse>(
    `/facturas/${encodeId(idFactura)}/detalles/${encodeId(idDetalle)}`,
    {
      method: "PUT",
      body: JSON.stringify(detalle),
    }
  );
}

export function deleteDetalleFactura(idFactura: string, idDetalle: string) {
  return request<ApiMutationResponse>(
    `/facturas/${encodeId(idFactura)}/detalles/${encodeId(idDetalle)}`,
    {
      method: "DELETE",
    }
  );
}

export function recalcularFactura(idFactura: string) {
  return request<ApiMutationResponse>(
    `/facturas/${encodeId(idFactura)}/recalcular`,
    {
      method: "POST",
    }
  );
}

/* ============================================================
   DASHBOARD
============================================================ */

export interface DashboardResumen {
  totalClientes: number;
  clientesActivos: number;
  totalMascotas: number;
  empleadosActivos: number;
  citasHoy: number;
  citasPendientes: number;
  consultasMes: number;
  tratamientosActivos: number;
  facturasPendientes: number;
  ingresosHoy: number;
  ingresosMes: number;
  ingresosTotal: number;
  vacunasMes: number;
}

export interface ActividadReciente {
  tipo: string;
  id: string;
  titulo: string;
  descripcion?: string | null;
  fecha?: string | null;
  hora?: string | null;
  estado?: string | null;
}

export function getDashboardResumen() {
  return request<DashboardResumen>("/dashboard/resumen");
}

export function getDashboardCitasHoy() {
  return request<Cita[]>("/dashboard/citas-hoy");
}

export function getDashboardActividadReciente(limite = 10) {
  return request<ActividadReciente[]>(
    `/dashboard/actividad-reciente?limite=${limite}`
  );
}

/* ============================================================
   REPORTES
============================================================ */

export interface ReporteIngresoMensual {
  mesNumero: number;
  mes: string;
  totalFacturas: number;
  facturasPagadas: number;
  facturasPendientes: number;
  facturasAnuladas: number;
  ingresosPagados: number;
  ingresosPendientes: number;
  valorTotal: number;
}

export interface ReporteMascotaMasAtendida {
  mascotaId: string;
  mascotaNombre: string;
  mascotaEspecie: string;
  mascotaRaza?: string | null;
  clienteId: string;
  clienteNombre: string;
  atenciones: number;
  ultimaAtencion?: string | null;
  ingresosGenerados: number;
}

export interface ReporteVacunaAplicada {
  vacunaId: string;
  vacunaNombre: string;
  laboratorio?: string | null;
  especieObjetivo?: string | null;
  aplicaciones: number;
  mascotasVacunadas: number;
  valorEstimado: number;
  primeraAplicacion?: string | null;
  ultimaAplicacion?: string | null;
}

export interface ReporteTratamientoActivo {
  id: string;
  idDiagnostico: string;
  tipo: string;
  fechaInicio: string;
  fechaFinEstimada?: string | null;
  indicaciones?: string | null;
  estado: string;

  descripcionCondicion: string;
  nivelGravedad?: string | null;
  tipoAfeccion?: string | null;

  mascotaId: string;
  mascotaNombre: string;
  mascotaEspecie: string;

  clienteId: string;
  clienteNombre: string;
  clienteTelefono?: string | null;

  veterinarioId: string;
  veterinarioNombre: string;

  servicioNombre?: string | null;
  medicamentosCount: number;
}

export interface ReporteTopServicio {
  servicioId: string;
  servicioNombre: string;
  tipoServicio: string;
  precio: number;
  vecesUsado: number;
  ingresosPagados: number;
  ultimaAtencion?: string | null;
}

export interface ReporteResumenCliente {
  clienteId: string;
  clienteNombre: string;
  telefono?: string | null;
  email?: string | null;
  estado: string;
  totalMascotas: number;
  totalFacturas: number;
  facturasPagadas: number;
  facturasPendientes: number;
  facturasAnuladas: number;
  ingresoTotal: number;
  ingresoPendiente: number;
  ultimaFactura?: string | null;
}

export function getReporteIngresosMensuales(anio: number, mes?: number) {
  const params = new URLSearchParams();
  params.set("anio", String(anio));

  if (mes && mes >= 1 && mes <= 12) {
    params.set("mes", String(mes));
  }

  return request<ReporteIngresoMensual[]>(
    `/reportes/ingresos-mensuales?${params.toString()}`
  );
}

export function getReporteMascotasMasAtendidas(top = 5) {
  return request<ReporteMascotaMasAtendida[]>(
    `/reportes/mascotas-mas-atendidas?top=${top}`
  );
}

export function getReporteVacunasAplicadas(anio: number, mes?: number) {
  const params = new URLSearchParams();
  params.set("anio", String(anio));

  if (mes && mes >= 1 && mes <= 12) {
    params.set("mes", String(mes));
  }

  return request<ReporteVacunaAplicada[]>(
    `/reportes/vacunas-aplicadas?${params.toString()}`
  );
}

export function getReporteTratamientosActivos() {
  return request<ReporteTratamientoActivo[]>(
    "/reportes/tratamientos-activos"
  );
}

export function getReporteTopServicios(top = 5) {
  return request<ReporteTopServicio[]>(`/reportes/top-servicios?top=${top}`);
}

export function getReporteResumenClientes() {
  return request<ReporteResumenCliente[]>("/reportes/resumen-clientes");
}

/* ============================================================
   COMPATIBILIDAD CON PANTALLAS EXISTENTES
============================================================ */

export type EstadoDiagnostico = "PRESUNTIVO" | "CONFIRMADO" | "DESCARTADO";

export type EstadoTratamiento =
  | "ACTIVO"
  | "FINALIZADO"
  | "SUSPENDIDO"
  | "CANCELADO";

export type TipoTratamiento =
  | "MEDICACION"
  | "OBSERVACION"
  | "TERAPIA"
  | "PROCEDIMIENTO_AMBULATORIO"
  | "PLAN_VACUNACION";

export type CatalogoConsultaCita = Cita;

export type CatalogosConsultas = ConsultasCatalogos;

export type CatalogosTratamientos = TratamientosCatalogos;

export const getCatalogosConsultas = getConsultasCatalogos;

export const getCatalogosTratamientos = getTratamientosCatalogos;

export type CatalogosCitas = CitasCatalogos;

export const getCatalogosCitas = getCitasCatalogos;

export type DashboardCitaHoy = Cita;

export type EstadoLaboralEmpleado = EstadoLaboral;

export const getTratamientoMedicamentos = getMedicamentosTratamiento;

export const addTratamientoMedicamento = addMedicamentoTratamiento;