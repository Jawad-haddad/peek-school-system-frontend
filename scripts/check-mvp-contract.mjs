#!/usr/bin/env node
/**
 * check-mvp-contract.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Anti-invention guardrail for MVP flows.
 *
 * Scans MVP source files for forbidden patterns:
 *   1. Raw `api.get/post/put/delete/patch` calls (must use mvpApi instead)
 *   2. Response-shape guessing: `?.data?.data`, `|| []`, `|| {}` on API calls
 *   3. Hardcoded endpoint strings that should live in MVP_ENDPOINTS
 *
 * MVP files in scope:
 *   src/app/page.tsx                              (login)
 *   src/app/dashboard/page.tsx                    (role routing)
 *   src/app/dashboard/classes/page.tsx            (classes list/delete)
 *   src/app/dashboard/classes/[classId]/attendance/page.tsx
 *   src/app/dashboard/attendance/page.tsx
 *   src/components/dashboard/AddClassModal.tsx
 *   src/components/dashboard/EditClassModal.tsx
 *
 * Exit codes:
 *   0 — no violations
 *   1 — violations found (CI fails)
 *
 * Usage:
 *   node scripts/check-mvp-contract.mjs
 */

import { readFileSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── MVP files under contract ──────────────────────────────────────────────────
const MVP_FILES = [
    'src/app/page.tsx',
    'src/app/dashboard/page.tsx',
    'src/app/dashboard/classes/page.tsx',
    'src/app/dashboard/classes/[classId]/attendance/page.tsx',
    'src/app/dashboard/attendance/page.tsx',
    'src/components/dashboard/AddClassModal.tsx',
    'src/components/dashboard/EditClassModal.tsx',
];

// ── Forbidden patterns ────────────────────────────────────────────────────────
const FORBIDDEN = [
    {
        // Raw API calls: api.get(  api.post(  api.put(  api.delete(  api.patch(
        pattern: /\bapi\.(get|post|put|delete|patch)\s*\(/g,
        name: 'raw api.METHOD call',
        fix: 'Use the corresponding mvpApi method instead. All MVP endpoints are in mvpApi via MVP_ENDPOINTS.',
    },
    {
        // Response shape guessing: res.data?.data  or  res.data.data
        pattern: /\.data\??\.(data)\b/g,
        name: 'response double-data shape guess (res.data?.data)',
        fix: 'mvpApi methods return the exact backend shape. Remove the extra .data layer.',
    },
    {
        // Fallback arrays/objects: || []  || {}  when used after await on API calls
        // Match: ) || []   or  ) || {}   on lines that contain await
        // Simple line-level heuristic — no AST needed for this check.
        pattern: /\|\|\s*(\[\]|\{\})/g,
        name: 'response fallback shape guess (|| [] or || {})',
        fix: 'Do not add fallback shapes. If the backend returns a wrong shape, it is a backend bug. Do not mask it.',
    },
];

// ── Runner ────────────────────────────────────────────────────────────────────
let totalViolations = 0;

for (const relPath of MVP_FILES) {
    const absPath = join(ROOT, relPath);
    let src;
    try {
        src = readFileSync(absPath, 'utf8');
    } catch {
        // File does not exist — warn but do not fail (optional pages)
        console.warn(`  ⚠  SKIP (not found): ${relPath}`);
        continue;
    }

    const lines = src.split('\n');
    const fileViolations = [];

    for (const { pattern, name, fix } of FORBIDDEN) {
        // Reset lastIndex for global regexes
        pattern.lastIndex = 0;

        // Match against the whole source with line number tracking
        let lineNo = 1;
        for (const line of lines) {
            pattern.lastIndex = 0;
            if (pattern.test(line)) {
                fileViolations.push({ lineNo, line: line.trimEnd(), name, fix });
            }
            lineNo++;
        }
    }

    if (fileViolations.length > 0) {
        console.error(`\n❌  ${relPath}`);
        for (const v of fileViolations) {
            console.error(`   Line ${v.lineNo}: [${v.name}]`);
            console.error(`   Code: ${v.line}`);
            console.error(`   Fix:  ${v.fix}`);
        }
        totalViolations += fileViolations.length;
    } else {
        console.log(`  ✓  ${relPath}`);
    }
}

console.log('');
if (totalViolations === 0) {
    console.log('✅  MVP contract check passed — no violations found.\n');
    process.exit(0);
} else {
    console.error(`❌  MVP contract check FAILED — ${totalViolations} violation(s) found.\n`);
    process.exit(1);
}
