import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-section-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-sm font-semibold text-slate-900">{{ title }}</h2>
        <p *ngIf="description" class="text-xs text-slate-400 mt-0.5">{{ description }}</p>
      </div>
      <div class="flex items-center gap-2">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: []
})
export class SectionHeaderComponent {
  @Input() title = '';
  @Input() description?: string;
}
