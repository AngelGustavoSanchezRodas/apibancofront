import { Outlet, Link } from 'react-router-dom';
import { LayoutDashboard, Users, Settings, LogOut } from 'lucide-react';

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold tracking-tight text-blue-400">Banco Admin</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/admin" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800 text-white transition-colors">
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link to="/admin/clients" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors">
            <Users size={20} />
            <span>Clientes</span>
          </Link>
          <Link to="/admin/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors">
            <Settings size={20} />
            <span>Configuración</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button className="flex items-center gap-3 px-3 py-2 w-full rounded-lg hover:bg-red-900/50 text-red-400 transition-colors">
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8 shadow-sm">
          <h2 className="text-lg font-medium text-gray-800">Panel de Administración</h2>
        </header>
        <div className="p-8 flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
