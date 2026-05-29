import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { CreditCard, Zap, Droplets, Phone } from 'lucide-react';

export default function PaymentView() {
  const { idCliente } = useAuthStore();
  const [cuentas, setCuentas] = useState([]);
  const [idCuentaOrigen, setIdCuentaOrigen] = useState('');
  
  const [tipoServicio, setTipoServicio] = useState('2');
  const [identificador, setIdentificador] = useState('');
  const [monto, setMonto] = useState('');
  const [pin, setPin] = useState('');
  const [referenciaCliente, setReferenciaCliente] = useState('');

  // Deuda states
  const [deudaConsultada, setDeudaConsultada] = useState(null);
  const [loadingDeuda, setLoadingDeuda] = useState(false);
  const [deudaError, setDeudaError] = useState(null);
  const [esPrepago, setEsPrepago] = useState(false);
  
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

  const handleConsultarDeuda = async () => {
    if (!identificador || !identificador.trim()) return;
    setLoadingDeuda(true);
    setDeudaError(null);
    setDeudaConsultada(null);
    setEsPrepago(false);
    setError(null);
    try {
      const response = await api.get(`/api/Pagos/consultar-deuda/${tipoServicio}/${identificador.trim()}`);
      const deuda = parseFloat(response.data);
      setDeudaConsultada(deuda);
      if (deuda > 0) {
        setMonto(String(deuda));
      } else if (tipoServicio === '2') {
        setEsPrepago(true);
        setMonto('');
      } else {
        setMonto('0.00');
      }
    } catch (err) {
      setDeudaError(err.response?.data?.mensaje || err.response?.data?.error || 'No se pudo consultar la deuda para este identificador.');
    } finally {
      setLoadingDeuda(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const parsedCuenta = parseInt(idCuentaOrigen, 10);
    const parsedTipoServicio = parseInt(tipoServicio, 10);
    const parsedMonto = parseFloat(monto);

    if (!idCuentaOrigen || isNaN(parsedCuenta) || parsedCuenta <= 0) {
      setError('La cuenta de origen es inválida o no está seleccionada.');
      return;
    }
    if (!tipoServicio || isNaN(parsedTipoServicio) || parsedTipoServicio <= 0) {
      setError('El tipo de servicio es inválido o no está seleccionado.');
      return;
    }
    if (deudaConsultada === null) {
      setError('Debe consultar la deuda del identificador antes de realizar el pago.');
      return;
    }
    if (!monto || isNaN(parsedMonto) || parsedMonto <= 0) {
      setError('El monto del pago debe ser mayor a cero.');
      return;
    }
    if (!esPrepago && parsedMonto !== deudaConsultada) {
      setError(`El monto del pago debe coincidir exactamente con la deuda de Q${deudaConsultada.toFixed(2)}.`);
      return;
    }
    if (!esPrepago && deudaConsultada <= 0) {
      setError('No hay saldo o deuda pendiente para pagar en este servicio.');
      return;
    }
    if (!identificador || !identificador.trim()) {
      setError('El identificador o número de contrato es requerido.');
      return;
    }
    if (!pin || !pin.trim()) {
      setError('El PIN de seguridad es requerido.');
      return;
    }

    setLoading(true);

    const selectedCuentaObj = cuentas.find(c => String(c.idCuenta) === idCuentaOrigen);
    if (!selectedCuentaObj) {
      setError('La cuenta seleccionada no es válida.');
      setLoading(false);
      return;
    }
    if (!selectedCuentaObj.numeroTarjeta) {
      setError('Esta cuenta no tiene una tarjeta de débito asociada. Solicita la asociación de una tarjeta en el panel del administrador para poder realizar pagos de servicios.');
      setLoading(false);
      return;
    }

    try {
      await api.post('/api/Pagos/ejecutar', {
        numeroTarjeta: selectedCuentaObj.numeroTarjeta,
        pin: pin,
        tipoServicio: parsedTipoServicio,
        identificador: identificador,
        monto: parsedMonto,
        referenciaCliente: referenciaCliente || null,
        mesVencimiento: selectedCuentaObj.mesVencimiento,
        anioVencimiento: selectedCuentaObj.anioVencimiento
      });
      
      setSuccess(true);
      setIdentificador('');
      setMonto('');
      setPin('');
      setReferenciaCliente('');
      setDeudaConsultada(null);
      setEsPrepago(false);
    } catch (err) {
      setError(err.response?.data?.mensaje || err.response?.data?.error || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const renderIcon = () => {
    switch (tipoServicio) {
      case '2': return <Phone size={20} className="text-blue-900" />;
      case '3': return <Zap size={20} className="text-yellow-500" />;
      case '1': return <CreditCard size={20} className="text-blue-900" />;
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

        {/* Cuenta Origen Selector */}
        <div className="mb-6">
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
              <option value="">No tienes cuentas registradas</option>
            ) : (
              cuentas.map(c => (
                <option key={c.idCuenta} value={c.idCuenta}>
                  Cuenta {c.noCuenta} - Q{Number(c.saldo).toFixed(2)} {c.idEstado === 3 ? '(Inactiva)' : '(Activa)'}
                </option>
              ))
            )}
          </select>
        </div>

        {(() => {
          const selectedCuenta = cuentas.find(c => String(c.idCuenta) === idCuentaOrigen);
          const isCuentaInactiva = selectedCuenta?.idEstado === 3;

          if (isCuentaInactiva) {
            return (
              <div className="p-6 bg-amber-50/90 border border-amber-200 rounded-xl text-amber-800 font-medium space-y-3">
                <h3 className="font-bold text-base flex items-center gap-2">⚠️ Activación Requerida</h3>
                <p className="text-sm">
                  Esta cuenta requiere un depósito inicial para poder realizar pagos de servicios y otras transacciones.
                </p>
                <p className="text-xs text-amber-700">
                  Puedes activarla desde el <strong>Resumen de Cuenta (Dashboard)</strong> realizando tu primer depósito.
                </p>
              </div>
            );
          }

          return (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                    PIN de Seguridad
                  </label>
                  <input
                    type="password"
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="••••"
                    className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-700 focus:ring-1 focus:ring-blue-700 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                    Servicio a Pagar
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      {renderIcon()}
                    </div>
                    <select
                      value={tipoServicio}
                      onChange={(e) => {
                        setTipoServicio(e.target.value);
                        setDeudaConsultada(null);
                        setMonto('');
                        setDeudaError(null);
                      }}
                      className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-700 focus:ring-1 focus:ring-blue-700 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="2">Telefonía (Celular)</option>
                      <option value="3">Energía Eléctrica (Contador)</option>
                      <option value="1">Universidad (Pago de colegiatura)</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                    Identificador / Contrato
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={identificador}
                      onChange={(e) => {
                        setIdentificador(e.target.value);
                        setDeudaConsultada(null);
                        setMonto('');
                        setDeudaError(null);
                      }}
                      placeholder={
                        tipoServicio === '2' ? 'Ej. 82542114' :
                        tipoServicio === '3' ? 'Ej. NIS contador' : 'Ej. Carnet U'
                      }
                      className="flex-1 px-4 py-3 bg-white/50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-700 focus:ring-1 focus:ring-blue-700 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleConsultarDeuda}
                      disabled={loadingDeuda || !identificador.trim()}
                      className="px-4 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold text-xs transition-colors disabled:opacity-50 flex items-center justify-center shrink-0 min-w-[90px]"
                    >
                      {loadingDeuda ? 'Buscando...' : 'Consultar'}
                    </button>
                  </div>
                </div>

                {deudaError && (
                  <div className="md:col-span-2 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold animate-in fade-in duration-200">
                    {deudaError}
                  </div>
                )}

                {deudaConsultada !== null && (
                  <div className="md:col-span-2 p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs font-medium animate-in fade-in duration-200">
                    {deudaConsultada > 0 ? (
                      <span>
                        Deuda pendiente encontrada: <strong className="text-slate-900 text-sm">Q {deudaConsultada.toFixed(2)}</strong>. El monto a debitar se ha fijado automáticamente.
                      </span>
                    ) : esPrepago ? (
                      <span>
                        Servicio prepago (recarga) detectado. Ingrese el monto que desea recargar a continuación.
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-bold">
                        ✓ No se encontraron saldos pendientes para este identificador.
                      </span>
                    )}
                  </div>
                )}
                
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                    Referencia (Opcional)
                  </label>
                  <input
                    type="text"
                    value={referenciaCliente}
                    onChange={(e) => setReferenciaCliente(e.target.value)}
                    placeholder="Ej. Pago de luz de la casa"
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
                    disabled={!esPrepago}
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    placeholder="0.00"
                    className="w-48 px-2 py-2 text-center bg-transparent border-b-2 border-slate-300 font-black text-5xl text-slate-900 focus:border-blue-700 outline-none transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || deudaConsultada === null || (deudaConsultada <= 0 && !esPrepago)}
                className="w-full bg-blue-900 hover:bg-blue-800 text-white font-medium py-3.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-4 shadow-md"
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
          );
        })()}
      </div>
    </div>
  );
}
