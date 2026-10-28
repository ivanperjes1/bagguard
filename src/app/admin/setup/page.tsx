import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";

import { AppShell } from "@/components/bagguard/AppShell";
import { InitialAdminSetupForm } from "@/components/bagguard/InitialAdminSetupForm";

export const metadata: Metadata = {
  title: "First Administrator Setup",
  description: "Local preview setup for the first AMA Lipa BagGuard administrator.",
};

export default function AdminSetupPage() {
  return (
    <AppShell>
      <main className="mx-auto grid min-h-[70vh] w-full max-w-[1000px] items-center gap-8 px-4 py-10 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
        <section>
          <span className="grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground"><ShieldCheck size={21} /></span>
          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">Owner setup · One time</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Set up the first administrator.</h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">Set up the first administrator for this browser preview. This local role is for testing only and does not verify identity or protect student records.</p>
        </section>
        <section>
          <InitialAdminSetupForm />
        </section>
      </main>
    </AppShell>
  );
}
