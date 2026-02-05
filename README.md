# BidPulse

## Descripción

BidPulse es una aplicación de ejemplo para gestionar subastas en tiempo real. Incluye autenticación, gestión de ofertas, historial y notificaciones.

## Configuración

Variables de entorno requeridas (cliente):

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Variables de entorno para operaciones sensibles en servidor (API Routes):

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

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