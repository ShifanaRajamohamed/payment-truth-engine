import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import * as echarts from 'echarts';
import { DataService, RegionMetric } from '../../core/services/data.service';
import { VoiceService } from '../../core/services/voice.service';
import { TranslationService } from '../../core/language/translation.service';

@Component({
  selector: 'app-regions',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-7">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="text-lg">📊</span>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Region Insights</h1>
        </div>
        <p class="text-sm text-slate-500">State-by-state checkout health, network latencies, and growth rates.</p>
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

    <!-- KPI cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="bg-white rounded-2xl p-5" style="border:1px solid rgba(15,31,69,0.07);box-shadow:0 2px 8px rgba(15,31,69,0.04);">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Highest Payment Success</p>
        <p class="text-2xl font-extrabold text-slate-900">{{ highestSuccessRegion?.name }}</p>
        <p class="text-xs text-emerald-600 font-semibold mt-1">{{ highestSuccessRegion?.successRate }}% success rate ({{ highestSuccessRegion?.activeGateway }})</p>
      </div>

      <div class="bg-white rounded-2xl p-5" style="border:1px solid rgba(15,31,69,0.07);box-shadow:0 2px 8px rgba(15,31,69,0.04);">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Fastest Response Time</p>
        <p class="text-2xl font-extrabold text-slate-900">{{ lowestLatencyRegion?.name }}</p>
        <p class="text-xs text-blue-600 font-semibold mt-1">{{ lowestLatencyRegion?.latencyMs }}ms average gateway response</p>
      </div>

      <div class="bg-white rounded-2xl p-5" style="border:1px solid rgba(15,31,69,0.07);box-shadow:0 2px 8px rgba(15,31,69,0.04);">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Total Monitored Volume</p>
        <p class="text-2xl font-extrabold text-slate-900">{{ totalVolume | currency:'INR':'symbol':'1.0-0' }}</p>
        <p class="text-xs text-slate-500 mt-1">Across {{ dataService.regions().length }} active states</p>
      </div>
    </div>

    <!-- Comparative Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div class="bg-white rounded-2xl p-5" style="border:1px solid rgba(15,31,69,0.07);box-shadow:0 2px 8px rgba(15,31,69,0.04);">
        <div class="mb-4">
          <h2 class="text-sm font-bold text-slate-800">Success Rate by State</h2>
          <p class="text-[11px] text-slate-400 mt-0.5">Percentage of completed transactions (%)</p>
        </div>
        <div #srChartContainer style="height:240px;width:100%;"></div>
      </div>

      <div class="bg-white rounded-2xl p-5" style="border:1px solid rgba(15,31,69,0.07);box-shadow:0 2px 8px rgba(15,31,69,0.04);">
        <div class="mb-4">
          <h2 class="text-sm font-bold text-slate-800">Checkout Latency by State</h2>
          <p class="text-[11px] text-slate-400 mt-0.5">Network round-trip response time (ms)</p>
        </div>
        <div #latencyChartContainer style="height:240px;width:100%;"></div>
      </div>
    </div>

    <!-- Regional Breakdown Cards -->
    <div class="bg-white rounded-2xl p-6" style="border:1px solid rgba(15,31,69,0.07);box-shadow:0 2px 8px rgba(15,31,69,0.04);">
      <h2 class="text-sm font-bold text-slate-900 mb-4">State Health Summaries</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div *ngFor="let reg of dataService.regions()"
             class="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-bold text-slate-900 text-sm">{{ reg.name }}</h3>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    [style]="reg.status === 'growing' ? 'background:#f0fdf4;color:#16a34a;' : reg.status === 'declining' ? 'background:#fef2f2;color:#dc2626;' : 'background:#fffbeb;color:#d97706;'">
                {{ reg.status === 'growing' ? '🟢 ' : reg.status === 'declining' ? '🔴 ' : '🟡 ' }}{{ reg.status }}
              </span>
            </div>
            <p class="text-xs text-slate-600 mb-3">{{ reg.plainStatus }}</p>
          </div>

          <div class="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200/60 text-[11px]">
            <div>
              <span class="text-slate-400 block text-[9px] uppercase font-bold">Volume</span>
              <span class="font-bold text-slate-800">₹{{ (reg.volume / 100000).toFixed(1) }}L</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[9px] uppercase font-bold">Success</span>
              <span class="font-bold text-emerald-600">{{ reg.successRate }}%</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[9px] uppercase font-bold">Latency</span>
              <span class="font-bold text-slate-800">{{ reg.latencyMs }}ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class RegionsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('srChartContainer') srChartEl!: ElementRef;
  @ViewChild('latencyChartContainer') latencyChartEl!: ElementRef;

  private srChart: echarts.ECharts | null = null;
  private latencyChart: echarts.ECharts | null = null;

  constructor(
    public dataService: DataService,
    public i18n: TranslationService,
    private voice: VoiceService,
  ) {}

  get totalVolume(): number {
    return this.dataService.regions().reduce((sum, r) => sum + r.volume, 0);
  }

  get highestSuccessRegion(): RegionMetric | undefined {
    return [...this.dataService.regions()].sort((a, b) => b.successRate - a.successRate)[0];
  }

  get lowestLatencyRegion(): RegionMetric | undefined {
    return [...this.dataService.regions()].sort((a, b) => a.latencyMs - b.latencyMs)[0];
  }

  askAgent() {
    this.voice.setDrawerOpen(true);
    setTimeout(() => this.voice.processCommand('How is Maharashtra and Tamil Nadu performing?'), 200);
  }

  ngAfterViewInit() {
    setTimeout(() => this.initCharts(), 0);
  }

  ngOnDestroy() {
    this.srChart?.dispose();
    this.latencyChart?.dispose();
  }

  @HostListener('window:resize')
  onResize() {
    this.srChart?.resize();
    this.latencyChart?.resize();
  }

  private initCharts() {
    const regions = this.dataService.regions();
    const names = regions.map(r => r.name);
    const successRates = regions.map(r => r.successRate);
    const latencies = regions.map(r => r.latencyMs);

    if (this.srChartEl) {
      this.srChart = echarts.init(this.srChartEl.nativeElement);
      this.srChart.setOption({
        tooltip: { trigger: 'axis', formatter: '{b}: {c}%' },
        grid: { left: 0, right: 16, bottom: 0, top: 16, containLabel: true },
        xAxis: { type: 'category', data: names, axisLabel: { fontSize: 10, color: '#94a3b8', interval: 0, rotate: 15 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
        yAxis: { type: 'value', min: 70, max: 100, axisLabel: { fontSize: 10, color: '#94a3b8', formatter: '{value}%' }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
        series: [{ type: 'bar', data: successRates, itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] }, barWidth: '40%' }]
      });
    }

    if (this.latencyChartEl) {
      this.latencyChart = echarts.init(this.latencyChartEl.nativeElement);
      this.latencyChart.setOption({
        tooltip: { trigger: 'axis', formatter: '{b}: {c}ms' },
        grid: { left: 0, right: 16, bottom: 0, top: 16, containLabel: true },
        xAxis: { type: 'category', data: names, axisLabel: { fontSize: 10, color: '#94a3b8', interval: 0, rotate: 15 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
        yAxis: { type: 'value', axisLabel: { fontSize: 10, color: '#94a3b8', formatter: '{value}ms' }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
        series: [{ type: 'bar', data: latencies, itemStyle: { color: '#8b5cf6', borderRadius: [4, 4, 0, 0] }, barWidth: '40%' }]
      });
    }
  }
}
