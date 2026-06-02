# 🚀 05 — Fases del Proyecto

**Tags:** `#cv-manager` `#roadmap` `#fases` `#setup` `#ci-cd`

---

## Visión General del Roadmap

```
FASE 1           FASE 2           FASE 3           FASE 4           FASE 5
Setup &          Auth &           IA &             Editor           PDF &
Monorepo         Base de datos    Importación      de CV            Templates
─────────────    ─────────────    ─────────────    ─────────────    ─────────────
~1 semana        ~1 semana        ~1.5 semanas     ~1.5 semanas     ~1 semana
```

---

## Fase 1 — Setup, Monorepo y CI/CD

**Objetivo:** Tener entorno de desarrollo funcionando con despliegue continuo desde el primer commit.

### 1.1 Estructura del monorepo

```bash
mkdir cv-manager && cd cv-manager
git init
pnpm init

# Crear estructura
mkdir -p apps/web apps/api packages/shared .github/workflows

# Configurar pnpm workspaces
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'packages/*'
EOF
```

**`package.json` raíz:**
```json
{
  "name": "cv-manager",
  "private": true,
  "scripts": {
    "dev": "pnpm -r --parallel run dev",
    "build": "pnpm -r run build",
    "lint": "pnpm -r run lint",
    "typecheck": "pnpm -r run typecheck"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

### 1.2 Frontend (`apps/web`)

```bash
cd apps/web
pnpm create vite@latest . --template react-ts
pnpm install

# Tailwind CSS
pnpm add -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# shadcn/ui (responder: TypeScript: yes | Style: Default | Base color: Slate)
pnpm dlx shadcn-ui@latest init

# Dependencias principales
pnpm add @supabase/supabase-js @tanstack/react-query react-router-dom
pnpm add react-hook-form zod @hookform/resolvers
pnpm add @react-pdf/renderer
pnpm add -D @types/react @types/react-dom
```

**`vite.config.ts`:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../../packages/shared/src')
    }
  }
})
```

### 1.3 Backend (`apps/api`)

```bash
cd apps/api
pnpm init
pnpm add express cors helmet morgan dotenv
pnpm add @supabase/supabase-js @prisma/client zod
pnpm add multer pdf-parse mammoth
pnpm add langchain @langchain/anthropic
pnpm add jsonwebtoken
pnpm add -D typescript ts-node nodemon @types/express @types/node @types/multer @types/jsonwebtoken prisma

# Inicializar Prisma
npx prisma init --datasource-provider postgresql
```

**`tsconfig.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "paths": {
      "@shared/*": ["../../packages/shared/src/*"]
    }
  }
}
```

**`nodemon.json`:**
```json
{
  "watch": ["src"],
  "ext": "ts",
  "exec": "ts-node src/main.ts"
}
```

**`package.json` scripts:**
```json
{
  "scripts": {
    "dev": "nodemon",
    "build": "tsc",
    "start": "node dist/main.js",
    "typecheck": "tsc --noEmit"
  }
}
```

### 1.4 Shared Package (`packages/shared`)

```bash
cd packages/shared
pnpm init
pnpm add zod
pnpm add -D typescript
```

**Estructura:**
```
packages/shared/src/
├── types/
│   ├── cv.types.ts         ← Interfaces TypeScript del dominio
│   └── api.types.ts        ← Request/Response shapes
├── schemas/
│   ├── cv.schema.ts        ← Zod schemas compartidos
│   └── import.schema.ts    ← Schema del JSON que devuelve la IA
└── index.ts
```

### 1.5 CI/CD con GitHub Actions

