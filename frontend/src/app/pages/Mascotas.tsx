import React, { useEffect, useMemo, useState } from "react";
import { Edit2, Eye, Plus, Trash2, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import type {
  AplicacionVacuna,
  Cita,
  Cliente,
  Mascota,
  MascotaInput,
  Tratamiento,
} from "../services/api";
import {
  createMascota,
  deleteMascota,
  getAplicacionesVacunas,
  getCitas,
  getClientes,
  getMascotas,
  getTratamientos,
  updateMascota,
} from "../services/api";

const estadoInicial: MascotaInput = {
  id: "",
  clienteId: "",
  nombre: "",
  fechaNacimiento: "",
  sexo: "",
  peso: "",
  especie: "",
  raza: "",
};

function normalizarTexto(valor?: string | null) {
  return valor?.trim() || "";
}

function formatearVacio(valor?: string | number | null) {
  if (valor === null || valor === undefined || valor === "") {
    return "Sin registrar";
  }

  return String(valor);
}

function formatearSexo(sexo?: "M" | "H" | null | "") {
  if (sexo === "M") return "Macho";
  if (sexo === "H") return "Hembra";
  return "Sin registrar";
}

function calcularEdad(mascota: Mascota) {
  if (typeof mascota.edad === "number") {
    return `${mascota.edad} años`;
  }

  if (!mascota.fechaNacimiento) {
    return "Sin fecha";
  }

  const nacimiento = new Date(mascota.fechaNacimiento);
  const hoy = new Date();

  if (Number.isNaN(nacimiento.getTime())) {
    return "Sin fecha";
  }

  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();

  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad -= 1;
  }

  return `${Math.max(edad, 0)} años`;
}

function getEstadoSalud(mascota?: Mascota | null) {
  return normalizarTexto(mascota?.estadoSalud) || "Sin estado";
}

