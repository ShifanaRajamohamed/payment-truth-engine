import fs from 'fs';
import path from 'path';

// Self-contained environment file loader
export function loadEnvFile() {
  const possiblePaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '../../../.env'),
    path.resolve(__dirname, '../../../../.env'),
    path.resolve(__dirname, '../../../../../.env'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const content = fs.readFileSync(p, 'utf-8');
        const lines = content.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const [k, ...v] = trimmed.split('=');
            const key = k.trim();
            const val = v.join('=').trim().replace(/^["']|["']$/g, '');
            if (val) {
              process.env[key] = val;
            }
          }
        }
        break;
      } catch { /* ignore */ }
    }
  }
}

loadEnvFile();

export const envConfig = {
  get port(): number { return parseInt(process.env.PORT || '3000', 10); },
  get nodeEnv(): string { return process.env.NODE_ENV || 'development'; },
  get geminiApiKey(): string { loadEnvFile(); return process.env.GEMINI_API_KEY || ''; },
  get sarvamApiKey(): string { loadEnvFile(); return process.env.SARVAM_API_KEY || ''; },
  get demoPassword(): string { return process.env.DEMO_PASSWORD || ''; },
  get databaseUrl(): string { return process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/deepaudit'; },
  get jwtSecret(): string { return process.env.JWT_SECRET || 'deepaudit_dev_secret_key_change_in_production'; }
};
