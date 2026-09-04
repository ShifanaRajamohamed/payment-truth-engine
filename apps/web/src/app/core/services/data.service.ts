import { Injectable, signal } from '@angular/core';

export interface Transaction {
  id: string;
  customerName: string;
  email: string;
  amount: number;
  currency: string;
  method: 'UPI' | 'Card' | 'Netbanking' | 'Wallet';
  gateway: 'Razorpay PG-1' | 'Razorpay PG-2' | 'HDFC PG' | 'ICICI PG';
  status: 'success' | 'failed' | 'processing';
  failureReason?: string;
  timestamp: Date;
  region: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  totalVolume: number;
  successRate: number;
  riskLevel: 'low' | 'medium' | 'high';
  status: 'active' | 'suspended';
  joinedDate: Date;
  city?: string;
  isRepeat?: boolean;
}

export interface RegionMetric {
  id: string;
  name: string;
  state?: string;
  latitude: number;
  longitude: number;
  volume: number;
  successRate: number;
  latencyMs: number;
  failureRate: number;
  activeGateway: string;
  growth?: number;             // % week-over-week
  orderCount?: number;
  customerCount?: number;
  status?: 'growing' | 'stable' | 'declining';
  plainStatus?: string;        // Human-readable status sentence
}

export interface CityMetric {
  id: string;
  name: string;
  state: string;
  latitude: number;
  longitude: number;
  revenue: number;
  growth: number;
  orderCount: number;
  customerCount: number;
  repeatCustomerRate: number;
  successRate: number;
  failureRate: number;
  status: 'growing' | 'stable' | 'declining';
  statusLabel: string;
  statusEmoji: string;
  plainStatus: string;
}

export interface Opportunity {
  id: string;
  title: string;
  plainTitle: string;
  description: string;
  plainDescription: string;
  impactType: 'success_rate' | 'cost_saving' | 'latency';
  impactValue: string;
  plainImpact: string;
  status: 'active' | 'applied' | 'ignored';
  difficulty: 'low' | 'medium' | 'high';
}

export interface RoutingRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  primaryGateway: string;
  backupGateway: string;
  isActive: boolean;
  successRate: number;
}

export interface MerchantSummary {
  revenue: number;
  revenueLabel: string;       // "₹8.24 lakh"
  revenueTrend: number;
  revenueExplain: string;     // plain language
  orderCount: number;
  orderLabel: string;
  orderTrend: number;
  watchItem: string;           // plain language warning
  bestArea: string;
  advice: string;              // plain language recommendation
}

@Injectable({ providedIn: 'root' })
export class DataService {

  // ── Aggregate signals ────────────────────────────────────────────────────
  readonly volume            = signal<number>(14520930.50);
  readonly volumeTrend       = signal<number>(12.4);
  readonly successRate       = signal<number>(96.8);
  readonly successRateTrend  = signal<number>(1.2);
  readonly failureRate       = signal<number>(3.2);
  readonly failureRateTrend  = signal<number>(-1.2);
  readonly settlementTime    = signal<string>('24.2 hrs');
  readonly settlementTrend   = signal<number>(-4.5);
  readonly totalOrders       = signal<number>(2841);
  readonly totalCustomers    = signal<number>(8291);

  // ── Simple Mode summary ──────────────────────────────────────────────────
  readonly merchantSummary = signal<MerchantSummary>({
    revenue: 824000,
    revenueLabel: '₹8.24 lakh',
    revenueTrend: 18.7,
    revenueExplain: 'You received more money this week than last week.',
    orderCount: 2841,
    orderLabel: '2,841 orders',
    orderTrend: 12.2,
    watchItem: 'More orders were returned this week in Madurai.',
    bestArea: 'Coimbatore',
    advice: 'Try an offer for repeat customers in Coimbatore — they are your most loyal buyers.',
  });

