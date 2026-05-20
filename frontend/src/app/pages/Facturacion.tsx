import React, { useEffect, useMemo, useState } from "react";
import { Eye, Plus, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";

const API_URL = "http://localhost:3000/api";

type EstadoPago = "PENDIENTE" | "PAGADA" | "ANULADA";
type TipoConcepto =
  | "CONSULTA"
  | "MEDICAMENTO"
  | "VACUNA"
  | "PROCEDIMIENTO"
  | "OTRO";

interface Factura {
  id: string;
  idConsulta?: string;
  idCliente?: string;
  clienteNombre?: string;
  clienteEmail?: string | null;
  clienteTelefono?: string | null;
  fecha: string;
  valorTotal: number;
  metodoPago?: string | null;
  estadoPago: EstadoPago;
}

interface DetalleFactura {
  id: string;
  idFactura?: string;
  descripcion: string;
  tipoConcepto: TipoConcepto;
  cantidad: number;
  precioUnitario: number;
  subtotal?: number;
}

interface CatalogoConsultaFactura {
  id: string;
  clienteId?: string;
  clienteNombre?: string;
  mascotaNombre?: string;
  servicioNombre?: string;
  fechaAtencionReal?: string;
}

interface FacturasCatalogos {
  consultas: CatalogoConsultaFactura[];
}

interface FacturaInput {
  idConsulta: string;
  fecha: string;
  metodoPago?: string | null;
  estadoPago: EstadoPago;
}

interface DetalleFacturaInput {
  descripcion: string;
  tipoConcepto: TipoConcepto;
  cantidad: number | string;
  precioUnitario: number | string;
}

const facturaInicial: FacturaInput = {
  idConsulta: "",
  fecha: obtenerFechaLocal(),
  metodoPago: "Efectivo",
  estadoPago: "PENDIENTE",
};

const detalleInicial: DetalleFacturaInput = {
  descripcion: "",
  tipoConcepto: "CONSULTA",
  cantidad: 1,
  precioUnitario: "",
};

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.message || errorData?.error || `Error HTTP ${response.status}`,
    );
  }

  return response.json();
}

function getFacturas() {
  return request<Factura[]>("/facturas");
}

function getFacturaDetalles(idFactura: string) {
  return request<DetalleFactura[]>(`/facturas/${idFactura}/detalles`);
}

function getFacturasCatalogos() {
  return request<FacturasCatalogos>("/facturas/catalogos");
}

function createFactura(factura: FacturaInput) {
  return request<{ message: string; id?: string; factura?: Factura }>(
    "/facturas",
    {
      method: "POST",
      body: JSON.stringify(factura),
    },
  );
}

function updateFactura(idFactura: string, factura: FacturaInput) {
  return request<{ message: string }>(`/facturas/${idFactura}`, {
    method: "PUT",
    body: JSON.stringify(factura),
  });
}

function createDetalleFactura(idFactura: string, detalle: DetalleFacturaInput) {
  return request<{ message: string }>(`/facturas/${idFactura}/detalles`, {
    method: "POST",
    body: JSON.stringify(detalle),
  });
}

function recalcularFactura(idFactura: string) {
  return request<{ message: string; valorTotal?: number }>(
    `/facturas/${idFactura}/recalcular`,
    {
      method: "POST",
    },
  );
}

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

function formatearIdFactura(id: string | number) {
  const texto = String(id);

  if (texto.startsWith("FAC-")) return texto;
  if (texto.startsWith("FAC")) return texto;

  if (/^\d+$/.test(texto)) {
    return `FAC-${texto.padStart(4, "0")}`;
  }

  return texto;
}

function getEstadoClassName(estado: string) {
  switch (estado) {
    case "PAGADA":
      return "bg-emerald-100 text-emerald-700 border-emerald-300";
    case "PENDIENTE":
      return "bg-amber-100 text-amber-700 border-amber-300";
    case "ANULADA":
      return "bg-red-100 text-red-700 border-red-300";
    case "CONSULTA":
    case "MEDICAMENTO":
    case "VACUNA":
    case "PROCEDIMIENTO":
    case "OTRO":
      return "bg-blue-100 text-blue-700 border-blue-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
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
      className={`inline-flex items-center rounded-full border font-medium ${getEstadoClassName(
        texto,
      )} ${size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"}`}
    >
      {children}
    </span>
  );
}

