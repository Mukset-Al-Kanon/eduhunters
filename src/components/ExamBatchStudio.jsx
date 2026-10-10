import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Settings,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Clock,
  ImageIcon,
  Check,
  X,
  Search,
  Edit2,
  FolderEdit,
  FolderPlus,
  CheckCircle2,
  HelpCircle,
  FileQuestion,
  Download,
  ListFilter,
  Eye,
  Sparkles,
  Move,
  GraduationCap,
  ChevronDown,
  ChevronRight,
  UploadCloud,
  Hash,
  Zap
} from 'lucide-react';
import {
  getMergedExamManifest,
  saveManifestOverrides,
  loadExamQuestions,
  saveCustomExam,
  parseBulkQuestionsFromText,
  updateExamDuration
} from '../utils/examBatchStorage';

export default function ExamBatchStudio({
  course,
  courseIndex: _courseIndex,
  initialTab = 'curriculum',
  onUpdateCourse,
  onBack,
  onPreview,
  openGalleryModal,
  triggerToast
}) {
  // Studio navigation tabs: 'curriculum' (Quizzes & Questions) | 'basic' | 'overview'
  const [activeTab, setActiveTab] = useState(initialTab === 'details' ? 'overview' : (initialTab || 'curriculum'));
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving'

  // Batch Key determination
  const batchKey = useMemo(() => {
    return course?.key || course?.id || course?.slug || 'sureshot';
  }, [course]);

  // Manifest state
  const [manifestData, setManifestData] = useState(null);
  const [isLoadingManifest, setIsLoadingManifest] = useState(true);

  // Filter & Search states in Mode A (Quizzes list)
  const [quizSearchQuery, setQuizSearchQuery] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');
  const [collapsedChapters, setCollapsedChapters] = useState({});

  // Mode B: Active Exam being inspected / edited
  const [activeExamMeta, setActiveExamMeta] = useState(null);
  const [activeExamData, setActiveExamData] = useState(null);
  const [isLoadingExamData, setIsLoadingExamData] = useState(false);
  const [questionSearchQuery, setQuestionSearchQuery] = useState('');
  const [activeQuestionTab, setActiveQuestionTab] = useState('all'); // 'all' | 'unanswered' | 'no-exp' | 'has-img'
  const [itemsPerPage, setItemsPerPage] = useState(50); // 25 | 50 | 100 | 'all'
  const [currentPage, setCurrentPage] = useState(1);
  const [highlightedQuestionId, setHighlightedQuestionId] = useState(null);
  const [inlineEditingQuestionId, setInlineEditingQuestionId] = useState(null);

  // Modals state
  const [showAddQuizModal, setShowAddQuizModal] = useState(false);
  const [newQuizForm, setNewQuizForm] = useState({
    title: '',
    subCategory: 'General',
    subject: 'Biology',
    durationMinutes: 40,
    totalMarks: 100,
    negativeMark: 0.25
  });

  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingSubCategory, setEditingSubCategory] = useState(null);

  const [showMoveQuizModal, setShowMoveQuizModal] = useState(null);
  const [targetSubCatForMove, setTargetSubCatForMove] = useState('');

  const [showEditQuizMetaModal, setShowEditQuizMetaModal] = useState(null);

  const [showQuestionModal, setShowQuestionModal] = useState(null); // 'add' | { mode: 'edit', question, index }
  const [questionFormData, setQuestionFormData] = useState({
    question: '',
    options: ['', '', '', ''],
    correct_index: 0,
    explanation: '',
    image: ''
  });

  // Bulk Import Modal
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');
  const [bulkParsedPreview, setBulkParsedPreview] = useState([]);

  // Per-Exam Duration Customizer Modal state
  const [durationCustomizerModal, setDurationCustomizerModal] = useState(null);
  const [tempDuration, setTempDuration] = useState(40);

  // Basic Details & Overview Form drafts
  const [newFeatureInput, setNewFeatureInput] = useState('');

  // Refs for smooth jumping
  const questionCardRefs = useRef({});
  const searchInputRef = useRef(null);

  // 1. Fetch & Merge Manifest
  useEffect(() => {
    let isMounted = true;
    async function init() {
      setIsLoadingManifest(true);
      const manifest = await getMergedExamManifest();
      if (isMounted) {
        setManifestData(manifest);
        setIsLoadingManifest(false);
      }
    }
    init();
    return () => { isMounted = false; };
  }, []);

  // Filter exams that belong to this Exam Batch
  const batchExams = useMemo(() => {
    if (!manifestData || !manifestData.exams) return [];
    return manifestData.exams.filter(exam => {
      if (exam.category === batchKey) return true;
      if (batchKey === 'sureshot' && (exam.category === 'sureshot' || exam.categoryName?.includes('শিওর শট'))) return true;
      if (batchKey === 'medical' && (exam.category === 'medical' || exam.categoryName?.includes('মেডিকেল বিগত'))) return true;
      if (batchKey === 'rtds' && (exam.category === 'rtds' || exam.categoryName?.includes('অনুশীলনী'))) return true;
      if (batchKey === 'gk_course' && (exam.category === 'gk_course' || exam.categoryName?.includes('সাধারণ জ্ঞান'))) return true;
      if (batchKey === 'english_master' && (exam.category === 'english_master' || exam.categoryName?.includes('ইংলিশ মাস্টার'))) return true;
      if (batchKey === 'medilogy' && (exam.category === 'medilogy' || exam.categoryName?.includes('মেডিলজি'))) return true;
      return false;
    });
  }, [manifestData, batchKey]);

  // Derived Subcategories list for this batch
  const subCategoriesList = useMemo(() => {
    const set = new Set();
    batchExams.forEach(e => {
      if (e.subCategory) set.add(e.subCategory.trim());
    });
    const catMeta = manifestData?.categories?.find(c => c.key === batchKey);
    if (catMeta?.subCategories) {
      catMeta.subCategories.forEach(sc => {
        if (sc.name) set.add(sc.name.trim());
      });
    }
    return Array.from(set).filter(Boolean);
  }, [batchExams, manifestData, batchKey]);

  // Derived Subjects list
  const subjectsList = useMemo(() => {
    const set = new Set();
    batchExams.forEach(e => {
      if (e.subject) set.add(e.subject.trim());
    });
    return Array.from(set).filter(Boolean);
  }, [batchExams]);

  // Filtered exams according to active search and filters
  const filteredExams = useMemo(() => {
    return batchExams.filter(exam => {
      if (selectedSubCategory !== 'all' && exam.subCategory !== selectedSubCategory) {
        return false;
      }
      if (selectedSubjectFilter !== 'all' && exam.subject !== selectedSubjectFilter) {
        return false;
      }
      if (quizSearchQuery.trim()) {
        const q = quizSearchQuery.toLowerCase().trim();
        const matchesTitle = exam.title?.toLowerCase().includes(q);
        const matchesSub = exam.subCategory?.toLowerCase().includes(q);
        const matchesSubject = exam.subject?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSub && !matchesSubject) return false;
      }
      return true;
    });
  }, [batchExams, selectedSubCategory, selectedSubjectFilter, quizSearchQuery]);

  // Group filtered exams by chapter/subcategory for clean accordion
  const groupedExamsByChapter = useMemo(() => {
    const map = new Map();
    filteredExams.forEach(exam => {
      const chapter = exam.subCategory || 'General';
      if (!map.has(chapter)) {
        map.set(chapter, []);
      }
      map.get(chapter).push(exam);
    });
    return Array.from(map.entries());
  }, [filteredExams]);

  // KPI Calculations
  const totalBatchExams = batchExams.length;
  const totalBatchQuestions = useMemo(() => {
    return batchExams.reduce((acc, e) => acc + (Number(e.totalQuestions) || 0), 0);
  }, [batchExams]);

  // Helper to notify save with animation
  const notifySave = (updatedCourse) => {
    setSaveStatus('saving');
    onUpdateCourse(updatedCourse);
    setTimeout(() => {
      setSaveStatus('saved');
    }, 350);
  };

  const handleUpdateField = (field, value) => {
    const updated = { ...course, [field]: value };
    notifySave(updated);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
      if (e.key === 'Escape') {
        if (showQuestionModal) setShowQuestionModal(null);
        else if (showBulkImportModal) setShowBulkImportModal(false);
        else if (showAddQuizModal) setShowAddQuizModal(false);
        else if (showAddCategoryModal) setShowAddCategoryModal(false);
        else if (showMoveQuizModal) setShowMoveQuizModal(null);
        else if (showEditQuizMetaModal) setShowEditQuizMetaModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    showQuestionModal,
    showBulkImportModal,
    showAddQuizModal,
    showAddCategoryModal,
    showMoveQuizModal,
    showEditQuizMetaModal
  ]);

  // ==========================================
  // EXAM / QUIZ MANAGEMENT HANDLERS
  // ==========================================

  // Open Exam for inspection/editing (Mode B)
  const handleOpenExamQuestions = async (examMeta) => {
    setActiveExamMeta(examMeta);
    setIsLoadingExamData(true);
    setCurrentPage(1);
    try {
      const fullData = await loadExamQuestions(examMeta);
      setActiveExamData(fullData);
    } catch (err) {
      console.error('Error loading questions:', err);
      triggerToast('⚠️ Could not load exam questions.');
    } finally {
      setIsLoadingExamData(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Close Mode B, return to Mode A
  const handleBackToQuizList = () => {
    setActiveExamMeta(null);
    setActiveExamData(null);
    setQuestionSearchQuery('');
    setInlineEditingQuestionId(null);
  };

  // Create new Quiz
  const handleCreateNewQuiz = () => {
    if (!newQuizForm.title.trim()) {
      alert('Please provide a title for the quiz or exam.');
      return;
    }

    const newId = `${batchKey}-custom-${Date.now()}`;
    const newExamMeta = {
      id: newId,
      title: newQuizForm.title.trim(),
      category: batchKey,
      categoryName: course.title,
      subCategory: newQuizForm.subCategory || 'General',
      subject: newQuizForm.subject || 'All Subjects',
      totalQuestions: 0,
      durationMinutes: Number(newQuizForm.durationMinutes) || 40,
      totalMarks: Number(newQuizForm.totalMarks) || 100,
      negativeMark: Number(newQuizForm.negativeMark) || 0.25,
      hasExplanations: true
    };

    const updatedExams = [newExamMeta, ...(manifestData?.exams || [])];
    const nextManifest = { ...manifestData, exams: updatedExams };
    setManifestData(nextManifest);
    saveManifestOverrides(nextManifest);

    saveCustomExam(newId, {
      exam_id: newId,
      title: newExamMeta.title,
      category: batchKey,
      duration_minutes: newExamMeta.durationMinutes,
      total_questions: 0,
      negative_mark: newExamMeta.negativeMark,
      questions: []
    }, nextManifest);

    setShowAddQuizModal(false);
    setNewQuizForm({
      title: '',
      subCategory: subCategoriesList[0] || 'General',
      subject: 'Biology',
      durationMinutes: 40,
      totalMarks: 100,
      negativeMark: 0.25
    });

    triggerToast('✨ New quiz created successfully!');
    handleOpenExamQuestions(newExamMeta);
  };

  // Delete Quiz
  const handleDeleteQuiz = (examId, title) => {
    if (confirm(`Are you sure you want to delete the quiz "${title}"?`)) {
      const updatedExams = (manifestData?.exams || []).filter(e => e.id !== examId);
      const nextManifest = { ...manifestData, exams: updatedExams };
      setManifestData(nextManifest);
      saveManifestOverrides(nextManifest);
      triggerToast('🗑️ Quiz deleted.');
    }
  };

  // Rename Subcategory / Category across all exams in batch
  const handleSaveSubCategoryRename = () => {
    if (!editingSubCategory || !editingSubCategory.newName.trim()) return;
    const { oldName, newName } = editingSubCategory;
    if (oldName === newName) {
      setEditingSubCategory(null);
      return;
    }

    const updatedExams = (manifestData?.exams || []).map(e => {
      if (e.category === batchKey && e.subCategory === oldName) {
        return { ...e, subCategory: newName.trim() };
      }
      return e;
    });

    const updatedCategories = (manifestData?.categories || []).map(cat => {
      if (cat.key === batchKey && cat.subCategories) {
        const nextSubCats = cat.subCategories.map(sc => {
          if (sc.name === oldName) return { ...sc, name: newName.trim() };
          return sc;
        });
        return { ...cat, subCategories: nextSubCats };
      }
      return cat;
    });

    const nextManifest = { ...manifestData, exams: updatedExams, categories: updatedCategories };
    setManifestData(nextManifest);
    saveManifestOverrides(nextManifest);
    setEditingSubCategory(null);
    if (selectedSubCategory === oldName) {
      setSelectedSubCategory(newName.trim());
    }
    triggerToast(`✏️ Category renamed to "${newName.trim()}"`);
  };

  // Add new Subcategory
  const handleAddNewSubCategory = () => {
    if (!newCategoryName.trim()) return;
    const catName = newCategoryName.trim();
    if (subCategoriesList.includes(catName)) {
      alert('This category already exists!');
      return;
    }

    const updatedCategories = (manifestData?.categories || []).map(cat => {
      if (cat.key === batchKey) {
        const existing = cat.subCategories || [];
        return {
          ...cat,
          subCategories: [...existing, { name: catName, examCount: 0, questionCount: 0 }]
        };
      }
      return cat;
    });

    const nextManifest = { ...manifestData, categories: updatedCategories };
    setManifestData(nextManifest);
    saveManifestOverrides(nextManifest);
    setSelectedSubCategory(catName);
    setShowAddCategoryModal(false);
    setNewCategoryName('');
    triggerToast(`📁 New category "${catName}" added!`);
  };

  // Move Quiz to another Subcategory
  const handleConfirmMoveQuiz = () => {
    if (!showMoveQuizModal || !targetSubCatForMove) return;
    const examId = showMoveQuizModal.id;

    const updatedExams = (manifestData?.exams || []).map(e => {
      if (e.id === examId) {
        return { ...e, subCategory: targetSubCatForMove };
      }
      return e;
    });

    const nextManifest = { ...manifestData, exams: updatedExams };
    setManifestData(nextManifest);
    saveManifestOverrides(nextManifest);
    setShowMoveQuizModal(null);
    setTargetSubCatForMove('');
    triggerToast(`🔄 Quiz moved to "${targetSubCatForMove}".`);
  };

  // Save Quiz Meta updates
  const handleSaveQuizMeta = (updatedMeta) => {
    const updatedExams = (manifestData?.exams || []).map(e => {
      if (e.id === updatedMeta.id) {
        return { ...e, ...updatedMeta };
      }
      return e;
    });

    const nextManifest = { ...manifestData, exams: updatedExams };
    setManifestData(nextManifest);
    saveManifestOverrides(nextManifest);

    if (activeExamMeta && activeExamMeta.id === updatedMeta.id) {
      setActiveExamMeta({ ...activeExamMeta, ...updatedMeta });
      if (activeExamData) {
        setActiveExamData({
          ...activeExamData,
          title: updatedMeta.title,
          duration_minutes: updatedMeta.durationMinutes,
          negative_mark: updatedMeta.negativeMark
        });
      }
    }

    setShowEditQuizMetaModal(null);
    triggerToast('💾 Quiz details updated.');
  };

  // Toggle chapter accordion collapse in Mode A
  const handleToggleChapterCollapse = (chapterName) => {
    setCollapsedChapters(prev => ({
      ...prev,
      [chapterName]: !prev[chapterName]
    }));
  };

  // Open Duration Customizer for an individual exam
  const handleOpenDurationCustomizer = (exam, isModeB = false) => {
    const cur = Number(exam?.durationMinutes || exam?.duration_minutes || 40);
    setTempDuration(cur);
    setDurationCustomizerModal({
      examId: exam.id || exam.exam_id,
      title: exam.title || 'Exam',
      currentDuration: cur,
      isModeB
    });
  };

  // Save Duration for an individual exam
  const handleSaveDuration = (minutesToSave) => {
    if (!durationCustomizerModal) return;
    const minutes = Math.max(1, parseInt(minutesToSave ?? tempDuration, 10) || 40);
    const examId = durationCustomizerModal.examId;

    const nextManifest = updateExamDuration(examId, minutes, manifestData, (updated) => {
      setManifestData(updated);
    });
    if (nextManifest) {
      setManifestData(nextManifest);
    }

    // If currently viewing this exam in Mode B, update local state
    if (activeExamMeta && (activeExamMeta.id === examId || activeExamMeta.exam_id === examId)) {
      setActiveExamMeta(prev => ({ ...prev, durationMinutes: minutes }));
      setActiveExamData(prev => prev ? ({ ...prev, duration_minutes: minutes }) : prev);
    }

    setDurationCustomizerModal(null);
    triggerToast(`⏱️ Duration for "${durationCustomizerModal.title}" set to ${minutes} mins!`);
  };

  // ==========================================
  // QUESTION MANAGEMENT HANDLERS (MODE B)
  // ==========================================

  // Persist questions updates
  const saveQuestionsState = useCallback((nextQuestions) => {
    if (!activeExamMeta || !activeExamData) return;

    const updatedExam = {
      ...activeExamData,
      total_questions: nextQuestions.length,
      questions: nextQuestions
    };

    setActiveExamData(updatedExam);

    saveCustomExam(
      activeExamMeta.id,
      updatedExam,
      manifestData,
      (updatedManifest) => {
        setManifestData(updatedManifest);
      }
    );

    setActiveExamMeta(prev => ({
      ...prev,
      totalQuestions: nextQuestions.length
    }));

    triggerToast('✅ Questions saved & updated live!');
  }, [activeExamMeta, activeExamData, manifestData, triggerToast]);

  // Smooth jump to question
  const handleJumpToQuestion = (qIndex, qId) => {
    if (itemsPerPage !== 'all') {
      const targetPage = Math.floor(qIndex / itemsPerPage) + 1;
      setCurrentPage(targetPage);
    }

    setTimeout(() => {
      const element = questionCardRefs.current[qId];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedQuestionId(qId);
        setTimeout(() => setHighlightedQuestionId(null), 1800);
      }
    }, 100);
  };

  // Reorder Question (Move Up / Down)
  const handleMoveQuestion = (idx, direction) => {
    if (!activeExamData?.questions) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= activeExamData.questions.length) return;

    const nextQuestions = [...activeExamData.questions];
    const temp = nextQuestions[idx];
    nextQuestions[idx] = nextQuestions[targetIdx];
    nextQuestions[targetIdx] = temp;

    const renumbered = nextQuestions.map((q, i) => ({
      ...q,
      question_no: i + 1
    }));

    saveQuestionsState(renumbered);
  };

  // 1-Click Toggle Correct Option
  const handleQuickToggleCorrectIndex = (questionIdx, newCorrectIdx) => {
    if (!activeExamData?.questions) return;
    const nextQuestions = activeExamData.questions.map((q, i) => {
      if (i === questionIdx) {
        const letters = ['A', 'B', 'C', 'D'];
        return {
          ...q,
          correct_index: newCorrectIdx,
          correct_answer: letters[newCorrectIdx] || 'A'
        };
      }
      return q;
    });
    saveQuestionsState(nextQuestions);
  };

  // Delete Question
  const handleDeleteQuestion = (questionIdx) => {
    if (!activeExamData?.questions) return;
    if (confirm(`Are you sure you want to delete Question #${questionIdx + 1}?`)) {
      const nextQuestions = activeExamData.questions
        .filter((_, i) => i !== questionIdx)
        .map((q, i) => ({ ...q, question_no: i + 1 }));
      saveQuestionsState(nextQuestions);
    }
  };

  // Inline question updater
  const handleUpdateInlineQuestion = (qId, field, value) => {
    if (!activeExamData?.questions) return;
    const nextQuestions = activeExamData.questions.map(q => {
      if (q.id === qId) {
        return { ...q, [field]: value };
      }
      return q;
    });
    saveQuestionsState(nextQuestions);
  };

  // Open Question Modal for Add
  const handleOpenAddQuestionModal = () => {
    setQuestionFormData({
      question: '',
      options: ['', '', '', ''],
      correct_index: 0,
      explanation: '',
      image: ''
    });
    setShowQuestionModal('add');
  };

  // Open Question Modal for Edit
  const handleOpenEditQuestionModal = (question, index) => {
    setQuestionFormData({
      question: question.question || '',
      options: Array.isArray(question.options) ? [...question.options] : ['', '', '', ''],
      correct_index: question.correct_index !== undefined ? question.correct_index : 0,
      explanation: question.explanation || '',
      image: question.images?.[0] || ''
    });
    setShowQuestionModal({ mode: 'edit', question, index });
  };

  // Save Add/Edit Question from Modal
  const handleSaveQuestionFromModal = () => {
    if (!questionFormData.question.trim()) {
      alert('Please enter the question statement.');
      return;
    }

    const cleanOptions = questionFormData.options.map(opt => (opt || '').trim());
    if (cleanOptions.some(opt => !opt)) {
      alert('Please fill in all 4 options.');
      return;
    }

    const letters = ['A', 'B', 'C', 'D'];
    const formattedImages = questionFormData.image.trim() ? [questionFormData.image.trim()] : [];

    if (showQuestionModal === 'add') {
      const newQ = {
        id: `q-${Date.now()}-${(activeExamData?.questions?.length || 0) + 1}`,
        question_no: (activeExamData?.questions?.length || 0) + 1,
        question: questionFormData.question.trim(),
        options: cleanOptions,
        correct_index: questionFormData.correct_index,
        correct_answer: letters[questionFormData.correct_index] || 'A',
        explanation: (questionFormData.explanation || '').trim(),
        images: formattedImages
      };

      const nextQuestions = [...(activeExamData?.questions || []), newQ];
      saveQuestionsState(nextQuestions);
      setShowQuestionModal(null);
      triggerToast('➕ New question added!');

      setTimeout(() => {
        handleJumpToQuestion(nextQuestions.length - 1, newQ.id);
      }, 100);
    } else if (typeof showQuestionModal === 'object' && showQuestionModal.mode === 'edit') {
      const targetIdx = showQuestionModal.index;
      const nextQuestions = activeExamData.questions.map((q, i) => {
        if (i === targetIdx) {
          return {
            ...q,
            question: questionFormData.question.trim(),
            options: cleanOptions,
            correct_index: questionFormData.correct_index,
            correct_answer: letters[questionFormData.correct_index] || 'A',
            explanation: (questionFormData.explanation || '').trim(),
            images: formattedImages
          };
        }
        return q;
      });

      saveQuestionsState(nextQuestions);
      setShowQuestionModal(null);
      triggerToast('💾 Question updated successfully!');
    }
  };

  // Bulk Import Handler
  const handleOpenBulkImport = () => {
    setBulkImportText('');
    setBulkParsedPreview([]);
    setShowBulkImportModal(true);
  };

  const handleBulkTextChange = (text) => {
    setBulkImportText(text);
    const parsed = parseBulkQuestionsFromText(text, (activeExamData?.questions?.length || 0) + 1);
    setBulkParsedPreview(parsed);
  };

  const handleConfirmBulkImport = () => {
    if (bulkParsedPreview.length === 0) {
      alert('No questions detected. Please verify the format.');
      return;
    }

    const nextQuestions = [...(activeExamData?.questions || []), ...bulkParsedPreview];
    const renumbered = nextQuestions.map((q, i) => ({ ...q, question_no: i + 1 }));
    saveQuestionsState(renumbered);
    setShowBulkImportModal(false);
    triggerToast(`🎉 Successfully imported ${bulkParsedPreview.length} questions!`);
  };

  // Export Exam JSON File for download
  const handleExportExamJson = () => {
    if (!activeExamData) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeExamData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${activeExamMeta.title || 'exam'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerToast('📥 JSON file downloaded.');
  };

  // Filter questions matching search & tab filters in Mode B
  const filteredAllQuestions = useMemo(() => {
    if (!activeExamData?.questions) return [];
    return activeExamData.questions.filter((item, idx) => {
      // Tab filters
      if (activeQuestionTab === 'no-exp' && item.explanation && item.explanation.trim().length > 0) {
        return false;
      }
      if (activeQuestionTab === 'has-img' && (!item.images || item.images.length === 0)) {
        return false;
      }

      // Search query
      if (questionSearchQuery.trim()) {
        const q = questionSearchQuery.toLowerCase().trim();
        const matchesNo = String(idx + 1).includes(q);
        const matchesQ = item.question?.toLowerCase().includes(q);
        const matchesExp = item.explanation?.toLowerCase().includes(q);
        const matchesOpt = item.options?.some(opt => opt?.toLowerCase().includes(q));
        if (!matchesNo && !matchesQ && !matchesExp && !matchesOpt) return false;
      }

      return true;
    });
  }, [activeExamData, questionSearchQuery, activeQuestionTab]);

  // Paginated questions slice
  const displayedQuestions = useMemo(() => {
    if (itemsPerPage === 'all') return filteredAllQuestions;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAllQuestions.slice(start, start + itemsPerPage);
  }, [filteredAllQuestions, itemsPerPage, currentPage]);

  const totalPages = useMemo(() => {
    if (itemsPerPage === 'all' || filteredAllQuestions.length === 0) return 1;
    return Math.ceil(filteredAllQuestions.length / itemsPerPage);
  }, [filteredAllQuestions.length, itemsPerPage]);

  // Color helper for subjects
  const getSubjectBadge = (subject) => {
    const s = (subject || '').toLowerCase();
    if (s.includes('bio') || s.includes('উদ্ভিদ') || s.includes('প্রাণি')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (s.includes('phy') || s.includes('পদার্থ')) {
      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    }
    if (s.includes('chem') || s.includes('রসায়ন')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (s.includes('eng') || s.includes('ইংরেজি')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (s.includes('gk') || s.includes('সাধারণ জ্ঞান')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="min-h-screen bg-[#f4f6fa] text-slate-800 pb-28 font-sans antialiased">
      {/* ========================================================= */}
      {/* 1. TOP STICKY STUDIO HEADER BAR */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={activeExamMeta ? handleBackToQuizList : onBack}
              className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer border-none bg-transparent shrink-0"
              title={activeExamMeta ? "Back to Quizzes List" : "Back to Courses"}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  EXAM BATCH STUDIO
                </span>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">•</span>
                <span className="text-xs text-slate-500 font-bold truncate max-w-[200px] sm:max-w-xs">
                  {course.title}
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-black text-slate-900 truncate">
                {activeExamMeta ? `📝 ${activeExamMeta.title}` : 'Quiz, Chapter & Question Management'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Live Save Status Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600">
              {saveStatus === 'saving' ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span className="text-amber-700 font-bold">Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Live Sync Active</span>
                </>
              )}
            </div>

            {/* Live Preview Button */}
            <button
              type="button"
              onClick={onPreview}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer border-none"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Website View</span>
            </button>

            {/* Done & Back */}
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold shadow-md shadow-[#5d5bf6]/25 transition-all cursor-pointer border-none"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Done</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. EXAM BATCH SUMMARY & STATS KPI BANNER */}
      {/* ========================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Batch Cover & Title Preview */}
          <div className="flex items-center gap-4 min-w-0">
            <div
              onClick={() => openGalleryModal(course.image, `Change Banner for ${course.title}`, 'Banners', (newUrl) => {
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
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                  {course.category || 'EXAM BATCH'}
                </span>
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-extrabold ${
                  Number(course.salePrice) === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-900'
                }`}>
                  {Number(course.salePrice) === 0 ? 'Free Access' : `৳${Number(course.salePrice).toLocaleString()}`}
                </span>
                {course.badge && (
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    {course.badge}
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug line-clamp-1">
                {course.title}
              </h2>
              <p className="text-xs text-slate-400 font-medium line-clamp-1">
                {course.subtitle || course.description || 'Chapter-wise Quiz & Question Bank Studio'}
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <div className="bg-[#f4f6fa] rounded-2xl p-3 text-center border border-slate-200/60 min-w-[95px]">
              <span className="block text-lg font-black text-[#5d5bf6]">{totalBatchExams}</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Exams</span>
            </div>
            <div className="bg-[#f4f6fa] rounded-2xl p-3 text-center border border-slate-200/60 min-w-[95px]">
              <span className="block text-lg font-black text-emerald-600">{totalBatchQuestions.toLocaleString()}</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Questions</span>
            </div>
            <div className="bg-[#f4f6fa] rounded-2xl p-3 text-center border border-slate-200/60 min-w-[95px]">
              <span className="block text-lg font-black text-purple-600">{subCategoriesList.length}</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Chapters / Categories</span>
            </div>
            <div className="bg-[#f4f6fa] rounded-2xl p-3 text-center border border-slate-200/60 min-w-[95px]">
              <span className="block text-lg font-black text-rose-600">{(course.duration || '40 mins').replace('মিনিট', 'mins').replace('মি.', 'm')}</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Avg Duration</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. STUDIO NAVIGATION TABS */}
      {/* ========================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
        <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('curriculum');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-none shrink-0 ${
              activeTab === 'curriculum'
                ? 'bg-[#5d5bf6] text-white shadow-xs shadow-[#5d5bf6]/20'
                : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Quizzes & Roadmap</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-black ${
              activeTab === 'curriculum' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {totalBatchExams} {totalBatchExams === 1 ? 'Quiz' : 'Quizzes'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('basic');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-none shrink-0 ${
              activeTab === 'basic'
                ? 'bg-[#5d5bf6] text-white shadow-xs shadow-[#5d5bf6]/20'
                : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Batch Settings & Pricing</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('overview');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-none shrink-0 ${
              activeTab === 'overview'
                ? 'bg-[#5d5bf6] text-white shadow-xs shadow-[#5d5bf6]/20'
                : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Syllabus & Guidelines</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. MAIN STUDIO CONTENT AREA */}
      {/* ========================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
        {/* ========================================================= */}
        {/* TAB 1: কুইজ ও প্রশ্ন রোডম্যাপ (QUIZZES & QUESTIONS ROADMAP) */}
        {/* ========================================================= */}
        {activeTab === 'curriculum' && (
          <div>
            {/* ------------------------------------------------------------- */}
            {/* SUB-VIEW 1: QUESTIONS INSPECTOR & EDITOR (MODE B) */}
            {/* ------------------------------------------------------------- */}
            {activeExamMeta ? (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                
                {/* LEFT / MAIN COLUMN: QUESTIONS FEED (COL-SPAN 3) */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Mode B Header Banner */}
                  <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <button
                          type="button"
                          onClick={handleBackToQuizList}
                          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#5d5bf6] hover:underline cursor-pointer bg-transparent border-none p-0 mb-1"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Back to Quizzes List</span>
                        </button>

                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h2 className="text-xl font-black text-slate-900 tracking-tight">
                            {activeExamMeta.title}
                          </h2>
                          <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                            {activeExamMeta.subCategory || 'General'}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-extrabold border ${getSubjectBadge(activeExamMeta.subject)}`}>
                            {activeExamMeta.subject || 'All Subjects'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleOpenDurationCustomizer(activeExamMeta, true)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 font-bold transition-all cursor-pointer shadow-2xs hover:scale-102"
                            title="Click to customize quiz duration"
                          >
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>{activeExamMeta.durationMinutes || 40} mins</span>
                            <span className="text-[10px] bg-amber-200/70 text-amber-900 px-1 py-0.2 rounded font-black">
                              Customize ✏️
                            </span>
                          </button>
                          <span>•</span>
                          <span>Total Marks: {activeExamMeta.totalMarks || 100}</span>
                          <span>•</span>
                          <span>Negative Mark: -{activeExamMeta.negativeMark || 0.25}</span>
                          <span>•</span>
                          <span className="font-bold text-emerald-600">
                            Total Questions: {activeExamData?.questions?.length || 0}
                          </span>
                        </div>
                      </div>

                      {/* Mode B Actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={handleOpenBulkImport}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200/80 cursor-pointer transition-all"
                          title="Bulk paste multiple questions from text"
                        >
                          <UploadCloud className="w-3.5 h-3.5 text-purple-600" />
                          <span>Bulk Import Text</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleExportExamJson}
                          className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200/80 cursor-pointer transition-all"
                          title="Export Exam JSON"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-500" />
                          <span>Export JSON</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleOpenAddQuestionModal}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold shadow-md shadow-[#5d5bf6]/20 cursor-pointer border-none transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ New Question</span>
                        </button>
                      </div>
                    </div>

                    {/* Filter tabs & Search in Questions */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={questionSearchQuery}
                          onChange={(e) => {
                            setQuestionSearchQuery(e.target.value);
                            setCurrentPage(1);
                          }}
                          placeholder="Search by question number or keyword (Ctrl+K)..."
                          className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-[#5d5bf6] transition-all font-medium"
                        />
                        {questionSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setQuestionSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Filter Pills */}
                      <div className="flex items-center gap-1.5 text-xs font-bold overflow-x-auto">
                        <button
                          type="button"
                          onClick={() => { setActiveQuestionTab('all'); setCurrentPage(1); }}
                          className={`px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${
                            activeQuestionTab === 'all'
                              ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          All ({activeExamData?.questions?.length || 0})
                        </button>

                        <button
                          type="button"
                          onClick={() => { setActiveQuestionTab('no-exp'); setCurrentPage(1); }}
                          className={`px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${
                            activeQuestionTab === 'no-exp'
                              ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Without Explanation
                        </button>

                        <button
                          type="button"
                          onClick={() => { setActiveQuestionTab('has-img'); setCurrentPage(1); }}
                          className={`px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${
                            activeQuestionTab === 'has-img'
                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          With Diagram
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Loading Skeleton */}
                  {isLoadingExamData && (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 animate-pulse space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-200" />
                            <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="h-10 bg-slate-100 rounded-xl" />
                            <div className="h-10 bg-slate-100 rounded-xl" />
                            <div className="h-10 bg-slate-100 rounded-xl" />
                            <div className="h-10 bg-slate-100 rounded-xl" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Empty State */}
                  {!isLoadingExamData && (!activeExamData?.questions || activeExamData.questions.length === 0) && (
                    <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300 space-y-4">
                      <div className="w-16 h-16 rounded-3xl bg-[#5d5bf6]/10 text-[#5d5bf6] flex items-center justify-center mx-auto">
                        <FileQuestion className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-800">No questions in this exam yet</h3>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                          Click below to create questions manually or bulk import multiple questions from text.
                        </p>
                      </div>
                      <div className="flex justify-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={handleOpenBulkImport}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200 cursor-pointer hover:bg-purple-100"
                        >
                          <UploadCloud className="w-4 h-4" />
                          <span>Bulk Import Text</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleOpenAddQuestionModal}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold border-none cursor-pointer transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ Create First Question</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Questions Feed */}
                  {!isLoadingExamData && displayedQuestions.length > 0 && (
                    <div className="space-y-4">
                      {displayedQuestions.map((qItem) => {
                        const actualIdx = activeExamData.questions.findIndex(q => q.id === qItem.id);
                        const isFirst = actualIdx === 0;
                        const isLast = actualIdx === activeExamData.questions.length - 1;
                        const isHighlighted = highlightedQuestionId === qItem.id;
                        const isInlineEditing = inlineEditingQuestionId === qItem.id;

                        return (
                          <div
                            key={qItem.id || actualIdx}
                            ref={el => { questionCardRefs.current[qItem.id] = el; }}
                            className={`bg-white rounded-2xl p-5 border transition-all space-y-3.5 group ${
                              isHighlighted
                                ? 'border-[#5d5bf6] ring-4 ring-[#5d5bf6]/20 shadow-lg'
                                : 'border-slate-100 shadow-2xs hover:shadow-xs'
                            }`}
                          >
                            {/* Top Question Row: Number, Text & Actions */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 font-mono font-black text-xs flex items-center justify-center shrink-0 border border-slate-200">
                                  #{qItem.question_no || actualIdx + 1}
                                </span>
                                <div className="space-y-1 flex-1 min-w-0">
                                  {isInlineEditing ? (
                                    <textarea
                                      rows={2}
                                      value={qItem.question}
                                      onChange={(e) => handleUpdateInlineQuestion(qItem.id, 'question', e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold outline-none focus:bg-white focus:border-[#5d5bf6]"
                                    />
                                  ) : (
                                    <h3 className="text-sm font-bold text-slate-900 leading-relaxed">
                                      {qItem.question}
                                    </h3>
                                  )}
                                </div>
                              </div>

                              {/* Question Actions */}
                              <div className="flex items-center gap-1 shrink-0">
                                {/* Toggle Inline Edit */}
                                <button
                                  type="button"
                                  onClick={() => setInlineEditingQuestionId(isInlineEditing ? null : qItem.id)}
                                  className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border-none ${
                                    isInlineEditing
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 bg-transparent'
                                  }`}
                                  title={isInlineEditing ? "Close Inline Edit" : "Direct Inline Edit"}
                                >
                                  {isInlineEditing ? <Check className="w-4 h-4 text-emerald-700" /> : <Zap className="w-4 h-4" />}
                                </button>

                                {/* Reorder Up */}
                                <button
                                  type="button"
                                  disabled={isFirst}
                                  onClick={() => handleMoveQuestion(actualIdx, 'up')}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer border-none bg-transparent transition-colors"
                                  title="Move Up"
                                >
                                  <ArrowUp className="w-4 h-4" />
                                </button>

                                {/* Reorder Down */}
                                <button
                                  type="button"
                                  disabled={isLast}
                                  onClick={() => handleMoveQuestion(actualIdx, 'down')}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer border-none bg-transparent transition-colors"
                                  title="Move Down"
                                >
                                  <ArrowDown className="w-4 h-4" />
                                </button>

                                {/* Full Modal Edit */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditQuestionModal(qItem, actualIdx)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-[#5d5bf6] hover:bg-indigo-50 cursor-pointer border-none bg-transparent transition-colors"
                                  title="Edit Details"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>

                                {/* Delete Question */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteQuestion(actualIdx)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer border-none bg-transparent transition-colors"
                                  title="Delete Question"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Image preview if question has diagram */}
                            {qItem.images && qItem.images.length > 0 && qItem.images[0] && (
                              <div className="ml-11 max-w-sm rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                                <img
                                  src={qItem.images[0]}
                                  alt="Question diagram"
                                  className="w-full max-h-48 object-contain"
                                />
                              </div>
                            )}

                            {/* 4 Options Grid */}
                            <div className="ml-0 sm:ml-11 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              {(qItem.options || []).map((opt, optIdx) => {
                                const isCorrect = qItem.correct_index === optIdx;
                                const optionLabels = ['A', 'B', 'C', 'D'];

                                return (
                                  <div
                                    key={optIdx}
                                    onClick={() => handleQuickToggleCorrectIndex(actualIdx, optIdx)}
                                    className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 cursor-pointer transition-all ${
                                      isCorrect
                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs font-bold ring-1 ring-emerald-300'
                                        : 'bg-slate-50/70 border-slate-200/80 text-slate-700 hover:bg-slate-100/80 hover:border-slate-300'
                                    }`}
                                    title="Click to mark this option as correct answer"
                                  >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                        isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                                      }`}>
                                        {optionLabels[optIdx]}
                                      </span>

                                      {isInlineEditing ? (
                                        <input
                                          type="text"
                                          value={opt}
                                          onClick={(e) => e.stopPropagation()}
                                          onChange={(e) => {
                                            const nextOpts = [...qItem.options];
                                            nextOpts[optIdx] = e.target.value;
                                            handleUpdateInlineQuestion(qItem.id, 'options', nextOpts);
                                          }}
                                          className="flex-1 bg-white border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-800 outline-none"
                                        />
                                      ) : (
                                        <span className="truncate">{opt}</span>
                                      )}
                                    </div>

                                    {isCorrect && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md shrink-0">
                                        <Check className="w-3 h-3 stroke-[3]" />
                                        <span>Correct</span>
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Explanation Box */}
                            {isInlineEditing ? (
                              <div className="ml-0 sm:ml-11 pt-1">
                                <label className="text-[10px] font-bold text-amber-800 block mb-1">Edit Explanation:</label>
                                <textarea
                                  rows={2}
                                  value={qItem.explanation || ''}
                                  placeholder="Write explanation or book reference..."
                                  onChange={(e) => handleUpdateInlineQuestion(qItem.id, 'explanation', e.target.value)}
                                  className="w-full bg-amber-50/70 border border-amber-200 rounded-xl p-2 text-xs text-amber-950 outline-none"
                                />
                              </div>
                            ) : qItem.explanation && (
                              <div className="ml-0 sm:ml-11 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 space-y-1">
                                <span className="font-extrabold flex items-center gap-1.5 text-amber-800">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Explanation & Reference:</span>
                                </span>
                                <p className="leading-relaxed font-normal text-amber-950">
                                  {qItem.explanation}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Pagination Bar */}
                      {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-2xs">
                          <div className="text-xs font-bold text-slate-500">
                            Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredAllQuestions.length)} of {filteredAllQuestions.length} questions
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={currentPage === 1}
                              onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 disabled:opacity-30 cursor-pointer bg-slate-50 hover:bg-slate-100"
                            >
                              Previous Page
                            </button>

                            <span className="text-xs font-extrabold text-[#5d5bf6] px-2">
                              {currentPage} / {totalPages}
                            </span>

                            <button
                              type="button"
                              disabled={currentPage === totalPages}
                              onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 disabled:opacity-30 cursor-pointer bg-slate-50 hover:bg-slate-100"
                            >
                              Next Page
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Bottom Action Strip */}
                      <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
                        <button
                          type="button"
                          onClick={handleOpenBulkImport}
                          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-extrabold cursor-pointer transition-all shadow-2xs"
                        >
                          <UploadCloud className="w-4 h-4" />
                          <span>Bulk Import Text</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleOpenAddQuestionModal}
                          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-extrabold cursor-pointer transition-all shadow-md shadow-[#5d5bf6]/20 border-none"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ Add Next Question (#{activeExamData.questions.length + 1})</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN: QUESTION JUMPER & STATS PALETTE (STICKY SIDEBAR) */}
                <div className="lg:col-span-1 sticky top-24 space-y-4">
                  <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-[#5d5bf6]" />
                        <span>Question Navigator & Jumper</span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {activeExamData?.questions?.length || 0} Qs
                      </span>
                    </div>

                    {/* Progress indicators */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                        <span>Correct Answer Set</span>
                        <span className="text-emerald-600">
                          {activeExamData?.questions ? `${activeExamData.questions.length} / ${activeExamData.questions.length}` : '0/0'}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full w-full" />
                      </div>
                    </div>

                    {/* Page items size selector */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <span className="text-slate-500 font-bold">Page Size:</span>
                      <div className="flex items-center gap-1">
                        {[25, 50, 'all'].map((val) => (
                          <button
                            key={String(val)}
                            type="button"
                            onClick={() => { setItemsPerPage(val); setCurrentPage(1); }}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                              itemsPerPage === val
                                ? 'bg-[#5d5bf6] text-white border-[#5d5bf6]'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {val === 'all' ? 'All' : val}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Question Palette Number Grid */}
                    <div className="max-h-72 overflow-y-auto pr-1">
                      <div className="grid grid-cols-5 gap-1.5">
                        {(activeExamData?.questions || []).map((q, idx) => {
                          const hasExp = Boolean(q.explanation && q.explanation.trim());
                          const hasImg = Boolean(q.images && q.images.length > 0);
                          const isHighlighted = highlightedQuestionId === q.id;

                          return (
                            <button
                              key={q.id || idx}
                              type="button"
                              onClick={() => handleJumpToQuestion(idx, q.id)}
                              className={`relative h-8 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border flex items-center justify-center ${
                                isHighlighted
                                  ? 'bg-[#5d5bf6] text-white border-[#5d5bf6] shadow-sm scale-110 z-10'
                                  : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-indigo-50 hover:border-indigo-300 hover:text-[#5d5bf6]'
                              }`}
                              title={`Question #${idx + 1}${hasExp ? ' (with explanation)' : ''}${hasImg ? ' (with diagram)' : ''}`}
                            >
                              <span>{idx + 1}</span>

                              {/* Tiny indicator dots */}
                              <div className="absolute bottom-0.5 flex gap-0.5">
                                {hasExp && <span className="w-1 h-1 rounded-full bg-amber-500" />}
                                {hasImg && <span className="w-1 h-1 rounded-full bg-blue-500" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                        <span>Has Explanation</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                        <span>Has Diagram</span>
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              /* ------------------------------------------------------------- */
              /* SUB-VIEW 2: CATEGORIZED QUIZZES & CHAPTERS HUB (MODE A) */
              /* ------------------------------------------------------------- */
              <div className="space-y-6">
                {/* Search & Actions Toolbar */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Quizzes & Chapters Roadmap</h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Organize quizzes by chapter, rename categories, and customize questions.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowAddCategoryModal(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200/80 cursor-pointer transition-all"
                    >
                      <FolderPlus className="w-3.5 h-3.5 text-purple-600" />
                      <span>+ New Category / Chapter</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setNewQuizForm({
                          title: '',
                          subCategory: selectedSubCategory !== 'all' ? selectedSubCategory : (subCategoriesList[0] || 'General'),
                          subject: 'Biology',
                          durationMinutes: 40,
                          totalMarks: 100,
                          negativeMark: 0.25
                        });
                        setShowAddQuizModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold shadow-xs shadow-[#5d5bf6]/20 cursor-pointer border-none transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Create New Quiz</span>
                    </button>
                  </div>
                </div>

                {/* Categories & Chapters Horizontal Pills with Inline Rename */}
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                      <ListFilter className="w-3.5 h-3.5 text-[#5d5bf6]" />
                      <span>Chapter & Category Filter ({subCategoriesList.length})</span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Click the pencil icon to rename categories
                    </span>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {/* All Category Pill */}
                    <button
                      type="button"
                      onClick={() => setSelectedSubCategory('all')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 ${
                        selectedSubCategory === 'all'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
                      }`}
                    >
                      All Chapters ({batchExams.length})
                    </button>

                    {/* Subcategory Pills */}
                    {subCategoriesList.map((scName) => {
                      const count = batchExams.filter(e => e.subCategory === scName).length;
                      const isSelected = selectedSubCategory === scName;

                      return (
                        <div
                          key={scName}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shrink-0 ${
                            isSelected
                              ? 'bg-[#5d5bf6] text-white border-[#5d5bf6] shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
                          }`}
                        >
                          <span
                            onClick={() => setSelectedSubCategory(scName)}
                            className="cursor-pointer max-w-[200px] truncate"
                            title={scName}
                          >
                            {scName}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-black ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {count}
                          </span>

                          {/* Rename Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSubCategory({ oldName: scName, newName: scName });
                            }}
                            className={`p-1 rounded-md cursor-pointer border-none bg-transparent transition-colors ${
                              isSelected ? 'text-white/80 hover:text-white hover:bg-white/20' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
                            }`}
                            title="Rename Category"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Search & Subject Filter Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={quizSearchQuery}
                      onChange={(e) => setQuizSearchQuery(e.target.value)}
                      placeholder="Search by quiz title or subject..."
                      className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-[#5d5bf6] transition-all font-medium shadow-2xs"
                    />
                    {quizSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setQuizSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Subject Dropdown Filter */}
                  {subjectsList.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 hidden sm:inline">Subject:</span>
                      <select
                        value={selectedSubjectFilter}
                        onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#5d5bf6] shadow-2xs cursor-pointer"
                      >
                        <option value="all">All Subjects ({batchExams.length})</option>
                        {subjectsList.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Quizzes Accordion by Chapter */}
                {isLoadingManifest ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 space-y-3">
                    <div className="w-10 h-10 border-4 border-[#5d5bf6]/30 border-t-[#5d5bf6] rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-bold text-slate-500">Loading quiz list...</p>
                  </div>
                ) : filteredExams.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300 space-y-3">
                    <p className="text-sm font-bold text-slate-600">No quizzes found.</p>
                    <p className="text-xs text-slate-400">Change filters or create a new quiz.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {groupedExamsByChapter.map(([chapterName, chapterExams]) => {
                      const isCollapsed = collapsedChapters[chapterName];

                      return (
                        <div key={chapterName} className="space-y-3">
                          {/* Chapter Header */}
                          <div
                            onClick={() => handleToggleChapterCollapse(chapterName)}
                            className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:bg-slate-50/80 cursor-pointer transition-all"
                          >
                            <div className="flex items-center gap-2.5">
                              {isCollapsed ? (
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-600" />
                              )}
                              <h4 className="text-xs font-black text-slate-800">
                                📁 {chapterName}
                              </h4>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                {chapterExams.length} {chapterExams.length === 1 ? 'Quiz' : 'Quizzes'}
                              </span>
                            </div>

                            <span className="text-[11px] font-bold text-[#5d5bf6]">
                              {isCollapsed ? 'Expand +' : 'Collapse -'}
                            </span>
                          </div>

                          {/* Quizzes inside this chapter */}
                          {!isCollapsed && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-2">
                              {chapterExams.map((exam) => (
                                <div
                                  key={exam.id}
                                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-[#5d5bf6]/40 transition-all flex flex-col justify-between gap-4 group"
                                >
                                  <div className="space-y-2.5">
                                    {/* Tags Row */}
                                    <div className="flex items-center justify-between gap-2">
                                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black border ${getSubjectBadge(exam.subject)}`}>
                                        {exam.subject || 'All Subjects'}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        #{exam.id.slice(-6)}
                                      </span>
                                    </div>

                                    {/* Title */}
                                    <h4
                                      onClick={() => handleOpenExamQuestions(exam)}
                                      className="text-sm font-black text-slate-900 leading-snug hover:text-[#5d5bf6] cursor-pointer transition-colors line-clamp-2"
                                      title={exam.title}
                                    >
                                      {exam.title}
                                    </h4>

                                    {/* Metrics Strip */}
                                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-center">
                                      <div className="bg-slate-50 rounded-xl p-1.5">
                                        <span className="block text-xs font-black text-[#5d5bf6]">{exam.totalQuestions || 0}</span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Questions</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenDurationCustomizer(exam);
                                        }}
                                        className="bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-transparent rounded-xl p-1.5 transition-all text-center cursor-pointer group/time"
                                        title="Click to customize exam duration"
                                      >
                                        <div className="flex items-center justify-center gap-1">
                                          <span className="block text-xs font-black text-slate-700 group-hover/time:text-amber-800">
                                            {exam.durationMinutes || 40}m
                                          </span>
                                          <Clock className="w-2.5 h-2.5 text-slate-400 group-hover/time:text-amber-600 transition-colors" />
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-400 group-hover/time:text-amber-700 uppercase flex items-center justify-center gap-0.5">
                                          Duration ✏️
                                        </span>
                                      </button>
                                      <div className="bg-slate-50 rounded-xl p-1.5">
                                        <span className="block text-xs font-black text-slate-700">{exam.totalMarks || 100}</span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Marks</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Card Footer Actions */}
                                  <div className="space-y-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenExamQuestions(exam)}
                                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer border-none"
                                    >
                                      <FileQuestion className="w-3.5 h-3.5" />
                                      <span>View & Edit Questions ({exam.totalQuestions || 0})</span>
                                    </button>

                                    <div className="flex items-center justify-between text-xs pt-0.5">
                                      {/* Move Category Button */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setShowMoveQuizModal(exam);
                                          setTargetSubCatForMove(exam.subCategory || 'General');
                                        }}
                                        className="text-slate-500 hover:text-[#5d5bf6] font-bold bg-transparent border-none cursor-pointer p-0 flex items-center gap-1 transition-colors"
                                      >
                                        <Move className="w-3 h-3 text-slate-400" />
                                        <span>Move Category</span>
                                      </button>

                                      {/* Edit Quiz Meta Button */}
                                      <button
                                        type="button"
                                        onClick={() => setShowEditQuizMetaModal(exam)}
                                        className="text-slate-500 hover:text-[#5d5bf6] font-bold bg-transparent border-none cursor-pointer p-0 flex items-center gap-1 transition-colors"
                                      >
                                        <Settings className="w-3 h-3 text-slate-400" />
                                        <span>Settings</span>
                                      </button>

                                      {/* Delete Quiz */}
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteQuiz(exam.id, exam.title)}
                                        className="text-slate-400 hover:text-rose-600 font-bold bg-transparent border-none cursor-pointer p-0 flex items-center gap-1 transition-colors"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        <span>Delete</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: ব্যাচ সেটিংস ও ফি (BATCH DETAILS & PRICING) */}
        {/* ========================================================= */}
        {activeTab === 'basic' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6 max-w-4xl">
            <div>
              <h3 className="text-base font-black text-slate-900">Batch General Settings & Pricing</h3>
              <p className="text-xs text-slate-400 font-medium">
                Configure title, subtitle, pricing, and key features of this exam series.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">Batch Title / Name</label>
                <input
                  type="text"
                  value={course.title || ''}
                  onChange={(e) => handleUpdateField('title', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] font-bold"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">Subtitle / Short Description</label>
                <input
                  type="text"
                  value={course.subtitle || course.description || ''}
                  onChange={(e) => {
                    handleUpdateField('subtitle', e.target.value);
                    handleUpdateField('description', e.target.value);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Sale Price / Offer Price (৳)</label>
                <input
                  type="number"
                  value={course.salePrice || 0}
                  onChange={(e) => handleUpdateField('salePrice', Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Regular Price (৳)</label>
                <input
                  type="number"
                  value={course.regularPrice || 0}
                  onChange={(e) => handleUpdateField('regularPrice', Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Badge / Ribbon Text</label>
                <input
                  type="text"
                  value={course.badge || course.ribbonText || ''}
                  onChange={(e) => handleUpdateField('badge', e.target.value)}
                  placeholder="e.g. Special Batch"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Average Exam Duration</label>
                <input
                  type="text"
                  value={course.duration || '40 mins'}
                  onChange={(e) => handleUpdateField('duration', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
                />
              </div>
            </div>

            {/* Features list */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700">Key Batch Features</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFeatureInput}
                  onChange={(e) => setNewFeatureInput(e.target.value)}
                  placeholder="Enter new feature..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newFeatureInput.trim()) return;
                    const feats = Array.isArray(course.features) ? [...course.features] : [];
                    feats.push({ id: Date.now(), text: newFeatureInput.trim() });
                    handleUpdateField('features', feats);
                    setNewFeatureInput('');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold cursor-pointer border-none"
                >
                  + Add Feature
                </button>
              </div>

              <div className="space-y-2">
                {(Array.isArray(course.features) ? course.features : []).map((feat, idx) => {
                  const featText = typeof feat === 'object' ? feat.text : feat;
                  return (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <span className="text-slate-700 font-medium">{featText}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = course.features.filter((_, i) => i !== idx);
                          handleUpdateField('features', updated);
                        }}
                        className="text-slate-400 hover:text-rose-600 border-none bg-transparent cursor-pointer p-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: সিলেবাস ও নির্দেশিকা (OVERVIEW & GUIDELINES) */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6 max-w-4xl">
            <div>
              <h3 className="text-base font-black text-slate-900">Overview & Guidelines</h3>
              <p className="text-xs text-slate-400 font-medium">
                Write overview, objectives, and guidelines for students.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">About / Overview</label>
                <textarea
                  rows={6}
                  value={course.aboutText || course.details?.about || course.description || ''}
                  onChange={(e) => {
                    handleUpdateField('aboutText', e.target.value);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] leading-relaxed"
                  placeholder="Why this exam batch is essential..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Hotline / Support Phone Number</label>
                <input
                  type="text"
                  value={course.supportPhone || '01321228612'}
                  onChange={(e) => handleUpdateField('supportPhone', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* MODAL 1: ADD NEW QUIZ */}
      {/* ========================================================= */}
      {showAddQuizModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#5d5bf6]" />
                <span>Create New Quiz / Exam</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddQuizModal(false)}
                className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Quiz Title / Name *</label>
                <input
                  type="text"
                  value={newQuizForm.title}
                  onChange={(e) => setNewQuizForm({ ...newQuizForm, title: e.target.value })}
                  placeholder="e.g. Botany Exam (Sure Shot)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Chapter / Category</label>
                  <select
                    value={newQuizForm.subCategory}
                    onChange={(e) => setNewQuizForm({ ...newQuizForm, subCategory: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] font-bold cursor-pointer"
                  >
                    {subCategoriesList.map(sc => (
                      <option key={sc} value={sc}>{sc}</option>
                    ))}
                    {!subCategoriesList.includes('General') && (
                      <option value="General">General</option>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Subject</label>
                  <select
                    value={newQuizForm.subject}
                    onChange={(e) => setNewQuizForm({ ...newQuizForm, subject: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] font-bold cursor-pointer"
                  >
                    <option value="Biology">Biology</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Physics">Physics</option>
                    <option value="English">English</option>
                    <option value="GK">General Knowledge (GK)</option>
                    <option value="All Subjects">All Subjects</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={newQuizForm.durationMinutes}
                    onChange={(e) => setNewQuizForm({ ...newQuizForm, durationMinutes: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Total Marks</label>
                  <input
                    type="number"
                    value={newQuizForm.totalMarks}
                    onChange={(e) => setNewQuizForm({ ...newQuizForm, totalMarks: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddQuizModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNewQuiz}
                className="px-5 py-2.5 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold border-none cursor-pointer shadow-md shadow-[#5d5bf6]/20"
              >
                Create & Add Questions →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: ADD / RENAME CATEGORY MODAL */}
      {/* ========================================================= */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-purple-600" />
              <span>Add New Category / Chapter</span>
            </h3>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Category or Chapter Name</label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g. Biology 1st Paper - Chapter 1"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] font-bold"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddNewSubCategory}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold border-none cursor-pointer shadow-md shadow-purple-600/20"
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Subcategory Rename Modal */}
      {editingSubCategory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FolderEdit className="w-5 h-5 text-[#5d5bf6]" />
              <span>Rename Category</span>
            </h3>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Current Name</label>
              <p className="text-xs font-bold text-slate-500 bg-slate-100 p-2.5 rounded-xl truncate">
                {editingSubCategory.oldName}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Enter New Name</label>
              <input
                type="text"
                value={editingSubCategory.newName}
                onChange={(e) => setEditingSubCategory({ ...editingSubCategory, newName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] font-bold"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingSubCategory(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSubCategoryRename}
                className="px-5 py-2 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold border-none cursor-pointer shadow-md shadow-[#5d5bf6]/20"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: MOVE QUIZ TO ANOTHER SUBCATEGORY */}
      {/* ========================================================= */}
      {showMoveQuizModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Move className="w-5 h-5 text-[#5d5bf6]" />
              <span>Move Quiz Category</span>
            </h3>

            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Which category or chapter would you like to move <strong>"{showMoveQuizModal.title}"</strong> to?
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Select Target Category</label>
              <select
                value={targetSubCatForMove}
                onChange={(e) => setTargetSubCatForMove(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] font-bold cursor-pointer"
              >
                {subCategoriesList.map(sc => (
                  <option key={sc} value={sc}>{sc}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowMoveQuizModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMoveQuiz}
                className="px-5 py-2 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold border-none cursor-pointer shadow-md shadow-[#5d5bf6]/20"
              >
                Confirm Move
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: EDIT QUIZ SETTINGS META */}
      {/* ========================================================= */}
      {showEditQuizMetaModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#5d5bf6]" />
              <span>Update Quiz Settings</span>
            </h3>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Quiz Title</label>
                <input
                  type="text"
                  value={showEditQuizMetaModal.title}
                  onChange={(e) => setShowEditQuizMetaModal({ ...showEditQuizMetaModal, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Subject</label>
                  <input
                    type="text"
                    value={showEditQuizMetaModal.subject || ''}
                    onChange={(e) => setShowEditQuizMetaModal({ ...showEditQuizMetaModal, subject: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={showEditQuizMetaModal.durationMinutes || 40}
                    onChange={(e) => setShowEditQuizMetaModal({ ...showEditQuizMetaModal, durationMinutes: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Total Marks</label>
                  <input
                    type="number"
                    value={showEditQuizMetaModal.totalMarks || 100}
                    onChange={(e) => setShowEditQuizMetaModal({ ...showEditQuizMetaModal, totalMarks: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Negative Marking</label>
                  <input
                    type="number"
                    step="0.05"
                    value={showEditQuizMetaModal.negativeMark || 0.25}
                    onChange={(e) => setShowEditQuizMetaModal({ ...showEditQuizMetaModal, negativeMark: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEditQuizMetaModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveQuizMeta(showEditQuizMetaModal)}
                className="px-5 py-2 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold border-none cursor-pointer shadow-md shadow-[#5d5bf6]/20"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: ADD / EDIT QUESTION MODAL */}
      {/* ========================================================= */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#5d5bf6]" />
                <span>
                  {showQuestionModal === 'add' ? 'Add New Question' : `Edit Question #${(showQuestionModal.index || 0) + 1}`}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setShowQuestionModal(null)}
                className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Question Statement */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Question Statement *</label>
                <textarea
                  rows={3}
                  value={questionFormData.question}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, question: e.target.value })}
                  placeholder="Type question statement here..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] font-bold leading-relaxed"
                />
              </div>

              {/* Diagram / Image URL */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Image / Diagram Link (Optional)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Paste image link or URL</span>
                </label>
                <input
                  type="text"
                  value={questionFormData.image}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
                />
              </div>

              {/* 4 Options & Correct Answer Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>4 Options & Correct Answer Selection *</span>
                  <span className="text-[10px] text-emerald-600 font-bold">Select radio button next to correct answer</span>
                </label>

                <div className="space-y-2.5">
                  {['A', 'B', 'C', 'D'].map((letter, optIdx) => {
                    const isCorrect = questionFormData.correct_index === optIdx;

                    return (
                      <div
                        key={letter}
                        className={`p-2.5 rounded-xl border flex items-center gap-3 transition-all ${
                          isCorrect ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-300' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <label className="flex items-center gap-2 cursor-pointer shrink-0">
                          <input
                            type="radio"
                            name="correctAnswerOption"
                            checked={isCorrect}
                            onChange={() => setQuestionFormData({ ...questionFormData, correct_index: optIdx })}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                          />
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] ${
                            isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {letter}
                          </span>
                        </label>

                        <input
                          type="text"
                          value={questionFormData.options[optIdx] || ''}
                          onChange={(e) => {
                            const nextOpts = [...questionFormData.options];
                            nextOpts[optIdx] = e.target.value;
                            setQuestionFormData({ ...questionFormData, options: nextOpts });
                          }}
                          placeholder={`Option ${letter} text...`}
                          className="flex-1 bg-transparent border-none outline-none text-xs text-slate-800 font-medium"
                        />

                        {isCorrect && (
                          <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md shrink-0">
                            Correct Answer
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Explanation (Optional) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Explanation & Reference</label>
                <textarea
                  rows={3}
                  value={questionFormData.explanation}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, explanation: e.target.value })}
                  placeholder="Why is this answer correct? Brief explanation or book reference..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] leading-relaxed"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowQuestionModal(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveQuestionFromModal}
                className="px-5 py-2.5 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold border-none cursor-pointer shadow-md shadow-[#5d5bf6]/20"
              >
                {showQuestionModal === 'add' ? 'Add Question' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 6: BULK PASTE & IMPORT QUESTIONS */}
      {/* ========================================================= */}
      {showBulkImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-purple-600" />
                  <span>Bulk Import Questions via Text Paste</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Copy questions from Word or any document and paste here. Questions and options will be parsed automatically.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkImportModal(false)}
                className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Text Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Paste Questions</span>
                  <button
                    type="button"
                    onClick={() => {
                      const sample = `1. What is the powerhouse of the cell?\na) Golgi apparatus\nb) Mitochondria\nc) Ribosome\nd) Lysosome\nAns: B\nExplanation: Mitochondria generate cellular energy (ATP) needed for biochemical reactions.\n\n2. What is the normal human body temperature?\na) 98.4° F\nb) 100.2° F\nc) 97.2° F\nd) 104° F\nAns: A\nExplanation: Normal core body temperature is approximately 98.4° F (37° C).`;
                      handleBulkTextChange(sample);
                    }}
                    className="text-[10px] text-[#5d5bf6] font-bold hover:underline border-none bg-transparent cursor-pointer p-0"
                  >
                    Load Demo Format
                  </button>
                </label>
                <textarea
                  rows={12}
                  value={bulkImportText}
                  onChange={(e) => handleBulkTextChange(e.target.value)}
                  placeholder={`1. Question statement...\na) Option 1\nb) Option 2\nc) Option 3\nd) Option 4\nAns: B\nExplanation: Reason...`}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-800 outline-none focus:bg-white focus:border-purple-600 leading-relaxed"
                />
              </div>

              {/* Live Preview Column */}
              <div className="space-y-1.5 flex flex-col">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Live Parsed Preview</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                    {bulkParsedPreview.length} {bulkParsedPreview.length === 1 ? 'question' : 'questions'} detected
                  </span>
                </label>

                <div className="flex-1 max-h-[300px] overflow-y-auto bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-3">
                  {bulkParsedPreview.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center p-6 text-slate-400 text-xs">
                      Paste text on the left to see parsed questions preview here.
                    </div>
                  ) : (
                    bulkParsedPreview.map((q, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div className="font-bold text-slate-900">
                          #{q.question_no}. {q.question}
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className={q.correct_index === oIdx ? 'text-emerald-700 font-bold' : ''}>
                              {['A', 'B', 'C', 'D'][oIdx]}) {opt} {q.correct_index === oIdx ? '✓' : ''}
                            </div>
                          ))}
                        </div>
                        {q.explanation && (
                          <div className="text-[10px] text-amber-800 bg-amber-50 p-1 rounded">
                            💡 {q.explanation}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowBulkImportModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bulkParsedPreview.length === 0}
                onClick={handleConfirmBulkImport}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-xs font-bold border-none cursor-pointer shadow-md shadow-purple-600/20"
              >
                Import {bulkParsedPreview.length} Questions →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 6: INDIVIDUAL EXAM DURATION CUSTOMIZER */}
      {/* ========================================================= */}
      {durationCustomizerModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setDurationCustomizerModal(null);
            if (e.key === 'Enter') handleSaveDuration(tempDuration);
          }}
        >
          <div className="bg-white rounded-3xl max-w-sm sm:max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Customize Exam Duration
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium truncate max-w-[220px] sm:max-w-[280px]" title={durationCustomizerModal.title}>
                    {durationCustomizerModal.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDurationCustomizerModal(null)}
                className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-1.5 rounded-xl hover:bg-slate-100 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper + Big Numeric Display */}
            <div className="bg-gradient-to-b from-slate-50 to-indigo-50/20 rounded-2xl p-4 border border-slate-100 text-center space-y-2.5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                Set duration for this exam
              </span>

              <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                <button
                  type="button"
                  onClick={() => setTempDuration(d => Math.max(1, Number(d) - 5))}
                  className="w-10 h-10 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-black text-xs shadow-2xs border border-slate-200 active:scale-95 transition-all cursor-pointer"
                  title="-5 mins"
                >
                  -5
                </button>
                <button
                  type="button"
                  onClick={() => setTempDuration(d => Math.max(1, Number(d) - 1))}
                  className="w-9 h-9 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-black text-xs shadow-2xs border border-slate-200 active:scale-95 transition-all cursor-pointer"
                  title="-1 min"
                >
                  -1
                </button>

                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="360"
                    value={tempDuration}
                    onChange={(e) => setTempDuration(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-28 text-center text-3xl font-black text-[#5d5bf6] bg-white border-2 border-[#5d5bf6]/30 focus:border-[#5d5bf6] rounded-2xl py-2 px-1 outline-none shadow-xs font-mono"
                    autoFocus
                  />
                  <span className="block text-[11px] font-black text-slate-600 mt-1">
                    mins
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setTempDuration(d => Math.min(360, Number(d) + 1))}
                  className="w-9 h-9 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-black text-xs shadow-2xs border border-slate-200 active:scale-95 transition-all cursor-pointer"
                  title="+1 min"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => setTempDuration(d => Math.min(360, Number(d) + 5))}
                  className="w-10 h-10 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-black text-xs shadow-2xs border border-slate-200 active:scale-95 transition-all cursor-pointer"
                  title="+5 mins"
                >
                  +5
                </button>
              </div>
            </div>

            {/* Quick 1-Click Preset Buttons */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span>Popular Presets:</span>
                {tempDuration !== durationCustomizerModal.currentDuration && (
                  <button
                    type="button"
                    onClick={() => setTempDuration(durationCustomizerModal.currentDuration)}
                    className="text-[10px] text-amber-600 font-bold hover:underline bg-transparent border-none cursor-pointer p-0"
                  >
                    Reset to Default ({durationCustomizerModal.currentDuration}m)
                  </button>
                )}
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                {[10, 15, 20, 25, 30, 40, 45, 50, 60, 90].map((mins) => {
                  const isSelected = Number(tempDuration) === mins;
                  return (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setTempDuration(mins)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-[#5d5bf6] text-white border-[#5d5bf6] shadow-xs scale-102 font-black'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'
                      }`}
                    >
                      {mins}m
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDurationCustomizerModal(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border-none cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveDuration(tempDuration)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold border-none cursor-pointer shadow-md shadow-[#5d5bf6]/20 transition-all active:scale-98"
              >
                <Check className="w-4 h-4" />
                <span>Save Duration</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
