import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Plus, Eye, X } from 'lucide-react';
import { facturas, detalleFacturas, getClienteById } from '../data/mockData';

export function Facturacion() {
  const [selectedFactura, setSelectedFactura] = useState<number | null>(null);

  const getBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'PAGADA': return 'success';
      case 'PENDIENTE': return 'warning';
      case 'ANULADA': return 'danger';
      default: return 'default';
    }
  };

  const factura = selectedFactura ? facturas.find(f => f.id === selectedFactura) : null;
  const detalles = selectedFactura ? detalleFacturas.filter(d => d.facturaId === selectedFactura) : [];
  const cliente = factura ? getClienteById(factura.clienteId) : null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facturación</h1>
          <p className="text-gray-500 mt-1">Gestiona las facturas y pagos</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nueva factura
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-gray-500">Total facturas</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{facturas.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-gray-500">Pagadas</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {facturas.filter(f => f.estadoPago === 'PAGADA').length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-gray-500">Pendientes</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {facturas.filter(f => f.estadoPago === 'PENDIENTE').length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-gray-500">Total recaudado</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${facturas
                  .filter(f => f.estadoPago === 'PAGADA')
                  .reduce((sum, f) => sum + f.valorTotal, 0)
                  .toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Facturas */}
      <Card padding={false}>
        <CardHeader className="p-6 pb-4">
          <CardTitle>Lista de facturas</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Factura</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Valor total</TableHead>
              <TableHead>Método de pago</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {facturas.map((factura) => {
              const cliente = getClienteById(factura.clienteId);
              
              return (
                <TableRow key={factura.id}>
                  <TableCell className="font-medium">FAC-{String(factura.id).padStart(4, '0')}</TableCell>
                  <TableCell className="font-medium text-gray-900">{cliente?.nombre}</TableCell>
                  <TableCell>{factura.fecha}</TableCell>
                  <TableCell className="font-medium text-emerald-700">
                    ${factura.valorTotal.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-gray-600">{factura.metodoPago}</TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(factura.estadoPago)}>
                      {factura.estadoPago}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <button 
                      onClick={() => setSelectedFactura(factura.id)}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Detail Modal */}
      {selectedFactura && factura && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Factura FAC-{String(factura.id).padStart(4, '0')}</h2>
                <p className="text-sm text-gray-500 mt-1">{factura.fecha}</p>
              </div>
              <button 
                onClick={() => setSelectedFactura(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Cliente */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Cliente</h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">{cliente?.nombre}</p>
                  <p className="text-sm text-gray-600">{cliente?.email}</p>
                  <p className="text-sm text-gray-600">{cliente?.telefono}</p>
                </div>
              </div>

              {/* Detalles de factura */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Detalles de factura</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Precio unit.</TableHead>
                      <TableHead>Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detalles.map((detalle) => {
                      const subtotal = detalle.cantidad * detalle.precioUnitario;
                      
                      return (
                        <TableRow key={detalle.id}>
                          <TableCell className="font-medium">{detalle.descripcion}</TableCell>
                          <TableCell>
                            <Badge variant="info" size="sm">{detalle.tipoConcepto}</Badge>
                          </TableCell>
                          <TableCell>{detalle.cantidad}</TableCell>
                          <TableCell>${detalle.precioUnitario.toLocaleString()}</TableCell>
                          <TableCell className="font-medium">${subtotal.toLocaleString()}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Total */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between text-lg">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-emerald-700 text-2xl">
                    ${factura.valorTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payment info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Método de pago</p>
                  <p className="font-medium text-gray-900">{factura.metodoPago}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado de pago</p>
                  <Badge variant={getBadgeVariant(factura.estadoPago)}>
                    {factura.estadoPago}
                  </Badge>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button className="flex-1">Imprimir</Button>
                <Button variant="secondary" className="flex-1">Enviar por email</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
