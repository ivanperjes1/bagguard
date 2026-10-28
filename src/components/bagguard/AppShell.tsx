import Link from "next/link";
import {
  ArrowUpRight,
  ClipboardList,
  Home,
  ScanLine,
  SearchCheck,
  Shield,
} from "lucide-react";

const navigation = [
  { href: "/", label: "Home", icon: Home },
  { href: "/register", label: "Register bag", icon: ClipboardList },
  { href: "/bagtracker", label: "BagTracker", icon: SearchCheck },
  { href: "/scan", label: "Gate scan", icon: ScanLine },
  { href: "/report", label: "Reports", icon: ClipboardList },
];

interface AppShellProps {
  children: React.ReactNode;
  active?: string;
  staff?: boolean;
}

export function AppShell({ children, active, staff = false }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between gap-2 px-3 sm:min-h-20 sm:gap-6 sm:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-2.5 sm:gap-3" aria-label="AMA Lipa BagGuard home">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform duration-200 ease-out hover:scale-[1.04] sm:size-11">
              <Shield size={19} strokeWidth={1.8} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-bold tracking-tight sm:text-sm">AMA Lipa BagGuard</span>
              <span className="hidden truncate text-[11px] font-medium text-muted-foreground sm:block">AMA Computer College · Lipa Campus</span>
            </span>
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
            {navigation.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={active === href ? "page" : undefined}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ease-out ${
                  active === href
                    ? "bg-primary/8 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon size={15} strokeWidth={1.8} />
                {label}
              </Link>
            ))}
          </nav>

          <Link
            href={staff ? "/admin" : "/admin/login"}
            className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-2 text-xs font-semibold text-secondary-foreground transition-[transform,background-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:bg-secondary/90 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:gap-2 sm:px-3.5 sm:py-2.5 sm:text-sm"
          >
            <span className="hidden sm:inline">{staff ? "Staff console" : "Admin panel"}</span>
            <span className="sm:hidden">{staff ? "Console" : "Admin"}</span>
            <ArrowUpRight size={15} />
          </Link>
        </div>
        <nav aria-label="Mobile navigation" className="flex snap-x snap-mandatory gap-1 overflow-x-auto border-t border-border px-3 py-2 lg:hidden">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={active === href ? "page" : undefined}
              className={`inline-flex min-h-10 shrink-0 snap-start items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors duration-200 ease-out ${
                active === href ? "bg-primary/8 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon size={14} strokeWidth={1.8} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </header>
      {children}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-1 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>AMA Computer College – Lipa Campus</span>
          <span>Securing every campus entry, protecting every student asset.</span>
        </div>
      </footer>
    </div>
  );
}
