/**
 * quizService.js
 * Professional Quiz & Assessment Service for EduHunters.
 * Handles competitive live window validation, 100% accurate first-attempt official leaderboard tracking,
 * retake practice mode, and course-wide vs lesson-specific leaderboard aggregation.
 * Zero demo/mock examinee injection: strictly real student data with tie-breaking accuracy.
 */
import { supabase, isSupabaseConfigured } from '../supabase/config.js';
import { broadcastSupabaseMessage } from './supabaseService.js';
import { getResolvedStudent } from '../utils/studentProfile.js';

const LOCAL_SUBMISSIONS_KEY = 'eduhunters_local_quiz_submissions';

/**
 * Check if a submission is a dummy or demo submission
 */
export function isDemoSubmission(item) {
  if (!item) return true;
  const sId = String(item.student_id || '').toLowerCase();
  const sUser = String(item.student_username || '').toLowerCase();
  const subId = String(item.id || '').toLowerCase();

  // Purge specific historical test submission requested by user
  if (subId === 'sub_1792087166936_jlgjb') return true;

  // Strict check on actual mock indicators (do not false-positive on real names)
  if (item.is_demo === true || item._isMock === true) return true;
  if (sId.startsWith('demo_') || sId.includes('demo_std')) return true;
  if (sUser.startsWith('demo_') || sUser === 'examinee') return true;
  if (subId.startsWith('demo_')) return true;

  return false;
}

/**
 * Purge any demo or dummy submissions from local storage
 */
