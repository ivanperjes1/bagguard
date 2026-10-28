"use server";

import { randomUUID, timingSafeEqual } from "node:crypto";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
import {
  lookupBagByUsn,
  normalizeUsn,
  requireBagRole,
} from "@/lib/bagguard-data";
import { departments, type Department, type RegistrationStatus } from "@/lib/bagguard-types";
import { createUploadUrl } from "@/lib/storage";

const allowedPhotoTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
const maxPhotoSize = 4 * 1024 * 1024;

function validateUsn(value: string): string {
  const usn = normalizeUsn(value);
  if (usn.length < 5 || usn.length > 32 || !/^[A-Z0-9-]+$/.test(usn)) {
    throw new Error("Enter a valid student identification number.");
  }
  return usn;
}

function validatePhotoReference(imagePath: string | null, imageUrl: string | null) {
  if (!imagePath && !imageUrl) return;
  if (!imagePath || !imageUrl || imagePath.length > 512 || imageUrl.length > 2048) {
    throw new Error("The selected bag photo could not be verified. Please upload it again.");
  }

  const servicesUrl = process.env.IMAGINE_SERVICES_URL;
  if (!servicesUrl) throw new Error("Bag photo uploads aren’t available right now.");

  try {
    const imageOrigin = new URL(imageUrl).origin;
    if (imageOrigin !== new URL(servicesUrl).origin) {
      throw new Error("The selected bag photo could not be verified. Please upload it again.");
    }
  } catch {
    throw new Error("The selected bag photo could not be verified. Please upload it again.");
  }
}

async function requireRole(allowGuard = false) {
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
    throw new Error("You don’t have permission to complete that action.");
  }

  return { user: signedIn, role: profile.role };
}

function revalidateBagGuard() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/report");
  revalidatePath("/scan");
  revalidatePath("/bagtracker");
}

export async function createBagPhotoUploadTarget(input: {
  contentType: string;
  size: number;
}) {
  if (!input || typeof input !== "object") throw new Error("Choose a bag photo to upload.");
  if (typeof input.contentType !== "string" || typeof input.size !== "number") {
    throw new Error("That photo couldn’t be uploaded. Please choose it again.");
  }
  const extension = allowedPhotoTypes.get(input.contentType);
  if (!extension) throw new Error("Choose a JPG, PNG, or WebP image of the bag.");
  if (!Number.isFinite(input.size) || input.size <= 0 || input.size > maxPhotoSize) {
    throw new Error("Bag photos must be smaller than 4 MB.");
  }

  const target = await createUploadUrl({
    filename: `${randomUUID()}.${extension}`,
    contentType: input.contentType,
    size: input.size,
  });

  return {
    uploadUrl: target.uploadUrl,
    publicUrl: target.publicUrl,
    key: target.key,
  };
}

export async function registerBag(input: {
  studentName: string;
  usn: string;
  department: string;
  bagDescription: string;
  imagePath?: string | null;
  imageUrl?: string | null;
}) {
  if (!input || typeof input !== "object") throw new Error("Complete every required field.");
  if (
    typeof input.studentName !== "string" ||
    typeof input.usn !== "string" ||
    typeof input.department !== "string" ||
    typeof input.bagDescription !== "string"
  ) {
    throw new Error("Complete every required field.");
  }
  const studentName = input.studentName.trim().replace(/\s+/g, " ");
  const bagDescription = input.bagDescription.trim().replace(/\s+/g, " ");
  const usn = validateUsn(input.usn);
  const department = departments.find((choice) => choice === input.department);

  if (studentName.length < 2 || studentName.length > 120) {
    throw new Error("Enter the student’s full name.");
  }
  if (!department) throw new Error("Choose a department or classification.");
  if (bagDescription.length < 5 || bagDescription.length > 500) {
    throw new Error("Describe the bag in 5 to 500 characters.");
  }

  if (
    (input.imagePath != null && typeof input.imagePath !== "string") ||
    (input.imageUrl != null && typeof input.imageUrl !== "string")
  ) {
    throw new Error("The selected bag photo could not be verified. Please upload it again.");
  }
  const imagePath = input.imagePath?.trim() || null;
  const imageUrl = input.imageUrl?.trim() || null;
  validatePhotoReference(imagePath, imageUrl);

  try {
    const [created] = await db
      .insert(bagRegistrations)
      .values({
        studentName,
        usn,
        department: department as Department,
        bagDescription,
        imagePath,
        imageUrl,
      })
      .returning({ id: bagRegistrations.id });

    revalidateBagGuard();
    return { id: created.id };
  } catch (error) {
    if (error instanceof Error && /23505|duplicate key|unique constraint/i.test(error.message)) {
      throw new Error("This USN already has a bag registration.");
    }
    throw new Error("We couldn’t save this registration. Please try again.");
  }
}

