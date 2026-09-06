/**
 * Hindi (hi-IN) translations.
 * Keys must match those in en.ts. Missing keys fall back to English automatically.
 */
export const hi: Record<string, string> = {
  // ── Dhwani ──────────────────────────────────────────────────────────────
  'dhwani.subtitle': 'स्वाभाविक रूप से बोलें। मैं जवाब ढूंढ लूंगा।',
  'dhwani.footer': '22 भारतीय भाषाओं का समर्थन करता है।',
  'dhwani.no_logs': 'अभी तक कोई बातचीत नहीं',
  'dhwani.no_logs_hint': 'माइक दबाएं या नीचे टाइप करें।',
  'dhwani.sender.user': 'आप',
  'dhwani.sender.dhwani': 'Dhwani',
  'dhwani.listening': 'सुन रहा हूं… रोकने के लिए दबाएं',
  'dhwani.hold_to_speak': 'बोलने के लिए दबाएं',
  'dhwani.processing': 'समझ रहा हूं…',
  'dhwani.speaking': 'बोल रहा हूं…',
  'dhwani.error.mic': 'माइक्रोफ़ोन की अनुमति नहीं है। कृपया अनुमति दें।',
  'dhwani.error.unsupported': 'इस ब्राउज़र में आवाज़ काम नहीं करती। Chrome या Edge का उपयोग करें।',
  'dhwani.error.no_speech': 'कोई आवाज़ नहीं मिली। फिर से कोशिश करें।',
  'dhwani.type_placeholder': 'यहाँ अपना सवाल टाइप करें…',
  'dhwani.send': 'भेजें',

  // ── Navigation ────────────────────────────────────────────────────────────
  'nav.home': 'होम',
  'nav.payments': 'मेरे भुगतान',
  'nav.customers': 'मेरे ग्राहक',
  'nav.map': 'मैं कहाँ बढ़ रहा हूं?',
  'nav.decision_lab': 'करने से पहले आज़माएं',
  'nav.insights': 'मुझे क्या करना चाहिए?',
  'nav.regions': 'क्षेत्र की जानकारी',
  'nav.settings': 'सेटिंग्स',

  // ── Language selector ─────────────────────────────────────────────────────
  'language.selector.label': 'भाषा',

  // ── Home screen ───────────────────────────────────────────────────────────
  'home.greeting.morning': 'सुप्रभात',
  'home.greeting.afternoon': 'नमस्ते',
  'home.greeting.evening': 'शुभ संध्या',
  'home.how_can_i_help': 'आज मैं आपकी कैसे मदद कर सकता हूं?',
  'home.tap.money': 'पैसे',
  'home.tap.orders': 'ऑर्डर',
  'home.tap.where': 'कहाँ?',
  'home.tap.problem': 'कोई समस्या?',
  'home.tap.advice': 'क्या करूं?',
  'home.simple_mode': 'सरल दृश्य',
  'home.standard_mode': 'विस्तृत दृश्य',
  'home.voice_hint': 'बोलने के लिए दबाएं',

  // ── Simple mode ───────────────────────────────────────────────────────────
  'simple.money.label': 'मिले पैसे',
  'simple.orders.label': 'ऑर्डर',
  'simple.watch.label': 'ध्यान देने योग्य',
  'simple.best_area.label': 'सबसे अच्छा क्षेत्र',
  'simple.advice.label': 'आप कर सकते हैं',

  // ── Quick suggestions ─────────────────────────────────────────────────────
  'suggestion.yesterday_revenue': 'कल का राजस्व कितना था?',
  'suggestion.coimbatore_revenue': 'कोयंबटूर कैसा चल रहा है?',
  'suggestion.routing_opportunities': 'मुझे क्या करना चाहिए?',
  'suggestion.upi_vs_card': 'कौन सा payment तरीका बेहतर है?',
  'suggestion.how_is_business': 'मेरा व्यवसाय कैसा चल रहा है?',
  'suggestion.best_region': 'कौन सा शहर सबसे अच्छा है?',
  'suggestion.try_discount': 'कोयंबटूर में 10% छूट दूं तो क्या होगा?',

  // ── Sample commands ───────────────────────────────────────────────────────
  'sample.command.1': 'इस हफ्ते मेरा व्यवसाय कैसा चल रहा है?',
  'sample.command.2': 'कोयंबटूर की कमाई दिखाओ',
  'sample.command.3': 'किस शहर में सबसे ज्यादा ग्राहक हैं?',
  'sample.command.4': 'त्रिची में भुगतान क्यों कम हुआ?',
  'sample.command.5': 'नियमित ग्राहकों को 10% छूट दूं तो?',

  // ── Agent responses ───────────────────────────────────────────────────────
  'response.coimbatore.revenue':
    'कोयंबटूर बहुत अच्छा चल रहा है! इस महीने ₹8.2 लाख मिले — पिछले महीने से 31% ज्यादा। यह आपका सबसे अच्छा शहर है।',
  'response.tn.failure':
    'तमिलनाडु में इस हफ्ते भुगतान थोड़ा कम हुआ — 100 में से लगभग 2 भुगतान नहीं हुए। एक payment network में थोड़ी समस्या है। दूसरे gateway से भेजने पर सुधार होगा।',
  'response.routing.opportunity':
    'आपके payments बेहतर बनाने के दो तरीके हैं। पहला: international cards को दूसरे gateway पर भेजें — 3.4% ज्यादा सफल होंगे। दूसरा: bank transfers को सीधे route करें — 1.5% ज्यादा सफल होंगे।',
  'response.high_value':
    'आज ₹10,000 से ज्यादा के 14 बड़े भुगतान थे। 12 सफल रहे, 2 ग्राहकों के पास पर्याप्त बैलेंस नहीं था इसलिए नहीं हुए।',
  'response.upi_vs_card':
    'UPI भुगतान अभी बेहतर हैं — 100 में से 82 सफल। Card भुगतान थोड़े कम — 100 में से 77 सफल।',
  'response.fallback':
    'आपका सवाल समझ गया। आपकी स्क्रीन पर संबंधित जानकारी दिखा रहा हूं।',
  'response.business_overview':
    'आपका व्यवसाय अच्छा चल रहा है। इस महीने ₹12.4 लाख मिले — पहले से 18% ज्यादा। 2,841 ऑर्डर आए हैं, ज्यादातर भुगतान सफलतापूर्वक हो रहे हैं।',
  'response.monthly_profit':
    'इस महीने आपको ₹12.4 लाख राजस्व पर ₹2,72,800 का लाभ हुआ, 22% मार्जिन। कोयंबटूर ₹1,80,400 के साथ सबसे अधिक लाभदायक है।',
  'response.trichy.down':
    'त्रिची में इस हफ्ते थोड़े कम भुगतान आए — पिछले हफ्ते से 8% कम। नए ग्राहक कम आ रहे हैं यही मुख्य कारण है। कोयंबटूर और चेन्नई अच्छे से बढ़ रहे हैं।',
  'response.best_region':
    'कोयंबटूर अभी आपका सबसे अच्छा शहर है — सबसे ज्यादा ग्राहक और तेज़ विकास। चेन्नई भी अच्छा बढ़ रहा है। मानचित्र पर सभी शहर दिखा रहा हूं।',
  'response.what_to_do':
    'दो काम कर सकते हैं: पहला, कोयंबटूर में नियमित ग्राहकों को छोटी छूट दें — वे आपके सबसे वफादार ग्राहक हैं। दूसरा, त्रिची में भुगतान कम हुए — एक छोटा ऑफर ग्राहकों को वापस ला सकता है।',
  'response.simulation.preview':
    'मैं आपके लिए एक त्वरित अनुमान लगाता हूं। अगर आप ऐसा करते हैं तो क्या हो सकता है वह दिखाता हूं।',
  'response.customers.overview':
    'आपके 8,291 ग्राहक हैं। उनमें से 62% ने एक से ज्यादा बार खरीदा है। बेहतरीन ग्राहक औसतन ₹4,500 खर्च करते हैं।',

  // ── Simulation ────────────────────────────────────────────────────────────
  'simulation.title': 'अगर आप यह {{duration}} दिन करें',
  'simulation.money.label': 'मिलने वाले पैसे',
  'simulation.money.up': 'लगभग ₹{{amount}} ज्यादा मिल सकते हैं',
  'simulation.orders.label': 'ऑर्डर',
  'simulation.orders.up': 'लगभग {{count}} ज्यादा हो सकते हैं',
  'simulation.returns.label': 'वापसी',
  'simulation.returns.slight_increase': 'थोड़ी बढ़ सकती है',
  'simulation.recommendation.label': 'बेहतर सुझाव',
  'simulation.disclaimer': 'ये अनुमान पिछले डेटा पर आधारित हैं। असल नतीजे अलग हो सकते हैं।',
  'simulation.run': 'अनुमान लगाएं',
  'simulation.running': 'अनुमान लगा रहा हूं…',
  'simulation.new': 'कुछ और आज़माएं',
  'simulation.voice_intro': 'बताएं आप क्या करना चाहते हैं। जैसे: "कोयंबटूर में नियमित ग्राहकों को 10% छूट दूं"',

  // ── Decision Lab ──────────────────────────────────────────────────────────
  'decisionlab.title': 'करने से पहले आज़माएं',
  'decisionlab.subtitle': 'एक विचार को असल में करने से पहले देखें क्या होगा।',
  'decisionlab.input.label': 'आप क्या करना चाहते हैं?',
  'decisionlab.input.placeholder': 'जैसे: "कोयंबटूर में नियमित ग्राहकों को 30 दिन के लिए 10% छूट दूं"',

  // ── Opportunities ─────────────────────────────────────────────────────────
  'opportunities.title': 'मुझे क्या करना चाहिए?',
  'opportunities.subtitle': 'वो काम जो आपके व्यवसाय को बढ़ाने में मदद कर सकते हैं।',
  'opportunities.apply': 'यह करें',
  'opportunities.applied': 'हो गया ✓',
  'opportunities.ignore': 'छोड़ें',
};
