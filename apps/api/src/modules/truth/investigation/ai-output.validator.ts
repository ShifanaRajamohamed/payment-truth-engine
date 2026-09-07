import { AIInvestigationReport } from '@deepaudit/shared-types';

const ALLOWED_ACTIONS = new Set([
  'MARK_ORDER_PAID',
  'MARK_ORDER_FAILED',
  'INITIATE_REFUND_WORKFLOW',
  'ESCALATE_MANUAL_REVIEW',
  'SYNC_REFUND_STATUS',
  'WAIT_AND_MONITOR'
]);

const FORBIDDEN_FIELDS = ['chain_of_thought', 'reasoning_trace', 'internal_reasoning', 'hidden_thoughts'];

export interface ValidationResult {
  isValid: boolean;
  validatedReport?: AIInvestigationReport;
  errors: string[];
}

export class AIOutputValidator {
  /**
   * Validates raw parsed model output against the strict AI Investigation Contract.
   */
  static validate(raw: any, validRuleIds: string[]): ValidationResult {
    const errors: string[] = [];

    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return { isValid: false, errors: ['Output must be a valid non-null JSON object'] };
    }

    // 1. Prohibit chain-of-thought or internal reasoning fields
    for (const forbidden of FORBIDDEN_FIELDS) {
      if (forbidden in raw) {
        errors.push(`Output contains forbidden internal reasoning field: "${forbidden}"`);
      }
    }

    // 2. Validate observed_facts
    if (!Array.isArray(raw.observed_facts) || raw.observed_facts.length === 0) {
      errors.push('Missing or empty "observed_facts" array');
    } else {
      for (const fact of raw.observed_facts) {
        if (typeof fact !== 'string' || !fact.trim()) {
          errors.push('Each entry in "observed_facts" must be a non-empty string');
          break;
        }
      }
    }

    // 3. Validate evidence references against supplied rule IDs (No Hallucinated Rules)
    const validRuleSet = new Set(validRuleIds);
    if (!Array.isArray(raw.evidence)) {
      errors.push('Missing "evidence" array');
    } else {
      for (const ev of raw.evidence) {
        if (typeof ev !== 'string') {
          errors.push('Evidence item must be a string');
        } else if (!validRuleSet.has(ev)) {
          errors.push(`Hallucinated or unknown evidence rule reference: "${ev}". Must be one of supplied rule IDs.`);
        }
      }
    }

    // 4. Validate hypothesis
    if (typeof raw.hypothesis !== 'string' || !raw.hypothesis.trim()) {
      errors.push('Missing or empty "hypothesis" string');
    }

    // 5. Validate confidence (Range: 0.0 to 1.0)
    let normalizedConfidence = raw.confidence;
    if (typeof raw.confidence !== 'number' || isNaN(raw.confidence)) {
      errors.push('confidence must be a valid number');
    } else if (raw.confidence < 0 || raw.confidence > 1) {
      errors.push(`confidence ${raw.confidence} is out of valid bounds (0.0 to 1.0)`);
    } else {
      normalizedConfidence = Math.round(raw.confidence * 100) / 100;
    }

    // 6. Validate verdict
    if (typeof raw.verdict !== 'string' || !raw.verdict.trim()) {
      errors.push('Missing or empty "verdict" string');
    }

    // 7. Validate recommended_action
    if (!raw.recommended_action || !ALLOWED_ACTIONS.has(raw.recommended_action)) {
      errors.push(`Invalid recommended_action "${raw.recommended_action}". Must be one of allowed operational actions.`);
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    const validatedReport: AIInvestigationReport = {
      aiStatus: 'SUCCESS',
      observed_facts: raw.observed_facts.map((f: string) => f.trim()),
      evidence: raw.evidence,
      hypothesis: raw.hypothesis.trim(),
      confidence: normalizedConfidence,
      verdict: raw.verdict.trim(),
      recommended_action: raw.recommended_action,
      voiceScript: raw.voiceScript && typeof raw.voiceScript === 'object' ? {
        tamil: typeof raw.voiceScript.tamil === 'string' ? raw.voiceScript.tamil : '',
        english: typeof raw.voiceScript.english === 'string' ? raw.voiceScript.english : '',
        tanglish: typeof raw.voiceScript.tanglish === 'string' ? raw.voiceScript.tanglish : '',
        hindi: typeof raw.voiceScript.hindi === 'string' ? raw.voiceScript.hindi : ''
      } : undefined
    };

    return { isValid: true, validatedReport, errors: [] };
  }
}
