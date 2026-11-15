import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const sections = ["intro", "about", "experience", "projects", "skills", "education", "contact"];
const slugs = ["cloudops", "governed-rag", "stadium-ops", "legal-consistency", "utsavpilot"];
const environment = "[data-environment]";

async function cameraAt(page: Page, index: number) {
  await expect.poll(async () => {
    const pose = await page.locator(environment).getAttribute("data-camera");
    return pose === null ? -1 : Math.round(Number(pose) * (sections.length - 1));
  }, { timeout: 10000 }).toBe(index);
}

test("desktop Three.js camera follows all sections in both directions", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("response", response => {
    if (response.status() >= 400 && response.url().startsWith(new URL(page.url()).origin)) errors.push(response.url());
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Samikshit Sharma");
  await expect(page.locator(environment)).toHaveAttribute("data-renderer", "three", { timeout: 15000 });
  await expect(page.locator("[data-world]")).toHaveJSProperty("width", 1440);
  for (const [i, id] of sections.entries()) {
    await page.locator("#" + id).evaluate(node => node.scrollIntoView({ behavior: "instant" }));
    if (i > 0) {
      const active = page.locator('.desktop-nav a[href="#' + id + '"]');
      await expect(active).toHaveAttribute("aria-current", "location");
    }
    await cameraAt(page, i);
  }
  await page.locator("#about").evaluate(node => node.scrollIntoView({ behavior: "instant" }));
  await cameraAt(page, 1);
  expect(errors).toEqual([]);
});

test("desktop navigation, legacy fragments and reload", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#contact");
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await expect(nav.locator("[aria-current]")).toHaveAccessibleName("Contact");
  await expect(page.locator("[data-header]")).toHaveClass(/scrolled/);
  await nav.getByRole("link", { name: "About" }).click();
  await expect(page).toHaveURL(/#about$/);
  await expect(nav.locator("[aria-current]")).toHaveAccessibleName("About");
  await nav.getByRole("link", { name: "Projects" }).click();
  await expect(page).toHaveURL(/#projects$/);
  await expect(nav.locator("[aria-current]")).toHaveAccessibleName("Projects");
  await page.reload();
  await expect(nav.locator("[aria-current]")).toHaveAccessibleName("Projects");
  await page.goto("/#work");
  await expect(nav.locator("[aria-current]")).toHaveAccessibleName("Projects");
  await page.goto("/#capabilities");
  await expect(nav.locator("[aria-current]")).toHaveAccessibleName("Skills");
});

test("mobile keeps the live scene and supports keyboard menu dismissal", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(environment)).toHaveAttribute("data-renderer", "three", { timeout: 15000 });
  const menu = page.locator(".mobile-nav");
  const trigger = menu.locator("summary");
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(menu).toHaveAttribute("open", "");
  await page.keyboard.press("Escape");
  await expect(menu).not.toHaveAttribute("open", "");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "Education" }).click();
  await expect(page).toHaveURL(/#education$/);
  await expect(menu).not.toHaveAttribute("open", "");
  await expect(page.locator("#education")).toBeFocused();
  await cameraAt(page, 5);
  await expect(page.locator("#contact").getByRole("link", { name: /Connect on LinkedIn/ })).toHaveAttribute("href", /linkedin.com\/in\/samikshit-sharma/);
  const overview = page.getByRole("region", { name: "Portfolio overview" });
  await expect(overview.getByRole("link", { name: "5 Featured projects" })).toHaveAttribute("href", "#projects");
  await expect(overview.getByRole("link", { name: "5 Selected credentials" })).toHaveAttribute("href", "#education");
  await expect(overview.getByRole("link", { name: "3 PromptWars results" })).toHaveAttribute("href", "#achievements");
});

test("dark and light modes persist and pause and resume the world", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(environment)).toHaveAttribute("data-renderer", "three", { timeout: 15000 });
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator(".daybreak")).toBeVisible();
  await expect(page.locator("[data-world]")).toBeHidden();
  const position = await page.locator(environment).getAttribute("data-camera");
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Projects" }).click();
  await expect(page.getByRole("navigation", { name: "Main navigation" }).locator("[aria-current]")).toHaveText("Projects");
  await expect(page.locator(environment)).toHaveAttribute("data-camera", position ?? "");
  await page.reload();
  await expect(page.getByRole("button", { name: "Switch to dark mode" })).toBeVisible();
  await expect(page.locator(environment)).toHaveAttribute("data-renderer", "fallback");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.locator(environment)).toHaveAttribute("data-renderer", "three", { timeout: 15000 });
  await cameraAt(page, 3);
});

test("all five case studies, source evidence and return navigation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#projects");
  for (const slug of slugs) {
    await page.locator('.project-proof[href="/work/' + slug + '/"]').click();
    await expect(page.getByRole("heading", { name: "Problem and objective" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Architecture" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "My contribution" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Testing and verification" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Source evidence" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Scope and limitations" })).toBeVisible();
    await expect(page.locator(".case-evidence li a")).toHaveCount(4);
    await page.getByRole("link", { name: "Selected work" }).click();
    await expect(page).toHaveURL(/\/#projects$/);
  }
  await page.goto("/work/governed-rag/");
  await expect(page.getByRole("link", { name: /Next case study/ })).toHaveAttribute("href", "/work/stadium-ops/");
  expect((await page.goto("/work/missing/"))?.status()).toBe(404);
});

