import { BancoAPI } from './api.js';
import * as UI from './ui.js';
import { ADMIN_DEFAULT_ACCOUNT_ID, API_URL } from './config.js';

// --- MAPEO DE RUTAS Y ROLES REQUERIDOS ---
const ROUTES = {
  'login': { role: 'guest' },
  'cuenta': { role: 'usuario' },
  'movimientos': { role: 'usuario' },
  'operaciones': { role: 'usuario' },
  'pagos': { role: 'usuario' },
  'clientes': { role: 'admin' },
  'aprobaciones': { role: 'admin' },
  'bitacora': { role: 'admin' }
};

const ROLE_STORAGE_KEY = 'role';
const BITACORA_ACCOUNT_STORAGE_KEY = 'bitacoraAccountId';
const ADMIN_ALIAS_ENV = import.meta.env.VITE_ADMIN_ALIASES || import.meta.env.VITE_ADMIN_ALIAS || '';
const ADMIN_ALIASES = ADMIN_ALIAS_ENV
  .split(',')
  .map((alias) => alias.trim())
  .filter(Boolean);

function normalizeRole(rawRole) {
  if (rawRole == null) return null;
  const role = String(rawRole).trim().toLowerCase();
  if (!role) return null;
  if (role === 'admin' || role === 'administrador' || role === 'administrator') return 'admin';
  if (role === 'usuario' || role === 'user' || role === 'cliente') return 'usuario';
  return null;
}

function resolveRoleFromCredencial(credencial) {
  if (!credencial) return 'usuario';
  const normalized = String(credencial).trim().toLowerCase();
  if (ADMIN_ALIASES.length === 0) return 'usuario';
  const isAdmin = ADMIN_ALIASES.some((alias) => alias.toLowerCase() === normalized);
  return isAdmin ? 'admin' : 'usuario';
}

function resolveRoleFromStorage(credencial) {
  const storedRole = normalizeRole(localStorage.getItem(ROLE_STORAGE_KEY));
  return storedRole || resolveRoleFromCredencial(credencial);
}

function formatDemoCredential(user, pass) {
  if (!user && !pass) return 'No configuradas';
  const safeUser = user || 'usuario';
  const safePass = pass || '******';
  return `${safeUser} / ${safePass}`;
}

function setupDemoCredentials() {
  const container = document.getElementById('demo-credentials');
  if (!container) return;

  const showDemo = String(import.meta.env.VITE_SHOW_DEMO_CREDS || '').toLowerCase() === 'true';
  if (!showDemo) {
    container.classList.add('hidden');
    return;
  }

  const adminUser = import.meta.env.VITE_DEMO_ADMIN_USER || '';
  const adminPass = import.meta.env.VITE_DEMO_ADMIN_PASS || '';
  const userUser = import.meta.env.VITE_DEMO_USER || '';
  const userPass = import.meta.env.VITE_DEMO_USER_PASS || '';

  container.classList.remove('hidden');

  const adminSlot = document.getElementById('demo-admin-cred');
  if (adminSlot) adminSlot.textContent = formatDemoCredential(adminUser, adminPass);

  const userSlot = document.getElementById('demo-user-cred');
  if (userSlot) userSlot.textContent = formatDemoCredential(userUser, userPass);
}

// --- CONFIGURACIÓN DE ESTADO GLOBAL SEGURO EN MEMORIA ---
let state = {
  role: 'usuario', 
  activeUser: null,
  activeAccount: null
};

function setHeaderUserBadge(text) {
  const el = document.getElementById('header-user-badge');
  if (el) el.textContent = text;
}

function getBitacoraAccountId() {
  const stored = localStorage.getItem(BITACORA_ACCOUNT_STORAGE_KEY);
  if (stored) return String(stored);
  if (ADMIN_DEFAULT_ACCOUNT_ID) return String(ADMIN_DEFAULT_ACCOUNT_ID);
  return '';
}

function persistBitacoraAccountId(idCuenta) {
  if (idCuenta) {
    localStorage.setItem(BITACORA_ACCOUNT_STORAGE_KEY, String(idCuenta));
  }
}

function showApiConfigWarning() {
  const banner = document.getElementById('api-config-banner');
  if (!banner) return;
  const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  if (!API_URL && isLocalhost) {
    banner.classList.remove('hidden');
    banner.textContent =
      'VITE_API_URL no está configurada. Copia .env.example a .env y define la URL del backend.';
    return;
  }
  banner.classList.add('hidden');
}

