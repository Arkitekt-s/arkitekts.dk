(() => {
  "use strict";
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.querySelector(".links");
  if (toggle && menu) {
    const setOpen = open => {
      menu.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", e => { if (e.key === "Escape") setOpen(false); });
    const media = window.matchMedia("(min-width: 701px)");
    if (media.addEventListener) media.addEventListener("change", e => { if (e.matches) setOpen(false); });
  }
  const year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());
})();
