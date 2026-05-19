import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Edit2,
  Pill,
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
  CatalogosDiagnosticos,
  CatalogosTratamientos,
  Diagnostico,
  DiagnosticoInput,
  EstadoDiagnostico,
  EstadoTratamiento,
  TipoTratamiento,
  Tratamiento,
  TratamientoInput,
  TratamientoMedicamento,
  TratamientoMedicamentoInput,
  addTratamientoMedicamento,
  createDiagnostico,
  createTratamiento,
  deleteDiagnostico,
  deleteTratamiento,
  deleteTratamientoMedicamento,
  getCatalogosDiagnosticos,
  getCatalogosTratamientos,
  getDiagnosticos,
  getTratamientoMedicamentos,
  getTratamientos,
  updateDiagnostico,
  updateTratamiento,
} from "../services/api";

function obtenerFechaLocal() {
  const fecha = new Date();
  const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

const diagnosticoInicial: DiagnosticoInput = {
  idConsulta: "",
  descripcionCondicion: "",
  nivelGravedad: "BAJA",
  tipoAfeccion: "",
  estado: "PRESUNTIVO",
};

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
  viaAdministracion: "",
  duracion: "",
};

const estadosDiagnostico: EstadoDiagnostico[] = [
  "PRESUNTIVO",
  "CONFIRMADO",
  "DESCARTADO",
];

const nivelesGravedad = ["BAJA", "MEDIA", "ALTA", "CRITICA"];

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

