import * as fs from 'fs';
import * as path from 'path';

const files = [
  'src/app/dashboard/parent/children/[studentId]/attendance/page.tsx',
  'src/app/dashboard/parent/children/[studentId]/homework/page.tsx',
  'src/components/dashboard/ParentDashboard.tsx'
];

for (const rel of files) {
  const p = path.join(process.cwd(), rel);
  if (!fs.existsSync(p)) continue;
  let code = fs.readFileSync(p, 'utf-8');
  
  // Find all function declarations
  // regex to match `function Foo(args) {` or `const Foo = (args) => {`
  const lines = code.split('\n');
  let inFunction = false;
  let currentFuncStartLine = -1;
  let hasTInFunc = false;
  let hasUseLang = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.match(/(function\s+[A-Z]\w*\s*\(|const\s+[A-Z]\w*\s*=\s*(async\s*)?\([^)]*\)\s*=>\s*\{)/)) {
        inFunction = true;
        currentFuncStartLine = i;
        hasTInFunc = false;
        hasUseLang = false;
    }
    
    if (inFunction) {
      if (line.includes("t('auto_") || line.includes("t('parent.") || line.includes("t('announcements.")) {
        hasTInFunc = true;
      }
      if (line.includes('const { t } = useLang()')) {
        hasUseLang = true;
      }
      
      // Basic block exit
      if (line.startsWith('}')) {
        if (hasTInFunc && !hasUseLang && currentFuncStartLine !== -1) {
            lines.splice(currentFuncStartLine + 1, 0, '    const { t } = useLang();');
            i++; // adjust since we added a line
        }
        inFunction = false;
      }
    }
  }
  
  fs.writeFileSync(p, lines.join('\n'));
}
console.log('Fixed sub-components.');
