import { supabase } from "./supabase";

export interface AdminClub {
  id: string;
  name: string;
  slug: string;
}

export interface AdminModuleRow {
  club_id: string;
  module_key: string;
  status: string;
}

export async function listClubs(): Promise<AdminClub[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("admin_list_clubs");
  if (error || !data) return [];
  return data as AdminClub[];
}

export async function listModuleStatuses(): Promise<AdminModuleRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("admin_list_modules");
  if (error || !data) return [];
  return data as AdminModuleRow[];
}

export async function setModuleStatus(clubId: string, moduleKey: string, status: "enabled" | "locked" | "trial"): Promise<string | null> {
  if (!supabase) return "Supabase not configured.";
  const { error } = await supabase.rpc("admin_set_module", { p_club: clubId, p_key: moduleKey, p_status: status });
  return error ? error.message : null;
}

export interface CreateClubInput {
  name: string;
  slug: string;
  primary: string;
  secondary: string;
  contact?: string;
  adminEmail?: string;
}

export interface CreateClubResult {
  slug: string;
  admin: "none" | "linked" | "no_account";
}

export async function createClub(input: CreateClubInput): Promise<{ result?: CreateClubResult; error?: string }> {
  if (!supabase) return { error: "Supabase not configured." };
  const { data, error } = await supabase.rpc("admin_create_club", {
    p_name: input.name.trim(),
    p_slug: input.slug.trim(),
    p_primary: input.primary,
    p_secondary: input.secondary,
    p_contact: input.contact?.trim() || null,
    p_sport: "football",
    p_admin_email: input.adminEmail?.trim() || null,
  });
  if (error) return { error: error.message };
  return { result: data as CreateClubResult };
}
