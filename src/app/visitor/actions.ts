"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function generateRegistrationCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "V-";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function registerVisitorBag(formData: FormData) {
  const registrationCode = generateRegistrationCode();

  const payload = {
    visitor_full_name: String(formData.get("visitor_full_name") || "").trim(),
    visitor_contact: String(formData.get("visitor_contact") || "").trim(),
    id_presented: String(formData.get("id_presented") || "").trim() || null,
    host_name: String(formData.get("host_name") || "").trim() || null,
    host_student_id: String(formData.get("host_student_id") || "").trim() || null,
    purpose: String(formData.get("purpose") || "").trim(),
    bag_type: String(formData.get("bag_type") || "").trim() || null,
    bag_color: String(formData.get("bag_color") || "").trim() || null,
    bag_brand: String(formData.get("bag_brand") || "").trim() || null,
    bag_description: String(formData.get("bag_description") || "").trim() || null,
    valid_until: String(formData.get("valid_until") || ""),
    registration_code: registrationCode,
    status: "pending",
  };

  console.log("Trying to insert:", payload);

  if (
    !payload.visitor_full_name ||
    !payload.visitor_contact ||
    !payload.purpose ||
    !payload.valid_until
  ) {
    throw new Error("Please fill in all required fields.");
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("visitor_bags")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    throw new Error(error.message);
  }

  console.log("Successfully inserted:", data);

  redirect(`/visitor/success?code=${registrationCode}`);
}