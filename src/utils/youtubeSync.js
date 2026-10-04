// YouTube Data API v3 Playlist Auto-Sync Utility for Edu Hunters

export const DEFAULT_YT_API_KEY = "AIzaSyBLThxPP9oO8Uwbyftprjpg1J7_MwpH2YA";

/**
 * Cleans long YouTube titles into very short, simple lesson titles
 * E.g.: "Noun Classification | ৩০ দিনে Master English শেষ করার মিশন | As Sami Islam" -> "Noun Classification"
 */
export function cleanYouTubeTitle(rawTitle) {
  if (!rawTitle) return 'লেকচার';
  let title = String(rawTitle).trim();

  // Strip leading prefixes like "HSC 26,27-", "HSC 26, 27 -", etc.
  title = title.replace(/^HSC\s*2[0-9]\s*[,/&]\s*2[0-9]\s*[-–—:\s]+/i, '');
  title = title.replace(/^HSC\s*2[0-9]\s*[-–—:\s]+/i, '');

  // Remove common YouTube divider suffixes (e.g. "| Medical Admission", "| As Sami Islam")
  if (title.includes('|')) {
    title = title.split('|')[0].trim();
  } else if (title.includes('—')) {
    title = title.split('—')[0].trim();
  }

  // Remove common prefix noise like "৪০মিনিটে " or "Day 1:"
  title = title.replace(/^[০-৯0-9]+\s*মিনিটে\s*/i, '');
  title = title.replace(/^Day\s*[০-৯0-9]+[:\s-]*/i, '');
  title = title.replace(/^Class\s*[০-৯0-9]+[:\s-]*/i, '');

  // Clean unescaped entities
  title = title.replace(/\\u0026/g, '&').replace(/&amp;/g, '&');

  return title.trim() || rawTitle.trim();
}

/**
 * Parses ISO 8601 duration string (e.g. PT1H40M18S, PT37M21S) into human readable mm:ss or hh:mm:ss
 */
export function parseISO8601Duration(isoDuration) {
  if (!isoDuration || typeof isoDuration !== 'string') return '';
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  const pad = (n) => String(n).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${minutes}:${pad(seconds)}`;
}

/**
 * Fetches all items from a public YouTube playlist using YouTube Data API v3
 */
export async function fetchYouTubePlaylistVideos(playlistId, apiKey) {
  if (!playlistId || !apiKey) {
    throw new Error('Playlist ID এবং YouTube API Key উভয়ই প্রয়োজন।');
  }

  const cleanPlaylistId = playlistId.replace(/^PL/, 'PL');
  const playlistItemsUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${cleanPlaylistId}&key=${apiKey}`;

  const res = await fetch(playlistItemsUrl);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const message = errData?.error?.message || `YouTube API রিকোয়েস্ট ব্যর্থ হয়েছে (${res.status})`;
    throw new Error(message);
  }

  const data = await res.json();
  const items = data.items || [];

  if (items.length === 0) {
    return [];
  }

  // Extract video IDs to query their durations
  const videoIds = items
    .map(item => item.contentDetails?.videoId || item.snippet?.resourceId?.videoId)
    .filter(Boolean);

  const durationMap = {};

  if (videoIds.length > 0) {
    try {
      const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds.join(',')}&key=${apiKey}`;
      const videosRes = await fetch(videosUrl);
      if (videosRes.ok) {
        const videosData = await videosRes.json();
        (videosData.items || []).forEach(v => {
          durationMap[v.id] = parseISO8601Duration(v.contentDetails?.duration);
        });
      }
    } catch (e) {
      console.warn('Could not fetch video durations:', e);
    }
  }

  return items.map((item, idx) => {
    const vId = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId;
    const rawTitle = item.snippet?.title || `Lesson ${idx + 1}`;
    const cleanTitle = cleanYouTubeTitle(rawTitle);
    const duration = durationMap[vId] || '';

    return {
      id: idx + 1,
      title: cleanTitle,
      duration: duration || 'Video',
      isFree: true,
      videoUrl: `https://www.youtube.com/watch?v=${vId}`,
      videoId: vId,
      publishedAt: item.snippet?.publishedAt || null
    };
  });
}

/**
 * Checks cache or performs auto-sync for a course linked to a YouTube playlist
 */
export async function syncCourseWithYouTube(course, apiKey, forceRefresh = false) {
  if (!course || !course.playlistId) return course;

  const keyToUse = apiKey || localStorage.getItem('eduhunters_yt_api_key') || DEFAULT_YT_API_KEY;
  if (!keyToUse) return course;

  const cacheKey = `yt_sync_${course.playlistId}`;
  
  // 30 minute cache check
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        const ageMs = Date.now() - (parsed.timestamp || 0);
        if (ageMs < 30 * 60 * 1000 && Array.isArray(parsed.lessons) && parsed.lessons.length > 0) {
          return applyLessonsToCourse(course, parsed.lessons);
        }
      }
    } catch {}
  }

  // Fetch fresh from YouTube API v3
  const freshLessons = await fetchYouTubePlaylistVideos(course.playlistId, keyToUse);
  if (freshLessons && freshLessons.length > 0) {
    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        lessons: freshLessons
      }));
    } catch {}
    return applyLessonsToCourse(course, freshLessons);
  }

  return course;
}

/**
 * Updates course curriculum with a fresh list of lessons
 */
export function applyLessonsToCourse(course, lessons) {
  if (!lessons || lessons.length === 0) return course;

  const currentCurriculum = Array.isArray(course.curriculum) && course.curriculum.length > 0
    ? JSON.parse(JSON.stringify(course.curriculum))
    : [{
        id: 1,
        name: `${course.name || course.title} (পূর্ণাঙ্গ ক্লাস)`,
        summary: `${lessons.length}টি ভিডিও ক্লাস`,
        chapters: [{
          name: "সকল ভিডিও লেকচার",
          count: lessons.length,
          lessons: []
        }]
      }];

  if (currentCurriculum[0]?.chapters?.[0]) {
    currentCurriculum[0].chapters[0].lessons = lessons;
    currentCurriculum[0].chapters[0].count = lessons.length;
    currentCurriculum[0].summary = `${lessons.length}টি ভিডিও ক্লাস`;
  }

  return {
    ...course,
    totalClasses: `${lessons.length} টি ক্লাস`,
    curriculum: currentCurriculum,
    lastSyncedAt: new Date().toISOString()
  };
}
