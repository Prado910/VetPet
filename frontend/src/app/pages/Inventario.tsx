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
  Package,
  RefreshCw,
  X,
  Search,
  Stethoscope,
  Pill,
} from "lucide-react";
import {
  ActivoServicio,
  Medicamento,
  MedicamentoInput,
  Servicio,
  ServicioInput,
  TipoServicio,
  createMedicamento,
  createServicio,
  deleteMedicamento,
  deleteServicio,
  getMedicamentos,
  getServicios,
  updateMedicamento,
  updateServicio,
} from "../services/api";

type TabInventario = "servicios" | "medicamentos";

const tiposServicio: TipoServicio[] = [
  "CONSULTA",
  "PROCEDIMIENTO",
  "TERAPIA",
  "VACUNACION",
  "PLAN_VACUNACION",
  "OTRO",
];

const servicioInicial: ServicioInput = {
  id: "",
  nombre: "",
  tipoServicio: "CONSULTA",
  precio: "",
  descripcion: "",
  activo: "S",
};

const medicamentoInicial: MedicamentoInput = {
  id: "",
  nombre: "",
  descripcion: "",
  precioUnitario: "",
};

function formatoMoneda(valor: number | string | null | undefined) {
  const numero = Number(valor || 0);

  return `$${numero.toLocaleString("es-CO")}`;
}

function getActivoBadgeVariant(activo: ActivoServicio) {
  return activo === "S" ? "success" : "warning";
}

