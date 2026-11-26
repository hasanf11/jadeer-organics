"use client";

// Lock page scrolling while a drawer or full-screen menu is open, without
// the page jumping (keeps the scroll position on iPhone too).

let locks = 0;
let savedY = 0;

export function lockScroll() {
  locks += 1;
  if (locks > 1) return;
  savedY = window.scrollY;
  const body = document.body;
  const scrollbar = window.innerWidth - document.documentElement.clientWidth;
  document.documentElement.classList.add("scroll-locked");
  body.style.position = "fixed";
  body.style.top = `-${savedY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
  if (scrollbar > 0) body.style.paddingInlineEnd = `${scrollbar}px`;
}

export function unlockScroll() {
  if (locks === 0) return;
  locks -= 1;
  if (locks > 0) return;
  const body = document.body;
  document.documentElement.classList.remove("scroll-locked");
  body.style.position = "";
  body.style.top = "";
  body.style.left = "";
  body.style.right = "";
  body.style.width = "";
  body.style.paddingInlineEnd = "";
  window.scrollTo({ top: savedY, behavior: "instant" as ScrollBehavior });
}
