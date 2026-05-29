import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Wallet, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function DashboardView() {
  const { idCliente } = useAuthStore();
  const [cuenta, setCuenta] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 1. Obtener la cuenta (CORRECCIÓN: ahora guardamos el objeto completo)
        const resCuentas = await api.get(`/api/Cuentahabientes/${idCliente}/cuentas`);
        const cuentasData = Array.isArray(resCuentas.data) ? resCuentas.data : resCuentas.data?.valor || [];
        
        if (cuentasData.length > 0) {
          const cuentaPrincipal = cuentasData[0];
          setCuenta(cuentaPrincipal);

          // 2. Obtener la bitácora de movimientos usando el idCuenta recién descubierto
          try {
            const resBitacora = await api.get(`/api/Bitacora/kardex/${cuentaPrincipal.idCuenta}`);
            const movimientosData = Array.isArray(resBitacora.data) ? resBitacora.data : resBitacora.data?.valor || [];
            // Tomamos los últimos 5 para el dashboard
            setMovimientos(movimientosData.slice(0, 5));
          } catch (errBitacora) {
            console.warn("No se pudieron cargar los movimientos", errBitacora);
          }
        }
      } catch (err) {
        setError(err.response?.data?.mensaje || err.response?.data?.error || 'No se pudo cargar la información de la cuenta.');
      } finally {
        setLoading(false);
      }
    };

    if (idCliente) {
      fetchDashboardData();
    }
  }, [idCliente]);

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold font-serif text-slate-900 tracking-wide mb-8">Resumen de Cuenta</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tarjeta de Saldo */}
        <div className="bg-white/90 backdrop-blur-md shadow-strong border border-white/20 rounded-2xl p-6 h-fit">
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
          ) : cuenta ? (
            <div>
              <div className="text-5xl font-black text-slate-900 tracking-tighter">
                {/* CORRECCIÓN DE MAPEO: cuenta.saldo en lugar de cuenta.saldoActual */}
                Q {Number(cuenta.saldo || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-sm text-slate-500 mt-3 font-medium">Cuenta <span className="font-mono text-slate-700">{cuenta.noCuenta}</span> activa</p>
            </div>
          ) : (
            <div className="text-slate-500 font-medium">No se encontraron cuentas activas.</div>
          )}
        </div>

        {/* Últimos Movimientos (AHORA DINÁMICO) */}
        <div className="bg-white/90 backdrop-blur-md shadow-strong border border-white/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 text-slate-500 mb-6">
            <Activity size={24} className="text-blue-900" />
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-700">Últimos Movimientos</h3>
          </div>
          
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg w-full"></div>
              ))}
            </div>
          ) : movimientos.length > 0 ? (
            <div className="space-y-4">
              {movimientos.map((mov, index) => {
                const esIngreso = mov.idTipoTransaccion === 1 || mov.idTipoTransaccion === 7; // Ajusta lógica según tu catálogo
                return (
                  <div key={mov.idTransaccion || index} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${esIngreso ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {esIngreso ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-800 line-clamp-1">
                          {mov.referenciaVinculante || 'Transacción Bancaria'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(mov.fecha).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className={`font-black tracking-tight ${esIngreso ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {esIngreso ? '+' : '-'}Q{Number(mov.monto).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No hay transacciones recientes
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
