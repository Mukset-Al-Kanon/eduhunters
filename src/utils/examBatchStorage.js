/**
 * examBatchStorage.js
 * Central utility to load, customize, reorder, and persist Exam Batches,
 * Quizzes, Categories/Subcategories, and individual Exam Questions.
 */
import { supabase, isSupabaseConfigured } from '../supabase/config';
import { db, isFirebaseConfigured } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const MANIFEST_OVERRIDE_KEY = 'eduhunters_exam_manifest_overrides';
const CUSTOM_EXAM_PREFIX = 'eduhunters_custom_exam_';

// High-speed in-memory caches for zero-lag UI switching
const inMemoryExamCache = new Map();
let inMemoryManifestCache = null;

/**
 * Loads the complete manifest, merging /exams_data/all_exams_manifest.json
 * with any admin overrides saved in Supabase, Firestore, or localStorage.
 */
export async function getMergedExamManifest(forceRefresh = false) {
  if (!forceRefresh && inMemoryManifestCache) {
    return inMemoryManifestCache;
  }

  let baseManifest = { version: '2.0.0', categories: [], exams: [] };
  try {
    const res = await fetch('/exams_data/all_exams_manifest.json');
    if (res.ok) {
      baseManifest = await res.json();
    }
  } catch (err) {
    console.warn('Could not fetch base manifest, using fallback:', err);
  }

  let cloudOverrides = null;

  // 1. Proactive cloud check from Supabase (primary)
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: row, error } = await supabase
        .from('eduhunters_site')
        .select('data')
        .eq('id', 'exam_manifest')
        .maybeSingle();
      if (!error && row?.data) {
        cloudOverrides = row.data;
      }
    } catch (e) {
      console.warn('[ExamStorage] Supabase manifest fetch note:', e);
    }
  }

  // 2. Fallback cloud check from Firestore
  if (!cloudOverrides && isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, 'eduhunters_site', 'exam_manifest'));
      if (snap.exists()) {
        cloudOverrides = snap.data();
      }
    } catch (e) {
      console.warn('[ExamStorage] Firestore manifest fetch note:', e);
    }
  }

  // 3. Check localStorage overrides
  let localOverrides = null;
  try {
    const rawOverrides = localStorage.getItem(MANIFEST_OVERRIDE_KEY);
    if (rawOverrides) {
      localOverrides = JSON.parse(rawOverrides);
    }
  } catch (err) {
    console.error('Error reading local manifest overrides:', err);
  }

  // Merge the freshest overrides
  let overrides = null;
  if (cloudOverrides && localOverrides) {
    const cloudTime = cloudOverrides.updatedAt ? new Date(cloudOverrides.updatedAt).getTime() : 0;
    const localTime = localOverrides.updatedAt ? new Date(localOverrides.updatedAt).getTime() : 0;
    overrides = localTime > cloudTime ? localOverrides : cloudOverrides;
  } else {
    overrides = cloudOverrides || localOverrides;
  }

  if (overrides) {
    try {
      if (overrides.categories && Array.isArray(overrides.categories)) {
        baseManifest.categories = overrides.categories;
      }
      if (overrides.exams && Array.isArray(overrides.exams)) {
        const overrideMap = new Map(overrides.exams.map(e => [e.id, e]));
        const mergedExams = [];
        const seenIds = new Set();

        // 1. Process base exams, applying any overrides
        for (const baseExam of (baseManifest.exams || [])) {
          if (overrideMap.has(baseExam.id)) {
            mergedExams.push(overrideMap.get(baseExam.id));
          } else {
            mergedExams.push(baseExam);
          }
          seenIds.add(baseExam.id);
        }

        // 2. Append any brand new exams created by admin
        for (const overrideExam of overrides.exams) {
          if (!seenIds.has(overrideExam.id)) {
            mergedExams.push(overrideExam);
            seenIds.add(overrideExam.id);
          }
        }

        baseManifest.exams = mergedExams;
      }

      try {
        localStorage.setItem(MANIFEST_OVERRIDE_KEY, JSON.stringify(overrides));
      } catch (e) {}
    } catch (err) {
      console.error('Error applying manifest overrides:', err);
    }
  }

  inMemoryManifestCache = baseManifest;
  return baseManifest;
}

