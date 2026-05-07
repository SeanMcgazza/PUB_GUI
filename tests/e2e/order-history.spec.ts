import { test, expect, Page } from '@playwright/test';

async function placeOrder(customer: Page, item: string) {
  await customer.getByRole('button', { name: `Add ${item} to cart` }).click();
  await customer.getByRole('button', { name: /View Order/i }).click();
  await customer.getByRole('button', { name: /Place Order/i }).click();
  await expect(
    customer.getByRole('heading', { name: /Order #\d{4}/ })
  ).toBeVisible();
}

test.describe('Order history page', () => {
  test.beforeEach(async ({ context }) => {
    const setup = await context.newPage();
    await setup.goto('/');
    await setup.evaluate(() => {
      localStorage.removeItem('bartab_demo_orders');
      localStorage.removeItem('bartab_demo_menu');
    });
    await setup.close();
  });

  test('shows recent orders placed in demo mode', async ({ context }) => {
    // Place a couple of orders.
    const c1 = await context.newPage();
    await c1.goto('/order/the-local/table1');
    await placeOrder(c1, 'Guinness');

    const c2 = await context.newPage();
    await c2.goto('/order/the-local/table2');
    await placeOrder(c2, 'Heineken');

    // Open the order history page.
    const history = await context.newPage();
    await history.goto('/app/orders');

    await expect(
      history.getByRole('heading', { name: /Order History/i })
    ).toBeVisible();

    // Both orders show, with their codes and item names.
    await expect(history.locator('text=/^#\\d{4}$/')).toHaveCount(2, {
      timeout: 5000,
    });
  });

  test('expanding a row shows the line items without console errors', async ({
    context,
  }) => {
    // B13 regression guard: the orders table previously wrapped each row
    // pair in a keyless Fragment, triggering a React reconciliation warning
    // when rows were expanded/collapsed.
    const consoleErrors: string[] = [];

    const c1 = await context.newPage();
    await c1.goto('/order/the-local/table1');
    await placeOrder(c1, 'Guinness');

    const history = await context.newPage();
    history.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        const text = msg.text();
        // Filter out known noisy 3rd-party logs.
        if (
          text.includes('Warning:') ||
          text.includes('Each child in a list')
        ) {
          consoleErrors.push(text);
        }
      }
    });
    await history.goto('/app/orders');
    await expect(history.locator('text=/^#\\d{4}$/').first()).toBeVisible({
      timeout: 5000,
    });

    // Click the row to expand. The chevron toggle is the only ghost button
    // on the row.
    const orderRow = history.locator('tr', {
      has: history.locator('text=/^#\\d{4}$/'),
    });
    await orderRow.first().click();

    // Detail row appears with "Order Items:" label.
    await expect(
      history.getByText(/Order Items:/i).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(history.getByText('Guinness').first()).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });

  test('status filter narrows the list', async ({ context }) => {
    const c1 = await context.newPage();
    await c1.goto('/order/the-local/table1');
    await placeOrder(c1, 'Guinness');

    const history = await context.newPage();
    await history.goto('/app/orders');
    await expect(history.locator('text=/^#\\d{4}$/')).toHaveCount(1, {
      timeout: 5000,
    });

    // Switch the status filter to "accepted" — there are zero accepted orders.
    await history.locator('select').selectOption('accepted');
    await expect(
      history.getByText(/No orders found/i)
    ).toBeVisible({ timeout: 5000 });
  });
});