function getEstadoClassName(estado: string) {
  const normalizado = estado.toLowerCase();

  if (normalizado.includes("saludable")) {
    return "bg-emerald-100 text-emerald-700 border-emerald-300";
  }

  if (
    normalizado.includes("tratamiento") ||
    normalizado.includes("observacion") ||
    normalizado.includes("observación")
  ) {
    return "bg-amber-100 text-amber-700 border-amber-300";
  }

  if (
    normalizado.includes("critico") ||
    normalizado.includes("crítico") ||
    normalizado.includes("grave")
  ) {
    return "bg-red-100 text-red-700 border-red-300";
  }

  if (
    normalizado.includes("confirmada") ||
    normalizado.includes("programada") ||
    normalizado.includes("atendida")
  ) {
    return "bg-blue-100 text-blue-700 border-blue-300";
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
  const texto = String(children);

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${getEstadoClassName(
        texto,
      )} ${size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"}`}
    >
      {children}
    </span>
  );
}

function coincideMascotaTratamiento(
  tratamiento: Tratamiento,
  mascota: Mascota | null,
) {
  if (!mascota) return false;

  const tratamientoExtendido = tratamiento as Tratamiento & {
    mascotaId?: string;
    codigoMascota?: string;
  };

  if (
    tratamientoExtendido.mascotaId === mascota.id ||
    tratamientoExtendido.codigoMascota === mascota.id
  ) {
    return true;
  }

  return (
    tratamiento.mascotaNombre === mascota.nombre &&
    tratamiento.mascotaEspecie === mascota.especie &&
    tratamiento.clienteNombre === mascota.clienteNombre
  );
}

export function Mascotas() {
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [aplicacionesVacunas, setAplicacionesVacunas] = useState<
    AplicacionVacuna[]
  >([]);
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);

  const [selectedMascotaId, setSelectedMascotaId] = useState<string | null>(
    null,
  );
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Mascota | null>(null);
  const [form, setForm] = useState<MascotaInput>(estadoInicial);

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        mascotasData,
        clientesData,
        citasData,
        aplicacionesData,
        tratamientosData,
      ] = await Promise.all([
        getMascotas(),
        getClientes(),
        getCitas(),
        getAplicacionesVacunas(),
        getTratamientos(),
      ]);

      setMascotas(mascotasData);
      setClientes(clientesData);
      setCitas(citasData);
      setAplicacionesVacunas(aplicacionesData);
      setTratamientos(tratamientosData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando mascotas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const selectedMascota = useMemo(
    () =>
      selectedMascotaId
        ? mascotas.find((mascota) => mascota.id === selectedMascotaId) || null
        : null,
    [mascotas, selectedMascotaId],
  );

  const clienteSeleccionado = useMemo(() => {
    if (!selectedMascota) return null;

    return (
      clientes.find((cliente) => cliente.id === selectedMascota.clienteId) ||
      null
    );
  }, [clientes, selectedMascota]);

  const citasMascota = useMemo(() => {
    if (!selectedMascota) return [];

    return citas
      .filter((cita) => cita.mascotaId === selectedMascota.id)
      .sort((a, b) =>
        `${b.fecha} ${b.hora}`.localeCompare(`${a.fecha} ${a.hora}`),
      );
  }, [citas, selectedMascota]);

  const vacunasMascota = useMemo(() => {
    if (!selectedMascota) return [];

    return aplicacionesVacunas
      .filter((aplicacion) => aplicacion.codigoMascota === selectedMascota.id)
      .sort((a, b) => b.fechaAplicacion.localeCompare(a.fechaAplicacion));
  }, [aplicacionesVacunas, selectedMascota]);

  const tratamientosMascota = useMemo(() => {
    if (!selectedMascota) return [];

    return tratamientos.filter(
      (tratamiento) =>
        tratamiento.estado === "ACTIVO" &&
        coincideMascotaTratamiento(tratamiento, selectedMascota),
    );
  }, [tratamientos, selectedMascota]);

  const abrirCrear = () => {
    setEditando(null);
    setForm(estadoInicial);
    setModalAbierto(true);
  };

  const abrirEditar = (mascota: Mascota) => {
    setEditando(mascota);
    setForm({
      id: mascota.id,
      clienteId: mascota.clienteId,
      nombre: mascota.nombre || "",
      fechaNacimiento: mascota.fechaNacimiento || "",
      sexo: mascota.sexo || "",
      peso: mascota.peso ?? "",
      especie: mascota.especie || "",
      raza: mascota.raza || "",
    });
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEditando(null);
    setForm(estadoInicial);
  };

  const guardarMascota = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.nombre?.trim()) {
      setError("El nombre de la mascota es obligatorio.");
      return;
    }

    if (!form.clienteId?.trim()) {
      setError("El dueño de la mascota es obligatorio.");
      return;
    }

    if (!form.especie?.trim()) {
      setError("La especie de la mascota es obligatoria.");
      return;
    }

    if (!editando && !form.id?.trim()) {
      setError("El código de la mascota es obligatorio.");
      return;
    }

    try {
      setGuardando(true);
      setError("");

      const payload: MascotaInput = {
        id: form.id?.trim(),
        clienteId: form.clienteId.trim(),
        nombre: form.nombre.trim(),
        fechaNacimiento: form.fechaNacimiento || null,
        sexo: form.sexo || null,
        peso: form.peso === "" ? null : form.peso,
        especie: form.especie.trim(),
        raza: form.raza?.trim() || null,
      };

      if (editando) {
        await updateMascota(editando.id, {
          ...payload,
          id: editando.id,
        });
      } else {
        await createMascota(payload);
      }

      await cargarDatos();
      cerrarModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error guardando mascota");
    } finally {
      setGuardando(false);
    }
  };

  const eliminarMascota = async (mascota: Mascota) => {
    const confirmado = window.confirm(
      `¿Seguro que deseas eliminar a ${mascota.nombre}?`,
    );

    if (!confirmado) return;

    try {
      setError("");
      await deleteMascota(mascota.id);

      if (selectedMascotaId === mascota.id) {
        setSelectedMascotaId(null);
      }

      await cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error eliminando mascota");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mascotas</h1>
          <p className="text-gray-500 mt-1">Gestiona el registro de mascotas</p>
        </div>

        <Button onClick={abrirCrear}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva mascota
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dueño
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Especie / Raza
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Edad
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sexo
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Peso
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado de salud
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
                    Cargando mascotas...
                  </td>
                </tr>
              ) : mascotas.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    No hay mascotas registradas.
                  </td>
                </tr>
              ) : (
                mascotas.map((mascota) => (
                  <tr
                    key={mascota.id}
                    onClick={() => setSelectedMascotaId(mascota.id)}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {mascota.id}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {mascota.nombre}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatearVacio(mascota.clienteNombre)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {mascota.especie}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatearVacio(mascota.raza)}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {calcularEdad(mascota)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatearSexo(mascota.sexo)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {mascota.peso !== null && mascota.peso !== undefined
                        ? `${mascota.peso} kg`
                        : "Sin registrar"}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge>{getEstadoSalud(mascota)}</Badge>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedMascotaId(mascota.id);
                          }}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            abrirEditar(mascota);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Editar mascota"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            eliminarMascota(mascota);
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="Eliminar mascota"
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

      {/* Detail Panel */}
      {selectedMascota && (
        <div className="fixed inset-y-0 right-0 w-[500px] bg-white shadow-xl border-l border-gray-200 overflow-y-auto z-50">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Detalles de la mascota
              </h2>

              <button
                type="button"
                onClick={() => setSelectedMascotaId(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{selectedMascota.nombre}</CardTitle>
                    <Badge>{getEstadoSalud(selectedMascota)}</Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Código</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedMascota.id}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Especie</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedMascota.especie}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Raza</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatearVacio(selectedMascota.raza)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Sexo</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatearSexo(selectedMascota.sexo)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">
                        Fecha de nacimiento
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatearVacio(selectedMascota.fechaNacimiento)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Peso</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedMascota.peso !== null &&
                        selectedMascota.peso !== undefined
                          ? `${selectedMascota.peso} kg`
                          : "Sin registrar"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Owner */}
              <Card>
                <CardHeader>
                  <CardTitle>Dueño</CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="space-y-2">
                    <p className="font-medium text-gray-900">
                      {clienteSeleccionado?.nombre ||
                        selectedMascota.clienteNombre ||
                        "Sin registrar"}
                    </p>

                    <p className="text-sm text-gray-600">
                      {formatearVacio(clienteSeleccionado?.email)}
                    </p>

                    <p className="text-sm text-gray-600">
                      {formatearVacio(clienteSeleccionado?.telefono)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Citas */}
              <Card>
                <CardHeader>
                  <CardTitle>Citas ({citasMascota.length})</CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="space-y-2">
                    {citasMascota.map((cita) => (
                      <div key={cita.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">
                              {cita.fecha} - {cita.hora}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatearVacio(cita.motivo)}
                            </p>
                          </div>

                          <Badge size="sm">{cita.estado}</Badge>
                        </div>
                      </div>
                    ))}

                    {citasMascota.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No hay citas registradas
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Vacunas */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    Vacunas aplicadas ({vacunasMascota.length})
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="space-y-2">
                    {vacunasMascota.map((aplicacion) => (
                      <div
                        key={aplicacion.id}
                        className="p-3 bg-emerald-50 rounded-lg border border-emerald-200"
                      >
                        <p className="text-sm font-medium text-emerald-900">
                          {aplicacion.vacunaNombre}
                        </p>
                        <p className="text-xs text-emerald-700">
                          {aplicacion.fechaAplicacion}
                        </p>

                        {aplicacion.observacion && (
                          <p className="text-xs text-gray-600 mt-1">
                            {aplicacion.observacion}
                          </p>
                        )}
                      </div>
                    ))}

                    {vacunasMascota.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No hay vacunas aplicadas
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Tratamientos activos */}
              <Card>
                <CardHeader>
                  <CardTitle>Tratamientos activos</CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="space-y-2">
                    {tratamientosMascota.map((tratamiento) => (
                      <div
                        key={tratamiento.id}
                        className="p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {tratamiento.tipo}
                            </p>
                            <p className="text-xs text-gray-500">
                              Inicio: {tratamiento.fechaInicio}
                            </p>
                            {tratamiento.indicaciones && (
                              <p className="text-xs text-gray-600 mt-1">
                                {tratamiento.indicaciones}
                              </p>
                            )}
                          </div>

                          <Badge size="sm">
                            {tratamiento.estado || "ACTIVO"}
                          </Badge>
                        </div>
                      </div>
                    ))}

                    {tratamientosMascota.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No hay tratamientos activos
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => abrirEditar(selectedMascota)}
                >
                  Editar mascota
                </Button>

                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => eliminarMascota(selectedMascota)}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear / Editar */}
      {modalAbierto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
            <form onSubmit={guardarMascota}>
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {editando ? "Editar mascota" : "Nueva mascota"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Completa la información de la mascota
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
                    Código
                  </label>

                  <input
                    type="text"
                    value={form.id || ""}
                    disabled={Boolean(editando)}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, id: event.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
                    placeholder="M001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dueño
                  </label>

                  <select
                    value={form.clienteId}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        clienteId: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Selecciona un cliente</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Firulais"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Especie
                  </label>

                  <input
                    type="text"
                    value={form.especie}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        especie: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Perro"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Raza
                  </label>

                  <input
                    type="text"
                    value={form.raza || ""}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        raza: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Labrador"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de nacimiento
                  </label>

                  <input
                    type="date"
                    value={form.fechaNacimiento || ""}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        fechaNacimiento: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sexo
                  </label>

                  <select
                    value={form.sexo || ""}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        sexo: event.target.value as MascotaInput["sexo"],
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Sin registrar</option>
                    <option value="M">Macho</option>
                    <option value="H">Hembra</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Peso
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.peso ?? ""}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        peso: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="28.5"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
                <Button type="button" variant="secondary" onClick={cerrarModal}>
                  Cancelar
                </Button>

                <Button type="submit" disabled={guardando}>
                  {guardando ? "Guardando..." : "Guardar mascota"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
