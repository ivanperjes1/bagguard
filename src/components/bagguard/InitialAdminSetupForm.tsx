"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, LoaderCircle, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { claimInitialLocalAdmin, isAdminBootstrapClaimed } from "@/lib/data-service";

export function InitialAdminSetupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [claimed, setClaimed] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    isAdminBootstrapClaimed()
      .then(setClaimed)
      .catch((statusError: unknown) => {
        setError(statusError instanceof Error ? statusError.message : "Setup could not be loaded.");
      })
      .finally(() => setLoading(false));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await claimInitialLocalAdmin({ fullName: name, email });
      setComplete(true);
      router.replace("/admin");
    } catch (setupError) {
      setError(setupError instanceof Error ? setupError.message : "Setup couldn’t be completed. Please try again.");
      setLoading(false);
    }
  }

  if (complete) {
    return (
      <div role="status" className="rounded-2xl border border-chart-2/30 bg-chart-2/10 p-6 sm:p-8">
        <CheckCircle2 className="text-chart-2" size={25} />
        <h2 className="mt-4 text-xl font-bold">Local administrator is ready</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">This browser can now review registrations, manage local staff roles, and view gate checks.</p>
        <Link href="/admin" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">Open the admin panel</Link>
      </div>
    );
  }

  if (loading) {
    return <div className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">Checking local setup…</div>;
  }

  if (claimed) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-bold">Local administrator already assigned</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Sign in with the administrator email on this browser to continue.</p>
        <Link href="/admin/login" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">Go to staff sign in</Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <Link href="/admin/login" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft size={14} /> Staff sign in</Link>
      <div className="mb-7 mt-6 flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground"><ShieldCheck size={20} /></span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">Local preview setup</p>
          <h2 className="mt-0.5 text-lg font-bold">Create the local administrator</h2>
        </div>
      </div>

      {error ? <p role="alert" className="mb-5 rounded-lg border border-destructive/25 bg-destructive/10 p-3 text-sm leading-5 text-destructive">{error}</p> : null}

      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">This creates an administrator for this browser only. It does not verify identity or protect records from other people using the device.</p>
        <label className="block space-y-2 text-sm font-semibold">Full name
          <Input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={120} autoComplete="name" className="h-12 rounded-lg bg-background px-3.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
        </label>
        <label className="block space-y-2 text-sm font-semibold">Email
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" className="h-12 rounded-lg bg-background px-3.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
        </label>
        <Button type="submit" disabled={loading} variant="secondary" className="min-h-12 w-full rounded-lg px-4 text-sm font-bold transition-colors ease-out">
          {loading ? <LoaderCircle className="animate-spin" size={17} /> : <ShieldCheck size={17} />}
          {loading ? "Please wait…" : "Set up local administrator"}
        </Button>
      </form>
    </div>
  );
}
