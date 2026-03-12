import * as fs from 'fs';
import * as path from 'path';

const files = [
  'src/app/dashboard/exams/[examId]/page.tsx',
  'src/app/dashboard/homework/page.tsx',
  'src/app/dashboard/parent/children/[studentId]/attendance/page.tsx',
  'src/app/dashboard/parent/children/[studentId]/homework/page.tsx',
  'src/components/dashboard/ParentDashboard.tsx',
  'src/components/LanguageToggle.tsx'
];

for (const rel of files) {
  const p = path.join(process.cwd(), rel);
  if (!fs.existsSync(p)) continue;
  let code = fs.readFileSync(p, 'utf-8');
  
  if (!code.includes('const { t } = useLang();')) {
    // try to find export default function ...
    const match = code.match(/export default function\s+[A-Za-z0-9_]+\s*\([^)]*\)\s*\{/);
    if (match) {
      code = code.replace(match[0], match[0] + '\n  const { t } = useLang();');
    } else {
       // Just insert it inside the first function if we can't find export default
       const fnMatch = code.match(/function\s+[A-Za-z0-9_]+\s*\([^)]*\)\s*\{/);
       if (fnMatch) {
         code = code.replace(fnMatch[0], fnMatch[0] + '\n  const { t } = useLang();');
       }
    }
    
    // Add import if missing
    if (!code.includes('useLang')) {
      code = "import { useLang } from '@/lib/LangProvider';\n" + code;
    }
    fs.writeFileSync(p, code);
  }
}
console.log('Fixed missing t');
