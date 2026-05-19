import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Mail,
  Phone,
  MapPin,
  RefreshCw,
} from "lucide-react";
import {
  Cliente,
  ClienteInput,
  EstadoCliente,
  Mascota,
  createCliente,
  deleteCliente,
  getClientes,
  getMascotas,
  updateCliente,
} from "../services/api";

type BadgeVariant = "success" | "warning" | "danger" | "default";

const estadoInicial: ClienteInput = {
  id: "",
  nombre: "",
  direccion: "",
  email: "",
  telefono: "",
  estado: "ACTIVO",
};

export function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(
    null,
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<"TODOS" | EstadoCliente>(
    "TODOS",
  );
  const [form, setForm] = useState<ClienteInput>(estadoInicial);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const cargarClientes = async () => {
    try {
      setLoading(true);
      setError("");

      const [clientesData, mascotasData] = await Promise.all([
        getClientes(),
        getMascotas(),
      ]);

      setClientes(clientesData);
      setMascotas(mascotasData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los clientes.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  const filteredClientes = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return clientes.filter((cliente) => {
      const matchesSearch =
        cliente.id.toLowerCase().includes(search) ||
        cliente.nombre.toLowerCase().includes(search) ||
        (cliente.email || "").toLowerCase().includes(search) ||
        (cliente.telefono || "").toLowerCase().includes(search);

      const matchesEstado =
        filterEstado === "TODOS" || cliente.estado === filterEstado;

      return matchesSearch && matchesEstado;
    });
  }, [clientes, searchTerm, filterEstado]);

  const clienteSeleccionado = selectedClienteId
    ? clientes.find((cliente) => cliente.id === selectedClienteId)
    : null;

  const mascotasCliente = selectedClienteId
    ? mascotas.filter((mascota) => mascota.clienteId === selectedClienteId)
    : [];

  const getBadgeVariant = (estado: string): BadgeVariant => {
    switch (estado) {
      case "ACTIVO":
        return "success";
      case "INACTIVO":
        return "warning";
      case "SUSPENDIDO":
        return "danger";
      default:
        return "default";
    }
  };

  const abrirNuevo = () => {
    setEditingId(null);
    setForm(estadoInicial);
    setShowForm(true);
    setError("");
  };

  const abrirEdicion = (cliente: Cliente) => {
    setEditingId(cliente.id);
    setForm({
      id: cliente.id,
      nombre: cliente.nombre,
      direccion: cliente.direccion || "",
      email: cliente.email || "",
      telefono: cliente.telefono || "",
      estado: cliente.estado,
    });
    setShowForm(true);
    setError("");
  };

  const cerrarFormulario = () => {
    setEditingId(null);
    setForm(estadoInicial);
    setShowForm(false);
    setError("");
  };

  const handleChange = (field: keyof ClienteInput, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const guardarCliente = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!editingId && !form.id?.trim()) {
      setError("El ID del cliente es obligatorio. Ejemplo: CLI006");
      return;
    }

    if (!form.nombre.trim()) {
      setError("El nombre del cliente es obligatorio.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload: ClienteInput = {
        id: form.id?.trim(),
        nombre: form.nombre.trim(),
        direccion: form.direccion || null,
        email: form.email || null,
        telefono: form.telefono || null,
        estado: form.estado,
      };

      if (editingId) {
        await updateCliente(editingId, payload);
      } else {
        await createCliente(payload);
      }

      await cargarClientes();
      cerrarFormulario();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo guardar el cliente.",
      );
    } finally {
      setSaving(false);
    }
  };

  const eliminarCliente = async (cliente: Cliente) => {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar a ${cliente.nombre}?`,
    );

    if (!confirmar) return;

    try {
      setError("");
      await deleteCliente(cliente.id);
      await cargarClientes();

      if (selectedClienteId === cliente.id) {
        setSelectedClienteId(null);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo eliminar el cliente.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 mt-1">
            Gestiona la información de tus clientes
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={cargarClientes}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>

          <Button onClick={abrirNuevo}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo cliente
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {editingId ? "Editar cliente" : "Nuevo cliente"}
              </CardTitle>
              <button
                type="button"
                onClick={cerrarFormulario}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={guardarCliente}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <Input
                label="ID"
                placeholder="CLI006"
                value={form.id || ""}
                disabled={Boolean(editingId)}
                onChange={(e) => handleChange("id", e.target.value)}
              />

              <Input
                label="Nombre completo"
                placeholder="Nombre del cliente"
                value={form.nombre}
                onChange={(e) => handleChange("nombre", e.target.value)}
              />

              <Input
                label="Correo electrónico"
                type="email"
                placeholder="cliente@mail.com"
                value={form.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
              />

              <Input
                label="Teléfono"
                placeholder="3001234567"
                value={form.telefono || ""}
                onChange={(e) => handleChange("telefono", e.target.value)}
              />

              <Input
                label="Dirección"
                placeholder="Dirección"
                value={form.direccion || ""}
                onChange={(e) => handleChange("direccion", e.target.value)}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={form.estado}
                  onChange={(e) =>
                    handleChange("estado", e.target.value as EstadoCliente)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="INACTIVO">INACTIVO</option>
                  <option value="SUSPENDIDO">SUSPENDIDO</option>
                </select>
              </div>

              <div className="md:col-span-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={cerrarFormulario}
                >
                  Cancelar
                </Button>

                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por ID, nombre, email o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {(["TODOS", "ACTIVO", "INACTIVO", "SUSPENDIDO"] as const).map(
                (estado) => (
                  <button
                    key={estado}
                    type="button"
                    onClick={() => setFilterEstado(estado)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
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

      <Card padding={false}>
        <CardContent>
          {loading ? (
            <div className="p-6 text-center text-gray-500">
              Cargando clientes...
            </div>
          ) : filteredClientes.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No hay clientes para mostrar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredClientes.map((cliente) => (
                  <TableRow
                    key={cliente.id}
                    onClick={() => setSelectedClienteId(cliente.id)}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {cliente.id}
                      </code>
                    </TableCell>

                    <TableCell className="font-medium text-gray-900">
                      {cliente.nombre}
                    </TableCell>

                    <TableCell className="text-gray-600">
                      {cliente.email || "Sin email"}
                    </TableCell>

                    <TableCell className="text-gray-600">
                      {cliente.telefono || "Sin teléfono"}
                    </TableCell>

                    <TableCell className="text-gray-600">
                      {cliente.direccion || "Sin dirección"}
                    </TableCell>

                    <TableCell>
                      <Badge variant={getBadgeVariant(cliente.estado)}>
                        {cliente.estado}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirEdicion(cliente);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            eliminarCliente(cliente);
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedClienteId && clienteSeleccionado && (
        <div className="fixed inset-y-0 right-0 w-[420px] bg-white shadow-2xl border-l border-gray-200 overflow-y-auto z-50">
          <div className="p-7">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-bold text-gray-900">
                Detalles del cliente
              </h2>

              <button
                type="button"
                onClick={() => setSelectedClienteId(null)}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-900"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex items-start justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {clienteSeleccionado.nombre}
              </h3>

              <Badge variant={getBadgeVariant(clienteSeleccionado.estado)}>
                {clienteSeleccionado.estado}
              </Badge>
            </div>

            <div className="space-y-5 mb-8">
              <div className="flex items-start gap-4">
                <Mail className="w-6 h-6 text-gray-400 mt-1" />
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="text-gray-900">
                    {clienteSeleccionado.email || "Sin email"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Phone className="w-6 h-6 text-gray-400 mt-1" />
                <div>
                  <p className="text-gray-500">Teléfono</p>
                  <p className="text-gray-900">
                    {clienteSeleccionado.telefono || "Sin teléfono"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <MapPin className="w-6 h-6 text-gray-400 mt-1" />
                <div>
                  <p className="text-gray-500">Dirección</p>
                  <p className="text-gray-900">
                    {clienteSeleccionado.direccion || "Sin dirección"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Mascotas ({mascotasCliente.length})
              </h3>

              <div className="space-y-4">
                {mascotasCliente.length === 0 ? (
                  <div className="rounded-2xl bg-gray-50 p-4 text-gray-500">
                    Este cliente no tiene mascotas registradas.
                  </div>
                ) : (
                  mascotasCliente.map((mascota) => (
                    <div
                      key={mascota.id}
                      className="rounded-2xl bg-gray-50 p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-lg font-semibold text-gray-900">
                          {mascota.nombre}
                        </p>
                        <p className="text-gray-500">
                          {mascota.raza || "Sin raza"} • {mascota.especie}
                        </p>
                      </div>

                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 border border-blue-200">
                        {mascota.estadoSalud || "Sin estado"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                onClick={() => abrirEdicion(clienteSeleccionado)}
              >
                Editar cliente
              </Button>

              <Button
                variant="danger"
                onClick={() => eliminarCliente(clienteSeleccionado)}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
