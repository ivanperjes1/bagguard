"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, FileClock, FilterX } from "lucide-react";

import { AppShell } from "@/components/bagguard/AppShell";
import { StatusBadge } from "@/components/bagguard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCurrentProfile, getScanLogPage } from "@/lib/data-service";
import type { ScanLogPageData, ScanStatus } from "@/lib/bagguard-types";

const scanStatuses: ScanStatus[] = ["authorized", "pending_approval", "unregistered", "rejected", "revoked", "inactive", "error"];

function formatTimestamp(value: string) {
  return `${value.slice(0, 10)} · ${value.slice(11, 16)} UTC`;
}

export function AuditScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ScanStatus | "">("");
  const [data, setData] = useState<ScanLogPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const profile = await getCurrentProfile();
      if (profile?.role !== "admin") {
        router.replace("/admin/login?next=%2Fadmin%2Faudit");
        return;
      }
      const logs = await getScanLogPage({ query: "", status: "", page: 1 });
      if (active) setData(logs);
    };
    load()
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Gate history could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [router]);

  async function loadPage(page: number, nextQuery = query, nextStatus = status) {
    setLoading(true);
    setError(null);
    try {
      setData(await getScanLogPage({ query: nextQuery, status: nextStatus, page }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Gate history could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadPage(1);
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <AppShell staff>
      <main className="mx-auto w-full max-w-[1440px] px-4 pb-14 pt-8 sm:px-8 sm:pt-10">
        <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors ease-out hover:text-foreground"><ArrowLeft size={14} /> Admin panel</Link>
        <div className="mb-7 mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">Staff audit · Checkpoint activity</p>
            <h1 className="mt-3 flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">Gate verification history <FileClock className="text-primary" size={25} /></h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Every local gate check is recorded, including unknown and denied USNs. This preview history stays in this browser.</p>
          </div>
          <p className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground">{(data?.total ?? 0).toLocaleString("en-US")} recorded checks</p>
        </div>

        <form onSubmit={submitFilters} className="mb-5 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_220px_auto_auto] lg:items-end">
          <label className="space-y-2 text-xs font-semibold">Search USN, checkpoint, or operator
            <Input value={query} onChange={(event) => setQuery(event.target.value)} maxLength={80} placeholder="Enter a student ID or checkpoint" className="h-10 rounded-lg bg-background px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
          </label>
          <label className="space-y-2 text-xs font-semibold">Result
            <Select value={status || "all"} onValueChange={(value) => setStatus(value === "all" ? "" : value as ScanStatus)}>
              <SelectTrigger className="h-10 w-full rounded-lg bg-background px-3 text-sm font-normal"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All results</SelectItem>{scanStatuses.map((item) => <SelectItem key={item} value={item}>{item.replaceAll("_", " ")}</SelectItem>)}</SelectContent>
            </Select>
          </label>
          <Button type="submit" disabled={loading} variant="secondary" className="h-10 rounded-lg px-4 text-xs font-bold">Apply filters</Button>
          <Button type="button" disabled={loading} onClick={() => { setQuery(""); setStatus(""); void loadPage(1, "", ""); }} variant="outline" className="h-10 rounded-lg px-4 text-xs font-semibold text-muted-foreground"><FilterX size={14} /> Reset</Button>
        </form>

        {error ? <p role="alert" className="mb-4 rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p> : null}
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          {data?.rows.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-muted/60 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  <tr><th className="px-5 py-3">Timestamp</th><th className="px-5 py-3">USN</th><th className="px-5 py-3">Checkpoint</th><th className="px-5 py-3">Operator</th><th className="px-5 py-3">Result</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.rows.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/40">
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-muted-foreground">{formatTimestamp(row.createdAt)}</td>
                      <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-semibold">{row.searchedUsn}</td>
                      <td className="px-5 py-4 text-sm">{row.checkpointName}</td>
                      <td className="px-5 py-4 text-sm">{row.operatorName}</td>
                      <td className="px-5 py-4"><StatusBadge status={row.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 py-14 text-center">
              <p className="text-sm font-semibold">{loading ? "Loading gate history…" : "No gate checks match those filters"}</p>
              <p className="mt-1 text-xs text-muted-foreground">Completed staff checks will appear here.</p>
            </div>
          )}
        </section>

        <nav aria-label="Gate audit pages" className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Page {data ? Math.min(data.page, totalPages) : 1} of {totalPages} · {data?.pageSize ?? 25} records per page</p>
          <div className="flex items-center gap-2">
            <Button type="button" disabled={!data || data.page <= 1 || loading} onClick={() => data && void loadPage(data.page - 1)} variant="outline" className="h-10 rounded-lg px-3 text-xs font-semibold"><ChevronLeft size={15} /> Previous</Button>
            <Button type="button" disabled={!data || data.page >= totalPages || loading} onClick={() => data && void loadPage(data.page + 1)} variant="outline" className="h-10 rounded-lg px-3 text-xs font-semibold">Next <ChevronRight size={15} /></Button>
          </div>
        </nav>
      </main>
    </AppShell>
  );
}
