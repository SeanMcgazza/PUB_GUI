import { test, expect } from '@playwright/test';

test.describe('Settings page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('bartab_demo_orders');
      localStorage.removeItem('bartab_demo_menu');
    });
  });

  test('form populates with the current pub details on load', async ({
    page,
  }) => {
    await page.goto('/app/settings');

    // The demo pub is "The Local". Form fields should be prefilled.
    await expect(page.getByLabel(/Pub Name/i)).toHaveValue('The Local', {
      timeout: 5000,
    });
    await expect(page.getByLabel(/Address/i)).toHaveValue(
      '123 Main Street, Dublin'
    );
    await expect(page.getByLabel(/Phone/i)).toHaveValue('+353 1 234 5678');
  });

  test('save changes succeeds without errors in demo mode', async ({
    page,
  }) => {
    const errors: string[] = [];
    const dialogs: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('dialog', (d) => {
      dialogs.push(d.message());
      d.accept();
    });

    await page.goto('/app/settings');
    await expect(page.getByLabel(/Pub Name/i)).toHaveValue('The Local', {
      timeout: 5000,
    });

    await page.getByLabel(/Pub Name/i).fill('The Local (renamed)');
    await page.getByRole('button', { name: /Save Changes/i }).click();

    await expect(
      page.getByRole('button', { name: /Save Changes/i })
    ).toBeEnabled({ timeout: 5000 });

    expect(errors).toEqual([]);
    expect(dialogs).toEqual([]); // no "Failed to save settings" alert
  });

  test('ordering link reflects the pub slug', async ({ page }) => {
    await page.goto('/app/settings');
    await expect(page.locator('input[readonly]').first()).toHaveValue(
      /\/order\/the-local$/,
      { timeout: 5000 }
    );
  });
});
