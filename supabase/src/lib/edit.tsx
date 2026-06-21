import { createContext, useContext, useState, type ReactNode } from "react";
import { supabase } from "./supabase";
import { uploadToStorage } from "./upload";
import { useAuth } from "./auth";
import { useClub } from "../components/ClubContext";

interface EditState {
  /** True when an admin for this club is signed in. */
  canEdit: boolean;
  editing: boolean;
  setEditing: (v: boolean) => void;
  /** Current value for a content key: local edit → saved override → fallback. */
  value: (key: string, fallback: string) => string;
  /** Save a text value for a key. */
  save: (key: string, value: string) => Promise<void>;
  /** Upload + save an image for a key, returns the URL. */
  uploadImage: (key: string, file: File) => Promise<void>;
  busyKey: string | null;
  error: string | null;
}

const Ctx = createContext<EditState | null>(null);

export function EditProvider({ children }: { children: ReactNode }) {
  const { membership } = useAuth();
  const { club } = useClub();
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const base = club.content ?? {};
  // On-page editing is disabled — the website is edited from the admin panel.
  // We keep reading saved overrides so admin edits still appear on the live site.
  const canEdit = false;

  const value = (key: string, fallback: string) =>
    key in overrides ? overrides[key] : key in base ? base[key] : fallback;

  const persist = async (key: string, val: string) => {
    if (!membership || !supabase) return;
    setOverrides((o) => ({ ...o, [key]: val }));
    const { error: e } = await supabase
      .from("club_content")
      .upsert({ club_id: membership.clubId, content_key: key, value: val }, { onConflict: "club_id,content_key" });
    if (e) setError(e.message);
  };

  const save = async (key: string, val: string) => {
    setBusyKey(key);
    setError(null);
    await persist(key, val);
    setBusyKey(null);
  };

  const uploadImage = async (key: string, file: File) => {
    if (!membership) return;
    setBusyKey(key);
    setError(null);
    try {
      const url = await uploadToStorage(file, membership.clubId, "page");
      await persist(key, url);
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "Upload failed.");
    }
    setBusyKey(null);
  };

  return (
    <Ctx.Provider value={{ canEdit, editing, setEditing, value, save, uploadImage, busyKey, error }}>
      {children}
    </Ctx.Provider>
  );
}

export function useEdit(): EditState {
  const c = useContext(Ctx);
  if (!c) throw new Error("useEdit must be used within EditProvider");
  return c;
}
