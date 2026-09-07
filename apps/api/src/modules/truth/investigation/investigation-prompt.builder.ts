import { PaymentIncident, DeterministicVerificationResult } from '@deepaudit/shared-types';

export class InvestigationPromptBuilder {
  /**
   * Sanitizes untrusted text to prevent prompt injection or format breaking.
   */
  static sanitizeUntrustedInput(input: string): string {
    if (!input) return '';
    return input
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // remove control characters
      .replace(/[{}\[\]`]/g, '') // remove raw bracket/quote delimiters
      .replace(/<!--[\s\S]*?-->/g, '') // strip html comments
      .slice(0, 500) // length limit
      .trim();
  }

  /**
   * Constructs an evidence-grounded prompt strictly based on deterministic rule results.
   */
  static buildPrompt(incident: PaymentIncident, verification: DeterministicVerificationResult): {
    systemInstruction: string;
    userPrompt: string;
    validRuleIds: string[];
  } {
    const validRuleIds = (verification.ruleResults || []).map(r => r.ruleId);

    const rulesTable = (verification.ruleResults || []).map(r => {
      const obs = r.observedValue !== undefined ? JSON.stringify(r.observedValue) : 'N/A';
      const exp = r.expectedValue !== undefined ? JSON.stringify(r.expectedValue) : 'N/A';
      return `[Rule: ${r.ruleId}] (${r.ruleName}) -> Status: ${r.status} (Critical: ${r.critical}) | Observed: ${obs} | Expected: ${exp} | Note: ${r.explanation}`;
    }).join('\n');

    const sanitizedClaim = InvestigationPromptBuilder.sanitizeUntrustedInput(incident.customerClaim || '');

    const systemInstruction = `You are the AI Payment Investigator for "Payment Truth AI".
Your role is strictly an EXPLAINER and INVESTIGATOR. You DO NOT have authority to determine financial truth or mutate payment state.
The Deterministic Truth Engine has already evaluated authoritative rule results. Your job is to ground your analysis strictly in these verified facts.

STRICT RULES:
1. Ground every conclusion only in the supplied rule results. DO NOT invent or assume facts not present.
2. In the "evidence" array, you MUST ONLY cite Rule IDs from the supplied list: [${validRuleIds.join(', ')}]. Any other ID is considered a hallucination and will be rejected.
3. Clearly separate directly observed deterministic facts from your explanatory hypothesis.
4. DO NOT provide internal reasoning traces, chain-of-thought, or hidden reasoning fields.
5. Your output must be strictly valid JSON matching the specified schema.`;

    const userPrompt = `INCIDENT METADATA:
- Incident ID: ${incident.id}
- Order ID: ${incident.orderId}
- Payment ID: ${incident.paymentId || 'N/A'}
- Amount: ₹${incident.amount} (${incident.currency || 'INR'})
- Customer Claim (untrusted input): "${sanitizedClaim}"

AUTHORITATIVE DETERMINISTIC RECONCILIATION FINDINGS:
- Reconciliation Status: ${verification.reconciliationStatus || 'N/A'}
- Can Safe Repair: ${verification.canSafeRepair}
- Deterministic Repair Action: ${verification.repairActionType}
- Rejection Reason: ${verification.rejectionReason || 'None'}

DETERMINISTIC RULE RESULTS:
${rulesTable}

INSTRUCTIONS:
Respond strictly with a JSON object in this exact schema (no markdown formatting, no code blocks):
{
  "observed_facts": [
    "Fact 1 directly observed from rule results",
    "Fact 2 directly observed from rule results"
  ],
  "evidence": [
    "rule-id-1",
    "rule-id-2"
  ],
  "hypothesis": "Concise 1-2 sentence hypothesis explaining where and why desynchronization occurred",
  "confidence": 0.95,
  "verdict": "Clear technical explanation of what occurred across the system ledgers",
  "recommended_action": "${verification.repairActionType}",
  "voiceScript": {
    "tamil": "Short spoken explanation for customer in Tamil",
    "tanglish": "Short spoken explanation for customer in Tanglish",
    "english": "Short spoken explanation for customer in English",
    "hindi": "Short spoken explanation for customer in Hindi"
  }
}`;

    return { systemInstruction, userPrompt, validRuleIds };
  }
}
