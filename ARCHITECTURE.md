# 🏗️ Cata Architecture: Source of Truth

## 1. Project Overview

Cata is an AI-powered job application automation platform designed to streamline the job search process through intelligent matching, scraping, and automated form filling.

## 2. Tech Stack & Environment

- **Orchestration:** [Nx Monorepo](https://nx.dev)
- **Backend:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.12+), [SQLAlchemy](https://www.sqlalchemy.org/) (PostgreSQL), [Alembic](https://alembic.sqlalchemy.org/) (if added).
- **Dashboard:** [Next.js](https://nextjs.org/) (React), [Tailwind CSS](https://tailwindcss.com/).
- **Extension:** [Vite](https://vitejs.dev/), [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/), [CRXJS](https://crxjs.dev/).
- **Scraper:** [Scrapy](https://scrapy.org/), [Redis](https://redis.io/) (via BullMQ or similar orchestration).
- **Infrastructure:** [Docker Compose](https://docs.docker.com/compose/) for local development.

## 3. File Structure

- `apps/api/`: FastAPI server.
  - `app/api/v1/`: Endpoint definitions (versioned).
  - `app/services/`: Business logic, including `ai/` for model factory.
  - `app/models/`: SQLAlchemy database models.
  - `app/schemas/`: Pydantic models for request/response validation.
- `apps/extension/`: Chrome extension.
  - `src/background/`: Service worker handling auth and API orchestration.
  - `src/content/`: DOM interaction and field detection.
  - `src/popup/`: React-based side panel/UI.
- `apps/dashboard/`: Next.js admin/analytics interface.
- `apps/scraper/`: Scrapy-based crawling service.
- `libs/`: Shared logic.
  - `shared-types/`: TypeScript definitions for cross-app consistency.
  - `shared-ui/`: Common React components (JobCard, ApplicationCard, etc.).

## 4. Implementation Patterns

- **AI Factory:** All AI interactions must flow through the `app/services/ai/factory.py`. This ensures provider abstraction (Gemini, HuggingFace) and consistent prompting.
- **Strict Typing:**
  - **Backend:** Always use Pydantic schemas for data validation.
  - **Frontend:** Maintain central interfaces in `libs/shared-types`. 
  - **No `any` Policy:** Use of `any` or `as any` is strictly prohibited. Use `unknown`, generics, or specific interface type guards.
  - **UI State Consistency:** Use the `AppStatus` interface for all banner/UI feedback states across the extension and dashboard.
  - **Safe DOM Operations:** Avoid non-null assertions (`!`). Use explicit checks or descriptive error throws for missing elements (e.g., `document.getElementById`).
  - **Error Handling:** Use `unknown` for `catch` block variables and validate them (e.g., `instanceof Error`) before accessing properties like `.message`.
  - **Compiler/Lint Standards:** Use `@ts-expect-error` instead of `@ts-ignore` for intentional type bypasses, and always include a brief explanation. Ensure all code passes `nx lint` and `tsc --noEmit`.

- **API Communication:** Extension MUST use the background service worker as a proxy for backend calls to leverage centralized session management and avoid CORS overhead where possible.
- **Database:** Use `SessionLocal` (async) for all CRUD operations. All models must inherit from `Base` in `app.core.database`.

## 5. Efficiency Suggestions for AI Agent

To make my assistance more efficient, follow these guidelines:

- **Reference Shared Libs:** Before creating a new type or UI component, check `libs/shared-types` or `libs/shared-ui`.
- **Check Manifest Permissions:** When adding extension features, verify `apps/extension/src/manifest.ts` permissions.
- **Seed Data:** When modifying DB schemas, update the `seed_data` function in `apps/api/app/main.py`.
- **CORS Scope:** Remember that `api/main.py` explicitly allows `chrome-extension://*`.

> [!IMPORTANT]
> Always read this file at the start of every session. Ensure all code suggestions adhere to the tech stack and file structure defined here.
