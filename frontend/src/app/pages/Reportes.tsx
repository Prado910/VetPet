import React, { useEffect, useMemo, useState } from "react";
import { Activity, DollarSign, Syringe, TrendingUp } from "lucide-react";
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
import type {
  ReporteIngresoMensual,
  ReporteMascotaMasAtendida,
  ReporteTopServicio,
  ReporteTratamientoActivo,
  ReporteVacunaAplicada,
} from "../services/api";
import {
  getReporteIngresosMensuales,
  getReporteMascotasMasAtendidas,
  getReporteTopServicios,
  getReporteTratamientosActivos,
  getReporteVacunasAplicadas,
} from "../services/api";

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

const mesesLargos = [
  "",
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function obtenerAnioActual() {
  return new Date().getFullYear();
}

function obtenerMesActual() {
  return new Date().getMonth() + 1;
}

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

  return formatoDinero(numero);
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

function CantidadBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-blue-300 bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
      {children}
    </span>
  );
}

export function Reportes() {
  const anioReporte = obtenerAnioActual();
  const mesReporte = obtenerMesActual();

  const [ingresosMensuales, setIngresosMensuales] = useState<
    ReporteIngresoMensual[]
  >([]);
  const [mascotasAtendidas, setMascotasAtendidas] = useState<
    ReporteMascotaMasAtendida[]
  >([]);
  const [vacunasAplicadas, setVacunasAplicadas] = useState<
    ReporteVacunaAplicada[]
  >([]);
  const [tratamientosActivos, setTratamientosActivos] = useState<
    ReporteTratamientoActivo[]
  >([]);
  const [serviciosTop, setServiciosTop] = useState<ReporteTopServicio[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        ingresosData,
        mascotasData,
        vacunasData,
        tratamientosData,
        serviciosData,
      ] = await Promise.all([
        getReporteIngresosMensuales(anioReporte),
        getReporteMascotasMasAtendidas(5),
        getReporteVacunasAplicadas(anioReporte, mesReporte),
        getReporteTratamientosActivos(),
        getReporteTopServicios(5),
      ]);

      setIngresosMensuales(ingresosData);
      setMascotasAtendidas(mascotasData);
      setVacunasAplicadas(vacunasData);
      setTratamientosActivos(tratamientosData);
      setServiciosTop(serviciosData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando reportes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const ingresosChartData = useMemo(
    () => normalizarIngresos(ingresosMensuales),
    [ingresosMensuales],
  );

  const serviciosChartData = useMemo(
    () => normalizarTopServicios(serviciosTop),
    [serviciosTop],
  );

  const ingresoMesActual = useMemo(() => {
    const reporteMes = ingresosMensuales.find(
      (item) => Number(item.mesNumero) === mesReporte,
    );

    return Number(reporteMes?.ingresosPagados || reporteMes?.valorTotal || 0);
  }, [ingresosMensuales, mesReporte]);

  const totalAtenciones = useMemo(
    () =>
      mascotasAtendidas.reduce(
        (sum, item) => sum + Number(item.atenciones || 0),
        0,
      ),
    [mascotasAtendidas],
  );

  const totalVacunasAplicadas = useMemo(
    () =>
      vacunasAplicadas.reduce(
        (sum, item) => sum + Number(item.aplicaciones || 0),
        0,
      ),
    [vacunasAplicadas],
  );

  const maxAtenciones = useMemo(
    () =>
      Math.max(
        ...mascotasAtendidas.map((item) => Number(item.atenciones || 0)),
        1,
      ),
    [mascotasAtendidas],
  );

  const estilosVacunas = [
    {
      contenedor: "bg-emerald-50 border-emerald-200",
      titulo: "text-emerald-700",
      valor: "text-emerald-900",
    },
    {
      contenedor: "bg-blue-50 border-blue-200",
      titulo: "text-blue-700",
      valor: "text-blue-900",
    },
    {
      contenedor: "bg-purple-50 border-purple-200",
      titulo: "text-purple-700",
      valor: "text-purple-900",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-500 mt-1">
          Visualiza estadísticas y reportes del sistema
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-10 text-center text-gray-500">
          Cargando reportes...
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-emerald-600" />
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Ingresos {mesesLargos[mesReporte]}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatoDineroCorto(ingresoMesActual)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-6 h-6 text-blue-600" />
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Atenciones</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {totalAtenciones}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Syringe className="w-6 h-6 text-purple-600" />
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Vacunas aplicadas</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {totalVacunasAplicadas}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-amber-600" />
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Tratamientos activos
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {tratamientosActivos.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ingresos Mensuales */}
            <Card>
              <CardHeader>
                <CardTitle>Ingresos mensuales - {anioReporte}</CardTitle>
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
                        strokeWidth={3}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Top 5 Servicios */}
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

          {/* Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mascotas más atendidas */}
            <Card>
              <CardHeader>
                <CardTitle>Mascotas más atendidas</CardTitle>
              </CardHeader>

              <CardContent>
                {mascotasAtendidas.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    No hay mascotas atendidas para mostrar.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Mascota
                          </th>
                          <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Atenciones
                          </th>
                        </tr>
                      </thead>

                      <tbody className="bg-white divide-y divide-gray-200">
                        {mascotasAtendidas.map((item) => (
                          <tr key={item.mascotaId}>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {item.mascotaNombre}
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-emerald-600 h-2 rounded-full"
                                    style={{
                                      width: `${
                                        (Number(item.atenciones || 0) /
                                          maxAtenciones) *
                                        100
                                      }%`,
                                    }}
                                  />
                                </div>

                                <span className="text-sm font-medium text-gray-900">
                                  {item.atenciones}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Servicios detallados */}
            <Card>
              <CardHeader>
                <CardTitle>Servicios detallados</CardTitle>
              </CardHeader>

              <CardContent>
                {serviciosChartData.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    No hay servicios facturados para mostrar.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Servicio
                          </th>
                          <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cantidad
                          </th>
                          <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Monto
                          </th>
                        </tr>
                      </thead>

                      <tbody className="bg-white divide-y divide-gray-200">
                        {serviciosChartData.map((item) => (
                          <tr key={item.servicio}>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {item.servicio}
                            </td>

                            <td className="px-6 py-4">
                              <CantidadBadge>{item.cantidad}</CantidadBadge>
                            </td>

                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {formatoDinero(item.monto)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Vacunas del mes */}
          <Card>
            <CardHeader>
              <CardTitle>Vacunas aplicadas en el mes</CardTitle>
            </CardHeader>

            <CardContent>
              {vacunasAplicadas.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  No hay vacunas aplicadas en este mes.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {vacunasAplicadas.slice(0, 3).map((vacuna, index) => {
                    const estilo = estilosVacunas[index] || estilosVacunas[0];

                    return (
                      <div
                        key={vacuna.vacunaId}
                        className={`p-4 rounded-lg border ${estilo.contenedor}`}
                      >
                        <p className={`text-sm ${estilo.titulo}`}>
                          {vacuna.vacunaNombre}
                        </p>

                        <p
                          className={`text-2xl font-bold mt-1 ${estilo.valor}`}
                        >
                          {vacuna.aplicaciones}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
