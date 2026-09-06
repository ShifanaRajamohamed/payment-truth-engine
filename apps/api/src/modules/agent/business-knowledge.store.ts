/**
 * In-memory merchant knowledge base used by the voice agent.
 * Figures evolve through the day so follow-up questions stay consistent
 * with a live demo ledger, without an external database.
 */
export type KnowledgeSnapshot = ReturnType<typeof getBusinessKnowledge>;

function round(n: number, d = 0): number {
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}

function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

/** Minutes since local midnight — drives "live" collection growth. */
function minutesToday(now: Date): number {
  return now.getHours() * 60 + now.getMinutes();
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildDailySeries(now: Date, monthToDate: number): Array<{
  date: string;
  label: string;
  revenueINR: number;
  orders: number;
  successRatePercent: number;
}> {
  const series = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(12, 0, 0, 0);
    const wave = 1 + 0.08 * Math.sin((d.getDate() / 31) * Math.PI * 2);
    const weekend = [0, 6].includes(d.getDay()) ? 0.82 : 1;
    const revenueINR = Math.round((monthToDate / 30) * wave * weekend);
    series.push({
      date: dateKey(d),
      label: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
      revenueINR,
      orders: Math.round(revenueINR / 966),
      successRatePercent: round(95.4 + (d.getDate() % 5) * 0.4, 1)
    });
  }
  return series;
}

