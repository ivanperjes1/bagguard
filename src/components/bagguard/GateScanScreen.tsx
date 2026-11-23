"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScanLine, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/bagguard/AppShell";
import { LookupForm } from "@/components/bagguard/LookupForm";
import { getCurrentProfile } from "@/lib/data-service";

export function GateScanScreen() {
  const router = useRouter();

  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Staff access check
  useEffect(() => {
    getCurrentProfile()
      .then((profile) => {
        if (profile?.role === "admin" || profile?.role === "guard") {
          setAllowed(true);
        } else {
          router.replace("/admin/login?next=%2Fscan");
        }
      })
      .catch((profileError: unknown) => {
        setError(
          profileError instanceof Error
            ? profileError.message
            : "Local staff access could not be checked."
        );
      })
      .finally(() => setChecking(false));
  }, [router]);

  return (
    <AppShell active="/scan" staff>
      {checking ? (
        <main className="mx-auto w-full max-w-[1440px] px-4 py-16 text-center text-sm text-muted-foreground sm:px-8">
          Checking local staff access…
        </main>
      ) : error ? (
        <main className="mx-auto w-full max-w-[1440px] px-4 py-16 text-center text-sm text-destructive sm:px-8">
          {error}
        </main>
      ) : allowed ? (
        <main className="mx-auto w-full max-w-[1440px] px-4 pb-14 pt-8 sm:px-8 sm:pt-10">
          {/* Header */}
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">
                Security operations · Checkpoint 01
              </p>
              <h1 className="mt-3 flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Gate verification <ScanLine className="text-secondary" size={27} />
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                Confirm the bag’s current status before clearing it through the checkpoint.
                Scan with the R45 or type the USN — the field clears automatically after each check.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 self-start rounded-lg border border-chart-2/25 bg-chart-2/10 px-3 py-2 text-xs font-semibold text-chart-2 sm:self-auto">
              <ShieldCheck size={15} /> Local staff profile selected
            </div>
          </div>

          {/* LookupForm – result appears in the “Ready for verification” panel */}
          <LookupForm mode="gate" />

          <p className="mt-5 text-center text-[11px] text-muted-foreground">
            Each completed check is recorded with the selected local operator and checkpoint.
          </p>
        </main>
      ) : null}
    </AppShell>
  );
}