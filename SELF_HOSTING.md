# Self-Hosting Repeatly

This guide explains how to self-host Repeatly in your own infrastructure.

## 🚀 Quick Start

1. **Clone the repository**
2. **Set up environment variables** (see below)
3. **Configure Google Cloud services** (optional for API Gateway)
4. **Run with Docker Compose** or deploy manually

## 📋 Environment Variables

Create a `.env` file in the root directory with these variables:

### Required Variables

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/repeatly?schema=public"

# Google Cloud Configuration (base64 encoded service account JSON)
GOOGLE_APPLICATION_CREDENTIALS="base64_encoded_service_account_json_here"
```

### API Gateway Variables (Optional)

If using Google Cloud API Gateway for API key management:

```env
# API Gateway Configuration
API_GATEWAY_HOST="your-api-gateway-host.apigateway.project-id.cloud.goog"

# Backend Service URL (for API Gateway routing)
BACKEND_SERVICE_URL="https://your-backend-service.run.app"
```

For local development without API Gateway:

```env
API_GATEWAY_HOST="localhost:3003"
BACKEND_SERVICE_URL="http://localhost:3003"
```

### Optional Variables

```env
# Server Configuration
PORT=3003
NODE_ENV=production

# Redis Configuration (for Bull MQ - scheduler/worker)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Firebase Configuration (if different from service account)
FIREBASE_PROJECT_ID="your-firebase-project-id"
```

## 🏗️ Deployment Options

### Option 1: Docker Compose (Recommended)

```yaml
# docker-compose.yml
version: "3.8"
services:
  api:
    build: ./packages/api
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - GOOGLE_APPLICATION_CREDENTIALS=${GOOGLE_APPLICATION_CREDENTIALS}
      - API_GATEWAY_HOST=${API_GATEWAY_HOST}
    ports:
      - "3003:3003"

  frontend:
    build: ./packages/frontend
    ports:
      - "3000:3000"
```

### Option 2: Google Cloud Run

Deploy each service separately to Cloud Run with the environment variables.

### Option 3: Manual Deployment

1. Build each package: `npm run build`
2. Deploy to your preferred hosting platform
3. Set environment variables in your hosting platform

## 🔧 Configuration Options

### Without API Gateway

For simple deployments without Google Cloud API Gateway:

- Set `API_GATEWAY_HOST=localhost:3003`
- API keys will be validated by your backend directly
- Less secure but simpler setup

### With API Gateway

For production deployments with Google Cloud API Gateway:

- Follow the [GCP_SETUP.md](packages/api/GCP_SETUP.md) guide
- Set proper `API_GATEWAY_HOST` from your gateway
- API keys validated by Google Cloud before reaching your backend

## 🔐 Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **Database**: Use strong passwords and SSL connections
3. **HTTPS**: Always use HTTPS in production
4. **API Keys**: Rotate service account keys regularly
5. **Firewall**: Restrict database and Redis access

## 📚 Architecture

```
Frontend (React) → API Gateway (Optional) → Backend (Express) → Database (PostgreSQL)
                                         ↓
                                    Scheduler → Worker → Redis
```

## 🆘 Troubleshooting

### Common Issues

1. **403 PERMISSION_DENIED**: Check API Gateway configuration
2. **Database connection**: Verify DATABASE_URL and network access
3. **Service account**: Ensure proper permissions and base64 encoding

### Debug Mode

Set `NODE_ENV=development` and check logs for detailed error messages.

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and contribution guidelines.
