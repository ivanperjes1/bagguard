"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, ClipboardList, FilterX } from "lucide-react";

import { AppShell } from "@/components/bagguard/AppShell";
import { ReportsTable } from "@/components/bagguard/ReportsTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCurrentProfile, getReportPage } from "@/lib/data-service";
import { departments, registrationStatuses, type Department, type RegistrationStatus, type ReportPageData } from "@/lib/bagguard-types";

export function ReportsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState<Department | "">("");
  const [status, setStatus] = useState<RegistrationStatus | "">("");
  const [data, setData] = useState<ReportPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const profile = await getCurrentProfile();
      if (profile?.role !== "admin") {
        router.replace("/admin/login?next=%2Freport");
        return;
      }
      const report = await getReportPage({ query: "", department: "", status: "", page: 1 });
      if (active) setData(report);
    };
    load()
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Reports could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [router]);

  async function loadPage(page: number, nextQuery = query, nextDepartment = department, nextStatus = status) {
    setLoading(true);
    setError(null);
    try {
      const report = await getReportPage({ query: nextQuery, department: nextDepartment, status: nextStatus, page });
      setData(report);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Reports could not be loaded.");
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
    <AppShell active="/report" staff>
      <main className="mx-auto w-full max-w-[1440px] px-4 pb-14 pt-8 sm:px-8 sm:pt-10">
        <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors ease-out hover:text-foreground"><ArrowLeft size={14} /> Admin panel</Link>
        <div className="mb-7 mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">Staff reports · Records</p>
            <h1 className="mt-3 flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">Registration report <ClipboardList className="text-primary" size={25} /></h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Search and filter the registrations saved in this browser. Local preview access is not secured.</p>
          </div>
          <p className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground">{(data?.total ?? 0).toLocaleString("en-US")} matching records</p>
        </div>

        <form onSubmit={submitFilters} className="mb-5 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_220px_190px_auto_auto] lg:items-end">
          <label className="space-y-2 text-xs font-semibold">Search name or USN
            <Input value={query} onChange={(event) => setQuery(event.target.value)} maxLength={80} placeholder="Search student or student ID" className="h-10 rounded-lg bg-background px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
          </label>
          <label className="space-y-2 text-xs font-semibold">Department
            <Select value={department || "all"} onValueChange={(value) => setDepartment(value === "all" ? "" : value as Department)}>
              <SelectTrigger className="h-10 w-full rounded-lg bg-background px-3 text-sm font-normal"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All departments</SelectItem>{departments.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
            </Select>
          </label>
          <label className="space-y-2 text-xs font-semibold">Status
            <Select value={status || "all"} onValueChange={(value) => setStatus(value === "all" ? "" : value as RegistrationStatus)}>
              <SelectTrigger className="h-10 w-full rounded-lg bg-background px-3 text-sm font-normal"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All statuses</SelectItem>{registrationStatuses.map((item) => <SelectItem key={item} value={item}>{item.replaceAll("_", " ")}</SelectItem>)}</SelectContent>
            </Select>
          </label>
          <Button type="submit" disabled={loading} variant="secondary" className="h-10 rounded-lg px-4 text-xs font-bold">Apply filters</Button>
          <Button type="button" disabled={loading} onClick={() => { setQuery(""); setDepartment(""); setStatus(""); void loadPage(1, "", "", ""); }} variant="outline" className="h-10 rounded-lg px-4 text-xs font-semibold text-muted-foreground"><FilterX size={14} /> Reset</Button>
        </form>

        {error ? <p role="alert" className="mb-4 rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p> : null}
        {loading && !data ? <p className="py-10 text-center text-sm text-muted-foreground">Loading local registrations…</p> : data ? <ReportsTable rows={data.rows} /> : null}

        <nav aria-label="Registration report pages" className="mt-5 flex flex-wrap items-center justify-between gap-3">
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
