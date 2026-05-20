import React, { useEffect, useState } from "react";
import { Edit2, Plus, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import type {
  AplicacionVacuna,
  AplicacionVacunaInput,
  Vacuna,
  VacunaInput,
  VacunasCatalogos,
} from "../services/api";
import {
  createAplicacionVacuna,
  createVacuna,
  deleteVacuna,
  getAplicacionesVacunas,
  getVacunas,
  getVacunasCatalogos,
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
  fechaAplicacion: obtenerFechaLocal(),
  observacion: "",
};

function obtenerFechaLocal() {
  const fecha = new Date();
  const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function formatearDinero(valor: number | string | null | undefined) {
  return `$${Number(valor || 0).toLocaleString("es-CO")}`;
}

function formatearVacio(valor?: string | number | null) {
  if (valor === null || valor === undefined || valor === "") {
    return "Sin registrar";
  }

  return String(valor);
}

function estaVencida(fecha?: string | null) {
  if (!fecha) return false;

  const vencimiento = new Date(`${fecha}T00:00:00`);
  const hoy = new Date();

  hoy.setHours(0, 0, 0, 0);

  return vencimiento < hoy;
}

function getBadgeClassName(valor: string) {
  const texto = valor.toUpperCase();

  if (texto.includes("PERRO") || texto.includes("GATO")) {
    return "bg-blue-100 text-blue-700 border-blue-300";
  }

  if (texto.includes("VENCIDA")) {
    return "bg-red-100 text-red-700 border-red-300";
  }

  return "bg-gray-100 text-gray-700 border-gray-300";
}

function Badge({
  children,
  size = "sm",
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

export function Vacunas() {
  const [activeTab, setActiveTab] = useState<TabVacunas>("catalogo");
  const [vacunas, setVacunas] = useState<Vacuna[]>([]);
  const [aplicaciones, setAplicaciones] = useState<AplicacionVacuna[]>([]);
  const [catalogos, setCatalogos] = useState<VacunasCatalogos>({
    mascotas: [],
    vacunas: [],
  });

  const [showFormVacuna, setShowFormVacuna] = useState(false);
  const [editingVacunaId, setEditingVacunaId] = useState<string | null>(null);
  const [formVacuna, setFormVacuna] = useState<VacunaInput>(vacunaInicial);
  const [formAplicacion, setFormAplicacion] =
    useState<AplicacionVacunaInput>(aplicacionInicial);

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
      setCatalogos(catalogosData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando vacunas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const cambiarTab = (tab: TabVacunas) => {
    setActiveTab(tab);
    setError("");
    setShowFormVacuna(false);
    setEditingVacunaId(null);
    setFormVacuna(vacunaInicial);
    setFormAplicacion({
      ...aplicacionInicial,
      fechaAplicacion: obtenerFechaLocal(),
    });
  };

  const abrirNuevaVacuna = () => {
    setActiveTab("catalogo");
    setShowFormVacuna(true);
    setEditingVacunaId(null);
    setFormVacuna(vacunaInicial);
    setError("");
  };

  const abrirRegistrarAplicacion = () => {
    setActiveTab("aplicaciones");
    setError("");

    setTimeout(() => {
      document
        .getElementById("form-aplicacion-vacuna")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const iniciarEdicionVacuna = (vacuna: Vacuna) => {
    setActiveTab("catalogo");
    setShowFormVacuna(true);
    setEditingVacunaId(vacuna.id);
    setError("");

    setFormVacuna({
      id: vacuna.id,
      nombre: vacuna.nombre || "",
      laboratorio: vacuna.laboratorio || "",
      lote: vacuna.lote || "",
      fechaVencimiento: vacuna.fechaVencimiento || "",
      especieObjetivo: vacuna.especieObjetivo || "",
      precio: vacuna.precio ?? "",
    });
  };

  const cancelarFormularioVacuna = () => {
    setShowFormVacuna(false);
    setEditingVacunaId(null);
    setFormVacuna(vacunaInicial);
    setError("");
  };

  const limpiarAplicacion = () => {
    setFormAplicacion({
      ...aplicacionInicial,
      fechaAplicacion: obtenerFechaLocal(),
    });
    setError("");
  };

  const guardarVacuna = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formVacuna.nombre.trim()) {
      setError("El nombre de la vacuna es obligatorio.");
      return;
    }

    if (!editingVacunaId && !formVacuna.id?.trim()) {
      setError("El ID de la vacuna es obligatorio.");
      return;
    }

    if (Number(formVacuna.precio || 0) < 0) {
      setError("El precio no puede ser negativo.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload: VacunaInput = {
        id: formVacuna.id?.trim(),
        nombre: formVacuna.nombre.trim(),
        laboratorio: formVacuna.laboratorio?.trim() || null,
        lote: formVacuna.lote?.trim() || null,
        fechaVencimiento: formVacuna.fechaVencimiento || null,
        especieObjetivo: formVacuna.especieObjetivo?.trim() || null,
        precio: Number(formVacuna.precio || 0),
      };

      if (editingVacunaId) {
        await updateVacuna(editingVacunaId, payload);
      } else {
        await createVacuna(payload);
      }

      await cargarDatos();
      cancelarFormularioVacuna();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error guardando vacuna");
    } finally {
      setSaving(false);
    }
  };

  const guardarAplicacion = async (event: React.FormEvent<HTMLFormElement>) => {
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

      await createAplicacionVacuna({
        codigoMascota: formAplicacion.codigoMascota,
        idVacuna: formAplicacion.idVacuna,
        fechaAplicacion: formAplicacion.fechaAplicacion,
        observacion: formAplicacion.observacion?.trim() || null,
      });

      await cargarDatos();
      limpiarAplicacion();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error registrando aplicación de vacuna",
      );
    } finally {
      setSaving(false);
    }
  };

  const eliminarVacuna = async (vacuna: Vacuna) => {
    const confirmado = window.confirm(
      `¿Seguro que deseas eliminar la vacuna "${vacuna.nombre}"?`,
    );

    if (!confirmado) return;

    try {
      setError("");
      await deleteVacuna(vacuna.id);
      await cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error eliminando vacuna");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vacunas</h1>
          <p className="text-gray-500 mt-1">
            Gestiona el catálogo de vacunas y su aplicación
          </p>
        </div>

        <Button
          onClick={
            activeTab === "catalogo"
              ? abrirNuevaVacuna
              : abrirRegistrarAplicacion
          }
        >
          <Plus className="w-4 h-4 mr-2" />
          {activeTab === "catalogo" ? "Nueva vacuna" : "Registrar aplicación"}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tabs */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => cambiarTab("catalogo")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "aplicaciones"
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Aplicaciones de vacunas
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Formulario Nueva / Editar Vacuna */}
      {activeTab === "catalogo" && showFormVacuna && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingVacunaId ? "Editar vacuna" : "Nueva vacuna"}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={guardarVacuna}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID
                  </label>

                  <input
                    type="text"
                    value={formVacuna.id || ""}
                    disabled={Boolean(editingVacunaId)}
                    onChange={(event) =>
                      setFormVacuna((prev) => ({
                        ...prev,
                        id: event.target.value,
                      }))
                    }
                    placeholder="VAC0000001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>

                  <input
                    type="text"
                    value={formVacuna.nombre}
                    onChange={(event) =>
                      setFormVacuna((prev) => ({
                        ...prev,
                        nombre: event.target.value,
                      }))
                    }
                    placeholder="Sextuple Canina"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Laboratorio
                  </label>

                  <input
                    type="text"
                    value={formVacuna.laboratorio || ""}
                    onChange={(event) =>
                      setFormVacuna((prev) => ({
                        ...prev,
                        laboratorio: event.target.value,
                      }))
                    }
                    placeholder="Zoetis"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lote
                  </label>

                  <input
                    type="text"
                    value={formVacuna.lote || ""}
                    onChange={(event) =>
                      setFormVacuna((prev) => ({
                        ...prev,
                        lote: event.target.value,
                      }))
                    }
                    placeholder="LOT-2026-001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha vencimiento
                  </label>

                  <input
                    type="date"
                    value={formVacuna.fechaVencimiento || ""}
                    onChange={(event) =>
                      setFormVacuna((prev) => ({
                        ...prev,
                        fechaVencimiento: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Especie objetivo
                  </label>

                  <input
                    type="text"
                    value={formVacuna.especieObjetivo || ""}
                    onChange={(event) =>
                      setFormVacuna((prev) => ({
                        ...prev,
                        especieObjetivo: event.target.value,
                      }))
                    }
                    placeholder="Perro / Gato / Perro/Gato"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={formVacuna.precio}
                    onChange={(event) =>
                      setFormVacuna((prev) => ({
                        ...prev,
                        precio: event.target.value,
                      }))
                    }
                    placeholder="18000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={cancelarFormularioVacuna}
                >
                  Cancelar
                </Button>

                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar vacuna"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Catálogo de Vacunas */}
      {activeTab === "catalogo" && (
        <Card padding={false}>
          <CardHeader className="p-6 pb-4">
            <CardTitle>Catálogo de vacunas disponibles</CardTitle>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Laboratorio
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lote
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha vencimiento
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Especie objetivo
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
                      colSpan={8}
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      Cargando vacunas...
                    </td>
                  </tr>
                ) : vacunas.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      No hay vacunas registradas.
                    </td>
                  </tr>
                ) : (
                  vacunas.map((vacuna, index) => {
                    const vencida = estaVencida(vacuna.fechaVencimiento);

                    return (
                      <tr key={vacuna.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{index + 1}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {vacuna.nombre}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatearVacio(vacuna.laboratorio)}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {formatearVacio(vacuna.lote)}
                          </code>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <span
                              className={
                                vencida ? "text-red-600" : "text-gray-900"
                              }
                            >
                              {formatearVacio(vacuna.fechaVencimiento)}
                            </span>

                            {vencida && <Badge>Vencida</Badge>}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge>
                            {formatearVacio(vacuna.especieObjetivo)}
                          </Badge>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatearDinero(vacuna.precio)}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => iniciarEdicionVacuna(vacuna)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                              title="Editar vacuna"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => eliminarVacuna(vacuna)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              title="Eliminar vacuna"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Aplicaciones de Vacunas */}
      {activeTab === "aplicaciones" && (
        <>
          <Card padding={false}>
            <CardHeader className="p-6 pb-4">
              <CardTitle>Historial de aplicaciones</CardTitle>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mascota
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vacuna
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha aplicación
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Observación
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-10 text-center text-gray-500"
                      >
                        Cargando aplicaciones...
                      </td>
                    </tr>
                  ) : aplicaciones.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-10 text-center text-gray-500"
                      >
                        No hay aplicaciones registradas.
                      </td>
                    </tr>
                  ) : (
                    aplicaciones.map((aplicacion, index) => (
                      <tr key={aplicacion.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{index + 1}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="font-medium text-gray-900">
                              {aplicacion.mascotaNombre}
                            </p>
                            <p className="text-xs text-gray-500">
                              {aplicacion.mascotaEspecie}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="font-medium text-gray-900">
                              {aplicacion.vacunaNombre}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatearVacio(aplicacion.laboratorio)}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {aplicacion.fechaAplicacion}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatearVacio(aplicacion.observacion)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Formulario de Aplicación */}
          <div id="form-aplicacion-vacuna">
            <Card>
              <CardHeader>
                <CardTitle>Registrar nueva aplicación</CardTitle>
              </CardHeader>

              <CardContent>
                <form onSubmit={guardarAplicacion}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mascota
                      </label>

                      <select
                        value={formAplicacion.codigoMascota}
                        onChange={(event) =>
                          setFormAplicacion((prev) => ({
                            ...prev,
                            codigoMascota: event.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Seleccionar mascota...</option>

                        {catalogos.mascotas.map((mascota) => (
                          <option key={mascota.id} value={mascota.id}>
                            {mascota.nombre} - {mascota.especie}
                            {mascota.clienteNombre
                              ? ` - ${mascota.clienteNombre}`
                              : ""}
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
                        onChange={(event) =>
                          setFormAplicacion((prev) => ({
                            ...prev,
                            idVacuna: event.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Seleccionar vacuna...</option>

                        {catalogos.vacunas.map((vacuna) => (
                          <option key={vacuna.id} value={vacuna.id}>
                            {vacuna.nombre}
                            {vacuna.laboratorio
                              ? ` - ${vacuna.laboratorio}`
                              : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de aplicación
                      </label>

                      <input
                        type="date"
                        value={formAplicacion.fechaAplicacion}
                        onChange={(event) =>
                          setFormAplicacion((prev) => ({
                            ...prev,
                            fechaAplicacion: event.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Observación
                      </label>

                      <textarea
                        value={formAplicacion.observacion || ""}
                        onChange={(event) =>
                          setFormAplicacion((prev) => ({
                            ...prev,
                            observacion: event.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        rows={3}
                        placeholder="Observaciones sobre la aplicación..."
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={limpiarAplicacion}
                    >
                      Cancelar
                    </Button>

                    <Button type="submit" disabled={saving}>
                      {saving ? "Registrando..." : "Registrar aplicación"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
