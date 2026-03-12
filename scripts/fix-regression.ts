import * as fs from 'fs';
import * as path from 'path';

// 1. Restore communicationApi in src/lib/api.ts
const apiPath = path.join(process.cwd(), 'src/lib/api.ts');
if (fs.existsSync(apiPath)) {
  let apiCode = fs.readFileSync(apiPath, 'utf8');
  if (!apiCode.includes('communicationApi')) {
    apiCode += `
export const communicationApi = {
  getAnnouncements: (limit = 20) => request(() => api.get('/communication/announcements', { params: { limit } })),
  sendBroadcast: (data: any) => request(() => api.post('/communication/broadcast', data))
};
`;
    fs.writeFileSync(apiPath, apiCode);
  }
}

// 2. Fix the components
const files = [
  'src/app/dashboard/exams/[examId]/page.tsx',
  'src/app/dashboard/homework/page.tsx',
  'src/app/dashboard/parent/children/[studentId]/attendance/page.tsx',
  'src/app/dashboard/parent/children/[studentId]/homework/page.tsx',
  'src/components/dashboard/ParentDashboard.tsx'
];

for (const rel of files) {
  const p = path.join(process.cwd(), rel);
  if (!fs.existsSync(p)) continue;
  let code = fs.readFileSync(p, 'utf-8');
  
  if (!code.includes('const { t } = useLang();')) {
    // Inject at the first useEffect or return inside the main component.
    // We can just find `export default function` and inject inside its body.
    // The previous regex failed probably because of newlines or multiline params.
    const match = code.match(/export default function\s+[^{]+\{/);
    if (match) {
      code = code.replace(match[0], match[0] + '\n  const { t } = useLang();');
    }
    
    // Ensure import is present
    if (!code.includes('useLang')) {
      code = "import { useLang } from '@/lib/LangProvider';\n" + code;
    }
    fs.writeFileSync(p, code);
  } else {
    // maybe imported but no const { t } ?
    // Check if it's there
  }
}
console.log('Fixed regression and components.');
