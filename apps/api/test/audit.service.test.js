const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { AuditService } = require('../dist/modules/audit/audit.service.js');

describe('PRIORITY 3: AuditService', () => {
  const auditService = AuditService.getInstance();

  it('1. Audit entry creation returns complete AuditEvent object', () => {
    const event = auditService.log({
      eventType: 'PAYMENT_APPROVED',
      actorId: 'usr_checker_01',
      actorName: 'Checker Priyadarshini',
      actorRole: 'CHECKER',
      targetEntity: 'PAYMENT',
      targetId: 'pay_test_001',
      orgId: 'org_acme_corp',
      summary: 'Corporate vendor transfer approved',
      metadata: { amount: 50000, beneficiaryId: 'ben_123' },
      ipAddress: '192.168.1.50',
      userAgent: 'DeepAudit-Web/1.0'
    });

    assert.ok(event.id.startsWith('aud_'));
    assert.strictEqual(typeof event.sequenceNumber, 'number');
    assert.ok(event.sequenceNumber > 0);
    assert.strictEqual(event.eventType, 'PAYMENT_APPROVED');
    assert.strictEqual(event.actorId, 'usr_checker_01');
    assert.strictEqual(event.actorName, 'Checker Priyadarshini');
    assert.strictEqual(event.actorRole, 'CHECKER');
    assert.strictEqual(event.targetEntity, 'PAYMENT');
    assert.strictEqual(event.targetId, 'pay_test_001');
    assert.strictEqual(event.orgId, 'org_acme_corp');
    assert.strictEqual(event.summary, 'Corporate vendor transfer approved');
    assert.strictEqual(event.ipAddress, '192.168.1.50');
    assert.strictEqual(event.userAgent, 'DeepAudit-Web/1.0');
    assert.strictEqual(event.metadata.amount, 50000);
    assert.strictEqual(typeof event.immutableHash, 'string');
    assert.strictEqual(typeof event.previousHash, 'string');
  });

  it('2 & 3. Previous and new state recording in metadata', () => {
    const previousState = { status: 'PENDING_APPROVAL', amount: 75000, checkerCount: 0 };
    const newState = { status: 'APPROVED', amount: 75000, checkerCount: 1 };

    const event = auditService.log({
      eventType: 'PAYMENT_APPROVED',
      actorId: 'usr_checker_02',
      actorName: 'Audit Test Officer',
      actorRole: 'CHECKER',
      targetEntity: 'PAYMENT',
      targetId: 'pay_test_state_delta',
      orgId: 'org_acme_corp',
      summary: 'State change with recorded delta',
      metadata: { previousState, newState }
    });

    assert.deepStrictEqual(event.metadata.previousState, previousState);
    assert.deepStrictEqual(event.metadata.newState, newState);
  });

  it('4. Hash generation produces valid SHA-256 matching exact payload', () => {
    const metadata = { testKey: 'testValue_12345' };
    const event = auditService.log({
      eventType: 'POLICY_UPDATED',
      actorId: 'usr_admin_01',
      actorName: 'Admin Ananya',
      actorRole: 'ADMIN',
      targetEntity: 'RISK_POLICY',
      targetId: 'pol_hash_test',
      orgId: 'org_acme_corp',
      summary: 'Testing SHA-256 hash calculation',
      metadata
    });

    // Validate 64-character hex
    assert.match(event.immutableHash, /^[a-f0-9]{64}$/);

    // Verify exact computation formula: seq:timestamp:eventType:targetId:previousHash:JSON.stringify(metadata)
    const expectedPayload = `${event.sequenceNumber}:${event.timestamp}:${event.eventType}:${event.targetId}:${event.previousHash}:${JSON.stringify(metadata)}`;
    const expectedHash = crypto.createHash('sha256').update(expectedPayload).digest('hex');

    assert.strictEqual(event.immutableHash, expectedHash, 'Hash must match canonical SHA-256 digest');
  });

  it('5. Hash-chain continuity across sequential events', () => {
    const e1 = auditService.log({
      eventType: 'PAYMENT_CREATED',
      actorId: 'usr_maker_01',
      actorName: 'Maker 1',
      actorRole: 'MAKER',
      targetEntity: 'PAYMENT',
      targetId: 'pay_chain_1',
      orgId: 'org_acme_corp',
      summary: 'Chain test event 1',
      metadata: { step: 1 }
    });

    const e2 = auditService.log({
      eventType: 'STEP_UP_REQUESTED',
      actorId: 'system',
      actorName: 'System',
      actorRole: 'SYSTEM',
      targetEntity: 'PAYMENT',
      targetId: 'pay_chain_1',
      orgId: 'org_acme_corp',
      summary: 'Chain test event 2',
      metadata: { step: 2 }
    });

    const e3 = auditService.log({
      eventType: 'PAYMENT_EXECUTED',
      actorId: 'usr_admin_01',
      actorName: 'Admin 1',
      actorRole: 'ADMIN',
      targetEntity: 'PAYMENT',
      targetId: 'pay_chain_1',
      orgId: 'org_acme_corp',
      summary: 'Chain test event 3',
      metadata: { step: 3 }
    });

    // Check sequence continuity
    assert.strictEqual(e2.sequenceNumber, e1.sequenceNumber + 1);
    assert.strictEqual(e3.sequenceNumber, e2.sequenceNumber + 1);

    // Check hash continuity
    assert.strictEqual(e2.previousHash, e1.immutableHash, 'Event 2 previousHash must equal Event 1 immutableHash');
    assert.strictEqual(e3.previousHash, e2.immutableHash, 'Event 3 previousHash must equal Event 2 immutableHash');
  });

  it('6. Tampered previous audit entry detection via chain verification', () => {
    // Get all events from the chain
    const events = auditService.getAll(50).reverse(); // chronological order
    assert.ok(events.length >= 4);

    // Verify unbroken chain function
    function verifyChain(chain) {
      for (let i = 1; i < chain.length; i++) {
        const prev = chain[i - 1];
        const curr = chain[i];
        if (curr.previousHash !== prev.immutableHash) {
          return { valid: false, brokenAtIndex: i, reason: 'HASH_MISMATCH' };
        }
        // Verify current hash calculation
        const payload = `${curr.sequenceNumber}:${curr.timestamp}:${curr.eventType}:${curr.targetId}:${curr.previousHash}:${JSON.stringify(curr.metadata)}`;
        const computed = crypto.createHash('sha256').update(payload).digest('hex');
        if (computed !== curr.immutableHash) {
          return { valid: false, brokenAtIndex: i, reason: 'PAYLOAD_TAMPERED' };
        }
      }
      return { valid: true };
    }

    // Baseline: current chain is valid
    const cleanVerification = verifyChain(events);
    assert.strictEqual(cleanVerification.valid, true, 'Clean chain must pass verification');

    // Simulate tampering with an event's metadata
    const tamperedChain = events.map(e => ({ ...e, metadata: { ...e.metadata } }));
    tamperedChain[1].metadata.tamperedField = 'MALICIOUS_INJECTION';

    const tamperedVerification = verifyChain(tamperedChain);
    assert.strictEqual(tamperedVerification.valid, false, 'Tampered chain must fail verification');
    assert.strictEqual(tamperedVerification.reason, 'PAYLOAD_TAMPERED');
  });

  it('7. Unique audit IDs generated under rapid succession', () => {
    const ids = new Set();
    for (let i = 0; i < 20; i++) {
      const event = auditService.log({
        eventType: 'PAYMENT_CREATED',
        actorId: 'usr_rapid',
        actorName: 'Rapid Logger',
        actorRole: 'MAKER',
        targetEntity: 'PAYMENT',
        targetId: `pay_rapid_${i}`,
        orgId: 'org_acme_corp',
        summary: `Rapid event ${i}`,
        metadata: { i }
      });
      ids.add(event.id);
    }

    assert.strictEqual(ids.size, 20, 'All 20 rapid audit events must have unique IDs');
  });
});
