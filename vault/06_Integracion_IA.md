# 🤖 06 — Integración de IA

**Tags:** `#cv-manager` `#ia` `#langchain` `#claude` `#prompt` `#zod`

---

## Visión General

La IA se usa exclusivamente para **transformar texto no estructurado en datos estructurados**. El flujo es:

```
Texto del CV (PDF/DOCX/paste)
       │
LangChain → Claude Sonnet
       │
JSON estructurado
       │
Zod valida y parsea
       │
adaptParsedCV() normaliza
       │
Prisma persiste
```

La IA no toma decisiones de negocio. Solo extrae y organiza. El usuario siempre confirma antes de que los datos se guarden definitivamente.

---

## AIService — Implementación

```typescript
// apps/api/src/services/ai.service.ts
import { ChatAnthropic } from '@langchain/anthropic'
import { ParsedCVSchema } from '@shared/schemas/import.schema'
import { adaptParsedCV } from '../adapters/parsed-cv.adapter'

const model = new ChatAnthropic({
  model: 'claude-sonnet-4-20250514',
  maxTokens: 4096,
  temperature: 0,  // Determinístico para extracción estructurada
})

export class AIService {
  async parseCV(rawText: string): Promise<ParsedCVData> {
    const prompt = buildExtractionPrompt(rawText)

    const response = await model.invoke([
      { role: 'user', content: prompt }
    ])

    const content = response.content as string

    // Extraer JSON del response (Claude puede añadir texto antes/después)
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('AI did not return valid JSON')

    const rawJSON = JSON.parse(jsonMatch[0])

    // Validar con Zod — falla rápido si la IA devuelve algo inválido
    const validated = ParsedCVSchema.safeParse(rawJSON)
    if (!validated.success) {
      throw new Error(`AI response failed validation: ${validated.error.message}`)
    }

    return adaptParsedCV(validated.data)
  }
}

function buildExtractionPrompt(cvText: string): string {
  return `
You are a CV data extraction assistant. Extract structured information from the CV text below.

Return ONLY a valid JSON object matching this exact schema. No explanation, no markdown, just JSON:

{
  "profile": {
    "fullName": "string | null",
    "jobTitle": "string | null",
    "email": "string | null",
    "phone": "string | null",
    "linkedIn": "string | null",
    "location": "string | null",
    "website": "string | null",
    "careerSummary": "string | null"
  },
  "experiences": [
    {
      "role": "string",
      "company": "string",
      "client": "string | null",
      "department": "string | null",
      "location": "string | null",
      "startDate": "string | null (e.g. 'Aug 2025')",
      "endDate": "string | null (e.g. 'Jan 2026')",
      "isCurrent": "boolean",
      "achievements": "string | null",
      "tools": ["string"]
    }
  ],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "country": "string | null",
      "startYear": "string | null (e.g. '2015')",
      "endYear": "string | null (e.g. '2017')",
      "isOngoing": "boolean",
      "specialty": "string | null",
      "honors": "string | null"
    }
  ],
  "skills": [
    {
      "name": "string",
      "category": "TECHNICAL | SOFT | TOOL | OTHER"
    }
  ],
  "languages": [
    {
      "name": "string",
      "level": "A1 | A2 | B1 | B2 | C1 | C2 | NATIVE"
    }
  ]
}

Rules:
- For tools/technologies in experience, extract each one as a separate string item in the "tools" array
- If a date says "Present" or "Current", set isCurrent to true and endDate to null
- Infer language levels from context (e.g., "fluent" → C1, "native" → NATIVE, "basic" → A2)
- If information is not found, use null (not empty string)
- Include ALL work experiences found, ordered from most recent to oldest

CV TEXT:
---
${cvText}
---
`
}
```

---

## Schema Zod del JSON de la IA

