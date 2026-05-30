import { expect, test } from "@playwright/test";

test("renders and drives the stage-ready demo console", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("UNDERTOW")).toBeVisible();
  await expect(page.getByText("accounts tracked")).toBeVisible();
  await expect(page.getByText("powered by")).toBeVisible();

  await page.getByRole("button", { name: /RUN FULL SCAN/ }).click();
  await expect(page.getByText(/TriggerWare alert fired/)).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText("⚡ TriggerWare fired")).toBeVisible();

  await page.getByRole("button", { name: "signals" }).click();
  await expect(page.getByText("VOID SCANNER").first()).toBeVisible();
  await expect(page.getByText("PAIN LISTENER").first()).toBeVisible();

  await page.getByRole("button", { name: "intel" }).click();
  await expect(page.getByText("COGNEE — ACCOUNT MEMORY")).toBeVisible();
  await expect(page.getByText("TRIGGERWARE — WORKFLOW FIRED")).toBeVisible();
  await expect(page.getByText("VOID DIFF — PRICING TIER REMOVED")).toBeVisible();

  await page.getByRole("button", { name: "brief", exact: true }).click();
  await page.getByRole("button", { name: /GENERATE INTEL BRIEF/ }).click();
  await expect(page.getByText("WHY NOW")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/SUGGESTED OPENING LINE/)).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});