**`.github/workflows/ci.yml`:**
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  typecheck-and-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: latest }
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm build
```

### Checklist Fase 1
- [ ] Monorepo inicializado con pnpm workspaces
- [ ] `apps/web` con Vite + React + TypeScript + Tailwind + shadcn/ui
- [ ] `apps/api` con Express + TypeScript + Prisma inicializado
- [ ] `packages/shared` con tipos y schemas base
- [ ] `.env` configurados (no commitear, solo `.env.example`)
- [ ] GitHub Actions corriendo en cada push
- [ ] Vercel conectado a `apps/web` (deploy automático desde main)
- [ ] Render conectado a `apps/api` (deploy automático desde main)
- [ ] Supabase proyecto creado (URL + keys en variables de entorno)

---

## Fase 2 — Auth y Base de Datos

**Objetivo:** Login funcionando con datos reales en PostgreSQL.

### 2.1 Supabase Auth (Frontend)

```typescript
// apps/web/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// apps/web/src/hooks/useAuth.ts
export function useAuth() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  return { session, user: session?.user }
}
```

### 2.2 authMiddleware (Backend)

```typescript
// apps/api/src/middleware/auth.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'Invalid token' })

  req.user = user
  next()
}
```

### 2.3 Migraciones Prisma

```bash
# Copiar schema.prisma completo del documento 04 - Base de Datos
# Luego ejecutar:
cd apps/api
pnpm exec prisma migrate dev --name "init_cv_schema"
pnpm exec prisma generate

# Activar RLS en Supabase Dashboard → SQL Editor (ver 04 - Base de Datos)
```

### Checklist Fase 2
- [ ] Login/logout funcionando con Supabase Auth
- [ ] `authMiddleware` probado manualmente (con y sin token)
- [ ] Schema Prisma aplicado en Supabase (`prisma migrate dev`)
- [ ] RLS habilitado en todas las tablas
- [ ] `GET /api/cv/me` retorna perfil vacío para nuevo usuario (200, no 404)
- [ ] Variables de entorno configuradas en Render y Vercel

---

## Fase 3 — IA e Importación

**Objetivo:** El usuario puede subir un PDF y el sistema extrae los datos del CV automáticamente.

### Tareas principales

1. Implementar `FileService.extractText()` (pdf-parse + mammoth)
2. Implementar `AIService.parseCV()` (LangChain + Claude)
3. Diseñar el prompt de extracción (ver 06 - Integración IA)
4. Implementar `ParsedCVSchema` en `packages/shared`
5. Implementar `adaptParsedCV()` adapter
6. Implementar `POST /api/import` endpoint
7. Implementar pantalla de importación en frontend con preview

### Checklist Fase 3
- [ ] `pdf-parse` extrae texto de PDFs de prueba correctamente
- [ ] `mammoth` extrae texto de DOCX de prueba correctamente
- [ ] Claude devuelve JSON válido para el prompt diseñado
- [ ] `ParsedCVSchema` valida el JSON sin errores para casos reales
- [ ] El import persiste datos en la DB correctamente
- [ ] El frontend muestra preview de los datos importados antes de confirmar

---

## Fase 4 — Editor de CV

**Objetivo:** El usuario puede editar todas las secciones de su CV con formularios validados.

### Tareas principales

1. Implementar `GET /api/cv/me` con datos completos
2. Implementar `PUT /api/cv/me` (perfil)
3. Implementar CRUD de experiences, education, skills, languages
4. Implementar `useCV` hook con TanStack Query
5. Implementar `ProfileForm`, `ExperienceForm`, `EducationForm`
6. Implementar drag-to-reorder en listas (via `sortOrder`)

### Checklist Fase 4
- [ ] Todos los endpoints CRUD probados manualmente
- [ ] Los formularios validan con Zod (mismo schema que el backend)
- [ ] TanStack Query invalida cache correctamente tras mutaciones
- [ ] Drag-to-reorder funciona y persiste en DB
- [ ] Las fechas se muestran y editan correctamente

---

## Fase 5 — PDF y Templates

**Objetivo:** El usuario puede exportar su CV como PDF en múltiples templates.

### Tareas principales

1. Implementar `TemplateCorporate.tsx` con @react-pdf/renderer
2. Implementar `TemplateMinimal.tsx`
3. Implementar selector de templates en `/preview`
4. Implementar `pdf.download()` con nombre del archivo
5. Ajustar estilos hasta que el PDF se vea profesional

### Checklist Fase 5
- [ ] PDF generado incluye todas las secciones del CV
- [ ] El PDF se descarga con el nombre `NombreApellido_CV.pdf`
- [ ] Los dos templates son visualmente distintos y profesionales
- [ ] El PDF no tiene errores de layout (textos cortados, overflow)
- [ ] La previsualización en browser coincide con el PDF descargado
