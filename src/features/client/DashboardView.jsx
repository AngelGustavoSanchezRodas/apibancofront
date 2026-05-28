import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Wallet } from 'lucide-react';

export default function DashboardView() {
  const { userId } = useAuthStore();
  const [saldo, setSaldo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSaldo = async () => {
      try {
        setLoading(true);
        // Assuming userId correlates to idCuenta as per architecture plan
        const response = await api.get(`/api/Operaciones/saldo/${userId}`);
        // Assuming the response structure returns { saldo: 123.45 } or similar directly or nested.
        // E.g. { data: 500.5 } or { data: { saldo: 500.5 } }. 
        // We will default to response.data if it's a primitive, or response.data.saldo
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
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-6">Resumen de Cuenta</h2>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center gap-3 text-slate-500 mb-6">
          <Wallet size={20} />
          <h3 className="font-medium text-sm uppercase tracking-wider">Saldo Disponible</h3>
        </div>

        {loading ? (
          // Skeleton Loader
          <div className="animate-pulse flex flex-col gap-4">
            <div className="h-12 bg-slate-200 rounded w-1/2"></div>
            <div className="h-4 bg-slate-100 rounded w-1/4 mt-2"></div>
          </div>
        ) : error ? (
          <div className="text-red-600 font-medium bg-red-50 p-4 rounded-lg border border-red-100">
            {error}
          </div>
        ) : (
          <div>
            <div className="text-5xl font-black text-slate-900 tracking-tighter">
              Q {Number(saldo).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-sm text-slate-500 mt-2 font-medium">Cuenta activa vinculada a tu perfil</p>
          </div>
        )}
      </div>
    </div>
  );
}
