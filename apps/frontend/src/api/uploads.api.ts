import { api } from '@/lib/api';

export interface UploadedFile {
  url: string;
  name: string;
  type: string;
  size: number;
}

/**
 * Upload image files to the server.
 * @param files - Array of File objects to upload
 * @param folder - Target folder: 'listings' | 'avatars' | 'documents' | 'groups'
 * @returns Array of public URLs for the uploaded images
 */
export async function uploadImages(
  files: File[],
  folder: 'listings' | 'avatars' | 'documents' | 'groups' = 'listings',
): Promise<string[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const { data } = await api.post<{ urls: string[]; files: UploadedFile[] }>(
    `/uploads/${folder}`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000, // 60s for large uploads
    },
  );

  return data.urls;
}

/**
 * Upload files and return full metadata (name, type, size, url).
 * Used for documents/attachments where metadata is needed.
 */
export async function uploadFiles(
  files: File[],
  folder: 'listings' | 'avatars' | 'documents' | 'groups' = 'groups',
): Promise<UploadedFile[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const { data } = await api.post<{ urls: string[]; files: UploadedFile[] }>(
    `/uploads/${folder}`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    },
  );

  return data.files;
}
