import { test, expect } from '@playwright/test';

test('Admin login and dashboard load', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('login-email-input')).toBeVisible();

  await page.getByTestId('login-email-input').fill(process.env.TEST_ADMIN_EMAIL || 'admin@peek.com');
  await page.getByTestId('login-password-input').fill(process.env.TEST_ADMIN_PASSWORD || 'password123');
  await page.getByTestId('login-submit-button').click();

  // Wait for navigation to dashboard
  await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });

  // Verify dashboard layout is visible
  await expect(page.locator('nav')).toBeVisible();
});
