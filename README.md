# Payment Truth AI

> **“When money is involved, everyone should see the same truth.”**

**Payment Truth AI** is a production-quality, voice-first payment incident investigation and deterministic state resolution platform.

This is **NOT** a customer-support chatbot. It is an **AI Payment Incident Resolver** that correlates payment telemetry across distributed systems (Bank, Payment Gateway, Webhook, Merchant Backend, and Merchant Database), determines the verifiable root cause, explains the truth in multiple Indian languages (Tamil, Tanglish, Hindi, English), and executes **safe state repair actions** strictly after deterministic invariant verification.

---

## 🏛️ Core Architecture & Principles

```text
VOICE / TEXT COMPLAINT
        ↓
INTENT & ENTITY EXTRACTION
        ↓
EVIDENCE COLLECTION AGENT (Bank, Gateway, Webhook, Merchant DB)
        ↓
CHRONOLOGICAL TIMELINE CORRELATION
        ↓
GEMINI AI ROOT CAUSE REASONING & VOICE EXPLANATION
        ↓
DETERMINISTIC VERIFICATION LAYER (Strict Invariant Rules)
        ↓
SAFE STATE REPAIR ENGINE (Merchant State Sync)
        ↓
IMMUTABLE AUDIT LOG
```

### Core Fintech Principles:
1. **AI can investigate & recommend** — Generative AI models reason across disparate logs.
2. **Deterministic systems verify** — Execution of state repairs is gated behind strict code-based invariant checks (Payment ID, Amount exact match, Gateway Captured status, cryptographic signatures, idempotency, lack of duplicate actions).
3. **AI never independently moves money** — Financial movements remain protected; only verified state synchronization (e.g. `UNPAID` → `PAID` or queueing refund workflows) is supported with human authorization.
4. **Every action is auditable** — All transitions are timestamped, actor-tagged, and cryptographically signed.

---

## 🚀 5 Built-in Judge Demo Scenarios

| # | Scenario | Discrepancy | AI Root Cause | Safe Resolution |
|---|---|---|---|---|
| **1** | **Payment Success, Order Unpaid** *(Signature)* | Bank: `DEBITED` ✅<br>Gateway: `CAPTURED` ✅<br>Webhook: `FAILED HTTP 500` ❌<br>Merchant DB: `UNPAID` ❌ | Webhook Delivery Timeout | Deterministically verify & **MARK ORDER AS PAID** |
| **2** | **Duplicate Payment** | 2 Captures for single order ID (Customer retried) | Duplicate Checkout Session | Identify orphaned capture & **QUEUE REFUND WORKFLOW** |
| **3** | **Payment Failed, Order Paid** *(Critical)* | Bank & Gateway: `FAILED/DECLINED` ❌<br>Merchant DB: `PAID` ❌ | Severe Merchant Backend Parser Desync (Phantom Credit) | **ESCALATE TO SECURITY/OPS** *(Auto-repair blocked)* |
| **4** | **Refund Mismatch** | Gateway: `REFUNDED` ✅<br>Merchant DB: Missing refund record | 404 on Merchant Refund Webhook Endpoint | Deterministically synchronize order to **REFUNDED** |
| **5** | **Delayed Webhook** | Gateway: `CAPTURED` ✅<br>Webhook: Queued in transit pipeline | Transient Gateway Dispatch Lag | **WAIT & MONITOR** *(Prevent premature state mutation)* |

---

## 🎙️ Multilingual Voice AI Support

Supports real-time speech-to-text, wave visualization, step-by-step investigation stages, and natural language spoken responses across:
- 🇮🇳 **Tamil** (*“உங்கள் ₹12,499 payment successfully captured ஆகியுள்ளது...”*)
- 🇮🇳 **Tanglish** (*“Unga ₹12,499 payment capture aayirukku. Webhook error naala order update aagala...”*)
- 🌐 **English** (*“Your payment of ₹12,499 was successfully captured...”*)
- 🇮🇳 **Hindi** (*“आपका ₹12,499 का भुगतान सफल रहा...”*)

---

## 🛠️ Quick Start & Running Locally

### 1. Prerequisites
- Node.js >= 18
- npm

### 2. Installation
```bash
git clone <repo-url>
cd payment-truth-ai
npm install
```

### 3. Environment Variables (Optional)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(Deterministic fallback models are built-in for instant offline judging without external API keys).*

### 4. Build & Run
```bash
# Build shared types, API backend, and Angular frontend
npm run build:all

# Run Frontend Web App (Angular)
npm run start:web

# Run Backend API Service (Port 3000)
npm run start:api
```

Open `http://localhost:4200` in your browser.

---

## 🛡️ API Endpoints Summary

- `GET /api/incidents` — List all payment incidents
- `GET /api/incidents/:id` — Get full multi-system matrix & timeline
- `POST /api/incidents/investigate` — Process complaint via AI & correlate evidence
- `POST /api/incidents/:id/verify` — Run deterministic verification checks
- `POST /api/incidents/:id/repair` — Execute authorized safe state repair
- `POST /api/incidents/simulate/:scenarioId` — Trigger any of the 5 demo scenarios
- `GET /api/truth/lookup?q=...` — Cross-system ledger search
- `GET /api/truth/metrics` — Live system health score (98.4%) & incident counters
- `GET /api/truth/audit` — Immutable compliance audit trail
