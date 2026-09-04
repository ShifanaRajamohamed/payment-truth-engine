# DeepAudit AI — Architectural Specification

DeepAudit AI is an enterprise platform designed for AI-assisted corporate payment authorization, deterministic fraud prevention, multi-signal risk scoring, and multilingual voice interaction.

---

## 1. System Topology

```mermaid
graph TD
    Client[Angular 19 Frontend Web App] -->|HTTPS REST| APIGateway[Node.js API Service :3000]
    
    subgraph "Core Monorepo Packages"
        APIGateway --> SharedTypes[@deepaudit/shared-types]
        APIGateway --> RiskEnginePkg[@deepaudit/risk-engine]
        APIGateway --> AIAgentPkg[@deepaudit/ai-agent]
        APIGateway --> VoicePkg[@deepaudit/voice]
        APIGateway --> LanguagePkg[@deepaudit/language]
    end

    subgraph "External Rails & AI Engines"
        AIAgentPkg -->|Structured Context Only| GeminiAPI[Google Gemini 2.5 Flash]
        VoicePkg -->|Encrypted Audio| SarvamAPI[Sarvam AI STT & TTS]
        APIGateway -->|IMPS / NEFT Rails| RazorpayPG[Razorpay Enterprise Gateway]
    end

    subgraph "Persistence"
        APIGateway --> Postgres[(PostgreSQL DB + Audit Ledger)]
    end
```

---

## 2. AI Architecture (Controlled Tool Layer)

Gemini API is strictly isolated on the backend. Gemini **never** accesses the database directly and **never** calculates or overrides risk scores.

```mermaid
sequenceDiagram
    autonumber
    actor Officer as Treasury Officer
    participant Frontend as Angular Web Client
    participant AgentAPI as Backend Agent Service
    participant ToolLayer as Authorized Tool Layer
    participant Domain as Payment & Risk Services
    participant Gemini as Gemini AI API

    Officer->>Frontend: Click "Explain with Gemini" on flagged payment
    Frontend->>AgentAPI: POST /api/agent/explain-risk { paymentId, languageCode }
    AgentAPI->>ToolLayer: Request Authorized Payment & Risk Assessment
    ToolLayer->>Domain: Fetch Payment TXN-9283749283 & Risk Signals
    Domain-->>ToolLayer: Return verified deterministic assessment
    ToolLayer-->>AgentAPI: Deliver Sanitized Context
    AgentAPI->>Gemini: POST generateContent(SystemInstruction + Prompt + Context)
    Gemini-->>AgentAPI: Return audit-ready reasoning explanation
    AgentAPI-->>Frontend: 200 OK { explanation, paymentId }
    Frontend-->>Officer: Render verified plain-language breakdown
```

---

## 3. Deterministic Risk Engine Flow

Risk scores (0–100) are computed mathematically across 6 independent signal categories:

```mermaid
flowchart LR
    Tx[Payment Disbursement Payload] --> S1[Amount Threshold Detector]
    Tx --> S2[Beneficiary Cooling Detector]
    Tx --> S3[Device Fingerprint Detector]
    Tx --> S4[Impossible Travel Location Detector]
    Tx --> S5[Off-Hours Timing Detector]
    Tx --> S6[Structuring & Velocity Detector]

    S1 --> Scoring[Deterministic Scoring Engine]
    S2 --> Scoring
    S3 --> Scoring
    S4 --> Scoring
    S5 --> Scoring
    S6 --> Scoring

    Scoring --> Policy[Policy Rule Matrix]
    Policy --> Score["Risk Score (0-100) & Classification (LOW/MEDIUM/HIGH/CRITICAL)"]
```

---

## 4. Voice Processing Flow (Sarvam AI)

Voice interactions route through backend provider abstractions to avoid client-side API key leakage:

```mermaid
sequenceDiagram
    actor Officer as User Voice Input
    participant Mic as Frontend Audio Capture
    participant Backend as Backend Voice Service
    participant SarvamSTT as Sarvam STT (saaras:v1)
    participant Gemini as Gemini Agent
    participant SarvamTTS as Sarvam TTS (bulbul:v1)

    Officer->>Mic: Speak query (any of 22 Indian languages)
    Mic->>Backend: POST /api/voice/stt (audioBase64, languageCode)
    Backend->>SarvamSTT: Transcribe Audio
    SarvamSTT-->>Backend: Return Transcript Text
    Backend->>Gemini: Query Treasury Context with Transcript
    Gemini-->>Backend: Return Plain Language Response Text
    Backend->>SarvamTTS: POST /api/voice/tts (responseText, languageCode)
    SarvamTTS-->>Backend: Return Audio Wave Base64
    Backend-->>Mic: Return Response Text + Audio Stream
    Mic-->>Officer: Play audio response in native tongue
```

---

## 5. Dual-Control Authorization & Immutability

1. **Maker Submission**: Treasury Maker creates payment -> Deterministic risk evaluation triggers.
2. **Step-Up Verification**: If risk score >= 60 (HIGH/CRITICAL), platform biometric passkey (WebAuthn) is required.
3. **Checker Approval**: Authorized Checker reviews Gemini reasoning and approves or declines.
4. **Append-Only Audit**: Every single step is hashed using SHA-256 with the previous event's hash, forming an immutable chain.
