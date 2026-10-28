
export const departments = [
  "M1 - College",
  "M2 - SHS-AMA",
  "M3 - SHS-SASN",
] as const;

export type Department = (typeof departments)[number];

export const registrationStatuses = [
  "pending",
  "approved",
  "rejected",
  "revoked",
  "inactive",
  "archived",
] as const;

export type RegistrationStatus =
  (typeof registrationStatuses)[number];

export type ScanStatus =
  | "authorized"
  | "pending_approval"
  | "unregistered"
  | "rejected"
  | "revoked"
  | "inactive"
  | "error";

export interface RegistrationRecord {
  id: string;
  studentName: string;
  usn: string;
  department: Department;
  bagDescription: string;
  imageUrl: string | null;
  status: RegistrationStatus;
  rejectionReason: string | null;
  createdAt: string;
  approvedAt: string | null;
}

export interface VerificationResult {
  status: ScanStatus;
  registration: RegistrationRecord | null;
  message: string;
}

export interface ScanLogRecord {
  id: string;
  searchedUsn: string;
  checkpointName: string;
  operatorName: string;
  status: ScanStatus;
  createdAt: string;
}

export interface StaffRecord {
  id: string;
  fullName: string;
  email: string;
  role: "student" | "guard" | "admin";
}

export interface AdminActionRecord {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  actorName: string;
  createdAt: string;
  metadata?: Record<string, string | number>;
}

export interface AdminDashboardData {
  stats: {
    registrations: number;
    pending: number;
    approved: number;
    revoked: number;
    scans: number;
  };
  pending: RegistrationRecord[];
  approved: RegistrationRecord[];
  logs: ScanLogRecord[];
  staff: StaffRecord[];
  adminActions: AdminActionRecord[];
}

export interface ReportPageData {
  rows: RegistrationRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ScanLogPageData {
  rows: ScanLogRecord[];
  total: number;
  page: number;
  pageSize: number;
}
