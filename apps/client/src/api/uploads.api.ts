import { api } from '@/lib/api';

/**
 * Upload image files to the server.
 * @param files - Array of File objects to upload
 * @param folder - Target folder: 'listings' | 'avatars' | 'documents'
 * @returns Array of public URLs for the uploaded images
 */
export async function uploadImages(
  files: File[],
  folder: 'listings' | 'avatars' | 'documents' = 'listings',
): Promise<string[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const { data } = await api.post<{ urls: string[] }>(
    `/uploads/${folder}`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000, // 60s for large uploads
    },
  );

  return data.urls;
}
