import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, LockKeyhole } from "lucide-react";

import { AppShell } from "@/components/bagguard/AppShell";
import { RegistrationForm } from "@/components/bagguard/RegistrationForm";

export const metadata: Metadata = {
  title: "Register a Bag",
  description: "Submit a student bag registration for staff review at AMA Lipa Campus.",
};

export default function RegisterPage() {
  return (
    <AppShell active="/register">
      <main className="mx-auto w-full max-w-[1100px] px-4 pb-14 pt-8 sm:px-8 sm:pt-10">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors ease-out hover:text-foreground">
          <ArrowLeft size={14} /> Home
        </Link>
        <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,0.65fr)_minmax(0,1.35fr)] lg:gap-12">
          <section>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">Student services · 01</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Register your bag</h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">Send your bag details to campus staff for review. New entries are pending until an administrator approves them.</p>
            <div className="mt-7 space-y-3">
              <div className="flex gap-3 rounded-xl border border-border bg-card p-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent/20 text-foreground"><BadgeCheck size={17} /></span>
                <div>
                  <p className="text-sm font-semibold">One active record per USN</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Contact campus staff if your registered bag changes.</p>
                </div>
              </div>
              <div className="flex gap-3 rounded-xl border border-border bg-card p-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-primary"><LockKeyhole size={16} /></span>
                <div>
                  <p className="text-sm font-semibold">Review before authorization</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Submitting a form does not authorize campus entry.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center justify-between border-b border-border pb-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Registration details</p>
                <h2 className="mt-1 text-lg font-bold">Student and bag information</h2>
              </div>
              <span className="hidden rounded-md bg-muted px-2.5 py-1.5 font-mono text-xs font-semibold text-muted-foreground sm:inline">FORM · 01</span>
            </div>
            <RegistrationForm />
          </section>
        </div>
      </main>
    </AppShell>
  );
}
