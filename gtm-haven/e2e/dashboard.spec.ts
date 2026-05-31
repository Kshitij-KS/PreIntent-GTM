import { expect, test } from "@playwright/test";

test("renders and drives the stage-ready demo console", async ({ page }) => {
  await page.goto("/demo");

  await expect(page.getByText("LIVE DEMO", { exact: true })).toBeVisible();
  await expect(page.getByText("ACCOUNTS", { exact: true })).toBeVisible();
  await expect(page.getByText("powered by", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: /RUN FULL SCAN/ }).click();
  await expect(page.getByText(/TriggerWare workflow fired/i)).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText(/TriggerWare fired/i).first()).toBeVisible();

  await page.getByRole("button", { name: /SIGNALS/ }).click();
  await expect(page.getByRole("button", { name: "VOID", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "PAIN", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "INTEL", exact: true }).click();
  await expect(page.getByText("KEY CONTACT", { exact: true })).toBeVisible();
  await expect(page.getByText("NEXT ACTION", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "BRIEF", exact: true }).click();
  await page.getByRole("button", { name: /Generate Brief/i }).click();
  await expect(page.getByText("WHY NOW")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/SUGGESTED OPENING LINE/)).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test("landing auth links open explicit sign-in and sign-up pages", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole("button", { name: "SIGN IN", exact: true })).toBeVisible();

  await page.goto("/");
  await page.locator("#nav-cta").click();
  await expect(page).toHaveURL(/\/sign-up$/);
  await expect(page.getByRole("button", { name: "CREATE ACCOUNT", exact: true })).toBeVisible();
});
