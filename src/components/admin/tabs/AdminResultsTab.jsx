import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Trophy,
  Download,
  RefreshCw,
  Users,
  FileText,
  TrendingUp,
  BookOpen,
  Check,
  Flame,
  Award,
  Eye,
  Search,
  X,
  Trash2
} from 'lucide-react';
import {
  fetchAllSubmissions,
  deleteQuizSubmission,
  fetchLessonLeaderboard,
  fetchCourseLeaderboard
} from '../../../services/quizService';
import { subscribeToSupabaseMessage } from '../../../services/supabaseService';
import { AdminTokenPill, formatMinimalTime } from '../adminHelpers';
import { EXAM_CATEGORIES_METADATA } from '../../../data/examCategoriesData';

export default function AdminResultsTab({
  courses = [],
  data = {},
  activeTab = 'results',
  triggerToast,
  examSubmissions: propExamSubmissions,
  setExamSubmissions: propSetExamSubmissions
}) {
  const [internalExamSubmissions, setInternalExamSubmissions] = useState([]);
  const examSubmissions = propExamSubmissions !== undefined ? propExamSubmissions : internalExamSubmissions;
  const setExamSubmissions = propSetExamSubmissions || setInternalExamSubmissions;

  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [examSubmissionsSearch, setExamSubmissionsSearch] = useState('');
  const [selectedExamCourseFilter, setSelectedExamCourseFilter] = useState('ALL');
  const [selectedExamFilter, setSelectedExamFilter] = useState('ALL');
  const [examAttemptFilter, setExamAttemptFilter] = useState('ALL'); // 'ALL' | 'OFFICIAL' | 'RETAKE'
  const [examViewMode, setExamViewMode] = useState('leaderboard'); // 'leaderboard' | 'gradebook' | 'submissions'
  const [leaderboardCourseId, setLeaderboardCourseId] = useState('ALL');
  const [leaderboardLessonId, setLeaderboardLessonId] = useState('');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [deletingSubmissionId, setDeletingSubmissionId] = useState(null);
  const [submissionsLastRefreshed, setSubmissionsLastRefreshed] = useState(null);
  const [inspectingSubmission, setInspectingSubmission] = useState(null);
  const [gradebookSearchQuery, setGradebookSearchQuery] = useState('');
  const [selectedGradebookStudentKey, setSelectedGradebookStudentKey] = useState(null);

  const loadExamSubmissions = useCallback(async () => {
    setIsLoadingSubmissions(true);
    try {
      const subs = await fetchAllSubmissions();
      subs.sort((a, b) => new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0));
      setExamSubmissions(subs);
      setSubmissionsLastRefreshed(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      console.warn('Error fetching exam submissions:', e);
    } finally {
      setIsLoadingSubmissions(false);
    }
  }, [setExamSubmissions]);

  // Real-time synchronization: Supabase Broadcast, Window Event, Storage Event & Polling Fallback
  useEffect(() => {
    loadExamSubmissions();

    // 1. Instant WebSocket Supabase Broadcast (<50ms real-time sync across devices)
    const unsubBroadcast = subscribeToSupabaseMessage('quiz_submission_created', () => {
      loadExamSubmissions();
    });

    // 2. Window Custom Event for intra-app instant reactivity
    const handleLocalSubmission = () => {
      loadExamSubmissions();
    };
    window.addEventListener('eh:quiz_submission', handleLocalSubmission);

    // 3. Cross-tab localStorage changes
    const handleStorageChange = (e) => {
      if (e.key === 'eduhunters_local_quiz_submissions') {
        loadExamSubmissions();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 4. Background refresh interval (every 20s while viewing Results tab)
    let syncInterval = null;
    if (activeTab === 'results') {
      syncInterval = setInterval(() => {
        loadExamSubmissions();
      }, 20000);
    }

    return () => {
      if (typeof unsubBroadcast === 'function') unsubBroadcast();
      window.removeEventListener('eh:quiz_submission', handleLocalSubmission);
      window.removeEventListener('storage', handleStorageChange);
      if (syncInterval) clearInterval(syncInterval);
    };
  }, [loadExamSubmissions, activeTab]);

  // All courses and exam batches available for leaderboard analysis
  const allAdminLeaderboardCourses = useMemo(() => {
    const list = [];
    const seen = new Set();

    // 1. Regular Video Courses
    (courses || []).forEach(c => {
      const id = String(c.id || c.slug).toLowerCase();
      if (!seen.has(id)) {
        seen.add(id);
        list.push({ ...c, isExamBatch: false, typeLabel: 'Course' });
      }
    });

    // 2. Exam Batches from data or EXAM_CATEGORIES_METADATA
    const batches = (data?.examBatches && data.examBatches.length > 0) ? data.examBatches : EXAM_CATEGORIES_METADATA;
    (batches || []).forEach(b => {
      const id = String(b.key || b.id).toLowerCase();
      if (!seen.has(id)) {
        seen.add(id);
        list.push({
          id: b.key || b.id,
          key: b.key || b.id,
          slug: b.key || b.id,
          title: b.title || b.name,
          category: 'Exam Batch',
          isExamBatch: true,
          typeLabel: 'Exam Batch'
        });
      }
    });

    // 3. Any additional courses from submissions
    examSubmissions.forEach(s => {
      const id = String(s.course_id || s.course_slug || '').toLowerCase();
      if (id && !seen.has(id)) {
        seen.add(id);
        list.push({
          id,
          key: id,
          slug: id,
          title: s.course_name || id,
          category: 'Batch',
          isExamBatch: true,
          typeLabel: 'Batch'
        });
      }
    });

    return list;
  }, [courses, data, examSubmissions]);

  // Default leaderboard course selection to first course or batch
  useEffect(() => {
    if ((!leaderboardCourseId || leaderboardCourseId === 'ALL') && allAdminLeaderboardCourses.length > 0) {
      setLeaderboardCourseId(String(allAdminLeaderboardCourses[0].id || allAdminLeaderboardCourses[0].slug));
    }
  }, [allAdminLeaderboardCourses, leaderboardCourseId]);

  // Currently selected course object for leaderboard
  const currentLeaderboardCourse = useMemo(() => {
    if (!allAdminLeaderboardCourses || allAdminLeaderboardCourses.length === 0) return null;
    return allAdminLeaderboardCourses.find(c => 
      String(c.id).toLowerCase() === String(leaderboardCourseId).toLowerCase() ||
      String(c.slug || '').toLowerCase() === String(leaderboardCourseId).toLowerCase() ||
      String(c.key || '').toLowerCase() === String(leaderboardCourseId).toLowerCase()
    ) || allAdminLeaderboardCourses[0];
  }, [allAdminLeaderboardCourses, leaderboardCourseId]);

  // Extract all lessons and exams for the selected course
  const currentCourseLessons = useMemo(() => {
    if (!currentLeaderboardCourse) return [];
    const list = [];
    if (currentLeaderboardCourse.curriculum && Array.isArray(currentLeaderboardCourse.curriculum)) {
      currentLeaderboardCourse.curriculum.forEach((sec, sIdx) => {
        const chapters = Array.isArray(sec.chapters) ? sec.chapters : [];
        chapters.forEach((ch, cIdx) => {
          const lessons = Array.isArray(ch.lessons) ? ch.lessons : [];
          lessons.forEach((les, lIdx) => {
            if (les && typeof les === 'object') {
              const fullTitle = les.title || `Class ${lIdx + 1}`;
              const cleanShort = fullTitle
                .replace(/^Chapter\s*\d+[\s:.-]*/i, '')
                .replace(/^Class\s*\d+[\s:.-]*/i, '')
                .trim();
              list.push({
                lessonId: String(les.id || `les-${sIdx}-${cIdx}-${lIdx}`),
                title: fullTitle,
                shortTitle: cleanShort || fullTitle,
                chapterName: ch.name || `Chapter ${cIdx + 1}`,
                quiz: les.quiz || null
              });
            }
          });
        });
        if (Array.isArray(sec.lessons)) {
          sec.lessons.forEach((les, lIdx) => {
            if (les && typeof les === 'object') {
              const fullTitle = les.title || `Class ${lIdx + 1}`;
              list.push({
                lessonId: String(les.id || `les-${sIdx}-${lIdx}`),
                title: fullTitle,
                shortTitle: fullTitle,
                chapterName: sec.title || `Section ${sIdx + 1}`,
                quiz: les.quiz || null
              });
            }
          });
        }
      });
    }

    examSubmissions.forEach(sub => {
      const matchC = String(sub.course_id || '').toLowerCase() === String(currentLeaderboardCourse.id || '').toLowerCase() ||
                     String(sub.course_slug || '').toLowerCase() === String(currentLeaderboardCourse.id || '').toLowerCase() ||
                     String(sub.course_name || '').toLowerCase() === String(currentLeaderboardCourse.title || '').toLowerCase();
      if (matchC && sub.lesson_id && !list.some(l => String(l.lessonId) === String(sub.lesson_id))) {
        list.push({
          lessonId: String(sub.lesson_id),
          title: sub.lesson_title || `Exam #${sub.lesson_id}`,
          shortTitle: sub.lesson_title || `Exam #${sub.lesson_id}`,
          chapterName: 'Exam',
          quiz: null
        });
      }
    });

    return list;
  }, [currentLeaderboardCourse, examSubmissions]);

  // Derived course options from submissions and courses
  const submissionCourseOptions = useMemo(() => {
    const map = new Map();
    (courses || []).forEach(c => {
      if (c?.id) map.set(String(c.id).toLowerCase(), c.title || c.name || c.id);
      if (c?.slug) map.set(String(c.slug).toLowerCase(), c.title || c.name || c.slug);
    });
    examSubmissions.forEach(s => {
      const cId = String(s.course_id || s.course_slug || '').toLowerCase();
      if (cId && !map.has(cId)) {
        map.set(cId, s.course_name || s.course_id);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [courses, examSubmissions]);

  // Derived exam/lesson options
  const submissionExamOptions = useMemo(() => {
    const map = new Map();
    examSubmissions.forEach(s => {
      const matchCourse = selectedExamCourseFilter === 'ALL' || 
        String(s.course_id || '').toLowerCase() === selectedExamCourseFilter.toLowerCase() ||
        String(s.course_slug || '').toLowerCase() === selectedExamCourseFilter.toLowerCase() ||
        String(s.course_name || '').toLowerCase().includes(selectedExamCourseFilter.toLowerCase());
      if (matchCourse && s.lesson_id) {
        map.set(String(s.lesson_id), s.lesson_title || `Exam #${s.lesson_id}`);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [examSubmissions, selectedExamCourseFilter]);

  // Filtered submissions list
  const filteredSubmissions = useMemo(() => {
    return examSubmissions.filter(s => {
      if (selectedExamCourseFilter !== 'ALL') {
        const cMatch = String(s.course_id || '').toLowerCase() === selectedExamCourseFilter.toLowerCase() ||
          String(s.course_slug || '').toLowerCase() === selectedExamCourseFilter.toLowerCase() ||
          String(s.course_name || '').toLowerCase().includes(selectedExamCourseFilter.toLowerCase());
        if (!cMatch) return false;
      }
      if (selectedExamFilter !== 'ALL') {
        if (String(s.lesson_id) !== String(selectedExamFilter)) return false;
      }
      if (examAttemptFilter === 'OFFICIAL' && s.is_first_attempt === false) return false;
      if (examAttemptFilter === 'RETAKE' && s.is_first_attempt !== false && (!s.attempt_number || s.attempt_number <= 1)) return false;

      if (examSubmissionsSearch.trim()) {
        const q = examSubmissionsSearch.toLowerCase();
        const nameMatch = (s.student_name || '').toLowerCase().includes(q);
        const phoneMatch = (s.student_phone || '').includes(q);
        const emailMatch = (s.student_email || '').toLowerCase().includes(q);
        const examMatch = (s.lesson_title || '').toLowerCase().includes(q);
        const courseMatch = (s.course_name || '').toLowerCase().includes(q);
        return nameMatch || phoneMatch || emailMatch || examMatch || courseMatch;
      }
      return true;
    });
  }, [examSubmissions, selectedExamCourseFilter, selectedExamFilter, examAttemptFilter, examSubmissionsSearch]);

  // Metrics summary
  const examStats = useMemo(() => {
    const totalSubs = examSubmissions.length;
    const uniqueStudents = new Set();
    let totalScoreSum = 0;
    let totalPossibleSum = 0;
    let maxScoreItem = null;

    examSubmissions.forEach(s => {
      const stdKey = s.student_phone || s.student_email || s.student_id;
      if (stdKey) uniqueStudents.add(stdKey);
      const score = Number(s.score || 0);
      const possible = Number(s.total_marks || 0);
      totalScoreSum += score;
      totalPossibleSum += possible;

      if (!maxScoreItem || score > Number(maxScoreItem.score || 0)) {
        maxScoreItem = s;
      }
    });

    const avgPct = totalPossibleSum > 0 ? Math.round((totalScoreSum / totalPossibleSum) * 100) : 0;
    return {
      totalSubs,
      uniqueExaminees: uniqueStudents.size,
      avgPct,
      topScorer: maxScoreItem
    };
  }, [examSubmissions]);

  // Load leaderboard when in leaderboard view or filters change
  useEffect(() => {
    let isMounted = true;
    const loadBoard = async () => {
      setIsLoadingLeaderboard(true);
      try {
        let board = [];
        if (leaderboardLessonId && leaderboardLessonId !== 'ALL' && leaderboardLessonId !== 'overall') {
          board = await fetchLessonLeaderboard(leaderboardCourseId !== 'ALL' ? leaderboardCourseId : null, leaderboardLessonId);
        } else {
          board = await fetchCourseLeaderboard(leaderboardCourseId !== 'ALL' ? leaderboardCourseId : null);
        }
        if (isMounted) setLeaderboardData(board);
      } catch (err) {
        console.warn('Leaderboard fetch error in Admin:', err);
      } finally {
        if (isMounted) setIsLoadingLeaderboard(false);
      }
    };
    if (activeTab === 'results') {
      loadBoard();
    }
    return () => { isMounted = false; };
  }, [activeTab, leaderboardCourseId, leaderboardLessonId, examSubmissions]);

  // Group submissions by student for Student Gradebook
  const studentGradebookList = useMemo(() => {
    const studentMap = new Map();
    examSubmissions.forEach(sub => {
      const sPhone = (sub.student_phone || '').replace(/[^0-9]/g, '');
      const sEmail = (sub.student_email || '').trim().toLowerCase();
      const sId = sub.student_id || '';
      const key = sPhone && sPhone.length >= 8 
        ? `phone_${sPhone.slice(-10)}` 
        : (sEmail ? `email_${sEmail}` : `id_${sId}`);

      if (!studentMap.has(key)) {
        studentMap.set(key, {
          studentKey: key,
          student_id: sId,
          student_name: sub.student_name || 'Anonymous Student',
          student_phone: sub.student_phone || '',
          student_email: sub.student_email || '',
          avatar: sub.avatar || sub.student_avatar || '/avatar.svg',
          submissions: [],
          totalScore: 0,
          totalPossible: 0,
          highestScore: 0
        });
      }
      const entry = studentMap.get(key);
      entry.submissions.push(sub);
      const score = Number(sub.score || 0);
      const poss = Number(sub.total_marks || 0);
      entry.totalScore += score;
      entry.totalPossible += poss;
      if (score > entry.highestScore) entry.highestScore = score;
    });

    const list = Array.from(studentMap.values()).map(s => ({
      ...s,
      totalExams: s.submissions.length,
      avgScore: s.totalPossible > 0 ? Math.round((s.totalScore / s.totalPossible) * 100) : 0
    }));

    list.sort((a, b) => b.totalExams - a.totalExams || b.totalScore - a.totalScore);
    return list;
  }, [examSubmissions]);

  const filteredGradebookStudents = useMemo(() => {
    if (!gradebookSearchQuery.trim()) return studentGradebookList;
    const q = gradebookSearchQuery.toLowerCase();
    return studentGradebookList.filter(s => 
      (s.student_name || '').toLowerCase().includes(q) ||
      (s.student_phone || '').includes(q) ||
      (s.student_email || '').toLowerCase().includes(q)
    );
  }, [studentGradebookList, gradebookSearchQuery]);

  const activeGradebookStudent = useMemo(() => {
    if (!selectedGradebookStudentKey) return filteredGradebookStudents[0] || null;
    return studentGradebookList.find(s => s.studentKey === selectedGradebookStudentKey) || filteredGradebookStudents[0] || null;
  }, [studentGradebookList, selectedGradebookStudentKey, filteredGradebookStudents]);

  const handleExportCSV = () => {
    if (!filteredSubmissions || filteredSubmissions.length === 0) {
      alert('কোনো পরীক্ষার ফলাফল পাওয়া যায়নি এক্সপোর্ট করার জন্য।');
      return;
    }
    const headers = ['Student Name', 'Phone', 'Email', 'Course Name', 'Exam Title', 'Score', 'Total Marks', 'Percentage', 'Time Taken (Sec)', 'Attempt Type', 'Submission Date'];
    const rows = filteredSubmissions.map(s => [
      `"${(s.student_name || 'N/A').replace(/"/g, '""')}"`,
      `"${(s.student_phone || 'N/A').replace(/"/g, '""')}"`,
      `"${(s.student_email || '').replace(/"/g, '""')}"`,
      `"${(s.course_name || 'N/A').replace(/"/g, '""')}"`,
      `"${(s.lesson_title || 'N/A').replace(/"/g, '""')}"`,
      s.score ?? 0,
      s.total_marks ?? 0,
      `${s.percentage ?? 0}%`,
      s.time_taken_seconds ?? 0,
      s.is_first_attempt === false ? 'Retake (Practice)' : 'Official 1st Attempt',
      `"${s.submitted_at || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `eduhunters_exam_results_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteSubmission = async (submissionId) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই শিক্ষার্থীর পরীক্ষার ফলাফল ডিলিট করতে চান? এটি রিভার্স করা যাবে না।')) return;
    setDeletingSubmissionId(submissionId);
    try {
      await deleteQuizSubmission(submissionId);
      setExamSubmissions(prev => prev.filter(s => s.id !== submissionId));
      if (inspectingSubmission?.id === submissionId) {
        setInspectingSubmission(null);
      }
      if (typeof triggerToast === 'function') {
        triggerToast('🗑️ Exam submission deleted');
      }
    } catch (e) {
      alert('Error deleting submission: ' + (e.message || 'Unknown error'));
    } finally {
      setDeletingSubmissionId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & CONTROLS */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20 shrink-0 shadow-xs">
            <Trophy className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Exam Results & Live Leaderboard
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-1.5 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Synced
              </span>
              {submissionsLastRefreshed && (
                <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
                  Updated: {submissionsLastRefreshed}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              শিক্ষার্থীদের পরীক্ষার ফলাফল, খাতা মূল্যায়ন ও রিয়েল-টাইম মেধা তালিকা ব্যবস্থাপনা।
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-start sm:justify-end">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Export results to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={loadExamSubmissions}
            disabled={isLoadingSubmissions}
            className="px-4 py-2 rounded-xl bg-[#5d5bf6] hover:bg-[#4b49e0] text-white font-bold text-xs shadow-md shadow-[#5d5bf6]/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSubmissions ? 'animate-spin' : ''}`} />
            <span>{isLoadingSubmissions ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 2. THREE SEGMENTED NAVIGATION TABS */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setExamViewMode('leaderboard')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
            examViewMode === 'leaderboard'
              ? 'bg-[#5d5bf6] text-white border-[#5d5bf6] shadow-sm'
              : 'bg-transparent text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-50'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>কোর্স ও পরীক্ষা ভিত্তিক লিডারবোর্ড</span>
        </button>

        <button
          type="button"
          onClick={() => setExamViewMode('gradebook')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
            examViewMode === 'gradebook'
              ? 'bg-[#5d5bf6] text-white border-[#5d5bf6] shadow-sm'
              : 'bg-transparent text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>শিক্ষার্থী গ্রেডবুক ও খাতা ({studentGradebookList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setExamViewMode('submissions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
            examViewMode === 'submissions'
              ? 'bg-[#5d5bf6] text-white border-[#5d5bf6] shadow-sm'
              : 'bg-transparent text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>সকল জমার লাইভ লেজার ({filteredSubmissions.length})</span>
        </button>
      </div>

      {/* 3. FOUR METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Total Submissions */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-500 truncate">Total Submissions</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none mt-3">
            {examStats.totalSubs}
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-1">
            মোট জমা হওয়া পরীক্ষার খাতা
          </span>
        </div>

        {/* Unique Examinees */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-500 truncate">Unique Examinees</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-600 tracking-tight leading-none mt-3">
            {examStats.uniqueExaminees}
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-1">
            অংশগ্রহণকারী পৃথক শিক্ষার্থী
          </span>
        </div>

        {/* Avg Accuracy */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-500 truncate">Average Score</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight leading-none mt-3">
            {examStats.avgPct}%
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-1">
            সার্বিক গড় অ্যাক্যুরেসি
          </span>
        </div>

        {/* Top Performer */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-500 truncate">Highest Mark</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight leading-none mt-3 truncate">
            {examStats.topScorer ? `${examStats.topScorer.score} / ${examStats.topScorer.total_marks}` : '0'}
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-1 truncate">
            {examStats.topScorer ? examStats.topScorer.student_name : 'No submissions yet'}
          </span>
        </div>
      </div>

      {/* 4. TAB 1: 🏆 কোর্স ও পরীক্ষা ভিত্তিক লিডারবোর্ড */}
      {examViewMode === 'leaderboard' && (
        <div className="space-y-6">
          {/* Step A: Course Selection Cards */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#5d5bf6]" />
                ১. কোর্স বা এক্সাম ব্যাচ নির্বাচন করুন (Select Course / Batch):
              </span>
              <span className="text-xs text-slate-400 font-medium">
                মোট {allAdminLeaderboardCourses.length} টি কোর্স ও এক্সাম ব্যাচ
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {allAdminLeaderboardCourses.map(c => {
                const cKey = String(c.id || c.slug || c.key);
                const cTarget = cKey.toLowerCase().replace(/[-_\s]/g, '');
                const isSelected = String(leaderboardCourseId).toLowerCase() === String(c.id).toLowerCase() ||
                                   String(leaderboardCourseId).toLowerCase() === String(c.slug || '').toLowerCase() ||
                                   String(leaderboardCourseId).toLowerCase().replace(/[-_\s]/g, '') === cTarget;
                const cSubmissions = examSubmissions.filter(s => {
                  const sCId = String(s.course_id || s.course_slug || '').toLowerCase().replace(/[-_\s]/g, '');
                  return sCId === cTarget || (sCId && cTarget.includes(sCId)) || (cTarget && sCId.includes(cTarget));
                });

                return (
                  <button
                    key={cKey}
                    type="button"
                    onClick={() => {
                      setLeaderboardCourseId(cKey);
                      setLeaderboardLessonId('');
                    }}
                    className={`p-3.5 rounded-xl text-left transition-all cursor-pointer border flex items-center gap-3 ${
                      isSelected
                        ? 'bg-indigo-50/60 border-[#5d5bf6] text-slate-900 shadow-sm ring-2 ring-[#5d5bf6]/20'
                        : 'bg-slate-50/60 hover:bg-white hover:border-slate-300 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isSelected
                        ? 'bg-[#5d5bf6] border-[#5d5bf6] text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-500'
                    }`}>
                      {c.isExamBatch ? <Trophy className="w-4 h-4 text-amber-500" /> : <BookOpen className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-900 truncate leading-tight">
                        {c.title || c.name || 'Course'}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-slate-600">{c.typeLabel || c.category || 'Batch'}</span>
                        <span>•</span>
                        <span className="text-indigo-600 font-bold">{cSubmissions.length} খাতা জমা</span>
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-[#5d5bf6] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step B: Chapter / Exam Selector Pills */}
          {currentLeaderboardCourse && (
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-500" />
                  ২. অধ্যায় বা পরীক্ষা নির্বাচন করুন ({currentLeaderboardCourse.title}):
                </span>
                <span className="text-xs text-slate-400">
                  {currentCourseLessons.length} টি পরীক্ষা অন্তর্ভুক্ত
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Overall course ranking pill */}
                <button
                  type="button"
                  onClick={() => setLeaderboardLessonId('')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                    !leaderboardLessonId || leaderboardLessonId === 'ALL' || leaderboardLessonId === 'overall'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5 text-white" />
                  <span>কোর্সের সামগ্রিক মেধা তালিকা (Cumulative Overall)</span>
                </button>

                {/* Lessons / Exams pills */}
                {currentCourseLessons.map((les, idx) => {
                  const isLesActive = leaderboardLessonId === les.lessonId;
                  return (
                    <button
                      key={les.lessonId}
                      type="button"
                      onClick={() => setLeaderboardLessonId(les.lessonId)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5 ${
                        isLesActive
                          ? 'bg-[#5d5bf6] text-white border-[#5d5bf6] shadow-sm font-bold'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-mono ${
                        isLesActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="truncate max-w-[200px]">{les.title}</span>
                      {isLesActive && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step C: The 3D Podium & Avatars */}
          {isLoadingLeaderboard ? (
            <div className="bg-white rounded-2xl p-16 border border-slate-200/80 text-center">
              <RefreshCw className="w-8 h-8 text-[#5d5bf6] animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-800">মেধাতালিকা ও পোডিয়াম লোড হচ্ছে...</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    শীর্ষ ৩ মেধা পোডিয়াম (Top 3 Standings)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    রিয়েল-টাইম স্কোর ও সময় অনুসারে স্বয়ংক্রিয়ভাবে নির্ধারিত পোডিয়াম।
                  </p>
                </div>
              </div>

              {/* 3-Column Podium Stage */}
              <div className="pt-6 pb-2">
                <div className="flex items-end justify-center w-full max-w-[460px] sm:max-w-[520px] mx-auto">
                  {/* RANK 2 (SILVER - LEFT) */}
                  {(() => {
                    const rank2 = leaderboardData[1] || null;
                    return (
                      <div className="w-[32%] min-w-0 flex flex-col items-center relative z-10 -mr-1">
                        <div className="flex flex-col items-center mb-3 animate-in fade-in duration-300 w-full">
                          {rank2 ? (
                            <>
                              <div className="relative group shrink-0">
                                <img 
                                  src={rank2.avatar || rank2.student_avatar || '/avatar.svg'} 
                                  alt={rank2.student_name || 'Rank 2'}
                                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-4 border-slate-300 shadow-md relative z-10 shrink-0"
                                  onError={(e) => { e.target.onerror = null; e.target.src = '/avatar.svg'; }}
                                />
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-500 text-white font-bold text-[10px] flex items-center justify-center border border-white z-20 shadow-xs">
                                  2
                                </div>
                              </div>
                              <span className="text-xs font-bold text-slate-800 truncate max-w-full px-1 text-center mt-2 tracking-tight block">
                                {rank2.student_name || 'Student'}
                              </span>
                              <div className="mt-1">
                                <AdminTokenPill points={rank2.score ?? rank2.total_score} variant="silver" />
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {formatMinimalTime(rank2.time_taken_seconds ?? rank2.total_time_seconds)}
                              </span>
                              <button
                                type="button"
                                onClick={() => setInspectingSubmission(rank2)}
                                className="mt-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
                              >
                                খাতা দেখুন
                              </button>
                            </>
                          ) : (
                            <>
                              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 text-slate-400">
                                <span className="font-bold text-sm">২</span>
                              </div>
                              <span className="text-[11px] font-medium text-slate-400 truncate max-w-full px-1 text-center mt-2 block">
                                ২য় স্থান (খালি)
                              </span>
                              <div className="mt-1">
                                <AdminTokenPill points="--" variant="silver" />
                              </div>
                            </>
                          )}
                        </div>

                        {/* 3D Pillar #2 */}
                        <div className="w-full flex flex-col items-center relative">
                          <div className="w-full h-7 sm:h-8 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 border-t-2 border-slate-400 rounded-t-xl shadow-xs" />
                          <div className="w-full h-32 sm:h-38 bg-gradient-to-b from-slate-50 to-slate-100 border-x border-b border-slate-200 flex flex-col items-center justify-center relative">
                            <span className="font-black text-4xl sm:text-5xl text-slate-400/50 select-none">
                              2
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* RANK 1 (GOLD - CENTER) */}
                  {(() => {
                    const rank1 = leaderboardData[0] || null;
                    return (
                      <div className="w-[36%] min-w-0 flex flex-col items-center relative z-20">
                        <div className="flex flex-col items-center mb-3.5 animate-in fade-in duration-300 w-full">
                          {rank1 ? (
                            <>
                              <div className="relative group shrink-0">
                                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-base z-30 animate-bounce">
                                  👑
                                </span>
                                <img 
                                  src={rank1.avatar || rank1.student_avatar || '/avatar.svg'} 
                                  alt={rank1.student_name || 'Rank 1'}
                                  className="w-18 h-18 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-amber-400 shadow-lg relative z-10 shrink-0"
                                  onError={(e) => { e.target.onerror = null; e.target.src = '/avatar.svg'; }}
                                />
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center border-2 border-white z-20 shadow-xs">
                                  1
                                </div>
                              </div>
                              <span className="text-xs sm:text-sm font-black text-slate-900 truncate max-w-full px-1 text-center mt-2 tracking-tight block">
                                {rank1.student_name || 'Champion'}
                              </span>
                              <div className="mt-1">
                                <AdminTokenPill points={rank1.score ?? rank1.total_score} variant="gold" size="lg" />
                              </div>
                              <span className="text-[10px] text-amber-700 font-mono mt-0.5 font-bold">
                                {formatMinimalTime(rank1.time_taken_seconds ?? rank1.total_time_seconds)}
                              </span>
                              <button
                                type="button"
                                onClick={() => setInspectingSubmission(rank1)}
                                className="mt-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-colors cursor-pointer shadow-xs"
                              >
                                খাতা দেখুন
                              </button>
                            </>
                          ) : (
                            <>
                              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full border-2 border-dashed border-amber-400 flex items-center justify-center bg-amber-50/50 text-amber-500">
                                <span className="font-bold text-base">১</span>
                              </div>
                              <span className="text-xs font-medium text-slate-400 truncate max-w-full px-1 text-center mt-2 block">
                                ১ম স্থান (খালি)
                              </span>
                              <div className="mt-1">
                                <AdminTokenPill points="--" variant="gold" size="lg" />
                              </div>
                            </>
                          )}
                        </div>

                        {/* 3D Pillar #1 */}
                        <div className="w-full flex flex-col items-center relative">
                          <div className="w-full h-8 sm:h-9 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-200 border-t-2 border-amber-400 rounded-t-xl shadow-xs" />
                          <div className="w-full h-42 sm:h-48 bg-gradient-to-b from-amber-50 to-amber-100/70 border-x border-b border-amber-200 flex flex-col items-center justify-center relative">
                            <span className="font-black text-5xl sm:text-6xl text-amber-500/40 select-none">
                              1
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* RANK 3 (BRONZE - RIGHT) */}
                  {(() => {
                    const rank3 = leaderboardData[2] || null;
                    return (
                      <div className="w-[32%] min-w-0 flex flex-col items-center relative z-10 -ml-1">
                        <div className="flex flex-col items-center mb-3 animate-in fade-in duration-300 w-full">
                          {rank3 ? (
                            <>
                              <div className="relative group shrink-0">
                                <img 
                                  src={rank3.avatar || rank3.student_avatar || '/avatar.svg'} 
                                  alt={rank3.student_name || 'Rank 3'}
                                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-4 border-amber-600/40 shadow-md relative z-10 shrink-0"
                                  onError={(e) => { e.target.onerror = null; e.target.src = '/avatar.svg'; }}
                                />
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-700 text-white font-bold text-[10px] flex items-center justify-center border border-white z-20 shadow-xs">
                                  3
                                </div>
                              </div>
                              <span className="text-xs font-bold text-slate-800 truncate max-w-full px-1 text-center mt-2 tracking-tight block">
                                {rank3.student_name || 'Student'}
                              </span>
                              <div className="mt-1">
                                <AdminTokenPill points={rank3.score ?? rank3.total_score} variant="bronze" />
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {formatMinimalTime(rank3.time_taken_seconds ?? rank3.total_time_seconds)}
                              </span>
                              <button
                                type="button"
                                onClick={() => setInspectingSubmission(rank3)}
                                className="mt-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold text-orange-800 bg-orange-100 hover:bg-orange-200 border border-orange-200 transition-colors cursor-pointer"
                              >
                                খাতা দেখুন
                              </button>
                            </>
                          ) : (
                            <>
                              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-dashed border-amber-700/30 flex items-center justify-center bg-orange-50/40 text-orange-400">
                                <span className="font-bold text-sm">৩</span>
                              </div>
                              <span className="text-[11px] font-medium text-slate-400 truncate max-w-full px-1 text-center mt-2 block">
                                ৩য় স্থান (খালি)
                              </span>
                              <div className="mt-1">
                                <AdminTokenPill points="--" variant="bronze" />
                              </div>
                            </>
                          )}
                        </div>

                        {/* 3D Pillar #3 */}
                        <div className="w-full flex flex-col items-center relative">
                          <div className="w-full h-7 sm:h-8 bg-gradient-to-r from-amber-100 via-orange-200 to-amber-100 border-t-2 border-amber-600/40 rounded-t-xl shadow-xs" />
                          <div className="w-full h-26 sm:h-30 bg-gradient-to-b from-orange-50/70 to-orange-100/60 border-x border-b border-orange-200 flex flex-col items-center justify-center relative">
                            <span className="font-black text-4xl sm:text-5xl text-orange-400/50 select-none">
                              3
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Step D: Ranks 4+ Standings List Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                পূর্ণাঙ্গ মেধাতালিকা (Full Merit Standings - {leaderboardData.length} Students)
              </h4>
              <span className="text-xs text-slate-400">
                টাই-ব্রেকার: স্কোর &gt; সময় &gt; প্রথম জমা
              </span>
            </div>

            {leaderboardData.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                এখনও কোনো শিক্ষার্থী এই পরীক্ষায় অংশগ্রহণ করেনি। শিক্ষার্থীরা পরীক্ষা দিলে স্বয়ংক্রিয়ভাবে লাইভ মেধাতালিকায় নাম প্রদর্শিত হবে।
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {leaderboardData.map((student, idx) => {
                  const rank = student.rank || idx + 1;
                  const rawPoints = student.score ?? student.total_score ?? 0;
                  const sec = student.time_taken_seconds ?? student.total_time_seconds ?? 0;

                  return (
                    <div 
                      key={student.id || student.student_id || idx}
                      className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-slate-50/80 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-7 text-center font-black text-sm shrink-0 ${
                          rank === 1 ? 'text-amber-500' : rank === 2 ? 'text-slate-500' : rank === 3 ? 'text-amber-700' : 'text-slate-400'
                        }`}>
                          #{rank}
                        </span>

                        <img 
                          src={student.avatar || student.student_avatar || '/avatar.svg'} 
                          alt={student.student_name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 bg-slate-100 shrink-0"
                          onError={(e) => { e.target.onerror = null; e.target.src = '/avatar.svg'; }}
                        />

                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {student.student_name || 'Anonymous Student'}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {student.student_phone || student.student_email || ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="font-black text-slate-900 text-sm block">
                            {rawPoints} pts
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono block">
                            {formatMinimalTime(sec)}
                          </span>
                        </div>

                        {/* View Paper Button */}
                        <button
                          type="button"
                          onClick={() => setInspectingSubmission(student)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#5d5bf6] text-xs font-bold border border-indigo-200 transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                          title="View full answer sheet and evaluate marks"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#5d5bf6]" />
                          <span className="hidden sm:inline">খাতা দেখুন</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. TAB 2: 👤 শিক্ষার্থী গ্রেডবুক ও খাতা মূল্যায়ন */}
      {examViewMode === 'gradebook' && (
        <div className="space-y-5">
          {/* Student Search & Quick Select */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  শিক্ষার্থী খুঁজুন ও খাতা মূল্যায়ন
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  যেকোনো শিক্ষার্থীর নাম বা ফোন নম্বর লিখে তার সম্পূর্ণ পরীক্ষার ফলাফল ও খাতা দেখুন।
                </p>
              </div>

              {/* Search Input */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="নাম বা মোবাইল নম্বর..."
                  value={gradebookSearchQuery}
                  onChange={(e) => setGradebookSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl pl-10 pr-8 py-2 text-xs text-slate-800 outline-none focus:border-[#5d5bf6] focus:ring-1 focus:ring-[#5d5bf6] font-medium"
                />
                {gradebookSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setGradebookSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Student Chips */}
            {filteredGradebookStudents.length > 0 && (
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-[11px] font-semibold text-slate-400 shrink-0">তালিকা:</span>
                {filteredGradebookStudents.slice(0, 15).map(st => {
                  const isSel = (activeGradebookStudent?.studentKey === st.studentKey);
                  return (
                    <button
                      key={st.studentKey}
                      type="button"
                      onClick={() => setSelectedGradebookStudentKey(st.studentKey)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer flex items-center gap-1.5 ${
                        isSel
                          ? 'bg-[#5d5bf6] text-white border-[#5d5bf6] shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span>{st.student_name}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSel ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {st.submissions.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Student Details & Gradebook Table */}
          {activeGradebookStudent ? (
            <div className="space-y-4">
              {/* Student Profile Summary Banner */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-[#5d5bf6] text-white font-black text-lg flex items-center justify-center shrink-0 shadow-xs">
                    {(activeGradebookStudent.student_name || 'S').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-black text-slate-900">
                        {activeGradebookStudent.student_name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-[#5d5bf6] border border-indigo-200">
                        {activeGradebookStudent.submissions.length} টি পরীক্ষা সম্পন্ন
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {activeGradebookStudent.student_phone || 'ফোন নম্বর নেই'} · {activeGradebookStudent.student_email || ''}
                    </p>
                  </div>
                </div>

                {/* Summary Badges */}
                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">গড় নম্বর</span>
                    <span className="text-lg font-black text-emerald-600">
                      {activeGradebookStudent.avgScore}%
                    </span>
                  </div>
                  <div className="h-8 w-px bg-slate-200 hidden md:block" />
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">সর্বোচ্চ স্কোর</span>
                    <span className="text-lg font-black text-amber-600">
                      {activeGradebookStudent.highestScore}
                    </span>
                  </div>
                </div>
              </div>

              {/* Exams History Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    পরীক্ষার ইতিহাস ও খাতার তালিকা ({activeGradebookStudent.submissions.length} টি জমা)
                  </h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50/80 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">#</th>
                        <th className="py-3 px-4">কোর্স</th>
                        <th className="py-3 px-4">পরীক্ষার নাম</th>
                        <th className="py-3 px-4 text-center">প্রাপ্ত নম্বর</th>
                        <th className="py-3 px-4 text-center">অ্যাকুরেসি</th>
                        <th className="py-3 px-4 text-center">ব্যয়িত সময়</th>
                        <th className="py-3 px-4">জমার তারিখ</th>
                        <th className="py-3 px-4 text-center">খাতা দেখুন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeGradebookStudent.submissions.map((sub, idx) => {
                        const pct = sub.percentage ?? 0;
                        const isExcellent = pct >= 80;
                        const isPass = pct >= 50;

                        return (
                          <tr key={sub.id || idx} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                            <td className="py-3 px-4">
                              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                                {sub.course_name || 'Course'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {sub.lesson_title || 'Exam'}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-slate-900">
                              <span className="text-amber-600">{sub.score}</span> / {sub.total_marks}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                isExcellent 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : isPass
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}>
                                {pct}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-600">
                              {formatMinimalTime(sub.time_taken_seconds)}
                            </td>
                            <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                              {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => setInspectingSubmission(sub)}
                                className="px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#5d5bf6] text-xs font-bold border border-indigo-200 transition-all cursor-pointer flex items-center gap-1 mx-auto active:scale-95"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#5d5bf6]" />
                                <span>খাতা দেখুন</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-16 border border-slate-200/80 text-center text-slate-400">
              কোনো শিক্ষার্থী পাওয়া যায়নি। উপরের সার্চ বারে ফোন বা নাম দিয়ে খুঁজুন।
            </div>
          )}
        </div>
      )}

      {/* 6. TAB 3: 📋 সকল জমার লাইভ লেজার */}
      {examViewMode === 'submissions' && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="শিক্ষার্থীর নাম, ফোন, ইমেইল বা পরীক্ষার নাম দিয়ে খুঁজুন..."
                value={examSubmissionsSearch}
                onChange={(e) => setExamSubmissionsSearch(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl pl-10 pr-8 py-2 text-xs text-slate-800 outline-none focus:border-[#5d5bf6] focus:ring-1 focus:ring-[#5d5bf6] font-medium transition-all"
              />
              {examSubmissionsSearch && (
                <button
                  type="button"
                  onClick={() => setExamSubmissionsSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedExamCourseFilter}
                onChange={(e) => {
                  setSelectedExamCourseFilter(e.target.value);
                  setSelectedExamFilter('ALL');
                }}
                className="bg-slate-50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold outline-none focus:border-[#5d5bf6]"
              >
                <option value="ALL">সকল কোর্স (All Courses)</option>
                {submissionCourseOptions.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>

              <select
                value={selectedExamFilter}
                onChange={(e) => setSelectedExamFilter(e.target.value)}
                className="bg-slate-50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold outline-none focus:border-[#5d5bf6] max-w-[200px]"
              >
                <option value="ALL">সকল পরীক্ষা (All Exams)</option>
                {submissionExamOptions.map(e => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>

              <select
                value={examAttemptFilter}
                onChange={(e) => setExamAttemptFilter(e.target.value)}
                className="bg-slate-50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold outline-none focus:border-[#5d5bf6]"
              >
                <option value="ALL">সকল অ্যাটেম্পট</option>
                <option value="OFFICIAL">অফিসিয়াল ১ম চেষ্টা (Official 1st)</option>
                <option value="RETAKE">প্র্যাকটিস রিটেক (Retake)</option>
              </select>

              {(examSubmissionsSearch || selectedExamCourseFilter !== 'ALL' || selectedExamFilter !== 'ALL' || examAttemptFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setExamSubmissionsSearch('');
                    setSelectedExamCourseFilter('ALL');
                    setSelectedExamFilter('ALL');
                    setExamAttemptFilter('ALL');
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Submissions Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4">শিক্ষার্থী</th>
                  <th className="py-3.5 px-4">কোর্স</th>
                  <th className="py-3.5 px-4">পরীক্ষার নাম</th>
                  <th className="py-3.5 px-4 text-center">নম্বর</th>
                  <th className="py-3.5 px-4 text-center">অ্যাকুরেসি</th>
                  <th className="py-3.5 px-4 text-center">সময়</th>
                  <th className="py-3.5 px-4 text-center">ধরন</th>
                  <th className="py-3.5 px-4">তারিখ</th>
                  <th className="py-3.5 px-4 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="py-16 text-center text-slate-400">
                      <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-sm text-slate-700">কোনো পরীক্ষার ফলাফল পাওয়া যায়নি</p>
                      <p className="text-xs text-slate-400 mt-1">শিক্ষার্থীরা পরীক্ষা দিলে এখানে স্বয়ংক্রিয়ভাবে জমা হবে।</p>
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((sub, idx) => {
                    const pct = sub.percentage ?? 0;
                    const isExcellent = pct >= 80;
                    const isPass = pct >= 50;
                    const isOfficial = sub.is_first_attempt !== false && (!sub.attempt_number || Number(sub.attempt_number) <= 1);

                    return (
                      <tr key={sub.id || idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#5d5bf6] text-white font-black text-xs flex items-center justify-center shrink-0">
                              {(sub.student_name || 'S').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-slate-900 truncate">
                                {sub.student_name || 'Anonymous Student'}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                {sub.student_phone || sub.student_email || ''}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200 truncate max-w-[150px] inline-block">
                            {sub.course_name || 'Course'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 truncate max-w-[180px]">
                          {sub.lesson_title || 'Quiz'}
                        </td>
                        <td className="py-3.5 px-4 text-center font-black text-slate-900">
                          <span className="text-amber-600">{sub.score}</span> <span className="text-slate-400 font-normal">/ {sub.total_marks}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isExcellent
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isPass
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {pct}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-[11px] text-slate-600">
                          {formatMinimalTime(sub.time_taken_seconds)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isOfficial ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-[#5d5bf6] border border-indigo-200">
                              Official 1st
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              Retake #{sub.attempt_number || 2}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                          {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setInspectingSubmission(sub)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-[#5d5bf6] hover:bg-indigo-50 transition-colors border-none bg-transparent cursor-pointer"
                              title="View Student Answer Sheet"
                            >
                              <Eye className="w-4 h-4 text-[#5d5bf6]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSubmission(sub.id)}
                              disabled={deletingSubmissionId === sub.id}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors border-none bg-transparent cursor-pointer disabled:opacity-40"
                              title="Delete submission record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. ANSWER SHEET INSPECTION MODAL */}
      {inspectingSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-white border border-slate-200 rounded-3xl p-6 text-slate-900 overflow-y-auto shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-[#5d5bf6] border border-indigo-200">
                    পরীক্ষার খাতা ও মূল্যায়ন
                  </span>
                  <span className="text-xs text-slate-400">
                    {inspectingSubmission.submitted_at ? new Date(inspectingSubmission.submitted_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  {inspectingSubmission.lesson_title || inspectingSubmission.quiz_id || 'Class Exam'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  কোর্স: <span className="text-slate-800 font-bold">{inspectingSubmission.course_name || 'EduHunters Course'}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setInspectingSubmission(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors border-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Student Info Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#5d5bf6] text-white font-black text-lg flex items-center justify-center shrink-0">
                  {(inspectingSubmission.student_name || 'S').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {inspectingSubmission.student_name || 'Anonymous Student'}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono">
                    {inspectingSubmission.student_phone || 'No phone'} · {inspectingSubmission.student_email || ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-bold">প্রাপ্ত নম্বর</span>
                  <span className="text-xl font-black text-amber-600">
                    {inspectingSubmission.score} <span className="text-xs text-slate-400 font-normal">/ {inspectingSubmission.total_marks}</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-bold">অ্যাকুরেসি</span>
                  <span className="text-xl font-black text-emerald-600">
                    {inspectingSubmission.percentage}%
                  </span>
                </div>
              </div>
            </div>

            {/* Score Breakdown (Correct, Wrong, Skipped) */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-[10px] text-emerald-700 font-bold block uppercase">সঠিক উত্তর</span>
                <span className="text-lg font-black text-emerald-600">
                  {inspectingSubmission.correct_count ?? '--'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
                <span className="text-[10px] text-rose-700 font-bold block uppercase">ভুল উত্তর</span>
                <span className="text-lg font-black text-rose-600">
                  {inspectingSubmission.wrong_count ?? '--'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">গৃহীত সময়</span>
                <span className="text-lg font-black text-slate-800 font-mono">
                  {formatMinimalTime(inspectingSubmission.time_taken_seconds)}
                </span>
              </div>
            </div>

            {/* Question by Question Detailed Paper */}
            {Array.isArray(inspectingSubmission.raw_answers) && inspectingSubmission.raw_answers.length > 0 ? (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  প্রশ্নভিত্তিক উত্তরপত্র (Question Analysis):
                </h4>
                <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                  {inspectingSubmission.raw_answers.map((ans, qIdx) => {
                    const isCorrect = ans.isCorrect || ans.selected === ans.correct;
                    const isSkipped = ans.selected === undefined || ans.selected === null || ans.selected === '';

                    return (
                      <div 
                        key={qIdx}
                        className={`p-3.5 rounded-xl border ${
                          isCorrect 
                            ? 'bg-emerald-50/60 border-emerald-200' 
                            : isSkipped 
                            ? 'bg-slate-50 border-slate-200' 
                            : 'bg-rose-50/60 border-rose-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            Q{qIdx + 1}. {ans.question || `Question #${qIdx + 1}`}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isCorrect 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : isSkipped 
                              ? 'bg-slate-200 text-slate-700' 
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {isCorrect ? '+১ সঠিক' : isSkipped ? 'স্কিপড' : 'ভুল'}
                          </span>
                        </div>
                        <div className="mt-2 text-[11px] text-slate-700 space-y-0.5 font-medium">
                          <div>শিক্ষার্থীর উত্তর: <span className={isCorrect ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>{String(ans.selectedText || ans.selected || 'স্কিপ করা হয়েছে')}</span></div>
                          {!isCorrect && ans.correct && (
                            <div className="text-emerald-700">সঠিক উত্তর ছিল: <span className="font-bold">{String(ans.correctText || ans.correct)}</span></div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                শিক্ষার্থীর সার্বিক স্কোর ডাটাবেজে সংরক্ষিত রয়েছে। প্রশ্নের বিস্তারিত উত্তরপত্র শিক্ষার্থী পোর্টাল থেকেও দেখতে পাবেন।
              </div>
            )}

            {/* Bottom Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDeleteSubmission(inspectingSubmission.id)}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold border border-rose-200 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>এই পরীক্ষার খাতা ডিলিট করুন</span>
              </button>

              <button
                type="button"
                onClick={() => setInspectingSubmission(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer border border-slate-200"
              >
                বন্ধ করুন (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
