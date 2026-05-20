import React, { useEffect, useMemo, useState } from "react";
import { Edit2, Package, Plus, Trash2, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import type {
  Medicamento,
  MedicamentoInput,
  Vacuna,
  VacunaInput,
} from "../services/api";
import {
  createMedicamento,
  createVacuna,
  deleteMedicamento,
  deleteVacuna,
  getMedicamentos,
  getVacunas,
  updateMedicamento,
  updateVacuna,
} from "../services/api";

type InventarioTab = "medicamentos" | "vacunas";

const medicamentoInicial: MedicamentoInput = {
  id: "",
  nombre: "",
  descripcion: "",
  precioUnitario: "",
};

const vacunaInicial: VacunaInput = {
  id: "",
  nombre: "",
  laboratorio: "",
  lote: "",
  fechaVencimiento: "",
  especieObjetivo: "",
  precio: "",
};

function formatearDinero(valor: number | string | null | undefined) {
  return `$${Number(valor || 0).toLocaleString("es-CO")}`;
}

function formatearDineroCorto(valor: number | string | null | undefined) {
  const numero = Number(valor || 0);

  if (numero >= 1_000_000) {
    return `$${(numero / 1_000_000).toFixed(numero >= 10_000_000 ? 0 : 1)}M`;
  }

  if (numero >= 1_000) {
    return `$${(numero / 1_000).toFixed(0)}k`;
  }

  return formatearDinero(numero);
}

function formatearVacio(valor?: string | number | null) {
  if (valor === null || valor === undefined || valor === "") {
    return "Sin registrar";
  }

  return String(valor);
}

export function Inventario() {
  const [activeTab, setActiveTab] = useState<InventarioTab>("medicamentos");
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [vacunas, setVacunas] = useState<Vacuna[]>([]);

  const [modalMedicamentoAbierto, setModalMedicamentoAbierto] = useState(false);
  const [modalVacunaAbierto, setModalVacunaAbierto] = useState(false);

  const [editandoMedicamento, setEditandoMedicamento] =
    useState<Medicamento | null>(null);
  const [editandoVacuna, setEditandoVacuna] = useState<Vacuna | null>(null);

  const [formMedicamento, setFormMedicamento] =
    useState<MedicamentoInput>(medicamentoInicial);
  const [formVacuna, setFormVacuna] = useState<VacunaInput>(vacunaInicial);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError("");

      const [medicamentosData, vacunasData] = await Promise.all([
        getMedicamentos(),
        getVacunas(),
      ]);

      setMedicamentos(medicamentosData);
      setVacunas(vacunasData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error cargando inventario",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const valorInventario = useMemo(() => {
    const totalMedicamentos = medicamentos.reduce(
      (sum, medicamento) => sum + Number(medicamento.precioUnitario || 0),
      0,
    );

    const totalVacunas = vacunas.reduce(
      (sum, vacuna) => sum + Number(vacuna.precio || 0),
      0,
    );

    return totalMedicamentos + totalVacunas;
  }, [medicamentos, vacunas]);

  const abrirNuevoItem = () => {
    setError("");

    if (activeTab === "medicamentos") {
      setEditandoMedicamento(null);
      setFormMedicamento(medicamentoInicial);
      setModalMedicamentoAbierto(true);
      return;
    }

    setEditandoVacuna(null);
    setFormVacuna(vacunaInicial);
    setModalVacunaAbierto(true);
  };

  const abrirEditarMedicamento = (medicamento: Medicamento) => {
    setError("");
    setEditandoMedicamento(medicamento);
    setFormMedicamento({
      id: medicamento.id,
      nombre: medicamento.nombre || "",
      descripcion: medicamento.descripcion || "",
      precioUnitario: medicamento.precioUnitario ?? "",
    });
    setModalMedicamentoAbierto(true);
  };

  const abrirEditarVacuna = (vacuna: Vacuna) => {
    setError("");
    setEditandoVacuna(vacuna);
    setFormVacuna({
      id: vacuna.id,
      nombre: vacuna.nombre || "",
      laboratorio: vacuna.laboratorio || "",
      lote: vacuna.lote || "",
      fechaVencimiento: vacuna.fechaVencimiento || "",
      especieObjetivo: vacuna.especieObjetivo || "",
      precio: vacuna.precio ?? "",
    });
    setModalVacunaAbierto(true);
  };

  const cerrarModalMedicamento = () => {
    setModalMedicamentoAbierto(false);
    setEditandoMedicamento(null);
    setFormMedicamento(medicamentoInicial);
  };

  const cerrarModalVacuna = () => {
    setModalVacunaAbierto(false);
    setEditandoVacuna(null);
    setFormVacuna(vacunaInicial);
  };

  const guardarMedicamento = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!formMedicamento.nombre.trim()) {
      setError("El nombre del medicamento es obligatorio.");
      return;
    }

    if (!editandoMedicamento && !formMedicamento.id?.trim()) {
      setError("El ID del medicamento es obligatorio.");
      return;
    }

    if (Number(formMedicamento.precioUnitario || 0) < 0) {
      setError("El precio unitario no puede ser negativo.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload: MedicamentoInput = {
        id: formMedicamento.id?.trim(),
        nombre: formMedicamento.nombre.trim(),
        descripcion: formMedicamento.descripcion?.trim() || null,
        precioUnitario: Number(formMedicamento.precioUnitario || 0),
      };

      if (editandoMedicamento) {
        await updateMedicamento(editandoMedicamento.id, payload);
      } else {
        await createMedicamento(payload);
      }

      await cargarDatos();
      cerrarModalMedicamento();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error guardando medicamento",
      );
    } finally {
      setSaving(false);
    }
  };

  const guardarVacuna = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formVacuna.nombre.trim()) {
      setError("El nombre de la vacuna es obligatorio.");
      return;
    }

    if (!editandoVacuna && !formVacuna.id?.trim()) {
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

      if (editandoVacuna) {
        await updateVacuna(editandoVacuna.id, payload);
      } else {
        await createVacuna(payload);
      }

      await cargarDatos();
      cerrarModalVacuna();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error guardando vacuna");
    } finally {
      setSaving(false);
    }
  };

  const eliminarMedicamento = async (medicamento: Medicamento) => {
    const confirmado = window.confirm(
      `¿Seguro que deseas eliminar el medicamento "${medicamento.nombre}"?`,
    );

    if (!confirmado) return;

    try {
      setError("");
      await deleteMedicamento(medicamento.id);
      await cargarDatos();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error eliminando medicamento",
      );
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
          <h1 className="text-2xl font-bold text-gray-900">
            Inventario médico
          </h1>
          <p className="text-gray-500 mt-1">
            Gestiona el stock de medicamentos y vacunas
          </p>
        </div>

        <Button onClick={abrirNuevoItem}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo item
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-600" />
              </div>

              <div>
                <p className="text-sm text-gray-500">Total medicamentos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {medicamentos.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-emerald-600" />
              </div>

              <div>
                <p className="text-sm text-gray-500">Total vacunas</p>
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
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-amber-600" />
              </div>

              <div>
                <p className="text-sm text-gray-500">Valor inventario</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatearDineroCorto(valorInventario)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("medicamentos")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "medicamentos"
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Medicamentos
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("vacunas")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "vacunas"
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Vacunas
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Medicamentos */}
      {activeTab === "medicamentos" && (
        <Card padding={false}>
          <CardHeader className="p-6 pb-4">
            <CardTitle>Catálogo de medicamentos</CardTitle>
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
                    Descripción
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio unitario
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
                      colSpan={5}
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      Cargando medicamentos...
                    </td>
                  </tr>
                ) : medicamentos.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      No hay medicamentos registrados.
                    </td>
                  </tr>
                ) : (
                  medicamentos.map((medicamento, index) => (
                    <tr key={medicamento.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{index + 1}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {medicamento.nombre}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatearVacio(medicamento.descripcion)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatearDinero(medicamento.precioUnitario)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => abrirEditarMedicamento(medicamento)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="Editar medicamento"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => eliminarMedicamento(medicamento)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Eliminar medicamento"
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
      )}

      {/* Vacunas */}
      {activeTab === "vacunas" && (
        <Card padding={false}>
          <CardHeader className="p-6 pb-4">
            <CardTitle>Catálogo de vacunas</CardTitle>
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
                      colSpan={7}
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      Cargando vacunas...
                    </td>
                  </tr>
                ) : vacunas.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      No hay vacunas registradas.
                    </td>
                  </tr>
                ) : (
                  vacunas.map((vacuna, index) => (
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

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatearVacio(vacuna.fechaVencimiento)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatearDinero(vacuna.precio)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => abrirEditarVacuna(vacuna)}
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal medicamento */}
      {modalMedicamentoAbierto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
            <form onSubmit={guardarMedicamento}>
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {editandoMedicamento
                      ? "Editar medicamento"
                      : "Nuevo medicamento"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Completa la información del medicamento
                  </p>
                </div>

                <button
                  type="button"
                  onClick={cerrarModalMedicamento}
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
                    value={formMedicamento.id || ""}
                    disabled={Boolean(editandoMedicamento)}
                    onChange={(event) =>
                      setFormMedicamento((prev) => ({
                        ...prev,
                        id: event.target.value,
                      }))
                    }
                    placeholder="MED001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio unitario
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={formMedicamento.precioUnitario}
                    onChange={(event) =>
                      setFormMedicamento((prev) => ({
                        ...prev,
                        precioUnitario: event.target.value,
                      }))
                    }
                    placeholder="15000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>

                  <input
                    type="text"
                    value={formMedicamento.nombre}
                    onChange={(event) =>
                      setFormMedicamento((prev) => ({
                        ...prev,
                        nombre: event.target.value,
                      }))
                    }
                    placeholder="Prednisolona"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>

                  <textarea
                    value={formMedicamento.descripcion || ""}
                    onChange={(event) =>
                      setFormMedicamento((prev) => ({
                        ...prev,
                        descripcion: event.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Antiinflamatorio corticoide"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={cerrarModalMedicamento}
                >
                  Cancelar
                </Button>

                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar medicamento"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal vacuna */}
      {modalVacunaAbierto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl">
            <form onSubmit={guardarVacuna}>
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {editandoVacuna ? "Editar vacuna" : "Nueva vacuna"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Completa la información de la vacuna
                  </p>
                </div>

                <button
                  type="button"
                  onClick={cerrarModalVacuna}
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
                    value={formVacuna.id || ""}
                    disabled={Boolean(editandoVacuna)}
                    onChange={(event) =>
                      setFormVacuna((prev) => ({
                        ...prev,
                        id: event.target.value,
                      }))
                    }
                    placeholder="VAC001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
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

                <div className="md:col-span-2">
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
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={cerrarModalVacuna}
                >
                  Cancelar
                </Button>

                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar vacuna"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
