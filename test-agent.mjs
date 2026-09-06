import { GeminiOrchestrator } from './packages/ai-agent/dist/index.js';

// No API key in this env -> deterministic fallback path is exercised.
const orch = new GeminiOrchestrator();

const questions = [
  // English
  ['en', "What is today's collection?"],
  ['en', "What was yesterday's revenue?"],
  ['en', "How is Coimbatore performing this month?"],
  ['en', "What are the payment method shares - UPI vs Card?"],
  ['en', "What should I do to improve the payment success rate?"],
  ['en', "What if I give a 15% discount?"],
  ['en', "What are the payment failure reasons?"],
  ['en', "What was last month's revenue?"],
  ['en', "Tell me about Chennai's payment health"],
  ['en', "Why did you say yesterday's revenue is missing? Can you explain that?"],
  // Tamil
  ['ta', "இன்றைய வசூல் எவ்வளவு?"],
  ['ta', "நேற்று revenue எவ்வளவு?"],
];

for (const [lang, q] of questions) {
  const res = await orch.processQuery(q, {}, lang);
  console.log('==========');
  console.log(`LANG: ${lang} | Q: ${q}`);
  console.log(`CONF: ${res.confidence} | TOPIC: ${res.activeTopic?.topic}`);
  console.log(`A: ${res.answer}`);
  if (res.suggestedActions?.length) console.log('ACTIONS:', JSON.stringify(res.suggestedActions));
}
