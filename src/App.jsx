import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import ClientLayout from './layouts/ClientLayout';
import LoginView from './features/auth/LoginView';
import DashboardView from './features/client/DashboardView';
import TransferView from './features/client/TransferView';
import PaymentView from './features/client/PaymentView';
import ClientsView from './features/admin/ClientsView';

const UnauthorizedView = () => <div className="p-8 text-red-600"><h1 className="text-2xl font-bold">403 - No Autorizado</h1><p>No tienes permiso para ver esta página.</p></div>;

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginView />} />
        <Route path="/unauthorized" element={<UnauthorizedView />} />
        
        {/* Redirect root to login for now */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'ADMINISTRADOR']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<ClientsView />} />
            <Route path="clients" element={<ClientsView />} />
          </Route>
        </Route>

        {/* Protected Client Routes */}
        <Route element={<ProtectedRoute allowedRoles={['CLIENTE', 'USUARIO']} />}>
          <Route path="/client" element={<ClientLayout />}>
            <Route index element={<DashboardView />} />
            <Route path="transfer" element={<TransferView />} />
            <Route path="payment" element={<PaymentView />} />
          </Route>
        </Route>

        {/* Catch all (404) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
