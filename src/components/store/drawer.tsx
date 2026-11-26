"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { lockScroll, unlockScroll } from "@/lib/scroll-lock";

/**
 * A sliding panel (bag, search, filters). Slides from the side on
 * computers and from the chosen edge on phones, locks page scrolling,
 * closes on Escape or a tap outside, and returns focus when closed.
 */
export default function Drawer({
  open,
  onClose,
  label,
  side = "end",
  children,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  side?: "end" | "bottom" | "top";
  children: ReactNode;
  className?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    lockScroll();
    const panel = panelRef.current;
    const focusFirst = window.setTimeout(() => {
      const target = panel?.querySelector<HTMLElement>("[data-autofocus]") ?? panel?.querySelector<HTMLElement>("button, a, input");
      target?.focus({ preventScroll: true });
    }, 60);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
      if (event.key === "Tab" && panel) {
        const focusable = Array.from(panel.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input, select, textarea")).filter((el) => el.offsetParent !== null);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(focusFirst);
      window.removeEventListener("keydown", onKey);
      unlockScroll();
      returnFocus.current?.focus?.({ preventScroll: true });
    };
  }, [open]);

  const position =
    side === "bottom"
      ? `inset-x-0 bottom-0 max-h-[88dvh] rounded-t-3xl ${open ? "translate-y-0" : "translate-y-full"}`
      : side === "top"
        ? `inset-x-0 top-0 max-h-[92dvh] rounded-b-3xl ${open ? "translate-y-0" : "-translate-y-full"}`
        : `inset-y-0 end-0 h-dvh w-full max-w-md ${open ? "translate-x-0" : "ltr:translate-x-full rtl:-translate-x-full"}`;

  return (
    <div className={`fixed inset-0 z-[60] ${open ? "visible" : "invisible delay-300"}`} aria-hidden={!open}>
      <div
        className={`absolute inset-0 bg-ink/45 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`absolute flex flex-col bg-cream shadow-pop transition-transform duration-[400ms] ease-[cubic-bezier(.2,.8,.2,1)] will-change-transform ${position} ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
