import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  DollarSign,
  FileText,
  PawPrint,
  RefreshCw,
  Search,
  Stethoscope,
  Syringe,
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
  ReporteIngresoMensual,
  ReporteMascotaMasAtendida,
  ReporteResumenCliente,
  ReporteTopServicio,
  ReporteTratamientoActivo,
  ReporteVacunaAplicada,
  getReporteIngresosMensuales,
  getReporteMascotasMasAtendidas,
  getReporteResumenClientes,
  getReporteTopServicios,
  getReporteTratamientosActivos,
  getReporteVacunasAplicadas,
} from "../services/api";

function formatoDinero(valor: number | string | null | undefined) {
  return `$${Number(valor || 0).toLocaleString()}`;
}

function anioActual() {
  return new Date().getFullYear();
}

const meses = [
  { value: "0", label: "Todos los meses" },
  { value: "1", label: "Enero" },
  { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" },
  { value: "6", label: "Junio" },
  { value: "7", label: "Julio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center">
            {icon}
          </div>
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function Reportes() {
  const [anio, setAnio] = useState(String(anioActual()));
  const [mes, setMes] = useState("0");
  const [searchClientes, setSearchClientes] = useState("");

  const [ingresos, setIngresos] = useState<ReporteIngresoMensual[]>([]);
  const [mascotasAtendidas, setMascotasAtendidas] = useState<
    ReporteMascotaMasAtendida[]
  >([]);
  const [vacunasAplicadas, setVacunasAplicadas] = useState<
    ReporteVacunaAplicada[]
  >([]);
  const [tratamientosActivos, setTratamientosActivos] = useState<
    ReporteTratamientoActivo[]
  >([]);
  const [topServicios, setTopServicios] = useState<ReporteTopServicio[]>([]);
  const [resumenClientes, setResumenClientes] = useState<
    ReporteResumenCliente[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cargarReportes = async () => {
    try {
      setLoading(true);
      setError("");

      const anioNumero = Number(anio) || anioActual();
      const mesNumero = mes === "0" ? undefined : Number(mes);

      const [
        ingresosData,
        mascotasData,
        vacunasData,
        tratamientosData,
        serviciosData,
        clientesData,
      ] = await Promise.all([
        getReporteIngresosMensuales(anioNumero, mesNumero),
        getReporteMascotasMasAtendidas(5),
        getReporteVacunasAplicadas(anioNumero, mesNumero),
        getReporteTratamientosActivos(),
        getReporteTopServicios(5),
        getReporteResumenClientes(),
      ]);

      setIngresos(ingresosData);
      setMascotasAtendidas(mascotasData);
      setVacunasAplicadas(vacunasData);
      setTratamientosActivos(tratamientosData);
      setTopServicios(serviciosData);
      setResumenClientes(clientesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando reportes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarReportes();
  }, []);

  const estadisticas = useMemo(() => {
    const ingresosPagados = ingresos.reduce(
      (total, item) => total + Number(item.ingresosPagados || 0),
      0,
    );

    const ingresosPendientes = ingresos.reduce(
      (total, item) => total + Number(item.ingresosPendientes || 0),
      0,
    );

    const totalVacunas = vacunasAplicadas.reduce(
      (total, item) => total + Number(item.aplicaciones || 0),
      0,
    );

    const totalAtenciones = mascotasAtendidas.reduce(
      (total, item) => total + Number(item.atenciones || 0),
      0,
    );

    return {
      ingresosPagados,
      ingresosPendientes,
      totalVacunas,
      totalAtenciones,
      tratamientosActivos: tratamientosActivos.length,
      clientesConFactura: resumenClientes.filter(
        (cliente) => Number(cliente.totalFacturas || 0) > 0,
      ).length,
    };
  }, [
    ingresos,
    vacunasAplicadas,
    mascotasAtendidas,
    tratamientosActivos,
    resumenClientes,
  ]);

  const clientesFiltrados = useMemo(() => {
    const termino = searchClientes.toLowerCase().trim();

    if (!termino) return resumenClientes;

    return resumenClientes.filter((cliente) =>
      [
        cliente.clienteId,
        cliente.clienteNombre,
        cliente.telefono,
        cliente.email,
        cliente.estado,
      ]
        .filter(Boolean)
        .some((valor) => String(valor).toLowerCase().includes(termino)),
    );
  }, [resumenClientes, searchClientes]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-500 mt-1">
            Indicadores financieros y clínicos usando datos reales de Oracle.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Input
            type="number"
            value={anio}
            onChange={(event) => setAnio(event.target.value)}
            className="w-28"
            min="2000"
            max="2100"
          />

          <select
            value={mes}
            onChange={(event) => setMes(event.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {meses.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <Button type="button" variant="secondary" onClick={cargarReportes}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="Ingresos pagados"
              value={formatoDinero(estadisticas.ingresosPagados)}
              subtitle={`Pendiente: ${formatoDinero(estadisticas.ingresosPendientes)}`}
              icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
            />

            <StatCard
              title="Atenciones top"
              value={estadisticas.totalAtenciones}
              subtitle="Consultas en ranking"
              icon={<PawPrint className="w-5 h-5 text-emerald-600" />}
            />

            <StatCard
              title="Vacunas aplicadas"
              value={estadisticas.totalVacunas}
              subtitle="Según filtro de fecha"
              icon={<Syringe className="w-5 h-5 text-emerald-600" />}
            />

            <StatCard
              title="Tratamientos activos"
              value={estadisticas.tratamientosActivos}
              subtitle={`${estadisticas.clientesConFactura} clientes con factura`}
              icon={<Activity className="w-5 h-5 text-emerald-600" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Ingresos mensuales</CardTitle>
              </CardHeader>

              <CardContent>
                {ingresos.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    No hay ingresos para el periodo seleccionado.
                  </div>
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={ingresos}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => formatoDinero(Number(value))}
                        />
                        <Line
                          type="monotone"
                          dataKey="ingresosPagados"
                          name="Ingresos pagados"
                          stroke="#059669"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="ingresosPendientes"
                          name="Ingresos pendientes"
                          stroke="#f97316"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mascotas más atendidas</CardTitle>
              </CardHeader>

              <CardContent>
                {mascotasAtendidas.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    No hay atenciones registradas.
                  </div>
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mascotasAtendidas}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mascotaNombre" />
                        <YAxis />
                        <Tooltip />
                        <Bar
                          dataKey="atenciones"
                          name="Atenciones"
                          fill="#10b981"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top servicios</CardTitle>
              </CardHeader>

              <CardContent>
                {topServicios.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    No hay servicios usados.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Servicio</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Usos</TableHead>
                        <TableHead>Ingresos</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {topServicios.map((servicio) => (
                        <TableRow key={servicio.servicioId}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">
                                {servicio.servicioNombre}
                              </p>
                              <p className="text-xs text-gray-500">
                                {servicio.servicioId}
                              </p>
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge className="bg-blue-50 text-blue-700 border-blue-100">
                              {servicio.tipoServicio}
                            </Badge>
                          </TableCell>

                          <TableCell>{servicio.vecesUsado}</TableCell>

                          <TableCell>
                            {formatoDinero(servicio.ingresosPagados)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vacunas aplicadas</CardTitle>
              </CardHeader>

              <CardContent>
                {vacunasAplicadas.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    No hay vacunas aplicadas en el periodo seleccionado.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vacuna</TableHead>
                        <TableHead>Especie</TableHead>
                        <TableHead>Aplicaciones</TableHead>
                        <TableHead>Valor estimado</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {vacunasAplicadas.map((vacuna) => (
                        <TableRow key={vacuna.vacunaId}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">
                                {vacuna.vacunaNombre}
                              </p>
                              <p className="text-xs text-gray-500">
                                {vacuna.laboratorio || "Sin laboratorio"}
                              </p>
                            </div>
                          </TableCell>

                          <TableCell>{vacuna.especieObjetivo || "-"}</TableCell>

                          <TableCell>{vacuna.aplicaciones}</TableCell>

                          <TableCell>
                            {formatoDinero(vacuna.valorEstimado)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tratamientos activos</CardTitle>
            </CardHeader>

            <CardContent>
              {tratamientosActivos.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  No hay tratamientos activos.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tratamiento</TableHead>
                      <TableHead>Mascota / Cliente</TableHead>
                      <TableHead>Diagnóstico</TableHead>
                      <TableHead>Veterinario</TableHead>
                      <TableHead>Medicamentos</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {tratamientosActivos.map((tratamiento) => (
                      <TableRow key={tratamiento.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">
                              {tratamiento.id}
                            </p>
                            <p className="text-xs text-gray-500">
                              Desde {tratamiento.fechaInicio}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">
                              {tratamiento.mascotaNombre}
                            </p>
                            <p className="text-xs text-gray-500">
                              {tratamiento.mascotaEspecie} ·{" "}
                              {tratamiento.clienteNombre}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div>
                            <p className="text-sm text-gray-900">
                              {tratamiento.descripcionCondicion}
                            </p>
                            <p className="text-xs text-gray-500">
                              {tratamiento.tipo}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>{tratamiento.veterinarioNombre}</TableCell>

                        <TableCell>{tratamiento.medicamentosCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle>Resumen por cliente</CardTitle>

                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar cliente..."
                    value={searchClientes}
                    onChange={(event) => setSearchClientes(event.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {clientesFiltrados.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  No hay clientes para mostrar.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Mascotas</TableHead>
                      <TableHead>Facturas</TableHead>
                      <TableHead>Pagadas</TableHead>
                      <TableHead>Pendientes</TableHead>
                      <TableHead>Ingreso pagado</TableHead>
                      <TableHead>Ingreso pendiente</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {clientesFiltrados.map((cliente) => (
                      <TableRow key={cliente.clienteId}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">
                              {cliente.clienteNombre}
                            </p>
                            <p className="text-xs text-gray-500">
                              {cliente.clienteId} ·{" "}
                              {cliente.telefono || "Sin teléfono"}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>{cliente.totalMascotas}</TableCell>
                        <TableCell>{cliente.totalFacturas}</TableCell>
                        <TableCell>{cliente.facturasPagadas}</TableCell>
                        <TableCell>{cliente.facturasPendientes}</TableCell>
                        <TableCell>
                          {formatoDinero(cliente.ingresoTotal)}
                        </TableCell>
                        <TableCell>
                          {formatoDinero(cliente.ingresoPendiente)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
