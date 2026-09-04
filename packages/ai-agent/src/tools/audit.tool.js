"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditToolDefinition = void 0;
exports.auditToolDefinition = {
    name: 'getAuditTrail',
    description: 'Retrieve immutable chronological audit events associated with a corporate payment or beneficiary.',
    parameters: {
        type: 'OBJECT',
        properties: {
            targetId: { type: 'STRING', description: 'Entity ID (e.g. payment ID) to fetch audit events for' }
        },
        required: ['targetId']
    }
};
