const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { SafeStateRepairService } = require('../dist/modules/truth/repair.service.js');
const { MockDataStore, mockDataStore } = require('../dist/modules/truth/mock-data.store.js');
const { hasPermission } = require('../dist/common/auth/permissions.js');

function createTestIncident(overrides = {}) {
  const now = new Date().toISOString();
  return {
    id: `INC-REP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    orderId: 'ORD_REP_101',
    paymentId: 'PAY_REP_202',
    amount: 12499,
    currency: 'INR',
    customerName: 'Ananya Ramanathan',
    customerClaim: 'Paid but website shows pending',
    severity: 'HIGH',
    status: 'ROOT_CAUSE_FOUND',
    createdAt: now,
    updatedAt: now,
    isRepaired: false,
    aiAnalysis: {
      confidence: 98,
      category: 'WEBHOOK_PROCESSING_FAILURE',
      summary: 'Webhook failed',
      detailedExplanation: 'Payment captured at gateway',
      evidence: ['Bank debit confirmed', 'Gateway CAPTURED'],
      customerRisk: 'LOW',
      recommendedAction: 'MARK_ORDER_PAID',
      voiceScript: { tamil: '', english: '', tanglish: '', hindi: '' }
    },
    truthMatrix: {
      bank: {
        status: 'DEBITED',
        reference: 'HDFC-999',
        amount: 12499,
        timestamp: now,
        description: 'Debited'
      },
      gateway: {
        status: 'CAPTURED',
        paymentId: 'PAY_REP_202',
        amount: 12499,
        timestamp: now,
        method: 'UPI',
        signatureValid: true
      },
      webhook: {
        status: 'FAILED',
        event: 'payment.captured',
        httpStatusCode: 500,
        attempts: 3,
        deliveryTime: now
      },
      merchantBackend: {
        status: 'FAILED',
        processingState: 'UNHANDLED_EXCEPTION'
      },
      merchantDb: {
        orderId: 'ORD_REP_101',
        orderStatus: 'UNPAID',
        amount: 12499,
        customerId: 'CUST_7749',
        updatedAt: now
      },
      finalTruth: {
        isPaymentSuccessful: true,
        verdict: 'PAYMENT_SUCCESS_ORDER_UNPAID',
        desynchronizationPoint: 'WEBHOOK_DELIVERY',
        customerAdvice: 'Synchronize merchant order.'
      }
    },
    timeline: [
      { id: 'evt-1', timestamp: now, relativeTime: 'Just now', source: 'GATEWAY', eventType: 'payment.captured', title: 'Captured', status: 'SUCCESS' }
    ],
    graphNodes: [
      { id: 'node-db', label: 'Database', type: 'database', status: 'warning', subtext: 'Order: UNPAID ❌' },
      { id: 'node-wh', label: 'Webhook', type: 'webhook', status: 'failed', subtext: 'Dropped' }
    ],
    auditTrail: [],
    ...overrides
  };
}

describe('PRIORITY 2: SafeStateRepairService', () => {
  const repairService = new SafeStateRepairService();

  it('1. Successful valid repair mutates state and updates truth matrix', () => {
    const incident = createTestIncident();
    mockDataStore.saveIncident(incident);

    const result = repairService.repairState({
      incidentId: incident.id,
      operatorName: 'SecOps Lead Rajesh',
      operatorRole: 'ADMIN'
    });

    assert.strictEqual(result.success, true);
    assert.ok(result.message.includes('successfully'));
    assert.strictEqual(result.incident.isRepaired, true);
    assert.strictEqual(result.incident.status, 'REPAIRED');
    assert.strictEqual(result.incident.repairedBy, 'SecOps Lead Rajesh');
    assert.strictEqual(result.incident.truthMatrix.merchantDb.orderStatus, 'PAID');
    assert.strictEqual(result.incident.truthMatrix.finalTruth.isPaymentSuccessful, true);
    assert.strictEqual(result.incident.truthMatrix.finalTruth.verdict, 'SYNCHRONIZED_AND_RESOLVED');
    assert.strictEqual(result.incident.truthMatrix.merchantBackend.processingState, 'RECONCILED_BY_SAFE_REPAIR_ENGINE');

    // Graph node updates
    const dbNode = result.incident.graphNodes.find(n => n.id === 'node-db');
    assert.strictEqual(dbNode.status, 'healthy');
    assert.ok(dbNode.subtext.includes('PAID'));

    // Timeline event
    const repairEvent = result.incident.timeline.find(e => e.eventType === 'state.repaired');
    assert.ok(repairEvent, 'Timeline must contain state.repaired event');
    assert.strictEqual(repairEvent.status, 'SUCCESS');
  });

  it('2. Already-repaired incident is idempotent and does not re-mutate', () => {
    const incident = createTestIncident({ isRepaired: true, status: 'REPAIRED' });
    mockDataStore.saveIncident(incident);

    const timelineLenBefore = incident.timeline.length;
    const result = repairService.repairState({
      incidentId: incident.id,
      operatorName: 'Admin Operator'
    });

    assert.strictEqual(result.success, true);
    assert.ok(result.message.includes('already repaired previously'));
    assert.strictEqual(result.incident.timeline.length, timelineLenBefore, 'Timeline should not have duplicate events');
  });

  it('3. Invalid incident ID throws descriptive error', () => {
    assert.throws(
      () => {
        repairService.repairState({ incidentId: 'NON_EXISTENT_ID_999' });
      },
      /Incident with ID NON_EXISTENT_ID_999 not found/
    );
  });

  it('4. Verification failure halts repair and throws', () => {
    const incident = createTestIncident();
    // Invalidate signature
    incident.truthMatrix.gateway.signatureValid = false;
    mockDataStore.saveIncident(incident);

    assert.throws(
      () => {
        repairService.repairState({ incidentId: incident.id });
      },
      /Cannot execute state repair/
    );
  });

  it('5. Human approval / operator attribution requirement', () => {
    const incident = createTestIncident();
    mockDataStore.saveIncident(incident);

    const result = repairService.repairState({
      incidentId: incident.id,
      operatorName: 'Suresh Compliance Officer',
      operatorRole: 'ADMIN'
    });

    assert.strictEqual(result.incident.repairedBy, 'Suresh Compliance Officer');
    const audit = result.incident.auditTrail[0];
    assert.strictEqual(audit.actorName, 'Suresh Compliance Officer');
  });

  it('6. Unauthorized repair attempt blocked at permission layer', () => {
    const makerUser = { id: 'u1', name: 'Maker', email: 'maker@corp.com', role: 'MAKER', orgId: 'org1', exp: 9999999999 };
    const checkerUser = { id: 'u2', name: 'Checker', email: 'checker@corp.com', role: 'CHECKER', orgId: 'org1', exp: 9999999999 };
    const auditorUser = { id: 'u3', name: 'Auditor', email: 'auditor@corp.com', role: 'AUDITOR', orgId: 'org1', exp: 9999999999 };
    const adminUser = { id: 'u4', name: 'Admin', email: 'admin@corp.com', role: 'ADMIN', orgId: 'org1', exp: 9999999999 };

    assert.strictEqual(hasPermission(makerUser, 'CAN_REPAIR_PAYMENT'), false, 'MAKER must NOT have CAN_REPAIR_PAYMENT');
    assert.strictEqual(hasPermission(checkerUser, 'CAN_REPAIR_PAYMENT'), false, 'CHECKER must NOT have CAN_REPAIR_PAYMENT');
    assert.strictEqual(hasPermission(auditorUser, 'CAN_REPAIR_PAYMENT'), false, 'AUDITOR must NOT have CAN_REPAIR_PAYMENT');
    assert.strictEqual(hasPermission(adminUser, 'CAN_REPAIR_PAYMENT'), true, 'ADMIN MUST have CAN_REPAIR_PAYMENT');
  });

  it('7. PHANTOM_CREDIT_DESYNC cannot be repaired (hard-block enforced)', () => {
    const incident = createTestIncident({
      aiAnalysis: {
        confidence: 99,
        category: 'PHANTOM_CREDIT_DESYNC',
        summary: 'Phantom credit anomaly',
        detailedExplanation: 'Money never received',
        evidence: [],
        customerRisk: 'CRITICAL',
        recommendedAction: 'ESCALATE_MANUAL_REVIEW',
        voiceScript: { tamil: '', english: '', tanglish: '', hindi: '' }
      }
    });
    incident.truthMatrix.gateway.status = 'FAILED';
    incident.truthMatrix.merchantDb.orderStatus = 'PAID';
    mockDataStore.saveIncident(incident);

    assert.throws(
      () => {
        repairService.repairState({ incidentId: incident.id });
      },
      /CRITICAL RISK: Money was NOT captured/
    );
  });

  it('8. State cannot be mutated when verification fails', () => {
    const incident = createTestIncident();
    incident.truthMatrix.bank.amount = 99999; // corrupt amount
    mockDataStore.saveIncident(incident);

    assert.throws(() => {
      repairService.repairState({ incidentId: incident.id });
    });

    const stored = mockDataStore.getIncidentById(incident.id);
    assert.strictEqual(stored.isRepaired, false, 'isRepaired must remain false');
    assert.strictEqual(stored.truthMatrix.merchantDb.orderStatus, 'UNPAID', 'orderStatus must remain UNPAID');
    assert.strictEqual(stored.status, 'ROOT_CAUSE_FOUND', 'status must not change');
  });

  it('9. Audit entry is created for successful repair in both incident and store', () => {
    const incident = createTestIncident();
    mockDataStore.saveIncident(incident);

    repairService.repairState({
      incidentId: incident.id,
      operatorName: 'Audit Test Officer'
    });

    assert.ok(incident.auditTrail.length > 0, 'incident.auditTrail must have entry');
    const incidentAudit = incident.auditTrail[0];
    assert.strictEqual(incidentAudit.incidentId, incident.id);
    assert.strictEqual(incidentAudit.action, 'STATE_REPAIR_EXECUTED');
    assert.strictEqual(incidentAudit.actor, 'SAFE_REPAIR_ENGINE');

    const storeAudits = mockDataStore.getAuditLogs(incident.id);
    assert.ok(storeAudits.length > 0, 'mockDataStore must have audit entries for incident');
  });

  it('10. Previous and new state are accurately recorded in stateDelta', () => {
    const incident = createTestIncident();
    mockDataStore.saveIncident(incident);

    repairService.repairState({
      incidentId: incident.id,
      operatorName: 'State Delta Verifier'
    });

    const auditEntry = incident.auditTrail[0];
    assert.ok(auditEntry.stateDelta, 'stateDelta must exist');
    assert.strictEqual(auditEntry.stateDelta.before.orderStatus, 'UNPAID');
    assert.strictEqual(auditEntry.stateDelta.after.orderStatus, 'PAID');
    assert.strictEqual(auditEntry.stateDelta.before.orderId, 'ORD_REP_101');
  });
});