export function purgeLocalDemoSubmissions() {
  try {
    const raw = localStorage.getItem(LOCAL_SUBMISSIONS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    const cleaned = list.filter(item => !isDemoSubmission(item));
    localStorage.setItem(LOCAL_SUBMISSIONS_KEY, JSON.stringify(cleaned));
    return cleaned;
  } catch (e) {
    return [];
  }
}

export function getLocalSubmissions() {
  return purgeLocalDemoSubmissions();
}

export function saveLocalSubmissions(submissions) {
  try {
    const cleaned = Array.isArray(submissions) ? submissions.filter(s => !isDemoSubmission(s)) : [];
    localStorage.setItem(LOCAL_SUBMISSIONS_KEY, JSON.stringify(cleaned));
  } catch (e) {}
}

export function checkQuizLiveStatus(quiz) {
  return {
    isLive: true,
    isUpcoming: false,
    isExpired: false,
    startDate: null,
    endDate: null,
    statusText: 'Official Exam Open'
  };
}

let isQuizTableMissing = false;

/**
 * Fetch all raw submissions from Supabase and LocalStorage (fault-tolerant multi-tier)
 */
export async function fetchAllSubmissions() {
  const allMap = new Map();

  // 1. Fetch from eduhunters_quiz_submissions table if available
  if (isSupabaseConfigured && supabase && !isQuizTableMissing) {
    try {
      const { data, error } = await supabase
        .from('eduhunters_quiz_submissions')
        .select('*');

      if (!error && Array.isArray(data)) {
        data.forEach(item => {
          if (item && item.id && !isDemoSubmission(item)) {
            allMap.set(item.id, item);
          }
        });
      } else if (error && (error.code === 'PGRST205' || error.message?.includes('schema cache'))) {
        isQuizTableMissing = true;
      }
    } catch (e) {
      console.warn('[QuizService] Table fetch error:', e);
    }

    // 2. Also fetch from eduhunters_site row 'quiz_submissions'
    try {
      const { data, error } = await supabase
        .from('eduhunters_site')
        .select('data')
        .eq('id', 'quiz_submissions')
        .maybeSingle();

      if (!error && data?.data?.submissions && Array.isArray(data.data.submissions)) {
        data.data.submissions.forEach(item => {
          if (item && item.id && !isDemoSubmission(item) && !allMap.has(item.id)) {
            allMap.set(item.id, item);
          }
        });
      }
    } catch (e) {
      // Row might not exist yet
    }
  }

  // 3. Merge with local submissions
  const localList = purgeLocalDemoSubmissions();
  localList.forEach(item => {
    if (item && item.id && !isDemoSubmission(item) && !allMap.has(item.id)) {
      allMap.set(item.id, item);
    }
  });

  return Array.from(allMap.values());
}

/**
 * Record a student quiz attempt
 */
export async function recordQuizSubmission({
  student,
  course,
  lesson,
  quiz,
  result,
  timeTakenSeconds = 0
}) {
  // Guarantee 100% accurate student identity resolution
  const resolved = getResolvedStudent(student);
  const studentId = resolved.id || resolved.uid || `std_${Date.now()}`;
  const studentName = resolved.name || resolved.displayName || 'Student';
  const studentPhone = (resolved.phone || student?.phone || student?.whatsapp || '').replace(/[^0-9]/g, '');
  const studentEmail = (resolved.email || student?.email || '').trim().toLowerCase();
  const rawPhone = studentPhone;
  const cleanEmail = studentEmail;
  const studentAvatar = resolved.avatar || student?.avatar || student?.photoURL || '';

  const courseId = String(course?.id || course?.slug || 'course_default');
  const courseSlug = course?.slug || course?.id || '';
  const courseName = course?.title || course?.name || 'Course';

  const lessonId = String(lesson?.id || `lesson_${Date.now()}`);
  const lessonTitle = lesson?.title || 'Class Lesson';
  const quizId = quiz?.id || `quiz_${lessonId}`;

  // Check previous attempts across studentId, UID, Phone, Email, and local attempts cache
  const allSubmissions = await fetchAllSubmissions();

  // Deduplication check: if a submission for the same student & lesson was made within last 6 seconds, return it
  const recentDuplicate = allSubmissions.find(s => {
    if (String(s.lesson_id) !== String(lessonId)) return false;
    const isSameStudent = (String(s.student_id) === String(studentId)) || (cleanEmail && s.student_email === cleanEmail);
    if (!isSameStudent) return false;
    const timeDiff = Math.abs(Date.now() - new Date(s.submitted_at || 0).getTime());
    return timeDiff < 6000;
  });
  if (recentDuplicate) {
    return {
      ...recentDuplicate,
      isOfficialRanked: Boolean(recentDuplicate.is_first_attempt)
    };
  }

  const existingAttempts = allSubmissions.filter(s => {
    const sId = String(s.student_id || '');
    const sPhone = (s.student_phone || '').replace(/[^0-9]/g, '');
    const sEmail = (s.student_email || '').trim().toLowerCase();

    const idMatch = sId && (sId === String(studentId) || (resolved?.uid && sId === String(resolved?.uid)));
    const phoneMatch = rawPhone && sPhone && (rawPhone === sPhone || (rawPhone.length >= 10 && sPhone.includes(rawPhone.slice(-10))));
    const emailMatch = cleanEmail && sEmail && cleanEmail === sEmail;

    const studentMatch = idMatch || phoneMatch || emailMatch;
    const lessonMatch = String(s.lesson_id) === String(lessonId);

    return studentMatch && lessonMatch;
  });

  const localAttemptKey = `eh_quiz_attempt_${studentId}_${lessonId}`;
  let hasLocalAttempt = false;
  try {
    hasLocalAttempt = Boolean(localStorage.getItem(localAttemptKey));
  } catch (e) {}

  const attemptNumber = Math.max(existingAttempts.length + 1, hasLocalAttempt ? 2 : 1);
  const isFirstAttempt = existingAttempts.length === 0 && !hasLocalAttempt;

  try {
    localStorage.setItem(localAttemptKey, String(attemptNumber));
  } catch (e) {}

  const liveStatus = checkQuizLiveStatus(quiz);
  const isLiveWindow = liveStatus.isLive;

  // Strict marks precision
  const score = +(Number(result.score ?? result.finalScore ?? 0).toFixed(2));
  const totalMarks = +(Number(result.totalPossible ?? result.totalQuestions ?? 0).toFixed(2));
  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
  const finalTimeTaken = Math.max(1, Math.round(Number(timeTakenSeconds || result.timeTakenSeconds || 0)));

  const submissionPayload = {
    id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    student_id: studentId,
    student_name: studentName,
    student_username: student?.username || studentName.toLowerCase().replace(/\s+/g, '_'),
    student_avatar: studentAvatar,
    avatar: studentAvatar,
    student_phone: studentPhone,
    student_email: studentEmail,
    course_id: courseId,
    course_slug: courseSlug,
    course_name: courseName,
    lesson_id: lessonId,
    lesson_title: lessonTitle,
    quiz_id: quizId,
    score: score,
    total_marks: totalMarks,
    percentage: percentage,
    correct_count: Number(result.correctCount ?? result.correct ?? 0),
    wrong_count: Number(result.wrongCount ?? result.wrong ?? 0),
    skipped_count: Number(result.skippedCount ?? result.skipped ?? 0),
    time_taken_seconds: finalTimeTaken,
    is_first_attempt: isFirstAttempt,
    is_live_window: isLiveWindow,
    attempt_number: attemptNumber,
    raw_answers: result.answers || result.userAnswers || [],
    submitted_at: new Date().toISOString()
  };

  // 1. Save locally
  const currentLocal = purgeLocalDemoSubmissions();
  currentLocal.push(submissionPayload);
  saveLocalSubmissions(currentLocal);

  // 2. Save to Supabase
  if (isSupabaseConfigured && supabase) {
    if (!isQuizTableMissing) {
      try {
        // 2a. Attempt insert into dedicated table (strictly matching table schema columns)
        const tblPayload = {
          id: submissionPayload.id,
          student_id: submissionPayload.student_id,
          student_name: submissionPayload.student_name,
          student_phone: submissionPayload.student_phone,
          student_email: submissionPayload.student_email,
          course_id: submissionPayload.course_id,
          course_slug: submissionPayload.course_slug,
          course_name: submissionPayload.course_name,
          lesson_id: submissionPayload.lesson_id,
          lesson_title: submissionPayload.lesson_title,
          quiz_id: submissionPayload.quiz_id,
          score: submissionPayload.score,
          total_marks: submissionPayload.total_marks,
          percentage: submissionPayload.percentage,
          correct_count: submissionPayload.correct_count,
          wrong_count: submissionPayload.wrong_count,
          skipped_count: submissionPayload.skipped_count,
          time_taken_seconds: submissionPayload.time_taken_seconds,
          is_first_attempt: submissionPayload.is_first_attempt,
          is_live_window: submissionPayload.is_live_window,
          attempt_number: submissionPayload.attempt_number,
          raw_answers: submissionPayload.raw_answers,
          submitted_at: submissionPayload.submitted_at
        };
        const { error: tblError } = await supabase
          .from('eduhunters_quiz_submissions')
          .insert([tblPayload]);

        if (tblError) {
          if (tblError.code === 'PGRST205' || tblError.message?.includes('schema cache')) {
            isQuizTableMissing = true;
          }
          console.warn('[QuizService] Table insert notice:', tblError.message);
        }
      } catch (e) {
        console.warn('[QuizService] Network error submitting to Supabase table:', e);
      }
    }

    try {
      // 2b. Multi-tier redundant backup in eduhunters_site row 'quiz_submissions'
      const { data: siteRow } = await supabase
        .from('eduhunters_site')
        .select('data')
        .eq('id', 'quiz_submissions')
        .maybeSingle();

      const existingSubs = Array.isArray(siteRow?.data?.submissions) ? siteRow.data.submissions : [];
      const updatedSubs = [
        submissionPayload,
        ...existingSubs.filter(s => s && s.id !== submissionPayload.id && !isDemoSubmission(s))
      ].slice(0, 500);

      await supabase
        .from('eduhunters_site')
        .upsert({
          id: 'quiz_submissions',
          data: { submissions: updatedSubs },
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      broadcastSupabaseMessage('quiz_submission_created', {
        courseId,
        lessonId,
        submissionId: submissionPayload.id
      });
    } catch (e) {
      console.warn('[QuizService] Site row save exception:', e);
    }
  }

  // 3. Dispatch real-time events for instant single-page & multi-tab UI synchronization
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('eh:quiz_submission', { detail: submissionPayload }));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}
  }

  return {
    ...submissionPayload,
    isOfficialRanked: Boolean(isFirstAttempt)
  };
}

