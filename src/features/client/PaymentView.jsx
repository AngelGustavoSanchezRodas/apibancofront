import { useState } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { CreditCard } from 'lucide-react';

export default function PaymentView() {
  const { userId } = useAuthStore();
  const [empresaId, setEmpresaId] = useState('1'); // Default select
  const [identificadorCliente, setIdentificadorCliente] = useState('');
  const [montoTotal, setMontoTotal] = useState('');
  const [pin, setPin] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      // User is completely unaware of the 95/5 commission logic. 
      // It's handled by the backend orchestration completely based on `montoTotal`.
      await api.post('/api/Pagos/ejecutar', {
        idCuenta: parseInt(userId, 10),
        idEmpresa: parseInt(empresaId, 10),
        identificadorCliente: identificadorCliente,
        montoTotal: parseFloat(montoTotal),
        pinSeguridad: pin
      });
      
      setSuccess(true);
      setIdentificadorCliente('');
      setMontoTotal('');
      setPin('');
    } catch (err) {
      setError(err.response?.data?.message || 'Ocurrió un error al procesar el pago.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Pago de Servicios</h2>
        <p className="text-sm text-slate-500 mt-1">Paga tus servicios básicos rápidamente y sin complicaciones</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 font-medium flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
              <span className="text-emerald-600">✓</span>
            </div>
            Pago de servicio ejecutado correctamente.
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                Servicio a Pagar
              </label>
              <select
                value={empresaId}
                onChange={(e) => setEmpresaId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-colors"
              >
                <option value="1">Universidad (Carné)</option>
                <option value="2">Energía Eléctrica (Contador)</option>
                <option value="3">Telefonía (Celular)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                Identificador (Carné / Tel / NIS)
              </label>
              <input
                type="text"
                required
                value={identificadorCliente}
                onChange={(e) => setIdentificadorCliente(e.target.value)}
                placeholder="Ej. 12345678"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 text-center">
              Monto Total a Debitar
            </label>
            <div className="flex justify-center items-center">
              <span className="text-2xl font-medium text-slate-400 mr-2">Q</span>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={montoTotal}
                onChange={(e) => setMontoTotal(e.target.value)}
                placeholder="0.00"
                className="w-48 px-2 py-2 text-center bg-transparent border-b-2 border-slate-300 font-black text-4xl text-slate-900 focus:border-slate-900 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="pt-4">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              PIN de Autorización (4 dígitos)
            </label>
            <input
              type="password"
              required
              maxLength="4"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center tracking-[0.5em] font-bold focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3.5 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-4"
          >
            {loading ? (
              <span>Procesando pago...</span>
            ) : (
              <>
                <CreditCard size={18} />
                <span>Ejecutar Pago</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
