import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="isOpen"
      class="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
    >
      <div class="absolute inset-0 overflow-hidden">
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-slate-900/30 backdrop-blur-[0.5px] transition-opacity"
          (click)="onClose()"
          aria-hidden="true"
        ></div>

        <!-- Sliding Panel -->
        <div class="fixed inset-y-0 right-0 flex max-w-full pl-10">
          <div class="w-screen max-w-md transform bg-white shadow-xl border-l border-slate-200 flex flex-col">
            <!-- Header -->
            <div class="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 class="text-sm font-semibold text-slate-900">{{ title }}</h2>
                <p *ngIf="subtitle" class="text-xs text-slate-400 mt-0.5">{{ subtitle }}</p>
              </div>
              <button
                type="button"
                (click)="onClose()"
                class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Content Area -->
            <div class="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              <ng-content></ng-content>
            </div>

            <!-- Footer Area -->
            <div *ngIf="showFooter" class="border-t border-slate-100 bg-white px-6 py-4">
              <ng-content select="[drawer-footer]"></ng-content>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class DrawerComponent {
  @Input() isOpen = false;
  @Input() title = 'Drawer Title';
  @Input() subtitle?: string;
  @Input() showFooter = false;

  @Output() closeEvent = new EventEmitter<void>();

  onClose() {
    this.closeEvent.emit();
  }
}
