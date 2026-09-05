import { PaymentIncident, ScenarioType, SystemTruthMatrix, TimelineEvent, SystemGraphNode, AuditEntry } from '@deepaudit/shared-types';

export class MockDataStore {
  private incidents: Map<string, PaymentIncident> = new Map();
  private auditLogs: AuditEntry[] = [];

  constructor() {
    this.seedInitialIncidents();
  }

  public getAllIncidents(): PaymentIncident[] {
    return Array.from(this.incidents.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getIncidentById(id: string): PaymentIncident | undefined {
    return this.incidents.get(id);
  }

  public saveIncident(incident: PaymentIncident): void {
    incident.updatedAt = new Date().toISOString();
    this.incidents.set(incident.id, incident);
  }

  public addAuditEntry(entry: AuditEntry): void {
    this.auditLogs.unshift(entry);
  }

  public getAuditLogs(incidentId?: string): AuditEntry[] {
    if (incidentId) {
      return this.auditLogs.filter(a => a.incidentId === incidentId);
    }
    return this.auditLogs;
  }

  public lookupCrossSystem(query: string): {
    found: boolean;
    order?: any;
    payment?: any;
    bankRecord?: any;
    webhookRecord?: any;
    incident?: PaymentIncident;
  } {
    const q = query.trim().toUpperCase();
    for (const inc of this.incidents.values()) {
      if (
        inc.id.toUpperCase() === q ||
        inc.orderId.toUpperCase() === q ||
        (inc.paymentId && inc.paymentId.toUpperCase() === q)
      ) {
        return {
          found: true,
          order: {
            orderId: inc.orderId,
            status: inc.truthMatrix.merchantDb.orderStatus,
            amount: inc.amount,
            customerId: inc.truthMatrix.merchantDb.customerId,
            updatedAt: inc.truthMatrix.merchantDb.updatedAt,
          },
          payment: {
            paymentId: inc.paymentId || inc.truthMatrix.gateway.paymentId,
            status: inc.truthMatrix.gateway.status,
            amount: inc.truthMatrix.gateway.amount,
            method: inc.truthMatrix.gateway.method,
            signatureValid: inc.truthMatrix.gateway.signatureValid,
          },
          bankRecord: inc.truthMatrix.bank,
          webhookRecord: inc.truthMatrix.webhook,
          incident: inc,
        };
      }
    }

    // Generate dynamic matching record if not found in pre-seeded
    return {
      found: false,
    };
  }

  public generateScenarioIncident(scenarioType: ScenarioType): PaymentIncident {
    const now = new Date();
    const incidentId = `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    let incident: PaymentIncident;

    switch (scenarioType) {
      case 'SCENARIO_1_WEBHOOK_FAILURE': {
        const orderId = `ORD_${Math.floor(10000 + Math.random() * 90000)}`;
        const paymentId = `PAY_${Math.floor(10000 + Math.random() * 90000)}`;
        const amount = 12499;

        const truthMatrix: SystemTruthMatrix = {
          bank: {
            status: 'DEBITED',
            reference: `HDFC-UTR-${Math.floor(10000000 + Math.random() * 90000000)}`,
            amount,
            timestamp: new Date(now.getTime() - 45000).toISOString(),
            description: 'Customer account debited successfully via UPI/NetBanking',
            rawPayload: { auth_code: 'AUTH_9921', rrn: '9921882190' },
          },
          gateway: {
            status: 'CAPTURED',
            paymentId,
            amount,
            timestamp: new Date(now.getTime() - 40000).toISOString(),
            method: 'UPI',
            signatureValid: true,
            rawPayload: { status: 'captured', capture_id: `cap_${paymentId}`, gateway: 'Razorpay' },
          },
          webhook: {
            status: 'FAILED',
            event: 'payment.captured',
            httpStatusCode: 500,
            attempts: 3,
            deliveryTime: new Date(now.getTime() - 38000).toISOString(),
            lastError: 'HTTP 500: Merchant API Gateway timeout / Internal Server Error on /api/v1/webhooks/razorpay',
            rawPayload: { event: 'payment.captured', entity: 'payment', id: paymentId },
          },
          merchantBackend: {
            status: 'FAILED',
            processingState: 'UNHANDLED_EXCEPTION',
            lastReceivedAt: new Date(now.getTime() - 38000).toISOString(),
            errorMessage: 'DB lock timeout on orders table during webhook processing',
          },
          merchantDb: {
            orderId,
            orderStatus: 'UNPAID',
            amount,
            customerId: 'CUST_7749',
            updatedAt: new Date(now.getTime() - 60000).toISOString(),
          },
          finalTruth: {
            isPaymentSuccessful: true,
            verdict: 'PAYMENT_SUCCESS_ORDER_UNPAID',
            desynchronizationPoint: 'WEBHOOK_DELIVERY',
            customerAdvice: 'Customer has successfully paid ₹12,499. Do NOT ask customer to repay. Synchronize merchant order.',
          },
        };

        const timeline: TimelineEvent[] = [
          {
            id: 'evt-1',
            timestamp: new Date(now.getTime() - 60000).toISOString(),
            relativeTime: '8:42:01 PM',
            source: 'MERCHANT_DB',
            eventType: 'order.created',
            title: 'Order Created',
            description: `Order ${orderId} created for ₹${amount.toLocaleString('en-IN')}`,
            status: 'SUCCESS',
          },
          {
            id: 'evt-2',
            timestamp: new Date(now.getTime() - 52000).toISOString(),
            relativeTime: '8:42:08 PM',
            source: 'GATEWAY',
            eventType: 'payment.initiated',
            title: 'Payment Initiated',
            description: `Checkout opened, Payment ID ${paymentId} initialized`,
            status: 'INFO',
          },
          {
            id: 'evt-3',
            timestamp: new Date(now.getTime() - 45000).toISOString(),
            relativeTime: '8:42:21 PM',
            source: 'BANK',
            eventType: 'bank.debit_success',
            title: 'Bank Authorization & Debit',
            description: 'Bank confirmed ₹12,499 debited with UTR verification',
            status: 'SUCCESS',
          },
          {
            id: 'evt-4',
            timestamp: new Date(now.getTime() - 40000).toISOString(),
            relativeTime: '8:42:22 PM',
            source: 'GATEWAY',
            eventType: 'payment.captured',
            title: 'Payment Captured',
            description: 'Gateway captured funds successfully. Cryptographic signature verified.',
            status: 'SUCCESS',
          },
          {
            id: 'evt-5',
            timestamp: new Date(now.getTime() - 38000).toISOString(),
            relativeTime: '8:42:23 PM',
            source: 'WEBHOOK',
            eventType: 'webhook.delivery_failed',
            title: 'Webhook Processing Failed',
            description: 'Gateway dispatched webhook; Merchant endpoint returned HTTP 500 Internal Server Error',
            status: 'FAILED',
            isFailurePoint: true,
            latencyMs: 1240,
          },
          {
            id: 'evt-6',
            timestamp: new Date(now.getTime() - 25000).toISOString(),
            relativeTime: '8:42:31 PM',
            source: 'CUSTOMER',
            eventType: 'customer.redirect',
            title: 'Customer Returned to Storefront',
            description: 'Customer screen showed Pending because backend did not update DB',
            status: 'WARNING',
          },
          {
            id: 'evt-7',
            timestamp: new Date(now.getTime() - 10000).toISOString(),
            relativeTime: '8:43:00 PM',
            source: 'MERCHANT_DB',
            eventType: 'state.inconsistent',
            title: 'Order Marked UNPAID (Stale State)',
            description: 'Merchant database remains in UNPAID state despite successful money capture',
            status: 'FAILED',
          },
        ];

        const graphNodes: SystemGraphNode[] = [
          { id: 'node-cust', label: 'Customer', type: 'customer', status: 'healthy', subtext: 'Paid ₹12,499' },
          { id: 'node-bank', label: 'Bank', type: 'bank', status: 'healthy', subtext: 'Debited (Success)' },
          { id: 'node-gw', label: 'Gateway', type: 'gateway', status: 'healthy', subtext: 'Captured ✅' },
          { id: 'node-wh', label: 'Webhook', type: 'webhook', status: 'failed', subtext: 'HTTP 500 (Failed)', isFailureOrigin: true },
          { id: 'node-mb', label: 'Merchant Backend', type: 'merchant_backend', status: 'failed', subtext: 'Error in Handler' },
          { id: 'node-db', label: 'Database', type: 'database', status: 'warning', subtext: 'Order: UNPAID ❌' },
        ];

        incident = {
          id: incidentId,
          orderId,
          paymentId,
          amount,
          currency: 'INR',
          customerName: 'Ananya Ramanathan',
          customerPhone: '+91 98401 22391',
          customerClaim: 'நான் ₹12,499 payment பண்ணிட்டேன், ஆனால் website இன்னும் payment pending என்று காட்டுது.',
          severity: 'HIGH',
          status: 'ROOT_CAUSE_FOUND',
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          truthMatrix,
          timeline,
          graphNodes,
          aiAnalysis: {
            confidence: 98,
            category: 'WEBHOOK_PROCESSING_FAILURE',
            summary: 'Payment captured at gateway & debited at bank, but merchant webhook returned HTTP 500, leaving order UNPAID.',
            detailedExplanation: 'Cross-system correlation confirms that the funds (₹12,499) were authorized by HDFC Bank and fully captured by the payment gateway. The gateway sent a payment.captured webhook, but the merchant server responded with HTTP 500 (DB connection timeout), preventing the order status update in the merchant database.',
            evidence: [
              'Bank authorization successful with UTR reference',
              'Gateway payment state: CAPTURED with valid signature',
              'Webhook event payment.captured dispatched by gateway',
              'Merchant webhook handler returned HTTP 500 error',
              'Merchant database order state is currently UNPAID',
            ],
            customerRisk: 'LOW — Customer has already paid. Customer should NOT attempt repayment.',
            recommendedAction: 'Execute deterministic state repair to mark order ORD_' + orderId.replace('ORD_', '') + ' as PAID and issue confirmation receipt.',
            voiceScript: {
              tamil: 'உங்கள் ₹12,499 payment successfully captured ஆகியுள்ளது. ஆனால் merchant webhook processing failure காரணமாக order status update ஆகவில்லை. நீங்கள் மீண்டும் payment செய்ய வேண்டாம். நான் தற்போது order status-ஐ repair செய்கிறேன்.',
              tanglish: 'Unga ₹12,499 payment successfully captured aayirukku. Aana merchant webhook error naala order update aagala. Neenga marubadiyum pay panna venaam. Naan safe state repair panren.',
              english: 'Your payment of ₹12,499 has been successfully captured by the bank and gateway. However, a merchant webhook failure prevented the order from updating. Please do not pay again. Safe state repair is ready.',
              hindi: 'आपका ₹12,499 का भुगतान बैंक और गेटवे द्वारा सफलतापूर्वक कैप्चर कर लिया गया है। मर्चेंट वेबहुक विफलता के कारण ऑर्डर अपडेट नहीं हुआ। कृपया दोबारा भुगतान न करें।',
            },
          },
          isRepaired: false,
          auditTrail: [
            {
              id: `aud-${Date.now()}-1`,
              timestamp: now.toISOString(),
              incidentId,
              actor: 'AI_AGENT',
              actorName: 'Payment Truth Correlation Engine',
              action: 'INCIDENT_CREATED',
              details: 'Detected state disparity between Gateway (CAPTURED) and Merchant DB (UNPAID)',
              cryptographicSignature: `SIG_SHA256_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
            },
          ],
        };
        break;
      }

      case 'SCENARIO_2_DUPLICATE_PAYMENT': {
        const orderId = `ORD_${Math.floor(10000 + Math.random() * 90000)}`;
        const paymentId1 = `PAY_${Math.floor(10000 + Math.random() * 90000)}`;
        const paymentId2 = `PAY_${Math.floor(10000 + Math.random() * 90000)}`;
        const amount = 4999;

        const truthMatrix: SystemTruthMatrix = {
          bank: {
            status: 'DEBITED',
            reference: `ICICI-DOUBLE-DEBIT-${Math.floor(100000 + Math.random() * 900000)}`,
            amount: amount * 2,
            timestamp: new Date(now.getTime() - 50000).toISOString(),
            description: 'Two separate debits of ₹4,999 recorded within 42 seconds for the same customer',
          },
          gateway: {
            status: 'CAPTURED',
            paymentId: `${paymentId1} & ${paymentId2}`,
            amount: amount * 2,
            timestamp: new Date(now.getTime() - 40000).toISOString(),
            method: 'CARD / UPI',
            signatureValid: true,
            rawPayload: { duplicate_count: 2, payments: [paymentId1, paymentId2] },
          },
          webhook: {
            status: 'SUCCESS',
            event: 'payment.captured',
            httpStatusCode: 200,
            attempts: 1,
            deliveryTime: new Date(now.getTime() - 35000).toISOString(),
          },
          merchantBackend: {
            status: 'SUCCESS',
            processingState: 'FIRST_PAYMENT_PROCESSED_SECOND_ORPHANED',
            lastReceivedAt: new Date(now.getTime() - 35000).toISOString(),
          },
          merchantDb: {
            orderId,
            orderStatus: 'PAID',
            amount,
            customerId: 'CUST_8820',
            updatedAt: new Date(now.getTime() - 35000).toISOString(),
          },
          finalTruth: {
            isPaymentSuccessful: true,
            verdict: 'DUPLICATE_PAYMENT_DETECTED',
            desynchronizationPoint: 'GATEWAY_DROP',
            customerAdvice: 'Customer was debited twice (2x ₹4,999) for a single order. Auto-initiate refund workflow for the second payment.',
          },
        };

        const timeline: TimelineEvent[] = [
          {
            id: 'evt-1',
            timestamp: new Date(now.getTime() - 90000).toISOString(),
            relativeTime: '11:15:00 AM',
            source: 'MERCHANT_DB',
            eventType: 'order.created',
            title: 'Order Created',
            description: `Order ${orderId} for ₹${amount}`,
            status: 'SUCCESS',
          },
          {
            id: 'evt-2',
            timestamp: new Date(now.getTime() - 80000).toISOString(),
            relativeTime: '11:15:10 AM',
            source: 'GATEWAY',
            eventType: 'payment.captured',
            title: `Payment 1 Captured (${paymentId1})`,
            description: 'First attempt captured successfully',
            status: 'SUCCESS',
          },
          {
            id: 'evt-3',
            timestamp: new Date(now.getTime() - 38000).toISOString(),
            relativeTime: '11:15:52 AM',
            source: 'GATEWAY',
            eventType: 'payment.captured',
            title: `Payment 2 Captured (${paymentId2})`,
            description: 'Second payment captured for identical orderId due to customer retrying',
            status: 'WARNING',
            isFailurePoint: true,
          },
          {
            id: 'evt-4',
            timestamp: new Date(now.getTime() - 35000).toISOString(),
            relativeTime: '11:15:55 AM',
            source: 'MERCHANT_DB',
            eventType: 'order.updated',
            title: 'Order Marked PAID',
            description: `Order credited against ${paymentId1}. Payment ${paymentId2} orphaned.`,
            status: 'SUCCESS',
          },
        ];

        const graphNodes: SystemGraphNode[] = [
          { id: 'node-cust', label: 'Customer', type: 'customer', status: 'warning', subtext: 'Debited 2x ₹4,999' },
          { id: 'node-bank', label: 'Bank', type: 'bank', status: 'healthy', subtext: '2 Debits Confirmed' },
          { id: 'node-gw', label: 'Gateway', type: 'gateway', status: 'warning', subtext: '2x Captures' },
          { id: 'node-wh', label: 'Webhook', type: 'webhook', status: 'healthy', subtext: 'Delivered' },
          { id: 'node-mb', label: 'Merchant Backend', type: 'merchant_backend', status: 'warning', subtext: 'Orphan Transaction', isFailureOrigin: true },
          { id: 'node-db', label: 'Database', type: 'database', status: 'healthy', subtext: 'Order: PAID (1x)' },
        ];

        incident = {
          id: incidentId,
          orderId,
          paymentId: `${paymentId1}, ${paymentId2}`,
          amount,
          currency: 'INR',
          customerName: 'Karthik Subramanian',
          customerPhone: '+91 97910 44812',
          customerClaim: 'I clicked pay twice by mistake and my bank debited ₹4,999 twice! Please refund one.',
          severity: 'HIGH',
          status: 'ROOT_CAUSE_FOUND',
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          truthMatrix,
          timeline,
          graphNodes,
          aiAnalysis: {
            confidence: 99,
            category: 'DUPLICATE_PAYMENT',
            summary: `Two successful payment captures (${paymentId1} & ${paymentId2}) found for single order ${orderId}.`,
            detailedExplanation: `The customer initiated a second checkout session within 42 seconds of the first. Both transactions succeeded at the gateway and bank. The merchant order was fulfilled by the first payment, leaving ${paymentId2} unallocated.`,
            evidence: [
              `First transaction ${paymentId1} captured at gateway`,
              `Second transaction ${paymentId2} captured at gateway for identical order`,
              'Bank debited two charges of ₹4,999',
              'Merchant order status is already PAID with first payment',
            ],
            customerRisk: 'MEDIUM — Customer paid double. Immediate refund initiation required for second transaction.',
            recommendedAction: `Initiate structured refund authorization for duplicate payment ${paymentId2} (₹${amount}). Do not alter primary order state.`,
            voiceScript: {
              tamil: `உங்கள் ஆர்டருக்கு இரண்டு முறை ₹${amount} டெபிட் ஆகியுள்ளது (${paymentId1} மற்றும் ${paymentId2}). முதல் payment மூலம் ஆர்டர் உறுதியானது. இரண்டாவது payment-க்கான ரீஃபண்ட் workflow-ஐ துவங்குகிறேன்.`,
              tanglish: `Unga order-ku rendu thadava ₹${amount} debit aayiduchu. First payment la order confirmed. Second payment ${paymentId2} ku refund workflow ready panren.`,
              english: `We detected a duplicate charge of ₹${amount} for your order. Your order is confirmed under ${paymentId1}. A refund workflow for the second payment ${paymentId2} is prepared for authorization.`,
              hindi: `आपके ऑर्डर के लिए दो बार ₹${amount} कट गया है। पहला भुगतान मान्य है और दूसरा रिफंड के लिए तैयार है।`,
            },
          },
          isRepaired: false,
          auditTrail: [
            {
              id: `aud-${Date.now()}-2`,
              timestamp: now.toISOString(),
              incidentId,
              actor: 'AI_AGENT',
              actorName: 'Duplicate Payment Detector',
              action: 'DUPLICATE_FOUND',
              details: `Correlated ${paymentId1} and ${paymentId2} with order ${orderId}`,
              cryptographicSignature: `SIG_SHA256_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
            },
          ],
        };
        break;
      }

      case 'SCENARIO_3_PAYMENT_FAILED_ORDER_PAID': {
        const orderId = `ORD_${Math.floor(10000 + Math.random() * 90000)}`;
        const paymentId = `PAY_${Math.floor(10000 + Math.random() * 90000)}`;
        const amount = 35000;

        const truthMatrix: SystemTruthMatrix = {
          bank: {
            status: 'FAILED',
            reference: 'INSUFFICIENT_FUNDS_DECLINED',
            amount,
            timestamp: new Date(now.getTime() - 40000).toISOString(),
            description: 'Card issuer declined transaction: Insufficient funds / Risk block',
          },
          gateway: {
            status: 'FAILED',
            paymentId,
            amount,
            timestamp: new Date(now.getTime() - 38000).toISOString(),
            method: 'CREDIT_CARD',
            signatureValid: true,
            rawPayload: { status: 'failed', error_code: 'BAD_REQUEST_PAYMENT_DECLINED' },
          },
          webhook: {
            status: 'FAILED',
            event: 'payment.failed',
            httpStatusCode: 200,
            attempts: 1,
            deliveryTime: new Date(now.getTime() - 35000).toISOString(),
          },
          merchantBackend: {
            status: 'SUCCESS',
            processingState: 'INCORRECT_PARSING_OF_FAILURE_PAYLOAD',
            lastReceivedAt: new Date(now.getTime() - 35000).toISOString(),
            errorMessage: 'Merchant parser mistook payment.failed as order fulfillment trigger',
          },
          merchantDb: {
            orderId,
            orderStatus: 'PAID',
            amount,
            customerId: 'CUST_9912',
            updatedAt: new Date(now.getTime() - 30000).toISOString(),
          },
          finalTruth: {
            isPaymentSuccessful: false,
            verdict: 'PHANTOM_CREDIT_ANOMALY',
            desynchronizationPoint: 'MERCHANT_BACKEND',
            customerAdvice: 'CRITICAL FINTECH RISK: Order marked PAID without money capture. Escalate to fraud/finance team immediately.',
          },
        };

        const timeline: TimelineEvent[] = [
          {
            id: 'evt-1',
            timestamp: new Date(now.getTime() - 50000).toISOString(),
            relativeTime: '2:10:01 PM',
            source: 'MERCHANT_DB',
            eventType: 'order.created',
            title: 'Order Created',
            description: `High value order ${orderId} for ₹${amount}`,
            status: 'INFO',
          },
          {
            id: 'evt-2',
            timestamp: new Date(now.getTime() - 40000).toISOString(),
            relativeTime: '2:10:15 PM',
            source: 'BANK',
            eventType: 'bank.decline',
            title: 'Bank Declined Transaction',
            description: 'Card issuer rejected transaction (Insufficient Balance)',
            status: 'FAILED',
          },
          {
            id: 'evt-3',
            timestamp: new Date(now.getTime() - 38000).toISOString(),
            relativeTime: '2:10:16 PM',
            source: 'GATEWAY',
            eventType: 'payment.failed',
            title: 'Gateway Payment Failed',
            description: 'Gateway marked payment as FAILED',
            status: 'FAILED',
          },
          {
            id: 'evt-4',
            timestamp: new Date(now.getTime() - 30000).toISOString(),
            relativeTime: '2:10:20 PM',
            source: 'MERCHANT_DB',
            eventType: 'order.desync',
            title: 'Order Incorrectly Marked PAID',
            description: 'Merchant backend wrongly interpreted failure webhook and marked order PAID (Phantom Credit)',
            status: 'FAILED',
            isFailurePoint: true,
          },
        ];

        const graphNodes: SystemGraphNode[] = [
          { id: 'node-cust', label: 'Customer', type: 'customer', status: 'healthy', subtext: 'Declined' },
          { id: 'node-bank', label: 'Bank', type: 'bank', status: 'failed', subtext: 'Declined ❌' },
          { id: 'node-gw', label: 'Gateway', type: 'gateway', status: 'failed', subtext: 'Failed ❌' },
          { id: 'node-wh', label: 'Webhook', type: 'webhook', status: 'healthy', subtext: 'Delivered (payment.failed)' },
          { id: 'node-mb', label: 'Merchant Backend', type: 'merchant_backend', status: 'failed', subtext: 'Logic Bug (Phantom Credit)', isFailureOrigin: true },
          { id: 'node-db', label: 'Database', type: 'database', status: 'failed', subtext: 'Order: PAID ❌ (Incorrect)' },
        ];

        incident = {
          id: incidentId,
          orderId,
          paymentId,
          amount,
          currency: 'INR',
          customerName: 'Vikram Mehta',
          customerPhone: '+91 99882 11094',
          customerClaim: 'My card was declined, but the merchant sent me an order confirmation invoice!',
          severity: 'CRITICAL',
          status: 'ROOT_CAUSE_FOUND',
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          truthMatrix,
          timeline,
          graphNodes,
          aiAnalysis: {
            confidence: 99,
            category: 'PHANTOM_CREDIT_DESYNC',
            summary: 'CRITICAL: Gateway & Bank recorded FAILED payment, but Merchant DB marked order as PAID.',
            detailedExplanation: 'This is a severe phantom credit anomaly. The bank declined the customer card, and the gateway sent payment.failed. The merchant backend parser had a regression that flipped the status to PAID. Zero funds were captured.',
            evidence: [
              'Bank transaction status: DECLINED',
              'Gateway payment status: FAILED',
              'Webhook event sent: payment.failed',
              'Merchant database order state: PAID (Contradicts all payment sources)',
            ],
            customerRisk: 'HIGH RISK OF FINANCIAL LOSS FOR MERCHANT — Do not ship goods.',
            recommendedAction: 'ESCALATE to security & ops team. DO NOT automatically mark as paid. Revert order status to UNPAID/CANCELLED and halt fulfillment.',
            voiceScript: {
              tamil: 'எச்சரிக்கை: இந்த பரிவர்த்தனை வங்கியில் தோல்வியடைந்தது. ஆனால் வணிகர் தளத்தில் ஆர்டர் கட்டணமானது தவறுதலாக "Paid" என காட்டுகிறது. பண இழப்பைத் தவிர்க்க ஆர்டரை நிறுத்தவும்.',
              tanglish: 'Warning: Payment gateway la fail aayiduchu, aana merchant system la order PAID nu wrong-ah mark aagிருக்கு. Fulfillment-ai stop pannanum.',
              english: 'Critical alert: Payment failed at the bank and gateway, but the merchant order was erroneously marked PAID. Automated repair is blocked; immediate escalation is required.',
              hindi: 'चेतावनी: बैंक और गेटवे पर भुगतान विफल हो गया है, लेकिन मर्चेंट सिस्टम पर ऑर्डर पेड दिख रहा है। शिपमेंट तुरंत रोकें।',
            },
          },
          isRepaired: false,
          auditTrail: [
            {
              id: `aud-${Date.now()}-3`,
              timestamp: now.toISOString(),
              incidentId,
              actor: 'AI_AGENT',
              actorName: 'Phantom Credit Security Monitor',
              action: 'CRITICAL_DESYNC_FLAGGED',
              details: 'Discrepancy: Zero money received, order marked PAID',
              cryptographicSignature: `SIG_SHA256_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
            },
          ],
        };
        break;
      }

      case 'SCENARIO_4_REFUND_MISMATCH': {
        const orderId = `ORD_${Math.floor(10000 + Math.random() * 90000)}`;
        const paymentId = `PAY_${Math.floor(10000 + Math.random() * 90000)}`;
        const amount = 8500;

        const truthMatrix: SystemTruthMatrix = {
          bank: {
            status: 'CREDITED',
            reference: 'REFUND-CREDIT-AXIS-9921',
            amount,
            timestamp: new Date(now.getTime() - 20000).toISOString(),
            description: 'Refund credited back to customer source account',
          },
          gateway: {
            status: 'REFUNDED',
            paymentId,
            amount,
            timestamp: new Date(now.getTime() - 25000).toISOString(),
            method: 'NETBANKING',
            signatureValid: true,
            rawPayload: { refund_id: `rfnd_${paymentId}`, status: 'processed' },
          },
          webhook: {
            status: 'FAILED',
            event: 'refund.processed',
            httpStatusCode: 404,
            attempts: 2,
            deliveryTime: new Date(now.getTime() - 24000).toISOString(),
            lastError: 'HTTP 404: Webhook route /api/v1/webhooks/refunds not found on merchant server',
          },
          merchantBackend: {
            status: 'FAILED',
            processingState: 'ROUTE_NOT_CONFIGURED',
            lastReceivedAt: new Date(now.getTime() - 24000).toISOString(),
          },
          merchantDb: {
            orderId,
            orderStatus: 'PAID',
            amount,
            customerId: 'CUST_4421',
            updatedAt: new Date(now.getTime() - 60000).toISOString(),
          },
          finalTruth: {
            isPaymentSuccessful: false,
            verdict: 'REFUND_PROCESSED_MERCHANT_STALE',
            desynchronizationPoint: 'WEBHOOK_DELIVERY',
            customerAdvice: 'Refund was fully processed and credited to customer, but merchant dashboard still shows order as active PAID.',
          },
        };

        const timeline: TimelineEvent[] = [
          {
            id: 'evt-1',
            timestamp: new Date(now.getTime() - 60000).toISOString(),
            relativeTime: '4:00:00 PM',
            source: 'GATEWAY',
            eventType: 'refund.processed',
            title: 'Gateway Processed Refund',
            description: `Gateway released ₹${amount} refund back to customer`,
            status: 'SUCCESS',
          },
          {
            id: 'evt-2',
            timestamp: new Date(now.getTime() - 50000).toISOString(),
            relativeTime: '4:00:02 PM',
            source: 'BANK',
            eventType: 'bank.refund_credit',
            title: 'Bank Credited Customer',
            description: 'Customer account received refund funds',
            status: 'SUCCESS',
          },
          {
            id: 'evt-3',
            timestamp: new Date(now.getTime() - 40000).toISOString(),
            relativeTime: '4:00:05 PM',
            source: 'WEBHOOK',
            eventType: 'webhook.refund_drop',
            title: 'Refund Webhook 404',
            description: 'Merchant server returned HTTP 404 for refund webhook',
            status: 'FAILED',
            isFailurePoint: true,
          },
          {
            id: 'evt-4',
            timestamp: new Date(now.getTime() - 10000).toISOString(),
            relativeTime: '4:01:00 PM',
            source: 'MERCHANT_DB',
            eventType: 'state.stale',
            title: 'Merchant Order Still PAID',
            description: 'Merchant dashboard does not reflect refund status',
            status: 'WARNING',
          },
        ];

        const graphNodes: SystemGraphNode[] = [
          { id: 'node-cust', label: 'Customer', type: 'customer', status: 'healthy', subtext: 'Refund Received' },
          { id: 'node-bank', label: 'Bank', type: 'bank', status: 'healthy', subtext: 'Credited (Refund)' },
          { id: 'node-gw', label: 'Gateway', type: 'gateway', status: 'healthy', subtext: 'Refund Processed' },
          { id: 'node-wh', label: 'Webhook', type: 'webhook', status: 'failed', subtext: 'HTTP 404', isFailureOrigin: true },
          { id: 'node-mb', label: 'Merchant Backend', type: 'merchant_backend', status: 'failed', subtext: 'Route Missing' },
          { id: 'node-db', label: 'Database', type: 'database', status: 'warning', subtext: 'Status: PAID (Stale)' },
        ];

        incident = {
          id: incidentId,
          orderId,
          paymentId,
          amount,
          currency: 'INR',
          customerName: 'Pooja Sundaram',
          customerPhone: '+91 94441 88201',
          customerClaim: 'I received the refund in my bank, but your website still says order is confirmed and shipping soon.',
          severity: 'MEDIUM',
          status: 'ROOT_CAUSE_FOUND',
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          truthMatrix,
          timeline,
          graphNodes,
          aiAnalysis: {
            confidence: 97,
            category: 'REFUND_RECORD_MISMATCH',
            summary: 'Refund processed at Gateway & Bank, but missing in Merchant DB due to HTTP 404 on refund webhook.',
            detailedExplanation: 'The refund of ₹8,500 was fully completed and credited to the customer. However, the merchant backend lacked an active webhook handler for refund.processed, leaving the internal order marked as PAID.',
            evidence: [
              'Gateway refund record rfnd_' + paymentId + ' marked processed',
              'Bank confirms credit to customer account',
              'Webhook delivery failed with HTTP 404',
              'Merchant database still displays status as PAID',
            ],
            customerRisk: 'LOW — Customer already received funds. Merchant inventory state requires sync.',
            recommendedAction: 'Synchronize merchant order state from PAID to REFUNDED to prevent accidental item shipment.',
            voiceScript: {
              tamil: 'ரீஃபண்ட் தொகை உங்கள் வங்கிக் கணக்கில் வெற்றிகரமாக வரவு வைக்கப்பட்டுள்ளது. வணிகர் இணையதளத்தில் உள்ள ஆர்டர் நிலையை இப்போது "Refunded" என நான் சரிசெய்கிறேன்.',
              tanglish: 'Refund amount unga bank account-la credit aayiduchu. Merchant site la status-ai "Refunded" nu sync panren.',
              english: 'The refund of ₹8,500 was successfully credited to your bank account. We are now synchronizing the merchant order state to REFUNDED.',
              hindi: 'रिफंड आपके बैंक खाते में सफलतापूर्वक जमा हो गया है। मर्चेंट ऑर्डर की स्थिति को "रिफंडेड" के रूप में अपडेट किया जा रहा है।',
            },
          },
          isRepaired: false,
          auditTrail: [
            {
              id: `aud-${Date.now()}-4`,
              timestamp: now.toISOString(),
              incidentId,
              actor: 'AI_AGENT',
              actorName: 'Refund Reconciliation Engine',
              action: 'REFUND_DESYNC_DETECTED',
              details: `Gateway refund confirmed, Merchant order ${orderId} remains in PAID state`,
              cryptographicSignature: `SIG_SHA256_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
            },
          ],
        };
        break;
      }

      case 'SCENARIO_5_DELAYED_WEBHOOK':
      default: {
        const orderId = `ORD_${Math.floor(10000 + Math.random() * 90000)}`;
        const paymentId = `PAY_${Math.floor(10000 + Math.random() * 90000)}`;
        const amount = 2200;

        const truthMatrix: SystemTruthMatrix = {
          bank: {
            status: 'DEBITED',
            reference: 'SBI-UPI-9921',
            amount,
            timestamp: new Date(now.getTime() - 15000).toISOString(),
            description: 'Debited via SBI UPI',
          },
          gateway: {
            status: 'CAPTURED',
            paymentId,
            amount,
            timestamp: new Date(now.getTime() - 10000).toISOString(),
            method: 'UPI',
            signatureValid: true,
          },
          webhook: {
            status: 'DELAYED',
            event: 'payment.captured',
            httpStatusCode: 0,
            attempts: 0,
            deliveryTime: 'IN_TRANSIT',
            lastError: 'Queued in Gateway retry queue (temporary transit lag of 240s)',
          },
          merchantBackend: {
            status: 'PENDING',
            processingState: 'AWAITING_WEBHOOK',
          },
          merchantDb: {
            orderId,
            orderStatus: 'UNPAID',
            amount,
            customerId: 'CUST_1102',
            updatedAt: new Date(now.getTime() - 30000).toISOString(),
          },
          finalTruth: {
            isPaymentSuccessful: true,
            verdict: 'TRANSIENT_WEBHOOK_QUEUE_DELAY',
            desynchronizationPoint: 'WEBHOOK_DELIVERY',
            customerAdvice: 'Payment is captured. Webhook is queued in gateway dispatch pipeline. Recommend monitoring for 3 minutes before forced repair.',
          },
        };

        const timeline: TimelineEvent[] = [
          {
            id: 'evt-1',
            timestamp: new Date(now.getTime() - 30000).toISOString(),
            relativeTime: '6:30:00 PM',
            source: 'MERCHANT_DB',
            eventType: 'order.created',
            title: 'Order Created',
            description: `Order ${orderId} initialized`,
            status: 'INFO',
          },
          {
            id: 'evt-2',
            timestamp: new Date(now.getTime() - 15000).toISOString(),
            relativeTime: '6:30:15 PM',
            source: 'BANK',
            eventType: 'bank.debit',
            title: 'Bank Debited',
            description: 'Bank captured ₹2,200',
            status: 'SUCCESS',
          },
          {
            id: 'evt-3',
            timestamp: new Date(now.getTime() - 10000).toISOString(),
            relativeTime: '6:30:20 PM',
            source: 'GATEWAY',
            eventType: 'payment.captured',
            title: 'Payment Captured',
            description: 'Payment successful',
            status: 'SUCCESS',
          },
          {
            id: 'evt-4',
            timestamp: new Date(now.getTime() - 5000).toISOString(),
            relativeTime: '6:30:25 PM',
            source: 'WEBHOOK',
            eventType: 'webhook.queued',
            title: 'Webhook Queued (In-Transit)',
            description: 'Webhook delivery queued with expected delay of ~180s',
            status: 'PENDING',
            isFailurePoint: false,
          },
        ];

        const graphNodes: SystemGraphNode[] = [
          { id: 'node-cust', label: 'Customer', type: 'customer', status: 'healthy', subtext: 'Paid' },
          { id: 'node-bank', label: 'Bank', type: 'bank', status: 'healthy', subtext: 'Debited' },
          { id: 'node-gw', label: 'Gateway', type: 'gateway', status: 'healthy', subtext: 'Captured' },
          { id: 'node-wh', label: 'Webhook', type: 'webhook', status: 'delayed', subtext: 'Queued (Delayed)' },
          { id: 'node-mb', label: 'Merchant Backend', type: 'merchant_backend', status: 'warning', subtext: 'Awaiting' },
          { id: 'node-db', label: 'Database', type: 'database', status: 'warning', subtext: 'Order: UNPAID' },
        ];

        incident = {
          id: incidentId,
          orderId,
          paymentId,
          amount,
          currency: 'INR',
          customerName: 'Deepak Sharma',
          customerPhone: '+91 98110 33499',
          customerClaim: 'I just completed payment 20 seconds ago, but order status is still showing pending.',
          severity: 'LOW',
          status: 'INVESTIGATING',
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          truthMatrix,
          timeline,
          graphNodes,
          aiAnalysis: {
            confidence: 94,
            category: 'TRANSIENT_WEBHOOK_DELAY',
            summary: 'Payment captured; webhook is in active dispatch queue (temporary transient lag).',
            detailedExplanation: 'The transaction is fully secured at the bank and payment gateway. The gateway webhook dispatcher has a temporary queue depth delay (~180s). Automatic delivery is expected shortly without intervention.',
            evidence: [
              'Bank debit confirmed',
              'Gateway payment captured',
              'Webhook event in transit queue',
              'No error status codes recorded',
            ],
            customerRisk: 'NONE — Payment is safe and will self-resolve in ~2 minutes.',
            recommendedAction: 'WAIT AND MONITOR. Do not force immediate repair yet to avoid race conditions with incoming webhook.',
            voiceScript: {
              tamil: 'உங்கள் கட்டணம் வெற்றிகரமாக பெறப்பட்டுள்ளது. Gateway-இன் தகவல் அனுப்பும் வரிசையில் சிறிய தாமதம் உள்ளது. இரண்டு நிமிடங்களில் உங்கள் ஆர்டர் தானாகவே அப்டேட் ஆகிவிடும்.',
              tanglish: 'Unga payment successful-ah aayirukku. Webhook queue la konjam delay irukku. 2 mins la order automatic-ah update aagidum.',
              english: 'Your payment was successfully received. A brief webhook dispatch delay is in progress. The order will self-resolve in approximately 2 minutes.',
              hindi: 'आपका भुगतान प्राप्त हो गया है। वेबहुक डिलीवरी में थोड़ा समय लग रहा है। 2 मिनट में आपका ऑर्डर स्वतः अपडेट हो जाएगा।',
            },
          },
          isRepaired: false,
          auditTrail: [
            {
              id: `aud-${Date.now()}-5`,
              timestamp: now.toISOString(),
              incidentId,
              actor: 'AI_AGENT',
              actorName: 'Transit Lag Monitor',
              action: 'IN_TRANSIT_DELAY_TRACKED',
              details: 'Webhook delivery delayed, monitoring in flight',
              cryptographicSignature: `SIG_SHA256_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
            },
          ],
        };
        break;
      }
    }

    this.incidents.set(incident.id, incident);
    return incident;
  }

  private seedInitialIncidents(): void {
    // Pre-populate with realistic starting scenarios
    this.generateScenarioIncident('SCENARIO_1_WEBHOOK_FAILURE');
    this.generateScenarioIncident('SCENARIO_2_DUPLICATE_PAYMENT');
    this.generateScenarioIncident('SCENARIO_3_PAYMENT_FAILED_ORDER_PAID');
    this.generateScenarioIncident('SCENARIO_4_REFUND_MISMATCH');
  }
}

export const mockDataStore = new MockDataStore();
