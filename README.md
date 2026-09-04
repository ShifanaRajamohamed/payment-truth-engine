# DeepAudit AI 🛡️

> **AI-Assisted Corporate Payment Authorization & Fraud Prevention Platform**

DeepAudit AI is an enterprise-grade fintech platform designed for dual-control payment authorization, deterministic fraud signal scoring, multilingual voice interaction, and immutable cryptographic audit logging.

---

## 🏛️ Monorepo Architecture

```
deepaudit-ai/
│
├── apps/
│   ├── web/                         # Angular 19 Frontend (Signal-based, TailwindCSS)
│   └── api/                         # Node.js Express Backend Service
│
├── packages/
│   ├── shared-types/                # Shared TypeScript domain models & DTOs
│   ├── risk-engine/                 # Deterministic 6-signal fraud detection engine
│   ├── ai-agent/                    # Gemini AI integration and authorized tool layer
│   ├── voice/                       # Sarvam STT/TTS voice provider abstraction
│   └── language/                    # 22 Indian scheduled languages configuration
│
├── infrastructure/
│   ├── docker/                      # Dockerfile.api & Dockerfile.web
│   ├── db/init.sql                  # PostgreSQL normalized relational schema
│   └── docker-compose.yml           # Multi-container orchestration (DB + API + Web)
│
├── docs/
│   ├── architecture.md              # System sequence diagrams & topology
│   ├── api-specification.md         # Full REST API endpoints specification
│   └── risk-rules.md                # Deterministic scoring matrix & signal policies
│
├── .env.example                     # Environment template (API keys, ports, DB)
├── README.md
└── package.json                     # Monorepo workspaces configuration
```

---

## 🚀 Key Features

1. **Deterministic Fraud Risk Scoring**:
   - Scores every payment mathematically from 0 to 100 based on 6 independent signal categories:
     - Amount thresholds & single disbursement limits.
     - 24-hour statutory beneficiary cooling periods.
     - Unrecognized device profiles.
     - Geographically impossible velocity leaps.
     - Off-hours treasury disbursements (1:00 AM – 5:00 AM IST).
     - Rapid-succession structuring & velocity bursts.
2. **Backend-Isolated AI Architecture (Gemini 2.5 Flash)**:
   - **Zero API Key Leakage**: Gemini keys exist strictly in backend environment variables.
   - **No Database Access**: Gemini only receives controlled, authorized domain context.
   - **No Probabilistic Scoring**: Gemini only translates and explains verified signals in plain language.
3. **Multilingual Voice Assistant (Sarvam AI)**:
   - Supports all 22 Scheduled Indian Languages + English (`en`, `hi`, `ta`, `te`, `bn`, `mr`, `gu`, `kn`, `ml`, etc.).
   - Abstracted behind `VoiceProvider` interface with graceful fallback.
4. **Corporate Dual-Control Authorization & Passkeys**:
   - Maker/Checker separation of duties.
   - High-risk payments require platform biometric verification (TouchID / FaceID / Windows Hello) via WebAuthn.
5. **Immutable Cryptographic Audit Ledger**:
   - Every sensitive event (`PAYMENT_CREATED`, `RISK_ASSESSED`, `AI_EXPLANATION_GENERATED`, `STEP_UP_AUTH_REQUIRED`, `PAYMENT_APPROVED`) is chained with a SHA-256 hash of the preceding block.

---

## 🛠️ Quickstart Guide

### 1. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your credentials:
```env
PORT=3000
GEMINI_API_KEY=your_gemini_api_key_here
SARVAM_API_KEY=your_sarvam_api_key_here
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/deepaudit
```
*(Note: If keys are omitted, the platform runs seamlessly with audit-grade verified deterministic fallbacks).*

### 2. Build All Packages and Applications
```bash
npm run build:all
```
Or individually:
```bash
npm run build:packages   # Builds shared-types, language, risk-engine, voice, ai-agent
npm run build:api        # Builds Node.js backend
npm run build:web        # Builds Angular frontend
```

### 3. Start Backend & Frontend

#### Start API Server (Port 3000):
```bash
npm run start:api
```

#### Start Frontend Dev Server (Port 4200):
```bash
npm run start:web
```
Open [http://localhost:4200](http://localhost:4200) in your browser.

---

## 🐳 Running with Docker Compose

To run the entire stack (PostgreSQL + API + Web):
```bash
docker compose -f infrastructure/docker-compose.yml up --build
```

---

## 🛡️ Security & Production Highlights
- **Strict TypeScript Strict Mode** across all packages.
- **Dependency Injection & Inversion of Control** in backend services.
- **Provider Abstraction** for payment rails (Razorpay Adapter, Mock Adapter) and voice engines (Sarvam, WebSpeech).
- **Zero Client-Side Keys**.
