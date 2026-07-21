import { test, expect } from '@playwright/test';

test('home page loads and links to the dashboard', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'AmplifyWorld Link' })).toBeVisible();
  await page.getByRole('link', { name: 'Go to dashboard' }).click();
  await expect(page).toHaveURL(/\/login|\/dashboard/);
});

test('unpublished/unknown handle renders not-found', async ({ page }) => {
  await page.goto('/this-handle-does-not-exist');
  await expect(page.getByText(/doesn't exist or isn't published/)).toBeVisible();
});