/**
 * Saves updated manifest (categories & exams list) to Supabase, Firestore, and localStorage.
 */
export function saveManifestOverrides(manifest) {
  inMemoryManifestCache = manifest;
  const payload = {
    categories: manifest.categories || [],
    exams: manifest.exams || [],
    updatedAt: new Date().toISOString()
  };

  try {
    localStorage.setItem(MANIFEST_OVERRIDE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error('Error saving manifest overrides locally:', err);
  }

  // Asynchronously sync to Supabase (primary)
  if (isSupabaseConfigured && supabase) {
    supabase
      .from('eduhunters_site')
      .upsert({
        id: 'exam_manifest',
        data: payload,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .then(() => {})
      .catch(e => console.warn('[ExamStorage] Supabase manifest save note:', e));
  }

  // Manifest is saved directly to Supabase eduhunters_site (100% Centralized Cloud)
}

/**
 * Loads full exam details and questions for a specific exam.
 * Checks in-memory cache first, then localStorage, then Supabase, then Firestore, then static JSON.
 */
export async function loadExamQuestions(examMeta) {
  if (!examMeta) return { questions: [] };

  // 1. High speed memory cache check (0ms)
  if (inMemoryExamCache.has(examMeta.id)) {
    const cached = inMemoryExamCache.get(examMeta.id);
    if (cached && cached.questions && cached.questions.length > 0) {
      return cached;
    }
  }

  const customKey = `${CUSTOM_EXAM_PREFIX}${examMeta.id}`;
  const customRaw = localStorage.getItem(customKey);
  if (customRaw) {
    try {
      const parsed = JSON.parse(customRaw);
      const normalized = normalizeExamQuestions(parsed, examMeta);
      if (normalized && normalized.questions && normalized.questions.length > 0) {
        inMemoryExamCache.set(examMeta.id, normalized);
        return normalized;
      }
    } catch (e) {
      console.warn('Error parsing cached custom exam:', e);
    }
  }

  // 3. Proactive Cloud check from Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: row } = await supabase
        .from('eduhunters_site')
        .select('data')
        .eq('id', `exam_${examMeta.id}`)
        .maybeSingle();
      if (row?.data) {
        const normalized = normalizeExamQuestions(row.data, examMeta);
        if (normalized && normalized.questions && normalized.questions.length > 0) {
          inMemoryExamCache.set(examMeta.id, normalized);
          try { localStorage.setItem(customKey, JSON.stringify(normalized)); } catch (e) {}
          return normalized;
        }
      }
    } catch (e) {}
  }

  // 4. Proactive Cloud check from Firestore
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, 'eduhunters_site', `exam_${examMeta.id}`));
      if (snap.exists()) {
        const cloudData = snap.data();
        if (cloudData) {
          const normalized = normalizeExamQuestions(cloudData, examMeta);
          if (normalized && normalized.questions && normalized.questions.length > 0) {
            inMemoryExamCache.set(examMeta.id, normalized);
            try { localStorage.setItem(customKey, JSON.stringify(normalized)); } catch (e) {}
            return normalized;
          }
        }
      }
    } catch (e) {}
  }

  // Fetch from static JSON file if filePath exists
  if (examMeta.filePath) {
    // Strategy 1: encodeURI (properly handles Unicode, commas, pluses and spaces)
    const candidateUrls = [
      `/exams_data/${encodeURI(examMeta.filePath)}`,
      `/exams_data/${examMeta.filePath}`,
      `/exams_data/${examMeta.filePath.split('/').map(segment => encodeURIComponent(segment)).join('/')}`
    ];

    for (const url of candidateUrls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('text/html')) {
            // Server returned SPA index.html fallback, skip this candidate
            continue;
          }
          let rawText = await res.text();
          if (rawText.charCodeAt(0) === 0xFEFF) {
            rawText = rawText.slice(1);
          }
          const trimmed = rawText.trim();
          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            const parsed = JSON.parse(trimmed);
            const normalized = normalizeExamQuestions(parsed, examMeta);
            if (normalized && normalized.questions && normalized.questions.length > 0) {
              inMemoryExamCache.set(examMeta.id, normalized);
              return normalized;
            }
          }
        }
      } catch (err) {
        // Continue to next candidate
      }
    }
    console.warn(`Could not load valid exam questions for ${examMeta.id} (${examMeta.title})`);
  }

  // Return empty structure if not found (do NOT cache empty exam in memory)
  const emptyExam = {
    exam_id: examMeta.id,
    title: examMeta.title,
    category: examMeta.category,
    duration_minutes: examMeta.durationMinutes || 40,
    total_questions: 0,
    negative_mark: examMeta.negativeMark || 0.25,
    questions: []
  };
  return emptyExam;
}

