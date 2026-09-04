import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-date-range-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
      <button
        *ngFor="let option of options"
        type="button"
        (click)="select(option.value)"
        [ngClass]="[
          'px-3 py-1.5 text-xs font-medium border-r border-slate-200 last:border-r-0 transition-colors',
          selectedValue === option.value
            ? 'bg-slate-100 text-slate-800 font-semibold'
            : 'text-slate-600 hover:bg-slate-50'
        ]"
      >
        {{ option.label }}
      </button>
    </div>
  `,
  styles: []
})
export class DateRangeSelectorComponent {
  @Input() selectedValue = '7d';

  @Output() rangeChange = new EventEmitter<string>();

  options = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: '7D', value: '7d' },
    { label: '30D', value: '30d' }
  ];

  select(value: string) {
    this.selectedValue = value;
    this.rangeChange.emit(value);
  }
}