export function Facturacion() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [catalogos, setCatalogos] = useState<FacturasCatalogos>({
    consultas: [],
  });

  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null);
  const [detalles, setDetalles] = useState<DetalleFactura[]>([]);

  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [modalNuevaFacturaAbierto, setModalNuevaFacturaAbierto] =
    useState(false);

  const [facturaForm, setFacturaForm] = useState<FacturaInput>(facturaInicial);
  const [detalleForm, setDetalleForm] =
    useState<DetalleFacturaInput>(detalleInicial);

  const [loading, setLoading] = useState(true);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError("");

      const [facturasData, catalogosData] = await Promise.all([
        getFacturas(),
        getFacturasCatalogos(),
      ]);

      setFacturas(facturasData);
      setCatalogos(catalogosData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando facturas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const resumen = useMemo(() => {
    const pagadas = facturas.filter(
      (factura) => factura.estadoPago === "PAGADA",
    );

    const pendientes = facturas.filter(
      (factura) => factura.estadoPago === "PENDIENTE",
    );

    const totalRecaudado = pagadas.reduce(
      (sum, factura) => sum + Number(factura.valorTotal || 0),
      0,
    );

    return {
      total: facturas.length,
      pagadas: pagadas.length,
      pendientes: pendientes.length,
      totalRecaudado,
    };
  }, [facturas]);

  const abrirDetalle = async (factura: Factura) => {
    try {
      setLoadingDetalle(true);
      setError("");
      setSelectedFactura(factura);
      setModalDetalleAbierto(true);

      const detallesData = await getFacturaDetalles(factura.id);
      setDetalles(detallesData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error cargando detalles de factura",
      );
    } finally {
      setLoadingDetalle(false);
    }
  };

  const cerrarDetalle = () => {
    setSelectedFactura(null);
    setDetalles([]);
    setModalDetalleAbierto(false);
  };

  const abrirNuevaFactura = () => {
    setFacturaForm({
      ...facturaInicial,
      fecha: obtenerFechaLocal(),
      idConsulta: catalogos.consultas[0]?.id || "",
    });
    setDetalleForm(detalleInicial);
    setError("");
    setModalNuevaFacturaAbierto(true);
  };

  const cerrarNuevaFactura = () => {
    setFacturaForm(facturaInicial);
    setDetalleForm(detalleInicial);
    setModalNuevaFacturaAbierto(false);
  };

  const guardarFactura = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!facturaForm.idConsulta) {
      setError("Selecciona una consulta para facturar.");
      return;
    }

    if (!facturaForm.fecha) {
      setError("La fecha de la factura es obligatoria.");
      return;
    }

    if (!facturaForm.estadoPago) {
      setError("Selecciona el estado de pago.");
      return;
    }

    if (detalleForm.descripcion.trim()) {
      const cantidad = Number(detalleForm.cantidad);
      const precioUnitario = Number(detalleForm.precioUnitario);

      if (!Number.isInteger(cantidad) || cantidad <= 0) {
        setError("La cantidad del detalle debe ser un entero mayor que cero.");
        return;
      }

      if (!Number.isFinite(precioUnitario) || precioUnitario < 0) {
        setError("El precio unitario del detalle debe ser válido.");
        return;
      }
    }

    try {
      setSaving(true);
      setError("");

      const facturaCreada = await createFactura({
        idConsulta: facturaForm.idConsulta,
        fecha: facturaForm.fecha,
        metodoPago: facturaForm.metodoPago?.trim() || null,
        estadoPago: facturaForm.estadoPago,
      });

      await cargarDatos();

      let idFactura =
        facturaCreada.id ||
        facturaCreada.factura?.id ||
        facturas.find(
          (factura) => factura.idConsulta === facturaForm.idConsulta,
        )?.id;

      if (!idFactura) {
        const facturasActualizadas = await getFacturas();
        const facturaNueva = facturasActualizadas.find(
          (factura) => factura.idConsulta === facturaForm.idConsulta,
        );

        idFactura = facturaNueva?.id;
      }

      if (idFactura && detalleForm.descripcion.trim()) {
        await createDetalleFactura(idFactura, {
          descripcion: detalleForm.descripcion.trim(),
          tipoConcepto: detalleForm.tipoConcepto,
          cantidad: Number(detalleForm.cantidad),
          precioUnitario: Number(detalleForm.precioUnitario),
        });

        await recalcularFactura(idFactura);
      }

      await cargarDatos();
      cerrarNuevaFactura();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error guardando factura");
    } finally {
      setSaving(false);
    }
  };

  const cambiarEstadoPago = async (estadoPago: EstadoPago) => {
    if (!selectedFactura) return;

    try {
      setSaving(true);
      setError("");

      await updateFactura(selectedFactura.id, {
        idConsulta: selectedFactura.idConsulta || "",
        fecha: selectedFactura.fecha,
        metodoPago: selectedFactura.metodoPago || null,
        estadoPago,
      });

      await cargarDatos();

      setSelectedFactura((actual) =>
        actual ? { ...actual, estadoPago } : actual,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error actualizando factura",
      );
    } finally {
      setSaving(false);
    }
  };

  const imprimirFactura = () => {
    window.print();
  };

  const enviarPorEmail = () => {
    if (!selectedFactura?.clienteEmail) {
      setError("El cliente no tiene email registrado.");
      return;
    }

    const asunto = encodeURIComponent(
      `Factura ${formatearIdFactura(selectedFactura.id)} - VetCare`,
    );

    const cuerpo = encodeURIComponent(
      `Hola, te compartimos la factura ${formatearIdFactura(
        selectedFactura.id,
      )} por valor de ${formatearDinero(selectedFactura.valorTotal)}.`,
    );

    window.location.href = `mailto:${selectedFactura.clienteEmail}?subject=${asunto}&body=${cuerpo}`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facturación</h1>
          <p className="text-gray-500 mt-1">Gestiona las facturas y pagos</p>
        </div>

        <Button onClick={abrirNuevaFactura}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva factura
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-gray-500">Total facturas</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {resumen.total}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-gray-500">Pagadas</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {resumen.pagadas}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-gray-500">Pendientes</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {resumen.pendientes}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-gray-500">Total recaudado</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatearDinero(resumen.totalRecaudado)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Facturas */}
      <Card padding={false}>
        <CardHeader className="p-6 pb-4">
          <CardTitle>Lista de facturas</CardTitle>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Factura
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor total
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Método de pago
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
                    colSpan={7}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    Cargando facturas...
                  </td>
                </tr>
              ) : facturas.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    No hay facturas registradas.
                  </td>
                </tr>
              ) : (
                facturas.map((factura) => (
                  <tr key={factura.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatearIdFactura(factura.id)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatearVacio(factura.clienteNombre)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {factura.fecha}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatearDinero(factura.valorTotal)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatearVacio(factura.metodoPago)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge>{factura.estadoPago}</Badge>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => abrirDetalle(factura)}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                        title="Ver factura"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail Modal */}
      {modalDetalleAbierto && selectedFactura && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Factura {formatearIdFactura(selectedFactura.id)}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedFactura.fecha}
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarDetalle}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Cliente */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Cliente</h3>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">
                    {formatearVacio(selectedFactura.clienteNombre)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatearVacio(selectedFactura.clienteEmail)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatearVacio(selectedFactura.clienteTelefono)}
                  </p>
                </div>
              </div>

              {/* Detalles de factura */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Detalles de factura
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Descripción
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cantidad
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Precio unit.
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subtotal
                        </th>
                      </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                      {loadingDetalle ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-8 text-center text-gray-500"
                          >
                            Cargando detalles...
                          </td>
                        </tr>
                      ) : detalles.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-8 text-center text-gray-500"
                          >
                            Esta factura aún no tiene detalles registrados.
                          </td>
                        </tr>
                      ) : (
                        detalles.map((detalle) => {
                          const subtotal =
                            detalle.subtotal ??
                            Number(detalle.cantidad || 0) *
                              Number(detalle.precioUnitario || 0);

                          return (
                            <tr key={detalle.id}>
                              <td className="px-4 py-4 text-sm font-medium text-gray-900">
                                {detalle.descripcion}
                              </td>

                              <td className="px-4 py-4 whitespace-nowrap">
                                <Badge size="sm">{detalle.tipoConcepto}</Badge>
                              </td>

                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                {detalle.cantidad}
                              </td>

                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatearDinero(detalle.precioUnitario)}
                              </td>

                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {formatearDinero(subtotal)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between text-lg">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-emerald-700 text-2xl">
                    {formatearDinero(selectedFactura.valorTotal)}
                  </span>
                </div>
              </div>

              {/* Payment info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Método de pago</p>
                  <p className="font-medium text-gray-900">
                    {formatearVacio(selectedFactura.metodoPago)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Estado de pago</p>
                  <div className="flex items-center gap-2">
                    <Badge>{selectedFactura.estadoPago}</Badge>

                    <select
                      value={selectedFactura.estadoPago}
                      disabled={saving}
                      onChange={(event) =>
                        cambiarEstadoPago(event.target.value as EstadoPago)
                      }
                      className="px-2 py-1 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="PENDIENTE">PENDIENTE</option>
                      <option value="PAGADA">PAGADA</option>
                      <option value="ANULADA">ANULADA</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button className="flex-1" onClick={imprimirFactura}>
                  Imprimir
                </Button>

                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={enviarPorEmail}
                >
                  Enviar por email
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nueva Factura */}
      {modalNuevaFacturaAbierto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl">
            <form onSubmit={guardarFactura}>
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Nueva factura
                  </h2>
                  <p className="text-sm text-gray-500">
                    Selecciona la consulta y agrega el primer concepto
                  </p>
                </div>

                <button
                  type="button"
                  onClick={cerrarNuevaFactura}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 py-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Consulta
                  </label>

                  <select
                    value={facturaForm.idConsulta}
                    onChange={(event) =>
                      setFacturaForm((prev) => ({
                        ...prev,
                        idConsulta: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Seleccionar consulta...</option>

                    {catalogos.consultas.map((consulta) => (
                      <option key={consulta.id} value={consulta.id}>
                        {consulta.id}
                        {consulta.mascotaNombre
                          ? ` - ${consulta.mascotaNombre}`
                          : ""}
                        {consulta.clienteNombre
                          ? ` - ${consulta.clienteNombre}`
                          : ""}
                        {consulta.servicioNombre
                          ? ` - ${consulta.servicioNombre}`
                          : ""}
                      </option>
                    ))}
                  </select>

                  {catalogos.consultas.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      No hay consultas disponibles para facturar.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha
                  </label>

                  <input
                    type="date"
                    value={facturaForm.fecha}
                    onChange={(event) =>
                      setFacturaForm((prev) => ({
                        ...prev,
                        fecha: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Método de pago
                  </label>

                  <select
                    value={facturaForm.metodoPago || ""}
                    onChange={(event) =>
                      setFacturaForm((prev) => ({
                        ...prev,
                        metodoPago: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Sin registrar</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta de Crédito">
                      Tarjeta de Crédito
                    </option>
                    <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>

                  <select
                    value={facturaForm.estadoPago}
                    onChange={(event) =>
                      setFacturaForm((prev) => ({
                        ...prev,
                        estadoPago: event.target.value as EstadoPago,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="PENDIENTE">PENDIENTE</option>
                    <option value="PAGADA">PAGADA</option>
                    <option value="ANULADA">ANULADA</option>
                  </select>
                </div>

                <div className="md:col-span-2 border-t border-gray-200 pt-4 mt-2">
                  <h3 className="font-semibold text-gray-900">
                    Primer detalle de factura
                  </h3>
                  <p className="text-sm text-gray-500">
                    Puedes dejarlo vacío y agregar detalles luego desde la API.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>

                  <input
                    type="text"
                    value={detalleForm.descripcion}
                    onChange={(event) =>
                      setDetalleForm((prev) => ({
                        ...prev,
                        descripcion: event.target.value,
                      }))
                    }
                    placeholder="Consulta General"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>

                  <select
                    value={detalleForm.tipoConcepto}
                    onChange={(event) =>
                      setDetalleForm((prev) => ({
                        ...prev,
                        tipoConcepto: event.target.value as TipoConcepto,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="CONSULTA">CONSULTA</option>
                    <option value="MEDICAMENTO">MEDICAMENTO</option>
                    <option value="VACUNA">VACUNA</option>
                    <option value="PROCEDIMIENTO">PROCEDIMIENTO</option>
                    <option value="OTRO">OTRO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={detalleForm.cantidad}
                    onChange={(event) =>
                      setDetalleForm((prev) => ({
                        ...prev,
                        cantidad: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio unitario
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={detalleForm.precioUnitario}
                    onChange={(event) =>
                      setDetalleForm((prev) => ({
                        ...prev,
                        precioUnitario: event.target.value,
                      }))
                    }
                    placeholder="25000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={cerrarNuevaFactura}
                >
                  Cancelar
                </Button>

                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar factura"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
