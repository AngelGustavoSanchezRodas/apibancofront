import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Wallet, Activity } from 'lucide-react';

export default function DashboardView() {
  const { userId } = useAuthStore();
  const [saldo, setSaldo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSaldo = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/Operaciones/saldo/${userId}`);
        setSaldo(typeof response.data === 'number' ? response.data : response.data?.saldo || 0);
      } catch (err) {
        setError('No se pudo cargar el saldo actual.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchSaldo();
    }
  }, [userId]);

  return (
    <div className="max-w-4xl">
      <h2 className="text-3xl font-bold font-serif text-slate-900 tracking-wide mb-8">Resumen de Cuenta</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tarjeta de Saldo */}
        <div className="bg-white/90 backdrop-blur-md shadow-strong border border-white/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 text-slate-500 mb-6">
            <Wallet size={24} className="text-blue-900" />
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-700">Saldo Disponible</h3>
          </div>

          {loading ? (
            <div className="animate-pulse flex flex-col gap-4">
              <div className="h-14 bg-gray-200 rounded-lg w-2/3"></div>
              <div className="h-5 bg-gray-200 rounded-lg w-1/3 mt-2"></div>
            </div>
          ) : error ? (
            <div className="text-red-600 font-medium bg-red-50/80 p-4 rounded-lg border border-red-100">
              {error}
            </div>
          ) : (
            <div>
              <div className="text-5xl font-black text-slate-900 tracking-tighter">
                Q {Number(saldo).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-sm text-slate-500 mt-3 font-medium">Cuenta activa vinculada a tu perfil corporativo</p>
            </div>
          )}
        </div>

        {/* Placeholder para Últimos Movimientos si se desea */}
        <div className="bg-white/90 backdrop-blur-md shadow-strong border border-white/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 text-slate-500 mb-6">
            <Activity size={24} className="text-blue-900" />
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-700">Últimos Movimientos</h3>
          </div>
          <div className="flex flex-col items-center justify-center h-24 text-slate-400 text-sm">
            Historial de transacciones se reflejará aquí
          </div>
        </div>
      </div>
    </div>
  );
}
