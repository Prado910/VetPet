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
  Edit2,
  Trash2,
  RefreshCw,
  X,
  Search,
  Syringe,
  PawPrint,
  CalendarDays,
} from "lucide-react";
import {
  AplicacionVacuna,
  AplicacionVacunaInput,
  MascotaCatalogoVacuna,
  Vacuna,
  VacunaInput,
  createAplicacionVacuna,
  createVacuna,
  deleteAplicacionVacuna,
  deleteVacuna,
  getAplicacionesVacunas,
  getVacunas,
  getVacunasCatalogos,
  updateAplicacionVacuna,
  updateVacuna,
} from "../services/api";

type TabVacunas = "catalogo" | "aplicaciones";

const vacunaInicial: VacunaInput = {
  id: "",
  nombre: "",
  laboratorio: "",
  lote: "",
  fechaVencimiento: "",
  especieObjetivo: "",
  precio: "",
};

const aplicacionInicial: AplicacionVacunaInput = {
  codigoMascota: "",
  idVacuna: "",
  fechaAplicacion: new Date().toISOString().slice(0, 10),
  observacion: "",
};

function formatoMoneda(valor: number | string | null | undefined) {
  const numero = Number(valor || 0);
  return `$${numero.toLocaleString("es-CO")}`;
}

function diasHasta(fecha?: string | null) {
  if (!fecha) return null;

  const hoy = new Date();
  const vencimiento = new Date(`${fecha}T00:00:00`);
  const diff = vencimiento.getTime() - hoy.setHours(0, 0, 0, 0);

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getEstadoVencimiento(fecha?: string | null) {
  const dias = diasHasta(fecha);

  if (dias === null) {
    return {
      texto: "Sin fecha",
      className: "bg-gray-100 text-gray-700",
    };
  }

  if (dias < 0) {
    return {
      texto: "Vencida",
      className: "bg-red-100 text-red-700",
    };
  }

  if (dias <= 60) {
    return {
      texto: "Próxima a vencer",
      className: "bg-amber-100 text-amber-700",
    };
  }

  return {
    texto: "Vigente",
    className: "bg-emerald-100 text-emerald-700",
  };
}

function normalizarEspecie(valor?: string | null) {
  return (valor || "").trim().toUpperCase();
}

export function Vacunas() {
  const [activeTab, setActiveTab] = useState<TabVacunas>("catalogo");

  const [vacunas, setVacunas] = useState<Vacuna[]>([]);
  const [aplicaciones, setAplicaciones] = useState<AplicacionVacuna[]>([]);
  const [mascotasCatalogo, setMascotasCatalogo] = useState<
    MascotaCatalogoVacuna[]
  >([]);

  const [formVacuna, setFormVacuna] = useState<VacunaInput>(vacunaInicial);
  const [formAplicacion, setFormAplicacion] =
    useState<AplicacionVacunaInput>(aplicacionInicial);

  const [editingVacunaId, setEditingVacunaId] = useState<string | null>(null);
  const [editingAplicacion, setEditingAplicacion] =
    useState<AplicacionVacuna | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEspecie, setFilterEspecie] = useState("TODAS");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError("");

      const [vacunasData, aplicacionesData, catalogosData] = await Promise.all([
        getVacunas(),
        getAplicacionesVacunas(),
        getVacunasCatalogos(),
      ]);

      setVacunas(vacunasData);
      setAplicaciones(aplicacionesData);
      setMascotasCatalogo(catalogosData.mascotas);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudieron cargar vacunas.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const especiesDisponibles = useMemo(() => {
    const especies = new Set<string>();

    vacunas.forEach((vacuna) => {
      if (vacuna.especieObjetivo) {
        especies.add(vacuna.especieObjetivo);
      }
    });

    mascotasCatalogo.forEach((mascota) => {
      if (mascota.especie) {
        especies.add(mascota.especie);
      }
    });

    return Array.from(especies).sort();
  }, [vacunas, mascotasCatalogo]);

  const vacunasFiltradas = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return vacunas.filter((vacuna) => {
      const matchesSearch =
        vacuna.id.toLowerCase().includes(search) ||
        vacuna.nombre.toLowerCase().includes(search) ||
        (vacuna.laboratorio || "").toLowerCase().includes(search) ||
        (vacuna.lote || "").toLowerCase().includes(search) ||
        (vacuna.especieObjetivo || "").toLowerCase().includes(search);

      const matchesEspecie =
        filterEspecie === "TODAS" ||
        normalizarEspecie(vacuna.especieObjetivo) ===
          normalizarEspecie(filterEspecie);

      return matchesSearch && matchesEspecie;
    });
  }, [vacunas, searchTerm, filterEspecie]);

  const aplicacionesFiltradas = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return aplicaciones.filter((aplicacion) => {
      const matchesSearch =
        aplicacion.codigoMascota.toLowerCase().includes(search) ||
        aplicacion.idVacuna.toLowerCase().includes(search) ||
        aplicacion.mascotaNombre.toLowerCase().includes(search) ||
        aplicacion.vacunaNombre.toLowerCase().includes(search) ||
        aplicacion.clienteNombre.toLowerCase().includes(search) ||
        (aplicacion.observacion || "").toLowerCase().includes(search);

      const matchesEspecie =
        filterEspecie === "TODAS" ||
        normalizarEspecie(aplicacion.mascotaEspecie) ===
          normalizarEspecie(filterEspecie) ||
        normalizarEspecie(aplicacion.especieObjetivo) ===
          normalizarEspecie(filterEspecie);

      return matchesSearch && matchesEspecie;
    });
  }, [aplicaciones, searchTerm, filterEspecie]);

  const vacunasVencidas = vacunas.filter((vacuna) => {
    const dias = diasHasta(vacuna.fechaVencimiento);
    return dias !== null && dias < 0;
  }).length;

  const vacunasProximas = vacunas.filter((vacuna) => {
    const dias = diasHasta(vacuna.fechaVencimiento);
    return dias !== null && dias >= 0 && dias <= 60;
  }).length;

  const abrirNuevo = (tab: TabVacunas = activeTab) => {
    setActiveTab(tab);
    setShowForm(true);
    setError("");

    if (tab === "catalogo") {
      setEditingVacunaId(null);
      setEditingAplicacion(null);
      setFormVacuna(vacunaInicial);
    } else {
      setEditingAplicacion(null);
      setEditingVacunaId(null);
      setFormAplicacion(aplicacionInicial);
    }
  };

  const cancelarFormulario = () => {
    setShowForm(false);
    setEditingVacunaId(null);
    setEditingAplicacion(null);
    setFormVacuna(vacunaInicial);
    setFormAplicacion(aplicacionInicial);
    setError("");
  };

  const cambiarTab = (tab: TabVacunas) => {
    setActiveTab(tab);
    cancelarFormulario();
    setSearchTerm("");
    setFilterEspecie("TODAS");
  };

  const iniciarEdicionVacuna = (vacuna: Vacuna) => {
    setActiveTab("catalogo");
    setShowForm(true);
    setEditingVacunaId(vacuna.id);
    setEditingAplicacion(null);
    setError("");

    setFormVacuna({
      id: vacuna.id,
      nombre: vacuna.nombre,
      laboratorio: vacuna.laboratorio || "",
      lote: vacuna.lote || "",
      fechaVencimiento: vacuna.fechaVencimiento || "",
      especieObjetivo: vacuna.especieObjetivo || "",
      precio: vacuna.precio,
    });
  };

  const iniciarEdicionAplicacion = (aplicacion: AplicacionVacuna) => {
    setActiveTab("aplicaciones");
    setShowForm(true);
    setEditingAplicacion(aplicacion);
    setEditingVacunaId(null);
    setError("");

    setFormAplicacion({
      codigoMascota: aplicacion.codigoMascota,
      idVacuna: aplicacion.idVacuna,
      fechaAplicacion: aplicacion.fechaAplicacion,
      observacion: aplicacion.observacion || "",
    });
  };

  const guardarVacuna = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formVacuna.nombre.trim()) {
      setError("El nombre de la vacuna es obligatorio.");
      return;
    }

    if (Number(formVacuna.precio) < 0) {
      setError("El precio no puede ser negativo.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload: VacunaInput = {
        ...formVacuna,
        id: formVacuna.id?.trim(),
        nombre: formVacuna.nombre.trim(),
        laboratorio: formVacuna.laboratorio?.trim() || null,
        lote: formVacuna.lote?.trim() || null,
        fechaVencimiento: formVacuna.fechaVencimiento || null,
        especieObjetivo:
          formVacuna.especieObjetivo?.trim().toUpperCase() || null,
        precio: Number(formVacuna.precio || 0),
      };

      if (editingVacunaId) {
        await updateVacuna(editingVacunaId, payload);
      } else {
        if (!payload.id) {
          setError("El ID de la vacuna es obligatorio.");
          return;
        }

        await createVacuna(payload);
      }

      await cargarDatos();
      cancelarFormulario();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo guardar la vacuna.",
      );
    } finally {
      setSaving(false);
    }
  };

  const guardarAplicacion = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formAplicacion.codigoMascota) {
      setError("Selecciona una mascota.");
      return;
    }

    if (!formAplicacion.idVacuna) {
      setError("Selecciona una vacuna.");
      return;
    }

    if (!formAplicacion.fechaAplicacion) {
      setError("La fecha de aplicación es obligatoria.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload: AplicacionVacunaInput = {
        codigoMascota: formAplicacion.codigoMascota,
        idVacuna: formAplicacion.idVacuna,
        fechaAplicacion: formAplicacion.fechaAplicacion,
        observacion: formAplicacion.observacion?.trim() || null,
      };

      if (editingAplicacion) {
        await updateAplicacionVacuna(payload);
      } else {
        await createAplicacionVacuna(payload);
      }

      await cargarDatos();
      cancelarFormulario();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar la aplicación de vacuna.",
      );
    } finally {
      setSaving(false);
    }
  };

  const eliminarVacuna = async (vacuna: Vacuna) => {
    const confirmado = window.confirm(
      `¿Eliminar la vacuna "${vacuna.nombre}"?`,
    );

    if (!confirmado) return;

    try {
      setError("");
      await deleteVacuna(vacuna.id);
      await cargarDatos();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo eliminar la vacuna.",
      );
    }
  };

  const eliminarAplicacion = async (aplicacion: AplicacionVacuna) => {
    const confirmado = window.confirm(
      `¿Eliminar la aplicación de "${aplicacion.vacunaNombre}" a "${aplicacion.mascotaNombre}"?`,
    );

    if (!confirmado) return;

    try {
      setError("");

      await deleteAplicacionVacuna({
        codigoMascota: aplicacion.codigoMascota,
        idVacuna: aplicacion.idVacuna,
        fechaAplicacion: aplicacion.fechaAplicacion,
      });

      await cargarDatos();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo eliminar la aplicación.",
      );
    }
  };

  const renderFormularioVacuna = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {editingVacunaId ? "Editar vacuna" : "Nueva vacuna"}
          </CardTitle>

          <button
            type="button"
            onClick={cancelarFormulario}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={guardarVacuna} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID
              </label>
              <Input
                value={formVacuna.id || ""}
                disabled={Boolean(editingVacunaId)}
                onChange={(event) =>
                  setFormVacuna((prev) => ({
                    ...prev,
                    id: event.target.value,
                  }))
                }
                placeholder="VAC0000005"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <Input
                value={formVacuna.nombre}
                onChange={(event) =>
                  setFormVacuna((prev) => ({
                    ...prev,
                    nombre: event.target.value,
                  }))
                }
                placeholder="RabiaVet"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Laboratorio
              </label>
              <Input
                value={formVacuna.laboratorio || ""}
                onChange={(event) =>
                  setFormVacuna((prev) => ({
                    ...prev,
                    laboratorio: event.target.value,
                  }))
                }
                placeholder="Biovet"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lote
              </label>
              <Input
                value={formVacuna.lote || ""}
                onChange={(event) =>
                  setFormVacuna((prev) => ({
                    ...prev,
                    lote: event.target.value,
                  }))
                }
                placeholder="RV2026A"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio
              </label>
              <Input
                type="number"
                min="0"
                value={formVacuna.precio}
                onChange={(event) =>
                  setFormVacuna((prev) => ({
                    ...prev,
                    precio: event.target.value,
                  }))
                }
                placeholder="65000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha vencimiento
              </label>
              <Input
                type="date"
                value={formVacuna.fechaVencimiento || ""}
                onChange={(event) =>
                  setFormVacuna((prev) => ({
                    ...prev,
                    fechaVencimiento: event.target.value,
                  }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Especie objetivo
              </label>
              <Input
                value={formVacuna.especieObjetivo || ""}
                onChange={(event) =>
                  setFormVacuna((prev) => ({
                    ...prev,
                    especieObjetivo: event.target.value.toUpperCase(),
                  }))
                }
                placeholder="CANINO / FELINO"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar vacuna"}
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={cancelarFormulario}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  const renderFormularioAplicacion = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {editingAplicacion
              ? "Editar aplicación de vacuna"
              : "Registrar aplicación de vacuna"}
          </CardTitle>

          <button
            type="button"
            onClick={cancelarFormulario}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={guardarAplicacion} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mascota
              </label>
              <select
                value={formAplicacion.codigoMascota}
                disabled={Boolean(editingAplicacion)}
                onChange={(event) =>
                  setFormAplicacion((prev) => ({
                    ...prev,
                    codigoMascota: event.target.value,
                  }))
                }
                className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white"
              >
                <option value="">Seleccionar mascota...</option>
                {mascotasCatalogo.map((mascota) => (
                  <option key={mascota.id} value={mascota.id}>
                    {mascota.nombre} - {mascota.especie} /{" "}
                    {mascota.clienteNombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vacuna
              </label>
              <select
                value={formAplicacion.idVacuna}
                disabled={Boolean(editingAplicacion)}
                onChange={(event) =>
                  setFormAplicacion((prev) => ({
                    ...prev,
                    idVacuna: event.target.value,
                  }))
                }
                className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white"
              >
                <option value="">Seleccionar vacuna...</option>
                {vacunas.map((vacuna) => (
                  <option key={vacuna.id} value={vacuna.id}>
                    {vacuna.nombre}
                    {vacuna.especieObjetivo
                      ? ` - ${vacuna.especieObjetivo}`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha aplicación
              </label>
              <Input
                type="date"
                value={formAplicacion.fechaAplicacion}
                disabled={Boolean(editingAplicacion)}
                onChange={(event) =>
                  setFormAplicacion((prev) => ({
                    ...prev,
                    fechaAplicacion: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          {editingAplicacion && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              La clave compuesta de una aplicación es mascota + vacuna + fecha.
              Por seguridad, aquí solo se edita la observación. Si necesitas
              cambiar mascota, vacuna o fecha, elimina el registro y créalo de
              nuevo.
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observación
            </label>
            <Input
              value={formAplicacion.observacion || ""}
              onChange={(event) =>
                setFormAplicacion((prev) => ({
                  ...prev,
                  observacion: event.target.value,
                }))
              }
              placeholder="Aplicación sin novedad"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar aplicación"}
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={cancelarFormulario}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vacunas</h1>
          <p className="text-gray-500 mt-1">
            Gestiona el catálogo de vacunas y las aplicaciones por mascota
          </p>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={cargarDatos}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>

          <Button type="button" onClick={() => abrirNuevo(activeTab)}>
            <Plus className="w-4 h-4 mr-2" />
            {activeTab === "catalogo" ? "Nueva vacuna" : "Registrar aplicación"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Syringe className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Vacunas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {vacunas.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <PawPrint className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Aplicaciones</p>
                <p className="text-2xl font-bold text-gray-900">
                  {aplicaciones.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Próximas a vencer</p>
                <p className="text-2xl font-bold text-gray-900">
                  {vacunasProximas}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Vencidas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {vacunasVencidas}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => cambiarTab("catalogo")}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeTab === "catalogo"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Catálogo de vacunas
              </button>

              <button
                type="button"
                onClick={() => cambiarTab("aplicaciones")}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeTab === "aplicaciones"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Aplicaciones
              </button>
            </div>

            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={
                    activeTab === "catalogo"
                      ? "Buscar por ID, nombre, laboratorio, lote o especie..."
                      : "Buscar por mascota, cliente, vacuna u observación..."
                  }
                  className="pl-10"
                />
              </div>
            </div>

            <select
              value={filterEspecie}
              onChange={(event) => setFilterEspecie(event.target.value)}
              className="h-10 px-3 border border-gray-300 rounded-md bg-white text-sm"
            >
              <option value="TODAS">Todas las especies</option>
              {especiesDisponibles.map((especie) => (
                <option key={especie} value={especie}>
                  {especie}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {showForm &&
        (activeTab === "catalogo"
          ? renderFormularioVacuna()
          : renderFormularioAplicacion())}

      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === "catalogo"
              ? "Catálogo de vacunas"
              : "Aplicaciones registradas"}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-gray-500">
              Cargando vacunas...
            </div>
          ) : activeTab === "catalogo" ? (
            vacunasFiltradas.length === 0 ? (
              <div className="py-10 text-center text-gray-500">
                No hay vacunas para mostrar.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Laboratorio</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead>Especie</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {vacunasFiltradas.map((vacuna) => {
                    const estado = getEstadoVencimiento(
                      vacuna.fechaVencimiento,
                    );

                    return (
                      <TableRow key={vacuna.id}>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {vacuna.id}
                          </code>
                        </TableCell>

                        <TableCell className="font-medium">
                          {vacuna.nombre}
                        </TableCell>

                        <TableCell>
                          {vacuna.laboratorio || "Sin laboratorio"}
                        </TableCell>

                        <TableCell>{vacuna.lote || "Sin lote"}</TableCell>

                        <TableCell>
                          {vacuna.especieObjetivo ? (
                            <Badge className="bg-blue-100 text-blue-700">
                              {vacuna.especieObjetivo}
                            </Badge>
                          ) : (
                            <span className="text-gray-500">No definida</span>
                          )}
                        </TableCell>

                        <TableCell>
                          {vacuna.fechaVencimiento || "Sin fecha"}
                        </TableCell>

                        <TableCell className="font-medium text-emerald-700">
                          {formatoMoneda(vacuna.precio)}
                        </TableCell>

                        <TableCell>
                          <Badge className={estado.className}>
                            {estado.texto}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => iniciarEdicionVacuna(vacuna)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => eliminarVacuna(vacuna)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )
          ) : aplicacionesFiltradas.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              No hay aplicaciones para mostrar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Mascota</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vacuna</TableHead>
                  <TableHead>Especie</TableHead>
                  <TableHead>Observación</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {aplicacionesFiltradas.map((aplicacion) => (
                  <TableRow key={aplicacion.id}>
                    <TableCell>{aplicacion.fechaAplicacion}</TableCell>

                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {aplicacion.mascotaNombre}
                        </p>
                        <p className="text-xs text-gray-500">
                          {aplicacion.codigoMascota}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>{aplicacion.clienteNombre}</TableCell>

                    <TableCell>
                      <div>
                        <p className="font-medium">{aplicacion.vacunaNombre}</p>
                        <p className="text-xs text-gray-500">
                          {aplicacion.idVacuna}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge className="bg-gray-100 text-gray-700 w-fit">
                          Mascota: {aplicacion.mascotaEspecie}
                        </Badge>

                        {aplicacion.especieObjetivo && (
                          <Badge className="bg-blue-100 text-blue-700 w-fit">
                            Vacuna: {aplicacion.especieObjetivo}
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="max-w-xs truncate text-gray-600">
                      {aplicacion.observacion || "Sin observación"}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => iniciarEdicionAplicacion(aplicacion)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Editar observación"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => eliminarAplicacion(aplicacion)}
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
