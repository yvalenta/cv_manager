# 🏛️ 03 — Arquitectura del Sistema

**Tags:** `#cv-manager` `#arquitectura` `#patrones` `#diseño` `#flujos`

---

## Principios de Diseño

| Principio | Aplicación concreta |
|-----------|---------------------|
| **Separación de responsabilidades** | Frontend renderiza. Backend orquesta. IA transforma. DB persiste. |
| **Contrato explícito** | `packages/shared` contiene los tipos TS y schemas Zod. Son la fuente de verdad compartida. |
| **Sin lógica de dominio en el frontend** | El frontend no sabe cómo parsear un CV ni calcular nada. Solo muestra datos y llama a la API. |
| **PDF client-side** | `@react-pdf/renderer` genera el PDF en el navegador. Sin cargar el servidor, con previsualización instantánea. |
| **Fail-fast con Zod** | Toda entrada externa (request HTTP, respuesta de IA) se valida con Zod antes de procesarse. |

---

## Patrones de Diseño Aplicados

### 1. Repository Pattern (Backend)
**Dónde:** `apps/api/src/repositories/`  
**Por qué:** Desacopla la lógica de negocio del ORM. Si en el futuro se cambia Prisma, solo cambia el repositorio.

```typescript
// apps/api/src/repositories/cv.repository.ts
export class CvRepository {
  constructor(private prisma: PrismaClient) {}

  async findByUserId(userId: string): Promise<CvProfile | null> {
    return this.prisma.cvProfile.findUnique({
      where: { userId },
      include: { experiences: { include: { tools: true } }, education: true, skills: true, languages: true }
    });
  }

  async upsertProfile(userId: string, data: Partial<CvProfileData>): Promise<CvProfile> {
    return this.prisma.cvProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }
}
```

---

### 2. Service Layer Pattern (Backend)
**Dónde:** `apps/api/src/services/`  
**Por qué:** Centraliza la lógica de negocio. Los routes solo hacen parsing de request/response; la lógica vive en services.

```typescript
// apps/api/src/services/cv.service.ts
export class CvService {
  constructor(private cvRepo: CvRepository) {}

  async getFullCV(userId: string): Promise<CvProfile> {
    const profile = await this.cvRepo.findByUserId(userId);
    if (!profile) throw new NotFoundError(`CV not found for user ${userId}`);
    return profile;
  }

  async updateSection<K extends keyof CvUpdatePayload>(
    userId: string,
    section: K,
    data: CvUpdatePayload[K]
  ): Promise<void> {
    await this.cvRepo.updateSection(userId, section, data);
  }
}
```

---

### 3. Middleware Pipeline Pattern (Backend)
**Dónde:** `apps/api/src/middleware/`  
**Por qué:** Express procesa cada request a través de una cadena de middlewares. Cada uno tiene una única responsabilidad.

```
Request → authMiddleware → validateBody(schema) → routeHandler → errorHandler
```

```typescript
// apps/api/src/middleware/validate.ts
// Factory: crea un middleware validador para cualquier schema Zod
export const validateBody = <T>(schema: ZodSchema<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Validation Error', details: result.error.flatten() });
    }
    req.body = result.data; // reemplaza con datos casteados
    next();
  };

// apps/api/src/middleware/auth.ts
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) throw new Error('Invalid token');
    req.user = user; // adjunta el usuario al request
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
};
```

---

### 4. Custom Hook Pattern (Frontend)
**Dónde:** `apps/web/src/hooks/`  
**Por qué:** Encapsula la lógica de fetching, caching y mutaciones. Los componentes solo consumen datos, no saben cómo se obtienen.

