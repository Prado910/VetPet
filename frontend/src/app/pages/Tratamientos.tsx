import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Plus } from 'lucide-react';
import { tratamientos, diagnosticos, getEmpleadoById } from '../data/mockData';

export function Tratamientos() {
  const getBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case 'MEDICACION': return 'purple';
      case 'OBSERVACION': return 'info';
      case 'TERAPIA': return 'success';
      case 'PROCEDIMIENTO_AMBULATORIO': return 'warning';
      case 'PLAN_VACUNACION': return 'default';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tratamientos</h1>
          <p className="text-gray-500 mt-1">Gestiona los tratamientos de las mascotas</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo tratamiento
        </Button>
      </div>

      {/* Tratamientos Activos */}
      <Card padding={false}>
        <CardHeader className="p-6 pb-4">
          <CardTitle>Tratamientos activos</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Diagnóstico</TableHead>
              <TableHead>Veterinario</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Fecha inicio</TableHead>
              <TableHead>Fecha fin estimada</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tratamientos.map((tratamiento) => {
              const diagnostico = diagnosticos.find(d => d.id === tratamiento.diagnosticoId);
              const veterinario = getEmpleadoById(tratamiento.veterinarioId);

              return (
                <TableRow key={tratamiento.id}>
                  <TableCell className="font-medium">#{tratamiento.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">{diagnostico?.descripcion}</p>
                      <p className="text-xs text-gray-500">Gravedad: {diagnostico?.nivelGravedad}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-700">{veterinario?.nombre}</TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(tratamiento.tipo)}>
                      {tratamiento.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell>{tratamiento.fechaInicio}</TableCell>
                  <TableCell>{tratamiento.fechaFin}</TableCell>
                  <TableCell>
                    <Badge variant="success">{tratamiento.estado}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="secondary">Ver detalles</Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Detalle de Tratamiento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tratamiento #1 - Detalles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Tipo</p>
                  <Badge variant="purple">MEDICACION</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  <Badge variant="success">ACTIVO</Badge>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Veterinario</p>
                <p className="text-sm font-medium text-gray-900">Dr. Luis Torres</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Duración</p>
                <p className="text-sm font-medium text-gray-900">19/05/2026 - 02/06/2026</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">Indicaciones</p>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                  Aplicar pomada antiinflamatoria en zona afectada dos veces al día. Mantener la zona limpia y seca. Evitar que la mascota se rasque.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medicamentos del Tratamiento */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Medicamentos del tratamiento</CardTitle>
              <Button size="sm" variant="secondary">
                <Plus className="w-4 h-4 mr-1" />
                Agregar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Prednisolona</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Dosis</p>
                    <p className="font-medium text-gray-900">10 mg</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Frecuencia</p>
                    <p className="font-medium text-gray-900">Cada 12 horas</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Vía de administración</p>
                    <p className="font-medium text-gray-900">Oral</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Duración</p>
                    <p className="font-medium text-gray-900">14 días</p>
                  </div>
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Pomada antibiótica</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Dosis</p>
                    <p className="font-medium text-gray-900">Aplicación tópica</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Frecuencia</p>
                    <p className="font-medium text-gray-900">2 veces al día</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Vía de administración</p>
                    <p className="font-medium text-gray-900">Tópica</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Duración</p>
                    <p className="font-medium text-gray-900">14 días</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formulario para agregar medicamento */}
      <Card>
        <CardHeader>
          <CardTitle>Agregar medicamento al tratamiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medicamento</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option>Seleccionar...</option>
                <option>Prednisolona</option>
                <option>Amoxicilina</option>
                <option>Ibuprofeno Veterinario</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dosis</label>
              <input 
                type="text" 
                placeholder="10 mg"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia</label>
              <input 
                type="text" 
                placeholder="Cada 12 horas"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vía de administración</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option>Oral</option>
                <option>Tópica</option>
                <option>Inyectable</option>
                <option>Intravenosa</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duración</label>
              <input 
                type="text" 
                placeholder="14 días"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button>Agregar medicamento</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
