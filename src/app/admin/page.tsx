import type { Metadata } from "next";

import { AdminDashboard } from "@/components/bagguard/AdminDashboard";

export const metadata: Metadata = {
  title: "Admin Panel",
  description: "Review bag registrations, manage staff access, and audit campus gate checks.",
};

export default function AdminPage() {
  return <AdminDashboard />;
}
