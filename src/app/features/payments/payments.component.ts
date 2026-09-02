import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, Transaction } from '../../core/services/data.service';
import { VoiceService } from '../../core/services/voice.service';
import { TranslationService } from '../../core/language/translation.service';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-7">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="text-lg">💳</span>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">My Payments</h1>
        </div>
        <p class="text-sm text-slate-500">Track incoming customer payments, failed attempts, and bank gateways.</p>
      </div>

      <div class="mt-4 sm:mt-0 flex items-center gap-2.5">
        <button (click)="openSimulatorModal()"
                class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm">
          <svg class="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
          <span>Simulate Payment</span>
        </button>

        <button (click)="askAgent()"
                class="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl text-white transition-all shadow-sm"
                style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3Z"/>
          </svg>
          <span>Ask Dhwani</span>
        </button>
      </div>
    </div>

    <!-- Summary KPI cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="bg-white rounded-2xl p-5" style="border:1px solid rgba(15,31,69,0.07);box-shadow:0 2px 8px rgba(15,31,69,0.04);">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Total Volume</p>
        <p class="text-2xl font-extrabold text-slate-900">{{ dataService.volume() | currency:'INR':'symbol':'1.0-0' }}</p>
        <p class="text-xs text-emerald-600 font-semibold mt-1">↑ +{{ dataService.volumeTrend() }}% this month</p>
      </div>

      <div class="bg-white rounded-2xl p-5" style="border:1px solid rgba(15,31,69,0.07);box-shadow:0 2px 8px rgba(15,31,69,0.04);">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Success Rate</p>
        <p class="text-2xl font-extrabold text-emerald-600">{{ dataService.successRate() }}%</p>
        <p class="text-xs text-slate-500 mt-1">About 97 out of 100 payments succeed</p>
      </div>

      <div class="bg-white rounded-2xl p-5" style="border:1px solid rgba(15,31,69,0.07);box-shadow:0 2px 8px rgba(15,31,69,0.04);">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Avg Settlement Time</p>
        <p class="text-2xl font-extrabold text-slate-900">{{ dataService.settlementTime() }}</p>
        <p class="text-xs text-slate-500 mt-1">Funds deposited to bank in under 24 hrs</p>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="bg-white rounded-2xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
         style="border:1px solid rgba(15,31,69,0.07);box-shadow:0 2px 8px rgba(15,31,69,0.04);">
      <div class="flex-1 max-w-sm">
        <div class="relative">
          <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
          </svg>
          <input type="text" [(ngModel)]="searchQuery"
                 placeholder="Search by customer, ID or city…"
                 class="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-400 bg-slate-50"/>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <select [(ngModel)]="selectedStatus" class="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none">
          <option value="all">All Statuses</option>
          <option value="success">Successful only</option>
          <option value="failed">Failed only</option>
          <option value="processing">Processing</option>
        </select>

        <select [(ngModel)]="selectedMethod" class="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none">
          <option value="all">All Methods</option>
          <option value="UPI">UPI</option>
          <option value="Card">Card</option>
          <option value="Netbanking">Netbanking</option>
          <option value="Wallet">Wallet</option>
        </select>
      </div>
    </div>

    <!-- Payments Ledger Table -->
    <div class="bg-white rounded-2xl overflow-hidden"
         style="border:1px solid rgba(15,31,69,0.07);box-shadow:0 2px 8px rgba(15,31,69,0.04);">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-100 text-left">
          <thead class="bg-slate-50/75">
            <tr class="text-[10px] uppercase text-slate-500 font-bold tracking-wider">
              <th class="py-3.5 px-5">Transaction ID</th>
              <th class="py-3.5 px-4">Customer</th>
              <th class="py-3.5 px-4">Amount</th>
              <th class="py-3.5 px-4">Method & Gateway</th>
              <th class="py-3.5 px-4">Status</th>
              <th class="py-3.5 px-4">Region</th>
              <th class="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-xs">
            <tr *ngFor="let tx of filteredTransactions" class="hover:bg-slate-50/70 transition-colors">
              <td class="py-3.5 px-5 font-mono text-[11px] text-slate-600 font-medium">
                {{ tx.id }}
              </td>
              <td class="py-3.5 px-4">
                <p class="font-bold text-slate-900">{{ tx.customerName }}</p>
                <p class="text-[10px] text-slate-400">{{ tx.email }}</p>
              </td>
              <td class="py-3.5 px-4">
                <span class="font-extrabold text-sm text-slate-900">{{ tx.amount | currency:'INR':'symbol':'1.0-0' }}</span>
              </td>
              <td class="py-3.5 px-4">
                <span class="font-semibold text-slate-800">{{ tx.method }}</span>
                <span class="text-[10px] text-slate-400 block">{{ tx.gateway }}</span>
              </td>
              <td class="py-3.5 px-4">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      [style]="statusBadgeStyle(tx.status)">
                  <span class="w-1.5 h-1.5 rounded-full" [style.background]="statusDotColor(tx.status)"></span>
                  {{ tx.status }}
                </span>
                <span *ngIf="tx.failureReason" class="text-[10px] text-red-500 block mt-0.5 max-w-[140px] truncate" [title]="tx.failureReason">
                  {{ tx.failureReason }}
                </span>
              </td>
              <td class="py-3.5 px-4 text-slate-600 font-medium">
                {{ tx.region }}
              </td>
              <td class="py-3.5 px-4 text-right">
                <button (click)="explainPayment(tx)"
                        class="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors">
                  Explain 💡
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Explain Payment Modal ─────────────────────────────────────────── -->
    <div *ngIf="inspectTx()"
         (click)="inspectTx.set(null)"
         class="fixed inset-0 z-50 flex items-center justify-center p-4"
         style="background:rgba(15,23,42,0.4);backdrop-filter:blur(2px);">
      <div (click)="$event.stopPropagation()"
           class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div class="flex items-center gap-2">
            <span class="text-xl">{{ inspectTx()!.status === 'success' ? '✅' : '⚠️' }}</span>
            <div>
              <h3 class="text-sm font-bold text-slate-900">Payment Breakdown</h3>
              <p class="text-[10px] font-mono text-slate-400">{{ inspectTx()!.id }}</p>
            </div>
          </div>
          <button (click)="inspectTx.set(null)" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="space-y-4 text-xs">
          <!-- Plain language explanation -->
          <div class="p-4 rounded-xl"
               [style]="inspectTx()!.status === 'success' ? 'background:#f0fdf4;border:1px solid #bbf7d0;' : 'background:#fef2f2;border:1px solid #fecaca;'">
            <p class="text-[10px] font-bold uppercase tracking-wider mb-1"
               [style]="inspectTx()!.status === 'success' ? 'color:#15803d;' : 'color:#b91c1c;'">
              Plain Language Explanation
            </p>
            <p class="text-slate-700 leading-relaxed font-medium">
              {{ getPlainExplanation(inspectTx()!) }}
            </p>
          </div>

          <!-- Transaction details -->
          <div class="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <div>
              <span class="text-[9px] font-bold text-slate-400 uppercase">Customer</span>
              <p class="font-bold text-slate-800">{{ inspectTx()!.customerName }}</p>
            </div>
            <div>
              <span class="text-[9px] font-bold text-slate-400 uppercase">Amount</span>
              <p class="font-bold text-slate-800">{{ inspectTx()!.amount | currency:'INR':'symbol':'1.0-0' }}</p>
            </div>
            <div>
              <span class="text-[9px] font-bold text-slate-400 uppercase">Payment Channel</span>
              <p class="font-semibold text-slate-700">{{ inspectTx()!.method }} ({{ inspectTx()!.gateway }})</p>
            </div>
            <div>
              <span class="text-[9px] font-bold text-slate-400 uppercase">Location</span>
              <p class="font-semibold text-slate-700">{{ inspectTx()!.region }}</p>
            </div>
          </div>

          <div class="flex gap-2 pt-2">
            <button (click)="askAboutTx(inspectTx()!)"
                    class="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white transition-all"
                    style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);">
              🎙 Ask Dhwani about this payment
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Simulate Payment Modal ────────────────────────────────────────── -->
    <div *ngIf="showSimulatorModal()"
         (click)="showSimulatorModal.set(false)"
         class="fixed inset-0 z-50 flex items-center justify-center p-4"
         style="background:rgba(15,23,42,0.4);backdrop-filter:blur(2px);">
      <div (click)="$event.stopPropagation()"
           class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
        <h3 class="text-base font-bold text-slate-900 mb-1">Simulate Real-time Transaction</h3>
        <p class="text-xs text-slate-500 mb-4">Add a test transaction to verify live updating in the ledger.</p>

        <form (submit)="submitSimulation()" class="space-y-3.5 text-xs">
          <div>
            <label class="block font-semibold text-slate-600 mb-1">Customer Name</label>
            <input type="text" [(ngModel)]="newTx.customerName" name="cust" required
                   class="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-400"/>
          </div>

          <div>
            <label class="block font-semibold text-slate-600 mb-1">Amount (₹)</label>
            <input type="number" [(ngModel)]="newTx.amount" name="amount" required
                   class="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-400"/>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Method</label>
              <select [(ngModel)]="newTx.method" name="method" class="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none">
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Netbanking">Netbanking</option>
                <option value="Wallet">Wallet</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Status</label>
              <select [(ngModel)]="newTx.status" name="status" class="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none">
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <div class="flex gap-2 pt-3">
            <button type="submit"
                    class="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white"
                    style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);">
              Inject Transaction
            </button>
            <button type="button" (click)="showSimulatorModal.set(false)"
                    class="px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`:host { display:block; }`]
})
export class PaymentsComponent {
  searchQuery = '';
  selectedStatus = 'all';
  selectedMethod = 'all';