  // ── Transactions ──────────────────────────────────────────────────────────
  readonly transactions = signal<Transaction[]>([
    { id: 'pay_TX9283749281', customerName: 'Aditya Sharma',   email: 'aditya.sharma@gmail.com',   amount: 15400, currency: 'INR', method: 'UPI',       gateway: 'Razorpay PG-1', status: 'success',    timestamp: new Date(Date.now() - 3  * 60000), region: 'Maharashtra' },
    { id: 'pay_TX9283749282', customerName: 'Priya Patel',     email: 'priya.patel@yahoo.com',     amount: 890,   currency: 'INR', method: 'Card',      gateway: 'HDFC PG',       status: 'success',    timestamp: new Date(Date.now() - 8  * 60000), region: 'Gujarat' },
    { id: 'pay_TX9283749283', customerName: 'Rohan Murthy',    email: 'rohan.murthy@outlook.com',  amount: 24500, currency: 'INR', method: 'Netbanking', gateway: 'Razorpay PG-2', status: 'failed',     failureReason: 'Bank network timeout',          timestamp: new Date(Date.now() - 14 * 60000), region: 'Karnataka' },
    { id: 'pay_TX9283749284', customerName: 'Ananya Rao',      email: 'ananya.rao@gmail.com',      amount: 4500,  currency: 'INR', method: 'UPI',       gateway: 'Razorpay PG-1', status: 'success',    timestamp: new Date(Date.now() - 25 * 60000), region: 'Telangana' },
    { id: 'pay_TX9283749285', customerName: 'Sanjay Nair',     email: 'sanjay.nair@hotmail.com',   amount: 12000, currency: 'INR', method: 'Card',      gateway: 'Razorpay PG-2', status: 'success',    timestamp: new Date(Date.now() - 32 * 60000), region: 'Kerala' },
    { id: 'pay_TX9283749286', customerName: 'Deepa Krishnan',  email: 'deepa.k@gmail.com',         amount: 350,   currency: 'INR', method: 'Wallet',    gateway: 'ICICI PG',      status: 'success',    timestamp: new Date(Date.now() - 40 * 60000), region: 'Tamil Nadu' },
    { id: 'pay_TX9283749287', customerName: 'Vijay Yadav',     email: 'vijay.yadav@gmail.com',     amount: 7200,  currency: 'INR', method: 'UPI',       gateway: 'Razorpay PG-1', status: 'failed',     failureReason: 'Insufficient customer funds',   timestamp: new Date(Date.now() - 52 * 60000), region: 'Delhi' },
    { id: 'pay_TX9283749288', customerName: 'Meera Deshmukh',  email: 'meera.d@gmail.com',         amount: 19500, currency: 'INR', method: 'Card',      gateway: 'Razorpay PG-1', status: 'success',    timestamp: new Date(Date.now() - 65 * 60000), region: 'Maharashtra' },
    { id: 'pay_TX9283749289', customerName: 'Karthik Raja',    email: 'karthik.raja@yahoo.com',    amount: 1450,  currency: 'INR', method: 'UPI',       gateway: 'HDFC PG',       status: 'success',    timestamp: new Date(Date.now() - 78 * 60000), region: 'Tamil Nadu' },
    { id: 'pay_TX9283749290', customerName: 'Sunita Sen',      email: 'sunita.sen@gmail.com',      amount: 30000, currency: 'INR', method: 'Netbanking', gateway: 'ICICI PG',     status: 'processing', timestamp: new Date(Date.now() - 85 * 60000), region: 'West Bengal' },
  ]);

