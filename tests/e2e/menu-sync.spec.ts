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
});
