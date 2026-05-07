import { test, expect, Page } from '@playwright/test';

/**
 * Multi-customer / collision tests. In demo mode all customers and the bar
 * share one origin's localStorage. A real Supabase deployment has the same
 * observable behavior via realtime subscriptions on the orders table.
 */

async function placeOrder(page: Page, itemName = 'Guinness') {
  await page
    .getByRole('button', { name: `Add ${itemName} to cart` })
    .click();
  await page.getByRole('button', { name: /View Order/i }).click();
  await page.getByRole('button', { name: /Place Order/i }).click();
  await expect(
    page.getByRole('heading', { name: /Order #\d{4}/ })
  ).toBeVisible();
}

test.describe('Multi-customer ordering', () => {
  test.beforeEach(async ({ context }) => {
    const setup = await context.newPage();
    await setup.goto('/');
    await setup.evaluate(() => {
      localStorage.removeItem('bartab_demo_orders');
      localStorage.removeItem('bartab_demo_menu');
    });
    await setup.close();
  });

  test('two customers at different tables both appear on the bar dashboard', async ({
    context,
  }) => {
    const bar = await context.newPage();
    const c1 = await context.newPage();
    const c2 = await context.newPage();

    await bar.goto('/app');

    await c1.goto('/order/the-local/table1');
    await placeOrder(c1, 'Guinness');

    await c2.goto('/order/the-local/table2');
    await placeOrder(c2, 'Heineken');

    // Both orders show on the bar.
    await expect(bar.locator('text=/^#\\d{4}$/')).toHaveCount(2, {
      timeout: 7000,
    });
    await expect(bar.getByText('Guinness').first()).toBeVisible();
    await expect(bar.getByText('Heineken').first()).toBeVisible();
    await expect(bar.getByText(/Table 1/)).toBeVisible();
    await expect(bar.getByText(/Table 2/)).toBeVisible();
  });

  test('two customers at the same table create independent orders', async ({
    context,
  }) => {
    const bar = await context.newPage();
    const c1 = await context.newPage();
    const c2 = await context.newPage();

    await bar.goto('/app');

    await c1.goto('/order/the-local/table1');
    await placeOrder(c1, 'Guinness');

    await c2.goto('/order/the-local/table1');
    await placeOrder(c2, 'Heineken');

    await expect(bar.locator('text=/^#\\d{4}$/')).toHaveCount(2, {
      timeout: 7000,
    });
    // 4-digit confirmation codes are random with no uniqueness constraint;
    // we don't assert distinctness (collision is a documented limitation).
  });

  test('accepting one order does not change the status of another', async ({
    context,
  }) => {
    const bar = await context.newPage();
    const c1 = await context.newPage();
    const c2 = await context.newPage();

    await bar.goto('/app');
    await c1.goto('/order/the-local/table1');
    await placeOrder(c1, 'Guinness');
    await c2.goto('/order/the-local/table2');
    await placeOrder(c2, 'Heineken');

    await expect(bar.locator('text=/^#\\d{4}$/')).toHaveCount(2, {
      timeout: 7000,
    });

    // Accept the first order. Filter to "Pending" — only one order remains.
    await bar.getByRole('button', { name: /^Accept$/ }).first().click();
    await bar.getByRole('button', { name: /^Pending/ }).click();
    await expect(bar.locator('text=/^#\\d{4}$/')).toHaveCount(1, {
      timeout: 5000,
    });
  });

  test('three concurrent orders all persist (ID-collision regression)', async ({
    context,
  }) => {
    // Guards the bug fixed in commit 4031c63: orders placed in the same
    // millisecond used to share an ID and clobber each other under
    // updateOrderStatus. Now uses crypto.randomUUID().
    const bar = await context.newPage();
    await bar.goto('/app');

    const c1 = await context.newPage();
    const c2 = await context.newPage();
    const c3 = await context.newPage();
    await Promise.all([
      c1.goto('/order/the-local/table1'),
      c2.goto('/order/the-local/table2'),
      c3.goto('/order/the-local/table3'),
    ]);
    await Promise.all([
      placeOrder(c1, 'Guinness'),
      placeOrder(c2, 'Heineken'),
      placeOrder(c3, 'Smithwicks'),
    ]);

    await expect(bar.locator('text=/^#\\d{4}$/')).toHaveCount(3, {
      timeout: 7000,
    });
  });
});
