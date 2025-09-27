# Repeatly - Self-Hosted Cron-as-a-Service

> Schedule and run HTTP jobs on your own infra. TypeScript, PostgreSQL, Redis, Docker.

---

## Architecture

```mermaid
graph TB
    %% User Layer
    USER["👤 User"] --> FRONTEND["🎨 React Frontend<br/>Job Management & Monitoring"]

    %% Authentication
    FRONTEND --> AUTH["🔐 Firebase Auth<br/>JWT Tokens"]

    %% Core Services
    FRONTEND --> API["⚡ API Server<br/>Express.js<br/>• Job CRUD<br/>• Authentication"]

    API --> DB["📊 PostgreSQL<br/>• Jobs & Users<br/>• Execution History"]
    API --> REDIS["🔴 Redis<br/>Job Queue"]

    %% Background Services
    SCHEDULER["🕐 Scheduler<br/>Finds due jobs<br/>every 60s"] --> REDIS
    SCHEDULER --> DB

    REDIS --> WORKER["🚀 Worker<br/>Executes HTTP requests"]
    WORKER --> TARGET["🌍 Target APIs<br/>HTTP endpoints"]
    WORKER --> DB

    %% Styling
    classDef userLayer fill:#e1f5fe
    classDef coreService fill:#f3e5f5
    classDef storage fill:#fff3e0
    classDef external fill:#e8f5e8

    class USER,FRONTEND userLayer
    class API,SCHEDULER,WORKER,AUTH coreService
    class DB,REDIS storage
    class TARGET external
```

---

## Project Structure

```
repeatly/
├── packages/
│   ├── api/         # Express.js API server
│   ├── scheduler/   # Partition-aware scheduler
│   ├── worker/      # Job execution worker
│   ├── database/    # Prisma schema, migrations, DB utils
│   └── frontend/    # React dashboard
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose

### 1. Clone & Install

```bash
# Clone
git clone https://github.com/your-org/repeatly.git
cd repeatly

# Install deps
npm install
```

### 2. Local Dev (Manual)

```bash
# Start DB/Redis
npm run infra

# Run DB migrations
npm run db:migrate:deploy

# Start services (in separate terminals)
npm run dev:api
npm run dev:scheduler
npm run dev:worker
npm run dev:frontend
```

### 3. Docker Compose (Recommended)

Before running Docker Compose, copy `.env.example` at the project root to `.env` and fill in the required values:

```bash
cp .env.example .env
# Edit .env and set your secrets/credentials
```

Then start all services:

```bash
docker-compose up -d
```

---

## Environment Variables

Copy `.env.example` from `packages/database` and fill in values as needed:

```
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/repeatly
REDIS_URL=redis://default:devpassword123@redis:6379
```

### API Service (`packages/api/.env`)

| Variable                       | Description                                              |
| ------------------------------ | -------------------------------------------------------- |
| GOOGLE_APPLICATION_CREDENTIALS | Base64-encoded Google service account credentials (JSON) |
| PORT                           | Port for the API server (default: 3000)                  |
| NODE_ENV                       | Node environment (e.g., development, production)         |
| # API_GATEWAY_HOST             | (Optional) API Gateway host for API key management       |

- `GOOGLE_APPLICATION_CREDENTIALS` should be a base64-encoded JSON key for a Google Cloud service account. This is used for authentication and integration with Google Cloud services.
- `PORT` and `NODE_ENV` are standard Node.js environment variables.
- `API_GATEWAY_HOST` is optional and only needed if using API Gateway for key management.

### Frontend (`packages/frontend/.env`)

| Variable                  | Description                                        |
| ------------------------- | -------------------------------------------------- |
| VITE_FIREBASE_API_KEY     | Firebase project API key                           |
| VITE_FIREBASE_AUTH_DOMAIN | Firebase Auth domain (e.g., xxx.firebaseapp.com)   |
| VITE_FIREBASE_PROJECT_ID  | Firebase project ID                                |
| VITE_API_BASE_URL         | Base URL for the API (e.g., http://localhost:3000) |

- All variables are required for the frontend to connect to Firebase Auth and the backend API.
- `VITE_API_BASE_URL` should point to your running API instance.

## What's Next

- **API-based Cron Management (API Gateway, WIP):**
  - Manage the full lifecycle of cron jobs including creation, updates, deletion, and viewing execution history via REST APIs through the API Gateway (coming soon).
- **UI/UX Improvements:**
  - Enhanced dashboard maybe?
- **Integrations:**
  - Support for more notification channels (Slack, email, webhooks).
- **Observability:**
  - Improved metrics, logs, and alerting for job executions.
- **Self-service Onboarding:**
  - Better documentation, onboarding flows, and example jobs.
- **Infra:**
  - Switch to a self-hosted Redis database for production reliability.
  - Manage all services in Kubernetes for advanced orchestration and scaling.
- **Security Enhancements:**
  - Audit logs, and SSO options.
- **Community Contributions:**
  - Open to PRs for new features, bug fixes, and documentation improvements.

---

## Deployment & CI/CD

- **Backend (API, Scheduler, Worker):**

  - Deployed to Google Cloud Run using Docker images.
  - Automated via GitHub Actions workflow: `.github/workflows/deploy-all-services.yml`.
  - Handles build, push, and deploy for all backend services, including database migrations.

- **Frontend:**

  - Deployed to Firebase Hosting.
  - Automated via GitHub Actions workflow: `.github/workflows/deploy-frontend.yml`.
  - Handles build and deploy of the frontend.

- **How it works:**
  - On workflow dispatch, the CI builds Docker images, pushes to Google Artifact Registry, and deploys to Cloud Run (backend) or Firebase Hosting (frontend).
  - Secrets and environment variables are managed via GitHub and Google Secret Manager.

See the respective workflow files for more details and customization options.
