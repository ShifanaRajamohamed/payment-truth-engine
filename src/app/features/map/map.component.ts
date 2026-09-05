import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import Plotly from 'plotly.js-dist-min';
import { VoiceService } from '../../core/services/voice.service';
import { DataService } from '../../core/services/data.service';

export interface GlobalHub {
  id: string;
  name: string;
  country: string;
  region: 'APAC' | 'EMEA' | 'AMER';
  lat: number;
  lon: number;
  volume: number; // in USD
  volumeLabel: string;
  fraudScore: number; // 0-100
  latencyMs: number;
  status: 'Normal' | 'Under Review' | 'High Risk Alert';
  statusColor: string;
  activeGateways: number;
  recentAnomaly?: string;
}

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6 font-sans">
      
      <!-- ── Top Header & Global KPI Metrics ────────────────────────────── -->
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5">
            <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">Global Activity Intelligence</h1>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              <span class="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
              Plotly Geo-Engine
            </span>
          </div>
          <p class="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time cross-border transaction volume density, routing latency & fraud anomaly interception.
          </p>
        </div>

        <!-- Controls Bar: Time Range, Region, Live Stream Toggle -->
        <div class="flex flex-wrap items-center gap-3">
          
          <!-- Live Stream Pulse Toggle -->
          <button (click)="toggleLiveStream()"
                  class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm"
                  [ngClass]="isLiveStream()
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'">
            <span class="w-2 h-2 rounded-full" [ngClass]="isLiveStream() ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'"></span>
            <span>Live Stream: {{ isLiveStream() ? 'ON (1.2s)' : 'PAUSED' }}</span>
          </button>

          <!-- Time Range Selector -->
          <div class="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm text-xs font-semibold">
            <button *ngFor="let t of timeRanges" (click)="setTimeRange(t)"
                    class="px-2.5 py-1 rounded-lg transition-all"
                    [ngClass]="selectedTimeRange() === t ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'">
              {{ t }}
            </button>
          </div>

          <!-- Region Filter -->
          <div class="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm text-xs font-semibold">
            <button *ngFor="let r of regions" (click)="setRegion(r)"
                    class="px-2.5 py-1 rounded-lg transition-all"
                    [ngClass]="selectedRegion() === r ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'">
              {{ r }}
            </button>
          </div>

          <!-- Voice Query Button -->
          <button (click)="openVoice()"
                  class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#4f46e5] to-[#4338ca] shadow-md hover:from-[#4338ca] hover:to-[#3730a3] transition-all">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3Z"/>
            </svg>
            <span>Ask Dhwani</span>
          </button>
        </div>
      </div>

      <!-- ── KPI Summary Cards ──────────────────────────────────────────── -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Active Volume</p>
          <p class="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">$48.24M</p>
          <p class="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
            <span>↑ +14.8%</span>
            <span class="text-slate-400 font-normal">vs previous cycle</span>
          </p>
        </div>

        <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Hub Gateways</p>
          <p class="text-xl sm:text-2xl font-extrabold text-indigo-600 mt-1">{{ filteredHubs().length }} Nodes</p>
          <p class="text-[11px] text-slate-500 mt-0.5">Across APAC, EMEA, AMER</p>
        </div>

        <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Risk Interception Rate</p>
          <p class="text-xl sm:text-2xl font-extrabold text-emerald-600 mt-1">99.94%</p>
          <p class="text-[11px] text-slate-500 mt-0.5">3 anomalies under scrutiny</p>
        </div>

        <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg Settlement Latency</p>
          <p class="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">138 ms</p>
          <p class="text-[11px] text-emerald-600 font-semibold mt-0.5">Optimal RTGS clearing</p>
        </div>

      </div>

      <!-- ── Main Plotly Map & Hub Inspector ────────────────────────────── -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- Plotly Geo-Visualization Container (8 cols) -->
        <div class="lg:col-span-8 bg-white rounded-3xl p-5 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative overflow-hidden">
          
          <!-- Map Legend Bar -->
          <div class="flex flex-wrap items-center justify-between gap-3 pb-3 mb-2 border-b border-slate-100 text-xs">
            <div class="flex items-center gap-4">
              <span class="font-bold text-slate-700">Hub Status:</span>
              <span class="flex items-center gap-1.5 text-slate-600 font-medium">
                <span class="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span>
                Normal (Green)
              </span>
              <span class="flex items-center gap-1.5 text-slate-600 font-medium">
                <span class="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span>
                Under Review (Amber)
              </span>
              <span class="flex items-center gap-1.5 text-slate-600 font-medium">
                <span class="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span>
                High Risk Alert (Red)
              </span>
            </div>

            <span class="text-[11px] text-slate-400 font-mono">Projection: Equirectangular ScatterGeo</span>
          </div>

          <!-- The Plotly Map Viewport -->
          <div #plotlyChartContainer class="w-full h-[520px] rounded-2xl bg-[#0b1329] overflow-hidden"></div>

          <!-- Bottom Map Note -->
          <div class="flex items-center justify-between pt-3 text-[11px] text-slate-400">
            <span>Hover or click any node to view real-time settlement telemetry.</span>
            <span>Live Sync: <strong>Dhwani Risk Engine Active</strong></span>
          </div>
        </div>

        <!-- Right Hub Inspector & Live Nodes Queue (4 cols) -->
        <div class="lg:col-span-4 space-y-5">
          
          <!-- Selected Hub Telemetry Card -->
          <div *ngIf="selectedHub(); else noHub"
               class="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4 animate-fadeIn">
            
            <div class="flex items-start justify-between">
              <div>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ selectedHub()!.region }} · {{ selectedHub()!.country }}</span>
                <h3 class="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">{{ selectedHub()!.name }}</h3>
              </div>
              <span class="px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"
                    [ngClass]="{
                      'bg-emerald-50 text-emerald-700 border border-emerald-200': selectedHub()!.status === 'Normal',
                      'bg-amber-50 text-amber-700 border border-amber-200': selectedHub()!.status === 'Under Review',
                      'bg-red-50 text-red-700 border border-red-200': selectedHub()!.status === 'High Risk Alert'
                    }">
                <span class="w-1.5 h-1.5 rounded-full"
                      [ngClass]="{
                        'bg-emerald-500': selectedHub()!.status === 'Normal',
                        'bg-amber-500': selectedHub()!.status === 'Under Review',
                        'bg-red-500': selectedHub()!.status === 'High Risk Alert'
                      }"></span>
                {{ selectedHub()!.status }}
              </span>
            </div>

            <!-- Anomaly alert banner if flagged -->
            <div *ngIf="selectedHub()!.recentAnomaly"
                 class="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <span class="mt-0.5">⚠️</span>
              <p class="leading-relaxed"><strong>Signal:</strong> {{ selectedHub()!.recentAnomaly }}</p>
            </div>

            <!-- Hub Details Grid -->
            <div class="grid grid-cols-2 gap-3 text-xs">
              <div class="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span class="text-[10px] font-semibold text-slate-400 uppercase">24h Settlement</span>
                <p class="text-base font-extrabold text-slate-900 mt-0.5">{{ selectedHub()!.volumeLabel }}</p>
              </div>

              <div class="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span class="text-[10px] font-semibold text-slate-400 uppercase">Fraud Score</span>
                <p class="text-base font-extrabold mt-0.5"
                   [ngClass]="selectedHub()!.fraudScore > 50 ? 'text-red-600' : selectedHub()!.fraudScore > 20 ? 'text-amber-600' : 'text-emerald-600'">
                  {{ selectedHub()!.fraudScore }} / 100
                </p>
              </div>

              <div class="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span class="text-[10px] font-semibold text-slate-400 uppercase">Gateway Latency</span>
                <p class="text-base font-extrabold text-slate-900 mt-0.5">{{ selectedHub()!.latencyMs }} ms</p>
              </div>

              <div class="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span class="text-[10px] font-semibold text-slate-400 uppercase">Active Rails</span>
                <p class="text-base font-extrabold text-indigo-600 mt-0.5">{{ selectedHub()!.activeGateways }} Gateways</p>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="space-y-2 pt-2">
              <a routerLink="/app/risk"
                 class="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                <span>Inspect in Fraud Protection →</span>
              </a>
              <button (click)="askAboutHub(selectedHub()!)"
                      class="w-full py-2 px-3 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors">
                🎙 Ask AI Officer about {{ selectedHub()!.name }}
              </button>
            </div>

          </div>

          <ng-template #noHub>
            <div class="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-center space-y-2">
              <span class="text-3xl block">🌐</span>
              <h3 class="text-sm font-bold text-slate-900">Select a Global Hub</h3>
              <p class="text-xs text-slate-400 max-w-xs mx-auto">Click any node pin on the Plotly map or choose from the list below to inspect live routing metrics.</p>
            </div>
          </ng-template>

          <!-- Live Nodes Queue -->
          <div class="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Active Global Gateways</h4>
            
            <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
              <div *ngFor="let hub of filteredHubs()"
                   (click)="selectHub(hub)"
                   class="p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs"
                   [ngClass]="selectedHub()?.id === hub.id ? 'bg-indigo-50/70 border-indigo-300' : 'bg-slate-50/50 border-slate-100 hover:bg-slate-100'">
                <div class="flex items-center gap-2.5">
                  <span class="w-2 h-2 rounded-full"
                        [ngClass]="{
                          'bg-emerald-500': hub.status === 'Normal',
                          'bg-amber-500': hub.status === 'Under Review',
                          'bg-red-500': hub.status === 'High Risk Alert'
                        }"></span>
                  <div>
                    <p class="font-bold text-slate-900">{{ hub.name }}</p>
                    <p class="text-[10px] text-slate-400">{{ hub.country }} · {{ hub.latencyMs }}ms</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="font-extrabold text-slate-900">{{ hub.volumeLabel }}</p>
                  <span class="text-[10px] font-semibold"
                        [ngClass]="hub.fraudScore > 50 ? 'text-red-600' : hub.fraudScore > 20 ? 'text-amber-600' : 'text-emerald-600'">
                    Score: {{ hub.fraudScore }}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  `,
  styles: [`
    :host { display: block; }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
  `]
})
export class MapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('plotlyChartContainer') chartEl!: ElementRef;

  readonly timeRanges = ['1H', '24H', '7D'];
  readonly selectedTimeRange = signal<string>('24H');

  readonly regions = ['ALL', 'APAC', 'EMEA', 'AMER'];
  readonly selectedRegion = signal<string>('ALL');

  readonly isLiveStream = signal<boolean>(true);
  readonly selectedHub = signal<GlobalHub | null>(null);

  private streamInterval: any = null;

  globalHubs: GlobalHub[] = [
    // APAC
    { id: 'sin', name: 'Singapore', country: 'Singapore', region: 'APAC', lat: 1.3521, lon: 103.8198, volume: 8450000, volumeLabel: '$8.45M', fraudScore: 4, latencyMs: 24, status: 'Normal', statusColor: '#10B981', activeGateways: 12 },
    { id: 'bom', name: 'Mumbai', country: 'India', region: 'APAC', lat: 19.0760, lon: 72.8777, volume: 12400000, volumeLabel: '$12.40M', fraudScore: 8, latencyMs: 18, status: 'Normal', statusColor: '#10B981', activeGateways: 18 },
    { id: 'blr', name: 'Bengaluru', country: 'India', region: 'APAC', lat: 12.9716, lon: 77.5946, volume: 9200000, volumeLabel: '$9.20M', fraudScore: 5, latencyMs: 14, status: 'Normal', statusColor: '#10B981', activeGateways: 14 },
    { id: 'tok', name: 'Tokyo', country: 'Japan', region: 'APAC', lat: 35.6762, lon: 139.6503, volume: 6800000, volumeLabel: '$6.80M', fraudScore: 2, latencyMs: 48, status: 'Normal', statusColor: '#10B981', activeGateways: 8 },
    { id: 'syd', name: 'Sydney', country: 'Australia', region: 'APAC', lat: -33.8688, lon: 151.2093, volume: 4200000, volumeLabel: '$4.20M', fraudScore: 6, latencyMs: 72, status: 'Normal', statusColor: '#10B981', activeGateways: 6 },
    { id: 'hkg', name: 'Hong Kong', country: 'Hong Kong', region: 'APAC', lat: 22.3193, lon: 114.1694, volume: 5100000, volumeLabel: '$5.10M', fraudScore: 38, latencyMs: 32, status: 'Under Review', statusColor: '#F59E0B', activeGateways: 10, recentAnomaly: 'Velocity spike in cross-border e-wallet settlements.' },

    // EMEA
    { id: 'lon', name: 'London', country: 'United Kingdom', region: 'EMEA', lat: 51.5074, lon: -0.1278, volume: 11200000, volumeLabel: '$11.20M', fraudScore: 7, latencyMs: 86, status: 'Normal', statusColor: '#10B981', activeGateways: 16 },
    { id: 'fra', name: 'Frankfurt', country: 'Germany', region: 'EMEA', lat: 50.1109, lon: 8.6821, volume: 7600000, volumeLabel: '$7.60M', fraudScore: 3, latencyMs: 92, status: 'Normal', statusColor: '#10B981', activeGateways: 9 },
    { id: 'dxb', name: 'Dubai', country: 'UAE', region: 'EMEA', lat: 25.2048, lon: 55.2708, volume: 8900000, volumeLabel: '$8.90M', fraudScore: 11, latencyMs: 58, status: 'Normal', statusColor: '#10B981', activeGateways: 11 },
    { id: 'ams', name: 'Amsterdam', country: 'Netherlands', region: 'EMEA', lat: 52.3676, lon: 4.9041, volume: 3800000, volumeLabel: '$3.80M', fraudScore: 68, latencyMs: 89, status: 'High Risk Alert', statusColor: '#EF4444', activeGateways: 5, recentAnomaly: 'Synthetic credential stuffing detected on API ingress.' },

    // AMER
    { id: 'nyc', name: 'New York', country: 'United States', region: 'AMER', lat: 40.7128, lon: -74.0060, volume: 14500000, volumeLabel: '$14.50M', fraudScore: 9, latencyMs: 142, status: 'Normal', statusColor: '#10B981', activeGateways: 20 },
    { id: 'sfo', name: 'San Francisco', country: 'United States', region: 'AMER', lat: 37.7749, lon: -122.4194, volume: 9800000, volumeLabel: '$9.80M', fraudScore: 6, latencyMs: 168, status: 'Normal', statusColor: '#10B981', activeGateways: 15 },
    { id: 'sao', name: 'São Paulo', country: 'Brazil', region: 'AMER', lat: -23.5505, lon: -46.6333, volume: 2900000, volumeLabel: '$2.90M', fraudScore: 44, latencyMs: 210, status: 'Under Review', statusColor: '#F59E0B', activeGateways: 4, recentAnomaly: 'Elevated chargeback request ratio in instant Pix corridor.' },
    { id: 'tor', name: 'Toronto', country: 'Canada', region: 'AMER', lat: 43.6532, lon: -79.3832, volume: 3400000, volumeLabel: '$3.40M', fraudScore: 5, latencyMs: 154, status: 'Normal', statusColor: '#10B981', activeGateways: 6 }
  ];

  constructor(
    public data: DataService,
    public voice: VoiceService,
  ) {
    this.selectedHub.set(this.globalHubs[0]);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.renderPlotlyMap();
      this.startLiveStream();
    }, 100);
  }

  ngOnDestroy() {
    this.stopLiveStream();
    if (this.chartEl?.nativeElement) {
      Plotly.purge(this.chartEl.nativeElement);
    }
  }

  filteredHubs(): GlobalHub[] {
    const region = this.selectedRegion();
    if (region === 'ALL') return this.globalHubs;
    return this.globalHubs.filter(h => h.region === region);
  }

  setTimeRange(t: string) {
    this.selectedTimeRange.set(t);
    this.renderPlotlyMap();
  }

  setRegion(r: string) {
    this.selectedRegion.set(r);
    this.renderPlotlyMap();
  }

  toggleLiveStream() {
    this.isLiveStream.update(v => !v);
    if (this.isLiveStream()) {
      this.startLiveStream();
    } else {
      this.stopLiveStream();
    }
  }

  selectHub(hub: GlobalHub) {
    this.selectedHub.set(hub);
  }

  openVoice() {
    this.voice.setDrawerOpen(true);
  }

  askAboutHub(hub: GlobalHub) {
    this.voice.setDrawerOpen(true);
  }

  private startLiveStream() {
    this.stopLiveStream();
    this.streamInterval = setInterval(() => {
      if (!this.isLiveStream()) return;
      this.globalHubs = this.globalHubs.map(h => {
        const jitter = (Math.random() - 0.5) * 4;
        const newLatency = Math.max(10, Math.round(h.latencyMs + jitter));
        return { ...h, latencyMs: newLatency };
      });
      this.renderPlotlyMap();
    }, 3000);
  }

  private stopLiveStream() {
    if (this.streamInterval) {
      clearInterval(this.streamInterval);
      this.streamInterval = null;
    }
  }

  private renderPlotlyMap() {
    if (!this.chartEl?.nativeElement) return;

    const hubs = this.filteredHubs();
    const lats = hubs.map(h => h.lat);
    const lons = hubs.map(h => h.lon);
    const texts = hubs.map(h => 
      `<b>${h.name} (${h.country})</b><br>` +
      `Region: ${h.region}<br>` +
      `Volume: <b>${h.volumeLabel}</b><br>` +
      `Fraud Score: <b>${h.fraudScore}/100</b><br>` +
      `Latency: <b>${h.latencyMs}ms</b><br>` +
      `Status: <span style="color:${h.statusColor};font-weight:bold;">${h.status}</span>`
    );
    const colors = hubs.map(h => h.statusColor);
    const sizes = hubs.map(h => Math.max(14, Math.min(32, Math.sqrt(h.volume) / 100)));

    const data: any[] = [
      {
        type: 'scattergeo',
        locationmode: 'world',
        lat: lats,
        lon: lons,
        hoverinfo: 'text',
        text: texts,
        mode: 'markers+text',
        textposition: 'top center',
        textfont: {
          family: 'Inter, system-ui, sans-serif',
          size: 10,
          color: '#e2e8f0'
        },
        marker: {
          size: sizes,
          color: colors,
          opacity: 0.88,
          symbol: 'circle',
          line: {
            color: '#ffffff',
            width: 1.8
          }
        }
      }
    ];

    const layout: any = {
      geo: {
        scope: 'world',
        projection: {
          type: 'equirectangular'
        },
        showland: true,
        landcolor: '#131b34',
        subunitcolor: '#1e293b',
        countrycolor: '#2a3754',
        countrywidth: 0.8,
        showocean: true,
        oceancolor: '#070c1b',
        showlakes: true,
        lakecolor: '#070c1b',
        bgcolor: '#070c1b',
        showcoastlines: true,
        coastlinecolor: '#2a3754',
        coastlinewidth: 0.8
      },
      margin: { l: 0, r: 0, t: 0, b: 0 },
      paper_bgcolor: '#070c1b',
      plot_bgcolor: '#070c1b',
      showlegend: false,
      hoverlabel: {
        bgcolor: '#0f172a',
        bordercolor: '#334155',
        font: { family: 'Inter, system-ui, sans-serif', size: 11, color: '#ffffff' }
      }
    };

    const config: any = {
      responsive: true,
      displayModeBar: false,
      scrollZoom: true
    };

    Plotly.react(this.chartEl.nativeElement, data, layout, config);

    (this.chartEl.nativeElement as any).on('plotly_click', (eventData: any) => {
      if (eventData.points && eventData.points.length > 0) {
        const idx = eventData.points[0].pointIndex;
        if (hubs[idx]) {
          this.selectHub(hubs[idx]);
        }
      }
    });
  }
}
