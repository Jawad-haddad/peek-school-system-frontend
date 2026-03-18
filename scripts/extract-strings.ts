import { Project, SyntaxKind, StringLiteral, JsxText, Node } from 'ts-morph';
import * as fs from 'fs';
import * as path from 'path';

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
});

// Add all source files
project.addSourceFilesAtPaths(['src/app/**/*.tsx', 'src/app/**/*.ts', 'src/components/**/*.tsx', 'src/components/**/*.ts']);

const extractedStrings = new Set<string>();

// Technical terms to ignore
const IGNORED_TERMS = new Set([
  'Email', 'Password', 'OTP', 'NFC', 'UID', 'UUID', 'API', 'URL', 'Token', 'JWT',
  'YYYY-MM-DD', 'HH:MM',
  'ADMIN', 'TEACHER', 'PARENT', 'SUPER_ADMIN',
  'VALIDATION_ERROR', 'NOT_FOUND', 'TENANT_FORBIDDEN', 'FORBIDDEN_ROLE', 'UNAUTHORIZED', 'RATE_LIMITED'
]);

// Helper to clean and validate strings
function processString(str: string) {
  const cleaned = str.replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned) return;
  // Ignore single characters (often punctuation or functional) unless it's a specific symbol we want translated (unlikely)
  if (cleaned.length === 1 && !/[a-zA-Z]/.test(cleaned)) return;
  
  // Ignore purely numbers
  if (/^\d+$/.test(cleaned)) return;
  
  // Ignore if it's strictly an ignored term
  if (IGNORED_TERMS.has(cleaned)) return;

  // Ignore completely technical/code looking strings
  if (/^[A-Z_]+$/.test(cleaned) && !cleaned.includes(' ')) {
     // Might be an error code or constant, let's keep it safe. But wait, if it's not in our ignored list, we should check it manually later.
  }

  extractedStrings.add(cleaned);
}

for (const sourceFile of project.getSourceFiles()) {
  // 1. Extract JsxText
  const jsxTexts = sourceFile.getDescendantsOfKind(SyntaxKind.JsxText);
  for (const text of jsxTexts) {
    processString(text.getText());
  }

  // 2. Extract StringLiterals in JsxAttributes (like placeholder="...")
  const jsxAttributes = sourceFile.getDescendantsOfKind(SyntaxKind.JsxAttribute);
  for (const attr of jsxAttributes) {
    const name = attr.getNameNode().getText();
    // Common user-facing attributes
    if (['placeholder', 'title', 'alt', 'label'].includes(name)) {
      const initializer = attr.getInitializer();
      if (initializer && Node.isStringLiteral(initializer)) {
        processString(initializer.getLiteralValue());
      }
    }
  }

  // 3. StringLiterals in CallExpressions (like toast.error("..."))
  const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  for (const callExpr of callExpressions) {
    const exprText = callExpr.getExpression().getText();
    // Match common message-emitting functions
    if (exprText.includes('toast') || exprText.includes('setError') || exprText.includes('setSuccess') || exprText.includes('confirm') || exprText.includes('alert')) {
      for (const arg of callExpr.getArguments()) {
        if (Node.isStringLiteral(arg)) {
          processString(arg.getLiteralValue());
        }
      }
    }
  }
}

const outData: Record<string, string> = {};
// Sort alphabetically for easier lookup
Array.from(extractedStrings).sort().forEach(str => {
  outData[str] = str;
});

const outPath = path.join(process.cwd(), 'scripts', 'untranslated.json');
fs.writeFileSync(outPath, JSON.stringify(outData, null, 2));
console.log(`Extracted ${extractedStrings.size} unique strings to ${outPath}`);