export async function lookupBag(usnInput: string) {
  let usn: string;
  try {
    usn = validateUsn(usnInput);
  } catch (error) {
    return {
      status: "error" as const,
      registration: null,
      message: error instanceof Error ? error.message : "Enter a valid student identification number.",
    };
  }

  try {
    const result = await lookupBagByUsn(usn);
    if (result.registration) {
      return {
        ...result,
        registration: { ...result.registration, imageUrl: null },
      };
    }
    return result;
  } catch {
    return {
      status: "error" as const,
      registration: null,
      message: "We couldn’t check that number right now. Please try again.",
    };
  }
}

export async function verifyAtGate(input: {
  usn: string;
  checkpointName?: string;
}) {
  const { user: operator } = await requireRole(true);
  if (!input || typeof input !== "object") throw new Error("Enter a student identification number.");
  const usn = validateUsn(input.usn);
  if (input.checkpointName != null && typeof input.checkpointName !== "string") {
    throw new Error("Enter a valid checkpoint name.");
  }
  const checkpointName = input.checkpointName?.trim().slice(0, 80) || "Main Gate";
  const result = await lookupBagByUsn(usn);

  await db.insert(bagScanLogs).values({
    registrationId: result.registration?.id ?? null,
    searchedUsn: usn,
    checkpointName,
    operatorId: operator.id,
    status: result.status,
  });

  revalidatePath("/admin");
  return result;
}

export async function createStaffProfile() {
  const signedIn = await requireUser();
  await db
    .insert(bagguardProfiles)
    .values({ id: signedIn.id, fullName: signedIn.name, role: "student" })
    .onConflictDoNothing();
  return { created: true };
}

