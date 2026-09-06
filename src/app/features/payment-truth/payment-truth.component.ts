import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface DiscrepancyItem {
  entity: string;
  source: string;
  status: string;
  badgeClass: string;
  detail: string;
}

interface GateCheck {
  label: string;
  evidence: string;
  passed: boolean;
}

interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  userFriendlyTitle: string;
  userFriendlyBadge: string;
  badgeColor: string;
  dotClass: string;
  userFriendlyExplanation: string;
  expanded: boolean;
  meta: { system: string; code: string; latency: string };
  telemetry: any;
}

interface CorrelatedIncident {
  orderId: string;
  amount: string;
  gatewayStatus: string;
  dbStatus: string;
  time: string;
  reconciled: boolean;
}

interface TransactionScenario {
  orderId: string;
  scenarioLabel: string;
  amount: string;
  rootCauseTitle: string;
  rootCauseText: string;
  notificationText: string;
  discrepancies: DiscrepancyItem[];
  timeline: TimelineEvent[];
  gateChecks: GateCheck[];
}

@Component({
  selector: 'app-payment-truth',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-truth.component.html',
  styleUrls: ['./payment-truth.component.css']
})
export class PaymentTruthComponent {
  activeOrderId = 'ORD-12499';
  isRepairing = false;
  repairCompleted = false;
  incidentClosed = false;
  batchRepaired = false;
  repairToken = '';

  readonly lifecycleStages = [
    { key: 'detect', label: 'Detect', desc: 'Conflicting records found' },
    { key: 'explain', label: 'Explain', desc: 'Plain-language root cause' },
    { key: 'verify', label: 'Verify', desc: 'Deterministic 3/3 gate' },
    { key: 'repair', label: 'Repair', desc: 'Safe state mutation' },
    { key: 'notify', label: 'Notify', desc: 'SMS/WhatsApp to customer' },
    { key: 'close', label: 'Close', desc: 'Incident archived & signed' }
  ] as const;
  correlatedIncidents: CorrelatedIncident[] = [
    { orderId: 'ORD-12498', amount: '₹4,200', gatewayStatus: 'captured', dbStatus: 'UNPAID', time: '8:41:48 PM', reconciled: false },
    { orderId: 'ORD-12500', amount: '₹8,990', gatewayStatus: 'captured', dbStatus: 'UNPAID', time: '8:42:10 PM', reconciled: false },
    { orderId: 'ORD-12501', amount: '₹1,450', gatewayStatus: 'captured', dbStatus: 'UNPAID', time: '8:42:45 PM', reconciled: false }
  ];

