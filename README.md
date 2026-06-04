# 🗂️ CV Manager AI

[![CI status](https://github.com/yvalenta/cv_manager/actions/workflows/ci.yml/badge.svg)](https://github.com/yvalenta/cv_manager/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**CV Manager AI** is a modern, modular web application designed for software developers to manage, enrich, and export their Curriculums Vitae (CV) using Artificial Intelligence. 

By replacing an old, legacy Google Apps Script monolith, this project implements a highly scalable, type-safe **pnpm monorepo** architecture leveraging **React + TypeScript** for the frontend, **Express + Node.js** for the backend API, and **Supabase (PostgreSQL)** for security, authentication, and persistence. It features smart CV parsing powered by **Claude Sonnet via LangChain JS** and seamless client-side PDF generation.

---

## 🧭 Vault Documentation Index
All detailed architectural decisions, data models, database schemas, legacy context, and design parameters are documented in the [vault](./vault) directory:

*   **[00 - Index](./vault/00_INDEX.md)**: Navigation, current project phase, and quick-reference technical decisions.
*   **[01 - Vision & Scope](./vault/01_Vision_y_Alcance.md)**: Product goals, value proposition, user profiles, and MVP scope.
*   **[02 - Stack & Hosting](./vault/02_Stack_y_Hosting.md)**: Core dependencies, tools, environment variables, and hosting setup.
*   **[03 - Architecture](./vault/03_Arquitectura_del_Sistema.md)**: Layer descriptions, data flows, APIs, and project guidelines.
*   **[04 - Database Schema](./vault/04_Base_de_Datos.md)**: Complete Prisma schema and Row Level Security (RLS) configurations.
*   **[05 - Project Phases](./vault/05_Fases_del_Proyecto.md)**: Implementation steps, command guides, checklist progress.
*   **[06 - AI Integration](./vault/06_Integracion_IA.md)**: Extraction prompts, JSON structures, and Zod verification schemes.
*   **[07 - PDF Templates](./vault/07_Templates_CV.md)**: Design tokens, colors, layouts, and specifications for PDF exports.
*   **[08 - Legacy Context](./vault/08_Contexto_Legacy_GAS.md)**: Reference details on the migrated Google Apps Script setup.
*   **[Constitution](./vault/constitution.md)**: Coding standards, branch strategy, and invariant guidelines.

---

## 🛠️ Tech Stack & Services

### Services & Hosting ($0 in Development)
*   **Frontend Hosting**: [Vercel](https://vercel.com) (React SPA + Auto CI/CD)
*   **Backend API Hosting**: [Render](https://render.com) (Node.js API + Webhook Deploy)
*   **Database & Auth**: [Supabase](https://supabase.com) (PostgreSQL 15 + RLS + Auth + Storage)
*   **LLM Engine**: [Anthropic Claude](https://www.anthropic.com/claude) (Claude Sonnet API via LangChain JS)

### Package & Monorepo Structure
This project utilizes a **pnpm monorepo** workspace layout for strict modularity and fast installations:

```
cv-manager/
├── apps/
│   ├── web/          # Frontend React SPA (Vite + Tailwind CSS + shadcn/ui)
│   └── api/          # Backend Express Server (Prisma + LangChain + Multer)
├── packages/
│   └── shared/       # Shared TypeScript types and Zod schemas
├── vault/            # Project documentation vault
├── .github/
│   └── workflows/    # CI/CD pipelines (GitHub Actions)
├── pnpm-workspace.yaml
├── package.json      # Root package scripts
└── README.md         # Project entry point (this file)
```

---

## ⚡ Quick Start

### Prerequisites
*   Node.js (v20 LTS recommended)
*   [pnpm](https://pnpm.io/) (`npm i -g pnpm`)

### 1. Installation
Install all dependencies in the workspace:
```bash
pnpm install
```

### 2. Configure Environment Variables
Copy the global `.env.example` file and set up your Supabase and LLM API keys:
```bash
cp .env.example .env
```

And follow the guide in [02 - Stack & Hosting](./vault/02_Stack_y_Hosting.md) to set local `.env` values for `apps/web/` and `apps/api/`.

### 3. Database Migration
Navigate to the API app, set your local credentials, and apply the migrations:
```bash
cd apps/api
pnpm exec prisma migrate dev
pnpm exec prisma generate
```

### 4. Running Locally
Run both the React frontend and Express backend concurrently from the root directory:
```bash
pnpm dev
```

*   **Frontend Dev Server**: `http://localhost:5173`
*   **Backend API Server**: `http://localhost:3001`

### 5. Linting & Typechecking
```bash
# Typecheck everything
pnpm typecheck

# Lint all workspace code
pnpm lint

# Build all packages & apps
pnpm build
```

---

## 🔒 Row Level Security & Verification
Security is enforced end-to-end:
1.  **Authentication**: Handled via Supabase JWT verification on the backend.
2.  **Row Level Security (RLS)**: PostgreSQL policy isolates users' records so they can only query their own data.
3.  **Strict Contracts**: [Zod](https://zod.dev/) schemas are defined in `packages/shared` and compiled in build-time for type safety, validating all incoming JSON structures from Claude and HTTP requests at runtime.
