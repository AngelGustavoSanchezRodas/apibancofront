import { Outlet, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Settings, LogOut, ChevronDown, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useState, useRef, useEffect } from 'react';

export default function AdminLayout() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-lg font-medium text-gray-800">Panel de Administración</h2>
          
          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600">
                <User size={16} />
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:block">Admin</span>
              <ChevronDown size={16} className="text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2">
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-2 transition-colors"
                >
                  <LogOut size={16} />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </header>
        <div className="p-8 flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
