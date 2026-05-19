import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  CreditCard,
  DollarSign,
  FileText,
  HeartPulse,
  PawPrint,
  RefreshCw,
  Stethoscope,
  Syringe,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  DashboardActividad,
  DashboardCitaHoy,
  DashboardResumen,
  getDashboardActividadReciente,
  getDashboardCitasHoy,
  getDashboardResumen,
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

function formatoDinero(valor: number | string | null | undefined) {
  return `$${Number(valor || 0).toLocaleString()}`;
}

function getEstadoCitaClass(estado: string) {
  if (estado === "CONFIRMADA")
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (estado === "ATENDIDA") return "bg-blue-50 text-blue-700 border-blue-100";
  if (estado === "CANCELADA") return "bg-red-50 text-red-700 border-red-100";
  if (estado === "REPROGRAMADA")
    return "bg-purple-50 text-purple-700 border-purple-100";
  return "bg-orange-50 text-orange-700 border-orange-100";
}

function getActividadClass(tipo: DashboardActividad["tipo"]) {
  if (tipo === "FACTURA")
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (tipo === "CONSULTA") return "bg-blue-50 text-blue-700 border-blue-100";
  if (tipo === "VACUNA")
    return "bg-purple-50 text-purple-700 border-purple-100";
  if (tipo === "TRATAMIENTO")
    return "bg-orange-50 text-orange-700 border-orange-100";
  return "bg-gray-50 text-gray-700 border-gray-100";
}

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

