import { Project, SyntaxKind, QuoteKind, Node } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
  manipulationSettings: { quoteKind: QuoteKind.Single }
});

const files = [
  'src/app/dashboard/exams/[examId]/page.tsx',
  'src/app/dashboard/homework/page.tsx',
  'src/app/dashboard/parent/children/[studentId]/attendance/page.tsx',
  'src/app/dashboard/parent/children/[studentId]/homework/page.tsx',
  'src/components/dashboard/ParentDashboard.tsx'
];

project.addSourceFilesAtPaths(files);

for (const filepath of files) {
  const sourceFile = project.getSourceFile(filepath);
  if (!sourceFile) continue;

  // Ensure import
  const imports = sourceFile.getImportDeclarations();
  const hasLangImport = imports.some(i => i.getModuleSpecifierValue() === '@/lib/LangProvider');
  if (!hasLangImport) {
    sourceFile.addImportDeclaration({
      namedImports: ['useLang'],
      moduleSpecifier: '@/lib/LangProvider'
    });
  }

  // Find default export function or just the main function component
  let compFunc = sourceFile.getDefaultExportSymbol()?.getDeclarations()[0];
  if (compFunc && Node.isFunctionDeclaration(compFunc)) {
     const body = compFunc.getBody();
     if (Node.isBlock(body)) {
       const hasHook = body.getStatements().some(s => s.getText().includes('useLang()'));
       if (!hasHook) {
         body.insertStatements(0, 'const { t } = useLang();');
       }
     }
  } else {
     // Not a default export function, look for top-level component
     const fns = sourceFile.getFunctions();
     for (const fn of fns) {
       const body = fn.getBody();
       if (Node.isBlock(body) && body.getText().includes('return (')) {
         const hasHook = body.getStatements().some(s => s.getText().includes('useLang()'));
         if (!hasHook) {
           body.insertStatements(0, 'const { t } = useLang();');
         }
       }
     }
  }
}

project.saveSync();
console.log('Fixed using ts-morph.');
