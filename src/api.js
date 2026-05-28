import {
  API_URL,
  AUTH_LOGIN_PATH,
  AUTH_LOGIN_CREDENTIAL_FIELD,
  AUTH_LOGIN_PASSWORD_FIELD,
  API_WITH_CREDENTIALS,
  UI_CONFIG_PATH
} from './config.js';

const ROLE_STORAGE_KEY = 'role';

function normalizeRole(rawRole) {
  if (rawRole == null) return null;
  const role = String(rawRole).trim().toLowerCase();
  if (!role) return null;
  if (role === 'admin' || role === 'administrador' || role === 'administrator') return 'admin';
  if (role === 'usuario' || role === 'user' || role === 'cliente') return 'usuario';
  return null;
}

function extractRoleFromLoginResponse(payload) {
  if (payload == null || typeof payload !== 'object') return null;

  const direct = [
    payload.role,
    payload.rol,
    payload.perfil,
    payload.tipoUsuario,
    payload.tipo,
    payload.permiso,
    payload.privilegio
  ];
  for (const candidate of direct) {
    const normalized = normalizeRole(candidate);
    if (normalized) return normalized;
  }

  const nestedCandidates = [
    payload.user?.role,
    payload.user?.rol,
    payload.usuario?.role,
    payload.usuario?.rol,
    payload.claims?.role,
    payload.claims?.rol
  ];
  for (const candidate of nestedCandidates) {
    const normalized = normalizeRole(candidate);
    if (normalized) return normalized;
  }

  if (payload.isAdmin === true || payload.esAdmin === true) return 'admin';
  if (payload.isAdmin === false || payload.esAdmin === false) return 'usuario';

  return null;
}

// Auxiliar para obtener el token almacenado
function getAuthHeader() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

/** Normaliza respuestas de listado (Kardex, bitácora) cuando la API envuelve el arreglo en un objeto. */
function asMovimientosList(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload == null || typeof payload !== 'object') return [];
  const keys = ['data', 'items', 'movimientos', 'registros', 'result', 'kardex', 'bitacora'];
  for (const k of keys) {
    const v = payload[k];
    if (Array.isArray(v)) return v;
  }
  return [];
}

function asCatalogList(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload == null || typeof payload !== 'object') return [];
  const keys = [
    'data',
    'items',
    'result',
    'catalogo',
    'catalogoServicios',
    'catalogoTipos',
    'servicios',
    'serviciosPublicos',
    'tipos',
    'tiposCuenta',
    'lista'
  ];
  for (const k of keys) {
    const v = payload[k];
    if (Array.isArray(v)) return v;
  }
  return [];
}

