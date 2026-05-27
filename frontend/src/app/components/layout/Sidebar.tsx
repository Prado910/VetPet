import React from 'react';
import { Link, useLocation } from 'react-router';
import { 
  LayoutDashboard, 
  Users, 
  PawPrint, 
  Calendar, 
  Stethoscope, 
  Pill,
  Syringe,
  Package,
  Receipt,
  BarChart3,
  UserCog,
  Settings,
  BookOpen
} from 'lucide-react';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/clientes', label: 'Clientes', icon: Users },
  { path: '/mascotas', label: 'Mascotas', icon: PawPrint },
  { path: '/citas', label: 'Citas', icon: Calendar },
  { path: '/consultas', label: 'Consultas médicas', icon: Stethoscope },
  { path: '/tratamientos', label: 'Tratamientos', icon: Pill },
  { path: '/vacunas', label: 'Vacunas', icon: Syringe },
  { path: '/inventario', label: 'Inventario médico', icon: Package },
  { path: '/facturacion', label: 'Facturación', icon: Receipt },
  { path: '/reportes', label: 'Reportes', icon: BarChart3 },
  { path: '/empleados', label: 'Empleados', icon: UserCog },
  { path: '/configuracion', label: 'Configuración', icon: Settings },
  { path: '/diccionario', label: 'Diccionario de Datos', icon: BookOpen },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 overflow-y-auto">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
            <PawPrint className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">VetCare</h1>
            <p className="text-xs text-gray-500">Admin</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-emerald-50 text-emerald-700 font-medium' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
