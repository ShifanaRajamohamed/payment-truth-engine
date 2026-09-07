const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { MockDataStore } = require('../dist/modules/truth/mock-data.store.js');
const { DeterministicVerificationService } = require('../dist/modules/truth/verification.service.js');
const { SafeStateRepairService } = require('../dist/modules/truth/repair.service.js');

describe('PRIORITY 6: Regression Tests with MockDataStore & Built-in Fixtures', () => {
  const verificationService = new DeterministicVerificationService();

  it('1. MockDataStore initializes with valid pre-seeded incidents', () => {
    const store = new MockDataStore();
    const incidents = store.getAllIncidents();

    assert.ok(incidents.length >= 4, `Expected at least 4 seeded incidents, got ${incidents.length}`);

    for (const inc of incidents) {
      assert.ok(inc.id, 'Incident must have ID');
      assert.ok(inc.orderId, 'Incident must have orderId');
      assert.ok(inc.amount > 0, 'Incident must have positive amount');
      assert.ok(inc.currency === 'INR', 'Currency must be INR');
      assert.ok(inc.truthMatrix, 'Incident must have truthMatrix');
      assert.ok(inc.truthMatrix.bank, 'truthMatrix must have bank');
      assert.ok(inc.truthMatrix.gateway, 'truthMatrix must have gateway');
      assert.ok(inc.truthMatrix.merchantDb, 'truthMatrix must have merchantDb');
      assert.ok(Array.isArray(inc.timeline), 'timeline must be array');
      assert.ok(Array.isArray(inc.graphNodes), 'graphNodes must be array');
      assert.ok(inc.aiAnalysis, 'aiAnalysis must be present');
    }
  });

  it('2. End-to-End lifecycle for SCENARIO_1_WEBHOOK_FAILURE', () => {
    const store = new MockDataStore();
    const repairService = new SafeStateRepairService();

    // Generate fresh scenario 1
    const incident = store.generateScenarioIncident('SCENARIO_1_WEBHOOK_FAILURE');
    store.saveIncident(incident);

    // Initial state check
    assert.strictEqual(incident.truthMatrix.merchantDb.orderStatus, 'UNPAID');
    assert.strictEqual(incident.truthMatrix.gateway.status, 'CAPTURED');
    assert.strictEqual(incident.isRepaired, false);

    // Step 1: Verification
    const verification = verificationService.verifyIncident(incident);
    assert.strictEqual(verification.isVerified, true);
    assert.strictEqual(verification.canSafeRepair, true);
    assert.strictEqual(verification.repairActionType, 'MARK_ORDER_PAID');
    assert.strictEqual(verification.requiresHumanApproval, true);
    assert.ok(verification.verificationToken);

    // Step 2: Repair
    // Point repair service to this incident in the global mockDataStore
    const { mockDataStore: globalStore } = require('../dist/modules/truth/mock-data.store.js');
    globalStore.saveIncident(incident);

    const repairResult = repairService.repairState({
      incidentId: incident.id,
      operatorName: 'Lead Ops Tester'
    });

    assert.strictEqual(repairResult.success, true);
    assert.strictEqual(repairResult.incident.isRepaired, true);
    assert.strictEqual(repairResult.incident.status, 'REPAIRED');
    assert.strictEqual(repairResult.incident.truthMatrix.merchantDb.orderStatus, 'PAID');

    // Step 3: Verify idempotency
    const reRepair = repairService.repairState({
      incidentId: incident.id,
      operatorName: 'Lead Ops Tester'
    });
    assert.strictEqual(reRepair.success, true);
    assert.ok(reRepair.message.includes('already repaired'));
  });

  it('3. Hard-block regression for SCENARIO_3_PAYMENT_FAILED_ORDER_PAID (Phantom Credit)', () => {
    const store = new MockDataStore();
    const repairService = new SafeStateRepairService();
    const { mockDataStore: globalStore } = require('../dist/modules/truth/mock-data.store.js');

    const incident = store.generateScenarioIncident('SCENARIO_3_PAYMENT_FAILED_ORDER_PAID');
    globalStore.saveIncident(incident);

    // Verify
    const verification = verificationService.verifyIncident(incident);
    assert.strictEqual(verification.canSafeRepair, false, 'Phantom credit must NEVER be safe to repair');
    assert.strictEqual(verification.repairActionType, 'ESCALATE_MANUAL_REVIEW');
    assert.ok(verification.rejectionReason.includes('CRITICAL RISK'));

    // Repair attempt must fail
    assert.throws(
      () => {
        repairService.repairState({ incidentId: incident.id });
      },
      /CRITICAL RISK: Money was NOT captured/
    );

    // Assert state was not mutated
    const current = globalStore.getIncidentById(incident.id);
    assert.strictEqual(current.isRepaired, false);
  });

  it('4. End-to-End lifecycle for SCENARIO_2_DUPLICATE_PAYMENT', () => {
    const store = new MockDataStore();
    const repairService = new SafeStateRepairService();
    const { mockDataStore: globalStore } = require('../dist/modules/truth/mock-data.store.js');

    const incident = store.generateScenarioIncident('SCENARIO_2_DUPLICATE_PAYMENT');
    globalStore.saveIncident(incident);

    const verification = verificationService.verifyIncident(incident);
    assert.strictEqual(verification.canSafeRepair, true);
    assert.strictEqual(verification.repairActionType, 'INITIATE_REFUND_WORKFLOW');
    assert.strictEqual(verification.targetStateUpdate?.entity, 'PAYMENT');
    assert.strictEqual(verification.targetStateUpdate?.to, 'REFUND_QUEUED');

    const repairResult = repairService.repairState({
      incidentId: incident.id,
      operatorName: 'Refund Officer'
    });

    assert.strictEqual(repairResult.success, true);
    assert.strictEqual(repairResult.incident.isRepaired, true);
  });

  it('5. End-to-End lifecycle for SCENARIO_4_REFUND_MISMATCH', () => {
    const store = new MockDataStore();
    const repairService = new SafeStateRepairService();
    const { mockDataStore: globalStore } = require('../dist/modules/truth/mock-data.store.js');

    const incident = store.generateScenarioIncident('SCENARIO_4_REFUND_MISMATCH');
    globalStore.saveIncident(incident);

    const verification = verificationService.verifyIncident(incident);
    assert.strictEqual(verification.canSafeRepair, true);
    assert.strictEqual(verification.repairActionType, 'SYNC_REFUND_STATUS');
    assert.strictEqual(verification.targetStateUpdate?.to, 'REFUNDED');

    const repairResult = repairService.repairState({
      incidentId: incident.id,
      operatorName: 'Sync Agent'
    });

    assert.strictEqual(repairResult.success, true);
    assert.strictEqual(repairResult.incident.truthMatrix.merchantDb.orderStatus, 'REFUNDED');
  });

  it('6. Regression for SCENARIO_5_DELAYED_WEBHOOK (Transient delay holds state)', () => {
    const store = new MockDataStore();
    const repairService = new SafeStateRepairService();
    const { mockDataStore: globalStore } = require('../dist/modules/truth/mock-data.store.js');

    const incident = store.generateScenarioIncident('SCENARIO_5_DELAYED_WEBHOOK');
    globalStore.saveIncident(incident);

    const verification = verificationService.verifyIncident(incident);
    assert.strictEqual(verification.canSafeRepair, false);
    assert.strictEqual(verification.repairActionType, 'WAIT_AND_MONITOR');

    assert.throws(() => {
      repairService.repairState({ incidentId: incident.id });
    });
  });

  it('7. lookupCrossSystem query resolution', () => {
    const store = new MockDataStore();
    const incidents = store.getAllIncidents();
    const firstInc = incidents[0];

    // Lookup by incident ID
    const byId = store.lookupCrossSystem(firstInc.id);
    assert.strictEqual(byId.found, true);
    assert.strictEqual(byId.incident.id, firstInc.id);
    assert.ok(byId.order);
    assert.ok(byId.payment);

    // Lookup by order ID
    const byOrder = store.lookupCrossSystem(firstInc.orderId);
    assert.strictEqual(byOrder.found, true);
    assert.strictEqual(byOrder.order.orderId, firstInc.orderId);

    // Lookup non-existent
    const byMissing = store.lookupCrossSystem('NON_EXISTENT_QUERY_123');
    assert.strictEqual(byMissing.found, false);
  });
});
