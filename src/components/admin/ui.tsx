import type { ReactNode } from "react";
import { PiTray } from "react-icons/pi";

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
}: {
  title: string;
  description?: ReactNode;
  eyebrow?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-1 font-display text-3xl md:text-4xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Pill({ children, color, bg }: { children: ReactNode; color: string; bg: string }) {
  return (
    <span className="chip" style={{ color, background: bg }}>
      {children}
    </span>
  );
}

export function Panel({ title, children, actions, className = "" }: { title?: ReactNode; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-3xl border border-line bg-white p-4 md:p-6 ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="font-display text-xl">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Empty({ title, text }: { title: string; text?: string }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-line bg-white/60 p-10 text-center">
      <PiTray size={32} className="mx-auto text-ink-soft" aria-hidden="true" />
      <p className="mt-3 font-display text-xl">{title}</p>
      {text && <p className="mt-1 text-ink-soft">{text}</p>}
    </div>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-line bg-white">
      <table className="w-full min-w-[640px] text-left text-sm [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3 [&_th]:text-xs [&_th]:font-bold [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-ink-soft [&_thead]:bg-cream [&_tbody_tr]:border-t [&_tbody_tr]:border-line [&_tbody_tr:hover]:bg-cream/50">
        {children}
      </table>
    </div>
  );
}
