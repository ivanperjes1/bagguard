import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  ClipboardCheck,
  SearchCheck,
  ShieldCheck,
} from "lucide-react";

import { AppShell } from "@/components/bagguard/AppShell";

export const metadata: Metadata = {
  title: "AMA Lipa BagGuard | Campus Bag Registration",
  description:
    "Register student bags and verify campus gate access at AMA Computer College – Lipa Campus.",
};

const actions = [
  {
    href: "/register",
    number: "01",
    label: "Register bag",
    description: "Create a campus record for your everyday bag and send it for staff review.",
    icon: ClipboardCheck,
    tone: "border-l-secondary",
  },
  {
    href: "/bagtracker",
    number: "02",
    label: "BagTracker",
    description: "Check the current registration decision using a student identification number.",
    icon: SearchCheck,
    tone: "border-l-primary",
  },
  {
    href: "/scan",
    number: "03",
    label: "Gate scan",
    description: "Staff can verify an approved bag at the checkpoint and record each attempt.",
    icon: ShieldCheck,
    tone: "border-l-accent",
  },
];

const reviewSteps = [
  { number: "01", title: "Submit bag details", note: "Student registration" },
  { number: "02", title: "Wait for staff review", note: "Approval required" },
  { number: "03", title: "Verify at the gate", note: "Active record only" },
];

export default function Home() {
  return (
    <AppShell active="/">
      <main className="mx-auto w-full max-w-[1440px] px-4 pb-14 pt-6 sm:px-8 sm:pt-10">
        <section className="relative isolate overflow-hidden rounded-2xl bg-primary text-primary-foreground">
          <div className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-[42%] border-l border-primary-foreground/10 lg:block" aria-hidden="true">
            <div className="absolute inset-y-0 left-1/2 border-l border-primary-foreground/10" />
            <div className="absolute inset-x-0 top-1/2 border-t border-primary-foreground/10" />
            <div className="absolute right-8 top-7 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary-foreground/60">Lipa · Checkpoint 01</div>
          </div>
          <div className="grid gap-10 p-5 sm:p-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:items-center lg:gap-12 lg:p-11">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.17em] text-primary-foreground/80">
                <span className="size-1.5 rounded-full bg-accent" />
                Campus property registration
              </div>
              <h1 className="text-[clamp(2.35rem,5.3vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.045em] [text-wrap:balance]">
                A clear record for every bag entering campus.
              </h1>
              <p className="mt-5 max-w-[58ch] text-sm leading-6 text-primary-foreground/80 sm:text-base sm:leading-7">
                AMA Lipa BagGuard gives students a straightforward way to register bags and helps campus staff check current approvals at the gate.
              </p>
              <Link
                href="/register"
                className="mt-7 inline-flex min-h-12 items-center gap-3 rounded-lg bg-secondary px-5 py-3 text-sm font-semibold text-secondary-foreground shadow-sm transition-[transform,background-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:bg-secondary/90 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Start a registration <ArrowRight size={16} />
              </Link>
            </div>

            <aside className="relative rounded-xl border border-primary-foreground/15 bg-primary-foreground/[0.055] p-4 sm:p-5" aria-label="How bag registration works">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-primary-foreground/15 pb-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-primary-foreground/65">Review sequence</p>
                  <p className="mt-1 text-sm font-semibold">From registration to gate</p>
                </div>
                <BadgeCheck className="shrink-0 text-accent" size={19} strokeWidth={1.8} />
              </div>
              <ol className="space-y-1">
                {reviewSteps.map((step, index) => (
                  <li key={step.number} className="flex items-center gap-3 rounded-lg px-2 py-3 transition-colors duration-200 ease-out hover:bg-primary-foreground/[0.06]">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-primary-foreground/20 font-mono text-xs font-semibold text-accent">
                      {step.number}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{step.title}</span>
                      <span className="mt-0.5 block text-xs text-primary-foreground/65">{step.note}</span>
                    </span>
                    {index < reviewSteps.length - 1 ? (
                      <span className="hidden text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground/45 sm:block">Next</span>
                    ) : null}
                  </li>
                ))}
              </ol>
              <p className="mt-3 border-t border-primary-foreground/15 pt-3 text-xs leading-5 text-primary-foreground/70">
                A student ID or lookup result alone does not authorize campus entry.
              </p>
            </aside>
          </div>
        </section>

        <section className="mt-12 sm:mt-14" aria-labelledby="services-title">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">BagGuard services</p>
              <h2 id="services-title" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Choose where to continue.</h2>
            </div>
            <span className="text-xs font-medium text-muted-foreground">For students and campus staff</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
            {actions.map(({ href, number, label, description, icon: Icon, tone }) => (
              <Link
                key={href}
                href={href}
                className={`group min-w-0 rounded-xl border border-border border-l-4 ${tone} bg-card p-5 transition-[transform,border-color,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_12px_28px_-18px_var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:p-6`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-bold tabular-nums tracking-[0.15em] text-muted-foreground sm:text-[11px]">SERVICE {number}</span>
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-primary transition-[color,background-color,transform] duration-200 ease-out group-hover:scale-[1.04] group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon size={18} strokeWidth={1.8} />
                  </span>
                </div>
                <h3 className="mt-5 flex items-center justify-between gap-3 text-base font-bold tracking-tight sm:text-lg">
                  <span className="truncate">{label}</span>
                  <ArrowUpRight size={16} className="shrink-0 text-muted-foreground transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{description}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
