# Banco Central — Frontend (Core transaccional)

SPA en Vite + Tailwind que consume la API publicada en `VITE_API_URL` (por defecto `https://bancocentroamericano.azurewebsites.net`).

## Requisitos

- Node.js 18+
- npm (o pnpm si lo usas en tu entorno)

## Configuración

1. Copia `.env.example` a `.env` y ajusta `VITE_API_URL` si tu API corre en otro host o en local.
2. Instala dependencias e inicia en desarrollo:

```bash
npm install
npm run dev
```

La app abre en el puerto configurado en `vite.config.js` (por defecto `http://localhost:3000`).

### Variables opcionales

- `VITE_ADMIN_ALIASES`: lista separada por comas para resolver rol admin cuando la API no devuelve rol.
- `VITE_LOGIN_PATH`: ruta de login si tu backend usa un endpoint distinto.
- `VITE_LOGIN_CREDENTIAL_FIELD`: nombre del campo para la credencial (ej. `usuario`).
- `VITE_LOGIN_PASSWORD_FIELD`: nombre del campo para la contraseña (ej. `clave`).
- `VITE_API_WITH_CREDENTIALS`: si es `true`, envia cookies en `fetch`.
- `VITE_SHOW_DEMO_CREDS`: si es `true`, muestra credenciales de demostracion en el login.
- `VITE_DEMO_ADMIN_USER`, `VITE_DEMO_ADMIN_PASS`, `VITE_DEMO_USER`, `VITE_DEMO_USER_PASS`: valores de demo visibles en el login.

Nota: estas variables son solo para entornos de demostracion; no uses credenciales reales en el frontend.

## Scripts

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo Vite |
| `npm run build` | Genera `dist/` para producción |
| `npm run preview` | Sirve el build localmente |
| `npm start` | Sirve `dist/` con `server.js` (puerto `PORT` o 8080; pensado para Azure Static Web Apps / contenedor) |

## Rutas de la interfaz

El enrutado es por hash (`#/login`, `#/cuenta`, `#/movimientos`, etc.). Los administradores usan pestañas **Clientes**, **Aprobaciones** y **Bitácora**; los usuarios **Cuenta**, **Movimientos**, **Operaciones** y **Pagos**.

La pestaña **Aprobaciones** hoy muestra contenido informativo (AML/KYC) sin llamadas a API: si el backend expone endpoints de aprobaciones, se pueden enlazar en `src/api.js` y `src/main.js` de la misma forma que el resto de módulos.
