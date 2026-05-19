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