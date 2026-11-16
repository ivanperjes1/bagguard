"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Download,
  Home,
  QrCode,
} from "lucide-react";
import JsBarcode from "jsbarcode";

import { AppShell } from "@/components/bagguard/AppShell";

// Force Next.js to render this page dynamically at runtime (Fixes the build error)
export const dynamic = "force-dynamic";

function generateRegistrationCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "V-";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const fromQuery = searchParams.get("code");
    const finalCode = fromQuery?.trim() || generateRegistrationCode();
    setCode(finalCode);
  }, [searchParams]);

  useEffect(() => {
    if (!code || !barcodeRef.current) return;

    try {
      JsBarcode(barcodeRef.current, code, {
        format: "CODE128",
        lineColor: "#0f172a",
        width: 2.2,
        height: 84,
        displayValue: true,
        fontSize: 16,
        margin: 12,
        background: "#ffffff",
        textMargin: 8,
      });
    } catch (err) {
      console.error("Failed to render barcode:", err);
    }
  }, [code]);

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = code;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!barcodeRef.current || !code) return;

    const svg = barcodeRef.current;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      const padding = 32;
      canvas.width = img.width + padding * 2;
      canvas.height = img.height + padding * 2 + 40;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, padding, padding);

      ctx.fillStyle = "#64748b";
      ctx.font = "12px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        "AMA Lipa BagGuard • Visitor Registration",
        canvas.width / 2,
        canvas.height - 16
      );

      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `bagguard-visitor-${code}.png`;
      link.href = pngUrl;
      link.click();

      URL.revokeObjectURL(url);
    };

    img.src = url;
  };

  return (
    <main className="mx-auto w-full max-w-[640px] px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      {/* Success header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-emerald-500/15 text-emerald-600">
          <CheckCircle2 size={32} strokeWidth={1.8} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Registration submitted
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Your visitor bag record is pending staff review. Save the barcode
          below — you will need it at the campus gate once approved.
        </p>
      </div>

      {/* Barcode card */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <QrCode size={18} className="text-primary" />
            <span className="text-sm font-bold">Your registration code</span>
          </div>
          {code && (
            <span className="rounded-full bg-muted px-2.5 py-1 font-mono text-xs font-semibold tracking-wider">
              {code}
            </span>
          )}
        </div>

        {/* Barcode */}
        <div className="flex justify-center rounded-xl border border-border bg-white p-4">
          {code ? (
            <svg ref={barcodeRef} className="max-w-full" />
          ) : (
            <div className="flex h-28 w-full items-center justify-center text-sm text-muted-foreground">
              Generating barcode…
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleDownload}
            disabled={!code}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground shadow-sm transition hover:bg-secondary/90 disabled:opacity-50"
          >
            <Download size={16} />
            Save barcode to device
          </button>

          <button
            type="button"
            onClick={handleCopy}
            disabled={!code}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold transition hover:bg-muted disabled:opacity-50"
          >
            <Copy size={16} />
            {copied ? "Copied!" : "Copy code"}
          </button>
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
          Keep this barcode until your visit is complete. It becomes invalid
          after the stated validity period or if the registration is rejected.
        </p>
      </div>

      {/* Next steps */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-bold">What happens next?</h2>
        <ol className="mt-3 space-y-3 text-sm text-muted-foreground">
          <li className="flex gap-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-md bg-muted text-xs font-bold text-primary">
              1
            </span>
            <span>Campus staff will review your submission.</span>
          </li>
          <li className="flex gap-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-md bg-muted text-xs font-bold text-primary">
              2
            </span>
            <span>
              Once approved, present this barcode (or the code) at the gate.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-md bg-muted text-xs font-bold text-primary">
              3
            </span>
            <span>
              The record automatically expires after the validity period you
              selected.
            </span>
          </li>
        </ol>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          <Home size={16} />
          Back to home
        </Link>
        <Link
          href="/visitor"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold transition hover:bg-muted"
        >
          <ArrowLeft size={16} />
          Register another visitor
        </Link>
      </div>
    </main>
  );
}

export default function VisitorSuccessPage() {
  return (
    <AppShell active="/visitor">
      <Suspense fallback={<div className="p-12 text-center">Loading success details...</div>}>
        <SuccessPageContent />
      </Suspense>
    </AppShell>
  );
}