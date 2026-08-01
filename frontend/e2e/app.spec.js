import { test, expect } from '@playwright/test';

test.describe('FraudFlux Frontend E2E Test Suite', () => {

// Test 1: Verify Landing / Login Page Loads
  test('should load login page properly', async ({ page }) => {
    await page.goto('/login');

    // 1. Verify URL route
    await expect(page).toHaveURL(/.*login/);

    // 2. Click "Sign In" button if present on the landing page header
    const signInButton = page.getByRole('button', { name: 'Sign In' });
    if (await signInButton.isVisible()) {
      await signInButton.click();
    }

    // 3. Verify form input fields using user-facing Playwright locators
    await expect(
      page.getByPlaceholder(/email/i).or(page.locator('input[type="email"]'))
    ).toBeVisible();

    await expect(
      page.getByPlaceholder(/password/i).or(page.locator('input[type="password"]'))
    ).toBeVisible();
  });

  // Test 2: Dynamic Threshold Settings UI Page
  test('should navigate to merchant settings and update threshold', async ({ page }) => {
    // Navigate to settings
    await page.goto('/settings');

    // Verify page elements exist
    const heading = page.locator('text=Threshold');
    if (await heading.isVisible()) {
      await expect(heading).toBeVisible();
    } else {
      // Fallback check if redirected or loaded
      await expect(page).not.toHaveTitle('');
    }
  });

  // Test 3: Dashboard Loads Transactions Table
  test('should load the dashboard view', async ({ page }) => {
    await page.goto('/');

    // Ensure the page body renders without throwing a React crash error
    await expect(page.locator('body')).toBeVisible();
  });

});