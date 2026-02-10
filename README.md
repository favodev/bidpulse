# BidPulse

## Descripción

BidPulse es una aplicación de ejemplo para gestionar subastas en tiempo real. Incluye autenticación, gestión de ofertas, historial y notificaciones.

## Configuración

### Secrets con Infisical

Este proyecto usa [Infisical](https://infisical.com) para gestión de secrets. Los scripts `dev`, `build` y `start` inyectan las variables automáticamente.

**Setup inicial:**

1. Instalar Infisical CLI: `winget install infisical`
2. Login: `infisical login`
3. En la raíz del proyecto ya existe `.infisical.json` con el ID del proyecto
4. Ejecutar: `npm run dev`

**Fallback sin Infisical:**

Si no tienes acceso a Infisical, crea un `.env.local` basado en `.env.example` y usa los scripts con sufijo `:local`:

```bash
cp .env.example .env.local
# Completar valores en .env.local
npm run dev:local
```

### Variables de entorno

Consultar `.env.example` para la lista completa. Incluye:

**Cliente (NEXT_PUBLIC_*):**
- Firebase config (API key, auth domain, project ID, storage bucket, messaging sender ID, app ID, measurement ID)
- Exchange rates API key

**Servidor:**
- `RESEND_API_KEY` — envío de emails
- `CONTACT_EMAIL` — email de contacto
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` — Firebase Admin SDK

## PWA

- Manifest: `public/manifest.json`
- Service Worker: `public/sw.js`

## Firestore Rules

Archivo de reglas: `firestore.rules`. Asegura publicar estas reglas en tu proyecto de Firebase.

## Testing

Ejecutar tests:

```bash
npm test
```

Modo watch:

```bash
npm run test:watch
```