```typescript
// apps/web/src/hooks/useCV.ts
export function useCV() {
  return useQuery({
    queryKey: ['cv'],
    queryFn: () => apiClient.get<CvProfile>('/cv/me'),
    staleTime: 5 * 60 * 1000, // 5 minutos en cache
  });
}

export function useUpdateExperience() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateExperiencePayload) =>
      apiClient.put(`/cv/sections/experience/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cv'] }); // refetch automático
    },
  });
}
```

---

### 5. Adapter Pattern — AI Output Normalization
**Dónde:** `apps/api/src/services/ai.service.ts`  
**Por qué:** La IA devuelve JSON "sucio" (campos faltantes, tipos incorrectos). El adapter lo normaliza antes de que llegue al service.

```typescript
// apps/api/src/adapters/parsed-cv.adapter.ts
export function adaptParsedCV(raw: unknown): ParsedCVData {
  const validated = ParsedCVSchema.parse(raw); // Zod valida y stripea campos extra

  return {
    profile: {
      fullName: validated.profile?.fullName ?? null,
      jobTitle: validated.profile?.jobTitle ?? null,
      // ... normalización explícita de cada campo
    },
    experiences: (validated.experiences ?? []).map(exp => ({
      role: exp.role,
      company: exp.company,
      startDate: exp.startDate ?? null,
      endDate: exp.endDate ?? null,
      isCurrent: exp.isCurrent ?? false,
      tools: (exp.tools ?? []).map(t => ({ name: t })),
    })),
  };
}
```

---

### 6. Observer Pattern via TanStack Query (Frontend)
**Dónde:** Implícito en TanStack Query  
**Por qué:** Múltiples componentes pueden "observar" el mismo query key. Cuando una mutación invalida `['cv']`, todos los componentes suscritos re-renderizan automáticamente.

```typescript
// Componente A observa el CV
const { data: cv } = useCV(); // queryKey: ['cv']

// Componente B muta una sección
const updateExp = useUpdateExperience();
updateExp.mutate(data); // onSuccess: invalidate ['cv']
// → Componente A recibe el dato actualizado automáticamente
```

---

## Capas del Sistema

```
┌──────────────────────────────────────────────────────────────┐
│  CAPA DE PRESENTACIÓN (Frontend — Vercel)                    │
│                                                              │
│  ┌──────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │ Pages/Routes │  │   Components    │  │  PDF Templates │  │
│  │ /dashboard   │  │   shadcn/ui     │  │  @react-pdf    │  │
│  │ /import      │  │   cv/ domain    │  │  client-side   │  │
│  │ /preview     │  │   forms, tabs   │  │  generation    │  │
│  └──────┬───────┘  └─────────────────┘  └────────────────┘  │
│         │ Custom Hooks (useCV, useImport)                    │
│         │ TanStack Query (cache + mutations)                 │
└─────────┼────────────────────────────────────────────────────┘
          │ REST API (JSON) — Bearer JWT
┌─────────┼────────────────────────────────────────────────────┐
│  CAPA DE APLICACIÓN (Backend — Render)                       │
│         │                                                    │
│  ┌──────▼────────┐  ┌─────────────────┐  ┌──────────────┐  │
│  │  Routers      │  │   Middlewares   │  │   Services   │  │
│  │  /auth        │  │   authMiddleware│  │   CvService  │  │
│  │  /cv          │  │   validateBody  │  │   AIService  │  │
│  │  /import      │  │   errorHandler  │  │  FileService │  │
│  │  /export      │  │   (Zod)         │  └──────┬───────┘  │
│  └───────────────┘  └─────────────────┘         │          │
│                                          ┌───────▼──────┐  │
│                                          │ Repositories │  │
│                                          │ CvRepository │  │
│                                          └───────┬──────┘  │
│                                          ┌───────▼──────┐  │
│                                          │  Prisma ORM  │  │
│                                          └──────────────┘  │
└─────────┬──────────────────────────────────────┬────────────┘
          │ PostgreSQL (connection pooler)        │ HTTP
┌─────────▼────────────────────┐  ┌──────────────▼───────────┐
│  Supabase / PostgreSQL 15    │  │  Anthropic Claude API    │
│  + Row Level Security (RLS)  │  │  (LangChain orchestrator)│
└──────────────────────────────┘  └──────────────────────────┘
```

---

## Flujos de Datos Principales

### Flujo 1 — Edición de una Sección del CV

```
1. Usuario edita formulario (e.g., ExperienceForm)
         │
