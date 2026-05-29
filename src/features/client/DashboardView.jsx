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

  // Activation state
  const [activationAmount, setActivationAmount] = useState('');
  const [activating, setActivating] = useState(false);
  const [activationError, setActivationError] = useState(null);
  const [activationSuccess, setActivationSuccess] = useState(null);

  // Quick operations state
  const [activeOpTab, setActiveOpTab] = useState('deposito'); // 'deposito' or 'retiro'
  const [opAmount, setOpAmount] = useState('');
  const [opReference, setOpReference] = useState('');
  const [opLoading, setOpLoading] = useState(false);
  const [opError, setOpError] = useState(null);
  const [opSuccess, setOpSuccess] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const resCuentas = await api.get(`/api/Cuentahabientes/${idCliente}/cuentas`);
      const cuentasData = Array.isArray(resCuentas.data) ? resCuentas.data : resCuentas.data?.valor || [];
      
      if (cuentasData.length > 0) {
        const cuentaPrincipal = cuentasData[0];
        setCuenta(cuentaPrincipal);

        try {
          const resBitacora = await api.get(`/api/Bitacora/kardex/${cuentaPrincipal.idCuenta}`);
          const movimientosData = Array.isArray(resBitacora.data) ? resBitacora.data : resBitacora.data?.valor || [];
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

  useEffect(() => {
    if (idCliente) {
      fetchDashboardData();
    }
  }, [idCliente]);

  const handleActivate = async (e) => {
    e.preventDefault();
    const parsedMonto = parseFloat(activationAmount);
    if (isNaN(parsedMonto) || parsedMonto <= 0) {
      setActivationError('El monto de depósito debe ser mayor a cero.');
      return;
    }
    setActivating(true);
    setActivationError(null);
    setActivationSuccess(null);
    try {
      await api.post('/api/Operaciones/activar-cuenta', {
        idCuenta: cuenta.idCuenta,
        montoDeposito: parsedMonto
      });
      setActivationSuccess('¡Cuenta activada exitosamente con depósito inicial!');
      setActivationAmount('');
      await fetchDashboardData();
    } catch (err) {
      setActivationError(err.response?.data?.mensaje || err.response?.data?.error || 'Error al activar la cuenta.');
    } finally {
      setActivating(false);
    }
  };

  const handleQuickOperation = async (e) => {
    e.preventDefault();
    const parsedMonto = parseFloat(opAmount);
    if (isNaN(parsedMonto) || parsedMonto <= 0) {
      setOpError('El monto debe ser mayor a cero.');
      return;
    }
    
    setOpLoading(true);
    setOpError(null);
    setOpSuccess(null);
    
    const endpoint = activeOpTab === 'deposito' ? '/api/Operaciones/deposito' : '/api/Operaciones/retiro';
    
    try {
      await api.post(endpoint, {
        idCuenta: cuenta.idCuenta,
        monto: parsedMonto,
        referencia: opReference.trim() || null
      });
      
      setOpSuccess(`¡${activeOpTab === 'deposito' ? 'Depósito' : 'Retiro'} realizado con éxito!`);
      setOpAmount('');
      setOpReference('');
      await fetchDashboardData();
    } catch (err) {
      setOpError(err.response?.data?.mensaje || err.response?.data?.error || 'Error al procesar la operación.');
    } finally {
      setOpLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold font-serif text-slate-900 tracking-wide mb-8">Resumen de Cuenta</h2>
      
      {/* Activación Banner */}
      {cuenta && cuenta.idEstado === 3 && (
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-600/10 to-transparent backdrop-blur-md shadow-lg border border-amber-500/20 rounded-2xl p-6 mb-8 animate-in fade-in duration-300">
          <h3 className="text-lg font-bold text-amber-900 mb-2 flex items-center gap-2">
            ⚠️ Activación de Cuenta Requerida
          </h3>
          <p className="text-sm text-amber-800/80 mb-6 max-w-xl">
            Tu cuenta <span className="font-mono font-bold text-amber-900">{cuenta.noCuenta}</span> se encuentra inactiva.
            Para empezar a operar, realiza tu depósito de activación inicial. El monto mínimo recomendado es de Q0.01.
          </p>
          {activationError && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-100 font-medium mb-4">
              {activationError}
            </div>
          )}
          {activationSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-100 font-medium mb-4">
              {activationSuccess}
            </div>
          )}
          <form onSubmit={handleActivate} className="flex flex-col sm:flex-row gap-3 max-w-md">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">Q</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={activationAmount}
                onChange={(e) => setActivationAmount(e.target.value)}
                placeholder="Monto depósito inicial"
                disabled={activating}
                required
                className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-amber-500 outline-none font-medium text-slate-800 disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={activating}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-amber-600/20 hover:shadow-lg disabled:opacity-50"
            >
              {activating ? 'Activando...' : 'Activar Cuenta'}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tarjeta de Saldo */}
        <div className="bg-white/90 backdrop-blur-md shadow-lg border border-white/20 rounded-2xl p-6 h-fit">
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
                Q {Number(cuenta.saldo || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-sm text-slate-500 mt-3 font-medium">
                Cuenta <span className="font-mono text-slate-700">{cuenta.noCuenta}</span> {cuenta.idEstado === 3 ? 'inactiva' : 'activa'}
              </p>
            </div>
          ) : (
            <div className="text-slate-500 font-medium">No se encontraron cuentas asociadas.</div>
          )}
        </div>

        {/* Últimos Movimientos */}
        <div className="bg-white/90 backdrop-blur-md shadow-lg border border-white/20 rounded-2xl p-6">
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
                const esIngreso = mov.idTipoTransaccion === 1 || mov.idTipoTransaccion === 7;
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

      {/* Operaciones Rápidas */}
      {cuenta && cuenta.idEstado === 1 && (
        <div className="mt-8 bg-white/90 backdrop-blur-md shadow-lg border border-slate-100 rounded-2xl p-6">
          <div className="flex border-b border-slate-200 mb-6">
            <button
              onClick={() => {
                setActiveOpTab('deposito');
                setOpError(null);
                setOpSuccess(null);
              }}
              className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors ${
                activeOpTab === 'deposito' ? 'border-blue-600 text-blue-900' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Depositar Fondos
            </button>
            <button
              onClick={() => {
                setActiveOpTab('retiro');
                setOpError(null);
                setOpSuccess(null);
              }}
              className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors ${
                activeOpTab === 'retiro' ? 'border-blue-600 text-blue-900' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Retirar Fondos
            </button>
          </div>

          {opError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100 font-medium mb-4">
              {opError}
            </div>
          )}
          {opSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-100 font-medium mb-4">
              {opSuccess}
            </div>
          )}

          <form onSubmit={handleQuickOperation} className="space-y-4 max-w-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Monto (Q)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">Q</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={opAmount}
                    onChange={(e) => setOpAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    disabled={opLoading}
                    className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-blue-600 outline-none font-medium text-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Referencia (Opcional)</label>
                <input
                  type="text"
                  value={opReference}
                  onChange={(e) => setOpReference(e.target.value)}
                  placeholder="Ej. Depósito / Retiro"
                  disabled={opLoading}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-blue-600 outline-none font-medium text-slate-800"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={opLoading}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors shadow-md disabled:opacity-50"
            >
              {opLoading ? 'Procesando...' : activeOpTab === 'deposito' ? 'Confirmar Depósito' : 'Confirmar Retiro'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
