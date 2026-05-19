import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { TrendingUp, DollarSign, Activity, Syringe } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const ingresosData = [
  { mes: 'Ene', ingresos: 4500000 },
  { mes: 'Feb', ingresos: 5200000 },
  { mes: 'Mar', ingresos: 4800000 },
  { mes: 'Abr', ingresos: 6100000 },
  { mes: 'May', ingresos: 5500000 }
];

const mascotasAtendidas = [
  { mascota: 'Firulais', atenciones: 12 },
  { mascota: 'Mishi', atenciones: 8 },
  { mascota: 'Rocky', atenciones: 15 },
  { mascota: 'Luna', atenciones: 6 },
  { mascota: 'Max', atenciones: 10 }
];

const serviciosTop = [
  { servicio: 'Consulta General', cantidad: 45, monto: 1125000 },
  { servicio: 'Cirugía Ambulatoria', cantidad: 8, monto: 1200000 },
  { servicio: 'Consulta Especializada', cantidad: 22, monto: 990000 },
  { servicio: 'Vacunación Básica', cantidad: 35, monto: 525000 },
  { servicio: 'Fisioterapia', cantidad: 15, monto: 525000 }
];

export function Reportes() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-500 mt-1">Visualiza estadísticas y reportes del sistema</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Ingresos Mayo</p>
                <p className="text-2xl font-bold text-gray-900">$5.5M</p>
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
                <p className="text-2xl font-bold text-gray-900">126</p>
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
                <p className="text-2xl font-bold text-gray-900">42</p>
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
                <p className="text-sm text-gray-500">Tratamientos activos</p>
                <p className="text-2xl font-bold text-gray-900">18</p>
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
            <CardTitle>Ingresos mensuales - 2026</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ingresosData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                <Line type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top 5 Servicios */}
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

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mascotas más atendidas */}
        <Card>
          <CardHeader>
            <CardTitle>Mascotas más atendidas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mascota</TableHead>
                  <TableHead>Atenciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mascotasAtendidas.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.mascota}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-emerald-600 h-2 rounded-full" 
                            style={{ width: `${(item.atenciones / 15) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{item.atenciones}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Servicios detallados */}
        <Card>
          <CardHeader>
            <CardTitle>Servicios detallados</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviciosTop.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.servicio}</TableCell>
                    <TableCell>
                      <Badge variant="info">{item.cantidad}</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-emerald-700">
                      ${item.monto.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Vacunas del mes */}
      <Card>
        <CardHeader>
          <CardTitle>Vacunas aplicadas en el mes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-sm text-emerald-700">Sextuple Canina</p>
              <p className="text-2xl font-bold text-emerald-900 mt-1">18</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">Triple Felina</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">15</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-700">Antirrábica</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">9</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
