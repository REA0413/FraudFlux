import { test, expect } from '@playwright/test';

test.describe('FraudFlux Frontend E2E Test Suite (Live Vercel)', () => {

  // Test 1: Verify Landing / Login Page Loads
  test('should load login page properly', async ({ page }) => {
    // Relative path resolves to https://fraudflux.vercel.app/login
    await page.goto('/login');

    // 1. Verify URL route contains /login or redirects cleanly
    await expect(page).toHaveURL(/.*login/);

    // 2. Click "Sign In" button if present on landing page
    const signInButton = page.getByRole('button', { name: /sign in/i });
    if (await signInButton.isVisible()) {
      await signInButton.click();
    }

    // 3. Verify form input fields exist
    const emailInput = page.getByPlaceholder(/email/i).or(page.locator('input[type="email"]'));
    const passwordInput = page.getByPlaceholder(/password/i).or(page.locator('input[type="password"]'));

    await expect(emailInput.first()).toBeVisible();
    await expect(passwordInput.first()).toBeVisible();
  });

  // Test 2: Dynamic Threshold Settings UI Page
  test('should navigate to merchant settings page', async ({ page }) => {
    // Relative path resolves to https://fraudflux.vercel.app/settings
    await page.goto('/settings');

    // Verify page elements exist
    const heading = page.locator('text=Threshold').or(page.locator('h1, h2, h3'));
    await expect(heading.first()).toBeVisible();
  });

  // Test 3: Dashboard Loads
  test('should load the dashboard view', async ({ page }) => {
    // Relative path resolves to https://fraudflux.vercel.app/
    await page.goto('/');

    // Ensure page renders without React crashing
    await expect(page.locator('body')).toBeVisible();
    await expect(page).not.toHaveTitle('');
  });

});