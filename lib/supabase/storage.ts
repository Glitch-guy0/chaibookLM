/**
 * lib/supabase/storage.ts
 *
 * Supabase Storage helpers for ChaiBookLM file uploads.
 * All files are stored in the "sources" bucket under:
 *   sources/{userId}/{notebookId}/{uuid}-{filename}
 *
 * This module is used exclusively inside API routes (server-side).
 * It uses the service-role key to bypass RLS for server-to-server ops.
 */

import { createClient } from "@supabase/supabase-js";

const BUCKET = "sources";

// Use the anon/publishable key here; storage policies are set to authenticated-only
// For server-side uploads from API routes (no user session), use the service key if available.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const storageClient = createClient(supabaseUrl, supabaseKey);

/**
 * Upload a file buffer to Supabase Storage.
 *
 * @param buffer   Raw file bytes
 * @param fileName Original file name (used to preserve extension)
 * @param userId   Clerk user ID (used as a path prefix for isolation)
 * @param notebookId  Notebook the file belongs to
 * @param mimeType MIME type of the file (e.g. "application/pdf")
 * @returns Public URL of the uploaded file
 */
export async function uploadFileToStorage(
  buffer: Buffer,
  fileName: string,
  userId: string,
  notebookId: string,
  mimeType = "application/octet-stream"
): Promise<string> {
  // Unique storage path to avoid collisions
  const uuid = crypto.randomUUID();
  const storagePath = `${userId}/${notebookId}/${uuid}-${fileName}`;

  const { error } = await storageClient.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  // Get a long-lived signed URL (7 days) or use getPublicUrl if bucket is public
  const { data: urlData } = storageClient.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  if (!urlData?.publicUrl) {
    // Fallback: generate a signed URL valid for 7 days
    const { data: signed, error: signErr } = await storageClient.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

    if (signErr || !signed?.signedUrl) {
      throw new Error(
        `Failed to generate URL for uploaded file: ${signErr?.message}`
      );
    }

    return signed.signedUrl;
  }

  return urlData.publicUrl;
}

/**
 * Download a file from a Supabase Storage URL and return it as a Buffer.
 */
export async function downloadFileFromStorage(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Failed to download file from Supabase Storage (${res.status}): ${url}`
    );
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Delete a file from Supabase Storage given its public URL.
 * Extracts the path portion after the bucket name.
 */
export async function deleteFileFromStorage(publicUrl: string): Promise<void> {
  try {
    // Extract storage path from public URL
    // URL format: https://<project>.supabase.co/storage/v1/object/public/sources/<path>
    const marker = `/object/public/${BUCKET}/`;
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return; // not a storage URL, skip

    const storagePath = publicUrl.slice(idx + marker.length);
    const { error } = await storageClient.storage
      .from(BUCKET)
      .remove([storagePath]);

    if (error) {
      console.warn(`[Storage] Failed to delete ${storagePath}:`, error.message);
    }
  } catch (err) {
    console.warn("[Storage] Error deleting file:", err);
  }
}
