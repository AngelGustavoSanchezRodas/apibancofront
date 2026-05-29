import { useState, useEffect } from 'react';
import { Search, Plus, Users } from 'lucide-react';
import ClientDetailSlideOver from './components/ClientDetailSlideOver';
import api from '../../services/api';

export default function ClientsView() {
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [error, setError] = useState(null); // NUEVO: Estado de error
  
  const [isSlideOverOpen, setSlideOverOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const fetchClients = async () => {
    try {
      setError(null);
      const response = await api.get('/api/Cuentahabientes');
      const data = Array.isArray(response.data) ? response.data : response.data?.valor || response.data?.data || [];
      setClients(data);
      setFilteredClients(data);
    } catch (err) {
      setError(err.response?.data?.mensaje || err.response?.data?.error || 'Error al cargar la lista de clientes.');
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (search) {
      const lowerSearch = search.toLowerCase();
      setFilteredClients(
        clients.filter(
          (c) => 
            c.nombre?.toLowerCase().includes(lowerSearch) || 
            c.apellido?.toLowerCase().includes(lowerSearch) ||
            c.dpi?.includes(lowerSearch) ||
            c.idCliente?.toString().includes(lowerSearch) // CORRECCIÓN: idCliente
        )
      );
    } else {
      setFilteredClients(clients);
    }
  }, [search, clients]);

  const handleOpenCreate = () => {
    setSelectedClient(null); 
    setSlideOverOpen(true);
  };

  const handleOpenDetail = (client) => {
    setSelectedClient(client);
    setSlideOverOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users size={24} className="text-slate-700" />
            Gestión de Clientes
          </h2>
          <p className="text-sm text-slate-500 mt-1">Busca, administra y asocia servicios a los cuentahabientes.</p>
        </div>
        
        <button 
          onClick={handleOpenCreate}
          className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors flex items-center gap-2 shrink-0"
        >
          <Plus size={16} />
          Nuevo Cliente
        </button>
      </div>

      {/* NUEVO: Mostrar error si falla la API */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 font-medium">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-colors"
              placeholder="Buscar por nombre, DPI o ID Cliente..."
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
              <tr>
                <th className="py-3 px-6 font-semibold text-slate-600 uppercase text-xs tracking-wider">ID Cliente</th>
                <th className="py-3 px-6 font-semibold text-slate-600 uppercase text-xs tracking-wider">Cliente</th>
                <th className="py-3 px-6 font-semibold text-slate-600 uppercase text-xs tracking-wider">DPI / NIT</th>
                <th className="py-3 px-6 font-semibold text-slate-600 uppercase text-xs tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client) => (
                <tr 
                  key={client.idCliente} // CORRECCIÓN: Key correcta
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => handleOpenDetail(client)}
                >
                  <td className="py-4 px-6 font-mono font-medium text-slate-900">#{client.idCliente}</td>
                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-900">{client.nombre} {client.apellido}</div>
                  </td>
                  <td className="py-4 px-6 text-slate-500">
                    <div className="text-xs">DPI: <span className="font-mono">{client.dpi}</span></div>
                    <div className="text-xs">NIT: <span className="font-mono">{client.nit}</span></div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button className="text-blue-600 hover:text-blue-800 font-medium text-xs">
                      Ver Detalles →
                    </button>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && !error && (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-slate-500">
                    No se encontraron clientes que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ClientDetailSlideOver 
        isOpen={isSlideOverOpen} 
        onClose={() => setSlideOverOpen(false)}
        client={selectedClient}
        onSuccess={fetchClients} 
      />
    </div>
  );
}