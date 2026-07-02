import { test, expect } from '@playwright/test';

test.describe('Onboarding wizard', () => {
  test('full happy path: welcome → name → tables → categories → success', async ({
    page,
  }) => {
    await page.goto('/onboarding');

    // Step 0: Welcome
    await expect(
      page.getByRole('heading', { name: /Welcome to BarTab/i })
    ).toBeVisible();
    await page.getByRole('button', { name: /Let.s Go/i }).click();

    // Step 1: Pub name
    await expect(
      page.getByRole('heading', { name: /What.s your pub called/i })
    ).toBeVisible();
    await page.getByPlaceholder('e.g. The Red Lion').fill('The Red Lion');

    // Slug auto-generates from name.
    await expect(page.locator('input[placeholder="your-pub"]')).toHaveValue(
      'the-red-lion'
    );

    await page.getByRole('button', { name: /Continue/i }).click();

    // Step 2: Tables count
    await expect(
      page.getByRole('heading', { name: /How many tables/i })
    ).toBeVisible();
    // Quick preset buttons.
    await page.getByRole('button', { name: '12', exact: true }).click();
    await page.getByRole('button', { name: /Continue/i }).click();

    // Step 3: Categories
    await expect(
      page.getByRole('heading', { name: /What do you serve/i })
    ).toBeVisible();
    // Three are selected by default (Beers / Wines / Soft Drinks). Add Food.
    await page.getByRole('button', { name: /Food/ }).click();
    await page.getByRole('button', { name: /Finish Setup/i }).click();

    // Step 4: Success — saved with confetti.
    await expect(
      page.getByRole('heading', { name: /You.re all set/i })
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText('The Red Lion').first()
    ).toBeVisible();
  });

  test('slug input rejects uppercase and special characters', async ({
    page,
  }) => {
    await page.goto('/onboarding');
    await page.getByRole('button', { name: /Let.s Go/i }).click();

    await page.getByPlaceholder('e.g. The Red Lion').fill('Test');
    const slug = page.locator('input[placeholder="your-pub"]');
    await slug.fill('My Pub! v2');
    // Only lowercase a-z, 0-9, hyphen survive.
    await expect(slug).toHaveValue('mypubv2');
  });

  test('Continue is disabled on empty pub name', async ({ page }) => {
    await page.goto('/onboarding');
    await page.getByRole('button', { name: /Let.s Go/i }).click();
    await expect(
      page.getByRole('button', { name: /Continue/i })
    ).toBeDisabled();
  });

  test('table count quick presets update the input', async ({ page }) => {
    await page.goto('/onboarding');
    await page.getByRole('button', { name: /Let.s Go/i }).click();
    await page.getByPlaceholder('e.g. The Red Lion').fill('Test Pub');
    await page.getByRole('button', { name: /Continue/i }).click();

    // Default is 8.
    await expect(page.locator('input[type="number"]')).toHaveValue('8');
    await page.getByRole('button', { name: '20', exact: true }).click();
    await expect(page.locator('input[type="number"]')).toHaveValue('20');
    await page.getByRole('button', { name: '4', exact: true }).click();
    await expect(page.locator('input[type="number"]')).toHaveValue('4');
  });

  test('apostrophes in pub name strip cleanly into slug', async ({ page }) => {
    // Regression guard for the slug generator: O'Briens → obriens.
    await page.goto('/onboarding');
    await page.getByRole('button', { name: /Let.s Go/i }).click();
    await page.getByPlaceholder('e.g. The Red Lion').fill("O'Briens");
    await expect(page.locator('input[placeholder="your-pub"]')).toHaveValue(
      'obriens'
    );
  });
});
