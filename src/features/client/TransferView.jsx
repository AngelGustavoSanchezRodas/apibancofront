import { useState } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { ArrowRightLeft } from 'lucide-react';

export default function TransferView() {
  const { userId } = useAuthStore();
  const [destino, setDestino] = useState('');
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      await api.post('/api/Operaciones/transferir', {
        idCuentaOrigen: parseInt(userId, 10),
        idCuentaDestino: parseInt(destino, 10),
        monto: parseFloat(monto),
        descripcion: descripcion || 'Transferencia desde portal web'
      });
      
      setSuccess(true);
      setDestino('');
      setMonto('');
      setDescripcion('');
    } catch (err) {
      setError(err.response?.data?.message || 'Hubo un error al procesar la transferencia.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Transferir Fondos</h2>
        <p className="text-sm text-slate-500 mt-1">Envía dinero instantáneamente a otras cuentas</p>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 font-medium flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
              <span className="text-emerald-600">✓</span>
            </div>
            Transferencia ejecutada de forma exitosa.
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Note: Origen is purposely omitted to extract it globally via store */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              Cuenta Destino
            </label>
            <input
              type="number"
              required
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              placeholder="Ej. 1002"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              Monto a Transferir (Q)
            </label>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-lg text-slate-900 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              Descripción / Referencia
            </label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Opcional: ¿Para qué es esta transferencia?"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3.5 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-4"
          >
            {loading ? (
              <span>Procesando...</span>
            ) : (
              <>
                <ArrowRightLeft size={18} />
                <span>Confirmar Transferencia</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
