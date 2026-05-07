import { test, expect, Page } from '@playwright/test';

/**
 * The headline test for BarTab's demo mode: the customer→bar→customer loop
 * via localStorage events. Both pages share one browser context (same origin
 * = same localStorage). Storage events fire across pages of that context.
 */

async function placeGuinness(customer: Page) {
  await customer.getByRole('button', { name: 'Add Guinness to cart' }).click();
  await customer.getByRole('button', { name: /View Order/i }).click();
  await customer.getByRole('button', { name: /Place Order/i }).click();
  await expect(
    customer.getByRole('heading', { name: /Order #\d{4}/ })
  ).toBeVisible();
}

test.describe('Customer ↔ bar ↔ customer loop (demo mode)', () => {
  test.beforeEach(async ({ context }) => {
    const setup = await context.newPage();
    await setup.goto('/');
    await setup.evaluate(() => {
      localStorage.removeItem('bartab_demo_orders');
      localStorage.removeItem('bartab_demo_menu');
    });
    await setup.close();
  });

  test('customer order appears on bar dashboard in real time', async ({
    context,
  }) => {
    const bar = await context.newPage();
    const customer = await context.newPage();

    await bar.goto('/app');
    await expect(bar.getByRole('heading', { name: /Orders/ })).toBeVisible();
    // Default filter is "Pending"; with no orders the empty state shows.
    await expect(
      bar.getByText(/No pending orders at the moment/i)
    ).toBeVisible();

    await customer.goto('/order/the-local/table1');
    await placeGuinness(customer);

    // Bar dashboard picks up the order via storage event.
    await expect(bar.locator('text=/^#\\d{4}$/').first()).toBeVisible({
      timeout: 5000,
    });
    await expect(bar.getByText('Guinness').first()).toBeVisible();
    await expect(bar.getByText(/€5\.80/).first()).toBeVisible();
  });

  test('bar status updates propagate back to the customer screen', async ({
    context,
  }) => {
    const bar = await context.newPage();
    const customer = await context.newPage();

    await bar.goto('/app');
    // Show all statuses so we can drive the order through every transition
    // without the default "Pending" filter hiding it after Accept.
    await bar.getByRole('button', { name: /^All / }).click();

    await customer.goto('/order/the-local/table1');
    await placeGuinness(customer);

    await bar.locator('text=/^#\\d{4}$/').first().waitFor({ timeout: 5000 });

    await bar.getByRole('button', { name: /^Accept$/ }).click();
    await expect(customer.getByText(/Order confirmed/i)).toBeVisible({
      timeout: 5000,
    });

    await bar.getByRole('button', { name: /Start Preparing/i }).click();
    await expect(customer.getByText(/Being prepared/i)).toBeVisible({
      timeout: 5000,
    });

    await bar.getByRole('button', { name: /Mark Ready/i }).click();
    await expect(customer.getByText(/Ready for collection/i)).toBeVisible({
      timeout: 5000,
    });

    await bar.getByRole('button', { name: /Collected/ }).click();
    // After collected, no active orders.
    await expect(bar.locator('text=/^#\\d{4}$/')).toHaveCount(0, {
      timeout: 5000,
    });
  });

  test('cancelling on the bar removes the order from the active view', async ({
    context,
  }) => {
    const bar = await context.newPage();
    const customer = await context.newPage();

    await bar.goto('/app');
    await customer.goto('/order/the-local/table1');
    await placeGuinness(customer);

    await bar.locator('text=/^#\\d{4}$/').first().waitFor({ timeout: 5000 });
    await bar.getByRole('button', { name: /Cancel order #\d{4}/ }).click();

    // Order is no longer in the active view (default filter: pending).
    await expect(bar.locator('text=/^#\\d{4}$/')).toHaveCount(0, {
      timeout: 5000,
    });
    await expect(
      bar.getByText(/No pending orders at the moment/i)
    ).toBeVisible();
  });
});
