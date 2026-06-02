# 🗄️ 04 — Base de Datos (PostgreSQL + Prisma + Supabase)

**Tags:** `#cv-manager` `#base-de-datos` `#postgresql` `#prisma` `#supabase` `#rls`

---

## Diagrama de Entidades

```
┌─────────────────┐
│   auth.users    │  ← Gestionada por Supabase Auth (no en schema público)
│   (Supabase)    │
└────────┬────────┘
         │ 1:1  (userId como FK lógica)
┌────────▼────────┐
│   cv_profiles   │  ← Perfil principal + resumen profesional
└────────┬────────┘
         │ 1:N
    ┌────┼──────────────────────────────────┐
    │    │                │                 │
┌───▼────┴────┐  ┌────────▼───────┐  ┌─────▼────────────┐
│   work_      │  │   education    │  │   cv_skills      │
│ experiences  │  │                │  │                  │
└──────┬──────┘  └────────────────┘  └──────────────────┘
       │ 1:N
┌──────▼──────────┐    ┌─────────────────────┐
│ experience_tools│    │  profile_languages   │
│                 │    │  (cv_profiles 1:N)   │
└─────────────────┘    └─────────────────────┘
```

---

## Esquema Prisma Completo

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // Requerido por Supabase para migraciones
}

// ─── PERFIL PRINCIPAL ──────────────────────────────────────────────────────

model CvProfile {
  id             String   @id @default(cuid())
  userId         String   @unique @map("user_id")

  // Datos personales
  fullName       String?  @map("full_name")
  jobTitle       String?  @map("job_title")
  email          String?
  phone          String?
  linkedIn       String?  @map("linked_in")
  location       String?
  website        String?

  // Resumen profesional
  careerSummary  String?  @map("career_summary")  @db.Text

  // Control de versiones
  cvVersion      Int      @default(1) @map("cv_version")
  lastExportedAt DateTime? @map("last_exported_at")

  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  // Relaciones
  languages      ProfileLanguage[]
  experiences    WorkExperience[]
  education      Education[]
  skills         CvSkill[]

  @@map("cv_profiles")
}

// ─── IDIOMAS ───────────────────────────────────────────────────────────────

model ProfileLanguage {
  id        String        @id @default(cuid())
  profileId String        @map("profile_id")
  name      String                             // "English", "Spanish"
  level     LanguageLevel                      // Enum CEFR
  sortOrder Int           @default(0) @map("sort_order")

  profile   CvProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)

  @@map("profile_languages")
}

enum LanguageLevel {
  A1
  A2
  B1
  B2
  C1
  C2
  NATIVE
}

// ─── EXPERIENCIA LABORAL ───────────────────────────────────────────────────

model WorkExperience {
  id           String   @id @default(cuid())
  profileId    String   @map("profile_id")

  role         String                           // "Sr. Ruby Developer"
  company      String                           // "Globant"
  client       String?                          // "Panorama Education" (cliente del proyecto)
  department   String?                          // "AI Studio"
  country      String?
  location     String?                          // "Medellín (remoto)"

  // Fechas como strings para flexibilidad de formato
  startDate    String?  @map("start_date")      // "Aug 2025"
  endDate      String?  @map("end_date")        // "Jan 2026" | null si es actual
  isCurrent    Boolean  @default(false) @map("is_current")
  displayDates String?  @map("display_dates")   // "Aug 2025 - Present" (calculado)

  achievements String?  @db.Text               // Logros y responsabilidades
  sortOrder    Int      @default(0) @map("sort_order")

  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  profile      CvProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  tools        ExperienceTool[]

  @@map("work_experiences")
}

// ─── HERRAMIENTAS / TECNOLOGÍAS POR EXPERIENCIA ───────────────────────────

model ExperienceTool {
  id           String         @id @default(cuid())
  experienceId String         @map("experience_id")
  name         String                               // "Ruby on Rails", "LangChain"
  sortOrder    Int            @default(0) @map("sort_order")

  experience   WorkExperience @relation(fields: [experienceId], references: [id], onDelete: Cascade)

  @@map("experience_tools")
}

