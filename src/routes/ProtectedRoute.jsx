import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, role } = useAuthStore();

  // 1. Si no hay token de autenticación, expulsar al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 2. Normalización segura: Evita fallos si 'role' es null/undefined y homogeniza a MAYÚSCULAS
  const userRole = role ? String(role).trim().toUpperCase() : '';
  const rolesPermitidos = allowedRoles ? allowedRoles.map(r => String(r).toUpperCase()) : [];

  // 3. Comparar roles exactos sin importar cómo los envió el backend
  if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(userRole)) {
    console.warn(`[Seguridad] Acceso denegado. Rol esperado: ${rolesPermitidos}. Rol recibido: ${userRole}`);
    return <Navigate to="/unauthorized" replace />;
  }

  // 4. Si todo está correcto, renderiza la vista solicitada
  return <Outlet />;
}