export function Dashboard() {
  const [resumen, setResumen] = useState<DashboardResumen>(resumenInicial);
  const [citasHoy, setCitasHoy] = useState<DashboardCitaHoy[]>([]);
  const [actividad, setActividad] = useState<DashboardActividad[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError("");

      const [resumenData, citasData, actividadData] = await Promise.all([
        getDashboardResumen(),
        getDashboardCitasHoy(),
        getDashboardActividadReciente(10),
      ]);

      setResumen(resumenData);
      setCitasHoy(citasData);
      setActividad(actividadData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const progresoCitas = useMemo(() => {
    const total = Number(resumen.citasHoy || 0);
    if (total === 0) return 0;

    const atendidas = citasHoy.filter(
      (cita) => cita.estado === "ATENDIDA",
    ).length;
    return Math.round((atendidas / total) * 100);
  }, [resumen.citasHoy, citasHoy]);

  const citasPendientesHoy = citasHoy.filter((cita) =>
    ["PROGRAMADA", "CONFIRMADA", "REPROGRAMADA"].includes(cita.estado),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Resumen operativo en tiempo real conectado a Oracle.
          </p>
        </div>

        <Button type="button" variant="secondary" onClick={cargarDatos}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="Clientes activos"
              value={resumen.clientesActivos}
              subtitle={`${resumen.totalClientes} clientes registrados`}
              icon={<Users className="w-5 h-5 text-emerald-600" />}
            />

            <StatCard
              title="Mascotas"
              value={resumen.totalMascotas}
              subtitle="Registradas en el sistema"
              icon={<PawPrint className="w-5 h-5 text-emerald-600" />}
            />

            <StatCard
              title="Citas de hoy"
              value={resumen.citasHoy}
              subtitle={`${citasPendientesHoy.length} pendientes`}
              icon={<CalendarDays className="w-5 h-5 text-emerald-600" />}
            />

            <StatCard
              title="Ingresos del mes"
              value={formatoDinero(resumen.ingresosMes)}
              subtitle={`${formatoDinero(resumen.ingresosHoy)} hoy`}
              icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="Consultas del mes"
              value={resumen.consultasMes}
              subtitle="Atenciones registradas"
              icon={<Stethoscope className="w-5 h-5 text-blue-600" />}
            />

            <StatCard
              title="Tratamientos activos"
              value={resumen.tratamientosActivos}
              subtitle="Seguimiento clínico"
              icon={<HeartPulse className="w-5 h-5 text-blue-600" />}
            />

            <StatCard
              title="Vacunas del mes"
              value={resumen.vacunasMes}
              subtitle="Aplicaciones registradas"
              icon={<Syringe className="w-5 h-5 text-blue-600" />}
            />

            <StatCard
              title="Facturas pendientes"
              value={resumen.facturasPendientes}
              subtitle={`Total pagado: ${formatoDinero(resumen.ingresosTotal)}`}
              icon={<CreditCard className="w-5 h-5 text-blue-600" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Citas de hoy</CardTitle>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100">
                    {progresoCitas}% atendidas
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                {citasHoy.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    No hay citas programadas para hoy.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hora</TableHead>
                        <TableHead>Mascota / Cliente</TableHead>
                        <TableHead>Veterinario</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {citasHoy.map((cita) => (
                        <TableRow key={cita.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">
                                {cita.hora}
                              </p>
                              <p className="text-xs text-gray-500">{cita.id}</p>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">
                                {cita.mascotaNombre}
                              </p>
                              <p className="text-xs text-gray-500">
                                {cita.mascotaEspecie} · {cita.clienteNombre}
                              </p>
                            </div>
                          </TableCell>

                          <TableCell>{cita.veterinarioNombre}</TableCell>

                          <TableCell>
                            {cita.motivo || "Sin motivo registrado"}
                          </TableCell>

                          <TableCell>
                            <Badge className={getEstadoCitaClass(cita.estado)}>
                              {cita.estado}
                            </Badge>
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
                <CardTitle>Resumen operativo</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500">Citas atendidas hoy</span>
                    <span className="font-medium text-gray-900">
                      {progresoCitas}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-2 bg-emerald-500 rounded-full"
                      style={{ width: `${progresoCitas}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-lg border bg-gray-50 px-4 py-3">
                  <p className="text-sm text-gray-500">
                    Citas pendientes futuras
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {resumen.citasPendientes}
                  </p>
                </div>

                <div className="rounded-lg border bg-gray-50 px-4 py-3">
                  <p className="text-sm text-gray-500">Empleados activos</p>
                  <p className="text-xl font-bold text-gray-900">
                    {resumen.empleadosActivos}
                  </p>
                </div>

                <div className="rounded-lg border bg-gray-50 px-4 py-3">
                  <p className="text-sm text-gray-500">
                    Ingresos históricos pagados
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatoDinero(resumen.ingresosTotal)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Actividad reciente</CardTitle>
            </CardHeader>

            <CardContent>
              {actividad.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  No hay actividad reciente.
                </div>
              ) : (
                <div className="space-y-3">
                  {actividad.map((item, index) => (
                    <div
                      key={`${item.tipo}-${item.id}-${index}`}
                      className="flex flex-col gap-2 rounded-lg border px-4 py-3 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center">
                          {item.tipo === "FACTURA" ? (
                            <FileText className="w-4 h-4 text-emerald-600" />
                          ) : item.tipo === "CONSULTA" ? (
                            <Stethoscope className="w-4 h-4 text-blue-600" />
                          ) : item.tipo === "VACUNA" ? (
                            <Syringe className="w-4 h-4 text-purple-600" />
                          ) : item.tipo === "TRATAMIENTO" ? (
                            <HeartPulse className="w-4 h-4 text-orange-600" />
                          ) : (
                            <Activity className="w-4 h-4 text-gray-600" />
                          )}
                        </div>

                        <div>
                          <p className="font-medium text-gray-900">
                            {item.titulo}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item.descripcion}
                          </p>
                          <p className="text-xs text-gray-400">
                            {item.fecha}
                            {item.hora ? ` · ${item.hora}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className={getActividadClass(item.tipo)}>
                          {item.tipo}
                        </Badge>

                        {item.estado && (
                          <Badge className="bg-gray-50 text-gray-700 border-gray-100">
                            {item.estado}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
