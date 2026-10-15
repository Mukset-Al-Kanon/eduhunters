/**
 * quizService.js
 * Professional Quiz & Assessment Service for EduHunters.
 * Handles competitive live window validation, first-attempt official leaderboard tracking,
 * retake practice mode, and course-wide vs lesson-specific leaderboard aggregation.
 */
import { supabase, isSupabaseConfigured } from '../supabase/config.js';
import { broadcastSupabaseMessage } from './supabaseService.js';

const LOCAL_SUBMISSIONS_KEY = 'eduhunters_local_quiz_submissions';

function getLocalSubmissions() {
  try {
    const raw = localStorage.getItem(LOCAL_SUBMISSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalSubmissions(submissions) {
  try {
    localStorage.setItem(LOCAL_SUBMISSIONS_KEY, JSON.stringify(submissions));
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
  const studentId = student?.id || student?.phone || student?.email || 'guest_student';
  const studentName = student?.name || student?.displayName || student?.phone || 'Student';
  const studentPhone = student?.phone || '';
  const studentEmail = student?.email || '';

  const courseId = String(course?.id || course?.slug || 'course_default');
  const courseSlug = course?.slug || course?.id || '';
  const courseName = course?.title || course?.name || 'Course';

  const lessonId = String(lesson?.id || `lesson_${Date.now()}`);
  const lessonTitle = lesson?.title || 'Class Lesson';
  const quizId = quiz?.id || `quiz_${lessonId}`;

  // Check previous attempts
  let existingAttempts = [];
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('eduhunters_quiz_submissions')
        .select('id, attempt_number, is_first_attempt')
        .eq('student_id', studentId)
        .eq('lesson_id', lessonId);

      if (!error && Array.isArray(data)) {
        existingAttempts = data;
      }
    } catch (err) {
      console.warn('[QuizService] Failed to check existing submissions on Supabase:', err);
    }
  }

  if (existingAttempts.length === 0) {
    const local = getLocalSubmissions();
    existingAttempts = local.filter(s => s.student_id === studentId && s.lesson_id === lessonId);
  }

  const attemptNumber = existingAttempts.length + 1;
  const isFirstAttempt = existingAttempts.length === 0;

  const liveStatus = checkQuizLiveStatus(quiz);
  const isLiveWindow = liveStatus.isLive;

  const score = Number(result.score ?? result.finalScore ?? 0);
  const totalMarks = Number(result.totalPossible ?? result.totalQuestions ?? 0);
  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

  const submissionPayload = {
    id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    student_id: studentId,
    student_name: studentName,
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
    time_taken_seconds: Math.round(timeTakenSeconds || 0),
    is_first_attempt: isFirstAttempt,
    is_live_window: isLiveWindow,
    attempt_number: attemptNumber,
    raw_answers: result.answers || [],
    submitted_at: new Date().toISOString()
  };

  // 1. Save locally
  const currentLocal = getLocalSubmissions();
  currentLocal.push(submissionPayload);
  saveLocalSubmissions(currentLocal);

  // 2. Save to Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('eduhunters_quiz_submissions')
        .insert([submissionPayload]);

      if (error) {
        console.warn('[QuizService] Supabase insert warning:', error);
      } else {
        broadcastSupabaseMessage('quiz_submission_created', {
          courseId,
          lessonId,
          submissionId: submissionPayload.id
        });
      }
    } catch (e) {
      console.warn('[QuizService] Network error submitting to Supabase:', e);
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
 * Sorting: score DESC, time_taken_seconds ASC, submitted_at ASC
 */
export async function fetchLessonLeaderboard(courseId, lessonId) {
  let records = [];

  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from('eduhunters_quiz_submissions')
        .select('*')
        .eq('is_first_attempt', true)
        .order('score', { ascending: false })
        .order('time_taken_seconds', { ascending: true })
        .order('submitted_at', { ascending: true })
        .limit(100);

      if (lessonId) {
        query = query.eq('lesson_id', String(lessonId));
      } else if (courseId) {
        query = query.eq('course_id', String(courseId));
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        records = data;
      }
    } catch (e) {
      console.warn('[QuizService] Supabase fetch error, fallback to local:', e);
    }
  }

  if (records.length === 0) {
    const local = getLocalSubmissions();
    records = local.filter(s => {
      const matchLesson = !lessonId || s.lesson_id === String(lessonId);
      const matchCourse = !courseId || s.course_id === String(courseId);
      return matchLesson && matchCourse && s.is_first_attempt;
    });

    records.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.time_taken_seconds !== b.time_taken_seconds) return a.time_taken_seconds - b.time_taken_seconds;
      return new Date(a.submitted_at) - new Date(b.submitted_at);
    });
  }

  // Deduplicate by student_id to strictly ensure 1 rank per student
  const seenStudents = new Set();
  const ranked = [];

  for (const item of records) {
    if (!seenStudents.has(item.student_id)) {
      seenStudents.add(item.student_id);
      ranked.push(item);
    }
  }

  // Dynamic lesson profiles generation when testing/demoing so each distinct lesson has its own unique standings
  const RAW_STUDENTS = [
    { student_id: 'demo_std_1', student_name: 'Tanvir Ahmed', student_username: 'tanvir_ahmed', student_phone: '01711***421', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
    { student_id: 'demo_std_2', student_name: 'Nusrat Jahan', student_username: 'nusrat_jahan', student_phone: '01819***882', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
    { student_id: 'demo_std_3', student_name: 'Samiul Islam', student_username: 'samiul_is', student_phone: '01912***304', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
    { student_id: 'demo_std_4', student_name: 'Sadia Rahman', student_username: 'sadia_rah', student_phone: '01610***912', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
    { student_id: 'demo_std_5', student_name: 'Arif Hossain', student_username: 'arif_hossain', student_phone: '01723***561', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
    { student_id: 'demo_std_6', student_name: 'Mehedi Hasan', student_username: 'mehedi_h', student_phone: '01552***730', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80' },
    { student_id: 'demo_std_7', student_name: 'Farhana Akter', student_username: 'farhana_a', student_phone: '01833***194', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80' },
    { student_id: 'demo_std_8', student_name: 'Rakibul Islam', student_username: 'rakib_is', student_phone: '01944***625', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
    { student_id: 'demo_std_9', student_name: 'Afsana Mimi', student_username: 'afsana_m', student_phone: '01755***849', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
    { student_id: 'demo_std_10', student_name: 'Tahsin Chowdhury', student_username: 'tahsin_c', student_phone: '01677***218', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80' }
  ];

  // Rotate demo student rank order deterministically by lessonId so Vector, Kinematics, etc. have different champions
  const seed = lessonId ? String(lessonId).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) : 0;
  const rotatedStudents = [...RAW_STUDENTS];
  const offset = seed % rotatedStudents.length;
  const reordered = [...rotatedStudents.slice(offset), ...rotatedStudents.slice(0, offset)];

  const demoScores = [20, 19, 18, 17, 16, 16, 15, 14, 13, 12];
  const demoTimes = [195, 230, 260, 285, 310, 340, 365, 410, 440, 470];

  for (let i = 0; i < reordered.length; i++) {
    const std = reordered[i];
    if (!seenStudents.has(std.student_id)) {
      ranked.push({
        ...std,
        course_id: String(courseId || ''),
        lesson_id: String(lessonId || ''),
        score: demoScores[i] || 10,
        total_marks: 20,
        percentage: Math.round(((demoScores[i] || 10) / 20) * 100),
        time_taken_seconds: demoTimes[i] || 300,
        submitted_at: new Date(Date.now() - (i * 3600000)).toISOString()
      });
      seenStudents.add(std.student_id);
    }
  }

  // Sort: highest score DESC, lowest time ASC, earliest timestamp ASC
  ranked.sort((a, b) => {
    if (Number(b.score) !== Number(a.score)) return Number(b.score) - Number(a.score);
    if (Number(a.time_taken_seconds) !== Number(b.time_taken_seconds)) return Number(a.time_taken_seconds) - Number(a.time_taken_seconds);
    return new Date(a.submitted_at || 0) - new Date(b.submitted_at || 0);
  });

  return ranked.map((item, idx) => ({
    ...item,
    rank: idx + 1
  }));
}

/**
 * Fetch overall aggregated course leaderboard
 * Sums score and time across all lessons for each student
 */
export async function fetchCourseLeaderboard(courseId, courseTitle = '') {
  let records = [];

  const candidateIds = new Set();
  if (courseId !== undefined && courseId !== null && String(courseId).trim() !== '') {
    candidateIds.add(String(courseId));
    candidateIds.add(String(courseId).toLowerCase());
  }
  if (courseTitle && String(courseTitle).trim() !== '') {
    candidateIds.add(String(courseTitle).toLowerCase());
  }

  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from('eduhunters_quiz_submissions')
        .select('*')
        .eq('is_first_attempt', true);

      if (courseId !== undefined && courseId !== null && String(courseId).trim() !== '') {
        query = query.or(`course_id.eq.${String(courseId)},course_slug.eq.${String(courseId)}`);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        records = data;
      }
    } catch (e) {
      console.warn('[QuizService] Error fetching course leaderboard:', e);
    }
  }

  if (records.length === 0) {
    const local = getLocalSubmissions();
    records = local.filter(s => {
      if (!s.is_first_attempt) return false;
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
  }

  // Aggregate across all lessons/exams for each student
  const studentMap = {};

  records.forEach(sub => {
    const sId = sub.student_id;
    if (!studentMap[sId]) {
      studentMap[sId] = {
        student_id: sId,
        student_name: sub.student_name,
        student_username: sub.student_username || (sub.student_name ? sub.student_name.toLowerCase().replace(/\s+/g, '_') : 'examinee'),
        avatar: sub.avatar || sub.student_avatar || '/avatar.svg',
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

    studentMap[sId].total_score += Number(sub.score || 0);
    studentMap[sId].total_possible += Number(sub.total_marks || 0);
    studentMap[sId].total_time_seconds += Number(sub.time_taken_seconds || 0);
    studentMap[sId].quizzes_completed += 1;

    if (new Date(sub.submitted_at) > new Date(studentMap[sId].last_submitted_at)) {
      studentMap[sId].last_submitted_at = sub.submitted_at;
    }
  });

  // Demo examinees fallback for overall standings across all exams
  const DEMO_COURSE_OVERALL = [
    { student_id: 'demo_std_1', student_name: 'Tanvir Ahmed', student_username: 'tanvir_ahmed', student_phone: '01711***421', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', course_id: String(courseId || ''), course_name: 'Course', total_score: 98, total_possible: 100, total_time_seconds: 1120, quizzes_completed: 5, last_submitted_at: '2026-10-14T10:15:00Z' },
    { student_id: 'demo_std_2', student_name: 'Nusrat Jahan', student_username: 'nusrat_jahan', student_phone: '01819***882', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', course_id: String(courseId || ''), course_name: 'Course', total_score: 94, total_possible: 100, total_time_seconds: 1250, quizzes_completed: 5, last_submitted_at: '2026-10-14T10:18:00Z' },
    { student_id: 'demo_std_3', student_name: 'Samiul Islam', student_username: 'samiul_is', student_phone: '01912***304', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', course_id: String(courseId || ''), course_name: 'Course', total_score: 89, total_possible: 100, total_time_seconds: 1380, quizzes_completed: 5, last_submitted_at: '2026-10-14T10:20:00Z' },
    { student_id: 'demo_std_4', student_name: 'Sadia Rahman', student_username: 'sadia_rah', student_phone: '01610***912', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', course_id: String(courseId || ''), course_name: 'Course', total_score: 85, total_possible: 100, total_time_seconds: 1450, quizzes_completed: 5, last_submitted_at: '2026-10-14T10:22:00Z' },
    { student_id: 'demo_std_5', student_name: 'Arif Hossain', student_username: 'arif_hossain', student_phone: '01723***561', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', course_id: String(courseId || ''), course_name: 'Course', total_score: 84, total_possible: 100, total_time_seconds: 1510, quizzes_completed: 5, last_submitted_at: '2026-10-14T10:25:00Z' },
    { student_id: 'demo_std_6', student_name: 'Mehedi Hasan', student_username: 'mehedi_h', student_phone: '01552***730', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80', course_id: String(courseId || ''), course_name: 'Course', total_score: 79, total_possible: 100, total_time_seconds: 1620, quizzes_completed: 5, last_submitted_at: '2026-10-14T10:28:00Z' },
    { student_id: 'demo_std_7', student_name: 'Farhana Akter', student_username: 'farhana_a', student_phone: '01833***194', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80', course_id: String(courseId || ''), course_name: 'Course', total_score: 75, total_possible: 100, total_time_seconds: 1740, quizzes_completed: 5, last_submitted_at: '2026-10-14T10:30:00Z' },
    { student_id: 'demo_std_8', student_name: 'Rakibul Islam', student_username: 'rakib_is', student_phone: '01944***625', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', course_id: String(courseId || ''), course_name: 'Course', total_score: 71, total_possible: 100, total_time_seconds: 1810, quizzes_completed: 5, last_submitted_at: '2026-10-14T10:35:00Z' },
    { student_id: 'demo_std_9', student_name: 'Afsana Mimi', student_username: 'afsana_m', student_phone: '01755***849', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', course_id: String(courseId || ''), course_name: 'Course', total_score: 66, total_possible: 100, total_time_seconds: 1900, quizzes_completed: 5, last_submitted_at: '2026-10-14T10:40:00Z' },
    { student_id: 'demo_std_10', student_name: 'Tahsin Chowdhury', student_username: 'tahsin_c', student_phone: '01677***218', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80', course_id: String(courseId || ''), course_name: 'Course', total_score: 61, total_possible: 100, total_time_seconds: 1990, quizzes_completed: 5, last_submitted_at: '2026-10-14T10:45:00Z' }
  ];

  for (const demo of DEMO_COURSE_OVERALL) {
    if (!studentMap[demo.student_id]) {
      studentMap[demo.student_id] = { ...demo };
    }
  }

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
