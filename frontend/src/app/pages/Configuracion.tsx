import React, { useEffect, useState } from "react";
import { Edit2, Plus, Trash2, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";

const API_URL = "http://localhost:3000/api";

interface Servicio {
  id: string;
  nombre: string;
  precio: number | string;
}

interface ServicioInput {
  id?: string;
  nombre: string;
  precio: number | string;
}

const servicioInicial: ServicioInput = {
  id: "",
  nombre: "",
  precio: "",
};

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
      errorData?.message || errorData?.error || `Error HTTP ${response.status}`,
    );
  }

  return response.json();
}

function getServicios() {
  return request<Servicio[]>("/servicios");
}

function createServicio(servicio: ServicioInput) {
  return request<{ message: string }>("/servicios", {
    method: "POST",
    body: JSON.stringify(servicio),
  });
}

function updateServicio(id: string, servicio: ServicioInput) {
  return request<{ message: string }>(`/servicios/${id}`, {
    method: "PUT",
    body: JSON.stringify(servicio),
  });
}

function deleteServicio(id: string) {
  return request<{ message: string }>(`/servicios/${id}`, {
    method: "DELETE",
  });
}

function formatearDinero(valor: number | string | null | undefined) {
  return `$${Number(valor || 0).toLocaleString("es-CO")}`;
}

