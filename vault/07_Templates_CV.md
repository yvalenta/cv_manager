# 🎨 07 — Templates de CV (PDF)

**Tags:** `#cv-manager` `#pdf` `#templates` `#react-pdf` `#diseño`

---

## Estrategia de Generación PDF

Se usa `@react-pdf/renderer` — una librería que implementa un subset de React con su propio motor de layout basado en Flexbox, que compila a PDF nativo.

**Ventajas vs. el sistema legacy (HTML → Google Drive → PDF):**
- Sin servidor involucrado en la generación
- Previsualización instantánea en el browser
- Soporte real de Flexbox (el sistema anterior usaba tablas HTML)
- Control pixel-perfect sobre el output

**Limitaciones importantes de @react-pdf/renderer:**
- No soporta CSS Grid (usar Flexbox siempre)
- No soporta `position: absolute` bien en todos los casos
- Las imágenes deben ser URLs absolutas o base64
- Los bordes se comportan distinto al CSS estándar
- Usar `StyleSheet.create()` siempre (performance)

---

## Template 1 — Corporate

Estilo profesional con sidebar izquierdo de color para datos de contacto y skills.

```tsx
// apps/web/src/components/pdf/TemplateCorporate.tsx
import { Document, Page, View, Text, Link, StyleSheet } from '@react-pdf/renderer'
import type { CvProfile } from '@shared/types/cv.types'

const BRAND_COLOR = '#1E3A5F'
const ACCENT_COLOR = '#2E86AB'
const TEXT_DARK = '#1A1A2E'
const TEXT_GRAY = '#6B7280'

const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: TEXT_DARK,
  },

  // Sidebar izquierdo
  sidebar: {
    width: '35%',
    backgroundColor: BRAND_COLOR,
    padding: 24,
    color: '#FFFFFF',
  },
  sidebarName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
    color: '#FFFFFF',
  },
  sidebarTitle: {
    fontSize: 11,
    color: '#A8C8E8',
    marginBottom: 20,
  },

  // Sección sidebar
  sidebarSection: {
    marginBottom: 16,
  },
  sidebarSectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#A8C8E8',
    borderBottom: `1pt solid #2E5580`,
    paddingBottom: 4,
    marginBottom: 8,
  },
  sidebarText: {
    fontSize: 9,
    color: '#D0E4F7',
    marginBottom: 3,
    lineHeight: 1.4,
  },

  // Skill pill
  skillPill: {
    backgroundColor: '#2E5580',
    borderRadius: 3,
    padding: '3 6',
    marginBottom: 4,
    marginRight: 4,
  },
  skillText: {
    fontSize: 8,
    color: '#D0E4F7',
  },

  // Contenido principal
  main: {
    width: '65%',
    padding: 24,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_COLOR,
    borderBottom: `2pt solid ${ACCENT_COLOR}`,
    paddingBottom: 4,
    marginBottom: 10,
  },

  // Experiencia
  expHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  expRole: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  expDates: {
    fontSize: 9,
    color: TEXT_GRAY,
  },
  expCompany: {
    fontSize: 9,
    color: ACCENT_COLOR,
    marginBottom: 4,
  },
  expText: {
    fontSize: 9,
    color: TEXT_DARK,
    lineHeight: 1.5,
  },

  // Tools
  toolsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 3,
  },
  toolChip: {
    backgroundColor: '#EBF4FF',
    borderRadius: 2,
    padding: '2 5',
  },
  toolText: {
    fontSize: 7.5,
    color: BRAND_COLOR,
  },
})

interface Props {
  data: CvProfile
}

