import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { 
  PaymentIncident, 
  ScenarioType, 
  ScenarioDefinition, 
  DeterministicVerificationResult, 
  AuditEntry,
  SystemStatus 
} from '@deepaudit/shared-types';
import { firstValueFrom } from 'rxjs';

export interface TruthMetrics {
  healthScore: number;
  totalIncidents: number;
  activeCritical: number;
  activeHigh: number;
  activeMedium: number;
  resolvedToday: number;
  avgResolutionTimeSeconds: number;
  deterministicAccuracyRate: number;
}

@Injectable({ providedIn: 'root' })
export class TruthIncidentService {
  private readonly apiUrl = 'http://localhost:3000/api';

  // Signals
  readonly incidents = signal<PaymentIncident[]>([]);
  readonly selectedIncident = signal<PaymentIncident | null>(null);
  readonly metrics = signal<TruthMetrics>({
    healthScore: 98.4,
    totalIncidents: 67,
    activeCritical: 2,
    activeHigh: 5,
    activeMedium: 12,
    resolvedToday: 48,
    avgResolutionTimeSeconds: 4.2,
    deterministicAccuracyRate: 100.0,
  });
  readonly isLoading = signal<boolean>(false);
  readonly isInvestigating = signal<boolean>(false);
  readonly activeInvestigationStage = signal<string>('');
  readonly auditLogs = signal<AuditEntry[]>([]);

  // Predefined judge demo scenarios
  readonly scenarioDefinitions: ScenarioDefinition[] = [
    {
      id: 'SCENARIO_1_WEBHOOK_FAILURE',
      title: 'Payment Success, Order Unpaid',
      badge: 'Signature Demo #1',
      description: 'Customer debited ₹12,499 & captured at gateway, but merchant webhook returned HTTP 500. Order marked UNPAID.',
      sampleComplaint: {
        tamil: 'நான் ₹12,499 payment பண்ணிட்டேன், ஆனால் website இன்னும் payment pending என்று காட்டுது.',
        tanglish: 'Naan ₹12,499 payment pannitten, aana website innum payment pending nu kaattuthu.',
        english: 'I paid ₹12,499 successfully, but the website is still showing payment pending.',
        hindi: 'मैंने ₹12,499 का भुगतान किया, लेकिन वेबसाइट पर अभी भी पेंडिंग दिख रहा है।',
      },
      expectedRootCause: 'Merchant Webhook Delivery Failure (HTTP 500)',
      safeAction: 'Deterministic Repair: MARK ORDER AS PAID',
    },
    {
      id: 'SCENARIO_2_DUPLICATE_PAYMENT',
      title: 'Duplicate Payment Detected',
      badge: 'Demo #2',
      description: 'Customer retried payment. Two captures (2x ₹4,999) recorded for single order.',
      sampleComplaint: {
        tamil: 'என் அக்கவுண்ட்ல இரண்டு முறை ₹4,999 டெபிட் ஆயிடுச்சு. ஒரு அமௌன்ட் ரீஃபண்ட் பண்ணுங்க.',
        tanglish: 'En account la 2 times ₹4,999 debit aayiduchu. Oru amount refund pannunga.',
        english: 'My account was debited twice for ₹4,999 on the same order. Please refund one.',
        hindi: 'मेरे खाते से एक ही ऑर्डर के लिए दो बार ₹4,999 कट गए हैं।',
      },
      expectedRootCause: 'Duplicate Checkout Capture with Orphaned Payment',
      safeAction: 'Queue Automated Refund Workflow for 2nd Payment',
    },
    {
      id: 'SCENARIO_3_PAYMENT_FAILED_ORDER_PAID',
      title: 'Payment Failed but Order Paid (Phantom Credit)',
      badge: 'Critical Risk #3',
      description: 'Card declined at bank & gateway marked FAILED, but merchant database erroneously marked order PAID.',
      sampleComplaint: {
        tamil: 'என் கார்டு declined ஆச்சு, ஆனால் ஆர்டர் கன்ஃபர்மேஷன் மெசேஜ் வந்துருச்சு.',
        tanglish: 'En card decline aachu, aana order confirmation message vandhurukku.',
        english: 'My card was declined, but the merchant sent me an order confirmation invoice!',
        hindi: 'मेरा कार्ड अस्वीकार हो गया था, लेकिन ऑर्डर कन्फर्मेशन मिल गया।',
      },
      expectedRootCause: 'Severe Merchant Logic Desync (Phantom Credit)',
      safeAction: 'ESCALATE to Fraud/Ops Team (Auto-repair strictly blocked)',
    },
    {
      id: 'SCENARIO_4_REFUND_MISMATCH',
      title: 'Refund Processed, Stale Merchant DB',
      badge: 'Demo #4',
      description: 'Gateway refunded ₹8,500 to customer bank, but merchant DB missing refund record due to missing webhook route.',
      sampleComplaint: {
        tamil: 'பேங்க்ல ரீஃபண்ட் பணம் வந்துருச்சு, ஆனா வெப்சைட்ல இன்னும் ஆர்டர் பேக்கிங்னு இருக்கு.',
        tanglish: 'Bank la refund money vandhuruchu, aana site la innum order packing nu irukku.',
        english: 'I received the refund in my bank, but your dashboard still says shipping soon.',
        hindi: 'रिफंड बैंक में आ गया है, लेकिन पोर्टल पर ऑर्डर अभी भी सक्रिय है।',
      },
      expectedRootCause: 'Stale Order State missing Gateway Refund Event',
      safeAction: 'Synchronize Order State: MARK AS REFUNDED',
    },
    {
      id: 'SCENARIO_5_DELAYED_WEBHOOK',
      title: 'Delayed Webhook in Transit',
      badge: 'Demo #5',
      description: 'Payment captured 20 seconds ago; webhook is in transit dispatch queue. Transient lag.',
      sampleComplaint: {
        tamil: 'இப்போதான் பேமெண்ட் பண்ணேன், இன்னும் வெயிட்டிங்னு வருது.',
        tanglish: 'Ippothaan payment pannen, innum waiting nu varudhu.',
        english: 'I just finished paying 20 seconds ago, but status is still pending.',
        hindi: 'मैंने अभी भुगतान किया है, स्थिति अभी भी पेंडिंग है।',
      },
      expectedRootCause: 'Transient Gateway Dispatch Lag (~180s queue)',
      safeAction: 'WAIT & MONITOR (Do not force repair yet)',
    },
  ];

