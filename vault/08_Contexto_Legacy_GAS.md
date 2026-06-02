# 🗃️ 08 — Contexto Legacy (Google Apps Script)

**Tags:** `#cv-manager` `#legacy` `#gas` `#historia` `#decisiones`

> **Propósito de este documento:** Preservar el conocimiento del sistema anterior como referencia histórica. No se mantiene activamente. Sirve para entender por qué se tomaron ciertas decisiones en el nuevo sistema.

---

## Por qué migramos

| Problema en GAS | Solución en el nuevo sistema |
|-----------------|------------------------------|
| Un archivo de ~38KB con todo el frontend | Monorepo modular con componentes separados |
| React desde CDN + Babel en runtime | Vite con HMR y TypeScript compilado |
| Sin tests, sin CI/CD | TDD + GitHub Actions |
| PDF: HTML → Google Doc → PDF (sin Flexbox) | @react-pdf/renderer (Flexbox nativo) |
| DB: archivo JSON en Drive | PostgreSQL en Supabase |
| Deploy: solo en Google Workspace | Vercel + Render (accesible desde cualquier lugar) |

---

## Arquitectura del Sistema Anterior

```
Google Apps Script (Monolito)
│
├── appsscript.json        ← Configuración del proyecto
├── Config.gs              ← Constantes (FILE_SUFFIX, etc.)
├── Router.gs              ← doGet() → sirve el HTML
├── Services.gs            ← TODA la lógica de backend
├── PDFService.gs          ← Generación HTML → Drive → PDF
│
├── Index.html             ← Shell HTML con meta tags
├── AppReact.html          ← TODO el frontend React (1 archivo ~38KB)
└── CVTemplate.html        ← Template HTML para el PDF
```

---

## Bugs Documentados (Resueltos antes de migrar)

### Bug #1 — `getCVData()` no existía en el backend
**Síntoma:** La app cargaba en blanco / spinner infinito.  
El `useEffect` inicial llamaba `google.script.run.getCVData()` pero la función no estaba en `Services.gs`.

**Solución:** Crear `getCVData()` con cache-first via `CacheService`:

```javascript
function getCVData() {
  const cache = CacheService.getUserCache();
  const cached = cache.get('cv_data');
  if (cached) return { success: true, data: JSON.parse(cached), source: 'cache' };

  const file = ensureJSONFile();
  const db = JSON.parse(file.getBlob().getDataAsString());
  const data = { profile: db.profile || {}, experience: db.experience || [], education: db.education || [] };

  cache.put('cv_data', JSON.stringify(data), 21600);
  return { success: true, data, source: 'drive' };
}
```

**Lección:** En el nuevo sistema, el endpoint `GET /api/cv/me` existe desde el día 1 (Fase 2) y está cubierto por tests.

---

### Bug #2 — `handleDelete` y `handleMove` declarados dos veces
**Síntoma:** Babel lanzaba `SyntaxError: Identifier 'handleDelete' has already been declared` y el componente no montaba.

**Causa:** Babel en modo estricto no permite redeclarar `const` en el mismo scope. Al trabajar en un solo archivo enorme, era fácil duplicar funciones sin darse cuenta.

**Lección:** El monorepo con un componente por archivo y TypeScript eliminan esta clase de errores en build time.

---

### Bug #3 — `saveCategoryData()` no existía para guardar el Perfil
**Síntoma:** El formulario de Perfil guardaba sin errores visibles pero los datos no se persistían.

**Solución:** Función centralizada con `LockService` para evitar escrituras concurrentes:

```javascript
function saveCategoryData(category, payload) {
  const lock = LockService.getUserLock();
  try {
    lock.waitLock(10000);
    const file = ensureJSONFile();
    const db = JSON.parse(file.getBlob().getDataAsString());
    switch (category.toUpperCase()) {
      case 'PROFILE':    db.profile    = payload; break;
      case 'EXPERIENCE': db.experience = payload; break;
      case 'EDUCATION':  db.education  = payload; break;
      default: throw new Error(`Categoría [${category}] no reconocida.`);
    }
    file.setContent(JSON.stringify(db, null, 2));
    CacheService.getUserCache().remove('cv_data');
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}
```

**Lección:** En el nuevo sistema, cada sección tiene su propio endpoint PUT y su propio Prisma model. No hay un switch central que pueda olvidar un caso.

---

## Generación de PDF en GAS (Referencia)

El sistema legacy no podía usar Puppeteer, así que usaba un flujo indirecto:

```
getCVData()
  → renderizar CVTemplate.html con datos
  → Utilities.newBlob(html, MIME.HTML)
  → tempFolder.createFile(blob)       ← Google lo convierte a Google Doc
  → tempFile.getAs(MimeType.PDF)      ← Exporta como PDF
  → Utilities.base64Encode(pdfBlob)   ← Para enviar al frontend
  → tempFile.setTrashed(true)         ← Limpieza
```

**Limitación crítica:** Google convierte HTML → Google Doc antes de exportar. El CSS debía ser inline, sin Flexbox ni Grid. Se usaban tablas HTML para layouts en columnas.

**Impacto en el nuevo sistema:** Esta es la razón principal por la que elegimos `@react-pdf/renderer`. Tiene su propio motor Flexbox y no depende de ninguna conversión intermedia.

---

## Estructura del JSON Legacy (Referencia histórica)

El sistema anterior guardaba todo en un único JSON en Drive:

```json
{
  "profile": {
    "fullName": "...",
    "jobTitle": "Sr. Ruby Developer",
    "careerSummary": "...",
    "linkedIn": "linkedin.com/in/...",
    "location": "Medellín, Colombia",
    "languages": "Spanish (C2), English (B2)"  ← String libre → ahora tabla profile_languages
  },
  "experience": [
    {
      "role": "Sr. Ruby Developer",
      "company": "Globant",
      "dates": "Aug 2024 - Present",           ← String combinado → ahora startDate + endDate
      "achievements": "...",
      "tools": "Ruby on Rails, LangChain, AWS" ← String CSV → ahora tabla experience_tools
    }
  ],
  "education": [
    {
      "degree": "Ing. de Sistemas",
      "institution": "Universidad Católica del Norte",
      "studyDates": "2015 - 2017"              ← String → ahora startYear + endYear
    }
  ]
}
```

La migración de datos del JSON legacy al nuevo esquema se puede hacer con el endpoint de importación IA (pegando el JSON como texto) o con un script de migración one-time.
