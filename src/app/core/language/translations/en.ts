/**
 * English translations — base/fallback for all intent keys.
 * Every intent key used in the application MUST exist here.
 */
export const en: Record<string, string> = {
  // ── Dhwani greeting ──────────────────────────────────────────────────────
  'dhwani.subtitle': 'Speak naturally. I\'ll find the answer.',
  'dhwani.footer': 'Supports 22 Indian languages. Using browser speech recognition.',
  'dhwani.no_logs': 'No conversation yet',
  'dhwani.no_logs_hint': 'Tap the mic or type a question below.',
  'dhwani.sender.user': 'You',
  'dhwani.sender.dhwani': 'Dhwani',
  'dhwani.listening': 'Listening… tap to stop',
  'dhwani.hold_to_speak': 'Tap to speak',
  'dhwani.processing': 'Understanding your question…',
  'dhwani.speaking': 'Speaking…',
  'dhwani.error.mic': 'Microphone access denied. Please allow microphone permission.',
  'dhwani.error.unsupported': 'Voice not supported in this browser. Please use Chrome or Edge.',
  'dhwani.error.no_speech': 'No speech detected. Please try again.',
  'dhwani.type_placeholder': 'Type your question here…',
  'dhwani.send': 'Send',

  // ── Language selector label ───────────────────────────────────────────────
  'language.selector.label': 'LANGUAGE',

  // ── Navigation ────────────────────────────────────────────────────────────
  'nav.home': 'Home',
  'nav.payments': 'My Payments',
  'nav.customers': 'My Customers',
  'nav.map': 'Where Am I Growing?',
  'nav.decision_lab': 'Try Before You Decide',
  'nav.insights': 'What Should I Do?',
  'nav.regions': 'Region Insights',
  'nav.settings': 'Settings',

  // ── Home screen ───────────────────────────────────────────────────────────
  'home.greeting.morning': 'Good morning',
  'home.greeting.afternoon': 'Good afternoon',
  'home.greeting.evening': 'Good evening',
  'home.how_can_i_help': 'How can I help you today?',
  'home.tap.money': 'Money',
  'home.tap.orders': 'Orders',
  'home.tap.where': 'Where?',
  'home.tap.problem': 'Any problem?',
  'home.tap.advice': 'What to do?',
  'home.simple_mode': 'Simple Mode',
  'home.standard_mode': 'Standard Mode',
  'home.voice_hint': 'Tap to speak',

  // ── Simple mode card labels ───────────────────────────────────────────────
  'simple.money.label': 'MONEY RECEIVED',
  'simple.orders.label': 'ORDERS',
  'simple.watch.label': 'SOMETHING TO WATCH',
  'simple.best_area.label': 'BEST AREA',
  'simple.advice.label': 'WHAT YOU CAN DO',

  // ── Metric plain-language explanations ───────────────────────────────────
  'metric.explain.success_rate': 'Out of every 100 payment attempts, around {{value}} were successful.',
  'metric.explain.revenue': 'You received ₹{{value}} in total payments.',
  'metric.explain.rto': 'About {{value}} out of every 100 orders were returned after delivery.',
  'metric.explain.growth': 'You received more money {{period}} than before — about {{value}} more.',
  'metric.explain.failed': '{{value}} payments did not go through. Most common reason: {{reason}}.',
  'metric.explain.customers': 'You have {{value}} customers who have made at least one payment.',
  'metric.explain.repeat': '{{value}} customers came back to buy again.',

  // ── Quick suggestions ─────────────────────────────────────────────────────
  'suggestion.coimbatore_revenue': 'How is Coimbatore doing?',
  'suggestion.routing_opportunities': 'What can I do to improve?',
  'suggestion.upi_vs_card': 'Which payment method is working best?',
  'suggestion.how_is_business': 'How is my business doing?',
  'suggestion.best_region': 'Which city is doing best?',
  'suggestion.try_discount': 'What if I give 10% discount in Coimbatore?',

  // ── Sample STT simulation commands ────────────────────────────────────────
  'sample.command.1': 'How is my business doing this week?',
  'sample.command.2': 'Show me Coimbatore revenue',
  'sample.command.3': 'Which city has the most customers?',
  'sample.command.4': 'Why did Trichy payments decrease?',
  'sample.command.5': 'What if I give repeat customers a 10% discount?',

  // ── Agent intent responses ────────────────────────────────────────────────
  'response.coimbatore.revenue':
    'Coimbatore is doing great! You received ₹8.2 lakh this month — that is 31% more than last month. It is your best-performing city right now.',
  'response.tn.failure':
    'Payments in Tamil Nadu dropped a little this week — about 2 out of every 100 payments failed. The main reason is a slowdown in one of the payment networks. You can try routing through a different gateway to fix this.',
  'response.routing.opportunity':
    'I found 2 ways to improve your payments. First, switching international cards to a different gateway can improve success by 3.4%. Second, routing bank transfers through Razorpay directly can improve success by 1.5%.',
  'response.high_value':
    'You had 14 large payments above ₹10,000 today. 12 went through successfully, and 2 did not go through because the customers did not have enough balance.',
  'response.upi_vs_card':
    'UPI payments are doing better right now — 82 out of 100 UPI payments are successful. Card payments are a bit lower at 77 out of 100.',
  'response.fallback':
    'I understand your question. Let me show you the relevant information on your screen.',
  'response.business_overview':
    'Your business is doing well overall. You received ₹12.4 lakh this month — that is 18% more than last month. You have 2,841 orders and most payments are going through successfully.',
  'response.trichy.down':
    'Trichy had fewer payments this week — about 8% less than last week. The main reason seems to be fewer new customers visiting. Coimbatore and Chennai are growing well to make up for it.',
  'response.best_region':
    'Coimbatore is your best city right now — most customers and fastest growth. Chennai is also growing well. I have opened the map so you can see all your cities.',
  'response.what_to_do':
    'Here are 2 things you can do: First, try a small offer for repeat customers in Coimbatore — they are your most loyal buyers. Second, your payments in Trichy dropped — a small promotion there could help bring customers back.',
  'response.simulation.preview':
    'Let me run a quick estimate for you. I will show you what might happen if you try that.',
  'response.customers.overview':
    'You have 8,291 customers. About 62% of them have bought from you more than once. Your best customers are spending an average of ₹4,500 per order.',

  // ── Simulation output ─────────────────────────────────────────────────────
  'simulation.title': 'IF YOU TRY THIS FOR {{duration}} DAYS',
  'simulation.money.label': 'MONEY RECEIVED',
  'simulation.money.up': 'May increase by ₹{{amount}}',
  'simulation.money.down': 'May decrease by ₹{{amount}}',
  'simulation.orders.label': 'ORDERS',
  'simulation.orders.up': 'May increase by about {{count}}',
  'simulation.orders.down': 'May decrease by about {{count}}',
  'simulation.returns.label': 'RETURNS',
  'simulation.returns.slight_increase': 'May increase slightly',
  'simulation.returns.stable': 'Should stay about the same',
  'simulation.recommendation.label': 'BETTER IDEA',
  'simulation.disclaimer': 'These are estimates based on past data. Actual results may vary.',
  'simulation.run': 'Run Simulation',
  'simulation.running': 'Running estimate…',
  'simulation.new': 'Try Something Else',
  'simulation.voice_intro': 'Tell me what you want to try. For example: "Give repeat customers in Coimbatore a 10% discount"',

  // ── Decision Lab UI ───────────────────────────────────────────────────────
  'decisionlab.title': 'Try Before You Decide',
  'decisionlab.subtitle': 'Test a business idea before you do it. See what might happen.',
  'decisionlab.input.label': 'What do you want to try?',
  'decisionlab.input.placeholder': 'e.g. "Give repeat customers in Coimbatore a 10% discount for 30 days"',
  'decisionlab.or_fill_form': 'Or fill the form below',
  'decisionlab.region.label': 'City or Region',
  'decisionlab.segment.label': 'Which Customers',
  'decisionlab.discount.label': 'Discount Amount',
  'decisionlab.duration.label': 'How Many Days',

  // ── Opportunities / What Should I Do ─────────────────────────────────────
  'opportunities.title': 'What Should I Do?',
  'opportunities.subtitle': 'Actions that can help your business grow.',
  'opportunities.impact.success_rate': 'More payments will go through',
  'opportunities.impact.cost_saving': 'You will save money',
  'opportunities.impact.latency': 'Payments will be faster',
  'opportunities.difficulty.low': 'Easy to do',
  'opportunities.difficulty.medium': 'Moderate effort',
  'opportunities.difficulty.high': 'Needs planning',
  'opportunities.apply': 'Apply this',
  'opportunities.applied': 'Done ✓',
  'opportunities.ignore': 'Skip',

  // ── Auth ─────────────────────────────────────────────────────────────────
  'auth.passkey.button': 'Sign in with device',
  'auth.passkey.hint': 'Use your fingerprint, face or PIN',
  'auth.passkey.unsupported': 'Device sign-in is not available on this browser.',
  'auth.or': 'or',
  'auth.email.label': 'Email',
  'auth.password.label': 'Password',
  'auth.signin': 'Sign in',
  'auth.google': 'Continue with Google',
  'auth.no_account': 'New here?',
  'auth.create_account': 'Create account',

  // ── Settings ─────────────────────────────────────────────────────────────
  'settings.title': 'Settings',
  'settings.language.section': 'Language',
  'settings.interaction.section': 'How You Want to Interact',
  'settings.mode.section': 'Display Mode',
  'settings.voice_mode': 'Voice',
  'settings.text_mode': 'Text',
  'settings.tap_mode': 'Tap',
  'settings.simple_mode': 'Simple',
  'settings.standard_mode': 'Standard',
  'settings.detailed_mode': 'Detailed',
  'settings.large_text': 'Large Text',
  'settings.save': 'Save Preferences',
  'settings.saved': 'Saved!',
};
