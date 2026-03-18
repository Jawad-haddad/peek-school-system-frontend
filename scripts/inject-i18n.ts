import { Project, SyntaxKind, StringLiteral, Node, QuoteKind, SourceFile } from 'ts-morph';
import * as fs from 'fs';
import * as path from 'path';

const mapCache = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'scripts', 'injection-map.json'), 'utf-8'));

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
  manipulationSettings: {
    quoteKind: QuoteKind.Single,
  }
});

project.addSourceFilesAtPaths(['src/app/**/*.tsx', 'src/app/**/*.ts', 'src/components/**/*.tsx', 'src/components/**/*.ts']);

let filesModified = 0;

// Helper to clean and validate strings exactly like the extraction matched
function cleanText(str: string) {
  return str.replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function ensureUseLangImportAndHook(sourceFile: SourceFile) {
  // Add import if missing
  const imports = sourceFile.getImportDeclarations();
  const hasLangImport = imports.some(i => i.getModuleSpecifierValue() === '@/lib/LangProvider');
  if (!hasLangImport) {
    sourceFile.addImportDeclaration({
      namedImports: ['useLang'],
      moduleSpecifier: '@/lib/LangProvider'
    });
  }

  // Inject const { t } = useLang(); inside component body if not there
  const jsxElements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxElement);
  const jsxSelf = sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement);
  const firstJsx = jsxElements[0] || jsxSelf[0];
  
  if (firstJsx) {
    const func = firstJsx.getFirstAncestorByKind(SyntaxKind.FunctionDeclaration) || 
                 firstJsx.getFirstAncestorByKind(SyntaxKind.ArrowFunction);
    
    if (func) {
      const body = func.getBody();
      if (Node.isBlock(body)) {
        const hasHook = body.getStatements().some(s => s.getText().includes('useLang()'));
        if (!hasHook) {
          body.insertStatements(0, 'const { t } = useLang();');
        }
      }
    }
  }
}

for (const sourceFile of project.getSourceFiles()) {
  let fileChanged = false;

  // We need to keep track of transformations as replacing AST nodes changes tree structure.
  // Actually, replacing text node with JsxExpression doesn't invalidate subsequent non-overlapping nodes,
  // but just to be safe, we collect replacements and apply them carefully, or do it iteratively.

  // 1. JsxText -> {t('key')}
  const jsxTexts = sourceFile.getDescendantsOfKind(SyntaxKind.JsxText);
  // Iterate in reverse for safe replacement
  for (let i = jsxTexts.length - 1; i >= 0; i--) {
     const textNode = jsxTexts[i];
     const fullText = textNode.getText();
     const text = cleanText(fullText);
     if (mapCache[text]) {
        if (!fileChanged) { ensureUseLangImportAndHook(sourceFile); fileChanged = true; }
        const prefixMatch = fullText.match(/^\s*/);
        const suffixMatch = fullText.match(/\s*$/);
        const prefix = prefixMatch ? prefixMatch[0] : '';
        const suffix = suffixMatch ? suffixMatch[0] : '';
        textNode.replaceWithText(`${prefix}{t('${mapCache[text].key}')}${suffix}`);
     }
  }

  // 2. StringLiterals in JsxAttribute (placeholder="Email") -> placeholder={t('key')}
  const jsxAttributes = sourceFile.getDescendantsOfKind(SyntaxKind.JsxAttribute);
  for (let i = jsxAttributes.length - 1; i >= 0; i--) {
    const attr = jsxAttributes[i];
    const name = attr.getNameNode().getText();
    if (['placeholder', 'title', 'alt', 'label'].includes(name)) {
      const initializer = attr.getInitializer();
      if (initializer && Node.isStringLiteral(initializer)) {
        const text = cleanText(initializer.getLiteralValue());
        if (mapCache[text]) {
          if (!fileChanged) { ensureUseLangImportAndHook(sourceFile); fileChanged = true; }
          attr.setInitializer(`{t('${mapCache[text].key}')}`);
        }
      }
    }
  }

  // 3. StringLiterals in CallExpressions (toast("Message")) -> toast(t('key'))
  const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  for (let i = callExpressions.length - 1; i >= 0; i--) {
    const callExpr = callExpressions[i];
    const exprText = callExpr.getExpression().getText();
    if (exprText.includes('toast') || exprText.includes('setError') || exprText.includes('setSuccess') || exprText.includes('confirm') || exprText.includes('alert')) {
      const args = callExpr.getArguments();
      args.forEach((arg, argIndex) => {
        if (Node.isStringLiteral(arg)) {
           const text = cleanText(arg.getLiteralValue());
           if (mapCache[text]) {
             if (!fileChanged) { ensureUseLangImportAndHook(sourceFile); fileChanged = true; }
             callExpr.removeArgument(argIndex);
             callExpr.insertArgument(argIndex, `t('${mapCache[text].key}')`);
           }
        }
      });
    }
  }

  if (fileChanged) {
    filesModified++;
  }
}

project.saveSync();
console.log(`Transformed ${filesModified} files using AST injection.`);
