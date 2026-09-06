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
        path: 'home',
        loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'payments',
        loadComponent: () => import('./features/payments/payments.component').then(m => m.PaymentsComponent)
      },
      {
        path: 'risk',
        loadComponent: () => import('./features/risk/risk-summary/risk-summary.component').then(m => m.RiskSummaryComponent)
      },
      {
        path: 'authorizations',
        loadComponent: () => import('./features/authorization/approval-flow/approval-flow.component').then(m => m.ApprovalFlowComponent)
      },
      {
        path: 'beneficiaries',
        loadComponent: () => import('./features/beneficiaries/beneficiaries.component').then(m => m.BeneficiariesComponent)
      },
      {
        path: 'audit',
        loadComponent: () => import('./features/audit/audit.component').then(m => m.AuditComponent)
      },
      {
        path: 'customers',
        loadComponent: () => import('./features/customers/customers.component').then(m => m.CustomersComponent)
      },
      {
        path: 'map',
        loadComponent: () => import('./features/map/map.component').then(m => m.MapComponent)
      },
      {
        path: 'regions',
        loadComponent: () => import('./features/regions/regions.component').then(m => m.RegionsComponent)
      },
      {
        path: 'opportunities',
        loadComponent: () => import('./features/opportunities/opportunities.component').then(m => m.OpportunitiesComponent)
      },
      {
        path: 'decision-lab',
        loadComponent: () => import('./features/decision-lab/decision-lab.component').then(m => m.DecisionLabComponent)
      },
      {
        path: 'payment-truth',
        loadComponent: () => import('./features/payment-truth/payment-truth.component').then(m => m.PaymentTruthComponent),
        title: 'Payment Truth Engine – Dhwani Enterprise'
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
