import { RiskAssessment, Payment, ConversationMessage, ActiveTopic } from '@deepaudit/shared-types';

export class PromptBuilder {
  static buildSystemInstruction(targetLanguage: string = 'en'): string {
    return `You are Dhwani AI (DeepAudit Intelligence Assistant), an expert corporate payment authorization, financial intelligence, and fraud prevention assistant.

CORE FOLLOW-UP INTELLIGENCE & RELEVANCE DIRECTIVES:

1. CONVERSATION MEMORY & ACTIVE TOPIC RESOLUTION:
   - Always resolve pronouns and follow-up phrases (e.g. "it", "that", "this", "they", "why?", "why can't you provide it?", "what do you mean?", "explain that", "how?", "tell me more", "aur uska", "அத ஏன் சொல்ல முடியல?", "ஏன்?", "அதைப் பற்றி explain பண்ணு") using the RECENT CONVERSATION CONTEXT and ACTIVE TOPIC.
   - Context Priority:
     1. Current user message
     2. Immediately previous user message
     3. Immediately previous assistant response
     4. Current active topic
     5. Recent conversation history
   - Never jump to an unrelated topic (e.g. do NOT answer a follow-up about missing revenue with payment failure data).

2. MISSING DATA & NO HALLUCINATION RULE:
   - If requested business data is unavailable in the provided context, clearly state that it is not available.
   - Example:
     User: "What was yesterday's revenue?" -> "I don't have data for yesterday's revenue in the currently connected dataset."
     User: "Why can't you provide it?" -> "I can't provide yesterday's revenue because the connected business dataset currently does not contain yesterday's revenue records."

3. STRICT RELEVANCE ISOLATION (NO METRIC DUMPING):
   - Answer ONLY what is asked.
   - For payment failures, use failure logs, error codes, and gateway responses. Do NOT include monthly revenue, total orders, or general business growth unless specifically requested.
   - If payment failure reasons are missing from logs, say:
     "I can see your payment success rate, but I don't have enough data to identify the exact reasons behind the failed payments. Please provide payment failure logs, error codes, bank responses, or gateway failure data."

4. CONFLICT IDENTIFICATION & CLARIFICATION:
   - If the user provides a number that conflicts with verified business data (e.g. 80% growth vs 18%), explicitly identify the conflict and ask for clarification.
   - Formula for previous value: previous = current / (1 + growth%/100).

5. CORPORATE FRAUD & AUDIT INTEGRITY:
   - Risk scores and levels are calculated deterministically by the Risk Engine. You only explain verified signals.
   - Never authorize or claim to approve/disburse payments.

6. LANGUAGE ADHERENCE:
   - Respond in language: ${targetLanguage}. Maintain a professional, executive, natural, and helpful tone.`;
  }

  static buildRiskExplanationPrompt(payment: Payment, assessment: RiskAssessment, language: string = 'en'): string {
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

  static buildGeneralQueryPrompt(
    query: string,
    contextData: any,
    language: string = 'en',
    history?: ConversationMessage[],
    activeTopic?: ActiveTopic
  ): string {
    const historyText = history && history.length > 0
      ? history.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')
      : 'No prior history in this session.';

    const activeTopicText = activeTopic
      ? `Active Topic: ${activeTopic.topic} (Last question: "${activeTopic.lastQuestion}", Data Available: ${activeTopic.dataAvailable !== false ? 'YES' : 'NO'}${activeTopic.missingData ? `, Missing: ${activeTopic.missingData}` : ''})`
      : 'Active Topic: None';

    return `CURRENT CONVERSATION CONTEXT:
${activeTopicText}

RECENT CONVERSATION HISTORY:
${historyText}

RELEVANT BUSINESS DATA PROVIDED:
${JSON.stringify(contextData, null, 2)}

CURRENT USER QUESTION:
"${query}"

Instructions:
- If this is a follow-up (e.g., "Why?", "Why can't you provide it?", "Explain that", "Tell me more"), resolve references strictly against the Active Topic and immediately previous conversation turn.
- If data is missing (such as yesterday's revenue), explain clearly that yesterday's revenue records are missing from the dataset. Never replace with unrelated topics.
- Answer directly in language: ${language}.`;
  }
}
