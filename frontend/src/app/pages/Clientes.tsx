import React, { useEffect, useMemo, useState } from "react";
import {
  Edit2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import type {
  Cliente,
  ClienteInput,
  EstadoCliente,
  Mascota,
} from "../services/api";
import {
  createCliente,
  deleteCliente,
  getClientes,
  getMascotas,
  updateCliente,
} from "../services/api";

type FiltroEstado = "TODOS" | EstadoCliente;

const estadoInicial: ClienteInput = {
  id: "",
  nombre: "",
  direccion: "",
  email: "",
  telefono: "",
  estado: "ACTIVO",
};

function getEstadoClassName(estado: string) {
  switch (estado) {
    case "ACTIVO":
      return "bg-emerald-100 text-emerald-700 border-emerald-300";
    case "INACTIVO":
      return "bg-amber-100 text-amber-700 border-amber-300";
    case "SUSPENDIDO":
      return "bg-red-100 text-red-700 border-red-300";
    case "Saludable":
    case "SALUDABLE":
      return "bg-blue-100 text-blue-700 border-blue-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
}

function EstadoBadge({
  estado,
  size = "md",
}: {
  estado: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${getEstadoClassName(
        estado,
      )} ${size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"}`}
    >
      {estado}
    </span>
  );
}

function formatearVacio(valor?: string | null) {
  return valor?.trim() ? valor : "Sin registrar";
}

export function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<FiltroEstado>("TODOS");
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [form, setForm] = useState<ClienteInput>(estadoInicial);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const [clientesData, mascotasData] = await Promise.all([
        getClientes(),
        getMascotas(),
      ]);

      setClientes(clientesData);
      setMascotas(mascotasData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const clientesFiltrados = useMemo(() => {
    const busqueda = searchTerm.trim().toLowerCase();

    return clientes.filter((cliente) => {
      const matchesSearch =
        cliente.nombre.toLowerCase().includes(busqueda) ||
        (cliente.email || "").toLowerCase().includes(busqueda) ||
        (cliente.telefono || "").toLowerCase().includes(busqueda);

      const matchesEstado =
        filterEstado === "TODOS" || cliente.estado === filterEstado;

      return matchesSearch && matchesEstado;
    });
  }, [clientes, searchTerm, filterEstado]);

  const selectedCliente = useMemo(
    () =>
      selectedClienteId
        ? clientes.find((cliente) => cliente.id === selectedClienteId) || null
        : null,
    [clientes, selectedClienteId],
  );

  const mascotasCliente = useMemo(() => {
    if (!selectedCliente) return [];

    return mascotas.filter(
      (mascota) => mascota.clienteId === selectedCliente.id,
    );
  }, [mascotas, selectedCliente]);

  const abrirCrear = () => {
    setEditando(null);
    setError("");
    setSuccess("");
    setForm(estadoInicial);
    setModalAbierto(true);
  };

  const abrirEditar = (cliente: Cliente) => {
    setEditando(cliente);
    setError("");
    setSuccess("");
    setForm({
      id: cliente.id,
      nombre: cliente.nombre || "",
      direccion: cliente.direccion || "",
      email: cliente.email || "",
      telefono: cliente.telefono || "",
      estado: cliente.estado,
    });
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setError("");
    setSuccess("");
    setEditando(null);
    setForm(estadoInicial);
  };

  const guardarCliente = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.nombre?.trim()) {
      setError("El nombre del cliente es obligatorio.");
      return;
    }

    if (!editando && !form.id?.trim()) {
      setError("El ID del cliente es obligatorio.");
      return;
    }

    try {
      setGuardando(true);
      setError("");
      setSuccess("");

      const payload: ClienteInput = {
        id: form.id?.trim(),
        nombre: form.nombre.trim(),
        direccion: form.direccion?.trim() || null,
        email: form.email?.trim() || null,
        telefono: form.telefono?.trim() || null,
        estado: form.estado,
      };

      let respuesta;

      if (editando) {
        respuesta = await updateCliente(editando.id, {
          ...payload,
          id: editando.id,
        });
      } else {
        respuesta = await createCliente(payload);
      }

      await cargarDatos();
      cerrarModal();
      setSuccess(respuesta.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error guardando cliente");
    } finally {
      setGuardando(false);
    }
  };

  const eliminarCliente = async (cliente: Cliente) => {
    const confirmado = window.confirm(
      `¿Seguro que deseas eliminar a ${cliente.nombre}?`,
    );

    if (!confirmado) return;

    try {
      setError("");
      setSuccess("");

      const respuesta = await deleteCliente(cliente.id);

      if (selectedClienteId === cliente.id) {
        setSelectedClienteId(null);
      }

      await cargarDatos();
      setSuccess(respuesta.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error eliminando cliente");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 mt-1">
            Gestiona la información de tus clientes
          </p>
        </div>

        <Button onClick={abrirCrear}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo cliente
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto">
              {(["TODOS", "ACTIVO", "INACTIVO", "SUSPENDIDO"] as const).map(
                (estado) => (
                  <button
                    key={estado}
                    type="button"
                    onClick={() => setFilterEstado(estado)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      filterEstado === estado
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {estado}
                  </button>
                ),
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre completo
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
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
                    colSpan={6}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    Cargando clientes...
                  </td>
                </tr>
              ) : clientesFiltrados.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    No hay clientes para mostrar.
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map((cliente) => (
                  <tr
                    key={cliente.id}
                    onClick={() => setSelectedClienteId(cliente.id)}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{cliente.id}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cliente.nombre}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatearVacio(cliente.email)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatearVacio(cliente.telefono)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <EstadoBadge estado={cliente.estado} />
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            abrirEditar(cliente);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Editar cliente"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            eliminarCliente(cliente);
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="Eliminar cliente"
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
      </Card>

      {/* Side Panel */}
      {selectedCliente && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl border-l border-gray-200 overflow-y-auto z-50">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Detalles del cliente
              </h2>

              <button
                type="button"
                onClick={() => setSelectedClienteId(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Client Info */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">
                    {selectedCliente.nombre}
                  </h3>

                  <EstadoBadge estado={selectedCliente.estado} />
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />

                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-sm text-gray-900">
                        {formatearVacio(selectedCliente.email)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />

                    <div>
                      <p className="text-sm text-gray-500">Teléfono</p>
                      <p className="text-sm text-gray-900">
                        {formatearVacio(selectedCliente.telefono)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />

                    <div>
                      <p className="text-sm text-gray-500">Dirección</p>
                      <p className="text-sm text-gray-900">
                        {formatearVacio(selectedCliente.direccion)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mascotas */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Mascotas ({mascotasCliente.length})
                </h3>

                <div className="space-y-2">
                  {mascotasCliente.map((mascota) => (
                    <div key={mascota.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {mascota.nombre}
                          </p>

                          <p className="text-sm text-gray-500">
                            {formatearVacio(mascota.raza)} • {mascota.especie}
                          </p>
                        </div>

                        <EstadoBadge
                          estado={mascota.estadoSalud || "Sin estado"}
                          size="sm"
                        />
                      </div>
                    </div>
                  ))}

                  {mascotasCliente.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No hay mascotas registradas
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => abrirEditar(selectedCliente)}
                >
                  Editar cliente
                </Button>

                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => eliminarCliente(selectedCliente)}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear / Editar */}
      {modalAbierto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
            <form onSubmit={guardarCliente}>
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {editando ? "Editar cliente" : "Nuevo cliente"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Completa la información del cliente
                  </p>
                </div>

                <button
                  type="button"
                  onClick={cerrarModal}
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
                    value={form.id || ""}
                    disabled={Boolean(editando)}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, id: event.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
                    placeholder="CLI001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>

                  <select
                    value={form.estado}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        estado: event.target.value as EstadoCliente,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="INACTIVO">INACTIVO</option>
                    <option value="SUSPENDIDO">SUSPENDIDO</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre completo
                  </label>

                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        nombre: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Juan Pérez"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>

                  <input
                    type="email"
                    value={form.email || ""}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="cliente@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>

                  <input
                    type="text"
                    value={form.telefono || ""}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        telefono: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="+56 9 1234 5678"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>

                  <input
                    type="text"
                    value={form.direccion || ""}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        direccion: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Calle Los Álamos 123, Santiago"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
                <Button type="button" variant="secondary" onClick={cerrarModal}>
                  Cancelar
                </Button>

                <Button type="submit" disabled={guardando}>
                  {guardando ? "Guardando..." : "Guardar cliente"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
