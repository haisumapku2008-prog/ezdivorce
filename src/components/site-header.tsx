import Link from "next/link";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/interview", label: "Start Interview" },
  { href: "/forms", label: "Forms" },
  { href: "/checklist", label: "Filing Guide" },
  { href: "/dashboard", label: "Progress" },
  { href: "/admin", label: "Admin" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-sm text-white">
            DF
          </span>
          <span className="hidden sm:inline">Divorce Filing Assistant</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-2 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:px-3"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <p className="text-sm text-slate-500">
          Prototype only — not legal advice. Form requirements are determined by a rules engine, not AI.
          Consult a licensed attorney for legal guidance.
        </p>
      </div>
    </footer>
  );
}
