'use client';

import type {
  AdminActionRecord,
  AdminDashboardData,
  Department,
  RegistrationRecord,
  RegistrationStatus,
  ReportPageData,
  ScanLogPageData,
  ScanLogRecord,
  ScanStatus,
  StaffRecord,
  VerificationResult,
} from '@/lib/bagguard-types';
import { createClient } from '@/lib/supabase-browser';

const pageSize = 25;
const SESSION_KEY = 'ama-lipa-bagguard.session.v1';

type StaffRole = StaffRecord['role'];
type ReviewAction = 'approve' | 'reject' | 'revoke' | 'deactivate' | 'reactivate' | 'archive';

interface RegisterBagInput {
  studentName: string;
  usn: string;
  department: Department;
  bagDescription: string;
  imageUrl: string | null;
}

interface VerifyAtGateInput {
  usn: string;
  checkpointName: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSupabase() {
  return createClient();
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeEmail(value: string): string {
  if (typeof value !== 'string') throw new Error('Enter a valid email address.');
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error('Enter a valid email address.');
  }
  return email;
}

export function normalizeUsn(value: string): string {
  if (typeof value !== 'string') throw new Error('Enter a valid student identification number.');
  const usn = value.trim().replace(/\s+/g, '').toUpperCase();
  if (usn.length < 5 || usn.length > 32 || !/^[A-Z0-9-]+$/.test(usn)) {
    throw new Error('Enter a valid student identification number.');
  }
  return usn;
}

function statusFromRegistration(status: RegistrationStatus): ScanStatus {
  if (status === 'approved') return 'authorized';
  if (status === 'pending') return 'pending_approval';
  if (status === 'rejected') return 'rejected';
  if (status === 'revoked') return 'revoked';
  return 'inactive';
}

function statusMessage(status: ScanStatus): string {
  switch (status) {
    case 'authorized':
      return 'Authorized — this bag has an approved, active registration.';
    case 'pending_approval':
      return 'Pending approval — do not authorize this bag yet.';
    case 'rejected':
      return 'Registration was not approved.';
    case 'revoked':
      return 'Access revoked — this registration is no longer valid.';
    case 'inactive':
      return 'Inactive — this registration is not currently valid.';
    case 'error':
      return 'We couldn’t complete that check. Please try again.';
    default:
      return 'Not registered — no matching bag registration was found.';
  }
}

// Session helpers (still local — only the user id is stored in the browser)
function getSessionUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(SESSION_KEY);
}

function setSessionUserId(id: string | null) {
  if (typeof window === 'undefined') return;
  if (id) window.localStorage.setItem(SESSION_KEY, id);
  else window.localStorage.removeItem(SESSION_KEY);
}

// Map DB rows ↔ domain types
function mapStaff(row: any): StaffRecord {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
  };
}

function mapRegistration(row: any): RegistrationRecord {
  return {
    id: row.id,
    studentName: row.student_name,
    usn: row.usn,
    department: row.department,
    bagDescription: row.bag_description,
    imageUrl: row.image_url,
    status: row.status,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    approvedAt: row.approved_at,
  };
}

