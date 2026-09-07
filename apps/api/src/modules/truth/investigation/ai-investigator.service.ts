import { PaymentIncident, DeterministicVerificationResult, AIInvestigationReport } from '@deepaudit/shared-types';
import { envConfig } from '../../../config/env.config';
import { InvestigationPromptBuilder } from './investigation-prompt.builder';
import { AIOutputValidator } from './ai-output.validator';

export type ModelCaller = (prompt: { systemInstruction: string; userPrompt: string }) => Promise<string | null>;

export class AIInvestigatorService {
  private customModelCaller?: ModelCaller;
  private readonly timeoutMs: number = 10000;

  constructor(customModelCaller?: ModelCaller, timeoutMs: number = 10000) {
    this.customModelCaller = customModelCaller;
    this.timeoutMs = timeoutMs;
  }

  public setModelCaller(caller?: ModelCaller): void {
    this.customModelCaller = caller;
  }

  /**
   * Generates a grounded AI investigation strictly subordinate to deterministic truth.
   */
  public async investigate(
    incident: PaymentIncident,
    verification: DeterministicVerificationResult
  ): Promise<AIInvestigationReport> {
    const { systemInstruction, userPrompt, validRuleIds } = InvestigationPromptBuilder.buildPrompt(incident, verification);

    // 1. If custom caller or Gemini API key is present, attempt live inference
    let rawResponseText: string | null = null;
    let callFailed = false;

    if (this.customModelCaller) {
      try {
        rawResponseText = await this.customModelCaller({ systemInstruction, userPrompt });
      } catch (err) {
        console.warn('Custom AI model caller failed:', err);
        callFailed = true;
      }
    } else if (envConfig.geminiApiKey) {
      try {
        rawResponseText = await this.callGeminiApi(systemInstruction, userPrompt);
      } catch (err) {
        console.warn('Gemini API call failed:', err);
        callFailed = true;
      }
    } else {
      callFailed = true;
    }

    // 2. If AI call failed or produced empty text, return deterministic fallback
    if (callFailed || !rawResponseText) {
      return this.generateDeterministicFallback(incident, verification, 'UNAVAILABLE');
    }

    // 3. Parse JSON safely
    let parsed: any;
    try {
      // Strip markdown code fences if model enclosed JSON in ```json ... ```
      const cleaned = rawResponseText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.warn('AI returned malformed non-JSON output, degrading to fallback:', parseErr);
      const fallback = this.generateDeterministicFallback(incident, verification, 'FALLBACK');
      fallback.validationErrors = ['Malformed JSON response from model'];
      return fallback;
    }

    // 4. Validate output against AI Investigation Contract
    const validation = AIOutputValidator.validate(parsed, validRuleIds);
    if (!validation.isValid || !validation.validatedReport) {
      console.warn('AI output validation failed:', validation.errors);
      const fallback = this.generateDeterministicFallback(incident, verification, 'VALIDATION_FAILED');
      fallback.validationErrors = validation.errors;
      return fallback;
    }

    return validation.validatedReport;
  }

  private async callGeminiApi(systemInstruction: string, userPrompt: string): Promise<string | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${envConfig.geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1,
              maxOutputTokens: 1024
            }
          }),
          signal: controller.signal
        }
      );

      if (!response.ok) {
        return null;
      }

      const data: any = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Constructs an authoritative, deterministic explanation grounded entirely in rule results.
   */
  public generateDeterministicFallback(
    incident: PaymentIncident,
    verification: DeterministicVerificationResult,
    status: 'UNAVAILABLE' | 'FALLBACK' | 'VALIDATION_FAILED' = 'FALLBACK'
  ): AIInvestigationReport {
    const matrix = incident.truthMatrix;
    const ruleResults = verification.ruleResults || [];

    const observed_facts: string[] = [];
    const evidence: string[] = [];

    for (const r of ruleResults) {
      if (r.status === 'PASS' || r.status === 'FAIL') {
        evidence.push(r.ruleId);
        observed_facts.push(`[${r.ruleId}] ${r.explanation}`);
      }
    }

    if (observed_facts.length === 0) {
      observed_facts.push(`Gateway status is ${matrix?.gateway?.status || 'UNKNOWN'}`);
      observed_facts.push(`Merchant order status is ${matrix?.merchantDb?.orderStatus || 'UNKNOWN'}`);
    }

    const action = verification.repairActionType;
    let hypothesis = 'Discrepancy detected across system records during automated reconciliation.';
    let verdict = 'Multi-system reconciliation evaluated deterministically.';

    if (verification.reconciliationStatus === 'BLOCKED') {
      hypothesis = 'Critical risk condition: Gateway capture did not occur or evidence was corrupted.';
      verdict = verification.rejectionReason || 'Hard safety block enforced. Automated state repair prohibited.';
    } else if (action === 'MARK_ORDER_PAID') {
      hypothesis = 'Payment was captured by gateway and debited by bank, but merchant webhook delivery was dropped.';
      verdict = `Customer paid ₹${incident.amount}. Gateway status is CAPTURED. Merchant order ${incident.orderId} requires reconciliation to PAID.`;
    } else if (action === 'INITIATE_REFUND_WORKFLOW') {
      hypothesis = 'Duplicate payment detected: customer was debited multiple times for a single order.';
      verdict = `Duplicate funds of ₹${incident.amount} held in unallocated capture. Refund workflow recommended.`;
    } else if (action === 'SYNC_REFUND_STATUS') {
      hypothesis = 'Refund was processed by payment gateway but merchant ledger was not synchronized.';
      verdict = `Gateway recorded REFUNDED. Merchant order ${incident.orderId} requires synchronization to REFUNDED.`;
    } else if (action === 'WAIT_AND_MONITOR') {
      hypothesis = 'Webhook event is in-flight within standard propagation latency window.';
      verdict = 'Awaiting automated gateway retry delivery before evaluating state modification.';
    }

    return {
      aiStatus: status,
      observed_facts,
      evidence,
      hypothesis,
      confidence: verification.isVerified ? 0.95 : 0.5,
      verdict,
      recommended_action: action,
      voiceScript: {
        tamil: `உங்கள் ₹${incident.amount.toLocaleString('en-IN')} கட்டணம் சரிபார்க்கப்பட்டது. கணினி நிலை: ${action}.`,
        tanglish: `Unga ₹${incident.amount.toLocaleString('en-IN')} payment verify aayirukku. Next step: ${action}.`,
        english: `Your payment of ₹${incident.amount.toLocaleString('en-IN')} has been verified by the Truth Engine. Recommended action: ${action}.`,
        hindi: `आपके ₹${incident.amount.toLocaleString('en-IN')} के भुगतान का सत्यापन किया गया है। आवश्यक कार्रवाई: ${action}।`
      }
    };
  }
}

export const aiInvestigatorService = new AIInvestigatorService();
