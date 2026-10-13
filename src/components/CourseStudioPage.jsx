import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowLeft, 
  Layers, 
  BookOpen, 
  FileText, 
  Settings, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  ChevronDown, 
  Sparkles, 
  Clock, 
  Play, 
  Eye, 
  ImageIcon, 
  Check, 
  X,
  Zap,
  CheckSquare,
  Upload,
  Download,
  FileSpreadsheet,
  Copy,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Search,
  ExternalLink,
  Edit3,
  ChevronRight,
  Video,
  ListOrdered,
  RefreshCw,
  Server,
  Key,
  ShieldCheck
} from 'lucide-react';
import { masterEnglishCourseData } from '../data/masterEnglishCourseData';
import ExamBatchStudio from './ExamBatchStudio';
import { parseBulkQuestionsFromText } from '../utils/examBatchStorage';
import { 
  getBunnyConfig, 
  saveBunnyConfig, 
  isBunnyStreamConfigured, 
  isBunnyStorageConfigured,
  uploadVideoToBunnyStream,
  uploadPdfToBunnyStorage,
  testBunnyStreamConnection,
  testBunnyStorageConnection
} from '../services/bunnyService';

// YouTube & Bunny Video Embed Link Helper
function getEmbedUrl(url) {
  if (!url) return '';
  try {
    const trimmed = String(url).trim();
    if (!trimmed) return '';

    // 1. Bunny Stream Direct Iframe Embed URL
    if (trimmed.includes('iframe.mediadelivery.net/embed/')) {
      const glue = trimmed.includes('?') ? '&' : '?';
      return `${trimmed}${glue}autoplay=false&preload=true`;
    }

    // 2. Bunny Stream Play URL
    if (trimmed.includes('video.bunnycdn.com/play/')) {
      const parts = trimmed.split('video.bunnycdn.com/play/')[1].split('?')[0].split('/');
      if (parts.length >= 2) {
        return `https://iframe.mediadelivery.net/embed/${parts[0]}/${parts[1]}?autoplay=false&preload=true`;
      }
    }

    // 3. Bunny shorthand: "bunny:777670/videoId"
    if (trimmed.startsWith('bunny:')) {
      const rest = trimmed.replace('bunny:', '');
      return `https://iframe.mediadelivery.net/embed/${rest}?autoplay=false&preload=true`;
    }

    // 4. Extract YouTube ID
    let ytId = '';
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      ytId = trimmed;
    } else if (trimmed.includes('youtube.com/watch')) {
      try {
        const parsed = new URL(trimmed);
        ytId = parsed.searchParams.get('v') || '';
      } catch (e) {}
    } else if (trimmed.includes('youtu.be/')) {
      ytId = trimmed.split('youtu.be/')[1].split('?')[0].split('&')[0];
    } else if (trimmed.includes('youtube.com/embed/')) {
      ytId = trimmed.split('youtube.com/embed/')[1].split('?')[0].split('&')[0];
    } else if (trimmed.includes('youtube.com/shorts/')) {
      ytId = trimmed.split('youtube.com/shorts/')[1].split('?')[0].split('&')[0];
    }

    if (ytId) {
      return `https://www.youtube.com/embed/${ytId}?rel=0&playsinline=1&enablejsapi=1`;
    }

    return trimmed;
  } catch {}
  return url;
}

