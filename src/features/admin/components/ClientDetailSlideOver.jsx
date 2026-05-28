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

  // Kardex state
  const [kardex, setKardex] = useState([]);
  const [kardexLoading, setKardexLoading] = useState(false);

  const isCreateMode = !client;

  // Sync state when client changes
  useEffect(() => {
    if (client) {
      setDpi(client.dpi || '');
      setNit(client.nit || '');
      setNombre(client.nombre || '');
      setApellido(client.apellido || '');
    } else {
      setDpi('');
      setNit('');
      setNombre('');
      setApellido('');
    }
    setError(null);
    setSuccessMsg('');
    setActiveTab('perfil');
  }, [client, isOpen]);

  // Auto-fetch Kardex if tab changes to 'kardex'
  useEffect(() => {
    if (activeTab === 'kardex' && client && client.idCuenta) {
      const fetchKardex = async () => {
        try {
          setKardexLoading(true);
          const response = await api.get(`/api/Bitacora/kardex/${client.idCuenta}`);
          setKardex(response.data || []);
        } catch (err) {
          setError('Error al obtener el kardex de la cuenta.');
        } finally {
          setKardexLoading(false);
        }
      };
      fetchKardex();
    }
  }, [activeTab, client]);

  if (!isOpen) return null;

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/api/Cuentahabientes/perfil', { dpi, nit, nombre, apellido });
      setSuccessMsg('Perfil creado exitosamente.');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear perfil.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssociateCard = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/api/Cuentahabientes/tarjeta', { idCuenta: client.idCuenta });
      setSuccessMsg('Tarjeta asociada exitosamente.');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al asociar tarjeta.');
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
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2">Asociar Nueva Tarjeta</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Genera una tarjeta de débito vinculada a la cuenta #{client?.idCuenta} del cliente.
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
