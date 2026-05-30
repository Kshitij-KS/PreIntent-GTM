import { expect, test } from "@playwright/test";

test("renders and drives the stage-ready demo console", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("h1")).toHaveText("Competitor Risk Board");
  await expect(page.getByText("Presenter brief")).toBeVisible();
  await expect(page.locator("body")).toContainText("Signal detected");

  await page.getByRole("button", { name: "Dark" }).click();
  await expect(page.locator("main")).toHaveAttribute("data-theme", "dark");

  await page.getByLabel("Accent color").selectOption("emerald");
  await expect(page.locator("main")).toHaveAttribute("data-accent", "emerald");

  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.locator("body")).toContainText("Risk score explained");

  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.locator("body")).toContainText("Recommended play");

  await page.getByRole("button", { name: "Send Slack alert" }).click();
  await expect(page.locator("body")).toContainText("Slack sent");

  await page.getByRole("button", { name: "Create HubSpot task" }).click();
  await expect(page.locator("body")).toContainText("HubSpot task created");

  await page.getByRole("button", { name: "Mark actioned" }).click();
  await expect(page.locator("body")).toContainText(
    "Executive summary complete",
  );
  await expect(page.locator("body")).toContainText("actioned");

  const hasHorizontalOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});
