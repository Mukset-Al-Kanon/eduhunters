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

/**
 * Upload an Image (banner, thumbnail, slide photo) with progress callback
 * @param {File} file - Image file from drag-and-drop or file picker
 * @param {string} customTitle - Title to sanitize for filename
 * @param {Function} onProgress - Progress callback ({ percent, loaded, total })
 * @returns {Promise<{ url: string, fileName: string, size: number, path: string }>}
 */
export async function uploadImageFile(file, customTitle = '', onProgress = null) {
  if (!file) throw new Error('No image file selected.');

  const cleanName = (customTitle || file.name)
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '_')
    .slice(0, 50);

  const extension = file.name.split('.').pop() || 'webp';
  const filePath = `images/banners/${Date.now()}_${cleanName}.${extension}`;

  // Helper to generate compressed Data URL as ultra-safe fallback
  const createCompressedDataUrl = () => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1280;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          let compressed = '';
          try {
            compressed = canvas.toDataURL('image/webp', 0.82);
            if (!compressed.startsWith('data:image/webp')) {
              compressed = canvas.toDataURL('image/jpeg', 0.80);
            }
          } catch {
            compressed = canvas.toDataURL('image/jpeg', 0.80);
          }
          resolve(compressed);
        };
        img.onerror = () => resolve(URL.createObjectURL(file));
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(URL.createObjectURL(file));
      reader.readAsDataURL(file);
    });
  };

  if (storage) {
    try {
      const storageRef = ref(storage, filePath);
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type || 'image/webp'
      });

      return new Promise((resolve) => {
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
          async (error) => {
            console.warn('[CloudStorage] Image upload to Firebase storage note:', error);
            const fallback = await createCompressedDataUrl();
            resolve({
              url: fallback,
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
            } catch {
              const fallback = await createCompressedDataUrl();
              resolve({
                url: fallback,
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
      console.warn('[CloudStorage] Storage init error, using compressed fallback:', e);
    }
  }

  // Fallback
  if (onProgress) {
    onProgress({ percent: 100, loaded: file.size, total: file.size });
  }
  const fallback = await createCompressedDataUrl();
  return {
    url: fallback,
    fileName: file.name,
    size: file.size,
    path: filePath,
    isLocalFallback: true
  };
}
