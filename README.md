# CATA - AI Job Auto-Filler (Nx Monorepo)

A modern Chrome Extension (Manifest V3) with a Python FastAPI backend, built with Nx monorepo architecture. Uses Gemini AI to automatically fill job application forms using data extracted from your PDF CV.

## 🏗️ Project Structure

```text
cata-chrome-extension/
├── apps/
│   ├── extension/         # React Chrome Extension (Vite + TypeScript)
│   │   ├── src/          # Extension source code
│   │   ├── icons/        # Extension icons
│   │   └── project.json  # Nx configuration
│   └── api/              # Python FastAPI Backend
│       ├── app/          # API source code
│       ├── requirements.txt
│       └── project.json  # Nx configuration
├── docker/
│   └── api/              # Docker configuration for API
├── docker-compose.yml    # PostgreSQL + API orchestration
├── nx.json              # Nx workspace configuration
└── package.json         # Workspace dependencies
```

## ✨ Features

- **Local PDF Parsing**: Extracts text from your CV locally using `pdfjs-dist`
- **AI-Powered Mapping**: Uses Google Gemini Pro to map CV content to form fields
- **Framework Bypassing**: Specialized value setter for React/Angular/Vue sites
- **Premium UI**: Modern interface with React and Lucide icons
- **FastAPI Backend**: High-performance REST API with PostgreSQL
- **Nx Monorepo**: Unified workspace for extension and backend

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.11+
- Docker and Docker Compose (for backend)

### Installation

1. **Clone the repository**:
   ```bash
   cd /home/petar/Projects/cata-chrome-extension
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Install Python dependencies** (for local API development):
   ```bash
   npm run api:install
   ```

4. **Set up environment variables**:
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
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select `dist/apps/extension`

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
docker-compose up --build
```

**Stop Docker services**:
```bash
npm run docker:down
# or
docker-compose down
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
- **PDF**: PDF.js
- **AI**: Google Generative AI (Gemini)
- **UI**: Lucide React icons

### Backend
- **Framework**: FastAPI
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **Server**: Uvicorn
- **Containerization**: Docker

### Monorepo
- **Build System**: Nx
- **Package Manager**: npm/yarn

## 📝 Usage

1. **Get API Key**: Obtain a Gemini API key from [Google AI Studio](https://aistudio.google.com/)
2. **Configure Extension**: Enter your API key in the extension popup
3. **Upload CV**: Upload your CV in PDF format
4. **Auto-Fill**: Navigate to a job application page and click "Auto-Fill Page"

## 🐳 Docker Services

The `docker-compose.yml` includes:
- **PostgreSQL**: Database on port 5432
- **FastAPI**: Backend API on port 8000

## 🤝 Contributing

This is a monorepo managed by Nx. When adding new features:
1. Use `npx nx g` to generate new components/modules
2. Follow the existing project structure
3. Update project.json for new build targets
4. Test both extension and API integration

## 📄 License

Private project for personal use.
