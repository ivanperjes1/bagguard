"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ScanLine, ShieldCheck, Camera, X } from "lucide-react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { AppShell } from "@/components/bagguard/AppShell";
import { LookupForm } from "@/components/bagguard/LookupForm";
import { getCurrentProfile, verifyAtGate } from "@/lib/data-service";
import type { VerificationResult } from "@/lib/bagguard-types";

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && window.matchMedia("(pointer: coarse)").matches)
  );
}

export function GateScanScreen() {
  const router = useRouter();

  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scanner state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const scanningRef = useRef(false); // prevent multiple simultaneous scans

  // Result
  const [scanResult, setScanResult] = useState<VerificationResult | null>(null);
  const [scanLoading, setScanLoading] = useState(false);

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

  // Camera + barcode scanner
  useEffect(() => {
    if (!scannerOpen) {
      // Stop everything
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

      // Prefer back camera on phones, front camera on laptops
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

      // Start continuous barcode reading
      try {
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromVideoElement(
          videoRef.current!,
          (result, error, controls) => {
            if (result && !scanningRef.current) {
              scanningRef.current = true;
              const text = result.getText().trim();
              if (text) {
                // Stop the scanner immediately so it doesn’t fire multiple times
                controls.stop();
                controlsRef.current = null;
                handleScan(text);
              }
            }
          }
        );
        controlsRef.current = controls;
      } catch (err) {
        console.error("Barcode scanner failed to start:", err);
        // Camera still works – user can type the USN manually
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
  }, [scannerOpen]);

  async function handleScan(usn: string) {
    if (!usn.trim()) return;

    setScanLoading(true);
    setScanResult(null);

    try {
      const result = await verifyAtGate({
        usn: usn.trim(),
        checkpointName: "Checkpoint 01",
      });
      setScanResult(result);
    } catch (err) {
      setScanResult({
        status: "error",
        registration: null,
        message:
          err instanceof Error
            ? err.message
            : "Lookup failed. Please try again.",
      });
    } finally {
      setScanLoading(false);
      setScannerOpen(false);
    }
  }

  const isAuthorized = scanResult?.status === "authorized";

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
              </p>
            </div>

            <div className="inline-flex items-center gap-2 self-start rounded-lg border border-chart-2/25 bg-chart-2/10 px-3 py-2 text-xs font-semibold text-chart-2 sm:self-auto">
              <ShieldCheck size={15} /> Local staff profile selected
            </div>
          </div>

          {/* Open Scanner Button */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground shadow-sm transition hover:opacity-90"
            >
              <Camera size={18} />
              Open scanner
            </button>
          </div>

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
                      {/* Scanning guide box */}
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="h-40 w-64 rounded-lg border-2 border-secondary/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                      </div>
                      {/* Hint text */}
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
                          const value = (e.target as HTMLInputElement).value.trim();
                          if (value) {
                            handleScan(value);
                          }
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

          {/* Loading */}
          {scanLoading && (
            <div className="mb-6 rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              Looking up bag registration…
            </div>
          )}

          {/* Scan Result */}
          {scanResult && (
            <div
              className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
                isAuthorized
                  ? "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400"
                  : "border-destructive/40 bg-destructive/10 text-destructive"
              }`}
            >
              {isAuthorized && scanResult.registration ? (
                <div>
                  <p className="font-semibold">✓ Authorized — registered bag found</p>
                  <p className="mt-1">
                    {scanResult.registration.studentName} · {scanResult.registration.usn} ·{" "}
                    {scanResult.registration.department}
                  </p>
                  {scanResult.registration.bagDescription && (
                    <p className="mt-1 text-xs opacity-80">
                      {scanResult.registration.bagDescription}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="font-semibold">
                    {scanResult.status === "unregistered"
                      ? "✗ Not registered"
                      : scanResult.status === "pending_approval"
                        ? "⏳ Pending approval"
                        : scanResult.status === "rejected"
                          ? "✗ Registration rejected"
                          : scanResult.status === "revoked"
                            ? "✗ Access revoked"
                            : scanResult.status === "inactive"
                              ? "✗ Inactive"
                              : "✗ Check failed"}
                  </p>
                  <p className="mt-1">{scanResult.message}</p>
                  {scanResult.registration && (
                    <p className="mt-1 text-xs opacity-80">
                      {scanResult.registration.studentName} · {scanResult.registration.usn}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Existing Lookup Form */}
          <LookupForm mode="gate" />

          <p className="mt-5 text-center text-[11px] text-muted-foreground">
            Each completed check is recorded with the selected local operator and checkpoint.
          </p>
        </main>
      ) : null}
    </AppShell>
  );
}