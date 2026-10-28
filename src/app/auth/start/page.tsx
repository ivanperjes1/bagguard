import { redirect } from "next/navigation";

export default function AuthStartPage() {
  redirect("/admin/login");
}
