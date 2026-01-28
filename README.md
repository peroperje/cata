# CATA - AI Job Auto-Filler (Nx Monorepo)

A modern Chrome Extension (Manifest V3) with a Python FastAPI backend, built with Nx monorepo architecture. Uses Gemini AI to automatically fill job application forms using data extracted from your PDF CV, now with persistent database storage.

## 🏗️ Project Structure

```text
cata-chrome-extension/
├── apps/
│   ├── extension/         # React Chrome Extension (Vite + TypeScript)
│   │   ├── src/          # Extension source code
│   │   ├── icons/        # Extension icons
│   │   └── project.json  # Nx configuration
│   ├── api/              # Python FastAPI Backend
│   │   ├── app/          # API source code
│   │   ├── requirements.txt
│   │   └── project.json  # Nx configuration
│   └── scraper/          # Scrapy CrawlSpider Service
│       ├── crawler/      # Scraper logic (spiders, pipelines, NLP)
│       ├── Dockerfile
│       ├── docker-compose.yml
│       └── requirements.txt
├── docker/
│   └── api/              # Docker configuration for API
├── k8s/                  # Kubernetes manifests
│   ├── api.yaml
│   └── postgres.yaml
├── docker-compose.yml    # PostgreSQL + API orchestration
├── nx.json              # Nx workspace configuration
└── package.json         # Workspace dependencies
```

## ✨ Features

- **Multi-AI Provider Support**: Choose between Google Gemini (Pro, Flash, Flash Lite) and Hugging Face (Llama 3) for form filling logic via a unified AI Factory.
- **Advanced CV Management**: Upload, extract, and store multiple CVs in PostgreSQL. Switch between different CVs for different applications seamlessly.
- **Modular Extension UI**: Reorganized into four focused sections:
  - **CV Section**: Manage and select your professional profiles.
  - **Autofill Section**: Intelligent form filling with framework-specific value setters (React/Angular/Vue).
  - **Scraper Section**: Discover new job opportunities matching your profile.
  - **Jobs Tracker Section**: Personal CRM for job applications with automatic metadata extraction (title, company, URL) and status tracking.
- **Production-Ready Scraper**: A Scrapy CrawlSpider service that uses NLP similarity to find jobs, now with a scrollable results UI in the extension.
- **Real-time Status Updates**: Improved feedback with a status banner in the extension UI.
- **Nx Monorepo**: Scalable workspace architecture for extension, API, and scraper.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.11+
- Docker and Docker Compose (recommended)
- Kubernetes (optional, for cluster deployment)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone git@github.com:peroperje/cata.git
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Install Python dependencies** (for local API development):
    ```bash
    npm run api:install
    ```

4.  **Set up environment variables**:
    ```bash
    cp .env.example .env
    # Edit .env with your configuration
    ```

## 🛠️ Development

### Chrome Extension

**Development mode** (with hot reload):
```bash
npm run dev
# or
npx nx serve extension
```

**Build for production**:
```bash
npm run build
# or
npx nx build extension
```

**Load in Chrome**:
1.  Open Chrome and go to `chrome://extensions/`
2.  Enable "Developer mode"
3.  Click "Load unpacked" and select `/dist/apps/extension`

### Python API

**Run locally** (without Docker):
```bash
npm run api:serve
# or
npx nx serve api
```
API will be available at `http://localhost:8000`

**Run with Docker** (recommended):
```bash
npm run docker:up
# or
docker compose up --build
```

**Stop Docker services**:
```bash
npm run docker:down
# or
docker compose down
```

### Job Scraper (Crawler)

**Run with the main Docker Compose** (alongside API and Postgres):
```bash
docker compose up --build
```

**Run independently with Docker Compose**:
```bash
cd apps/scraper
docker compose up --build
```

**Manually trigger a crawl**:
```bash
docker compose run scraper scrapy crawl job_spider -a url=https://www.example.com/careers
```

### API Documentation

Once the API is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 📦 Nx Commands

**List all projects**:
```bash
npx nx show projects
```

**Run specific project**:
```bash
npx nx serve extension
npx nx serve api
```

**Build specific project**:
```bash
npx nx build extension
```

**Run all tests**:
```bash
npx nx run-many --target=test
```

## 🔧 Tech Stack

### Extension
- **Core**: Vite + TypeScript + React
- **Architecture**: Modular layout with dedicated components for **CV Management**, **Autofill**, and **Job Scraping**.
- **Build**: @crxjs/vite-plugin
- **UI**: Lucide React icons + CSS Variables for theming.
- **State**: Custom hooks and Chrome Local/Session Storage.

### Backend
- **Framework**: FastAPI
- **Database**: PostgreSQL
- **AI Providers**: 
  - **Google Gemini**: Support for 1.5 Pro, 2.0 Flash, and 2.0 Flash Lite for both **Form Filling** and **Metadata Extraction**.
  - **Hugging Face**: Support for Llama 3 and other Inference API models via a unified **AI Factory**.
- **ORM**: SQLAlchemy
- **Containerization**: Docker

### Scraper (Crawler)
- **Framework**: Scrapy
- **State Management**: Scrapy-Redis + Redis
- **NLP**: spaCy (`en_core_web_md`) + Scikit-learn
- **API Client**: Requests

### Infrastructure & DevOps
- **Monorepo**: Nx
- **Orchestration**: Docker Compose
- **Deployment**: Kubernetes (K8s)

## 📝 Usage

1.  **Configure API Keys**: Enter your Google Gemini or Hugging Face API keys in the extension popup.
2.  **CV Section**: Upload your CV (PDF). It will be parsed and stored in the PostgreSQL database.
3.  **CV Selection**: Choose which CV to use for the current application session.
4.  **Autofill Section**: 
    - Select your preferred **AI Model** (Gemini or Hugging Face).
    - Navigate to a job application page and click **"Auto-Fill Page"**.
5.  **Scraper Section**: 
    - Enter a job search URL.
    - Click **"Start Scraping"** to discover jobs matching your profile.
    - View discovered jobs and their similarity scores in the scrollable list.
6.  **Jobs Tracker Section**:
    - Click **"Add to Tracker"** on any job page to automatically capture job details.
    - AI-powered metadata extraction will attempt to pull the **Job Title** and **Company** from the page context.
    - Manage your application pipeline by updating statuses and adding personal notes.

## 🐳 Docker Services

The `docker-compose.yml` includes:
- **PostgreSQL**: Database on port 5432
- **FastAPI**: Backend API on port 8000
- **Redis**: Scraper task queue and state management on port 6379
- **Scraper**: Independent CrawlSpider service

## 🤝 Contributing

This is a monorepo managed by Nx. When adding new features:
1. Use `npx nx g` to generate new components/modules
2. Follow the existing project structure
3. Update project.json for new build targets
4. Test both extension and API integration

## 📄 License

Private project for personal use.
