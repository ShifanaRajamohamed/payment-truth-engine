import express, { Express } from 'express';
import cors from 'cors';
import { requestLogger } from './common/middleware/logger.middleware';
import { authGuard } from './common/guards/auth.guard';
import { AuthController } from './modules/auth/auth.controller';
import { PaymentsController } from './modules/payments/payments.controller';
import { RiskController } from './modules/risk/risk.controller';
import { AgentController } from './modules/agent/agent.controller';
import { VoiceController } from './modules/voice/voice.controller';
import { LanguageController } from './modules/language/language.controller';
import { AuthorizationController } from './modules/authorization/authorization.controller';
import { AuditController } from './modules/audit/audit.controller';

export function createApp(): Express {
  const app = express();

  // Global middleware
  app.use(cors({ origin: '*' }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(requestLogger);

  // Health check
  app.get('/health', (req, res) => res.json({ status: 'ok', service: 'DeepAudit AI API', timestamp: new Date().toISOString() }));

  // Controllers
  const authCtrl = new AuthController();
  const paymentsCtrl = new PaymentsController();
  const riskCtrl = new RiskController();
  const agentCtrl = new AgentController();
  const voiceCtrl = new VoiceController();
  const langCtrl = new LanguageController();
  const authzCtrl = new AuthorizationController();
  const auditCtrl = new AuditController();

  const api = express.Router();

  // Auth routes
  api.post('/auth/login', authCtrl.login);
  api.get('/auth/passkey-challenge', authCtrl.getPasskeyChallenge);

  // Language routes
  api.get('/languages', langCtrl.getAll);
  api.get('/languages/:code', langCtrl.getByCode);

  // Protected routes (guarded)
  api.use(authGuard);

  // Payments routes
  api.get('/payments', paymentsCtrl.getAll);
  api.get('/payments/beneficiaries', paymentsCtrl.getBeneficiaries);
  api.get('/payments/:id', paymentsCtrl.getById);
  api.post('/payments', paymentsCtrl.create);

  // Risk routes
  api.post('/risk/assess', riskCtrl.assess);

  // Agent (Gemini) routes
  api.post('/agent/query', agentCtrl.query);
  api.post('/agent/explain-risk', agentCtrl.explainRisk);

  // Voice (Sarvam) routes
  api.post('/voice/stt', voiceCtrl.speechToText);
  api.post('/voice/tts', voiceCtrl.textToSpeech);

  // Authorization routes
  api.post('/authz/step-up', authzCtrl.verifyStepUp);
  api.post('/authz/approve', authzCtrl.approve);
  api.post('/authz/reject', authzCtrl.reject);

  // Audit routes
  api.get('/audit', auditCtrl.getAll);
  api.get('/audit/target/:targetId', auditCtrl.getByTargetId);

  app.use('/api', api);

  return app;
}
