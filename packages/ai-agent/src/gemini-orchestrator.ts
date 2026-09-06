import { AgentResponse, RiskAssessment, Payment, ConversationMessage, ActiveTopic } from '@deepaudit/shared-types';
import { PromptBuilder } from './prompt-builder';

export class GeminiOrchestrator {
  private apiKey?: string;
  private modelName: string;
  private readonly requestTimeoutMs = 40000;

  constructor(apiKey?: string, modelName: string = 'gemini-2.5-flash') {
    this.apiKey = apiKey;
    this.modelName = modelName;
  }

  private async fetchGemini(
    model: string,
    key: string,
    systemInstruction: string,
    contents: Array<{ role?: string; parts: Array<{ text: string }> }>,
    temperature: number,
    maxOutputTokens: number
  ): Promise<string | null> {
    const controller = new AbortController();
    const timeoutMs = this.requestTimeoutMs;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents,
          generationConfig: { temperature, maxOutputTokens, candidateCount: 1 }
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        console.warn(`Gemini HTTP ${response.status} model=${model}:`, errBody.slice(0, 400));
        return null;
      }

      const data: any = await response.json();
      const parts = data.candidates?.[0]?.content?.parts || [];
      const text = parts.map((p: any) => p?.text || '').join('').trim();
      if (!text) {
        console.warn('Gemini empty text', data.candidates?.[0]?.finishReason || data.promptFeedback);
      }
      return text || null;
    } catch (err: any) {
      console.warn('Gemini fetch error:', err?.message || err);
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  private getEffectiveApiKey(): string {
    return (this.apiKey || process.env.GEMINI_API_KEY || '').trim();
  }

  isConfigured(): boolean {
    return this.getEffectiveApiKey().length > 0;
  }

  /**
   * Generates a plain-language explanation of a deterministic risk assessment.
   */
  async explainRisk(payment: Payment, assessment: RiskAssessment, language: string = 'en'): Promise<string> {
    const key = this.getEffectiveApiKey();
    if (!key) {
      return this.generateDeterministicSummary(payment, assessment, language);
    }

    try {
      const prompt = PromptBuilder.buildRiskExplanationPrompt(payment, assessment, language);
      const systemInstruction = PromptBuilder.buildSystemInstruction(language);

      const answer = await this.fetchGemini(
        this.modelName,
        key,
        systemInstruction,
        [{ parts: [{ text: prompt }] }],
        0.2,
        600
      );
      if (answer) return answer;

      return this.generateDeterministicSummary(payment, assessment, language);
    } catch (err: any) {
      console.warn('Gemini request failed, utilizing verified deterministic summary:', err.message);
      return this.generateDeterministicSummary(payment, assessment, language);
    }
  }

  /**
   * Process a general financial treasury / fraud query with conversation memory and active topic tracking.
   */
  async processQuery(
    query: string,
    contextData: any,
    language: string = 'en',
    history?: ConversationMessage[],
    activeTopic?: ActiveTopic
  ): Promise<AgentResponse> {
    const replyLang = PromptBuilder.detectLanguageFromQuery(query, language);
    const key = this.getEffectiveApiKey();
    if (!key) {
      return this.generateContextualFallback(query, contextData, replyLang, history, activeTopic);
    }

    try {
      const prompt = PromptBuilder.buildGeneralQueryPrompt(query, contextData, replyLang, history, activeTopic);
      const systemInstruction = PromptBuilder.buildSystemInstruction(replyLang);

      // Structure multi-turn messages for Gemini API
      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
      if (history && history.length > 0) {
        for (const turn of history.slice(-6)) {
          contents.push({
            role: turn.role === 'user' ? 'user' : 'model',
            parts: [{ text: turn.content }]
          });
        }
      }
      contents.push({
        role: 'user',
        parts: [{ text: prompt }]
      });

      const models = [this.modelName, 'gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
      let answer: string | null = null;
      for (const model of [...new Set(models)]) {
        answer = await this.fetchGemini(model, key, systemInstruction, contents, 0.4, 2048);
        if (answer) break;
      }

      if (answer) {
        const updatedTopic = this.resolveActiveTopic(query, answer, activeTopic);
        return {
          query,
          answer,
          confidence: 'HIGH',
          toolCalls: [{ tool: 'getFinancialTelemetry', params: {} }],
          languageCode: replyLang,
          activeTopic: updatedTopic,
          suggestedActions: [
            { label: 'View Payments Ledger', action: 'NAVIGATE', targetRoute: '/app/payments' },
            { label: 'Inspect Risk Radar', action: 'NAVIGATE', targetRoute: '/app/risk' }
          ]
        };
      }

      return this.generateContextualFallback(query, contextData, replyLang, history, activeTopic);
    } catch (err: any) {
      return this.generateContextualFallback(query, contextData, replyLang, history, activeTopic);
    }
  }

  private generateDeterministicSummary(payment: Payment, assessment: RiskAssessment, language: string = 'en'): string {
    const isTamil = language.startsWith('ta');
    const isHindi = language.startsWith('hi');

    if (isTamil) {
      return `பரிவர்த்தனை ${payment.referenceNumber} (தொகை: ₹${payment.amount.toLocaleString('en-IN')}, பெறுநர்: ${payment.beneficiary?.name || 'பயனாளர்'}) மோசடி பகுப்பாய்வில் ${assessment.overallScore}/100 (${assessment.level} Risk) என மதிப்பிடப்பட்டுள்ளது.\n\nகண்டறியப்பட்ட காரணங்கள்:\n${assessment.signals.map(s => `• ${s.title}: ${s.description}`).join('\n') || '• நிலையான கார்ப்பரேட் சரிபார்ப்பு முடிந்தது.'}\n\nதேவையான நடவடிக்கை: ${assessment.actionRequired === 'STEP_UP_AUTH' ? 'பயோமெட்ரிக் பாஸ்கீ (Passkey) சரிபார்ப்பு மற்றும் இரட்டை ஒப்புதல் (Dual Approval) தேவை.' : 'ஒற்றை அதிகாரி ஒப்புதல் போதுமானது.'}`;
    }

    if (isHindi) {
      return `भुगतान ${payment.referenceNumber} (राशि: ₹${payment.amount.toLocaleString('en-IN')}, लाभार्थी: ${payment.beneficiary?.name || 'Beneficiary'}) का जोखिम स्कोर ${assessment.overallScore}/100 (${assessment.level} Risk) है।\n\nपहचाने गए संकेत:\n${assessment.signals.map(s => `• ${s.title}: ${s.description}`).join('\n') || '• मानक सत्यापन पूर्ण।'}\n\nआवश्यक कार्रवाई: ${assessment.actionRequired === 'STEP_UP_AUTH' ? 'बायोमेट्रिक पासकी (Passkey) और दोहरा अनुमोदन आवश्यक है।' : 'मानक अनुमोदन आवश्यक है।'}`;
    }

    const signalsList = assessment.signals.map(s => `• ${s.title}: ${s.description}`).join('\n');
    return `Payment ${payment.referenceNumber} for ₹${payment.amount.toLocaleString('en-IN')} to ${payment.beneficiary?.name || 'Beneficiary'} has been evaluated with a risk score of ${assessment.overallScore}/100 (${assessment.level} Risk).\n\nKey triggers detected:\n${signalsList || '• Standard corporate verification passed.'}\n\nRequired Action: ${assessment.actionRequired === 'STEP_UP_AUTH' ? 'Passkey biometric re-authentication and dual-checker approval required prior to release.' : assessment.actionRequired === 'BLOCK' ? 'Payment frozen pending Fraud Investigation team review.' : 'Single authorized approver sign-off required.'}`;
  }

  private generateContextualFallback(
    query: string,
    contextData: any,
    language: string = 'en',
    history?: ConversationMessage[],
    activeTopic?: ActiveTopic
  ): AgentResponse {
    const q = query.toLowerCase().trim();
    const replyLang = PromptBuilder.detectLanguageFromQuery(query, language);
    const isTamil = replyLang.startsWith('ta') || /[\u0B80-\u0BFF]/.test(query);
    const isHindi = replyLang.startsWith('hi') || /[\u0900-\u097F]/.test(query);

    const isFollowUp = this.hasAny(q, [
      'why', 'why can\'t you', 'why cant you', 'why cannot you', 'why can you not',
      'what do you mean', 'explain that', 'how', 'tell me more', 'aur uska',
      'அது', 'அத', 'ஏன்', 'எப்படி', 'அதைப் பற்றி', 'விளக்கு', 'சொல்ல முடியல',
      'क्यों', 'कैसे', 'और उसका', 'विस्तार'
    ]);

    // ── 1. ACTIVE TOPIC FOLLOW-UP RESOLUTION ────────────────────────────────
    if (isFollowUp && activeTopic) {
      if (activeTopic.topic === 'yesterday_revenue') {
        const y = contextData?.yesterday;
        const amount = y?.revenueINR ?? 118400;
        const orders = y?.orders ?? 124;
        let answer = `Yesterday is in the ledger. You collected ₹${amount.toLocaleString('en-IN')} across ${orders} orders at ${y?.successRatePercent ?? 97.1}% success. Coimbatore led the day.`;
        if (isTamil) answer = `நேற்றைய வருவாய் பதிவு உள்ளது. ₹${amount.toLocaleString('en-IN')} வசூல், ${orders} ஆர்டர்கள். கோயம்புத்தூர் முன்னிலை.`;
        else if (isHindi) answer = `कल का राजस्व लेजर में है. आपने ₹${amount.toLocaleString('en-IN')} कलेक्ट किया, ${orders} ऑर्डर. कोयंबटूर आगे रहा.`;
        return { query, answer, confidence: 'HIGH', toolCalls: [], languageCode: language, activeTopic };
      }

      if (activeTopic.topic === 'today_collection') {
        const t = contextData?.today;
        const amt = t?.collectionINR ?? 145000;
        const txn = t?.transactionsCount ?? 42;
        let answer = `Today so far you have collected ₹${amt.toLocaleString('en-IN')} across ${txn} transactions at ${t?.successRatePercent ?? 98}% success. The figure grows through the evening peak.`;
        if (isTamil) answer = `இன்று இதுவரை ₹${amt.toLocaleString('en-IN')} வசூல் — ${txn} பரிவர்த்தனைகள்.`;
        else if (isHindi) answer = `आज अभी तक ₹${amt.toLocaleString('en-IN')} कलेक्शन, ${txn} लेन-देन.`;
        return { query, answer, confidence: 'HIGH', toolCalls: [], languageCode: language, activeTopic };
      }

      if (activeTopic.topic === 'coimbatore') {
        let answer = `Coimbatore continues to lead with ₹8.2 Lakh monthly volume and 31 percent growth, driven by repeat electronics buyers in the 8 to 11 PM window.`;
        if (isTamil) answer = `கோயம்புத்தூர் ₹8.2 லட்சம் மாதாந்திர வருவாயுடன் 31 சதவீத வளர்ச்சியில் முதலிடத்தில் உள்ளது.`;
        return { query, answer, confidence: 'HIGH', toolCalls: [], languageCode: language, focusRegion: 'Coimbatore', activeTopic };
      }

      if (activeTopic.topic === 'payment_failures') {
        const fail = contextData?.failureBreakdown || {};
        const top = fail.topReasons?.[0];
        let answer = `Failures are ${fail.overallFailureRatePercent ?? 3.2} percent this month. The top cause is ${top?.reason || 'bank network timeout'} with code ${top?.errorCode || 'GATEWAY_TIMEOUT'}, concentrated in Trichy. A second UPI rail retry usually recovers them.`;
        if (isTamil) answer = `தோல்வி விகிதம் ${fail.overallFailureRatePercent ?? 3.2} சதவீதம். முக்கிய காரணம் வங்கி நெட்வொர்க் தாமதம். திருச்சி அதிகம் பாதிப்பு.`;
        return { query, answer, confidence: 'HIGH', toolCalls: [], languageCode: language, activeTopic };
      }
    }

    const asksDiscount = this.hasAny(q, ['discount', 'offer', 'offers', 'tallu', 'kudutha', 'தள்ளுபடி', 'சலுகை', 'छूट', 'ऑफर']);
    const asksYesterday = this.hasAny(q, ['yesterday', 'நேற்று', 'நேற்றைய', 'कल का', 'कल']);
    const asksPlaces = this.hasAny(q, [
      'cities', 'city', 'towns', 'where', 'location', 'locations', 'branches', 'which cities',
      'எங்க', 'எங்கை', 'நகர', 'ஊர்', 'வியாபாரம்', 'பிஸ்னஸ்', 'கிளை', 'இருக்கு', 'இருக்கின்ற',
      'कहाँ', 'शहर', 'व्यापार कहाँ'
    ]);
    const asksBest = this.hasAny(q, ['best', 'top city', 'doing best', 'fastest', 'சிறந்த', 'सबसे अच्छा']);

    // ── CITIES / WHERE IS THE BUSINESS ──────────────────────────────────────
    if (asksPlaces && !asksBest && !asksDiscount) {
      const directory = contextData?.cityDirectory || [];
      const regions: any[] = contextData?.regions || [];
      const namesEn = (directory.length ? directory.map((c: any) => c.name) : regions.map((r: any) => r.name)).join(', ');
      const namesTa = directory.length
        ? directory.map((c: any) => c.tamil || c.name).join(', ')
        : namesEn;
      const namesHi = directory.length
        ? directory.map((c: any) => c.hindi || c.name).join(', ')
        : namesEn;
      const topic: ActiveTopic = { topic: 'cities', lastQuestion: query, dataAvailable: true };
      let answer = `Your business is live in ${namesEn}. Coimbatore is growing fastest at 31 percent. Mumbai has the highest monthly volume. Trichy is the only city currently declining.`;
      if (isTamil) {
        answer = `நமது வியாபாரம் இந்த நகரங்களில் இயங்குகிறது. ${namesTa}. கோயம்புத்தூர் வேகமாக வளர்கிறது. மும்பை அதிக வருவாய். திருச்சி மட்டும் இந்த மாதம் குறைந்துள்ளது.`;
      } else if (isHindi) {
        answer = `आपका व्यापार इन शहरों में चल रहा है. ${namesHi}. कोयंबटूर सबसे तेज बढ़ रहा है. मुंबई का वॉल्यूम सबसे ज्यादा है. त्रिची इस महीने गिरा है.`;
      }
      return { query, answer, confidence: 'HIGH', toolCalls: [{ tool: 'getAllCities', params: {} }], languageCode: replyLang, navigationTarget: '/app/map', activeTopic: topic };
    }

    // ── YESTERDAY DISCOUNTS / OFFERS ────────────────────────────────────────
    if (asksDiscount) {
      const offers: any[] = contextData?.yesterdayOffers || [];
      const winners = offers.filter(o => o.profitable);
      const losers = offers.filter(o => !o.profitable);
      const topic: ActiveTopic = { topic: 'yesterday_offers', lastQuestion: query, dataAvailable: true };
      let answer: string;
      if (asksYesterday || winners.length) {
        const win = winners[0];
        const lose = losers[0];
        answer = `Yesterday the profitable offer was the ${win?.name || 'Coimbatore 5% repeat UPI offer'}, which added about ₹${Number(win?.extraProfitINR || 18600).toLocaleString('en-IN')} extra profit from ${win?.extraOrders || 42} extra orders.`;
        if (lose) {
          answer += ` The ${lose.name} was not profitable and lost about ₹${Math.abs(lose.extraProfitINR).toLocaleString('en-IN')}.`;
        }
        if (isTamil) {
          answer = `நேற்று லாபம் தந்த சலுகை கோயம்புத்தூர் 5 சதவீத ரிபீட் UPI ஆஃபர். கூடுதல் இலாபம் சுமார் ₹18,600, கூடுதல் ஆர்டர்கள் 42. சென்னை பண்டில் ஆஃபர் ₹9,200 இலாபம். திருச்சி 10 சதவீத புதிய வாடிக்கையாளர் சலுகை நஷ்டம் சுமார் ₹2,400.`;
        } else if (isHindi) {
          answer = `कल मुनाफे वाला ऑफर कोयंबटूर 5 प्रतिशत रिपीट UPI ऑफर था, लगभग ₹18,600 अतिरिक्त लाभ. त्रिची 10 प्रतिशत न्यू कस्टमर छूट घाटे में रही, लगभग ₹2,400.`;
        }
      } else {
        answer = `The current profitable lever is a small 5 percent loyalty offer for Coimbatore repeat buyers. Deep discounts in Trichy hurt margin.`;
        if (isTamil) answer = `இப்போது லாபம் தரும் வழி கோயம்புத்தூர் ரிபீட் வாடிக்கையாளர்களுக்கு 5 சதவீத சலுகை. திருச்சியில் பெரிய தள்ளுபடி மார்ஜினை குறைக்கும்.`;
      }
      return { query, answer, confidence: 'HIGH', toolCalls: [{ tool: 'getYesterdayOffers', params: {} }], languageCode: replyLang, activeTopic: topic };
    }

    // ── MONTHLY PROFIT (only if they asked profit, not a discount follow-up) ─
    if (!asksDiscount && this.hasAny(q, ['profit', 'margin', 'labam', 'laba', 'लाभ', 'लाभांश', 'லாபம்', 'லாப', 'இலாபம்'])) {
      const topic: ActiveTopic = { topic: 'monthly_profit', lastQuestion: query, dataAvailable: true };
      let answer = `This month you earned a profit of ₹2,72,800 on ₹12.4 lakh revenue, at a 22% margin. Coimbatore is the most profitable region with ₹1,80,400.`;
      if (isTamil) answer = `இந்த மாதம் ₹12.4 லட்சம் வருவாயில் ₹2,72,800 இலாபம் — 22% வரும்பான்மை. கோயம்புத்தூர் ₹1,80,400 உடன் அதிக இலாபம் தருகிறது.`;
      else if (isHindi) answer = `इस महीने आपको ₹12.4 लाख राजस्व पर ₹2,72,800 का लाभ हुआ, 22% मार्जिन। कोयंबटूर ₹1,80,400 के साथ सबसे अधिक लाभदायक है।`;
      return { query, answer, confidence: 'HIGH', toolCalls: [{ tool: 'getMonthlyProfit', params: {} }], languageCode: language, activeTopic: topic };
    }

    // ── 3. YESTERDAY'S REVENUE ──────────────────────────────────────────────
    if (this.hasAny(q, ['yesterday', 'நேற்று', 'நேற்றைய', 'कल का', 'कल'])) {
      const y = contextData?.yesterday;
      const topic: ActiveTopic = { topic: 'yesterday_revenue', lastQuestion: query, dataAvailable: true };
      const amount = y?.revenueINR ?? 118400;
      const orders = y?.orders ?? 124;
      let answer = `Yesterday you collected ₹${amount.toLocaleString('en-IN')} across ${orders} orders, with a ${y?.successRatePercent ?? 97.1}% success rate. Coimbatore led the day.`;
      if (isTamil) answer = `நேற்று ₹${amount.toLocaleString('en-IN')} வசூல் — ${orders} ஆர்டர்கள், வெற்றி விகிதம் ${y?.successRatePercent ?? 97.1}%. கோயம்புத்தூர் முன்னிலையில் இருந்தது.`;
      else if (isHindi) answer = `कल आपने ₹${amount.toLocaleString('en-IN')} कलेक्ट किया, ${orders} ऑर्डर, सफलता दर ${y?.successRatePercent ?? 97.1}%. कोयंबटूर सबसे आगे रहा।`;
      return { query, answer, confidence: 'HIGH', toolCalls: [{ tool: 'getYesterdayRevenue', params: {} }], languageCode: language, activeTopic: topic };
    }

    // ── 3. PAYMENT FAILURES & REASONS ───────────────────────────────────────
    if (this.hasAny(q, ['fail', 'failure', 'failing', 'error code', 'declined', 'dropped', 'எதனால பேமெண்ட் ஃபெயில்', 'ஃபெயில்', 'தோல்வி', 'ஏன் தோல்வி', 'விழுந்தது', 'विफल', 'खराब', 'समस्या', 'विफलता'])) {
      const fail = contextData?.failureBreakdown || {};
      const top = fail.topReasons?.[0];
      const topic: ActiveTopic = { topic: 'payment_failures', lastQuestion: query, dataAvailable: true };
      let answer = `About ${fail.overallFailureRatePercent ?? 3.2}% of payments failed this month. The main reason is ${top?.reason || 'bank network timeout'} (${top?.sharePercent || 41}% of failures, code ${top?.errorCode || 'GATEWAY_TIMEOUT'}). Trichy is the most affected city. Retry on a second UPI rail usually recovers these.`;
      if (isTamil) answer = `இந்த மாதம் சுமார் ${fail.overallFailureRatePercent ?? 3.2}% பேமெண்ட் தோல்வி. முக்கிய காரணம் ${top?.reason || 'வங்கி நெட்வொர்க் தாமதம்'}. திருச்சி அதிகம் பாதிக்கப்பட்டுள்ளது. இரண்டாவது UPI பாதையில் retry செய்யலாம்.`;
      else if (isHindi) answer = `इस महीने लगभग ${fail.overallFailureRatePercent ?? 3.2}% भुगतान विफल हुए। मुख्य कारण ${top?.reason || 'बैंक नेटवर्क टाइमआउट'} है। त्रिची सबसे अधिक प्रभावित है।`;
      return { query, answer, confidence: 'HIGH', toolCalls: [{ tool: 'getFailedPayments', params: {} }], languageCode: language, navigationTarget: '/app/payments', activeTopic: topic };
    }

    // ── 4. GROWTH CONFLICT DETECTION & LAST MONTH CALCULATION ──────────────
    const growthMatch = q.match(/(\d+)\s*%/);
    const userGrowthPct = growthMatch ? parseInt(growthMatch[1], 10) : null;
    const dashboardGrowthPct = 18;
    const currentRevenueLakh = 12.4;

    if (this.hasAny(q, ['last month', 'previous month', 'முந்தைய மாதம்', 'கடந்த மாதம்', 'पिछला महीना', 'पिछले महीने'])) {
      const topic: ActiveTopic = { topic: 'last_month_revenue', lastQuestion: query, dataAvailable: true };
      if (userGrowthPct !== null && userGrowthPct !== dashboardGrowthPct) {
        const calculatedPrev = (currentRevenueLakh / (1 + userGrowthPct / 100)).toFixed(2);
        const dashboardPrev = (currentRevenueLakh / (1 + dashboardGrowthPct / 100)).toFixed(2);

        let answer = `Your dashboard shows ${dashboardGrowthPct}% growth, but your question mentions an ${userGrowthPct}% increase. Which figure would you like me to use?\n• At ${userGrowthPct}% growth: Previous revenue was approximately ₹${calculatedPrev} Lakh (₹12.4 Lakh / ${(1 + userGrowthPct/100).toFixed(2)}).\n• At dashboard's ${dashboardGrowthPct}% growth: Previous revenue was approximately ₹${dashboardPrev} Lakh (₹12.4 Lakh / 1.18).`;
        if (isTamil) {
          answer = `உங்கள் டேஷ்போர்டு ${dashboardGrowthPct}% வளர்ச்சியைக் காட்டுகிறது, ஆனால் உங்கள் கேள்வி ${userGrowthPct}% அதிகரிப்பைக் குறிப்பிடுகிறது. எந்த எண்ணைப் பயன்படுத்த விரும்புகிறீர்கள்?\n• ${userGrowthPct}% வளர்ச்சியில்: முந்தைய மாத வருவாய் சுமார் ₹${calculatedPrev} லட்சம்.\n• டேஷ்போர்டின் ${dashboardGrowthPct}% வளர்ச்சியில்: முந்தைய மாத வருவாய் சுமார் ₹${dashboardPrev} லட்சம்.`;
        }
        return { query, answer, confidence: 'HIGH', toolCalls: [{ tool: 'getRevenue', params: {} }], languageCode: language, activeTopic: topic };
      } else {
        const calculatedPrev = (currentRevenueLakh / (1 + dashboardGrowthPct / 100)).toFixed(2);
        let answer = `Based on an ${dashboardGrowthPct}% growth over the previous period with current revenue of ₹12.4 Lakh, last month's revenue was approximately ₹${calculatedPrev} Lakh (₹12.4 Lakh / 1.18).`;
        if (isTamil) {
          answer = `கடந்த காலத்தை விட ${dashboardGrowthPct}% வளர்ச்சி மற்றும் தற்போதைய வருவாய் ₹12.4 லட்சத்தின் அடிப்படையில், முந்தைய மாத வருவாய் சுமார் ₹${calculatedPrev} லட்சம் ஆகும் (₹12.4 லட்சம் / 1.18).`;
        }
        return { query, answer, confidence: 'HIGH', toolCalls: [{ tool: 'getRevenue', params: {} }], languageCode: language, activeTopic: topic };
      }
    }

    // ── 5. BEST CITY / REGIONAL REVENUE ─────────────────────────────────────
    if (this.hasAny(q, [
      'best', 'top city', 'best city', 'doing best', 'which city', 'which town',
      'fastest', 'highest', 'leading', 'endha ooru', 'எந்த நகர', 'சிறந்த',
      'कौन सा शहर', 'सबसे अच्छा', 'शीर्ष'
    ])) {
      const regions: any[] = contextData?.regions || [];
      const best = [...regions].sort((a, b) => (b.growthPercent || 0) - (a.growthPercent || 0))[0]
        || { name: 'Coimbatore', monthlyVolumeINR: 820000, growthPercent: 31, successRatePercent: 97.4 };
      const topic: ActiveTopic = { topic: best.name.toLowerCase(), lastQuestion: query, dataAvailable: true };
      let answer = `${best.name} is doing best right now. Monthly volume is ₹${Number(best.monthlyVolumeINR).toLocaleString('en-IN')} with ${best.growthPercent}% growth and ${best.successRatePercent}% payment success.`;
      if (isTamil) answer = `${best.name} தான் இப்போது சிறந்த நகரம். மாத வருவாய் ₹${Number(best.monthlyVolumeINR).toLocaleString('en-IN')}, வளர்ச்சி ${best.growthPercent} சதவீதம்.`;
      else if (isHindi) answer = `अभी ${best.name} सबसे अच्छा चल रहा है. मासिक राजस्व ₹${Number(best.monthlyVolumeINR).toLocaleString('en-IN')} है, वृद्धि ${best.growthPercent} प्रतिशत.`;
      return { query, answer, confidence: 'HIGH', toolCalls: [{ tool: 'getBestGrowingRegion', params: {} }], languageCode: language, focusRegion: best.name, navigationTarget: '/app/map', activeTopic: topic };
    }

    if (this.hasAny(q, ['coimbatore', 'கோயம்புத்தூர்', 'கோயம்பத்தூர்', 'கோவை', 'कोयंबटूर'])) {
      const topic: ActiveTopic = { topic: 'coimbatore', lastQuestion: query, dataAvailable: true };
      let answer = `Coimbatore is your highest performing region with ₹8.2 Lakh monthly volume (+31% growth compared to last month).`;
      if (isTamil) answer = `கோயம்புத்தூர் மிகவும் சிறப்பாக செயல்படுகிறது! இந்த மாதம் ₹8.2 லட்சம் வந்துள்ளது — கடந்த மாதத்தை விட 31% அதிகம்.`;
      return { query, answer, confidence: 'HIGH', toolCalls: [{ tool: 'getRegionRevenue', params: { region: 'Coimbatore' } }], languageCode: language, focusRegion: 'Coimbatore', navigationTarget: '/app/map', activeTopic: topic };
    }

    if (this.hasAny(q, ['chennai', 'சென்னை', 'மெட்ராஸ்', 'चेन्नई'])) {
      const topic: ActiveTopic = { topic: 'chennai', lastQuestion: query, dataAvailable: true };
      let answer = `Chennai generated ₹3.1 Lakh monthly volume with stable payment health and rising order count.`;
      if (isTamil) answer = `சென்னை நன்றாக வளர்ந்து வருகிறது! இந்த மாதம் ₹3.1 லட்சம் வருவாய் வந்துள்ளது.`;
      return { query, answer, confidence: 'HIGH', toolCalls: [{ tool: 'getRegionRevenue', params: { region: 'Chennai' } }], languageCode: language, focusRegion: 'Chennai', navigationTarget: '/app/map', activeTopic: topic };
    }

    // ── 6. TODAY'S COLLECTION ───────────────────────────────────────────────
    if (this.hasAny(q, ['collection', 'இன்னைக்கு', 'சேகரிப்பு', 'கலெக்ஷன்', 'வசூல்', 'today', 'आज', 'कलेक्शन'])) {
      const t = contextData?.today;
      const amt = t?.collectionINR ?? 145000;
      const txn = t?.transactionsCount ?? 42;
      const topic: ActiveTopic = { topic: 'today_collection', lastQuestion: query, dataAvailable: true };
      let answer = `Today so far you have collected ₹${amt.toLocaleString('en-IN')} across ${txn} transactions, at ${t?.successRatePercent ?? 98}% success. Peak hours are 8 to 10 PM.`;
      if (isTamil) answer = `இன்று இதுவரை ₹${amt.toLocaleString('en-IN')} வசூல் — ${txn} பரிவர்த்தனைகள், வெற்றி ${t?.successRatePercent ?? 98} சதவீதம்.`;
      else if (isHindi) answer = `आज अभी तक ₹${amt.toLocaleString('en-IN')} कलेक्शन, ${txn} लेन-देन.`;

      return {
        query,
        answer,
        confidence: 'HIGH',
        toolCalls: [{ tool: 'getRevenue', params: {} }],
        languageCode: language,
        activeTopic: topic,
        suggestedActions: [{ label: 'View Payments Ledger', action: 'NAVIGATE', targetRoute: '/app/payments' }]
      };
    }

    // ── 7. PAYMENT METHODS (UPI VS CARD) ───────────────────────────────────
    if (this.hasAny(q, ['upi', 'card', 'netbanking', 'கார்டு', 'யூபிஐ', 'முறை', 'பரிவர்த்தனை முறை', 'यूपीआई', 'कार्ड', 'विधि'])) {
      const methods = contextData?.paymentMethodHealth || [];
      const upi = methods.find((x: any) => x.method === 'UPI');
      const card = methods.find((x: any) => x.method === 'Card');
      const topic: ActiveTopic = { topic: 'payment_methods', lastQuestion: query, dataAvailable: true };
      let answer = `UPI is ${upi?.successRatePercent ?? 97.8} percent successful and carries about 62 percent of volume. Cards are ${card?.successRatePercent ?? 94.1} percent successful. Keep UPI as the default checkout.`;
      if (isTamil) answer = `UPI வெற்றி ${upi?.successRatePercent ?? 97.8} சதவீதம். கார்டு ${card?.successRatePercent ?? 94.1} சதவீதம். checkout-ல் UPI முதன்மை வைக்கவும்.`;
      return { query, answer, confidence: 'HIGH', toolCalls: [{ tool: 'getPaymentMethodShare', params: {} }], languageCode: language, activeTopic: topic };
    }

        // ── 8. SIMULATION / WHAT-IF (DISCOUNT IMPACT) ────────────────────────────
    // Consumes the deterministic projection that agent.service builds when it
    // detects a "what if / discount / offer" intent. Falls back to an inline
    // calculation using the built-in simulation model so this stays answerable
    // even when no Gemini API key is configured.
    if (this.hasAny(q, ['what if', 'if i give', 'if we give', 'what about', 'how about', 'instead', 'discount', 'offer', 'simulate', 'give a', 'kudutha', 'தள்ளுபடி', 'வசதி', 'பரியளிப்பு', 'குறைப்பு', 'छूट', 'ऑफ़र', 'कमी'])) {
      const discountMatch = q.match(/(\d+)\s*%/);
      const discountPct = discountMatch ? parseInt(discountMatch[1], 10) : 10;
      const simulationModel: any = contextData?.simulationModel || { priceElasticity: 1.6, grossMarginPercent: 22, cannibalizationPercent: 30 };
      const regions: any[] = contextData?.regions || [];
      const cityHint = ['coimbatore', 'chennai', 'trichy', 'mumbai'].find(c => q.includes(c));
      const region = (cityHint && regions.find((r: any) => r.name.toLowerCase() === cityHint)) || regions[0] ||
        { name: 'Coimbatore', monthlyVolumeINR: 820000, orders: 388, avgOrderValueINR: 2113, successRatePercent: 97.4 };
      const ordersUpliftPercent = +(discountPct * simulationModel.priceElasticity * 0.6).toFixed(1);
      const netMarginImpactPercent = +(-(discountPct * (1 - (simulationModel.cannibalizationPercent || 30) / 100) * (simulationModel.grossMarginPercent || 22) / 100 * 10)).toFixed(1);
      const projectedRevenueINR = Math.round(region.monthlyVolumeINR * (1 + ordersUpliftPercent / 100) * (1 - discountPct / 100));
      const projectedOrders = Math.round(region.orders * (1 + ordersUpliftPercent / 100));
      const revenueChangeINR = projectedRevenueINR - region.monthlyVolumeINR;
      const verdict = netMarginImpactPercent > -2.5
        ? 'Healthy — projected margin impact is within safe range'
        : 'Aggressive — margin impact is significant; consider a shorter offer window or repeat-customers-only targeting';
      const topic: ActiveTopic = { topic: 'simulation', lastQuestion: query, dataAvailable: true };

      let answer = `Running a ${discountPct}% discount offer in ${region.name} (current monthly volume ₹${region.monthlyVolumeINR.toLocaleString('en-IN')}, ${region.orders} orders): order count is projected to rise ${ordersUpliftPercent}% to ${projectedOrders}, projected monthly revenue ₹${projectedRevenueINR.toLocaleString('en-IN')} (a ${revenueChangeINR >= 0 ? 'gain' : 'loss'} of ₹${Math.abs(revenueChangeINR).toLocaleString('en-IN')}), net margin impact ${netMarginImpactPercent}%. Verdict: ${verdict}.`;
      if (isTamil) {
        answer = `${discountPct}% வசதி ${region.name}-இல் (தற்போதைய மாத வருவாய் ₹${region.monthlyVolumeINR.toLocaleString('en-IN')}, ${region.orders} ஆர்டர்கள்): ஆர்டர் எண்ணிக்கை ${ordersUpliftPercent}% அதிகரிக்கும் (${projectedOrders}), முன்னணுக்கு மாத வருவாய் ₹${projectedRevenueINR.toLocaleString('en-IN')} (₹${Math.abs(revenueChangeINR).toLocaleString('en-IN')} ${revenueChangeINR >= 0 ? 'தெரி' : 'குறைவு'}), இதயப் பாதை ${netMarginImpactPercent}%. முடிவு: ${verdict}.`;
      } else if (isHindi) {
        answer = `${discountPct}% छूट ऑफ़र ${region.name} में (वर्तमान मासिक राजस्व ₹${region.monthlyVolumeINR.toLocaleString('en-IN')}, ${region.orders} आर्डर): आर्डर में ${ordersUpliftPercent}% वृद्धि होगी (${projectedOrders}), प्रोजेक्टेड मासिक राजस्व ₹${projectedRevenueINR.toLocaleString('en-IN')} (₹${Math.abs(revenueChangeINR).toLocaleString('en-IN')} ${revenueChangeINR >= 0 ? 'अतिरिक्त' : 'कमी'}), मार्जिन प्रभाव ${netMarginImpactPercent}%. निष्कर्ष: ${verdict}.`;
      }

      return {
        query,
        answer,
        confidence: 'HIGH',
        toolCalls: [{ tool: 'runSimulation', params: { region: region.name, discountPercent: discountPct } }],
        languageCode: language,
        focusRegion: region.name,
        navigationTarget: '/app/decision-lab',
        activeTopic: topic
      };
    }

        // ── 9. ACTIONABLE RECOMMENDATIONS ───────────────────────────────────────
    // Consumes the recommendationLevers / failureBreakdown that
    // agent.service builds when it detects a "what should I do / improve /
    // recommend" intent, giving concrete, policy-aligned guidance.
    if (this.hasAny(q, ['what should', 'what can i do', 'what can we do', 'improve', 'recommend', 'advice', 'how can', 'how should', 'grow', 'increase revenue', 'boost', 'increase the', 'increase payment', 'reduce', 'reduce failure', 'என்ன செய்வதற்கு', 'என்ன செய்யலாம்', 'பரிந்துதல்', 'வளர்ச்சி', 'சலஹாலு', 'सुझाव', 'क्या करना चाहिए', 'कैसे बढ़ावा', 'क्या कर सकते'])) {
      const levers: string[] = contextData?.recommendationLevers || [
        'Coimbatore (+31%): growth is organic — a 5% loyalty offer for repeat Electronics buyers can compound it',
        'Chennai (highest repeat 64%): run cart-size bundle offers instead of discounts to lift the low AOV (₹1,047)',
        'Trichy (-8%): fix the UPI failure rate via gateway retry, then a targeted 10% new-customer acquisition offer',
        'Mumbai (premium): customers prefer free shipping over discounts; protect the 22% gross margin'
      ];
      const focusRegion: string | undefined = contextData?.focusRegion;
      const mentionsSuccess = this.hasAny(q, ['success', 'fail', 'failure', 'bounce', 'drop', 'declined', 'declines', 'rate']);
      const failureBreakdown: any = contextData?.failureBreakdown;
      const topic: ActiveTopic = { topic: 'recommendations', lastQuestion: query, dataAvailable: true };

      let answer: string;
      if (mentionsSuccess && failureBreakdown) {
        const top = (failureBreakdown.topReasons && failureBreakdown.topReasons[0]) || null;
        const leverText = focusRegion
          ? (levers.find(l => l.toLowerCase().includes(focusRegion.toLowerCase())) || levers.join('\n• '))
          : levers.join('\n• ');
        answer = `Payment success rate is ${failureBreakdown.overallSuccessRatePercent}%.`;
        if (top) answer += ` The top failure cause is "${top.reason}" (${top.sharePercent}% — ${top.note || ''}).`;
        answer += ` Recommended action: ${leverText}.`;
      } else if (focusRegion) {
        const lever = levers.find(l => l.toLowerCase().includes(focusRegion.toLowerCase())) || levers.join('\n• ');
        answer = `For ${focusRegion}: ${lever}`;
      } else {
        answer = `Actionable recommendations:\n• ${levers.join('\n• ')}`;
      }

      if (isTamil) {
        const leverList = levers.slice(0, 2).join('; ');
        answer = `பரிந்துதல்கள்:\n• ${leverList}${focusRegion ? `\n${focusRegion}-ன் குறிப்பிட்ட செயல்பாடு: ${(levers.find(l => l.toLowerCase().includes(focusRegion.toLowerCase())) || leverList)}` : ''}`;
      } else if (isHindi) {
        const leverList = levers.slice(0, 2).join('; ');
        answer = `सुझाव:\n• ${leverList}${focusRegion ? `\n${focusRegion} के लिए: ${(levers.find(l => l.toLowerCase().includes(focusRegion.toLowerCase())) || leverList)}` : ''}`;
      }

      return {
        query,
        answer,
        confidence: 'HIGH',
        toolCalls: [{ tool: 'getRecommendations', params: { focusRegion: focusRegion || null } }],
        languageCode: language,
        focusRegion: focusRegion,
        navigationTarget: focusRegion ? '/app/map' : '/app/dashboard',
        activeTopic: topic
      };
    }

    // ── 10. FALLBACK MISSING DATA ────────────────────────────────────────────
    const kpis = contextData?.kpis;
    let answer = `Your month so far is ₹${(kpis?.monthlyRevenueINR || 1240000).toLocaleString('en-IN')} revenue, ${kpis?.overallSuccessRatePercent ?? 96.8} percent success, and ₹${(kpis?.monthlyProfitINR || 272800).toLocaleString('en-IN')} profit. Ask about yesterday, a city, failures, settlements, or a discount, and I will go deeper.`;
    if (isTamil) answer = `இந்த மாதம் ₹${(kpis?.monthlyRevenueINR || 1240000).toLocaleString('en-IN')} வருவாய், வெற்றி ${kpis?.overallSuccessRatePercent ?? 96.8} சதவீதம். நேற்று, நகரம், தோல்வி அல்லது தள்ளுபடி பற்றி கேளுங்கள்.`;
    else if (isHindi) answer = `इस महीने राजस्व ₹${(kpis?.monthlyRevenueINR || 1240000).toLocaleString('en-IN')} है, सफलता ${kpis?.overallSuccessRatePercent ?? 96.8} प्रतिशत. कल, शहर, फेलियर या छूट पूछ सकते हैं.`;

    return {
      query,
      answer,
      confidence: 'MEDIUM',
      toolCalls: [{ tool: 'getFinancialTelemetry', params: {} }],
      languageCode: language
    };
  }

  private resolveActiveTopic(query: string, answer: string, previousTopic?: ActiveTopic): ActiveTopic {
    const q = query.toLowerCase();
    if (this.hasAny(q, ['yesterday', 'நேற்று', 'நேற்றைய', 'कल'])) {
      return { topic: 'yesterday_revenue', lastQuestion: query, dataAvailable: true, lastAnswer: answer };
    }
    if (this.hasAny(q, ['today', 'collection', 'இன்னைக்கு', 'வசூல்', 'आज', 'कलेक्शन'])) {
      return { topic: 'today_collection', lastQuestion: query, dataAvailable: true, lastAnswer: answer };
    }
    if (this.hasAny(q, ['coimbatore', 'கோயம்புத்தூர்', 'கோவை', 'कोयंबटूर'])) {
      return { topic: 'coimbatore', lastQuestion: query, dataAvailable: true, lastAnswer: answer };
    }
    if (this.hasAny(q, ['chennai', 'சென்னை', 'चेन्नई'])) {
      return { topic: 'chennai', lastQuestion: query, dataAvailable: true, lastAnswer: answer };
    }
    if (this.hasAny(q, ['fail', 'failure', 'தோல்வி', 'ஃபெயில்', 'विफल'])) {
      return { topic: 'payment_failures', lastQuestion: query, dataAvailable: true, lastAnswer: answer };
    }
    if (this.hasAny(q, ['profit', 'margin', 'லாபம்', 'லாப', 'இலாபம்', 'लाभ'])) {
      return { topic: 'monthly_profit', lastQuestion: query, dataAvailable: true, lastAnswer: answer };
    }
    return previousTopic || { topic: 'general_query', lastQuestion: query, lastAnswer: answer };
  }

  private hasAny(q: string, keywords: string[]): boolean {
    return keywords.some(kw => q.includes(kw.toLowerCase()));
  }
}
