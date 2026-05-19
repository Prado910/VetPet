const API_URL = "http://localhost:3000/api";

export type EstadoCliente = "ACTIVO" | "INACTIVO" | "SUSPENDIDO";

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
  sexo?: "M" | "H" | "" | null;
  peso?: number | string | null;
  especie: string;
  raza?: string | null;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.message ||
        errorData?.error ||
        `Error HTTP ${response.status}`
    );
  }

  return response.json();
}

// Clientes
export function getClientes() {
  return request<Cliente[]>("/clientes");
}

export function createCliente(cliente: ClienteInput) {
  return request<{ message: string }>("/clientes", {
    method: "POST",
    body: JSON.stringify(cliente),
  });
}

export function updateCliente(id: string, cliente: ClienteInput) {
  return request<{ message: string }>(`/clientes/${id}`, {
    method: "PUT",
    body: JSON.stringify(cliente),
  });
}

export function deleteCliente(id: string) {
  return request<{ message: string }>(`/clientes/${id}`, {
    method: "DELETE",
  });
}

// Mascotas
export function getMascotas() {
  return request<Mascota[]>("/mascotas");
}

export function createMascota(mascota: MascotaInput) {
  return request<{ message: string }>("/mascotas", {
    method: "POST",
    body: JSON.stringify(mascota),
  });
}

export function updateMascota(id: string, mascota: MascotaInput) {
  return request<{ message: string }>(`/mascotas/${id}`, {
    method: "PUT",
    body: JSON.stringify(mascota),
  });
}

export function deleteMascota(id: string) {
  return request<{ message: string }>(`/mascotas/${id}`, {
    method: "DELETE",
  });
}

export type EstadoCita =
  | "PROGRAMADA"
  | "CONFIRMADA"
  | "ATENDIDA"
  | "CANCELADA"
  | "REPROGRAMADA";