async function loadBitacoraAdmin(idCuenta) {
  if (!idCuenta) {
    UI.showToast('No hay cuenta configurada para cargar la bitacora.', 'error');
    return;
  }

  UI.showLoader();
  try {
    const logs = await BancoAPI.obtenerKardex(idCuenta);
    UI.renderBitacoraAdminUI(logs);
  } catch (error) {
    UI.showToast(`Error al obtener bitacora de cuenta: ${error.message}`, 'error');
  } finally {
    UI.hideLoader();
  }
}

// --- COMPROBACIÓN DE ADULTERACIÓN DE SESIÓN (ANTI-TAMPERING) ---
function checkSessionIntegrity() {
  const localCred = localStorage.getItem('credencial');
  const localRole = normalizeRole(localStorage.getItem(ROLE_STORAGE_KEY));
  
  // Si en memoria figura logueado pero en localStorage la credencial cambió o se borró
  if (state.activeUser && localCred !== state.activeUser) {
    console.warn('¡Adulteración de sesión detectada!');
    forzarLogout('¡Alerta de Seguridad! Se ha detectado una modificación no autorizada de la sesión. Sesión cerrada.');
    return true;
  }

  // Si el rol fue alterado en localStorage, fuerza cierre de sesión
  if (state.activeUser && localRole && localRole !== state.role) {
    console.warn('¡Adulteración de rol detectada!');
    forzarLogout('¡Alerta de Seguridad! Se ha detectado una modificación no autorizada del rol. Sesión cerrada.');
    return true;
  }
  
  // Si en memoria figura deslogueado pero en localStorage agregaron credenciales fraudulentas
  if (!state.activeUser && (localCred || localRole)) {
    console.warn('¡Intento de sesión fraudulenta detectado!');
    forzarLogout(null);
    return true;
  }
  
  return false;
}

// Cierre de sesión forzado e inmediato
function forzarLogout(mensaje) {
  BancoAPI.logout();
  state.activeUser = null;
  state.role = 'usuario';
  state.activeAccount = null;

  setHeaderUserBadge('Visitante');
  UI.showLoginScreen();
  window.location.hash = '#/login';
  
  if (mensaje) {
    UI.showToast(mensaje, 'error');
  }
}

