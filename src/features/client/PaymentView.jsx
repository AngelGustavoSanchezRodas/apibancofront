import { useState } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { CreditCard, Zap, Droplets, Phone } from 'lucide-react';

export default function PaymentView() {
  const { userId } = useAuthStore();
  const [empresaId, setEmpresaId] = useState('1'); 
  const [identificadorCliente, setIdentificadorCliente] = useState('');
  const [montoTotal, setMontoTotal] = useState('');
  const [pin, setPin] = useState(''); // Opcional, pero se mantiene si es por seguridad
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
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

  const renderIcon = () => {
    switch (empresaId) {
      case '1': return <Phone size={20} className="text-blue-900" />;
      case '2': return <Zap size={20} className="text-yellow-500" />;
      case '3': return <Droplets size={20} className="text-cyan-500" />;
      default: return <CreditCard size={20} className="text-blue-900" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold font-serif text-slate-900 tracking-wide">Pago de Servicios</h2>
        <p className="text-sm text-slate-500 mt-2">Paga tus servicios básicos rápidamente y sin complicaciones</p>
      </div>

      <div className="bg-white/90 backdrop-blur-md shadow-strong border border-white/20 rounded-2xl p-6 sm:p-8">
        {success && (
          <div className="mb-6 p-4 bg-emerald-50/90 border border-emerald-200 rounded-xl text-emerald-800 font-medium flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
              <span className="text-emerald-600">✓</span>
            </div>
            Pago ejecutado correctamente.
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50/90 border border-red-200 rounded-xl text-red-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                Servicio a Pagar
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  {renderIcon()}
                </div>
                <select
                  value={empresaId}
                  onChange={(e) => setEmpresaId(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-700 focus:ring-1 focus:ring-blue-700 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="1">Telefonía (Celular)</option>
                  <option value="2">Energía Eléctrica (Contador)</option>
                  <option value="3">Agua Potable (Medidor)</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                Identificador / Contrato
              </label>
              <input
                type="text"
                required
                value={identificadorCliente}
                onChange={(e) => setIdentificadorCliente(e.target.value)}
                placeholder="Ej. 12345678"
                className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-700 focus:ring-1 focus:ring-blue-700 outline-none transition-all"
              />
            </div>
          </div>

          <div className="pt-6 pb-2 border-t border-slate-100/50">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-4 text-center">
              Monto Total a Debitar
            </label>
            <div className="flex justify-center items-center">
              <span className="text-3xl font-medium text-slate-400 mr-2">Q</span>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={montoTotal}
                onChange={(e) => setMontoTotal(e.target.value)}
                placeholder="0.00"
                className="w-48 px-2 py-2 text-center bg-transparent border-b-2 border-slate-300 font-black text-5xl text-slate-900 focus:border-blue-700 outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-medium py-3.5 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-4 shadow-md"
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
