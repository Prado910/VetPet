import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Plus, Calendar as CalendarIcon, CheckCircle, XCircle, Clock } from 'lucide-react';
import { citas, getMascotaById, getClienteById, getEmpleadoById } from '../data/mockData';

export function Citas() {
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

  const citasHoy = citas.filter(c => c.fecha === '2026-05-19');
  const citasFuturas = citas.filter(c => c.fecha > '2026-05-19');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Citas</h1>
          <p className="text-gray-500 mt-1">Gestiona las citas veterinarias</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nueva cita
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Programadas</p>
                <p className="text-xl font-bold text-gray-900">
                  {citas.filter(c => c.estado === 'PROGRAMADA').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Confirmadas</p>
                <p className="text-xl font-bold text-gray-900">
                  {citas.filter(c => c.estado === 'CONFIRMADA').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Atendidas</p>
                <p className="text-xl font-bold text-gray-900">
                  {citas.filter(c => c.estado === 'ATENDIDA').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Canceladas</p>
                <p className="text-xl font-bold text-gray-900">
                  {citas.filter(c => c.estado === 'CANCELADA').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agenda de Hoy */}
      <Card>
        <CardHeader>
          <CardTitle>Agenda de hoy - 19 de Mayo 2026</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hora</TableHead>
                <TableHead>Mascota</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Veterinario</TableHead>
                <TableHead>Recepcionista</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {citasHoy.map((cita) => {
                const mascota = getMascotaById(cita.mascotaId);
                const cliente = getClienteById(mascota?.clienteId || 0);
                const veterinario = getEmpleadoById(cita.veterinarioId);
                const recepcionista = getEmpleadoById(cita.recepcionistaId);

                return (
                  <TableRow key={cita.id}>
                    <TableCell className="font-medium text-emerald-700">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {cita.hora}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{mascota?.nombre}</p>
                        <p className="text-xs text-gray-500">{mascota?.especie}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-900">{cliente?.nombre}</TableCell>
                    <TableCell className="text-gray-600">{veterinario?.nombre}</TableCell>
                    <TableCell className="text-gray-600">{recepcionista?.nombre}</TableCell>
                    <TableCell className="text-gray-600">{cita.motivo}</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(cita.estado)}>
                        {cita.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {cita.estado === 'PROGRAMADA' && (
                          <Button size="sm" variant="secondary">Confirmar</Button>
                        )}
                        {(cita.estado === 'PROGRAMADA' || cita.estado === 'CONFIRMADA') && (
                          <>
                            <Button size="sm" variant="ghost">Reprogramar</Button>
                            <Button size="sm" variant="ghost">Cancelar</Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Próximas Citas */}
      <Card>
        <CardHeader>
          <CardTitle>Próximas citas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Mascota</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Veterinario</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {citasFuturas.map((cita) => {
                const mascota = getMascotaById(cita.mascotaId);
                const cliente = getClienteById(mascota?.clienteId || 0);
                const veterinario = getEmpleadoById(cita.veterinarioId);

                return (
                  <TableRow key={cita.id}>
                    <TableCell className="font-medium">{cita.fecha}</TableCell>
                    <TableCell className="font-medium text-emerald-700">{cita.hora}</TableCell>
                    <TableCell>{mascota?.nombre}</TableCell>
                    <TableCell>{cliente?.nombre}</TableCell>
                    <TableCell className="text-gray-600">{veterinario?.nombre}</TableCell>
                    <TableCell className="text-gray-600">{cita.motivo}</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(cita.estado)}>
                        {cita.estado}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
