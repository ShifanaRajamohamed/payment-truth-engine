import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      [ngClass]="[
        baseClasses,
        variantClasses[variant],
        sizeClasses[size]
      ]"
    >
      <span *ngIf="dot" class="w-1.5 h-1.5 rounded-full mr-1.5" [ngClass]="dotClasses[variant]"></span>
      <ng-content></ng-content>
    </span>
  `,
  styles: []
})
export class BadgeComponent {
  @Input() variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' = 'neutral';
  @Input() size: 'sm' | 'md' = 'md';
  @Input() dot = false;

  baseClasses = 'inline-flex items-center font-medium rounded border';

  variantClasses = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/60',
    error: 'bg-red-50 text-red-700 border-red-200/60',
    info: 'bg-blue-50 text-blue-700 border-blue-200/60',
    neutral: 'bg-slate-50 text-slate-700 border-slate-200'
  };

  dotClasses = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    neutral: 'bg-slate-400'
  };

  sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px] leading-3',
    md: 'px-2 py-1 text-xs leading-4'
  };
}
