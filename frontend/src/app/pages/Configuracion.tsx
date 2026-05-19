import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { servicios } from '../data/mockData';

export function Configuracion() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 mt-1">Administra los parámetros del sistema</p>
      </div>

      {/* Perfil de usuario */}
      <Card>
        <CardHeader>
          <CardTitle>Perfil de usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nombre completo" defaultValue="Admin VetCare" />
            <Input label="Email" type="email" defaultValue="admin@vetcare.com" />
            <Input label="Teléfono" type="tel" defaultValue="+56 9 1234 5678" />
            <Input label="Rol" defaultValue="Administrador" disabled />
          </div>
          <div className="mt-4 flex justify-end">
            <Button>Actualizar perfil</Button>
          </div>
        </CardContent>
      </Card>

      {/* Catálogo de Servicios */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Catálogo de servicios</CardTitle>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo servicio
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre del servicio</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servicios.map((servicio) => (
                <TableRow key={servicio.id}>
                  <TableCell className="font-medium">#{servicio.id}</TableCell>
                  <TableCell className="font-medium text-gray-900">{servicio.nombre}</TableCell>
                  <TableCell className="font-medium text-emerald-700">
                    ${servicio.precio.toLocaleString()}
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

      {/* Estados del sistema */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Estados de citas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <Badge variant="info">PROGRAMADA</Badge>
                <span className="text-sm text-gray-600">Cita programada sin confirmar</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <Badge variant="success">CONFIRMADA</Badge>
                <span className="text-sm text-gray-600">Cita confirmada por el cliente</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <Badge variant="default">ATENDIDA</Badge>
                <span className="text-sm text-gray-600">Cita completada</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <Badge variant="danger">CANCELADA</Badge>
                <span className="text-sm text-gray-600">Cita cancelada</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <Badge variant="warning">REPROGRAMADA</Badge>
                <span className="text-sm text-gray-600">Cita reprogramada</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estados de pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <Badge variant="warning">PENDIENTE</Badge>
                <span className="text-sm text-gray-600">Pago pendiente</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <Badge variant="success">PAGADA</Badge>
                <span className="text-sm text-gray-600">Factura pagada</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <Badge variant="danger">ANULADA</Badge>
                <span className="text-sm text-gray-600">Factura anulada</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Parámetros generales */}
      <Card>
        <CardHeader>
          <CardTitle>Parámetros generales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la veterinaria
              </label>
              <input 
                type="text" 
                defaultValue="VetCare Admin"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <input 
                type="text" 
                defaultValue="Av. Principal 123, Santiago"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono de contacto
              </label>
              <input 
                type="tel" 
                defaultValue="+56 2 1234 5678"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email de contacto
              </label>
              <input 
                type="email" 
                defaultValue="info@vetcare.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Horario de atención
              </label>
              <input 
                type="text" 
                defaultValue="Lunes a Viernes 9:00 - 19:00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Moneda
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option>CLP - Peso Chileno</option>
                <option>USD - Dólar</option>
                <option>EUR - Euro</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button>Guardar configuración</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
