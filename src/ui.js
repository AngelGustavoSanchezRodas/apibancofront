// Gestión del DOM y la interfaz de usuario

// --- TOAST NOTIFICATIONS ---
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const iconWrap = document.createElement('span');
  if (type === 'success') {
    iconWrap.innerHTML = `<svg class="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  } else if (type === 'error') {
    iconWrap.innerHTML = `<svg class="w-5 h-5 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
  } else {
    iconWrap.innerHTML = `<svg class="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }

  const text = document.createElement('div');
  text.className = 'flex-1';
  text.textContent = String(message ?? '');

  toast.appendChild(iconWrap);
  toast.appendChild(text);

  container.appendChild(toast);

  // Desvanecer y remover después de 4 segundos
  setTimeout(() => {
    toast.classList.add('toast-fade-out');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 4000);
}

// --- GLOBAL LOADER OVERLAY ---
export function showLoader() {
  document.getElementById('global-loader')?.classList.remove('hidden');
}

export function hideLoader() {
  document.getElementById('global-loader')?.classList.add('hidden');
}

// --- LOGIN SCREEN CONTROL ---
export function showLoginScreen() {
  document.getElementById('login-screen')?.classList.remove('hidden');
}

export function hideLoginScreen() {
  document.getElementById('login-screen')?.classList.add('hidden');
}

// --- NAV TABS ROUTING ---
export function setupTabs(currentRole) {
  const tabs = document.querySelectorAll('.tab-content');

  // Ocultar todas las pestañas por defecto
  tabs.forEach(tab => tab.classList.add('hidden'));

  // Ocultar o mostrar botones de navegación y paneles según el rol activo
  document.querySelectorAll('[data-role]').forEach(el => {
    const roles = el.dataset.role.split(' ');
    if (roles.includes(currentRole)) {
      el.classList.remove('role-hidden');
    } else {
      el.classList.add('role-hidden');
    }
  });

  // Mostrar el panel de bienvenida del rol de administrador si aplica
  const adminHeader = document.getElementById('panel-admin-header');
  const diagPanel = document.getElementById('panel-diagnostico-operacional');
  if (currentRole === 'admin') {
    adminHeader?.classList.remove('hidden');
    diagPanel?.classList.remove('hidden');
  } else {
    adminHeader?.classList.add('hidden');
    diagPanel?.classList.add('hidden');
  }
}

export function switchTab(tabId) {
  const tabs = document.querySelectorAll('.tab-content');
  const navButtons = document.querySelectorAll('.nav-btn');

  // Ocultar todas las pestañas
  tabs.forEach(tab => tab.classList.add('hidden'));

  // Desactivar todos los botones de navegación
  navButtons.forEach(btn => btn.classList.remove('is-active'));

  // Activar la pestaña solicitada
  const targetTab = document.getElementById(`tab-${tabId}`);
  const targetBtn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);

  if (targetTab) {
    targetTab.classList.remove('hidden');
  }
  if (targetBtn) {
    targetBtn.classList.add('is-active');
  }
}

// --- UI UPDATERS & RENDERERS ---

// Actualizar información de saldo en la pantalla de la Cuenta
export function updateSaldoUI(monto, idCuenta) {
  const saldoElement = document.getElementById('cuenta-val-saldo');
  const idElement = document.getElementById('cuenta-val-id');
  const tipoElement = document.getElementById('cuenta-val-tipo');
  const lblEstado = document.getElementById('cuenta-lbl-estado');

  if (saldoElement) {
    saldoElement.textContent = `Q ${parseFloat(monto).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (idElement) {
    idElement.textContent = `# ${idCuenta}`;
  }
  if (tipoElement) {
    tipoElement.textContent = `Cuenta Monetaria Activa (Consultada en tiempo real)`;
  }
  if (lblEstado) {
    lblEstado.textContent = `Actualizado: ${new Date().toLocaleTimeString()}`;
  }
}

// Renderizar la lista de transacciones (Kardex)
export function renderKardexUI(movimientos) {
  const tbody = document.getElementById('movimientos-tabla-body');
  if (!tbody) return;

  const lista = Array.isArray(movimientos) ? movimientos : [];

  if (lista.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="p-6 text-center text-slate-400 italic">Esta cuenta no posee registros de transacciones previos en el Kardex.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = lista.map(mov => {
    const isCredito = mov.tipoOperacion === 'CREDITO' || mov.tipo === 'CREDITO' || mov.monto > 0; // Dependiendo de la convención de la API
    const tipoLabel = isCredito ? 'DEPÓSITO (CREDITO)' : 'RETIRO (DEBITO)';
    const colorClass = isCredito ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold';
    const fecha = mov.fecha || mov.fechaOperacion || new Date().toLocaleString();
    const idTrans = mov.idBitacora || mov.id || '--';
    const ref = mov.referencia || mov.descripcion || 'Sin referencia';
    const montoFormatted = `Q ${Math.abs(parseFloat(mov.monto)).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return `
      <tr class="border-b hover:bg-slate-50 transition font-medium">
        <td class="p-3 font-mono text-slate-600 text-xs">${idTrans}</td>
        <td class="p-3 text-slate-600 text-xs">${new Date(fecha).toLocaleString('es-GT')}</td>
        <td class="p-3 text-slate-800 text-xs">${ref}</td>
        <td class="p-3 text-xs uppercase text-slate-500">${tipoLabel}</td>
        <td class="p-3 text-right ${colorClass} font-mono">${montoFormatted}</td>
      </tr>
    `;
  }).join('');
}

// Renderizar auditoría de bitácora global (Admin)
export function renderBitacoraAdminUI(logs) {
  const container = document.getElementById('bitacora-admin-lista');
  if (!container) return;

  const lista = Array.isArray(logs) ? logs : [];

  if (lista.length === 0) {
    container.innerHTML = `
      <p class="text-gray-400 italic text-center py-8">No se encontraron movimientos registrados en la bitácora de auditoría para esta cuenta.</p>
    `;
    return;
  }

  container.innerHTML = lista.map(log => {
    const isCredito = log.tipoOperacion === 'CREDITO' || log.tipo === 'CREDITO' || log.monto > 0;
    const badgeColor = isCredito ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200';
    const borderClass = isCredito ? 'credito' : 'debito';
    const tipo = isCredito ? 'INGRESO' : 'EGRESO';
    const fecha = log.fecha || log.fechaOperacion || new Date().toISOString();
    const ref = log.referencia || log.descripcion || log.concepto || 'Sin descripcion';
    const idTrans = log.idBitacora || log.id || '--';
    const monto = Number.parseFloat(log.monto ?? 0);
    const montoFormatted = `Q ${Math.abs(monto).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return `
      <div class="bitacora-entry ${borderClass} p-4 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs font-bold text-slate-500">ID: #${idTrans}</span>
            <span class="border text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${badgeColor}">${tipo}</span>
          </div>
          <p class="text-sm font-semibold text-slate-800">${ref}</p>
          <span class="text-xs text-slate-400">${new Date(fecha).toLocaleString('es-GT')}</span>
        </div>
        <div class="text-right">
          <p class="text-lg font-black font-mono text-slate-800">${montoFormatted}</p>
        </div>
      </div>
    `;
  }).join('');
}

function selectBestValue(item, keys) {
  for (const key of keys) {
    if (item && item[key] != null) return item[key];
  }
  return null;
}

function normalizeCatalogItem(item) {
  if (item == null) return null;
  if (typeof item === 'string' || typeof item === 'number') {
    return { value: String(item), label: String(item) };
  }
  if (typeof item !== 'object') return null;
  const value = selectBestValue(item, [
    'id',
    'codigo',
    'idServicio',
    'idServicioPublico',
    'idServicioPago',
    'idTipoServicio',
    'idTipoCuenta',
    'tipo',
    'tipoServicio',
    'value'
  ]);
  const label = selectBestValue(item, [
    'nombre',
    'nombreServicio',
    'descripcion',
    'descripcionServicio',
    'label',
    'titulo',
    'tipoCuenta',
    'servicio',
    'servicioPublico',
    'tipoServicio'
  ]);
  if (value == null || label == null) return null;
  return { value: String(value), label: String(label) };
}

function renderCatalogSelect(selectEl, items, emptyLabel) {
  if (!selectEl) return;
  const current = selectEl.value;
  const normalized = (Array.isArray(items) ? items : []).map(normalizeCatalogItem).filter(Boolean);

  selectEl.innerHTML = '';

  if (normalized.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = emptyLabel || 'Sin datos';
    selectEl.appendChild(opt);
    return;
  }

  normalized.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.value;
    opt.textContent = item.label;
    selectEl.appendChild(opt);
  });

  if (current && normalized.some((item) => item.value === current)) {
    selectEl.value = current;
  }
}

export function renderServiciosCatalogo(servicios) {
  const select = document.getElementById('pago-servicio');
  renderCatalogSelect(select, servicios, 'Sin servicios disponibles');
}

export function renderTiposCuentaCatalogo(tipos) {
  const select = document.getElementById('cte-tipo-cuenta');
  renderCatalogSelect(select, tipos, 'Sin tipos disponibles');
}

export function renderLimiteCuentaUI(data) {
  const montoEl = document.getElementById('cuenta-val-limite');
  const textoEl = document.getElementById('cuenta-lbl-limite');
  if (!montoEl || !textoEl) return;

  const limite = selectBestValue(data, ['limiteDiario', 'limite', 'montoMaximo', 'montoDiario']);
  const descripcion = selectBestValue(data, ['descripcionLimite', 'notaLimite', 'detalleLimite']);

  if (limite != null && !Number.isNaN(Number(limite))) {
    const monto = Number(limite);
    montoEl.textContent = `Q ${monto.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    textoEl.textContent = descripcion ? String(descripcion) : 'Limite operativo reportado por el core';
    return;
  }

  montoEl.textContent = 'Sin datos';
  textoEl.textContent = 'Limite diario no reportado por la API';
}

function integrationItemHealthy(item) {
  if (item == null || typeof item !== 'object') return false;
  if (item.healthy === true || item.activo === true || item.enLinea === true || item.ok === true) return true;
  const s = String(item.estado ?? item.status ?? '').toLowerCase();
  return s === 'healthy' || s === 'saludable' || s === 'ok' || s === 'enlinea' || s === 'online';
}

// Renderizar estado de diagnóstico de integraciones
/**
 * @param {object|null|undefined} statusData Respuesta de `/api/diagnostico/integraciones`
 * @param {{ fetchFailed?: boolean }} [opts] `fetchFailed`: error de red (no equivale a servicio caído)
 */
export function renderDiagnosticsUI(statusData, opts = {}) {
  const container = document.getElementById('diagnostico-status-integracion');
  if (!container) return;

  if (opts.fetchFailed) {
    container.innerHTML = `
      <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
      Sin verificar (red o CORS)
    `;
    container.className = 'inline-flex items-center gap-2 font-semibold text-amber-700';
    return;
  }

  if (statusData == null) {
    container.innerHTML = `
      <span class="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
      Sin datos del core
    `;
    container.className = 'inline-flex items-center gap-2 font-semibold text-slate-600';
    return;
  }

  let isHealthy = false;

  if (Array.isArray(statusData)) {
    if (statusData.length === 0) {
      container.innerHTML = `
      <span class="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
      Sin detalle (lista vacía)
    `;
      container.className = 'inline-flex items-center gap-2 font-semibold text-slate-600';
      return;
    }
    isHealthy = statusData.every(integrationItemHealthy);
  } else if (typeof statusData === 'object') {
    if (integrationItemHealthy(statusData)) {
      isHealthy = true;
    } else if (Array.isArray(statusData.servicios)) {
      if (statusData.servicios.length === 0) {
        container.innerHTML = `
      <span class="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
      Sin detalle (lista vacía)
    `;
        container.className = 'inline-flex items-center gap-2 font-semibold text-slate-600';
        return;
      }
      isHealthy = statusData.servicios.every(integrationItemHealthy);
    } else if (Array.isArray(statusData.integraciones)) {
      if (statusData.integraciones.length === 0) {
        container.innerHTML = `
      <span class="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
      Sin detalle (lista vacía)
    `;
        container.className = 'inline-flex items-center gap-2 font-semibold text-slate-600';
        return;
      }
      isHealthy = statusData.integraciones.every(integrationItemHealthy);
    } else {
      const estado = String(statusData.estado ?? statusData.status ?? '').toLowerCase();
      isHealthy =
        estado === 'healthy' ||
        estado === 'saludable' ||
        statusData.status === 'Healthy' ||
        statusData.healthy === true;
    }
  }

  if (isHealthy) {
    container.innerHTML = `
      <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
      Saludable (Verificado)
    `;
    container.className = 'inline-flex items-center gap-2 font-semibold text-emerald-700';
  } else {
    container.innerHTML = `
      <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
      Falla de enlace o estado no saludable
    `;
    container.className = 'inline-flex items-center gap-2 font-semibold text-rose-700';
  }
}

export function renderDiagnosticoServicios(statusData) {
  const container = document.getElementById('diagnostico-servicios-lista');
  if (!container) return;

  let items = [];
  if (Array.isArray(statusData)) {
    items = statusData;
  } else if (statusData && typeof statusData === 'object') {
    if (Array.isArray(statusData.servicios)) items = statusData.servicios;
    if (Array.isArray(statusData.integraciones)) items = statusData.integraciones;
  }

  if (!items || items.length === 0) {
    container.innerHTML = `
      <div class="flex items-center justify-between border-b pb-2.5">
        <span>Estado global</span>
        <span class="inline-flex items-center gap-2 font-semibold" id="diagnostico-status-integracion">
          <span class="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
          Sin datos
        </span>
      </div>
    `;
    return;
  }

  const rows = items.map((item) => {
    const nombre = String(selectBestValue(item, ['nombre', 'servicio', 'descripcion', 'name']) ?? 'Servicio');
    const estadoRaw = String(selectBestValue(item, ['estado', 'status', 'health', 'salud']) ?? 'sin datos');
    const estado = estadoRaw.toLowerCase();
    const ok = estado === 'healthy' || estado === 'saludable' || estado === 'ok' || estado === 'enlinea' || estado === 'online' || item?.healthy === true || item?.ok === true || item?.activo === true;
    const color = ok ? 'bg-emerald-500' : 'bg-rose-500';
    const label = ok ? 'En linea' : 'No saludable';

    return `
      <div class="flex items-center justify-between border-b pb-2.5">
        <span>${nombre}</span>
        <span class="inline-flex items-center gap-2 font-semibold">
          <span class="w-2.5 h-2.5 rounded-full ${color}"></span>
          ${label}
        </span>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="flex items-center justify-between border-b pb-2.5">
      <span>Estado global</span>
      <span class="inline-flex items-center gap-2 font-semibold" id="diagnostico-status-integracion">
        <span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
        Consultando...
      </span>
    </div>
    ${rows}
  `;
}

export function renderMetricasOperacionales(resumen) {
  const latenciaEl = document.getElementById('metric-latencia');
  const uptimeEl = document.getElementById('metric-uptime');
  const peticionesEl = document.getElementById('metric-peticiones');
  const serverEl = document.getElementById('diagnostico-servidor-url');

  if (!latenciaEl || !uptimeEl || !peticionesEl || !serverEl) return;

  const latencia = selectBestValue(resumen, ['latenciaMs', 'latencia', 'latency']);
  const uptime = selectBestValue(resumen, ['uptime', 'uptimePorcentaje', 'sla']);
  const peticiones = selectBestValue(resumen, ['peticiones24h', 'peticiones', 'requests']);
  const servidor = selectBestValue(resumen, ['servidor', 'server', 'apiUrl', 'endpoint']);

  const latenciaText = latencia != null ? String(latencia) : '';
  const uptimeText = uptime != null ? String(uptime) : '';
  latenciaEl.textContent = latenciaText ? (latenciaText.includes('ms') ? latenciaText : `${latenciaText} ms`) : 'Sin datos';
  uptimeEl.textContent = uptimeText ? (uptimeText.includes('%') ? uptimeText : `${uptimeText}%`) : 'Sin datos';
  peticionesEl.textContent = peticiones != null ? String(peticiones) : 'Sin datos';
  serverEl.textContent = servidor ? String(servidor) : 'Sin datos';
}

export function renderAmlKycUI(data) {
  const amlList = document.getElementById('aml-alertas-lista');
  const kycList = document.getElementById('kyc-alertas-lista');
  if (!amlList || !kycList) return;

  const aml = Array.isArray(data?.aml) ? data.aml : Array.isArray(data?.alertasAml) ? data.alertasAml : [];
  const kyc = Array.isArray(data?.kyc) ? data.kyc : Array.isArray(data?.alertasKyc) ? data.alertasKyc : [];

  if (aml.length === 0) {
    amlList.innerHTML = `<li class="flex items-center justify-between"><span class="text-slate-500">Sin datos reportados</span></li>`;
  } else {
    amlList.innerHTML = aml.map(item => {
      const nombre = String(selectBestValue(item, ['nombre', 'descripcion', 'alerta', 'label']) ?? 'Alerta AML');
      const valor = String(selectBestValue(item, ['valor', 'estado', 'cantidad', 'status']) ?? 'Sin datos');
      return `
        <li class="flex items-center justify-between border-b pb-2">
          <span class="font-medium text-slate-800">${nombre}</span>
          <span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold">${valor}</span>
        </li>
      `;
    }).join('');
  }

  if (kyc.length === 0) {
    kycList.innerHTML = `<li class="flex items-center justify-between"><span class="text-slate-500">Sin datos reportados</span></li>`;
  } else {
    kycList.innerHTML = kyc.map(item => {
      const nombre = String(selectBestValue(item, ['nombre', 'descripcion', 'control', 'label']) ?? 'Control KYC');
      const valor = String(selectBestValue(item, ['valor', 'estado', 'cantidad', 'status']) ?? 'Sin datos');
      return `
        <li class="flex items-center justify-between border-b pb-2">
          <span>${nombre}</span>
          <span class="text-slate-600 font-semibold font-mono">${valor}</span>
        </li>
      `;
    }).join('');
  }
}

// --- COMISION LIVE CALCULATION ---
let comisionEmpresa = null;
let comisionBanco = null;

export function renderComisionConfig(config) {
  const empresaPct = selectBestValue(config, ['comisionEmpresa', 'porcentajeEmpresa', 'pctEmpresa']);
  const bancoPct = selectBestValue(config, ['comisionBanco', 'porcentajeBanco', 'pctBanco']);
  const labelEmpresa = document.getElementById('lbl-comision-empresa');
  const labelBanco = document.getElementById('lbl-comision-banco');

  if (empresaPct != null && bancoPct != null) {
    const empresaNum = Number(empresaPct);
    const bancoNum = Number(bancoPct);
    comisionEmpresa = empresaNum > 1 ? empresaNum / 100 : empresaNum;
    comisionBanco = bancoNum > 1 ? bancoNum / 100 : bancoNum;
  } else {
    comisionEmpresa = null;
    comisionBanco = null;
  }

  if (labelEmpresa) {
    labelEmpresa.textContent = empresaPct != null ? `Comisión Empresa (${empresaPct}%)` : 'Comisión Empresa';
  }
  if (labelBanco) {
    labelBanco.textContent = bancoPct != null ? `Comisión Banco (${bancoPct}%)` : 'Comisión Banco';
  }
}

export function setupLiveComision() {
  const montoInput = document.getElementById('pago-monto');
  const calculoDiv = document.getElementById('calculo-95-5');
  const val95 = document.getElementById('val-95');
  const val5 = document.getElementById('val-5');

  if (!montoInput) return;

  montoInput.addEventListener('input', (e) => {
    const total = parseFloat(e.target.value);
    if (total > 0) {
      if (comisionEmpresa != null && comisionBanco != null) {
        calculoDiv?.classList.remove('hidden');
        if (val95) val95.innerText = "Q " + (total * comisionEmpresa).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        if (val5) val5.innerText = "Q " + (total * comisionBanco).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      } else {
        if (val95) val95.innerText = 'Sin datos';
        if (val5) val5.innerText = 'Sin datos';
        calculoDiv?.classList.remove('hidden');
      }
    } else {
      calculoDiv?.classList.add('hidden');
    }
  });
}

export function setPagoEstadoValidacion(estado, ok = false) {
  const label = document.getElementById('pago-estado-validacion');
  const dot = document.getElementById('pago-estado-validacion-dot');
  const text = document.getElementById('pago-estado-validacion-text');
  if (!label || !dot) return;

  if (text) text.textContent = estado;
  label.className = `font-bold inline-flex items-center gap-1.5 ${ok ? 'text-emerald-700' : 'text-slate-500'}`;
  dot.className = `w-2.5 h-2.5 rounded-full inline-block ${ok ? 'bg-emerald-500' : 'bg-slate-400'}`;
}

export function renderCuentahabienteCreado(payload, fallback) {
  const panel = document.getElementById('cte-resultado');
  if (!panel) return;

  const data = payload && typeof payload === 'object' ? payload : {};
  const nombre = selectBestValue(data, ['nombre', 'nombres']) ?? fallback?.nombre ?? '';
  const apellido = selectBestValue(data, ['apellido', 'apellidos']) ?? fallback?.apellido ?? '';
  const dpi = selectBestValue(data, ['dpi', 'documento']) ?? fallback?.dpi ?? '';
  const nit = selectBestValue(data, ['nit']) ?? fallback?.nit ?? '';
  const telefono = selectBestValue(data, ['telefono', 'telefonoMovil']) ?? fallback?.telefono ?? '';
  const email = selectBestValue(data, ['email', 'correo']) ?? fallback?.email ?? '';
  const idCuenta = selectBestValue(data, ['idCuenta', 'cuentaId']) ?? '';
  const idCliente = selectBestValue(data, ['idCuentahabiente', 'idCliente', 'clienteId']) ?? '';

  panel.classList.remove('hidden');
  panel.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
      <div><span class="text-xs text-slate-500 uppercase font-bold">Titular</span><p class="font-semibold">${[nombre, apellido].filter(Boolean).join(' ') || 'Sin datos'}</p></div>
      <div><span class="text-xs text-slate-500 uppercase font-bold">ID Cuenta</span><p class="font-mono font-semibold">${idCuenta || 'Sin datos'}</p></div>
      <div><span class="text-xs text-slate-500 uppercase font-bold">ID Cliente</span><p class="font-mono font-semibold">${idCliente || 'Sin datos'}</p></div>
      <div><span class="text-xs text-slate-500 uppercase font-bold">DPI</span><p class="font-semibold">${dpi || 'Sin datos'}</p></div>
      <div><span class="text-xs text-slate-500 uppercase font-bold">NIT</span><p class="font-semibold">${nit || 'Sin datos'}</p></div>
      <div><span class="text-xs text-slate-500 uppercase font-bold">Telefono</span><p class="font-semibold">${telefono || 'Sin datos'}</p></div>
      <div><span class="text-xs text-slate-500 uppercase font-bold">Email</span><p class="font-semibold">${email || 'Sin datos'}</p></div>
    </div>
  `;
}
