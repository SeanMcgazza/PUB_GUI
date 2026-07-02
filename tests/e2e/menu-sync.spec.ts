import { test, expect } from '@playwright/test';

/**
 * Verifies the cross-tab demo menu sync that DemoMenuState.subscribe drives.
 * Bar staff toggles an item off → customer's ordering page reflects the
 * change live (or after a refresh in the limit case).
 */

test.describe('Menu management ↔ customer ordering sync', () => {
  test.beforeEach(async ({ context }) => {
    const setup = await context.newPage();
    await setup.goto('/');
    await setup.evaluate(() => {
      localStorage.removeItem('bartab_demo_orders');
      localStorage.removeItem('bartab_demo_menu');
    });
    await setup.close();
  });

  test('toggling an item off on the menu page hides it from the customer', async ({
    context,
  }) => {
    const customer = await context.newPage();
    const barMenu = await context.newPage();

    await customer.goto('/order/the-local/table1');
    await expect(customer.getByText('Guinness').first()).toBeVisible();

    await barMenu.goto('/app/menu');
    await barMenu
      .getByRole('switch', { name: 'Toggle Guinness availability' })
      .click();

    // Customer page receives the update via DemoMenuState subscription.
    await expect(customer.getByText('Guinness').first()).toBeHidden({
      timeout: 5000,
    });
  });

  test('reset menu button restores the default catalogue', async ({
    page,
  }) => {
    await page.goto('/app/menu');

    const guinnessSwitch = page.getByRole('switch', {
      name: 'Toggle Guinness availability',
    });
    await guinnessSwitch.click();
    await expect(guinnessSwitch).not.toBeChecked();

    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: /Reset Menu/i }).click();

    await expect(guinnessSwitch).toBeChecked({ timeout: 5000 });
  });

  test('Add Item dialog adds a new menu item that customers can see', async ({
    context,
  }) => {
    const barMenu = await context.newPage();
    const customer = await context.newPage();

    await barMenu.goto('/app/menu');
    await barMenu.getByRole('button', { name: /^Add Item$/ }).click();

    await barMenu.getByLabel(/^Name/).fill('Test Stout');
    await barMenu.getByLabel(/Description/i).fill('500ml craft pour');
    await barMenu.getByLabel(/Price/i).fill('6.50');
    await barMenu
      .getByRole('button', { name: /^Add Item$/ })
      .last()
      .click();

    // New item appears in the bar's menu list.
    await expect(barMenu.getByText('Test Stout').first()).toBeVisible({
      timeout: 5000,
    });

    // Customer ordering page picks it up via DemoMenuState subscription.
    await customer.goto('/order/the-local/table1');
    await expect(customer.getByText('Test Stout').first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('editing an item changes its price for the customer', async ({
    context,
  }) => {
    const barMenu = await context.newPage();
    const customer = await context.newPage();

    await customer.goto('/order/the-local/table1');
    await expect(customer.getByText('€5.80').first()).toBeVisible();

    await barMenu.goto('/app/menu');
    await barMenu.getByRole('button', { name: 'Edit Guinness' }).click();
    await expect(
      barMenu.getByRole('heading', { name: 'Edit Item' })
    ).toBeVisible();

    await barMenu.getByLabel(/Price/i).fill('7.99');
    await barMenu.getByRole('button', { name: /Save Changes/i }).click();

    await expect(customer.getByText('€7.99').first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('deleting an item removes it from the customer menu', async ({
    context,
  }) => {
    const barMenu = await context.newPage();
    const customer = await context.newPage();

    await customer.goto('/order/the-local/table1');
    await expect(customer.getByText('Heineken').first()).toBeVisible();

    barMenu.on('dialog', (d) => d.accept());

    await barMenu.goto('/app/menu');
    await barMenu.getByRole('button', { name: 'Delete Heineken' }).click();

    await expect(customer.getByText('Heineken').first()).toBeHidden({
      timeout: 5000,
    });
  });
});
