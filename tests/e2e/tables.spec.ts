import { test, expect } from '@playwright/test';

test.describe('Tables management page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('bartab_demo_orders');
      localStorage.removeItem('bartab_demo_menu');
    });
  });

  test('renders the demo tables with QR codes', async ({ page }) => {
    await page.goto('/app/tables');

    // The 5 demo tables should show.
    await expect(page.getByText('Table 1')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Table 2')).toBeVisible();
    await expect(page.getByText('Window Seat')).toBeVisible();

    // Each table has a QR code preview SVG.
    const qrSvgs = page.locator('svg').filter({
      has: page.locator('path, rect'),
    });
    expect(await qrSvgs.count()).toBeGreaterThanOrEqual(5);
  });

  test('Add Table dialog persists a new table in demo mode', async ({
    page,
  }) => {
    const errors: string[] = [];
    const dialogs: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('dialog', (d) => {
      dialogs.push(d.message());
      d.accept();
    });

    await page.goto('/app/tables');
    await expect(page.getByText('Table 1')).toBeVisible({ timeout: 5000 });

    // Click Add Table → opens the dialog.
    await page.getByRole('button', { name: /^Add Table$/ }).click();

    // The number is auto-suggested; just give it a name and submit.
    await page.getByLabel(/Name \(optional\)/i).fill('Snug');
    await page.getByRole('button', { name: /^Add Table$/ }).last().click();

    // The new table should appear in the list with the given name.
    await expect(page.getByText('Snug')).toBeVisible({ timeout: 5000 });
    expect(errors).toEqual([]);
    expect(dialogs).toEqual([]); // no "Failed to save table" alert
  });

  test('table QR code URL points at /order/<slug>/<qr_token>', async ({
    page,
  }) => {
    await page.goto('/app/tables');
    await expect(page.getByText('Table 1')).toBeVisible({ timeout: 5000 });

    // Click on the first QR preview to open the full-size dialog.
    await page.locator('svg[id^="qr-"]').first().click();

    // The dialog shows the URL — assert it matches the expected pattern.
    await expect(
      page.getByText(/\/order\/the-local\//).first()
    ).toBeVisible({ timeout: 5000 });
  });
});