/**
 * Cleans and sanitizes question explanations.
 * Filters out "missing", "none", "n/a", empty strings, and placeholders.
 */
export function cleanExplanation(explanation, question = null) {
  if (!explanation) return '';
  const trimmed = String(explanation).trim();
  const lower = trimmed.toLowerCase();

  // Known useless placeholders in dataset
  const placeholders = [
    'missing',
    'none',
    'n/a',
    'na',
    'null',
    'undefined',
    '-',
    '--',
    '---',
    '...',
    '.',
    'no explanation',
    'not available',
    'no explanation available',
    'none.',
    'missing.'
  ];

  if (placeholders.includes(lower) || lower.startsWith('missing') || lower === 'not available') {
    return '';
  }

  return trimmed;
}

/**
 * Safely resolves the 0-based correct option index for ANY question object,
 * handling correct_index, correctIndex, correctAnswer, correct_answer,
 * answer, ans, correctOption, numeric 1-based index, letter ('A'..'E'), Bengali letter ('ক'..'ঙ'),
 * or exact option text string.
 */
export function getQuestionCorrectIndex(q) {
  if (!q) return 0;

  const options = Array.isArray(q.options) ? q.options : [];
  const optionsCount = options.length || 4;

  // 1. Direct numeric types
  for (const key of ['correct_index', 'correctIndex', 'correctOption']) {
    if (typeof q[key] === 'number' && !isNaN(q[key])) {
      if (q[key] >= 0 && q[key] < optionsCount) return q[key];
      if (q[key] === optionsCount && optionsCount > 0) return optionsCount - 1;
    }
  }

  // 2. Candidate value (string or number from any known field)
  const candidate = q.correct_index ?? 
                    q.correctIndex ?? 
                    q.correct_answer ?? 
                    q.correctAnswer ?? 
                    q.answer ?? 
                    q.ans ?? 
                    q.rightAnswer ?? 
                    q.correctOption ?? 
                    q.correct;

  if (candidate !== undefined && candidate !== null) {
    const rawStr = String(candidate).trim();

    // Check pure integer string
    if (/^[0-9]+$/.test(rawStr)) {
      const num = parseInt(rawStr, 10);
      // 0-based: if 0 <= num < optionsCount
      if (num >= 0 && num < optionsCount) return num;
      // 1-based: e.g. 1..4
      if (num >= 1 && num <= optionsCount) return num - 1;
      return 0;
    }

    // Check single Latin letter: A, B, C, D, E
    const upper = rawStr.toUpperCase();
    if (['A', 'B', 'C', 'D', 'E'].includes(upper)) {
      const letterIdx = upper.charCodeAt(0) - 65;
      return letterIdx < optionsCount ? letterIdx : 0;
    }

    // Check Bengali letter: ক, খ, গ, ঘ, ঙ
    const bnLetters = ['ক', 'খ', 'গ', 'ঘ', 'ঙ'];
    const bnIdx = bnLetters.indexOf(rawStr);
    if (bnIdx !== -1 && bnIdx < optionsCount) {
      return bnIdx;
    }

    // Check if rawStr matches option text
    if (options.length > 0) {
      const lowerCandidate = rawStr.toLowerCase();
      const matchIdx = options.findIndex(opt => String(opt).trim().toLowerCase() === lowerCandidate);
      if (matchIdx !== -1) return matchIdx;
    }
  }

  // 3. Fallback: Check if correct_answer or answer matches any option text directly
  if (options.length > 0) {
    for (const key of ['correct_answer', 'correctAnswer', 'answer', 'ans', 'rightAnswer']) {
      if (q[key]) {
        const val = String(q[key]).trim().toLowerCase();
        const matchIdx = options.findIndex(opt => String(opt).trim().toLowerCase() === val);
        if (matchIdx !== -1) return matchIdx;
      }
    }
  }

  return 0;
}

