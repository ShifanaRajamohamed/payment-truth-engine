# DeepAudit AI — API Specification

Base URL: `http://localhost:3000/api`

All responses follow the unified response envelope:
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": "2026-09-02T18:00:00.000Z"
}
```

---

## Endpoints

### Health Check
- **`GET /health`**
  - **Response**: `{ "status": "ok", "service": "DeepAudit AI API" }`

### Authentication
- **`POST /api/auth/login`**
  - **Body**: `{ "email": "user@deepaudit.ai", "password": "password123" }`
  - **Response**: User object with JWT token and role (`MAKER`, `CHECKER`, `ADMIN`, `AUDITOR`).
- **`GET /api/auth/passkey-challenge`**
  - **Response**: WebAuthn 32-byte challenge for TouchID/FaceID.

### Payments
- **`GET /api/payments`**
  - **Query Params**: `status`, `method`, `query`
  - **Response**: Array of corporate payments with risk assessments.
- **`GET /api/payments/beneficiaries`**
  - **Response**: List of approved vendors and payees with cooling status.
- **`POST /api/payments`**
  - **Body**: `{ "beneficiaryId": "ben_01", "amount": 250000, "method": "NEFT", "purpose": "Invoice Settlement", "region": "Maharashtra" }`
  - **Response**: Created payment with real-time deterministic risk assessment and policy action.

### Risk Engine
- **`POST /api/risk/assess`**
  - **Body**: `{ "payment": { ... }, "beneficiary": { ... } }`
  - **Response**: Bounded risk score (0-100), risk level, and array of detected signals.

### AI Agent (Gemini)
- **`POST /api/agent/explain-risk`**
  - **Body**: `{ "paymentId": "pay_TX9283749283", "languageCode": "en" }`
  - **Response**: Verified, hallucination-free executive risk explanation.
- **`POST /api/agent/query`**
  - **Body**: `{ "query": "Which corporate payments are held in step-up review?", "languageCode": "en" }`
  - **Response**: Verified Agent response with tool calls and suggested actions.

### Voice (Sarvam AI)
- **`POST /api/voice/stt`**
  - **Body**: `{ "audioBase64": "...", "languageCode": "hi-IN" }`
  - **Response**: `{ "transcript": "...", "confidence": 0.95 }`
- **`POST /api/voice/tts`**
  - **Body**: `{ "text": "...", "languageCode": "ta-IN", "gender": "female" }`
  - **Response**: `{ "audioBase64": "...", "mimeType": "audio/wav" }`

### Authorizations & Approvals
- **`POST /api/authz/step-up`**
  - **Body**: `{ "paymentId": "...", "credential": { ... } }`
  - **Response**: Verified authorization step record.
- **`POST /api/authz/approve`**
  - **Body**: `{ "paymentId": "...", "comments": "Approved by Checker" }`
  - **Response**: Approved payment.
- **`POST /api/authz/reject`**
  - **Body**: `{ "paymentId": "...", "reason": "Declined due to cooling period anomaly" }`
  - **Response**: Rejected payment.

### Audit Ledger
- **`GET /api/audit`**
  - **Query Params**: `limit=50`
  - **Response**: Chronological array of cryptographic audit events.