function getBadgeClassName(valor: string) {
  switch (valor) {
    case "PROGRAMADA":
      return "bg-blue-100 text-blue-700 border-blue-300";
    case "CONFIRMADA":
    case "PAGADA":
      return "bg-emerald-100 text-emerald-700 border-emerald-300";
    case "ATENDIDA":
      return "bg-gray-100 text-gray-700 border-gray-300";
    case "CANCELADA":
    case "ANULADA":
      return "bg-red-100 text-red-700 border-red-300";
    case "REPROGRAMADA":
    case "PENDIENTE":
      return "bg-amber-100 text-amber-700 border-amber-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
}

function Badge({ children }: { children: React.ReactNode }) {
  const texto = String(children || "");

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${getBadgeClassName(
        texto,
      )}`}
    >
      {children}
    </span>
  );
}

export function Configuracion() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [formServicio, setFormServicio] =
    useState<ServicioInput>(servicioInicial);
  const [editandoServicio, setEditandoServicio] = useState<Servicio | null>(
    null,
  );
  const [modalServicioAbierto, setModalServicioAbierto] = useState(false);

  const [perfil, setPerfil] = useState({
    nombre: "Admin VetCare",
    email: "admin@vetcare.com",
    telefono: "+56 9 1234 5678",
    rol: "Administrador",
  });

  const [parametros, setParametros] = useState({
    nombreVeterinaria: "VetCare Admin",
    direccion: "Av. Principal 123, Santiago",
    telefonoContacto: "+56 2 1234 5678",
    emailContacto: "info@vetcare.com",
    horario: "Lunes a Viernes 9:00 - 19:00",
    moneda: "COP - Peso Colombiano",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const cargarServicios = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getServicios();
      setServicios(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando servicios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarServicios();
  }, []);

  const abrirNuevoServicio = () => {
    setEditandoServicio(null);
    setFormServicio(servicioInicial);
    setModalServicioAbierto(true);
    setError("");
  };

  const abrirEditarServicio = (servicio: Servicio) => {
    setEditandoServicio(servicio);
    setFormServicio({
      id: servicio.id,
      nombre: servicio.nombre || "",
      precio: servicio.precio ?? "",
    });
    setModalServicioAbierto(true);
    setError("");
  };

  const cerrarModalServicio = () => {
    setModalServicioAbierto(false);
    setEditandoServicio(null);
    setFormServicio(servicioInicial);
  };

  const guardarServicio = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formServicio.nombre.trim()) {
      setError("El nombre del servicio es obligatorio.");
      return;
    }

    if (!editandoServicio && !formServicio.id?.trim()) {
      setError("El ID del servicio es obligatorio.");
      return;
    }

    if (Number(formServicio.precio || 0) < 0) {
      setError("El precio no puede ser negativo.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload: ServicioInput = {
        id: editandoServicio ? editandoServicio.id : formServicio.id?.trim(),
        nombre: formServicio.nombre.trim(),
        precio: Number(formServicio.precio || 0),
      };

      if (editandoServicio) {
        await updateServicio(editandoServicio.id, payload);
      } else {
        await createServicio(payload);
      }

      await cargarServicios();
      cerrarModalServicio();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error guardando servicio");
    } finally {
      setSaving(false);
    }
  };

  const eliminarServicio = async (servicio: Servicio) => {
    const confirmado = window.confirm(
      `¿Seguro que deseas eliminar el servicio "${servicio.nombre}"?`,
    );

    if (!confirmado) return;

    try {
      setError("");
      await deleteServicio(servicio.id);
      await cargarServicios();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error eliminando servicio",
      );
    }
  };

  const actualizarPerfil = () => {
    window.alert("Perfil actualizado localmente.");
  };

  const guardarConfiguracion = () => {
    window.alert("Configuración guardada localmente.");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 mt-1">
          Administra los parámetros del sistema
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Perfil de usuario */}
      <Card>
        <CardHeader>
          <CardTitle>Perfil de usuario</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo
              </label>
              <input
                type="text"
                value={perfil.nombre}
                onChange={(event) =>
                  setPerfil((prev) => ({ ...prev, nombre: event.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={perfil.email}
                onChange={(event) =>
                  setPerfil((prev) => ({ ...prev, email: event.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={perfil.telefono}
                onChange={(event) =>
                  setPerfil((prev) => ({
                    ...prev,
                    telefono: event.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol
              </label>
              <input
                type="text"
                value={perfil.rol}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={actualizarPerfil}>Actualizar perfil</Button>
          </div>
        </CardContent>
      </Card>

      {/* Catálogo de Servicios */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Catálogo de servicios</CardTitle>

            <Button size="sm" onClick={abrirNuevoServicio}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo servicio
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre del servicio
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      Cargando servicios...
                    </td>
                  </tr>
                ) : servicios.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      No hay servicios registrados.
                    </td>
                  </tr>
                ) : (
                  servicios.map((servicio, index) => (
                    <tr key={servicio.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{index + 1}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {servicio.nombre}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatearDinero(servicio.precio)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => abrirEditarServicio(servicio)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="Editar servicio"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => eliminarServicio(servicio)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Eliminar servicio"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Estados del sistema */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Estados de citas</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <Badge>PROGRAMADA</Badge>
                <span className="text-sm text-gray-600">
                  Cita programada sin confirmar
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <Badge>CONFIRMADA</Badge>
                <span className="text-sm text-gray-600">
                  Cita confirmada por el cliente
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <Badge>ATENDIDA</Badge>
                <span className="text-sm text-gray-600">Cita completada</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <Badge>CANCELADA</Badge>
                <span className="text-sm text-gray-600">Cita cancelada</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <Badge>REPROGRAMADA</Badge>
                <span className="text-sm text-gray-600">Cita reprogramada</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estados de pago</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <Badge>PENDIENTE</Badge>
                <span className="text-sm text-gray-600">Pago pendiente</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <Badge>PAGADA</Badge>
                <span className="text-sm text-gray-600">Factura pagada</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <Badge>ANULADA</Badge>
                <span className="text-sm text-gray-600">Factura anulada</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Parámetros generales */}
      <Card>
        <CardHeader>
          <CardTitle>Parámetros generales</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la veterinaria
              </label>
              <input
                type="text"
                value={parametros.nombreVeterinaria}
                onChange={(event) =>
                  setParametros((prev) => ({
                    ...prev,
                    nombreVeterinaria: event.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <input
                type="text"
                value={parametros.direccion}
                onChange={(event) =>
                  setParametros((prev) => ({
                    ...prev,
                    direccion: event.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono de contacto
              </label>
              <input
                type="tel"
                value={parametros.telefonoContacto}
                onChange={(event) =>
                  setParametros((prev) => ({
                    ...prev,
                    telefonoContacto: event.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email de contacto
              </label>
              <input
                type="email"
                value={parametros.emailContacto}
                onChange={(event) =>
                  setParametros((prev) => ({
                    ...prev,
                    emailContacto: event.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Horario de atención
              </label>
              <input
                type="text"
                value={parametros.horario}
                onChange={(event) =>
                  setParametros((prev) => ({
                    ...prev,
                    horario: event.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Moneda
              </label>
              <select
                value={parametros.moneda}
                onChange={(event) =>
                  setParametros((prev) => ({
                    ...prev,
                    moneda: event.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option>COP - Peso Colombiano</option>
                <option>USD - Dólar</option>
                <option>EUR - Euro</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={guardarConfiguracion}>
              Guardar configuración
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal servicio */}
      {modalServicioAbierto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-xl rounded-lg bg-white shadow-xl">
            <form onSubmit={guardarServicio}>
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {editandoServicio ? "Editar servicio" : "Nuevo servicio"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Completa la información del servicio
                  </p>
                </div>

                <button
                  type="button"
                  onClick={cerrarModalServicio}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 py-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID
                  </label>

                  <input
                    type="text"
                    value={formServicio.id || ""}
                    disabled={Boolean(editandoServicio)}
                    onChange={(event) =>
                      setFormServicio((prev) => ({
                        ...prev,
                        id: event.target.value,
                      }))
                    }
                    placeholder="SER001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={formServicio.precio}
                    onChange={(event) =>
                      setFormServicio((prev) => ({
                        ...prev,
                        precio: event.target.value,
                      }))
                    }
                    placeholder="25000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del servicio
                  </label>

                  <input
                    type="text"
                    value={formServicio.nombre}
                    onChange={(event) =>
                      setFormServicio((prev) => ({
                        ...prev,
                        nombre: event.target.value,
                      }))
                    }
                    placeholder="Consulta General"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={cerrarModalServicio}
                >
                  Cancelar
                </Button>

                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar servicio"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
