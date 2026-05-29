import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { X, CreditCard, History, User } from 'lucide-react';

export default function ClientDetailSlideOver({ isOpen, onClose, client, onSuccess }) {
  const [activeTab, setActiveTab] = useState('perfil');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Perfil form state
  const [dpi, setDpi] = useState('');
  const [nit, setNit] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [idTipoCuenta, setIdTipoCuenta] = useState('1');

  // Cuenta state
  const [cuenta, setCuenta] = useState(null);
  const [loadingCuenta, setLoadingCuenta] = useState(false);
  const [montoDeposito, setMontoDeposito] = useState('');
  const [createdClientInfo, setCreatedClientInfo] = useState(null);
  const [createdCardInfo, setCreatedCardInfo] = useState(null);

  // Kardex state
  const [kardex, setKardex] = useState([]);
  const [kardexLoading, setKardexLoading] = useState(false);

  const isCreateMode = !client;

  // Sync state when client changes
  useEffect(() => {
    const fetchCuenta = async () => {
      try {
        setLoadingCuenta(true);
        setError(null);
        const response = await api.get(`/api/Cuentahabientes/${client.idCliente}/cuentas`);
        const cuentasData = Array.isArray(response.data) ? response.data : response.data?.valor || [];
        if (cuentasData.length > 0) {
          setCuenta(cuentasData[0]);
        } else {
          setCuenta(null);
        }
      } catch (err) {
        setError(err.response?.data?.mensaje || err.response?.data?.error || 'Error al cargar la cuenta del cliente.');
      } finally {
        setLoadingCuenta(false);
      }
    };

    if (client && isOpen) {
      setDpi(client.dpi || '');
      setNit(client.nit || '');
      setNombre(client.nombre || '');
      setApellido(client.apellido || '');
      setTelefono(client.telefono || '');
      setEmail(client.email || '');
      setIdTipoCuenta(client.idTipoCuenta ? String(client.idTipoCuenta) : '1');
      fetchCuenta();
    } else {
      setDpi('');
      setNit('');
      setNombre('');
      setApellido('');
      setTelefono('');
      setEmail('');
      setIdTipoCuenta('1');
      setCuenta(null);
    }
    setError(null);
    setSuccessMsg('');
    setMontoDeposito('');
    setCreatedClientInfo(null);
    setCreatedCardInfo(null);
    setActiveTab('perfil');
  }, [client, isOpen]);

  // Auto-fetch Kardex if tab changes to 'kardex'
  useEffect(() => {
    if (activeTab === 'kardex' && cuenta?.idCuenta) {
      const fetchKardex = async () => {
        try {
          setKardexLoading(true);
          const response = await api.get(`/api/Bitacora/kardex/${cuenta.idCuenta}`);
          setKardex(response.data || []);
        } catch (err) {
          setError(err.response?.data?.mensaje || err.response?.data?.error || 'Error al obtener el kardex de la cuenta.');
        } finally {
          setKardexLoading(false);
        }
      };
      fetchKardex();
    }
  }, [activeTab, cuenta]);

  if (!isOpen) return null;

  if (createdClientInfo) {
    return (
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
          onClick={() => {
            setCreatedClientInfo(null);
            setCreatedCardInfo(null);
            onClose();
            if (onSuccess) onSuccess();
          }}
        />
        
        {/* SlideOver Panel */}
        <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Registro Exitoso</h2>
            <button 
              onClick={() => {
                setCreatedClientInfo(null);
                setCreatedCardInfo(null);
                onClose();
                if (onSuccess) onSuccess();
              }}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-800 text-sm">
              <h3 className="font-bold mb-1">¡Cuentahabiente Registrado!</h3>
              <p>El perfil se ha creado y se ha asociado una tarjeta de débito automáticamente en el core bancario.</p>
            </div>

            {/* Credentials Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Credenciales de Acceso</h4>
              <div className="flex justify-between items-end border-b border-slate-200 pb-2">
                <div>
                  <span className="block text-xs text-slate-500 font-medium">Nombre Completo</span>
                  <span className="text-sm font-bold text-slate-950">{createdClientInfo.nombreCompleto}</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(createdClientInfo.nombreCompleto)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                >
                  Copiar
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col justify-between border-r border-slate-200 pr-2">
                  <div>
                    <span className="block text-xs text-slate-500 font-medium">Usuario (DPI)</span>
                    <span className="text-sm font-mono font-bold text-slate-950">{createdClientInfo.usuarioAsignado}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(createdClientInfo.usuarioAsignado)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded transition-colors self-start mt-2"
                  >
                    Copiar
                  </button>
                </div>
                <div className="flex flex-col justify-between">
                  <div>
                    <span className="block text-xs text-slate-500 font-medium">Contraseña Temporal</span>
                    <span className="text-sm font-mono font-bold text-slate-950">{createdClientInfo.passwordTemporal}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(createdClientInfo.passwordTemporal)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded transition-colors self-start mt-2"
                  >
                    Copiar
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                * Entregue estas credenciales al cliente para su acceso inicial.
              </p>
            </div>

            {/* Card Box */}
            {createdCardInfo ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard size={14} className="text-slate-600" /> Tarjeta de Débito Generada
                </h4>
                <div className="flex justify-between items-end border-b border-slate-200 pb-2">
                  <div>
                    <span className="block text-xs text-slate-500 font-medium">Número de Tarjeta</span>
                    <span className="text-sm font-mono font-bold text-slate-950">
                      {createdCardInfo.numeroTarjeta}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(createdCardInfo.numeroTarjeta)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                  >
                    Copiar
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col justify-between border-r border-slate-200 pr-2">
                    <div>
                      <span className="block text-xs text-slate-500 font-medium">Vencimiento</span>
                      <span className="text-sm font-mono font-bold text-slate-950">
                        {String(createdCardInfo.mesVencimiento).padStart(2, '0')}/{createdCardInfo.anioVencimiento}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(`${String(createdCardInfo.mesVencimiento).padStart(2, '0')}/${createdCardInfo.anioVencimiento}`)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded transition-colors self-start mt-2"
                    >
                      Copiar
                    </button>
                  </div>
                  <div className="flex flex-col justify-between border-r border-slate-200 pr-2 pl-1">
                    <div>
                      <span className="block text-xs text-slate-500 font-medium">CVV</span>
                      <span className="text-sm font-mono font-bold text-slate-950">{createdCardInfo.cvv}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(createdCardInfo.cvv)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded transition-colors self-start mt-2"
                    >
                      Copiar
                    </button>
                  </div>
                  <div className="flex flex-col justify-between pl-1">
                    <div>
                      <span className="block text-xs text-slate-500 font-medium">PIN</span>
                      <span className="text-sm font-mono font-bold text-slate-950">{createdCardInfo.pin}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(createdCardInfo.pin)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded transition-colors self-start mt-2"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-lg border border-amber-200">
                ⚠ No se pudo generar la tarjeta automáticamente. Puede generarla desde la pestaña Operativa del perfil.
              </div>
            )}

            <button
              onClick={() => {
                setCreatedClientInfo(null);
                setCreatedCardInfo(null);
                onClose();
                if (onSuccess) onSuccess();
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl text-sm transition-colors mt-6"
            >
              Finalizar y Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg('');
    try {
      const response = await api.post('/api/Cuentahabientes/perfil', { 
        dpi, 
        nit, 
        nombre, 
        apellido,
        telefono: telefono || null,
        email: email || null,
        idTipoCuenta: parseInt(idTipoCuenta, 10)
      });
      const data = response.data;
      setCreatedClientInfo(data);

      // Cargar la cuenta del nuevo cliente recién creado para asociar la tarjeta
      try {
        const resCuentas = await api.get(`/api/Cuentahabientes/${data.idCliente}/cuentas`);
        const cuentasData = Array.isArray(resCuentas.data) ? resCuentas.data : resCuentas.data?.valor || [];
        if (cuentasData.length > 0) {
          const cuentaNueva = cuentasData[0];
          setCuenta(cuentaNueva);
          // Asociar tarjeta de débito automáticamente
          const resTarjeta = await api.post('/api/Cuentahabientes/tarjeta', { idCuenta: cuentaNueva.idCuenta });
          setCreatedCardInfo(resTarjeta.data);
        }
      } catch (errCuentas) {
        console.warn("No se pudo cargar la cuenta o asociar la tarjeta tras registrar el perfil", errCuentas);
        setError("Se creó el perfil pero no se pudo asociar la tarjeta automáticamente.");
      }
    } catch (err) {
      setError(err.response?.data?.mensaje || err.response?.data?.error || 'Error al registrar perfil.');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateAccount = async (e) => {
    e.preventDefault();
    const parsedMonto = parseFloat(montoDeposito);
    if (isNaN(parsedMonto) || parsedMonto <= 0) {
      setError('El monto de depósito debe ser mayor a cero.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMsg('');
    try {
      await api.post('/api/Operaciones/activar-cuenta', {
        idCuenta: cuenta.idCuenta,
        montoDeposito: parsedMonto
      });
      setSuccessMsg('Cuenta activada exitosamente con depósito inicial.');
      setCuenta(prev => ({
        ...prev,
        idEstado: 1,
        saldo: parsedMonto
      }));
      setMontoDeposito('');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.mensaje || err.response?.data?.error || 'Error al activar la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssociateCard = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/api/Cuentahabientes/tarjeta', { idCuenta: cuenta.idCuenta });
      setSuccessMsg('Tarjeta asociada exitosamente.');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.mensaje || err.response?.data?.error || 'Error al asociar tarjeta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* SlideOver Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">
            {isCreateMode ? 'Nuevo Cuentahabiente' : 'Detalle de Cliente'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs (Only show if viewing existing client) */}
        {!isCreateMode && (
          <div className="flex border-b border-slate-200 px-6">
            <button
              onClick={() => setActiveTab('perfil')}
              className={`pb-3 pt-4 px-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 mr-6 ${
                activeTab === 'perfil' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <User size={16} /> Perfil
            </button>
            <button
              onClick={() => setActiveTab('operativa')}
              className={`pb-3 pt-4 px-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 mr-6 ${
                activeTab === 'operativa' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <CreditCard size={16} /> Operativa
            </button>
            <button
              onClick={() => setActiveTab('kardex')}
              className={`pb-3 pt-4 px-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'kardex' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <History size={16} /> Kardex
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="px-6 pt-4">
          {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 font-medium mb-2">{error}</div>}
          {successMsg && <div className="p-3 bg-emerald-50 text-emerald-700 text-sm rounded-lg border border-emerald-100 font-medium mb-2">{successMsg}</div>}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 pt-2">
          
          {/* Tab 1: Perfil (Creation / View) */}
          {activeTab === 'perfil' && (
            <form onSubmit={handleCreateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">DPI</label>
                <input 
                  type="text" 
                  value={dpi} 
                  onChange={(e) => setDpi(e.target.value)} 
                  disabled={!isCreateMode}
                  required 
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-blue-600 outline-none disabled:opacity-70 disabled:cursor-not-allowed" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">NIT</label>
                <input 
                  type="text" 
                  value={nit} 
                  onChange={(e) => setNit(e.target.value)} 
                  disabled={!isCreateMode}
                  required 
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-blue-600 outline-none disabled:opacity-70 disabled:cursor-not-allowed" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre</label>
                <input 
                  type="text" 
                  value={nombre} 
                  onChange={(e) => setNombre(e.target.value)} 
                  disabled={!isCreateMode}
                  required 
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-blue-600 outline-none disabled:opacity-70 disabled:cursor-not-allowed" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Apellido</label>
                <input 
                  type="text" 
                  value={apellido} 
                  onChange={(e) => setApellido(e.target.value)} 
                  disabled={!isCreateMode}
                  required 
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-blue-600 outline-none disabled:opacity-70 disabled:cursor-not-allowed" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Teléfono</label>
                <input 
                  type="tel" 
                  value={telefono} 
                  onChange={(e) => setTelefono(e.target.value)} 
                  disabled={!isCreateMode}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-blue-600 outline-none disabled:opacity-70 disabled:cursor-not-allowed" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  disabled={!isCreateMode}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-blue-600 outline-none disabled:opacity-70 disabled:cursor-not-allowed" 
                />
              </div>
              {isCreateMode && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo de Cuenta</label>
                  <select 
                    value={idTipoCuenta} 
                    onChange={(e) => setIdTipoCuenta(e.target.value)} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-blue-600 outline-none cursor-pointer" 
                  >
                    <option value="1">Monetaria</option>
                    <option value="2">Ahorro</option>
                  </select>
                </div>
              )}

              {isCreateMode && (
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl disabled:opacity-70"
                >
                  {loading ? 'Creando...' : 'Registrar Perfil'}
                </button>
              )}
            </form>
          )}

          {/* Tab 2: Operativa */}
          {!isCreateMode && activeTab === 'operativa' && (
            <div className="space-y-6">
              {loadingCuenta ? (
                <div className="text-center text-slate-500 py-4">Cargando datos de la cuenta...</div>
              ) : !cuenta ? (
                <div className="text-center text-slate-500 py-4">No se encontró una cuenta activa o pendiente para este cliente.</div>
              ) : cuenta.idEstado === 3 ? (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-800">
                  <h3 className="text-sm font-bold mb-2">Cuenta Inactiva</h3>
                  <p className="text-xs">
                    La cuenta #{cuenta.idCuenta} ({cuenta.noCuenta}) se encuentra inactiva (pendiente de activación).
                  </p>
                  <p className="text-xs mt-2 font-medium">
                    El cuentahabiente debe iniciar sesión en el portal bancario y realizar su depósito inicial para activarla.
                  </p>
                </div>
              ) : cuenta.idEstado === 1 ? (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Asociar Nueva Tarjeta</h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Genera una tarjeta de débito vinculada a la cuenta #{cuenta.idCuenta} ({cuenta.noCuenta}) del cliente.
                  </p>
                  <button 
                    onClick={handleAssociateCard}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex justify-center items-center gap-2"
                  >
                    <CreditCard size={16} />
                    {loading ? 'Procesando...' : 'Asociar Tarjeta'}
                  </button>
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-600 text-sm">
                  La cuenta se encuentra en un estado no editable (Estado ID: {cuenta.idEstado}).
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Historial (Kardex) */}
          {!isCreateMode && activeTab === 'kardex' && (
            <div>
              {kardexLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-lg w-full"></div>
                  ))}
                </div>
              ) : kardex.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-500">
                  No hay movimientos registrados para esta cuenta.
                </div>
              ) : (
                <div className="space-y-3">
                  {kardex.map((mov, idx) => (
                    <div key={idx} className="p-4 border border-slate-100 bg-slate-50 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-slate-800 uppercase">{mov.tipo || 'Operación'}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{new Date(mov.fecha).toLocaleDateString()}</p>
                      </div>
                      <div className={`font-mono font-bold ${mov.monto < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {mov.monto > 0 ? '+' : ''}Q {Math.abs(mov.monto).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
