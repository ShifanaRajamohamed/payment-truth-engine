export const riskToolDefinition = {
  name: 'getRiskAssessment',
  description: 'Retrieve deterministic fraud risk assessment, score (0-100), and breakdown of triggered signals for a payment.',
  parameters: {
    type: 'OBJECT',
    properties: {
      paymentId: { type: 'STRING', description: 'Unique payment ID to inspect risk signals for' }
    },
    required: ['paymentId']
  }
};
