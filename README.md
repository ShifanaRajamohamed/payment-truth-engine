# Payment Truth AI

A deterministic payment incident investigation and safe state repair platform.

## Project Overview

The application consists of a Node.js Express API and an Angular frontend that together collect evidence from payment gateway, bank, merchant backend, and webhook sources, verify deterministic rules, and optionally perform safe repairs.

## Structure

```
apps/
  api/        # Express backend
  web/        # Angular frontend
packages/
  shared-types/   # TypeScript contracts shared between API and UI
  language/       # Language translations
  risk-engine/    # Risk scoring and rule definitions
  voice/          # Voice integration abstractions
  ai-agent/       # AI orchestration (advisory only)
```

## Technology Stack

- Angular
- Node.js & Express
- TypeScript
- PostgreSQL (for persistence)
- Docker (optional containerisation)

## Prerequisites

- Node.js 18+ and npm 9+
- Docker (if containerised deployment is desired)

## Installation

```bash
# Install root dependencies
npm install
# Build shared packages
npm run build:packages
# Build the API
npm run build:api
# Build the Angular app
npm run build:web
```

## Running Locally

```bash
# Start the API server
npm run start:api
# Serve the frontend (after build)
npx serve dist/deepaudit-web
```

The frontend will be available at http://localhost:5000 and communicates with the API at http://localhost:3000.

## Contributing

Please ensure all backend tests pass before submitting changes:

```bash
npm run test:backend
```

All new code should follow existing linting and formatting conventions.