// ─── EDUCACIÓN ─────────────────────────────────────────────────────────────

model Education {
  id           String    @id @default(cuid())
  profileId    String    @map("profile_id")

  degree       String                          // "Ing. de Sistemas", "MBA"
  institution  String                          // "Universidad Católica del Norte"
  country      String?

  startYear    String?   @map("start_year")    // "2015"
  endYear      String?   @map("end_year")      // "2017" | null si en curso
  isOngoing    Boolean   @default(false) @map("is_ongoing")
  displayDates String?   @map("display_dates") // "2015 - 2017"

  specialty    String?                         // "Especialidad en Redes"
  gpa          String?                         // "4.2/5.0" (opcional)
  honors       String?                         // "Cum Laude" (opcional)

  sortOrder    Int       @default(0) @map("sort_order")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  profile      CvProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)

  @@map("education")
}

// ─── SKILLS GLOBALES ───────────────────────────────────────────────────────

model CvSkill {
  id           String        @id @default(cuid())
  profileId    String        @map("profile_id")

  name         String                            // "Ruby on Rails"
  category     SkillCategory @default(TECHNICAL)
  yearsExp     Int?          @map("years_exp")   // Años de experiencia
  sortOrder    Int           @default(0) @map("sort_order")

  profile      CvProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)

  @@map("cv_skills")
}

enum SkillCategory {
  TECHNICAL     // Lenguajes, frameworks, bases de datos
  SOFT          // Comunicación, liderazgo, etc.
  TOOL          // IDEs, herramientas de desarrollo
  OTHER
}
```

---

## Row Level Security (RLS) en Supabase

Después de crear las tablas con Prisma, habilitar RLS en Supabase:

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE cv_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_languages ENABLE ROW LEVEL SECURITY;

-- Política para cv_profiles: solo el propietario
CREATE POLICY "Users can only access their own profile"
  ON cv_profiles
  FOR ALL
  USING (auth.uid()::text = user_id);

-- Política para work_experiences: via join con cv_profiles
CREATE POLICY "Users can only access their own experiences"
  ON work_experiences
  FOR ALL
  USING (
    profile_id IN (
      SELECT id FROM cv_profiles WHERE user_id = auth.uid()::text
    )
  );

-- Repetir patrón para education, cv_skills, profile_languages, experience_tools
```

> **Nota:** En el backend Express, el acceso se filtra por `userId` en cada query Prisma. El RLS es una segunda capa de defensa para el caso de acceso directo al Supabase JS client.

---

## Decisiones de Diseño de la DB

| Decisión | Alternativa descartada | Razón |
|----------|----------------------|-------|
| Fechas como `String` (`"Aug 2025"`) | `DateTime` | Los CVs tienen fechas en formatos irregulares ("Present", "2020-ish"). Los strings son más flexibles. |
| `tools` como tabla separada | Array de strings en JSON | Permite ordenar, editar individualmente y escalar (añadir años de exp por tool). |
| `cuid()` como PK | `uuid` | cuid es más corto, URL-safe y se puede generar en el cliente. |
| `onDelete: Cascade` | Soft delete | La app no necesita recuperar datos eliminados en el MVP. Simplifica queries. |
| `displayDates` como campo calculado almacenado | Calcular en runtime | Evita lógica de formato en múltiples lugares. El backend lo genera al crear/actualizar. |
| `sortOrder` en todas las listas | Ordenar por `createdAt` | Permite drag-and-drop reordering sin cambiar fechas. |

---

## Comandos de Migración

```bash
# Desde apps/api/

# Crear una nueva migración (genera SQL y aplica en dev)
pnpm exec prisma migrate dev --name "init_cv_schema"

# Aplicar migraciones pendientes en producción
pnpm exec prisma migrate deploy

# Regenerar el Prisma Client después de cambios al schema
pnpm exec prisma generate

# Inspeccionar la DB en browser
pnpm exec prisma studio
```
