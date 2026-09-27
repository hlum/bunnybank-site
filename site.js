// Language choice and scroll reveals, shared by every page.
//
// English pages send visitors in Japan (or with Japanese as their first browser
// language) to /ja/ from a small script in <head>, before anything is drawn. Once
// someone picks a language with the switcher, that choice wins from then on.
(() => {
  for (const a of document.querySelectorAll("[data-lang]")) {
    a.addEventListener("click", () => {
      try { localStorage.setItem("bb-lang", a.dataset.lang); } catch {}
    });
  }

  // Light by default; dark only when picked here. The choice is applied in <head>
  // before anything is drawn, from the same "bb-theme" key.
  const html = document.documentElement;
  const meta = document.querySelector('meta[name="theme-color"]');
  const ja = html.lang === "ja";
  const paint = () => {
    const dark = html.dataset.theme === "dark";
    for (const b of document.querySelectorAll(".theme")) {
      b.setAttribute("aria-pressed", dark);
      b.setAttribute("aria-label", ja ? "ダークモード" : "Dark mode");
    }
    if (meta) meta.content = dark ? "#1D1713" : "#FBF5EA";
  };
  for (const b of document.querySelectorAll(".theme")) {
    b.addEventListener("click", () => {
      const dark = html.dataset.theme !== "dark";
      if (dark) html.dataset.theme = "dark"; else delete html.dataset.theme;
      try { localStorage.setItem("bb-theme", dark ? "dark" : "light"); } catch {}
      paint();
    });
  }
  paint();

  // Fade sections up as they arrive. Without IntersectionObserver, or under
  // Reduce Motion, everything is simply shown.
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    items.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }, { rootMargin: "0px 0px -10% 0px" });
  items.forEach((el) => io.observe(el));
})();