2. React Hook Form valida localmente con Zod (schema de packages/shared)
         │ ✅ válido
3. TanStack Query mutation → PUT /api/cv/sections/experience/:id
   Headers: Authorization: Bearer <supabase_jwt>
         │
4. Express: authMiddleware verifica JWT con Supabase
         │ ✅ token válido → req.user = { id, email }
5. validateBody(UpdateExperienceSchema) → Zod valida body
         │ ✅ body válido
6. CvService.updateSection(userId, 'experience', data)
         │
7. CvRepository → Prisma → UPDATE work_experiences WHERE id = $id AND profile.user_id = $userId
         │ (el AND user_id garantiza que nadie edita datos ajenos)
         │ ✅ 200 OK
8. TanStack Query: onSuccess → invalidateQueries(['cv'])
         │
9. UI refetch automático → componentes re-renderizan con datos frescos
```

---

### Flujo 2 — Importación con IA

```
1. Usuario sube archivo PDF/DOCX (o pega texto)
         │
2. Frontend: FileReader → base64 o texto plano
   POST /api/import  { type: 'pdf' | 'docx' | 'text', content: '...' }
         │
3. Backend: authMiddleware → validateBody(ImportSchema)
         │
4. FileService.extractText(type, content)
   ├── Si PDF: pdf-parse → texto plano
   ├── Si DOCX: mammoth → texto plano
   └── Si text: pasa directo
         │
5. AIService.parseCV(rawText)
   ├── LangChain: construye prompt con instrucciones de extracción
   ├── Claude Sonnet: texto → JSON estructurado
   └── Zod: valida el JSON devuelto (ParsedCVSchema)
         │ ✅ JSON válido
6. adaptParsedCV(rawJSON) → normaliza campos opcionales y tipos
         │
7. CvService.importFromParsed(userId, adaptedData)
   └── Prisma: UPSERT profile + createMany experiences/education
         │
8. Response: { success: true, imported: ['profile', 'experience', 'education'] }
         │
9. Frontend: muestra preview de datos importados para confirmación del usuario
   └── Usuario confirma → datos ya están guardados
```

---

### Flujo 3 — Exportación PDF

```
1. Usuario selecciona template y hace clic en "Exportar PDF"
         │
2. Frontend: GET /api/cv/me (si no está en cache de TanStack Query)
         │
3. Frontend: renderiza <CVTemplate variant="corporate" data={cvData} />
   usando @react-pdf/renderer (100% client-side, sin llamada al servidor)
         │
4. pdf.download('NombreApellido_CV.pdf')
   ← PDF generado y descargado directamente en el browser
   ← Zero carga en el servidor
```

---

### Flujo 4 — Autenticación

```
1. Usuario hace login en Supabase Auth (email + contraseña)
         │
2. Supabase emite JWT (acceso + refresh tokens)
         │
3. Frontend guarda tokens en memoria (Supabase client los maneja)
         │
4. Cada request al backend incluye: Authorization: Bearer <access_token>
         │
5. Backend: authMiddleware verifica el JWT con supabase.auth.getUser(token)
   ├── Supabase valida firma del JWT
   └── Retorna user object con userId
         │
6. userId se usa en todas las queries de Prisma (filtro de seguridad)
   Y en la DB, RLS de Supabase aplica una segunda capa de seguridad
