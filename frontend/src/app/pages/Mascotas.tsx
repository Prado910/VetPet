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
  X,
  RefreshCw,
  Search,
  PawPrint,
} from "lucide-react";
import {
  Cliente,
  Mascota,
  MascotaInput,
  createMascota,
  deleteMascota,
  getClientes,
  getMascotas,
  updateMascota,
} from "../services/api";

type BadgeVariant = "success" | "warning" | "danger" | "default" | "info";

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

export function Mascotas() {
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [selectedMascotaId, setSelectedMascotaId] = useState<string | null>(
    null,
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState<MascotaInput>(estadoInicial);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError("");

      const [mascotasData, clientesData] = await Promise.all([
        getMascotas(),
        getClientes(),
      ]);

      setMascotas(mascotasData);
      setClientes(clientesData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar las mascotas.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const filteredMascotas = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return mascotas.filter((mascota) => {
      return (
        mascota.id.toLowerCase().includes(search) ||
        mascota.nombre.toLowerCase().includes(search) ||
        mascota.especie.toLowerCase().includes(search) ||
        (mascota.raza || "").toLowerCase().includes(search) ||
        (mascota.clienteNombre || "").toLowerCase().includes(search)
      );
    });
  }, [mascotas, searchTerm]);

  const mascotaSeleccionada = selectedMascotaId
    ? mascotas.find((mascota) => mascota.id === selectedMascotaId)
    : null;

  const getEstadoBadgeVariant = (estado?: string | null): BadgeVariant => {
    switch (estado) {
      case "SANA":
      case "RECUPERADA":
        return "success";
      case "EN_TRATAMIENTO":
        return "warning";
      case "ENFERMA":
        return "danger";
      default:
        return "default";
    }
  };

  const abrirNueva = () => {
    setEditingId(null);
    setForm(estadoInicial);
    setShowForm(true);
    setError("");
  };

  const abrirEdicion = (mascota: Mascota) => {
    setEditingId(mascota.id);
    setForm({
      id: mascota.id,
      clienteId: mascota.clienteId,
      nombre: mascota.nombre,
      fechaNacimiento: mascota.fechaNacimiento || "",
      sexo: mascota.sexo || "",
      peso: mascota.peso ?? "",
      especie: mascota.especie,
      raza: mascota.raza || "",
    });
    setShowForm(true);
    setError("");
  };

  const cerrarFormulario = () => {
    setEditingId(null);
    setForm(estadoInicial);
    setShowForm(false);
    setError("");
  };

  const handleChange = (field: keyof MascotaInput, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const guardarMascota = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!editingId && !form.id?.trim()) {
      setError("El código de la mascota es obligatorio. Ejemplo: MAS006");
      return;
    }

    if (!form.clienteId.trim()) {
      setError("Debes seleccionar un cliente.");
      return;
    }

    if (!form.nombre.trim()) {
      setError("El nombre de la mascota es obligatorio.");
      return;
    }

    if (!form.especie.trim()) {
      setError("La especie es obligatoria.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload: MascotaInput = {
        id: form.id?.trim(),
        clienteId: form.clienteId,
        nombre: form.nombre.trim(),
        fechaNacimiento: form.fechaNacimiento || null,
        sexo: form.sexo || null,
        peso: form.peso === "" ? null : Number(form.peso),
        especie: form.especie.trim(),
        raza: form.raza || null,
      };

      if (editingId) {
        await updateMascota(editingId, payload);
      } else {
        await createMascota(payload);
      }

      await cargarDatos();
      cerrarFormulario();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo guardar la mascota.",
      );
    } finally {
      setSaving(false);
    }
  };

  const eliminarMascota = async (mascota: Mascota) => {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar a ${mascota.nombre}?`,
    );

    if (!confirmar) return;

    try {
      setError("");
      await deleteMascota(mascota.id);
      await cargarDatos();

      if (selectedMascotaId === mascota.id) {
        setSelectedMascotaId(null);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo eliminar la mascota.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mascotas</h1>
          <p className="text-gray-500 mt-1">Gestiona el registro de mascotas</p>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={cargarDatos} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>

          <Button onClick={abrirNueva}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva mascota
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {editingId ? "Editar mascota" : "Nueva mascota"}
              </CardTitle>
              <button
                type="button"
                onClick={cerrarFormulario}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={guardarMascota}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <Input
                label="Código"
                placeholder="MAS006"
                value={form.id || ""}
                disabled={Boolean(editingId)}
                onChange={(e) => handleChange("id", e.target.value)}
              />

              <Input
                label="Nombre"
                placeholder="Nombre de la mascota"
                value={form.nombre}
                onChange={(e) => handleChange("nombre", e.target.value)}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente
                </label>
                <select
                  value={form.clienteId}
                  onChange={(e) => handleChange("clienteId", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Selecciona un cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre} - {cliente.id}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Fecha de nacimiento"
                type="date"
                value={form.fechaNacimiento || ""}
                onChange={(e) =>
                  handleChange("fechaNacimiento", e.target.value)
                }
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sexo
                </label>
                <select
                  value={form.sexo || ""}
                  onChange={(e) => handleChange("sexo", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Sin especificar</option>
                  <option value="M">Macho</option>
                  <option value="H">Hembra</option>
                </select>
              </div>

              <Input
                label="Peso"
                type="number"
                min="0"
                step="0.01"
                placeholder="10.5"
                value={form.peso ?? ""}
                onChange={(e) => handleChange("peso", e.target.value)}
              />

              <Input
                label="Especie"
                placeholder="PERRO, GATO..."
                value={form.especie}
                onChange={(e) => handleChange("especie", e.target.value)}
              />

              <Input
                label="Raza"
                placeholder="Labrador, Persa..."
                value={form.raza || ""}
                onChange={(e) => handleChange("raza", e.target.value)}
              />

              <div className="md:col-span-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={cerrarFormulario}
                >
                  Cancelar
                </Button>

                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código, nombre, especie, raza o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </CardContent>
      </Card>

      <Card padding={false}>
        <CardContent>
          {loading ? (
            <div className="p-6 text-center text-gray-500">
              Cargando mascotas...
            </div>
          ) : filteredMascotas.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No hay mascotas para mostrar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Especie</TableHead>
                  <TableHead>Raza</TableHead>
                  <TableHead>Edad</TableHead>
                  <TableHead>Peso</TableHead>
                  <TableHead>Estado salud</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredMascotas.map((mascota) => (
                  <TableRow key={mascota.id}>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {mascota.id}
                      </code>
                    </TableCell>

                    <TableCell className="font-medium text-gray-900">
                      {mascota.nombre}
                    </TableCell>

                    <TableCell className="text-gray-600">
                      {mascota.clienteNombre || mascota.clienteId}
                    </TableCell>

                    <TableCell>{mascota.especie}</TableCell>

                    <TableCell>{mascota.raza || "Sin raza"}</TableCell>

                    <TableCell>
                      {mascota.edad !== null && mascota.edad !== undefined
                        ? `${mascota.edad} años`
                        : "Sin fecha"}
                    </TableCell>

                    <TableCell>
                      {mascota.peso !== null && mascota.peso !== undefined
                        ? `${mascota.peso} kg`
                        : "Sin peso"}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={getEstadoBadgeVariant(mascota.estadoSalud)}
                      >
                        {mascota.estadoSalud || "SIN ESTADO"}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedMascotaId(mascota.id)}
                          className="p-1.5 text-gray-600 hover:bg-gray-50 rounded"
                          title="Ver detalle"
                        >
                          <PawPrint className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => abrirEdicion(mascota)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => eliminarMascota(mascota)}
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

      {selectedMascotaId && mascotaSeleccionada && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl border-l border-gray-200 overflow-y-auto z-50">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Detalles de mascota
              </h2>

              <button
                type="button"
                onClick={() => setSelectedMascotaId(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {mascotaSeleccionada.nombre}
                </h3>
                <p className="text-sm text-gray-500">
                  {mascotaSeleccionada.id}
                </p>
              </div>

              <Badge
                variant={getEstadoBadgeVariant(mascotaSeleccionada.estadoSalud)}
              >
                {mascotaSeleccionada.estadoSalud || "SIN ESTADO"}
              </Badge>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Cliente</p>
                  <p className="font-medium">
                    {mascotaSeleccionada.clienteNombre ||
                      mascotaSeleccionada.clienteId}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Especie</p>
                  <p className="font-medium">{mascotaSeleccionada.especie}</p>
                </div>

                <div>
                  <p className="text-gray-500">Raza</p>
                  <p className="font-medium">
                    {mascotaSeleccionada.raza || "Sin raza"}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Sexo</p>
                  <p className="font-medium">
                    {mascotaSeleccionada.sexo === "M"
                      ? "Macho"
                      : mascotaSeleccionada.sexo === "H"
                        ? "Hembra"
                        : "Sin especificar"}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Edad</p>
                  <p className="font-medium">
                    {mascotaSeleccionada.edad !== null &&
                    mascotaSeleccionada.edad !== undefined
                      ? `${mascotaSeleccionada.edad} años`
                      : "Sin fecha"}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Peso</p>
                  <p className="font-medium">
                    {mascotaSeleccionada.peso !== null &&
                    mascotaSeleccionada.peso !== undefined
                      ? `${mascotaSeleccionada.peso} kg`
                      : "Sin peso"}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => abrirEdicion(mascotaSeleccionada)}
                >
                  Editar
                </Button>

                <Button
                  variant="danger"
                  onClick={() => eliminarMascota(mascotaSeleccionada)}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