export async function claimInitialAdmin(setupCode: string) {
  const signedIn = await requireUser();
  const expected = process.env.BAGGUARD_ADMIN_SETUP_TOKEN;
  if (typeof setupCode !== "string") throw new Error("Enter the one-time administrator setup code.");
  const provided = setupCode.trim();

  if (!expected) throw new Error("First administrator setup isn’t enabled yet.");
  if (!signedIn.emailVerified) {
    throw new Error("Confirm your email address before completing administrator setup.");
  }
  if (!provided || provided.length > 512) {
    throw new Error("Enter the one-time administrator setup code.");
  }

  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  const matches =
    expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer);
  if (!matches) throw new Error("That setup code isn’t valid.");

  try {
    await db.transaction(async (tx) => {
      await tx.insert(bagAdminBootstrap).values({ id: 1 }).onConflictDoNothing();
      const [claim] = await tx
        .update(bagAdminBootstrap)
        .set({ claimedBy: signedIn.id, claimedAt: new Date() })
        .where(and(eq(bagAdminBootstrap.id, 1), isNull(bagAdminBootstrap.claimedBy)))
        .returning({ id: bagAdminBootstrap.id });

      if (!claim) throw new Error("The first administrator has already been assigned.");

      await tx
        .insert(bagguardProfiles)
        .values({ id: signedIn.id, fullName: signedIn.name, role: "admin" })
        .onConflictDoUpdate({
          target: bagguardProfiles.id,
          set: { fullName: signedIn.name, role: "admin", updatedAt: new Date() },
        });

      await tx.insert(bagAdminAuditLogs).values({
        actorId: signedIn.id,
        action: "first_admin_claimed",
        targetType: "profile",
        targetId: signedIn.id,
        metadata: { role: "admin" },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("already been assigned")) {
      throw error;
    }
    throw new Error("We couldn’t complete administrator setup. Please try again.");
  }

  revalidateBagGuard();
  return { success: true };
}

export async function reviewRegistration(input: {
  id: string;
  action: "approve" | "reject" | "revoke" | "deactivate" | "reactivate" | "archive";
  reason?: string;
}) {
  const { user: actor } = await requireRole();
  if (!input || typeof input !== "object") throw new Error("Refresh the page and try again.");
  if (
    typeof input.id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.id) ||
    !["approve", "reject", "revoke", "deactivate", "reactivate", "archive"].includes(input.action)
  ) {
    throw new Error("That registration action isn’t valid.");
  }
  if (input.reason != null && typeof input.reason !== "string") {
    throw new Error("Enter a valid rejection reason.");
  }
  const reason = input.reason?.trim().slice(0, 500) || null;
  const now = new Date();
  await db.transaction(async (tx) => {
    let updated;

    if (input.action === "approve") {
      updated = await tx
        .update(bagRegistrations)
        .set({ status: "approved", approvedAt: now, approvedBy: actor.id, updatedAt: now })
        .where(and(eq(bagRegistrations.id, input.id), eq(bagRegistrations.status, "pending")))
        .returning({ id: bagRegistrations.id });
    } else if (input.action === "reject") {
      updated = await tx
        .update(bagRegistrations)
        .set({ status: "rejected", rejectionReason: reason, updatedAt: now })
        .where(and(eq(bagRegistrations.id, input.id), eq(bagRegistrations.status, "pending")))
        .returning({ id: bagRegistrations.id });
    } else if (input.action === "revoke") {
      updated = await tx
        .update(bagRegistrations)
        .set({ status: "revoked", updatedAt: now })
        .where(and(eq(bagRegistrations.id, input.id), eq(bagRegistrations.status, "approved")))
        .returning({ id: bagRegistrations.id });
    } else if (input.action === "deactivate") {
      updated = await tx
        .update(bagRegistrations)
        .set({ status: "inactive", updatedAt: now })
        .where(and(eq(bagRegistrations.id, input.id), eq(bagRegistrations.status, "approved")))
        .returning({ id: bagRegistrations.id });
    } else if (input.action === "reactivate") {
      updated = await tx
        .update(bagRegistrations)
        .set({ status: "approved", approvedAt: now, approvedBy: actor.id, updatedAt: now })
        .where(
          and(
            eq(bagRegistrations.id, input.id),
            sql`${bagRegistrations.status} in ('revoked', 'inactive')`,
          ),
        )
        .returning({ id: bagRegistrations.id });
    } else {
      updated = await tx
        .update(bagRegistrations)
        .set({ status: "archived", updatedAt: now })
        .where(and(eq(bagRegistrations.id, input.id), sql`${bagRegistrations.status} <> 'archived'`))
        .returning({ id: bagRegistrations.id });
    }

    if (!updated.length) throw new Error("That request has changed. Refresh the page and try again.");

    await tx.insert(bagAdminAuditLogs).values({
      actorId: actor.id,
      action: `registration_${input.action}`,
      targetType: "bag_registration",
      targetId: input.id,
      metadata: { status: input.action },
    });
  });

  revalidateBagGuard();
  return { success: true };
}

export async function approveAllPending() {
  const { user: actor } = await requireRole();
  const now = new Date();
  const count = await db.transaction(async (tx) => {
    const updated = await tx
      .update(bagRegistrations)
      .set({ status: "approved", approvedAt: now, approvedBy: actor.id, updatedAt: now })
      .where(eq(bagRegistrations.status, "pending"))
      .returning({ id: bagRegistrations.id });

    await tx.insert(bagAdminAuditLogs).values({
      actorId: actor.id,
      action: "registrations_bulk_approved",
      targetType: "bag_registration_batch",
      targetId: randomUUID(),
      metadata: { count: updated.length },
    });
    return updated.length;
  });

  revalidateBagGuard();
  return { count };
}

export async function setStaffRole(input: {
  email: string;
  role: "student" | "guard" | "admin";
}) {
  const { user: actor } = await requireRole();
  if (!input || typeof input !== "object" || typeof input.email !== "string") {
    throw new Error("Enter a valid staff email address.");
  }
  if (!["student", "guard", "admin"].includes(input.role)) {
    throw new Error("Choose a valid staff access role.");
  }
  const email = input.email.trim().toLowerCase().slice(0, 254);
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid staff email address.");

  const [target] = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);
  if (!target) throw new Error("No BagGuard account uses that email yet.");
  if (target.id === actor.id) throw new Error("You can’t change your own access level.");

  await db.transaction(async (tx) => {
    await tx
      .insert(bagguardProfiles)
      .values({ id: target.id, fullName: target.name, role: input.role })
      .onConflictDoUpdate({
        target: bagguardProfiles.id,
        set: { role: input.role, updatedAt: new Date() },
      });
    await tx.insert(bagAdminAuditLogs).values({
      actorId: actor.id,
      action: `staff_role_set_${input.role}`,
      targetType: "profile",
      targetId: target.id,
      metadata: { role: input.role },
    });
  });

  revalidateBagGuard();
  return { success: true };
}

export async function getCurrentProfile() {
  const signedIn = await getUser();
  if (!signedIn) return null;
  const [profile] = await db
    .select({ role: bagguardProfiles.role })
    .from(bagguardProfiles)
    .where(eq(bagguardProfiles.id, signedIn.id))
    .limit(1);
  return { ...signedIn, role: profile?.role ?? null };
}
