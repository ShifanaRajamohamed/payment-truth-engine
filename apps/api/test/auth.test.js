const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { createAuthToken, verifyAuthToken } = require('../dist/common/utils/auth-token.js');
const { authGuard, requirePermission } = require('../dist/common/guards/auth.guard.js');
const { hasPermission, roleFromDemoEmail } = require('../dist/common/auth/permissions.js');

function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return res;
}

describe('PRIORITY 4: Authentication & Authorization', () => {
  const sampleUser = {
    id: 'usr_admin_01',
    name: 'Admin User',
    email: 'admin@corp.com',
    role: 'ADMIN',
    orgId: 'org_acme_corp'
  };

  it('1. Missing authorization header is rejected with 401 UNAUTHORIZED', () => {
    const req = { headers: {} };
    const res = createMockRes();
    let nextCalled = false;

    authGuard(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, false, 'next() must NOT be called without auth header');
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'UNAUTHORIZED');
    assert.strictEqual(res.body.error.message, 'Authentication required');
  });

  it('2. Invalid, malformed, and expired tokens are rejected', () => {
    // Malformed strings
    const invalidTokens = [
      '',
      'Bearer ',
      'Bearer not.enough.dots.here',
      'Bearer invalidBase64!@#.signature',
      'Bearer ' + Buffer.from('{"id":"1"}').toString('base64url') // no signature
    ];

    for (const header of invalidTokens) {
      const req = { headers: { authorization: header } };
      const res = createMockRes();
      let nextCalled = false;

      authGuard(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, false, `next() must not be called for header "${header}"`);
      assert.strictEqual(res.statusCode, 401);
    }

    // Tampered signature
    const validToken = createAuthToken(sampleUser);
    const [payloadPart, sigPart] = validToken.split('.');
    const tamperedToken = `${payloadPart}.${sigPart.slice(0, -4)}XXXX`;

    const reqTampered = { headers: { authorization: `Bearer ${tamperedToken}` } };
    const resTampered = createMockRes();
    let nextTampered = false;

    authGuard(reqTampered, resTampered, () => { nextTampered = true; });
    assert.strictEqual(nextTampered, false);
    assert.strictEqual(resTampered.statusCode, 401);

    // Expired token
    const expiredPayload = {
      id: 'usr_old',
      name: 'Old User',
      email: 'old@corp.com',
      role: 'MAKER',
      orgId: 'org_1',
      exp: Math.floor(Date.now() / 1000) - 300 // expired 5 minutes ago
    };
    const encodedExpired = Buffer.from(JSON.stringify(expiredPayload)).toString('base64url');
    // Sign with process.env.JWT_SECRET or fallback
    const secret = process.env.JWT_SECRET || 'dev-secret-change-in-production-min-32-chars-long';
    const expiredSig = crypto.createHmac('sha256', secret).update(encodedExpired).digest('base64url');
    const expiredToken = `${encodedExpired}.${expiredSig}`;

    const verifiedExpired = verifyAuthToken(expiredToken);
    assert.strictEqual(verifiedExpired, null, 'Expired token must return null');

    const reqExpired = { headers: { authorization: `Bearer ${expiredToken}` } };
    const resExpired = createMockRes();
    let nextExpired = false;

    authGuard(reqExpired, resExpired, () => { nextExpired = true; });
    assert.strictEqual(nextExpired, false);
    assert.strictEqual(resExpired.statusCode, 401);
  });

  it('3. Valid token allows request and populates req.user', () => {
    const token = createAuthToken(sampleUser);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createMockRes();
    let nextCalled = false;

    authGuard(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, true, 'next() must be called for valid token');
    assert.ok(req.user, 'req.user must be populated');
    assert.strictEqual(req.user.id, sampleUser.id);
    assert.strictEqual(req.user.email, sampleUser.email);
    assert.strictEqual(req.user.role, 'ADMIN');
    assert.strictEqual(req.user.orgId, sampleUser.orgId);
    assert.ok(req.user.exp > Math.floor(Date.now() / 1000));
  });

  it('4. Admin role permissions (full privilege)', () => {
    const adminUser = { ...sampleUser, role: 'ADMIN', exp: 9999999999 };

    assert.strictEqual(hasPermission(adminUser, 'CAN_VIEW_PAYMENT_TRUTH'), true);
    assert.strictEqual(hasPermission(adminUser, 'CAN_APPROVE_PAYMENT'), true);
    assert.strictEqual(hasPermission(adminUser, 'CAN_REPAIR_PAYMENT'), true);

    // Test middleware
    const req = { user: adminUser };
    const res = createMockRes();
    let nextCalled = false;

    const guard = requirePermission('CAN_REPAIR_PAYMENT');
    guard(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, true, 'Admin must pass CAN_REPAIR_PAYMENT guard');
  });

  it('5. Non-admin attempting state repair is rejected with 403 FORBIDDEN', () => {
    const nonAdminRoles = ['MAKER', 'CHECKER', 'AUDITOR'];

    for (const role of nonAdminRoles) {
      const user = { ...sampleUser, role, exp: 9999999999 };
      assert.strictEqual(hasPermission(user, 'CAN_REPAIR_PAYMENT'), false, `${role} must not have CAN_REPAIR_PAYMENT`);

      const req = { user };
      const res = createMockRes();
      let nextCalled = false;

      const guard = requirePermission('CAN_REPAIR_PAYMENT');
      guard(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, false, `${role} must be blocked by repair guard`);
      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(res.body.error.code, 'FORBIDDEN');
      assert.strictEqual(res.body.error.message, 'Insufficient permissions');
    }
  });

  it('6. Complete permission matrix verification across all roles', () => {
    const roles = ['MAKER', 'CHECKER', 'ADMIN', 'AUDITOR'];
    const expected = {
      MAKER: { CAN_VIEW_PAYMENT_TRUTH: true, CAN_APPROVE_PAYMENT: false, CAN_REPAIR_PAYMENT: false },
      CHECKER: { CAN_VIEW_PAYMENT_TRUTH: true, CAN_APPROVE_PAYMENT: true, CAN_REPAIR_PAYMENT: false },
      ADMIN: { CAN_VIEW_PAYMENT_TRUTH: true, CAN_APPROVE_PAYMENT: true, CAN_REPAIR_PAYMENT: true },
      AUDITOR: { CAN_VIEW_PAYMENT_TRUTH: true, CAN_APPROVE_PAYMENT: false, CAN_REPAIR_PAYMENT: false }
    };

    for (const role of roles) {
      const user = { ...sampleUser, role, exp: 9999999999 };
      for (const [perm, expectedVal] of Object.entries(expected[role])) {
        assert.strictEqual(
          hasPermission(user, perm),
          expectedVal,
          `Role ${role} for permission ${perm} should be ${expectedVal}`
        );
      }
    }
  });

  it('7. Demo email role derivation logic', () => {
    assert.strictEqual(roleFromDemoEmail('admin.ops@company.com'), 'ADMIN');
    assert.strictEqual(roleFromDemoEmail('checker.risk@company.com'), 'CHECKER');
    assert.strictEqual(roleFromDemoEmail('approver_1@company.com'), 'CHECKER');
    assert.strictEqual(roleFromDemoEmail('auditor.internal@company.com'), 'AUDITOR');
    assert.strictEqual(roleFromDemoEmail('maker.ops@company.com'), 'MAKER');
    assert.strictEqual(roleFromDemoEmail('regular.staff@company.com'), 'MAKER');
  });

  it('8. requirePermission with missing req.user returns 401 UNAUTHORIZED', () => {
    const req = {}; // no user attached
    const res = createMockRes();
    let nextCalled = false;

    const guard = requirePermission('CAN_VIEW_PAYMENT_TRUTH');
    guard(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.error.code, 'UNAUTHORIZED');
  });
});