// Auxiliar centralizado para realizar las peticiones HTTP
function buildUrl(path) {
  const raw = String(path || '');
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${API_URL}${raw}`;
}

async function request(path, options = {}) {
  const url = buildUrl(path);
  const method = (options.method || 'GET').toUpperCase();

  // Solo Content-Type JSON cuando hay cuerpo (evita GET con body-type que algunos proxies/API rechazan)
  const headers = {
    ...getAuthHeader(),
    ...options.headers
  };
  if (options.body != null && !headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    method,
    headers
  };
  if (API_WITH_CREDENTIALS && config.credentials == null) {
    config.credentials = 'include';
  }

  try {
    const response = await fetch(url, config);
    
    // Si la respuesta no es OK, intentamos parsear el error que devuelve la API
    if (!response.ok) {
      let errorMsg = `Error del servidor (${response.status})`;
      try {
        const errData = await response.json();
        errorMsg = errData.message || errData.title || errData.error || errorMsg;
      } catch (e) {
        try {
          const errText = await response.text();
          if (errText) errorMsg = errText;
        } catch (_) {}
      }
      const err = new Error(errorMsg);
      err.status = response.status;
      err.url = url;
      throw err;
    }

    // Algunas peticiones de éxito no devuelven contenido (204) o devuelven texto plano
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    console.error(`Error en API ${path}:`, error);
    throw error;
  }
}

async function requestFirstOk(paths, options = {}) {
  let lastError = null;
  for (const path of paths) {
    try {
      return await request(path, options);
    } catch (error) {
      lastError = error;
    }
  }
  if (lastError) throw lastError;
  throw new Error('No hay endpoints disponibles');
}

export const BancoAPI = {
  // --- AUTH ---
  async login(credencial, password) {
    const payload = {
      [AUTH_LOGIN_CREDENTIAL_FIELD]: credencial,
      [AUTH_LOGIN_PASSWORD_FIELD]: password
    };

    const tryLogin = async (path, method, body) => {
      return await request(path, {
        method,
        body
      });
    };

    let response;
    try {
      response = await tryLogin(AUTH_LOGIN_PATH, 'POST', JSON.stringify(payload));
    } catch (error) {
      const status = error?.status;
      if (status === 405) {
        const pathWithSlash = AUTH_LOGIN_PATH.endsWith('/') ? AUTH_LOGIN_PATH : `${AUTH_LOGIN_PATH}/`;
        try {
          response = await tryLogin(pathWithSlash, 'POST', JSON.stringify(payload));
        } catch (secondError) {
          const qs = new URLSearchParams(payload).toString();
          response = await tryLogin(`${AUTH_LOGIN_PATH}?${qs}`, 'GET');
        }
      } else {
        throw error;
      }
    }
    
    // Si el login fue exitoso y devolvió datos (por ejemplo, un token)
    if (response && response.token) {
      localStorage.setItem('token', response.token);
    }
    // Guardar también la credencial para saber quién inició sesión
    localStorage.setItem('credencial', credencial);

    // Persistir el rol de forma segura si la API lo devuelve
    localStorage.removeItem(ROLE_STORAGE_KEY);
    const normalizedRole = extractRoleFromLoginResponse(response);
    if (normalizedRole) {
      localStorage.setItem(ROLE_STORAGE_KEY, normalizedRole);
    }
    
    return response;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('credencial');
    localStorage.removeItem(ROLE_STORAGE_KEY);
  },

  // --- CUENTAHABIENTES ---
  async crearCuentahabiente(dpi, nit, nombre, apellido, telefono, email, idTipoCuenta) {
    return await request('/api/Cuentahabientes/perfil', {
      method: 'POST',
      body: JSON.stringify({
        dpi,
        nit,
        nombre,
        apellido,
        telefono: telefono || null,
        email: email || null,
        idTipoCuenta: parseInt(idTipoCuenta, 10)
      })
    });
  },

  async asociarTarjeta(idCuenta) {
    return await request('/api/Cuentahabientes/tarjeta', {
      method: 'POST',
      body: JSON.stringify({
        idCuenta: parseInt(idCuenta, 10)
      })
    });
  },

  // --- OPERACIONES ---
  async obtenerSaldo(idCuenta) {
    return await request(`/api/Operaciones/saldo/${idCuenta}`);
  },

  async deposito(idCuenta, monto, referencia) {
    return await request('/api/Operaciones/deposito', {
      method: 'POST',
      body: JSON.stringify({
        idCuenta: parseInt(idCuenta, 10),
        monto: parseFloat(monto),
        referencia: referencia || null
      })
    });
  },

  async retiro(idCuenta, monto, referencia) {
    return await request('/api/Operaciones/retiro', {
      method: 'POST',
      body: JSON.stringify({
        idCuenta: parseInt(idCuenta, 10),
        monto: parseFloat(monto),
        referencia: referencia || null
      })
    });
  },

  async activarCuenta(idCuenta, montoDeposito) {
    return await request('/api/Operaciones/activar-cuenta', {
      method: 'POST',
      body: JSON.stringify({
        idCuenta: parseInt(idCuenta, 10),
        montoDeposito: parseFloat(montoDeposito)
      })
    });
  },

  async transferir(idCuentaOrigen, idCuentaDestino, monto, descripcion) {
    return await request('/api/Operaciones/transferir', {
      method: 'POST',
      body: JSON.stringify({
        idCuentaOrigen: parseInt(idCuentaOrigen, 10),
        idCuentaDestino: parseInt(idCuentaDestino, 10),
        monto: parseFloat(monto),
        descripcion: descripcion
      })
    });
  },

  // --- PAGOS ---
  async consultarDeuda(tipoServicio, identificador) {
    return await request(`/api/Pagos/consultar-deuda/${tipoServicio}/${identificador}`);
  },

  async validarPago(tipoServicio, identificador) {
    return await request('/api/Pagos/validar', {
      method: 'POST',
      body: JSON.stringify({
        tipoServicio: parseInt(tipoServicio, 10),
        identificador
      })
    });
  },

  async ejecutarPago(numeroTarjeta, pin, tipoServicio, identificador, monto, referenciaCliente) {
    return await request('/api/Pagos/ejecutar', {
      method: 'POST',
      body: JSON.stringify({
        numeroTarjeta,
        pin,
        tipoServicio: parseInt(tipoServicio, 10),
        identificador,
        monto: parseFloat(monto),
        referenciaCliente: referenciaCliente || null
      })
    });
  },

  // --- BITACORA Y DIAGNOSTICOS ---
  async obtenerKardex(idCuenta, desde = null, hasta = null) {
    let query = '';
    const params = [];
    if (desde) params.push(`desde=${encodeURIComponent(desde)}`);
    if (hasta) params.push(`hasta=${encodeURIComponent(hasta)}`);
    if (params.length > 0) query = `?${params.join('&')}`;

    const raw = await request(`/api/Bitacora/kardex/${idCuenta}${query}`);
    return asMovimientosList(raw);
  },

  async obtenerIntegraciones() {
    return await request('/api/diagnostico/integraciones');
  },

  async obtenerServiciosPago() {
    const raw = await requestFirstOk([
      '/api/Catalogos/servicios',
      '/api/Servicios',
      '/api/Pagos/servicios',
      '/api/Pagos/catalogo-servicios',
      '/api/ServiciosPublicos',
      '/api/Pagos/servicios-publicos',
      '/api/Servicios/externos'
    ]);
    return asCatalogList(raw);
  },

  async obtenerTiposCuenta() {
    const raw = await requestFirstOk([
      '/api/Catalogos/tipos-cuenta',
      '/api/TiposCuenta',
      '/api/Cuentas/tipos',
      '/api/Cuentahabientes/tipos-cuenta'
    ]);
    return asCatalogList(raw);
  },

  async obtenerResumenOperacional() {
    return await request('/api/diagnostico/resumen');
  },

  async obtenerAmlKyc() {
    return await request('/api/diagnostico/aml');
  },

  async obtenerUiConfig() {
    if (!UI_CONFIG_PATH) return null;
    return await request(UI_CONFIG_PATH);
  }
};
