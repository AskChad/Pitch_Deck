export interface ReferenceMaterial {
  id: string;
  user_id: string;
  deck_id?: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  storage_url?: string;
  mime_type?: string;
  metadata: Record<string, any>;
  tags: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  result?: ReferenceMaterial;
}

export type FileCategory =
  | 'presentation' // PDF, PPTX, PPT
  | 'document'     // DOCX, DOC, TXT
  | 'image'        // PNG, JPG, JPEG, GIF, SVG
  | 'video'        // MP4, WEBM, MOV
  | 'other';

export const ACCEPTED_FILE_TYPES = {
  presentation: ['.pdf', '.pptx', '.ppt', '.key'],
  document: ['.docx', '.doc', '.txt', '.md'],
  image: ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'],
  video: ['.mp4', '.webm', '.mov'],
};

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export function getFileCategory(mimeType: string): FileCategory {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.includes('pdf')) return 'presentation';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
  if (mimeType.includes('document') || mimeType.includes('word') || mimeType.includes('text')) return 'document';
  return 'other';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