// Intelligent CSV Parser for Quiz MCQs
function parseCSVQuestions(csvText) {
  if (!csvText || !csvText.trim()) return [];

  let cleanText = csvText;
  if (cleanText.charCodeAt(0) === 0xFEFF) {
    cleanText = cleanText.slice(1);
  }

  const rows = [];
  let currentRow = [];
  let inQuotes = false;
  let field = '';

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(field.trim());
      field = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(field.trim());
      if (currentRow.some(c => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field.length > 0 || currentRow.length > 0) {
    currentRow.push(field.trim());
    if (currentRow.some(c => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) return [];

  const firstRow = rows[0].map(c => (c || '').toLowerCase().trim());
  const hasHeader = firstRow.some(c => 
    c.includes('question') || c.includes('প্রশ্ন') || c.includes('option') || c.includes('answer') || c.includes('উত্তর')
  );

  let qCol = 0, optACol = 1, optBCol = 2, optCCol = 3, optDCol = 4, ansCol = 5, expCol = 6;

  if (hasHeader) {
    firstRow.forEach((col, idx) => {
      if (col.includes('question') || col.includes('প্রশ্ন') || col === 'q') qCol = idx;
      else if (col.includes('option a') || col.includes('opt a') || col.includes('option 1') || col === 'a' || col === 'ক') optACol = idx;
      else if (col.includes('option b') || col.includes('opt b') || col.includes('option 2') || col === 'b' || col === 'খ') optBCol = idx;
      else if (col.includes('option c') || col.includes('opt c') || col.includes('option 3') || col === 'c' || col === 'গ') optCCol = idx;
      else if (col.includes('option d') || col.includes('opt d') || col.includes('option 4') || col === 'd' || col === 'ঘ') optDCol = idx;
      else if (col.includes('correct') || col.includes('answer') || col.includes('ans') || col.includes('উত্তর')) ansCol = idx;
      else if (col.includes('explanation') || col.includes('explain') || col.includes('ব্যাখ্যা') || col.includes('hint')) expCol = idx;
    });
  }

  const dataRows = hasHeader ? rows.slice(1) : rows;
  const questions = [];

  dataRows.forEach((row, rIdx) => {
    const qText = row[qCol] || '';
    if (!qText.trim()) return;

    const optA = (row[optACol] || '').trim();
    const optB = (row[optBCol] || '').trim();
    const optC = (row[optCCol] || '').trim();
    const optD = (row[optDCol] || '').trim();
    const options = [optA || 'Option A', optB || 'Option B', optC || 'Option C', optD || 'Option D'];

    let correctIdx = 0;
    const rawAns = String(row[ansCol] || '').trim();
    const upperAns = rawAns.toUpperCase();
    const cleanAns = upperAns.replace(/[()[\]{}.,:;\-\s]/g, '').replace(/^(?:OPTION|OPT|ANS|ANSWER|উত্তর|সঠিক)/, '').trim();

    if (['A', '1', 'ক'].includes(cleanAns)) correctIdx = 0;
    else if (['B', '2', 'খ'].includes(cleanAns)) correctIdx = 1;
    else if (['C', '3', 'গ'].includes(cleanAns)) correctIdx = 2;
    else if (['D', '4', 'ঘ'].includes(cleanAns)) correctIdx = 3;
    else if (rawAns) {
      const matchIdx = options.findIndex(o => o.toLowerCase().trim() === rawAns.toLowerCase().trim());
      if (matchIdx !== -1) correctIdx = matchIdx;
    }

    const expText = expCol < row.length ? (row[expCol] || '').trim() : '';

    questions.push({
      id: Date.now() + rIdx,
      question_no: questions.length + 1,
      question: qText.trim(),
      options: options,
      correctAnswer: correctIdx,
      correct_index: correctIdx,
      explanation: expText
    });
  });

  return questions;
}

function downloadSampleQuizCSV() {
  const sampleContent = `Question,Option A,Option B,Option C,Option D,Correct Answer,Explanation
"Which of the following is an Abstract Noun?","Honesty","Water","Army","Boy","A","Honesty represents a quality or state of mind."
"The word 'Flock' is an example of which noun?","Proper Noun","Collective Noun","Material Noun","Common Noun","B","Flock refers to a collection of birds or sheep."
"'Gold is a precious metal.' Here 'Gold' is a —","Common Noun","Proper Noun","Material Noun","Abstract Noun","C","Gold is an uncountable substance or matter."
"Which one is a Proper Noun?","City","Dhaka","Country","River","B","Dhaka is the specific name of an individual city."
"What kind of noun is 'Committee'?","Abstract Noun","Collective Noun","Proper Noun","Material Noun","B","Committee denotes a group of individuals appointed to a duty."`;

  const blob = new Blob([sampleContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'eduhunters_quiz_sample.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const isAllCat = (cat) => !cat || cat === 'All' || cat === 'সকল';

export default function CourseStudioPage({
  course,
  courseIndex,
  initialTab = 'curriculum',
  categories = [],
  onUpdateCourse,
  onBack,
  onPreview,
  openGalleryModal,
  triggerToast
}) {
  // Active Studio Tab: 'curriculum' | 'basic' | 'overview'
  const [activeTab, setActiveTab] = useState(initialTab === 'details' ? 'overview' : (initialTab || 'curriculum'));

  // Keep activeTab in sync whenever initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab === 'details' ? 'overview' : initialTab);
    }
  }, [initialTab]);
  const [expandedSections, setExpandedSections] = useState({ 0: true, 1: true });
  const [newLessonDrafts, setNewLessonDrafts] = useState({});
  const [newFeatureInput, setNewFeatureInput] = useState('');
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving'
  const [quizModal, setQuizModal] = useState({
    isOpen: false,
    secIdx: null,
    chapIdx: null,
    lesIdx: null,
    lessonTitle: '',
    quiz: null,
    bulkText: '',
    activeTab: 'builder'
  });

  // Step-by-Step Class Integration Wizard Modal State
  const [classWizardModal, setClassWizardModal] = useState({
    isOpen: false,
    mode: 'add', // 'add' | 'edit'
    secIdx: 0,
    chapIdx: 0,
    lesIdx: null,
    activeStep: 1, // 1: Info, 2: Video, 3: PDF, 4: Quiz
    title: '',
    duration: '45 min',
    isFree: false,
    videoUrl: '',
    pdfUrl: '',
    hasQuiz: false,
    quizTitle: '',
    durationMinutes: 10,
    negativeMark: 0.25,
    questions: [],
    examId: ''
  });
  const wizardCsvInputRef = useRef(null);
  const [showIntegrationGuide, setShowIntegrationGuide] = useState(false);

  // Bunny.net Cloud Integration State
  const [bunnyConfig, setBunnyConfig] = useState(() => getBunnyConfig());
  const [showBunnySettingsModal, setShowBunnySettingsModal] = useState(false);
  const [bunnyTestResults, setBunnyTestResults] = useState({ stream: null, storage: null, testingStream: false, testingStorage: false });
  const [videoTabMode, setVideoTabMode] = useState('upload'); // 'upload' | 'url'
  const [pdfTabMode, setPdfTabMode] = useState('upload'); // 'upload' | 'url'
  const [videoUploadState, setVideoUploadState] = useState({ uploading: false, percent: 0, loaded: 0, total: 0, error: '' });
  const [pdfUploadState, setPdfUploadState] = useState({ uploading: false, percent: 0, loaded: 0, total: 0, error: '' });
  const videoFileInputRef = useRef(null);
  const pdfFileInputRef = useRef(null);

  // Dedicated refs & state for CSV Upload
  const quickCsvInputRef = useRef(null);
  const csvFileInputRef = useRef(null);
  const [csvFileObj, setCsvFileObj] = useState(null);
  const [csvImportMode, setCsvImportMode] = useState('append'); // 'append' | 'replace'
  const [csvParsedPreview, setCsvParsedPreview] = useState([]);
  const [questionFilter, setQuestionFilter] = useState('');

  // Derived Curriculum Statistics
  const curriculum = useMemo(() => Array.isArray(course?.curriculum) ? course.curriculum : [], [course]);
  const totalSections = curriculum.length;
  const totalChapters = useMemo(() => curriculum.reduce((acc, s) => acc + (s.chapters?.length || 0), 0), [curriculum]);
  const totalLessons = useMemo(() => curriculum.reduce((acc, s) => acc + (s.chapters || []).reduce((chAcc, ch) => chAcc + (ch.lessons?.length || 0), 0), 0), [curriculum]);
  const totalFreeDemos = useMemo(() => curriculum.reduce((acc, s) => acc + (s.chapters || []).reduce((chAcc, ch) => chAcc + (ch.lessons || []).filter(l => typeof l === 'object' && l.isFree).length, 0), 0), [curriculum]);
  const totalLessonsWithVideo = useMemo(() => curriculum.reduce((acc, s) => acc + (s.chapters || []).reduce((chAcc, ch) => chAcc + (ch.lessons || []).filter(l => typeof l === 'object' && l.videoUrl && l.videoUrl.trim()).length, 0), 0), [curriculum]);
  const totalLessonsWithPdf = useMemo(() => curriculum.reduce((acc, s) => acc + (s.chapters || []).reduce((chAcc, ch) => chAcc + (ch.lessons || []).filter(l => typeof l === 'object' && l.pdfUrl && l.pdfUrl.trim()).length, 0), 0), [curriculum]);
  const totalLessonsWithQuiz = useMemo(() => curriculum.reduce((acc, s) => acc + (s.chapters || []).reduce((chAcc, ch) => chAcc + (ch.lessons || []).filter(l => typeof l === 'object' && ((l.quiz && l.quiz.questions?.length > 0) || l.examId)).length, 0), 0), [curriculum]);

  const isExamBatch = Boolean(
    course?.isExamBatch ||
    course?.category === 'EXAM BATCH' ||
    course?.category === 'exam batch' ||
    ['sureshot', 'medical', 'rtds', 'english_master', 'gk_course', 'medilogy'].includes(course?.id) ||
    ['sureshot', 'medical', 'rtds', 'english_master', 'gk_course', 'medilogy'].includes(course?.key) ||
    ['sureshot', 'medical', 'rtds', 'english_master', 'gk_course', 'medilogy'].includes(course?.slug)
  );

  if (isExamBatch) {
    return (
      <ExamBatchStudio
        course={course}
        courseIndex={courseIndex}
        initialTab={initialTab}
        onUpdateCourse={onUpdateCourse}
        onBack={onBack}
        onPreview={onPreview}
        openGalleryModal={openGalleryModal}
        triggerToast={triggerToast}
      />
    );
  }

  // Helper to trigger save with animation
  const notifySave = (updatedCourse) => {
    setSaveStatus('saving');
    onUpdateCourse(updatedCourse);
    setTimeout(() => {
      setSaveStatus('saved');
    }, 350);
  };

  // Field updater
  const handleUpdateField = (field, value) => {
    const updated = { ...course, [field]: value };
    notifySave(updated);
  };

  // ==========================================
  // CURRICULUM MANAGEMENT HANDLERS
  // ==========================================
  const handleLoadTemplate = () => {
    if (confirm('Load Master English standard syllabus template? This will append ready-made modules and lessons.')) {
      const template = JSON.parse(JSON.stringify(masterEnglishCourseData.curriculum));
      const updatedCurriculum = [...curriculum, ...template];
      const updated = { ...course, curriculum: updatedCurriculum };
      notifySave(updated);
      setExpandedSections(prev => ({ ...prev, [curriculum.length]: true }));
      triggerToast('✨ Standard syllabus template loaded successfully!');
    }
  };

  const handleAddSection = () => {
    const newSection = {
      id: `sec-${Date.now()}`,
      name: `Module ${curriculum.length + 1}: New Topic`,
      summary: '1 Chapter · 5 Lectures',
      chapters: [
        {
          id: `chap-${Date.now()}`,
          name: 'Chapter 1: Foundational Concepts',
          lessons: []
        }
      ]
    };
    const updatedCurriculum = [...curriculum, newSection];
    const updated = { ...course, curriculum: updatedCurriculum };
    notifySave(updated);
    setExpandedSections(prev => ({ ...prev, [curriculum.length]: true }));
    triggerToast('➕ New Module added to syllabus');
  };

  const handleUpdateSection = (secIdx, field, value) => {
    const updatedCurriculum = curriculum.map((sec, i) => {
      if (i === secIdx) return { ...sec, [field]: value };
      return sec;
    });
    notifySave({ ...course, curriculum: updatedCurriculum });
  };

  const handleDeleteSection = (secIdx) => {
    const secName = curriculum[secIdx]?.name || 'this module';
    if (confirm(`Are you sure you want to delete "${secName}"?`)) {
      const updatedCurriculum = curriculum.filter((_, i) => i !== secIdx);
      notifySave({ ...course, curriculum: updatedCurriculum });
      triggerToast('🗑️ Module deleted');
    }
  };

  const handleMoveSection = (secIdx, direction) => {
    const targetIdx = direction === 'up' ? secIdx - 1 : secIdx + 1;
    if (targetIdx < 0 || targetIdx >= curriculum.length) return;
    const nextCurriculum = [...curriculum];
    const temp = nextCurriculum[secIdx];
    nextCurriculum[secIdx] = nextCurriculum[targetIdx];
    nextCurriculum[targetIdx] = temp;
    notifySave({ ...course, curriculum: nextCurriculum });
  };

  const handleAddChapter = (secIdx) => {
    const updatedCurriculum = curriculum.map((sec, i) => {
      if (i === secIdx) {
        const chapters = Array.isArray(sec.chapters) ? [...sec.chapters] : [];
        chapters.push({
          id: `chap-${Date.now()}`,
          name: `Chapter ${chapters.length + 1}: Detailed Lessons`,
          lessons: []
        });
        return { ...sec, chapters };
      }
      return sec;
    });
    notifySave({ ...course, curriculum: updatedCurriculum });
    triggerToast('➕ Chapter added to module');
  };

  const handleUpdateChapter = (secIdx, chapIdx, name) => {
    const updatedCurriculum = curriculum.map((sec, i) => {
      if (i === secIdx) {
        const chapters = sec.chapters.map((ch, cIdx) => {
          if (cIdx === chapIdx) return { ...ch, name };
          return ch;
        });
        return { ...sec, chapters };
      }
      return sec;
    });
    notifySave({ ...course, curriculum: updatedCurriculum });
  };

  const handleDeleteChapter = (secIdx, chapIdx) => {
    if (confirm('Delete this chapter and all of its lectures?')) {
      const updatedCurriculum = curriculum.map((sec, i) => {
        if (i === secIdx) {
          return {
            ...sec,
            chapters: sec.chapters.filter((_, cIdx) => cIdx !== chapIdx)
          };
        }
        return sec;
      });
      notifySave({ ...course, curriculum: updatedCurriculum });
      triggerToast('🗑️ Chapter removed');
    }
  };

  const handleAddLesson = (secIdx, chapIdx) => {
    const draftKey = `${secIdx}-${chapIdx}`;
    const draft = newLessonDrafts[draftKey] || { title: '', duration: '45 min', videoUrl: '', pdfUrl: '', isFree: false };
    if (!draft.title.trim()) {
      alert('Please enter a lesson title before adding.');
      return;
    }

    const newLessonItem = {
      id: `les-${Date.now()}`,
      title: draft.title.trim(),
      duration: (draft.duration && draft.duration.trim()) || '45 min',
      videoUrl: (draft.videoUrl && draft.videoUrl.trim()) || '',
      pdfUrl: (draft.pdfUrl && draft.pdfUrl.trim()) || '',
      isFree: Boolean(draft.isFree)
    };

    const updatedCurriculum = curriculum.map((sec, i) => {
      if (i === secIdx) {
        const chapters = sec.chapters.map((ch, cIdx) => {
          if (cIdx === chapIdx) {
            const lessons = Array.isArray(ch.lessons) ? [...ch.lessons] : [];
            lessons.push(newLessonItem);
            return { ...ch, lessons };
          }
          return ch;
        });
        return { ...sec, chapters };
      }
      return sec;
    });

    notifySave({ ...course, curriculum: updatedCurriculum });
    setNewLessonDrafts(prev => ({
      ...prev,
      [draftKey]: { title: '', duration: '45 min', videoUrl: '', pdfUrl: '', isFree: false }
    }));
    triggerToast('🎉 Lesson added successfully!');
  };

  const handleUpdateLesson = (secIdx, chapIdx, lesIdx, field, value) => {
    const updatedCurriculum = curriculum.map((sec, i) => {
      if (i === secIdx) {
        const chapters = sec.chapters.map((ch, cIdx) => {
          if (cIdx === chapIdx) {
            const lessons = ch.lessons.map((les, lIdx) => {
              if (lIdx === lesIdx) {
                const currentObj = typeof les === 'object' && les !== null ? les : { title: les, duration: '45 min', videoUrl: '', pdfUrl: '', isFree: false };
                return { ...currentObj, [field]: value };
              }
              return les;
            });
            return { ...ch, lessons };
          }
          return ch;
        });
        return { ...sec, chapters };
      }
      return sec;
    });
    notifySave({ ...course, curriculum: updatedCurriculum });
  };

  const handleOpenQuizEditor = (secIdx, chapIdx, lesIdx, lesson) => {
    const isObj = typeof lesson === 'object' && lesson !== null;
    const existingQuiz = isObj ? (lesson.quiz || lesson.exam) : null;
    const lessonTitleStr = isObj ? (lesson.title || `Lesson #${lesIdx + 1}`) : lesson;

    const normalizedQuestions = (existingQuiz?.questions && Array.isArray(existingQuiz.questions))
      ? existingQuiz.questions.map((q, idx) => {
          const cIdx = q.correctAnswer !== undefined ? Number(q.correctAnswer) : (q.correct_index !== undefined ? Number(q.correct_index) : 0);
          return {
            ...q,
            id: q.id || `q-${Date.now()}-${idx + 1}`,
            question_no: idx + 1,
            correctAnswer: cIdx,
            correct_index: cIdx,
            options: Array.isArray(q.options) && q.options.length >= 4
              ? q.options.slice(0, 4)
              : [q.options?.[0] || 'Option A', q.options?.[1] || 'Option B', q.options?.[2] || 'Option C', q.options?.[3] || 'Option D']
          };
        })
      : [];

    const initialQuiz = existingQuiz ? {
      title: (existingQuiz.title || `${lessonTitleStr} - Quiz`).replace(/practice\s*quiz/gi, 'Quiz'),
      durationMinutes: existingQuiz.durationMinutes || 10,
      totalMarks: existingQuiz.totalMarks || (normalizedQuestions.length || 5),
      negativeMark: existingQuiz.negativeMark !== undefined ? existingQuiz.negativeMark : 0.25,
      questions: normalizedQuestions,
      examId: existingQuiz.examId || (isObj ? lesson.examId : '') || ''
    } : {
      title: `${lessonTitleStr} - Quiz`,
      durationMinutes: 10,
      totalMarks: 5,
      negativeMark: 0.25,
      questions: [],
      examId: (isObj ? lesson.examId : '') || ''
    };

    setQuizModal({
      isOpen: true,
      secIdx,
      chapIdx,
      lesIdx,
      lessonTitle: lessonTitleStr,
      quiz: initialQuiz,
      bulkText: '',
      activeTab: 'builder'
    });
  };

  const handleSaveQuizModal = () => {
    if (!quizModal.isOpen || quizModal.secIdx === null) return;
    const { secIdx, chapIdx, lesIdx, quiz } = quizModal;

    const cleanedQuestions = (quiz.questions || []).map((q, idx) => {
      const correctIdx = q.correctAnswer !== undefined 
        ? Number(q.correctAnswer) 
        : (q.correct_index !== undefined ? Number(q.correct_index) : 0);
      return {
        id: q.id || `q-${Date.now()}-${idx + 1}`,
        question_no: idx + 1,
        question: (q.question || '').trim(),
        options: Array.isArray(q.options) && q.options.length >= 4 
          ? q.options.slice(0, 4) 
          : [q.options?.[0] || 'Option A', q.options?.[1] || 'Option B', q.options?.[2] || 'Option C', q.options?.[3] || 'Option D'],
        correctAnswer: correctIdx,
        correct_index: correctIdx,
        explanation: (q.explanation || '').trim()
      };
    });

    const cleanedQuiz = {
      ...quiz,
      title: (quiz.title || `${quizModal.lessonTitle} - Quiz`).trim(),
      durationMinutes: Number(quiz.durationMinutes) > 0 ? Number(quiz.durationMinutes) : 10,
      totalMarks: Number(quiz.totalMarks) > 0 ? Number(quiz.totalMarks) : (cleanedQuestions.length || 5),
      negativeMark: (quiz.negativeMark !== '' && quiz.negativeMark !== undefined && !isNaN(Number(quiz.negativeMark))) ? Number(quiz.negativeMark) : 0.25,
      questions: cleanedQuestions,
      examId: quiz.examId?.trim() || null
    };

    const updatedCurriculum = curriculum.map((sec, i) => {
      if (i === secIdx) {
        const chapters = (sec.chapters || []).map((ch, cIdx) => {
          if (cIdx === chapIdx) {
            const lessons = (ch.lessons || []).map((les, lIdx) => {
              if (lIdx === lesIdx) {
                const currentObj = typeof les === 'object' && les !== null ? les : { title: les, duration: '45 min', videoUrl: '', pdfUrl: '', isFree: false };
                return { 
                  ...currentObj, 
                  quiz: cleanedQuiz,
                  examId: cleanedQuiz.examId || currentObj.examId || null
                };
              }
              return les;
            });
            return { ...ch, lessons };
          }
          return ch;
        });
        return { ...sec, chapters };
      }
      return sec;
    });

    notifySave({ ...course, curriculum: updatedCurriculum });
    setQuizModal(prev => ({ ...prev, isOpen: false }));
    triggerToast('🎉 Class quiz saved successfully!');
  };

  const handleRemoveQuizModal = () => {
    if (!quizModal.isOpen || quizModal.secIdx === null) return;
    const { secIdx, chapIdx, lesIdx } = quizModal;
    if (!confirm('Are you sure you want to remove the quiz from this lesson?')) return;

    const updatedCurriculum = curriculum.map((sec, i) => {
      if (i === secIdx) {
        const chapters = (sec.chapters || []).map((ch, cIdx) => {
          if (cIdx === chapIdx) {
            const lessons = (ch.lessons || []).map((les, lIdx) => {
              if (lIdx === lesIdx) {
                const currentObj = typeof les === 'object' && les !== null ? les : { title: les, duration: '45 min', videoUrl: '', pdfUrl: '', isFree: false };
                return { 
                  ...currentObj, 
                  quiz: null,
                  examId: null
                };
              }
              return les;
            });
            return { ...ch, lessons };
          }
          return ch;
        });
        return { ...sec, chapters };
      }
      return sec;
    });

    notifySave({ ...course, curriculum: updatedCurriculum });
    setQuizModal(prev => ({ ...prev, isOpen: false }));
    triggerToast('🗑️ Quiz removed from lesson');
  };

  const handleAddQuestionToQuiz = () => {
    setQuizModal(prev => {
      const currentList = prev.quiz?.questions || [];
      const newQuestion = {
        id: `q-${Date.now()}-${currentList.length + 1}`,
        question_no: currentList.length + 1,
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        correct_index: 0,
        explanation: ''
      };
      const updatedList = [...currentList, newQuestion];
      return {
        ...prev,
        activeTab: 'builder',
        quiz: {
          ...prev.quiz,
          questions: updatedList,
          totalMarks: updatedList.length
        }
      };
    });
  };

  const handleDuplicateQuestion = (qIdx) => {
    setQuizModal(prev => {
      const currentList = prev.quiz?.questions || [];
      const target = currentList[qIdx];
      if (!target) return prev;
      const clone = {
        ...target,
        id: `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        question: target.question ? `${target.question} (Copy)` : 'Copy of question',
        options: [...(target.options || ['', '', '', ''])],
        correctAnswer: target.correctAnswer !== undefined ? target.correctAnswer : (target.correct_index || 0),
        correct_index: target.correct_index !== undefined ? target.correct_index : (target.correctAnswer || 0)
      };
      const updatedList = [...currentList.slice(0, qIdx + 1), clone, ...currentList.slice(qIdx + 1)];
      return {
        ...prev,
        quiz: {
          ...prev.quiz,
          questions: updatedList,
          totalMarks: updatedList.length
        }
      };
    });
    triggerToast('📋 Question duplicated');
  };

  const handleMoveQuestion = (qIdx, direction) => {
    setQuizModal(prev => {
      const currentList = [...(prev.quiz?.questions || [])];
      const targetIdx = direction === 'up' ? qIdx - 1 : qIdx + 1;
      if (targetIdx < 0 || targetIdx >= currentList.length) return prev;
      const temp = currentList[qIdx];
      currentList[qIdx] = currentList[targetIdx];
      currentList[targetIdx] = temp;
      return {
        ...prev,
        quiz: {
          ...prev.quiz,
          questions: currentList
        }
      };
    });
  };

  const handleClearAllQuestions = () => {
    if (!confirm('Are you sure you want to clear all questions in this quiz?')) return;
    setQuizModal(prev => ({
      ...prev,
      quiz: {
        ...prev.quiz,
        questions: [],
        totalMarks: 0
      }
    }));
    triggerToast('🗑️ All questions cleared');
  };

  // CSV File Upload & Processing Handler
  const handleProcessCSVFile = (file, mode = 'append') => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const parsed = parseCSVQuestions(text);
        if (!parsed || parsed.length === 0) {
          triggerToast('❌ Could not parse any valid questions from CSV file. Please check format.');
          return;
        }

        setQuizModal(prev => {
          const existing = prev.quiz?.questions || [];
          const combined = mode === 'replace' ? parsed : [...existing, ...parsed];
          return {
            ...prev,
            quiz: {
              ...prev.quiz,
              questions: combined,
              totalMarks: combined.length
            },
            activeTab: 'builder'
          };
        });

        setCsvFileObj(null);
        setCsvParsedPreview([]);
        triggerToast(`🎉 Successfully imported ${parsed.length} questions from CSV!`);
      } catch (err) {
        console.error('Error processing CSV:', err);
        triggerToast('❌ Error parsing CSV file. Check formatting.');
      }
    };
    reader.onerror = () => {
      triggerToast('❌ Could not read the selected file.');
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleSelectCSVFileForPreview = (file) => {
    if (!file) return;
    setCsvFileObj(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const parsed = parseCSVQuestions(text);
        setCsvParsedPreview(parsed);
      } catch {
        setCsvParsedPreview([]);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleDownloadSampleCSV = () => {
    downloadSampleQuizCSV();
    triggerToast('📥 Downloaded sample quiz CSV template');
  };

  // =========================================================================
  // BUNNY.NET DIRECT CLOUD UPLOAD HANDLERS
  // =========================================================================
  const handleDirectVideoUpload = async (file) => {
    if (!file) return;
    if (!isBunnyStreamConfigured(bunnyConfig)) {
      setShowBunnySettingsModal(true);
      triggerToast('⚙️ Please enter your Bunny Stream Library ID & API Key.');
      return;
    }

    setVideoUploadState({ uploading: true, percent: 0, loaded: 0, total: file.size, error: '' });
    try {
      const res = await uploadVideoToBunnyStream(file, classWizardModal.title || file.name, ({ percent, loaded, total }) => {
        setVideoUploadState(prev => ({ ...prev, percent, loaded, total }));
      });
      setClassWizardModal(prev => ({
        ...prev,
        videoUrl: res.embedUrl
      }));
      setVideoUploadState({ uploading: false, percent: 100, loaded: file.size, total: file.size, error: '' });
      triggerToast('🎉 Video uploaded directly to Bunny Stream!');
    } catch (err) {
      setVideoUploadState({ uploading: false, percent: 0, loaded: 0, total: 0, error: err.message });
      triggerToast(`❌ ${err.message}`);
    }
  };

  const handleDirectPdfUpload = async (file) => {
    if (!file) return;
    if (!isBunnyStorageConfigured(bunnyConfig)) {
      setShowBunnySettingsModal(true);
      triggerToast('⚙️ Please configure your Bunny Storage Zone credentials.');
      return;
    }

    setPdfUploadState({ uploading: true, percent: 0, loaded: 0, total: file.size, error: '' });
    try {
      const res = await uploadPdfToBunnyStorage(file, 'course_notes', ({ percent, loaded, total }) => {
        setPdfUploadState(prev => ({ ...prev, percent, loaded, total }));
      });
      setClassWizardModal(prev => ({
        ...prev,
        pdfUrl: res.cdnUrl
      }));
      setPdfUploadState({ uploading: false, percent: 100, loaded: file.size, total: file.size, error: '' });
      triggerToast('🎉 PDF sheet uploaded directly to Bunny Storage CDN!');
    } catch (err) {
      setPdfUploadState({ uploading: false, percent: 0, loaded: 0, total: 0, error: err.message });
      triggerToast(`❌ ${err.message}`);
    }
  };

  const handleSaveBunnySettings = () => {
    saveBunnyConfig(bunnyConfig);
    setShowBunnySettingsModal(false);
    triggerToast('✅ Bunny.net credentials saved successfully!');
  };

  const handleTestBunnyStream = async () => {
    setBunnyTestResults(prev => ({ ...prev, testingStream: true, stream: null }));
    const res = await testBunnyStreamConnection(bunnyConfig);
    setBunnyTestResults(prev => ({ ...prev, testingStream: false, stream: res }));
    if (res.success) {
      triggerToast('🟢 Bunny Stream connected successfully!');
    } else {
      triggerToast(`❌ Stream connection: ${res.message}`);
    }
  };

  const handleTestBunnyStorage = async () => {
    setBunnyTestResults(prev => ({ ...prev, testingStorage: true, storage: null }));
    const res = await testBunnyStorageConnection(bunnyConfig);
    setBunnyTestResults(prev => ({ ...prev, testingStorage: false, storage: res }));
    if (res.success) {
      triggerToast('🟢 Bunny Storage connected successfully!');
    } else {
      triggerToast(`❌ Storage connection: ${res.message}`);
    }
  };

  // =========================================================================
  // STEP-BY-STEP CLASS INTEGRATION WIZARD HANDLERS
  // =========================================================================
  const handleOpenAddClassWizard = (secIdx = 0, chapIdx = 0, initialStep = 1) => {
    let targetCurriculum = curriculum;
    let targetSec = secIdx;
    let targetChap = chapIdx;

    if (!targetCurriculum || targetCurriculum.length === 0) {
      const defaultSec = {
        id: `sec-${Date.now()}`,
        title: 'Module 1: Complete Foundation Course',
        chapters: [{
          id: `chap-${Date.now()}`,
          name: 'Chapter 01: Core Lecture Series',
          lessons: []
        }]
      };
      targetCurriculum = [defaultSec];
      notifySave({ ...course, curriculum: targetCurriculum });
      targetSec = 0;
      targetChap = 0;
    } else if (!targetCurriculum[targetSec]?.chapters || targetCurriculum[targetSec].chapters.length === 0) {
      const updatedCurriculum = targetCurriculum.map((sec, i) => {
        if (i === targetSec) {
          return {
            ...sec,
            chapters: [{
              id: `chap-${Date.now()}`,
              name: 'Chapter 01: Core Lecture Series',
              lessons: []
            }]
          };
        }
        return sec;
      });
      notifySave({ ...course, curriculum: updatedCurriculum });
      targetChap = 0;
    }

    setClassWizardModal({
      isOpen: true,
      mode: 'add',
      secIdx: targetSec,
      chapIdx: targetChap,
      lesIdx: null,
      activeStep: initialStep,
      title: '',
      duration: '45 min',
      isFree: false,
      videoUrl: '',
      pdfUrl: '',
      hasQuiz: false,
      quizTitle: '',
      durationMinutes: 10,
      negativeMark: 0.25,
      questions: [],
      examId: ''
    });
  };

  const handleOpenEditClassWizard = (secIdx, chapIdx, lesIdx, lesson, initialStep = 1) => {
    const isObj = typeof lesson === 'object' && lesson !== null;
    const existingQuiz = isObj ? (lesson.quiz || lesson.exam) : null;
    const lessonTitle = isObj ? (lesson.title || `Lesson #${lesIdx + 1}`) : lesson;

    setClassWizardModal({
      isOpen: true,
      mode: 'edit',
      secIdx,
      chapIdx,
      lesIdx,
      activeStep: initialStep,
      title: lessonTitle,
      duration: isObj ? (lesson.duration || '45 min') : '45 min',
      isFree: isObj ? Boolean(lesson.isFree) : false,
      videoUrl: isObj ? (lesson.videoUrl || '') : '',
      pdfUrl: isObj ? (lesson.pdfUrl || '') : '',
      hasQuiz: Boolean(existingQuiz && (existingQuiz.questions?.length > 0 || existingQuiz.examId)),
      quizTitle: existingQuiz?.title || `${lessonTitle} - Quiz`,
      durationMinutes: existingQuiz?.durationMinutes || 10,
      negativeMark: existingQuiz?.negativeMark !== undefined ? existingQuiz.negativeMark : 0.25,
      questions: Array.isArray(existingQuiz?.questions) ? existingQuiz.questions : [],
      examId: existingQuiz?.examId || (isObj ? lesson.examId : '') || ''
    });
  };

  const handleSaveClassWizard = () => {
    if (!classWizardModal.title.trim()) {
      setClassWizardModal(prev => ({ ...prev, activeStep: 1 }));
      alert('Please enter a Class Title in Step 1 before saving.');
      return;
    }

    const { secIdx, chapIdx, lesIdx, mode, hasQuiz, quizTitle, durationMinutes, negativeMark, questions, examId } = classWizardModal;

    const finalQuiz = hasQuiz ? {
      title: quizTitle.trim() || `${classWizardModal.title.trim()} - Quiz`,
      durationMinutes: Number(durationMinutes) || 10,
      totalMarks: questions.length > 0 ? questions.length : 5,
      negativeMark: Number(negativeMark) || 0.25,
      questions: questions,
      examId: examId || ''
    } : null;

    if (mode === 'add') {
      const newLessonItem = {
        id: `les-${Date.now()}`,
        title: classWizardModal.title.trim(),
        duration: classWizardModal.duration.trim() || '45 min',
        videoUrl: classWizardModal.videoUrl.trim(),
        pdfUrl: classWizardModal.pdfUrl.trim(),
        isFree: Boolean(classWizardModal.isFree),
        quiz: finalQuiz,
        examId: finalQuiz?.examId || null
      };

      const updatedCurriculum = curriculum.map((sec, sIdx) => {
        if (sIdx === secIdx) {
          const chapters = (sec.chapters || []).map((ch, cIdx) => {
            if (cIdx === chapIdx) {
              const lessons = Array.isArray(ch.lessons) ? [...ch.lessons, newLessonItem] : [newLessonItem];
              return { ...ch, lessons };
            }
            return ch;
          });
          return { ...sec, chapters };
        }
        return sec;
      });

      notifySave({ ...course, curriculum: updatedCurriculum });
      setClassWizardModal(prev => ({ ...prev, isOpen: false }));
      triggerToast(`🎉 Class "${classWizardModal.title}" created & published!`);
    } else {
      // Edit mode
      const updatedCurriculum = curriculum.map((sec, sIdx) => {
        if (sIdx === secIdx) {
          const chapters = (sec.chapters || []).map((ch, cIdx) => {
            if (cIdx === chapIdx) {
              const lessons = (ch.lessons || []).map((les, lIdx) => {
                if (lIdx === lesIdx) {
                  const currentObj = typeof les === 'object' && les !== null ? les : {};
                  return {
                    ...currentObj,
                    title: classWizardModal.title.trim(),
                    duration: classWizardModal.duration.trim() || '45 min',
                    videoUrl: classWizardModal.videoUrl.trim(),
                    pdfUrl: classWizardModal.pdfUrl.trim(),
                    isFree: Boolean(classWizardModal.isFree),
                    quiz: finalQuiz,
                    examId: finalQuiz?.examId || null
                  };
                }
                return les;
              });
              return { ...ch, lessons };
            }
            return ch;
          });
          return { ...sec, chapters };
        }
        return sec;
      });

      notifySave({ ...course, curriculum: updatedCurriculum });
      setClassWizardModal(prev => ({ ...prev, isOpen: false }));
      triggerToast(`🎉 Class "${classWizardModal.title}" updated successfully!`);
    }
  };

  const handleWizardCSVUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const parsed = parseCSVQuestions(text);
        if (!parsed || parsed.length === 0) {
          triggerToast('❌ Could not parse any valid questions from CSV file.');
          return;
        }
        setClassWizardModal(prev => ({
          ...prev,
          hasQuiz: true,
          questions: [...prev.questions, ...parsed]
        }));
        triggerToast(`🎉 Successfully imported ${parsed.length} questions from CSV!`);
      } catch (err) {
        console.error('CSV parse error:', err);
        triggerToast('❌ Error parsing CSV file.');
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const handleAddWizardQuestion = () => {
    const newQ = {
      id: Date.now(),
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      correct_index: 0,
      explanation: ''
    };
    setClassWizardModal(prev => ({
      ...prev,
      hasQuiz: true,
      questions: [...prev.questions, newQ]
    }));
  };

  const handleUpdateWizardQuestion = (qIdx, field, val) => {
    setClassWizardModal(prev => {
      const updated = [...prev.questions];
      if (!updated[qIdx]) return prev;
      if (field === 'correctAnswer') {
        updated[qIdx] = { ...updated[qIdx], correctAnswer: val, correct_index: val };
      } else {
        updated[qIdx] = { ...updated[qIdx], [field]: val };
      }
      return { ...prev, questions: updated };
    });
  };

  const handleUpdateWizardOption = (qIdx, optIdx, val) => {
    setClassWizardModal(prev => {
      const updated = [...prev.questions];
      if (!updated[qIdx]) return prev;
      const options = [...(updated[qIdx].options || ['', '', '', ''])];
      options[optIdx] = val;
      updated[qIdx] = { ...updated[qIdx], options };
      return { ...prev, questions: updated };
    });
  };

  const handleDeleteWizardQuestion = (qIdx) => {
    setClassWizardModal(prev => ({
      ...prev,
      questions: prev.questions.filter((_, idx) => idx !== qIdx)
    }));
  };

  const handleBulkImportQuestions = () => {
    if (!quizModal.bulkText?.trim()) return;
    const existingCount = quizModal.quiz?.questions?.length || 0;
    const parsed = parseBulkQuestionsFromText(quizModal.bulkText, existingCount + 1);
    if (!parsed || parsed.length === 0) {
      triggerToast('❌ Could not find questions in the pasted text. Check format.');
      return;
    }
    const normalizedParsed = parsed.map((q, idx) => {
      const cIdx = q.correct_index !== undefined ? Number(q.correct_index) : 0;
      return {
        ...q,
        id: q.id || `q-${Date.now()}-${existingCount + idx + 1}`,
        question_no: existingCount + idx + 1,
        correctAnswer: cIdx,
        correct_index: cIdx
      };
    });
    setQuizModal(prev => {
      const combined = [...(prev.quiz?.questions || []), ...normalizedParsed];
      return {
        ...prev,
        quiz: {
          ...prev.quiz,
          questions: combined,
          totalMarks: combined.length
        },
        bulkText: '',
        activeTab: 'builder'
      };
    });
    triggerToast(`🎉 Imported ${parsed.length} questions successfully!`);
  };

  const handleDeleteLesson = (secIdx, chapIdx, lesIdx) => {
    const updatedCurriculum = curriculum.map((sec, i) => {
      if (i === secIdx) {
        const chapters = sec.chapters.map((ch, cIdx) => {
          if (cIdx === chapIdx) {
            return {
              ...ch,
              lessons: ch.lessons.filter((_, lIdx) => lIdx !== lesIdx)
            };
          }
          return ch;
        });
        return { ...sec, chapters };
      }
      return sec;
    });
    notifySave({ ...course, curriculum: updatedCurriculum });
    triggerToast('Lesson removed');
  };

  // Features List Handlers
  const handleAddFeature = () => {
    if (!newFeatureInput.trim()) return;
    const currentFeatures = Array.isArray(course?.features) ? course.features : [];
    const updated = { ...course, features: [...currentFeatures, newFeatureInput.trim()] };
    notifySave(updated);
    setNewFeatureInput('');
    triggerToast('Feature bullet added');
  };

  const handleRemoveFeature = (fIdx) => {
    const currentFeatures = Array.isArray(course?.features) ? course.features : [];
    const updated = { ...course, features: currentFeatures.filter((_, i) => i !== fIdx) };
    notifySave(updated);
  };

  // Toggle all expand/collapse
  const handleToggleExpandAll = () => {
    const areAllExpanded = curriculum.every((_, idx) => Boolean(expandedSections[idx]));
    const nextState = {};
    curriculum.forEach((_, idx) => {
      nextState[idx] = !areAllExpanded;
    });
    setExpandedSections(nextState);
  };

  return (
    <div className="min-h-screen bg-[#f4f6fa] text-slate-800 pb-20 animate-in fade-in duration-150">
      
      {/* ========================================================= */}
      {/* 1. STICKY TOP STUDIO BAR */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Back & Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold cursor-pointer transition-all border-none"
              title="Return to Courses Directory"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Courses Directory</span>
            </button>

            <span className="text-slate-300">/</span>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#5d5bf6]/10 text-[#5d5bf6]">
                  Course Studio
                </span>
                <span className="text-xs font-bold text-slate-400 font-mono">
                  #{courseIndex + 1}
                </span>
                {course.isBundle && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-500 text-white">
                    Bundle
                  </span>
                )}
              </div>
              <h1 className="text-sm sm:text-base font-black text-slate-900 truncate max-w-md sm:max-w-lg">
                {course.title || 'Untitled Course'}
              </h1>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Auto-save Status */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-500">
              <span className={`w-2 h-2 rounded-full transition-colors ${
                saveStatus === 'saving' ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'
              }`} />
              <span>{saveStatus === 'saving' ? 'Saving changes...' : 'All changes saved'}</span>
            </div>

            {/* Preview Live Page */}
            <button
              type="button"
              onClick={onPreview}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer border-none"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Preview Live Page</span>
            </button>

            {/* Save & Finish Button */}
            <button
              type="button"
              onClick={() => {
                triggerToast('🎉 Course changes saved successfully!');
                onBack();
              }}
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold shadow-md shadow-[#5d5bf6]/25 transition-all cursor-pointer border-none"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save & Done</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. COURSE SUMMARY & STATS KPI BANNER */}
      {/* ========================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* Course Card Preview */}
          <div className="flex items-center gap-4 min-w-0">
            <div 
              onClick={() => openGalleryModal(course.image, `Change Cover for ${course.title}`, 'Courses', (newUrl) => {
                handleUpdateField('image', newUrl);
              })}
              className="relative w-28 sm:w-36 aspect-video rounded-2xl overflow-hidden bg-slate-100 ring-1 ring-slate-200 group/img cursor-pointer shrink-0 shadow-2xs"
              title="Click to change cover image"
            >
              <img 
                src={course.image} 
                alt={course.title} 
                className="w-full h-full object-cover group-hover/img:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold gap-1">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Change</span>
              </div>
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                  {course.category || 'General'}
                </span>
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-extrabold ${
                  Number(course.salePrice) === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-900'
                }`}>
                  {Number(course.salePrice) === 0 ? 'Free Access' : `৳${Number(course.salePrice).toLocaleString()}`}
                </span>

                {/* Minimal Active/Inactive Toggle Switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={course.isActive !== false}
                  onClick={() => {
                    const nextActive = course.isActive === false ? true : false;
                    handleUpdateField('isActive', nextActive);
                    if (triggerToast) {
                      triggerToast(nextActive ? `🟢 "${course.title}" Activated` : `⚪ "${course.title}" Deactivated`);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 cursor-pointer border border-slate-200/80 bg-slate-50 hover:bg-slate-100 px-2.5 py-0.5 rounded-lg select-none transition-colors"
                  title={course.isActive !== false ? 'Active (Click to deactivate)' : 'Inactive (Click to activate)'}
                >
                  <span className={`text-[11px] font-bold ${course.isActive !== false ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {course.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                  <span className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                    course.isActive !== false ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}>
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                        course.isActive !== false ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </span>
                </button>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug line-clamp-1">
                {course.title}
              </h2>
              <p className="text-xs text-slate-400 font-medium line-clamp-1">
                {course.tagline || 'Manage modules, lecture videos, PDFs, and enrollment settings.'}
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <div className="bg-[#f4f6fa] rounded-2xl p-3 text-center border border-slate-200/60 min-w-[90px]">
              <span className="block text-lg font-black text-[#5d5bf6]">{totalSections}</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Modules</span>
            </div>
            <div className="bg-[#f4f6fa] rounded-2xl p-3 text-center border border-slate-200/60 min-w-[90px]">
              <span className="block text-lg font-black text-blue-600">{totalChapters}</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Chapters</span>
            </div>
            <div className="bg-[#f4f6fa] rounded-2xl p-3 text-center border border-slate-200/60 min-w-[90px]">
              <span className="block text-lg font-black text-purple-600">{totalLessons}</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Lessons</span>
            </div>
            <div className="bg-[#f4f6fa] rounded-2xl p-3 text-center border border-slate-200/60 min-w-[90px]">
              <span className="block text-lg font-black text-emerald-600">{totalFreeDemos}</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Demos</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. STUDIO NAVIGATION TABS (CLEAN & SEGMENTED) */}
      {/* ========================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
        <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('curriculum')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-none shrink-0 ${
              activeTab === 'curriculum'
                ? 'bg-[#5d5bf6] text-white shadow-xs shadow-[#5d5bf6]/20'
                : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Play className="w-4 h-4 text-emerald-400" />
            <span>Classes & Lectures Roadmap</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-black ${
              activeTab === 'curriculum' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {totalLessons} Classes · {totalChapters} Chapters
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-none shrink-0 ${
              activeTab === 'basic'
                ? 'bg-[#5d5bf6] text-white shadow-xs shadow-[#5d5bf6]/20'
                : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Basic Info & Pricing</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-none shrink-0 ${
              activeTab === 'overview'
                ? 'bg-[#5d5bf6] text-white shadow-xs shadow-[#5d5bf6]/20'
                : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Landing Page & Features</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-black ${
              activeTab === 'overview' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {course.features?.length || 0}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. MAIN STUDIO CONTENT AREA */}
      {/* ========================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
        
        {/* ========================================================= */}
        {/* TAB 1: CURRICULUM ROADMAP */}
        {/* ========================================================= */}
        {activeTab === 'curriculum' && (
          <div className="space-y-5">
            
            {/* 1. SLEEK CURRICULUM ACTION & HEALTH BAR */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3.5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Title & Stats */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-base font-black text-slate-900 tracking-tight">
                      Course Curriculum & Classes
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                      {totalSections} Modules · {totalChapters} Chapters · {totalLessons} Classes
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">
                    Organize lecture videos, study sheets, and practice exams with live student player sync.
                  </p>
                </div>

                {/* Primary Actions */}
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowIntegrationGuide(prev => !prev)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                      showIntegrationGuide 
                        ? 'bg-indigo-50 border-indigo-200 text-[#5d5bf6]' 
                        : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{showIntegrationGuide ? 'Hide Guide' : 'Integration Guide'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleExpandAll}
                    className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200/80 cursor-pointer transition-colors"
                  >
                    Expand/Collapse
                  </button>

                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200/80 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Module</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenAddClassWizard(0, 0, 1)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#5d5bf6] to-purple-600 hover:from-[#4e4be3] hover:to-purple-700 text-white text-xs font-black shadow-sm cursor-pointer border-none transition-all active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>+ Add New Class</span>
                  </button>
                </div>
              </div>

              {/* Live Curriculum Status & Integration Counts */}
              <div className="flex items-center gap-2 flex-wrap pt-2.5 border-t border-slate-100 text-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Health Status:</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {totalLessonsWithVideo} of {totalLessons} Videos Linked
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/80 text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  {totalLessonsWithPdf} Notes Attached
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200/80 text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  {totalLessonsWithQuiz} Quizzes Ready
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold">
                  {totalFreeDemos} Free Demos
                </span>
              </div>

              {/* Optional Collapsible 4-Step Guide Drawer */}
              {showIntegrationGuide && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-100 text-xs animate-in fade-in duration-150">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <span className="font-bold text-[#5d5bf6] flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-[#5d5bf6] text-white text-[10px] flex items-center justify-center font-mono font-bold">1</span>
                      Class Name
                    </span>
                    <p className="text-[11px] text-slate-500">Set lecture title and duration.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <span className="font-bold text-[#5d5bf6] flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-[#5d5bf6] text-white text-[10px] flex items-center justify-center font-mono font-bold">2</span>
                      Video URL
                    </span>
                    <p className="text-[11px] text-slate-500">Bunny Stream or YouTube link.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <span className="font-bold text-[#5d5bf6] flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-[#5d5bf6] text-white text-[10px] flex items-center justify-center font-mono font-bold">3</span>
                      PDF Notes
                    </span>
                    <p className="text-[11px] text-slate-500">Google Drive or PDF sheet link.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <span className="font-bold text-purple-700 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center font-mono font-bold">4</span>
                      + Quiz
                    </span>
                    <p className="text-[11px] text-slate-500">MCQ practice questions & CSV import.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Empty Syllabus State */}
            {curriculum.length === 0 && (
              <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-[#5d5bf6]/10 text-[#5d5bf6] flex items-center justify-center mx-auto shadow-inner">
                  <Layers className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-800">No syllabus modules created yet</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                    Click "+ Add Module" to build your custom syllabus structure or load standard template.
                  </p>
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleLoadTemplate}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold border-none cursor-pointer shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Load Template</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="px-4 py-2 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold border-none cursor-pointer shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Module</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. CURRICULUM MODULES LIST */}
            {curriculum.map((section, secIdx) => {
              const isSecExpanded = Boolean(expandedSections[secIdx]);
              const chapters = Array.isArray(section.chapters) ? section.chapters : [];

              return (
                <div 
                  key={section.id || secIdx}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden transition-all"
                >
                  {/* Module Header Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 bg-slate-50/80 border-b border-slate-200/80">
                    <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                      <span className="w-7 h-7 rounded-xl bg-white border border-slate-200 text-[#5d5bf6] font-black text-xs flex items-center justify-center shrink-0 shadow-2xs font-mono">
                        {secIdx + 1 < 10 ? `0${secIdx + 1}` : secIdx + 1}
                      </span>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={section.name || section.title || ''}
                          placeholder="Module Title (e.g. Module 01: Core Foundation)"
                          onChange={(e) => handleUpdateSection(secIdx, 'name', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-[#5d5bf6] shadow-2xs transition-all"
                        />
                      </div>
                    </div>

                    {/* Section Action Controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAddChapter(secIdx)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors shadow-2xs"
                        title="Add Chapter to this Module"
                      >
                        <Plus className="w-3.5 h-3.5 text-slate-500" />
                        <span>Chapter</span>
                      </button>

                      <button
                        type="button"
                        disabled={secIdx === 0}
                        onClick={() => handleMoveSection(secIdx, 'up')}
                        title="Move Module Up"
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={secIdx === curriculum.length - 1}
                        onClick={() => handleMoveSection(secIdx, 'down')}
                        title="Move Module Down"
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSection(secIdx)}
                        title="Delete Module"
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedSections(prev => ({ ...prev, [secIdx]: !prev[secIdx] }))}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 transition-colors shadow-2xs"
                      >
                        <span>{chapters.length} Chapters</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isSecExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Section Body (Chapters & Lessons) */}
                  {isSecExpanded && (
                    <div className="p-4 sm:p-5 space-y-4 bg-white">
                      
                      {chapters.length === 0 && (
                        <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                          <p className="text-xs text-slate-500 font-bold">No chapters created in this module yet</p>
                          <button
                            type="button"
                            onClick={() => handleAddChapter(secIdx)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5d5bf6] text-white text-xs font-bold border-none cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Create Chapter 01</span>
                          </button>
                        </div>
                      )}

                      {chapters.map((chapter, chapIdx) => {
                        const lessons = Array.isArray(chapter.lessons) ? chapter.lessons : [];
                        const draftKey = `${secIdx}-${chapIdx}`;
                        const draft = newLessonDrafts[draftKey] || { title: '' };

                        return (
                          <div 
                            key={chapIdx}
                            className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5 sm:p-4 space-y-3"
                          >
                            {/* Chapter Header */}
                            <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 pb-2.5">
                              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                <span className="w-6 h-6 rounded-lg bg-[#5d5bf6]/10 text-[#5d5bf6] font-bold text-xs flex items-center justify-center font-mono">
                                  C{chapIdx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={chapter.name}
                                  placeholder="Chapter Title (e.g. Chapter 01: Core Lecture Series)"
                                  onChange={(e) => handleUpdateChapter(secIdx, chapIdx, e.target.value)}
                                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-[#5d5bf6] shadow-2xs transition-all"
                                />
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700 font-mono">
                                  {lessons.length} Classes
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteChapter(secIdx, chapIdx)}
                                className="text-slate-400 hover:text-rose-600 text-xs font-bold flex items-center gap-1 bg-transparent border-none cursor-pointer transition-colors p-1"
                                title="Delete Chapter"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Delete</span>
                              </button>
                            </div>

                            {/* Clean Divider-separated Lessons Table */}
                            {lessons.length === 0 ? (
                              <div className="p-4 rounded-xl bg-white border border-dashed border-slate-200 text-center text-xs text-slate-400">
                                No classes in this chapter yet. Use the quick add bar below.
                              </div>
                            ) : (
                              <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden shadow-2xs">
                                {lessons.map((lesson, lesIdx) => {
                                  const isObj = typeof lesson === 'object' && lesson !== null;
                                  const title = isObj ? lesson.title : lesson;
                                  const duration = isObj ? (lesson.duration || '45 min') : '45 min';
                                  const videoUrl = isObj ? (lesson.videoUrl || '') : '';
                                  const pdfUrl = isObj ? (lesson.pdfUrl || '') : '';
                                  const isFree = isObj ? Boolean(lesson.isFree) : false;
                                  const hasVideo = Boolean(videoUrl && videoUrl.trim());
                                  const hasPdf = Boolean(pdfUrl && pdfUrl.trim());
                                  const quiz = isObj ? (lesson.quiz || lesson.exam) : null;
                                  const hasQuiz = Boolean((quiz && quiz.questions?.length > 0) || (isObj && lesson.examId));
                                  const questionCount = quiz?.questions?.length || 0;

                                  return (
                                    <div 
                                      key={lesIdx}
                                      className="px-3.5 py-2.5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                                    >
                                      {/* Left: Sequence & Class Title */}
                                      <div className="flex items-center gap-2.5 flex-1 min-w-[220px]">
                                        <span className="text-slate-300 font-mono select-none text-xs">⠿</span>
                                        <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                                          {lesIdx + 1 < 10 ? `0${lesIdx + 1}` : lesIdx + 1}
                                        </span>
                                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                          <Play className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                          <input
                                            type="text"
                                            value={title}
                                            placeholder="Class Title"
                                            onChange={(e) => handleUpdateLesson(secIdx, chapIdx, lesIdx, 'title', e.target.value)}
                                            className="w-full bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-200 focus:border-[#5d5bf6] rounded-lg px-2 py-1 text-xs font-bold text-slate-900 outline-none transition-all truncate"
                                          />
                                        </div>
                                      </div>

                                      {/* Middle: Subtle Micro-Badges */}
                                      <div className="flex items-center gap-1.5 flex-wrap pl-8 sm:pl-0">
                                        {/* Video Badge */}
                                        <button
                                          type="button"
                                          onClick={() => handleOpenEditClassWizard(secIdx, chapIdx, lesIdx, lesson, 2)}
                                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border cursor-pointer transition-all ${
                                            hasVideo
                                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                              : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-emerald-300'
                                          }`}
                                          title="Click to edit Video URL"
                                        >
                                          <Play className="w-2.5 h-2.5" />
                                          <span>{hasVideo ? 'Video' : 'No Video'}</span>
                                        </button>

                                        {/* PDF Badge */}
                                        <button
                                          type="button"
                                          onClick={() => handleOpenEditClassWizard(secIdx, chapIdx, lesIdx, lesson, 3)}
                                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border cursor-pointer transition-all ${
                                            hasPdf
                                              ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                              : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-blue-300'
                                          }`}
                                          title="Click to edit PDF Notes"
                                        >
                                          <FileText className="w-2.5 h-2.5" />
                                          <span>{hasPdf ? 'Notes' : 'No PDF'}</span>
                                        </button>

                                        {/* Quiz Badge */}
                                        <button
                                          type="button"
                                          onClick={() => handleOpenQuizEditor(secIdx, chapIdx, lesIdx, lesson)}
                                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border cursor-pointer transition-all ${
                                            hasQuiz
                                              ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                                              : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-purple-300'
                                          }`}
                                          title="Click to edit Quiz"
                                        >
                                          <Zap className="w-2.5 h-2.5 text-purple-600" />
                                          <span>{hasQuiz ? (questionCount > 0 ? `Quiz (${questionCount})` : 'Exam Linked') : '+ Quiz'}</span>
                                        </button>

                                        {/* Duration */}
                                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                          {duration}
                                        </span>

                                        {/* Access */}
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateLesson(secIdx, chapIdx, lesIdx, 'isFree', !isFree)}
                                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-colors border-none ${
                                            isFree ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                          }`}
                                          title="Toggle Free Preview"
                                        >
                                          {isFree ? 'Free Preview' : 'Locked'}
                                        </button>
                                      </div>

                                      {/* Right: Actions */}
                                      <div className="flex items-center gap-1.5 shrink-0 justify-end pl-8 sm:pl-0">
                                        <button
                                          type="button"
                                          onClick={() => handleOpenEditClassWizard(secIdx, chapIdx, lesIdx, lesson, 1)}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-[#5d5bf6] text-[#5d5bf6] hover:text-white font-bold text-xs border border-indigo-200/80 hover:border-transparent transition-all cursor-pointer shadow-2xs active:scale-95"
                                          title="Edit Class details"
                                        >
                                          <Edit3 className="w-3 h-3" />
                                          <span>Edit</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => handleDeleteLesson(secIdx, chapIdx, lesIdx)}
                                          className="w-7 h-7 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer border-none transition-colors"
                                          title="Delete Class"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Clean Quick Add & Wizard Row (Replaces the ugly 5-input box!) */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                              <div className="flex items-center gap-2 flex-1 max-w-lg">
                                <div className="relative flex-1">
                                  <Plus className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                  <input
                                    type="text"
                                    placeholder="Quick add class title (press Enter ↵)..."
                                    value={draft.title || ''}
                                    onChange={(e) => setNewLessonDrafts(prev => ({
                                      ...prev,
                                      [draftKey]: { ...draft, title: e.target.value }
                                    }))}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddLesson(secIdx, chapIdx);
                                      }
                                    }}
                                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#5d5bf6] shadow-2xs transition-all"
                                  />
                                </div>
                                {draft.title?.trim() && (
                                  <button
                                    type="button"
                                    onClick={() => handleAddLesson(secIdx, chapIdx)}
                                    className="px-3.5 py-2 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold border-none cursor-pointer transition-all shrink-0 shadow-2xs active:scale-95"
                                  >
                                    Add Class
                                  </button>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleOpenAddClassWizard(secIdx, chapIdx, 1)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-[#5d5bf6] hover:to-purple-600 text-[#5d5bf6] hover:text-white text-xs font-bold border border-indigo-200/80 hover:border-transparent transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>+ Add with 4-Step Wizard</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {/* Add Chapter to Module Button */}
                      <button
                        type="button"
                        onClick={() => handleAddChapter(secIdx)}
                        className="w-full py-2.5 rounded-xl border border-dashed border-slate-200 hover:border-slate-300 bg-slate-50/70 hover:bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 text-slate-500" />
                        <span>+ Add Chapter to this Module</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Bottom Add Module Button */}
            <button
              type="button"
              onClick={handleAddSection}
              className="w-full py-3.5 rounded-2xl border border-dashed border-slate-300 hover:border-[#5d5bf6] bg-white hover:bg-[#5d5bf6]/5 text-slate-600 hover:text-[#5d5bf6] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New Course Module</span>
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: BASIC INFO & PRICING */}
        {/* ========================================================= */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6">
              
              {/* Quick Jump Banner to Classes, Videos, PDFs & Quizzes */}
              <div className="bg-gradient-to-r from-[#5d5bf6]/10 via-purple-500/10 to-indigo-500/5 border border-[#5d5bf6]/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-[#5d5bf6] text-white flex items-center justify-center font-bold shadow-md shadow-[#5d5bf6]/20 shrink-0">
                    <Play className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <span>Manage Course Classes, Videos, PDFs & Quizzes</span>
                      <span className="px-2 py-0.5 rounded-md bg-[#5d5bf6]/15 text-[#5d5bf6] text-[10px] font-black">{totalLessons} Classes Active</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Looking to add class videos, lecture sheet PDFs, or MCQ quizzes? Switch to the Classes & Lectures tab.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('curriculum')}
                  className="px-5 py-2.5 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold border-none cursor-pointer transition-all shadow-xs flex items-center justify-center gap-2 shrink-0 active:scale-95"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Go to Classes & Lectures →</span>
                </button>
              </div>

              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-extrabold text-slate-900">Course Metadata & Pricing Structure</h3>
                <p className="text-xs text-slate-400 font-medium">Update the primary title, category classification, enrollment pricing, and cover visuals.</p>
              </div>

              {/* Course Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Course Full Title *</label>
                <input 
                  type="text"
                  required
                  value={course.title || ''}
                  onChange={(e) => handleUpdateField('title', e.target.value)}
                  placeholder="e.g. ৩০ দিনে Master English শেষ করার মিশন"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] transition-all"
                />
              </div>

              {/* Category, Bundle Settings & Active Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Category *</label>
                  <select
                    value={course.category || ''}
                    onChange={(e) => handleUpdateField('category', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] transition-all cursor-pointer"
                  >
                    {categories.filter(c => !isAllCat(c)).map((cat, cIdx) => (
                      <option key={cIdx} value={cat}>{cat}</option>
                    ))}
                    {course.category && !categories.includes(course.category) && (
                      <option value={course.category}>{course.category}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Bundle Program</label>
                  <label className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer text-xs font-bold text-slate-700">
                    <input 
                      type="checkbox"
                      checked={Boolean(course.isBundle)}
                      onChange={(e) => handleUpdateField('isBundle', e.target.checked)}
                      className="cursor-pointer"
                    />
                    <span>Mega Bundle Badge</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Catalog Visibility Status</label>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={course.isActive !== false}
                    onClick={() => {
                      const nextActive = course.isActive === false ? true : false;
                      handleUpdateField('isActive', nextActive);
                      if (triggerToast) {
                        triggerToast(nextActive ? `🟢 "${course.title}" Activated` : `⚪ "${course.title}" Deactivated`);
                      }
                    }}
                    className="w-full flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer text-xs font-bold transition-all hover:bg-slate-100"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${course.isActive !== false ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      <span className={course.isActive !== false ? 'text-emerald-700' : 'text-slate-500'}>
                        {course.isActive !== false ? 'Active (Visible on Site)' : 'Inactive (Hidden from Site)'}
                      </span>
                    </div>
                    <span className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                      course.isActive !== false ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}>
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                          course.isActive !== false ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </span>
                  </button>
                </div>
              </div>

              {/* Pricing Economics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Sale / Discount Price (৳) *</label>
                  <input 
                    type="number"
                    value={course.salePrice ?? 0}
                    onChange={(e) => handleUpdateField('salePrice', Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-black text-emerald-600 outline-none focus:bg-white focus:border-emerald-500 transition-all"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Enter <code className="font-mono font-bold text-slate-600">0</code> to offer this course completely Free of charge.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Regular / Original Price (৳)</label>
                  <input 
                    type="number"
                    value={course.regularPrice ?? 0}
                    onChange={(e) => handleUpdateField('regularPrice', Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-500 line-through outline-none focus:bg-white focus:border-[#5d5bf6] transition-all"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Used to calculate strikethrough discount badges on student checkout.
                  </span>
                </div>
              </div>

              {/* Cover Image */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-2">Course Cover Image</label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-48 aspect-video rounded-2xl overflow-hidden bg-slate-100 ring-1 ring-slate-200 shrink-0">
                    <img 
                      src={course.image} 
                      alt={course.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-2 flex-1">
                    <button
                      type="button"
                      onClick={() => openGalleryModal(course.image, `Select Cover for ${course.title}`, 'Courses', (newUrl) => {
                        handleUpdateField('image', newUrl);
                      })}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors border border-slate-200"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span>Choose from Media Gallery</span>
                    </button>
                    
                    <div className="text-[11px] text-slate-400">
                      Or paste direct image URL below:
                    </div>
                    <input 
                      type="text"
                      value={course.image || ''}
                      onChange={(e) => handleUpdateField('image', e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-600 outline-none focus:bg-white focus:border-[#5d5bf6]"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: LANDING PAGE & EXTRA DETAILS */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6">
              
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-extrabold text-slate-900">Landing Page Copy & Student Features</h3>
                <p className="text-xs text-slate-400 font-medium">Configure marketing copy, description text, support contacts, and key bullet points.</p>
              </div>

              {/* Tagline & Total Classes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Hero Tagline</label>
                  <input
                    type="text"
                    value={course.tagline || ''}
                    placeholder="e.g. Master Academic to Medical Admission in One Comprehensive Course!"
                    onChange={(e) => handleUpdateField('tagline', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Total Classes Subtitle</label>
                  <input
                    type="text"
                    value={course.totalClasses || ''}
                    placeholder="e.g. 45 Live Lectures + 10 Exams"
                    onChange={(e) => handleUpdateField('totalClasses', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] transition-all"
                  />
                </div>
              </div>

              {/* Support Phone & Preview Video */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Support Helpline / WhatsApp Contact</label>
                  <input
                    type="text"
                    value={course.supportPhone || '01353828863'}
                    placeholder="01353828863"
                    onChange={(e) => handleUpdateField('supportPhone', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Course Preview Video (YouTube URL / ID)</label>
                  <input
                    type="text"
                    value={course.previewVideoUrl || ''}
                    placeholder="https://www.youtube.com/watch?v=..."
                    onChange={(e) => handleUpdateField('previewVideoUrl', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] transition-all"
                  />
                </div>
              </div>

              {/* Detailed Description */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">About Course (Detailed Student Overview)</label>
                <textarea
                  rows={6}
                  value={course.aboutText || ''}
                  placeholder="Comprehensive overview of course objectives, curriculum breakdown, target exam outcomes..."
                  onChange={(e) => handleUpdateField('aboutText', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-800 leading-relaxed outline-none focus:bg-white focus:border-[#5d5bf6] transition-all"
                ></textarea>
              </div>

              {/* Course Features Bullets Editor */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block">
                  Course Feature Highlights (What's included in enrollment)
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(course.features || []).map((feat, fIdx) => (
                    <div 
                      key={fIdx}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-800"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-[#5d5bf6]/10 text-[#5d5bf6] flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" />
                        </span>
                        <span className="truncate">{typeof feat === 'object' ? (feat?.text || feat?.title || '') : String(feat)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(fIdx)}
                        className="text-slate-400 hover:text-rose-600 border-none bg-transparent cursor-pointer p-1 transition-colors"
                        title="Remove Feature"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Feature input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Enter new feature (e.g. Chapter-wise revision notes & formula book)..."
                    value={newFeatureInput}
                    onChange={(e) => setNewFeatureInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFeature(); } }}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-4 py-2 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold border-none cursor-pointer transition-colors shadow-2xs"
                  >
                    + Add Feature
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* ========================================================= */}
      {/* 5. CLASS PRACTICE QUIZ & EXAM BUILDER MODAL */}
      {/* ========================================================= */}
      {quizModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-inner shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    Class Quiz & Exam Builder
                  </h3>
                  <p className="text-xs text-slate-500 font-medium truncate max-w-md">
                    Lesson: {quizModal.lessonTitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setQuizModal(prev => ({ ...prev, isOpen: false }))}
                className="w-8 h-8 rounded-xl bg-slate-200/60 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Settings Bar */}
            <div className="p-4 sm:px-6 bg-purple-50/40 border-b border-purple-100/60 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block mb-1">
                  Quiz Title
                </label>
                <input
                  type="text"
                  value={quizModal.quiz?.title || ''}
                  onChange={(e) => setQuizModal(prev => ({
                    ...prev,
                    quiz: { ...prev.quiz, title: e.target.value }
                  }))}
                  placeholder="Practice Quiz Title"
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block mb-1">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={quizModal.quiz?.durationMinutes ?? 10}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : (parseInt(e.target.value, 10) || 1);
                    setQuizModal(prev => ({
                      ...prev,
                      quiz: { ...prev.quiz, durationMinutes: val }
                    }));
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-semibold text-slate-800 outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block mb-1">
                  Total Marks
                </label>
                <input
                  type="number"
                  min="1"
                  value={quizModal.quiz?.totalMarks ?? 5}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : (parseFloat(e.target.value) || 0);
                    setQuizModal(prev => ({
                      ...prev,
                      quiz: { ...prev.quiz, totalMarks: val }
                    }));
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-semibold text-slate-800 outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block mb-1">
                  Negative Mark
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  value={quizModal.quiz?.negativeMark ?? 0.25}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : (parseFloat(e.target.value) || 0);
                    setQuizModal(prev => ({
                      ...prev,
                      quiz: { ...prev.quiz, negativeMark: val }
                    }));
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-semibold text-slate-800 outline-none focus:border-purple-600"
                />
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="px-4 sm:px-6 pt-3 flex items-center gap-2 border-b border-slate-100 shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setQuizModal(prev => ({ ...prev, activeTab: 'builder' }))}
                className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  quizModal.activeTab === 'builder'
                    ? 'border-purple-600 text-purple-700 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Questions Builder & Review ({quizModal.quiz?.questions?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setQuizModal(prev => ({ ...prev, activeTab: 'csv' }))}
                className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  quizModal.activeTab === 'csv'
                    ? 'border-emerald-600 text-emerald-700 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Upload CSV File (CSV Import)</span>
              </button>

              <button
                type="button"
                onClick={() => setQuizModal(prev => ({ ...prev, activeTab: 'bulk' }))}
                className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  quizModal.activeTab === 'bulk'
                    ? 'border-purple-600 text-purple-700 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Bulk Text Import</span>
              </button>

              <button
                type="button"
                onClick={() => setQuizModal(prev => ({ ...prev, activeTab: 'link_exam' }))}
                className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  quizModal.activeTab === 'link_exam'
                    ? 'border-purple-600 text-purple-700 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Link Exam Batch ID</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              
              {/* TAB 1: QUESTIONS BUILDER / VERIFICATION VIEW */}
              {quizModal.activeTab === 'builder' && (
                <div className="space-y-4">
                  
                  {/* Action Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs font-black text-slate-800 px-3 py-1 rounded-xl bg-purple-100 text-purple-800 border border-purple-200">
                        {quizModal.quiz?.questions?.length || 0} Questions
                      </span>
                      {quizModal.quiz?.questions?.length > 0 && (
                        <div className="relative">
                          <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Filter questions..."
                            value={questionFilter}
                            onChange={(e) => setQuestionFilter(e.target.value)}
                            className="w-40 sm:w-56 bg-white border border-slate-200 rounded-xl pl-8 pr-2.5 py-1 text-xs text-slate-700 outline-none focus:border-purple-600"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Hidden Quick CSV File Input */}
                      <input 
                        ref={quickCsvInputRef}
                        type="file"
                        accept=".csv,text/csv"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleProcessCSVFile(file, 'append');
                          e.target.value = '';
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => quickCsvInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1.5 border border-emerald-200 cursor-pointer transition-all shadow-2xs"
                        title="Upload questions directly from CSV"
                      >
                        <Upload className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Upload CSV</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadSampleCSV}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-200 cursor-pointer transition-all"
                        title="Download sample CSV template"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                        <span>Sample CSV</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleAddQuestionToQuiz}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 border-none cursor-pointer transition-all shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Add Question</span>
                      </button>

                      {quizModal.quiz?.questions?.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearAllQuestions}
                          className="p-1.5 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 cursor-pointer transition-all"
                          title="Clear all questions"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {(!quizModal.quiz?.questions || quizModal.quiz.questions.length === 0) ? (
                    <div className="p-10 rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-4 bg-slate-50/50">
                      <div className="w-14 h-14 rounded-3xl bg-purple-100/80 text-purple-600 flex items-center justify-center mx-auto shadow-inner">
                        <CheckSquare className="w-7 h-7" />
                      </div>
                      <div className="max-w-md mx-auto">
                        <h4 className="text-base font-extrabold text-slate-800">No Questions Added Yet</h4>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          You can upload questions easily using a CSV spreadsheet, write questions manually one-by-one, or paste whole question text in bulk.
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setQuizModal(prev => ({ ...prev, activeTab: 'csv' }))}
                          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold border-none cursor-pointer shadow-xs transition-all flex items-center gap-2"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                          <span>Upload Questions via CSV</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleAddQuestionToQuiz}
                          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold border-none cursor-pointer shadow-xs transition-all flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ Create First Question Manually</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadSampleCSV}
                          className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 cursor-pointer transition-all flex items-center gap-2"
                        >
                          <Download className="w-4 h-4 text-slate-500" />
                          <span>Download Sample CSV</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {quizModal.quiz.questions
                        .map((q, qIdx) => ({ ...q, originalIndex: qIdx }))
                        .filter(q => {
                          if (!questionFilter.trim()) return true;
                          const f = questionFilter.toLowerCase();
                          return (
                            (q.question || '').toLowerCase().includes(f) ||
                            (q.options || []).some(opt => (opt || '').toLowerCase().includes(f)) ||
                            (q.explanation || '').toLowerCase().includes(f)
                          );
                        })
                        .map((q) => {
                          const qIdx = q.originalIndex;
                          const optLabels = ['A', 'B', 'C', 'D'];
                          return (
                            <div
                              key={q.id || qIdx}
                              className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-2xs hover:border-slate-300 transition-all"
                            >
                              {/* Header: Question Number & Actions */}
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                  <span className="w-7 h-7 rounded-lg bg-purple-600 text-white text-xs font-mono font-black flex items-center justify-center shrink-0 shadow-2xs">
                                    {qIdx + 1}
                                  </span>
                                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Question {qIdx + 1}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1">
                                  {/* Move Up / Down */}
                                  <button
                                    type="button"
                                    onClick={() => handleMoveQuestion(qIdx, 'up')}
                                    disabled={qIdx === 0}
                                    className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 flex items-center justify-center cursor-pointer border-none transition-colors"
                                    title="Move Question Up"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveQuestion(qIdx, 'down')}
                                    disabled={qIdx === quizModal.quiz.questions.length - 1}
                                    className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 flex items-center justify-center cursor-pointer border-none transition-colors"
                                    title="Move Question Down"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Duplicate */}
                                  <button
                                    type="button"
                                    onClick={() => handleDuplicateQuestion(qIdx)}
                                    className="w-7 h-7 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 flex items-center justify-center cursor-pointer border-none transition-colors"
                                    title="Duplicate Question"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Delete */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = quizModal.quiz.questions.filter((_, idx) => idx !== qIdx);
                                      setQuizModal(prev => ({
                                        ...prev,
                                        quiz: { ...prev.quiz, questions: updated, totalMarks: updated.length }
                                      }));
                                    }}
                                    className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer border-none transition-colors"
                                    title="Delete Question"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Question Input */}
                              <div>
                                <textarea
                                  rows={2}
                                  value={q.question || ''}
                                  placeholder={`Question #${qIdx + 1} text...`}
                                  onChange={(e) => {
                                    const updated = [...quizModal.quiz.questions];
                                    updated[qIdx] = { ...updated[qIdx], question: e.target.value };
                                    setQuizModal(prev => ({
                                      ...prev,
                                      quiz: { ...prev.quiz, questions: updated }
                                    }));
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-purple-600 transition-all leading-relaxed"
                                />
                              </div>

                              {/* 4 Options Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {[0, 1, 2, 3].map((optIdx) => {
                                  const qCorrect = q.correctAnswer !== undefined ? Number(q.correctAnswer) : (q.correct_index !== undefined ? Number(q.correct_index) : 0);
                                  const isCorrect = qCorrect === optIdx;
                                  return (
                                    <div
                                      key={optIdx}
                                      onClick={() => {
                                        const updated = [...quizModal.quiz.questions];
                                        updated[qIdx] = { ...updated[qIdx], correctAnswer: optIdx, correct_index: optIdx };
                                        setQuizModal(prev => ({
                                          ...prev,
                                          quiz: { ...prev.quiz, questions: updated }
                                        }));
                                      }}
                                      className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all cursor-pointer ${
                                        isCorrect 
                                          ? 'border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500/30' 
                                          : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/60'
                                      }`}
                                    >
                                      <label
                                        className="flex items-center gap-1.5 cursor-pointer select-none shrink-0"
                                        title="Click to set as correct answer"
                                      >
                                        <input
                                          type="radio"
                                          name={`correct-${qIdx}`}
                                          checked={isCorrect}
                                          onChange={() => {
                                            const updated = [...quizModal.quiz.questions];
                                            updated[qIdx] = { ...updated[qIdx], correctAnswer: optIdx, correct_index: optIdx };
                                            setQuizModal(prev => ({
                                              ...prev,
                                              quiz: { ...prev.quiz, questions: updated }
                                            }));
                                          }}
                                          className="accent-emerald-600 cursor-pointer w-4 h-4"
                                        />
                                        <span className={`text-[11px] font-black px-2 py-0.5 rounded font-mono ${
                                          isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                                        }`}>
                                          {optLabels[optIdx]}
                                        </span>
                                      </label>

                                      <input
                                        type="text"
                                        value={q.options?.[optIdx] || ''}
                                        placeholder={`Option ${optLabels[optIdx]}`}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                          const updated = [...quizModal.quiz.questions];
                                          const newOpts = [...(updated[qIdx].options || ['', '', '', ''])];
                                          newOpts[optIdx] = e.target.value;
                                          updated[qIdx] = { ...updated[qIdx], options: newOpts };
                                          setQuizModal(prev => ({
                                            ...prev,
                                            quiz: { ...prev.quiz, questions: updated }
                                          }));
                                        }}
                                        className="flex-1 bg-transparent border-0 text-xs font-medium text-slate-800 outline-none"
                                      />

                                      {isCorrect && (
                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                                          ✓ Correct
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Explanation field */}
                              <div className="pt-1">
                                <input
                                  type="text"
                                  value={q.explanation || ''}
                                  placeholder="Answer explanation / reference note (Optional)..."
                                  onChange={(e) => {
                                    const updated = [...quizModal.quiz.questions];
                                    updated[qIdx] = { ...updated[qIdx], explanation: e.target.value };
                                    setQuizModal(prev => ({
                                      ...prev,
                                      quiz: { ...prev.quiz, questions: updated }
                                    }));
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600 outline-none focus:bg-white focus:border-purple-600 transition-all placeholder:text-slate-400"
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: DEDICATED CSV FILE IMPORT */}
              {quizModal.activeTab === 'csv' && (
                <div className="space-y-5 max-w-3xl mx-auto">
                  
                  {/* CSV File Upload Dropzone */}
                  <div className="bg-white rounded-3xl border-2 border-dashed border-emerald-300 p-8 text-center space-y-4 hover:border-emerald-500 transition-colors">
                    <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                      <FileSpreadsheet className="w-8 h-8" />
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="text-base font-extrabold text-slate-900">
                        Upload Quiz Questions CSV File
                      </h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        Import bulk multiple-choice questions easily. Supports Microsoft Excel (.csv) and Google Sheets exported CSV files.
                      </p>
                    </div>

                    <input
                      ref={csvFileInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleSelectCSVFileForPreview(file);
                        e.target.value = '';
                      }}
                    />

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => csvFileInputRef.current?.click()}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold border-none cursor-pointer transition-all shadow-sm flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Choose CSV File from Computer</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadSampleCSV}
                        className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 cursor-pointer transition-all flex items-center gap-2"
                      >
                        <Download className="w-4 h-4 text-slate-500" />
                        <span>Download Sample CSV Template</span>
                      </button>
                    </div>

                    {csvFileObj && (
                      <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-left flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-emerald-950">{csvFileObj.name}</p>
                            <p className="text-[11px] text-emerald-700">
                              {(csvFileObj.size / 1024).toFixed(1)} KB · Found {csvParsedPreview.length} questions
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => { setCsvFileObj(null); setCsvParsedPreview([]); }}
                          className="text-emerald-700 hover:text-rose-600 p-1 border-none bg-transparent cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Import Mode & Confirmation */}
                  {csvFileObj && csvParsedPreview.length > 0 && (
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs font-bold text-slate-700">How should these questions be added?</span>
                        <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="importMode"
                              checked={csvImportMode === 'append'}
                              onChange={() => setCsvImportMode('append')}
                              className="accent-emerald-600"
                            />
                            <span>Append to existing ({quizModal.quiz?.questions?.length || 0})</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="importMode"
                              checked={csvImportMode === 'replace'}
                              onChange={() => setCsvImportMode('replace')}
                              className="accent-emerald-600"
                            />
                            <span>Replace all existing</span>
                          </label>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleProcessCSVFile(csvFileObj, csvImportMode)}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold border-none cursor-pointer transition-all shadow-xs flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>Confirm & Import {csvParsedPreview.length} Questions</span>
                      </button>
                    </div>
                  )}

                  {/* CSV Column Format Guide */}
                  <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-purple-600" />
                      <h5 className="text-xs font-extrabold text-slate-800">CSV Column Format Reference</h5>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Your CSV spreadsheet must include the following 7 columns in order (or as column headers):
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px] text-left border-collapse bg-white rounded-xl overflow-hidden border border-slate-200">
                        <thead className="bg-slate-100 text-slate-700 font-bold">
                          <tr>
                            <th className="p-2 border-b">1. Question</th>
                            <th className="p-2 border-b">2. Option A</th>
                            <th className="p-2 border-b">3. Option B</th>
                            <th className="p-2 border-b">4. Option C</th>
                            <th className="p-2 border-b">5. Option D</th>
                            <th className="p-2 border-b">6. Correct Answer</th>
                            <th className="p-2 border-b">7. Explanation</th>
                          </tr>
                        </thead>
                        <tbody className="text-slate-600 font-mono text-[10px]">
                          <tr>
                            <td className="p-2 border-b">What is an Abstract Noun?</td>
                            <td className="p-2 border-b">Honesty</td>
                            <td className="p-2 border-b">Water</td>
                            <td className="p-2 border-b">Army</td>
                            <td className="p-2 border-b">Boy</td>
                            <td className="p-2 border-b font-bold text-emerald-600">A</td>
                            <td className="p-2 border-b">Quality or state of mind</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: BULK IMPORT */}
              {quizModal.activeTab === 'bulk' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200/80 text-xs text-purple-900 leading-relaxed">
                    <span className="font-extrabold block mb-1">Standard Format Guide:</span>
                    Paste questions with options (A, B, C, D) and answer (Ans: A/B/C/D). The intelligent parser will automatically split and format them into MCQs!
                  </div>

                  <textarea
                    rows={12}
                    value={quizModal.bulkText}
                    onChange={(e) => setQuizModal(prev => ({ ...prev, bulkText: e.target.value }))}
                    placeholder={`1. What is an Abstract Noun?
A) Honesty
B) Boy
C) Army
D) River
Ans: A
Explanation: Honesty is an abstract state or quality.

2. What is 'Flock' an example of?
A) Proper Noun
B) Collective Noun
C) Material Noun
D) Common Noun
Ans: B
Explanation: Flock refers to a group of birds or sheep.`}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-mono text-slate-800 outline-none focus:bg-white focus:border-purple-600 transition-all"
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleBulkImportQuestions}
                      disabled={!quizModal.bulkText?.trim()}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-xs font-bold border-none cursor-pointer transition-all shadow-xs"
                    >
                      Parse & Import Questions
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: LINK EXAM BATCH ID */}
              {quizModal.activeTab === 'link_exam' && (
                <div className="space-y-4 max-w-xl">
                  <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                    If you already have a full exam in the Exam Batches (e.g. Sure Shot Carnival, English Master, or Medical question bank), you can simply paste its Exam ID here. Students will take that exact test!
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Existing Exam ID
                    </label>
                    <input
                      type="text"
                      value={quizModal.quiz?.examId || ''}
                      onChange={(e) => setQuizModal(prev => ({
                        ...prev,
                        quiz: { ...prev.quiz, examId: e.target.value.trim() }
                      }))}
                      placeholder="e.g. sureshot-1 or english_master-5"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 outline-none focus:bg-white focus:border-purple-600"
                    />
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={handleRemoveQuizModal}
                className="px-4 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold border border-rose-200 cursor-pointer transition-colors"
              >
                Remove Quiz
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuizModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 cursor-pointer transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveQuizModal}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold border-none cursor-pointer transition-all shadow-xs"
                >
                  Save Quiz & Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4-STEP CLASS INTEGRATION WIZARD MODAL */}
      {/* ========================================================= */}
      {classWizardModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-purple-50/20 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5d5bf6] to-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  {classWizardModal.mode === 'add' ? '🚀' : '✏️'}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span>{classWizardModal.mode === 'add' ? 'Add New Class (4-Step Integration)' : 'Edit Class (4-Step Integration)'}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#5d5bf6]/10 text-[#5d5bf6]">
                      Step {classWizardModal.activeStep} of 4
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Follow the 4 steps: Name & Duration → Video Link → PDF Notes → Practice Quiz.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setClassWizardModal(prev => ({ ...prev, isOpen: false }))}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center border-none cursor-pointer transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper Tabs Bar */}
            <div className="px-4 sm:px-6 pt-3 pb-2 bg-slate-50/60 border-b border-slate-100 shrink-0">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { step: 1, label: 'Class Info', isDone: Boolean(classWizardModal.title.trim()), icon: '1' },
                  { step: 2, label: 'Video URL', isDone: Boolean(classWizardModal.videoUrl.trim()), icon: '2' },
                  { step: 3, label: 'PDF Notes', isDone: Boolean(classWizardModal.pdfUrl.trim()), icon: '3' },
                  { step: 4, label: 'Quiz & Exam', isDone: Boolean(classWizardModal.hasQuiz && (classWizardModal.questions.length > 0 || classWizardModal.examId)), icon: '4' },
                ].map(({ step, label, isDone, icon }) => {
                  const isActive = classWizardModal.activeStep === step;
                  return (
                    <button
                      key={step}
                      type="button"
                      onClick={() => setClassWizardModal(prev => ({ ...prev, activeStep: step }))}
                      className={`flex items-center gap-2 p-2 rounded-xl text-left border cursor-pointer transition-all ${
                        isActive
                          ? 'bg-white border-[#5d5bf6] shadow-xs'
                          : 'bg-white/50 border-slate-200/80 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full text-[10px] font-mono font-bold flex items-center justify-center shrink-0 ${
                        isActive 
                          ? 'bg-[#5d5bf6] text-white shadow-2xs' 
                          : isDone 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-slate-200 text-slate-600'
                      }`}>
                        {isDone && !isActive ? '✓' : icon}
                      </span>
                      <div className="min-w-0 flex-1 hidden sm:block">
                        <span className={`block text-xs font-bold truncate ${isActive ? 'text-[#5d5bf6]' : 'text-slate-700'}`}>
                          {label}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          {isDone ? 'Completed' : 'Optional'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stepper Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              
              {/* ---------------------------------------------------- */}
              {/* STEP 1: CLASS NAME & BASICS */}
              {/* ---------------------------------------------------- */}
              {classWizardModal.activeStep === 1 && (
                <div className="space-y-4">
                  {/* Chapter Selector */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Assigned Chapter / Module
                    </label>
                    <select
                      value={`${classWizardModal.secIdx}-${classWizardModal.chapIdx}`}
                      onChange={(e) => {
                        const [s, c] = e.target.value.split('-').map(Number);
                        setClassWizardModal(prev => ({ ...prev, secIdx: s, chapIdx: c }));
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] transition-all"
                    >
                      {curriculum.map((sec, sIdx) => 
                        (sec.chapters || []).map((ch, cIdx) => (
                          <option key={`${sIdx}-${cIdx}`} value={`${sIdx}-${cIdx}`}>
                            {sec.title} → {ch.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Class Title Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">
                        Class / Lecture Title <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] text-slate-400">Appears in student syllabus roadmap</span>
                    </div>
                    <input
                      type="text"
                      autoFocus
                      value={classWizardModal.title}
                      onChange={(e) => setClassWizardModal(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. Day 01 - Noun Classification & Common Errors"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-[#5d5bf6] transition-all"
                    />

                    {/* Quick Title Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Quick Prefix:</span>
                      {['Day 01 - ', 'Lecture 01: ', 'Grammar: ', 'Vocabulary: ', 'Exam Solve: '].map((prefix) => (
                        <button
                          key={prefix}
                          type="button"
                          onClick={() => setClassWizardModal(prev => ({ 
                            ...prev, 
                            title: prev.title.startsWith(prefix) ? prev.title : `${prefix}${prev.title}` 
                          }))}
                          className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold cursor-pointer transition-colors border-none"
                        >
                          + {prefix}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Class Duration & Free Preview */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Lecture Duration
                      </label>
                      <div className="relative">
                        <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={classWizardModal.duration}
                          onChange={(e) => setClassWizardModal(prev => ({ ...prev, duration: e.target.value }))}
                          placeholder="45 min"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] transition-all"
                        />
                      </div>
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {['20 min', '30 min', '45 min', '1 hr', '1.5 hr'].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setClassWizardModal(prev => ({ ...prev, duration: preset }))}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono cursor-pointer transition-colors border ${
                              classWizardModal.duration === preset
                                ? 'bg-indigo-50 border-indigo-300 text-[#5d5bf6] font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Student Access
                      </label>
                      <div 
                        onClick={() => setClassWizardModal(prev => ({ ...prev, isFree: !prev.isFree }))}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          classWizardModal.isFree
                            ? 'bg-emerald-50/70 border-emerald-300'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-3 h-3 rounded-full ${classWizardModal.isFree ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <div>
                            <span className="block text-xs font-bold text-slate-900">
                              {classWizardModal.isFree ? 'Free Demo Preview' : 'Locked (Paid Students Only)'}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {classWizardModal.isFree ? 'Any student can watch without purchasing' : 'Requires course enrollment'}
                            </span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          classWizardModal.isFree ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {classWizardModal.isFree ? 'Free ✓' : 'Locked'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* STEP 2: VIDEO LECTURE (DIRECT BUNNY STREAM UPLOAD OR URL) */}
              {/* ---------------------------------------------------- */}
              {classWizardModal.activeStep === 2 && (
                <div className="space-y-4">
                  {/* Hidden Video File Input */}
                  <input
                    ref={videoFileInputRef}
                    type="file"
                    accept="video/mp4,video/x-m4v,video/quicktime,video/webm,video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleDirectVideoUpload(file);
                      e.target.value = '';
                    }}
                  />

                  {/* Mode Selector Tabs */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setVideoTabMode('upload')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          videoTabMode === 'upload'
                            ? 'bg-gradient-to-r from-[#5d5bf6] to-purple-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Direct Video Upload (Bunny Stream)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setVideoTabMode('url')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          videoTabMode === 'url'
                            ? 'bg-[#5d5bf6] text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Paste Video URL / YouTube</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowBunnySettingsModal(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-500 hover:text-[#5d5bf6] hover:bg-[#5d5bf6]/5 border border-slate-200 cursor-pointer transition-colors"
                      title="Configure Bunny Stream & Storage Keys"
                    >
                      <Settings className="w-3 h-3 text-slate-400" />
                      <span>Bunny Settings</span>
                      {isBunnyStreamConfigured(bunnyConfig) && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  </div>

                  {/* TAB A: DIRECT VIDEO UPLOAD */}
                  {videoTabMode === 'upload' && (
                    <div className="space-y-3">
                      {!isBunnyStreamConfigured(bunnyConfig) ? (
                        <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-center space-y-3">
                          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto font-bold">
                            ⚠️
                          </div>
                          <div className="max-w-md mx-auto">
                            <h4 className="text-xs font-black text-amber-950">Bunny Stream Credentials Required</h4>
                            <p className="text-[11px] text-amber-800/80 mt-1">
                              To upload videos directly from the admin panel, connect your Bunny.net Video Library ID and API Key.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowBunnySettingsModal(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold border-none cursor-pointer transition-colors shadow-2xs"
                          >
                            <Settings className="w-3.5 h-3.5" />
                            <span>Configure Bunny.net Now</span>
                          </button>
                        </div>
                      ) : videoUploadState.uploading ? (
                        <div className="p-6 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 text-center space-y-3">
                          <div className="w-12 h-12 rounded-2xl bg-[#5d5bf6] text-white flex items-center justify-center mx-auto shadow-md animate-pulse">
                            <Upload className="w-6 h-6 animate-bounce" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-900">Uploading Video directly to Bunny Stream...</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                              {((videoUploadState.loaded || 0) / (1024 * 1024)).toFixed(1)} MB / {((videoUploadState.total || 0) / (1024 * 1024)).toFixed(1)} MB ({videoUploadState.percent}%)
                            </p>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden max-w-md mx-auto">
                            <div 
                              className="bg-gradient-to-r from-[#5d5bf6] to-purple-600 h-2.5 rounded-full transition-all duration-200"
                              style={{ width: `${videoUploadState.percent}%` }}
                            />
                          </div>

                          <p className="text-[10px] text-slate-400">
                            Please keep this window open until upload finishes. Bunny will automatically encode adaptive qualities (1080p, 720p, 480p, 360p).
                          </p>
                        </div>
                      ) : (
                        <div className="p-6 rounded-2xl border-2 border-dashed border-indigo-200 hover:border-[#5d5bf6] bg-indigo-50/20 text-center space-y-3 transition-colors">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#5d5bf6] flex items-center justify-center mx-auto shadow-inner">
                            <Video className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-900">Upload Video File (.mp4, .mov, .mkv)</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm mx-auto">
                              Video will be uploaded directly to your Bunny Stream video library and instantly ready for playback.
                            </p>
                          </div>
                          <div className="flex items-center justify-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => videoFileInputRef.current?.click()}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#5d5bf6] to-purple-600 hover:from-[#4e4be3] hover:to-purple-700 text-white text-xs font-bold border-none cursor-pointer shadow-sm transition-all active:scale-95"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Choose Video File from Computer</span>
                            </button>
                          </div>
                          {classWizardModal.videoUrl && (
                            <div className="text-[11px] text-emerald-700 font-bold flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span className="truncate max-w-md">Active Video Stream: {classWizardModal.videoUrl}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB B: PASTE URL */}
                  {videoTabMode === 'url' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 block">
                        Video Lecture Stream URL (YouTube or Bunny Stream)
                      </label>
                      <div className="relative">
                        <Play className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          autoFocus
                          value={classWizardModal.videoUrl}
                          onChange={(e) => setClassWizardModal(prev => ({ ...prev, videoUrl: e.target.value }))}
                          placeholder="e.g. https://www.youtube.com/watch?v=... or https://iframe.mediadelivery.net/embed/..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] transition-all"
                        />
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                        <span className="font-bold text-slate-700">Supported:</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-mono">YouTube Videos & Shorts</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-mono">Bunny Stream Iframe</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-mono">Direct Video Links</span>
                      </div>
                    </div>
                  )}

                  {/* Live Player Preview Screen */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <span>Live Video Player Preview</span>
                        {classWizardModal.videoUrl ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                            🟢 Ready to Play
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px]">
                            Waiting for URL
                          </span>
                        )}
                      </span>
                      {classWizardModal.videoUrl && (
                        <span className="text-[11px] text-slate-400">Exactly what students see in player</span>
                      )}
                    </div>

                    {classWizardModal.videoUrl ? (
                      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-lg border border-slate-800">
                        <iframe
                          src={getEmbedUrl(classWizardModal.videoUrl)}
                          title="Class Video Preview"
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          referrerPolicy="strict-origin-when-cross-origin"
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-video rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-2">
                          <Play className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-white">Live Video Player Preview</p>
                        <p className="text-[11px] text-slate-400 max-w-sm mt-1">
                          Upload a video file to Bunny Stream or paste a link above. The video will render right here so you can verify that it plays smoothly before saving.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* STEP 3: LECTURE SHEET PDF (DIRECT BUNNY STORAGE OR LINK) */}
              {/* ---------------------------------------------------- */}
              {classWizardModal.activeStep === 3 && (
                <div className="space-y-4">
                  {/* Hidden PDF File Input */}
                  <input
                    ref={pdfFileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleDirectPdfUpload(file);
                      e.target.value = '';
                    }}
                  />

                  {/* Mode Selector Tabs */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPdfTabMode('upload')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          pdfTabMode === 'upload'
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Direct PDF Upload (Bunny Storage CDN)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPdfTabMode('url')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          pdfTabMode === 'url'
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Paste Google Drive / External Link</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowBunnySettingsModal(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 cursor-pointer transition-colors"
                      title="Configure Bunny Storage CDN Keys"
                    >
                      <Settings className="w-3 h-3 text-slate-400" />
                      <span>Bunny Settings</span>
                      {isBunnyStorageConfigured(bunnyConfig) && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  </div>

                  {/* TAB A: DIRECT PDF UPLOAD */}
                  {pdfTabMode === 'upload' && (
                    <div className="space-y-3">
                      {!isBunnyStorageConfigured(bunnyConfig) ? (
                        <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-center space-y-3">
                          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto font-bold">
                            ⚠️
                          </div>
                          <div className="max-w-md mx-auto">
                            <h4 className="text-xs font-black text-amber-950">Bunny Storage Credentials Required</h4>
                            <p className="text-[11px] text-amber-800/80 mt-1">
                              To upload PDF lecture sheets directly to Bunny CDN, connect your Storage Zone Name, Password, and Pull Zone domain.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowBunnySettingsModal(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold border-none cursor-pointer transition-colors shadow-2xs"
                          >
                            <Settings className="w-3.5 h-3.5" />
                            <span>Configure Bunny Storage Now</span>
                          </button>
                        </div>
                      ) : pdfUploadState.uploading ? (
                        <div className="p-6 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-center space-y-3">
                          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md animate-pulse">
                            <Upload className="w-6 h-6 animate-bounce" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-900">Uploading PDF directly to Bunny Storage CDN...</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                              {((pdfUploadState.loaded || 0) / 1024).toFixed(1)} KB / {((pdfUploadState.total || 0) / 1024).toFixed(1)} KB ({pdfUploadState.percent}%)
                            </p>
                          </div>

                          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden max-w-md mx-auto">
                            <div 
                              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2.5 rounded-full transition-all duration-200"
                              style={{ width: `${pdfUploadState.percent}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 rounded-2xl border-2 border-dashed border-blue-200 hover:border-blue-500 bg-blue-50/20 text-center space-y-3 transition-colors">
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-900">Upload PDF Lecture Sheet (.pdf)</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm mx-auto">
                              PDF will be stored on Bunny CDN with global edge delivery for ultra-fast student downloads.
                            </p>
                          </div>
                          <div className="flex items-center justify-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => pdfFileInputRef.current?.click()}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold border-none cursor-pointer shadow-sm transition-all active:scale-95"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Choose PDF Document from Computer</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB B: PASTE URL */}
                  {pdfTabMode === 'url' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 block">
                        Lecture Sheet / PDF Notes Link
                      </label>
                      <div className="relative">
                        <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          autoFocus
                          value={classWizardModal.pdfUrl}
                          onChange={(e) => setClassWizardModal(prev => ({ ...prev, pdfUrl: e.target.value }))}
                          placeholder="e.g. https://drive.google.com/file/d/1A2B3C.../view or https://example.com/sheet.pdf"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] transition-all"
                        />
                      </div>
                    </div>
                  )}

                  {classWizardModal.pdfUrl && (
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-xl bg-blue-500 text-white flex items-center justify-center text-xs font-bold">📄</span>
                        <div className="min-w-0">
                          <span className="block text-xs font-bold text-blue-900">PDF Notes Link Attached</span>
                          <span className="text-[10px] text-blue-700/80 truncate max-w-xs block font-mono">{classWizardModal.pdfUrl}</span>
                        </div>
                      </div>
                      <a
                        href={classWizardModal.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-2xs shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Test Open Link</span>
                      </a>
                    </div>
                  )}

                  {/* Helpful Guide Card */}
                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 text-xs space-y-2">
                    <div className="flex items-center gap-2 text-amber-800 font-black">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>Google Drive & PDF Notes Tips:</span>
                    </div>
                    <ul className="text-[11px] text-amber-900/80 space-y-1 list-disc pl-4 leading-relaxed">
                      <li>Make sure Google Drive sharing is set to <strong>"Anyone with the link can view"</strong> so students can open it without request access errors.</li>
                      <li>Students will see a dedicated <strong>"PDF Notes"</strong> tab right below the video player in their watch screen.</li>
                      <li>If you don't have a PDF sheet for this class yet, you can leave it blank and add it anytime later.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* STEP 4: PRACTICE QUIZ & EXAM MCQs */}
              {/* ---------------------------------------------------- */}
              {classWizardModal.activeStep === 4 && (
                <div className="space-y-4">
                  {/* Enable Quiz Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-purple-50/50 border border-purple-200/80">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center text-sm font-bold shadow-xs">
                        ⚡
                      </div>
                      <div>
                        <h5 className="text-xs font-black text-purple-900">Include Practice Quiz for this Class?</h5>
                        <p className="text-[11px] text-purple-700/80">Students can test their knowledge immediately after watching this lecture.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setClassWizardModal(prev => {
                          const nextVal = !prev.hasQuiz;
                          return {
                            ...prev,
                            hasQuiz: nextVal,
                            quizTitle: prev.quizTitle || (nextVal ? `${prev.title || 'Class'} - Quiz` : '')
                          };
                        });
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
                        classWizardModal.hasQuiz 
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm' 
                          : 'bg-white text-slate-600 border-slate-300 hover:border-purple-300'
                      }`}
                    >
                      {classWizardModal.hasQuiz ? 'Quiz Enabled ✓' : 'Click to Enable'}
                    </button>
                  </div>

                  {classWizardModal.hasQuiz ? (
                    <div className="space-y-4">
                      {/* Quiz Settings */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="text-xs font-bold text-slate-700 block mb-1">Quiz Title</label>
                          <input
                            type="text"
                            value={classWizardModal.quizTitle}
                            onChange={(e) => setClassWizardModal(prev => ({ ...prev, quizTitle: e.target.value }))}
                            placeholder="e.g. Day 01 Class Practice Quiz"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-purple-600 transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Time Limit (Min)</label>
                          <input
                            type="number"
                            min="1"
                            value={classWizardModal.durationMinutes}
                            onChange={(e) => setClassWizardModal(prev => ({ ...prev, durationMinutes: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 outline-none focus:bg-white focus:border-purple-600 transition-all"
                          />
                        </div>
                      </div>

                      {/* Question Actions Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-800">
                            Questions ({classWizardModal.questions.length})
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            · 1 mark per question
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Hidden CSV Input */}
                          <input
                            type="file"
                            ref={wizardCsvInputRef}
                            accept=".csv,text/csv"
                            onChange={handleWizardCSVUpload}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => wizardCsvInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200 cursor-pointer transition-all"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload CSV</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleDownloadSampleCSV}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 cursor-pointer transition-all"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Sample CSV</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleAddWizardQuestion}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold border-none cursor-pointer transition-all shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Add Question</span>
                          </button>
                        </div>
                      </div>

                      {/* Questions List */}
                      {classWizardModal.questions.length === 0 ? (
                        <div className="p-6 rounded-2xl bg-white border border-dashed border-slate-300 text-center space-y-2">
                          <p className="text-xs font-bold text-slate-600">No MCQ questions added yet</p>
                          <p className="text-[11px] text-slate-400">
                            Click <strong>"Upload CSV"</strong> to import questions in bulk, or <strong>"+ Add Question"</strong> to create MCQs manually.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                          {classWizardModal.questions.map((q, qIdx) => (
                            <div key={q.id || qIdx} className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2.5">
                              <div className="flex items-start justify-between gap-2">
                                <span className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                                  {qIdx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={q.question}
                                  onChange={(e) => handleUpdateWizardQuestion(qIdx, 'question', e.target.value)}
                                  placeholder={`Question #${qIdx + 1} statement...`}
                                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-purple-600"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleDeleteWizardQuestion(qIdx)}
                                  className="w-6 h-6 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center border-none cursor-pointer transition-colors"
                                  title="Delete Question"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>

                              {/* 4 Options */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-7">
                                {(q.options || ['', '', '', '']).map((opt, optIdx) => {
                                  const optLetter = String.fromCharCode(65 + optIdx);
                                  const isCorrect = q.correctAnswer === optIdx;
                                  return (
                                    <div key={optIdx} className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateWizardQuestion(qIdx, 'correctAnswer', optIdx)}
                                        className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center cursor-pointer transition-all border shrink-0 ${
                                          isCorrect
                                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-2xs'
                                            : 'bg-white text-slate-500 border-slate-300 hover:border-emerald-400'
                                        }`}
                                        title={`Mark option ${optLetter} as correct`}
                                      >
                                        {optLetter}
                                      </button>
                                      <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => handleUpdateWizardOption(qIdx, optIdx, e.target.value)}
                                        placeholder={`Option ${optLetter}`}
                                        className={`flex-1 bg-slate-50 border rounded-lg px-2 py-1 text-[11px] outline-none ${
                                          isCorrect ? 'border-emerald-300 font-bold text-slate-900 bg-emerald-50/30' : 'border-slate-200 text-slate-700'
                                        }`}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-white border border-dashed border-slate-200 text-center space-y-1.5">
                      <p className="text-xs font-bold text-slate-700">Quiz is optional</p>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                        If this class does not require a quiz, you're all set! Click <strong>"Save Class & Publish"</strong> below to complete this class.
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Stepper Footer Controls */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setClassWizardModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 cursor-pointer transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                {classWizardModal.activeStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setClassWizardModal(prev => ({ ...prev, activeStep: prev.activeStep - 1 }))}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 cursor-pointer transition-colors"
                  >
                    ← Previous Step
                  </button>
                )}

                {classWizardModal.activeStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => setClassWizardModal(prev => ({ ...prev, activeStep: prev.activeStep + 1 }))}
                    className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-[#5d5bf6] text-xs font-bold border border-indigo-200 cursor-pointer transition-colors"
                  >
                    Next Step →
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={handleSaveClassWizard}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black border-none cursor-pointer transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Class & Publish</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* BUNNY.NET STREAM & STORAGE CREDENTIALS CONFIG MODAL */}
      {/* ========================================================= */}
      {showBunnySettingsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-orange-50 via-amber-50/30 to-purple-50/20 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  🐰
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span>Bunny.net Cloud Stream & Storage Setup</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Direct video upload transcoding & PDF CDN delivery credentials
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowBunnySettingsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center border-none cursor-pointer transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

              {/* Status Summary Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                  isBunnyStreamConfigured(bunnyConfig)
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">🎬</span>
                    <div>
                      <span className="text-xs font-black block">Bunny Stream (Video)</span>
                      <span className="text-[11px] text-slate-500">
                        {isBunnyStreamConfigured(bunnyConfig) ? 'Ready for Direct Uploads' : 'Not Configured Yet'}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isBunnyStreamConfigured(bunnyConfig) ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {isBunnyStreamConfigured(bunnyConfig) ? 'Active ✓' : 'Setup Required'}
                  </span>
                </div>

                <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                  isBunnyStorageConfigured(bunnyConfig)
                    ? 'bg-blue-50/60 border-blue-200 text-blue-900'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">📄</span>
                    <div>
                      <span className="text-xs font-black block">Bunny Storage (PDF Notes)</span>
                      <span className="text-[11px] text-slate-500">
                        {isBunnyStorageConfigured(bunnyConfig) ? 'Ready for CDN Delivery' : 'Not Configured Yet'}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isBunnyStorageConfigured(bunnyConfig) ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {isBunnyStorageConfigured(bunnyConfig) ? 'Active ✓' : 'Setup Required'}
                  </span>
                </div>
              </div>

              {/* PART 1: BUNNY STREAM (VIDEOS) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-50/40 via-white to-indigo-50/30 border border-purple-100 space-y-4">
                <div className="flex items-center justify-between border-b border-purple-100/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                      1
                    </span>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      Bunny Stream (Direct Video Upload & Transcoding)
                    </h4>
                  </div>
                  <a
                    href="https://dash.bunny.net/stream"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 hover:underline"
                  >
                    <span>dash.bunny.net/stream</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Stream Video Library ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 312456"
                      value={bunnyConfig.streamLibraryId || ''}
                      onChange={(e) => setBunnyConfig(prev => ({ ...prev, streamLibraryId: e.target.value.trim() }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-purple-600 transition-all shadow-2xs"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Found in Bunny Stream → Manage Library → API → Library ID
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Stream API Key (AccessKey) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      placeholder="e.g. 7f8a9b1c-..."
                      value={bunnyConfig.streamApiKey || ''}
                      onChange={(e) => setBunnyConfig(prev => ({ ...prev, streamApiKey: e.target.value.trim() }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-purple-600 transition-all shadow-2xs"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Found in Bunny Stream → API → API Key
                    </span>
                  </div>
                </div>

                {/* Test Connection Button & Result */}
                <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleTestBunnyStream}
                    disabled={bunnyTestResults.testingStream || !bunnyConfig.streamLibraryId || !bunnyConfig.streamApiKey}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 disabled:opacity-50 text-purple-800 text-xs font-bold border-none cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    {bunnyTestResults.testingStream ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5" />
                    )}
                    <span>{bunnyTestResults.testingStream ? 'Testing Connection...' : 'Test Stream Connection'}</span>
                  </button>

                  {bunnyTestResults.stream && (
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                      bunnyTestResults.stream.success
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {bunnyTestResults.stream.message}
                    </span>
                  )}
                </div>
              </div>

              {/* PART 2: BUNNY STORAGE (PDFS & LECTURE SHEETS) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/40 via-white to-cyan-50/30 border border-blue-100 space-y-4">
                <div className="flex items-center justify-between border-b border-blue-100/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      2
                    </span>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      Bunny Storage & CDN (Direct PDF & File Upload)
                    </h4>
                  </div>
                  <a
                    href="https://dash.bunny.net/storage"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
                  >
                    <span>dash.bunny.net/storage</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Storage Zone Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. eduhunters-storage"
                      value={bunnyConfig.storageZoneName || ''}
                      onChange={(e) => setBunnyConfig(prev => ({ ...prev, storageZoneName: e.target.value.trim() }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-blue-600 transition-all shadow-2xs"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      The name of your Bunny storage zone
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Storage Password / Access Key <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      placeholder="e.g. 8a9b2c3d-..."
                      value={bunnyConfig.storagePassword || ''}
                      onChange={(e) => setBunnyConfig(prev => ({ ...prev, storagePassword: e.target.value.trim() }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-blue-600 transition-all shadow-2xs"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Found in Storage Zone → FTP & API Access → Password
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Storage Hostname
                    </label>
                    <input
                      type="text"
                      placeholder="storage.bunnycdn.com"
                      value={bunnyConfig.storageHostname || 'storage.bunnycdn.com'}
                      onChange={(e) => setBunnyConfig(prev => ({ ...prev, storageHostname: e.target.value.trim() }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 outline-none focus:border-blue-600 transition-all shadow-2xs"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Default: storage.bunnycdn.com (or region like ny.storage.bunnycdn.com)
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Connected Pull Zone (Public CDN Domain) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. eduhunters-cdn.b-cdn.net"
                      value={bunnyConfig.pullZoneHostname || ''}
                      onChange={(e) => setBunnyConfig(prev => ({ ...prev, pullZoneHostname: e.target.value.trim() }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-blue-600 transition-all shadow-2xs"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      The public CDN domain connected to this storage zone for instant PDF downloads
                    </span>
                  </div>
                </div>

                {/* Important CORS Note */}
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
                  <span className="font-bold shrink-0">⚠️ Important:</span>
                  <span>
                    In your Bunny dashboard under <strong>Storage Zone → Security / CORS</strong>, make sure <strong>"Enable CORS Headers"</strong> is toggled <strong>ON</strong> so browsers can upload directly without being blocked.
                  </span>
                </div>

                {/* Test Storage Connection Button & Result */}
                <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleTestBunnyStorage}
                    disabled={bunnyTestResults.testingStorage || !bunnyConfig.storageZoneName || !bunnyConfig.storagePassword}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-100 hover:bg-blue-200 disabled:opacity-50 text-blue-800 text-xs font-bold border-none cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    {bunnyTestResults.testingStorage ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5" />
                    )}
                    <span>{bunnyTestResults.testingStorage ? 'Testing Connection...' : 'Test Storage Connection'}</span>
                  </button>

                  {bunnyTestResults.storage && (
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                      bunnyTestResults.storage.success
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {bunnyTestResults.storage.message}
                    </span>
                  )}
                </div>
              </div>

            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowBunnySettingsModal(false)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 cursor-pointer transition-colors"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleSaveBunnySettings}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black border-none cursor-pointer transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Credentials</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
