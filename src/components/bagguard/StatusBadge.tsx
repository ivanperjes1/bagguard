import type { RegistrationStatus, ScanStatus } from "@/lib/bagguard-types";

type StatusValue = RegistrationStatus | ScanStatus;

interface StatusBadgeProps {
  status: StatusValue;
}

const labelByStatus: Record<StatusValue, string> = {
  pending: "Pending review",
  pending_approval: "Pending approval",
  approved: "Approved",
  authorized: "Authorized",
  rejected: "Not approved",
  revoked: "Revoked",
  inactive: "Inactive",
  archived: "Archived",
  unregistered: "Not registered",
  error: "System error",
};

const styleByStatus: Record<StatusValue, string> = {
  pending: "border-accent/40 bg-accent/15 text-foreground",
  pending_approval: "border-accent/40 bg-accent/15 text-foreground",
  approved: "border-chart-2/30 bg-chart-2/10 text-chart-2",
  authorized: "border-chart-2/30 bg-chart-2/10 text-chart-2",
  rejected: "border-destructive/25 bg-destructive/10 text-destructive",
  revoked: "border-destructive/25 bg-destructive/10 text-destructive",
  inactive: "border-muted-foreground/20 bg-muted text-muted-foreground",
  archived: "border-muted-foreground/20 bg-muted text-muted-foreground",
  unregistered: "border-destructive/25 bg-destructive/10 text-destructive",
  error: "border-destructive/25 bg-destructive/10 text-destructive",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold leading-none ${styleByStatus[status]}`}>
      <span className="mr-1.5 size-1.5 rounded-full bg-current" aria-hidden="true" />
      {labelByStatus[status]}
    </span>
  );
}