export function Tratamientos() {
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [catalogosDiagnosticos, setCatalogosDiagnosticos] =
    useState<CatalogosDiagnosticos>({ consultas: [] });
  const [catalogosTratamientos, setCatalogosTratamientos] =
    useState<CatalogosTratamientos>({
      diagnosticos: [],
      veterinarios: [],
      servicios: [],
      medicamentos: [],
    });

  const [diagnosticoForm, setDiagnosticoForm] =
    useState<DiagnosticoInput>(diagnosticoInicial);
  const [tratamientoForm, setTratamientoForm] =
    useState<TratamientoInput>(tratamientoInicial);
  const [medicamentoForm, setMedicamentoForm] =
    useState<TratamientoMedicamentoInput>(medicamentoInicial);

  const [editingDiagnosticoId, setEditingDiagnosticoId] = useState<
    string | null
  >(null);
  const [editingTratamientoId, setEditingTratamientoId] = useState<
    string | null
  >(null);

  const [showDiagnosticoForm, setShowDiagnosticoForm] = useState(false);
  const [showTratamientoForm, setShowTratamientoForm] = useState(false);

  const [tratamientoSeleccionado, setTratamientoSeleccionado] =
    useState<Tratamiento | null>(null);
  const [medicamentosTratamiento, setMedicamentosTratamiento] = useState<
    TratamientoMedicamento[]
  >([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeView, setActiveView] = useState<"diagnosticos" | "tratamientos">(
    "tratamientos",
  );

  const [loading, setLoading] = useState(true);
  const [savingDiagnostico, setSavingDiagnostico] = useState(false);
  const [savingTratamiento, setSavingTratamiento] = useState(false);
  const [savingMedicamento, setSavingMedicamento] = useState(false);
  const [error, setError] = useState("");

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        diagnosticosData,
        tratamientosData,
        catalogosDiagnosticosData,
        catalogosTratamientosData,
      ] = await Promise.all([
        getDiagnosticos(),
        getTratamientos(),
        getCatalogosDiagnosticos(),
        getCatalogosTratamientos(),
      ]);

      setDiagnosticos(diagnosticosData);
      setTratamientos(tratamientosData);
      setCatalogosDiagnosticos(catalogosDiagnosticosData);
      setCatalogosTratamientos(catalogosTratamientosData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error cargando diagnósticos y tratamientos",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const diagnosticosFiltrados = useMemo(() => {
    const termino = searchTerm.toLowerCase().trim();

    if (!termino) return diagnosticos;

    return diagnosticos.filter((diagnostico) =>
      [
        diagnostico.id,
        diagnostico.idConsulta,
        diagnostico.descripcionCondicion,
        diagnostico.tipoAfeccion,
        diagnostico.estado,
        diagnostico.mascotaNombre,
        diagnostico.clienteNombre,
        diagnostico.veterinarioNombre,
      ]
        .filter(Boolean)
        .some((valor) => String(valor).toLowerCase().includes(termino)),
    );
  }, [diagnosticos, searchTerm]);

  const tratamientosFiltrados = useMemo(() => {
    const termino = searchTerm.toLowerCase().trim();

    if (!termino) return tratamientos;

    return tratamientos.filter((tratamiento) =>
      [
        tratamiento.id,
        tratamiento.idDiagnostico,
        tratamiento.tipo,
        tratamiento.estado,
        tratamiento.descripcionCondicion,
        tratamiento.mascotaNombre,
        tratamiento.clienteNombre,
        tratamiento.veterinarioNombre,
        tratamiento.servicioNombre,
        tratamiento.medicamentos,
      ]
        .filter(Boolean)
        .some((valor) => String(valor).toLowerCase().includes(termino)),
    );
  }, [tratamientos, searchTerm]);

  const estadisticas = useMemo(() => {
    return {
      diagnosticos: diagnosticos.length,
      tratamientos: tratamientos.length,
      activos: tratamientos.filter((t) => t.estado === "ACTIVO").length,
      medicados: tratamientos.filter(
        (t) => Number(t.medicamentosCount || 0) > 0,
      ).length,
    };
  }, [diagnosticos, tratamientos]);

  const actualizarDiagnosticoCampo = (
    campo: keyof DiagnosticoInput,
    valor: string,
  ) => {
    setDiagnosticoForm((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  };

  const actualizarTratamientoCampo = (
    campo: keyof TratamientoInput,
    valor: string,
  ) => {
    setTratamientoForm((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  };

  const actualizarMedicamentoCampo = (
    campo: keyof TratamientoMedicamentoInput,
    valor: string,
  ) => {
    setMedicamentoForm((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  };

  const limpiarDiagnosticoForm = () => {
    setDiagnosticoForm(diagnosticoInicial);
    setEditingDiagnosticoId(null);
    setShowDiagnosticoForm(false);
    setError("");
  };

  const limpiarTratamientoForm = () => {
    setTratamientoForm(tratamientoInicial);
    setEditingTratamientoId(null);
    setShowTratamientoForm(false);
    setError("");
  };

  const limpiarMedicamentoForm = () => {
    setMedicamentoForm(medicamentoInicial);
  };

  const nuevoDiagnostico = () => {
    setDiagnosticoForm(diagnosticoInicial);
    setEditingDiagnosticoId(null);
    setShowDiagnosticoForm(true);
    setActiveView("diagnosticos");
    setError("");
  };

  const nuevoTratamiento = () => {
    setTratamientoForm(tratamientoInicial);
    setEditingTratamientoId(null);
    setShowTratamientoForm(true);
    setActiveView("tratamientos");
    setError("");
  };

  const editarDiagnostico = (diagnostico: Diagnostico) => {
    setDiagnosticoForm({
      idConsulta: diagnostico.idConsulta,
      descripcionCondicion: diagnostico.descripcionCondicion,
      nivelGravedad: diagnostico.nivelGravedad || "",
      tipoAfeccion: diagnostico.tipoAfeccion || "",
      estado: diagnostico.estado,
    });

    setEditingDiagnosticoId(diagnostico.id);
    setShowDiagnosticoForm(true);
    setActiveView("diagnosticos");
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const editarTratamiento = (tratamiento: Tratamiento) => {
    setTratamientoForm({
      idDiagnostico: tratamiento.idDiagnostico,
      idVeterinario: tratamiento.idVeterinario,
      idServicio: tratamiento.idServicio || "",
      tipo: tratamiento.tipo,
      fechaInicio: tratamiento.fechaInicio,
      fechaFinEstimada: tratamiento.fechaFinEstimada || "",
      indicaciones: tratamiento.indicaciones || "",
      estado: tratamiento.estado || "ACTIVO",
    });

    setEditingTratamientoId(tratamiento.id);
    setShowTratamientoForm(true);
    setActiveView("tratamientos");
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const guardarDiagnostico = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!diagnosticoForm.idConsulta) {
      setError("Selecciona una consulta.");
      return;
    }

    if (!diagnosticoForm.descripcionCondicion.trim()) {
      setError("Escribe la descripción de la condición.");
      return;
    }

    try {
      setSavingDiagnostico(true);
      setError("");

      const payload: DiagnosticoInput = {
        ...diagnosticoForm,
        descripcionCondicion: diagnosticoForm.descripcionCondicion.trim(),
        nivelGravedad: diagnosticoForm.nivelGravedad?.trim() || null,
        tipoAfeccion: diagnosticoForm.tipoAfeccion?.trim() || null,
      };

      if (editingDiagnosticoId) {
        await updateDiagnostico(editingDiagnosticoId, payload);
      } else {
        await createDiagnostico(payload);
      }

      limpiarDiagnosticoForm();
      await cargarDatos();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error guardando diagnóstico",
      );
    } finally {
      setSavingDiagnostico(false);
    }
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

    if (!tratamientoForm.fechaInicio) {
      setError("Selecciona la fecha de inicio.");
      return;
    }

    try {
      setSavingTratamiento(true);
      setError("");

      const payload: TratamientoInput = {
        ...tratamientoForm,
        idServicio: tratamientoForm.idServicio?.trim() || null,
        fechaFinEstimada: tratamientoForm.fechaFinEstimada?.trim() || null,
        indicaciones: tratamientoForm.indicaciones?.trim() || null,
        estado: tratamientoForm.estado || "ACTIVO",
      };

      if (editingTratamientoId) {
        await updateTratamiento(editingTratamientoId, payload);
      } else {
        await createTratamiento(payload);
      }

      limpiarTratamientoForm();
      await cargarDatos();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error guardando tratamiento",
      );
    } finally {
      setSavingTratamiento(false);
    }
  };

  const eliminarDiagnostico = async (diagnostico: Diagnostico) => {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar el diagnóstico ${diagnostico.id}?`,
    );

    if (!confirmar) return;

    try {
      setError("");
      await deleteDiagnostico(diagnostico.id);
      await cargarDatos();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error eliminando diagnóstico",
      );
    }
  };

  const eliminarTratamiento = async (tratamiento: Tratamiento) => {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar el tratamiento ${tratamiento.id}?`,
    );

    if (!confirmar) return;

    try {
      setError("");
      await deleteTratamiento(tratamiento.id);

      if (tratamientoSeleccionado?.id === tratamiento.id) {
        setTratamientoSeleccionado(null);
        setMedicamentosTratamiento([]);
      }

      await cargarDatos();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error eliminando tratamiento",
      );
    }
  };

  const abrirMedicamentos = async (tratamiento: Tratamiento) => {
    try {
      setError("");
      setTratamientoSeleccionado(tratamiento);
      const data = await getTratamientoMedicamentos(tratamiento.id);
      setMedicamentosTratamiento(data);
      limpiarMedicamentoForm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error cargando medicamentos del tratamiento",
      );
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

      limpiarMedicamentoForm();

      const data = await getTratamientoMedicamentos(tratamientoSeleccionado.id);
      setMedicamentosTratamiento(data);
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

  const eliminarMedicamentoTratamiento = async (
    medicamento: TratamientoMedicamento,
  ) => {
    if (!tratamientoSeleccionado) return;

    const confirmar = window.confirm(
      `¿Eliminar ${medicamento.medicamentoNombre} del tratamiento?`,
    );

    if (!confirmar) return;

    try {
      setError("");

      await deleteTratamientoMedicamento(
        tratamientoSeleccionado.id,
        medicamento.idMedicamento,
      );

      const data = await getTratamientoMedicamentos(tratamientoSeleccionado.id);
      setMedicamentosTratamiento(data);
      await cargarDatos();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error eliminando medicamento del tratamiento",
      );
    }
  };

  const consultaSeleccionada = catalogosDiagnosticos.consultas.find(
    (consulta) => consulta.id === diagnosticoForm.idConsulta,
  );

  const diagnosticoSeleccionado = catalogosTratamientos.diagnosticos.find(
    (diagnostico) => diagnostico.id === tratamientoForm.idDiagnostico,
  );

  const servicioSeleccionado = catalogosTratamientos.servicios.find(
    (servicio) => servicio.id === tratamientoForm.idServicio,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Diagnósticos y tratamientos
          </h1>
          <p className="text-gray-500 mt-1">
            Gestiona diagnósticos clínicos, tratamientos y medicamentos
            asociados.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={cargarDatos}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>

          <Button type="button" variant="secondary" onClick={nuevoDiagnostico}>
            <Plus className="w-4 h-4 mr-2" />
            Diagnóstico
          </Button>

          <Button type="button" onClick={nuevoTratamiento}>
            <Plus className="w-4 h-4 mr-2" />
            Tratamiento
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
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Diagnósticos</p>
                <p className="text-xl font-bold text-gray-900">
                  {estadisticas.diagnosticos}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Tratamientos</p>
                <p className="text-xl font-bold text-gray-900">
                  {estadisticas.tratamientos}
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
                <p className="text-sm text-gray-500">Activos</p>
                <p className="text-xl font-bold text-gray-900">
                  {estadisticas.activos}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Pill className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Con medicamentos</p>
                <p className="text-xl font-bold text-gray-900">
                  {estadisticas.medicados}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showDiagnosticoForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {editingDiagnosticoId
                  ? "Editar diagnóstico"
                  : "Nuevo diagnóstico"}
              </CardTitle>

              <Button
                type="button"
                variant="ghost"
                onClick={limpiarDiagnosticoForm}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={guardarDiagnostico} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Consulta
                  </label>
                  <select
                    value={diagnosticoForm.idConsulta}
                    onChange={(event) =>
                      actualizarDiagnosticoCampo(
                        "idConsulta",
                        event.target.value,
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="">Seleccionar consulta...</option>
                    {catalogosDiagnosticos.consultas.map((consulta) => (
                      <option key={consulta.id} value={consulta.id}>
                        {consulta.id} - {consulta.mascotaNombre} /{" "}
                        {consulta.clienteNombre} - {consulta.fechaAtencionReal}
                      </option>
                    ))}
                  </select>
                </div>

                {consultaSeleccionada && (
                  <div className="md:col-span-2 rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3">
                    <p className="text-sm font-medium text-emerald-900">
                      {consultaSeleccionada.mascotaNombre} ·{" "}
                      {consultaSeleccionada.mascotaEspecie}
                    </p>
                    <p className="text-sm text-emerald-700">
                      Cliente: {consultaSeleccionada.clienteNombre} |
                      Veterinario: {consultaSeleccionada.veterinarioNombre}
                    </p>
                    <p className="text-sm text-emerald-700">
                      Servicio: {consultaSeleccionada.servicioNombre}
                    </p>
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción de la condición
                  </label>
                  <textarea
                    value={diagnosticoForm.descripcionCondicion}
                    onChange={(event) =>
                      actualizarDiagnosticoCampo(
                        "descripcionCondicion",
                        event.target.value,
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    rows={3}
                    required
                    placeholder="Describe la condición clínica encontrada..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nivel de gravedad
                  </label>
                  <select
                    value={diagnosticoForm.nivelGravedad || ""}
                    onChange={(event) =>
                      actualizarDiagnosticoCampo(
                        "nivelGravedad",
                        event.target.value,
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Sin definir</option>
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
                  <Input
                    value={diagnosticoForm.tipoAfeccion || ""}
                    onChange={(event) =>
                      actualizarDiagnosticoCampo(
                        "tipoAfeccion",
                        event.target.value,
                      )
                    }
                    placeholder="BACTERIANA, VIRAL, TRAUMA..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={diagnosticoForm.estado}
                    onChange={(event) =>
                      actualizarDiagnosticoCampo(
                        "estado",
                        event.target.value as EstadoDiagnostico,
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {estadosDiagnostico.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={limpiarDiagnosticoForm}
                  disabled={savingDiagnostico}
                >
                  Cancelar
                </Button>

                <Button type="submit" disabled={savingDiagnostico}>
                  {savingDiagnostico
                    ? "Guardando..."
                    : editingDiagnosticoId
                      ? "Actualizar diagnóstico"
                      : "Guardar diagnóstico"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {showTratamientoForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {editingTratamientoId
                  ? "Editar tratamiento"
                  : "Nuevo tratamiento"}
              </CardTitle>

              <Button
                type="button"
                variant="ghost"
                onClick={limpiarTratamientoForm}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={guardarTratamiento} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Diagnóstico
                  </label>
                  <select
                    value={tratamientoForm.idDiagnostico}
                    onChange={(event) =>
                      actualizarTratamientoCampo(
                        "idDiagnostico",
                        event.target.value,
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="">Seleccionar diagnóstico...</option>
                    {catalogosTratamientos.diagnosticos.map((diagnostico) => (
                      <option key={diagnostico.id} value={diagnostico.id}>
                        {diagnostico.id} - {diagnostico.mascotaNombre} /{" "}
                        {diagnostico.descripcionCondicion}
                      </option>
                    ))}
                  </select>
                </div>

                {diagnosticoSeleccionado && (
                  <div className="md:col-span-2 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
                    <p className="text-sm font-medium text-blue-900">
                      {diagnosticoSeleccionado.mascotaNombre} ·{" "}
                      {diagnosticoSeleccionado.mascotaEspecie}
                    </p>
                    <p className="text-sm text-blue-700">
                      Cliente: {diagnosticoSeleccionado.clienteNombre}
                    </p>
                    <p className="text-sm text-blue-700">
                      Diagnóstico:{" "}
                      {diagnosticoSeleccionado.descripcionCondicion}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Veterinario
                  </label>
                  <select
                    value={tratamientoForm.idVeterinario}
                    onChange={(event) =>
                      actualizarTratamientoCampo(
                        "idVeterinario",
                        event.target.value,
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="">Seleccionar veterinario...</option>
                    {catalogosTratamientos.veterinarios.map((veterinario) => (
                      <option key={veterinario.id} value={veterinario.id}>
                        {veterinario.nombre}
                        {veterinario.especialidad
                          ? ` - ${veterinario.especialidad}`
                          : ""}
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
                      actualizarTratamientoCampo(
                        "idServicio",
                        event.target.value,
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Sin servicio</option>
                    {catalogosTratamientos.servicios.map((servicio) => (
                      <option key={servicio.id} value={servicio.id}>
                        {servicio.nombre} - {servicio.tipoServicio} - $
                        {Number(servicio.precio || 0).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                {servicioSeleccionado && (
                  <div className="md:col-span-2 rounded-lg bg-gray-50 border px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">
                      {servicioSeleccionado.nombre}
                    </p>
                    <p className="text-sm text-gray-500">
                      {servicioSeleccionado.tipoServicio} · $
                      {Number(
                        servicioSeleccionado.precio || 0,
                      ).toLocaleString()}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={tratamientoForm.tipo}
                    onChange={(event) =>
                      actualizarTratamientoCampo(
                        "tipo",
                        event.target.value as TipoTratamiento,
                      )
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
                      actualizarTratamientoCampo(
                        "estado",
                        event.target.value as EstadoTratamiento,
                      )
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
                    Fecha inicio
                  </label>
                  <Input
                    type="date"
                    value={tratamientoForm.fechaInicio}
                    onChange={(event) =>
                      actualizarTratamientoCampo(
                        "fechaInicio",
                        event.target.value,
                      )
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha fin estimada
                  </label>
                  <Input
                    type="date"
                    value={tratamientoForm.fechaFinEstimada || ""}
                    onChange={(event) =>
                      actualizarTratamientoCampo(
                        "fechaFinEstimada",
                        event.target.value,
                      )
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Indicaciones
                  </label>
                  <textarea
                    value={tratamientoForm.indicaciones || ""}
                    onChange={(event) =>
                      actualizarTratamientoCampo(
                        "indicaciones",
                        event.target.value,
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    rows={3}
                    placeholder="Indicaciones para el tratamiento..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={limpiarTratamientoForm}
                  disabled={savingTratamiento}
                >
                  Cancelar
                </Button>

                <Button type="submit" disabled={savingTratamiento}>
                  {savingTratamiento
                    ? "Guardando..."
                    : editingTratamientoId
                      ? "Actualizar tratamiento"
                      : "Guardar tratamiento"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {tratamientoSeleccionado && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Medicamentos de {tratamientoSeleccionado.id}
              </CardTitle>

              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setTratamientoSeleccionado(null);
                  setMedicamentosTratamiento([]);
                  limpiarMedicamentoForm();
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <form
              onSubmit={guardarMedicamentoTratamiento}
              className="grid grid-cols-1 md:grid-cols-5 gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medicamento
                </label>
                <select
                  value={medicamentoForm.idMedicamento}
                  onChange={(event) =>
                    actualizarMedicamentoCampo(
                      "idMedicamento",
                      event.target.value,
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {catalogosTratamientos.medicamentos.map((medicamento) => (
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
                <Input
                  value={medicamentoForm.dosis}
                  onChange={(event) =>
                    actualizarMedicamentoCampo("dosis", event.target.value)
                  }
                  placeholder="500mg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frecuencia
                </label>
                <Input
                  value={medicamentoForm.frecuencia}
                  onChange={(event) =>
                    actualizarMedicamentoCampo("frecuencia", event.target.value)
                  }
                  placeholder="2 veces al día"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vía
                </label>
                <Input
                  value={medicamentoForm.viaAdministracion || ""}
                  onChange={(event) =>
                    actualizarMedicamentoCampo(
                      "viaAdministracion",
                      event.target.value,
                    )
                  }
                  placeholder="Oral"
                />
              </div>

              <div className="flex items-end">
                <Button type="submit" disabled={savingMedicamento}>
                  {savingMedicamento ? "Agregando..." : "Agregar"}
                </Button>
              </div>

              <div className="md:col-span-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duración
                </label>
                <Input
                  value={medicamentoForm.duracion || ""}
                  onChange={(event) =>
                    actualizarMedicamentoCampo("duracion", event.target.value)
                  }
                  placeholder="7 días"
                />
              </div>
            </form>

            {medicamentosTratamiento.length === 0 ? (
              <div className="py-4 text-center text-gray-500">
                Este tratamiento no tiene medicamentos asociados.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicamento</TableHead>
                    <TableHead>Dosis</TableHead>
                    <TableHead>Frecuencia</TableHead>
                    <TableHead>Vía</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {medicamentosTratamiento.map((medicamento) => (
                    <TableRow key={medicamento.idMedicamento}>
                      <TableCell>{medicamento.medicamentoNombre}</TableCell>
                      <TableCell>{medicamento.dosis}</TableCell>
                      <TableCell>{medicamento.frecuencia}</TableCell>
                      <TableCell>
                        {medicamento.viaAdministracion || "-"}
                      </TableCell>
                      <TableCell>{medicamento.duracion || "-"}</TableCell>
                      <TableCell className="text-right">
                        <button
                          type="button"
                          onClick={() =>
                            eliminarMedicamentoTratamiento(medicamento)
                          }
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={
                  activeView === "tratamientos" ? "primary" : "secondary"
                }
                onClick={() => setActiveView("tratamientos")}
              >
                Tratamientos
              </Button>

              <Button
                type="button"
                variant={
                  activeView === "diagnosticos" ? "primary" : "secondary"
                }
                onClick={() => setActiveView("diagnosticos")}
              >
                Diagnósticos
              </Button>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar..."
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
              Cargando información clínica...
            </div>
          ) : activeView === "tratamientos" ? (
            tratamientosFiltrados.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                No hay tratamientos registrados.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tratamiento</TableHead>
                    <TableHead>Mascota / Cliente</TableHead>
                    <TableHead>Diagnóstico</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Medicamentos</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {tratamientosFiltrados.map((tratamiento) => (
                    <TableRow key={tratamiento.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">
                            {tratamiento.id}
                          </p>
                          <p className="text-xs text-gray-500">
                            Desde {tratamiento.fechaInicio}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">
                            {tratamiento.mascotaNombre}
                          </p>
                          <p className="text-xs text-gray-500">
                            {tratamiento.mascotaEspecie} ·{" "}
                            {tratamiento.clienteNombre}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div>
                          <p className="text-sm text-gray-900">
                            {tratamiento.descripcionCondicion}
                          </p>
                          <p className="text-xs text-gray-500">
                            {tratamiento.idDiagnostico}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge className="bg-blue-50 text-blue-700 border-blue-100">
                          {tratamiento.tipo}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100">
                          {tratamiento.estado || "SIN ESTADO"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div>
                          <p className="text-sm">
                            {tratamiento.medicamentosCount || 0} asociados
                          </p>
                          <p className="text-xs text-gray-500">
                            {tratamiento.medicamentos || "-"}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => abrirMedicamentos(tratamiento)}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                            title="Medicamentos"
                          >
                            <Pill className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => editarTratamiento(tratamiento)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => eliminarTratamiento(tratamiento)}
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
            )
          ) : diagnosticosFiltrados.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No hay diagnósticos registrados.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Diagnóstico</TableHead>
                  <TableHead>Mascota / Cliente</TableHead>
                  <TableHead>Condición</TableHead>
                  <TableHead>Gravedad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Tratamientos</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {diagnosticosFiltrados.map((diagnostico) => (
                  <TableRow key={diagnostico.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">
                          {diagnostico.id}
                        </p>
                        <p className="text-xs text-gray-500">
                          Consulta: {diagnostico.idConsulta}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">
                          {diagnostico.mascotaNombre}
                        </p>
                        <p className="text-xs text-gray-500">
                          {diagnostico.mascotaEspecie} ·{" "}
                          {diagnostico.clienteNombre}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div>
                        <p className="text-sm text-gray-900">
                          {diagnostico.descripcionCondicion}
                        </p>
                        <p className="text-xs text-gray-500">
                          {diagnostico.tipoAfeccion || "-"}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>{diagnostico.nivelGravedad || "-"}</TableCell>

                    <TableCell>
                      <Badge className="bg-blue-50 text-blue-700 border-blue-100">
                        {diagnostico.estado}
                      </Badge>
                    </TableCell>

                    <TableCell>{diagnostico.tratamientosCount || 0}</TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => editarDiagnostico(diagnostico)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => eliminarDiagnostico(diagnostico)}
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
