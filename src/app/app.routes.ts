import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'signup',
    loadComponent: () => import('./features/auth/signup/signup.component').then(m => m.SignupComponent)
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/app-shell/app-shell.component').then(m => m.AppShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'incidents',
        loadComponent: () => import('./features/incidents/incidents-list.component').then(m => m.IncidentsListComponent)
      },
      {
        path: 'incidents/:id',
        loadComponent: () => import('./features/incidents/incident-detail.component').then(m => m.IncidentDetailComponent)
      },
      {
        path: 'voice-resolver',
        loadComponent: () => import('./features/voice-resolver/voice-resolver.component').then(m => m.VoiceResolverComponent)
      },
      {
        path: 'simulation-lab',
        loadComponent: () => import('./features/simulation-lab/simulation-lab.component').then(m => m.SimulationLabComponent)
      },
      {
        path: 'payment-truth',
        loadComponent: () => import('./features/payment-truth/payment-truth.component').then(m => m.PaymentTruthComponent),
        title: 'Payment Truth Engine – Dhwani Enterprise'
      },
      {
        path: 'inspector',
        loadComponent: () => import('./features/inspector/inspector.component').then(m => m.InspectorComponent)
      },
      {
        path: 'system-graph',
        loadComponent: () => import('./features/system-graph/system-graph.component').then(m => m.SystemGraphComponent)
      },
      {
        path: 'timeline',
        loadComponent: () => import('./features/timeline/timeline-view.component').then(m => m.TimelineViewComponent)
      },
      {
        path: 'audit',
        loadComponent: () => import('./features/audit/audit-trail.component').then(m => m.AuditTrailComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
      },
      {
        path: 'home',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: 'app/dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'app/dashboard'
  }
];
