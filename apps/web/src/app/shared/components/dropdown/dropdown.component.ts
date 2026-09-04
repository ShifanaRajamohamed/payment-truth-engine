import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DropdownOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative inline-block text-left w-full sm:w-auto" [attr.id]="id">
      <div>
        <button
          type="button"
          (click)="toggle()"
          class="inline-flex w-full justify-between gap-x-1.5 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          [attr.aria-expanded]="isOpen"
          aria-haspopup="true"
        >
          {{ selectedLabel || placeholder }}
          <svg class="-mr-1 h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>

      <div
        *ngIf="isOpen"
        class="absolute right-0 z-50 mt-1.5 w-48 origin-top-right rounded-lg bg-white shadow-lg border border-slate-200 ring-1 ring-black ring-opacity-5 focus:outline-none"
        role="menu"
        aria-orientation="vertical"
      >
        <div class="py-1" role="none">
          <button
            *ngFor="let opt of options"
            (click)="select(opt)"
            class="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            role="menuitem"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class DropdownComponent {
  @Input() id = 'dropdown-' + Math.floor(Math.random() * 1000);
  @Input() options: DropdownOption[] = [];
  @Input() selectedValue?: string;
  @Input() placeholder = 'Select option';

  @Output() selectionChange = new EventEmitter<string>();

  isOpen = false;

  constructor(private elementRef: ElementRef) {}

  get selectedLabel(): string | undefined {
    return this.options.find(o => o.value === this.selectedValue)?.label;
  }

  toggle() {
    this.isOpen = !this.isOpen;
  }

  select(option: DropdownOption) {
    this.selectedValue = option.value;
    this.selectionChange.emit(option.value);
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}
