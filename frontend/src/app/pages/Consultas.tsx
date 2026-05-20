import React, { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import type {
  CatalogoConsultaCita,
  CatalogosConsultas,
  CatalogosTratamientos,
  Consulta,
  ConsultaInput,
  Diagnostico,
  DiagnosticoInput,
  EstadoDiagnostico,
  EstadoTratamiento,
  TipoTratamiento,
  Tratamiento,
  TratamientoInput,
} from "../services/api";
import {
  createConsulta,
  createDiagnostico,
  createTratamiento,
  getCatalogosConsultas,
  getCatalogosTratamientos,
  getConsultas,
  getDiagnosticos,
  getTratamientos,
} from "../services/api";

function obtenerFechaLocal() {
  const fecha = new Date();
  const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

const consultaInicial: ConsultaInput = {
  idCita: "",
  idServicio: "",
  temperatura: "",
  pesoConsulta: "",
  fechaAtencionReal: obtenerFechaLocal(),
  observaciones: "",
  recomendaciones: "",
};

const diagnosticoInicial = {
  descripcionCondicion: "",
  nivelGravedad: "",
  tipoAfeccion: "",
  estadoVisual: "EN_TRATAMIENTO",
};

const tratamientoInicial = {
  tipo: "",
  idServicio: "",
  fechaInicio: obtenerFechaLocal(),
  fechaFinEstimada: "",
  indicaciones: "",
};

const nivelesGravedad = ["LEVE", "MODERADO", "GRAVE", "CRÍTICO"];

const tiposAfeccion = [
  "DERMATOLÓGICA",
  "RESPIRATORIA",
  "DIGESTIVA",
  "TRAUMATOLÓGICA",
  "OFTALMOLÓGICA",
  "NEUROLÓGICA",
  "CARDIOLÓGICA",
];

const estadosDiagnosticoVisuales = [
  "EN_TRATAMIENTO",
  "CONTROLADO",
  "CURADO",
  "EN_OBSERVACION",
];

const tiposTratamiento: TipoTratamiento[] = [
  "MEDICACION",
  "OBSERVACION",
  "TERAPIA",
  "PROCEDIMIENTO_AMBULATORIO",
  "PLAN_VACUNACION",
];

function mapearEstadoDiagnostico(estadoVisual: string): EstadoDiagnostico {
  if (estadoVisual === "EN_OBSERVACION") return "PRESUNTIVO";
  if (estadoVisual === "CURADO") return "DESCARTADO";
  return "CONFIRMADO";
}

function getBadgeClassName(valor: string) {
  const texto = valor.toUpperCase();

  if (
    texto.includes("LEVE") ||
    texto.includes("ACTIVO") ||
    texto.includes("CONFIRMADO") ||
    texto.includes("EN_TRATAMIENTO")
  ) {
    return "bg-emerald-100 text-emerald-700 border-emerald-300";
  }

  if (
    texto.includes("MODERADO") ||
    texto.includes("PRESUNTIVO") ||
    texto.includes("OBSERVACION")
  ) {
    return "bg-amber-100 text-amber-700 border-amber-300";
  }

  if (
    texto.includes("GRAVE") ||
    texto.includes("CRÍTICO") ||
    texto.includes("CRITICO") ||
    texto.includes("CANCELADO") ||
    texto.includes("SUSPENDIDO")
  ) {
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

function formatearVacio(valor?: string | number | null) {
  if (valor === null || valor === undefined || valor === "") {
    return "Sin registrar";
  }

  return String(valor);
}

function formatearCita(cita: CatalogoConsultaCita) {
  return `Cita ${cita.id} - ${cita.mascotaNombre} (${cita.hora})`;
}

function obtenerVeterinarioId(
  consultaForm: ConsultaInput,
  catalogos: CatalogosConsultas,
  consultas: Consulta[],
) {
  const citaCatalogo = catalogos.citasDisponibles.find(
    (cita) => cita.id === consultaForm.idCita,
  );

  if (citaCatalogo?.veterinarioId) {
    return citaCatalogo.veterinarioId;
  }

  const consultaExistente = consultas.find(
    (consulta) => consulta.idCita === consultaForm.idCita,
  );

  return consultaExistente?.veterinarioId || "";
}

export function Consultas() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);

  const [catalogosConsultas, setCatalogosConsultas] =
    useState<CatalogosConsultas>({
      citasDisponibles: [],
      servicios: [],
    });

  const [catalogosTratamientos, setCatalogosTratamientos] =
    useState<CatalogosTratamientos>({
      diagnosticos: [],
      veterinarios: [],
      servicios: [],
      medicamentos: [],
    });

  const [consultaForm, setConsultaForm] =
    useState<ConsultaInput>(consultaInicial);
  const [diagnosticoForm, setDiagnosticoForm] = useState(diagnosticoInicial);
  const [tratamientoForm, setTratamientoForm] = useState(tratamientoInicial);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        consultasData,
        catalogosConsultasData,
        diagnosticosData,
        tratamientosData,
        catalogosTratamientosData,
      ] = await Promise.all([
        getConsultas(),
        getCatalogosConsultas(),
        getDiagnosticos(),
        getTratamientos(),
        getCatalogosTratamientos(),
      ]);

      setConsultas(consultasData);
      setCatalogosConsultas(catalogosConsultasData);
      setDiagnosticos(diagnosticosData);
      setTratamientos(tratamientosData);
      setCatalogosTratamientos(catalogosTratamientosData);

      if (!consultaForm.idCita && catalogosConsultasData.citasDisponibles[0]) {
        const primeraCita = catalogosConsultasData.citasDisponibles[0];

        setConsultaForm((actual) => ({
          ...actual,
          idCita: primeraCita.id,
        }));
      }

      if (!consultaForm.idServicio && catalogosConsultasData.servicios[0]) {
        const primerServicio = catalogosConsultasData.servicios[0];

        setConsultaForm((actual) => ({
          ...actual,
          idServicio: primerServicio.id,
        }));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error cargando consultas médicas",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const historial = useMemo(() => {
    return consultas
      .slice()
      .sort(
        (a, b) =>
          new Date(b.fechaAtencionReal).getTime() -
          new Date(a.fechaAtencionReal).getTime(),
      )
      .slice(0, 6)
      .map((consulta) => {
        const diagnostico = diagnosticos.find(
          (item) => item.idConsulta === consulta.id,
        );

        const tratamiento = diagnostico
          ? tratamientos.find(
              (item) =>
                item.idDiagnostico === diagnostico.id &&
                item.estado === "ACTIVO",
            )
          : null;

        return {
          consulta,
          diagnostico,
          tratamiento,
        };
      });
  }, [consultas, diagnosticos, tratamientos]);

  const citaSeleccionada = useMemo(
    () =>
      catalogosConsultas.citasDisponibles.find(
        (cita) => cita.id === consultaForm.idCita,
      ) || null,
    [catalogosConsultas.citasDisponibles, consultaForm.idCita],
  );

  const limpiarFormulario = () => {
    setConsultaForm({
      ...consultaInicial,
      fechaAtencionReal: obtenerFechaLocal(),
      idCita: catalogosConsultas.citasDisponibles[0]?.id || "",
      idServicio: catalogosConsultas.servicios[0]?.id || "",
    });
    setDiagnosticoForm(diagnosticoInicial);
    setTratamientoForm({
      ...tratamientoInicial,
      fechaInicio: obtenerFechaLocal(),
    });
    setError("");
  };

  const actualizarConsultaCampo = (
    campo: keyof ConsultaInput,
    valor: string,
  ) => {
    setConsultaForm((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  };

  const guardarConsulta = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!consultaForm.idCita) {
      setError("Selecciona una cita para registrar la consulta.");
      return;
    }

    if (!consultaForm.idServicio) {
      setError("Selecciona el servicio de la consulta.");
      return;
    }

    if (!consultaForm.fechaAtencionReal) {
      setError("La fecha de atención es obligatoria.");
      return;
    }

    if (!diagnosticoForm.descripcionCondicion.trim()) {
      setError("La descripción del diagnóstico es obligatoria.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const consultaPayload: ConsultaInput = {
        idCita: consultaForm.idCita,
        idServicio: consultaForm.idServicio,
        temperatura: consultaForm.temperatura || null,
        pesoConsulta: consultaForm.pesoConsulta || null,
        fechaAtencionReal: consultaForm.fechaAtencionReal,
        observaciones: consultaForm.observaciones?.trim() || null,
        recomendaciones: consultaForm.recomendaciones?.trim() || null,
      };

      const consultaCreada = await createConsulta(consultaPayload);

      const diagnosticoPayload: DiagnosticoInput = {
        idConsulta: consultaCreada.id,
        descripcionCondicion: diagnosticoForm.descripcionCondicion.trim(),
        nivelGravedad: diagnosticoForm.nivelGravedad || null,
        tipoAfeccion: diagnosticoForm.tipoAfeccion || null,
        estado: mapearEstadoDiagnostico(diagnosticoForm.estadoVisual),
      };

      const diagnosticoCreado = await createDiagnostico(diagnosticoPayload);

      if (tratamientoForm.tipo) {
        const veterinarioId = obtenerVeterinarioId(
          consultaForm,
          catalogosConsultas,
          consultas,
        );

        if (!veterinarioId) {
          throw new Error(
            "No se pudo obtener el veterinario de la cita para crear el tratamiento.",
          );
        }

        const tratamientoPayload: TratamientoInput = {
          idDiagnostico: diagnosticoCreado.id,
          idVeterinario: veterinarioId,
          idServicio: tratamientoForm.idServicio || null,
          tipo: tratamientoForm.tipo as TipoTratamiento,
          fechaInicio: tratamientoForm.fechaInicio,
          fechaFinEstimada: tratamientoForm.fechaFinEstimada || null,
          indicaciones: tratamientoForm.indicaciones?.trim() || null,
          estado: "ACTIVO" as EstadoTratamiento,
        };

        await createTratamiento(tratamientoPayload);
      }

      await cargarDatos();
      limpiarFormulario();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error guardando consulta");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Consultas médicas
          </h1>
          <p className="text-gray-500 mt-1">
            Registra las atenciones veterinarias
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={cargarDatos} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>

          <Button onClick={limpiarFormulario}>
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

      {loading ? (
        <div className="py-10 text-center text-gray-500">
          Cargando consultas médicas...
        </div>
      ) : (
        <form onSubmit={guardarConsulta} className="space-y-6">
          {/* Formulario de Consulta */}
          <Card>
            <CardHeader>
              <CardTitle>Registrar consulta veterinaria</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cita
                  </label>

                  <select
                    value={consultaForm.idCita}
                    onChange={(event) =>
                      actualizarConsultaCampo("idCita", event.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Seleccionar cita...</option>

                    {catalogosConsultas.citasDisponibles.map((cita) => (
                      <option key={cita.id} value={cita.id}>
                        {formatearCita(cita)}
                      </option>
                    ))}
                  </select>

                  {catalogosConsultas.citasDisponibles.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      No hay citas disponibles para registrar consulta.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Servicio
                  </label>

                  <select
                    value={consultaForm.idServicio}
                    onChange={(event) =>
                      actualizarConsultaCampo("idServicio", event.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Seleccionar servicio...</option>

                    {catalogosConsultas.servicios.map((servicio) => (
                      <option key={servicio.id} value={servicio.id}>
                        {servicio.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Temperatura (°C)
                  </label>

                  <input
                    type="number"
                    step="0.1"
                    value={consultaForm.temperatura ?? ""}
                    onChange={(event) =>
                      actualizarConsultaCampo("temperatura", event.target.value)
                    }
                    placeholder="38.5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Peso en consulta (kg)
                  </label>

                  <input
                    type="number"
                    step="0.1"
                    value={consultaForm.pesoConsulta ?? ""}
                    onChange={(event) =>
                      actualizarConsultaCampo(
                        "pesoConsulta",
                        event.target.value,
                      )
                    }
                    placeholder="12.5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de atención
                  </label>

                  <input
                    type="date"
                    value={consultaForm.fechaAtencionReal}
                    onChange={(event) =>
                      actualizarConsultaCampo(
                        "fechaAtencionReal",
                        event.target.value,
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {citaSeleccionada && (
                  <div className="flex items-end">
                    <div className="w-full rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">
                      <p>
                        <span className="font-medium text-gray-900">
                          Mascota:
                        </span>{" "}
                        {citaSeleccionada.mascotaNombre}
                      </p>
                      <p>
                        <span className="font-medium text-gray-900">
                          Veterinario:
                        </span>{" "}
                        {citaSeleccionada.veterinarioNombre}
                      </p>
                    </div>
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observaciones
                  </label>

                  <textarea
                    value={consultaForm.observaciones || ""}
                    onChange={(event) =>
                      actualizarConsultaCampo(
                        "observaciones",
                        event.target.value,
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    rows={3}
                    placeholder="Descripción detallada de la consulta..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recomendaciones
                  </label>

                  <textarea
                    value={consultaForm.recomendaciones || ""}
                    onChange={(event) =>
                      actualizarConsultaCampo(
                        "recomendaciones",
                        event.target.value,
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    rows={3}
                    placeholder="Recomendaciones para el dueño..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sección de Diagnóstico */}
          <Card>
            <CardHeader>
              <CardTitle>Diagnóstico</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción del diagnóstico
                  </label>

                  <textarea
                    value={diagnosticoForm.descripcionCondicion}
                    onChange={(event) =>
                      setDiagnosticoForm((actual) => ({
                        ...actual,
                        descripcionCondicion: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    rows={3}
                    placeholder="Descripción detallada del diagnóstico..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nivel de gravedad
                  </label>

                  <select
                    value={diagnosticoForm.nivelGravedad}
                    onChange={(event) =>
                      setDiagnosticoForm((actual) => ({
                        ...actual,
                        nivelGravedad: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Seleccionar...</option>
                    {nivelesGravedad.map((nivel) => (
                      <option key={nivel} value={nivel}>
                        {nivel}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de afección
                  </label>

                  <select
                    value={diagnosticoForm.tipoAfeccion}
                    onChange={(event) =>
                      setDiagnosticoForm((actual) => ({
                        ...actual,
                        tipoAfeccion: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Seleccionar...</option>
                    {tiposAfeccion.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado del diagnóstico
                  </label>

                  <select
                    value={diagnosticoForm.estadoVisual}
                    onChange={(event) =>
                      setDiagnosticoForm((actual) => ({
                        ...actual,
                        estadoVisual: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {estadosDiagnosticoVisuales.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tratamiento Recomendado */}
          <Card>
            <CardHeader>
              <CardTitle>Tratamiento recomendado</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de tratamiento
                  </label>

                  <select
                    value={tratamientoForm.tipo}
                    onChange={(event) =>
                      setTratamientoForm((actual) => ({
                        ...actual,
                        tipo: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Seleccionar...</option>
                    {tiposTratamiento.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Servicio asociado (opcional)
                  </label>

                  <select
                    value={tratamientoForm.idServicio}
                    onChange={(event) =>
                      setTratamientoForm((actual) => ({
                        ...actual,
                        idServicio: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Ninguno</option>
                    {catalogosTratamientos.servicios.map((servicio) => (
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
                    value={tratamientoForm.fechaFinEstimada}
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
                    Indicaciones del tratamiento
                  </label>

                  <textarea
                    value={tratamientoForm.indicaciones}
                    onChange={(event) =>
                      setTratamientoForm((actual) => ({
                        ...actual,
                        indicaciones: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    rows={3}
                    placeholder="Instrucciones detalladas del tratamiento..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={limpiarFormulario}
                  disabled={saving}
                >
                  Cancelar
                </Button>

                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar consulta"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}

      {/* Historial de Consultas */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de consultas recientes</CardTitle>
        </CardHeader>

        <CardContent>
          {historial.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No hay consultas recientes.
            </div>
          ) : (
            <div className="space-y-3">
              {historial.map(({ consulta, diagnostico, tratamiento }) => (
                <div
                  key={consulta.id}
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {diagnostico?.descripcionCondicion ||
                            consulta.servicioNombre}
                        </h4>

                        {diagnostico?.nivelGravedad && (
                          <Badge>{diagnostico.nivelGravedad}</Badge>
                        )}

                        {diagnostico?.estado && (
                          <Badge>{diagnostico.estado}</Badge>
                        )}

                        {tratamiento?.estado && (
                          <Badge>{tratamiento.estado}</Badge>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mb-2">
                        Mascota:{" "}
                        <span className="font-medium">
                          {consulta.mascotaNombre}
                        </span>{" "}
                        | Veterinario:{" "}
                        <span className="font-medium">
                          {consulta.veterinarioNombre}
                        </span>
                      </p>

                      <p className="text-sm text-gray-500">
                        Fecha: {consulta.fechaAtencionReal} | Servicio:{" "}
                        {consulta.servicioNombre}
                      </p>

                      <p className="text-sm text-gray-600 mt-2">
                        Observaciones: {formatearVacio(consulta.observaciones)}
                      </p>

                      {consulta.recomendaciones && (
                        <p className="text-sm text-gray-600 mt-1">
                          Recomendaciones: {consulta.recomendaciones}
                        </p>
                      )}

                      {tratamiento?.indicaciones && (
                        <p className="text-sm text-gray-600 mt-1">
                          Tratamiento: {tratamiento.indicaciones}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
