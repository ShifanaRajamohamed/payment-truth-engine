import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-2.5 select-none" [ngClass]="containerClass">
      <!-- Stylized 'D' ribbon emblem in deep purple/indigo gradient with metallic gloss -->
      <div [class]="iconSizeClass" class="rounded-xl flex items-center justify-center relative overflow-hidden flex-shrink-0 shadow-md transition-transform duration-200 group-hover:scale-105"
           style="background: linear-gradient(135deg, #4338ca 0%, #4f46e5 40%, #6366f1 70%, #818cf8 100%);">
        
        <!-- Gloss overlay highlight -->
        <div class="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-white/40 pointer-events-none"></div>
        
        <!-- Geometric stylized 'D' ribbon SVG -->
        <svg viewBox="0 0 32 32" class="w-full h-full p-1.5" fill="none">
          <path d="M8 6h9a8 8 0 0 1 8 8v2a8 8 0 0 1-8 8H8V6z" 
                stroke="rgba(255,255,255,0.4)" stroke-width="2.2" stroke-linecap="round"/>
          <path d="M8 8h8.5C20.64 8 24 11.36 24 15.5S20.64 23 16.5 23H8V8z" 
                fill="url(#dRibbonGrad2)" />
          <path d="M12 12h4a3.5 3.5 0 0 1 3.5 3.5v0a3.5 3.5 0 0 1-3.5 3.5h-4V12z" 
                fill="#312e81" />
          <path d="M11 7L19 15L11 23" stroke="rgba(255,255,255,0.7)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          <defs>
            <linearGradient id="dRibbonGrad2" x1="8" y1="8" x2="24" y2="23" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#ffffff"/>
              <stop offset="50%" stop-color="#e0e7ff"/>
              <stop offset="100%" stop-color="#c7d2fe"/>
            </linearGradient>
          </defs>
        </svg>
      </div>

      <!-- Typography -->
      <div *ngIf="showText" class="flex flex-col leading-none">
        <div class="flex items-center gap-1.5">
          <span class="font-extrabold tracking-tight" [ngClass]="titleClass" [style.color]="textColor || '#0f172a'">
            Dhwani
          </span>
          <span class="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60" *ngIf="badgeText">
            {{ badgeText }}
          </span>
        </div>
        <span class="text-[10px] font-semibold tracking-wider uppercase mt-0.5" [style.color]="subtitleColor || '#64748b'">
          {{ subtitle || 'Access / Enterprise' }}
        </span>
      </div>
    </div>
  `,
  styles: [`:host { display: inline-block; }`]
})
export class LogoComponent {
  @Input() showText = true;
  @Input() iconSizeClass = 'w-9 h-9';
  @Input() titleClass = 'text-lg';
  @Input() containerClass = '';
  @Input() textColor = '';
  @Input() subtitleColor = '';
  @Input() badgeText = 'Enterprise';
  @Input() subtitle = 'Access / Enterprise';
}
