import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Plus, Eye, Edit2, Trash2, X } from 'lucide-react';
import { mascotas, getClienteById, getCitasByMascota, getVacunasByMascota } from '../data/mockData';

export function Mascotas() {
  const [selectedMascota, setSelectedMascota] = useState<number | null>(null);

  const mascota = selectedMascota ? mascotas.find(m => m.id === selectedMascota) : null;
  const cliente = mascota ? getClienteById(mascota.clienteId) : null;
  const citasMascota = selectedMascota ? getCitasByMascota(selectedMascota) : [];
  const vacunasMascota = selectedMascota ? getVacunasByMascota(selectedMascota) : [];

  const getBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'Saludable': return 'success';
      case 'En tratamiento': return 'warning';
      case 'Crítico': return 'danger';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mascotas</h1>
          <p className="text-gray-500 mt-1">Gestiona el registro de mascotas</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nueva mascota
        </Button>
      </div>

      {/* Table */}
      <Card padding={false}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Dueño</TableHead>
              <TableHead>Especie / Raza</TableHead>
              <TableHead>Edad</TableHead>
              <TableHead>Sexo</TableHead>
              <TableHead>Peso</TableHead>
              <TableHead>Estado de salud</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mascotas.map((mascota) => {
              const cliente = getClienteById(mascota.clienteId);
              const edad = new Date().getFullYear() - new Date(mascota.fechaNacimiento).getFullYear();
              
              return (
                <TableRow key={mascota.id}>
                  <TableCell className="font-medium">{mascota.codigo}</TableCell>
                  <TableCell className="font-medium text-gray-900">{mascota.nombre}</TableCell>
                  <TableCell className="text-gray-600">{cliente?.nombre}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{mascota.especie}</p>
                      <p className="text-xs text-gray-500">{mascota.raza}</p>
                    </div>
                  </TableCell>
                  <TableCell>{edad} años</TableCell>
                  <TableCell>{mascota.sexo}</TableCell>
                  <TableCell>{mascota.peso} kg</TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(mascota.estadoSalud)}>
                      {mascota.estadoSalud}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setSelectedMascota(mascota.id)}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Detail Panel */}
      {selectedMascota && mascota && (
        <div className="fixed inset-y-0 right-0 w-[500px] bg-white shadow-xl border-l border-gray-200 overflow-y-auto z-50">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Detalles de la mascota</h2>
              <button 
                onClick={() => setSelectedMascota(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{mascota.nombre}</CardTitle>
                    <Badge variant={getBadgeVariant(mascota.estadoSalud)}>
                      {mascota.estadoSalud}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Código</p>
                      <p className="text-sm font-medium text-gray-900">{mascota.codigo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Especie</p>
                      <p className="text-sm font-medium text-gray-900">{mascota.especie}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Raza</p>
                      <p className="text-sm font-medium text-gray-900">{mascota.raza}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Sexo</p>
                      <p className="text-sm font-medium text-gray-900">{mascota.sexo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Fecha de nacimiento</p>
                      <p className="text-sm font-medium text-gray-900">{mascota.fechaNacimiento}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Peso</p>
                      <p className="text-sm font-medium text-gray-900">{mascota.peso} kg</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Owner */}
              <Card>
                <CardHeader>
                  <CardTitle>Dueño</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-medium text-gray-900">{cliente?.nombre}</p>
                    <p className="text-sm text-gray-600">{cliente?.email}</p>
                    <p className="text-sm text-gray-600">{cliente?.telefono}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Citas */}
              <Card>
                <CardHeader>
                  <CardTitle>Citas ({citasMascota.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {citasMascota.map(cita => (
                      <div key={cita.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{cita.fecha} - {cita.hora}</p>
                            <p className="text-xs text-gray-500">{cita.motivo}</p>
                          </div>
                          <Badge variant="info" size="sm">{cita.estado}</Badge>
                        </div>
                      </div>
                    ))}
                    {citasMascota.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No hay citas registradas</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Vacunas */}
              <Card>
                <CardHeader>
                  <CardTitle>Vacunas aplicadas ({vacunasMascota.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {vacunasMascota.map(av => (
                      <div key={av.id} className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                        <p className="text-sm font-medium text-emerald-900">Vacuna ID: {av.vacunaId}</p>
                        <p className="text-xs text-emerald-700">{av.fechaAplicacion}</p>
                        {av.observacion && (
                          <p className="text-xs text-gray-600 mt-1">{av.observacion}</p>
                        )}
                      </div>
                    ))}
                    {vacunasMascota.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No hay vacunas aplicadas</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Tratamientos activos */}
              <Card>
                <CardHeader>
                  <CardTitle>Tratamientos activos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 text-center py-4">No hay tratamientos activos</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
