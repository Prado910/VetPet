import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Calendar,
  DollarSign,
  PawPrint,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Consulta,
  DashboardCitaHoy,
  DashboardResumen,
  Factura,
  ReporteIngresoMensual,
  ReporteTopServicio,
  getConsultas,
  getDashboardCitasHoy,
  getDashboardResumen,
  getFacturas,
  getReporteIngresosMensuales,
  getReporteTopServicios,
} from "../services/api";

const resumenInicial: DashboardResumen = {
  totalClientes: 0,
  clientesActivos: 0,
  totalMascotas: 0,
  empleadosActivos: 0,
  citasHoy: 0,
  citasPendientes: 0,
  consultasMes: 0,
  tratamientosActivos: 0,
  facturasPendientes: 0,
  ingresosHoy: 0,
  ingresosMes: 0,
  ingresosTotal: 0,
  vacunasMes: 0,
};

const mesesCortos = [
  "",
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

function formatoDinero(valor: number | string | null | undefined) {
  return `$${Number(valor || 0).toLocaleString("es-CO")}`;
}

function formatoDineroCorto(valor: number | string | null | undefined) {
  const numero = Number(valor || 0);

  if (numero >= 1_000_000) {
    return `$${(numero / 1_000_000).toFixed(numero >= 10_000_000 ? 0 : 1)}M`;
  }

  if (numero >= 1_000) {
    return `$${(numero / 1_000).toFixed(0)}k`;
  }

  return `$${numero.toLocaleString("es-CO")}`;
}

function getBadgeVariant(estado: string) {
  switch (estado) {
    case "CONFIRMADA":
      return "success";
    case "PROGRAMADA":
      return "info";
    case "ATENDIDA":
      return "default";
    case "CANCELADA":
      return "danger";
    case "REPROGRAMADA":
      return "warning";
    default:
      return "default";
  }
}

function normalizarIngresos(data: ReporteIngresoMensual[]) {
  return data
    .slice()
    .sort((a, b) => Number(a.mesNumero) - Number(b.mesNumero))
    .map((item) => ({
      mes: mesesCortos[Number(item.mesNumero)] || item.mes,
      ingresos: Number(item.ingresosPagados || item.valorTotal || 0),
    }));
}

function normalizarTopServicios(data: ReporteTopServicio[]) {
  return data.map((item) => ({
    servicio: item.servicioNombre,
    cantidad: Number(item.vecesUsado || 0),
    monto: Number(item.ingresosPagados || 0),
  }));
}

export function Dashboard() {
  const [resumen, setResumen] = useState<DashboardResumen>(resumenInicial);
  const [citasHoy, setCitasHoy] = useState<DashboardCitaHoy[]>([]);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [ingresosMensuales, setIngresosMensuales] = useState<
    ReporteIngresoMensual[]
  >([]);
  const [serviciosTop, setServiciosTop] = useState<ReporteTopServicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError("");

      const anioActual = new Date().getFullYear();

      const [
        resumenData,
        citasData,
        consultasData,
        facturasData,
        ingresosData,
        serviciosData,
      ] = await Promise.all([
        getDashboardResumen(),
        getDashboardCitasHoy(),
        getConsultas(),
        getFacturas(),
        getReporteIngresosMensuales(anioActual),
        getReporteTopServicios(5),
      ]);

      setResumen(resumenData);
      setCitasHoy(citasData);
      setConsultas(consultasData);
      setFacturas(facturasData);
      setIngresosMensuales(ingresosData);
      setServiciosTop(serviciosData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const facturasPagadas = useMemo(
    () => facturas.filter((factura) => factura.estadoPago === "PAGADA").length,
    [facturas],
  );

  const citasHoyVisibles = useMemo(() => citasHoy.slice(0, 5), [citasHoy]);

  const atencionesRecientes = useMemo(
    () =>
      consultas
        .slice()
        .sort(
          (a, b) =>
            new Date(b.fechaAtencionReal).getTime() -
            new Date(a.fechaAtencionReal).getTime(),
        )
        .slice(0, 4),
    [consultas],
  );

  const ingresosChartData = useMemo(
    () => normalizarIngresos(ingresosMensuales),
    [ingresosMensuales],
  );

  const serviciosChartData = useMemo(
    () => normalizarTopServicios(serviciosTop),
    [serviciosTop],
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Bienvenido al panel de administración VetCare
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-10 text-center text-gray-500">
          Cargando dashboard...
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Clientes activos</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {resumen.clientesActivos}
                    </p>
                  </div>

                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">
                      Mascotas registradas
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {resumen.totalMascotas}
                    </p>
                  </div>

                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <PawPrint className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Citas de hoy</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {resumen.citasHoy || citasHoy.length}
                    </p>
                  </div>

                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Facturas pagadas</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {facturasPagadas}
                    </p>
                  </div>

                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Ingresos del mes</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatoDineroCorto(resumen.ingresosMes)}
                    </p>
                  </div>

                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">
                      Tratamientos activos
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {resumen.tratamientosActivos}
                    </p>
                  </div>

                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Próximas Citas */}
            <Card>
              <CardHeader>
                <CardTitle>Próximas citas de hoy</CardTitle>
              </CardHeader>

              <CardContent>
                {citasHoyVisibles.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    No hay citas programadas para hoy.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {citasHoyVisibles.map((cita) => (
                      <div
                        key={cita.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {cita.hora}
                            </span>

                            <Badge
                              variant={getBadgeVariant(cita.estado)}
                              size="sm"
                            >
                              {cita.estado}
                            </Badge>
                          </div>

                          <p className="text-sm text-gray-600 mt-1">
                            {cita.mascotaNombre} - {cita.clienteNombre}
                          </p>

                          <p className="text-xs text-gray-500">
                            {cita.veterinarioNombre}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mascotas Atendidas Recientemente */}
            <Card>
              <CardHeader>
                <CardTitle>Atenciones recientes</CardTitle>
              </CardHeader>

              <CardContent>
                {atencionesRecientes.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    No hay atenciones recientes.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mascota</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Servicio</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {atencionesRecientes.map((atencion) => (
                        <TableRow key={atencion.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {atencion.mascotaNombre}
                              </p>
                              <p className="text-xs text-gray-500">
                                {atencion.mascotaEspecie}
                              </p>
                            </div>
                          </TableCell>

                          <TableCell>{atencion.fechaAtencionReal}</TableCell>

                          <TableCell className="text-gray-600">
                            {atencion.servicioNombre}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Ingresos */}
            <Card>
              <CardHeader>
                <CardTitle>Ingresos mensuales</CardTitle>
              </CardHeader>

              <CardContent>
                {ingresosChartData.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No hay datos de ingresos para graficar.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={ingresosChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => formatoDinero(Number(value))}
                      />
                      <Line
                        type="monotone"
                        dataKey="ingresos"
                        stroke="#10b981"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Top Servicios */}
            <Card>
              <CardHeader>
                <CardTitle>Top 5 servicios facturados</CardTitle>
              </CardHeader>

              <CardContent>
                {serviciosChartData.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No hay datos de servicios para graficar.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={serviciosChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="servicio"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => formatoDinero(Number(value))}
                      />
                      <Bar dataKey="monto" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
