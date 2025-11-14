/**
 * Cloudinary upload utility functions
 * These functions handle image uploads to Cloudinary via the backend API
 */

export async function uploadFile(file: File, type: string = 'comic', token?: string) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    // Prefer calling the backend upload endpoint directly when configured,
    // otherwise fall back to the local Next.js API route `/api/upload`.
    const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL as string) || '';
    const uploadUrl = BACKEND ? `${BACKEND.replace(/\/+$/, '')}/upload` : '/api/upload';

    // Attach Authorization header if a token is provided
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Debug: log destination and whether token will be sent
    try {
      console.log('uploadFile ->', { uploadUrl, willSendAuth: !!token });
    } catch {}

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      headers,
    });

    if (!response.ok) {
      // Clone the response so we can attempt multiple reads (json/text)
      const clone = response.clone();
      let errorMessage = `Upload failed (${response.status})`;
      try {
        const error = await response.json();
        errorMessage = error?.error || error?.message || errorMessage;
        if (error?.details) {
          console.error('Backend error details:', error.details);
        }
      } catch {
        // Could not parse JSON response; try text from the clone
        try {
          const text = await clone.text();
          console.error('Backend response (text):', text.substring(0, 1000));
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        } catch (readErr) {
          console.error('Failed reading backend response text:', readErr);
        }
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Upload error:', error.message);
      throw error;
    }
    console.error('Upload error:', error);
    throw new Error('Upload failed');
  }
}

export async function uploadComicCover(file: File, token?: string) {
  return uploadFile(file, 'comic', token);
}

export async function uploadChapterImage(file: File, token?: string) {
  return uploadFile(file, 'chapter', token);
}

export async function uploadMultipleFiles(files: File[], type: string = 'chapter', token?: string) {
  try {
    const uploadPromises = files.map((file) => uploadFile(file, type, token));
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Batch upload error:', error);
    throw error;
  }
}

export function validateImageFile(file: File, maxSizeMB: number = 10) {
  if (!file.type.startsWith('image/')) {
    return {
      valid: false,
      error: 'Chỉ chấp nhận file ảnh',
    };
  }

  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `Kích thước file không được vượt quá ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}
