export const historyToolDefinition = {
  name: 'getBeneficiaryHistory',
  description: 'Retrieve aggregate payment volume, frequency, and historical compliance stats for a beneficiary.',
  parameters: {
    type: 'OBJECT',
    properties: {
      beneficiaryId: { type: 'STRING', description: 'Beneficiary ID to inspect' }
    },
    required: ['beneficiaryId']
  }
};
