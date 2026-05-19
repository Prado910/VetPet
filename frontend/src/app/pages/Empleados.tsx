import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Plus, Edit2, Trash2, UserCog, Stethoscope } from 'lucide-react';
import { empleados } from '../data/mockData';

export function Empleados() {
  const veterinarios = empleados.filter(e => e.tipo === 'VETERINARIO');
  const recepcionistas = empleados.filter(e => e.tipo === 'RECEPCIONISTA');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Empleados</h1>
          <p className="text-gray-500 mt-1">Gestiona el personal de la veterinaria</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo empleado
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <UserCog className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total empleados</p>
                <p className="text-2xl font-bold text-gray-900">{empleados.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Veterinarios</p>
                <p className="text-2xl font-bold text-gray-900">{veterinarios.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <UserCog className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Recepcionistas</p>
                <p className="text-2xl font-bold text-gray-900">{recepcionistas.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Veterinarios */}
      <Card>
        <CardHeader>
          <CardTitle>Veterinarios</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre completo</TableHead>
                <TableHead>Especialidad</TableHead>
                <TableHead>Matrícula</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Fecha ingreso</TableHead>
                <TableHead>Salario</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {veterinarios.map((empleado) => (
                <TableRow key={empleado.id}>
                  <TableCell className="font-medium">#{empleado.id}</TableCell>
                  <TableCell className="font-medium text-gray-900">{empleado.nombre}</TableCell>
                  <TableCell>
                    <Badge variant="info">{empleado.especialidad}</Badge>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">{empleado.matricula}</code>
                  </TableCell>
                  <TableCell className="text-gray-600">{empleado.telefono}</TableCell>
                  <TableCell>{empleado.fechaIngreso}</TableCell>
                  <TableCell className="font-medium text-emerald-700">
                    ${empleado.salario.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="success">{empleado.estadoLaboral}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recepcionistas */}
      <Card>
        <CardHeader>
          <CardTitle>Recepcionistas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre completo</TableHead>
                <TableHead>Turno</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Fecha ingreso</TableHead>
                <TableHead>Salario</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recepcionistas.map((empleado) => (
                <TableRow key={empleado.id}>
                  <TableCell className="font-medium">#{empleado.id}</TableCell>
                  <TableCell className="font-medium text-gray-900">{empleado.nombre}</TableCell>
                  <TableCell>
                    <Badge variant={empleado.turno === 'DIURNO' ? 'warning' : 'purple'}>
                      {empleado.turno}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">{empleado.telefono}</TableCell>
                  <TableCell>{empleado.fechaIngreso}</TableCell>
                  <TableCell className="font-medium text-emerald-700">
                    ${empleado.salario.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="success">{empleado.estadoLaboral}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Formulario de empleado */}
      <Card>
        <CardHeader>
          <CardTitle>Agregar nuevo empleado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
              <input 
                type="text" 
                placeholder="Ej: Dr. Juan Pérez"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de empleado</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option>Seleccionar...</option>
                <option>VETERINARIO</option>
                <option>RECEPCIONISTA</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input 
                type="tel" 
                placeholder="+56 9 1234 5678"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de ingreso</label>
              <input 
                type="date" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salario</label>
              <input 
                type="number" 
                placeholder="800000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad (Veterinarios)</label>
              <input 
                type="text" 
                placeholder="Ej: Medicina Interna"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary">Cancelar</Button>
            <Button>Guardar empleado</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
