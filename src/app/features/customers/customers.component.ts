import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, Customer } from '../../core/services/data.service';
import { VoiceService } from '../../core/services/voice.service';
import { TranslationService } from '../../core/language/translation.service';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-7">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="text-lg">👥</span>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">My Customers</h1>
        </div>
        <p class="text-sm text-slate-500">View customer loyalty, repeat purchase patterns, and buyer locations.</p>
      </div>

      <div class="mt-4 sm:mt-0 flex items-center gap-3">
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
    <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-2xl p-5" style="border:1px solid rgba(15,31,69,0.07);box-shadow:0 2px 8px rgba(15,31,69,0.04);">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Total Customers</p>
        <p class="text-2xl font-extrabold text-slate-900">{{ dataService.totalCustomers() | number }}</p>
        <p class="text-xs text-emerald-600 font-semibold mt-1">↑ +8.1% this month</p>
      </div>

      <div class="bg-white rounded-2xl p-5" style="border:1px solid rgba(15,31,69,0.07);box-shadow:0 2px 8px rgba(15,31,69,0.04);">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Repeat Buyers</p>
        <p class="text-2xl font-extrabold text-blue-600">62%</p>
        <p class="text-xs text-slate-500 mt-1">Bought more than once</p>
      </div>

      <div class="bg-white rounded-2xl p-5" style="border:1px solid rgba(15,31,69,0.07);box-shadow:0 2px 8px rgba(15,31,69,0.04);">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Top Buyer City</p>
        <p class="text-2xl font-extrabold text-slate-900">Coimbatore</p>
        <p class="text-xs text-slate-500 mt-1">72% repeat customer rate</p>
      </div>

      <div class="bg-white rounded-2xl p-5" style="border:1px solid rgba(15,31,69,0.07);box-shadow:0 2px 8px rgba(15,31,69,0.04);">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Avg Customer Spend</p>
        <p class="text-2xl font-extrabold text-slate-900">₹4,500</p>
        <p class="text-xs text-slate-500 mt-1">Per transaction average</p>
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
                 placeholder="Search by customer name, email, or city…"
                 class="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-400 bg-slate-50"/>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <select [(ngModel)]="selectedSegment" class="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none">
          <option value="all">All Customer Types</option>
          <option value="repeat">Repeat Buyers Only</option>
          <option value="new">New Customers Only</option>
          <option value="high_value">High-Value (₹10L+)</option>
        </select>
      </div>
    </div>

    <!-- Customer Directory Table -->
    <div class="bg-white rounded-2xl overflow-hidden"
         style="border:1px solid rgba(15,31,69,0.07);box-shadow:0 2px 8px rgba(15,31,69,0.04);">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-100 text-left">
          <thead class="bg-slate-50/75">
            <tr class="text-[10px] uppercase text-slate-500 font-bold tracking-wider">
              <th class="py-3.5 px-5">Customer</th>
              <th class="py-3.5 px-4">City</th>
              <th class="py-3.5 px-4">Loyalty Type</th>
              <th class="py-3.5 px-4">Total Paid</th>
              <th class="py-3.5 px-4">Payment Success</th>
              <th class="py-3.5 px-4">Risk Profile</th>
              <th class="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-xs">
            <tr *ngFor="let c of filteredCustomers" class="hover:bg-slate-50/70 transition-colors">
              <td class="py-3.5 px-5">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                       [style.background]="avatarColor(c.name)">
                    {{ c.name.charAt(0) }}
                  </div>
                  <div>
                    <p class="font-bold text-slate-900">{{ c.name }}</p>
                    <p class="text-[10px] text-slate-400">{{ c.email }}</p>
                  </div>
                </div>
              </td>
              <td class="py-3.5 px-4 font-medium text-slate-700">
                {{ c.city || 'Tamil Nadu' }}
              </td>
              <td class="py-3.5 px-4">
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
                      [style]="c.isRepeat ? 'background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe;' : 'background:#f8fafc;color:#64748b;border:1px solid #e2e8f0;'">
                  {{ c.isRepeat ? '🔄 Repeat Buyer' : '✨ New Customer' }}
                </span>
              </td>
              <td class="py-3.5 px-4">
                <span class="font-extrabold text-sm text-slate-900">{{ c.totalVolume | currency:'INR':'symbol':'1.0-0' }}</span>
              </td>
              <td class="py-3.5 px-4">
                <span class="font-bold text-emerald-600">{{ c.successRate }}%</span>
                <span class="text-[10px] text-slate-400 block">Out of 100 payments</span>
              </td>
              <td class="py-3.5 px-4">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      [style]="riskBadgeStyle(c.riskLevel)">
                  <span class="w-1.5 h-1.5 rounded-full" [style.background]="riskDotColor(c.riskLevel)"></span>
                  {{ c.riskLevel }} risk
                </span>
              </td>
              <td class="py-3.5 px-4 text-right">
                <button (click)="inspectCustomer(c)"
                        class="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors">
                  View Profile 👤
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Customer Detail Modal ─────────────────────────────────────────── -->
    <div *ngIf="selectedCustomer()"
         (click)="selectedCustomer.set(null)"
         class="fixed inset-0 z-50 flex items-center justify-center p-4"
         style="background:rgba(15,23,42,0.4);backdrop-filter:blur(2px);">
      <div (click)="$event.stopPropagation()"
           class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                 [style.background]="avatarColor(selectedCustomer()!.name)">
              {{ selectedCustomer()!.name.charAt(0) }}
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-900">{{ selectedCustomer()!.name }}</h3>
              <p class="text-xs text-slate-400">{{ selectedCustomer()!.email }} · {{ selectedCustomer()!.city }}</p>
            </div>
          </div>
          <button (click)="selectedCustomer.set(null)" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="space-y-4 text-xs">
          <!-- Plain language profile -->
          <div class="p-4 rounded-xl bg-blue-50/70 border border-blue-100">
            <p class="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-1">Customer Summary</p>
            <p class="text-slate-700 leading-relaxed font-medium">
              {{ selectedCustomer()!.name }} has spent {{ selectedCustomer()!.totalVolume | currency:'INR':'symbol':'1.0-0' }} with your business.
              {{ selectedCustomer()!.isRepeat ? 'They are a loyal repeat buyer in ' + selectedCustomer()!.city + '.' : 'They recently started purchasing from your business.' }}
              Their payment success rate is {{ selectedCustomer()!.successRate }}%.
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <div>
              <span class="text-[9px] font-bold text-slate-400 uppercase">Customer ID</span>
              <p class="font-mono text-slate-800">{{ selectedCustomer()!.id }}</p>
            </div>
            <div>
              <span class="text-[9px] font-bold text-slate-400 uppercase">Risk Evaluation</span>
              <p class="font-bold capitalize" [style.color]="riskDotColor(selectedCustomer()!.riskLevel)">
                {{ selectedCustomer()!.riskLevel }} risk
              </p>
            </div>
          </div>

          <div class="flex gap-2 pt-2">
            <button (click)="askAboutCustomer(selectedCustomer()!)"
                    class="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white transition-all"
                    style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);">
              🎙 Ask Dhwani about this customer
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`:host { display:block; }`]
})
export class CustomersComponent {
  searchQuery = '';
  selectedSegment = 'all';
  selectedCustomer = signal<Customer | null>(null);

