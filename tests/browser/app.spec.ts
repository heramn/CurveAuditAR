import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  // Browser regressions use only bundled geography; avoid requesting community map tiles from CI.
  await page.route("https://tile.openstreetmap.org/**", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#e9eee3"/></svg>',
    }),
  );
  await page.route("https://fonts.googleapis.com/**", (route) =>
    route.fulfill({ contentType: "text/css", body: "" }),
  );
});
test("auditor filters, real geometry, selection and export", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Explore the curve inventory 1333 shown",
    }),
  ).toBeVisible();
  await expect(
    page.locator(".leaflet-overlay-pane path").first(),
  ).toBeAttached();
  await page
    .getByRole("combobox", { name: "County filter" })
    .selectOption("Madison");
  await page
    .getByRole("combobox", { name: "Priority filter" })
    .selectOption("Higher");
  await expect(
    page.getByRole("heading", { name: "Explore the curve inventory 14 shown" }),
  ).toBeVisible();
  await expect(
    page.getByRole("complementary", { name: "Selected curve details" }),
  ).toContainText("Madison 6601");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export GeoJSON" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain(".geojson");
  await page
    .getByRole("textbox", { name: "Search roads or places" })
    .fill("nonexistent-xyz");
  await expect(
    page.getByRole("heading", { name: "No matching curves" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Explore the curve inventory 1333 shown",
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: test.info().outputPath("auditor-offline-basemap.png"),
    fullPage: true,
  });
});
test("selected audit preserves actual candidate and prints", async ({
  page,
}, info) => {
  await page.goto("/?view=report&candidate=CA-12742345-0-157");
  const report = page.getByRole("article");
  await expect(report).toContainText("Magnetic Drive");
  await expect(report).toContainText("91 m / 299 ft");
  await expect(report).toContainText("CA-12742345-0-157");
  await expect(
    report.getByRole("link", { name: "12742345", exact: true }),
  ).toHaveAttribute("href", "https://www.openstreetmap.org/way/12742345");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".report-controls")).toBeHidden();
  await expect(report).toBeVisible();
  if (info.project.name === "desktop")
    await page.pdf({
      path: info.outputPath("sample-audit.pdf"),
      format: "A4",
      printBackground: true,
    });
  await page.screenshot({
    path: info.outputPath("audit-print.png"),
    fullPage: true,
  });
});
test("physics scenario validates changes and missing data", async ({
  page,
}) => {
  await page.goto("/?view=physics");
  await expect(page.locator(".result-number")).toContainText("34.4");
  await page.getByRole("spinbutton").nth(0).fill("0");
  await expect(page.getByRole("alert")).toContainText("positive radius");
  await page.getByRole("spinbutton").nth(0).fill("300");
  await expect(page.locator(".result-number")).toContainText("48.6");
  await page.getByRole("spinbutton").nth(1).fill("");
  await expect(page.getByRole("alert")).toContainText("all three");
});
test("simulation moves, pauses, resets and requests one alert per run", async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as any).__speechCount = 0;
    Object.defineProperty(window, "speechSynthesis", {
      value: {
        cancel() {},
        speak(u: SpeechSynthesisUtterance) {
          (window as any).__speechCount++;
          setTimeout(() => u.onend?.(new Event("end") as any), 0);
        },
      },
    });
  });
  await page.clock.install();
  await page.goto("/?view=copilot");
  await expect(page.getByTestId("distance")).toHaveText("450");
  await page.getByRole("button", { name: "Start demo", exact: true }).click();
  await page.clock.runFor(1000);
  const moved = Number(await page.getByTestId("distance").innerText());
  expect(moved).toBeLessThan(450);
  expect(moved).toBeGreaterThan(390);
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  const paused = await page.getByTestId("distance").innerText();
  await page.clock.runFor(1000);
  await expect(page.getByTestId("distance")).toHaveText(paused);
  await page.getByRole("button", { name: "Reset demo" }).click();
  await expect(page.getByTestId("distance")).toHaveText("450");
  await page.getByRole("button", { name: "Start demo", exact: true }).click();
  await page.clock.runFor(13000);
  await expect(page.getByText("Curve ahead.", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as any).__speechCount)).toBe(1);
  await page.clock.runFor(15000);
  expect(await page.evaluate(() => (window as any).__speechCount)).toBe(1);
  await expect(page.getByTestId("distance")).toHaveText("0");
});
test("permission denials degrade gracefully without affecting demo", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "geolocation", {
      value: {
        watchPosition(_success: any, error: any) {
          queueMicrotask(() =>
            error({ message: "Permission denied", code: 1 }),
          );
          return 42;
        },
        clearWatch() {},
      },
    });
    Object.defineProperty(window, "DeviceMotionEvent", {
      value: class {
        static async requestPermission() {
          return "denied";
        }
      },
    });
  });
  await page.goto("/?view=copilot");
  await page.getByRole("button", { name: "Enable GPS diagnostics" }).click();
  await expect(
    page.getByText("Location unavailable: Permission denied"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Enable motion diagnostics" }).click();
  await expect(page.getByText("Sensor permission denied")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start demo", exact: true }),
  ).toBeEnabled();
});
