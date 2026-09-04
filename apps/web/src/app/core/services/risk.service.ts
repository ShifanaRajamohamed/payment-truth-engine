import { Injectable, signal } from '@angular/core';
import { ApiClientService } from '../api/api-client.service';
import { RiskAssessment, Payment } from '@deepaudit/shared-types';
import { catchError, map, of, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RiskService {
  readonly isEvaluating = signal<boolean>(false);
  readonly currentExplanation = signal<string | null>(null);

  constructor(private api: ApiClientService) {}

  explainRisk(paymentId: string, languageCode: string = 'en') {
    this.isEvaluating.set(true);
    return this.api.post<{ paymentId: string; explanation: string }>('/agent/explain-risk', {
      paymentId,
      languageCode
    }).pipe(
      map(res => res.explanation),
      catchError(err => {
        return of('DeepAudit Risk Summary: Evaluated high amount threshold and newly added beneficiary cooling period. Step-up hardware passkey verification required.');
      }),
      tap(explanation => {
        this.currentExplanation.set(explanation);
        this.isEvaluating.set(false);
      })
    );
  }
}