  inspectTx = signal<Transaction | null>(null);
  showSimulatorModal = signal(false);

  newTx: {
    customerName: string;
    email: string;
    amount: number;
    currency: string;
    method: 'UPI' | 'Card' | 'Netbanking' | 'Wallet';
    gateway: 'Razorpay PG-1' | 'Razorpay PG-2' | 'HDFC PG' | 'ICICI PG';
    status: 'success' | 'failed' | 'processing';
    region: string;
  } = {
    customerName: 'Siddharth Varma',
    email: 'siddharth.v@gmail.com',
    amount: 5400,
    currency: 'INR',
    method: 'UPI',
    gateway: 'Razorpay PG-1',
    status: 'success',
    region: 'Tamil Nadu',
  };

  constructor(
    public dataService: DataService,
    public i18n:        TranslationService,
    private voice:      VoiceService,
  ) {}

  get filteredTransactions(): Transaction[] {
    return this.dataService.transactions().filter(tx => {
      const matchQuery = !this.searchQuery.trim() ||
        tx.customerName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        tx.id.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        tx.region.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchStatus = this.selectedStatus === 'all' || tx.status === this.selectedStatus;
      const matchMethod = this.selectedMethod === 'all' || tx.method === this.selectedMethod;
      return matchQuery && matchStatus && matchMethod;
    });
  }

