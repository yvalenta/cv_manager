# 🗂️ CV Manager AI — Vault Principal

**Vault de conocimiento técnico** para el proyecto CV Manager AI. Este es el documento raíz del sistema de documentación. Todo lo que construimos, decidimos y aprendemos vive aquí.

---

## 🧭 Navegación del Vault

| Documento | Descripción |
|-----------|-------------|
| [01 - Visión y Alcance](./01_Vision_y_Alcance.md) | Qué construimos, por qué y para quién |
| [02 - Stack y Hosting](./02_Stack_y_Hosting.md) | Tecnologías elegidas + servicios gratuitos (Vercel, Render, Supabase) |
| [03 - Arquitectura del Sistema](./03_Arquitectura_del_Sistema.md) | Capas, flujos de datos, patrones de diseño, decisiones |
| [04 - Base de Datos](./04_Base_de_Datos.md) | Esquema PostgreSQL completo vía Prisma + RLS de Supabase |
| [05 - Fases del Proyecto](./05_Fases_del_Proyecto.md) | Roadmap por sprints, comandos de setup, checklists |
| [06 - Integración de IA](./06_Integracion_IA.md) | LangChain, prompts, esquema JSON de extracción, validación con Zod |
| [07 - Templates de CV](./07_Templates_CV.md) | Plantillas PDF con @react-pdf/renderer, paleta, especificaciones |
| [08 - Contexto Legacy (GAS)](./08_Contexto_Legacy_GAS.md) | Historia del sistema anterior, bugs resueltos, decisiones de migración |

---

## 📌 Estado Actual del Proyecto

| Fase | Estado |
|------|--------|
| **Legacy GAS** | ✅ Completado y documentado |
| **Setup monorepo + CI/CD** | ⚙️ En progreso (Fase 1) |
| **Auth + Base de datos** | 🔲 Pendiente (Fase 2) |
| **IA + Importación** | 🔲 Pendiente (Fase 3) |
| **Editor de CV** | 🔲 Pendiente (Fase 4) |
| **PDF + Templates** | 🔲 Pendiente (Fase 5) |

---

## 🏷️ Tags del vault

`#cv-manager` `#arquitectura` `#react` `#typescript` `#supabase` `#express` `#prisma` `#langchain` `#pdf` `#postgresql` `#monorepo` `#pnpm`

---

## 🔑 Decisiones Clave (Quick Reference)

| Decisión | Elección | Dónde se documenta |
|----------|----------|--------------------|
| Hosting frontend | Vercel | 02 - Stack |
| Hosting backend | Render | 02 - Stack |
| Base de datos | Supabase (PostgreSQL) | 02 - Stack, 04 - DB |
| Auth | Supabase Auth + JWT | 03 - Arquitectura |
| Generación PDF | @react-pdf/renderer (client-side) | 03 - Arquitectura, 07 - Templates |
| Package manager | pnpm workspaces (monorepo) | 05 - Fases |
| Validación | Zod compartido (frontend + backend) | 03 - Arquitectura |
| ORM | Prisma | 04 - DB |
| Cálculo de fechas | Strings formateados (flexibilidad) | 04 - DB |
| IA | LangChain + Claude Sonnet | 06 - IA |
