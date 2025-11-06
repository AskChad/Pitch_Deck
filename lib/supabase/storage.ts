/**
 * Supabase Storage utilities for handling large file uploads
 */

import { supabase } from '@/lib/supabase/client';

export interface UploadedFile {
  fileName: string;
  filePath: string;
  publicUrl: string;
  size: number;
}

/**
 * Upload a file to Supabase Storage
 * Supports files up to 50GB (Supabase limit)
 */
export async function uploadFileToStorage(
  file: File,
  userId: string
): Promise<UploadedFile> {

  // Generate unique file path
  const timestamp = Date.now();
  const fileName = `${timestamp}-${file.name}`;
  const filePath = `${userId}/reference-materials/${fileName}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('pitch-deck-uploads') // bucket name
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload ${file.name}: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('pitch-deck-uploads')
    .getPublicUrl(filePath);

  return {
    fileName: file.name,
    filePath: data.path,
    publicUrl,
    size: file.size,
  };
}

/**
 * Upload multiple files to Supabase Storage
 */
export async function uploadFilesToStorage(
  files: File[],
  userId: string,
  onProgress?: (uploaded: number, total: number) => void
): Promise<UploadedFile[]> {
  const uploaded: UploadedFile[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const result = await uploadFileToStorage(file, userId);
      uploaded.push(result);
      onProgress?.(i + 1, files.length);
    } catch (error: any) {
      console.error(`Failed to upload ${file.name}:`, error);
      throw error;
    }
  }

  return uploaded;
}

/**
 * Download file content from Supabase Storage
 * Used by API routes to process uploaded files
 */
export async function downloadFileFromStorage(
  filePath: string
): Promise<Blob> {

  const { data, error } = await supabase.storage
    .from('pitch-deck-uploads')
    .download(filePath);

  if (error) {
    throw new Error(`Failed to download file: ${error.message}`);
  }

  return data;
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFileFromStorage(filePath: string): Promise<void> {

  const { error } = await supabase.storage
    .from('pitch-deck-uploads')
    .remove([filePath]);

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}