  private avatarColors = [
    'linear-gradient(135deg,#3b82f6,#6366f1)',
    'linear-gradient(135deg,#8b5cf6,#a78bfa)',
    'linear-gradient(135deg,#f59e0b,#fbbf24)',
    'linear-gradient(135deg,#10b981,#34d399)',
    'linear-gradient(135deg,#ef4444,#f87171)',
    'linear-gradient(135deg,#ec4899,#f472b6)',
  ];

  constructor(
    public dataService: DataService,
    public i18n:        TranslationService,
    private voice:      VoiceService,
  ) {}

  get filteredCustomers(): Customer[] {
    return this.dataService.customers().filter(c => {
      const matchQuery = !this.searchQuery.trim() ||
        c.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (c.city && c.city.toLowerCase().includes(this.searchQuery.toLowerCase()));
      const matchSegment = this.selectedSegment === 'all' ||
        (this.selectedSegment === 'repeat' && c.isRepeat) ||
        (this.selectedSegment === 'new' && !c.isRepeat) ||
        (this.selectedSegment === 'high_value' && c.totalVolume >= 1000000);
      return matchQuery && matchSegment;
    });
  }

  avatarColor(name: string): string {
    return this.avatarColors[name.charCodeAt(0) % this.avatarColors.length];
  }

  riskBadgeStyle(risk: string): string {
    if (risk === 'low')    return 'background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;';
    if (risk === 'medium') return 'background:#fffbeb;color:#d97706;border:1px solid #fde68a;';
    return 'background:#fef2f2;color:#dc2626;border:1px solid #fecaca;';
  }

  riskDotColor(risk: string): string {
    if (risk === 'low')    return '#16a34a';
    if (risk === 'medium') return '#d97706';
    return '#dc2626';
  }

  inspectCustomer(c: Customer) {
    this.selectedCustomer.set(c);
  }

  askAgent() {
    this.voice.setDrawerOpen(true);
    setTimeout(() => this.voice.processCommand('Tell me about my repeat customers in Coimbatore'), 200);
  }

  askAboutCustomer(c: Customer) {
    this.selectedCustomer.set(null);
    this.voice.setDrawerOpen(true);
    setTimeout(() => {
      this.voice.processCommand(`How many orders did ${c.name} make?`);
    }, 200);
  }
}