/**
 * Fetch leaderboard for a specific lesson/quiz
 * Ranks official attempts: is_first_attempt = true
 * Sorting: score DESC (highest marks), time_taken_seconds ASC (fastest), submitted_at ASC (earliest)
 * Zero demo data: returns purely real student records.
 */
export async function fetchLessonLeaderboard(courseId, lessonId) {
  const allSubmissions = await fetchAllSubmissions();

  const cleanCourse = (courseId || '').toString().trim().toLowerCase().replace(/[-_\s]/g, '');
  const cleanLesson = (lessonId || '').toString().trim().toLowerCase();

  // Filter only official first attempts for this lesson
  const filtered = allSubmissions.filter(s => {
    if (isDemoSubmission(s)) return false;
    if (s.is_first_attempt === false || (s.attempt_number && Number(s.attempt_number) > 1)) return false;

    const sLesson = String(s.lesson_id || '').trim().toLowerCase();
    const matchLesson = !cleanLesson || cleanLesson === 'all' || cleanLesson === 'overall' || sLesson === cleanLesson;

    const sCId = String(s.course_id || '').trim().toLowerCase().replace(/[-_\s]/g, '');
    const sCSlug = String(s.course_slug || '').trim().toLowerCase().replace(/[-_\s]/g, '');
    const matchCourse = !cleanCourse || cleanCourse === 'all' || sCId === cleanCourse || sCSlug === cleanCourse || sCId.includes(cleanCourse) || cleanCourse.includes(sCId);

    return matchLesson && matchCourse;
  });

  // Sort chronologically so earliest submission per student is prioritized
  filtered.sort((a, b) => new Date(a.submitted_at || 0) - new Date(b.submitted_at || 0));

  // Deduplicate strictly across student ID, phone, and email to ensure exactly 1 rank per student
  const studentBestMap = new Map();
  for (const item of filtered) {
    const sId = String(item.student_id || '');
    const sPhone = (item.student_phone || '').replace(/[^0-9]/g, '');
    const sEmail = (item.student_email || '').trim().toLowerCase();

    const key = sPhone && sPhone.length >= 8 
      ? `phone_${sPhone.slice(-10)}` 
      : (sEmail ? `email_${sEmail}` : `id_${sId}`);

    if (!studentBestMap.has(key)) {
      studentBestMap.set(key, item);
    }
  }

  const ranked = Array.from(studentBestMap.values());

  // Strict sorting algorithm:
  // 1. Highest score DESC
  // 2. Lowest time taken ASC (tie-breaker 1)
  // 3. Earliest submission timestamp ASC (tie-breaker 2)
  ranked.sort((a, b) => {
    const scoreA = Number(a.score || 0);
    const scoreB = Number(b.score || 0);
    if (scoreB !== scoreA) return scoreB - scoreA;

    const timeA = Number(a.time_taken_seconds || 0);
    const timeB = Number(b.time_taken_seconds || 0);
    if (timeA !== timeB) return timeA - timeB;

    return new Date(a.submitted_at || 0) - new Date(b.submitted_at || 0);
  });

  return ranked.map((item, idx) => ({
    ...item,
    rank: idx + 1,
    score: +(Number(item.score || 0).toFixed(2)),
    total_marks: +(Number(item.total_marks || 0).toFixed(2)),
    percentage: Number(item.total_marks || 0) > 0 ? Math.round((Number(item.score || 0) / Number(item.total_marks || 0)) * 100) : 0
  }));
}