export interface Cita {
  id: string;
  mascotaId: string;
  mascotaNombre: string;
  mascotaEspecie?: string | null;
  clienteId: string;
  clienteNombre: string;
  clienteTelefono?: string | null;
  veterinarioId: string;
  veterinarioNombre: string;
  recepcionistaId: string;
  recepcionistaNombre: string;
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

export interface CatalogoMascotaCita {
  id: string;
  nombre: string;
  especie?: string | null;
  clienteNombre?: string | null;
}

export interface CatalogoVeterinarioCita {
  id: string;
  nombre: string;
  especialidad?: string | null;
}

export interface CatalogoRecepcionistaCita {
  id: string;
  nombre: string;
  turno?: string | null;
}

export interface CatalogosCitas {
  mascotas: CatalogoMascotaCita[];
  veterinarios: CatalogoVeterinarioCita[];
  recepcionistas: CatalogoRecepcionistaCita[];
}

export function getCitas() {
  return request<Cita[]>("/citas");
}

export function getCatalogosCitas() {
  return request<CatalogosCitas>("/citas/catalogos");
}

export function createCita(cita: CitaInput) {
  return request<{ message: string }>("/citas", {
    method: "POST",
    body: JSON.stringify(cita),
  });
}

export function updateCita(id: string, cita: CitaInput) {
  return request<{ message: string }>(`/citas/${id}`, {
    method: "PUT",
    body: JSON.stringify(cita),
  });
}

export function deleteCita(id: string) {
  return request<{ message: string }>(`/citas/${id}`, {
    method: "DELETE",
  });
}



export type TipoEmpleado = "VETERINARIO" | "RECEPCIONISTA";
export type EstadoLaboralEmpleado = "ACTIVO" | "INACTIVO" | "SUSPENDIDO";
export type TurnoRecepcionista = "DIURNO" | "NOCTURNO";

export interface Empleado {
  id: string;
  nombre: string;
  telefono?: string | null;
  fechaIngreso: string;
  estadoLaboral: EstadoLaboralEmpleado;
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
  estadoLaboral: EstadoLaboralEmpleado;
  tipoEmpleado: TipoEmpleado;
  salario: number | string;
  especialidad?: string | null;
  nroMatricula?: string | null;
  turno?: TurnoRecepcionista | "" | null;
}

export interface VeterinarioCatalogo {
  id: string;
  nombre: string;
  telefono?: string | null;
  fechaIngreso?: string | null;
  estadoLaboral?: EstadoLaboralEmpleado;
  salario?: number | null;
  especialidad?: string | null;
  nroMatricula?: string | null;
}

export interface RecepcionistaCatalogo {
  id: string;
  nombre: string;
  telefono?: string | null;
  fechaIngreso?: string | null;
  estadoLaboral?: EstadoLaboralEmpleado;
  salario?: number | null;
  turno?: TurnoRecepcionista | null;
}

// Empleados
export function getEmpleados() {
  return request<Empleado[]>("/empleados");
}

export function getVeterinarios() {
  return request<VeterinarioCatalogo[]>("/empleados/veterinarios");
}

export function getRecepcionistas() {
  return request<RecepcionistaCatalogo[]>("/empleados/recepcionistas");
}

export function createEmpleado(empleado: EmpleadoInput) {
  return request<{ message: string }>("/empleados", {
    method: "POST",
    body: JSON.stringify(empleado),
  });
}

export function updateEmpleado(id: string, empleado: EmpleadoInput) {
  return request<{ message: string }>(`/empleados/${id}`, {
    method: "PUT",
    body: JSON.stringify(empleado),
  });
}

export function deleteEmpleado(id: string) {
  return request<{ message: string }>(`/empleados/${id}`, {
    method: "DELETE",
  });
}

export type TipoServicio =
  | "CONSULTA"
  | "PROCEDIMIENTO"
  | "TERAPIA"
  | "VACUNACION"
  | "PLAN_VACUNACION"
  | "OTRO";

export type ActivoServicio = "S" | "N";

export interface Servicio {
  id: string;
  nombre: string;
  tipoServicio: TipoServicio;
  precio: number;
  descripcion?: string | null;
  activo: ActivoServicio;
}

export interface ServicioInput {
  id?: string;
  nombre: string;
  tipoServicio: TipoServicio;
  precio: number | string;
  descripcion?: string | null;
  activo: ActivoServicio;
}

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

// Servicios
export function getServicios(soloActivos = false) {
  return request<Servicio[]>(
    soloActivos ? "/servicios?activos=true" : "/servicios"
  );
}

export function createServicio(servicio: ServicioInput) {
  return request<{ message: string }>("/servicios", {
    method: "POST",
    body: JSON.stringify(servicio),
  });
}

export function updateServicio(id: string, servicio: ServicioInput) {
  return request<{ message: string }>(`/servicios/${id}`, {
    method: "PUT",
    body: JSON.stringify(servicio),
  });
}

export function deleteServicio(id: string) {
  return request<{ message: string }>(`/servicios/${id}`, {
    method: "DELETE",
  });
}

// Medicamentos
export function getMedicamentos() {
  return request<Medicamento[]>("/medicamentos");
}

export function createMedicamento(medicamento: MedicamentoInput) {
  return request<{ message: string }>("/medicamentos", {
    method: "POST",
    body: JSON.stringify(medicamento),
  });
}

export function updateMedicamento(id: string, medicamento: MedicamentoInput) {
  return request<{ message: string }>(`/medicamentos/${id}`, {
    method: "PUT",
    body: JSON.stringify(medicamento),
  });
}

export function deleteMedicamento(id: string) {
  return request<{ message: string }>(`/medicamentos/${id}`, {
    method: "DELETE",
  });
}

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

export interface MascotaCatalogoVacuna {
  id: string;
  nombre: string;
  especie: string;
  clienteId: string;
  clienteNombre: string;
}

export interface AplicacionVacuna {
  id: string;
  codigoMascota: string;
  idVacuna: string;
  fechaAplicacion: string;
  observacion?: string | null;
  mascotaNombre: string;
  mascotaEspecie: string;
  clienteId: string;
  clienteNombre: string;
  vacunaNombre: string;
  laboratorio?: string | null;
  lote?: string | null;
  especieObjetivo?: string | null;
  precio: number;
}

export interface AplicacionVacunaInput {
  codigoMascota: string;
  idVacuna: string;
  fechaAplicacion: string;
  observacion?: string | null;
}

export interface VacunasCatalogos {
  mascotas: MascotaCatalogoVacuna[];
  vacunas: Vacuna[];
}

// Vacunas
export function getVacunas() {
  return request<Vacuna[]>("/vacunas");
}

export function createVacuna(vacuna: VacunaInput) {
  return request<{ message: string }>("/vacunas", {
    method: "POST",
    body: JSON.stringify(vacuna),
  });
}

export function updateVacuna(id: string, vacuna: VacunaInput) {
  return request<{ message: string }>(`/vacunas/${id}`, {
    method: "PUT",
    body: JSON.stringify(vacuna),
  });
}

export function deleteVacuna(id: string) {
  return request<{ message: string }>(`/vacunas/${id}`, {
    method: "DELETE",
  });
}

export function getVacunasCatalogos() {
  return request<VacunasCatalogos>("/vacunas/catalogos");
}

// Aplicaciones de vacunas
export function getAplicacionesVacunas() {
  return request<AplicacionVacuna[]>("/vacunas/aplicaciones");
}

export function createAplicacionVacuna(aplicacion: AplicacionVacunaInput) {
  return request<{ message: string }>("/vacunas/aplicaciones", {
    method: "POST",
    body: JSON.stringify(aplicacion),
  });
}

export function updateAplicacionVacuna(aplicacion: AplicacionVacunaInput) {
  return request<{ message: string }>("/vacunas/aplicaciones", {
    method: "PUT",
    body: JSON.stringify(aplicacion),
  });
}

export function deleteAplicacionVacuna(aplicacion: AplicacionVacunaInput) {
  const params = new URLSearchParams({
    codigoMascota: aplicacion.codigoMascota,
    idVacuna: aplicacion.idVacuna,
    fechaAplicacion: aplicacion.fechaAplicacion,
  });

  return request<{ message: string }>(`/vacunas/aplicaciones?${params}`, {
    method: "DELETE",
  });
}