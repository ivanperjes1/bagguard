"use client";

import Image from "next/image";
import { useRef, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  LoaderCircle,
  RotateCcw,
  Search,
  ShieldAlert,
} from "lucide-react";

import { lookupBagByUsn, verifyAtGate } from "@/lib/data-service";
import { StatusBadge } from "@/components/bagguard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { VerificationResult } from "@/lib/bagguard-types";

interface LookupFormProps {
  mode: "public" | "gate";
}

const iconByStatus = {
  authorized: CheckCircle2,
  pending_approval: AlertTriangle,
  unregistered: ShieldAlert,
  rejected: ShieldAlert,
  revoked: ShieldAlert,
  inactive: ShieldAlert,
  error: CircleHelp,
} as const;

const resultPanelByStatus: Record<VerificationResult["status"], string> = {
  authorized: "border-chart-2/30 bg-chart-2/10",
  pending_approval: "border-accent/50 bg-accent/15",
  unregistered: "border-destructive/30 bg-destructive/10",
  rejected: "border-destructive/30 bg-destructive/10",
  revoked: "border-destructive/30 bg-destructive/10",
  inactive: "border-border bg-muted",
  error: "border-border bg-muted",
};

export function LookupForm({ mode }: LookupFormProps) {
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [usn, setUsn] = useState("");
  const [checkpoint, setCheckpoint] = useState("Main Gate");
  const inputRef = useRef<HTMLInputElement>(null);
  const isGate = mode === "gate";

  async function checkUsn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const next = isGate
        ? await verifyAtGate({ usn, checkpointName: checkpoint })
        : await lookupBagByUsn(usn);
      setResult(next);
    } catch (error) {
      setResult({
        status: "error",
        registration: null,
        message: error instanceof Error ? error.message : "We couldn’t complete that check. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  function clearLookup() {
    setUsn("");
    setResult(null);
    inputRef.current?.focus();
  }

  const ResultIcon = result ? iconByStatus[result.status] : null;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <section className="rounded-xl border border-border bg-card p-5 sm:p-7">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-lg bg-primary text-primary-foreground">
            {isGate ? <ShieldAlert size={20} /> : <Search size={20} />}
          </span>
          <div>
            <h2 className="text-base font-bold">{isGate ? "Checkpoint lookup" : "Student identification number (USN)"}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{isGate ? "Scan or type the student’s USN" : "Enter the exact USN on the registration"}</p>
          </div>
        </div>

        <form onSubmit={checkUsn} className="space-y-4">
          <label className="block space-y-2 text-sm font-semibold">
            Student identification number (USN)
            <Input
              ref={inputRef}
              autoFocus={isGate}
              value={usn}
              onChange={(event) => setUsn(event.target.value.toUpperCase())}
              required
              minLength={5}
              maxLength={32}
              autoComplete="off"
              placeholder="e.g. 24-12345"
              aria-describedby="usn-help"
              className="h-14 rounded-lg bg-background px-4 font-mono text-lg font-semibold tracking-wide uppercase outline-none transition-shadow ease-out placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </label>
          <p id="usn-help" className="text-xs text-muted-foreground">Spaces are ignored and letters are matched without case sensitivity.</p>

          {isGate ? (
            <label className="block space-y-2 text-sm font-semibold">
              Checkpoint
              <Input
                value={checkpoint}
                onChange={(event) => setCheckpoint(event.target.value)}
                maxLength={80}
                className="h-11 rounded-lg bg-background px-3.5 text-sm font-normal outline-none transition-shadow ease-out focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </label>
          ) : null}

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={loading || usn.trim().length < 5}
              variant="secondary"
              className="min-h-12 flex-1 rounded-lg px-4 text-sm font-bold transition-colors ease-out"
            >
              {loading ? <LoaderCircle className="animate-spin" size={17} /> : <ArrowRight size={16} />}
              {loading ? "Checking…" : isGate ? "Verify bag" : "Check registration"}
            </Button>
            {isGate ? (
              <Button
                type="button"
                onClick={clearLookup}
                aria-label="Clear lookup"
                variant="outline"
                size="icon-lg"
                className="shrink-0 rounded-lg text-muted-foreground transition-colors ease-out"
              >
                <RotateCcw size={16} />
              </Button>
            ) : null}
          </div>
        </form>

        <div className="mt-7 border-t border-border pt-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{isGate ? "Operator reminder" : "Privacy note"}</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {isGate
              ? "Authorization requires an approved and active registration. A matching USN alone is never enough."
              : "This portal checks one exact USN and does not expose the campus registration list."}
          </p>
        </div>
      </section>

      <section aria-live="polite" aria-atomic="true" className="min-h-[320px] rounded-xl border border-border bg-card p-5 sm:p-7">
        {result && ResultIcon ? (
          <div className="space-y-5">
            <div className={`rounded-xl border p-5 ${resultPanelByStatus[result.status]}`}>
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-card/80 text-foreground">
                  <ResultIcon size={23} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-base font-bold">{result.message.split(" — ")[0]}</p>
                    <StatusBadge status={result.status} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{result.message}</p>
                </div>
              </div>
            </div>

            {result.registration ? (
              <div className="rounded-xl border border-border p-5">
                <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Registration details</p>
                <dl className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
                  <div className="min-w-0">
                    <dt className="text-xs text-muted-foreground">Student name</dt>
                    <dd className="mt-1 truncate text-sm font-semibold">{result.registration.studentName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Student ID / USN</dt>
                    <dd className="mt-1 font-mono text-sm font-semibold">{result.registration.usn}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Department</dt>
                    <dd className="mt-1 text-sm font-semibold">{result.registration.department}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-muted-foreground">Bag description</dt>
                    <dd className="mt-1 text-sm leading-6">{result.registration.bagDescription}</dd>
                  </div>
                </dl>
                {isGate && result.registration.imageUrl ? (
                  <div className="mt-5 overflow-hidden rounded-lg border border-border">
                    <Image
                      src={result.registration.imageUrl}
                      alt={`Registered bag for ${result.registration.studentName}`}
                      width={640}
                      height={420}
                      unoptimized
                      className="max-h-64 w-full object-cover"
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex min-h-[270px] flex-col items-center justify-center text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-muted text-primary">
              {isGate ? <ShieldAlert size={24} /> : <Search size={23} />}
            </span>
            <h3 className="mt-4 text-base font-bold">{loading ? "Checking the record" : "Ready for verification"}</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              {loading
                ? "BagGuard is comparing this number with the current registration status."
                : isGate
                  ? "Enter a student number or use a USB scanner. The result and timestamp will be recorded."
                  : "A clear result appears here after you check a student identification number."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