  statusBadgeStyle(status: string): string {
    if (status === 'success')    return 'background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;';
    if (status === 'failed')     return 'background:#fef2f2;color:#dc2626;border:1px solid #fecaca;';
    return 'background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe;';
  }

  statusDotColor(status: string): string {
    if (status === 'success') return '#16a34a';
    if (status === 'failed')  return '#dc2626';
    return '#2563eb';
  }

  explainPayment(tx: Transaction) {
    this.inspectTx.set(tx);
  }

  getPlainExplanation(tx: Transaction): string {
    if (tx.status === 'success') {
      return `This payment of ₹${tx.amount.toLocaleString('en-IN')} was completed successfully via ${tx.method} on ${tx.gateway}. The money will be settled in your regular settlement cycle.`;
    }
    if (tx.failureReason?.includes('timeout') || tx.failureReason?.includes('Bank')) {
      return `This payment did not go through because the customer's bank network took too long to respond. The customer was not charged, and they can safely try again.`;
    }
    if (tx.failureReason?.includes('funds') || tx.failureReason?.includes('balance')) {
      return `This payment could not be completed because the customer's account did not have sufficient balance for ₹${tx.amount.toLocaleString('en-IN')}.`;
    }
    return `This payment was not completed by the payment gateway (${tx.gateway}). If multiple payments fail on this gateway, Dhwani can automatically reroute future payments to a secondary gateway.`;
  }

  askAgent() {
    this.voice.setDrawerOpen(true);
    setTimeout(() => this.voice.processCommand('How are my payments doing this week?'), 200);
  }

  askAboutTx(tx: Transaction) {
    this.inspectTx.set(null);
    this.voice.setDrawerOpen(true);
    setTimeout(() => {
      this.voice.processCommand(`Why did payment ${tx.id} for ${tx.customerName} ${tx.status}?`);
    }, 200);
  }

  openSimulatorModal() {
    this.showSimulatorModal.set(true);
  }

  submitSimulation() {
    this.dataService.addTransaction({
      customerName: this.newTx.customerName,
      email: this.newTx.email,
      amount: Number(this.newTx.amount),
      currency: 'INR',
      method: this.newTx.method,
      gateway: this.newTx.gateway,
      status: this.newTx.status,
      region: this.newTx.region,
      failureReason: this.newTx.status === 'failed' ? 'Bank network timeout' : undefined,
    });
    this.showSimulatorModal.set(false);
  }
}
