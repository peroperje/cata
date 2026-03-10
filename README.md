# CATA: AI-Powered Job Application Automation

<div align="center">
  <img src="/home/petar/.gemini/antigravity/brain/8fa1ffaa-281f-4c94-a59c-a73e36fcb015/cata_project_mockup_1773171339762.png" alt="CATA Dashboard Preview" width="800">
  <p><em>Turn your job search into a high-performance automated pipeline.</em></p>
</div>

[![Tech Stack](https://img.shields.io/badge/Stack-Nx_|_FastAPI_|_Next.js_|_React-blue.svg)](https://github.com/peroperje/cata)
[![License](https://img.shields.io/badge/License-Private-red.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.12-green.svg)](https://www.python.org/)
[![Node](https://img.shields.io/badge/Node-18+-green.svg)](https://nodejs.org/)

CATA (Chrome Assistant for Tailored Applications) is an end-to-end platform designed to automate the heavy lifting of job searching. By combining a browser extension for intelligent form-filling, a centralized Next.js management dashboard, and background discovery services, CATA streamlines your path to a new role.

---

## 📖 Table of Contents
- [✨ Key Features](#-key-features)
- [🏗️ Repository Structure](#️-repository-structure)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Quick Start](#-quick-start)
- [⚙️ Configuration](#️-configuration)
- [📁 Shared Resources](#-shared-resources)
- [🚢 Deployment](#-deployment)
- [🧪 Testing](#-testing)

---

## ✨ Key Features

- **🤖 AI-Powered Autofill**: Chrome Extension (Manifest V3) using Gemini, OpenAI, or Groq via a unified **AI Factory** to contextually fill application forms.
- **📊 Management Dashboard**: Next.js 15 interface for tracking application lifecycles, managing professional profiles, and searching through discovered jobs.
- **📩 Automated Gmail Extraction**: Background service that periodically polls for job alerts (LinkedIn, Indeed, etc.) and extracts job metadata into the DB.
- **🕷️ Smart Crawler**: Scrapy-based discovery engine using spaCy NLP for semantic ranking of jobs against your CV content.
- **📄 CV Lifecycle Management**:
  - **Upload & Parse**: Centralized database storage for multiple professional versions.
  - **PDF Generator**: CLI tool built with `fpdf2` to render tailored CVs and cover letters from parsed data.
- **🧬 Monorepo Excellence**: Powered by **Nx** for sub-millisecond build caching and consistent task orchestration.

---

## 🏗️ Repository Structure

| Path | Purpose | Type |
| :--- | :--- | :--- |
| `apps/extension` | Browser extension for DOM-level form automation. | React/Vite |
| `apps/dashboard` | Central management and analytics web app. | Next.js 15 |
| `apps/api` | Principal FastAPI server for data persistence. | Python 3.12 |
| `apps/gmail-api` | Background worker for email job polling. | Python |
| `apps/scraper` | NLP-enhanced job crawling spiders. | Python/Scrapy |
| `apps/cv-pdf-generator` | CLI tool for rendering ATS-friendly PDF CVs. | Python |
| `libs/shared-ui` | Shared React components (JobCards, etc.). | TypeScript/React |
| `libs/shared-types` | Unified interface definitions for all apps. | TypeScript |

---

## 🛠️ Tech Stack

### Frontend
- **Frameworks**: Next.js (Dashboard), React (Extension).
- **Styling**: Tailwind CSS + Shadcn UI patterns.
- **State Management**: React Hooks + URL-synced tab logic.

### Backend & AI
- **API**: FastAPI + SQLAlchemy (PostgreSQL).
- **AI Providers**: Gemini 2.0 (default), OpenAI, Groq, Hugging Face.
- **Discovery**: Scrapy + Redis + spaCy.

### Infrastructure
- **Monorepo**: Nx.
- **Containerization**: Docker & Docker Compose.
- **Orchestration**: Kubernetes (K8s) for production-grade scaling.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: 18.x+
- **Python**: 3.12+
- **Docker**: For full-stack execution.

### 2. Installation
```bash
git clone git@github.com:peroperje/cata.git
cd cata
npm install
npm run api:install  # Setup Python environment
```

### 3. Execution Commands
| Service | Command | Target |
| :--- | :--- | :--- |
| **Full Stack** | `docker compose up --build` | Docker |
| **Dashboard** | `npx nx run dashboard:dev` | `localhost:3000` |
| **API** | `npx nx run api:serve` | `localhost:8000` |
| **Extension** | `npx nx run extension:dev` | Browser Extension |
| **CV Generator** | `npx nx run cv-pdf-generator:generate` | CLI |

---

## ⚙️ Configuration

### Secrets & Environment
Copy `.env.example` to `.env` and configure:
```bash
GEMINI_API_KEY=your_key_here
POSTGRES_PASSWORD=your_secure_password
GMAIL_CLIENT_ID=your_id.apps.googleusercontent.com
```

### Gmail API Setup
1. Enable Gmail API in Google Cloud Console.
2. Download `credentials.json` to `apps/gmail-api/`.
3. The first run will trigger a local OAuth2 authentication flow.

---

## 📁 Shared Resources

Consistency is maintained via `libs/`:
- **Centralized Types**: Edit `libs/shared-types/src/index.ts` to update data models across all apps.
- **Shared Components**: Reusable UI elements like `JobCard` reside in `libs/shared-ui`.

---

## 🚢 Deployment

### Local Orchestration
Use the optimized Docker configuration for development:
```bash
npm run docker:up
```

### Kubernetes (Production)
CATA is production-ready with K8s manifests in `k8s/`:
- `k8s/postgres.yaml`: Persistent storage volume and database service.
- `k8s/api.yaml`: FastAPI deployment with horizontal scaling.
- `k8s/dashboard.yaml`: High-availability Next.js service.

---

## 🧪 Testing

We value stability. Run the full suite with Nx:
```bash
# Unit tests
npx nx run-many -t test

# End-to-End (Dashboard)
npx nx run dashboard-e2e:e2e
```

---

## 📄 License

Private project for personal use. Built by **[Petar Borovcanin](https://github.com/peroperje)**.
