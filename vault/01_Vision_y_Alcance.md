# 🎯 01 — Visión y Alcance

**Tags:** `#cv-manager` `#vision` `#alcance` `#producto`

---

## ¿Qué construimos?

**CV Manager AI** es una aplicación web que permite a un desarrollador de software gestionar, enriquecer y exportar su currículum vitae (CV) de forma inteligente. El sistema combina un editor estructurado con capacidades de IA para importar y parsear CVs existentes.

---

## Problema que resuelve

El sistema anterior era un monolito en Google Apps Script: un solo archivo React de ~38KB cargado desde CDN, sin módulos, sin tests, con lógica mezclada y limitaciones serias en la generación de PDFs. Mantenerlo era costoso y escalarlo, imposible.

El nuevo sistema reemplaza eso con una arquitectura web moderna, modular, testeable y desplegable con CI/CD automático.

---

## Propuesta de valor

| Para quién | El problema | La solución |
|-----------|-------------|-------------|
| Desarrollador de software | Mantener el CV actualizado es tedioso | Editor estructurado por secciones con UX limpia |
| Postulante activo | Reformatear el CV para cada empresa toma tiempo | Templates PDF intercambiables con un clic |
| Usuario de IA | Pasar experiencia de texto libre a formato estructurado es difícil | Importación inteligente con Claude Sonnet |

---

## Alcance — En Scope (MVP)

- **Auth**: Login/registro via Supabase Auth (email + contraseña)
- **Perfil**: Edición de datos personales (nombre, título, ubicación, contacto, resumen)
- **Experiencia laboral**: CRUD completo con herramientas/tecnologías por experiencia
- **Educación**: CRUD de títulos e instituciones
- **Skills globales**: Lista consolidada de tecnologías con categorías
- **Idiomas**: Con nivel CEFR (A1–C2, Native)
- **Importación con IA**: Subir PDF/DOCX o pegar texto → Claude extrae y estructura los datos
- **Exportación PDF**: Templates intercambiables generados 100% client-side con @react-pdf/renderer
- **Responsive**: Desktop ≥ 1024px, Tablet ≥ 768px

---

## Alcance — Out of Scope (MVP)

- Múltiples usuarios o roles (es una app personal, single-user)
- Comparación de versiones de CV
- Integración directa con LinkedIn u otras plataformas
- Mobile nativo (iOS/Android)
- Compartir el CV con link público (futuro)
- Facturación o planes de pago

---

## Usuario objetivo

**Perfil principal:** Desarrollador de software senior con experiencia en múltiples empresas y proyectos, que necesita mantener su CV actualizado y exportarlo en diferentes formatos de manera rápida y profesional.

**Contexto de uso:** El usuario es el mismo que desarrolla la aplicación. Es una herramienta personal con potencial de compartirse con otros desarrolladores.

---

## Métricas de éxito (MVP)

- El CV completo se puede editar y guardar en < 2 minutos por sección
- La importación con IA extrae al menos el 85% de los datos correctamente de un PDF bien formateado
- El PDF exportado es indistinguible de uno hecho a mano en calidad visual
- El cold start de Render no supera los 35 segundos (limitación del free tier aceptada)
