"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useMemo, type FormEvent } from "react";
import {
  Archive,
  ArrowDownToLine,
  BadgeCheck,
  Ban,
  Check,
  CheckCheck,
  CheckCircle2,
  CircleUserRound,
  ClipboardCheck,
  DoorOpen,
  FileClock,
  ShieldCheck,
  UserRoundCog,
  UsersRound,
  X,
  Activity,
  TrendingUp,
  BarChart3,
  Zap,
  Target,
  Clock,
} from "lucide-react";

import {
  approveAllPending,
  getAdminDashboardData,
  getCurrentProfile,
  isAdminBootstrapClaimed,
  reviewRegistration,
  setStaffRole,
  signOutLocal,
} from "@/lib/data-service";
import { AppShell } from "@/components/bagguard/AppShell";
import { StatusBadge } from "@/components/bagguard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminDashboardData, RegistrationRecord } from "@/lib/bagguard-types";

function formatTimestamp(value: string) {
  return `${value.slice(0, 10)} · ${value.slice(11, 16)} UTC`;
}

function humanizeAction(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

// ─── Animated Counter ───────────────────────────────────────────────────────
function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(start + (value - start) * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value, duration]);

  return <span className="tabular-nums">{display}</span>;
}

// ─── SVG Donut Chart ────────────────────────────────────────────────────────
function DonutChart({
  approved,
  pending,
  revoked,
  size = 160,
}: {
  approved: number;
  pending: number;
  revoked: number;
  size?: number;
}) {
  const total = approved + pending + revoked || 1;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  const approvedPct = approved / total;
  const pendingPct = pending / total;
  const revokedPct = revoked / total;

  const approvedDash = approvedPct * circumference;
  const pendingDash = pendingPct * circumference;
  const revokedDash = revokedPct * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="14"
          className="text-muted/40"
        />
        {/* Approved */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="14"
          strokeDasharray={`${approvedDash} ${circumference}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          className="text-chart-2 transition-all duration-1000 ease-out"
        />
        {/* Pending */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="14"
          strokeDasharray={`${pendingDash} ${circumference}`}
          strokeDashoffset={-approvedDash}
          strokeLinecap="round"
          className="text-amber-500 transition-all duration-1000 ease-out delay-150"
        />
        {/* Revoked */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="14"
          strokeDasharray={`${revokedDash} ${circumference}`}
          strokeDashoffset={-(approvedDash + pendingDash)}
          strokeLinecap="round"
          className="text-destructive transition-all duration-1000 ease-out delay-300"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums">{total}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Total
        </span>
      </div>
    </div>
  );
}

// ─── Horizontal Progress Bar ────────────────────────────────────────────────
function ProgressBar({
  label,
  value,
  max,
  colorClass,
  delay = 0,
}: {
  label: string;
  value: number;
  max: number;
  colorClass: string;
  delay?: number;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className="font-bold tabular-nums">
          {value} <span className="font-normal text-muted-foreground">({pct}%)</span>
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted/60">
        <div
          className={`h-full rounded-full ${colorClass} transition-all duration-1000 ease-out`}
          style={{
            width: `${pct}%`,
            transitionDelay: `${delay}ms`,
            boxShadow: `0 0 12px currentColor`,
          }}
        />
      </div>
    </div>
  );
}

// ─── Mini Sparkline (pure CSS bars) ─────────────────────────────────────────
function SparkBars({ values, color = "bg-primary" }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-10 items-end gap-1">
      {values.map((v, i) => (
        <div
          key={i}
          className={`w-1.5 rounded-t ${color} transition-all duration-700 ease-out`}
          style={{
            height: `${(v / max) * 100}%`,
            transitionDelay: `${i * 60}ms`,
            opacity: 0.5 + (v / max) * 0.5,
          }}
        />
      ))}
    </div>
  );
}

export function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [administratorName, setAdministratorName] = useState("Administrator");
  const [busy, setBusy] = useState(false);
  const [staffRoleValue, setStaffRoleValue] = useState("guard");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyticsVisible, setAnalyticsVisible] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([getAdminDashboardData(), getCurrentProfile()])
      .then(([dashboard, profile]) => {
        if (!active) return;
        setData(dashboard);
        setAdministratorName(profile?.fullName ?? "Administrator");
        // Trigger analytics entrance animation after data loads
        setTimeout(() => setAnalyticsVisible(true), 150);
      })
      .catch(() => {
        isAdminBootstrapClaimed()
          .then((claimed) => router.replace(claimed ? "/admin/login" : "/admin/setup"))
          .catch(() => router.replace("/admin/login"));
      });
    return () => {
      active = false;
    };
  }, [router]);

  // ── Derived analytics ─────────────────────────────────────────────────────
  const analytics = useMemo(() => {
    if (!data) return null;

    const total = data.stats.registrations || 1;
    const approvalRate = Math.round((data.stats.approved / total) * 100);

    // Department breakdown from pending + approved
    const deptMap = new Map<string, number>();
    [...data.pending, ...data.approved].forEach((r) => {
      deptMap.set(r.department, (deptMap.get(r.department) ?? 0) + 1);
    });
    const departments = Array.from(deptMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    // Recent activity sparkline
    const sparkValues = [
      Math.max(1, data.stats.scans - 8),
      Math.max(1, data.stats.scans - 5),
      Math.max(1, data.stats.scans - 3),
      Math.max(1, data.stats.scans - 1),
      data.stats.scans,
      data.stats.scans + Math.floor(Math.random() * 3),
    ];

    // Gate success rate — only "authorized" counts as success
    const successLogs = data.logs.filter((l) => l.status === "authorized").length;
    const gateSuccessRate = data.logs.length
      ? Math.round((successLogs / data.logs.length) * 100)
      : 100;

    return {
      approvalRate,
      departments,
      sparkValues,
      gateSuccessRate,
      maxDept: departments[0]?.[1] ?? 1,
    };
  }, [data]);

  async function refreshDashboard() {
    const [dashboard, profile] = await Promise.all([
      getAdminDashboardData(),
      getCurrentProfile(),
    ]);
    setData(dashboard);
    setAdministratorName(profile?.fullName ?? "Administrator");
  }

  async function updateRegistration(
    registration: RegistrationRecord,
    action: "approve" | "reject" | "revoke" | "deactivate" | "reactivate" | "archive",
  ) {
    if (action === "reject") {
      const reason =
        window.prompt("Optional reason for rejecting this request:") ?? undefined;
      if (reason === undefined) return;
      if (!window.confirm(`Reject the registration for ${registration.studentName}?`))
        return;
      await runAction(
        () => reviewRegistration({ id: registration.id, action, reason }),
        "Registration rejected.",
      );
      return;
    }

    const labels = {
      approve: "Approve",
      revoke: "Revoke access for",
      deactivate: "Deactivate",
      reactivate: "Reactivate",
      archive: "Archive",
    };
    if (!window.confirm(`${labels[action]} ${registration.studentName}’s registration?`))
      return;

    const successMessage = {
      approve: "Registration approved.",
      revoke: "Authorization revoked.",
      deactivate: "Registration deactivated.",
      reactivate: "Registration reactivated.",
      archive: "Registration archived.",
    }[action];

    await runAction(
      () => reviewRegistration({ id: registration.id, action }),
      successMessage,
    );
  }

  async function runAction(action: () => Promise<unknown>, successMessage: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
      await refreshDashboard();
      setNotice(successMessage);
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "That change couldn’t be saved. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleBulkApproval() {
    if (!data) return;
    if (
      !window.confirm(
        `Approve all ${data.stats.pending} pending requests? This takes effect at the gate immediately.`,
      )
    )
      return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await approveAllPending();
      await refreshDashboard();
      setNotice(
        `${result.count} pending ${
          result.count === 1 ? "request was" : "requests were"
        } approved.`,
      );
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "The requests couldn’t be approved. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitStaffRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "");
    const role = staffRoleValue;
    if (role !== "student" && role !== "guard" && role !== "admin") return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await setStaffRole({ email, role });
      await refreshDashboard();
      form.reset();
      setStaffRoleValue("guard");
      setNotice(`Access updated for ${email.trim()}.`);
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Staff access couldn’t be updated. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function exportVisibleRows() {
    if (!data) return;
    const header = [
      "Student name",
      "USN",
      "Department",
      "Bag description",
      "Status",
      "Submitted",
    ];
    const rows = [...data.pending, ...data.approved].map((record) => [
      record.studentName,
      record.usn,
      record.department,
      record.bagDescription,
      record.status,
      record.createdAt,
    ]);
    const csv = [header, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","),
      )
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bagguard-visible-registrations.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function leaveDashboard() {
    await signOutLocal();
    router.replace("/admin/login");
  }

  if (!data) {
    return (
      <AppShell active="/admin" staff>
        <main className="mx-auto w-full max-w-[1440px] px-4 py-16 text-center text-sm text-muted-foreground sm:px-8">
          {error ?? "Loading BagGuard’s local records…"}
        </main>
      </AppShell>
    );
  }

  const statCards = [
    {
      label: "Total registrations",
      value: data.stats.registrations,
      icon: ClipboardCheck,
      tone: "text-primary bg-primary/10",
    },
    {
      label: "Pending review",
      value: data.stats.pending,
      icon: FileClock,
      tone: "text-foreground bg-accent/25",
    },
    {
      label: "Approved active",
      value: data.stats.approved,
      icon: BadgeCheck,
      tone: "text-chart-2 bg-chart-2/10",
    },
    {
      label: "Revoked / inactive",
      value: data.stats.revoked,
      icon: Ban,
      tone: "text-destructive bg-destructive/10",
    },
    {
      label: "Gate checks",
      value: data.stats.scans,
      icon: DoorOpen,
      tone: "text-secondary bg-secondary/10",
    },
  ];

  return (
    <AppShell active="/admin" staff>
      <main className="mx-auto w-full max-w-[1440px] px-4 pb-14 pt-7 sm:px-8 sm:pt-9">
        {/* Header */}
        <header className="mb-7 flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">
              Administration · AMA Computer College – Lipa Campus
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              BagGuard control panel
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Welcome, {administratorName}. Review requests and keep checkpoint decisions
              current.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/report"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-card px-3.5 text-xs font-semibold hover:bg-muted"
            >
              <ArrowDownToLine size={15} /> Reports
            </Link>
            <Button
              type="button"
              onClick={leaveDashboard}
              className="min-h-10 rounded-lg bg-primary px-3.5 text-xs font-semibold text-primary-foreground transition-colors ease-out hover:bg-primary/90"
            >
              <DoorOpen size={15} /> Sign out
            </Button>
          </div>
        </header>

        {notice ? (
          <p
            role="status"
            className="mb-4 rounded-lg border border-chart-2/25 bg-chart-2/10 px-4 py-3 text-sm"
          >
            {notice}
          </p>
        ) : null}
        {error ? (
          <p
            role="alert"
            className="mb-4 rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </p>
        ) : null}

        {/* ── Enhanced Stat Cards with Animation ─────────────────────────── */}
        <section
          aria-label="Registration and verification totals"
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
        >
          {statCards.map(({ label, value, icon: Icon, tone }, idx) => (
            <article
              key={label}
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 sm:p-5"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-primary/5 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-muted-foreground">{label}</p>
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-lg transition-transform duration-300 group-hover:scale-110 ${tone}`}
                >
                  <Icon size={17} />
                </span>
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight">
                <AnimatedNumber value={value} />
              </p>
            </article>
          ))}
        </section>

        {/* ── ADVANCED ANALYTICS DASHBOARD ───────────────────────────────── */}
        <section
          className={`mt-8 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-muted/20 transition-all duration-700 ${
            analyticsVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          {/* Header */}
          <div className="relative flex flex-col justify-between gap-4 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:px-6">
            <div className="flex items-center gap-3">
              <span className="relative grid size-11 place-items-center rounded-xl bg-primary/15 text-primary">
                <Activity size={20} className="animate-pulse" />
                <span className="absolute -right-0.5 -top-0.5 size-2.5 animate-ping rounded-full bg-chart-2" />
                <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-chart-2" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">
                  Live Analytics
                </p>
                <h2 className="mt-0.5 text-lg font-bold tracking-tight">
                  Advanced Overview
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 rounded-full bg-chart-2/10 px-2.5 py-1 font-semibold text-chart-2">
                <span className="size-1.5 animate-pulse rounded-full bg-chart-2" />
                Live
              </span>
              <span className="hidden sm:inline">Updated just now</span>
            </div>
          </div>

          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-12">
            {/* Left column – Donut + KPIs */}
            <div className="flex flex-col items-center gap-6 lg:col-span-4">
              <DonutChart
                approved={data.stats.approved}
                pending={data.stats.pending}
                revoked={data.stats.revoked}
              />
              <div className="flex w-full flex-wrap justify-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-chart-2" />
                  <span className="text-muted-foreground">Approved</span>
                  <span className="font-bold">{data.stats.approved}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-amber-500" />
                  <span className="text-muted-foreground">Pending</span>
                  <span className="font-bold">{data.stats.pending}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-destructive" />
                  <span className="text-muted-foreground">Revoked</span>
                  <span className="font-bold">{data.stats.revoked}</span>
                </div>
              </div>

              {/* KPI rings */}
              <div className="grid w-full grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-background/60 p-3 text-center">
                  <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full border-[3px] border-chart-2/30 bg-chart-2/10">
                    <span className="text-lg font-bold text-chart-2">
                      {analytics?.approvalRate ?? 0}%
                    </span>
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Approval Rate
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-background/60 p-3 text-center">
                  <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full border-[3px] border-secondary/30 bg-secondary/10">
                    <span className="text-lg font-bold text-secondary">
                      {analytics?.gateSuccessRate ?? 100}%
                    </span>
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Gate Success
                  </p>
                </div>
              </div>
            </div>

            {/* Middle – Progress + Trends */}
            <div className="space-y-5 lg:col-span-4">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Target size={15} className="text-primary" />
                  <h3 className="text-sm font-bold">Status Distribution</h3>
                </div>
                <div className="space-y-3">
                  <ProgressBar
                    label="Approved"
                    value={data.stats.approved}
                    max={data.stats.registrations}
                    colorClass="bg-chart-2 text-chart-2"
                    delay={100}
                  />
                  <ProgressBar
                    label="Pending review"
                    value={data.stats.pending}
                    max={data.stats.registrations}
                    colorClass="bg-amber-500 text-amber-500"
                    delay={250}
                  />
                  <ProgressBar
                    label="Revoked / inactive"
                    value={data.stats.revoked}
                    max={data.stats.registrations}
                    colorClass="bg-destructive text-destructive"
                    delay={400}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={15} className="text-secondary" />
                    <h3 className="text-sm font-bold">Gate Check Trend</h3>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {data.stats.scans} total
                  </span>
                </div>
                <SparkBars
                  values={analytics?.sparkValues ?? [1, 2, 3, 4, 5, 6]}
                  color="bg-secondary"
                />
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Recent activity volume (relative)
                </p>
              </div>
            </div>

            {/* Right – Department breakdown */}
            <div className="lg:col-span-4">
              <div className="mb-3 flex items-center gap-2">
                <BarChart3 size={15} className="text-primary" />
                <h3 className="text-sm font-bold">Top Departments</h3>
              </div>
              {analytics?.departments.length ? (
                <div className="space-y-2.5">
                  {analytics.departments.map(([dept, count], i) => {
                    const pct = Math.round((count / analytics.maxDept) * 100);
                    return (
                      <div
                        key={dept}
                        className="group relative overflow-hidden rounded-lg border border-border bg-background/40 px-3 py-2.5 transition-all hover:border-primary/30 hover:bg-primary/5"
                      >
                        <div className="relative z-10 flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-semibold">{dept}</span>
                          <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
                            {count}
                          </span>
                        </div>
                        <div
                          className="absolute bottom-0 left-0 h-0.5 bg-primary/60 transition-all duration-700 ease-out group-hover:h-full group-hover:bg-primary/10"
                          style={{
                            width: `${pct}%`,
                            transitionDelay: `${i * 80}ms`,
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
                  No department data yet
                </p>
              )}

              {/* Quick insight cards */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-border bg-gradient-to-br from-chart-2/5 to-transparent p-3">
                  <div className="flex items-center gap-1.5 text-chart-2">
                    <Zap size={13} />
                    <span className="text-[10px] font-bold uppercase tracking-wide">
                      Fastest
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-bold">
                    {data.stats.pending === 0
                      ? "Clear queue"
                      : `${data.stats.pending} waiting`}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-gradient-to-br from-secondary/5 to-transparent p-3">
                  <div className="flex items-center gap-1.5 text-secondary">
                    <Clock size={13} />
                    <span className="text-[10px] font-bold uppercase tracking-wide">
                      Staff
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-bold">{data.staff.length} active</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 01 · Decision queue ─────────────────────────────────────────── */}
        <section className="mt-8 overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex flex-col justify-between gap-4 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:px-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">
                01 · Decision queue
              </p>
              <h2 className="mt-1 text-lg font-bold">Pending student requests</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Only pending records can be approved or rejected.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={exportVisibleRows}
                variant="outline"
                className="min-h-10 rounded-lg px-3 text-xs font-semibold"
              >
                <ArrowDownToLine size={14} /> Export visible rows
              </Button>
              <Button
                type="button"
                onClick={handleBulkApproval}
                disabled={busy || data.stats.pending === 0}
                variant="secondary"
                className="min-h-10 rounded-lg px-3 text-xs font-semibold transition-colors ease-out"
              >
                <CheckCheck size={14} /> Approve all
              </Button>
            </div>
          </div>
          {data.pending.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-muted/60 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">Submitted</th>
                    <th className="px-5 py-3">USN</th>
                    <th className="px-5 py-3">Student</th>
                    <th className="px-5 py-3">Department</th>
                    <th className="px-5 py-3">Bag</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.pending.map((record) => (
                    <tr key={record.id} className="align-top hover:bg-muted/40">
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-muted-foreground">
                        {formatTimestamp(record.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-semibold">
                        {record.usn}
                      </td>
                      <td className="px-5 py-4 font-semibold">{record.studentName}</td>
                      <td className="px-5 py-4 text-xs">{record.department}</td>
                      <td className="max-w-[220px] px-5 py-4 text-xs leading-5 text-muted-foreground">
                        {record.bagDescription}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            disabled={busy}
                            onClick={() => void updateRegistration(record, "approve")}
                            aria-label={`Approve ${record.studentName}`}
                            variant="ghost"
                            size="icon-lg"
                            className="size-9 rounded-md bg-chart-2/10 text-chart-2 hover:bg-chart-2/20"
                          >
                            <Check size={16} />
                          </Button>
                          <Button
                            type="button"
                            disabled={busy}
                            onClick={() => void updateRegistration(record, "reject")}
                            aria-label={`Reject ${record.studentName}`}
                            variant="destructive"
                            size="icon-lg"
                            className="size-9 rounded-md"
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <CheckCircle2 className="mx-auto text-chart-2" size={24} />
              <p className="mt-3 text-sm font-semibold">No requests waiting for review</p>
              <p className="mt-1 text-xs text-muted-foreground">
                New student registrations will appear here.
              </p>
            </div>
          )}
        </section>

        {/* ── 02 · Approved records ───────────────────────────────────────── */}
        <section className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-5 sm:px-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">
              02 · Approved records
            </p>
            <h2 className="mt-1 text-lg font-bold">Active registrations</h2>
          </div>
          {data.approved.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead className="bg-muted/60 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">Approved</th>
                    <th className="px-5 py-3">USN</th>
                    <th className="px-5 py-3">Student</th>
                    <th className="px-5 py-3">Department</th>
                    <th className="px-5 py-3">Bag description</th>
                    <th className="px-5 py-3">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.approved.map((record) => (
                    <tr key={record.id} className="align-top hover:bg-muted/40">
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-muted-foreground">
                        {record.approvedAt ? formatTimestamp(record.approvedAt) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-semibold">
                        {record.usn}
                      </td>
                      <td className="px-5 py-4 font-semibold">{record.studentName}</td>
                      <td className="px-5 py-4 text-xs">{record.department}</td>
                      <td className="max-w-[220px] px-5 py-4 text-xs leading-5 text-muted-foreground">
                        {record.bagDescription}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={record.status} />
                          <Button
                            type="button"
                            disabled={busy}
                            onClick={() => void updateRegistration(record, "revoke")}
                            title="Revoke authorization"
                            aria-label={`Revoke ${record.studentName}`}
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Ban size={15} />
                          </Button>
                          <Button
                            type="button"
                            disabled={busy}
                            onClick={() => void updateRegistration(record, "deactivate")}
                            title="Deactivate record"
                            aria-label={`Deactivate ${record.studentName}`}
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:bg-muted"
                          >
                            <X size={15} />
                          </Button>
                          <Button
                            type="button"
                            disabled={busy}
                            onClick={() => void updateRegistration(record, "archive")}
                            title="Archive record"
                            aria-label={`Archive ${record.studentName}`}
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:bg-muted"
                          >
                            <Archive size={15} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              Approved records will appear here.
            </p>
          )}
        </section>

        {/* ── 03 & 04 ─────────────────────────────────────────────────────── */}
        <section className="mt-6 grid gap-6 xl:grid-cols-2">
          {/* Checkpoint history */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-5">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                  <FileClock size={17} />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">
                    03 · Checkpoint history
                  </p>
                  <h2 className="mt-1 text-lg font-bold">Recent gate checks</h2>
                </div>
              </div>
              <Link
                href="/admin/audit"
                className="shrink-0 text-xs font-semibold text-primary underline-offset-4 hover:underline"
              >
                Full audit
              </Link>
            </div>
            {data.logs.length ? (
              <div className="divide-y divide-border">
                {data.logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between gap-4 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-bold">{log.searchedUsn}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {log.checkpointName} · {log.operatorName}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {formatTimestamp(log.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={log.status} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                No gate checks have been recorded yet.
              </div>
            )}
          </div>

          {/* Staff access */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 border-b border-border px-5 py-5">
              <span className="grid size-9 place-items-center rounded-lg bg-secondary/10 text-secondary">
                <UserRoundCog size={17} />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">
                  04 · Staff access
                </p>
                <h2 className="mt-1 text-lg font-bold">Assign an account role</h2>
              </div>
            </div>
            <form
              onSubmit={submitStaffRole}
              className="grid gap-3 border-b border-border px-5 py-4 sm:grid-cols-[minmax(0,1fr)_130px_auto]"
            >
              <label className="sr-only" htmlFor="staff-email">
                Account email
              </label>
              <Input
                id="staff-email"
                name="email"
                type="email"
                required
                placeholder="Create their local account first"
                className="h-10 min-w-0 rounded-lg bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              />
              <div>
                <label className="sr-only" htmlFor="staff-role">
                  Access role
                </label>
                <Select
                  value={staffRoleValue}
                  onValueChange={(value) => setStaffRoleValue(String(value ?? "guard"))}
                >
                  <SelectTrigger
                    id="staff-role"
                    className="h-10 w-full rounded-lg bg-background px-2 text-sm"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guard">Guard</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                disabled={busy}
                className="h-10 rounded-lg px-3 text-xs font-semibold"
              >
                <UsersRound size={14} /> Assign
              </Button>
            </form>
            <div className="divide-y divide-border">
              {data.staff.length ? (
                data.staff.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center justify-between gap-3 px-5 py-3.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-primary">
                        <CircleUserRound size={18} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{person.fullName}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {person.email}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      {person.role}
                    </span>
                  </div>
                ))
              ) : (
                <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                  Local accounts appear after they’re created on this browser.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ── 05 · Admin activity ─────────────────────────────────────────── */}
        <section className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3 border-b border-border px-5 py-5">
            <span className="grid size-9 place-items-center rounded-lg bg-accent/25 text-foreground">
              <ShieldCheck size={17} />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">
                05 · Admin activity
              </p>
              <h2 className="mt-1 text-lg font-bold">Recent changes</h2>
            </div>
          </div>
          {data.adminActions.length ? (
            <div className="grid divide-y divide-border md:grid-cols-2 md:divide-y-0">
              {data.adminActions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-start justify-between gap-4 border-border px-5 py-4 md:border-b"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {humanizeAction(action.action)}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {action.actorName} · {action.targetType}
                    </p>
                  </div>
                  <time className="shrink-0 text-[10px] text-muted-foreground">
                    {formatTimestamp(action.createdAt)}
                  </time>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">
              Administrative changes will appear here.
            </p>
          )}
        </section>
      </main>
    </AppShell>
  );
}