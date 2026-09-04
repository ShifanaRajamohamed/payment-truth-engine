import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7"
         style="padding-bottom: 24px; border-bottom: 1px solid rgba(15,31,69,0.08);">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">{{ title }}</h1>
        <p *ngIf="description" class="text-sm text-slate-400 mt-1 font-medium">{{ description }}</p>
      </div>
      <div class="flex items-center gap-3">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: []
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() description?: string;
}