export function Inventario() {
  const [activeTab, setActiveTab] = useState<TabInventario>("servicios");

  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);

  const [formServicio, setFormServicio] =
    useState<ServicioInput>(servicioInicial);
  const [formMedicamento, setFormMedicamento] =
    useState<MedicamentoInput>(medicamentoInicial);

  const [editingServicioId, setEditingServicioId] = useState<string | null>(
    null,
  );
  const [editingMedicamentoId, setEditingMedicamentoId] = useState<
    string | null
  >(null);

  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipoServicio, setFilterTipoServicio] = useState<
    "TODOS" | TipoServicio
  >("TODOS");
  const [filterActivoServicio, setFilterActivoServicio] = useState<
    "TODOS" | ActivoServicio
  >("TODOS");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError("");

      const [serviciosData, medicamentosData] = await Promise.all([
        getServicios(),
        getMedicamentos(),
      ]);

      setServicios(serviciosData);
      setMedicamentos(medicamentosData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo cargar el inventario.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const serviciosFiltrados = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return servicios.filter((servicio) => {
      const matchesSearch =
        servicio.id.toLowerCase().includes(search) ||
        servicio.nombre.toLowerCase().includes(search) ||
        servicio.tipoServicio.toLowerCase().includes(search) ||
        (servicio.descripcion || "").toLowerCase().includes(search);

      const matchesTipo =
        filterTipoServicio === "TODOS" ||
        servicio.tipoServicio === filterTipoServicio;

      const matchesActivo =
        filterActivoServicio === "TODOS" ||
        servicio.activo === filterActivoServicio;

      return matchesSearch && matchesTipo && matchesActivo;
    });
  }, [servicios, searchTerm, filterTipoServicio, filterActivoServicio]);

  const medicamentosFiltrados = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return medicamentos.filter((medicamento) => {
      return (
        medicamento.id.toLowerCase().includes(search) ||
        medicamento.nombre.toLowerCase().includes(search) ||
        (medicamento.descripcion || "").toLowerCase().includes(search)
      );
    });
  }, [medicamentos, searchTerm]);

  const serviciosActivos = servicios.filter(
    (servicio) => servicio.activo === "S",
  );

  const abrirNuevo = (tab: TabInventario = activeTab) => {
    setActiveTab(tab);
    setShowForm(true);
    setError("");

    if (tab === "servicios") {
      setEditingServicioId(null);
      setFormServicio(servicioInicial);
    } else {
      setEditingMedicamentoId(null);
      setFormMedicamento(medicamentoInicial);
    }
  };

  const cancelarFormulario = () => {
    setShowForm(false);
    setEditingServicioId(null);
    setEditingMedicamentoId(null);
    setFormServicio(servicioInicial);
    setFormMedicamento(medicamentoInicial);
    setError("");
  };

  const iniciarEdicionServicio = (servicio: Servicio) => {
    setActiveTab("servicios");
    setShowForm(true);
    setEditingServicioId(servicio.id);
    setEditingMedicamentoId(null);
    setError("");

    setFormServicio({
      id: servicio.id,
      nombre: servicio.nombre,
      tipoServicio: servicio.tipoServicio,
      precio: servicio.precio,
      descripcion: servicio.descripcion || "",
      activo: servicio.activo,
    });
  };

  const iniciarEdicionMedicamento = (medicamento: Medicamento) => {
    setActiveTab("medicamentos");
    setShowForm(true);
    setEditingMedicamentoId(medicamento.id);
    setEditingServicioId(null);
    setError("");

    setFormMedicamento({
      id: medicamento.id,
      nombre: medicamento.nombre,
      descripcion: medicamento.descripcion || "",
      precioUnitario: medicamento.precioUnitario,
    });
  };

  const guardarServicio = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formServicio.nombre.trim()) {
      setError("El nombre del servicio es obligatorio.");
      return;
    }

    if (Number(formServicio.precio) < 0) {
      setError("El precio del servicio no puede ser negativo.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload: ServicioInput = {
        ...formServicio,
        id: formServicio.id?.trim(),
        nombre: formServicio.nombre.trim(),
        descripcion: formServicio.descripcion?.trim() || null,
        precio: Number(formServicio.precio || 0),
      };

      if (editingServicioId) {
        await updateServicio(editingServicioId, payload);
      } else {
        if (!payload.id) {
          setError("El ID del servicio es obligatorio.");
          return;
        }

        await createServicio(payload);
      }

      await cargarDatos();
      cancelarFormulario();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo guardar el servicio.",
      );
    } finally {
      setSaving(false);
    }
  };

  const guardarMedicamento = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formMedicamento.nombre.trim()) {
      setError("El nombre del medicamento es obligatorio.");
      return;
    }

    if (Number(formMedicamento.precioUnitario) < 0) {
      setError("El precio unitario no puede ser negativo.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload: MedicamentoInput = {
        ...formMedicamento,
        id: formMedicamento.id?.trim(),
        nombre: formMedicamento.nombre.trim(),
        descripcion: formMedicamento.descripcion?.trim() || null,
        precioUnitario: Number(formMedicamento.precioUnitario || 0),
      };

      if (editingMedicamentoId) {
        await updateMedicamento(editingMedicamentoId, payload);
      } else {
        if (!payload.id) {
          setError("El ID del medicamento es obligatorio.");
          return;
        }

        await createMedicamento(payload);
      }

      await cargarDatos();
      cancelarFormulario();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar el medicamento.",
      );
    } finally {
      setSaving(false);
    }
  };

  const eliminarServicio = async (servicio: Servicio) => {
    const confirmado = window.confirm(
      `¿Eliminar el servicio "${servicio.nombre}"?`,
    );

    if (!confirmado) return;

    try {
      setError("");
      await deleteServicio(servicio.id);
      await cargarDatos();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo eliminar el servicio.",
      );
    }
  };

  const eliminarMedicamento = async (medicamento: Medicamento) => {
    const confirmado = window.confirm(
      `¿Eliminar el medicamento "${medicamento.nombre}"?`,
    );

    if (!confirmado) return;

    try {
      setError("");
      await deleteMedicamento(medicamento.id);
      await cargarDatos();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo eliminar el medicamento.",
      );
    }
  };

  const renderFormulario = () => {
    if (!showForm) return null;

    if (activeTab === "servicios") {
      return (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {editingServicioId ? "Editar servicio" : "Nuevo servicio"}
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
            <form onSubmit={guardarServicio} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID
                  </label>
                  <Input
                    value={formServicio.id || ""}
                    disabled={Boolean(editingServicioId)}
                    onChange={(event) =>
                      setFormServicio((prev) => ({
                        ...prev,
                        id: event.target.value,
                      }))
                    }
                    placeholder="SVC006"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <Input
                    value={formServicio.nombre}
                    onChange={(event) =>
                      setFormServicio((prev) => ({
                        ...prev,
                        nombre: event.target.value,
                      }))
                    }
                    placeholder="Consulta general"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={formServicio.tipoServicio}
                    onChange={(event) =>
                      setFormServicio((prev) => ({
                        ...prev,
                        tipoServicio: event.target.value as TipoServicio,
                      }))
                    }
                    className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white"
                  >
                    {tiposServicio.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formServicio.precio}
                    onChange={(event) =>
                      setFormServicio((prev) => ({
                        ...prev,
                        precio: event.target.value,
                      }))
                    }
                    placeholder="50000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <Input
                    value={formServicio.descripcion || ""}
                    onChange={(event) =>
                      setFormServicio((prev) => ({
                        ...prev,
                        descripcion: event.target.value,
                      }))
                    }
                    placeholder="Descripción del servicio"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Activo
                  </label>
                  <select
                    value={formServicio.activo}
                    onChange={(event) =>
                      setFormServicio((prev) => ({
                        ...prev,
                        activo: event.target.value as ActivoServicio,
                      }))
                    }
                    className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white"
                  >
                    <option value="S">Sí</option>
                    <option value="N">No</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar servicio"}
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
    }

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {editingMedicamentoId
                ? "Editar medicamento"
                : "Nuevo medicamento"}
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
          <form onSubmit={guardarMedicamento} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID
                </label>
                <Input
                  value={formMedicamento.id || ""}
                  disabled={Boolean(editingMedicamentoId)}
                  onChange={(event) =>
                    setFormMedicamento((prev) => ({
                      ...prev,
                      id: event.target.value,
                    }))
                  }
                  placeholder="MED006"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <Input
                  value={formMedicamento.nombre}
                  onChange={(event) =>
                    setFormMedicamento((prev) => ({
                      ...prev,
                      nombre: event.target.value,
                    }))
                  }
                  placeholder="Amoxicilina"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio unitario
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formMedicamento.precioUnitario}
                  onChange={(event) =>
                    setFormMedicamento((prev) => ({
                      ...prev,
                      precioUnitario: event.target.value,
                    }))
                  }
                  placeholder="25000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <Input
                value={formMedicamento.descripcion || ""}
                onChange={(event) =>
                  setFormMedicamento((prev) => ({
                    ...prev,
                    descripcion: event.target.value,
                  }))
                }
                placeholder="Descripción del medicamento"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar medicamento"}
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
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Inventario médico
          </h1>
          <p className="text-gray-500 mt-1">
            Gestiona servicios clínicos y medicamentos reales desde Oracle
          </p>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={cargarDatos}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>

          <Button type="button" onClick={() => abrirNuevo(activeTab)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total servicios</p>
                <p className="text-2xl font-bold text-gray-900">
                  {servicios.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Servicios activos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {serviciosActivos.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Pill className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Medicamentos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {medicamentos.length}
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
                onClick={() => {
                  setActiveTab("servicios");
                  cancelarFormulario();
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeTab === "servicios"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Servicios
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("medicamentos");
                  cancelarFormulario();
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeTab === "medicamentos"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Medicamentos
              </button>
            </div>

            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={
                    activeTab === "servicios"
                      ? "Buscar servicio por ID, nombre, tipo o descripción..."
                      : "Buscar medicamento por ID, nombre o descripción..."
                  }
                  className="pl-10"
                />
              </div>
            </div>

            {activeTab === "servicios" && (
              <div className="flex flex-wrap gap-2">
                <select
                  value={filterTipoServicio}
                  onChange={(event) =>
                    setFilterTipoServicio(
                      event.target.value as "TODOS" | TipoServicio,
                    )
                  }
                  className="h-10 px-3 border border-gray-300 rounded-md bg-white text-sm"
                >
                  <option value="TODOS">Todos los tipos</option>
                  {tiposServicio.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>

                <select
                  value={filterActivoServicio}
                  onChange={(event) =>
                    setFilterActivoServicio(
                      event.target.value as "TODOS" | ActivoServicio,
                    )
                  }
                  className="h-10 px-3 border border-gray-300 rounded-md bg-white text-sm"
                >
                  <option value="TODOS">Todos</option>
                  <option value="S">Activos</option>
                  <option value="N">Inactivos</option>
                </select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {renderFormulario()}

      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === "servicios"
              ? "Catálogo de servicios"
              : "Catálogo de medicamentos"}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-gray-500">
              Cargando inventario...
            </div>
          ) : activeTab === "servicios" ? (
            serviciosFiltrados.length === 0 ? (
              <div className="py-10 text-center text-gray-500">
                No hay servicios para mostrar.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Activo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {serviciosFiltrados.map((servicio) => (
                    <TableRow key={servicio.id}>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {servicio.id}
                        </code>
                      </TableCell>

                      <TableCell className="font-medium">
                        {servicio.nombre}
                      </TableCell>

                      <TableCell>
                        <Badge variant="info">{servicio.tipoServicio}</Badge>
                      </TableCell>

                      <TableCell className="font-medium text-emerald-700">
                        {formatoMoneda(servicio.precio)}
                      </TableCell>

                      <TableCell>
                        <Badge variant={getActivoBadgeVariant(servicio.activo)}>
                          {servicio.activo === "S" ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-gray-600 max-w-xs truncate">
                        {servicio.descripcion || "Sin descripción"}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => iniciarEdicionServicio(servicio)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => eliminarServicio(servicio)}
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
          ) : medicamentosFiltrados.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              No hay medicamentos para mostrar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Precio unitario</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {medicamentosFiltrados.map((medicamento) => (
                  <TableRow key={medicamento.id}>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {medicamento.id}
                      </code>
                    </TableCell>

                    <TableCell className="font-medium">
                      {medicamento.nombre}
                    </TableCell>

                    <TableCell className="text-gray-600 max-w-md truncate">
                      {medicamento.descripcion || "Sin descripción"}
                    </TableCell>

                    <TableCell className="font-medium text-emerald-700">
                      {formatoMoneda(medicamento.precioUnitario)}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => iniciarEdicionMedicamento(medicamento)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => eliminarMedicamento(medicamento)}
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
