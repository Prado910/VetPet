import { createBrowserRouter } from 'react-router';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Clientes } from './pages/Clientes';
import { Mascotas } from './pages/Mascotas';
import { Citas } from './pages/Citas';
import { Consultas } from './pages/Consultas';
import { Tratamientos } from './pages/Tratamientos';
import { Vacunas } from './pages/Vacunas';
import { Inventario } from './pages/Inventario';
import { Facturacion } from './pages/Facturacion';
import { Reportes } from './pages/Reportes';
import { Empleados } from './pages/Empleados';
import { Configuracion } from './pages/Configuracion';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout><Dashboard /></Layout>,
  },
  {
    path: '/clientes',
    element: <Layout><Clientes /></Layout>,
  },
  {
    path: '/mascotas',
    element: <Layout><Mascotas /></Layout>,
  },
  {
    path: '/citas',
    element: <Layout><Citas /></Layout>,
  },
  {
    path: '/consultas',
    element: <Layout><Consultas /></Layout>,
  },
  {
    path: '/tratamientos',
    element: <Layout><Tratamientos /></Layout>,
  },
  {
    path: '/vacunas',
    element: <Layout><Vacunas /></Layout>,
  },
  {
    path: '/inventario',
    element: <Layout><Inventario /></Layout>,
  },
  {
    path: '/facturacion',
    element: <Layout><Facturacion /></Layout>,
  },
  {
    path: '/reportes',
    element: <Layout><Reportes /></Layout>,
  },
  {
    path: '/empleados',
    element: <Layout><Empleados /></Layout>,
  },
  {
    path: '/configuracion',
    element: <Layout><Configuracion /></Layout>,
  },
]);
