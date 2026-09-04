# DeepAudit AI — Deterministic Risk Rules Specification

The DeepAudit Risk Engine enforces mathematical, repeatable scoring without probabilistic LLM hallucination.

---

## 1. Signal Taxonomy & Scoring Matrix

| Signal Code | Description | Severity | Score Weight | Policy Trigger |
| :--- | :--- | :--- | :--- | :--- |
| `AMOUNT_THRESHOLD_EXCEEDED` | Payment > Org Limit (₹5L) | HIGH | +35 pts | Step-Up Required |
| `AMOUNT_ANOMALY_HISTORICAL` | >300% above 90-day avg for payee | HIGH | +25 pts | Step-Up Required |
| `BENEFICIARY_NEW_COOLING_PERIOD` | Payee added within 24h statutory window | HIGH | +30 pts | Step-Up Required |
| `BENEFICIARY_VELOCITY_SPIKE` | Sudden burst to dormant or flagged payee | CRITICAL | +45 pts | Immediate Freeze |
| `DEVICE_UNKNOWN_FINGERPRINT` | Unrecognized browser profile or hardware | MEDIUM | +20 pts | Dual Approval |
| `LOCATION_IMPOSSIBLE_TRAVEL` | Geographically impossible velocity (<15 min) | HIGH | +35 pts | Step-Up Required |
| `TIMING_OUT_OF_HOURS` | Initiated 1:00 AM – 5:00 AM IST | MEDIUM | +15 pts | Dual Approval |
| `BEHAVIOR_RAPID_SUCCESSION` | >= 3 disbursements in < 5 minutes | HIGH | +25 pts | Step-Up Required |
| `BEHAVIOR_ROUND_NUMBER_SPLIT` | Amount structured just below ₹50K or ₹100K | MEDIUM | +20 pts | Dual Approval |

---

## 2. Categorical Risk Levels & Policy Mapping

- **LOW (0 – 29 pts)**: Standard corporate processing path. Single authorized maker release.
- **MEDIUM (30 – 59 pts)**: Dual-control required. Checker review and sign-off needed.
- **HIGH (60 – 84 pts)**: High risk. Hardware Passkey (WebAuthn biometric) verification + Dual-Checker sign-off.
- **CRITICAL (85 – 100 pts)**: Critical anomaly. Automatic disbursement freeze. Requires Fraud Operations investigation.

---

## 3. Separation of Concerns (LLM Rule)

- **The Risk Engine** calculates the score and assigns the level.
- **Gemini AI** reads the signals and translates them into an audit-ready executive explanation in plain English or any of the 22 Indian languages.
- Gemini is **strictly prohibited** from altering or recalculating scores.
