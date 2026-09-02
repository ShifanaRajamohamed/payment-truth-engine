import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, HostListener, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import * as echarts from 'echarts';
import { DataService } from '../../core/services/data.service';
import { VoiceService } from '../../core/services/voice.service';
import { TranslationService } from '../../core/language/translation.service';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- ── Simple Mode ──────────────────────────────────────────────────── -->
    <div *ngIf="prefs.simpleMode()">

      <!-- Greeting + Voice hero -->
      <div class="text-center mb-8">
        <p class="text-slate-500 text-sm mb-1">{{ greeting }}</p>
        <h1 class="text-2xl font-bold text-slate-900 mb-6">{{ i18n.t('home.how_can_i_help') }}</h1>

        <!-- Big mic button -->
        <div class="flex flex-col items-center gap-3 mb-8">
          <button id="home-mic-btn"
                  (click)="openVoice()"
                  class="w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg"
                  style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);box-shadow:0 8px 32px rgba(59,130,246,0.4);"
                  [class.animate-pulse]="voice.isListening()">
            <svg class="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3Z"/>
            </svg>
          </button>
          <p class="text-sm text-slate-500 font-medium">{{ i18n.t('home.voice_hint') }}</p>
        </div>

        <!-- Tap mode quick actions -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
          <button *ngFor="let card of tapCards"
                  (click)="askQuestion(card.cmd)"
                  class="flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-slate-100 bg-white transition-all hover:border-blue-200 hover:shadow-md"
                  style="box-shadow:0 2px 8px rgba(0,0,0,0.04);">
            <span class="text-3xl">{{ card.icon }}</span>
            <span class="text-sm font-bold text-slate-800">{{ i18n.t(card.labelKey) }}</span>
          </button>
        </div>
      </div>

      <!-- Simple summary cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">

        <div class="bg-white rounded-2xl p-6" style="border:2px solid #dbeafe;box-shadow:0 2px 12px rgba(59,130,246,0.08);">
          <p class="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">{{ i18n.t('simple.money.label') }}</p>
          <p class="text-3xl font-extrabold text-slate-900 mb-1">{{ data.merchantSummary().revenueLabel }}</p>
          <p class="text-sm text-slate-500">{{ data.merchantSummary().revenueExplain }}</p>
        </div>

        <div class="bg-white rounded-2xl p-6" style="border:2px solid #dcfce7;box-shadow:0 2px 12px rgba(16,185,129,0.08);">
          <p class="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">{{ i18n.t('simple.orders.label') }}</p>
          <p class="text-3xl font-extrabold text-slate-900 mb-1">{{ data.merchantSummary().orderLabel }}</p>
          <p class="text-sm text-slate-500">Orders this week</p>
        </div>

        <div class="bg-white rounded-2xl p-6 sm:col-span-2" style="border:2px solid #fef9c3;box-shadow:0 2px 12px rgba(234,179,8,0.08);">
          <p class="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">⚠️ {{ i18n.t('simple.watch.label') }}</p>
          <p class="text-sm text-slate-700">{{ data.merchantSummary().watchItem }}</p>
        </div>

        <div class="bg-white rounded-2xl p-6" style="border:2px solid #d1fae5;box-shadow:0 2px 12px rgba(16,185,129,0.06);">
          <p class="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">📍 {{ i18n.t('simple.best_area.label') }}</p>
          <p class="text-2xl font-extrabold text-slate-900">{{ data.merchantSummary().bestArea }}</p>
        </div>

        <div class="bg-white rounded-2xl p-6" style="border:2px solid #ede9fe;box-shadow:0 2px 12px rgba(139,92,246,0.06);">
          <p class="text-xs font-bold text-violet-600 uppercase tracking-wider mb-2">💡 {{ i18n.t('simple.advice.label') }}</p>
          <p class="text-sm text-slate-700">{{ data.merchantSummary().advice }}</p>
        </div>
      </div>
    </div>

    <!-- ── Standard Mode ─────────────────────────────────────────────────── -->
    <div *ngIf="!prefs.simpleMode()">

      <!-- Page header + mode switch -->
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-7">
        <div>
          <p class="text-slate-500 text-sm">{{ greeting }}</p>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">{{ i18n.t('home.how_can_i_help') }}</h1>
        </div>
        <div class="mt-3 sm:mt-1 flex items-center gap-2">
          <button (click)="openVoice()"
                  class="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white rounded-xl transition-all"
                  style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);box-shadow:0 4px 12px rgba(59,130,246,0.3);">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3Z"/>
            </svg>
            Ask Dhwani
          </button>
        </div>
      </div>

      <!-- Metric cards -->
      <div class="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div *ngFor="let stat of primaryStats"
             class="bg-white rounded-2xl p-5 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-default"
             style="border:1px solid rgba(15,31,69,0.07);box-shadow:0 2px 8px rgba(15,31,69,0.04);">
          <div class="flex items-start justify-between mb-4">
            <div>
              <p class="text-xs font-semibold text-slate-400 mb-0.5">{{ stat.label }}</p>
              <p class="text-[10px] text-slate-300">{{ stat.sublabel }}</p>
            </div>
            <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" [style.background]="stat.iconBg">
              <svg class="w-4 h-4" [style.color]="stat.iconColor" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="stat.iconPath"/>
              </svg>
            </div>
          </div>
          <p class="text-2xl font-bold text-slate-900 tracking-tight mb-1">{{ stat.value }}</p>
          <p class="text-[11px] text-slate-500 italic mb-2">{{ stat.explain }}</p>
          <span class="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                [ngClass]="stat.positive ? 'text-emerald-700 bg-emerald-50' : 'text-red-600 bg-red-50'">
            <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="stat.positive ? 'm4.5 15.75 7.5-7.5 7.5 7.5' : 'm19.5 8.25-7.5 7.5-7.5-7.5'"/>
            </svg>
            {{ stat.change }}
          </span>
        </div>
      </div>

      <!-- Charts row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <!-- Activity chart -->
        <div class="lg:col-span-2 bg-white rounded-2xl p-5"
             style="border:1px solid rgba(15,31,69,0.07);box-shadow:0 2px 8px rgba(15,31,69,0.04);">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-sm font-bold text-slate-800">Payment activity</h3>
              <p class="text-[11px] text-slate-400 mt-0.5">Revenue this year · Monthly view</p>
            </div>
          </div>
          <div #activityChart style="height:220px;width:100%;"></div>
        </div>

        <!-- Recent payments -->
        <div class="bg-white rounded-2xl p-5 flex flex-col"
             style="border:1px solid rgba(15,31,69,0.07);box-shadow:0 2px 8px rgba(15,31,69,0.04);">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-bold text-slate-800">Recent payments</h3>
            <a routerLink="/app/payments" class="text-[11px] font-semibold text-blue-600 hover:text-blue-700">View all →</a>
          </div>
          <div class="flex-1 space-y-3">
            <div *ngFor="let tx of recentPayments" class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                   [style.background]="avatarColor(tx.customerName)">
                {{ tx.customerName.charAt(0) }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold text-slate-800 truncate">{{ tx.customerName }}</p>
                <p class="text-[10px] text-slate-400">{{ tx.method }} · {{ tx.region }}</p>
              </div>
              <div class="text-right flex-shrink-0">
                <p class="text-xs font-bold" [ngClass]="tx.status === 'success' ? 'text-emerald-600' : 'text-red-500'">
                  {{ tx.status === 'success' ? '+' : '-' }}{{ tx.amount | currency:'INR':'symbol':'1.0-0' }}
                </p>
                <p class="text-[10px] text-slate-400">{{ tx.status }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Business signals -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div *ngFor="let sig of businessSignals"
             class="bg-white rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-md hover:-translate-y-0.5"
             style="border:1px solid rgba(15,31,69,0.07);box-shadow:0 2px 8px rgba(15,31,69,0.04);">
          <div>
            <div class="flex items-center gap-2 mb-3">
              <span class="w-2 h-2 rounded-full" [ngClass]="{'bg-emerald-400':sig.type==='growth','bg-amber-400':sig.type==='risk','bg-blue-400':sig.type==='opportunity'}"></span>
              <span class="text-[10px] font-bold uppercase tracking-widest"
                    [ngClass]="{'text-emerald-600':sig.type==='growth','text-amber-600':sig.type==='risk','text-blue-600':sig.type==='opportunity'}">
                {{ sig.typeLabel }}
              </span>
            </div>
            <p class="text-xs font-medium text-slate-700 leading-relaxed">{{ sig.description }}</p>
            <p *ngIf="sig.metric" class="text-base font-bold text-slate-900 mt-3">{{ sig.metric }}</p>
          </div>
          <div class="mt-5 pt-4" style="border-top:1px solid rgba(15,31,69,0.06);">
            <a [routerLink]="sig.route" class="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
               [ngClass]="{'text-emerald-600 hover:text-emerald-700':sig.type==='growth','text-amber-600 hover:text-amber-700':sig.type==='risk','text-blue-600 hover:text-blue-700':sig.type==='opportunity'}">
              {{ sig.action }}
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`:host { display:block; }`]
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('activityChart') activityChartEl!: ElementRef;
  private chartInstance: echarts.ECharts | null = null;

  tapCards = [
    { icon: '💰', labelKey: 'home.tap.money',   cmd: 'How much money did I receive this week?' },
    { icon: '🛒', labelKey: 'home.tap.orders',  cmd: 'How many orders did I get?' },
    { icon: '📍', labelKey: 'home.tap.where',   cmd: 'Which city is doing best?' },
    { icon: '⚠️', labelKey: 'home.tap.problem', cmd: 'Are there any payment problems?' },
    { icon: '💡', labelKey: 'home.tap.advice',  cmd: 'What should I do to improve my business?' },
  ];

  primaryStats = [
    {
      label: 'Total Revenue', sublabel: 'This month', value: '₹12.4L', change: '+18.4%', positive: true,
      explain: 'You received more money this month than last.',
      iconColor: '#3b82f6', iconBg: '#eff6ff',
      iconPath: 'M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z',
    },
    {
      label: 'Transactions', sublabel: 'This month', value: '18,492', change: '+12.2%', positive: true,
      explain: 'More orders came in compared to last month.',
      iconColor: '#8b5cf6', iconBg: '#f5f3ff',
      iconPath: 'M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5',
    },
    {
      label: 'Customers', sublabel: 'This month', value: '8,291', change: '+8.1%', positive: true,
      explain: 'More people bought from you this month.',
      iconColor: '#f59e0b', iconBg: '#fffbeb',
      iconPath: 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z',
    },
    {
      label: 'Payment Success', sublabel: 'This month', value: '96.8%', change: '+1.2%', positive: true,
      explain: 'Out of 100 payments, about 97 went through.',
      iconColor: '#10b981', iconBg: '#ecfdf5',
      iconPath: 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    },
  ];

  businessSignals = [
    { type: 'growth',      typeLabel: 'Growth signal',  description: 'Coimbatore payments increased 31% this month. Your best-performing city right now.', metric: '₹8.2L revenue', route: '/app/map',          action: 'View on map →' },
    { type: 'risk',        typeLabel: 'Watch this',      description: 'More orders were returned in Madurai this week. A small offer might bring customers back.',   metric: '',            route: '/app/opportunities', action: 'See what to do →' },
    { type: 'opportunity', typeLabel: 'Opportunity',     description: 'Trichy has many repeat customers who haven\'t bought in 30 days. A reminder could help.',     metric: '',            route: '/app/customers',     action: 'View customers →' },
  ];

  private avatarColors = [
    'linear-gradient(135deg,#3b82f6,#6366f1)',
    'linear-gradient(135deg,#8b5cf6,#a78bfa)',
    'linear-gradient(135deg,#f59e0b,#fbbf24)',
    'linear-gradient(135deg,#10b981,#34d399)',
    'linear-gradient(135deg,#ef4444,#f87171)',
    'linear-gradient(135deg,#ec4899,#f472b6)',
  ];

  constructor(
    public data:  DataService,
    public voice: VoiceService,
    public i18n:  TranslationService,
    public prefs: UserPreferencesService,
    private auth: AuthService,
  ) {}

  get greeting(): string {
    const h = new Date().getHours();
    const name = this.auth.currentUser()?.name ?? 'Merchant';
    const key = h < 12 ? 'home.greeting.morning' : h < 17 ? 'home.greeting.afternoon' : 'home.greeting.evening';
    return `${this.i18n.t(key)}, ${name}.`;
  }

  get recentPayments() { return this.data.transactions().slice(0, 5); }

  avatarColor(name: string): string {
    return this.avatarColors[name.charCodeAt(0) % this.avatarColors.length];
  }

  openVoice() { this.voice.setDrawerOpen(true); }

  askQuestion(cmd: string) {
    this.voice.setDrawerOpen(true);
    setTimeout(() => this.voice.processCommand(cmd), 200);
  }

  ngAfterViewInit() { setTimeout(() => this.initChart(), 0); }
  ngOnDestroy()     { this.chartInstance?.dispose(); }

  @HostListener('window:resize')
  onResize() { this.chartInstance?.resize(); }

  private initChart() {
    if (!this.activityChartEl) return;
    this.chartInstance = echarts.init(this.activityChartEl.nativeElement);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const income  = [3.2, 4.1, 5.6, 4.8, 6.2, 7.8, 6.5, 8.2, 7.4, 9.1, 10.2, 12.4];
    const expense = [2.1, 2.8, 3.4, 3.1, 4.2, 5.1, 4.6, 5.4, 4.9, 5.8,  6.2,  7.1];
    this.chartInstance.setOption({
      tooltip: { trigger: 'axis', backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(15,31,69,0.08)', textStyle: { fontSize: 11, fontFamily: 'Inter,system-ui', color: '#334155' } },
      legend: { data: ['Revenue', 'Expenses'], right: 0, itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11, color: '#94a3b8' } },
      grid: { left: 0, right: 16, bottom: 0, top: 28, containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: months, axisLine: { lineStyle: { color: 'rgba(15,31,69,0.08)' } }, axisTick: { show: false }, axisLabel: { fontSize: 10, color: '#94a3b8' } },
      yAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: 'rgba(15,31,69,0.06)', type: 'dashed' } }, axisLabel: { fontSize: 10, color: '#94a3b8', formatter: '₹{value}L' } },
      series: [
        { name: 'Revenue',  type: 'line', data: income,  smooth: 0.5, showSymbol: false, lineStyle: { width: 2.5, color: '#3b82f6' }, itemStyle: { color: '#3b82f6' }, areaStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'rgba(59,130,246,0.12)'},{offset:1,color:'rgba(59,130,246,0)'}]) } },
        { name: 'Expenses', type: 'line', data: expense, smooth: 0.5, showSymbol: false, lineStyle: { width: 2.5, color: '#8b5cf6' }, itemStyle: { color: '#8b5cf6' }, areaStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'rgba(139,92,246,0.08)'},{offset:1,color:'rgba(139,92,246,0)'}]) } },
      ],
    });
  }
}
