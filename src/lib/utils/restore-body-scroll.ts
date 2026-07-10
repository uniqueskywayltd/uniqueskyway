/**
 * Base UI sheets/dialogs can leave overflow:hidden on body after close on some mobile browsers.
 * Call after sheet closes and on dashboard mount to restore page scroll.
 */
export function restoreBodyScroll() {
  if (typeof document === "undefined") return;

  document.documentElement.style.removeProperty("overflow");
  document.documentElement.style.removeProperty("pointer-events");
  document.body.style.removeProperty("overflow");
  document.body.style.removeProperty("pointer-events");
  document.body.style.removeProperty("padding-right");
  document.body.removeAttribute("data-scroll-locked");
}
