import { supabase } from "./supabase";

export type Channel = "email" | "sms" | "push";

export interface Recipient {
  id: string;
  name: string;
  email: string | null;
  mobile: string | null;
  roles: string[];
}

export interface SendResult {
  ok: boolean;
  sent: { email: number; sms: number; push: number };
  failed: { email: number; sms: number; push: number };
  error?: string;
}

const zero = () => ({ email: 0, sms: 0, push: 0 });

/** Load the club's contactable people. */
export async function loadPeople(clubId: string): Promise<Recipient[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("people")
    .select("id, full_name, first_name, last_name, email, mobile, roles, status")
    .eq("club_id", clubId);
  if (error || !data) return [];
  return data
    .filter((p) => (p.status ?? "active") !== "archived")
    .map((p) => ({
      id: p.id,
      name:
        p.full_name ||
        [p.first_name, p.last_name].filter(Boolean).join(" ") ||
        p.email ||
        "Unnamed",
      email: p.email || null,
      mobile: p.mobile || null,
      roles: Array.isArray(p.roles) ? p.roles : [],
    }));
}

/** Distinct role names across a set of people, for audience targeting. */
export function rolesOf(people: Recipient[]): string[] {
  const set = new Set<string>();
  for (const p of people) for (const r of p.roles) if (r) set.add(r);
  return [...set].sort();
}

export interface SendPayload {
  clubId: string;
  channels: Channel[];
  subject?: string;
  body: string;
  recipients: { name: string; email: string | null; mobile: string | null }[];
  test?: boolean;
}

/** Invoke the dispatch-message Edge Function (Twilio / Zoho / WebPushr). */
export async function sendMessage(payload: SendPayload): Promise<SendResult> {
  if (!supabase)
    return { ok: false, sent: zero(), failed: zero(), error: "Supabase not configured." };
  const { data, error } = await supabase.functions.invoke("dispatch-message", { body: payload });
  if (error) return { ok: false, sent: zero(), failed: zero(), error: error.message };
  // Trust the function's shape, but guard against a partial response.
  const r = (data ?? {}) as Partial<SendResult>;
  return {
    ok: r.ok ?? true,
    sent: { ...zero(), ...(r.sent ?? {}) },
    failed: { ...zero(), ...(r.failed ?? {}) },
    error: r.error,
  };
}

/** Record a send in the history table (best-effort). */
export async function logMessage(args: {
  clubId: string;
  channels: Channel[];
  subject?: string;
  body: string;
  audience: string;
  recipientCount: number;
  status: string;
}): Promise<void> {
  if (!supabase) return;
  await supabase.from("club_messages").insert({
    club_id: args.clubId,
    channels: args.channels,
    subject: args.subject ?? null,
    body: args.body,
    audience: args.audience,
    recipient_count: args.recipientCount,
    status: args.status,
  });
}

export interface ProviderStatus {
  email: boolean;
  sms: boolean;
  push: boolean;
}

/** Ask the edge function which providers are connected (booleans only). */
export async function checkProviders(): Promise<ProviderStatus | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.functions.invoke("dispatch-message", { body: { action: "status" } });
  if (error || !data) return null;
  const s = (data as { status?: Partial<ProviderStatus> }).status ?? {};
  return { email: !!s.email, sms: !!s.sms, push: !!s.push };
}

export interface MessageRow {
  id: string;
  channels: string[];
  subject: string | null;
  body: string;
  audience: string | null;
  recipient_count: number;
  status: string;
  created_at: string;
}

export async function loadHistory(clubId: string): Promise<MessageRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("club_messages")
    .select("id, channels, subject, body, audience, recipient_count, status, created_at")
    .eq("club_id", clubId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error || !data) return [];
  return data as MessageRow[];
}
