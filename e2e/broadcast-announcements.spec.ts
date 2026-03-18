import { test, expect } from '@playwright/test';

test('Broadcast announcements page loads and form is functional', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('login-email-input')).toBeVisible();

  // Log in as admin
  await page.getByTestId('login-email-input').fill(process.env.TEST_ADMIN_EMAIL || 'admin@peek.com');
  await page.getByTestId('login-password-input').fill(process.env.TEST_ADMIN_PASSWORD || 'password123');
  await page.getByTestId('login-submit-button').click();

  await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });

  // Navigate to broadcast page
  await page.goto('/dashboard/broadcast');
  await expect(page).toHaveURL(/.*\/dashboard\/broadcast/);

  // Verify key form elements are visible
  await expect(page.getByTestId('broadcast-title-input')).toBeVisible();
  await expect(page.getByTestId('broadcast-target-all')).toBeVisible();
  await expect(page.getByTestId('broadcast-message-input')).toBeVisible();
  await expect(page.getByTestId('broadcast-submit-button')).toBeVisible();
});