  // ── Customers ─────────────────────────────────────────────────────────────
  readonly customers = signal<Customer[]>([
    { id: 'cust_C837264', name: 'Aditya Sharma',  email: 'aditya.sharma@gmail.com',  totalVolume: 1254000, successRate: 98.4, riskLevel: 'low',    status: 'active',    joinedDate: new Date('2025-01-15'), city: 'Coimbatore', isRepeat: true  },
    { id: 'cust_C837265', name: 'Priya Patel',    email: 'priya.patel@yahoo.com',    totalVolume:   84300, successRate: 95.2, riskLevel: 'low',    status: 'active',    joinedDate: new Date('2025-02-10'), city: 'Mumbai',     isRepeat: false },
    { id: 'cust_C837266', name: 'Rohan Murthy',   email: 'rohan.murthy@outlook.com', totalVolume: 4245000, successRate: 88.7, riskLevel: 'medium', status: 'active',    joinedDate: new Date('2024-11-20'), city: 'Bangalore',  isRepeat: true  },
    { id: 'cust_C837267', name: 'Ananya Rao',     email: 'ananya.rao@gmail.com',     totalVolume:  615000, successRate: 96.1, riskLevel: 'low',    status: 'active',    joinedDate: new Date('2025-03-01'), city: 'Chennai',    isRepeat: true  },
    { id: 'cust_C837268', name: 'Sanjay Nair',    email: 'sanjay.nair@hotmail.com',  totalVolume:  912000, successRate: 92.4, riskLevel: 'low',    status: 'active',    joinedDate: new Date('2025-01-28'), city: 'Coimbatore', isRepeat: true  },
    { id: 'cust_C837269', name: 'Deepa Krishnan', email: 'deepa.k@gmail.com',        totalVolume:  450000, successRate: 97.8, riskLevel: 'low',    status: 'active',    joinedDate: new Date('2024-09-12'), city: 'Trichy',     isRepeat: false },
    { id: 'cust_C837270', name: 'Vijay Yadav',    email: 'vijay.yadav@gmail.com',    totalVolume:  147200, successRate: 81.3, riskLevel: 'high',   status: 'active',    joinedDate: new Date('2025-04-05'), city: 'Delhi',      isRepeat: false },
    { id: 'cust_C837271', name: 'Meera Deshmukh', email: 'meera.d@gmail.com',        totalVolume: 3195000, successRate: 94.5, riskLevel: 'low',    status: 'active',    joinedDate: new Date('2024-05-18'), city: 'Madurai',    isRepeat: true  },
    { id: 'cust_C837272', name: 'Karthik Raja',   email: 'karthik.raja@yahoo.com',   totalVolume:  845000, successRate: 91.2, riskLevel: 'medium', status: 'suspended', joinedDate: new Date('2024-08-30'), city: 'Chennai',    isRepeat: true  },
  ]);

  // ── State-level regions ───────────────────────────────────────────────────
  readonly regions = signal<RegionMetric[]>([
    { id: 'reg_MH', name: 'Maharashtra', latitude: 19.7515, longitude: 75.7139, volume: 4850000, successRate: 86.2, latencyMs: 145, failureRate: 13.8, activeGateway: 'Razorpay PG-1', growth: 14.2, orderCount: 980,  customerCount: 1820, status: 'growing',  plainStatus: 'Growing steadily' },
    { id: 'reg_KA', name: 'Karnataka',   latitude: 15.3173, longitude: 75.7139, volume: 3950000, successRate: 83.5, latencyMs: 160, failureRate: 16.5, activeGateway: 'Razorpay PG-2', growth:  9.1, orderCount: 810,  customerCount: 1540, status: 'growing',  plainStatus: 'Doing well' },
    { id: 'reg_TN', name: 'Tamil Nadu',  latitude: 11.1271, longitude: 78.6569, volume: 2950000, successRate: 81.4, latencyMs: 185, failureRate: 18.6, activeGateway: 'ICICI PG',      growth: -3.2, orderCount: 620,  customerCount: 1210, status: 'declining', plainStatus: 'Payments slightly down this week' },
    { id: 'reg_DL', name: 'Delhi NCR',   latitude: 28.7041, longitude: 77.1025, volume: 1850000, successRate: 87.5, latencyMs: 120, failureRate: 12.5, activeGateway: 'Razorpay PG-1', growth:  5.8, orderCount: 410,  customerCount: 890,  status: 'stable',   plainStatus: 'Stable' },
    { id: 'reg_TS', name: 'Telangana',   latitude: 18.1124, longitude: 79.0193, volume: 1650000, successRate: 84.8, latencyMs: 150, failureRate: 15.2, activeGateway: 'HDFC PG',       growth:  3.4, orderCount: 340,  customerCount: 710,  status: 'stable',   plainStatus: 'Stable' },
    { id: 'reg_GJ', name: 'Gujarat',     latitude: 22.2587, longitude: 71.1924, volume: 1200000, successRate: 85.9, latencyMs: 135, failureRate: 14.1, activeGateway: 'HDFC PG',       growth:  7.2, orderCount: 280,  customerCount: 560,  status: 'growing',  plainStatus: 'Growing' },
    { id: 'reg_WB', name: 'West Bengal', latitude: 22.9868, longitude: 87.8550, volume:  850000, successRate: 82.1, latencyMs: 190, failureRate: 17.9, activeGateway: 'ICICI PG',      growth: -1.1, orderCount: 200,  customerCount: 420,  status: 'stable',   plainStatus: 'Mostly stable' },
  ]);

