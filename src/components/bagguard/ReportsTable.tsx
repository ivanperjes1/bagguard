"use client";

import { Download } from "lucide-react";

import { StatusBadge } from "@/components/bagguard/StatusBadge";
import { Button } from "@/components/ui/button";
import type { RegistrationRecord } from "@/lib/bagguard-types";

interface ReportsTableProps {
  rows: RegistrationRecord[];
}

function formatDate(value: string) {
  return `${value.slice(0, 10)} · ${value.slice(11, 16)} UTC`;
}

export function ReportsTable({ rows }: ReportsTableProps) {
  function exportPage() {
    const columns = ["Student name", "USN", "Department", "Bag description", "Status", "Submitted"];
    const records = rows.map((row) => [
      row.studentName,
      row.usn,
      row.department,
      row.bagDescription,
      row.status,
      row.createdAt,
    ]);
    const content = [columns, ...records]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "bagguard-report-page.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <p className="text-sm font-semibold">Matching registrations on this page</p>
        <Button type="button" disabled={!rows.length} onClick={exportPage} variant="outline" className="min-h-9 rounded-lg px-3 text-xs font-semibold transition-colors ease-out">
          <Download size={14} /> Export this page
        </Button>
      </div>
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] text-left text-sm">
            <thead className="bg-muted/60 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              <tr><th className="px-5 py-3">Student name</th><th className="px-5 py-3">USN</th><th className="px-5 py-3">Department</th><th className="px-5 py-3">Bag description</th><th className="px-5 py-3">Submitted</th><th className="px-5 py-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-muted/40">
                  <td className="px-5 py-4 font-semibold">{row.studentName}</td>
                  <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-semibold">{row.usn}</td>
                  <td className="px-5 py-4 text-xs">{row.department}</td>
                  <td className="max-w-[300px] px-5 py-4 text-xs leading-5 text-muted-foreground">{row.bagDescription}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-xs text-muted-foreground">{formatDate(row.createdAt)}</td>
                  <td className="px-5 py-4"><StatusBadge status={row.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-5 py-14 text-center">
          <p className="text-sm font-semibold">No registrations match these filters</p>
          <p className="mt-1 text-xs text-muted-foreground">Change the search or reset the filters to see more records.</p>
        </div>
      )}
    </section>
  );
}
