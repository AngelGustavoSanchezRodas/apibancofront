import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { ArrowRightLeft } from 'lucide-react';

export default function TransferView() {
  const { idCliente } = useAuthStore();
  const [cuentas, setCuentas] = useState([]);
  const [idCuentaOrigen, setIdCuentaOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  
  const [loadingCuentas, setLoadingCuentas] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCuentas = async () => {
      try {
        setLoadingCuentas(true);
        const response = await api.get(`/api/Cuentahabientes/${idCliente}/cuentas`);
        const data = response.data || [];
        setCuentas(data);
        if (data.length > 0) {
          setIdCuentaOrigen(String(data[0].idCuenta));
        }
      } catch (err) {
        setError(err.response?.data?.mensaje || err.response?.data?.error || 'Error de conexión con el servidor.');
      } finally {
        setLoadingCuentas(false);
      }
    };
    if (idCliente) {
      fetchCuentas();
    }
  }, [idCliente]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const parsedOrigen = parseInt(idCuentaOrigen, 10);
    const parsedDestino = parseInt(destino, 10);
    const parsedMonto = parseFloat(monto);

    if (!idCuentaOrigen || isNaN(parsedOrigen) || parsedOrigen <= 0) {
      setError('La cuenta de origen es inválida o no está seleccionada.');
      return;
    }
    if (!destino || isNaN(parsedDestino) || parsedDestino <= 0) {
      setError('La cuenta de destino debe ser un número de cuenta válido.');
      return;
    }
    if (!monto || isNaN(parsedMonto) || parsedMonto <= 0) {
      setError('El monto a transferir debe ser mayor a cero.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/api/Operaciones/transferir', {
        idCuentaOrigen: parsedOrigen,
        idCuentaDestino: parsedDestino,
        monto: parsedMonto,
        descripcion: descripcion || 'Transferencia web'
      });
      setSuccess(true);
      setDestino('');
      setMonto('');
      setDescripcion('');
    } catch (err) {
      setError(err.response?.data?.mensaje || err.response?.data?.error || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold font-serif text-slate-900 tracking-wide">Transferir Fondos</h2>
        <p className="text-sm text-slate-500 mt-2">Envía dinero instantáneamente a otras cuentas</p>
      </div>
      
      <div className="bg-white/90 backdrop-blur-md shadow-strong border border-white/20 rounded-2xl p-6 sm:p-8">
        {success && (
          <div className="mb-6 p-4 bg-emerald-50/90 border border-emerald-200 rounded-xl text-emerald-800 font-medium flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
              <span className="text-emerald-600">✓</span>
            </div>
            Transferencia ejecutada de forma exitosa.
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50/90 border border-red-200 rounded-xl text-red-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              Cuenta Origen
            </label>
            <select
              value={idCuentaOrigen}
              onChange={(e) => setIdCuentaOrigen(e.target.value)}
              disabled={loadingCuentas}
              className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-700 focus:ring-1 focus:ring-blue-700 outline-none transition-all appearance-none cursor-pointer"
            >
              {loadingCuentas ? (
                <option>Cargando cuentas...</option>
              ) : cuentas.length === 0 ? (
                <option value="">No tienes cuentas activas</option>
              ) : (
                cuentas.map(c => (
                  <option key={c.idCuenta} value={c.idCuenta}>
                    Cuenta {c.noCuenta} - Q{Number(c.saldo).toFixed(2)}
                  </option>
                ))
              )}
            </select>
          </div>

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
              className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-700 focus:ring-1 focus:ring-blue-700 outline-none transition-all"
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
              className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl font-bold text-lg text-slate-900 focus:bg-white focus:border-blue-700 focus:ring-1 focus:ring-blue-700 outline-none transition-all"
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
              placeholder="Ej. Pago de alquiler (Opcional)"
              className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-700 focus:ring-1 focus:ring-blue-700 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-medium py-3.5 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-4"
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