// --- ENRUTADOR REACTIVO (ROUTER) CON GUARDIAS DE ACCESO ---
function handleRouting() {
  // Validar si alteraron el localStorage antes de proceder
  if (checkSessionIntegrity()) {
    return;
  }

  const hash = window.location.hash || '';
  let route = hash.replace('#/', '').trim();

  // Si no hay hash en la URL, asignar la ruta predeterminada según el estado actual
  if (!route) {
    if (state.activeUser) {
      route = state.role === 'admin' ? 'clientes' : 'cuenta';
    } else {
      route = 'login';
    }
    window.location.hash = `#/${route}`;
    return;
  }

  // Redirigir a rutas por defecto si ingresa a una ruta no mapeada
  if (!ROUTES[route]) {
    route = state.activeUser ? (state.role === 'admin' ? 'clientes' : 'cuenta') : 'login';
    window.location.hash = `#/${route}`;
    return;
  }

  // Guardias para el Login (Ruta Guest)
  if (ROUTES[route].role === 'guest') {
    if (state.activeUser) {
      const defaultTab = state.role === 'admin' ? 'clientes' : 'cuenta';
      window.location.hash = `#/${defaultTab}`;
      return;
    }
    UI.showLoginScreen();
    return;
  }

  // Guardias para páginas autenticadas
  if (!state.activeUser) {
    UI.showToast('Acceso restringido: Por favor, inicie sesión.', 'error');
    window.location.hash = '#/login';
    return;
  }

  // Guardia de administrador
  if (ROUTES[route].role === 'admin' && state.role !== 'admin') {
    UI.showToast('Acceso no autorizado: requiere permisos de Administrador.', 'error');
    window.location.hash = '#/cuenta';
    return;
  }

  // Guardia de usuario normal (clientes)
  if (ROUTES[route].role === 'usuario' && state.role !== 'usuario') {
    UI.showToast('Acceso no autorizado: los administradores no operan cuentas de clientes.', 'error');
    window.location.hash = '#/clientes';
    return;
  }

  // Si todo es válido, mostrar la pestaña de forma segura
  UI.hideLoginScreen();
  UI.switchTab(route);

  if (route === 'pagos' || route === 'clientes') {
    cargarCatalogos();
  }

  if (route === 'bitacora' && state.role === 'admin') {
    const input = document.getElementById('bitacora-cuenta-id');
    const idCuenta = getBitacoraAccountId();
    if (input && idCuenta) {
      input.value = idCuenta;
    }
    if (idCuenta) {
      loadBitacoraAdmin(idCuenta);
    }
  }

  if (route === 'aprobaciones' && state.role === 'admin') {
    cargarAmlKyc();
  }
}

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
  showApiConfigWarning();
  setupDemoCredentials();
  UI.setupLiveComision();
  cargarCatalogos();
  cargarConfigUI();
  
  // Configurar listeners de clicks en los botones de navegación
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tabId = e.currentTarget.dataset.tab;
      window.location.hash = `#/${tabId}`;
    });
  });

  // Validar si existe sesión previa
  const savedUser = localStorage.getItem('credencial');
  if (savedUser) {
    state.activeUser = savedUser;
    state.role = resolveRoleFromStorage(savedUser);
    
    UI.hideLoginScreen();
    UI.setupTabs(state.role);
      setHeaderUserBadge(state.role === 'admin' ? 'Administrador Core' : `Usuario: ${savedUser}`);

    cargarCatalogos();
    cargarConfigUI();
    
    if (state.role === 'admin') {
      cargarDiagnosticoCore();
    }
  } else {
    UI.showLoginScreen();
  }

  // Escuchar cambios de hash en la URL
  window.addEventListener('hashchange', handleRouting);
  
  // Ejecutar el enrutamiento inicial
  handleRouting();

  // Encender monitoreo constante contra manipulación en DevTools (cada 1.5 segundos)
  setInterval(() => {
    checkSessionIntegrity();
  }, 1500);

  // --- OYENTES DE EVENTOS DE FORMULARIOS ---

  // Login
  document.getElementById('form-login')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const credencial = document.getElementById('login-credencial').value.trim();
    const password = document.getElementById('login-password').value;

    UI.showLoader();
    try {
      await BancoAPI.login(credencial, password);

      // Sincronizar estado seguro en memoria
      state.activeUser = credencial;
      state.role = resolveRoleFromStorage(credencial);
      if (!normalizeRole(localStorage.getItem(ROLE_STORAGE_KEY))) {
        localStorage.setItem(ROLE_STORAGE_KEY, state.role);
      }

      UI.hideLoginScreen();
      UI.setupTabs(state.role);
      setHeaderUserBadge(state.role === 'admin' ? 'Administrador Core' : `Usuario: ${credencial}`);

      await cargarCatalogos();
      await cargarConfigUI();
      
      UI.showToast(`Bienvenido al sistema transaccional, ${credencial}`, 'success');

      // Redirigir a la pestaña inicial por rol usando hash
      const defaultRoute = state.role === 'admin' ? 'clientes' : 'cuenta';
      window.location.hash = `#/${defaultRoute}`;

      if (state.role === 'admin') {
        cargarDiagnosticoCore();
      }
    } catch (error) {
      UI.showToast(`Error de autenticación: ${error.message}`, 'error');
    } finally {
      UI.hideLoader();
    }
  });

  // Logout
  document.getElementById('btn-logout')?.addEventListener('click', () => {
    forzarLogout('Sesión cerrada correctamente.');
  });

  // Consultar Saldo (Usuario)
  document.getElementById('form-consulta-cuenta')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (checkSessionIntegrity()) return;
    
    const idCuenta = document.getElementById('consulta-cuenta-id').value;
    
    UI.showLoader();
    try {
      const data = await BancoAPI.obtenerSaldo(idCuenta);
      const saldo = typeof data === 'object' ? (data.saldo ?? data.monto ?? 0) : parseFloat(data);
      
      state.activeAccount = idCuenta;
      UI.updateSaldoUI(saldo, idCuenta);
      UI.showToast(`Cuenta #${idCuenta} consultada correctamente.`, 'success');
    } catch (error) {
      UI.showToast(`No se pudo obtener el saldo: ${error.message}`, 'error');
    } finally {
      UI.hideLoader();
    }
  });

  // Filtrar Movimientos / Kardex (Usuario)
  document.getElementById('form-filtro-movimientos')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (checkSessionIntegrity()) return;

    const idCuenta = document.getElementById('filtro-cuenta-id').value;
    const desde = document.getElementById('filtro-fecha-desde').value || null;
    const hasta = document.getElementById('filtro-fecha-hasta').value || null;

    UI.showLoader();
    try {
      const movimientos = await BancoAPI.obtenerKardex(idCuenta, desde, hasta);
      UI.renderKardexUI(movimientos);
      UI.showToast(`Movimientos de la cuenta #${idCuenta} cargados.`, 'success');
    } catch (error) {
      UI.showToast(`Error al obtener movimientos: ${error.message}`, 'error');
    } finally {
      UI.hideLoader();
    }
  });

  // Depósito (Usuario)
  document.getElementById('btn-deposito')?.addEventListener('click', async () => {
    if (checkSessionIntegrity()) return;

    const idCuenta = document.getElementById('op-cuenta').value;
    const monto = document.getElementById('op-monto').value;
    const referencia = document.getElementById('op-referencia').value;

    if (!idCuenta || !monto) {
      return UI.showToast('ID Cuenta y Monto son requeridos para el depósito.', 'error');
    }

    UI.showLoader();
    try {
      await BancoAPI.deposito(idCuenta, monto, referencia);
      UI.showToast(`Depósito de Q ${parseFloat(monto).toFixed(2)} realizado con éxito.`, 'success');
      
      if (state.activeAccount && state.activeAccount === idCuenta) {
        refrescarSaldoActivo();
      }
      
      document.getElementById('form-deposito-retiro').reset();
    } catch (error) {
      UI.showToast(`Fallo en el depósito: ${error.message}`, 'error');
    } finally {
      UI.hideLoader();
    }
  });

  // Retiro (Usuario)
  document.getElementById('btn-retiro')?.addEventListener('click', async () => {
    if (checkSessionIntegrity()) return;

    const idCuenta = document.getElementById('op-cuenta').value;
    const monto = document.getElementById('op-monto').value;
    const referencia = document.getElementById('op-referencia').value;

    if (!idCuenta || !monto) {
      return UI.showToast('ID Cuenta y Monto son requeridos para el retiro.', 'error');
    }

    UI.showLoader();
    try {
      await BancoAPI.retiro(idCuenta, monto, referencia);
      UI.showToast(`Retiro de Q ${parseFloat(monto).toFixed(2)} debitado correctamente.`, 'success');
      
      if (state.activeAccount && state.activeAccount === idCuenta) {
        refrescarSaldoActivo();
      }

      document.getElementById('form-deposito-retiro').reset();
    } catch (error) {
      UI.showToast(`Fallo en el retiro: ${error.message}`, 'error');
    } finally {
      UI.hideLoader();
    }
  });

  // Transferencia ACH (Usuario)
  document.getElementById('form-transferencia')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (checkSessionIntegrity()) return;

    const origen = document.getElementById('trans-origen').value;
    const destino = document.getElementById('trans-destino').value;
    const monto = document.getElementById('trans-monto').value;
    const descripcion = document.getElementById('trans-descripcion').value;

    UI.showLoader();
    try {
      await BancoAPI.transferir(origen, destino, monto, descripcion);
      UI.showToast(`Transferencia de Q ${parseFloat(monto).toFixed(2)} completada con éxito.`, 'success');
      
      if (state.activeAccount && (state.activeAccount === origen || state.activeAccount === destino)) {
        refrescarSaldoActivo();
      }

      document.getElementById('form-transferencia').reset();
    } catch (error) {
      UI.showToast(`Error al transferir: ${error.message}`, 'error');
    } finally {
      UI.hideLoader();
    }
  });

  // Pagos: Consultar Deuda (Usuario)
  document.getElementById('btn-consultar-deuda')?.addEventListener('click', async () => {
    if (checkSessionIntegrity()) return;

    const tipoServicio = document.getElementById('pago-servicio').value;
    const identificador = document.getElementById('pago-id').value.trim();

    if (!tipoServicio) {
      return UI.showToast('Seleccione el servicio antes de consultar.', 'error');
    }
    if (!identificador) {
      return UI.showToast('Ingrese el identificador del cliente.', 'error');
    }

    UI.showLoader();
    try {
      const data = await BancoAPI.consultarDeuda(tipoServicio, identificador);
      const montoDeuda = typeof data === 'object' ? (data.monto || data.deuda || 0) : parseFloat(data);
      
      const montoInput = document.getElementById('pago-monto');
      if (montoInput) {
        montoInput.value = montoDeuda;
        montoInput.dispatchEvent(new Event('input'));
      }
      
      UI.showToast(`Deuda de Q ${parseFloat(montoDeuda).toFixed(2)} cargada del sistema externo.`, 'success');
      UI.setPagoEstadoValidacion('Deuda consultada', true);
      document.getElementById('form-ejecutar-pago').classList.remove('hidden');
    } catch (error) {
      UI.showToast(`No se pudo obtener la deuda: ${error.message}`, 'error');
      UI.setPagoEstadoValidacion('Consulta fallida', false);
    } finally {
      UI.hideLoader();
    }
  });

  // Pagos: Validar Identificador (Usuario)
  document.getElementById('form-validar-servicio')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (checkSessionIntegrity()) return;

    const tipoServicio = document.getElementById('pago-servicio').value;
    const identificador = document.getElementById('pago-id').value.trim();

    if (!tipoServicio) {
      return UI.showToast('Seleccione el servicio antes de validar.', 'error');
    }

    UI.showLoader();
    try {
      await BancoAPI.validarPago(tipoServicio, identificador);
      UI.showToast('Identificador de cliente validado y listo para cobrar.', 'success');
      UI.setPagoEstadoValidacion('Validacion exitosa', true);
      document.getElementById('form-ejecutar-pago').classList.remove('hidden');
    } catch (error) {
      UI.showToast(`Error de validación del servicio: ${error.message}`, 'error');
      UI.setPagoEstadoValidacion('Validacion fallida', false);
    } finally {
      UI.hideLoader();
    }
  });

  // Pagos: Ejecutar Liquidación (Usuario)
  document.getElementById('form-ejecutar-pago')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (checkSessionIntegrity()) return;

    const tipoServicio = document.getElementById('pago-servicio').value;
    const identificador = document.getElementById('pago-id').value.trim();
    const monto = document.getElementById('pago-monto').value;
    const tarjeta = document.getElementById('pago-tarjeta').value.trim();
    const pin = document.getElementById('pago-pin').value.trim();
    const referenciaCliente = document.getElementById('pago-referencia-cliente').value;

    UI.showLoader();
    try {
      await BancoAPI.ejecutarPago(tarjeta, pin, tipoServicio, identificador, monto, referenciaCliente);
      UI.showToast(`Pago orquestado con éxito. Q ${parseFloat(monto).toFixed(2)} liquidado según la regla configurada por el core.`, 'success');
      
      document.getElementById('form-validar-servicio').reset();
      document.getElementById('form-ejecutar-pago').reset();
      document.getElementById('form-ejecutar-pago').classList.add('hidden');
      document.getElementById('calculo-95-5')?.classList.add('hidden');
      UI.setPagoEstadoValidacion('Sin validar', false);
    } catch (error) {
      UI.showToast(`No se pudo procesar el pago: ${error.message}`, 'error');
      UI.setPagoEstadoValidacion('Pago fallido', false);
    } finally {
      UI.hideLoader();
    }
  });

  // Registrar Cuentahabiente (Admin)
  document.getElementById('form-cuentahabiente')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (checkSessionIntegrity()) return;

    const dpi = document.getElementById('cte-dpi').value.trim();
    const nit = document.getElementById('cte-nit').value.trim();
    const nombre = document.getElementById('cte-nombre').value.trim();
    const apellido = document.getElementById('cte-apellido').value.trim();
    const telefono = document.getElementById('cte-telefono').value.trim();
    const email = document.getElementById('cte-email').value.trim();
    const idTipoCuenta = document.getElementById('cte-tipo-cuenta').value;

    UI.showLoader();
    try {
      const res = await BancoAPI.crearCuentahabiente(dpi, nit, nombre, apellido, telefono, email, idTipoCuenta);
      
      let msg = 'Perfil de cuentahabiente registrado con éxito en el core.';
      if (res && res.idCuenta) {
        msg += ` ID Cuenta generada: #${res.idCuenta}`;
      } else if (typeof res === 'object') {
        msg += ` Cuenta aperturada.`;
      }
      
      UI.showToast(msg, 'success');
      UI.renderCuentahabienteCreado(res, { dpi, nit, nombre, apellido, telefono, email });
      document.getElementById('form-cuentahabiente').reset();
    } catch (error) {
      UI.showToast(`Error al registrar cuentahabiente: ${error.message}`, 'error');
    } finally {
      UI.hideLoader();
    }
  });

  // Asociar Tarjeta (Admin)
  document.getElementById('form-asociar-tarjeta')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (checkSessionIntegrity()) return;

    const idCuenta = document.getElementById('tarjeta-cuenta-id').value;

    UI.showLoader();
    try {
      const res = await BancoAPI.asociarTarjeta(idCuenta);
      
      let msg = 'Tarjeta asociada de forma exitosa.';
      if (res && res.numeroTarjeta) {
        msg += ` Tarjeta: ${res.numeroTarjeta}`;
      }
      
      UI.showToast(msg, 'success');
      document.getElementById('form-asociar-tarjeta').reset();
    } catch (error) {
      UI.showToast(`Error al asociar tarjeta: ${error.message}`, 'error');
    } finally {
      UI.hideLoader();
    }
  });

  // Activar Cuenta (Admin)
  document.getElementById('form-activar-cuenta')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (checkSessionIntegrity()) return;

    const idCuenta = document.getElementById('activar-cuenta-id').value;
    const monto = document.getElementById('activar-cuenta-monto').value;

    UI.showLoader();
    try {
      await BancoAPI.activarCuenta(idCuenta, monto);
      UI.showToast(`Cuenta #${idCuenta} activada satisfactoriamente con depósito inicial.`, 'success');
      
      if (state.activeAccount && state.activeAccount === idCuenta) {
        refrescarSaldoActivo();
      }

      document.getElementById('form-activar-cuenta').reset();
    } catch (error) {
      UI.showToast(`Error de activación de cuenta: ${error.message}`, 'error');
    } finally {
      UI.hideLoader();
    }
  });

  // Consultar Auditoría / Bitácora (Admin)
  document.getElementById('form-bitacora-admin')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (checkSessionIntegrity()) return;

    const idCuenta = document.getElementById('bitacora-cuenta-id').value;
    persistBitacoraAccountId(idCuenta);
    await loadBitacoraAdmin(idCuenta);
  });

  // Actualizar Diagnóstico de Integraciones
  document.getElementById('btn-actualizar-diagnostico')?.addEventListener('click', () => {
    if (!checkSessionIntegrity()) {
      cargarDiagnosticoCore();
    }
  });
});

