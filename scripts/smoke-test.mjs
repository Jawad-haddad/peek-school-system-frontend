#!/usr/bin/env node

/**
 * Minimal Frontend Smoke Test
 * 
 * Usage: node scripts/smoke-test.mjs
 * Or:    npm run smoke:test
 * 
 * Verifies that the deployed frontend container/server is reachable
 * and serving core assets successfully. 
 */

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

console.log(`\n☁️  Starting minimal HTTP smoke test against ${FRONTEND_URL}`);

async function checkRoute(path, expectedStatus = 200) {
    const url = `${FRONTEND_URL}${path}`;
    try {
        const response = await fetch(url, { method: 'GET' });

        if (response.status === expectedStatus) {
            console.log(`✅ [PASS] ${url} -> ${response.status}`);
            return true;
        } else {
            console.error(`❌ [FAIL] ${url} -> Expected ${expectedStatus}, got ${response.status}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ [ERROR] ${url} -> Reachability failed: ${error.message}`);
        return false;
    }
}

async function run() {
    let allPassed = true;

    // 1. Check Root (ensures Next.js router is serving pages)
    const rootPassed = await checkRoute('/');
    allPassed = allPassed && rootPassed;

    // 2. Check Static Asset (ensures public/ assets mount correctly)
    const staticPassed = await checkRoute('/window.svg');
    allPassed = allPassed && staticPassed;

    if (allPassed) {
        console.log('\n✅ All smoke tests passed successfully!');
        process.exit(0);
    } else {
        console.error('\n❌ Smoke tests failed! Please check your deployment/container.');
        process.exit(1);
    }
}

// Implement a light retry loop in case the container takes a moment to boot
async function runWithRetries(maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            await run();
            return;
        } catch (e) {
            if (i === maxRetries - 1) {
                console.error('\n❌ Exhausted retries.');
                process.exit(1);
            }
            console.log(`\n⏳ Retrying in 2 seconds... (${i + 1}/${maxRetries - 1})`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}

runWithRetries();