```

---

## Estructura de Carpetas

### Frontend (`apps/web/src/`)

```
apps/web/src/
├── app/
│   ├── routes/
│   │   ├── dashboard.tsx      ← Editor principal del CV (tabs por sección)
│   │   ├── import.tsx         ← Importación con IA (upload o paste)
│   │   └── preview.tsx        ← Previsualización del PDF
│   └── App.tsx                ← Router + QueryClientProvider + AuthProvider
│
├── components/
│   ├── ui/                    ← Componentes shadcn/ui (copiados, no modificar)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── tabs.tsx
│   │   └── ...
│   ├── cv/                    ← Componentes del dominio CV
│   │   ├── ExperienceForm.tsx ← Formulario de una experiencia laboral
│   │   ├── ExperienceList.tsx ← Lista de experiencias con drag-to-reorder
│   │   ├── EducationForm.tsx
│   │   ├── ProfileForm.tsx
│   │   ├── SkillsPicker.tsx   ← Selector de skills con autocomplete
│   │   └── LanguageList.tsx
│   └── pdf/                   ← Templates PDF (@react-pdf/renderer)
│       ├── TemplateCorporate.tsx
│       └── TemplateMinimal.tsx
│
├── hooks/
│   ├── useCV.ts               ← TanStack Query: get + mutaciones del CV
│   ├── useImport.ts           ← Hook de importación con IA
│   └── useAuth.ts             ← Estado de autenticación (Supabase)
│
├── lib/
│   ├── api.ts                 ← Cliente HTTP (fetch wrapper con auth headers)
│   ├── supabase.ts            ← Cliente Supabase (singleton)
│   └── utils.ts               ← cn(), formatDate(), formatCurrency()
│
└── types/
    └── index.ts               ← Re-exporta todo desde packages/shared
```

### Backend (`apps/api/src/`)

```
apps/api/src/
├── routes/
│   ├── auth.ts                ← POST /api/auth/verify (opcional)
│   ├── cv.ts                  ← GET /api/cv/me, PUT /api/cv/sections/*
│   ├── import.ts              ← POST /api/import
│   └── export.ts              ← GET /api/export/data
│
├── middleware/
│   ├── auth.ts                ← Verifica JWT de Supabase → req.user
│   ├── validate.ts            ← Factory validateBody(ZodSchema)
│   └── errorHandler.ts        ← Centraliza manejo de errores → HTTP responses
│
├── services/
│   ├── cv.service.ts          ← Lógica de negocio del CV
│   ├── ai.service.ts          ← LangChain + Claude (extracción de CV)
│   └── file.service.ts        ← Extracción de texto de PDF/DOCX
│
├── repositories/
│   └── cv.repository.ts       ← Acceso a datos via Prisma
│
├── adapters/
│   └── parsed-cv.adapter.ts   ← Normaliza el JSON crudo de la IA
│
├── lib/
│   ├── prisma.ts              ← Singleton de PrismaClient
│   └── supabase.ts            ← Singleton de SupabaseClient (service role)
│
└── main.ts                    ← Express app, middlewares globales, puerto
```

### Shared Package (`packages/shared/src/`)

```
packages/shared/src/
├── types/
│   ├── cv.types.ts            ← Interfaces TypeScript del dominio
│   └── api.types.ts           ← Request/Response shapes
├── schemas/
│   ├── cv.schema.ts           ← Zod schemas para validación (frontend + backend)
│   └── import.schema.ts       ← Schema del JSON que devuelve la IA
└── index.ts                   ← Re-exporta todo
```

---

## Contrato API — Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/cv/me` | ✅ JWT | Obtiene el CV completo del usuario |
| `PUT` | `/api/cv/me` | ✅ JWT | Actualiza el perfil principal |
| `PUT` | `/api/cv/sections/experience/:id` | ✅ JWT | Actualiza una experiencia laboral |
| `POST` | `/api/cv/sections/experience` | ✅ JWT | Crea una nueva experiencia |
| `DELETE` | `/api/cv/sections/experience/:id` | ✅ JWT | Elimina una experiencia |
| `POST` | `/api/import` | ✅ JWT | Importa CV desde PDF/DOCX/texto vía IA |
| `GET` | `/api/export/data` | ✅ JWT | Devuelve datos del CV para exportación |

---

## Seguridad — Doble Capa

```
Request del usuario
       │
       ▼
[1] authMiddleware (Backend)
    └── Verifica JWT con Supabase Auth
    └── Extrae userId → req.user.id
       │
       ▼
[2] Queries de Prisma (siempre filtran por userId)
    └── WHERE profile.user_id = req.user.id
       │
       ▼
[3] Row Level Security de Supabase (si se usa el Supabase JS client directo)
    └── Política: auth.uid() = user_id
```

Nadie puede leer ni modificar datos de otro usuario aunque logre un JWT válido.
