import "server-only";

import { and, count, desc, eq, ilike, inArray, or } from "drizzle-orm";

import { db } from "@/db";
import {
  bagAdminAuditLogs,
  bagAdminBootstrap,
  bagRegistrations,
  bagScanLogs,
  bagguardProfiles,
  user,
} from "@/db/schema";
import { getUser, requireUser } from "@/lib/auth";
import type {
  AdminDashboardData,
  Department,
  RegistrationRecord,
  RegistrationStatus,
  ReportPageData,
  ScanLogRecord,
  ScanLogPageData,
  ScanStatus,
  StaffRecord,
  VerificationResult,
} from "@/lib/bagguard-types";

export function normalizeUsn(value: string): string {
  if (typeof value !== "string") {
    throw new Error("Enter a valid student identification number.");
  }
  return value.trim().replace(/\s+/g, "").toUpperCase();
}

export function toRegistrationRecord(row: typeof bagRegistrations.$inferSelect): RegistrationRecord {
  return {
    id: row.id,
    studentName: row.studentName,
    usn: row.usn,
    department: row.department,
    bagDescription: row.bagDescription,
    imageUrl: row.imageUrl,
    status: row.status,
    rejectionReason: row.rejectionReason,
    createdAt: row.createdAt.toISOString(),
    approvedAt: row.approvedAt?.toISOString() ?? null,
  };
}

export async function getBagRole() {
  const signedIn = await getUser();
  if (!signedIn) return null;
  const [profile] = await db
    .select({ role: bagguardProfiles.role })
    .from(bagguardProfiles)
    .where(eq(bagguardProfiles.id, signedIn.id))
    .limit(1);
  return profile?.role ?? null;
}

export async function isAdminBootstrapClaimed() {
  const [setup] = await db
    .select({ claimedBy: bagAdminBootstrap.claimedBy })
    .from(bagAdminBootstrap)
    .where(eq(bagAdminBootstrap.id, 1))
    .limit(1);
  return Boolean(setup?.claimedBy);
}

export async function getPublicBagCounts() {
  const [all, pending] = await Promise.all([
    db.select({ value: count() }).from(bagRegistrations),
    db
      .select({ value: count() })
      .from(bagRegistrations)
      .where(eq(bagRegistrations.status, "pending")),
  ]);

  return {
    registrations: all[0]?.value ?? 0,
    pending: pending[0]?.value ?? 0,
  };
}

export async function requireBagRole(allowGuard = false) {
  const signedIn = await requireUser();
  const [profile] = await db
    .select({ role: bagguardProfiles.role })
    .from(bagguardProfiles)
    .where(eq(bagguardProfiles.id, signedIn.id))
    .limit(1);

  if (
    !profile ||
    (profile.role !== "admin" && !(allowGuard && profile.role === "guard"))
  ) {
    throw new Error("You don’t have permission to access this part of BagGuard.");
  }

  return { user: signedIn, role: profile.role };
}

function statusMessage(status: ScanStatus): string {
  switch (status) {
    case "authorized":
      return "Authorized — this bag has an approved, active registration.";
    case "pending_approval":
      return "Pending approval — do not authorize this bag yet.";
    case "rejected":
      return "Registration was not approved.";
    case "revoked":
      return "Access revoked — this registration is no longer valid.";
    case "inactive":
      return "Inactive — this registration is not currently valid.";
    case "error":
      return "We couldn’t complete that check. Please try again.";
    default:
      return "Not registered — no matching bag registration was found.";
  }
}

function statusFromRegistration(status: RegistrationStatus): ScanStatus {
  if (status === "approved") return "authorized";
  if (status === "pending") return "pending_approval";
  if (status === "rejected") return "rejected";
  if (status === "revoked") return "revoked";
  return "inactive";
}

