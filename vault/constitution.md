# 📜 Constitution — CV Manager AI

**Versión:** 1.0  
**Última actualización:** Junio 2026  
**Metodología:** Spec-Driven Development (SDD)

> Este documento es la fuente de verdad del proyecto. Define principios, estándares y decisiones que aplican a toda la codebase. Ante cualquier duda técnica o de diseño, este documento tiene la última palabra.

---

## 1. Identidad del Proyecto

- **Nombre:** CV Manager AI
- **Tipo:** Aplicación web personal (MVP)
- **Stack:** React + TypeScript (Frontend) · Express + TypeScript (Backend) · PostgreSQL via Supabase
- **Team:** 1 desarrollador + asistencia de IA (Kilo-code / Claude)
- **Deployment:** Vercel (Frontend) + Render (Backend) + Supabase (DB + Auth)

Ver detalles completos en: `02_Stack_y_Hosting.md`

---

## 2. Principios de Arquitectura

### 2.1 Separación Estricta de Responsabilidades

| Capa | Responsabilidad | Prohibido |
|------|-----------------|-----------|
| **Frontend** | Renderizar datos, capturar inputs, generar PDF client-side | Lógica de negocio, cálculos de dominio |
| **Backend** | Orquestar servicios, validar, persistir, llamar a IA | Lógica de presentación |
| **Shared** | Tipos TypeScript y schemas Zod compartidos | Código específico de plataforma |
| **IA** | Transformar texto no estructurado en JSON | Decisiones de negocio |

### 2.2 Contrato Explícito con Zod

- Los schemas Zod en `packages/shared/src/schemas/` son el contrato entre frontend y backend
- TypeScript garantiza el contrato en build time
- Zod valida en runtime (cada request HTTP, cada respuesta de IA)
- **Regla:** Nunca asumir que los datos de entrada son válidos. Siempre parsear con Zod.

### 2.3 API-First

1. Se define el contrato de la API (endpoint, request, response) antes de implementar
2. El contrato se documenta en `03_Arquitectura_del_Sistema.md` sección "Contrato API"
3. Frontend y Backend pueden desarrollarse en paralelo después del contrato

---

## 3. Estándares de Código

### 3.1 TypeScript (Todo el proyecto)

- **Strict mode:** `"strict": true` en todos los `tsconfig.json`
- **No `any`:** Prohibido. Usar `unknown` y narrowing si es necesario
- **Type imports:** `import type { ... }` para imports de solo tipos
- **Naming:** Interfaces y Types en `PascalCase`. Variables y funciones en `camelCase`

### 3.2 Backend (Express + Node.js)

- **Error handling:** Siempre usar `next(error)` en route handlers para centralizar errores
- **Async/await:** No mezclar con `.then()/.catch()` en el mismo archivo
- **Services vs Routes:** Los routes no contienen lógica. Solo parsean request, llaman al service, formatean response
- **Prisma queries:** Siempre incluir filtro `userId` para garantizar aislamiento de datos

```typescript
// ✅ Correcto
router.put('/:id', authMiddleware, validateBody(schema), async (req, res, next) => {
  try {
    const result = await cvService.updateExperience(req.user.id, req.params.id, req.body)
    res.json(result)
  } catch (error) {
    next(error) // ← siempre
  }
})

// ❌ Incorrecto — lógica en el route
router.put('/:id', async (req, res) => {
  const exp = await prisma.workExperience.findUnique({ where: { id: req.params.id } })
  if (!exp) return res.status(404).json({ error: 'Not found' })
  // ... más lógica aquí ← MALO
})
```

### 3.3 Frontend (React)

- **Componentes funcionales:** Solo hooks, no class components
- **Un componente por archivo:** Nombre del archivo = nombre del componente
- **Custom hooks:** Toda lógica reutilizable en `hooks/`. Los componentes solo llaman hooks y renderizan JSX
- **TanStack Query:** Todo fetching/mutación de datos del servidor pasa por TanStack Query. Nunca `useEffect` + `fetch` directo para datos del servidor
- **shadcn/ui:** Usar los componentes de `components/ui/` sin modificarlos. Crear componentes de dominio en `components/cv/`

