import { Component, signal, ElementRef, ViewChild, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as echarts from 'echarts';
import { AgentService } from '../../core/agent/agent.service';
import { AgentToolsService } from '../../core/agent/agent-tools.service';
import { SimulationResult, SimulationParams } from '../../core/agent/agent.types';

@Component({
  selector: 'app-decision-lab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Top Breadcrumb Bar & Status Pill -->
    <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-4">
      <div class="flex items-center gap-2 text-sm">
        <span class="text-slate-500 font-medium">Risk & Rules</span>
        <span class="text-slate-400 font-light">/</span>
        <span class="text-slate-500 font-medium">Policy Sandbox</span>
        <span class="text-slate-400 font-light">/</span>
        <span class="text-slate-900 font-bold">Simulation #402</span>
      </div>

      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-xs">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Staging - Mirroring Prod Data
        </span>
      </div>
    </div>

    <!-- Main Grid: Configuration (Left) & Analysis (Right) -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

      <!-- ── Left Column: POLICY SANDBOX CONFIGURATION ──────────────────── -->
      <div class="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
        
        <!-- Header -->
        <h2 class="text-xs font-bold text-slate-800 uppercase tracking-wider">
          POLICY SANDBOX CONFIGURATION
        </h2>

        <!-- Navigation Tabs -->
        <div class="flex items-center gap-6 border-b border-slate-200 text-xs">
          <button type="button" (click)="activeConfigTab = 'NATURAL'"
                  class="pb-2.5 font-bold transition-all relative"
                  [ngClass]="activeConfigTab === 'NATURAL' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600 border-b-2 border-transparent'">
            NATURAL LANGUAGE PROMPT (Active)
          </button>
          <button type="button" (click)="activeConfigTab = 'STRUCTURED'"
                  class="pb-2.5 font-bold transition-all relative"
                  [ngClass]="activeConfigTab === 'STRUCTURED' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600 border-b-2 border-transparent'">
            STRUCTURED RULE BUILDER
          </button>
        </div>

        <!-- Tab 1: Natural Language Prompt -->
        <div *ngIf="activeConfigTab === 'NATURAL'" class="space-y-4">
          
          <!-- Interactive Prompt Box with Highlighted Token Pills -->
          <div class="rounded-xl border border-slate-200 p-4 min-h-[140px] bg-white relative transition-colors focus-within:border-slate-400">
            <div *ngIf="!isEditingPrompt" (click)="enablePromptEdit()" class="cursor-text text-sm text-slate-800 leading-relaxed font-normal">
              Give repeat customers in 
              <span class="inline-flex items-center px-2 py-0.5 rounded bg-emerald-100/90 text-emerald-800 font-semibold border border-emerald-300 text-xs mx-0.5">
                [{{ selectedRegion }}]
              </span>
              a 
              <span class="inline-flex items-center px-2 py-0.5 rounded bg-sky-100/90 text-sky-800 font-semibold border border-sky-300 text-xs mx-0.5">
                [{{ selectedDiscount }}% discount]
              </span>
              for 
              <span class="inline-flex items-center px-2 py-0.5 rounded bg-amber-100/90 text-amber-800 font-semibold border border-amber-300 text-xs mx-0.5">
                [{{ selectedDuration }} days]
              </span>.
            </div>
            
            <textarea *ngIf="isEditingPrompt" #promptInputRef
                      [(ngModel)]="naturalInput" (blur)="onPromptBlur()"
                      class="w-full text-sm text-slate-800 bg-transparent resize-none focus:outline-none leading-relaxed"
                      rows="4" placeholder="Give repeat customers in [Coimbatore] a [10% discount] for [30 days]."></textarea>

            <div class="absolute bottom-2.5 right-3 text-[10px] text-slate-400">
              {{ isEditingPrompt ? 'Press click outside to format' : 'Click text to edit prompt' }}
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-2">
            <button type="button" (click)="runSimulation()" [disabled]="isRunning()"
                    class="flex-1 py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-60">
              <svg *ngIf="!isRunning()" class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <svg *ngIf="isRunning()" class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ isRunning() ? 'Calculating Impact Analysis...' : 'Run Impact Analysis' }}</span>
            </button>

            <button type="button" (click)="showCodeModal = true" title="View Compiled Rule Payload"
                    class="px-3.5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-mono font-bold text-xs shadow-xs transition-colors">
              &gt;_
            </button>
          </div>
        </div>

        <!-- Tab 2: Structured Rule Builder -->
        <div *ngIf="activeConfigTab === 'STRUCTURED'" class="space-y-4">
          <div class="rounded-xl border border-slate-200 p-4 space-y-4 bg-slate-50/50">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Target Region</label>
              <select [(ngModel)]="selectedRegion" (ngModelChange)="syncPromptFromForm()"
                      class="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs bg-white text-slate-800 focus:outline-none focus:border-slate-400">
                <option *ngFor="let c of cities" [value]="c">{{ c }}</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Discount Rate: {{ selectedDiscount }}%</label>
              <input type="range" min="5" max="30" step="5" [(ngModel)]="selectedDiscount" (ngModelChange)="syncPromptFromForm()"
                     class="w-full accent-slate-900"/>
              <div class="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>5%</span><span>10%</span><span>15%</span><span>20%</span><span>30%</span>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Duration: {{ selectedDuration }} Days</label>
              <input type="range" min="7" max="90" step="7" [(ngModel)]="selectedDuration" (ngModelChange)="syncPromptFromForm()"
                     class="w-full accent-slate-900"/>
              <div class="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>7d</span><span>14d</span><span>30d</span><span>60d</span><span>90d</span>
              </div>
            </div>
          </div>

          <button type="button" (click)="runSimulation()" [disabled]="isRunning()"
                  class="w-full py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-60">
            <span>{{ isRunning() ? 'Calculating Impact Analysis...' : 'Run Impact Analysis' }}</span>
          </button>
        </div>

        <!-- Collapsible Parameter Cards -->
        <div class="space-y-2 pt-2">
          
          <!-- Accordion 1: Target Cohort -->
          <div class="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <button type="button" (click)="toggleAccordion('cohort')"
                    class="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left">
              <span class="text-xs font-semibold text-slate-800">
                [ Target Cohort: {{ selectedCohort }} ]
              </span>
              <svg class="w-4 h-4 text-slate-400 transition-transform duration-200"
                   [ngClass]="openAccordion === 'cohort' ? 'rotate-180' : ''"
                   fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
              </svg>
            </button>
            <div *ngIf="openAccordion === 'cohort'" class="p-3.5 pt-0 border-t border-slate-100 bg-slate-50/50 space-y-2 text-xs">
              <p class="text-slate-500 text-[11px]">Select which segment receives this policy rule:</p>
              <div class="grid grid-cols-2 gap-2">
                <button *ngFor="let c of cohorts" type="button" (click)="setCohort(c)"
                        class="px-2.5 py-1.5 rounded-lg border text-xs font-medium text-left transition-colors"
                        [ngClass]="selectedCohort === c ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'">
                  {{ c }}
                </button>
              </div>
            </div>
          </div>

          <!-- Accordion 2: Duration -->
          <div class="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <button type="button" (click)="toggleAccordion('duration')"
                    class="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left">
              <span class="text-xs font-semibold text-slate-800">
                [ Duration: {{ selectedDuration }} Days ]
              </span>
              <svg class="w-4 h-4 text-slate-400 transition-transform duration-200"
                   [ngClass]="openAccordion === 'duration' ? 'rotate-180' : ''"
                   fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
              </svg>
            </button>
            <div *ngIf="openAccordion === 'duration'" class="p-3.5 pt-0 border-t border-slate-100 bg-slate-50/50 space-y-2 text-xs">
              <p class="text-slate-500 text-[11px]">Simulation horizon for baseline delta modeling:</p>
              <div class="flex gap-2">
                <button *ngFor="let d of [7, 14, 30, 60, 90]" type="button" (click)="setDuration(d)"
                        class="flex-1 py-1 rounded-lg border text-xs font-medium transition-colors"
                        [ngClass]="selectedDuration === d ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'">
                  {{ d }}d
                </button>
              </div>
            </div>
          </div>

          <!-- Accordion 3: Constraints -->
          <div class="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <button type="button" (click)="toggleAccordion('constraints')"
                    class="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left">
              <span class="text-xs font-semibold text-slate-800">
                [ Constraints: Budget Cap {{ selectedBudgetCap }} ]
              </span>
              <svg class="w-4 h-4 text-slate-400 transition-transform duration-200"
                   [ngClass]="openAccordion === 'constraints' ? 'rotate-180' : ''"
                   fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
              </svg>
            </button>
            <div *ngIf="openAccordion === 'constraints'" class="p-3.5 pt-0 border-t border-slate-100 bg-slate-50/50 space-y-2 text-xs">
              <p class="text-slate-500 text-[11px]">Guardrail maximum allocation for promotion subsidization:</p>
              <div class="flex gap-2">
                <button *ngFor="let b of ['$5k', '$10k', '$25k', '$50k']" type="button" (click)="selectedBudgetCap = b"
                        class="flex-1 py-1 rounded-lg border text-xs font-medium transition-colors"
                        [ngClass]="selectedBudgetCap === b ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'">
                  {{ b }}
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

      <!-- ── Right Column: PROJECTED IMPACT & DELTA ANALYSIS ───────────── -->
      <div class="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
        
        <!-- Header -->
        <h2 class="text-xs font-bold text-slate-800 uppercase tracking-wider">
          PROJECTED IMPACT & DELTA ANALYSIS
        </h2>

        <!-- KPIs Section -->
        <div>
          <p class="text-xs font-bold text-slate-900 mb-2.5">KPIs</p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            <!-- KPI 1: Net Margin Delta -->
            <div class="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs">
              <p class="text-[11px] font-medium text-slate-500 leading-tight">Net Margin Delta (Projected):</p>
              <div class="mt-1 flex items-baseline gap-1">
                <span class="text-xl font-extrabold text-slate-900 tracking-tight">{{ kpis.netMarginDelta }}</span>
                <span class="text-xs text-slate-500 font-normal">({{ kpis.netMarginAmount }})</span>
              </div>
            </div>

            <!-- KPI 2: Transaction Volume -->
            <div class="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs">
              <p class="text-[11px] font-medium text-slate-500 leading-tight">Transaction Volume:</p>
              <div class="mt-1">
                <span class="text-xl font-extrabold text-slate-900 tracking-tight">{{ kpis.transactionVolume }}</span>
              </div>
            </div>

            <!-- KPI 3: Fraud Exposure -->
            <div class="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs">
              <p class="text-[11px] font-medium text-slate-500 leading-tight">Fraud Exposure:</p>
              <div class="mt-1 flex items-baseline gap-1">
                <span class="text-xl font-extrabold text-slate-900 tracking-tight">{{ kpis.fraudExposure }}</span>
                <span class="text-xs text-slate-500 font-normal">({{ kpis.fraudShift }})</span>
              </div>
            </div>

          </div>
        </div>

        <!-- Projection Chart Section -->
        <div class="pt-1">
          
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <h3 class="text-xs font-bold text-slate-900">Projection chart</h3>
            
            <div class="flex items-center gap-4">
              <!-- Chart Legend -->
              <div class="flex items-center gap-3 text-xs">
                <span class="inline-flex items-center gap-1.5 font-medium text-slate-800">
                  <span class="w-3.5 h-[2.5px] bg-slate-900 inline-block rounded-full"></span>
                  Baseline
                </span>
                <span class="inline-flex items-center gap-1.5 font-medium text-slate-800">
                  <span class="w-3.5 h-[2.5px] bg-sky-400 inline-block rounded-full"></span>
                  Simulated
                </span>
              </div>

              <!-- Tag / Monospace Badge -->
              <span class="font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                JetBrains Mono [{{ selectedDuration }}]
              </span>
            </div>
          </div>

          <!-- ECharts Chart Canvas -->
          <div class="w-full relative bg-white rounded-xl overflow-hidden">
            <div #projectionChart style="height: 270px; width: 100%;"></div>
          </div>

          <!-- X-Axis Label Below Chart -->
          <p class="text-center text-[11px] text-slate-400 mt-2 font-medium">
            Days (used: {{ selectedDuration }} days)
          </p>
        </div>

      </div>

    </div>

    <!-- Rule Code Payload Drawer / Modal (&gt;_) -->
    <div *ngIf="showCodeModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div class="bg-slate-950 text-slate-200 rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-800 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span class="font-mono text-xs font-bold text-white">rule_specification_v2.json</span>
          </div>
          <button (click)="showCodeModal = false" class="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800">
            Close
          </button>
        </div>
        <pre class="font-mono text-xs text-indigo-300 bg-slate-900/90 p-4 rounded-xl overflow-x-auto border border-slate-800/80 leading-relaxed">{{ getCompiledJson() }}</pre>
        <div class="flex justify-end pt-1">
          <button (click)="showCodeModal = false" class="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white">
            Done
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class DecisionLabComponent implements AfterViewInit, OnDestroy {
  @ViewChild('projectionChart') projectionChartEl!: ElementRef;
  @ViewChild('promptInputRef') promptInputRef?: ElementRef<HTMLTextAreaElement>;
  
  private chartInst: echarts.ECharts | null = null;

  activeConfigTab: 'NATURAL' | 'STRUCTURED' = 'NATURAL';
  isEditingPrompt = false;
  showCodeModal = false;
  openAccordion: 'cohort' | 'duration' | 'constraints' | null = null;

  naturalInput = 'Give repeat customers in [Coimbatore] a [10% discount] for [30 days].';

  selectedRegion = 'Coimbatore';
  selectedCohort = 'Repeat Customers';
  selectedDiscount = 10;
  selectedDuration = 30;
  selectedBudgetCap = '$10k';

  isRunning = signal<boolean>(false);

  kpis = {
    netMarginDelta: '-2.1%',
    netMarginAmount: '$14.2k',
    transactionVolume: '+18.4%',
    fraudExposure: 'Low',
    fraudShift: '0.04% Shift'
  };

  cities = ['Coimbatore', 'Chennai', 'Madurai', 'Trichy', 'Mumbai', 'Bangalore', 'Delhi'];
  cohorts = ['Repeat Customers', 'New Customers', 'High-Value Accounts', 'All Customers'];

  constructor(
    private agent: AgentService,
    private tools: AgentToolsService
  ) {}

  ngAfterViewInit() {
    setTimeout(() => {
      this.renderProjectionChart();
    }, 150);
  }

  ngOnDestroy() {
    this.chartInst?.dispose();
  }

  @HostListener('window:resize')
  onResize() {
    this.chartInst?.resize();
  }

  toggleAccordion(tab: 'cohort' | 'duration' | 'constraints') {
    this.openAccordion = this.openAccordion === tab ? null : tab;
  }

  setCohort(c: string) {
    this.selectedCohort = c;
    this.syncPromptFromForm();
  }

  setDuration(d: number) {
    this.selectedDuration = d;
    this.syncPromptFromForm();
    this.renderProjectionChart();
  }

  enablePromptEdit() {
    this.isEditingPrompt = true;
    setTimeout(() => {
      this.promptInputRef?.nativeElement.focus();
    }, 50);
  }

  onPromptBlur() {
    this.isEditingPrompt = false;
    this.parsePrompt();
  }

  syncPromptFromForm() {
    this.naturalInput = `Give ${this.selectedCohort.toLowerCase()} in [${this.selectedRegion}] a [${this.selectedDiscount}% discount] for [${this.selectedDuration} days].`;
  }

  parsePrompt() {
    const text = this.naturalInput.toLowerCase();
    
    // Check city
    const foundCity = this.cities.find(c => text.includes(c.toLowerCase()));
    if (foundCity) this.selectedRegion = foundCity;

    // Check discount
    const discMatch = text.match(/(\d+)\s*%/);
    if (discMatch) this.selectedDiscount = parseInt(discMatch[1], 10);

    // Check duration
    const durMatch = text.match(/(\d+)\s*(day|days)/);
    if (durMatch) this.selectedDuration = parseInt(durMatch[1], 10);

    // Check cohort
    if (text.includes('new customer')) this.selectedCohort = 'New Customers';
    else if (text.includes('high-value') || text.includes('high value')) this.selectedCohort = 'High-Value Accounts';
    else if (text.includes('all customer')) this.selectedCohort = 'All Customers';
    else if (text.includes('repeat')) this.selectedCohort = 'Repeat Customers';
  }

  runSimulation() {
    this.isRunning.set(true);
    setTimeout(() => {
      // Dynamic shift based on discount & duration
      const lift = Math.round((this.selectedDiscount * 1.84) * 10) / 10;
      const margin = (this.selectedDiscount * -0.21).toFixed(1);
      const marginAmt = (this.selectedDiscount * 1.42).toFixed(1);

      this.kpis = {
        netMarginDelta: `${margin}%`,
        netMarginAmount: `$${marginAmt}k`,
        transactionVolume: `+${lift}%`,
        fraudExposure: this.selectedDiscount > 20 ? 'Medium' : 'Low',
        fraudShift: '0.04% Shift'
      };

      this.renderProjectionChart();
      this.isRunning.set(false);
    }, 700);
  }

  private renderProjectionChart() {
    if (!this.projectionChartEl?.nativeElement) return;
    if (this.chartInst) {
      this.chartInst.dispose();
    }
    this.chartInst = echarts.init(this.projectionChartEl.nativeElement);

    const xDays = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '26', '27', '28', '29', '30'];
    
    // Baseline dataset matching exact reference curve
    const baseline = [
      180, 240, 360, 480, 560, 620, 640, 680, 1050, 1260, 1150, 1220, 1380, 1400, 1420, 1440, 1480, 1530, 1360, 1490, 1630, 1620, 1680, 1750, 1840
    ];

    // Simulated dataset matching exact reference curve
    const simulated = [
      180, 320, 470, 620, 770, 880, 920, 780, 1210, 1290, 780, 840, 1710, 1700, 1700, 1780, 1830, 1880, 1680, 1850, 2090, 2090, 2190, 2320, 2460
    ];

    const option: echarts.EChartsOption = {
      animation: true,
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#0f172a',
        borderColor: '#1e293b',
        textStyle: { color: '#ffffff', fontSize: 11, fontFamily: 'Inter, system-ui' },
        formatter: (params: any) => {
          let str = `<div class="font-bold mb-1">Day ${params[0]?.name}</div>`;
          for (const item of params) {
            str += `<div class="flex items-center justify-between gap-3 text-[11px]">
              <span>${item.marker} ${item.seriesName}</span>
              <span class="font-bold">${item.value}k</span>
            </div>`;
          }
          return str;
        }
      },
      grid: {
        left: '6%',
        right: '2%',
        top: '6%',
        bottom: '8%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: xDays,
        boundaryGap: false,
        axisLine: {
          lineStyle: { color: '#cbd5e1' }
        },
        axisLabel: {
          color: '#64748b',
          fontSize: 10,
          fontFamily: 'Inter, system-ui'
        },
        axisTick: {
          show: false
        }
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 2500,
        interval: 500,
        axisLabel: {
          formatter: '{value}k',
          color: '#64748b',
          fontSize: 10,
          fontFamily: 'Inter, system-ui'
        },
        splitLine: {
          lineStyle: {
            color: '#f1f5f9',
            type: 'solid'
          }
        }
      },
      series: [
        {
          name: 'Baseline',
          type: 'line',
          data: baseline,
          smooth: 0.15,
          showSymbol: false,
          lineStyle: {
            color: '#0f172a',
            width: 2.2
          },
          itemStyle: {
            color: '#0f172a'
          }
        },
        {
          name: 'Simulated',
          type: 'line',
          data: simulated,
          smooth: 0.15,
          showSymbol: false,
          lineStyle: {
            color: '#38bdf8',
            width: 2.2
          },
          itemStyle: {
            color: '#38bdf8'
          }
        }
      ]
    };

    this.chartInst.setOption(option);
  }

  getCompiledJson(): string {
    const payload = {
      simulationId: "SIM-402",
      targetCohort: this.selectedCohort,
      region: this.selectedRegion,
      offer: {
        type: "PERCENTAGE_DISCOUNT",
        value: this.selectedDiscount
      },
      durationDays: this.selectedDuration,
      constraints: {
        budgetCap: this.selectedBudgetCap,
        currency: "USD"
      },
      environment: "staging-mirror-prod",
      engine: "Dhwani Decision Intelligence"
    };
    return JSON.stringify(payload, null, 2);
  }
}
