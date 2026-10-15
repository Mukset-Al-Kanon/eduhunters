/**
 * bunnyService.js
 * Comprehensive integration service for Bunny.net Stream (Video) and Bunny Storage (PDFs & Lecture Sheets).
 * Supports direct upload with progress tracking and connection testing.
 */

const STORAGE_KEY = 'eduhunters_bunny_credentials';

const DEFAULT_BUNNY_CONFIG = {
  streamLibraryId: import.meta.env.VITE_BUNNY_STREAM_LIBRARY_ID || '777670',
  streamApiKey: import.meta.env.VITE_BUNNY_STREAM_API_KEY || 'c99c17d7-42de-42fb-9b9356122cbd-1fe9-4fc2',
  streamCdnHost: import.meta.env.VITE_BUNNY_STREAM_CDN_HOST || 'vz-d60c940a-08c.b-cdn.net',
  storageZoneName: import.meta.env.VITE_BUNNY_STORAGE_ZONE_NAME || 'eduhunters-storage',
  storagePassword: import.meta.env.VITE_BUNNY_STORAGE_PASSWORD || '',
  storageHostname: import.meta.env.VITE_BUNNY_STORAGE_HOSTNAME || 'storage.bunnycdn.com',
  pullZoneHostname: import.meta.env.VITE_BUNNY_PULL_ZONE_HOSTNAME || 'eduhuntersbd.b-cdn.net'
};

export function getBunnyConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_BUNNY_CONFIG,
        ...parsed,
        streamLibraryId: (parsed.streamLibraryId && String(parsed.streamLibraryId).trim()) || DEFAULT_BUNNY_CONFIG.streamLibraryId,
        streamApiKey: (parsed.streamApiKey && String(parsed.streamApiKey).trim()) || DEFAULT_BUNNY_CONFIG.streamApiKey,
        streamCdnHost: (parsed.streamCdnHost && String(parsed.streamCdnHost).trim()) || DEFAULT_BUNNY_CONFIG.streamCdnHost,
        storageZoneName: (parsed.storageZoneName && String(parsed.storageZoneName).trim()) || DEFAULT_BUNNY_CONFIG.storageZoneName,
        storagePassword: (parsed.storagePassword && String(parsed.storagePassword).trim()) || DEFAULT_BUNNY_CONFIG.storagePassword,
        storageHostname: (parsed.storageHostname && String(parsed.storageHostname).trim()) || DEFAULT_BUNNY_CONFIG.storageHostname,
        pullZoneHostname: (parsed.pullZoneHostname && String(parsed.pullZoneHostname).trim()) || DEFAULT_BUNNY_CONFIG.pullZoneHostname
      };
    }
  } catch (e) {}

  return { ...DEFAULT_BUNNY_CONFIG };
}

export function saveBunnyConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {}
}

export function isBunnyStreamConfigured(config = null) {
  const c = config || getBunnyConfig();
  return Boolean(c.streamLibraryId && String(c.streamLibraryId).trim() && c.streamApiKey && String(c.streamApiKey).trim());
}

export function isBunnyStorageConfigured(config = null) {
  const c = config || getBunnyConfig();
  return Boolean(c.storageZoneName && String(c.storageZoneName).trim() && c.storagePassword && String(c.storagePassword).trim() && c.pullZoneHostname && String(c.pullZoneHostname).trim());
}

/**
 * Helper to determine base URL (proxy in dev for zero-CORS, direct in prod)
 */
function getStreamApiBaseUrl() {
  if (import.meta.env?.DEV) {
    return '/api-bunny-stream';
  }
  return 'https://video.bunnycdn.com';
}

function getStorageApiBaseUrl(hostname = 'storage.bunnycdn.com') {
  if (import.meta.env?.DEV) {
    return '/api-bunny-storage';
  }
  return `https://${hostname || 'storage.bunnycdn.com'}`;
}

/**
 * Test Bunny Stream credentials
 */
export async function testBunnyStreamConnection(config = null) {
  const c = config || getBunnyConfig();
  if (!c.streamLibraryId || !c.streamApiKey) {
    return { success: false, message: 'Missing Library ID or Stream API Key.' };
  }

  try {
    const baseUrl = getStreamApiBaseUrl();
    const res = await fetch(`${baseUrl}/library/${c.streamLibraryId}/videos?page=1&itemsPerPage=1`, {
      method: 'GET',
      headers: {
        'AccessKey': c.streamApiKey.trim(),
        'Accept': 'application/json'
      }
    });

    if (res.ok) {
      const data = await res.json();
      return { 
        success: true, 
        message: `Connected successfully! Found ${data.totalItems ?? 0} existing videos in library.` 
      };
    } else {
      const errText = await res.text().catch(() => '');
      return { 
        success: false, 
        message: `HTTP ${res.status}: ${errText || 'Invalid credentials or Library ID'}` 
      };
    }
  } catch (err) {
    return { 
      success: false, 
      message: `Connection failed: ${err.message}. If CORS error occurs, ensure dev proxy or CORS headers are set.` 
    };
  }
}

/**
 * Test Bunny Storage credentials
 */
