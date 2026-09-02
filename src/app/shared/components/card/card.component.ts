import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      [ngClass]="[
        'bg-white rounded-2xl overflow-hidden transition-all',
        hoverable ? 'hover:shadow-lg hover:translate-y-[-1px]' : '',
        paddingClasses[padding]
      ]"
      style="border: 1px solid rgba(15,31,69,0.08); box-shadow: 0 2px 8px rgba(15,31,69,0.05);"
    >
      <!-- Header -->
      <div *ngIf="cardTitle" class="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div>
          <h3 class="text-sm font-semibold text-slate-900">{{ cardTitle }}</h3>
          <p *ngIf="cardSubtitle" class="text-xs text-slate-500 mt-0.5">{{ cardSubtitle }}</p>
        </div>
        <ng-content select="[card-header-actions]"></ng-content>
      </div>

      <!-- Content -->
      <div class="relative">
        <ng-content></ng-content>
      </div>

      <!-- Footer -->
      <div *ngIf="hasFooter" class="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between">
        <ng-content select="[card-footer]"></ng-content>
      </div>
    </div>
  `,
  styles: []
})
export class CardComponent {
  @Input() cardTitle?: string;
  @Input() cardSubtitle?: string;
  @Input() hoverable = false;
  @Input() hasFooter = false;
  @Input() padding: 'none' | 'sm' | 'md' | 'lg' = 'md';

  paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6'
  };
}
