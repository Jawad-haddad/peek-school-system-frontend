import * as fs from 'fs';
import * as path from 'path';

const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'scripts', 'untranslated.json'), 'utf-8'));

const cleaned: Record<string, string> = {};

for (const key of Object.keys(raw)) {
  const t = key.trim();
  
  // Skip purely numeric/punctuation
  if (/^[\d\s\p{P}\p{S}]+$/u.test(t)) {
    continue;
  }
  
  // Skip emails
  if (t.includes('@') && t.includes('.com')) {
    continue;
  }
  
  // Skip purely emojis
  if (/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\s]+$/u.test(t)) {
    continue;
  }

  // Exempt technical fields from translation
  if (['Email', 'Password', 'OTP', 'NFC', 'UID', 'UUID', 'API', 'URL', 'Token', 'JWT', 'YYYY-MM-DD', 'HH:MM'].includes(t)) {
    continue;
  }
  
  // Skip constants
  if (['ADMIN', 'TEACHER', 'PARENT', 'SUPER_ADMIN', 'VALIDATION_ERROR', 'NOT_FOUND', 'TENANT_FORBIDDEN', 'FORBIDDEN_ROLE', 'UNAUTHORIZED', 'RATE_LIMITED'].includes(t)) {
     continue;
  }

  cleaned[key] = key;
}

fs.writeFileSync(path.join(process.cwd(), 'scripts', 'cleaned.json'), JSON.stringify(cleaned, null, 2));
console.log(`Cleaned down to ${Object.keys(cleaned).length} keys.`);
