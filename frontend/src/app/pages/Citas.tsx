import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  Plus,
  X,
  XCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import type {
  CatalogosCitas,
  Cita,
  CitaInput,
  EstadoCita,
} from "../services/api";
import {
  createCita,
  getCatalogosCitas,
  getCitas,
  updateCita,
} from "../services/api";

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

function generarIdCitaTemporal() {
  return `CIT${Date.now().toString().slice(-6)}`;
}

function formatearFechaTitulo(fechaTexto: string) {
  const fecha = new Date(`${fechaTexto}T00:00:00`);
  const partes = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).formatToParts(fecha);

  const dia = partes.find((parte) => parte.type === "day")?.value || "";
  const mes = partes.find((parte) => parte.type === "month")?.value || "";
  const anio = partes.find((parte) => parte.type === "year")?.value || "";

  const mesCapitalizado = mes.charAt(0).toUpperCase() + mes.slice(1);

  return `${dia} de ${mesCapitalizado} ${anio}`;
}

function compararFechaHora(a: Cita, b: Cita) {
  return `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`);
}

function getEstadoClassName(estado: string) {
  switch (estado) {
    case "CONFIRMADA":
      return "bg-emerald-100 text-emerald-700 border-emerald-300";
    case "PROGRAMADA":
      return "bg-blue-100 text-blue-700 border-blue-300";
    case "ATENDIDA":
      return "bg-gray-100 text-gray-700 border-gray-300";
    case "CANCELADA":
      return "bg-red-100 text-red-700 border-red-300";
    case "REPROGRAMADA":
      return "bg-amber-100 text-amber-700 border-amber-300";
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

function citaToInput(cita: Cita, estado?: EstadoCita): CitaInput {
  return {
    id: cita.id,
    mascotaId: cita.mascotaId,
    veterinarioId: cita.veterinarioId,
    recepcionistaId: cita.recepcionistaId,
    fecha: cita.fecha,
    hora: cita.hora,
    motivo: cita.motivo || "",
    estado: estado || cita.estado,
  };
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

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Cita | null>(null);
  const [form, setForm] = useState<CitaInput>(estadoInicial);

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
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
      setError(err instanceof Error ? err.message : "Error cargando citas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const citasOrdenadas = useMemo(
    () => citas.slice().sort(compararFechaHora),
    [citas],
  );

  const citasHoy = useMemo(
    () => citasOrdenadas.filter((cita) => cita.fecha === hoy),
    [citasOrdenadas, hoy],
  );

  const citasFuturas = useMemo(
    () =>
      citasOrdenadas.filter(
        (cita) =>
          cita.fecha > hoy &&
          cita.estado !== "CANCELADA" &&
          cita.estado !== "ATENDIDA",
      ),
    [citasOrdenadas, hoy],
  );

  const conteos = useMemo(
    () => ({
      programadas: citas.filter((cita) => cita.estado === "PROGRAMADA").length,
      confirmadas: citas.filter((cita) => cita.estado === "CONFIRMADA").length,
      atendidas: citas.filter((cita) => cita.estado === "ATENDIDA").length,
      canceladas: citas.filter((cita) => cita.estado === "CANCELADA").length,
    }),
    [citas],
  );

  const abrirCrear = () => {
    setEditando(null);
    setForm({
      ...estadoInicial,
      id: generarIdCitaTemporal(),
      fecha: hoy,
    });
    setModalAbierto(true);
  };

  const abrirReprogramar = (cita: Cita) => {
    setEditando(cita);
    setForm({
      ...citaToInput(cita),
      estado: "REPROGRAMADA",
    });
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEditando(null);
    setForm(estadoInicial);
  };

  const actualizarEstado = async (cita: Cita, estado: EstadoCita) => {
    try {
      setGuardando(true);
      setError("");

      await updateCita(cita.id, citaToInput(cita, estado));
      await cargarDatos();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error actualizando la cita",
      );
    } finally {
      setGuardando(false);
    }
  };

  const guardarCita = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.id?.trim() && !editando) {
      setError("El ID de la cita es obligatorio.");
      return;
    }

    if (!form.mascotaId?.trim()) {
      setError("La mascota es obligatoria.");
      return;
    }

    if (!form.veterinarioId?.trim()) {
      setError("El veterinario es obligatorio.");
      return;
    }

    if (!form.recepcionistaId?.trim()) {
      setError("El recepcionista es obligatorio.");
      return;
    }

    if (!form.fecha?.trim()) {
      setError("La fecha es obligatoria.");
      return;
    }

    if (!form.hora?.trim()) {
      setError("La hora es obligatoria.");
      return;
    }

    try {
      setGuardando(true);
      setError("");

      const payload: CitaInput = {
        id: editando ? editando.id : form.id?.trim(),
        mascotaId: form.mascotaId,
        veterinarioId: form.veterinarioId,
        recepcionistaId: form.recepcionistaId,
        fecha: form.fecha,
        hora: form.hora,
        motivo: form.motivo?.trim() || null,
        estado: form.estado,
      };

      if (editando) {
        await updateCita(editando.id, payload);
      } else {
        await createCita(payload);
      }

      await cargarDatos();
      cerrarModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error guardando cita");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Citas</h1>
          <p className="text-gray-500 mt-1">Gestiona las citas veterinarias</p>
        </div>

        <Button onClick={abrirCrear}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva cita
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
              </div>

              <div>
                <p className="text-sm text-gray-500">Programadas</p>
                <p className="text-xl font-bold text-gray-900">
                  {conteos.programadas}
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
                  {conteos.confirmadas}
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
                  {conteos.atendidas}
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
                  {conteos.canceladas}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agenda de Hoy */}
      <Card>
        <CardHeader>
          <CardTitle>Agenda de hoy - {formatearFechaTitulo(hoy)}</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hora
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mascota
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Veterinario
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recepcionista
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Motivo
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
                      colSpan={8}
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      Cargando citas...
                    </td>
                  </tr>
                ) : citasHoy.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      No hay citas registradas para hoy.
                    </td>
                  </tr>
                ) : (
                  citasHoy.map((cita) => (
                    <tr key={cita.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {cita.hora}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-gray-900">
                            {cita.mascotaNombre}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatearVacio(cita.mascotaEspecie)}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {cita.clienteNombre}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {cita.veterinarioNombre}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {cita.recepcionistaNombre}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatearVacio(cita.motivo)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <EstadoBadge estado={cita.estado} />
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {cita.estado === "PROGRAMADA" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={guardando}
                              onClick={() =>
                                actualizarEstado(cita, "CONFIRMADA")
                              }
                            >
                              Confirmar
                            </Button>
                          )}

                          {(cita.estado === "PROGRAMADA" ||
                            cita.estado === "CONFIRMADA" ||
                            cita.estado === "REPROGRAMADA") && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={guardando}
                                onClick={() => abrirReprogramar(cita)}
                              >
                                Reprogramar
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={guardando}
                                onClick={() =>
                                  actualizarEstado(cita, "CANCELADA")
                                }
                              >
                                Cancelar
                              </Button>
                            </>
                          )}
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

      {/* Próximas Citas */}
      <Card>
        <CardHeader>
          <CardTitle>Próximas citas</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hora
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mascota
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Veterinario
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Motivo
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      Cargando próximas citas...
                    </td>
                  </tr>
                ) : citasFuturas.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      No hay próximas citas.
                    </td>
                  </tr>
                ) : (
                  citasFuturas.map((cita) => (
                    <tr key={cita.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {cita.fecha}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {cita.hora}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {cita.mascotaNombre}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {cita.clienteNombre}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {cita.veterinarioNombre}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatearVacio(cita.motivo)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <EstadoBadge estado={cita.estado} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Crear / Reprogramar */}
      {modalAbierto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl">
            <form onSubmit={guardarCita}>
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {editando ? "Reprogramar cita" : "Nueva cita"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Completa la información de la cita veterinaria
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
                    placeholder="CIT001"
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
                        estado: event.target.value as EstadoCita,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {estadosCita.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mascota
                  </label>

                  <select
                    value={form.mascotaId}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        mascotaId: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Selecciona una mascota</option>
                    {catalogos.mascotas.map((mascota) => (
                      <option key={mascota.id} value={mascota.id}>
                        {mascota.nombre}
                        {mascota.clienteNombre
                          ? ` - ${mascota.clienteNombre}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Veterinario
                  </label>

                  <select
                    value={form.veterinarioId}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        veterinarioId: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Selecciona un veterinario</option>
                    {catalogos.veterinarios.map((veterinario) => (
                      <option key={veterinario.id} value={veterinario.id}>
                        {veterinario.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recepcionista
                  </label>

                  <select
                    value={form.recepcionistaId}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        recepcionistaId: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Selecciona una recepcionista</option>
                    {catalogos.recepcionistas.map((recepcionista) => (
                      <option key={recepcionista.id} value={recepcionista.id}>
                        {recepcionista.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha
                  </label>

                  <input
                    type="date"
                    value={form.fecha}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        fecha: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora
                  </label>

                  <input
                    type="time"
                    value={form.hora}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        hora: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo
                  </label>

                  <textarea
                    value={form.motivo || ""}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        motivo: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    rows={3}
                    placeholder="Control de rutina"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
                <Button type="button" variant="secondary" onClick={cerrarModal}>
                  Cancelar
                </Button>

                <Button type="submit" disabled={guardando}>
                  {guardando ? "Guardando..." : "Guardar cita"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
