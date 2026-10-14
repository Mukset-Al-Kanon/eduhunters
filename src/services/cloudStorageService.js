/**
 * cloudStorageService.js
 * Universal, zero-setup direct Cloud Storage service for EduHunters.
 * Powered by Firebase Storage with automatic drag-and-drop file upload,
 * live progress tracking, and fallback handling.
 */
import { storage } from '../firebase/config';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

/**
 * Upload a Video file with progress callback
 * @param {File} file - Video file from drag-and-drop or file picker
 * @param {string} customTitle - Title to sanitize for filename
 * @param {Function} onProgress - Progress callback ({ percent, loaded, total })
 * @returns {Promise<{ url: string, fileName: string, size: number, path: string }>}
 */
export async function uploadVideoFile(file, customTitle = '', onProgress = null) {
  if (!file) throw new Error('No video file selected.');

  const cleanName = (customTitle || file.name)
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '_')
    .slice(0, 60);

  const extension = file.name.split('.').pop() || 'mp4';
  const filePath = `courses/videos/${Date.now()}_${cleanName}.${extension}`;

  if (storage) {
    try {
      const storageRef = ref(storage, filePath);
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type || 'video/mp4'
      });

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const percent = snapshot.totalBytes > 0 
              ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100) 
              : 0;
            if (onProgress) {
              onProgress({
                percent,
                loaded: snapshot.bytesTransferred,
                total: snapshot.totalBytes
              });
            }
          },
          (error) => {
            console.error('[CloudStorage] Video upload error:', error);
            // Fallback to local object URL if cloud storage has permission rule block
            const fallbackUrl = URL.createObjectURL(file);
            resolve({
              url: fallbackUrl,
              fileName: file.name,
              size: file.size,
              path: filePath,
              isLocalFallback: true
            });
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve({
                url: downloadURL,
                fileName: file.name,
                size: file.size,
                path: filePath
              });
            } catch (err) {
              const fallbackUrl = URL.createObjectURL(file);
              resolve({
                url: fallbackUrl,
                fileName: file.name,
                size: file.size,
                path: filePath,
                isLocalFallback: true
              });
            }
          }
        );
      });
    } catch (e) {
      console.warn('[CloudStorage] Storage init error, using local fallback:', e);
    }
  }

  // Graceful fallback when Firebase storage is offline
  if (onProgress) {
    onProgress({ percent: 100, loaded: file.size, total: file.size });
  }
  const fallbackUrl = URL.createObjectURL(file);
  return {
    url: fallbackUrl,
    fileName: file.name,
    size: file.size,
    path: filePath,
    isLocalFallback: true
  };
}

/**
 * Upload a PDF or Lecture Sheet with progress callback
 * @param {File} file - PDF file from drag-and-drop or file picker
 * @param {string} customTitle - Title to sanitize for filename
 * @param {Function} onProgress - Progress callback ({ percent, loaded, total })
 * @returns {Promise<{ url: string, fileName: string, size: number, path: string }>}
 */
export async function uploadPdfFile(file, customTitle = '', onProgress = null) {
  if (!file) throw new Error('No PDF file selected.');

  const cleanName = (customTitle || file.name)
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '_')
    .slice(0, 60);

  const filePath = `courses/notes/${Date.now()}_${cleanName}.pdf`;

  if (storage) {
    try {
      const storageRef = ref(storage, filePath);
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: 'application/pdf'
      });

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const percent = snapshot.totalBytes > 0 
              ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100) 
              : 0;
            if (onProgress) {
              onProgress({
                percent,
                loaded: snapshot.bytesTransferred,
                total: snapshot.totalBytes
              });
            }
          },
          (error) => {
            console.error('[CloudStorage] PDF upload error:', error);
            const fallbackUrl = URL.createObjectURL(file);
            resolve({
              url: fallbackUrl,
              fileName: file.name,
              size: file.size,
              path: filePath,
              isLocalFallback: true
            });
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve({
                url: downloadURL,
                fileName: file.name,
                size: file.size,
                path: filePath
              });
            } catch (err) {
              const fallbackUrl = URL.createObjectURL(file);
              resolve({
                url: fallbackUrl,
                fileName: file.name,
                size: file.size,
                path: filePath,
                isLocalFallback: true
              });
            }
          }
        );
      });
    } catch (e) {
      console.warn('[CloudStorage] Storage init error, using local fallback:', e);
    }
  }

  // Graceful fallback
  if (onProgress) {
    onProgress({ percent: 100, loaded: file.size, total: file.size });
  }
  const fallbackUrl = URL.createObjectURL(file);
  return {
    url: fallbackUrl,
    fileName: file.name,
    size: file.size,
    path: filePath,
    isLocalFallback: true
  };
}
