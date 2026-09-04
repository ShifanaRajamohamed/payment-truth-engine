import { Payment } from '@deepaudit/shared-types';

export interface PaymentExecutionResult {
  success: boolean;
  gatewayReference: string;
  gatewayName: string;
  status: 'SUCCESS' | 'FAILED' | 'PROCESSING';
  message: string;
  rawResponse?: any;
}

export interface PaymentProvider {
  name: string;
  processPayment(payment: Payment): Promise<PaymentExecutionResult>;
  verifyPayment(gatewayReference: string): Promise<PaymentExecutionResult>;
}
