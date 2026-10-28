import type { Metadata } from "next";

import { AuditScreen } from "@/components/bagguard/AuditScreen";

export const metadata: Metadata = {
  title: "Gate Verification History",
  description: "Review BagGuard checkpoint checks saved in this browser preview.",
};

export default function AuditPage() {
  return <AuditScreen />;
}