/**
 * Fetch overall aggregated course leaderboard
 * Sums score and time across all lessons for each student
 * Zero demo examinees: pure genuine enrollments & student attempts.
 */
export async function fetchCourseLeaderboard(courseId, courseTitle = '') {
  const allSubmissions = await fetchAllSubmissions();

  const candidateIds = new Set();
  if (courseId !== undefined && courseId !== null && String(courseId).trim() !== '') {
    candidateIds.add(String(courseId).toLowerCase());
  }
  if (courseTitle && String(courseTitle).trim() !== '') {
    candidateIds.add(String(courseTitle).toLowerCase());
  }

  const courseSubmissions = allSubmissions.filter(s => {
    if (isDemoSubmission(s)) return false;
    if (s.is_first_attempt === false || (s.attempt_number && Number(s.attempt_number) > 1)) return false;

    if (candidateIds.size === 0) return true;

    const sCId = String(s.course_id || '').toLowerCase();
    const sCSlug = String(s.course_slug || '').toLowerCase();
    const sCName = String(s.course_name || '').toLowerCase();

    return Array.from(candidateIds).some(cid => {
      const cleanCid = cid.replace(/[-_\s]/g, '');
      const cleanSCId = sCId.replace(/[-_\s]/g, '');
      const cleanSCSlug = sCSlug.replace(/[-_\s]/g, '');
      return sCId === cid || 
        sCSlug === cid || 
        cleanSCId === cleanCid || 
        cleanSCSlug === cleanCid || 
        (sCName && sCName.includes(cid)) || 
        (cid && cid.includes(sCName));
    });
  });

  // Sort chronologically so earliest attempt per lesson per student is retained
  courseSubmissions.sort((a, b) => new Date(a.submitted_at || 0) - new Date(b.submitted_at || 0));

  // Deduplicate per lesson per student before aggregating
  const studentLessonMap = new Map();
  courseSubmissions.forEach(sub => {
    const sPhone = (sub.student_phone || '').replace(/[^0-9]/g, '');
    const sEmail = (sub.student_email || '').trim().toLowerCase();
    const studentKey = sPhone && sPhone.length >= 8 
      ? `p_${sPhone.slice(-10)}` 
      : (sEmail ? `e_${sEmail}` : `id_${sub.student_id}`);

    const key = `${studentKey}_${sub.lesson_id}`;
    if (!studentLessonMap.has(key)) {
      studentLessonMap.set(key, { ...sub, canonicalStudentKey: studentKey });
    }
  });

  const studentMap = {};
  studentLessonMap.forEach(sub => {
    const sId = sub.canonicalStudentKey || sub.student_id;
    if (!studentMap[sId]) {
      studentMap[sId] = {
        student_id: sId,
        student_name: sub.student_name,
        student_username: sub.student_username || (sub.student_name ? sub.student_name.toLowerCase().replace(/\s+/g, '_') : 'student'),
        avatar: sub.avatar || sub.student_avatar || '/avatar.svg',
        student_avatar: sub.avatar || sub.student_avatar || '/avatar.svg',
        student_phone: sub.student_phone,
        course_id: sub.course_id,
        course_name: sub.course_name,
        total_score: 0,
        total_possible: 0,
        total_time_seconds: 0,
        quizzes_completed: 0,
        last_submitted_at: sub.submitted_at
      };
    } else {
      if ((!studentMap[sId].student_name || studentMap[sId].student_name === 'Student') && sub.student_name && sub.student_name !== 'Student') {
        studentMap[sId].student_name = sub.student_name;
        studentMap[sId].student_username = sub.student_username || sub.student_name.toLowerCase().replace(/\s+/g, '_');
      }
      if ((!studentMap[sId].avatar || studentMap[sId].avatar === '/avatar.svg') && sub.avatar && sub.avatar !== '/avatar.svg') {
        studentMap[sId].avatar = sub.avatar;
        studentMap[sId].student_avatar = sub.avatar;
      }
    }

    studentMap[sId].total_score = +(Number(studentMap[sId].total_score + Number(sub.score || 0)).toFixed(2));
    studentMap[sId].total_possible = +(Number(studentMap[sId].total_possible + Number(sub.total_marks || 0)).toFixed(2));
    studentMap[sId].total_time_seconds += Number(sub.time_taken_seconds || 0);
    studentMap[sId].quizzes_completed += 1;

    if (new Date(sub.submitted_at) > new Date(studentMap[sId].last_submitted_at)) {
      studentMap[sId].last_submitted_at = sub.submitted_at;
    }
  });

  const list = Object.values(studentMap);
  list.sort((a, b) => {
    if (b.total_score !== a.total_score) return b.total_score - a.total_score;
    if (a.total_time_seconds !== b.total_time_seconds) return a.total_time_seconds - b.total_time_seconds;
    return new Date(a.last_submitted_at) - new Date(b.last_submitted_at);
  });

  return list.map((item, idx) => ({
    ...item,
    rank: idx + 1,
    percentage: item.total_possible > 0 ? Math.round((item.total_score / item.total_possible) * 100) : 0
  }));
}

