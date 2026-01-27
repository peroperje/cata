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

- **CV Management**: Upload, extract, and store multiple CVs in PostgreSQL for easy access.
- **Backend-Driven AI**: All AI processing is handled securely by the FastAPI backend using `google-genai`.
- **Framework Bypassing**: Specialized value setter for React/Angular/Vue sites.
- **Automated Job Discovery**: A production-ready Scrapy CrawlSpider microservice that discovers jobs matching your CV using NLP similarity.
- **Premium UI**: Modern interface with React and Lucide icons.
- **FastAPI Backend**: High-performance REST API with PostgreSQL.
- **Nx Monorepo**: Unified workspace for extension and backend.

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
docker-compose down
```

### Job Scraper (Crawler)

**Run with the main Docker-Compose** (alongside API and Postgres):
```bash
docker compose up --build
```

**Run independently with Docker-Compose**:
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
- **Build**: @crxjs/vite-plugin
- **UI**: Lucide React icons
- **State**: React Hooks + Chrome Storage

### Backend
- **Framework**: FastAPI
- **Database**: PostgreSQL
- **AI**: Google Gen AI SDK (`google-genai`)
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

1.  **Configure Extension**: Enter your API key in the extension popup (saved securely in backend).
2.  **Upload CV**: Upload your CV (PDF) via the extension. It will be parsed and stored in the database.
3.  **Select CV**: Choose which uploaded CV to use for the current session.
4.  **Auto-Fill**: Navigate to a job application page and click "Auto-Fill Page".

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
