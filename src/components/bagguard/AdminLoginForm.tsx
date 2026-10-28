"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LoaderCircle, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createLocalAccount, signInLocal } from "@/lib/data-service";

interface AdminLoginFormProps {
  nextPath: string;
}

export function AdminLoginForm({ nextPath }: AdminLoginFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      if (mode === "signup") {
        await createLocalAccount({ email, fullName: name });
        setMode("signin");
        setMessage("Your local preview account is created. Sign in with this email, then ask the BagGuard administrator to assign gate access.");
        return;
      }

      const profile = await signInLocal(email);
      if (profile?.role === "admin") {
        router.replace("/admin");
      } else if (profile?.role === "guard") {
        router.replace(nextPath === "/admin" ? "/scan" : nextPath);
      } else {
        setMessage("This local account doesn’t have administrator or guard access yet. Ask the BagGuard administrator on this browser to assign its role.");
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "We couldn’t sign you in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="mb-7 flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground"><ShieldCheck size={20} /></span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">Staff access</p>
          <h2 className="mt-0.5 text-lg font-bold">{mode === "signin" ? "Sign in to BagGuard" : "Create a staff account"}</h2>
        </div>
      </div>

      {message ? <p role="status" className="mb-5 rounded-lg border border-chart-2/25 bg-chart-2/10 p-3 text-sm leading-5">{message}</p> : null}
      {error ? <p role="alert" className="mb-5 rounded-lg border border-destructive/25 bg-destructive/10 p-3 text-sm leading-5 text-destructive">{error}</p> : null}

      <form onSubmit={submit} className="space-y-4">
        {mode === "signup" ? (
          <label className="block space-y-2 text-sm font-semibold">
            Full name
            <Input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={120} autoComplete="name" className="h-12 rounded-lg bg-background px-3.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
          </label>
        ) : null}
        <label className="block space-y-2 text-sm font-semibold">
          Work or campus email
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" className="h-12 rounded-lg bg-background px-3.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
        </label>
        <Button type="submit" disabled={loading} variant="secondary" className="min-h-12 w-full rounded-lg px-4 text-sm font-bold transition-colors ease-out">
          {loading ? <LoaderCircle className="animate-spin" size={17} /> : <ShieldCheck size={17} />}
          {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create staff account"}
        </Button>
      </form>

      <div className="mt-5 flex flex-col items-center gap-3 border-t border-border pt-5 text-center">
        <Button type="button" variant="link" size="sm" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); setMessage(null); }} className="h-auto text-xs font-semibold text-primary underline-offset-4">
          {mode === "signin" ? "Need an account? Create a staff account" : "Already have an account? Sign in"}
        </Button>
        <Link href="/admin/setup" className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">First administrator setup</Link>
      </div>
    </div>
  );
}
