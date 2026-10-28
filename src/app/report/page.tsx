import type { Metadata } from "next";

import { ReportsScreen } from "@/components/bagguard/ReportsScreen";

export const metadata: Metadata = {
  title: "Registration Reports",
  description: "Search and review AMA Lipa BagGuard student registration records in this browser preview.",
};

export default function ReportPage() {
  return <ReportsScreen />;
}
