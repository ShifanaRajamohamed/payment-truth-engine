const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { WebhookSignatureVerifier } = require('../dist/modules/truth/webhook/webhook-verifier.js');

describe('PHASE 4B: Production Webhook Cryptographic Verification Utility', () => {
  const secret = 'whsec_prod_live_98a72b1c4f5e6d7a8b9c0d1e2f3a4b5c';
  const samplePayload = JSON.stringify({
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_Hk39zNxL401kKj',
          amount: 12499,
          currency: 'INR',
          status: 'captured',
          order_id: 'order_Hk39zNmQ809lLo'
        }
      }
    },
    created_at: 1725700000
  });

  function computeValidSignature(payload, sec = secret) {
    return crypto.createHmac('sha256', sec).update(payload).digest('hex');
  }

  it('1. Valid signature passes verification', () => {
    const validSig = computeValidSignature(samplePayload);
    const result = WebhookSignatureVerifier.verifyWebhookSignature(samplePayload, validSig, secret);

    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.reason, undefined);
  });

  it('2. Invalid signature is rejected', () => {
    const wrongSig = computeValidSignature(samplePayload, 'wrong_secret_key');
    const result = WebhookSignatureVerifier.verifyWebhookSignature(samplePayload, wrongSig, secret);

    assert.strictEqual(result.valid, false);
    assert.ok(result.reason?.includes('HMAC-SHA256 signature verification failed'));
  });

  it('3. Tampered payload is rejected even if only 1 character is modified', () => {
    const validSig = computeValidSignature(samplePayload);
    const tamperedPayload = samplePayload.replace('12499', '12498'); // 1 rupee tamper

    const result = WebhookSignatureVerifier.verifyWebhookSignature(tamperedPayload, validSig, secret);

    assert.strictEqual(result.valid, false);
    assert.ok(result.reason?.includes('verification failed'));
  });

  it('4. Malformed signature (non-hex, wrong length, truncated) is rejected safely', () => {
    // Truncated signature
    const truncatedSig = 'abc1234';
    const resTrunc = WebhookSignatureVerifier.verifyWebhookSignature(samplePayload, truncatedSig, secret);
    assert.strictEqual(resTrunc.valid, false);
    assert.ok(resTrunc.reason?.includes('length mismatch'));

    // Empty signature
    const resEmpty = WebhookSignatureVerifier.verifyWebhookSignature(samplePayload, '', secret);
    assert.strictEqual(resEmpty.valid, false);
    assert.ok(resEmpty.reason?.includes('Missing or empty webhook signature'));

    // Null/undefined signature
    const resNull = WebhookSignatureVerifier.verifyWebhookSignature(samplePayload, null, secret);
    assert.strictEqual(resNull.valid, false);
  });

  it('5. Different payload with same signature is rejected', () => {
    const validSigForA = computeValidSignature(samplePayload);
    const completelyDifferentPayload = JSON.stringify({ event: 'order.paid', amount: 999 });

    const result = WebhookSignatureVerifier.verifyWebhookSignature(completelyDifferentPayload, validSigForA, secret);

    assert.strictEqual(result.valid, false);
    assert.ok(result.reason?.includes('verification failed'));
  });

  it('6. Missing or empty secret is rejected without throwing unhandled exceptions', () => {
    const validSig = computeValidSignature(samplePayload);

    const resNoSecret = WebhookSignatureVerifier.verifyWebhookSignature(samplePayload, validSig, '');
    assert.strictEqual(resNoSecret.valid, false);
    assert.ok(resNoSecret.reason?.includes('secret is not configured'));

    const resNullSecret = WebhookSignatureVerifier.verifyWebhookSignature(samplePayload, validSig, null);
    assert.strictEqual(resNullSecret.valid, false);
  });

  it('7. Handles Buffer payloads identically to string payloads', () => {
    const bufferPayload = Buffer.from(samplePayload, 'utf8');
    const validSig = computeValidSignature(samplePayload);

    const result = WebhookSignatureVerifier.verifyWebhookSignature(bufferPayload, validSig, secret);
    assert.strictEqual(result.valid, true);
  });

  it('8. Timing-safe comparison path: ensures constant-time execution without throwing', () => {
    // Generates a signature of equal 64-char length but differing at the first or last byte
    const validSig = computeValidSignature(samplePayload);
    const forgedSig = '0' + validSig.slice(1); // Same length (64 chars)

    assert.strictEqual(validSig.length, forgedSig.length);
    const result = WebhookSignatureVerifier.verifyWebhookSignature(samplePayload, forgedSig, secret);

    assert.strictEqual(result.valid, false);
    assert.ok(result.reason?.includes('verification failed'));
  });

});
