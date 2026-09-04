import { Component, signal, ElementRef, ViewChild, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as echarts from 'echarts';
import { AgentService } from '../../core/agent/agent.service';
import { TranslationService } from '../../core/language/translation.service';
import { VoiceService } from '../../core/services/voice.service';
import { AgentToolsService } from '../../core/agent/agent-tools.service';
import { SimulationResult, SimulationParams } from '../../core/agent/agent.types';

@Component({
  selector: 'app-decision-lab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Header -->
    <div class="mb-7">
      <div class="flex items-center gap-2 mb-1">
        <span class="text-lg">🔮</span>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">{{ i18n.t('decisionlab.title') }}</h1>
      </div>
      <p class="text-sm text-slate-500">{{ i18n.t('decisionlab.subtitle') }}</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

      <!-- ── Left: Input ──────────────────────────────────────────────── -->
      <div class="space-y-5">

        <!-- Conversational input -->
        <div class="bg-white rounded-2xl p-6" style="border:1px solid rgba(15,31,69,0.07);box-shadow:0 2px 8px rgba(15,31,69,0.04);">
          <p class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{{ i18n.t('decisionlab.input.label') }}</p>

          <textarea id="scenario-text-input" [(ngModel)]="naturalInput" rows="3"
                    [placeholder]="i18n.t('decisionlab.input.placeholder')"
                    class="w-full text-sm text-slate-800 rounded-xl border border-slate-200 px-3.5 py-2.5 resize-none focus:outline-none focus:border-blue-400 transition-all"
                    style="background:#f8fafc;"></textarea>

          <div class="flex gap-2 mt-3">
            <button id="run-natural-btn" type="button" (click)="runFromNatural()"
                    [disabled]="!naturalInput.trim() || isRunning()"
                    class="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                    style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);box-shadow:0 4px 12px rgba(59,130,246,0.3);">
              <svg *ngIf="!isRunning()" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z"/>
              </svg>
              <svg *ngIf="isRunning()" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {{ isRunning() ? i18n.t('simulation.running') : i18n.t('simulation.run') }}
            </button>
            <button type="button" (click)="openVoice()" title="Use voice"
                    class="px-3 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3Z"/>
              </svg>
            </button>
          </div>

          <!-- Example prompts -->
          <div class="mt-4">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Try these examples:</p>
            <div class="space-y-1.5">
              <button *ngFor="let ex of examples" (click)="naturalInput = ex"
                      class="w-full text-left text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all">
                "{{ ex }}"
              </button>
            </div>
          </div>
        </div>

        <!-- OR: Form-based input -->
        <div class="bg-white rounded-2xl p-6" style="border:1px solid rgba(15,31,69,0.07);box-shadow:0 2px 8px rgba(15,31,69,0.04);">
          <p class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">{{ i18n.t('decisionlab.or_fill_form') }}</p>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1.5">{{ i18n.t('decisionlab.region.label') }}</label>
              <select [(ngModel)]="formParams.region" id="region-select"
                      class="block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white focus:border-blue-400 focus:outline-none">
                <option *ngFor="let c of cities" [value]="c">{{ c }}</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1.5">{{ i18n.t('decisionlab.segment.label') }}</label>
              <div class="grid grid-cols-2 gap-2">
                <button *ngFor="let seg of segments" (click)="formParams.segment = seg.key"
                        class="py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-left"
                        [style]="formParams.segment === seg.key
                          ? 'background:#eff6ff;border-color:#3b82f6;color:#1e3a8a;'
                          : 'background:#f8fafc;border-color:#e2e8f0;color:#64748b;'">
                  {{ seg.icon }} {{ seg.label }}
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1.5">{{ i18n.t('decisionlab.discount.label') }}: <strong>{{ formParams.discountPct }}%</strong></label>
              <input type="range" min="5" max="30" step="5" [(ngModel)]="formParams.discountPct"
                     class="w-full accent-blue-500"/>
              <div class="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>5%</span><span>15%</span><span>25%</span><span>30%</span>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1.5">{{ i18n.t('decisionlab.duration.label') }}: <strong>{{ formParams.durationDays }} days</strong></label>
              <input type="range" min="7" max="90" step="7" [(ngModel)]="formParams.durationDays"
                     class="w-full accent-blue-500"/>
              <div class="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>7d</span><span>30d</span><span>60d</span><span>90d</span>
              </div>
            </div>

            <button id="run-form-btn" type="button" (click)="runFromForm()"
                    [disabled]="isRunning()"
                    class="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                    style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);">
              {{ isRunning() ? i18n.t('simulation.running') : i18n.t('simulation.run') }}
            </button>
          </div>
        </div>
      </div>

      <!-- ── Right: Result ─────────────────────────────────────────────── -->
      <div>
        <!-- Empty state -->
        <div *ngIf="!result() && !isRunning()" class="bg-white rounded-2xl p-10 text-center h-full flex flex-col items-center justify-center"
             style="border:1px solid rgba(15,31,69,0.07);box-shadow:0 2px 8px rgba(15,31,69,0.04);min-height:300px;">
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
               style="background:linear-gradient(135deg,#eff6ff,#f5f3ff);">
            <span class="text-3xl">🔮</span>
          </div>
          <p class="text-sm font-semibold text-slate-700 mb-2">No simulation yet</p>
          <p class="text-xs text-slate-400">{{ i18n.t('simulation.voice_intro') }}</p>
        </div>

        <!-- Loading state -->
        <div *ngIf="isRunning()" class="bg-white rounded-2xl p-10 text-center flex flex-col items-center justify-center"
             style="border:1px solid rgba(15,31,69,0.07);box-shadow:0 2px 8px rgba(15,31,69,0.04);min-height:300px;">
          <div class="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-500 animate-spin mb-4"></div>
          <p class="text-sm font-semibold text-slate-700">{{ i18n.t('simulation.running') }}</p>
          <p class="text-xs text-slate-400 mt-1">Running estimate based on your past data…</p>
        </div>

        <!-- Result card -->
        <div *ngIf="result() && !isRunning()" class="bg-white rounded-2xl overflow-hidden"
             style="border:1px solid rgba(15,31,69,0.07);box-shadow:0 2px 8px rgba(15,31,69,0.04);">

          <!-- Result header -->
          <div class="px-6 py-4" style="background:linear-gradient(135deg,#eff6ff,#eef2ff);border-bottom:1px solid #dbeafe;">
            <p class="text-xs font-bold text-blue-700 uppercase tracking-wider">
              {{ i18n.t('simulation.title', { duration: '' + result()!.params.durationDays }) }}
            </p>
            <p class="text-sm text-blue-600 mt-0.5">
              {{ result()!.params.discountPct }}% offer · {{ result()!.params.segment }} customers · {{ result()!.params.region }}
            </p>
          </div>

          <!-- Estimate badge -->
          <div class="px-6 py-2 flex items-center gap-2" style="background:#fffbeb;border-bottom:1px solid #fef3c7;">
            <svg class="w-3.5 h-3.5 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
            </svg>
            <p class="text-[10px] text-amber-700 font-medium">{{ i18n.t('simulation.disclaimer') }}</p>
          </div>

          <!-- Result tiles -->
          <div class="p-6 space-y-3">
            <!-- Revenue -->
            <div class="flex items-center gap-4 p-4 rounded-xl"
                 [style]="result()!.revenueChangeSign === '+' ? 'background:#f0fdf4;border:1px solid #bbf7d0;' : 'background:#fef2f2;border:1px solid #fecaca;'">
              <span class="text-2xl">💰</span>
              <div class="flex-1">
                <p class="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                   [style]="result()!.revenueChangeSign === '+' ? 'color:#16a34a;' : 'color:#dc2626;'">
                  {{ i18n.t('simulation.money.label') }}
                </p>
                <p class="text-lg font-extrabold"
                   [style]="result()!.revenueChangeSign === '+' ? 'color:#15803d;' : 'color:#b91c1c;'">
                  {{ result()!.revenueChangeFmt }}
                </p>
                <p class="text-xs text-slate-500 mt-0.5">
                  {{ i18n.t(result()!.revenueChangeSign === '+' ? 'simulation.money.up' : 'simulation.money.down', { amount: cleanAmount(result()!.revenueChangeFmt) }) }}
                </p>
              </div>
            </div>

            <!-- Orders -->
            <div class="flex items-center gap-4 p-4 rounded-xl"
                 [style]="result()!.orderChangeSign === '+' ? 'background:#eff6ff;border:1px solid #bfdbfe;' : 'background:#fef2f2;border:1px solid #fecaca;'">
              <span class="text-2xl">🛒</span>
              <div class="flex-1">
                <p class="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                   [style]="result()!.orderChangeSign === '+' ? 'color:#1d4ed8;' : 'color:#dc2626;'">
                  {{ i18n.t('simulation.orders.label') }}
                </p>
                <p class="text-lg font-extrabold"
                   [style]="result()!.orderChangeSign === '+' ? 'color:#1e40af;' : 'color:#b91c1c;'">
                  {{ result()!.orderChangeFmt }} more orders
                </p>
              </div>
            </div>

            <!-- Returns -->
            <div class="flex items-center gap-4 p-4 rounded-xl" style="background:#fffbeb;border:1px solid #fde68a;">
              <span class="text-2xl">↩️</span>
              <div class="flex-1">
                <p class="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-0.5">{{ i18n.t('simulation.returns.label') }}</p>
                <p class="text-sm font-semibold text-amber-800">{{ result()!.returnChangeLabel }}</p>
              </div>
            </div>

            <!-- Recommendation -->
            <div class="p-4 rounded-xl" style="background:#f5f3ff;border:1px solid #ddd6fe;">
              <p class="text-[10px] font-bold text-violet-700 uppercase tracking-wider mb-1.5">💡 {{ i18n.t('simulation.recommendation.label') }}</p>
              <p class="text-sm text-violet-900">{{ result()!.recommendation }}</p>
            </div>
          </div>

          <!-- Chart -->
          <div class="px-6 pb-6">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Revenue projection</p>
            <div #projectionChart style="height:180px;width:100%;"></div>
          </div>

          <!-- Actions -->
          <div class="px-6 pb-6 flex gap-2">
            <button (click)="reset()" class="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
              {{ i18n.t('simulation.new') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`:host { display:block; }`]
})
export class DecisionLabComponent implements OnDestroy {
  @ViewChild('projectionChart') projectionChartEl!: ElementRef;
  private chartInst: echarts.ECharts | null = null;

  naturalInput = '';
  isRunning    = signal(false);
  result       = signal<SimulationResult | null>(null);

  cities = ['Coimbatore', 'Chennai', 'Madurai', 'Trichy', 'Mumbai', 'Bangalore', 'Delhi'];

  segments = [
    { key: 'repeat'     as const, icon: '🔄', label: 'Repeat customers' },
    { key: 'new'        as const, icon: '✨', label: 'New customers' },
    { key: 'high_value' as const, icon: '💎', label: 'High-value accounts' },
    { key: 'all'        as const, icon: '👥', label: 'All customers' },
  ];

  formParams: SimulationParams = { region: 'Coimbatore', segment: 'repeat', discountPct: 10, durationDays: 30 };

  examples = [
    'Give repeat customers in Coimbatore a 10% discount for 30 days',
    'What if I offer 15% off to new customers in Chennai?',
    'Coimbatore repeat customers-ku 10% discount kudutha enna aagum?',
  ];

  constructor(
    private agent: AgentService,
    private tools: AgentToolsService,
    public  i18n:  TranslationService,
    private voice: VoiceService,
  ) {}

  openVoice() { this.voice.setDrawerOpen(true); }

  runFromNatural() {
    if (!this.naturalInput.trim()) return;
    this.isRunning.set(true);
    this.result.set(null);
    setTimeout(() => {
      const response = this.agent.process(this.naturalInput);
      if (response.simulationResult) {
        this.result.set(response.simulationResult);
        setTimeout(() => this.initChart(response.simulationResult!), 100);
      } else {
        // Extract params and run manually
        const params = this._extractParams(this.naturalInput);
        const res = this.tools.runScenario(params);
        this.result.set(res);
        setTimeout(() => this.initChart(res), 100);
      }
      this.isRunning.set(false);
    }, 1800);
  }

  runFromForm() {
    this.isRunning.set(true);
    this.result.set(null);
    setTimeout(() => {
      const res = this.tools.runScenario(this.formParams);
      this.result.set(res);
      this.isRunning.set(false);
      setTimeout(() => this.initChart(res), 100);
    }, 1800);
  }

  reset() {
    this.result.set(null);
    this.naturalInput = '';
    this.chartInst?.dispose();
    this.chartInst = null;
  }

  ngOnDestroy() { this.chartInst?.dispose(); }

  @HostListener('window:resize')
  onResize() { this.chartInst?.resize(); }

  private initChart(res: SimulationResult) {
    if (!this.projectionChartEl) return;
    if (this.chartInst) this.chartInst.dispose();
    this.chartInst = echarts.init(this.projectionChartEl.nativeElement);
    const weeks = ['Week 1','Week 2','Week 3','Week 4','Now','Week 1','Week 2','Week 3','Week 4'];
    const base = 100;
    const lift = res.revenueChangeSign === '+' ? 18 : -5;
    const projected = [0,0,0,0,base, base+lift*0.3, base+lift*0.6, base+lift*0.8, base+lift];
    this.chartInst.setOption({
      tooltip: { trigger: 'axis', textStyle: { fontSize: 11, fontFamily: 'Inter,system-ui' } },
      grid: { left: 0, right: 8, bottom: 0, top: 16, containLabel: true },
      xAxis: { type: 'category', data: weeks, axisLabel: { fontSize: 10, color: '#94a3b8' }, axisLine: { lineStyle: { color: 'rgba(15,31,69,0.08)' } }, axisTick: { show: false } },
      yAxis: { type: 'value', axisLabel: { fontSize: 10, color: '#94a3b8', formatter: '{value}%' }, axisLine: { show: false }, splitLine: { lineStyle: { color: 'rgba(15,31,69,0.06)', type: 'dashed' } } },
      series: [{
        type: 'line', data: projected, smooth: 0.4,
        markLine: { data: [{ xAxis: 4, lineStyle: { color: '#94a3b8', type: 'dashed' } }], label: { formatter: 'Start', color: '#94a3b8', fontSize: 10 } },
        lineStyle: { color: res.revenueChangeSign === '+' ? '#3b82f6' : '#ef4444', width: 2.5 },
        itemStyle: { color: res.revenueChangeSign === '+' ? '#3b82f6' : '#ef4444' },
        areaStyle: { color: res.revenueChangeSign === '+' ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.08)' },
      }],
    });
  }

  private _extractParams(text: string): SimulationParams {
    const q = text.toLowerCase();
    const cities = ['coimbatore','chennai','madurai','trichy','mumbai','bangalore','delhi'];
    const city = cities.find(c => q.includes(c)) ?? 'Coimbatore';
    const discountMatch = q.match(/(\d+)\s*%/);
    const durationMatch = q.match(/(\d+)\s*(day|days|நாட்கள்|दिन)/);
    let segment: SimulationParams['segment'] = 'all';
    if (['repeat','loyal','திரும்ப','नियमित'].some(kw => q.includes(kw))) segment = 'repeat';
    else if (['new customer','புதிய','नए'].some(kw => q.includes(kw))) segment = 'new';
    return {
      region: city.charAt(0).toUpperCase() + city.slice(1),
      segment,
      discountPct: discountMatch ? parseInt(discountMatch[1], 10) : 10,
      durationDays: durationMatch ? parseInt(durationMatch[1], 10) : 30,
    };
  }

  cleanAmount(val: string): string {
    return (val || '').replace(/[^0-9,]/g, '');
  }
}
