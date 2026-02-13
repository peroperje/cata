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
│   ├── gmail-api/        # Gmail Integration Service
│   │   ├── app/          # Polling and extraction logic
│   │   └── Dockerfile    # Background worker configuration
│   └── scraper/          # Scrapy CrawlSpider Service
│       ├── crawler/      # Scraper logic (spiders, pipelines, NLP)
│       ├── Dockerfile
│       └── requirements.txt
├── docker/
│   └── api/              # Docker configuration for API
├── k8s/                  # Kubernetes manifests
│   |── api.yaml
│   └── postgres.yaml
├── docker-compose.yml    # Full stack orchestration (PostgreSQL + API + Gmail + Scraper)
├── nx.json              # Nx workspace configuration
└── package.json         # Workspace dependencies
```

## ✨ Features

- **Multi-AI Provider Support**: Choose between Google Gemini (Pro, Flash, Flash Lite), OpenAI, and Hugging Face for form filling logic via a unified AI Factory.
- **Advanced AI Model Management**: Full CRUD operations for AI models directly from the UI.
- **Advanced CV Management**: Upload, extract, and store multiple CVs in PostgreSQL. Switch between different CVs for different applications seamlessly.
- **Gmail Postings Extraction**:
  - Automatically extracts job postings from Gmail alerts (LinkedIn, Indeed, etc.).
  - Customizable **Sender Filters** to target specific job sources.
  - Periodic background polling with configurable sync intervals.
  - Secure credential management via Google OAuth2.
- **Modular Extension UI**: Reorganized into focused sections:
  - **CV Section**: Manage and select your professional profiles.
  - **Autofill Section**: Intelligent form filling with framework-specific value setters.
  - **Scraper Section**: Discover new job opportunities matching your profile with real-time results.
- **Jobs Tracker Dashboard**: A dedicated Next.js application for pipeline management.
  - **Scraped Jobs View**: Filter jobs by "Used" or "Irrelevant", search by title, and link to applications.
  - **Gmail Jobs View**: Specialized interface for jobs extracted from emails.
    - **Tabbed Filtering**: "New", "Used", and "Irrelevant" states for focused workflow.
    - **Advanced Search**: Instant global search across job titles, companies, and URLs.
    - **Collapsible Filters**: Manage email sender filters through a clean, collapsible interface.
    - **Full Pagination**: High-performance scrolling and navigation for large job sets.
  - **Job-Application Linking**: Connect discovered jobs to your application tracking entries.
- **Intelligent Scraper Service**: Scrapy CrawlSpider using NLP (Cosine Similarity) to rank jobs against your CV.
- **Nx Monorepo**: Scalable workspace architecture for all services and applications.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.11+
- Docker and Docker Compose (recommended)
- Google Cloud Console Project (for Gmail API access)

### Installation

1.  **Clone the repository**:

    ```bash
    git clone git@github.com:peroperje/cata.git
    ```

2.  **Install dependencies**:

    ```bash
    npm install
    ```

3.  **Install Python dependencies**:

    ```bash
    npm run api:install
    ```

4.  **Set up environment variables**:
    ```bash
    cp .env.example .env
    # Edit .env with your configuration
    ```

### Gmail API Setup

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Gmail API**.
3. Create OAuth 2.0 Credentials (Desktop Application).
4. Download the `credentials.json` and place it in `apps/gmail-api/`.
5. On the first run, the service will prompt for authentication.

## 🛠️ Development

### Chrome Extension

```bash
npm run dev # Development mode with hot reload
npm run build # Build for production
```

### Management Dashboard

```bash
npm run dashboard:dev
```

Dashboard available at `http://localhost:3000`

### Python API

```bash
npm run api:serve # Run locally
```

API available at `http://localhost:8000`

### Gmail API Service

```bash
# Run in background via Docker
docker compose up gmail-api --build
```

### Full Stack (Recommended)

```bash
npm run docker:up
# Or
docker compose up --build
```

## 🔧 Tech Stack

### Frontend & Dashboard

- **Extension**: Vite + TypeScript + React
- **Dashboard**: Next.js 16 (App Router) + Tailwind CSS
- **UI Components**: Lucide React + Shared Component Library (`shared-ui`)
- **State**: React Hooks + URL-synced tab state

### Backend & Services

- **Framework**: FastAPI (API), apscheduler (Gmail sync)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **AI Integration**: Gemini, OpenAI, Hugging Face via unified Factory
- **Gmail Service**: Google API Client with background polling service
- **Scraper**: Scrapy + Scrapy-Redis + NLP (spaCy)

### Infrastructure

- **Monorepo**: Nx
- **Orchestration**: Docker Compose
- **Deployment**: Kubernetes (K8s)

## 📝 Usage

1.  **AI Setup**: Configure models and keys in the extension popup.
2.  **CV Upload**: PDF parsing moves your data into the central DB.
3.  **Gmail Sync**:
    - Go to **Gmail Jobs** in the dashboard.
    - Set up **Sender Filters** (e.g., `jobalerts-noreply@linkedin.com`).
    - Configure sync frequency in **Sync Settings**.
    - The Gmail worker will periodically extract jobs into your dashboard.
4.  **Job Search**:
    - Use the **Scraper** for web-based discovery.
    - Use **Gmail Jobs** for email-based discovery.
    - Mark interesting jobs as "Used" to link them to applications.
5.  **Tracker**: Manage the lifecycle of your applications from "Applied" to "Interview" and "Offer".

## 💡 MCP Integration (Experimental)

Connect AI clients like Claude or Cursor to your job data using the Model Context Protocol.

```bash
npx nx run api:mcp
```

## 📄 License

Private project for personal use.
