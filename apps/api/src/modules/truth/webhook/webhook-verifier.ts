import * as crypto from 'crypto';

export interface WebhookVerificationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Isolated cryptographic webhook verification utility for production-grade gateway ingestion.
 *
 * NOTE: This module implements PRODUCTION WEBHOOK CRYPTOGRAPHIC VERIFICATION,
 * clearly separated from DEMO SIGNATURE SIMULATION (e.g. gateway.signatureValid in seeded hackathon scenarios).
 */
export class WebhookSignatureVerifier {
  /**
   * Verifies an incoming webhook payload against an HMAC-SHA256 signature.
   *
   * @param rawBody - Exact unmodified HTTP request payload as string or Buffer
   * @param receivedSignature - Signature string provided in the webhook header (e.g. X-Razorpay-Signature)
   * @param webhookSecret - Server-side secret key configured with the payment gateway
   * @returns WebhookVerificationResult indicating cryptographic validity
   */
  public static verifyWebhookSignature(
    rawBody: string | Buffer | null | undefined,
    receivedSignature: string | null | undefined,
    webhookSecret: string | null | undefined
  ): WebhookVerificationResult {
    // 1. Guard against missing or empty secret
    if (!webhookSecret || typeof webhookSecret !== 'string' || webhookSecret.trim() === '') {
      return {
        valid: false,
        reason: 'Webhook secret is not configured or empty.'
      };
    }

    // 2. Guard against missing or empty payload
    if (rawBody === null || rawBody === undefined) {
      return {
        valid: false,
        reason: 'Missing raw webhook request payload.'
      };
    }

    // 3. Guard against missing or empty signature
    if (!receivedSignature || typeof receivedSignature !== 'string' || receivedSignature.trim() === '') {
      return {
        valid: false,
        reason: 'Missing or empty webhook signature header.'
      };
    }

    try {
      // 4. Compute expected HMAC-SHA256 digest over the raw payload
      const payloadBuffer = typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : rawBody;
      const expectedHex = crypto
        .createHmac('sha256', webhookSecret)
        .update(payloadBuffer)
        .digest('hex');

      const expectedBuffer = Buffer.from(expectedHex, 'utf8');
      const receivedBuffer = Buffer.from(receivedSignature.trim(), 'utf8');

      // 5. Length comparison before timing-safe check (timingSafeEqual requires equal byte lengths)
      if (expectedBuffer.length !== receivedBuffer.length) {
        return {
          valid: false,
          reason: 'Signature length mismatch or malformed hex digest.'
        };
      }

      // 6. Constant-time cryptographic comparison
      const match = crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

      if (!match) {
        return {
          valid: false,
          reason: 'HMAC-SHA256 signature verification failed (payload tampered or invalid secret).'
        };
      }

      return { valid: true };
    } catch (err: any) {
      return {
        valid: false,
        reason: `Cryptographic verification encountered an error: ${err.message}`
      };
    }
  }
}
