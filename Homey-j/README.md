# Homey'J — SaaS de gestión eclesiástica

Base inicial con React + Vite, TailwindCSS 3.4 y Firebase para un producto multi-tenant (SuperAdmin + iglesias).

## Requerimientos previos

- Node 18+
- Variables de entorno en `.env` (ejemplo):

```
VITE_MASTER_KEY=00000000000000000000
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_DATABASE_URL=...
```

`VITE_MASTER_KEY` debe tener exactamente 20 dígitos numéricos. La UI muestra una pista enmascarada.

## Scripts

- `npm install` — instala dependencias.
- `npm run dev` — servidor de desarrollo.
- `npm run build` — build de producción.
- `npm run preview` — previsualiza el build.

## Estructura

- `src/core` — Firebase, contexto de auth, servicios de datos.
- `src/modules/superAdmin` — bloqueo /admin, dashboard para alta y bloqueo de iglesias.
- `src/modules/church` — shell multi-tenant `/app/:churchId/*`.
- `src/shared/ui` — kit de UI con la paleta Old Money.

## Flujo SuperAdmin

- Ruta `/admin` muestra LockScreen; valida Master Key de 20 dígitos.
- Al desbloquear, renderiza el dashboard: tabla de iglesias, alta (nombre, pastor) y toggle `isLocked`.
- Persistencia apunta a Firestore (`churches_registry`); si no hay Firebase configurado, usa `localStorage` como fallback.

## Estilo

- Paleta Old Money: Hunter (#355E3B), Cream (#F1E3C6), Navy (#0B2545), Gold (#C6A564).
- Tipografía: Playfair Display para encabezados, Inter para textos.
