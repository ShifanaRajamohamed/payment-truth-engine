import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
         style="border: 1px solid rgba(15,31,69,0.07); box-shadow: 0 2px 8px rgba(15,31,69,0.04);">
      <div class="flex items-center justify-between">
        <span class="text-xs font-medium text-slate-500 uppercase tracking-wider">{{ label }}</span>
        <span *ngIf="badgeText" class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
          {{ badgeText }}
        </span>
      </div>
      
      <div class="mt-2 flex items-baseline gap-2">
        <span class="text-2xl font-semibold tracking-tight text-slate-900">{{ value }}</span>
      </div>

      <div *ngIf="change !== undefined" class="mt-2 flex items-center text-xs">
        <span
          [ngClass]="[
            'inline-flex items-center font-medium gap-0.5 mr-1.5',
            change >= 0 ? 'text-emerald-600' : 'text-red-600'
          ]"
        >
          <!-- SVG Up/Down indicator -->
          <svg *ngIf="change >= 0" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
          <svg *ngIf="change < 0" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          {{ absChange }}%
        </span>
        <span class="text-slate-400">{{ changeLabel || 'vs last period' }}</span>
      </div>
    </div>
  `,
  styles: []
})
export class StatComponent {
  @Input() label = '';
  @Input() value = '';
  @Input() badgeText?: string;
  @Input() change?: number;
  @Input() changeLabel?: string;

  get absChange(): string {
    if (this.change === undefined) return '0';
    return Math.abs(this.change).toFixed(1);
  }
}
