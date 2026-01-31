# CATA - AI Job Auto-Filler (Nx Monorepo)

A modern Chrome Extension (Manifest V3) with a Python FastAPI backend, built with Nx monorepo architecture. Uses Gemini AI to automatically fill job application forms using data extracted from your PDF CV, now with persistent database storage.

## 🏗️ Project Structure

```text
cata-chrome-extension/
├── apps/
│   ├── extension/         # React Chrome Extension (Vite + TypeScript)
│   │   ├── src/          # Extension source code
│   │   └── project.json  # Nx configuration
│   ├── dashboard/         # Next.js Management Dashboard (React + TypeScript)
│   │   ├── app/          # Next.js App Router source code
│   │   └── project.json  # Nx configuration
│   ├── api/              # Python FastAPI Backend
│   │   ├── app/          # API source code
│   │   └── project.json  # Nx configuration
│   └── scraper/          # Scrapy CrawlSpider Service
│       ├── crawler/      # Scraper logic (spiders, pipelines, NLP)
│       ├── Dockerfile
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

- **Multi-AI Provider Support**: Choose between Google Gemini (Pro, Flash, Flash Lite), OpenAI, and Hugging Face for form filling logic via a unified AI Factory.
- **Advanced AI Model Management**: Full CRUD operations for AI models directly from the UI.
  - **Dynamic Model Addition**: Add any provider/model combination (e.g., OpenAI/gpt-4o).
  - **Per-Model API Keys**: Securely store and update API keys for each model independently.
- **Advanced CV Management**: Upload, extract, and store multiple CVs in PostgreSQL. Switch between different CVs for different applications seamlessly.
- **Modular Extension UI**: Reorganized into four focused sections:
  - **CV Section**: Manage and select your professional profiles.
  - **Autofill Section**: Intelligent form filling with framework-specific value setters (React/Angular/Vue).
    - **Granular Control**: Provide custom **AI Instructions** for specific form-filling behavior.
  - **Scraper Section**: Discover new job opportunities matching your profile with **pagination** and **real-time results**.
  - **Jobs Tracker Dashboard**: A dedicated **Next.js web application** for managing your job search pipeline.
    - **Job-Application Linking**: Link discovered jobs directly to your application tracking entries.
    - **Tabbed Navigation**: Effortlessly filter jobs by status via a URL-synced tab system.
    - **Favorite & Archive**: Mark key opportunities as "Used" and archive irrelevant ones.
    - **Bulk Management**: Delete scraped jobs by date or in bulk to keep your workspace clean.
- **Intelligent Scraper Service**: A Scrapy CrawlSpider service that uses **NLP (Cosine Similarity)** to rank jobs against your CV, marking low-match entries as irrelevant automatically.
- **Real-time Status Updates**: Improved feedback with a status banner and dynamic UI updates across both extension and dashboard.
- **Reusable Component Suite**: Shared UI library including **custom modals**, **loaders**, **paginators**, and **job cards** used across the monorepo.
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

### Management Dashboard

**Development mode**:

```bash
npm run dashboard:dev
# or
npx nx serve dashboard
```

Dashboard will be available at `http://localhost:3000`

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

### Version Management

CATA uses a synchronized versioning system across the monorepo.

**Change version**:

```bash
npm run change-version <new-version>
# Example: npm run change-version 1.0.3
```

This command will:

1. Update `package.json` version.
2. Run `scripts/sync-versions.cjs` to synchronize the version with the Chrome Extension manifest and other sub-projects.
3. Show the current version in both the Extension popup and the Dashboard footer.

## 🔧 Tech Stack

### Frontend & Dashboard

- **Extension**: Vite + TypeScript + React
- **Dashboard**: Next.js 16 (App Router) + Tailwind CSS
- **UI Components**: Lucide React icons + Custom Modal System + CSS Variables for theming.
- **Architecture**: Modular layout with dedicated components for **CV Management**, **Autofill**, and **Job Scraping**.
- **State**: Custom hooks and Chrome Local/Session Storage + URL-based state for dashboard.

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

1.  **Configure AI Models**: Open the extension popup, go to the **Autofill Section**, and add your preferred models (Gemini, OpenAI, or Hugging Face).
2.  **Set API Keys**: Select a model and enter its corresponding API key. Keys are stored securely in local storage.
3.  **CV Section**: Upload your CV (PDF). It will be parsed and stored in the PostgreSQL database.
4.  **CV Selection**: Choose which CV to use for the current application session.
5.  **Autofill Section**:
    - Select your preferred **AI Model**.
    - (Optional) Enter specific **AI Instructions** for the current page.
    - Navigate to a job application page and click **"Auto-Fill Page"**.
6.  **Scraper Section**:
    - Enter a job search URL or select from predefined targets.
    - Click **"Start Scraping"** to discover jobs matching your profile.
    - View discovered jobs and their **Similarity Scores** calculated against your selected CV.
    - Filter results by "Used", "Irrelevant", or search by title.
7.  **Jobs Tracker Section**:
    - Click **"Add to Tracker"** on any job page to automatically capture job details.
    - **Link Applications**: In the Scraped Jobs dashboard, connect discovered jobs to entries in your application tracker.
    - **Next.js Dashboard**: Visit the dashboard for a comprehensive view of your pipeline.
    - **Advanced Editing**: Manually adjust job titles, companies, or add detailed notes.
    - **Bulk Actions**: Clean up old scraped results using the delete by date feature.
    - **Filtering**: Use the top tabs to filter your applications by their current stage.
    - **Clickable Links**: Direct access back to the original application page.

## 💡 MCP Integration (Experimental)

CATA now supports the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/). This allows you to connect your favorite AI clients (like Claude Desktop or Cursor) directly to your job search data.

### Available Tools

- `get_user_cvs`: Lists all your uploaded CVs.
- `get_cv_content`: Fetches the full text content of a specific CV.
- `search_scraped_jobs`: Semantic search (keyword-based) over your scraped job listings.
- `get_scraped_job_details`: Fetches the full content and metadata of a specific scraped job.
- `get_latest_scraped_jobs`: Retrieves the most recently discovered job opportunities.
- `list_tracked_jobs`: Lists all job applications in your tracker, with optional status filtering.
- `update_job_status`: Updates statuses (e.g., "Interview", "Applied") and notes for tracked jobs.
- `add_to_tracker`: Remote command to add a new job application to your tracker.

### How to Run

You can run the MCP server locally using Nx:

```bash
npx nx run api:mcp
```

### Configuration

To use with **Claude Desktop**, add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "cata": {
      "command": "npx",
      "args": ["nx", "run", "api:mcp"]
    }
  }
}
```

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
