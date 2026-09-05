import { Component, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { VoiceResolverService } from '../../core/services/voice-resolver.service';
import { TruthIncidentService } from '../../core/services/truth-incident.service';

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent, TopbarComponent],
  template: `
    <div class="flex h-screen overflow-hidden text-slate-100 font-sans"
         style="background: radial-gradient(circle at 50% 0%, #0f172a 0%, #080d1a 100%);">

      <!-- Sidebar Navigation -->
      <app-sidebar class="flex-shrink-0"></app-sidebar>

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <app-topbar></app-topbar>
        <main class="flex-1 overflow-y-auto custom-scrollbar">
          <router-outlet></router-outlet>
        </main>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #080d1a; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
  `]
})
export class AppShellComponent {
  constructor(
    public voiceResolver: VoiceResolverService,
    public truthService: TruthIncidentService,
  ) {}
}
