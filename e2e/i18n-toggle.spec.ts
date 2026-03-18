import { test, expect } from '@playwright/test';

// i18n toggle test: only mocks /health to prevent the "Backend Down" banner
// from blocking the login page UI during the language toggle verification.
test.beforeEach(async ({ page }) => {
  await page.route('**/health', route =>
    route.fulfill({ status: 200, json: { status: 'ok' } })
  );
});

test('i18n toggle switches language and direction', async ({ page }) => {
  await page.goto('/');

  // Wait for initial load
  await expect(page.getByTestId('lang-toggle-en')).toBeVisible();

  // Get initial submit button text (EN)
  const submitButtonTextEn = await page.getByTestId('login-submit-button').textContent();

  // Click Arabic toggle
  await page.getByTestId('lang-toggle-ar').click();

  // Verify HTML dir is RTL
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

  // Verify button text changed (AR translation is different from EN)
  const submitButtonTextAr = await page.getByTestId('login-submit-button').textContent();
  expect(submitButtonTextAr).not.toBe(submitButtonTextEn);

  // Switch back to English
  await page.getByTestId('lang-toggle-en').click();

  // Verify HTML dir is LTR
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');

  // Verify text reverts to English
  await expect(page.getByTestId('login-submit-button')).toHaveText(submitButtonTextEn || '');
});
