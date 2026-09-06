# Payment Truth AI

## Dhwani — AI-Assisted Payment Incident Investigation and Deterministic Resolution

Payment Truth AI is an Angular and Node.js platform for investigating payment incidents across a bank, payment gateway, webhook pipeline, merchant backend, and merchant database.

When different systems report conflicting states for the same transaction, the platform reconstructs the available evidence, assists with incident diagnosis, and performs deterministic verification before any payment state repair is allowed.

The AI layer can explain incidents and recommend actions, but it cannot independently modify financial records.

## Project Structure

```text
apps/
  api/                 Express API, compiled to apps/api/dist
  web/                 Canonical Angular application

packages/
  shared-types/        Shared TypeScript contracts
  language/            Language registry and translations
  risk-engine/         Risk scoring rules
  voice/               Speech provider abstractions
  ai-agent/            AI orchestration and deterministic fallbacks

docs/                  API, architecture, and risk documentation
infrastructure/        Docker and database setup
```

The Angular workspace is configured in `angular.json` to build `apps/web`.

The root `src/` directory is retained for compatibility with the earlier dashboard implementation, but it is not the active Angular entry point.

## Technology Stack

* Angular
* Node.js
* Express.js
* TypeScript
* PostgreSQL
* Docker

## Requirements

* Node.js 18 or newer
* npm 9 or newer

## Installation

Install dependencies:

```bash
npm install
```

Copy the environment configuration:

```bash
cp .env.example .env
```

API keys are optional for local development because deterministic offline fallbacks are included.

## Build and Validate

Build all applications and packages:

```bash
npm run build:all
```

Run the test suite:

```bash
npm test -- --watch=false --browsers=ChromeHeadless
```

Run all validation checks:

```bash
npm run check
```

## Run Locally

Start the API:

```bash
npm run start:api
```

The API runs at:

```text
http://localhost:3000
```

Start the Angular application in a separate terminal:

```bash
npm run start:web
```

The frontend runs at:

```text
http://localhost:4200
```

The backend health endpoint is:

```text
GET http://localhost:3000/health
```

## Payment Truth Workflow

### 1. Collect Evidence

The platform collects and correlates payment evidence from multiple systems, including:

* Customer application
* Payment gateway
* Webhook pipeline
* Merchant backend
* Merchant database
* Banking records

### 2. Verify Deterministically

Before a payment state can be repaired, the system validates:

* Payment ID
* Exact transaction amount
* Gateway status
* Payment signature
* Idempotency records
* Duplicate payment indicators

### 3. Diagnose the Incident

The AI layer analyzes the available evidence and helps explain:

* Conflicting payment states
* Possible causes of failure
* Missing or delayed events
* Recommended investigation steps

AI output is advisory and does not authorize financial state changes.

### 4. Authorize and Repair

A payment state can only be repaired when:

* Deterministic verification succeeds
* A valid verification token is present
* The operator is authorized

### 5. Record the Outcome

Every approved state change is recorded in the audit log to provide traceability for investigation and review.

## AI and Deterministic Verification

Payment Truth AI separates AI-assisted reasoning from financial state modification.

```text
Evidence Collection
        |
        v
AI-Assisted Investigation
        |
        v
Deterministic Verification
        |
        +-- Verification Failed --> Repair Blocked
        |
        +-- Verification Passed
                    |
                    v
            Authorized Operator
                    |
                    v
              State Repair
                    |
                    v
                Audit Log
```

The core principle is:

> AI can explain and recommend. Deterministic verification establishes whether a repair is allowed.

## Demo Scenarios

The API exposes deterministic incident simulations through:

```text
POST /api/incidents/simulate/:scenarioId
```

The available scenarios include:

* Webhook failure
* Duplicate payment
* Phantom credit
* Refund mismatch
* Delayed webhook delivery

For the complete API contract, see:

```text
docs/api-specification.md
```

## Dhwani

Dhwani is the voice and language interaction layer of the platform.

The `packages/voice` module provides abstractions for speech providers, while the `packages/language` module manages language configuration and translations.

This separation allows voice and language capabilities to evolve independently from the core payment investigation and verification workflow.

## Security Notes

Never commit `.env` files or real credentials.

Configure sensitive values through local environment variables or a deployment secret manager:

```text
JWT_SECRET
DEMO_PASSWORD
POSTGRES_PASSWORD
```

The mock data store is intended for local development and demonstrations. Production deployments should use persistent, access-controlled infrastructure with appropriate authentication, authorization, secret management, and audit controls.

## Documentation

Additional technical documentation is available in the `docs/` directory and covers:

* API specifications
* System architecture
* Risk evaluation
* Payment verification logic
* Incident investigation workflows

## License

This project is intended for demonstration and evaluation purposes unless otherwise specified.

---

Payment Truth AI

Dhwani — AI-assisted investigation, deterministic verification, and controlled payment state resolution.
