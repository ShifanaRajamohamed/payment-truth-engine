import { RiskAssessment, Payment, ConversationMessage, ActiveTopic } from '@deepaudit/shared-types';

const INDIC_LANGUAGES: Record<string, { name: string; native: string }> = {
  en: { name: 'English', native: 'English' },
  ta: { name: 'Tamil', native: 'தமிழ்' },
  te: { name: 'Telugu', native: 'తెలుగు' },
  kn: { name: 'Kannada', native: 'ಕನ್ನಡ' },
  ml: { name: 'Malayalam', native: 'മലയാളം' },
  hi: { name: 'Hindi', native: 'हिंदी' },
  bn: { name: 'Bengali', native: 'বাংলা' },
  mr: { name: 'Marathi', native: 'मराठी' },
  gu: { name: 'Gujarati', native: 'ગુજરાતી' },
  pa: { name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  or: { name: 'Odia', native: 'ଓଡ଼ିଆ' },
  as: { name: 'Assamese', native: 'অসমীয়া' },
  mai: { name: 'Maithili', native: 'मैथिली' },
  ur: { name: 'Urdu', native: 'اردو' },
  ks: { name: 'Kashmiri', native: 'کٲشُر' },
  sd: { name: 'Sindhi', native: 'سنڌي' },
  ne: { name: 'Nepali', native: 'नेपाली' },
  sa: { name: 'Sanskrit', native: 'संस्कृतम्' },
  kok: { name: 'Konkani', native: 'कोंकणी' },
  mni: { name: 'Meitei (Manipuri)', native: 'মৈতৈলোন্' },
  brx: { name: 'Bodo', native: 'बड़ो' },
  doi: { name: 'Dogri', native: 'डोगरी' },
  sat: { name: 'Santali', native: 'ᱥᱟᱱᱛᱟᱲᱤ' }
};

export class PromptBuilder {
  static languageLabel(code: string): string {
    const entry = INDIC_LANGUAGES[code] || INDIC_LANGUAGES[code.split('-')[0]];
    if (!entry) return code;
    return `${entry.name} (${entry.native})`;
  }

  /** Prefer the script of the user's message over the UI language toggle. */
  static detectLanguageFromQuery(query: string, fallback = 'en'): string {
    if (/[\u0B80-\u0BFF]/.test(query)) return 'ta';
    if (/[\u0C00-\u0C7F]/.test(query)) return 'te';
    if (/[\u0C80-\u0CFF]/.test(query)) return 'kn';
    if (/[\u0D00-\u0D7F]/.test(query)) return 'ml';
    if (/[\u0980-\u09FF]/.test(query)) return 'bn';
    if (/[\u0A80-\u0AFF]/.test(query)) return 'gu';
    if (/[\u0A00-\u0A7F]/.test(query)) return 'pa';
    if (/[\u0B00-\u0B7F]/.test(query)) return 'or';
    if (/[\u0900-\u097F]/.test(query)) return 'hi';
    return (fallback || 'en').split('-')[0];
  }

  static buildSystemInstruction(targetLanguage: string = 'en'): string {
    const lang = PromptBuilder.languageLabel(targetLanguage);
    return `You are Dhwani AI, a voice-first merchant payment intelligence assistant for Indian businesses.

LANGUAGE (mandatory):
- Reply entirely in ${lang}. Code: ${targetLanguage}.
- You support all 22 scheduled Indian languages plus English. Never switch to English unless the user is speaking English.
- Keep numbers, rupee amounts, order IDs, and UTR codes spoken naturally in that language.

DATA RULES:
1. Prefer figures from the provided merchant ledger. Treat them as ground truth.
2. If a fact is not in the ledger, do NOT refuse. Use reasoning: infer from related ledger fields, Indian payments practice (UPI, NPCI, Razorpay, T+1 settlement, GST), or a clearly labelled estimate. Example: "The ledger has no SKU-level stock, so a reasonable estimate is..."
3. Never invent a fake Payment ID. You may estimate ranges, causes, and next steps.
4. Resolve follow-ups (it, that, why, explain, aur uska, ஏன், क्यों) against the active topic.

VOICE OUTPUT (mandatory):
- This answer is spoken aloud. Write PLAIN TEXT only: no markdown, asterisks, bullets, tables, emoji, or numbered lists.
- Give a COMPLETE spoken answer. Cover the question fully. Do not truncate. Do not stop after one sentence if more facts are needed.
- Use short spoken sentences so text-to-speech can finish every sentence. Separate sentences with periods.
- Do not claim you approved or moved money.

Integrity: risk scores come from the risk engine. You only explain them.`;
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
- If this is a follow-up, resolve it against the Active Topic.
- If a requested field is missing from the ledger, still answer using related fields plus your own reasoning, and say it is an estimate.
- Speak a complete answer in ${PromptBuilder.languageLabel(language)}. Plain text only.`;
  }
}
