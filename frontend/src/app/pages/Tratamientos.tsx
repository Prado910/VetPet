import React, { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import type {
  CatalogosTratamientos,
  EstadoTratamiento,
  TipoTratamiento,
  Tratamiento,
  TratamientoInput,
  TratamientoMedicamento,
  TratamientoMedicamentoInput,
} from "../services/api";
import {
  addTratamientoMedicamento,
  createTratamiento,
  getCatalogosTratamientos,
  getTratamientoMedicamentos,
  getTratamientos,
} from "../services/api";

function obtenerFechaLocal() {
  const fecha = new Date();
  const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

const tiposTratamiento: TipoTratamiento[] = [
  "MEDICACION",
  "OBSERVACION",
  "TERAPIA",
  "PROCEDIMIENTO_AMBULATORIO",
  "PLAN_VACUNACION",
];

const estadosTratamiento: EstadoTratamiento[] = [
  "ACTIVO",
  "FINALIZADO",
  "SUSPENDIDO",
  "CANCELADO",
];

const tratamientoInicial: TratamientoInput = {
  idDiagnostico: "",
  idVeterinario: "",
  idServicio: "",
  tipo: "MEDICACION",
  fechaInicio: obtenerFechaLocal(),
  fechaFinEstimada: "",
  indicaciones: "",
  estado: "ACTIVO",
};

const medicamentoInicial: TratamientoMedicamentoInput = {
  idMedicamento: "",
  dosis: "",
  frecuencia: "",
  viaAdministracion: "Oral",
  duracion: "",
};

function formatearVacio(valor?: string | number | null) {
  if (valor === null || valor === undefined || valor === "") {
    return "Sin registrar";
  }

  return String(valor);
}

function formatearFecha(fecha?: string | null) {
  if (!fecha) return "Sin registrar";

  const [anio, mes, dia] = fecha.split("-");

  if (!anio || !mes || !dia) return fecha;

  return `${dia}/${mes}/${anio}`;
}

function getBadgeClassName(valor: string) {
  const texto = valor.toUpperCase();

  if (texto === "MEDICACION") {
    return "bg-purple-100 text-purple-700 border-purple-300";
  }

  if (texto === "TERAPIA" || texto === "ACTIVO") {
    return "bg-emerald-100 text-emerald-700 border-emerald-300";
  }

  if (
    texto === "PROCEDIMIENTO_AMBULATORIO" ||
    texto === "OBSERVACION" ||
    texto === "SUSPENDIDO"
  ) {
    return "bg-amber-100 text-amber-700 border-amber-300";
  }

  if (texto === "CANCELADO") {
    return "bg-red-100 text-red-700 border-red-300";
  }

  return "bg-gray-100 text-gray-700 border-gray-300";
}

function Badge({
  children,
  size = "md",
}: {
  children: React.ReactNode;
  size?: "sm" | "md";
}) {
  const texto = String(children || "");

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${getBadgeClassName(
        texto,
      )} ${size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"}`}
    >
      {children}
    </span>
  );
}

export function Tratamientos() {
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [catalogos, setCatalogos] = useState<CatalogosTratamientos>({
    diagnosticos: [],
    veterinarios: [],
    servicios: [],
    medicamentos: [],
  });

  const [tratamientoSeleccionado, setTratamientoSeleccionado] =
    useState<Tratamiento | null>(null);
  const [medicamentosTratamiento, setMedicamentosTratamiento] = useState<
    TratamientoMedicamento[]
  >([]);

  const [tratamientoForm, setTratamientoForm] =
    useState<TratamientoInput>(tratamientoInicial);
  const [medicamentoForm, setMedicamentoForm] =
    useState<TratamientoMedicamentoInput>(medicamentoInicial);

  const [modalTratamientoAbierto, setModalTratamientoAbierto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMedicamentos, setLoadingMedicamentos] = useState(false);
  const [savingTratamiento, setSavingTratamiento] = useState(false);
  const [savingMedicamento, setSavingMedicamento] = useState(false);
  const [error, setError] = useState("");

  const tratamientosActivos = useMemo(
    () =>
      tratamientos.filter(
        (tratamiento) => !tratamiento.estado || tratamiento.estado === "ACTIVO",
      ),
    [tratamientos],
  );

  const cargarMedicamentosTratamiento = async (tratamiento: Tratamiento) => {
    try {
      setLoadingMedicamentos(true);
      setError("");

      const data = await getTratamientoMedicamentos(tratamiento.id);
      setMedicamentosTratamiento(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error cargando medicamentos del tratamiento",
      );
    } finally {
      setLoadingMedicamentos(false);
    }
  };

  const seleccionarTratamiento = async (tratamiento: Tratamiento) => {
    setTratamientoSeleccionado(tratamiento);
    setMedicamentoForm(medicamentoInicial);
    await cargarMedicamentosTratamiento(tratamiento);
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError("");

      const [tratamientosData, catalogosData] = await Promise.all([
        getTratamientos(),
        getCatalogosTratamientos(),
      ]);

      setTratamientos(tratamientosData);
      setCatalogos(catalogosData);

      const seleccionadoActual = tratamientoSeleccionado
        ? tratamientosData.find(
            (tratamiento) => tratamiento.id === tratamientoSeleccionado.id,
          )
        : null;

      const primerActivo =
        tratamientosData.find(
          (tratamiento) =>
            !tratamiento.estado || tratamiento.estado === "ACTIVO",
        ) || tratamientosData[0];

      const siguienteSeleccionado = seleccionadoActual || primerActivo || null;

      setTratamientoSeleccionado(siguienteSeleccionado);

      if (siguienteSeleccionado) {
        await cargarMedicamentosTratamiento(siguienteSeleccionado);
      } else {
        setMedicamentosTratamiento([]);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error cargando tratamientos",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const abrirNuevoTratamiento = () => {
    setTratamientoForm({
      ...tratamientoInicial,
      idDiagnostico: catalogos.diagnosticos[0]?.id || "",
      idVeterinario: catalogos.veterinarios[0]?.id || "",
      idServicio: "",
      fechaInicio: obtenerFechaLocal(),
    });
    setModalTratamientoAbierto(true);
  };

  const cerrarModalTratamiento = () => {
    setModalTratamientoAbierto(false);
    setTratamientoForm(tratamientoInicial);
  };

  const guardarTratamiento = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!tratamientoForm.idDiagnostico) {
      setError("Selecciona un diagnóstico.");
      return;
    }

    if (!tratamientoForm.idVeterinario) {
      setError("Selecciona un veterinario.");
      return;
    }

    if (!tratamientoForm.tipo) {
      setError("Selecciona el tipo de tratamiento.");
      return;
    }

    if (!tratamientoForm.fechaInicio) {
      setError("La fecha de inicio es obligatoria.");
      return;
    }

    try {
      setSavingTratamiento(true);
      setError("");

      const payload: TratamientoInput = {
        idDiagnostico: tratamientoForm.idDiagnostico,
        idVeterinario: tratamientoForm.idVeterinario,
        idServicio: tratamientoForm.idServicio || null,
        tipo: tratamientoForm.tipo,
        fechaInicio: tratamientoForm.fechaInicio,
        fechaFinEstimada: tratamientoForm.fechaFinEstimada || null,
        indicaciones: tratamientoForm.indicaciones?.trim() || null,
        estado: tratamientoForm.estado || "ACTIVO",
      };

      await createTratamiento(payload);
      await cargarDatos();
      cerrarModalTratamiento();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error guardando tratamiento",
      );
    } finally {
      setSavingTratamiento(false);
    }
  };

  const guardarMedicamentoTratamiento = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!tratamientoSeleccionado) {
      setError("Selecciona un tratamiento.");
      return;
    }

    if (!medicamentoForm.idMedicamento) {
      setError("Selecciona un medicamento.");
      return;
    }

    if (!medicamentoForm.dosis.trim()) {
      setError("Escribe la dosis.");
      return;
    }

    if (!medicamentoForm.frecuencia.trim()) {
      setError("Escribe la frecuencia.");
      return;
    }

    try {
      setSavingMedicamento(true);
      setError("");

      await addTratamientoMedicamento(tratamientoSeleccionado.id, {
        idMedicamento: medicamentoForm.idMedicamento,
        dosis: medicamentoForm.dosis.trim(),
        frecuencia: medicamentoForm.frecuencia.trim(),
        viaAdministracion: medicamentoForm.viaAdministracion?.trim() || null,
        duracion: medicamentoForm.duracion?.trim() || null,
      });

      setMedicamentoForm(medicamentoInicial);
      await cargarMedicamentosTratamiento(tratamientoSeleccionado);
      await cargarDatos();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error agregando medicamento al tratamiento",
      );
    } finally {
      setSavingMedicamento(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tratamientos</h1>
          <p className="text-gray-500 mt-1">
            Gestiona los tratamientos de las mascotas
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={cargarDatos} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>

          <Button onClick={abrirNuevoTratamiento}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo tratamiento
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tratamientos Activos */}
      <Card padding={false}>
        <CardHeader className="p-6 pb-4">
          <CardTitle>Tratamientos activos</CardTitle>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Diagnóstico
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Veterinario
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha inicio
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha fin estimada
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
                    Cargando tratamientos...
                  </td>
                </tr>
              ) : tratamientosActivos.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    No hay tratamientos activos.
                  </td>
                </tr>
              ) : (
                tratamientosActivos.map((tratamiento, index) => (
                  <tr
                    key={tratamiento.id}
                    className={`hover:bg-gray-50 ${
                      tratamientoSeleccionado?.id === tratamiento.id
                        ? "bg-emerald-50/40"
                        : ""
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{index + 1}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-gray-900">
                          {tratamiento.descripcionCondicion}
                        </p>
                        <p className="text-xs text-gray-500">
                          Gravedad: {formatearVacio(tratamiento.nivelGravedad)}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {tratamiento.veterinarioNombre}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge>{tratamiento.tipo}</Badge>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tratamiento.fechaInicio}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatearVacio(tratamiento.fechaFinEstimada)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge>{tratamiento.estado || "ACTIVO"}</Badge>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => seleccionarTratamiento(tratamiento)}
                      >
                        Ver detalles
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detalle de Tratamiento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {tratamientoSeleccionado
                ? `Tratamiento ${tratamientoSeleccionado.id} - Detalles`
                : "Tratamiento - Detalles"}
            </CardTitle>
          </CardHeader>

          <CardContent>
            {!tratamientoSeleccionado ? (
              <p className="text-sm text-gray-500 text-center py-8">
                Selecciona un tratamiento para ver sus detalles.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Tipo</p>
                    <Badge>{tratamientoSeleccionado.tipo}</Badge>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Estado</p>
                    <Badge>{tratamientoSeleccionado.estado || "ACTIVO"}</Badge>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Veterinario</p>
                  <p className="text-sm font-medium text-gray-900">
                    {tratamientoSeleccionado.veterinarioNombre}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Mascota</p>
                  <p className="text-sm font-medium text-gray-900">
                    {tratamientoSeleccionado.mascotaNombre} ·{" "}
                    {tratamientoSeleccionado.mascotaEspecie}
                  </p>
                  <p className="text-sm text-gray-600">
                    Dueño: {tratamientoSeleccionado.clienteNombre}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Diagnóstico</p>
                  <p className="text-sm font-medium text-gray-900">
                    {tratamientoSeleccionado.descripcionCondicion}
                  </p>
                  <p className="text-xs text-gray-500">
                    Gravedad:{" "}
                    {formatearVacio(tratamientoSeleccionado.nivelGravedad)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Duración</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatearFecha(tratamientoSeleccionado.fechaInicio)} -{" "}
                    {formatearFecha(tratamientoSeleccionado.fechaFinEstimada)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Indicaciones</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {formatearVacio(tratamientoSeleccionado.indicaciones)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medicamentos del Tratamiento */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Medicamentos del tratamiento</CardTitle>

              <Button
                size="sm"
                variant="secondary"
                disabled={!tratamientoSeleccionado}
                onClick={() =>
                  document
                    .getElementById("form-medicamento-tratamiento")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              >
                <Plus className="w-4 h-4 mr-1" />
                Agregar
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {!tratamientoSeleccionado ? (
              <p className="text-sm text-gray-500 text-center py-8">
                Selecciona un tratamiento para ver medicamentos.
              </p>
            ) : loadingMedicamentos ? (
              <p className="text-sm text-gray-500 text-center py-8">
                Cargando medicamentos...
              </p>
            ) : medicamentosTratamiento.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No hay medicamentos asociados.
              </p>
            ) : (
              <div className="space-y-3">
                {medicamentosTratamiento.map((medicamento) => (
                  <div
                    key={`${medicamento.idTratamiento}-${medicamento.idMedicamento}`}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <h4 className="font-medium text-gray-900 mb-3">
                      {medicamento.medicamentoNombre}
                    </h4>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Dosis</p>
                        <p className="font-medium text-gray-900">
                          {medicamento.dosis}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">Frecuencia</p>
                        <p className="font-medium text-gray-900">
                          {medicamento.frecuencia}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">Vía de administración</p>
                        <p className="font-medium text-gray-900">
                          {formatearVacio(medicamento.viaAdministracion)}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">Duración</p>
                        <p className="font-medium text-gray-900">
                          {formatearVacio(medicamento.duracion)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Formulario para agregar medicamento */}
      <div id="form-medicamento-tratamiento">
        <Card>
          <CardHeader>
            <CardTitle>Agregar medicamento al tratamiento</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={guardarMedicamentoTratamiento}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medicamento
                  </label>

                  <select
                    value={medicamentoForm.idMedicamento}
                    disabled={!tratamientoSeleccionado}
                    onChange={(event) =>
                      setMedicamentoForm((actual) => ({
                        ...actual,
                        idMedicamento: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
                  >
                    <option value="">Seleccionar...</option>

                    {catalogos.medicamentos.map((medicamento) => (
                      <option key={medicamento.id} value={medicamento.id}>
                        {medicamento.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dosis
                  </label>

                  <input
                    type="text"
                    value={medicamentoForm.dosis}
                    disabled={!tratamientoSeleccionado}
                    onChange={(event) =>
                      setMedicamentoForm((actual) => ({
                        ...actual,
                        dosis: event.target.value,
                      }))
                    }
                    placeholder="10 mg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frecuencia
                  </label>

                  <input
                    type="text"
                    value={medicamentoForm.frecuencia}
                    disabled={!tratamientoSeleccionado}
                    onChange={(event) =>
                      setMedicamentoForm((actual) => ({
                        ...actual,
                        frecuencia: event.target.value,
                      }))
                    }
                    placeholder="Cada 12 horas"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vía de administración
                  </label>

                  <select
                    value={medicamentoForm.viaAdministracion || ""}
                    disabled={!tratamientoSeleccionado}
                    onChange={(event) =>
                      setMedicamentoForm((actual) => ({
                        ...actual,
                        viaAdministracion: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
                  >
                    <option value="Oral">Oral</option>
                    <option value="Tópica">Tópica</option>
                    <option value="Inyectable">Inyectable</option>
                    <option value="Intravenosa">Intravenosa</option>
                    <option value="Oftálmica">Oftálmica</option>
                    <option value="Ótica">Ótica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duración
                  </label>

                  <input
                    type="text"
                    value={medicamentoForm.duracion || ""}
                    disabled={!tratamientoSeleccionado}
                    onChange={(event) =>
                      setMedicamentoForm((actual) => ({
                        ...actual,
                        duracion: event.target.value,
                      }))
                    }
                    placeholder="14 días"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  type="submit"
                  disabled={!tratamientoSeleccionado || savingMedicamento}
                >
                  {savingMedicamento ? "Agregando..." : "Agregar medicamento"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Modal nuevo tratamiento */}
      {modalTratamientoAbierto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl">
            <form onSubmit={guardarTratamiento}>
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Nuevo tratamiento
                  </h2>
                  <p className="text-sm text-gray-500">
                    Completa la información del tratamiento
                  </p>
                </div>

                <button
                  type="button"
                  onClick={cerrarModalTratamiento}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 py-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Diagnóstico
                  </label>

                  <select
                    value={tratamientoForm.idDiagnostico}
                    onChange={(event) =>
                      setTratamientoForm((actual) => ({
                        ...actual,
                        idDiagnostico: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Seleccionar diagnóstico...</option>

                    {catalogos.diagnosticos.map((diagnostico) => (
                      <option key={diagnostico.id} value={diagnostico.id}>
                        {diagnostico.descripcionCondicion} -{" "}
                        {diagnostico.mascotaNombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Veterinario
                  </label>

                  <select
                    value={tratamientoForm.idVeterinario}
                    onChange={(event) =>
                      setTratamientoForm((actual) => ({
                        ...actual,
                        idVeterinario: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Seleccionar veterinario...</option>

                    {catalogos.veterinarios.map((veterinario) => (
                      <option key={veterinario.id} value={veterinario.id}>
                        {veterinario.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>

                  <select
                    value={tratamientoForm.tipo}
                    onChange={(event) =>
                      setTratamientoForm((actual) => ({
                        ...actual,
                        tipo: event.target.value as TipoTratamiento,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {tiposTratamiento.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>

                  <select
                    value={tratamientoForm.estado || "ACTIVO"}
                    onChange={(event) =>
                      setTratamientoForm((actual) => ({
                        ...actual,
                        estado: event.target.value as EstadoTratamiento,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {estadosTratamiento.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Servicio asociado
                  </label>

                  <select
                    value={tratamientoForm.idServicio || ""}
                    onChange={(event) =>
                      setTratamientoForm((actual) => ({
                        ...actual,
                        idServicio: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Ninguno</option>

                    {catalogos.servicios.map((servicio) => (
                      <option key={servicio.id} value={servicio.id}>
                        {servicio.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha inicio
                  </label>

                  <input
                    type="date"
                    value={tratamientoForm.fechaInicio}
                    onChange={(event) =>
                      setTratamientoForm((actual) => ({
                        ...actual,
                        fechaInicio: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha fin estimada
                  </label>

                  <input
                    type="date"
                    value={tratamientoForm.fechaFinEstimada || ""}
                    onChange={(event) =>
                      setTratamientoForm((actual) => ({
                        ...actual,
                        fechaFinEstimada: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Indicaciones
                  </label>

                  <textarea
                    value={tratamientoForm.indicaciones || ""}
                    onChange={(event) =>
                      setTratamientoForm((actual) => ({
                        ...actual,
                        indicaciones: event.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Indicaciones del tratamiento..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={cerrarModalTratamiento}
                >
                  Cancelar
                </Button>

                <Button type="submit" disabled={savingTratamiento}>
                  {savingTratamiento ? "Guardando..." : "Guardar tratamiento"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
