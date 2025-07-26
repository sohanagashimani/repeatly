# Repeatly - Self-Hosted Cron-as-a-Service

> Schedule and run HTTP jobs on your own infra. TypeScript, PostgreSQL, Redis, Docker.

---

## Architecture

```mermaid
graph TB
    %% User and Frontend Layer
    subgraph "User Interface Layer"
        USER["👤 User<br/>Multi-timezone<br/>Dashboard"]
        FRONTEND["🎨 React Frontend<br/>• Job Management<br/>• Execution Tracking<br/>• Timezone Toggle<br/>• API Key Management<br/>Deployed: Firebase Hosting"]
    end

    %% Authentication & Gateway Layer
    subgraph "Authentication & Gateway"
        FIREBASE["🔐 Firebase Auth<br/>• JWT Tokens<br/>• User Management<br/>• OAuth Integration"]
        GATEWAY["🌐 Google Cloud<br/>API Gateway<br/>• Rate Limiting<br/>• JWT Validation<br/>• Request Routing<br/>• Cron Management (WIP)"]
    end

    %% Core Services Layer
    subgraph "Core Services - Cloud Run"
        API["⚡ Express API<br/>packages/api<br/>• Job CRUD<br/>• JobSchedulingService<br/>• Validation & Auth<br/>Deployed: Cloud Run"]
        SCHEDULER["🕐 Partition Scheduler<br/>packages/scheduler<br/>• 60s Polling Cycle<br/>• Partition Pruning<br/>• Atomic Job Claiming<br/>• Batch Processing<br/>Deployed: Cloud Run"]
        WORKER["🚀 Smart Worker<br/>packages/worker<br/>• HTTP Execution<br/>• Response Sanitization<br/>• JobExecutionService<br/>• Metadata Storage<br/>• Schedules Next Runs<br/>Deployed: Cloud Run"]
    end

    %% Database Layer with Partitioning
    subgraph "Database Layer - PostgreSQL"
        MAINDB["📊 Main Tables<br/>• Job<br/>• User<br/>• ApiKey"]

        subgraph "Hourly Partitioned Tables"
            PART00["⏰ scheduled_jobs_00<br/>Hour 0: 00:00-00:59"]
            PART01["⏰ scheduled_jobs_01<br/>Hour 1: 01:00-01:59"]
            PART02["⏰ scheduled_jobs_02<br/>Hour 2: 02:00-02:59"]
            PARTDOTS["⋮<br/>..."]
            PART23["⏰ scheduled_jobs_23<br/>Hour 23: 23:00-23:59"]
        end

        EXECDB["📈 Job Executions<br/>• Execution History<br/>• Performance Metrics<br/>• Sanitized Responses"]
    end

    %% External Systems
    subgraph "External Systems"
        EXT["🌍 Target APIs<br/>• HTTP/HTTPS endpoints<br/>• Webhooks<br/>• REST APIs"]
    end

    %% Data Flow
    USER --> FRONTEND
    FRONTEND --> GATEWAY
    GATEWAY --> API
    API --> MAINDB
    API --> SCHEDULER
    SCHEDULER --> PART00
    SCHEDULER --> PART01
    SCHEDULER --> PART02
    SCHEDULER --> PARTDOTS
    SCHEDULER --> PART23
    SCHEDULER --> WORKER
    WORKER --> EXECDB
    WORKER --> EXT
    EXT --> WORKER
    WORKER --> PART00
    WORKER --> PART01
    WORKER --> PART02
    WORKER --> PARTDOTS
    WORKER --> PART23
    WORKER -- "Schedules Next Runs, Updates Status" --> PART00
    WORKER -- "Schedules Next Runs, Updates Status" --> PART01
    WORKER -- "Schedules Next Runs, Updates Status" --> PART02
    WORKER -- "Schedules Next Runs, Updates Status" --> PARTDOTS
    WORKER -- "Schedules Next Runs, Updates Status" --> PART23
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
