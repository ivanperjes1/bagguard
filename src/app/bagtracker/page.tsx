import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, SearchCheck } from "lucide-react";

import { AppShell } from "@/components/bagguard/AppShell";
import { LookupForm } from "@/components/bagguard/LookupForm";

export const metadata: Metadata = {
  title: "BagTracker",
  description: "Check a bag registration status by student identification number.",
};

export default function BagTrackerPage() {
  return (
    <AppShell active="/bagtracker">
      <main className="mx-auto w-full max-w-[1240px] px-4 pb-14 pt-8 sm:px-8 sm:pt-10">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors ease-out hover:text-foreground">
          <ArrowLeft size={14} /> Home
        </Link>
        <div className="mb-7 mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">Student services · 02</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">BagTracker</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Check whether a bag registration is approved, pending, or no longer active.</p>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground sm:self-auto">
            <BadgeCheck size={15} className="text-chart-2" /> Exact-number lookup only
          </div>
        </div>
        <LookupForm mode="public" />
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-muted/60 p-4 text-xs leading-5 text-muted-foreground">
          <SearchCheck size={16} className="mt-0.5 shrink-0 text-primary" />
          <p>BagTracker returns one exact match only. Gate authorization is performed separately by signed-in campus staff and depends on an approved, active record.</p>
        </div>
      </main>
    </AppShell>
  );
}
