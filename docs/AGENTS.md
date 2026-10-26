# Driver Mobile App – Cursor Rules

You are working ONLY on the Driver app (`apps/driver-mobile`).

## Current Architecture (DO NOT BREAK)
- Expo SDK 57 + TypeScript
- Expo Router (file-based routing under `app/`)
- TanStack Query for all server data
- Zustand for session, language, active trip
- React Hook Form + Zod for forms
- i18next (English, Sinhala, Tamil)
- Token stored in expo-secure-store
- HTTP client already exists in `src/services`
- Typed contracts + fixtures already exist in `src/services` / fixtures
- Feature folders already exist: `src/features`, `src/services`, `src/config`

## Strict Rules
1. NEVER touch backend code, Prisma, or any other app (`admin-web`, citizen, etc.).
2. NEVER invent new API endpoints. Only use the real ones that exist:
   - POST /api/v1/auth/login
   - GET /api/v1/users/me
   - GET /api/v1/areas
   - GET /api/v1/announcements
   - GET /api/v1/community-updates
3. For tractor, route, GPS, weight, trip, engine data → continue using the existing fixtures until real endpoints appear.
4. Always use the existing HTTP client and TanStack Query hooks.
5. All user-facing text must go through i18next.
6. Create separate screens using Expo Router file-based structure.
7. Prefer NativeWind v4 + className. Use Reanimated for animations.
8. Design must be premium: soft shadows, gradients, live micro-animations, large touch targets (≥ 48px), high outdoor contrast.