  // ── City-level data ───────────────────────────────────────────────────────
  readonly cities = signal<CityMetric[]>([
    {
      id: 'city_CBE', name: 'Coimbatore', state: 'Tamil Nadu',
      latitude: 11.0168, longitude: 76.9558,
      revenue: 820000, growth: 31.4, orderCount: 312, customerCount: 584,
      repeatCustomerRate: 72, successRate: 94.1, failureRate: 5.9,
      status: 'growing', statusLabel: 'Growing fast', statusEmoji: '🟢',
      plainStatus: 'Most customers, growing fast',
    },
    {
      id: 'city_CHN', name: 'Chennai', state: 'Tamil Nadu',
      latitude: 13.0827, longitude: 80.2707,
      revenue: 640000, growth: 18.2, orderCount: 248, customerCount: 462,
      repeatCustomerRate: 61, successRate: 91.4, failureRate: 8.6,
      status: 'growing', statusLabel: 'Growing', statusEmoji: '🟢',
      plainStatus: 'Growing fast',
    },
    {
      id: 'city_MDU', name: 'Madurai', state: 'Tamil Nadu',
      latitude: 9.9252, longitude: 78.1198,
      revenue: 380000, growth: 2.1, orderCount: 148, customerCount: 278,
      repeatCustomerRate: 55, successRate: 88.7, failureRate: 11.3,
      status: 'stable', statusLabel: 'Stable', statusEmoji: '🟡',
      plainStatus: 'Stable — not much change',
    },
    {
      id: 'city_TCY', name: 'Trichy', state: 'Tamil Nadu',
      latitude: 10.7905, longitude: 78.7047,
      revenue: 210000, growth: -8.3, orderCount: 89, customerCount: 164,
      repeatCustomerRate: 48, successRate: 82.1, failureRate: 17.9,
      status: 'declining', statusLabel: 'Down this week', statusEmoji: '🔴',
      plainStatus: 'Payments decreased this week',
    },
    {
      id: 'city_MUM', name: 'Mumbai', state: 'Maharashtra',
      latitude: 19.0760, longitude: 72.8777,
      revenue: 2100000, growth: 15.6, orderCount: 510, customerCount: 980,
      repeatCustomerRate: 68, successRate: 89.2, failureRate: 10.8,
      status: 'growing', statusLabel: 'Strong growth', statusEmoji: '🟢',
      plainStatus: 'Strong and growing',
    },
    {
      id: 'city_BLR', name: 'Bangalore', state: 'Karnataka',
      latitude: 12.9716, longitude: 77.5946,
      revenue: 1850000, growth: 9.8, orderCount: 430, customerCount: 820,
      repeatCustomerRate: 65, successRate: 87.4, failureRate: 12.6,
      status: 'growing', statusLabel: 'Growing', statusEmoji: '🟢',
      plainStatus: 'Doing well',
    },
    {
      id: 'city_DEL', name: 'Delhi', state: 'Delhi NCR',
      latitude: 28.6139, longitude: 77.2090,
      revenue: 1200000, growth: 5.2, orderCount: 290, customerCount: 560,
      repeatCustomerRate: 58, successRate: 88.1, failureRate: 11.9,
      status: 'stable', statusLabel: 'Stable', statusEmoji: '🟡',
      plainStatus: 'Stable',
    },
  ]);

