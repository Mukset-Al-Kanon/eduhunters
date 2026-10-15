/**
 * quizService.js
 * Professional Quiz & Assessment Service for EduHunters.
 * Handles competitive live window validation, 100% accurate first-attempt official leaderboard tracking,
 * retake practice mode, and course-wide vs lesson-specific leaderboard aggregation.
 * Zero demo/mock examinee injection: strictly real student data with tie-breaking accuracy.
 */
import { supabase, isSupabaseConfigured } from '../supabase/config.js';
import { broadcastSupabaseMessage } from './supabaseService.js';

const LOCAL_SUBMISSIONS_KEY = 'eduhunters_local_quiz_submissions';

/**
 * Check if a submission is a dummy or demo submission
 */
export function isDemoSubmission(item) {
  if (!item) return true;
  const sId = String(item.student_id || '').toLowerCase();
  const sName = String(item.student_name || '').toLowerCase();
  const sUser = String(item.student_username || '').toLowerCase();

  if (sId.startsWith('demo_') || sId.includes('demo_std')) return true;
  if (sUser.startsWith('demo_') || sUser === 'examinee') return true;

  const demoNames = [
    'tanvir ahmed',
    'nusrat jahan',
    'samiul islam',
    'sadia rahman',
    'arif hossain',
    'mehedi hasan',
    'farhana akter',
    'rakibul islam',
    'afsana mimi',
    'tahsin chowdhury'
  ];
  return demoNames.some(d => sName.includes(d) || sUser.includes(d.replace(/\s+/g, '_')));
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

/**
 * Check if the quiz is currently inside its live window
 */
export function checkQuizLiveStatus(quiz) {
  if (!quiz) {
    return { isLive: true, isUpcoming: false, isExpired: false, statusText: 'Live Exam' };
  }

  const now = new Date();
  const start = quiz.startDate ? new Date(quiz.startDate) : null;
  const end = quiz.endDate ? new Date(quiz.endDate) : null;

  if (start && !isNaN(start.getTime()) && now < start) {
    return {
      isLive: false,
      isUpcoming: true,
      isExpired: false,
      startDate: start,
      endDate: end,
      statusText: `Upcoming (Opens: ${start.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })})`
    };
  }

  if (end && !isNaN(end.getTime()) && now > end) {
    return {
      isLive: false,
      isUpcoming: false,
      isExpired: true,
      startDate: start,
      endDate: end,
      statusText: 'Practice Mode (Live Window Closed)'
    };
  }

  return {
    isLive: true,
    isUpcoming: false,
    isExpired: false,
    startDate: start,
    endDate: end,
    statusText: 'Official Live Exam'
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
  const studentId = student?.id || student?.phone || student?.email || `std_${Date.now()}`;
  const studentName = student?.name || student?.displayName || student?.phone || 'Student';
  const studentPhone = student?.phone || '';
  const studentEmail = student?.email || '';
  const studentAvatar = student?.avatar || student?.photoURL || student?.profilePic || '';

  const courseId = String(course?.id || course?.slug || 'course_default');
  const courseSlug = course?.slug || course?.id || '';
  const courseName = course?.title || course?.name || 'Course';

  const lessonId = String(lesson?.id || `lesson_${Date.now()}`);
  const lessonTitle = lesson?.title || 'Class Lesson';
  const quizId = quiz?.id || `quiz_${lessonId}`;

  // Check previous attempts
  const allSubmissions = await fetchAllSubmissions();
  const existingAttempts = allSubmissions.filter(s => 
    String(s.student_id) === String(studentId) && 
    String(s.lesson_id) === String(lessonId)
  );

  const attemptNumber = existingAttempts.length + 1;
  const isFirstAttempt = existingAttempts.length === 0;

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
        // 2a. Attempt insert into dedicated table
        const { error: tblError } = await supabase
          .from('eduhunters_quiz_submissions')
          .insert([submissionPayload]);

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

  return {
    ...submissionPayload,
    isOfficialRanked: isFirstAttempt && isLiveWindow
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

  // Filter only official first attempts for this lesson
  const filtered = allSubmissions.filter(s => {
    if (isDemoSubmission(s)) return false;
    if (!s.is_first_attempt) return false;

    const matchLesson = !lessonId || String(s.lesson_id) === String(lessonId);
    const matchCourse = !courseId || 
      String(s.course_id).toLowerCase() === String(courseId).toLowerCase() || 
      String(s.course_slug || '').toLowerCase() === String(courseId).toLowerCase();
    return matchLesson && matchCourse;
  });

  // Deduplicate strictly by student_id to ensure 1 rank per student
  const studentBestMap = new Map();
  for (const item of filtered) {
    const sId = String(item.student_id);
    if (!studentBestMap.has(sId)) {
      studentBestMap.set(sId, item);
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
    if (!s.is_first_attempt) return false;

    if (candidateIds.size === 0) return true;

    const sCId = String(s.course_id || '').toLowerCase();
    const sCSlug = String(s.course_slug || '').toLowerCase();
    const sCName = String(s.course_name || '').toLowerCase();

    return Array.from(candidateIds).some(cid => 
      sCId === cid || 
      sCSlug === cid || 
      (sCName && sCName.includes(cid)) || 
      (cid && cid.includes(sCName))
    );
  });

  // Deduplicate per lesson per student before aggregating
  const studentLessonMap = new Map();
  courseSubmissions.forEach(sub => {
    const key = `${sub.student_id}_${sub.lesson_id}`;
    if (!studentLessonMap.has(key)) {
      studentLessonMap.set(key, sub);
    }
  });

  const studentMap = {};
  studentLessonMap.forEach(sub => {
    const sId = sub.student_id;
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
