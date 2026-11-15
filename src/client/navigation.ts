const roles = ["Software Engineering", "Backend Systems", "Cloud & DevOps", "Applied AI"];

export function startNavigation() {
  const root = document.documentElement;
  const header = document.querySelector("[data-header]");
  const menu = document.querySelector<HTMLDetailsElement>(".mobile-nav");
  const toggle = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");
  const links = [...document.querySelectorAll<HTMLAnchorElement>("header nav a[href^='#']")];
  const chapters = [...document.querySelectorAll<HTMLElement>("[data-chapter]")];
  const systemTheme = matchMedia("(prefers-color-scheme: light)");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const role = document.querySelector<HTMLElement>("[data-role]");
  const environment = document.querySelector<HTMLElement>("[data-environment]");
  const canvas = environment?.querySelector<HTMLCanvasElement>("canvas");
  const views = [...document.querySelectorAll<HTMLElement>("[data-view]")];
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  const events = new AbortController();
  const { signal } = events;
  let current = "";
  let frame = 0;
  let roleTimer = 0;
  let roleIndex = 0;
  let length = roles[0].length;
  let deleting = true;
  let canLoadScene = false;
  let sceneAttempted = false;
  let disposed = false;
  let world: ReturnType<typeof import("./world").mountWorld> | undefined;
  let revealObserver: IntersectionObserver | undefined;

  const lightTheme = () => root.dataset.theme ? root.dataset.theme === "light" : systemTheme.matches;

  function syncNavigation() {
    frame = 0;
    header?.classList.toggle("scrolled", scrollY > 12);
    const end = document.documentElement.scrollHeight - innerHeight;
    const chapter = end > 0 && scrollY >= end - 2 ? chapters.at(-1)
      : chapters.findLast(item => item.getBoundingClientRect().top < innerHeight * .34);
    if (!chapter || chapter.id === current) return;
    current = chapter.id;
    for (const link of links) {
      if (link.hash === "#" + current) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
  }

  function onScroll() {
    if (!frame) frame = requestAnimationFrame(syncNavigation);
  }

  function advanceRole() {
    roleTimer = 0;
    if (!role) return;
    const text = roles[roleIndex];
    length += deleting ? -1 : 1;
    role.textContent = text.slice(0, length);
    let delay = deleting ? 33 : 62;
    if (deleting && length === 0) {
      deleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      delay = 210;
    } else if (!deleting && length === text.length) {
      deleting = true;
      delay = 1660;
    }
    roleTimer = window.setTimeout(advanceRole, delay);
  }

  function syncRole() {
    if (!role) return;
    clearTimeout(roleTimer);
    if (reducedMotion.matches) {
      roleIndex = 0;
      length = roles[0].length;
      deleting = true;
      role.textContent = roles[0];
    } else if (!document.hidden) roleTimer = window.setTimeout(advanceRole, 1650);
  }

  async function syncWorld() {
    const shouldRun = !lightTheme() && !reducedMotion.matches && !document.hidden;
    if (!shouldRun && reducedMotion.matches && environment) environment.dataset.renderer = "fallback";
    if (world) world.setRunning(shouldRun);
    if (!shouldRun || !canLoadScene || !environment || !canvas || sceneAttempted || connection?.saveData) return;
    sceneAttempted = true;
    try {
      const scene = await import("./world");
      if (disposed) return;
      world = scene.mountWorld(environment, canvas, views);
      world.setRunning(!lightTheme() && !reducedMotion.matches && !document.hidden);
    } catch {
      environment.dataset.renderer = "fallback";
    }
  }

  function setThemeButton() {
    const light = lightTheme();
    toggle?.setAttribute("aria-label", light ? "Switch to dark mode" : "Switch to light mode");
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", light ? "#f6f7fb" : "#0b0e14");
    void syncWorld();
  }

  function syncVisibility() {
    root.toggleAttribute("data-page-hidden", document.hidden);
    syncRole();
    void syncWorld();
  }

  function requestScene() {
    const allowScene = () => {
      canLoadScene = true;
      void syncWorld();
    };
    if ("requestIdleCallback" in window) window.requestIdleCallback(allowScene, { timeout: 600 });
    else setTimeout(allowScene, 160);
  }

  toggle?.addEventListener("click", () => {
    const next = lightTheme() ? "dark" : "light";
    root.dataset.theme = next;
    try { localStorage.setItem("portfolio-theme", next); } catch { /* Use the current document fallback. */ }
    setThemeButton();
  }, { signal });
  if (toggle) toggle.hidden = false;

  menu?.addEventListener("click", event => {
    const link = (event.target as Element).closest<HTMLAnchorElement>("a");
    if (!link) return;
    menu.open = false;
    const destination = chapters.find(chapter => "#" + chapter.id === link.hash);
    if (destination) {
      destination.tabIndex = -1;
      destination.focus({ preventScroll: true });
    }
  }, { signal });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && menu?.open) {
      menu.open = false;
      menu.querySelector("summary")?.focus();
    }
  }, { signal });

  if (!reducedMotion.matches && "IntersectionObserver" in window) {
    revealObserver = new IntersectionObserver(entries => {
      for (const { target, isIntersecting } of entries) {
        if (isIntersecting) {
          target.classList.add("reveal-visible");
          target.classList.remove("reveal-pending");
          revealObserver?.unobserve(target);
        }
      }
    }, { rootMargin: "0px 0px -30px 0px" });
    document.querySelectorAll("[data-reveal]").forEach(section => {
      if (section.getBoundingClientRect().top >= innerHeight) {
        section.classList.add("reveal-pending");
        revealObserver?.observe(section);
      }
    });
  }

  setThemeButton();
  syncNavigation();
  syncVisibility();
  addEventListener("scroll", onScroll, { passive: true, signal });
  addEventListener("resize", onScroll, { signal });
  systemTheme.addEventListener("change", setThemeButton, { signal });
  reducedMotion.addEventListener("change", syncVisibility, { signal });
  document.addEventListener("visibilitychange", syncVisibility, { signal });
  addEventListener("pagehide", event => {
    if (event.persisted) return;
    disposed = true;
    events.abort();
    clearTimeout(roleTimer);
    cancelAnimationFrame(frame);
    revealObserver?.disconnect();
    world?.dispose();
  }, { signal });
  if (document.readyState === "complete") requestScene();
  else addEventListener("load", requestScene, { once: true, signal });
}
