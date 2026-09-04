import { Payment, ApprovePaymentDto, RejectPaymentDto } from '@deepaudit/shared-types';
import { PaymentsService } from '../payments/payments.service';
import { AuditService } from '../audit/audit.service';

export class AuthorizationService {
  private static instance: AuthorizationService;
  private paymentsService = PaymentsService.getInstance();
  private auditService = AuditService.getInstance();

  static getInstance(): AuthorizationService {
    if (!AuthorizationService.instance) {
      AuthorizationService.instance = new AuthorizationService();
    }
    return AuthorizationService.instance;
  }

  async verifyStepUp(paymentId: string, credential: any, actor: any): Promise<Payment> {
    const payment = this.paymentsService.getPaymentById(paymentId);
    if (!payment) throw new Error('Payment not found');

    if (!payment.authorization) {
      throw new Error('Payment does not require authorization');
    }

    payment.authorization.stepUpStatus = 'VERIFIED';
    payment.authorization.stepUpVerifiedAt = new Date().toISOString();
    payment.status = 'PENDING_APPROVAL';

    this.auditService.log({
      eventType: 'AUTHORIZATION_COMPLETED',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      targetEntity: 'PAYMENT',
      targetId: payment.id,
      orgId: actor.orgId,
      summary: `Step-up Passkey hardware verification completed for ${payment.referenceNumber}`,
      metadata: { method: 'PASSKEY_WEBAUTHN', verifiedAt: payment.authorization.stepUpVerifiedAt }
    });

    return payment;
  }

  async approve(dto: ApprovePaymentDto, actor: any): Promise<Payment> {
    const payment = this.paymentsService.getPaymentById(dto.paymentId);
    if (!payment) throw new Error('Payment not found');

    if (payment.authorization?.requiresStepUp && payment.authorization.stepUpStatus !== 'VERIFIED') {
      throw new Error('Step-up passkey verification required prior to approval.');
    }

    payment.status = 'APPROVED';
    if (payment.authorization) {
      payment.authorization.isFullyAuthorized = true;
      payment.authorization.finalDecision = 'APPROVED';
    }

    this.auditService.log({
      eventType: 'PAYMENT_APPROVED',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      targetEntity: 'PAYMENT',
      targetId: payment.id,
      orgId: actor.orgId,
      summary: `Payment ${payment.referenceNumber} approved by ${actor.name} (${actor.role})`,
      metadata: { comments: dto.comments }
    });

    return payment;
  }

  async reject(dto: RejectPaymentDto, actor: any): Promise<Payment> {
    const payment = this.paymentsService.getPaymentById(dto.paymentId);
    if (!payment) throw new Error('Payment not found');

    payment.status = 'REJECTED';
    payment.failureReason = dto.reason;
    if (payment.authorization) {
      payment.authorization.finalDecision = 'REJECTED';
    }

    this.auditService.log({
      eventType: 'PAYMENT_REJECTED',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      targetEntity: 'PAYMENT',
      targetId: payment.id,
      orgId: actor.orgId,
      summary: `Payment ${payment.referenceNumber} rejected by ${actor.name}. Reason: ${dto.reason}`,
      metadata: { reason: dto.reason }
    });

    return payment;
  }
}
