import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';
import { medicamentos, vacunas } from '../data/mockData';

export function Inventario() {
  const [activeTab, setActiveTab] = useState<'medicamentos' | 'vacunas'>('medicamentos');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario médico</h1>
          <p className="text-gray-500 mt-1">Gestiona el stock de medicamentos y vacunas</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo item
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total medicamentos</p>
                <p className="text-2xl font-bold text-gray-900">{medicamentos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total vacunas</p>
                <p className="text-2xl font-bold text-gray-900">{vacunas.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Valor inventario</p>
                <p className="text-2xl font-bold text-gray-900">$425k</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('medicamentos')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'medicamentos'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Medicamentos
            </button>
            <button
              onClick={() => setActiveTab('vacunas')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'vacunas'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Vacunas
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Medicamentos */}
      {activeTab === 'medicamentos' && (
        <Card padding={false}>
          <CardHeader className="p-6 pb-4">
            <CardTitle>Catálogo de medicamentos</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Precio unitario</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medicamentos.map((medicamento) => (
                <TableRow key={medicamento.id}>
                  <TableCell className="font-medium">#{medicamento.id}</TableCell>
                  <TableCell className="font-medium text-gray-900">{medicamento.nombre}</TableCell>
                  <TableCell className="text-gray-600">{medicamento.descripcion}</TableCell>
                  <TableCell className="font-medium text-emerald-700">
                    ${medicamento.precioUnitario.toLocaleString()}
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
        </Card>
      )}

      {/* Vacunas */}
      {activeTab === 'vacunas' && (
        <Card padding={false}>
          <CardHeader className="p-6 pb-4">
            <CardTitle>Catálogo de vacunas</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Laboratorio</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Fecha vencimiento</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vacunas.map((vacuna) => (
                <TableRow key={vacuna.id}>
                  <TableCell className="font-medium">#{vacuna.id}</TableCell>
                  <TableCell className="font-medium text-gray-900">{vacuna.nombre}</TableCell>
                  <TableCell className="text-gray-600">{vacuna.laboratorio}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">{vacuna.lote}</code>
                  </TableCell>
                  <TableCell>{vacuna.fechaVencimiento}</TableCell>
                  <TableCell className="font-medium text-emerald-700">
                    ${vacuna.precio.toLocaleString()}
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
        </Card>
      )}
    </div>
  );
}