function mapScan(row: any): ScanLogRecord {
  return {
    id: row.id,
    searchedUsn: row.searched_usn,
    checkpointName: row.checkpoint_name,
    operatorName: row.operator_name,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapAdminAction(row: any): AdminActionRecord {
  return {
    id: row.id,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    actorName: row.actor_name,
    createdAt: row.created_at,
    ...(row.metadata ? { metadata: row.metadata } : {}),
  };
}

async function getSessionProfile(): Promise<StaffRecord | null> {
  const id = getSessionUserId();
  if (!id) return null;

  const { data, error } = await getSupabase()
    .from('staff')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    setSessionUserId(null);
    return null;
  }
  return mapStaff(data);
}

async function requireRole(allowGuard = false): Promise<StaffRecord> {
  const profile = await getSessionProfile();
  if (!profile || (profile.role !== 'admin' && !(allowGuard && profile.role === 'guard'))) {
    throw new Error('This local preview does not have the required staff role.');
  }
  return profile;
}

async function addAdminAction(
  actor: StaffRecord,
  action: string,
  targetType: string,
  targetId: string,
  metadata?: Record<string, string | number>,
) {
  await getSupabase().from('admin_actions').insert({
    action,
    target_type: targetType,
    target_id: targetId,
    actor_name: actor.fullName,
    metadata: metadata ?? null,
  });
}

// ---------------------------------------------------------------------------
// Public API (identical signatures to the localStorage version)
// ---------------------------------------------------------------------------

export async function getCurrentProfile(): Promise<StaffRecord | null> {
  return getSessionProfile();
}

export async function isAdminBootstrapClaimed(): Promise<boolean> {
  const { data } = await getSupabase()
    .from('app_settings')
    .select('value')
    .eq('key', 'bootstrap_claimed')
    .maybeSingle();

  return Boolean(data?.value);
}

export async function createLocalAccount(input: { fullName: string; email: string }): Promise<StaffRecord> {
  const fullName = input.fullName.trim();
  const email = normalizeEmail(input.email);
  if (fullName.length < 2 || fullName.length > 120) {
    throw new Error('Enter a name between 2 and 120 characters.');
  }

  const supabase = getSupabase();
  const { data: existing } = await supabase.from('staff').select('id').eq('email', email).maybeSingle();
  if (existing) {
    throw new Error('A local BagGuard account already uses that email. Sign in instead.');
  }

  const { data, error } = await supabase
    .from('staff')
    .insert({ full_name: fullName, email, role: 'student' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapStaff(data);
}

export async function signInLocal(emailInput: string): Promise<StaffRecord> {
  const email = normalizeEmail(emailInput);
  const { data, error } = await getSupabase()
    .from('staff')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error || !data) {
    throw new Error('No local account uses that email yet. Create a local preview account first.');
  }

  setSessionUserId(data.id);
  return mapStaff(data);
}

export async function signOutLocal(): Promise<void> {
  setSessionUserId(null);
}

export async function claimInitialLocalAdmin(input: { fullName: string; email: string }): Promise<StaffRecord> {
  const fullName = input.fullName.trim();
  const email = normalizeEmail(input.email);
  if (fullName.length < 2 || fullName.length > 120) {
    throw new Error('Enter a name between 2 and 120 characters.');
  }

  if (await isAdminBootstrapClaimed()) {
    throw new Error('A local preview administrator has already been set up.');
  }

  const supabase = getSupabase();
  let profile: StaffRecord;

  const { data: existing } = await supabase.from('staff').select('*').eq('email', email).maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('staff')
      .update({ full_name: fullName, role: 'admin' })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    profile = mapStaff(data);
  } else {
    const { data, error } = await supabase
      .from('staff')
      .insert({ full_name: fullName, email, role: 'admin' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    profile = mapStaff(data);
  }

  await supabase.from('app_settings').upsert({
    key: 'bootstrap_claimed',
    value: true,
    updated_at: nowIso(),
  });

  setSessionUserId(profile.id);
  await addAdminAction(profile, 'local_admin_setup_completed', 'profile', profile.id);
  return profile;
}

export async function createStaffProfile(): Promise<StaffRecord> {
  const profile = await getSessionProfile();
  if (!profile) throw new Error('Sign in to the local preview first.');
  return profile;
}

export async function getPublicBagCounts(): Promise<{ registrations: number; pending: number }> {
  const supabase = getSupabase();

  const { count: total } = await supabase
    .from('bag_registrations')
    .select('*', { count: 'exact', head: true });

  const { count: pending } = await supabase
    .from('bag_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  return {
    registrations: total ?? 0,
    pending: pending ?? 0,
  };
}

export async function registerBag(input: RegisterBagInput): Promise<{ id: string }> {
  const studentName = input.studentName.trim();
  const usn = normalizeUsn(input.usn);
  const bagDescription = input.bagDescription.trim();

  if (studentName.length < 2 || studentName.length > 120) {
    throw new Error('Enter the student’s full name.');
  }
  if (!['M1 - College', 'M2 - SHS-AMA', 'M3 - SHS-SASN'].includes(input.department)) {
    throw new Error('Choose a department or classification.');
  }
  if (bagDescription.length < 5 || bagDescription.length > 500) {
    throw new Error('Describe the bag in 5 to 500 characters.');
  }
  if (input.imageUrl && (!input.imageUrl.startsWith('data:image/') || input.imageUrl.length > 1_000_000)) {
    throw new Error('The local bag photo is too large to save in this browser. Choose a smaller image.');
  }

  const supabase = getSupabase();

  // Prevent duplicate active registrations for the same USN
  const { data: existing } = await supabase
    .from('bag_registrations')
    .select('id')
    .eq('usn', usn)
    .neq('status', 'archived')
    .limit(1);

  if (existing && existing.length > 0) {
    throw new Error('This student number already has a registration. Contact campus staff if the bag needs to change.');
  }

  const { data, error } = await supabase
    .from('bag_registrations')
    .insert({
      student_name: studentName,
      usn,
      department: input.department,
      bag_description: bagDescription,
      image_url: input.imageUrl,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return { id: data.id };
}

export async function lookupBagByUsn(usnInput: string): Promise<VerificationResult> {
  const usn = normalizeUsn(usnInput);

  const { data } = await getSupabase()
    .from('bag_registrations')
    .select('*')
    .eq('usn', usn)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) {
    return { status: 'unregistered', registration: null, message: statusMessage('unregistered') };
  }

  const registration = mapRegistration(data);
  const status = statusFromRegistration(registration.status);
  return { status, registration, message: statusMessage(status) };
}

export async function verifyAtGate(input: VerifyAtGateInput): Promise<VerificationResult> {
  const usn = normalizeUsn(input.usn);
  const checkpointName = input.checkpointName.trim().slice(0, 120) || 'Main Gate';
  const operator = await requireRole(true);

  const { data: reg } = await getSupabase()
    .from('bag_registrations')
    .select('*')
    .eq('usn', usn)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const registration = reg ? mapRegistration(reg) : null;
  const status = registration ? statusFromRegistration(registration.status) : 'unregistered';
  const result: VerificationResult = {
    status,
    registration,
    message: statusMessage(status),
  };

  await getSupabase().from('scan_logs').insert({
    searched_usn: usn,
    checkpoint_name: checkpointName,
    operator_name: operator.fullName,
    status,
  });

  return result;
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  await requireRole();

  const supabase = getSupabase();

  const [
    { count: totalRegs },
    { count: pendingCount },
    { count: approvedCount },
    { count: revokedCount },
    { count: scanCount },
    { data: pending },
    { data: approved },
    { data: logs },
    { data: staff },
    { data: actions },
  ] = await Promise.all([
    supabase.from('bag_registrations').select('*', { count: 'exact', head: true }),
    supabase.from('bag_registrations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('bag_registrations').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase
      .from('bag_registrations')
      .select('*', { count: 'exact', head: true })
      .in('status', ['revoked', 'inactive']),
    supabase.from('scan_logs').select('*', { count: 'exact', head: true }),
    supabase
      .from('bag_registrations')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('bag_registrations')
      .select('*')
      .eq('status', 'approved')
      .order('approved_at', { ascending: false })
      .limit(8),
    supabase.from('scan_logs').select('*').order('created_at', { ascending: false }).limit(8),
    supabase.from('staff').select('*').order('full_name', { ascending: false }).limit(20),
    supabase.from('admin_actions').select('*').order('created_at', { ascending: false }).limit(8),
  ]);

  return {
    stats: {
      registrations: totalRegs ?? 0,
      pending: pendingCount ?? 0,
      approved: approvedCount ?? 0,
      revoked: revokedCount ?? 0,
      scans: scanCount ?? 0,
    },
    pending: (pending ?? []).map(mapRegistration),
    approved: (approved ?? []).map(mapRegistration),
    logs: (logs ?? []).map(mapScan),
    staff: (staff ?? []).map(mapStaff),
    adminActions: (actions ?? []).map(mapAdminAction),
  };
}

export async function getReportPage(input: {
  query: string;
  department: Department | '';
  status: RegistrationStatus | '';
  page: number;
}): Promise<ReportPageData> {
  await requireRole();

  const query = input.query.trim().toLocaleLowerCase().slice(0, 80);
  const page = Math.max(1, Math.floor(input.page));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let q = getSupabase()
    .from('bag_registrations')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (input.department) q = q.eq('department', input.department);
  if (input.status) q = q.eq('status', input.status);
  if (query) {
    q = q.or(`student_name.ilike.%${query}%,usn.ilike.%${query}%`);
  }

  const { data, count, error } = await q.range(from, to);
  if (error) throw new Error(error.message);

  return {
    rows: (data ?? []).map(mapRegistration),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getScanLogPage(input: {
  query: string;
  status: ScanStatus | '';
  page: number;
}): Promise<ScanLogPageData> {
  await requireRole();

  const query = input.query.trim().toLocaleLowerCase().slice(0, 80);
  const page = Math.max(1, Math.floor(input.page));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let q = getSupabase()
    .from('scan_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (input.status) q = q.eq('status', input.status);
  if (query) {
    q = q.or(
      `searched_usn.ilike.%${query}%,checkpoint_name.ilike.%${query}%,operator_name.ilike.%${query}%`,
    );
  }

  const { data, count, error } = await q.range(from, to);
  if (error) throw new Error(error.message);

  return {
    rows: (data ?? []).map(mapScan),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function reviewRegistration(input: {
  id: string;
  action: ReviewAction;
  reason?: string;
}): Promise<{ success: true }> {
  const actor = await requireRole();
  const supabase = getSupabase();

  const { data: registration, error: fetchError } = await supabase
    .from('bag_registrations')
    .select('*')
    .eq('id', input.id)
    .single();

  if (fetchError || !registration) {
    throw new Error('That registration could not be found.');
  }

  const now = nowIso();
  let status: RegistrationStatus = registration.status;
  let rejectionReason: string | null = registration.rejection_reason;
  let approvedAt = registration.approved_at;

  if (input.action === 'approve' && registration.status === 'pending') {
    status = 'approved';
    approvedAt = now;
    rejectionReason = null;
  } else if (input.action === 'reject' && registration.status === 'pending') {
    status = 'rejected';
    rejectionReason = input.reason?.trim().slice(0, 500) || null;
  } else if (input.action === 'revoke' && registration.status === 'approved') {
    status = 'revoked';
  } else if (input.action === 'deactivate' && registration.status === 'approved') {
    status = 'inactive';
  } else if (
    input.action === 'reactivate' &&
    (registration.status === 'revoked' || registration.status === 'inactive')
  ) {
    status = 'approved';
    approvedAt = now;
  } else if (input.action === 'archive' && registration.status !== 'archived') {
    status = 'archived';
  } else {
    throw new Error('That request has changed. Refresh the page and try again.');
  }

  const { error } = await supabase
    .from('bag_registrations')
    .update({
      status,
      rejection_reason: rejectionReason,
      approved_at: approvedAt,
    })
    .eq('id', input.id);

  if (error) throw new Error(error.message);

  await addAdminAction(actor, `registration_${input.action}`, 'bag_registration', input.id, {
    status: input.action,
  });

  return { success: true as const };
}

export async function approveAllPending(): Promise<{ count: number }> {
  const actor = await requireRole();
  const supabase = getSupabase();
  const now = nowIso();

  const { data: pending } = await supabase
    .from('bag_registrations')
    .select('id')
    .eq('status', 'pending');

  const count = pending?.length ?? 0;
  if (count === 0) return { count: 0 };

  const { error } = await supabase
    .from('bag_registrations')
    .update({ status: 'approved', approved_at: now })
    .eq('status', 'pending');

  if (error) throw new Error(error.message);

  await addAdminAction(actor, 'registrations_bulk_approved', 'bag_registration_batch', crypto.randomUUID(), {
    count,
  });

  return { count };
}

export async function setStaffRole(input: { email: string; role: StaffRole }): Promise<{ success: true }> {
  const email = normalizeEmail(input.email);
  if (!['student', 'guard', 'admin'].includes(input.role)) {
    throw new Error('Choose a valid staff access role.');
  }

  const actor = await requireRole();
  const supabase = getSupabase();

  const { data: target } = await supabase.from('staff').select('*').eq('email', email).maybeSingle();
  if (!target) {
    throw new Error(
      'No local BagGuard account uses that email yet. Have them create an account on this browser first.',
    );
  }
  if (target.id === actor.id) {
    throw new Error('You can’t change your own access level.');
  }

  const { error } = await supabase.from('staff').update({ role: input.role }).eq('id', target.id);
  if (error) throw new Error(error.message);

  await addAdminAction(actor, `staff_role_set_${input.role}`, 'profile', target.id, {
    role: input.role,
  });

  return { success: true as const };
}