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
/**
 * Process and optimize an image in Ultra High Quality (Client-Side)
 * @param {File} file - Image file from file picker or drag & drop
 * @param {number} maxDim - Maximum dimension (default 1600px for crystal clear retina display)
 * @param {number} quality - Compression quality (0.92 for vibrant details)
 * @returns {Promise<{ url: string, width: number, height: number, fileName: string, size: number }>}
 */
export function processHighQualityImage(file, maxDim = 1600, quality = 0.92) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file provided'));
    if (!file.type.startsWith('image/')) return reject(new Error('Invalid image file type'));

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Downscale only if larger than maxDim to ensure pristine sharpness
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

        let dataUrl = '';
        try {
          dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
        } catch {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve({
          url: dataUrl,
          width,
          height,
          fileName: file.name,
          size: file.size
        });
      };
      img.onerror = () => {
        resolve({
          url: e.target.result,
          width: 0,
          height: 0,
          fileName: file.name,
          size: file.size
        });
      };
      img.src = e.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Upload an Image (banner, thumbnail, slide photo, instructor avatar) with progress callback
 * Instantly generates high-quality HD fallback so the UI never blocks or fails.
 * @param {File} file - Image file from drag-and-drop or file picker
 * @param {string} customTitle - Title to sanitize for filename
 * @param {Function} onProgress - Progress callback ({ percent, loaded, total })
 * @returns {Promise<{ url: string, fileName: string, size: number, path: string, isLocalFallback?: boolean }>}
 */
export async function uploadImageFile(file, customTitle = '', onProgress = null) {
  if (!file) throw new Error('No image file selected.');

  // Step 1: Immediately prepare Ultra High Quality processed Data URL (<100ms)
  let highQualityResult = null;
  try {
    highQualityResult = await processHighQualityImage(file, 1600, 0.92);
  } catch (procErr) {
    console.warn('[CloudStorage] Image pre-process note:', procErr);
  }

  const cleanName = (customTitle || file.name)
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '_')
    .slice(0, 50);

  const extension = file.name.split('.').pop() || 'webp';
  const filePath = `images/banners/${Date.now()}_${cleanName}.${extension}`;
  const instantUrl = highQualityResult?.url || URL.createObjectURL(file);

  // Step 2: Try Firebase Storage upload with a strict 3-second timeout race
  if (storage) {
    try {
      const storageRef = ref(storage, filePath);
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type || 'image/webp'
      });

      const cloudUploadPromise = new Promise((resolve) => {
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
            console.warn('[CloudStorage] Firebase storage upload note:', error);
            resolve({
              url: instantUrl,
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
              resolve({
                url: instantUrl,
                fileName: file.name,
                size: file.size,
                path: filePath,
                isLocalFallback: true
              });
            }
          }
        );
      });

      // Timeout race: If Firebase storage doesn't succeed in 3 seconds, gracefully use the high-quality HD image
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            url: instantUrl,
            fileName: file.name,
            size: file.size,
            path: filePath,
            isLocalFallback: true
          });
        }, 3000);
      });

      const result = await Promise.race([cloudUploadPromise, timeoutPromise]);
      if (onProgress) onProgress({ percent: 100, loaded: file.size, total: file.size });
      return result;
    } catch (e) {
      console.warn('[CloudStorage] Storage init exception, using HD fallback:', e);
    }
  }

  // Graceful instant fallback
  if (onProgress) {
    onProgress({ percent: 100, loaded: file.size, total: file.size });
  }
  return {
    url: instantUrl,
    fileName: file.name,
    size: file.size,
    path: filePath,
    isLocalFallback: true
  };
}
