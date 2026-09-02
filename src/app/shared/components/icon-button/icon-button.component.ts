import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-icon-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled"
      [attr.aria-label]="ariaLabel"
      [ngClass]="[
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      ]"
      (click)="onClick($event)"
    >
      <ng-content></ng-content>
    </button>
  `,
  styles: []
})
export class IconButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'outline' | 'ghost' = 'ghost';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() disabled = false;
  @Input() type: 'button' | 'submit' = 'button';
  @Input() ariaLabel = 'Button';

  @Output() clickEvent = new EventEmitter<MouseEvent>();

  baseClasses = 'inline-flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2';

  variantClasses = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300',
    outline: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100',
    ghost: 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
  };

  sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-2.5 text-base'
  };

  onClick(event: MouseEvent) {
    if (!this.disabled) {
      this.clickEvent.emit(event);
    }
  }
}
