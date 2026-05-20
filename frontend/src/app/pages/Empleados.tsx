import React, { useEffect, useMemo, useState } from "react";
import { Edit2, Plus, Stethoscope, Trash2, UserCog } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import type {
  Empleado,
  EmpleadoInput,
  EstadoLaboralEmpleado,
  TipoEmpleado,
  TurnoRecepcionista,
} from "../services/api";
import {
  createEmpleado,
  deleteEmpleado,
  getEmpleados,
  updateEmpleado,
} from "../services/api";

const fechaHoy = () => {
  const fecha = new Date();
  const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

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

function formatearDinero(valor: number | string | null | undefined) {
  return `$${Number(valor || 0).toLocaleString("es-CO")}`;
}

function formatearVacio(valor?: string | number | null) {
  if (valor === null || valor === undefined || valor === "") {
    return "Sin registrar";
  }

  return String(valor);
}

function getBadgeClassName(valor: string) {
  const texto = valor.toUpperCase();

  if (texto === "ACTIVO") {
    return "bg-emerald-100 text-emerald-700 border-emerald-300";
  }

  if (texto === "INACTIVO" || texto === "SUSPENDIDO") {
    return "bg-red-100 text-red-700 border-red-300";
  }

  if (texto === "DIURNO") {
    return "bg-amber-100 text-amber-700 border-amber-300";
  }

  if (texto === "NOCTURNO") {
    return "bg-purple-100 text-purple-700 border-purple-300";
  }

  return "bg-blue-100 text-blue-700 border-blue-300";
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

export function Empleados() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [form, setForm] = useState<EmpleadoInput>(estadoInicial);
  const [editando, setEditando] = useState<Empleado | null>(null);

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

  const veterinarios = useMemo(
    () =>
      empleados.filter((empleado) => empleado.tipoEmpleado === "VETERINARIO"),
    [empleados],
  );

  const recepcionistas = useMemo(
    () =>
      empleados.filter((empleado) => empleado.tipoEmpleado === "RECEPCIONISTA"),
    [empleados],
  );

  const abrirNuevoEmpleado = () => {
    setEditando(null);
    setForm({
      ...estadoInicial,
      fechaIngreso: fechaHoy(),
    });
    setError("");

    setTimeout(() => {
      document
        .getElementById("form-empleado")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const abrirEditarEmpleado = (empleado: Empleado) => {
    setEditando(empleado);
    setError("");

    setForm({
      id: empleado.id,
      nombre: empleado.nombre || "",
      telefono: empleado.telefono || "",
      fechaIngreso: empleado.fechaIngreso || fechaHoy(),
      estadoLaboral: empleado.estadoLaboral,
      tipoEmpleado: empleado.tipoEmpleado,
      salario: empleado.salario ?? "",
      especialidad: empleado.especialidad || "",
      nroMatricula: empleado.nroMatricula || "",
      turno: empleado.turno || "DIURNO",
    });

    setTimeout(() => {
      document
        .getElementById("form-empleado")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const limpiarFormulario = () => {
    setEditando(null);
    setForm({
      ...estadoInicial,
      fechaIngreso: fechaHoy(),
    });
    setError("");
  };

  const guardarEmpleado = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.nombre.trim()) {
      setError("El nombre completo es obligatorio.");
      return;
    }

    if (!editando && !form.id?.trim()) {
      setError("El ID del empleado es obligatorio.");
      return;
    }

    if (!form.tipoEmpleado) {
      setError("Selecciona el tipo de empleado.");
      return;
    }

    if (!form.fechaIngreso) {
      setError("La fecha de ingreso es obligatoria.");
      return;
    }

    if (Number(form.salario || 0) < 0) {
      setError("El salario no puede ser negativo.");
      return;
    }

    if (form.tipoEmpleado === "VETERINARIO" && !form.especialidad?.trim()) {
      setError("La especialidad es obligatoria para veterinarios.");
      return;
    }

    if (form.tipoEmpleado === "VETERINARIO" && !form.nroMatricula?.trim()) {
      setError("La matrícula es obligatoria para veterinarios.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload: EmpleadoInput = {
        id: editando ? editando.id : form.id?.trim(),
        nombre: form.nombre.trim(),
        telefono: form.telefono?.trim() || null,
        fechaIngreso: form.fechaIngreso,
        estadoLaboral: form.estadoLaboral,
        tipoEmpleado: form.tipoEmpleado,
        salario: Number(form.salario || 0),
        especialidad:
          form.tipoEmpleado === "VETERINARIO"
            ? form.especialidad?.trim() || null
            : null,
        nroMatricula:
          form.tipoEmpleado === "VETERINARIO"
            ? form.nroMatricula?.trim() || null
            : null,
        turno:
          form.tipoEmpleado === "RECEPCIONISTA" ? form.turno || "DIURNO" : null,
      };

      if (editando) {
        await updateEmpleado(editando.id, payload);
      } else {
        await createEmpleado(payload);
      }

      await cargarEmpleados();
      limpiarFormulario();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error guardando empleado");
    } finally {
      setSaving(false);
    }
  };

  const eliminarEmpleado = async (empleado: Empleado) => {
    const confirmado = window.confirm(
      `¿Seguro que deseas eliminar a ${empleado.nombre}?`,
    );

    if (!confirmado) return;

    try {
      setError("");
      await deleteEmpleado(empleado.id);

      if (editando?.id === empleado.id) {
        limpiarFormulario();
      }

      await cargarEmpleados();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error eliminando empleado",
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Empleados</h1>
          <p className="text-gray-500 mt-1">
            Gestiona el personal de la veterinaria
          </p>
        </div>

        <Button onClick={abrirNuevoEmpleado}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo empleado
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

      {/* Veterinarios */}
      <Card>
        <CardHeader>
          <CardTitle>Veterinarios</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre completo
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Especialidad
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Matrícula
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha ingreso
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Salario
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
                      colSpan={9}
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      Cargando veterinarios...
                    </td>
                  </tr>
                ) : veterinarios.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      No hay veterinarios registrados.
                    </td>
                  </tr>
                ) : (
                  veterinarios.map((empleado, index) => (
                    <tr key={empleado.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{index + 1}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {empleado.nombre}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge>{formatearVacio(empleado.especialidad)}</Badge>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {formatearVacio(empleado.nroMatricula)}
                        </code>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatearVacio(empleado.telefono)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatearVacio(empleado.fechaIngreso)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatearDinero(empleado.salario)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge>{empleado.estadoLaboral}</Badge>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => abrirEditarEmpleado(empleado)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="Editar empleado"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => eliminarEmpleado(empleado)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Eliminar empleado"
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
        </CardContent>
      </Card>

      {/* Recepcionistas */}
      <Card>
        <CardHeader>
          <CardTitle>Recepcionistas</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre completo
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Turno
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha ingreso
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Salario
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
                      Cargando recepcionistas...
                    </td>
                  </tr>
                ) : recepcionistas.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      No hay recepcionistas registrados.
                    </td>
                  </tr>
                ) : (
                  recepcionistas.map((empleado, index) => (
                    <tr key={empleado.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{index + 1 + veterinarios.length}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {empleado.nombre}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge>{formatearVacio(empleado.turno)}</Badge>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatearVacio(empleado.telefono)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatearVacio(empleado.fechaIngreso)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatearDinero(empleado.salario)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge>{empleado.estadoLaboral}</Badge>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => abrirEditarEmpleado(empleado)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="Editar empleado"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => eliminarEmpleado(empleado)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Eliminar empleado"
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
        </CardContent>
      </Card>

      {/* Formulario de empleado */}
      <div id="form-empleado">
        <Card>
          <CardHeader>
            <CardTitle>
              {editando ? "Editar empleado" : "Agregar nuevo empleado"}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={guardarEmpleado}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID
                  </label>

                  <input
                    type="text"
                    value={form.id || ""}
                    disabled={Boolean(editando)}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        id: event.target.value,
                      }))
                    }
                    placeholder="EMP001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado laboral
                  </label>

                  <select
                    value={form.estadoLaboral}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        estadoLaboral: event.target
                          .value as EstadoLaboralEmpleado,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="INACTIVO">INACTIVO</option>
                    <option value="SUSPENDIDO">SUSPENDIDO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre completo
                  </label>

                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        nombre: event.target.value,
                      }))
                    }
                    placeholder="Ej: Dr. Juan Pérez"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de empleado
                  </label>

                  <select
                    value={form.tipoEmpleado}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        tipoEmpleado: event.target.value as TipoEmpleado,
                        especialidad:
                          event.target.value === "VETERINARIO"
                            ? prev.especialidad
                            : "",
                        nroMatricula:
                          event.target.value === "VETERINARIO"
                            ? prev.nroMatricula
                            : "",
                        turno:
                          event.target.value === "RECEPCIONISTA"
                            ? prev.turno || "DIURNO"
                            : null,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="VETERINARIO">VETERINARIO</option>
                    <option value="RECEPCIONISTA">RECEPCIONISTA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>

                  <input
                    type="tel"
                    value={form.telefono || ""}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        telefono: event.target.value,
                      }))
                    }
                    placeholder="+56 9 1234 5678"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de ingreso
                  </label>

                  <input
                    type="date"
                    value={form.fechaIngreso || ""}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        fechaIngreso: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salario
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={form.salario ?? ""}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        salario: event.target.value,
                      }))
                    }
                    placeholder="800000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {form.tipoEmpleado === "VETERINARIO" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Especialidad
                      </label>

                      <input
                        type="text"
                        value={form.especialidad || ""}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            especialidad: event.target.value,
                          }))
                        }
                        placeholder="Ej: Medicina Interna"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Matrícula
                      </label>

                      <input
                        type="text"
                        value={form.nroMatricula || ""}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            nroMatricula: event.target.value,
                          }))
                        }
                        placeholder="VET-12345"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </>
                )}

                {form.tipoEmpleado === "RECEPCIONISTA" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Turno
                    </label>

                    <select
                      value={form.turno || "DIURNO"}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          turno: event.target.value as TurnoRecepcionista,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="DIURNO">DIURNO</option>
                      <option value="NOCTURNO">NOCTURNO</option>
                    </select>
                  </div>
                )}
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
                  {saving
                    ? "Guardando..."
                    : editando
                      ? "Guardar cambios"
                      : "Guardar empleado"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
