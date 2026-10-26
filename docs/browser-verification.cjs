const { chromium } = require("playwright");
const { spawn } = require("child_process");
const path = require("path");
const os = require("os");
(async () => {
  const server = spawn("python3", ["backend/server.py"], {
    cwd: path.resolve(__dirname, ".."),
    stdio: "ignore",
  });
  let browser;
  try {
    for (let i = 0; i < 30; i++) {
      try {
        await fetch("http://127.0.0.1:8000/api/health");
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 100));
      }
    }
    browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("http://127.0.0.1:8000");
      await page.getByText("24 / 24", { exact: true }).waitFor();
      if (
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        )
      )
        throw Error("Overflow at " + width);
      await page.screenshot({
        path: path.join(os.tmpdir(), `gridbricks-${width}.png`),
        fullPage: true,
      });
    }
    await page.locator("input[type=date]").fill("2026-01-31");
    await page.getByText("2026-02-01", { exact: true }).waitFor();
    await page.locator("input[type=time]").fill("00:00");
    await page.waitForResponse((r) => r.url().includes("cutoff=00:00"));
    await page.getByRole("heading", { name: "Audit the decision" }).waitFor();
    const csv = await page.request.get(
      "http://127.0.0.1:8000/api/export?date=2026-01-15&cutoff=09:00",
    );
    if ((await csv.text()).trim().split("\n").length !== 25)
      throw Error("CSV row count");
    const bad = await page.request.get(
      "http://127.0.0.1:8000/api/analysis?date=2026-02-02",
    );
    if (bad.status() !== 400) throw Error("Invalid date accepted");
    if (errors.length) throw Error(errors.join(";"));
    console.log(
      "PASS: widths320/390/1280, no horizontal body overflow, no JS errors, Jan31->Feb1, cutoff change, CSV24 rows, out-of-scope400",
    );
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
