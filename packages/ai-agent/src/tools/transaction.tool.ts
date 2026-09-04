export interface TransactionToolParams {
  paymentId?: string;
  minAmount?: number;
  maxAmount?: number;
  status?: string;
}

export const transactionToolDefinition = {
  name: 'getTransactionDetails',
  description: 'Retrieve verified corporate payment transaction details and metadata by payment ID or filters.',
  parameters: {
    type: 'OBJECT',
    properties: {
      paymentId: { type: 'STRING', description: 'Unique payment ID to inspect' },
      status: { type: 'STRING', description: 'Filter by payment status' }
    }
  }
};
