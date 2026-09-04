import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import * as maplibregl from 'maplibre-gl';
import { VoiceService } from '../../core/services/voice.service';
import { DataService, CityMetric } from '../../core/services/data.service';
import { TranslationService } from '../../core/language/translation.service';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-7">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="text-lg">📍</span>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Where Am I Growing?</h1>
        </div>
        <p class="text-sm text-slate-500">Live geographic payment intelligence across Indian merchant hubs.</p>
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

    <!-- Quick City Pills Selector -->
    <div class="bg-white rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-2"
         style="border:1px solid rgba(15,31,69,0.07);box-shadow:0 2px 8px rgba(15,31,69,0.04);">
      <span class="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Focus City:</span>
      <button *ngFor="let city of data.cities()"
              (click)="selectCity(city)"
              class="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5"
              [style]="selectedCity?.id === city.id
                ? 'background:#eff6ff;border-color:#3b82f6;color:#1e3a8a;'
                : 'background:#f8fafc;border-color:#e2e8f0;color:#64748b;'">
        <span>{{ city.statusEmoji }}</span>
        <span>{{ city.name }}</span>
        <span class="text-[10px] opacity-70 font-bold" [style.color]="city.growth >= 0 ? '#16a34a' : '#dc2626'">
          {{ city.growth >= 0 ? '+' : '' }}{{ city.growth }}%
        </span>
      </button>
    </div>

    <!-- Main Viewport: Map & Detail Sidebar -->
    <div class="flex flex-col lg:flex-row gap-6">

      <!-- Map container -->
      <div class="flex-1 min-w-0 bg-white rounded-2xl overflow-hidden shadow-sm relative"
           style="border:1px solid rgba(15,31,69,0.07);min-height:500px;">
        <div #mapContainer class="w-full h-full min-h-[500px]"></div>

        <!-- Fallback interactive overlay if map style loading is slow -->
        <div *ngIf="showFallback"
             class="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center p-6 z-10 text-center">
          <span class="text-4xl mb-3">🗺️</span>
          <h3 class="text-sm font-bold text-slate-800">Geographic Hubs</h3>
          <p class="text-xs text-slate-500 max-w-sm mt-1 mb-4">
            Click on any billing center to view real-time revenue, repeat buyer loyalty, and growth signals:
          </p>
          <div class="flex gap-2 flex-wrap justify-center max-w-lg">
            <button *ngFor="let c of data.cities()"
                    (click)="selectCity(c)"
                    class="px-3.5 py-2 bg-white border rounded-xl text-xs font-semibold transition-all hover:border-blue-400 hover:text-blue-600 shadow-sm"
                    [style]="selectedCity?.id === c.id ? 'border-color:#3b82f6;background:#eff6ff;color:#1e3a8a;' : 'border-color:#e2e8f0;color:#334155;'">
              {{ c.statusEmoji }} {{ c.name }} · ₹{{ (c.revenue / 100000).toFixed(1) }}L
            </button>
          </div>
        </div>
      </div>

      <!-- Detail Card Drawer -->
      <div class="w-full lg:w-80 flex-shrink-0">
        <div *ngIf="selectedCity; else noCitySelected"
             class="bg-white rounded-2xl p-6 space-y-4"
             style="border:1px solid rgba(15,31,69,0.07);box-shadow:0 2px 8px rgba(15,31,69,0.04);">

          <div class="flex items-start justify-between">
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ selectedCity.state }}</span>
              <h2 class="text-xl font-bold text-slate-900 mt-0.5">{{ selectedCity.name }}</h2>
            </div>
            <span class="px-2.5 py-1 rounded-full text-xs font-bold"
                  [style]="selectedCity.status === 'growing' ? 'background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;' : selectedCity.status === 'declining' ? 'background:#fef2f2;color:#dc2626;border:1px solid #fecaca;' : 'background:#fffbeb;color:#d97706;border:1px solid #fde68a;'">
              {{ selectedCity.statusLabel }}
            </span>
          </div>

          <!-- Plain language explanation -->
          <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Dhwani Insight</p>
            <p class="text-xs text-slate-700 font-medium leading-relaxed">{{ selectedCity.plainStatus }}</p>
          </div>

          <!-- Metric tiles -->
          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
              <span class="text-[9px] font-bold text-blue-600 uppercase tracking-wider">Revenue</span>
              <p class="text-base font-extrabold text-slate-900 mt-0.5">
                {{ selectedCity.revenue >= 100000 ? '₹' + (selectedCity.revenue / 100000).toFixed(1) + 'L' : (selectedCity.revenue | currency:'INR':'symbol':'1.0-0') }}
              </p>
              <span class="text-[10px] font-semibold" [style.color]="selectedCity.growth >= 0 ? '#16a34a' : '#dc2626'">
                {{ selectedCity.growth >= 0 ? '+' : '' }}{{ selectedCity.growth }}% growth
              </span>
            </div>

            <div class="p-3 rounded-xl bg-violet-50/50 border border-violet-100">
              <span class="text-[9px] font-bold text-violet-600 uppercase tracking-wider">Repeat Rate</span>
              <p class="text-base font-extrabold text-slate-900 mt-0.5">{{ selectedCity.repeatCustomerRate }}%</p>
              <span class="text-[10px] text-slate-500 font-medium">Loyal buyers</span>
            </div>

            <div class="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <span class="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Success Rate</span>
              <p class="text-base font-extrabold text-slate-900 mt-0.5">{{ selectedCity.successRate }}%</p>
              <span class="text-[10px] text-slate-500 font-medium">Payment rate</span>
            </div>

            <div class="p-3 rounded-xl bg-amber-50/50 border border-amber-100">
              <span class="text-[9px] font-bold text-amber-600 uppercase tracking-wider">Total Orders</span>
              <p class="text-base font-extrabold text-slate-900 mt-0.5">{{ selectedCity.orderCount }}</p>
              <span class="text-[10px] text-slate-500 font-medium">{{ selectedCity.customerCount }} customers</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="space-y-2 pt-2">
            <a routerLink="/app/decision-lab"
               class="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white transition-all flex items-center justify-center gap-1.5 shadow-sm"
               style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);">
              <span>🔮 Test an offer for {{ selectedCity.name }} →</span>
            </a>
            <button type="button" (click)="askAboutSelectedCity()"
                    class="w-full py-2 px-3 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors">
              🎙 Ask Dhwani about {{ selectedCity.name }}
            </button>
          </div>
        </div>

        <!-- Empty selection -->
        <ng-template #noCitySelected>
          <div class="bg-white rounded-2xl p-8 text-center"
               style="border:1px solid rgba(15,31,69,0.07);box-shadow:0 2px 8px rgba(15,31,69,0.04);">
            <span class="text-3xl mb-2 block">📍</span>
            <p class="text-sm font-bold text-slate-800">Select a City</p>
            <p class="text-xs text-slate-400 mt-1">Tap a pin on the map or choose a city above to inspect performance.</p>
          </div>
        </ng-template>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; }
    :host ::ng-deep .maplibregl-popup-content {
      font-family: 'Inter', system-ui, sans-serif;
      padding: 10px 12px;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
      border: 1px solid #e2e8f0;
    }
  `]
})
export class MapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  private map: maplibregl.Map | null = null;
  private markers: maplibregl.Marker[] = [];
  showFallback = true;
  selectedCity: CityMetric | null = null;

  constructor(
    public data: DataService,
    public voice: VoiceService,
    public i18n: TranslationService,
  ) {
    // Select default top city
    this.selectedCity = this.data.getFastestGrowingCity();

    // Listen to voice triggers
    effect(() => {
      const regionName = this.voice.selectedRegionFromVoice();
      if (regionName) {
        const found = this.data.getCityByName(regionName);
        if (found) {
          this.selectCity(found);
        }
      }
    });
  }

  ngAfterViewInit() {
    this.initMap();
  }

  ngOnDestroy() {
    this.clearMarkers();
    this.map?.remove();
  }

  selectCity(city: CityMetric) {
    this.selectedCity = city;
    if (this.map) {
      this.map.flyTo({
        center: [city.longitude, city.latitude],
        zoom: 7,
        essential: true,
      });
    }
  }

  askAgent() {
    this.voice.setDrawerOpen(true);
  }

  askAboutSelectedCity() {
    if (!this.selectedCity) return;
    this.voice.setDrawerOpen(true);
  }

  private clearMarkers() {
    this.markers.forEach(m => m.remove());
    this.markers = [];
  }

  private initMap() {
    try {
      if (!this.mapContainer) return;

      this.map = new maplibregl.Map({
        container: this.mapContainer.nativeElement,
        style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
        center: [78.9629, 20.5937],
        zoom: 4.5,
        maxZoom: 10,
        minZoom: 3,
      });

      this.map.addControl(new maplibregl.NavigationControl(), 'bottom-right');

      this.map.on('load', () => {
        this.showFallback = false;
        this.addMarkersToMap();
      });

      setTimeout(() => {
        if (this.showFallback) {
          // If vector tiles take longer to load over slow connection
          console.info('Map style fallback container ready.');
        }
      }, 3500);

    } catch (e) {
      console.warn('Maplibre initialization error', e);
    }
  }

  private addMarkersToMap() {
    if (!this.map) return;
    this.clearMarkers();

    this.data.cities().forEach(city => {
      const el = document.createElement('div');
      el.className = 'city-pin';
      el.style.width = '14px';
      el.style.height = '14px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = city.status === 'declining' ? '#ef4444' : city.status === 'growing' ? '#10b981' : '#f59e0b';
      el.style.border = '2.5px solid white';
      el.style.boxShadow = '0 0 8px rgba(0, 0, 0, 0.2)';
      el.style.cursor = 'pointer';

      el.addEventListener('click', () => {
        this.selectCity(city);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([city.longitude, city.latitude])
        .addTo(this.map!);

      this.markers.push(marker);
    });
  }
}
