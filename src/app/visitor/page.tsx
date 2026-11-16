"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  IdCard,
  Loader2,
  Shield,
  UserPlus,
} from "lucide-react";

import { AppShell } from "@/components/bagguard/AppShell";
import { registerVisitorBag } from "./actions";

export default function VisitorBagsPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);

    startTransition(async () => {
      try {
        await registerVisitorBag(formData);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Something went wrong. Please try again.");
      }
    });
  }

  return (
    <AppShell active="/visitor">
      <main className="mx-auto w-full max-w-[1440px] px-4 pb-16 pt-6 sm:px-8 sm:pt-10">
        <div className="mb-8">
          <Link
            href="/"
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={14} />
            Back to services
          </Link>

          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-secondary/15 text-secondary">
              <UserPlus size={20} strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
                Temporary access
              </p>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Visitor bag registration
              </h1>
            </div>
          </div>

          <p className="mt-3 max-w-[62ch] text-sm leading-6 text-muted-foreground">
            Register bags belonging to campus visitors and guests. A unique
            barcode will be generated immediately after submission.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
            <form action={handleSubmit} className="space-y-7">
              {/* Visitor Information */}
              <div>
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em]">
                  <IdCard size={16} className="text-primary" />
                  Visitor information
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="visitor_full_name" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                      Full name <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="visitor_full_name"
                      name="visitor_full_name"
                      type="text"
                      required
                      placeholder="Juan Dela Cruz"
                      className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="visitor_contact" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                      Contact number / email <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="visitor_contact"
                      name="visitor_contact"
                      type="text"
                      required
                      placeholder="09XX XXX XXXX or email"
                      className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="id_presented" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                      ID presented
                    </label>
                    <input
                      id="id_presented"
                      name="id_presented"
                      type="text"
                      placeholder="Driver’s license, company ID, etc."
                      className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              {/* Host & Purpose */}
              <div>
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em]">
                  <Shield size={16} className="text-primary" />
                  Host & purpose
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="host_name" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                      Host name
                    </label>
                    <input
                      id="host_name"
                      name="host_name"
                      type="text"
                      placeholder="Name of the person being visited"
                      className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="host_student_id" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                      Host student / employee ID
                    </label>
                    <input
                      id="host_student_id"
                      name="host_student_id"
                      type="text"
                      placeholder="Optional"
                      className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="purpose" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                      Purpose of visit <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="purpose"
                      name="purpose"
                      type="text"
                      required
                      placeholder="Meeting, event, delivery, etc."
                      className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              {/* Bag Details */}
              <div>
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em]">
                  <Clock size={16} className="text-primary" />
                  Bag details & validity
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="bag_type" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                      Bag type
                    </label>
                    <select
                      id="bag_type"
                      name="bag_type"
                      className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select type</option>
                      <option value="backpack">Backpack</option>
                      <option value="tote">Tote / Handbag</option>
                      <option value="messenger">Messenger / Crossbody</option>
                      <option value="duffel">Duffel / Travel</option>
                      <option value="laptop">Laptop bag</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="bag_color" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                      Primary color
                    </label>
                    <input
                      id="bag_color"
                      name="bag_color"
                      type="text"
                      placeholder="Black, navy, gray..."
                      className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="bag_brand" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                      Brand (if any)
                    </label>
                    <input
                      id="bag_brand"
                      name="bag_brand"
                      type="text"
                      placeholder="Nike, Jansport, generic..."
                      className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="valid_until" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                      Valid until <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="valid_until"
                      name="valid_until"
                      type="datetime-local"
                      required
                      className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="bag_description" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                      Additional description
                    </label>
                    <textarea
                      id="bag_description"
                      name="bag_description"
                      rows={3}
                      placeholder="Any unique marks, stickers, size notes..."
                      className="w-full resize-none rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-muted-foreground">
                  A registration code + barcode will be generated immediately after submission.
                </p>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground shadow-sm transition hover:bg-secondary/90 disabled:opacity-60"
                >
                  {isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit visitor registration
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-sm font-bold">How visitor registration works</h3>
              <ol className="mt-4 space-y-4">
                <li className="flex gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-xs font-bold text-primary">1</span>
                  <div>
                    <p className="text-sm font-semibold">Submit details</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Provide visitor and bag information.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-xs font-bold text-primary">2</span>
                  <div>
                    <p className="text-sm font-semibold">Get your barcode</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">A unique code is generated instantly.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-xs font-bold text-primary">3</span>
                  <div>
                    <p className="text-sm font-semibold">Staff review + Gate</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Present the barcode at the gate after approval.</p>
                  </div>
                </li>
              </ol>
            </div>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}