```typescript
// packages/shared/src/schemas/import.schema.ts
import { z } from 'zod'

const LanguageLevelEnum = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'NATIVE'])
const SkillCategoryEnum = z.enum(['TECHNICAL', 'SOFT', 'TOOL', 'OTHER'])

export const ParsedCVSchema = z.object({
  profile: z.object({
    fullName: z.string().nullable().optional(),
    jobTitle: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    linkedIn: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    website: z.string().nullable().optional(),
    careerSummary: z.string().nullable().optional(),
  }).optional(),

  experiences: z.array(z.object({
    role: z.string(),
    company: z.string(),
    client: z.string().nullable().optional(),
    department: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    isCurrent: z.boolean().default(false),
    achievements: z.string().nullable().optional(),
    tools: z.array(z.string()).default([]),
  })).default([]),

  education: z.array(z.object({
    degree: z.string(),
    institution: z.string(),
    country: z.string().nullable().optional(),
    startYear: z.string().nullable().optional(),
    endYear: z.string().nullable().optional(),
    isOngoing: z.boolean().default(false),
    specialty: z.string().nullable().optional(),
    honors: z.string().nullable().optional(),
  })).default([]),

  skills: z.array(z.object({
    name: z.string(),
    category: SkillCategoryEnum.default('TECHNICAL'),
  })).default([]),

  languages: z.array(z.object({
    name: z.string(),
    level: LanguageLevelEnum,
  })).default([]),
})

export type ParsedCVData = z.infer<typeof ParsedCVSchema>
```

---

## FileService — Extracción de Texto

```typescript
// apps/api/src/services/file.service.ts
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'

export type ImportType = 'pdf' | 'docx' | 'text'

export class FileService {
  async extractText(type: ImportType, content: string): Promise<string> {
    switch (type) {
      case 'text':
        return content

      case 'pdf': {
        // content llega como base64 desde el frontend
        const buffer = Buffer.from(content, 'base64')
        const result = await pdfParse(buffer)
        return result.text
      }

      case 'docx': {
        const buffer = Buffer.from(content, 'base64')
        const result = await mammoth.extractRawText({ buffer })
        return result.value
      }

      default:
        throw new Error(`Unsupported import type: ${type}`)
    }
  }
}
```

---

## Endpoint de Importación

```typescript
// apps/api/src/routes/import.ts
import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { FileService } from '../services/file.service'
import { AIService } from '../services/ai.service'
import { CvService } from '../services/cv.service'
import { ImportRequestSchema } from '@shared/schemas/import.schema'

const router = Router()
const fileService = new FileService()
const aiService = new AIService()
const cvService = new CvService()

router.post('/', authMiddleware, validateBody(ImportRequestSchema), async (req, res, next) => {
  try {
    const { type, content } = req.body
    const userId = req.user.id

    // 1. Extraer texto del archivo
    const rawText = await fileService.extractText(type, content)

    // 2. IA extrae y estructura los datos
    const parsedData = await aiService.parseCV(rawText)

    // 3. Persistir en DB
    const imported = await cvService.importFromParsed(userId, parsedData)

    res.json({
      success: true,
      imported: imported.sections,  // ['profile', 'experience', 'education']
      data: parsedData              // devuelve los datos para preview en frontend
    })
  } catch (error) {
    next(error)
  }
})

export default router
```

---

## Consideraciones de Costo y Rate Limiting

| Escenario | Tokens estimados | Costo aprox (Claude Sonnet) |
|-----------|------------------|-----------------------------|
| CV corto (1 página) | ~2.000 input + ~1.000 output | ~$0.01 |
| CV largo (3 páginas) | ~5.000 input + ~1.500 output | ~$0.02 |
| Sesión activa (5 imports) | ~25.000 tokens total | ~$0.10 |

> Para el MVP single-user, el costo es despreciable. No se implementa rate limiting en esta fase.

---

## Manejo de Errores de IA

| Error | Causa probable | Respuesta al usuario |
|-------|----------------|---------------------|
| JSON inválido de Claude | Prompt mal formateado o CV muy raro | "No se pudo extraer el CV. Intenta pegar el texto manualmente." |
| Zod validation fails | La IA omitió campos requeridos | Mismo mensaje + log del error para debug |
| API timeout (>30s) | Anthropic sobrecargado | "El servicio de IA no responde. Intenta de nuevo." |
| API rate limit | Demasiadas llamadas | "Límite de IA alcanzado. Espera un momento." |
