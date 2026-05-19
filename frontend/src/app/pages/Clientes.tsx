import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Search, Plus, Edit2, Trash2, X, Mail, Phone, MapPin } from 'lucide-react';
import { clientes, getMascotasByCliente } from '../data/mockData';

export function Clientes() {
  const [selectedCliente, setSelectedCliente] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('TODOS');

  const filteredClientes = clientes.filter(cliente => {
    const matchesSearch = cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = filterEstado === 'TODOS' || cliente.estado === filterEstado;
    return matchesSearch && matchesEstado;
  });

  const getBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'ACTIVO': return 'success';
      case 'INACTIVO': return 'warning';
      case 'SUSPENDIDO': return 'danger';
      default: return 'default';
    }
  };

  const cliente = selectedCliente ? clientes.find(c => c.id === selectedCliente) : null;
  const mascotasCliente = selectedCliente ? getMascotasByCliente(selectedCliente) : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 mt-1">Gestiona la información de tus clientes</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo cliente
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {['TODOS', 'ACTIVO', 'INACTIVO', 'SUSPENDIDO'].map(estado => (
                <button
                  key={estado}
                  onClick={() => setFilterEstado(estado)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterEstado === estado
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {estado}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card padding={false}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nombre completo</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClientes.map((cliente) => (
              <TableRow 
                key={cliente.id}
                onClick={() => setSelectedCliente(cliente.id)}
                className="cursor-pointer hover:bg-gray-50"
              >
                <TableCell className="font-medium">#{cliente.id}</TableCell>
                <TableCell>{cliente.nombre}</TableCell>
                <TableCell className="text-gray-600">{cliente.email}</TableCell>
                <TableCell className="text-gray-600">{cliente.telefono}</TableCell>
                <TableCell>
                  <Badge variant={getBadgeVariant(cliente.estado)}>
                    {cliente.estado}
                  </Badge>
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

      {/* Side Panel */}
      {selectedCliente && cliente && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl border-l border-gray-200 overflow-y-auto z-50">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Detalles del cliente</h2>
              <button 
                onClick={() => setSelectedCliente(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Client Info */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">{cliente.nombre}</h3>
                  <Badge variant={getBadgeVariant(cliente.estado)}>
                    {cliente.estado}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-sm text-gray-900">{cliente.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Teléfono</p>
                      <p className="text-sm text-gray-900">{cliente.telefono}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Dirección</p>
                      <p className="text-sm text-gray-900">{cliente.direccion}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mascotas */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Mascotas ({mascotasCliente.length})</h3>
                <div className="space-y-2">
                  {mascotasCliente.map(mascota => (
                    <div key={mascota.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{mascota.nombre}</p>
                          <p className="text-sm text-gray-500">{mascota.raza} • {mascota.especie}</p>
                        </div>
                        <Badge variant="info" size="sm">{mascota.estadoSalud}</Badge>
                      </div>
                    </div>
                  ))}
                  {mascotasCliente.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No hay mascotas registradas</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1">
                  Editar cliente
                </Button>
                <Button variant="danger" className="flex-1">
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
