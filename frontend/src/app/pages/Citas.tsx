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
  Plus,
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  Clock,
  Edit2,
  Trash2,
  X,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  CatalogosCitas,
  Cita,
  CitaInput,
  EstadoCita,
  createCita,
  deleteCita,
  getCatalogosCitas,
  getCitas,
  updateCita,
} from "../services/api";

type BadgeVariant = "success" | "warning" | "danger" | "default" | "info";

const estadosCita: EstadoCita[] = [
  "PROGRAMADA",
  "CONFIRMADA",
  "ATENDIDA",
  "CANCELADA",
  "REPROGRAMADA",
];

function obtenerFechaLocal() {
  const fecha = new Date();
  const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

const estadoInicial: CitaInput = {
  id: "",
  mascotaId: "",
  veterinarioId: "",
  recepcionistaId: "",
  fecha: obtenerFechaLocal(),
  hora: "09:00",
  motivo: "",
  estado: "PROGRAMADA",
};

export function Citas() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [catalogos, setCatalogos] = useState<CatalogosCitas>({
    mascotas: [],
    veterinarios: [],
    recepcionistas: [],
  });

  const [selectedCitaId, setSelectedCitaId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CitaInput>(estadoInicial);
  const [showForm, setShowForm] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<"TODOS" | EstadoCita>(
    "TODOS",
  );
  const [fechaFiltro, setFechaFiltro] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const hoy = obtenerFechaLocal();

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError("");

      const [citasData, catalogosData] = await Promise.all([
        getCitas(),
        getCatalogosCitas(),
      ]);

      setCitas(citasData);
      setCatalogos(catalogosData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudieron cargar las citas.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const citasFiltradas = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return citas.filter((cita) => {
      const matchesSearch =
        cita.id.toLowerCase().includes(search) ||
        cita.mascotaNombre.toLowerCase().includes(search) ||
        cita.clienteNombre.toLowerCase().includes(search) ||
        cita.veterinarioNombre.toLowerCase().includes(search) ||
        (cita.motivo || "").toLowerCase().includes(search);

      const matchesEstado =
        filterEstado === "TODOS" || cita.estado === filterEstado;

      const matchesFecha = !fechaFiltro || cita.fecha === fechaFiltro;

      return matchesSearch && matchesEstado && matchesFecha;
    });
  }, [citas, searchTerm, filterEstado, fechaFiltro]);

  const selectedCita = selectedCitaId
    ? citas.find((cita) => cita.id === selectedCitaId)
    : null;

  const getBadgeVariant = (estado: EstadoCita): BadgeVariant => {
    switch (estado) {
      case "CONFIRMADA":
        return "success";
      case "PROGRAMADA":
        return "info";
      case "ATENDIDA":
        return "default";
      case "CANCELADA":
        return "danger";
      case "REPROGRAMADA":
        return "warning";
      default:
        return "default";
    }
  };

  const limpiarFormulario = () => {
    setForm({
      ...estadoInicial,
      fecha: obtenerFechaLocal(),
    });
    setEditingId(null);
    setShowForm(false);
  };

  const iniciarCreacion = () => {
    setForm({
      ...estadoInicial,
      fecha: obtenerFechaLocal(),
    });
    setEditingId(null);
    setShowForm(true);
  };

  const iniciarEdicion = (cita: Cita) => {
    setForm({
      id: cita.id,
      mascotaId: cita.mascotaId,
      veterinarioId: cita.veterinarioId,
      recepcionistaId: cita.recepcionistaId,
      fecha: cita.fecha,
      hora: cita.hora,
      motivo: cita.motivo || "",
      estado: cita.estado,
    });

    setEditingId(cita.id);
    setSelectedCitaId(cita.id);
    setShowForm(true);
  };

  const guardarCita = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (editingId) {
        await updateCita(editingId, form);
      } else {
        await createCita(form);
      }

      await cargarDatos();
      limpiarFormulario();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo guardar la cita.",
      );
    } finally {
      setSaving(false);
    }
  };

  const eliminarCita = async (cita: Cita) => {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar la cita ${cita.id}?`,
    );

    if (!confirmar) return;

    try {
      setError("");
      await deleteCita(cita.id);

      if (selectedCitaId === cita.id) {
        setSelectedCitaId(null);
      }

      await cargarDatos();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo eliminar la cita.",
      );
    }
  };

  const totalProgramadas = citas.filter(
    (cita) => cita.estado === "PROGRAMADA",
  ).length;

  const totalConfirmadas = citas.filter(
    (cita) => cita.estado === "CONFIRMADA",
  ).length;

  const totalAtendidas = citas.filter(
    (cita) => cita.estado === "ATENDIDA",
  ).length;

  const totalCanceladas = citas.filter(
    (cita) => cita.estado === "CANCELADA",
  ).length;

  const totalHoy = citas.filter((cita) => cita.fecha === hoy).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Citas</h1>
          <p className="text-gray-500 mt-1">
            Gestiona las citas veterinarias conectadas a la API
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={cargarDatos} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>

          <Button onClick={iniciarCreacion}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva cita
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Hoy</p>
                <p className="text-xl font-bold text-gray-900">{totalHoy}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Programadas</p>
                <p className="text-xl font-bold text-gray-900">
                  {totalProgramadas}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Confirmadas</p>
                <p className="text-xl font-bold text-gray-900">
                  {totalConfirmadas}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Atendidas</p>
                <p className="text-xl font-bold text-gray-900">
                  {totalAtendidas}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Canceladas</p>
                <p className="text-xl font-bold text-gray-900">
                  {totalCanceladas}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{editingId ? "Editar cita" : "Nueva cita"}</CardTitle>
            <button
              type="button"
              onClick={limpiarFormulario}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={guardarCita}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label className="text-sm font-medium text-gray-700">
                  ID cita
                </label>
                <Input
                  value={form.id || ""}
                  onChange={(event) =>
                    setForm({ ...form, id: event.target.value })
                  }
                  placeholder="Ej: CITA004"
                  disabled={!!editingId}
                  required={!editingId}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Mascota
                </label>
                <select
                  value={form.mascotaId}
                  onChange={(event) =>
                    setForm({ ...form, mascotaId: event.target.value })
                  }
                  className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">Selecciona una mascota</option>
                  {catalogos.mascotas.map((mascota) => (
                    <option key={mascota.id} value={mascota.id}>
                      {mascota.nombre} — {mascota.clienteNombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Veterinario
                </label>
                <select
                  value={form.veterinarioId}
                  onChange={(event) =>
                    setForm({ ...form, veterinarioId: event.target.value })
                  }
                  className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">Selecciona un veterinario</option>
                  {catalogos.veterinarios.map((veterinario) => (
                    <option key={veterinario.id} value={veterinario.id}>
                      {veterinario.nombre}
                      {veterinario.especialidad
                        ? ` — ${veterinario.especialidad}`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Recepcionista
                </label>
                <select
                  value={form.recepcionistaId}
                  onChange={(event) =>
                    setForm({ ...form, recepcionistaId: event.target.value })
                  }
                  className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">Selecciona un recepcionista</option>
                  {catalogos.recepcionistas.map((recepcionista) => (
                    <option key={recepcionista.id} value={recepcionista.id}>
                      {recepcionista.nombre}
                      {recepcionista.turno ? ` — ${recepcionista.turno}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Fecha
                </label>
                <Input
                  type="date"
                  value={form.fecha}
                  onChange={(event) =>
                    setForm({ ...form, fecha: event.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Hora
                </label>
                <Input
                  type="time"
                  value={form.hora}
                  onChange={(event) =>
                    setForm({ ...form, hora: event.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Estado
                </label>
                <select
                  value={form.estado}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      estado: event.target.value as EstadoCita,
                    })
                  }
                  className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  {estadosCita.map((estado) => (
                    <option key={estado} value={estado}>
                      {estado}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  Motivo
                </label>
                <textarea
                  value={form.motivo || ""}
                  onChange={(event) =>
                    setForm({ ...form, motivo: event.target.value })
                  }
                  placeholder="Motivo de la consulta"
                  className="w-full min-h-24 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={limpiarFormulario}
                  disabled={saving}
                >
                  Cancelar
                </Button>

                <Button type="submit" disabled={saving}>
                  {saving
                    ? "Guardando..."
                    : editingId
                      ? "Guardar cambios"
                      : "Crear cita"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por ID, mascota, cliente, veterinario o motivo..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <input
              type="date"
              value={fechaFiltro}
              onChange={(event) => setFechaFiltro(event.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <div className="flex flex-wrap gap-2">
              {(["TODOS", ...estadosCita] as const).map((estado) => (
                <button
                  key={estado}
                  onClick={() => setFilterEstado(estado)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterEstado === estado
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {estado}
                </button>
              ))}

              {fechaFiltro && (
                <button
                  onClick={() => setFechaFiltro("")}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
                >
                  Limpiar fecha
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedCita && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Detalle de la cita</CardTitle>
              <p className="text-sm text-gray-500 mt-1">{selectedCita.id}</p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedCitaId(null)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Mascota</p>
                <p className="font-medium text-gray-900">
                  {selectedCita.mascotaNombre}
                </p>
                <p className="text-gray-500">
                  {selectedCita.mascotaEspecie || "Sin especie"}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Cliente</p>
                <p className="font-medium text-gray-900">
                  {selectedCita.clienteNombre}
                </p>
                <p className="text-gray-500">
                  {selectedCita.clienteTelefono || "Sin teléfono"}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Veterinario</p>
                <p className="font-medium text-gray-900">
                  {selectedCita.veterinarioNombre}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Recepcionista</p>
                <p className="font-medium text-gray-900">
                  {selectedCita.recepcionistaNombre}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Fecha y hora</p>
                <p className="font-medium text-gray-900">
                  {selectedCita.fecha} — {selectedCita.hora}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Estado</p>
                <Badge variant={getBadgeVariant(selectedCita.estado)}>
                  {selectedCita.estado}
                </Badge>
              </div>

              <div className="md:col-span-3">
                <p className="text-gray-500">Motivo</p>
                <p className="font-medium text-gray-900">
                  {selectedCita.motivo || "Sin motivo registrado"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            Citas registradas{" "}
            <span className="text-sm font-normal text-gray-500">
              ({citasFiltradas.length})
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-gray-500">
              Cargando citas...
            </div>
          ) : citasFiltradas.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              No hay citas para mostrar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Mascota</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Veterinario</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {citasFiltradas.map((cita) => (
                  <TableRow
                    key={cita.id}
                    onClick={() => setSelectedCitaId(cita.id)}
                    className="cursor-pointer hover:bg-emerald-50/50"
                  >
                    <TableCell className="font-medium">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {cita.id}
                      </code>
                    </TableCell>

                    <TableCell>{cita.fecha}</TableCell>

                    <TableCell className="font-medium text-emerald-700">
                      {cita.hora}
                    </TableCell>

                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">
                          {cita.mascotaNombre}
                        </p>
                        <p className="text-xs text-gray-500">
                          {cita.mascotaEspecie}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>{cita.clienteNombre}</TableCell>

                    <TableCell className="text-gray-600">
                      {cita.veterinarioNombre}
                    </TableCell>

                    <TableCell className="text-gray-600 max-w-xs truncate">
                      {cita.motivo || "Sin motivo"}
                    </TableCell>

                    <TableCell>
                      <Badge variant={getBadgeVariant(cita.estado)}>
                        {cita.estado}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            iniciarEdicion(cita);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            eliminarCita(cita);
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
    </div>
  );
}