  transactions: TransactionScenario[] = [

    {
      orderId: 'ORD-12499',
      scenarioLabel: 'Webhook Drop / Stale DB',
      amount: '₹12,499.00',
      rootCauseTitle: 'What we found: Payment succeeded. Store database missed the update.',
      rootCauseText: 'The customer\u2019s money reached Razorpay and HDFC Bank safely. The store\u2019s server simply never received the confirmation message (it timed out), so the order still shows \u201CUnpaid\u201D. No second payment is needed.',
      notificationText: 'Hi! We verified your payment of \u20B912,499 with your bank. Order #ORD-12499 is confirmed. Do not pay again.',
      discrepancies: [
        { entity: 'Customer Claim', source: 'Checkout Client', status: 'Debited (\u20B912,499)', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200', detail: 'Reported unpaid on store' },
        { entity: 'Razorpay Gateway', source: 'Gateway API', status: 'Captured', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', detail: 'pay_N8xL92kP001' },
        { entity: 'HDFC Settlement', source: 'RTGS Feed', status: 'Credited', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', detail: 'UTR: 329104882194' },
        { entity: 'Merchant Database', source: 'PostgreSQL Order DB', status: 'UNPAID', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200', detail: 'Order state: pending' }
      ],
      timeline: [
        {
          id: '1', time: '8:42:01 PM', title: 'Order Created',
          userFriendlyTitle: 'Customer Placed Order',
          userFriendlyBadge: 'Created', badgeColor: 'bg-slate-100 text-slate-600', dotClass: 'bg-slate-400',
          userFriendlyExplanation: 'The customer checked out with a cart worth \u20B912,499 and placed the order.',
          expanded: false,
          meta: { system: 'Checkout App', code: '201 Created', latency: '84 ms' },
          telemetry: { order_id: 'ORD-12499', amount_paise: 1249900, currency: 'INR', cart_items: 2 }
        },
        {
          id: '2', time: '8:42:08 PM', title: 'Payment Gateway Invocation',
          userFriendlyTitle: 'Customer Paid Through UPI',
          userFriendlyBadge: 'Paying', badgeColor: 'bg-indigo-50 text-indigo-700', dotClass: 'bg-indigo-500',
          userFriendlyExplanation: 'The customer approved the payment in their UPI app. Money started moving.',
          expanded: false,
          meta: { system: 'Razorpay / UPI', code: 'AUTH_SUCCESS', latency: '310 ms' },
          telemetry: { method: 'UPI', provider: 'HDFC', vpa: 'shifana@okhdfcbank', latency_ms: 310 }
        },
        {
          id: '3', time: '8:42:21 PM', title: 'Bank Authorization Successful',
          userFriendlyTitle: 'Bank Approved the Payment',
          userFriendlyBadge: 'Bank Approved', badgeColor: 'bg-emerald-50 text-emerald-700', dotClass: 'bg-emerald-500',
          userFriendlyExplanation: 'The customer\u2019s bank authorized the debit. The money is officially on its way.',
          expanded: false,
          meta: { system: 'HDFC Bank', code: 'AUTH_SUCCESS', latency: '980 ms' },
          telemetry: { bank: 'HDFC', auth_code: 'AUTH-7721', rrn: '329104882100', status: 'AUTHORIZED' }
        },
        {
          id: '4', time: '8:42:22 PM', title: 'Razorpay Payment Captured',
          userFriendlyTitle: 'Money Received by the Gateway',
          userFriendlyBadge: 'Money Secured', badgeColor: 'bg-emerald-50 text-emerald-700', dotClass: 'bg-emerald-500',
          userFriendlyExplanation: 'Razorpay confirmed the full \u20B912,499. The money is now safely held for the merchant.',
          expanded: false,
          meta: { system: 'Razorpay Gateway', code: 'CAPTURED', latency: '1,204 ms' },
          telemetry: { payment_id: 'pay_N8xL92kP001', capture_status: true, bank_ref: 'HDFC982341', utr: '329104882194', settlement_batch: 'HDFC-B-44109' }
        },
        {
          id: '5', time: '8:42:22 PM', title: 'Webhook Sent to Merchant',
          userFriendlyTitle: 'Payment Confirmation Sent to the Store',
          userFriendlyBadge: 'Signal Sent', badgeColor: 'bg-slate-100 text-slate-600', dotClass: 'bg-slate-400',
          userFriendlyExplanation: 'Razorpay dispatched the \u201Cpayment received\u201D message to the store\u2019s server.',
          expanded: false,
          meta: { system: 'Razorpay Webhooks', code: '202 Queued', latency: '42 ms' },
          telemetry: { event: 'payment.captured', endpoint: 'https://store.merchantsite.in/api/v1/webhooks/razorpay', attempt: 1, signature: 'hmac_sha256_verified' }
        },
        {
          id: '6', time: '8:42:23 PM', title: 'Merchant Webhook Ingestion Failed',
          userFriendlyTitle: 'Store Server Missed Confirmation Message',
          userFriendlyBadge: 'Signal Dropped', badgeColor: 'bg-rose-50 text-rose-700 font-bold', dotClass: 'bg-rose-500 ring-4 ring-rose-100',
          userFriendlyExplanation: 'The store\u2019s server was too slow to answer and missed the \u201Cpayment received\u201D message. All 3 retry attempts also failed.',
          expanded: false,
          meta: { system: 'Merchant Ingress', code: '504 Gateway Timeout', latency: '15,240 ms' },
          telemetry: {
            endpoint: 'https://store.merchantsite.in/api/v1/webhooks/razorpay',
            http_status: 504, error: 'GATEWAY_TIMEOUT', duration_ms: 15240,
            retry_attempt: '3/3', signature: 'hmac_sha256_verified', event: 'payment.captured'
          }
        },
        {
          id: '7', time: '8:42:31 PM', title: 'Customer Returned to Website',
          userFriendlyTitle: 'Customer Went Back to the Store',
          userFriendlyBadge: 'Waiting for Answer', badgeColor: 'bg-indigo-50 text-indigo-700', dotClass: 'bg-indigo-500',
          userFriendlyExplanation: 'The customer came back expecting to see a success page.',
          expanded: false,
          meta: { system: 'Store Frontend', code: 'GET /orders/ORD-12499', latency: '61 ms' },
          telemetry: { user_action: 'redirect_return_url', session: 'sess_9k2', seconds_since_payment: 9 }
        },
        {
          id: '8', time: '8:43:00 PM', title: 'Order Still Marked Unpaid',
          userFriendlyTitle: 'Store Displayed \u201CUnpaid\u201D Status',
          userFriendlyBadge: 'Needs Sync', badgeColor: 'bg-amber-50 text-amber-700', dotClass: 'bg-amber-500',
          userFriendlyExplanation: 'The store still showed \u201CUnpaid\u201D even though the money was already taken \u2014 a double-charge risk.',
          expanded: false,
          meta: { system: 'Store Frontend', code: '200 OK (stale read)', latency: '56 ms' },
          telemetry: { rendered_status: 'unpaid', warning: 'Risk of double-charge' }
        }
      ],
      gateChecks: [
        { label: 'Bank UTR Reference Matched', evidence: 'Matched settlement batch HDFC-B-44109', passed: true },
        { label: 'Gateway Amount Equals Order Sum', evidence: 'Captured: \u20B912,499.00 == Expected: \u20B912,499.00', passed: true },
        { label: 'Zero Refund / Reverse Charge Intent', evidence: 'Verified against chargeback ledger (0 hits)', passed: true }
      ]
    },

    {
      orderId: 'ORD-12502',
      scenarioLabel: 'Bank Settlement Lag / UTR Delayed',
      amount: '₹6,750.00',
      rootCauseTitle: 'What we found: Payment succeeded. The bank\u2019s confirmation number is simply delayed.',
      rootCauseText: 'Razorpay confirmed the customer\u2019s \u20B96,750 payment, but HDFC\u2019s end-of-day settlement batch has not assigned the UTR reference yet. The store cannot reconcile until it lands. This resolves itself \u2014 the safest action is to wait.',
      notificationText: 'Hi! We\u2019ve received your payment of \u20B96,750 and your order #ORD-12502 is confirmed. We\u2019ll send final bank confirmation shortly. Do not pay again.',
      discrepancies: [
        { entity: 'Customer Claim', source: 'Checkout Client', status: 'Debited (\u20B96,750)', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200', detail: 'Reported unpaid on store' },
        { entity: 'Razorpay Gateway', source: 'Gateway API', status: 'Captured', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', detail: 'pay_M2kT48wR77' },
        { entity: 'HDFC Settlement', source: 'RTGS Feed', status: 'UTR Pending', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200', detail: 'Awaiting batch HDFC-B-44112' },
        { entity: 'Merchant Database', source: 'PostgreSQL Order DB', status: 'UNPAID', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200', detail: 'Order state: pending' }
      ],
      timeline: [
        {
          id: '1', time: '9:02:11 PM', title: 'Order Created',
          userFriendlyTitle: 'Customer Placed Order',
          userFriendlyBadge: 'Created', badgeColor: 'bg-slate-100 text-slate-600', dotClass: 'bg-slate-400',
          userFriendlyExplanation: 'A customer ordered items worth \u20B96,750 from the store.',
          expanded: false,
          meta: { system: 'Checkout App', code: '201 Created', latency: '91 ms' },
          telemetry: { order_id: 'ORD-12502', amount_paise: 675000, currency: 'INR', cart_items: 1 }
        },
        {
          id: '2', time: '9:02:40 PM', title: 'Razorpay Payment Captured',
          userFriendlyTitle: 'Money Secured by the Payment Gateway',
          userFriendlyBadge: 'Money Secured', badgeColor: 'bg-emerald-50 text-emerald-700', dotClass: 'bg-emerald-500',
          userFriendlyExplanation: 'Razorpay confirmed and held the payment. The money is safe.',
          expanded: false,
          meta: { system: 'Razorpay Gateway', code: 'CAPTURED', latency: '988 ms' },
          telemetry: { payment_id: 'pay_M2kT48wR77', capture_status: true, method: 'CARD', network: 'VISA' }
        },
        {
          id: '3', time: '9:15:00 PM', title: 'Bank Settlement Batch Delayed',
          userFriendlyTitle: 'Bank\u2019s Confirmation Number Running Late',
          userFriendlyBadge: 'Waiting on Bank', badgeColor: 'bg-amber-50 text-amber-700', dotClass: 'bg-amber-500',
          userFriendlyExplanation: 'Banks issue official confirmation numbers in batches. Tonight\u2019s batch is running about 40 minutes late.',
          expanded: false,
          meta: { system: 'HDFC Settlement Feed', code: 'PENDING_UTR', latency: 'n/a' },
          telemetry: { expected_batch: 'HDFC-B-44112', utr: null, status: 'IN_SETTLEMENT_QUEUE', eta_minutes: 40 }
        },
        {
          id: '4', time: '9:16:10 PM', title: 'Store Cannot Reconcile Without UTR',
          userFriendlyTitle: 'Store Is Waiting For the Bank Too',
          userFriendlyBadge: 'Needs Sync', badgeColor: 'bg-amber-50 text-amber-700', dotClass: 'bg-amber-500',
          userFriendlyExplanation: 'The store only marks orders paid when the bank\u2019s number arrives, so the order still looks unpaid.',
          expanded: false,
          meta: { system: 'Reconciliation Job', code: 'DEFERRED', latency: 'n/a' },
          telemetry: { job: 'nightly_reconcile', blocked_on: 'UTR', retries_scheduled: 6 }
        }
      ],
      gateChecks: [
        { label: 'Bank UTR Reference Matched', evidence: 'Pending \u2014 settlement batch HDFC-B-44112 not yet assigned', passed: false },
        { label: 'Gateway Amount Equals Order Sum', evidence: 'Captured: \u20B96,750.00 == Expected: \u20B96,750.00', passed: true },
        { label: 'Zero Refund / Reverse Charge Intent', evidence: 'Verified against chargeback ledger (0 hits)', passed: true }
      ]
    },

    {
      orderId: 'ORD-12510',
      scenarioLabel: 'Customer Double-Charge Risk / Stalled Cart',
      amount: '₹1,299.00',
      rootCauseTitle: 'What we found: The customer was charged exactly once. The second attempt was safely blocked.',
      rootCauseText: 'The customer\u2019s first payment went through. When the store showed \u201CUnpaid\u201D, they tried to pay again \u2014 Razorpay detected the duplicate and blocked it automatically. The cart is now stalled, so the order must be marked paid quickly to avoid confusion.',
      notificationText: 'Hi! We verified your payment of \u20B91,299 with your bank. Order #ORD-12510 is confirmed. Do not pay again.',
      discrepancies: [
        { entity: 'Customer Claim', source: 'Support Ticket #8812', status: '\u201CCharged twice?\u201D', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200', detail: 'Only 1 charge found' },
        { entity: 'Razorpay Gateway', source: 'Gateway API', status: 'Captured (1 of 2)', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', detail: 'pay_Q7zR61nV02 \u00B7 2nd blocked' },
        { entity: 'HDFC Settlement', source: 'RTGS Feed', status: '\u20B91,299 Credited', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', detail: 'UTR: 329104883301' },
        { entity: 'Merchant Database', source: 'PostgreSQL Order DB', status: 'UNPAID', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200', detail: 'Cart stalled at checkout' }
      ],
      timeline: [
        {
          id: '1', time: '9:41:03 PM', title: 'Order Created',
          userFriendlyTitle: 'Customer Placed Order',
          userFriendlyBadge: 'Created', badgeColor: 'bg-slate-100 text-slate-600', dotClass: 'bg-slate-400',
          userFriendlyExplanation: 'A customer started buying items worth \u20B91,299.',
          expanded: false,
          meta: { system: 'Checkout App', code: '201 Created', latency: '77 ms' },
          telemetry: { order_id: 'ORD-12510', amount_paise: 129900, currency: 'INR', cart_items: 3 }
        },
        {
          id: '2', time: '9:41:29 PM', title: 'First Payment Captured',
          userFriendlyTitle: 'First Payment Went Through',
          userFriendlyBadge: 'Money Secured', badgeColor: 'bg-emerald-50 text-emerald-700', dotClass: 'bg-emerald-500',
          userFriendlyExplanation: 'The customer\u2019s first payment succeeded and the bank received the money.',
          expanded: false,
          meta: { system: 'Razorpay Gateway', code: 'CAPTURED', latency: '1,102 ms' },
          telemetry: { payment_id: 'pay_Q7zR61nV02', capture_status: true, utr: '329104883301', attempt: 1 }
        },
        {
          id: '3', time: '9:42:02 PM', title: 'Second Payment Attempt Auto-Blocked',
          userFriendlyTitle: 'Second Payment Safely Blocked',
          userFriendlyBadge: 'Duplicate Blocked', badgeColor: 'bg-indigo-50 text-indigo-700', dotClass: 'bg-indigo-500',
          userFriendlyExplanation: 'Because the store still showed \u201CUnpaid\u201D, the customer tried to pay again. The gateway recognised the duplicate order and refused the second charge. No money moved.',
          expanded: false,
          meta: { system: 'Razorpay Gateway', code: 'DUPLICATE_BLOCKED', latency: '140 ms' },
          telemetry: { payment_id: 'pay_Q7zR61nX09', attempt: 2, blocked_reason: 'duplicate_order_active', amount_paise: 129900, funds_moved: false }
        },
        {
          id: '4', time: '9:42:45 PM', title: 'Cart Stalled At Checkout',
          userFriendlyTitle: 'Customer Stuck On The Payment Screen',
          userFriendlyBadge: 'Needs Sync', badgeColor: 'bg-amber-50 text-amber-700', dotClass: 'bg-amber-500',
          userFriendlyExplanation: 'The customer is still staring at a \u201CComplete Payment\u201D screen. The longer this lasts, the more likely they contact support or abandon the cart.',
          expanded: false,
          meta: { system: 'Store Frontend', code: 'AWAITING_PAYMENT', latency: 'n/a' },
          telemetry: { cart_state: 'stalled', screen: 'checkout.payment', minutes_open: 12, risk: 'ABANDONMENT' }
        }
      ],
      gateChecks: [
        { label: 'Bank UTR Reference Matched', evidence: 'Matched settlement batch HDFC-B-44110', passed: true },
        { label: 'Gateway Amount Equals Order Sum', evidence: 'Captured: \u20B91,299.00 == Expected: \u20B91,299.00', passed: true },
        { label: 'Zero Refund / Reverse Charge Intent', evidence: 'Verified against chargeback ledger (0 hits) \u00B7 duplicate attempt blocked, no charge', passed: true }
      ]
    }
  ];



  get activeTransaction(): TransactionScenario {
    const tx = this.transactions.find(t => t.orderId === this.activeOrderId);
    return tx ?? this.transactions[0];
  }

  get gatePassed(): boolean {
    return this.activeTransaction.gateChecks.every(c => c.passed);
  }

  selectTransaction(orderId: string): void {
    if (this.activeOrderId === orderId) { return; }
    this.activeOrderId = orderId;
    this.isRepairing = false;
    this.repairCompleted = false;
    this.incidentClosed = false;
    this.repairToken = '';
    // Collapse all evidence drawers when switching contexts
    this.activeTransaction.timeline.forEach(ev => (ev.expanded = false));
  }

  /** 0-based index of the furthest completed lifecycle stage (Detect..Close). */
  get lifecycleActiveIndex(): number {
    if (this.incidentClosed) { return 5; }
    if (this.repairCompleted) { return 4; }
    if (this.gatePassed) { return 2; } // Detect + Explain done, Verify gate green
    return 1; // Detect done, Explain rendering
  }

  toggleTimeline(event: TimelineEvent): void {
    event.expanded = !event.expanded;
  }

  executeRepair(): void {
    if (this.repairCompleted || this.isRepairing || !this.gatePassed) { return; }
    this.isRepairing = true;

    setTimeout(() => {
      this.isRepairing = false;
      this.repairCompleted = true;
      this.repairToken = 'SIG_REPAIR_' + Math.random().toString(36).slice(2, 8).toUpperCase();
      // Reconcile the merchant record in the discrepancy matrix
      const dbRow = this.activeTransaction.discrepancies.find(d => d.entity === 'Merchant Database');
      if (dbRow) {
        dbRow.status = 'PAID (Auto-Repaired)';
        dbRow.badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        dbRow.detail = 'State synced via Synthetic Webhook';
      }
    }, 850);
  }

  repairAllCorrelated(): void {
    if (this.batchRepaired) { return; }
    this.correlatedIncidents.forEach(item => (item.reconciled = true));
    this.batchRepaired = true;
  }

  closeIncident(): void {
    if (!this.repairCompleted || this.incidentClosed) { return; }
    this.incidentClosed = true;
  }

  constructor(public router: Router) {}
}