export async function lookupBagByUsn(usnInput: string): Promise<VerificationResult> {
  const usn = normalizeUsn(usnInput);
  const [row] = await db
    .select()
    .from(bagRegistrations)
    .where(eq(bagRegistrations.usn, usn))
    .limit(1);

  if (!row) {
    return {
      status: "unregistered",
      registration: null,
      message: statusMessage("unregistered"),
    };
  }

  const status = statusFromRegistration(row.status);
  return {
    status,
    registration: toRegistrationRecord(row),
    message: statusMessage(status),
  };
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  await requireBagRole();
  const [registrationCount, pendingCount, approvedCount, revokedCount, scanCount] =
    await Promise.all([
      db.select({ value: count() }).from(bagRegistrations),
      db
        .select({ value: count() })
        .from(bagRegistrations)
        .where(eq(bagRegistrations.status, "pending")),
      db
        .select({ value: count() })
        .from(bagRegistrations)
        .where(eq(bagRegistrations.status, "approved")),
      db
        .select({ value: count() })
        .from(bagRegistrations)
        .where(inArray(bagRegistrations.status, ["revoked", "inactive"])),
      db.select({ value: count() }).from(bagScanLogs),
    ]);

  const [pendingRows, approvedRows, logRows, staffRows, adminActionRows] = await Promise.all([
    db
      .select()
      .from(bagRegistrations)
      .where(eq(bagRegistrations.status, "pending"))
      .orderBy(desc(bagRegistrations.createdAt))
      .limit(8),
    db
      .select()
      .from(bagRegistrations)
      .where(eq(bagRegistrations.status, "approved"))
      .orderBy(desc(bagRegistrations.approvedAt))
      .limit(8),
    db
      .select({
        id: bagScanLogs.id,
        searchedUsn: bagScanLogs.searchedUsn,
        checkpointName: bagScanLogs.checkpointName,
        status: bagScanLogs.status,
        createdAt: bagScanLogs.createdAt,
        operatorName: user.name,
      })
      .from(bagScanLogs)
      .leftJoin(user, eq(bagScanLogs.operatorId, user.id))
      .orderBy(desc(bagScanLogs.createdAt))
      .limit(8),
    db
      .select({
        id: bagguardProfiles.id,
        fullName: bagguardProfiles.fullName,
        email: user.email,
        role: bagguardProfiles.role,
      })
      .from(bagguardProfiles)
      .innerJoin(user, eq(bagguardProfiles.id, user.id))
      .orderBy(desc(bagguardProfiles.createdAt))
      .limit(20),
    db
      .select({
        id: bagAdminAuditLogs.id,
        action: bagAdminAuditLogs.action,
        targetType: bagAdminAuditLogs.targetType,
        targetId: bagAdminAuditLogs.targetId,
        createdAt: bagAdminAuditLogs.createdAt,
        actorName: user.name,
      })
      .from(bagAdminAuditLogs)
      .leftJoin(user, eq(bagAdminAuditLogs.actorId, user.id))
      .orderBy(desc(bagAdminAuditLogs.createdAt))
      .limit(8),
  ]);

  const logs: ScanLogRecord[] = logRows.map((row) => ({
    id: row.id,
    searchedUsn: row.searchedUsn,
    checkpointName: row.checkpointName,
    operatorName: row.operatorName ?? "Former staff member",
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  }));

  const staff: StaffRecord[] = staffRows.map((row) => ({
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    role: row.role,
  }));

  return {
    stats: {
      registrations: registrationCount[0]?.value ?? 0,
      pending: pendingCount[0]?.value ?? 0,
      approved: approvedCount[0]?.value ?? 0,
      revoked: revokedCount[0]?.value ?? 0,
      scans: scanCount[0]?.value ?? 0,
    },
    pending: pendingRows.map(toRegistrationRecord),
    approved: approvedRows.map(toRegistrationRecord),
    logs,
    staff,
    adminActions: adminActionRows.map((row) => ({
      id: row.id,
      action: row.action,
      targetType: row.targetType,
      targetId: row.targetId,
      actorName: row.actorName ?? "Former staff member",
      createdAt: row.createdAt.toISOString(),
    })),
  };
}

export async function getReportPage(input: {
  query: string;
  department: Department | "";
  status: RegistrationStatus | "";
  page: number;
}): Promise<ReportPageData> {
  await requireBagRole();
  const pageSize = 25;
  const page = Math.max(1, Math.floor(input.page));
  const cleanQuery = input.query.trim().slice(0, 80).replace(/[\\%_]/g, "\\$&");
  const filters = [];

  if (cleanQuery) {
    const pattern = `%${cleanQuery}%`;
    filters.push(
      or(
        ilike(bagRegistrations.studentName, pattern),
        ilike(bagRegistrations.usn, pattern),
      )!,
    );
  }
  if (input.department) {
    filters.push(eq(bagRegistrations.department, input.department));
  }
  if (input.status) {
    filters.push(eq(bagRegistrations.status, input.status));
  }

  const where = filters.length ? and(...filters) : undefined;
  const [rows, totalRows] = await Promise.all([
    db
      .select()
      .from(bagRegistrations)
      .where(where)
      .orderBy(desc(bagRegistrations.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ value: count() }).from(bagRegistrations).where(where),
  ]);

  return {
    rows: rows.map(toRegistrationRecord),
    total: totalRows[0]?.value ?? 0,
    page,
    pageSize,
  };
}

export async function getScanLogPage(input: {
  query: string;
  status: ScanStatus | "";
  page: number;
}): Promise<ScanLogPageData> {
  await requireBagRole();
  const pageSize = 25;
  const page = Math.max(1, Math.floor(input.page));
  const cleanQuery = input.query.trim().slice(0, 80).replace(/[\\%_]/g, "\\$&");
  const filters = [];

  if (cleanQuery) {
    const pattern = `%${cleanQuery}%`;
    filters.push(
      or(
        ilike(bagScanLogs.searchedUsn, pattern),
        ilike(bagScanLogs.checkpointName, pattern),
      )!,
    );
  }
  if (input.status) filters.push(eq(bagScanLogs.status, input.status));

  const where = filters.length ? and(...filters) : undefined;
  const [rows, totalRows] = await Promise.all([
    db
      .select({
        id: bagScanLogs.id,
        searchedUsn: bagScanLogs.searchedUsn,
        checkpointName: bagScanLogs.checkpointName,
        status: bagScanLogs.status,
        createdAt: bagScanLogs.createdAt,
        operatorName: user.name,
      })
      .from(bagScanLogs)
      .leftJoin(user, eq(bagScanLogs.operatorId, user.id))
      .where(where)
      .orderBy(desc(bagScanLogs.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ value: count() }).from(bagScanLogs).where(where),
  ]);

  return {
    rows: rows.map((row) => ({
      id: row.id,
      searchedUsn: row.searchedUsn,
      checkpointName: row.checkpointName,
      operatorName: row.operatorName ?? "Former staff member",
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    })),
    total: totalRows[0]?.value ?? 0,
    page,
    pageSize,
  };
}

export async function getRecentAdminActions() {
  await requireBagRole();
  return db
    .select({
      id: bagAdminAuditLogs.id,
      action: bagAdminAuditLogs.action,
      targetType: bagAdminAuditLogs.targetType,
      targetId: bagAdminAuditLogs.targetId,
      createdAt: bagAdminAuditLogs.createdAt,
      actorName: user.name,
    })
    .from(bagAdminAuditLogs)
    .leftJoin(user, eq(bagAdminAuditLogs.actorId, user.id))
    .orderBy(desc(bagAdminAuditLogs.createdAt))
    .limit(30);
}
