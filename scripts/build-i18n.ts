import * as fs from 'fs';
import * as path from 'path';

// Merge ar1 and ar2
const ar1 = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'scripts', 'ar1.json'), 'utf-8'));
const ar2 = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'scripts', 'ar2.json'), 'utf-8'));
const combined = { ...ar1, ...ar2 };

const injectionMap: Record<string, { key: string, en: string, ar: string }> = {};

let counter = 1;
const enEntries: string[] = [];
const arEntries: string[] = [];

for (const [enStr, arStr] of Object.entries(combined)) {
  const safeKey = `auto_${String(counter).padStart(3, '0')}`;
  injectionMap[enStr] = { key: safeKey, en: enStr, ar: arStr as string };
  
  // prepare for file update
  enEntries.push(`  '${safeKey}': ${JSON.stringify(enStr)},`);
  arEntries.push(`  '${safeKey}': ${JSON.stringify(arStr)},`);
  
  counter++;
}

fs.writeFileSync(path.join(process.cwd(), 'scripts', 'injection-map.json'), JSON.stringify(injectionMap, null, 2));
console.log(`Generated injection-map.json with ${counter - 1} keys`);

// Now update i18n.ts
const i18nPath = path.join(process.cwd(), 'src', 'lib', 'i18n.ts');
let i18nCode = fs.readFileSync(i18nPath, 'utf-8');

// Insert EN entries before '};' of const en = { ... }
const enEndMarker = i18nCode.indexOf('};', i18nCode.indexOf('const en = {'));
if (enEndMarker !== -1) {
  i18nCode = i18nCode.slice(0, enEndMarker) + '\n  // Auto-generated\n' + enEntries.join('\n') + '\n' + i18nCode.slice(enEndMarker);
}

// Find const ar start
let arStartMarker = i18nCode.indexOf('const ar: typeof en = {');
if (arStartMarker === -1) {
  arStartMarker = i18nCode.indexOf('const ar = {');
}

// Insert AR entries before '};' of const ar = { ... }
if (arStartMarker !== -1) {
  const arEndMarker = i18nCode.indexOf('};', arStartMarker);
  if (arEndMarker !== -1) {
    i18nCode = i18nCode.slice(0, arEndMarker) + '\n  // Auto-generated\n' + arEntries.join('\n') + '\n' + i18nCode.slice(arEndMarker);
  }
}

fs.writeFileSync(i18nPath, i18nCode);
console.log('Updated src/lib/i18n.ts with full dictionary.');