// --- FUNCIONES AUXILIARES DE SOPORTE ---
async function refrescarSaldoActivo() {
  if (!state.activeAccount) return;
  try {
    const data = await BancoAPI.obtenerSaldo(state.activeAccount);
    const saldo = typeof data === 'object' ? (data.saldo ?? data.monto ?? 0) : parseFloat(data);
    UI.updateSaldoUI(saldo, state.activeAccount);
  } catch (err) {
    console.error('Error al autorrefrescar saldo:', err);
  }
}

async function cargarAmlKyc() {
  try {
    const aml = await BancoAPI.obtenerAmlKyc();
    UI.renderAmlKycUI(aml);
  } catch {
    UI.renderAmlKycUI(null);
  }
}

async function cargarDiagnosticoCore() {
  const label = document.getElementById('diagnostico-status-integracion');
  if (label) {
    label.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span> Consultando...`;
  }
  
  try {
    const status = await BancoAPI.obtenerIntegraciones();
    UI.renderDiagnosticoServicios(status);
    UI.renderDiagnosticsUI(status);
    UI.renderMetricasOperacionales(status);
  } catch (error) {
    UI.renderDiagnosticsUI(null, { fetchFailed: true });
    UI.renderDiagnosticoServicios(null);
    UI.renderMetricasOperacionales(null);
  }

  try {
    const resumen = await BancoAPI.obtenerResumenOperacional();
    UI.renderMetricasOperacionales(resumen);
  } catch (error) {
    UI.renderMetricasOperacionales(null);
  }

  await cargarAmlKyc();
}

async function cargarCatalogos() {
  try {
    const servicios = await BancoAPI.obtenerServiciosPago();
    UI.renderServiciosCatalogo(servicios);
  } catch (error) {
    UI.renderServiciosCatalogo([]);
  }

  try {
    const tipos = await BancoAPI.obtenerTiposCuenta();
    UI.renderTiposCuentaCatalogo(tipos);
  } catch (error) {
    UI.renderTiposCuentaCatalogo([]);
  }
}

async function cargarConfigUI() {
  try {
    const config = await BancoAPI.obtenerUiConfig();
    UI.renderLimiteCuentaUI(config);
    UI.renderComisionConfig(config);
  } catch (error) {
    UI.renderLimiteCuentaUI(null);
    UI.renderComisionConfig(null);
  }
}
