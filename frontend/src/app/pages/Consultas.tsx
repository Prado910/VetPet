import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  Edit2,
  Plus,
  RefreshCw,
  Search,
  Stethoscope,
  Trash2,
  X,
} from "lucide-react";
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
  CatalogoConsultaCita,
  CatalogosConsultas,
  Consulta,
  ConsultaInput,
  createConsulta,
  deleteConsulta,
  getCatalogosConsultas,
  getConsultas,
  updateConsulta,
} from "../services/api";

function obtenerFechaLocal() {
  const fecha = new Date();
  const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

const estadoInicial: ConsultaInput = {
  idCita: "",
  idServicio: "",
  temperatura: "",
  pesoConsulta: "",
  observaciones: "",
  recomendaciones: "",
  fechaAtencionReal: obtenerFechaLocal(),
};

export function Consultas() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [catalogos, setCatalogos] = useState<CatalogosConsultas>({
    citasDisponibles: [],
    servicios: [],
  });

  const [form, setForm] = useState<ConsultaInput>(estadoInicial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError("");

      const [consultasData, catalogosData] = await Promise.all([
        getConsultas(),
        getCatalogosConsultas(),
      ]);

      setConsultas(consultasData);
      setCatalogos(catalogosData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error cargando consultas veterinarias",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const consultaEditando = useMemo(() => {
    if (!editingId) return null;
    return consultas.find((consulta) => consulta.id === editingId) || null;
  }, [editingId, consultas]);

  const citasParaSelect = useMemo(() => {
    const citas = [...catalogos.citasDisponibles];

    if (consultaEditando) {
      const yaExiste = citas.some(
        (cita) => cita.id === consultaEditando.idCita,
      );

      if (!yaExiste) {
        const citaActual: CatalogoConsultaCita = {
          id: consultaEditando.idCita,
          fecha: consultaEditando.citaFecha,
          hora: consultaEditando.citaHora,
          motivo: consultaEditando.motivo,
          estado: consultaEditando.citaEstado,
          mascotaId: consultaEditando.mascotaId,
          mascotaNombre: consultaEditando.mascotaNombre,
          mascotaEspecie: consultaEditando.mascotaEspecie,
          clienteId: consultaEditando.clienteId,
          clienteNombre: consultaEditando.clienteNombre,
          clienteTelefono: consultaEditando.clienteTelefono,
          veterinarioId: consultaEditando.veterinarioId,
          veterinarioNombre: consultaEditando.veterinarioNombre,
        };

        citas.unshift(citaActual);
      }
    }

    return citas;
  }, [catalogos.citasDisponibles, consultaEditando]);

  const consultasFiltradas = useMemo(() => {
    const termino = searchTerm.toLowerCase().trim();

    if (!termino) {
      return consultas;
    }

    return consultas.filter((consulta) => {
      return [
        consulta.id,
        consulta.idCita,
        consulta.mascotaNombre,
        consulta.clienteNombre,
        consulta.veterinarioNombre,
        consulta.servicioNombre,
        consulta.observaciones,
        consulta.recomendaciones,
      ]
        .filter(Boolean)
        .some((valor) => String(valor).toLowerCase().includes(termino));
    });
  }, [consultas, searchTerm]);

  const estadisticas = useMemo(() => {
    const hoy = obtenerFechaLocal();

    return {
      total: consultas.length,
      hoy: consultas.filter((consulta) => consulta.fechaAtencionReal === hoy)
        .length,
      conTemperatura: consultas.filter(
        (consulta) =>
          consulta.temperatura !== null && consulta.temperatura !== undefined,
      ).length,
      citasDisponibles: catalogos.citasDisponibles.length,
    };
  }, [consultas, catalogos.citasDisponibles.length]);

  const actualizarCampo = (campo: keyof ConsultaInput, valor: string) => {
    setForm((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  };

  const limpiarFormulario = () => {
    setForm(estadoInicial);
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  const nuevaConsulta = () => {
    setForm(estadoInicial);
    setEditingId(null);
    setShowForm(true);
    setError("");
  };

  const editarConsulta = (consulta: Consulta) => {
    setForm({
      idCita: consulta.idCita,
      idServicio: consulta.idServicio,
      temperatura: consulta.temperatura ?? "",
      pesoConsulta: consulta.pesoConsulta ?? "",
      observaciones: consulta.observaciones ?? "",
      recomendaciones: consulta.recomendaciones ?? "",
      fechaAtencionReal: consulta.fechaAtencionReal,
    });

    setEditingId(consulta.id);
    setShowForm(true);
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const prepararPayload = (): ConsultaInput => ({
    ...form,
    temperatura:
      form.temperatura === "" || form.temperatura === null
        ? null
        : Number(form.temperatura),
    pesoConsulta:
      form.pesoConsulta === "" || form.pesoConsulta === null
        ? null
        : Number(form.pesoConsulta),
    observaciones: form.observaciones?.trim() || null,
    recomendaciones: form.recomendaciones?.trim() || null,
  });

  const guardarConsulta = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.idCita) {
      setError("Selecciona una cita.");
      return;
    }

    if (!form.idServicio) {
      setError("Selecciona un servicio.");
      return;
    }

    if (!form.fechaAtencionReal) {
      setError("Selecciona la fecha de atención real.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = prepararPayload();

      if (editingId) {
        await updateConsulta(editingId, payload);
      } else {
        await createConsulta(payload);
      }

      limpiarFormulario();
      await cargarDatos();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error guardando la consulta",
      );
    } finally {
      setSaving(false);
    }
  };

  const eliminarConsulta = async (consulta: Consulta) => {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar la consulta ${consulta.id} de ${consulta.mascotaNombre}?`,
    );

    if (!confirmar) return;

    try {
      setError("");
      await deleteConsulta(consulta.id);
      await cargarDatos();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error eliminando la consulta",
      );
    }
  };

  const citaSeleccionada = citasParaSelect.find(
    (cita) => cita.id === form.idCita,
  );

  const servicioSeleccionado = catalogos.servicios.find(
    (servicio) => servicio.id === form.idServicio,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Consultas médicas
          </h1>
          <p className="text-gray-500 mt-1">
            Registra las atenciones veterinarias conectadas a citas reales.
          </p>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={cargarDatos}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>

          <Button type="button" onClick={nuevaConsulta}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva consulta
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Consultas</p>
                <p className="text-xl font-bold text-gray-900">
                  {estadisticas.total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Hoy</p>
                <p className="text-xl font-bold text-gray-900">
                  {estadisticas.hoy}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Con temperatura</p>
                <p className="text-xl font-bold text-gray-900">
                  {estadisticas.conTemperatura}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Citas disponibles</p>
                <p className="text-xl font-bold text-gray-900">
                  {estadisticas.citasDisponibles}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {editingId
                  ? "Editar consulta veterinaria"
                  : "Registrar consulta veterinaria"}
              </CardTitle>

              <Button type="button" variant="ghost" onClick={limpiarFormulario}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={guardarConsulta} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cita
                  </label>
                  <select
                    value={form.idCita}
                    onChange={(event) =>
                      actualizarCampo("idCita", event.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="">Seleccionar cita...</option>
                    {citasParaSelect.map((cita) => (
                      <option key={cita.id} value={cita.id}>
                        {cita.id} - {cita.mascotaNombre} / {cita.clienteNombre}{" "}
                        - {cita.fecha} {cita.hora}
                      </option>
                    ))}
                  </select>

                  {citasParaSelect.length === 0 && !editingId && (
                    <p className="text-xs text-orange-600 mt-1">
                      No hay citas disponibles sin consulta.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Servicio
                  </label>
                  <select
                    value={form.idServicio}
                    onChange={(event) =>
                      actualizarCampo("idServicio", event.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="">Seleccionar servicio...</option>
                    {catalogos.servicios.map((servicio) => (
                      <option key={servicio.id} value={servicio.id}>
                        {servicio.nombre} - {servicio.tipoServicio} - $
                        {Number(servicio.precio || 0).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Temperatura °C
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="38.5"
                    value={form.temperatura ?? ""}
                    onChange={(event) =>
                      actualizarCampo("temperatura", event.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Peso en consulta kg
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="12.50"
                    value={form.pesoConsulta ?? ""}
                    onChange={(event) =>
                      actualizarCampo("pesoConsulta", event.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de atención real
                  </label>
                  <Input
                    type="date"
                    value={form.fechaAtencionReal}
                    onChange={(event) =>
                      actualizarCampo("fechaAtencionReal", event.target.value)
                    }
                    required
                  />
                </div>

                <div className="flex items-end">
                  {servicioSeleccionado && (
                    <div className="w-full rounded-lg bg-gray-50 border px-3 py-2">
                      <p className="text-xs text-gray-500">
                        Servicio seleccionado
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {servicioSeleccionado.nombre}
                      </p>
                      <p className="text-xs text-gray-500">
                        $
                        {Number(
                          servicioSeleccionado.precio || 0,
                        ).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  {citaSeleccionada && (
                    <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3">
                      <p className="text-sm font-medium text-emerald-900">
                        {citaSeleccionada.mascotaNombre} ·{" "}
                        {citaSeleccionada.mascotaEspecie}
                      </p>
                      <p className="text-sm text-emerald-700">
                        Cliente: {citaSeleccionada.clienteNombre} | Veterinario:{" "}
                        {citaSeleccionada.veterinarioNombre}
                      </p>
                      <p className="text-sm text-emerald-700">
                        Motivo:{" "}
                        {citaSeleccionada.motivo || "Sin motivo registrado"}
                      </p>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observaciones
                  </label>
                  <textarea
                    value={form.observaciones ?? ""}
                    onChange={(event) =>
                      actualizarCampo("observaciones", event.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    rows={3}
                    placeholder="Describe los hallazgos de la consulta..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recomendaciones
                  </label>
                  <textarea
                    value={form.recomendaciones ?? ""}
                    onChange={(event) =>
                      actualizarCampo("recomendaciones", event.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    rows={3}
                    placeholder="Recomendaciones para el tutor de la mascota..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
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
                      ? "Actualizar consulta"
                      : "Guardar consulta"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Historial de consultas</CardTitle>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar consulta..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-gray-500">
              Cargando consultas...
            </div>
          ) : consultasFiltradas.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No hay consultas registradas.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Consulta</TableHead>
                  <TableHead>Mascota / Cliente</TableHead>
                  <TableHead>Veterinario</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Signos</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {consultasFiltradas.map((consulta) => (
                  <TableRow key={consulta.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">
                          {consulta.id}
                        </p>
                        <p className="text-xs text-gray-500">
                          Cita: {consulta.idCita}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">
                          {consulta.mascotaNombre}
                        </p>
                        <p className="text-xs text-gray-500">
                          {consulta.mascotaEspecie} · {consulta.clienteNombre}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>{consulta.veterinarioNombre}</TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm">{consulta.servicioNombre}</p>
                        <Badge className="bg-blue-50 text-blue-700 border-blue-100">
                          {consulta.servicioTipo}
                        </Badge>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div>
                        <p className="text-sm">{consulta.fechaAtencionReal}</p>
                        <p className="text-xs text-gray-500">
                          {consulta.citaHora}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm text-gray-600">
                        <p>
                          Temp:{" "}
                          {consulta.temperatura !== null &&
                          consulta.temperatura !== undefined
                            ? `${consulta.temperatura} °C`
                            : "-"}
                        </p>
                        <p>
                          Peso:{" "}
                          {consulta.pesoConsulta !== null &&
                          consulta.pesoConsulta !== undefined
                            ? `${consulta.pesoConsulta} kg`
                            : "-"}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => editarConsulta(consulta)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => eliminarConsulta(consulta)}
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
