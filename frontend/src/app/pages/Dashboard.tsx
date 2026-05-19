import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Users, PawPrint, Calendar, DollarSign, TrendingUp, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { clientes, mascotas, citas, facturas, getClienteById, getMascotaById, getEmpleadoById } from '../data/mockData';

const ingresosData = [
  { mes: 'Ene', ingresos: 4500000 },
  { mes: 'Feb', ingresos: 5200000 },
  { mes: 'Mar', ingresos: 4800000 },
  { mes: 'Abr', ingresos: 6100000 },
  { mes: 'May', ingresos: 5500000 }
];

const serviciosTop = [
  { servicio: 'Consulta General', cantidad: 45, monto: 1125000 },
  { servicio: 'Cirugía Ambulatoria', cantidad: 8, monto: 1200000 },
  { servicio: 'Consulta Especializada', cantidad: 22, monto: 990000 },
  { servicio: 'Vacunación Básica', cantidad: 35, monto: 525000 },
  { servicio: 'Fisioterapia', cantidad: 15, monto: 525000 }
];

const citasHoy = citas.filter(c => c.fecha === '2026-05-19').slice(0, 5);

const mascotasRecientes = [
  { mascotaId: 1, fecha: '2026-05-19', servicio: 'Consulta General', veterinarioId: 1 },
  { mascotaId: 2, fecha: '2026-05-18', servicio: 'Vacunación', veterinarioId: 2 },
  { mascotaId: 3, fecha: '2026-05-17', servicio: 'Control post-operatorio', veterinarioId: 1 },
  { mascotaId: 4, fecha: '2026-05-16', servicio: 'Desparasitación', veterinarioId: 2 }
];

export function Dashboard() {
  const clientesActivos = clientes.filter(c => c.estado === 'ACTIVO').length;
  const totalMascotas = mascotas.length;
  const citasHoyCount = citasHoy.length;
  const facturasPagadas = facturas.filter(f => f.estadoPago === 'PAGADA').length;
  const ingresosMes = facturas
    .filter(f => f.estadoPago === 'PAGADA')
    .reduce((sum, f) => sum + f.valorTotal, 0);
  const tratamientosActivos = 2;

  const getBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'CONFIRMADA': return 'success';
      case 'PROGRAMADA': return 'info';
      case 'ATENDIDA': return 'default';
      case 'CANCELADA': return 'danger';
      case 'REPROGRAMADA': return 'warning';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Bienvenido al panel de administración VetCare</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Clientes activos</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{clientesActivos}</p>
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
                <p className="text-sm text-gray-500">Mascotas registradas</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalMascotas}</p>
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
                <p className="text-2xl font-bold text-gray-900 mt-1">{citasHoyCount}</p>
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
                <p className="text-2xl font-bold text-gray-900 mt-1">{facturasPagadas}</p>
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
                <p className="text-2xl font-bold text-gray-900 mt-1">${(ingresosMes / 1000).toFixed(0)}k</p>
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
                <p className="text-sm text-gray-500">Tratamientos activos</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{tratamientosActivos}</p>
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
            <div className="space-y-4">
              {citasHoy.map((cita) => {
                const mascota = getMascotaById(cita.mascotaId);
                const cliente = getClienteById(mascota?.clienteId || 0);
                const veterinario = getEmpleadoById(cita.veterinarioId);

                return (
                  <div key={cita.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{cita.hora}</span>
                        <Badge variant={getBadgeVariant(cita.estado)} size="sm">
                          {cita.estado}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {mascota?.nombre} - {cliente?.nombre}
                      </p>
                      <p className="text-xs text-gray-500">{veterinario?.nombre}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Mascotas Atendidas Recientemente */}
        <Card>
          <CardHeader>
            <CardTitle>Atenciones recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mascota</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Servicio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mascotasRecientes.map((atencion, index) => {
                  const mascota = getMascotaById(atencion.mascotaId);
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{mascota?.nombre}</p>
                          <p className="text-xs text-gray-500">{mascota?.especie}</p>
                        </div>
                      </TableCell>
                      <TableCell>{atencion.fecha}</TableCell>
                      <TableCell className="text-gray-600">{atencion.servicio}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
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
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ingresosData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                <Line type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Servicios */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 servicios facturados</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={serviciosTop}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="servicio" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                <Bar dataKey="monto" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