/**
 * Robust answer extractor to reliably retrieve a user's selected answer index,
 * whether active answers were keyed by q.id, String(q.id), Number(q.id), question_no, or numeric index.
 */
export function getUserAnswer(activeUserAnswers, q, idx) {
  if (!activeUserAnswers || typeof activeUserAnswers !== 'object') return undefined;
  if (q) {
    if (q.id !== undefined && activeUserAnswers[q.id] !== undefined) return activeUserAnswers[q.id];
    if (q.id !== undefined && activeUserAnswers[String(q.id)] !== undefined) return activeUserAnswers[String(q.id)];
    if (q.id !== undefined && !isNaN(Number(q.id)) && activeUserAnswers[Number(q.id)] !== undefined) return activeUserAnswers[Number(q.id)];
    if (q.question_no !== undefined && activeUserAnswers[q.question_no] !== undefined) return activeUserAnswers[q.question_no];
    if (q.question_no !== undefined && activeUserAnswers[String(q.question_no)] !== undefined) return activeUserAnswers[String(q.question_no)];
    if (q.question_no !== undefined && activeUserAnswers[`q-${q.question_no}`] !== undefined) return activeUserAnswers[`q-${q.question_no}`];
  }
  if (idx !== undefined && idx !== null) {
    if (activeUserAnswers[`q-${idx + 1}`] !== undefined) return activeUserAnswers[`q-${idx + 1}`];
    if (activeUserAnswers[idx] !== undefined) return activeUserAnswers[idx];
    if (activeUserAnswers[String(idx)] !== undefined) return activeUserAnswers[String(idx)];
    if (activeUserAnswers[idx + 1] !== undefined) return activeUserAnswers[idx + 1];
  }
  return undefined;
}

/**
 * Normalizes question structure into uniform format:
 * { id, question_no, question, options: [A, B, C, D], correct_index: 0..3, correctIndex: 0..3, explanation, images: [] }
 */
export function normalizeExamQuestions(examData, fallbackMeta = {}) {
  const rawQuestions = examData.questions || (Array.isArray(examData) ? examData : []);
  const latinLetters = ['A', 'B', 'C', 'D', 'E'];

  const normalized = rawQuestions.map((q, idx) => {
    const options = Array.isArray(q.options)
      ? q.options.map(opt => typeof opt === 'string' ? opt.trim() : String(opt))
      : ['অপশন ক', 'অপশন খ', 'অপশন গ', 'অপশন ঘ'];

    const qWithOptions = { ...q, options };
    const cIdx = getQuestionCorrectIndex(qWithOptions);
    const sanitizedExplanation = cleanExplanation(q.explanation, qWithOptions);

    return {
      ...q,
      id: q.id !== undefined ? q.id : `q-${idx + 1}`,
      question_no: q.question_no || (idx + 1),
      question: q.question || '',
      options,
      correct_index: cIdx,
      correctIndex: cIdx,
      correct_answer: latinLetters[cIdx] || 'A',
      explanation: sanitizedExplanation,
      images: Array.isArray(q.images) ? q.images : (q.image ? [q.image] : [])
    };
  });

  const rawNegVal = examData.negative_mark !== undefined ? examData.negative_mark : (fallbackMeta.negativeMark || 0.25);
  let parsedNeg = typeof rawNegVal === 'string' 
    ? parseFloat(rawNegVal.replace(/[০-৯]/g, d => ({ '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' })[d]))
    : Number(rawNegVal);
  if (isNaN(parsedNeg) || parsedNeg <= 0) parsedNeg = 0.25;
  if (parsedNeg >= 1) parsedNeg = parsedNeg / 100; // e.g., 25 becomes 0.25

  return {
    ...examData,
    title: examData.title || fallbackMeta.title || 'Untitled Exam',
    duration_minutes: fallbackMeta.durationMinutes || examData.duration_minutes || 40,
    total_questions: normalized.length,
    negative_mark: parsedNeg,
    questions: normalized
  };
}

