import { Injectable, signal } from '@angular/core';
import { ApiClientService } from '../api/api-client.service';
import { AuditEvent } from '@deepaudit/shared-types';
import { catchError, of, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuditService {
  readonly auditEvents = signal<AuditEvent[]>([]);
  readonly isLoading = signal<boolean>(false);

  constructor(private api: ApiClientService) {
    this.fetchAuditEvents();
  }

  fetchAuditEvents(limit: number = 50) {
    this.isLoading.set(true);
    this.api.get<AuditEvent[]>('/audit', { limit }).pipe(
      catchError(() => of(this.getMockAuditEvents())),
      tap(events => {
        this.auditEvents.set(events);
        this.isLoading.set(false);
      })
    ).subscribe();
  }

  private getMockAuditEvents(): AuditEvent[] {
    return [
      {
        id: 'aud_seed_03',
        sequenceNumber: 3,
        timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
        eventType: 'AI_EXPLANATION_GENERATED',
        actorId: 'gemini_agent_service',
        actorName: 'DeepAudit Gemini Service',
        actorRole: 'AI_AGENT',
        targetEntity: 'PAYMENT',
        targetId: 'pay_TX9283749283',
        orgId: 'org_acme_corp',
        summary: 'AI risk explanation generated and validated for payment TXN-9283749283',
        metadata: { paymentId: 'pay_TX9283749283', languageCode: 'en' },
        immutableHash: 'c7d24a983b0198f8e12456789abcdef0123456789abcdef0123456789abcdef0'
      },
      {
        id: 'aud_seed_02',
        sequenceNumber: 2,
        timestamp: new Date(Date.now() - 44 * 60000).toISOString(),
        eventType: 'STEP_UP_AUTH_REQUIRED',
        actorId: 'system_risk_engine',
        actorName: 'Policy Enforcement',
        actorRole: 'SYSTEM',
        targetEntity: 'PAYMENT',
        targetId: 'pay_TX9283749283',
        orgId: 'org_acme_corp',
        summary: 'Step-up passkey verification required for TXN-9283749283 due to HIGH risk score.',
        metadata: { score: 65, level: 'HIGH' },
        immutableHash: '4f92bc49102837482910fedcba9876543210fedcba9876543210fedcba987654'
      },
      {
        id: 'aud_seed_01',
        sequenceNumber: 1,
        timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
        eventType: 'PAYMENT_CREATED',
        actorId: 'usr_corp_maker_01',
        actorName: 'Aditya Sharma',
        actorRole: 'MAKER',
        targetEntity: 'PAYMENT',
        targetId: 'pay_TX9283749283',
        orgId: 'org_acme_corp',
        summary: 'Payment TXN-9283749283 created for ₹7,45,000 to Apex Logistics Mumbai',
        metadata: { amount: 745000, method: 'RTGS' },
        immutableHash: 'a8b9c0d1e2f30123456789abcdef0123456789abcdef0123456789abcdef0123'
      }
    ];
  }
}
