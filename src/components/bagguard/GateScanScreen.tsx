"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ScanLine, ShieldCheck, Camera, X } from "lucide-react";

import { AppShell } from "@/components/bagguard/AppShell";
import { LookupForm } from "@/components/bagguard/LookupForm";
import { getCurrentProfile } from "@/lib/data-service";

// Uses environment variable so it works on both localhost and Vercel
const API_BASE = process.env.NEXT_PUBLIC_SCAN_API_URL || "http://localhost:5000";

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

  // Result from Flask
  const [scanResult, setScanResult] = useState<any>(null);
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

  // Camera start / stop
  useEffect(() => {
    if (!scannerOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setCameraError(null);
      return;
    }

    async function startCamera() {
      setCameraError(null);

      if (!window.isSecureContext) {
        setCameraError("Camera only works on HTTPS or localhost.");
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("This browser does not support camera access.");
        return;
      }

      const constraintsList: MediaStreamConstraints[] = [
        { video: { facingMode: "user" }, audio: false },
        { video: true, audio: false },
        { video: { facingMode: "environment" }, audio: false },
      ];

      let lastError: unknown = null;

      for (const constraints of constraintsList) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          streamRef.current = stream;

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play().catch(() => {});
          }
          return;
        } catch (err) {
          lastError = err;
        }
      }

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
    }

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [scannerOpen]);

  // Call Flask API
  async function handleScan(usn: string) {
    if (!usn.trim()) return;

    setScanLoading(true);
    setScanResult(null);

    try {
      const res = await fetch(`${API_BASE}/api/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ usn: usn.trim() }),
      });

      const data = await res.json();
      setScanResult(data);
    } catch (err) {
      setScanResult({
        success: false,
        error: "Could not reach the scan server. Check if the Flask backend is running and NEXT_PUBLIC_SCAN_API_URL is set correctly.",
      });
    } finally {
      setScanLoading(false);
      setScannerOpen(false);
    }
  }

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

          {/* Scanner Modal – original design kept */}
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
                    </>
                  )}
                </div>

                <div className="space-y-3 p-4">
                  <p className="text-center text-xs text-muted-foreground">
                    Point the camera at the barcode on the student ID.
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
                scanResult.success
                  ? "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400"
                  : "border-destructive/40 bg-destructive/10 text-destructive"
              }`}
            >
              {scanResult.success ? (
                <div>
                  <p className="font-semibold">✓ Registered bag found</p>
                  <p className="mt-1">
                    {scanResult.student.student_name} · {scanResult.student.usn} ·{" "}
                    {scanResult.student.department}
                  </p>
                  {scanResult.student.bag_description && (
                    <p className="mt-1 text-xs opacity-80">
                      {scanResult.student.bag_description}
                    </p>
                  )}
                </div>
              ) : (
                <p>{scanResult.error}</p>
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