/**
 * Updates individual exam duration in minutes, syncing both manifest & custom exam storage.
 */
export function updateExamDuration(examId, durationMinutes, manifest, onManifestUpdate) {
  const newDuration = Math.max(1, parseInt(durationMinutes, 10) || 40);

  // 1. Update manifest
  let nextManifest = manifest;
  if (manifest && manifest.exams) {
    const updatedExams = manifest.exams.map(e => {
      if (e.id === examId) {
        return { ...e, durationMinutes: newDuration };
      }
      return e;
    });
    nextManifest = { ...manifest, exams: updatedExams };
    saveManifestOverrides(nextManifest);
    if (onManifestUpdate) {
      onManifestUpdate(nextManifest);
    }
  }

  // 2. Update custom exam cache if exists
  if (inMemoryExamCache.has(examId)) {
    const cached = inMemoryExamCache.get(examId);
    const updatedCached = { ...cached, duration_minutes: newDuration };
    inMemoryExamCache.set(examId, updatedCached);
    localStorage.setItem(`${CUSTOM_EXAM_PREFIX}${examId}`, JSON.stringify(updatedCached));
  } else {
    const customKey = `${CUSTOM_EXAM_PREFIX}${examId}`;
    const raw = localStorage.getItem(customKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        parsed.duration_minutes = newDuration;
        localStorage.setItem(customKey, JSON.stringify(parsed));
      } catch (e) {
        console.warn('Could not update custom exam duration in storage', e);
      }
    }
  }

  return nextManifest;
}

/**
 * Saves exam questions to localStorage, Supabase, and Firestore, and triggers manifest update
 */
export function saveCustomExam(examId, updatedExamData, manifest, onManifestUpdate) {
  try {
    const key = `${CUSTOM_EXAM_PREFIX}${examId}`;
    try {
      localStorage.setItem(key, JSON.stringify(updatedExamData));
    } catch (e) {
      console.warn('LocalStorage quota warning for custom exam:', e);
    }
    inMemoryExamCache.set(examId, updatedExamData);

    // Asynchronously sync question set to Supabase PostgreSQL (primary)
    if (isSupabaseConfigured && supabase) {
      supabase
        .from('eduhunters_site')
        .upsert({
          id: `exam_${examId}`,
          data: updatedExamData,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })
        .then(() => {})
        .catch(e => console.warn('[ExamStorage] Supabase custom exam save note:', e));
    }

    // Custom exam is saved directly to Supabase eduhunters_site (100% Centralized Cloud)

    // Update question count in manifest
    if (manifest && manifest.exams) {
      const updatedExams = manifest.exams.map(e => {
        if (e.id === examId) {
          return {
            ...e,
            title: updatedExamData.title || e.title,
            totalQuestions: updatedExamData.questions ? updatedExamData.questions.length : e.totalQuestions,
            durationMinutes: updatedExamData.duration_minutes || e.durationMinutes
          };
        }
        return e;
      });

      const nextManifest = { ...manifest, exams: updatedExams };
      saveManifestOverrides(nextManifest);
      if (onManifestUpdate) {
        onManifestUpdate(nextManifest);
      }
      return nextManifest;
    }
  } catch (err) {
    console.error('Error saving custom exam:', err);
  }
  return manifest;
}

/**
 * Intelligent parser to convert raw text with multiple MCQs into structured question objects.
 * Supports Bengali & English lettering (A/B/C/D or ক/খ/গ/ঘ or 1/2/3/4).
 */