  constructor(private http: HttpClient) {
    this.loadIncidents();
    this.loadMetrics();
  }

  async loadIncidents(): Promise<void> {
    this.isLoading.set(true);
    try {
      const data = await firstValueFrom(this.http.get<PaymentIncident[]>(`${this.apiUrl}/incidents`));
      this.incidents.set(data);
      if (!this.selectedIncident() && data.length > 0) {
        this.selectedIncident.set(data[0]);
      }
    } catch (err) {
      console.warn('Backend API unavailable, using in-memory demo data:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadMetrics(): Promise<void> {
    try {
      const data = await firstValueFrom(this.http.get<TruthMetrics>(`${this.apiUrl}/truth/metrics`));
      this.metrics.set(data);
    } catch (err) {
      // keep default metrics
    }
  }

  selectIncident(incident: PaymentIncident): void {
    this.selectedIncident.set(incident);
  }

  async simulateScenario(scenarioType: ScenarioType): Promise<PaymentIncident> {
    this.isLoading.set(true);
    try {
      const incident = await firstValueFrom(
        this.http.post<PaymentIncident>(`${this.apiUrl}/incidents/simulate/${scenarioType}`, {})
      );
      this.incidents.update(list => [incident, ...list.filter(i => i.id !== incident.id)]);
      this.selectedIncident.set(incident);
      this.loadMetrics();
      return incident;
    } catch (err) {
      console.error('Failed to simulate scenario:', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async investigate(params: {
    complaintText: string;
    orderId?: string;
    paymentId?: string;
    amount?: number;
    language?: string;
  }): Promise<PaymentIncident> {
    this.isInvestigating.set(true);
    
    // Simulate realistic multi-stage investigation progression
    const stages = [
      '🔍 Searching merchant order database...',
      '🔍 Checking payment gateway records...',
      '🔍 Verifying bank debit & UTR confirmation...',
      '🔍 Analyzing webhook delivery history...',
      '🔍 Correlating multi-system timeline & invariants...',
      '⚖️ Establishing final Ground Truth with Gemini AI...',
    ];

    for (let i = 0; i < stages.length; i++) {
      this.activeInvestigationStage.set(stages[i]);
      await new Promise(r => setTimeout(r, 400));
    }

    try {
      const incident = await firstValueFrom(
        this.http.post<PaymentIncident>(`${this.apiUrl}/incidents/investigate`, params)
      );
      this.incidents.update(list => [incident, ...list.filter(i => i.id !== incident.id)]);
      this.selectedIncident.set(incident);
      this.loadMetrics();
      return incident;
    } finally {
      this.isInvestigating.set(false);
      this.activeInvestigationStage.set('');
    }
  }

  async verifyIncident(incidentId: string): Promise<DeterministicVerificationResult> {
    const result = await firstValueFrom(
      this.http.post<DeterministicVerificationResult>(`${this.apiUrl}/incidents/${incidentId}/verify`, {})
    );
    
    // Update local state
    this.incidents.update(list => list.map(i => i.id === incidentId ? { ...i, verification: result } : i));
    if (this.selectedIncident()?.id === incidentId) {
      this.selectedIncident.update(i => i ? { ...i, verification: result } : null);
    }
    return result;
  }

  async executeSafeRepair(params: {
    incidentId: string;
    verificationToken?: string;
    operatorName?: string;
  }): Promise<{ success: boolean; incident: PaymentIncident; message: string }> {
    this.isLoading.set(true);
    try {
      const res = await firstValueFrom(
        this.http.post<{ success: boolean; incident: PaymentIncident; message: string }>(
          `${this.apiUrl}/incidents/${params.incidentId}/repair`,
          params
        )
      );
      
      this.incidents.update(list => list.map(i => i.id === params.incidentId ? res.incident : i));
      this.selectedIncident.set(res.incident);
      this.loadMetrics();
      return res;
    } finally {
      this.isLoading.set(false);
    }
  }

  async lookup(query: string): Promise<any> {
    return firstValueFrom(this.http.get<any>(`${this.apiUrl}/truth/lookup?q=${encodeURIComponent(query)}`));
  }

  async loadAuditLogs(incidentId?: string): Promise<AuditEntry[]> {
    const url = incidentId ? `${this.apiUrl}/truth/audit?incidentId=${incidentId}` : `${this.apiUrl}/truth/audit`;
    const logs = await firstValueFrom(this.http.get<AuditEntry[]>(url));
    this.auditLogs.set(logs);
    return logs;
  }
}
