import { supabase } from "./supabase";

export const MEDIA_BUCKET = "club-media";

/**
 * Uploads a file to the club's folder in Supabase Storage and returns its
 * public URL. Path: {clubId}/{folder}/{timestamp}-{filename}. The Storage RLS
 * policies (see supabase/storage.sql) only allow members to write into their
 * own club's folder.
 */
export async function uploadToStorage(file: File, clubId: string, folder: string): Promise<string> {
  if (!supabase) throw new Error("Storage isn't available right now.");
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-48);
  const path = `${clubId}/${folder}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
