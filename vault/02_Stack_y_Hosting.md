# ⚙️ 02 — Stack Tecnológico y Hosting

**Tags:** `#cv-manager` `#stack` `#hosting` `#infraestructura`

---

## Hosting (Free Tier — $0 en desarrollo)

| Servicio | Rol | Free Tier | Limitación relevante |
|----------|-----|-----------|----------------------|
| **Vercel** | Frontend React | Ilimitado, 100GB BW/mes, CI/CD auto | Ninguna para este proyecto |
| **Render** | Backend Node.js | 1 web service, deploy automático | Se duerme tras 15 min → cold start ~30s |
| **Supabase** | PostgreSQL + Auth + Storage | 2 proyectos, 500MB DB, 1GB Storage | Suficiente para MVP |

> Para producción real: Render Starter ($7/mes) elimina el cold start.

---

## Stack Frontend (`apps/web`)

| Tecnología | Versión | Rol |
|-----------|---------|-----|
| React | 18+ | Framework UI, componentes funcionales con hooks |
| Vite | 5+ | Bundler y dev server (HMR instantáneo) |
| TypeScript | 5+ | Tipado estático en todo el frontend |
| Tailwind CSS | 3+ | Estilos utility-first, sin CSS custom salvo variables |
| shadcn/ui | latest | Componentes accesibles basados en Radix UI (copiados al repo) |
| React Hook Form | 7+ | Formularios con validación integrada |
| Zod | 3+ | Validación de esquemas (compartido con backend via `packages/shared`) |
| TanStack Query | 5+ | Fetching, caching, sincronización de estado del servidor |
| @react-pdf/renderer | 3+ | Generación de PDFs client-side (sin servidor) |
| React Router | 6+ | Navegación SPA |

---

## Stack Backend (`apps/api`)

| Tecnología | Versión | Rol |
|-----------|---------|-----|
| Node.js | 20 LTS | Runtime |
| Express | 4+ | Framework HTTP, middleware pipeline |
| TypeScript | 5+ | Tipado estático end-to-end |
| Prisma | 5+ | ORM tipado para PostgreSQL |
| Zod | 3+ | Validación de inputs en cada endpoint |
| Multer | 1+ | Manejo de uploads multipart (PDF/DOCX) |
| pdf-parse | 1+ | Extracción de texto plano desde PDFs |
| mammoth | 1+ | Extracción de texto plano desde DOCX |
| LangChain JS | 0.2+ | Orquestación del flujo de IA (prompt → LLM → parse) |
| @langchain/anthropic | latest | Conector oficial para Claude Sonnet |
| jsonwebtoken | 9+ | Verificación de JWTs emitidos por Supabase Auth |
| helmet | latest | Headers de seguridad HTTP |
| morgan | latest | Logging de requests en desarrollo |

---

## Base de Datos (`Supabase`)

| Tecnología | Rol |
|-----------|-----|
| PostgreSQL 15 (Supabase) | Base de datos principal hosteada |
| Prisma Migrate | Migraciones versionadas del esquema |
| Row Level Security (RLS) | Seguridad a nivel de fila — cada usuario solo ve sus datos |

---

## IA

| Tecnología | Rol |
|-----------|-----|
| LangChain JS | Orquestación: texto → prompt → LLM → JSON estructurado |
| Claude Sonnet (Anthropic) | LLM para extracción y estructuración de datos del CV |
| Zod | Validación del JSON devuelto por la IA antes de persistir |

---

## Package Manager y Monorepo

**pnpm workspaces** — gestor obligatorio. No usar npm ni yarn.

```
cv-manager/
├── apps/
│   ├── web/          ← Frontend React (Vercel)
│   └── api/          ← Backend Node.js (Render)
├── packages/
│   └── shared/       ← Tipos TypeScript + schemas Zod compartidos
├── .github/
│   └── workflows/    ← CI/CD (GitHub Actions)
├── pnpm-workspace.yaml
└── package.json      ← Scripts raíz
```

---

## Variables de Entorno

### Frontend (`apps/web/.env.local`)
```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=https://cv-manager-api.onrender.com
```

### Backend (`apps/api/.env`)
```bash
DATABASE_URL=postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Solo en backend, NUNCA en frontend
ANTHROPIC_API_KEY=sk-ant-...
PORT=3001
NODE_ENV=development
```

> `DIRECT_URL` es requerido por Supabase para que Prisma Migrate funcione correctamente (bypassa el connection pooler).

---

## Diagrama de Servicios

```
┌─────────────────────────────────────────────────────────────┐
│                        Usuario                              │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────┐
│              Vercel — React App (Frontend)                  │
│   React 18 + Vite + TypeScript + Tailwind + shadcn/ui      │
│   @react-pdf/renderer (PDF client-side)                    │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API (JSON)
┌──────────────────────────▼──────────────────────────────────┐
│              Render — Node.js API (Backend)                 │
│   Express + Prisma + LangChain + multer + pdf-parse        │
└──────────┬───────────────────────────────┬──────────────────┘
           │ PostgreSQL (Prisma)            │ HTTP
┌──────────▼──────────────┐   ┌────────────▼───────────────┐
│   Supabase              │   │   Anthropic Claude API     │
│   PostgreSQL 15 + Auth  │   │   Claude Sonnet            │
│   + Storage + RLS       │   │   (Extracción de CV)       │
└─────────────────────────┘   └────────────────────────────┘
```
