import { AuditEvent, AuditEventType } from '@deepaudit/shared-types';
import crypto from 'crypto';

export class AuditService {
  private static instance: AuditService;
  private readonly events: AuditEvent[] = [];
  private sequenceCounter = 1;

  private constructor() {
    // Initial genesis block event
    this.log({
      eventType: 'POLICY_UPDATED',
      actorId: 'system',
      actorName: 'DeepAudit System Genesis',
      actorRole: 'SYSTEM',
      targetEntity: 'RISK_POLICY',
      targetId: 'genesis_policy',
      orgId: 'org_acme_corp',
      summary: 'DeepAudit AI Governance and Immutability Ledger Initialized',
      metadata: { initializedAt: new Date().toISOString() }
    });
  }

  static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  /**
   * Append-only audit logger with SHA-256 hash chaining.
   */
  log(params: {
    eventType: AuditEventType;
    actorId: string;
    actorName: string;
    actorRole: string;
    targetEntity: 'PAYMENT' | 'BENEFICIARY' | 'RISK_POLICY' | 'USER';
    targetId: string;
    orgId: string;
    summary: string;
    metadata: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): AuditEvent {
    const seq = this.sequenceCounter++;
    const timestamp = new Date().toISOString();
    const previousEvent = this.events[this.events.length - 1];
    const previousHash = previousEvent ? previousEvent.immutableHash : '00000000000000000000000000000000';

    const payloadToHash = `${seq}:${timestamp}:${params.eventType}:${params.targetId}:${previousHash}:${JSON.stringify(params.metadata)}`;
    const immutableHash = crypto.createHash('sha256').update(payloadToHash).digest('hex');

    const event: AuditEvent = {
      id: `aud_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      sequenceNumber: seq,
      timestamp,
      eventType: params.eventType,
      actorId: params.actorId,
      actorName: params.actorName,
      actorRole: params.actorRole,
      targetEntity: params.targetEntity,
      targetId: params.targetId,
      orgId: params.orgId,
      summary: params.summary,
      metadata: params.metadata,
      ipAddress: params.ipAddress || '127.0.0.1',
      userAgent: params.userAgent || 'Internal API Service',
      immutableHash,
      previousHash
    };

    this.events.push(event);
    console.log(`[AUDIT EVENT #${seq}] ${params.eventType} -> Target: ${params.targetId} (Hash: ${immutableHash.substring(0, 12)}...)`);
    return event;
  }

  getAll(limit: number = 50): AuditEvent[] {
    return [...this.events].reverse().slice(0, limit);
  }

  getByTargetId(targetId: string): AuditEvent[] {
    return this.events.filter(e => e.targetId === targetId);
  }
}
