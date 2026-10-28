import type { Metadata } from "next";
import { KeyRound } from "lucide-react";

import { AppShell } from "@/components/bagguard/AppShell";
import { AdminLoginForm } from "@/components/bagguard/AdminLoginForm";

export const metadata: Metadata = {
  title: "Staff Sign In",
  description: "Local preview staff access for AMA Lipa BagGuard.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = next?.startsWith("/") && !next.startsWith("//") ? next : "/scan";

  return (
    <AppShell>
      <main className="mx-auto grid min-h-[70vh] w-full max-w-[1080px] items-center gap-8 px-4 py-10 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden lg:block">
          <span className="grid size-12 place-items-center rounded-xl bg-secondary text-secondary-foreground"><KeyRound size={21} /></span>
          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">Campus security staff</p>
          <h1 className="mt-3 max-w-md text-4xl font-bold leading-tight tracking-tight">A clear record at every checkpoint.</h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">Use local preview accounts to review registrations, assign staff roles, and try gate verification. This browser-only mode does not provide real sign-in or protect records.</p>
        </section>
        <section className="mx-auto w-full max-w-[480px]">
          <div className="mb-5 lg:hidden">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">Campus security staff</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Staff sign in</h1>
          </div>
          <AdminLoginForm nextPath={nextPath} />
        </section>
      </main>
    </AppShell>
  );
}
