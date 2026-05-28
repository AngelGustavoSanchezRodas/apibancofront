import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, ArrowRightLeft, CreditCard, LogOut, ChevronDown, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useState, useRef, useEffect } from 'react';

export default function ClientLayout() {
  const { logout } = useAuthStore();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
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

  const navItems = [
    { path: '/client', icon: Home, label: 'Resumen' },
    { path: '/client/transfer', icon: ArrowRightLeft, label: 'Transferir' },
    { path: '/client/payment', icon: CreditCard, label: 'Pagar Servicios' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar Minimalista */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Banco Central</h1>
        </div>
        
        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600">
              <User size={16} />
            </div>
            <span className="text-sm font-medium text-slate-700 hidden sm:block">Mi Perfil</span>
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

      <div className="flex flex-1 max-w-7xl w-full mx-auto">
        {/* Sidebar Limpio */}
        <nav className="w-64 py-8 px-4 hidden md:block">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link 
                    to={item.path} 
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                      isActive 
                        ? 'bg-slate-900 text-white' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Contenido Principal */}
        <main className="flex-1 p-4 sm:p-6 md:py-8 md:pr-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
