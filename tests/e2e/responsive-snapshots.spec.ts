import { test, expect, Page } from '@playwright/test';
import path from 'node:path';

/**
 * Diagnostic spec: drives the customer page through a matrix of common
 * viewport sizes and saves screenshots to test-results/responsive/.
 * Not part of the regular CI suite — run on demand to audit responsive
 * behaviour before/after design changes.
 */

const VIEWPORTS = [
  { name: 'iphone-se', width: 375, height: 667, label: 'iPhone SE' },
  { name: 'iphone-15-pro', width: 393, height: 852, label: 'iPhone 15 Pro' },
  { name: 'iphone-15-pro-max', width: 430, height: 932, label: 'iPhone 15 Pro Max' },
  { name: 'pixel-7', width: 412, height: 915, label: 'Pixel 7' },
  { name: 'ipad-portrait', width: 820, height: 1180, label: 'iPad portrait' },
  { name: 'ipad-landscape', width: 1180, height: 820, label: 'iPad landscape' },
  { name: 'desktop-1440', width: 1440, height: 900, label: 'Desktop 1440' },
  { name: 'desktop-1920', width: 1920, height: 1080, label: 'Desktop 1920' },
];

const SCREENSHOT_DIR = path.join(
  process.cwd(),
  'test-results',
  'responsive'
);

async function clearDemoState(page: Page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.removeItem('bartab_demo_orders');
    localStorage.removeItem('bartab_demo_menu');
  });
}

async function placeAFewItemsInCart(page: Page) {
  // Add 3 items so the cart pill in the dock is at its widest.
  await page.getByRole('button', { name: 'Add Guinness to cart' }).click();
  await page.getByRole('button', { name: 'Add Heineken to cart' }).click();
  await page.getByRole('button', { name: 'Add Smithwicks to cart' }).click();
  // Wait for layout to settle.
  await page
    .getByRole('button', { name: /View Order/i })
    .waitFor({ state: 'visible' });
}

test.describe('Responsive snapshots — customer ordering', () => {
  test.beforeEach(async ({ page }) => {
    await clearDemoState(page);
  });

  for (const vp of VIEWPORTS) {
    test(`${vp.label} (${vp.width}×${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/order/the-local/table1');

      // Hero + first row of menu (above the fold).
      await expect(
        page.getByRole('heading', { level: 1, name: 'The Local' })
      ).toBeVisible();
      // Wait for fade-in animations to settle so the screenshot reflects
      // the steady-state design, not a frame mid-animation.
      await page.waitForTimeout(400);
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${vp.name}-1-empty.png`),
        fullPage: false,
      });

      // Full page (so we can see the dock + bottom of menu).
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${vp.name}-2-fullpage.png`),
        fullPage: true,
      });

      // With cart loaded — dock should grow the View Order button.
      await placeAFewItemsInCart(page);
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${vp.name}-3-with-cart.png`),
        fullPage: false,
      });

      // Cart sheet open.
      await page.getByRole('button', { name: /View Order/i }).click();
      await expect(
        page.getByRole('heading', { name: /Your Order/i })
      ).toBeVisible();
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${vp.name}-4-cart-open.png`),
        fullPage: false,
      });
    });
  }
});

test.describe('Responsive snapshots — bar dashboard', () => {
  for (const vp of VIEWPORTS) {
    test(`bar @ ${vp.label} (${vp.width}×${vp.height})`, async ({
      page,
      context,
    }) => {
      // Pre-populate one order so the dashboard shows a card, not the empty state.
      const customer = await context.newPage();
      await customer.setViewportSize({ width: 412, height: 915 });
      await customer.goto('/');
      await customer.evaluate(() => {
        localStorage.removeItem('bartab_demo_orders');
        localStorage.removeItem('bartab_demo_menu');
      });
      await customer.goto('/order/the-local/table2');
      await customer
        .getByRole('button', { name: 'Add Guinness to cart' })
        .click();
      await customer
        .getByRole('button', { name: 'Add Heineken to cart' })
        .click();
      await customer.getByRole('button', { name: /View Order/i }).click();
      await customer
        .getByRole('button', { name: /Place Order/i })
        .click();
      await expect(
        customer.getByRole('heading', { name: /Order #\d{4}/ })
      ).toBeVisible();
      await customer.close();

      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/app');
      await page.locator('text=/^#\\d{4}$/').first().waitFor({ timeout: 5000 });

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `bar-${vp.name}.png`),
        fullPage: false,
      });
    });
  }
});
