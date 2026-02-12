# BidPulse

## Descripción

BidPulse es una plataforma de subastas online para crear, listar y pujar en artículos.

## Qué tiene

- Creación y gestión de subastas
- Sistema de pujas con historial
- Mensajería entre compradores y vendedores (conversaciones)
- Notificaciones de nuevos mensajes y eventos
- Gestión de perfiles, valoraciones y reseñas
- Favoritos y búsqueda de subastas
- Panel administrativo: reportes y verificaciones
- APIs internas y rutas para operaciones (auctions, bids, users, etc.)

## Tecnologías

- Next.js (frontend)
- React
- TypeScript
- Firebase (Auth, Firestore, Storage, Admin)
- Tailwind CSS
- Recharts (gráficos)
- Resend (envío de emails)
- Vitest, ESLint

## Autenticación

- Sí: Firebase Authentication (email/password y Google sign-in)

## Chat / tiempo real

- Sí: mensajería en tiempo real usando suscripciones de Firestore (onSnapshot)

## Despliegue

- Deploy a Firebase Hosting; variables y secretos gestionados vía GitHub Actions.
