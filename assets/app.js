(() => {
  "use strict";
  const toggle = document.querySelector(".mobile-toggle");
  const menu = document.getElementById("site-navigation");
  if (toggle && menu) {
    const setMenu = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
      menu.classList.toggle("is-open", open);
    };
    toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
    menu.querySelectorAll("a").forEach(link => link.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") { setMenu(false); }
    });
    window.matchMedia("(min-width: 761px)").addEventListener("change", event => {
      if (event.matches) setMenu(false);
    });
  }
  const year = document.getElementById("copyright-year");
  if (year) year.textContent = String(new Date().getFullYear());
})();