export function TemplateCorporate({ data }: Props) {
  const { fullName, jobTitle, email, phone, linkedIn, location, careerSummary,
          experiences, education, skills, languages } = data

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* SIDEBAR */}
        <View style={styles.sidebar}>
          <Text style={styles.sidebarName}>{fullName}</Text>
          <Text style={styles.sidebarTitle}>{jobTitle}</Text>

          {/* Contacto */}
          <View style={styles.sidebarSection}>
            <Text style={styles.sidebarSectionTitle}>Contact</Text>
            {email && <Text style={styles.sidebarText}>{email}</Text>}
            {phone && <Text style={styles.sidebarText}>{phone}</Text>}
            {location && <Text style={styles.sidebarText}>{location}</Text>}
            {linkedIn && <Text style={styles.sidebarText}>{linkedIn}</Text>}
          </View>

          {/* Skills */}
          {skills.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarSectionTitle}>Skills</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3 }}>
                {skills.slice(0, 16).map((skill) => (
                  <View key={skill.id} style={styles.skillPill}>
                    <Text style={styles.skillText}>{skill.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Idiomas */}
          {languages.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarSectionTitle}>Languages</Text>
              {languages.map((lang) => (
                <Text key={lang.id} style={styles.sidebarText}>
                  {lang.name} — {lang.level}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* MAIN CONTENT */}
        <View style={styles.main}>

          {/* Resumen */}
          {careerSummary && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Professional Summary</Text>
              <Text style={styles.expText}>{careerSummary}</Text>
            </View>
          )}

          {/* Experiencia */}
          {experiences.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Experience</Text>
              {experiences.map((exp) => (
                <View key={exp.id} style={{ marginBottom: 10 }}>
                  <View style={styles.expHeader}>
                    <Text style={styles.expRole}>{exp.role}</Text>
                    <Text style={styles.expDates}>{exp.displayDates}</Text>
                  </View>
                  <Text style={styles.expCompany}>
                    {exp.company}{exp.client ? ` · ${exp.client}` : ''}
                  </Text>
                  {exp.achievements && (
                    <Text style={styles.expText}>{exp.achievements}</Text>
                  )}
                  {exp.tools.length > 0 && (
                    <View style={styles.toolsRow}>
                      {exp.tools.map((tool) => (
                        <View key={tool.id} style={styles.toolChip}>
                          <Text style={styles.toolText}>{tool.name}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Educación */}
          {education.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Education</Text>
              {education.map((edu) => (
                <View key={edu.id} style={{ marginBottom: 6 }}>
                  <View style={styles.expHeader}>
                    <Text style={styles.expRole}>{edu.degree}</Text>
                    <Text style={styles.expDates}>{edu.displayDates}</Text>
                  </View>
                  <Text style={styles.expCompany}>{edu.institution}</Text>
                  {edu.specialty && (
                    <Text style={styles.expText}>{edu.specialty}</Text>
                  )}
                </View>
              ))}
            </View>
          )}

        </View>
      </Page>
    </Document>
  )
}
```

---

## Template 2 — Minimal

Diseño limpio de una columna, sin colores de fondo. Máxima legibilidad.

```tsx
// apps/web/src/components/pdf/TemplateMinimal.tsx
// Estructura similar pero:
// - Una sola columna, ancho completo
// - Sin colores de fondo
// - Typography más espaciada
// - Skills y Contacto al inicio como dos columnas dentro de la columna principal
// Ver implementación completa cuando se desarrolle la Fase 5
```

---

## Componente de Selección y Descarga

```tsx
// apps/web/src/app/routes/preview.tsx
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer'
import { TemplateCorporate } from '@/components/pdf/TemplateCorporate'
import { TemplateMinimal } from '@/components/pdf/TemplateMinimal'
import { useCV } from '@/hooks/useCV'

type TemplateVariant = 'corporate' | 'minimal'

export function PreviewRoute() {
  const { data: cv } = useCV()
  const [template, setTemplate] = useState<TemplateVariant>('corporate')

  if (!cv) return <div>Loading...</div>

  const SelectedTemplate = template === 'corporate' ? TemplateCorporate : TemplateMinimal
  const fileName = `${cv.fullName?.replace(' ', '_') ?? 'CV'}_CV.pdf`

  return (
    <div className="flex h-screen">
      {/* Panel de control */}
      <aside className="w-64 p-4 border-r">
        <h2 className="font-semibold mb-4">Template</h2>
        <button onClick={() => setTemplate('corporate')}>Corporate</button>
        <button onClick={() => setTemplate('minimal')}>Minimal</button>

        <PDFDownloadLink
          document={<SelectedTemplate data={cv} />}
          fileName={fileName}
        >
          {({ loading }) => (
            <button disabled={loading}>
              {loading ? 'Generating...' : 'Download PDF'}
            </button>
          )}
        </PDFDownloadLink>
      </aside>

      {/* Previsualización */}
      <PDFViewer className="flex-1">
        <SelectedTemplate data={cv} />
      </PDFViewer>
    </div>
  )
}
```

---

## Paleta de Colores

| Token | Corporate | Minimal |
|-------|-----------|---------|
| Brand Primary | `#1E3A5F` (azul marino) | `#111827` (casi negro) |
| Brand Accent | `#2E86AB` (azul cielo) | `#374151` (gris oscuro) |
| Background | Sidebar: `#1E3A5F` | Blanco puro |
| Text Primary | `#1A1A2E` | `#111827` |
| Text Secondary | `#6B7280` | `#6B7280` |
| Tool chips | `#EBF4FF` | `#F3F4F6` |
