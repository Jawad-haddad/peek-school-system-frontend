/**
 * Playwright global setup – called once before any test suite.
 * Fails fast with a human-readable message if the backend is not reachable.
 */
import { request } from '@playwright/test';

async function globalSetup() {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
  const healthUrl = `${backendUrl}/health`;

  console.log(`\n[globalSetup] Verifying backend at ${healthUrl} …`);

  const ctx = await request.newContext();
  let res: Awaited<ReturnType<typeof ctx.get>> | undefined;

  try {
    res = await ctx.get(healthUrl, { timeout: 10000 });
  } catch (err: any) {
    throw new Error(
      `\n\n❌  Backend is NOT running or not reachable!\n` +
      `   Expected health check at: ${healthUrl}\n` +
      `   Error: ${err.message}\n\n` +
      `   ➜  Start the backend first (see docs/QA_RUNBOOK.md), then re-run the tests.\n`
    );
  }

  if (!res.ok()) {
    throw new Error(
      `\n\n❌  Backend health check returned HTTP ${res.status()}\n` +
      `   URL: ${healthUrl}\n` +
      `   ➜  Make sure the backend is running and healthy before running Playwright tests.\n`
    );
  }

  console.log(`[globalSetup] ✅  Backend healthy (HTTP ${res.status()})`);
  await ctx.dispose();
}

export default globalSetup;
