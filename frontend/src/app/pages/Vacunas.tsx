import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { vacunas, aplicacionVacunas, getMascotaById } from '../data/mockData';

export function Vacunas() {
  const [activeTab, setActiveTab] = useState<'catalogo' | 'aplicaciones'>('catalogo');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vacunas</h1>
          <p className="text-gray-500 mt-1">Gestiona el catálogo de vacunas y su aplicación</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          {activeTab === 'catalogo' ? 'Nueva vacuna' : 'Registrar aplicación'}
        </Button>
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('catalogo')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'catalogo'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Catálogo de vacunas
            </button>
            <button
              onClick={() => setActiveTab('aplicaciones')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'aplicaciones'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Aplicaciones de vacunas
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Catálogo de Vacunas */}
      {activeTab === 'catalogo' && (
        <Card padding={false}>
          <CardHeader className="p-6 pb-4">
            <CardTitle>Catálogo de vacunas disponibles</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Laboratorio</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Fecha vencimiento</TableHead>
                <TableHead>Especie objetivo</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vacunas.map((vacuna) => {
                const isExpired = new Date(vacuna.fechaVencimiento) < new Date();
                
                return (
                  <TableRow key={vacuna.id}>
                    <TableCell className="font-medium">#{vacuna.id}</TableCell>
                    <TableCell className="font-medium text-gray-900">{vacuna.nombre}</TableCell>
                    <TableCell className="text-gray-600">{vacuna.laboratorio}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">{vacuna.lote}</code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={isExpired ? 'text-red-600' : 'text-gray-900'}>
                          {vacuna.fechaVencimiento}
                        </span>
                        {isExpired && <Badge variant="danger" size="sm">Vencida</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="info" size="sm">{vacuna.especieObjetivo}</Badge>
                    </TableCell>
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
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Aplicaciones de Vacunas */}
      {activeTab === 'aplicaciones' && (
        <>
          <Card padding={false}>
            <CardHeader className="p-6 pb-4">
              <CardTitle>Historial de aplicaciones</CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Mascota</TableHead>
                  <TableHead>Vacuna</TableHead>
                  <TableHead>Fecha aplicación</TableHead>
                  <TableHead>Observación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aplicacionVacunas.map((aplicacion) => {
                  const mascota = getMascotaById(aplicacion.mascotaId);
                  const vacuna = vacunas.find(v => v.id === aplicacion.vacunaId);

                  return (
                    <TableRow key={aplicacion.id}>
                      <TableCell className="font-medium">#{aplicacion.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{mascota?.nombre}</p>
                          <p className="text-xs text-gray-500">{mascota?.especie}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{vacuna?.nombre}</p>
                          <p className="text-xs text-gray-500">{vacuna?.laboratorio}</p>
                        </div>
                      </TableCell>
                      <TableCell>{aplicacion.fechaAplicacion}</TableCell>
                      <TableCell className="text-gray-600">{aplicacion.observacion}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          {/* Formulario de Aplicación */}
          <Card>
            <CardHeader>
              <CardTitle>Registrar nueva aplicación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mascota</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option>Seleccionar mascota...</option>
                    <option>Firulais - Perro Labrador</option>
                    <option>Mishi - Gato Siamés</option>
                    <option>Rocky - Perro Pastor Alemán</option>
                    <option>Luna - Gato Persa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vacuna</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option>Seleccionar vacuna...</option>
                    <option>Sextuple Canina</option>
                    <option>Triple Felina</option>
                    <option>Antirrábica</option>
                  </select>
                </div>

                <div>
                  <Input label="Fecha de aplicación" type="date" defaultValue="2026-05-19" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observación</label>
                  <textarea 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    rows={3}
                    placeholder="Observaciones sobre la aplicación..."
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <Button variant="secondary">Cancelar</Button>
                <Button>Registrar aplicación</Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
