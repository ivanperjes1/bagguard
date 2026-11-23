import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Flag,
  Search,
  Send,
} from "lucide-react";

import { AppShell } from "@/components/bagguard/AppShell";

export const metadata: Metadata = {
  title: "Report an Issue | AMA Lipa BagGuard",
  description:
    "Report a lost bag, suspicious item, or registration problem using your student USN.",
};

const issueTypes = [
  {
    value: "lost",
    label: "Lost bag",
    description: "My registered bag is missing or was stolen.",
  },
  {
    value: "suspicious",
    label: "Suspicious item / bag",
    description: "I saw an unregistered or suspicious bag on campus.",
  },
  {
    value: "registration",
    label: "Registration problem",
    description: "My bag was rejected, stuck in review, or has wrong details.",
  },
  {
    value: "other",
    label: "Other issue",
    description: "Something else related to bag registration or gate access.",
  },
];

export default function IssuePage() {
  return (
    <AppShell active="/issue">
      <main className="mx-auto w-full max-w-[1440px] px-4 pb-14 pt-6 sm:px-8 sm:pt-10">
        {/* Header */}
        <section className="mb-10 max-w-3xl">
          <Link
            href="/"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={16} />
            Back to services
          </Link>

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-destructive/25 bg-destructive/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.17em] text-destructive">
            <Flag size={12} strokeWidth={2.2} />
            Campus report
          </div>

          <h1 className="text-[clamp(1.9rem,4.2vw,3.1rem)] font-bold leading-[1.08] tracking-[-0.04em]">
            Report a bag issue
          </h1>
          <p className="mt-4 max-w-[58ch] text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
            Enter your student USN to look up your bag record, then describe the
            problem. Campus staff will follow up on lost bags, suspicious items,
            and registration issues.
          </p>
        </section>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:items-start">
          {/* Main form */}
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
            <form className="space-y-7">
              {/* USN Lookup */}
              <div>
                <label
                  htmlFor="usn"
                  className="mb-2 block text-sm font-semibold tracking-tight"
                >
                  Student USN
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search
                      className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      strokeWidth={1.8}
                    />
                    <input
                      id="usn"
                      name="usn"
                      type="text"
                      placeholder="e.g. 2021-12345"
                      autoComplete="off"
                      autoFocus
                      className="h-12 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm outline-none transition-[border-color,box-shadow] focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-muted px-5 text-sm font-semibold transition-colors hover:bg-muted/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <Search size={16} strokeWidth={1.9} />
                    Look up
                  </button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Use the same USN you used when registering the bag.
                </p>
              </div>

              {/* Issue type */}
              <div>
                <p className="mb-3 text-sm font-semibold tracking-tight">
                  What is the issue?
                </p>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {issueTypes.map((type) => (
                    <label
                      key={type.value}
                      className="group flex cursor-pointer gap-3 rounded-xl border border-border bg-background p-4 transition-[border-color,background-color] hover:border-primary/30 hover:bg-primary/[0.02] has-[:checked]:border-primary has-[:checked]:bg-primary/[0.04]"
                    >
                      <input
                        type="radio"
                        name="issueType"
                        value={type.value}
                        className="mt-1 size-4 shrink-0 accent-primary"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">
                          {type.label}
                        </span>
                        <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                          {type.description}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="details"
                  className="mb-2 block text-sm font-semibold tracking-tight"
                >
                  Details
                </label>
                <textarea
                  id="details"
                  name="details"
                  rows={5}
                  placeholder="Describe what happened, when you last saw the bag, any bag color/brand, or other helpful information…"
                  className="w-full resize-y rounded-lg border border-border bg-background px-4 py-3 text-sm leading-6 outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Contact (optional) */}
              <div>
                <label
                  htmlFor="contact"
                  className="mb-2 block text-sm font-semibold tracking-tight"
                >
                  Contact number{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </label>
                <input
                  id="contact"
                  name="contact"
                  type="tel"
                  placeholder="09XX XXX XXXX"
                  className="h-12 w-full rounded-lg border border-border bg-background px-4 text-sm outline-none transition-[border-color,box-shadow] focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Submit */}
              <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-muted-foreground">
                  False reports may be subject to campus policy.
                </p>
                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-destructive px-6 text-sm font-semibold text-destructive-foreground shadow-sm transition-[transform,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-destructive/90 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destructive"
                >
                  <Send size={16} strokeWidth={1.9} />
                  Submit report
                </button>
              </div>
            </form>
          </section>

          {/* Side panel */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-3 flex items-center gap-2.5">
                <div className="grid size-9 place-items-center rounded-lg bg-destructive/10 text-destructive">
                  <AlertTriangle size={18} strokeWidth={1.8} />
                </div>
                <h2 className="text-sm font-bold tracking-tight">
                  Before you report
                </h2>
              </div>
              <ul className="space-y-2.5 text-sm leading-6 text-muted-foreground">
                <li className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                  Check BagTracker first to see your current registration status.
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                  For lost bags, include color, brand, and any unique marks.
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                  Suspicious items should be reported immediately to security.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-muted/40 p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Quick links
              </p>
              <div className="mt-3 space-y-2">
                <Link
                  href="/bagtracker"
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-background"
                >
                  Check BagTracker
                  <span className="text-muted-foreground">→</span>
                </Link>
                <Link
                  href="/register"
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-background"
                >
                  Register a new bag
                  <span className="text-muted-foreground">→</span>
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}