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
  UserCog,
  Stethoscope,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import {
  Empleado,
  EmpleadoInput,
  EstadoLaboralEmpleado,
  TipoEmpleado,
  TurnoRecepcionista,
  createEmpleado,
  deleteEmpleado,
  getEmpleados,
  updateEmpleado,
} from "../services/api";

type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "default"
  | "purple";

const fechaHoy = () => new Date().toISOString().slice(0, 10);

const estadoInicial: EmpleadoInput = {
  id: "",
  nombre: "",
  telefono: "",
  fechaIngreso: fechaHoy(),
  estadoLaboral: "ACTIVO",
  tipoEmpleado: "VETERINARIO",
  salario: "",
  especialidad: "",
  nroMatricula: "",
  turno: "DIURNO",
};

export function Empleados() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState<"TODOS" | TipoEmpleado>("TODOS");
  const [form, setForm] = useState<EmpleadoInput>(estadoInicial);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const cargarEmpleados = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getEmpleados();
      setEmpleados(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los empleados.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEmpleados();
  }, []);

  const empleadosFiltrados = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return empleados.filter((empleado) => {
      const matchesSearch =
        empleado.id.toLowerCase().includes(search) ||
        empleado.nombre.toLowerCase().includes(search) ||
        (empleado.telefono || "").toLowerCase().includes(search) ||
        (empleado.especialidad || "").toLowerCase().includes(search) ||
        (empleado.nroMatricula || "").toLowerCase().includes(search) ||
        (empleado.turno || "").toLowerCase().includes(search);

      const matchesTipo =
        filterTipo === "TODOS" || empleado.tipoEmpleado === filterTipo;

      return matchesSearch && matchesTipo;
    });
  }, [empleados, searchTerm, filterTipo]);

  const veterinarios = empleados.filter(
    (empleado) => empleado.tipoEmpleado === "VETERINARIO",
  );

  const recepcionistas = empleados.filter(
    (empleado) => empleado.tipoEmpleado === "RECEPCIONISTA",
  );

  const getBadgeEstado = (estado: EstadoLaboralEmpleado): BadgeVariant => {
    switch (estado) {
      case "ACTIVO":
        return "success";
      case "INACTIVO":
        return "warning";
      case "SUSPENDIDO":
        return "danger";
      default:
        return "default";
    }
  };

  const abrirNuevo = () => {
    setEditingId(null);
    setForm({ ...estadoInicial, fechaIngreso: fechaHoy() });
    setShowForm(true);
    setError("");
  };

  const abrirEditar = (empleado: Empleado) => {
    setEditingId(empleado.id);
    setForm({
      id: empleado.id,
      nombre: empleado.nombre,
      telefono: empleado.telefono || "",
      fechaIngreso: empleado.fechaIngreso,
      estadoLaboral: empleado.estadoLaboral,
      tipoEmpleado: empleado.tipoEmpleado,
      salario: empleado.salario,
      especialidad: empleado.especialidad || "",
      nroMatricula: empleado.nroMatricula || "",
      turno: empleado.turno || "DIURNO",
    });
    setShowForm(true);
    setError("");
  };

  const cerrarFormulario = () => {
    setEditingId(null);
    setForm({ ...estadoInicial, fechaIngreso: fechaHoy() });
    setShowForm(false);
    setError("");
  };

  const validarFormulario = () => {
    if (!editingId && !form.id?.trim()) {
      return "El ID del empleado es obligatorio.";
    }

    if (!form.nombre.trim()) {
      return "El nombre del empleado es obligatorio.";
    }

    if (!form.fechaIngreso) {
      return "La fecha de ingreso es obligatoria.";
    }

    if (form.salario === "" || Number(form.salario) < 0) {
      return "El salario debe ser mayor o igual a cero.";
    }

    if (form.tipoEmpleado === "RECEPCIONISTA" && !form.turno) {
      return "El turno es obligatorio para recepcionistas.";
    }

    return null;
  };

  const limpiarPayload = (): EmpleadoInput => ({
    ...form,
    id: form.id?.trim(),
    nombre: form.nombre.trim(),
    telefono: form.telefono?.trim() || null,
    salario: Number(form.salario),
    especialidad:
      form.tipoEmpleado === "VETERINARIO"
        ? form.especialidad?.trim() || null
        : null,
    nroMatricula:
      form.tipoEmpleado === "VETERINARIO"
        ? form.nroMatricula?.trim() || null
        : null,
    turno:
      form.tipoEmpleado === "RECEPCIONISTA"
        ? (form.turno as TurnoRecepcionista)
        : null,
  });

  const guardarEmpleado = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errorFormulario = validarFormulario();
    if (errorFormulario) {
      setError(errorFormulario);
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = limpiarPayload();

      if (editingId) {
        await updateEmpleado(editingId, payload);
      } else {
        await createEmpleado(payload);
      }

      await cargarEmpleados();
      cerrarFormulario();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo guardar el empleado.",
      );
    } finally {
      setSaving(false);
    }
  };

  const eliminarEmpleado = async (empleado: Empleado) => {
    const confirmado = window.confirm(
      `¿Eliminar a ${empleado.nombre}? Si tiene citas o tratamientos relacionados, la base de datos bloqueará la eliminación.`,
    );

    if (!confirmado) return;

    try {
      setError("");
      await deleteEmpleado(empleado.id);
      await cargarEmpleados();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo eliminar el empleado.",
      );
    }
  };

  const actualizarCampo = <K extends keyof EmpleadoInput>(
    campo: K,
    valor: EmpleadoInput[K],
  ) => {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Empleados</h1>
          <p className="text-gray-500 mt-1">
            Gestiona veterinarios y recepcionistas conectados a Oracle
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={cargarEmpleados}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={abrirNuevo}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo empleado
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <UserCog className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total empleados</p>
                <p className="text-2xl font-bold text-gray-900">
                  {empleados.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Veterinarios</p>
                <p className="text-2xl font-bold text-gray-900">
                  {veterinarios.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <UserCog className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Recepcionistas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {recepcionistas.length}
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
                {editingId ? "Editar empleado" : "Agregar nuevo empleado"}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={cerrarFormulario}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={guardarEmpleado} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="ID del empleado"
                  value={form.id || ""}
                  onChange={(event) =>
                    actualizarCampo("id", event.target.value)
                  }
                  disabled={Boolean(editingId)}
                  placeholder="Ej: EMP006"
                />

                <Input
                  label="Nombre completo"
                  value={form.nombre}
                  onChange={(event) =>
                    actualizarCampo("nombre", event.target.value)
                  }
                  placeholder="Ej: Dra. Ana Gómez"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de empleado
                  </label>
                  <select
                    value={form.tipoEmpleado}
                    onChange={(event) =>
                      actualizarCampo(
                        "tipoEmpleado",
                        event.target.value as TipoEmpleado,
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="VETERINARIO">VETERINARIO</option>
                    <option value="RECEPCIONISTA">RECEPCIONISTA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado laboral
                  </label>
                  <select
                    value={form.estadoLaboral}
                    onChange={(event) =>
                      actualizarCampo(
                        "estadoLaboral",
                        event.target.value as EstadoLaboralEmpleado,
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="INACTIVO">INACTIVO</option>
                    <option value="SUSPENDIDO">SUSPENDIDO</option>
                  </select>
                </div>

                <Input
                  label="Teléfono"
                  value={form.telefono || ""}
                  onChange={(event) =>
                    actualizarCampo("telefono", event.target.value)
                  }
                  placeholder="Ej: 3005550000"
                />

                <Input
                  label="Fecha de ingreso"
                  type="date"
                  value={form.fechaIngreso}
                  onChange={(event) =>
                    actualizarCampo("fechaIngreso", event.target.value)
                  }
                />

                <Input
                  label="Salario"
                  type="number"
                  min="0"
                  value={form.salario}
                  onChange={(event) =>
                    actualizarCampo("salario", event.target.value)
                  }
                  placeholder="Ej: 3000000"
                />

                {form.tipoEmpleado === "VETERINARIO" ? (
                  <>
                    <Input
                      label="Especialidad"
                      value={form.especialidad || ""}
                      onChange={(event) =>
                        actualizarCampo("especialidad", event.target.value)
                      }
                      placeholder="Ej: Medicina interna"
                    />

                    <Input
                      label="Nro. matrícula"
                      value={form.nroMatricula || ""}
                      onChange={(event) =>
                        actualizarCampo("nroMatricula", event.target.value)
                      }
                      placeholder="Ej: MAT004"
                    />
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Turno
                    </label>
                    <select
                      value={form.turno || "DIURNO"}
                      onChange={(event) =>
                        actualizarCampo(
                          "turno",
                          event.target.value as TurnoRecepcionista,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="DIURNO">DIURNO</option>
                      <option value="NOCTURNO">NOCTURNO</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={cerrarFormulario}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar empleado"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle>Listado de empleados</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3 w-full lg:w-auto">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar por nombre, ID, teléfono, especialidad..."
                  className="w-full lg:w-80 pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <select
                value={filterTipo}
                onChange={(event) =>
                  setFilterTipo(event.target.value as "TODOS" | TipoEmpleado)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="TODOS">Todos los tipos</option>
                <option value="VETERINARIO">Veterinarios</option>
                <option value="RECEPCIONISTA">Recepcionistas</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-gray-500">
              Cargando empleados...
            </div>
          ) : empleadosFiltrados.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No hay empleados para mostrar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Dato específico</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Ingreso</TableHead>
                  <TableHead>Salario</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {empleadosFiltrados.map((empleado) => (
                  <TableRow key={empleado.id}>
                    <TableCell className="font-medium">{empleado.id}</TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {empleado.nombre}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          empleado.tipoEmpleado === "VETERINARIO"
                            ? "info"
                            : "purple"
                        }
                      >
                        {empleado.tipoEmpleado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {empleado.tipoEmpleado === "VETERINARIO" ? (
                        <div className="space-y-1">
                          <p>{empleado.especialidad || "Sin especialidad"}</p>
                          {empleado.nroMatricula && (
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {empleado.nroMatricula}
                            </code>
                          )}
                        </div>
                      ) : (
                        <Badge
                          variant={
                            empleado.turno === "NOCTURNO" ? "purple" : "warning"
                          }
                        >
                          {empleado.turno || "Sin turno"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {empleado.telefono || "-"}
                    </TableCell>
                    <TableCell>{empleado.fechaIngreso}</TableCell>
                    <TableCell className="font-medium text-emerald-700">
                      ${Number(empleado.salario || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getBadgeEstado(empleado.estadoLaboral)}>
                        {empleado.estadoLaboral}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => abrirEditar(empleado)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminarEmpleado(empleado)}
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
