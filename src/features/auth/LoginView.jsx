import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Lock, User } from 'lucide-react';

export default function LoginView() {
  const [credencial, setCredencial] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/api/Auth/login', { credencial, password });
      const { token, rol, idCliente } = response.data;
      
      login(token, rol, idCliente);

      if (rol === 'ADMIN' || rol === 'ADMINISTRADOR') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/client', { replace: true });
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError('Credenciales inválidas. Intente de nuevo.');
      } else {
        setError('Error de conexión. Intente más tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-md shadow-strong border border-white/20 p-8 rounded-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-950 shadow-soft text-gold-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Lock size={24} />
          </div>
          <h1 className="text-2xl font-bold font-serif text-blue-950 tracking-tight">Acceso Seguro</h1>
          <p className="text-sm text-gray-600 mt-1">Ingrese sus credenciales operativas</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-blue-950 uppercase tracking-wide mb-2" htmlFor="credencial">
              Usuario
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <User size={18} />
              </div>
              <input
                id="credencial"
                type="text"
                value={credencial}
                onChange={(e) => setCredencial(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-white/50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-blue-700 focus:ring-1 focus:ring-blue-700 outline-none transition-all"
                placeholder="Identificador único"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-blue-950 uppercase tracking-wide mb-2" htmlFor="password">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock size={18} />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-white/50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-blue-700 focus:ring-1 focus:ring-blue-700 outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-900 hover:bg-blue-800 shadow-soft text-white font-medium py-2.5 rounded-lg text-sm transition-transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Verificando...' : 'Autenticar'}
          </button>
        </form>
      </div>
    </div>
  );
}