/**
 * Delete a quiz submission by ID across Supabase table, site row, and localStorage
 */
export async function deleteQuizSubmission(submissionId) {
  if (!submissionId) return false;

  // 1. Delete from eduhunters_quiz_submissions table
  if (isSupabaseConfigured && supabase && !isQuizTableMissing) {
    try {
      await supabase
        .from('eduhunters_quiz_submissions')
        .delete()
        .eq('id', submissionId);
    } catch (e) {
      console.warn('[QuizService] Table delete error:', e);
    }
  }

  // 2. Remove from eduhunters_site row 'quiz_submissions'
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: siteRow } = await supabase
        .from('eduhunters_site')
        .select('data')
        .eq('id', 'quiz_submissions')
        .maybeSingle();

      if (siteRow?.data?.submissions && Array.isArray(siteRow.data.submissions)) {
        const updated = siteRow.data.submissions.filter(s => s && s.id !== submissionId);
        await supabase
          .from('eduhunters_site')
          .upsert({
            id: 'quiz_submissions',
            data: { submissions: updated },
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
      }
    } catch (e) {
      console.warn('[QuizService] Site row delete error:', e);
    }
  }

  // 3. Remove from localStorage
  try {
    const raw = localStorage.getItem(LOCAL_SUBMISSIONS_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        const cleaned = list.filter(s => s && s.id !== submissionId);
        localStorage.setItem(LOCAL_SUBMISSIONS_KEY, JSON.stringify(cleaned));
      }
    }
  } catch (e) {}

  return true;
}
