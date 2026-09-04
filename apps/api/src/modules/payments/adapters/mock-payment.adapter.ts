import { Payment } from '@deepaudit/shared-types';
import { PaymentProvider, PaymentExecutionResult } from '../payment-provider.interface';

export class MockPaymentAdapter implements PaymentProvider {
  readonly name = 'Mock Banking Simulator';

  async processPayment(payment: Payment): Promise<PaymentExecutionResult> {
    const isSuccess = payment.status !== 'FAILED';
    const gatewayReference = `sim_tx_${Date.now()}`;

    return {
      success: isSuccess,
      gatewayReference,
      gatewayName: this.name,
      status: isSuccess ? 'SUCCESS' : 'FAILED',
      message: isSuccess ? 'Simulated disbursement settled in mock core banking ledger.' : 'Simulated core banking timeout.',
      rawResponse: { simulated: true }
    };
  }

  async verifyPayment(gatewayReference: string): Promise<PaymentExecutionResult> {
    return {
      success: true,
      gatewayReference,
      gatewayName: this.name,
      status: 'SUCCESS',
      message: 'Simulated verification verified.'
    };
  }
}