### 3.4 Shared Package

- Solo puede importar de `zod` y librerías de solo tipos
- No puede importar nada de `apps/web` ni `apps/api`
- Expone tipos e interfaces, no implementaciones

---

## 4. Gestión de Errores

### 4.1 Backend — Error Handler Centralizado

```typescript
// apps/api/src/middleware/errorHandler.ts
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message)

  if (err.name === 'ZodError') {
    return res.status(400).json({ error: 'Validation Error', details: err })
  }
  if (err.name === 'NotFoundError') {
    return res.status(404).json({ error: err.message })
  }
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: err.message })
  }

  // Error genérico — no exponer detalles internos
  res.status(500).json({ error: 'Internal Server Error' })
}
```

### 4.2 Frontend — Error Boundaries y Toast

- Errores de red: mostrar toast rojo con mensaje genérico
- Errores de validación (400): mostrar errores inline en el formulario
- Errores 401: redirigir a login
- Errores 500: mostrar toast rojo con "Algo salió mal, intenta de nuevo"

---

## 5. Seguridad

### 5.1 Reglas Absolutas

- El `SUPABASE_SERVICE_ROLE_KEY` **nunca** va en el frontend ni en un repositorio público
- Todo endpoint de la API requiere `authMiddleware` (exceptuando health check)
- Toda query de Prisma filtra por `userId` del request autenticado
- Los archivos `.env` están en `.gitignore` y solo existen `.env.example`

### 5.2 Variables de Entorno

- Frontend: solo variables con prefijo `VITE_` y valores no secretos (URL pública de Supabase, anon key)
- Backend: variables secretas (service role key, Anthropic API key) solo en Render dashboard

---

## 6. Git y Versionado

### 6.1 Conventional Commits

```
feat: add CV import from DOCX
fix: correct sortOrder update on experience drag
docs: update architecture diagram in 03_Arquitectura
refactor: extract pdf generation logic to usePDF hook
chore: update prisma to 5.14
```

### 6.2 Branch Strategy

- `main` → siempre deployable, protegida
- `develop` → integración continua
- `feat/<nombre>` → features individuales
- PRs a `main` requieren CI verde (typecheck + build)

---

## 7. Decisiones Fijas (No negociables)

Estas decisiones están tomadas y no se revisan durante el MVP:

| Decisión | Valor fijo |
|----------|------------|
| Package manager | `pnpm` — prohibido npm/yarn |
| ORM | Prisma — no Drizzle, no Sequelize |
| UI components | shadcn/ui — no instalar otras librerías de UI |
| Generación PDF | `@react-pdf/renderer` client-side — no servidor |
| Validación | Zod — el mismo schema en frontend y backend vía shared |
| Fechas en DB | Strings formateados — no `DateTime` para fechas de CV |
| Auth | Supabase Auth — no implementar auth propio |
| IA | LangChain + Claude Sonnet — no llamadas directas a la API |

---

## 8. Documentación del Vault

- Cada documento del vault tiene un propósito único y no se duplica información
- Los cambios de arquitectura o stack se reflejan aquí y en el documento específico
- El vault se actualiza **antes** de implementar (define → implementa, no al revés)

### Estructura de documentos

| Documento | Cuándo se actualiza |
|-----------|---------------------|
| `constitution.md` | Cuando cambia un principio global o una decisión fija |
| `02_Stack_y_Hosting.md` | Cuando se agrega/cambia una dependencia |
| `03_Arquitectura_del_Sistema.md` | Cuando cambia un patrón, flujo o estructura de carpetas |
| `04_Base_de_Datos.md` | Cuando se modifica el schema Prisma |
| `05_Fases_del_Proyecto.md` | Cuando se completa una fase o cambia el roadmap |
| `06_Integracion_IA.md` | Cuando cambia el prompt o la lógica de extracción |
| `07_Templates_CV.md` | Cuando se añade o modifica un template |
| `08_Contexto_Legacy_GAS.md` | Solo referencia histórica — no se modifica |
