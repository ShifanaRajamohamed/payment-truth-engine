import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
      <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
        <!-- Minimal placeholder SVG -->
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.008 1.24l.885 1.77a2.25 2.25 0 0 0 2.007 1.24h1.98a2.25 2.25 0 0 0 2.007-1.24l.885-1.77a2.25 2.25 0 0 1 2.007-1.24h3.86m-18 0h18a2.25 2.25 0 0 1 2.25 2.25v3a2.25 2.25 0 0 1-2.25 2.25H2.25A2.25 2.25 0 0 1 0 18.75v-3a2.25 2.25 0 0 1 2.25-2.25Z" />
        </svg>
      </div>
      <h3 class="text-sm font-semibold text-slate-900 mb-1">{{ title }}</h3>
      <p class="text-xs text-slate-500 max-w-sm mb-4">{{ description }}</p>
      <button
        *ngIf="actionText"
        type="button"
        (click)="onAction()"
        class="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 active:bg-brand-200 border border-brand-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        {{ actionText }}
      </button>
    </div>
  `,
  styles: []
})
export class EmptyStateComponent {
  @Input() title = 'No results found';
  @Input() description = 'Try adjusting your filters or search terms.';
  @Input() actionText?: string;

  @Output() actionClick = new EventEmitter<void>();

  onAction() {
    this.actionClick.emit();
  }
}