  // ── Opportunities ─────────────────────────────────────────────────────────
  readonly opportunities = signal<Opportunity[]>([
    {
      id: 'opp_1',
      title: 'UPI Routing Optimisation',
      plainTitle: 'Fix payments failing in Tamil Nadu',
      description: 'Route all Tamil Nadu UPI transactions through ICICI PG-1 to improve success rate by 2.3%.',
      plainDescription: 'Some UPI payments in Tamil Nadu are failing due to a slow banking network. Switching to a different payment route can fix most of them.',
      impactType: 'success_rate', impactValue: '+2.3%',
      plainImpact: 'About 23 more payments will go through for every 1,000 attempts.',
      status: 'active', difficulty: 'low',
    },
    {
      id: 'opp_2',
      title: 'Card Route Cost-Reduction',
      plainTitle: 'Save money on card payments',
      description: 'Enable direct debit routing with Visa/Mastercard network rails on PG-2.',
      plainDescription: 'You are currently paying a small fee on each card payment that you can avoid. A simple routing change can save you about ₹0.40 per card payment.',
      impactType: 'cost_saving', impactValue: 'Save ₹0.40/tx',
      plainImpact: 'You could save ₹12,000 every month.',
      status: 'active', difficulty: 'medium',
    },
    {
      id: 'opp_3',
      title: 'High-Value UPI Smart-Route',
      plainTitle: 'Large payments are already working better',
      description: 'Configured routing for payments > ₹15,000 to primary UPI gateway.',
      plainDescription: 'Payments above ₹15,000 were sometimes failing. We already fixed this by routing them through the most reliable payment channel.',
      impactType: 'success_rate', impactValue: '+1.5%',
      plainImpact: '15 more large payments succeed every month.',
      status: 'applied', difficulty: 'low',
    },
    {
      id: 'opp_4',
      title: 'Wallet Gateway Consolidation',
      plainTitle: 'Simplify wallet payments',
      description: 'Combine wallet routes under a single merchant service provider.',
      plainDescription: 'Your wallet payments go through multiple channels which makes settlements complicated. Combining them into one saves time and money.',
      impactType: 'cost_saving', impactValue: 'Save ₹12k/mo',
      plainImpact: 'You save ₹12,000 per month and settle payments faster.',
      status: 'active', difficulty: 'high',
    },
  ]);

  // ── Routing Rules ─────────────────────────────────────────────────────────
  readonly routingRules = signal<RoutingRule[]>([
    { id: 'rule_1', name: 'High-value UPI routing',    description: 'UPI payments above ₹10,000 are sent to Razorpay PG-1',                               condition: 'amount >= 10000 AND method == UPI',                          primaryGateway: 'Razorpay PG-1', backupGateway: 'HDFC PG',       isActive: true,  successRate: 88.4 },
    { id: 'rule_2', name: 'Credit card fallback rule', description: 'Redirect credit card payments to Razorpay PG-2 if HDFC PG fails',                     condition: 'method == Card AND failure_rate(HDFC PG) > 10',              primaryGateway: 'HDFC PG',       backupGateway: 'Razorpay PG-2', isActive: true,  successRate: 91.2 },
    { id: 'rule_3', name: 'Regional low-latency route', description: 'Route southern region transactions through ICICI PG',                                 condition: 'region IN [Tamil Nadu, Karnataka, Kerala]',                  primaryGateway: 'ICICI PG',      backupGateway: 'Razorpay PG-1', isActive: false, successRate: 85.6 },
    { id: 'rule_4', name: 'International payment routing', description: 'All USD/EUR international cards are routed directly to Razorpay PG-2',             condition: 'currency != INR',                                            primaryGateway: 'Razorpay PG-2', backupGateway: 'HDFC PG',       isActive: true,  successRate: 79.8 },
  ]);

  // ── Mutators ──────────────────────────────────────────────────────────────
  addTransaction(tx: Omit<Transaction, 'id' | 'timestamp'>) {
    const newTx: Transaction = {
      ...tx,
      id: `pay_TX${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      timestamp: new Date(),
    };
    this.transactions.update(txs => [newTx, ...txs]);
    if (tx.status === 'success') this.volume.update(v => v + tx.amount);
  }

  toggleRule(id: string) {
    this.routingRules.update(rules =>
      rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r)
    );
  }

  applyOpportunity(id: string) {
    this.opportunities.update(opps =>
      opps.map(o => o.id === id ? { ...o, status: 'applied' } : o)
    );
  }

  addRoutingRule(rule: Omit<RoutingRule, 'id' | 'successRate'>) {
    const newRule: RoutingRule = {
      ...rule,
      id: `rule_${Math.floor(1000 + Math.random() * 9000)}`,
      successRate: 85.0,
    };
    this.routingRules.update(rules => [...rules, newRule]);
  }

  /** Return city by name (case-insensitive). */
  getCityByName(name: string): CityMetric | undefined {
    return this.cities().find(c => c.name.toLowerCase() === name.toLowerCase());
  }

  /** Return top N cities by revenue. */
  getTopCities(n = 3): CityMetric[] {
    return [...this.cities()].sort((a, b) => b.revenue - a.revenue).slice(0, n);
  }

  /** Return the fastest-growing city. */
  getFastestGrowingCity(): CityMetric {
    return [...this.cities()].sort((a, b) => b.growth - a.growth)[0];
  }
}