export function parseBulkQuestionsFromText(rawText, startingNo = 1) {
  if (!rawText || !rawText.trim()) return [];

  // Split into candidate question blocks
  const normalizedText = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedText.split('\n');

  const parsedQuestions = [];
  let currentBlock = [];

  const isQuestionStart = (line) => {
    const trimmed = line.trim();
    // Matches "1.", "1)", "১.", "১)", "Q1:", "প্রশ্ন ১:", etc.
    return /^(\d+|[০-৯]+)[.)]\s+|^[Qq]\d+[:.]\s+|^প্রশ্ন\s*(\d+|[০-৯]+)[:.]\s+/.test(trimmed);
  };

  for (const line of lines) {
    if (isQuestionStart(line) && currentBlock.length > 0) {
      const qObj = parseSingleBlock(currentBlock, startingNo + parsedQuestions.length);
      if (qObj) parsedQuestions.push(qObj);
      currentBlock = [line];
    } else {
      currentBlock.push(line);
    }
  }

  if (currentBlock.length > 0) {
    const qObj = parseSingleBlock(currentBlock, startingNo + parsedQuestions.length);
    if (qObj) parsedQuestions.push(qObj);
  }

  return parsedQuestions;
}

function parseSingleBlock(blockLines, questionNo) {
  if (!blockLines || blockLines.length === 0) return null;

  let questionText = '';
  const options = [];
  let correctIndex = 0;
  let explanation = '';

  const optRegex = /^(?:Option\s*([a-dA-D1-4])[:.\s]|([a-dA-Dকখগঘ1-4])[).:-]|[([]([a-dA-Dকখগঘ1-4])[)\]])\s*(.*)$/i;
  const ansRegex = /^(?:Ans|Answer|উত্তর|সঠিক|Correct)[\s:-]+([a-dA-Dকখগঘ1-4])/i;
  const expRegex = /^(?:Explanation|Expl|ব্যাখ্যা|রেফারেন্স)[\s:-]+(.*)$/i;

  let hasQuestion = false;

  for (let idx = 0; idx < blockLines.length; idx++) {
    const rawLine = blockLines[idx];
    const line = rawLine.trim();
    if (!line) continue;

    // First non-empty line of the block is ALWAYS the question
    if (!hasQuestion) {
      const cleanQ = line.replace(/^(\d+|[০-৯]+)[.)]\s+|^[Qq]\d+[:.]\s+|^প্রশ্ন\s*(\d+|[০-৯]+)[:.]\s+/, '').trim();
      questionText = cleanQ || line;
      hasQuestion = true;
      continue;
    }

    // Check Answer line
    const ansMatch = line.match(ansRegex);
    if (ansMatch) {
      const ansChar = ansMatch[1].trim().toUpperCase();
      if (['A', '1', 'ক'].includes(ansChar)) correctIndex = 0;
      else if (['B', '2', 'খ'].includes(ansChar)) correctIndex = 1;
      else if (['C', '3', 'গ'].includes(ansChar)) correctIndex = 2;
      else if (['D', '4', 'ঘ'].includes(ansChar)) correctIndex = 3;
      continue;
    }

    // Check Explanation line
    const expMatch = line.match(expRegex);
    if (expMatch) {
      explanation = expMatch[1].trim();
      continue;
    }

    // Check Option line
    const optMatch = line.match(optRegex);
    if (optMatch && options.length < 4) {
      const optVal = (optMatch[4] || optMatch[2] || '').trim();
      options.push(optVal || 'Option');
      continue;
    }

    // If options are still not started, append to question (multi-line question)
    if (options.length === 0) {
      questionText = `${questionText} ${line}`;
    } else if (explanation) {
      explanation = `${explanation} ${line}`;
    }
  }

  // Ensure 4 options
  while (options.length < 4) {
    const labels = ['Option A', 'Option B', 'Option C', 'Option D'];
    options.push(labels[options.length]);
  }

  if (!questionText.trim()) return null;

  const letterLabels = ['A', 'B', 'C', 'D'];

  return {
    id: `q-${Date.now()}-${questionNo}`,
    question_no: questionNo,
    question: questionText.trim(),
    options: options.slice(0, 4),
    correct_index: correctIndex,
    correctAnswer: correctIndex,
    correct_answer: letterLabels[correctIndex] || 'A',
    explanation: explanation.trim(),
    images: []
  };
}
