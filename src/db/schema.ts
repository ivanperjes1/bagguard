/**
 * The app's database schema.
 *
 * ADD YOUR TABLES AT THE BOTTOM. The four tables above the marker belong to the
 * authentication library: it reads and writes them itself, their column names are
 * part of its contract, and renaming or "tidying" one breaks sign-in in a way that
 * type-checks perfectly and only fails at runtime. Leave them exactly as they are.
 *
 * Anything that belongs to a person gets a `userId` column referencing
 * `user.id` with `onDelete: "cascade"`. That single choice is what makes "delete
 * my account" actually delete someone's data instead of orphaning it — which is
 * a legal obligation, not a nicety.
 *
 * After any change here run `npm run db:push` once to apply it.
 */
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ─── Authentication (managed by the auth library — do not modify) ─────────────

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("user_email_idx").on(t.email)],
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("session_token_idx").on(t.token),
    index("session_user_idx").on(t.userId),
  ],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    idToken: text("id_token"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

// ─── Your tables go below this line ───────────────────────────────────────────
//
// Example — delete it once you have real tables of your own:
//
// export const note = pgTable(
//   "note",
//   {
//     id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
//     userId: text("user_id")
//       .notNull()
//       .references(() => user.id, { onDelete: "cascade" }),
//     title: text("title").notNull(),
//     body: text("body").notNull().default(""),
//     createdAt: timestamp("created_at").notNull().defaultNow(),
//   },
//   // Index the column you filter by. Every query for a user's own rows filters
//   // on user_id, and without this each one is a full table scan.
//   (t) => [index("note_user_idx").on(t.userId)],
// );

export const bagDepartmentEnum = pgEnum("bagguard_department", [
  "M1 - College",
  "M2 - SHS-AMA",
  "M3 - SHS-SASN",
]);

export const bagStatusEnum = pgEnum("bagguard_registration_status", [
  "pending",
  "approved",
  "rejected",
  "revoked",
  "inactive",
  "archived",
]);

export const bagRoleEnum = pgEnum("bagguard_user_role", [
  "student",
  "guard",
  "admin",
]);

export const scanStatusEnum = pgEnum("bagguard_scan_status", [
  "authorized",
  "pending_approval",
  "unregistered",
  "rejected",
  "revoked",
  "inactive",
  "error",
]);

export const bagguardProfiles = pgTable(
  "bagguard_profiles",
  {
    id: text("id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    role: bagRoleEnum("role").notNull().default("student"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("bagguard_profiles_role_idx").on(table.role)],
);

export const bagRegistrations = pgTable(
  "bag_registrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentName: text("student_name").notNull(),
    usn: text("usn").notNull(),
    department: bagDepartmentEnum("department").notNull(),
    bagDescription: text("bag_description").notNull(),
    imagePath: text("image_path"),
    imageUrl: text("image_url"),
    status: bagStatusEnum("status").notNull().default("pending"),
    rejectionReason: text("rejection_reason"),
    approvedAt: timestamp("approved_at"),
    approvedBy: text("approved_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("bag_registrations_usn_unique").on(table.usn),
    index("bag_registrations_status_created_idx").on(
      table.status,
      table.createdAt,
    ),
    index("bag_registrations_department_idx").on(table.department),
  ],
);

export const bagScanLogs = pgTable(
  "bag_scan_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    registrationId: uuid("registration_id").references(
      () => bagRegistrations.id,
      { onDelete: "set null" },
    ),
    searchedUsn: text("searched_usn").notNull(),
    checkpointName: text("checkpoint_name").notNull().default("Main Gate"),
    operatorId: text("operator_id").references(() => user.id, {
      onDelete: "set null",
    }),
    status: scanStatusEnum("status").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("bag_scan_logs_created_idx").on(table.createdAt),
    index("bag_scan_logs_status_idx").on(table.status),
  ],
);

export const bagAdminAuditLogs = pgTable(
  "bag_admin_audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: text("actor_id").references(() => user.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    metadata: jsonb("metadata").$type<Record<string, string | number | boolean | null>>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("bag_admin_audit_logs_created_idx").on(table.createdAt)],
);

export const bagAdminBootstrap = pgTable("bag_admin_bootstrap", {
  id: integer("id").primaryKey(),
  claimedBy: text("claimed_by").references(() => user.id, {
    onDelete: "set null",
  }),
  claimedAt: timestamp("claimed_at"),
});
