"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  CheckCircle2,
  CircleHelp,
  LoaderCircle,
  RotateCcw,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";

import { lookupBagByUsn, verifyAtGate } from "@/lib/data-service";
import { StatusBadge } from "@/components/bagguard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { VerificationResult } from "@/lib/bagguard-types";

interface LookupFormProps {
  mode: "public" | "gate";
  /** When set (e.g. from barcode scanner), auto-fills and verifies this USN */
  scannedUsn?: string | null;
  /** Called after a scanned USN has been consumed so the parent can clear it */
  onScannedUsnConsumed?: () => void;
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

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && window.matchMedia("(pointer: coarse)").matches)
  );
}

export function LookupForm({
  mode,
  scannedUsn = null,
  onScannedUsnConsumed,
}: LookupFormProps) {
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [usn, setUsn] = useState("");
  const [checkpoint, setCheckpoint] = useState("Main Gate");
  const inputRef = useRef<HTMLInputElement>(null);
  const isGate = mode === "gate";

  // Scanner state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const scanningRef = useRef(false);

  async function runCheck(nextUsn: string, nextCheckpoint: string) {
    setLoading(true);
    setResult(null);
    try {
      const next = isGate
        ? await verifyAtGate({ usn: nextUsn, checkpointName: nextCheckpoint })
        : await lookupBagByUsn(nextUsn);
      setResult(next);
    } catch (error) {
      setResult({
        status: "error",
        registration: null,
        message:
          error instanceof Error
            ? error.message
            : "We couldn’t complete that check. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  // When the camera scanner (or external scannedUsn prop) provides a USN, fill and verify
  useEffect(() => {
    if (!scannedUsn || !scannedUsn.trim()) return;

    const value = scannedUsn.trim().toUpperCase();
    setUsn(value);
    runCheck(value, checkpoint).finally(() => {
      onScannedUsnConsumed?.();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannedUsn]);

  // Camera + barcode scanner
  useEffect(() => {
    if (!scannerOpen) {
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setCameraError(null);
      scanningRef.current = false;
      return;
    }

    let cancelled = false;

    async function startCameraAndScanner() {
      setCameraError(null);
      scanningRef.current = false;

      if (!window.isSecureContext) {
        setCameraError("Camera only works on HTTPS or localhost.");
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("This browser does not support camera access.");
        return;
      }

      const mobile = isMobileDevice();

      const constraintsList: MediaStreamConstraints[] = mobile
        ? [
            { video: { facingMode: { exact: "environment" } }, audio: false },
            { video: { facingMode: "environment" }, audio: false },
            { video: true, audio: false },
            { video: { facingMode: "user" }, audio: false },
          ]
        : [
            { video: { facingMode: "user" }, audio: false },
            { video: true, audio: false },
            { video: { facingMode: "environment" }, audio: false },
          ];

      let lastError: unknown = null;
      let stream: MediaStream | null = null;

      for (const constraints of constraintsList) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch (err) {
          lastError = err;
        }
      }

      if (!stream) {
        let message = "Could not open the camera.";
        if (lastError instanceof DOMException) {
          if (lastError.name === "NotAllowedError") {
            message =
              "Camera permission was denied. Please allow camera access in the browser address bar and try again.";
          } else if (lastError.name === "NotFoundError") {
            message = "No camera was found on this device.";
          } else {
            message = `Camera error: ${lastError.message}`;
          }
        }
        setCameraError(message);
        return;
      }

      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      try {
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromVideoElement(
          videoRef.current!,
          (result, _error, controls) => {
            if (result && !scanningRef.current) {
              scanningRef.current = true;
              const text = result.getText().trim();
              if (text) {
                controls.stop();
                controlsRef.current = null;
                setScannerOpen(false);

                const value = text.toUpperCase();
                setUsn(value);
                runCheck(value, checkpoint);
              }
            }
          }
        );
        controlsRef.current = controls;
      } catch (err) {
        console.error("Barcode scanner failed to start:", err);
      }
    }

    startCameraAndScanner();

    return () => {
      cancelled = true;
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannerOpen]);

  function handleManualScan(value: string) {
    const text = value.trim();
    if (!text) return;
    setScannerOpen(false);
    const normalized = text.toUpperCase();
    setUsn(normalized);
    runCheck(normalized, checkpoint);
  }

  async function checkUsn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runCheck(usn, checkpoint);
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
            <h2 className="text-base font-bold">
              {isGate ? "Checkpoint lookup" : "Student identification number (USN)"}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isGate
                ? "Scan or type the student’s USN"
                : "Enter or scan the exact USN on the registration"}
            </p>
          </div>
        </div>

        {/* Open Scanner Button */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground shadow-sm transition hover:opacity-90"
          >
            <Camera size={18} />
            Open scanner
          </button>
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
          <p id="usn-help" className="text-xs text-muted-foreground">
            Spaces are ignored and letters are matched without case sensitivity.
          </p>

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
              {loading ? (
                <LoaderCircle className="animate-spin" size={17} />
              ) : (
                <ArrowRight size={16} />
              )}
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
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {isGate ? "Operator reminder" : "Privacy note"}
          </p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {isGate
              ? "Authorization requires an approved and active registration. A matching USN alone is never enough."
              : "This portal checks one exact USN and does not expose the campus registration list."}
          </p>
        </div>
      </section>

      <section
        aria-live="polite"
        aria-atomic="true"
        className="min-h-[320px] rounded-xl border border-border bg-card p-5 sm:p-7"
      >
        {result && ResultIcon ? (
          <div className="space-y-5">
            <div className={`rounded-xl border p-5 ${resultPanelByStatus[result.status]}`}>
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-card/80 text-foreground">
                  <ResultIcon size={23} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-base font-bold">
                      {result.message.split(" — ")[0]}
                    </p>
                    <StatusBadge status={result.status} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {result.message}
                  </p>
                </div>
              </div>
            </div>

            {result.registration ? (
              <div className="rounded-xl border border-border p-5">
                <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Registration details
                </p>
                <dl className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
                  <div className="min-w-0">
                    <dt className="text-xs text-muted-foreground">Student name</dt>
                    <dd className="mt-1 truncate text-sm font-semibold">
                      {result.registration.studentName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Student ID / USN</dt>
                    <dd className="mt-1 font-mono text-sm font-semibold">
                      {result.registration.usn}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Department</dt>
                    <dd className="mt-1 text-sm font-semibold">
                      {result.registration.department}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-muted-foreground">Bag description</dt>
                    <dd className="mt-1 text-sm leading-6">
                      {result.registration.bagDescription}
                    </dd>
                  </div>
                </dl>
                {result.registration.imageUrl ? (
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
            <h3 className="mt-4 text-base font-bold">
              {loading ? "Checking the record" : "Ready for verification"}
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              {loading
                ? "BagGuard is comparing this number with the current registration status."
                : isGate
                  ? "Enter a student number, open the scanner, or use a USB scanner. The result and timestamp will be recorded."
                  : "Enter a student number or open the scanner. A clear result appears here after you check a USN."}
            </p>
          </div>
        )}
      </section>

      {/* Scanner Modal */}
      {scannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md overflow-hidden rounded-xl bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-sm font-semibold">Scan student ID barcode</h2>
              <button
                type="button"
                onClick={() => setScannerOpen(false)}
                className="rounded-md p-1 hover:bg-muted"
                aria-label="Close scanner"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative aspect-[4/3] bg-black">
              {cameraError ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-sm text-white">
                  <p>{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setCameraError(null);
                      setScannerOpen(false);
                      setTimeout(() => setScannerOpen(true), 80);
                    }}
                    className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-40 w-64 rounded-lg border-2 border-secondary/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                  </div>
                  <div className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-xs text-white/90">
                    Align the barcode inside the box
                  </div>
                </>
              )}
            </div>

            <div className="space-y-3 p-4">
              <p className="text-center text-xs text-muted-foreground">
                Point the camera at the barcode. It will scan automatically.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Or type barcode / USN manually…"
                  className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-secondary"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleManualScan((e.target as HTMLInputElement).value);
                    }
                  }}
                />
                <button
                  type="button"
                  className="rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground"
                  onClick={() => setScannerOpen(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}