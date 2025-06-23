# Repeatly Scripts

This directory contains build and deployment scripts for the Repeatly project.

## Scripts Available

### OpenAPI Generation

Generates OpenAPI specifications for Google Cloud API Gateway deployment.

```bash
# From root directory
npm run generate:openapi

# Or from scripts directory
cd scripts
npm run generate:openapi
```

#### Output

- Generates `open-api.json` in the root directory
- Used by GitHub Actions for automated API Gateway deployment

#### Dependencies

The scripts directory has minimal dependencies:

- `typescript` - For TypeScript compilation
- `ts-node` - For running TypeScript files directly
- `@types/node` - Node.js type definitions
- `dotenv` - Environment variable loading

#### Environment Variables

The OpenAPI generation uses these environment variables:

- `API_GATEWAY_HOST` - The API Gateway hostname
- `API_GATEWAY_BACKEND_ADDRESS` - Backend service URL for x-google-backend routing

#### Architecture

The OpenAPI generation is completely separated from the main API package to avoid:

- Installing heavy API dependencies for simple script execution
- Complex dependency chains (Express, Firebase Auth, etc.)
- Slower CI/CD pipelines

Static route definitions are used instead of importing Express routers to maintain this separation.