export async function testBunnyStorageConnection(config = null) {
  const c = config || getBunnyConfig();
  if (!c.storageZoneName || !c.storagePassword) {
    return { success: false, message: 'Missing Storage Zone Name or Storage Password.' };
  }

  try {
    const baseUrl = getStorageApiBaseUrl(c.storageHostname);
    const res = await fetch(`${baseUrl}/${c.storageZoneName.trim()}/`, {
      method: 'GET',
      headers: {
        'AccessKey': c.storagePassword.trim(),
        'Accept': 'application/json'
      }
    });

    if (res.ok) {
      return { 
        success: true, 
        message: `Storage Zone "${c.storageZoneName}" connected successfully!` 
      };
    } else {
      const errText = await res.text().catch(() => '');
      return { 
        success: false, 
        message: `HTTP ${res.status}: ${errText || 'Invalid Storage Zone credentials'}` 
      };
    }
  } catch (err) {
    return { 
      success: false, 
      message: `Connection failed: ${err.message}. Ensure "Enable CORS" is toggled ON in Bunny Storage settings.` 
    };
  }
}

/**
 * Upload Video directly to Bunny Stream with real-time progress callback.
 * @param {File} file - The video file to upload
 * @param {string} title - Optional title for the video
 * @param {Function} onProgress - Callback (progress: { percent: number, loaded: number, total: number })
 * @returns {Promise<{ guid: string, embedUrl: string, directPlayUrl: string, title: string }>}
 */
export async function uploadVideoToBunnyStream(file, title = '', onProgress = null) {
  const config = getBunnyConfig();
  if (!isBunnyStreamConfigured(config)) {
    throw new Error('Bunny Stream is not configured. Please enter your Library ID and API Key in Settings.');
  }

  const libraryId = config.streamLibraryId.trim();
  const apiKey = config.streamApiKey.trim();
  const videoTitle = title?.trim() || file.name.replace(/\.[^/.]+$/, '');
  const baseUrl = getStreamApiBaseUrl();

  // Step 1: Create Video Object in Bunny Stream
  const createRes = await fetch(`${baseUrl}/library/${libraryId}/videos`, {
    method: 'POST',
    headers: {
      'AccessKey': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      title: videoTitle
    })
  });

  if (!createRes.ok) {
    const errText = await createRes.text().catch(() => '');
    throw new Error(`Failed to initialize video upload on Bunny Stream (HTTP ${createRes.status}): ${errText}`);
  }

  const createData = await createRes.json();
  const videoGuid = createData.guid;
  if (!videoGuid) {
    throw new Error('Bunny Stream did not return a valid video GUID.');
  }

  // Step 2: Upload File Binary using XMLHttpRequest for real-time progress
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const uploadUrl = `${baseUrl}/library/${libraryId}/videos/${videoGuid}`;

    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('AccessKey', apiKey);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          const percent = Math.round((evt.loaded / evt.total) * 100);
          onProgress({ percent, loaded: evt.loaded, total: evt.total });
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoGuid}`;
        const directPlayUrl = `https://video.bunnycdn.com/play/${libraryId}/${videoGuid}`;
        resolve({
          guid: videoGuid,
          embedUrl,
          directPlayUrl,
          title: videoTitle
        });
      } else {
        reject(new Error(`Video upload binary failed (HTTP ${xhr.status}): ${xhr.responseText || 'Upload error'}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error occurred during video upload. Please check your internet connection or CORS settings.'));
    };

    xhr.onabort = () => {
      reject(new Error('Upload was cancelled.'));
    };

    xhr.send(file);
  });
}

/**
 * Upload PDF directly to Bunny Storage CDN with progress callback.
 * @param {File} file - PDF file to upload
 * @param {string} folder - Subdirectory inside storage zone (e.g. 'course_notes')
 * @param {Function} onProgress - Callback ({ percent, loaded, total })
 * @returns {Promise<{ cdnUrl: string, fileName: string, size: number }>}
 */
export async function uploadPdfToBunnyStorage(file, folder = 'course_notes', onProgress = null) {
  const config = getBunnyConfig();
  if (!isBunnyStorageConfigured(config)) {
    throw new Error('Bunny Storage is not configured. Please set Storage Zone, Password, and Pull Zone domain in Settings.');
  }

  const storageZone = config.storageZoneName.trim();
  const password = config.storagePassword.trim();
  const rawPullZone = config.pullZoneHostname.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  const baseUrl = getStorageApiBaseUrl(config.storageHostname);

  // Sanitize filename for safe CDN URLs
  const cleanName = file.name
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_\-\.]/g, '')
    .toLowerCase();
  const timestamp = Date.now();
  const targetFileName = `${timestamp}_${cleanName}`;
  const targetPath = `${folder ? folder.replace(/^\/+|\/+$/g, '') + '/' : ''}${targetFileName}`;

  const uploadUrl = `${baseUrl}/${storageZone}/${targetPath}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('AccessKey', password);
    xhr.setRequestHeader('Content-Type', file.type || 'application/pdf');

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          const percent = Math.round((evt.loaded / evt.total) * 100);
          onProgress({ percent, loaded: evt.loaded, total: evt.total });
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const cdnUrl = `https://${rawPullZone}/${targetPath}`;
        resolve({
          cdnUrl,
          fileName: targetFileName,
          size: file.size
        });
      } else {
        reject(new Error(`PDF upload failed (HTTP ${xhr.status}): ${xhr.responseText || 'Storage upload error'}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during PDF upload. Ensure "Enable CORS Headers" is turned ON in Bunny.net Storage Zone settings.'));
    };

    xhr.onabort = () => {
      reject(new Error('Upload was cancelled.'));
    };

    xhr.send(file);
  });
}