test("verified PromptWars results and credentials keep their exact values", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#achievements");
  const results = [
    ["legal-consistency", "#92 / 1,004", "97.5", [100, 100, 90, 90, 100, 100]],
    ["utsavpilot", "#693 / 52,136", "93.81", [86, 98, 80, 99, 96, 100]],
    ["stadium-ops", "#530 / 1,713", "91.28", [86, 98, 80, 98, 96, 93]],
  ] as const;
  for (const [slug, rank, score, breakdown] of results) {
    const card = page.locator("#result-" + slug);
    await expect(card.locator(".result-metrics dd")).toHaveText([rank, score + " / 100"]);
    await expect(card.getByRole("heading").getByRole("link")).toHaveAttribute("href", "/work/" + slug + "/");
    const disclosure = card.locator("summary");
    await disclosure.focus();
    await disclosure.press("Enter");
    await expect(card.locator("details")).toHaveAttribute("open", "");
    await expect(card.locator(".evaluation dd")).toHaveText(breakdown.map(String));
  }
  const credentials = page.locator(".credentials li");
  await expect(credentials.locator("strong")).toHaveText([
    "Oracle Cloud Infrastructure 2025 Certified Foundations Associate",
    "Oracle Cloud Infrastructure 2025 Certified AI Foundations Associate",
    "Cisco Network Management Systems",
    "Continuous Integration and Delivery - DevOps",
    "Professional Certification Program in Computer Science Engineering with Specialization in Cloud Computing",
  ]);
  await expect(credentials.locator("span")).toHaveText([
    "Oracle · May 2026", "Oracle · May 2026", "Cisco Networking Academy · February 2026",
    "Infosys Springboard · October 2025", "Issued 30 October 2026 · Certificate ID IPTIH2610159",
  ]);
  await expect(credentials.last()).toContainText("Certificate of Completion");
  await expect(credentials.last()).toContainText("Conducted by iHUB DivyaSampark at Indian Institute of Technology Roorkee, in association with Intellipaat.");
});

test("no horizontal overflow across desktop, tablet and mobile in both themes", async ({ page }) => {
  for (const colorScheme of ["dark", "light"] as const) {
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme });
    for (const width of [1440, 1024, 768, 390, 360]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ["/", "/work/legal-consistency/"]) {
        await page.goto(route);
        const dimensions = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
        expect(dimensions[0], colorScheme + " " + route + " at " + width + "px").toBe(dimensions[1]);
      }
    }
  }
});

test("reduced motion and data saver keep content and the still available", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#projects");
  await expect(page.locator(environment)).toHaveAttribute("data-renderer", "fallback");
  await expect(page.locator("[data-role]")).toHaveText("Software Engineering");
  await expect(page.getByRole("heading", { name: "Selected work." })).toBeVisible();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator(environment)).toHaveAttribute("data-renderer", "three", { timeout: 15000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(environment)).toHaveAttribute("data-renderer", "fallback");
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "connection", { value: { saveData: true } });
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { value() { throw new Error("Unexpected WebGL request"); } });
  });
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.reload();
  await expect(page.locator(environment)).toHaveAttribute("data-renderer", "fallback");
  expect(errors).toEqual([]);
});

test("WebGL startup failure leaves a working page and fallback asset", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { value: () => null });
  });
  const asset = page.waitForResponse(response => response.url().endsWith("night-still.webp"));
  await page.goto("/");
  expect((await asset).ok()).toBe(true);
  await expect(page.locator(environment)).toHaveAttribute("data-renderer", "fallback");
  await page.getByRole("link", { name: "View Projects" }).click();
  await expect(page).toHaveURL(/#projects$/);
});

test("WebGL context loss shows the still and restoration resumes motion", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(environment)).toHaveAttribute("data-renderer", "three", { timeout: 15000 });
  const canvas = page.locator("[data-world]");
  const extension = await canvas.evaluateHandle(node =>
    (node as HTMLCanvasElement).getContext("webgl2")?.getExtension("WEBGL_lose_context"));
  expect(await extension.evaluate(value => Boolean(value))).toBe(true);
  await extension.evaluate(value => value?.loseContext());
  await expect(page.locator(environment)).toHaveAttribute("data-renderer", "fallback");
  await extension.evaluate(value => value?.restoreContext());
  await expect(page.locator(environment)).toHaveAttribute("data-renderer", "three", { timeout: 15000 });
  await extension.dispose();
});

test("a missing fallback asset leaves content readable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/media/night-still.webp", route => route.abort());
  await page.goto("/");
  await expect(page.locator(environment)).toHaveAttribute("data-renderer", "fallback");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Contact" }).click();
  await expect(page).toHaveURL(/#contact$/);
});

test("skip link and axe checks of the desktop, mobile menu, light theme and case study", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  async function audit() {
    const scan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(scan.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) }))).toEqual([]);
  }
  await audit();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(".mobile-nav summary").click();
  await audit();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await audit();
  await page.goto("/work/cloudops/");
  await audit();
});

test("home and case-study routes work without JavaScript", async ({ browser, baseURL }) => {
  const page = await browser.newPage({ baseURL, javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  await page.goto("/");
  const trigger = page.locator(".mobile-nav summary");
  await trigger.click();
  const mobile = page.getByRole("navigation", { name: "Mobile navigation" });
  await expect(mobile).toBeVisible();
  await mobile.getByRole("link", { name: "Projects" }).click();
  await expect(page).toHaveURL(/#projects$/);
  await trigger.click();
  await page.locator(".project-proof").first().click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("CloudOps Autopilot");
  await page.close();
});
