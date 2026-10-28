import type { Metadata } from "next";
import { GateScanScreen } from "@/components/bagguard/GateScanScreen";

export const metadata: Metadata = {
  title: "Gate Scan",
  description: "Verify student bag registrations at the campus gate.",
};

export default function ScanPage() {
  return <GateScanScreen />;
}
