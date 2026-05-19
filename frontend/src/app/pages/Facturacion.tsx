import React, { useEffect, useMemo, useState } from "react";
import {
  CreditCard,
  DollarSign,
  Edit2,
  Eye,
  FileText,
  Plus,
  RefreshCw,
  Search,
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
  CatalogoFacturaConsulta,
  CatalogosFacturas,
  EstadoPago,
  Factura,
  FacturaDetalle,
  FacturaDetalleInput,
  FacturaInput,
  TipoConceptoFactura,
  createFactura,
  createFacturaDetalle,
  deleteFactura,
  deleteFacturaDetalle,
  getCatalogosFacturas,
  getFacturaDetalles,
  getFacturas,
  recalcularFactura,
  updateFactura,
  updateFacturaDetalle,
} from "../services/api";

function obtenerFechaLocal() {
  const fecha = new Date();
  const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function formatoDinero(valor: number | string | null | undefined) {
  return `$${Number(valor || 0).toLocaleString()}`;
}

const facturaInicial: FacturaInput = {
  idConsulta: "",
  fecha: obtenerFechaLocal(),
  metodoPago: "",
  estadoPago: "PENDIENTE",
  crearDetalleConsulta: true,
};

const detalleInicial: FacturaDetalleInput = {
  descripcion: "",
  tipoConcepto: "OTRO",
  cantidad: 1,
  precioUnitario: 0,
};

const estadosPago: EstadoPago[] = ["PENDIENTE", "PAGADA", "ANULADA"];

const tiposConcepto: TipoConceptoFactura[] = [
  "CONSULTA",
  "MEDICAMENTO",
  "VACUNA",
  "PROCEDIMIENTO",
  "OTRO",
];

export function Facturacion() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [catalogos, setCatalogos] = useState<CatalogosFacturas>({
    consultasDisponibles: [],
  });

  const [facturaForm, setFacturaForm] = useState<FacturaInput>(facturaInicial);
  const [detalleForm, setDetalleForm] =
    useState<FacturaDetalleInput>(detalleInicial);

  const [editingFacturaId, setEditingFacturaId] = useState<string | null>(null);
  const [editingDetalleId, setEditingDetalleId] = useState<string | null>(null);

  const [showFacturaForm, setShowFacturaForm] = useState(false);
  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null);
  const [detalles, setDetalles] = useState<FacturaDetalle[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingFactura, setSavingFactura] = useState(false);
  const [savingDetalle, setSavingDetalle] = useState(false);
  const [error, setError] = useState("");

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError("");

      const [facturasData, catalogosData] = await Promise.all([
        getFacturas(),
        getCatalogosFacturas(),
      ]);

      setFacturas(facturasData);
      setCatalogos(catalogosData);

      setSelectedFactura((actual) => {
        if (!actual) return actual;
        return facturasData.find((factura) => factura.id === actual.id) || null;
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error cargando facturación",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const facturaEditando = useMemo(() => {
    if (!editingFacturaId) return null;
    return facturas.find((factura) => factura.id === editingFacturaId) || null;
  }, [editingFacturaId, facturas]);

  const consultasParaSelect = useMemo(() => {
    const consultas = [...catalogos.consultasDisponibles];

    if (facturaEditando) {
      const existe = consultas.some(
        (consulta) => consulta.id === facturaEditando.idConsulta,
      );

      if (!existe) {
        const consultaActual: CatalogoFacturaConsulta = {
          id: facturaEditando.idConsulta,
          idCita: facturaEditando.idCita,
          fechaAtencionReal: facturaEditando.fechaAtencionReal,
          clienteId: facturaEditando.idCliente,
          clienteNombre: facturaEditando.clienteNombre,
          clienteTelefono: facturaEditando.clienteTelefono,
          mascotaId: facturaEditando.mascotaId,
          mascotaNombre: facturaEditando.mascotaNombre,
          mascotaEspecie: facturaEditando.mascotaEspecie,
          servicioId: "",
          servicioNombre: facturaEditando.servicioNombre,
          servicioTipo: facturaEditando.servicioTipo,
          servicioPrecio: facturaEditando.servicioPrecio,
        };

        consultas.unshift(consultaActual);
      }
    }

    return consultas;
  }, [catalogos.consultasDisponibles, facturaEditando]);

  const facturasFiltradas = useMemo(() => {
    const termino = searchTerm.toLowerCase().trim();

    if (!termino) return facturas;

    return facturas.filter((factura) =>
      [
        factura.id,
        factura.idConsulta,
        factura.clienteNombre,
        factura.mascotaNombre,
        factura.servicioNombre,
        factura.estadoPago,
        factura.metodoPago,
      ]
        .filter(Boolean)
        .some((valor) => String(valor).toLowerCase().includes(termino)),
    );
  }, [facturas, searchTerm]);

  const estadisticas = useMemo(() => {
    const totalFacturado = facturas.reduce(
      (total, factura) => total + Number(factura.valorTotal || 0),
      0,
    );

    const totalPagado = facturas
      .filter((factura) => factura.estadoPago === "PAGADA")
      .reduce((total, factura) => total + Number(factura.valorTotal || 0), 0);

    return {
      total: facturas.length,
      pagadas: facturas.filter((factura) => factura.estadoPago === "PAGADA")
        .length,
      pendientes: facturas.filter(
        (factura) => factura.estadoPago === "PENDIENTE",
      ).length,
      totalFacturado,
      totalPagado,
    };
  }, [facturas]);

  const actualizarFacturaCampo = (campo: keyof FacturaInput, valor: string) => {
    setFacturaForm((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  };

  const actualizarDetalleCampo = (
    campo: keyof FacturaDetalleInput,
    valor: string,
  ) => {
    setDetalleForm((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  };

  const limpiarFacturaForm = () => {
    setFacturaForm(facturaInicial);
    setEditingFacturaId(null);
    setShowFacturaForm(false);
    setError("");
  };

  const limpiarDetalleForm = () => {
    setDetalleForm(detalleInicial);
    setEditingDetalleId(null);
  };

  const nuevaFactura = () => {
    setFacturaForm(facturaInicial);
    setEditingFacturaId(null);
    setShowFacturaForm(true);
    setError("");
  };

  const editarFactura = (factura: Factura) => {
    setFacturaForm({
      idConsulta: factura.idConsulta,
      fecha: factura.fecha,
      metodoPago: factura.metodoPago || "",
      estadoPago: factura.estadoPago,
      crearDetalleConsulta: false,
    });

    setEditingFacturaId(factura.id);
    setShowFacturaForm(true);
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const guardarFactura = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!facturaForm.idConsulta) {
      setError("Selecciona una consulta.");
      return;
    }

    if (!facturaForm.fecha) {
      setError("Selecciona la fecha de la factura.");
      return;
    }

    try {
      setSavingFactura(true);
      setError("");

      const payload: FacturaInput = {
        ...facturaForm,
        metodoPago: facturaForm.metodoPago?.trim() || null,
        crearDetalleConsulta: !editingFacturaId,
      };

      if (editingFacturaId) {
        await updateFactura(editingFacturaId, payload);
      } else {
        await createFactura(payload);
      }

      limpiarFacturaForm();
      await cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error guardando factura");
    } finally {
      setSavingFactura(false);
    }
  };

  const eliminarFactura = async (factura: Factura) => {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar la factura ${factura.id}? Si tiene detalles, primero debes eliminarlos.`,
    );

    if (!confirmar) return;

    try {
      setError("");
      await deleteFactura(factura.id);

      if (selectedFactura?.id === factura.id) {
        setSelectedFactura(null);
        setDetalles([]);
      }

      await cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error eliminando factura");
    }
  };

  const abrirDetalles = async (factura: Factura) => {
    try {
      setError("");
      setSelectedFactura(factura);
      limpiarDetalleForm();

      const detallesData = await getFacturaDetalles(factura.id);
      setDetalles(detallesData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error cargando detalles de factura",
      );
    }
  };

  const guardarDetalle = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedFactura) {
      setError("Selecciona una factura.");
      return;
    }

    if (!detalleForm.descripcion.trim()) {
      setError("Escribe la descripción del detalle.");
      return;
    }

    try {
      setSavingDetalle(true);
      setError("");

      const payload: FacturaDetalleInput = {
        descripcion: detalleForm.descripcion.trim(),
        tipoConcepto: detalleForm.tipoConcepto,
        cantidad: Number(detalleForm.cantidad),
        precioUnitario: Number(detalleForm.precioUnitario),
      };

      if (editingDetalleId) {
        await updateFacturaDetalle(
          selectedFactura.id,
          editingDetalleId,
          payload,
        );
      } else {
        await createFacturaDetalle(selectedFactura.id, payload);
      }

      limpiarDetalleForm();

      const detallesData = await getFacturaDetalles(selectedFactura.id);
      setDetalles(detallesData);

      await cargarDatos();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error guardando detalle de factura",
      );
    } finally {
      setSavingDetalle(false);
    }
  };

  const editarDetalle = (detalle: FacturaDetalle) => {
    setDetalleForm({
      descripcion: detalle.descripcion,
      tipoConcepto: detalle.tipoConcepto,
      cantidad: detalle.cantidad,
      precioUnitario: detalle.precioUnitario,
    });

    setEditingDetalleId(detalle.id);
  };

  const eliminarDetalle = async (detalle: FacturaDetalle) => {
    if (!selectedFactura) return;

    const confirmar = window.confirm(
      `¿Eliminar el detalle "${detalle.descripcion}"?`,
    );

    if (!confirmar) return;

    try {
      setError("");

      await deleteFacturaDetalle(selectedFactura.id, detalle.id);

      const detallesData = await getFacturaDetalles(selectedFactura.id);
      setDetalles(detallesData);

      await cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error eliminando detalle");
    }
  };

  const recalcularSeleccionada = async () => {
    if (!selectedFactura) return;

    try {
      setError("");
      await recalcularFactura(selectedFactura.id);
      await cargarDatos();

      const detallesData = await getFacturaDetalles(selectedFactura.id);
      setDetalles(detallesData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error recalculando factura",
      );
    }
  };

  const consultaSeleccionada = consultasParaSelect.find(
    (consulta) => consulta.id === facturaForm.idConsulta,
  );

  const getEstadoClass = (estado: EstadoPago) => {
    if (estado === "PAGADA")
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (estado === "ANULADA") return "bg-red-50 text-red-700 border-red-100";
    return "bg-orange-50 text-orange-700 border-orange-100";
  };

  const subtotalDetalleActual =
    Number(detalleForm.cantidad || 0) * Number(detalleForm.precioUnitario || 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facturación</h1>
          <p className="text-gray-500 mt-1">
            Gestiona facturas, detalles y estados de pago conectados a consultas
            reales.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={cargarDatos}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>

          <Button type="button" onClick={nuevaFactura}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva factura
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
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Facturas</p>
                <p className="text-xl font-bold text-gray-900">
                  {estadisticas.total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pagadas</p>
                <p className="text-xl font-bold text-gray-900">
                  {estadisticas.pagadas}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pendientes</p>
                <p className="text-xl font-bold text-gray-900">
                  {estadisticas.pendientes}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total pagado</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatoDinero(estadisticas.totalPagado)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showFacturaForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {editingFacturaId ? "Editar factura" : "Nueva factura"}
              </CardTitle>

              <Button
                type="button"
                variant="ghost"
                onClick={limpiarFacturaForm}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={guardarFactura} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Consulta
                  </label>

                  <select
                    value={facturaForm.idConsulta}
                    onChange={(event) =>
                      actualizarFacturaCampo("idConsulta", event.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="">Seleccionar consulta...</option>
                    {consultasParaSelect.map((consulta) => (
                      <option key={consulta.id} value={consulta.id}>
                        {consulta.id} - {consulta.mascotaNombre} /{" "}
                        {consulta.clienteNombre} - {consulta.fechaAtencionReal}
                      </option>
                    ))}
                  </select>

                  {consultasParaSelect.length === 0 && !editingFacturaId && (
                    <p className="text-xs text-orange-600 mt-1">
                      No hay consultas disponibles para facturar.
                    </p>
                  )}
                </div>

                {consultaSeleccionada && (
                  <div className="md:col-span-2 rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3">
                    <p className="text-sm font-medium text-emerald-900">
                      {consultaSeleccionada.mascotaNombre} ·{" "}
                      {consultaSeleccionada.mascotaEspecie}
                    </p>
                    <p className="text-sm text-emerald-700">
                      Cliente: {consultaSeleccionada.clienteNombre}
                    </p>
                    <p className="text-sm text-emerald-700">
                      Servicio: {consultaSeleccionada.servicioNombre} ·{" "}
                      {formatoDinero(consultaSeleccionada.servicioPrecio)}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha
                  </label>
                  <Input
                    type="date"
                    value={facturaForm.fecha}
                    onChange={(event) =>
                      actualizarFacturaCampo("fecha", event.target.value)
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Método de pago
                  </label>
                  <Input
                    value={facturaForm.metodoPago || ""}
                    onChange={(event) =>
                      actualizarFacturaCampo("metodoPago", event.target.value)
                    }
                    placeholder="EFECTIVO, TARJETA, TRANSFERENCIA..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={facturaForm.estadoPago}
                    onChange={(event) =>
                      actualizarFacturaCampo(
                        "estadoPago",
                        event.target.value as EstadoPago,
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {estadosPago.map((estado) => (
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
                  onClick={limpiarFacturaForm}
                  disabled={savingFactura}
                >
                  Cancelar
                </Button>

                <Button type="submit" disabled={savingFactura}>
                  {savingFactura
                    ? "Guardando..."
                    : editingFacturaId
                      ? "Actualizar factura"
                      : "Crear factura"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {selectedFactura && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Detalles de factura {selectedFactura.id}</CardTitle>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={recalcularSeleccionada}
                >
                  Recalcular
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSelectedFactura(null);
                    setDetalles([]);
                    limpiarDetalleForm();
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="rounded-lg bg-gray-50 border px-4 py-3">
              <p className="text-sm text-gray-500">Cliente</p>
              <p className="font-medium text-gray-900">
                {selectedFactura.clienteNombre}
              </p>
              <p className="text-sm text-gray-500">
                Mascota: {selectedFactura.mascotaNombre} ·{" "}
                {selectedFactura.mascotaEspecie}
              </p>
              <p className="text-sm text-gray-500">
                Total:{" "}
                <span className="font-semibold text-gray-900">
                  {formatoDinero(selectedFactura.valorTotal)}
                </span>
              </p>
            </div>

            <form
              onSubmit={guardarDetalle}
              className="grid grid-cols-1 md:grid-cols-6 gap-4"
            >
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <Input
                  value={detalleForm.descripcion}
                  onChange={(event) =>
                    actualizarDetalleCampo("descripcion", event.target.value)
                  }
                  placeholder="Medicamento, procedimiento, vacuna..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={detalleForm.tipoConcepto}
                  onChange={(event) =>
                    actualizarDetalleCampo(
                      "tipoConcepto",
                      event.target.value as TipoConceptoFactura,
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {tiposConcepto.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad
                </label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={detalleForm.cantidad}
                  onChange={(event) =>
                    actualizarDetalleCampo("cantidad", event.target.value)
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio unitario
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={detalleForm.precioUnitario}
                  onChange={(event) =>
                    actualizarDetalleCampo("precioUnitario", event.target.value)
                  }
                  required
                />
              </div>

              <div className="flex items-end">
                <Button type="submit" disabled={savingDetalle}>
                  {savingDetalle
                    ? "Guardando..."
                    : editingDetalleId
                      ? "Actualizar"
                      : "Agregar"}
                </Button>
              </div>

              <div className="md:col-span-6 text-sm text-gray-500">
                Subtotal del detalle:{" "}
                <span className="font-medium text-gray-900">
                  {formatoDinero(subtotalDetalleActual)}
                </span>
                {editingDetalleId && (
                  <button
                    type="button"
                    onClick={limpiarDetalleForm}
                    className="ml-3 text-blue-600 hover:underline"
                  >
                    Cancelar edición
                  </button>
                )}
              </div>
            </form>

            {detalles.length === 0 ? (
              <div className="py-4 text-center text-gray-500">
                Esta factura no tiene detalles.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {detalles.map((detalle) => (
                    <TableRow key={detalle.id}>
                      <TableCell>{detalle.descripcion}</TableCell>
                      <TableCell>
                        <Badge className="bg-blue-50 text-blue-700 border-blue-100">
                          {detalle.tipoConcepto}
                        </Badge>
                      </TableCell>
                      <TableCell>{detalle.cantidad}</TableCell>
                      <TableCell>
                        {formatoDinero(detalle.precioUnitario)}
                      </TableCell>
                      <TableCell>{formatoDinero(detalle.subtotal)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => editarDetalle(detalle)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => eliminarDetalle(detalle)}
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
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Facturas registradas</CardTitle>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar factura..."
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
              Cargando facturas...
            </div>
          ) : facturasFiltradas.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No hay facturas registradas.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Factura</TableHead>
                  <TableHead>Cliente / Mascota</TableHead>
                  <TableHead>Consulta</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {facturasFiltradas.map((factura) => (
                  <TableRow key={factura.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">
                          {factura.id}
                        </p>
                        <p className="text-xs text-gray-500">
                          {factura.detallesCount || 0} detalle(s)
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">
                          {factura.clienteNombre}
                        </p>
                        <p className="text-xs text-gray-500">
                          {factura.mascotaNombre} · {factura.mascotaEspecie}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div>
                        <p className="text-sm">{factura.idConsulta}</p>
                        <p className="text-xs text-gray-500">
                          {factura.servicioNombre}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>{factura.fecha}</TableCell>

                    <TableCell>
                      <Badge className={getEstadoClass(factura.estadoPago)}>
                        {factura.estadoPago}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <p className="font-medium">
                        {formatoDinero(factura.valorTotal)}
                      </p>
                      {Number(factura.valorTotal) !==
                        Number(factura.totalCalculado) && (
                        <p className="text-xs text-orange-600">
                          Calculado: {formatoDinero(factura.totalCalculado)}
                        </p>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => abrirDetalles(factura)}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => editarFactura(factura)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => eliminarFactura(factura)}
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