export function getBusinessKnowledge(now = new Date()) {
  const mins = minutesToday(now);
  const progress = Math.min(mins / (22 * 60), 1); // ramp until 10 PM

  const kpis = {
    monthlyRevenueINR: 1240000,
    monthlyGrowthPercent: 18,
    previousMonthCalculatedINR: 1050847,
    overallSuccessRatePercent: 96.8,
    totalOrdersThisMonth: 1284,
    avgOrderValueINR: 966,
    activeCustomers: 1873,
    newCustomersThisMonth: 214,
    repeatCustomerSharePercent: 61,
    grossMarginPercent: 22,
    monthlyProfitINR: 272800,
    profitMarginPercent: 22,
    gstCollectedINR: 223200,
    refundsThisMonthINR: 18400,
    chargebacksThisMonth: 2,
    pendingSettlementsINR: 86000
  };

  const todayCollectionINR = Math.round(48000 + progress * 142000);
  const todayTransactionsCount = Math.round(18 + progress * 86);
  const yesterday = (() => {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return d;
  })();

  const yesterdayRevenueINR = 118400;
  const yesterdayOrders = 124;
  const yesterdaySuccessRatePercent = 97.1;

  const hourlyToday = Array.from({ length: Math.min(now.getHours() + 1, 24) }, (_, hour) => {
    const peak = hour >= 19 && hour <= 22 ? 1.7 : hour >= 12 && hour <= 14 ? 1.25 : 0.7;
    const revenueINR = Math.round(3200 * peak * (hour === now.getHours() ? (now.getMinutes() / 60) : 1));
    return { hour, label: `${hour.toString().padStart(2, '0')}:00`, revenueINR, orders: Math.max(1, Math.round(revenueINR / 980)) };
  });

  const regions = [
    { name: 'Coimbatore', state: 'Tamil Nadu', monthlyVolumeINR: 820000, growthPercent: 31, status: 'growing',
      orders: 388, customers: 512, avgOrderValueINR: 2113, repeatRatePercent: 58,
      successRatePercent: 97.4, topCategories: ['Electronics', 'Fashion'],
      insight: 'Fastest-growing city; growth driven by repeat electronics buyers; peak hours 8-11 PM' },
    { name: 'Chennai', state: 'Tamil Nadu', monthlyVolumeINR: 310000, growthPercent: 9, status: 'stable',
      orders: 296, customers: 441, avgOrderValueINR: 1047, repeatRatePercent: 64,
      successRatePercent: 96.1, topCategories: ['Groceries', 'Fashion'],
      insight: 'Stable mature market with the highest repeat rate; AOV is low — bundle offers could lift basket size' },
    { name: 'Trichy', state: 'Tamil Nadu', monthlyVolumeINR: 110000, growthPercent: -8, status: 'declining',
      orders: 121, customers: 203, avgOrderValueINR: 909, repeatRatePercent: 41,
      successRatePercent: 93.2, topCategories: ['Groceries'],
      insight: 'Declining due to weak new-customer acquisition and a higher failure rate after a local bank outage' },
    { name: 'Madurai', state: 'Tamil Nadu', monthlyVolumeINR: 180000, growthPercent: 2, status: 'stable',
      orders: 148, customers: 278, avgOrderValueINR: 1216, repeatRatePercent: 55,
      successRatePercent: 94.8, topCategories: ['Textiles', 'Groceries'],
      insight: 'Returns ticked up this week; otherwise stable' },
    { name: 'Mumbai', state: 'Maharashtra', monthlyVolumeINR: 980000, growthPercent: 12, status: 'growing',
      orders: 402, customers: 487, avgOrderValueINR: 2438, repeatRatePercent: 55,
      successRatePercent: 96.9, topCategories: ['Electronics', 'Home'],
      insight: 'Largest volume city; high AOV; premium segment responds well to free-shipping offers rather than discounts' },
    { name: 'Bengaluru', state: 'Karnataka', monthlyVolumeINR: 540000, growthPercent: 14, status: 'growing',
      orders: 261, customers: 390, avgOrderValueINR: 2069, repeatRatePercent: 52,
      successRatePercent: 97.0, topCategories: ['Electronics', 'Fashion'],
      insight: 'Strong weekday lunch-hour UPI traffic from office parks' },
    { name: 'Delhi NCR', state: 'Delhi', monthlyVolumeINR: 410000, growthPercent: 6, status: 'stable',
      orders: 198, customers: 310, avgOrderValueINR: 2070, repeatRatePercent: 49,
      successRatePercent: 95.6, topCategories: ['Fashion', 'Home'],
      insight: 'COD share is higher than other metros; prepaid conversion is the lever' }
  ];

  const dailySeries = buildDailySeries(now, kpis.monthlyRevenueINR);
  dailySeries[dailySeries.length - 2] = {
    date: dateKey(yesterday),
    label: yesterday.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
    revenueINR: yesterdayRevenueINR,
    orders: yesterdayOrders,
    successRatePercent: yesterdaySuccessRatePercent
  };

  return {
    merchant: {
      name: 'Dhwani Enterprise',
      category: 'Multi-category retail + online checkout',
      settlementBank: 'HDFC Bank',
      gateway: 'Razorpay',
      dataAsOf: now.toISOString(),
      timezone: 'Asia/Kolkata',
      note: 'Demo ledger. Figures evolve through the day and stay internally consistent.'
    },
    kpis,
    formatted: {
      monthlyRevenue: inr(kpis.monthlyRevenueINR),
      monthlyProfit: inr(kpis.monthlyProfitINR),
      todayCollection: inr(todayCollectionINR),
      yesterdayRevenue: inr(yesterdayRevenueINR)
    },
    today: {
      collectionINR: todayCollectionINR,
      transactionsCount: todayTransactionsCount,
      successRatePercent: 98.1,
      pendingINR: 12400,
      peakHour: '20:00–22:00',
      hourly: hourlyToday
    },
    yesterday: {
      date: dateKey(yesterday),
      revenueINR: yesterdayRevenueINR,
      orders: yesterdayOrders,
      successRatePercent: yesterdaySuccessRatePercent,
      topCity: 'Coimbatore',
      failedPayments: 4,
      topFailureReason: 'Bank network timeout'
    },
    lastWeek: {
      revenueINR: 286000,
      orders: 301,
      growthVsPriorWeekPercent: 7.4
    },
    dailySeries,
    monthlyRevenueTrendINR: [
      { month: 'Apr', revenue: 890000 }, { month: 'May', revenue: 945000 },
      { month: 'Jun', revenue: 1012000 }, { month: 'Jul', revenue: 998000 },
      { month: 'Aug', revenue: 1050847 }, { month: 'Sep', revenue: 1240000 }
    ],
    regions,
    customerSegments: {
      new: { count: 731, sharePercent: 39, avgOrderValueINR: 720 },
      repeat: { count: 1142, sharePercent: 61, avgOrderValueINR: 1120 },
      highValue: { count: 168, sharePercent: 9, avgOrderValueINR: 3480, note: 'Top 9% of customers contribute 34% of revenue' }
    },
    topCustomers: [
      { name: 'Aditya Sharma', city: 'Coimbatore', lifetimeINR: 1254000, orders: 42, status: 'repeat' },
      { name: 'Rohan Murthy', city: 'Bengaluru', lifetimeINR: 4245000, orders: 61, status: 'repeat' },
      { name: 'Meera Deshmukh', city: 'Madurai', lifetimeINR: 3195000, orders: 38, status: 'repeat' }
    ],
    paymentMethodMixPercent: { UPI: 62, Card: 21, Netbanking: 11, Wallet: 6 },
    paymentMethodHealth: [
      { method: 'UPI', successRatePercent: 97.8, volumeINR: 768800, avgLatencyMs: 980 },
      { method: 'Card', successRatePercent: 94.1, volumeINR: 260400, avgLatencyMs: 2100 },
      { method: 'Netbanking', successRatePercent: 91.6, volumeINR: 136400, avgLatencyMs: 3400 },
      { method: 'Wallet', successRatePercent: 96.2, volumeINR: 74400, avgLatencyMs: 1200 }
    ],
    failureBreakdown: {
      overallFailureRatePercent: 3.2,
      failedCountThisMonth: 41,
      topReasons: [
        { reason: 'Bank network timeout', sharePercent: 41, errorCode: 'GATEWAY_TIMEOUT', note: 'Concentrated in Trichy after local bank outage' },
        { reason: 'Insufficient funds', sharePercent: 27, errorCode: 'INSUFFICIENT_FUNDS', note: 'Mostly first-time card users' },
        { reason: 'User abandoned OTP', sharePercent: 18, errorCode: 'OTP_EXPIRED', note: 'Card 3DS drop-off' },
        { reason: 'Gateway decline', sharePercent: 14, errorCode: 'ISSUER_DECLINED', note: 'Random issuer declines, retry succeeds 60%' }
      ]
    },
    settlements: {
      cycle: 'T+1 for UPI, T+2 for cards',
      lastSettledINR: 97200,
      lastSettledAt: new Date(now.getTime() - 11 * 3600000).toISOString(),
      nextExpectedAt: 'tomorrow 11:00 IST',
      pendingINR: kpis.pendingSettlementsINR,
      bank: 'HDFC',
      lastUtr: 'HDFC329104882194'
    },
    refunds: {
      thisMonthCount: 11,
      thisMonthINR: kpis.refundsThisMonthINR,
      avgHoursToRefund: 6.4,
      openDisputes: 1
    },
    incidents: [
      { id: 'ORD-12499', title: 'Payment captured, store still unpaid', status: 'open', amountINR: 12499, rootCause: 'Webhook HTTP 504 after 3 retries' },
      { id: 'ORD-12502', title: 'Bank settlement lag', status: 'monitoring', amountINR: 8900, rootCause: 'UTR not yet posted' },
      { id: 'ORD-12510', title: 'Customer double-charge risk', status: 'open', amountINR: 2499, rootCause: 'Stalled cart after first debit' }
    ],
    cityDirectory: [
      { name: 'Coimbatore', tamil: 'கோயம்புத்தூர்', hindi: 'कोयंबटूर', state: 'Tamil Nadu' },
      { name: 'Chennai', tamil: 'சென்னை', hindi: 'चेन्नई', state: 'Tamil Nadu' },
      { name: 'Trichy', tamil: 'திருச்சி', hindi: 'त्रिची', state: 'Tamil Nadu' },
      { name: 'Madurai', tamil: 'மதுரை', hindi: 'मदुरै', state: 'Tamil Nadu' },
      { name: 'Mumbai', tamil: 'மும்பை', hindi: 'मुंबई', state: 'Maharashtra' },
      { name: 'Bengaluru', tamil: 'பெங்களூரு', hindi: 'बेंगलुरु', state: 'Karnataka' },
      { name: 'Delhi NCR', tamil: 'டெல்லி என்சிஆர்', hindi: 'दिल्ली एनसीआर', state: 'Delhi' }
    ],
    yesterdayOffers: [
      {
        name: 'Coimbatore repeat 5% UPI offer',
        city: 'Coimbatore',
        discountPercent: 5,
        extraOrders: 42,
        extraProfitINR: 18600,
        profitable: true,
        note: 'Repeat electronics buyers, 8–11 PM'
      },
      {
        name: 'Chennai grocery bundle (no price cut)',
        city: 'Chennai',
        discountPercent: 0,
        extraOrders: 18,
        extraProfitINR: 9200,
        profitable: true,
        note: 'Cart-size bundle instead of discount'
      },
      {
        name: 'Trichy 10% new-customer offer',
        city: 'Trichy',
        discountPercent: 10,
        extraOrders: 9,
        extraProfitINR: -2400,
        profitable: false,
        note: 'Discount deeper than the 22% margin after failures'
      }
    ],
    festiveCalendar: [
      { name: 'Onam window', impact: 'Kerala / Tamil Nadu grocery lift ~12%' },
      { name: 'Navratri / festive electronics', impact: 'Coimbatore and Mumbai electronics peak 8–11 PM' }
    ],
    simulationModel: {
      priceElasticity: 1.6,
      grossMarginPercent: 22,
      cannibalizationPercent: 30,
      repeatPurchaseLift: 'Repeat customers order ~1.4x more often during offer windows'
    },
    recommendationLevers: [
      'Coimbatore (+31%): increase inventory for Electronics before festive demand; a 5% loyalty offer for repeat buyers can compound growth',
      'Chennai (highest repeat 64%): run cart-size bundle offers (AOV only ₹1,047) instead of discounts',
      'Trichy (-8%): first fix the UPI failure rate with gateway retry, then a targeted 10% new-customer acquisition offer',
      'Mumbai: premium customers prefer free shipping over discounts; protect the 22% gross margin',
      'Madurai: watch returns; do not discount blindly'
    ],
    sampleQuestions: [
      'How is my business doing?',
      'What was yesterday\'s revenue?',
      'How much did I collect today?',
      'Why are payments failing in Trichy?',
      'Compare UPI and cards',
      'When will HDFC settle?',
      'Status of order ORD-12499',
      'What if I give 10% off in Coimbatore?'
    ]
  };
}
