import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus } from 'lucide-react';

export function Consultas() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consultas médicas</h1>
          <p className="text-gray-500 mt-1">Registra las atenciones veterinarias</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nueva consulta
        </Button>
      </div>

      {/* Formulario de Consulta */}
      <Card>
        <CardHeader>
          <CardTitle>Registrar consulta veterinaria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cita</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option>Seleccionar cita...</option>
                <option>Cita #1 - Firulais (09:00)</option>
                <option>Cita #2 - Mishi (10:30)</option>
                <option>Cita #3 - Rocky (11:00)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Servicio</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option>Seleccionar servicio...</option>
                <option>Consulta General</option>
                <option>Consulta Especializada</option>
                <option>Cirugía Ambulatoria</option>
                <option>Fisioterapia</option>
              </select>
            </div>

            <div>
              <Input label="Temperatura (°C)" type="number" placeholder="38.5" step="0.1" />
            </div>

            <div>
              <Input label="Peso en consulta (kg)" type="number" placeholder="12.5" step="0.1" />
            </div>

            <div>
              <Input label="Fecha de atención" type="date" defaultValue="2026-05-19" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows={3}
                placeholder="Descripción detallada de la consulta..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Recomendaciones</label>
              <textarea 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows={3}
                placeholder="Recomendaciones para el dueño..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sección de Diagnóstico */}
      <Card>
        <CardHeader>
          <CardTitle>Diagnóstico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del diagnóstico</label>
              <textarea 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows={3}
                placeholder="Descripción detallada del diagnóstico..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de gravedad</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option>Seleccionar...</option>
                <option>LEVE</option>
                <option>MODERADO</option>
                <option>GRAVE</option>
                <option>CRÍTICO</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de afección</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option>Seleccionar...</option>
                <option>DERMATOLÓGICA</option>
                <option>RESPIRATORIA</option>
                <option>DIGESTIVA</option>
                <option>TRAUMATOLÓGICA</option>
                <option>OFTALMOLÓGICA</option>
                <option>NEUROLÓGICA</option>
                <option>CARDIOLÓGICA</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado del diagnóstico</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option>EN_TRATAMIENTO</option>
                <option>CONTROLADO</option>
                <option>CURADO</option>
                <option>EN_OBSERVACION</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tratamiento Recomendado */}
      <Card>
        <CardHeader>
          <CardTitle>Tratamiento recomendado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de tratamiento</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option>Seleccionar...</option>
                <option>MEDICACION</option>
                <option>OBSERVACION</option>
                <option>TERAPIA</option>
                <option>PROCEDIMIENTO_AMBULATORIO</option>
                <option>PLAN_VACUNACION</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Servicio asociado (opcional)</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option>Ninguno</option>
                <option>Fisioterapia</option>
                <option>Cirugía Ambulatoria</option>
              </select>
            </div>

            <div>
              <Input label="Fecha inicio" type="date" defaultValue="2026-05-19" />
            </div>

            <div>
              <Input label="Fecha fin estimada" type="date" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Indicaciones del tratamiento</label>
              <textarea 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows={3}
                placeholder="Instrucciones detalladas del tratamiento..."
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary">Cancelar</Button>
            <Button>Guardar consulta</Button>
          </div>
        </CardContent>
      </Card>

      {/* Historial de Consultas */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de consultas recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-gray-900">Dermatitis alérgica</h4>
                    <Badge variant="warning">LEVE</Badge>
                    <Badge variant="success">EN_TRATAMIENTO</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Mascota: <span className="font-medium">Max</span> | 
                    Veterinario: <span className="font-medium">Dr. Luis Torres</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Fecha: 19/05/2026 | Servicio: Consulta General
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Observaciones: Piel enrojecida en zona abdominal. Tratamiento con pomada antiinflamatoria.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
