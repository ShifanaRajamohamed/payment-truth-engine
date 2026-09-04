"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptBuilder = void 0;
class PromptBuilder {
    static buildSystemInstruction(targetLanguage = 'en') {
        return `You are DeepAudit AI, an expert corporate payment authorization and fraud intelligence assistant.

CORE DIRECTIVES:
1. You assist corporate treasury and fraud risk officers in understanding payment risks, transaction anomalies, and audit events.
2. NEVER calculate or modify risk scores or risk levels yourself. All scores (0-100) and levels (LOW, MEDIUM, HIGH, CRITICAL) are deterministically calculated by the Risk Engine. Your role is solely to explain and summarize these signals.
3. NEVER make authoritative authorization decisions or claim you approved or rejected a transfer. Decisions are made by human Makers/Checkers or statutory policy.
4. Respond accurately based ONLY on the verified context provided. Do not hallucinate transaction numbers, banks, or amounts.
5. Respond in language: ${targetLanguage}. Keep explanations concise, professional, and audit-ready.`;
    }
    static buildRiskExplanationPrompt(payment, assessment, language = 'en') {
        const signalsText = assessment.signals
            .map((s, i) => `${i + 1}. [${s.severity}] ${s.title}: ${s.description}`)
            .join('\n');
        return `Explain why the following corporate payment was assigned a risk score of ${assessment.overallScore}/100 (${assessment.level} Risk):

PAYMENT DETAILS:
- Payment ID: ${payment.id}
- Reference: ${payment.referenceNumber}
- Amount: ₹${payment.amount.toLocaleString('en-IN')} (${payment.currency})
- Method: ${payment.method}
- Beneficiary: ${payment.beneficiary?.name || 'Unknown'} (Category: ${payment.beneficiary?.category || 'N/A'}, Status: ${payment.beneficiary?.status || 'N/A'})
- Purpose: ${payment.purpose}
- Region: ${payment.region}

DETERMINISTIC SIGNALS DETECTED:
${signalsText || 'No risk signals detected.'}

REQUIRED ACTION BY POLICY: ${assessment.actionRequired}

Provide a concise 2-3 paragraph executive summary explaining:
1. Why this payment was flagged or prioritized.
2. The primary risk factors and what security step (e.g. Passkey step-up, Dual Checker review) is required.
3. Guidance for the approving officer before authorizing disbursement.`;
    }
    static buildGeneralQueryPrompt(query, contextData, language = 'en') {
        return `User Query: "${query}"

CONTEXT DATA PROVIDED:
${JSON.stringify(contextData, null, 2)}

Please answer the user's question clearly and accurately using the context data above. Answer in language: ${language}.`;
    }
}
exports.PromptBuilder = PromptBuilder;
