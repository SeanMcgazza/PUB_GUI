import { test, expect, Page } from '@playwright/test';

async function clearDemoState(page: Page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.removeItem('bartab_demo_orders');
    localStorage.removeItem('bartab_demo_menu');
  });
}

test.describe('Customer ordering page', () => {
  test.beforeEach(async ({ page }) => {
    await clearDemoState(page);
  });

  test('loads the menu for a valid pub + table token', async ({ page }) => {
    await page.goto('/order/the-local/table1');

    await expect(page.getByText('The Local').first()).toBeVisible();
    await expect(page.getByText(/Table 1/).first()).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /What are you having/i })
    ).toBeVisible();
    await expect(page.getByText('Guinness').first()).toBeVisible();
  });

  test('renders 404 for an unknown pub slug', async ({ page }) => {
    const response = await page.goto('/order/nonexistent-pub/table1');
    expect(response?.status()).toBe(404);
  });

  test('renders 404 for an unknown table token', async ({ page }) => {
    const response = await page.goto('/order/the-local/not-a-real-token');
    expect(response?.status()).toBe(404);
  });

  test('adds an item to the cart and shows running total', async ({
    page,
  }) => {
    await page.goto('/order/the-local/table1');

    await page
      .getByRole('button', { name: 'Add Guinness to cart' })
      .click();

    const cartButton = page.getByRole('button', { name: /View Order/i });
    await expect(cartButton).toBeVisible();
    await expect(cartButton).toContainText('€5.80');
  });

  test('decrements quantity and clears the cart at zero', async ({ page }) => {
    await page.goto('/order/the-local/table1');

    await page
      .getByRole('button', { name: 'Add Guinness to cart' })
      .click();
    await page.getByRole('button', { name: 'Remove one Guinness' }).click();

    await expect(
      page.getByRole('button', { name: /View Order/i })
    ).toHaveCount(0);
  });

  test('stacks quantity when same item added repeatedly', async ({ page }) => {
    await page.goto('/order/the-local/table1');

    await page
      .getByRole('button', { name: 'Add Guinness to cart' })
      .click();
    // Now the button is the "Add another Guinness" variant.
    await page.getByRole('button', { name: 'Add another Guinness' }).click();
    await page.getByRole('button', { name: 'Add another Guinness' }).click();

    // Cart aria-label: "View order, 3 items, €17.40"
    await expect(
      page.getByRole('button', { name: /View order, 3 items/i })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /View Order/i })
    ).toContainText('€17.40');
  });

  test('places an order and shows the confirmation screen', async ({
    page,
  }) => {
    await page.goto('/order/the-local/table1');

    await page
      .getByRole('button', { name: 'Add Guinness to cart' })
      .click();
    await page.getByRole('button', { name: /View Order/i }).click();
    await page.getByRole('button', { name: /Place Order/i }).click();

    await expect(
      page.getByRole('heading', { name: /Order #\d{4}/ })
    ).toBeVisible();
    await expect(page.getByText(/Waiting for confirmation/i)).toBeVisible();
  });

  test('persists the order in localStorage so it can sync to the bar', async ({
    page,
  }) => {
    await page.goto('/order/the-local/table1');

    await page
      .getByRole('button', { name: 'Add Guinness to cart' })
      .click();
    await page.getByRole('button', { name: /View Order/i }).click();
    await page.getByRole('button', { name: /Place Order/i }).click();

    await expect(
      page.getByRole('heading', { name: /Order #\d{4}/ })
    ).toBeVisible();

    const stored = await page.evaluate(() =>
      localStorage.getItem('bartab_demo_orders')
    );
    expect(stored).not.toBeNull();
    const orders = JSON.parse(stored!);
    expect(orders).toHaveLength(1);
    expect(orders[0].status).toBe('pending');
    expect(orders[0].order_items[0].name).toBe('Guinness');
  });

  test('order notes are saved with the order', async ({ page }) => {
    await page.goto('/order/the-local/table1');

    await page
      .getByRole('button', { name: 'Add Guinness to cart' })
      .click();
    await page.getByRole('button', { name: /View Order/i }).click();

    await page
      .getByPlaceholder(/special requests/i)
      .fill('No ice please');
    await page.getByRole('button', { name: /Place Order/i }).click();

    await expect(
      page.getByRole('heading', { name: /Order #\d{4}/ })
    ).toBeVisible();

    const stored = await page.evaluate(() =>
      localStorage.getItem('bartab_demo_orders')
    );
    const orders = JSON.parse(stored!);
    expect(orders[0].notes).toBe('No ice please');
  });
});
