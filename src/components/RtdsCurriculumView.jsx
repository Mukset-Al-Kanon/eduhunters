import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Search, X, Lock, Play, Clock, FileText, ChevronRight, CheckCircle2
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { stripEmoji } from '../utils/textUtils';

// 7 Root Categories matching RTDS Unlimited screenshot exact styling
const RTDS_ROOT_CATEGORIES = [
  {
    key: 'BCS Question Exams',
    title: 'BCS Question Exams',
    iconEmoji: '🏛️',
    iconColor: 'text-red-600'
  },
  {
    key: 'Board Question Exams',
    title: 'Board Question Exams',
    iconEmoji: '🅰️',
    iconColor: 'text-red-500'
  },
  {
    key: 'জীববিজ্ঞান অনুশীলনীর MCQ প্রশ্ন',
    title: 'জীববিজ্ঞান অনুশীলনীর MCQ প্রশ্ন',
    iconEmoji: '📕',
    iconColor: 'text-red-600'
  },
  {
    key: 'পদার্থবিজ্ঞান অনুশীলনীর MCQ প্রশ্ন',
    title: 'পদার্থবিজ্ঞান অনুশীলনীর MCQ প্রশ্ন',
    iconEmoji: '📕',
    iconColor: 'text-red-600'
  },
  {
    key: 'রসায়ন অনুশীলনীর MCQ',
    title: 'রসায়ন অনুশীলনীর MCQ',
    iconEmoji: '📕',
    iconColor: 'text-red-600'
  },
  {
    key: 'Medical & Dental Questions',
    title: 'Medical & Dental Questions',
    iconEmoji: '⚕️',
    iconColor: 'text-emerald-700'
  },
  {
    key: '5.2 Final Medical Batch Exams',
    title: '5.2 Final Medical Batch Exams',
    iconEmoji: null, // text only as per screenshot
    iconColor: ''
  }
];

// 6 Root Categories for GK Full Course matching RTDS Unlimited styling
export const GK_ROOT_CATEGORIES = [
  {
    key: 'বাংলাদেশ বিষয়াবলি (টপিকওয়াইজ)',
    title: 'বাংলাদেশ বিষয়াবলি (টপিকওয়াইজ এক্সাম)',
    iconEmoji: '🇧🇩',
    iconColor: 'text-emerald-600'
  },
  {
    key: 'আন্তর্জাতিক বিষয়াবলি (টপিকওয়াইজ)',
    title: 'আন্তর্জাতিক বিষয়াবলি (টপিকওয়াইজ এক্সাম)',
    iconEmoji: '🌍',
    iconColor: 'text-blue-600'
  },
  {
    key: 'বিসিএস প্রশ্নব্যাংক (GK BCS)',
    title: 'বিসিএস প্রশ্নব্যাংক এক্সাম (১০ম - ৫০তম)',
    iconEmoji: '🏛️',
    iconColor: 'text-red-600'
  },
  {
    key: 'ঢাকা বিশ্ববিদ্যালয় (DU) প্রশ্নব্যাংক',
    title: 'ঢাকা বিশ্ববিদ্যালয় (DU) প্রশ্নব্যাংক',
    iconEmoji: '🎓',
    iconColor: 'text-purple-600'
  },
  {
    key: 'বাংলাদেশ মানচিত্র প্রশ্নব্যাংক',
    title: 'বাংলাদেশ মানচিত্র প্রশ্নব্যাংক',
    iconEmoji: '🗺️',
    iconColor: 'text-amber-600'
  },
  {
    key: 'আনলিমিটেড মডেল টেস্ট',
    title: 'সাধারণ জ্ঞান আনলিমিটেড মডেল টেস্ট',
    iconEmoji: '⚡',
    iconColor: 'text-yellow-600'
  }
];

export function getGkCategoryHierarchy(exam) {
  const origSub = (exam.subCategory || '').trim();
  const title = (exam.title || '').trim();

  // 1. BCS Question Exam
  if (origSub === 'GK BCS Question Exam' || title.includes('BCS')) {
    const root = 'বিসিএস প্রশ্নব্যাংক (GK BCS)';
    let sub = '১০ম থেকে ৩০তম বিসিএস';
    const m = title.match(/(\d+)th\s*BCS/i);
    if (m) {
      const num = parseInt(m[1], 10);
      if (num > 30) sub = '৩১তম থেকে ৫০তম বিসিএস';
      else sub = '১০ম থেকে ৩০তম বিসিএস';
    } else if (title.includes('মডেল টেস্ট')) {
      sub = 'বিসিএস মডেল টেস্ট';
    }
    return { root, sub };
  }

  // 2. DU Question Exam
  if (origSub === 'GK DU Question Exam' || title.includes('GK DU')) {
    const root = 'ঢাকা বিশ্ববিদ্যালয় (DU) প্রশ্নব্যাংক';
    let sub = 'DU B Unit (২০১০ - ২০২৫)';
    if (title.includes('DU D')) sub = 'DU D Unit (২০১০ - ২০২২)';
    return { root, sub };
  }

  // 3. Map Question Bank
  if (origSub === 'বাংলাদেশ মানচিত্র প্রশ্নব্যাংক' || title.includes('মানচিত্র পরীক্ষা')) {
    const root = 'বাংলাদেশ মানচিত্র প্রশ্নব্যাংক';
    let sub = 'মানচিত্র পরীক্ষা [Set-A]';
    if (title.includes('[Set-B]')) sub = 'মানচিত্র পরীক্ষা [Set-B]';
    return { root, sub };
  }

  // 4. Unlimited Exam
  if (origSub === 'আনলিমিটেড এক্সাম' || title.includes('(আনলিমিটেড এক্সাম)')) {
    const root = 'আনলিমিটেড মডেল টেস্ট';
    let sub = 'বাংলাদেশ বিষয়াবলি আনলিমিটেড';
    if (
      title.includes('আন্তর্জাতিক') || 
      title.includes('পাশ্চাত্য') || 
      title.includes('একমেরুকেন্দ্রিক') || 
      title.includes('জাতিসংঘ') || 
      title.includes('ভৌগোলিক') || 
      title.includes('মহাদেশ') || 
      title.includes('সভ্যতা')
    ) {
      sub = 'আন্তর্জাতিক বিষয়াবলি আনলিমিটেড';
    }
    return { root, sub };
  }

  // 5. BD Topicwise Exam
  if (origSub === 'বাংলাদেশ টপিকওয়াইজ এক্সাম' || title.includes('বাংলাদেশ')) {
    const root = 'বাংলাদেশ বিষয়াবলি (টপিকওয়াইজ)';
    const m = title.match(/MP3 Topic-(\d+)/i);
    let sub = 'অন্যান্য / লাইভ এক্সাম';
    if (m) {
      const topNum = parseInt(m[1], 10);
      if (topNum >= 11 && topNum <= 16) {
        sub = 'Topic 11-16: মুক্তিযুদ্ধ ও চূড়ান্ত বিজয়';
      } else {
        const topicNames = {
          1: 'Topic 01: প্রাচীন ইতিহাস ও ভূগোল',
          2: 'Topic 02: সালতানাত ও ভাষা আন্দোলন',
          3: 'Topic 03: নদ-নদী, মুগল শাসন ও মুক্তিযুদ্ধ',
          4: 'Topic 04: প্রাচীন জনপদ ও ব্রিটিশ বিরোধী আন্দোলন',
          5: 'Topic 05: সুলতানি শাসন, সিপাহী বিদ্রোহ ও ঢাকা',
          6: 'Topic 06: ভাষা আন্দোলন, সংবিধান ও মুক্তিযুদ্ধ',
          7: 'Topic 07: নবাবি শাসন ও ৬৯ এর গণঅভ্যুত্থান',
          8: 'Topic 08: পাল বংশ, নির্বাচন ও বেতার কেন্দ্র',
          9: 'Topic 09: সেন বংশ, বিদেশি নাগরিক ও সংবিধান',
          10: 'Topic 10: একাদশ ভাগ ও আন্তর্জাতিক ভূমিকা'
        };
        sub = topicNames[topNum] || (`Topic ${topNum < 10 ? '0' + topNum : topNum}`);
      }
    } else if (title.includes('Live')) {
      sub = 'লাইভ এক্সাম ও মডেল টেস্ট';
    }
    return { root, sub };
  }

  // 6. Intl Topicwise Exam
  if (origSub === 'আন্তর্জাতিক টপিকওয়াইজ এক্সাম' || title.includes('আন্তর্জাতিক')) {
    const root = 'আন্তর্জাতিক বিষয়াবলি (টপিকওয়াইজ)';
    const m = title.match(/MP3 Topic-(\d+)/i);
    let sub = 'অন্যান্য / লাইভ এক্সাম';
    if (m) {
      const topNum = parseInt(m[1], 10);
      if (topNum >= 10 && topNum <= 13) {
        sub = 'Topic 10-13: ২য় বিশ্বযুদ্ধ ও আন্তর্জাতিক সংস্থা';
      } else {
        const topicNames = {
          1: 'Topic 01: জাতিসংঘ, মহাদেশ ও রেনেসাঁস',
          2: 'Topic 02: OIC, পরাশক্তি ও মহাসাগর',
          3: 'Topic 03: EU, প্রাচীন মিশর ও সাগর',
          4: 'Topic 04: ASEAN, চীন ও সিন্ধু সভ্যতা',
          5: 'Topic 05: SAARC, রাজতন্ত্র ও অস্ত্র প্রতিযোগিতা',
          6: 'Topic 06: AU, নিরস্ত্রীকরণ ও গ্রিক সভ্যতা',
          7: 'Topic 07: G-20, ফরাসি বিপ্লব ও রোমান সাম্রাজ্য',
          8: 'Topic 08: BIMSTEC, আরবি সভ্যতা ও নেপোলিয়ন',
          9: 'Topic 09: OPEC, ধর্মযুদ্ধ ও ১ম বিশ্বযুদ্ধ'
        };
        sub = topicNames[topNum] || (`Topic ${topNum < 10 ? '0' + topNum : topNum}`);
      }
    } else if (title.includes('Live')) {
      sub = 'লাইভ এক্সাম ও মডেল টেস্ট';
    }
    return { root, sub };
  }

  return { root: origSub || 'অন্যান্য', sub: 'সাধারণ' };
}

// Helper to strip repetitive teacher and paper names from exam chapter titles
function formatExamChapterTitle(title, filePath = '') {
  let cleaned = title.trim();

  // Extract file chapter name without extension
  let fileChapter = '';
  if (filePath) {
    fileChapter = filePath.split('/').pop().replace(/\.json$/i, '').trim();
  }

  // 1. Double pipe '||' or 'll' splitting
  if (cleaned.includes('||')) {
    const parts = cleaned.split('||').map(p => p.trim());
    if (parts.length > 1) {
      if (parts[0].includes('স্যার') || parts[0].includes('ম্যাডাম') || parts[0].includes('ড.')) {
        cleaned = parts[parts.length - 1];
      } else {
        cleaned = parts[0];
      }
    }
  } else if (cleaned.includes('ll')) {
    const parts = cleaned.split('ll').map(p => p.trim());
    if (parts.length > 1) {
      if (parts[0].includes('স্যার') || parts[0].includes('ম্যাডাম') || parts[0].includes('ড.')) {
        cleaned = parts[parts.length - 1];
      } else {
        cleaned = parts[0];
      }
    }
  }

  // 2. Remove teacher prefix, e.g. প্রফেসর ড. মোঃ আজিবুর রহমান স্যার, মাজেদা বেগম ম্যাডাম, ইসহাক স্যার+
  cleaned = cleaned.replace(/^[^\-:|]*?(স্যার|ম্যাডাম)(ের)?\s*(\+|\-+|\–+|\—+|\|+|ll)?\s*/gi, '');

  // 3. Remove paper / subject prefix like 'গুরুত্বপূর্ণ MCQ', 'রসায়ন ১ম পত্র-', 'রসায়ন ২য় পত্র-', 'পদার্থ ১ম পত্র'
  cleaned = cleaned.replace(/^(গুরুত্বপূর্ণ\s*MCQ)?\s*(অনুশীলনী)?\s*(-|–|—)?\s*(রসায়ন|রসায়ন|পদার্থ|পদার্থবিজ্ঞান|জীববিজ্ঞান)?\s*([০-৯\d]+(ম|য়|র্থ|ষ্ঠ|শ|তম|st|nd|rd|th)?\s*পত্র)?\s*(-|–|—|:)?\s*/gi, '');
  cleaned = cleaned.replace(/^([০-৯\d]+(ম|য়|র্থ|ষ্ঠ|শ|তম|st|nd|rd|th)?\s*পত্র)\s*(-|–|—|:)?\s*/gi, '');

  // 4. Strip trailing teacher suffix if any
  cleaned = cleaned.replace(/\s*(\|\||ll)\s*.*(স্যার|ম্যাডাম).*$/gi, '');

  // 5. Clean GK prefixes like MP3 Topic-01 : or [Set-A]
  cleaned = cleaned.replace(/^MP3 Topic-\d+\s*[-:]\s*/i, '');
  cleaned = cleaned.replace(/^\[Set-[AB]\]\s*/i, '');

  // Strip leading symbols
  cleaned = cleaned.replace(/^[\+\-–—:\s]+/, '').trim();

  // 5. Check if cleaned is ONLY a chapter number (e.g. '১ম অধ্যায়', '১১শ অধ্যায়', 'Chapter 3')
  const isOnlyChapterNumber = /^([০-৯\d]+)\s*(ম|য়|র্থ|ষ্ঠ|তম|শ)?\s*অধ্যায়$/i.test(cleaned) ||
                              /^chapter\s*(\d+|[০-৯]+)$/i.test(cleaned) ||
                              /^অধ্যায়\s*(\d+|[০-৯]+)$/i.test(cleaned);

  if (isOnlyChapterNumber && fileChapter && fileChapter !== cleaned) {
    return stripEmoji(`${cleaned}: ${fileChapter}`);
  }

  return stripEmoji(cleaned || fileChapter || title);
}

// Bengali to English digit converter
const BN_TO_EN = { '০': 0, '১': 1, '২': 2, '৩': 3, '৪': 4, '৫': 5, '৬': 6, '৭': 7, '৮': 8, '৯': 9 };

// Standard HSC Chapter Mapping for chapters where chapter number is not in title
const CHAPTER_ORDER_MAP = {
  // Biology 1st Paper (Botany)
  'কোষ ও এর গঠন': 1, 'কোষ ও কোষের গঠন': 1,
  'কোষ বিভাজন': 2,
  'কোষ রসায়ন': 3,
  'অণুজীব': 4,
  'শৈবাল ও ছত্রাক': 5,
  'ব্রায়োফাইটা ও টেরিডোফাইটা': 6, 'ব্রায়োফাইটা ও টেরেডোফাইটা': 6,
  'নগ্নবীজী ও আবৃতবীজী': 7, 'নগ্নবীজী ও আবৃতবীজী উদ্ভিদ': 7,
  'টিস্যু ও টিস্যুতন্ত্র': 8, 'টিস্যু ও টিস্যু তন্ত্র': 8,
  'উদ্ভিদ শারীরতত্ত্ব': 9,
  'উদ্ভিদ প্রজনন': 10,
  'জীবপ্রযুক্তি': 11,
  'জীবের পরিবেশ, বিস্তার ও সংরক্ষণ': 12,

  // Biology 2nd Paper (Zoology)
  'প্রাণীর বিভিন্নতা ও শ্রেণিবিন্যাস': 1,
  'প্রাণীর পরিচিতি': 2, 'ঘাসফড়িং': 2.1, 'হাইড্রা': 2.2, 'রুইমাছ': 2.3, 'হাইড্রা ও রুইমাছ': 2.4,
  'পরিপাক ও শোষণ': 3,
  'রক্ত ও সংবহন': 4, 'রক্ত ও সঞ্চালন': 4, 'রক্ত ও সন্ঞ্চালন': 4,
  'শ্বসন ও শ্বাসক্রিয়া': 5,
  'বর্জ্য ও নিষ্কাশন': 6,
  'চলন ও অঙ্গচালনা': 7,
  'সমন্বয় ও নিয়ন্ত্রণ': 8,
  'মানব জীবনের ধারাবাহিকতা': 9,
  'মানবদেহের প্রতিরক্ষা': 10,
  'জিনতত্ত্ব ও বিবর্তন': 11, 'জ্বীনতত্ত্ব ও বিবর্তন': 11,
  'প্রাণীর আচরণ': 12,

  // Chemistry 1st Paper
  'ল্যাবরেটরির নিরাপদ ব্যবহার': 1, 'ল্যাবরটরির নিরাপদ ব্যবহার': 1,
  'গুণগত রসায়ন': 2,
  'মৌলের পর্যায়বৃত্ত ধর্ম': 3, 'মৌলের পর্যাবৃত্তিক ধর্ম': 3, 'মৌলের পর্যায়বৃত্ত ধর্ম ও রাসায়নিক বন্ধন': 3,
  'রাসায়নিক পরিবর্তন': 4,
  'কর্মমুখী রসায়ন': 5, 'কর্মমূখী রসায়ন': 5,

  // Chemistry 2nd Paper
  'পরিবেশ রসায়ন': 1, 'পরিবেশ রসায়ন': 1,
  'জৈব রসায়ন': 2, 'জৈব - রসায়ন': 2,
  'পরিমাণগত রসায়ন': 3, 'পরিমাণগত রসায়ন': 3,
  'তড়িৎ রসায়ন': 4,
  'অর্থনৈতিক রসায়ন': 5, 'অর্থনৈতিক রসায়ন': 5,

  // Physics 1st Paper
  'ভৌত জগৎ ও পরিমাপ': 1, 'ভৌতজগত ও পরিমাপ': 1,
  'ভেক্টর': 2,
  'গতিবিদ্যা': 3,
  'নিউটনীয় বলবিদ্যা': 4,
  'কাজ, শক্তি ও ক্ষমতা': 5, 'কাজ ক্ষমতা ও শক্তি': 5, 'কাজ, শক্তিও ক্ষমতা': 5,
  'মহাকর্ষ ও অভিকর্ষ': 6,
  'পদার্থের গাঠনিক ধর্ম': 7,
  'পর্যাবৃত্ত গতি': 8, 'পর্যায়বৃত্ত গতি': 8,
  'তরঙ্গ': 9,
  'আদর্শ গ্যাস ও গ্যাসের গতিতত্ত্ব': 10, 'আদর্শ গ্যাস ও গ্যাসের গতি': 10,

  // Physics 2nd Paper
  'তাপগতিবিদ্যা': 1,
  'স্থির তড়িৎ': 2, 'স্থির তড়িৎ': 2,
  'চল তড়িৎ': 3, 'চলতড়িৎ': 3,
  'তড়িৎ প্রবাহের চৌম্বক ক্রিয়া ও চুম্বকত্ব': 4, 'তড়িৎ প্রবাহের চৌম্বকক্রিয়া': 4,
  'তাড়িতচৌম্বকীয় আবেশ ও পরিবর্তী প্রবাহ': 5, 'তড়িৎ চৌম্বক আবেশ ও পরিবর্তী ক্রিয়া': 5,
  'জ্যামিতিক আলোকবিজ্ঞান': 6,
  'ভৌত আলোকবিজ্ঞান': 7, 'ভৈৗত আলোকবিজ্ঞান': 7,
  'আধুনিক পদার্থবিজ্ঞানের সূচনা': 8,
  'পরমাণুর মডেল এবং নিউক্লিয়ার পদার্থবিজ্ঞান': 9, 'পরমাণুর মডেল ও নিউক্লিয়ার পদার্থবিজ্ঞান': 9,
  'সেমিকন্ডাক্টর ও ইলেকট্রনিক্স': 10, 'সেমিকন্ডাক্টর ও ইলেকট্রনিকস': 10,
  'জ্যোতির্বিজ্ঞান': 11
};

// Extracts serial chapter rank for consistent 1, 2, 3... ordering
function getChapterRank(title, filePath = '') {
  const combined = `${title || ''} ${filePath ? filePath.split('/').pop().replace(/\.json$/i, '') : ''}`;
  if (!combined.trim()) return 999;

  // Unlimited / Special model test at the very end
  if (combined.includes('আনলিমিটেড এক্সাম') || combined.includes('মডেল টেস্ট')) {
    return 990;
  }

  // 1. Check for Bengali ordinal like '১ম অধ্যায়', '২য় অধ্যায়', '১০ম অধ্যায়', '১১তম অধ্যায়', '১২তম অধ্যায়'
  const bnMatch = combined.match(/([০-৯]+)\s*(ম|য়|র্থ|ষ্ঠ|তম|শ|ষ|স)?\s*অধ্যা/i);
  if (bnMatch) {
    const rawDigits = bnMatch[1];
    let numStr = '';
    for (const char of rawDigits) {
      numStr += BN_TO_EN[char] !== undefined ? BN_TO_EN[char] : char;
    }
    return parseFloat(numStr);
  }

  // 2. Check for 'অধ্যায় [০-৯]+' or 'অধ্যায় \d+'
  const bnMatch2 = combined.match(/অধ্যায়\s*[-:]?\s*([০-৯]+|\d+)/i);
  if (bnMatch2) {
    const rawDigits = bnMatch2[1];
    let numStr = '';
    for (const char of rawDigits) {
      numStr += BN_TO_EN[char] !== undefined ? BN_TO_EN[char] : char;
    }
    return parseFloat(numStr);
  }

  // 3. Check for পরীক্ষা-০১ or পরীক্ষা 1
  const testMatch = combined.match(/পরীক্ষা[-:]?\s*([০-৯]+|\d+)/i);
  if (testMatch) {
    let numStr = '';
    for (const char of testMatch[1]) {
      numStr += BN_TO_EN[char] !== undefined ? BN_TO_EN[char] : char;
    }
    return parseFloat(numStr);
  }

  // 4. Check for Topic-01 or Topic 1
  const topicMatch = combined.match(/topic[-:]?\s*(\d+)/i);
  if (topicMatch) return parseFloat(topicMatch[1]);

  // 5. Check for English 'Chapter 1', 'Chapter 10', 'Chapter 2'
  const enMatch = combined.match(/chapter\s*(\d+)/i);
  if (enMatch) return parseFloat(enMatch[1]);

  // 6. Check for text ordinals
  const textWords = {
    'প্রথম': 1, 'দ্বিতীয়': 2, 'তৃতীয়': 3, 'চতুর্থ': 4, 'পঞ্চম': 5,
    'ষষ্ঠ': 6, 'সপ্তম': 7, 'অষ্টম': 8, 'নবম': 9, 'দশম': 10, 'একাদশ': 11, 'দ্বাদশ': 12
  };
  for (const [word, num] of Object.entries(textWords)) {
    if (combined.includes(word + ' অধ্যা') || combined.includes(word)) return num;
  }

  // 7. Check against known standard HSC chapter topics
  for (const [topic, order] of Object.entries(CHAPTER_ORDER_MAP)) {
    if (combined.includes(topic)) return order;
  }

  // 8. Check for BCS / Year numbers if any e.g. 45th BCS
  const bcsMatch = combined.match(/(\d+)\s*(th|তম)?\s*bcs/i);
  if (bcsMatch) return parseFloat(bcsMatch[1]);

  // 9. Check for Year e.g. (2010-11)
  const yearMatch = combined.match(/(\d{4})/);
  if (yearMatch) return parseFloat(yearMatch[1]);

  return 999;
}

export default function RtdsCurriculumView({ 
  exams = [], 
  onSelectExam, 
  isEnrolled = false,
  onOpenEnrollModal,
  category = null
}) {
  const { isDark } = useTheme();

  const isGk = category?.key === 'gk_course';
  const rootCategories = isGk ? GK_ROOT_CATEGORIES : RTDS_ROOT_CATEGORIES;

  // Navigation Drill-Down State:
  // selectedRoot: null | string (e.g., 'পদার্থবিজ্ঞান অনুশীলনীর MCQ প্রশ্ন')
  // selectedSub: null | string (e.g., 'পদার্থবিজ্ঞান ১ম পত্র ll ইসহাক স্যার')
  const [selectedRoot, setSelectedRoot] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Build Hierarchy: rootKey -> subKey -> examList
  const tree = useMemo(() => {
    const map = {};
    rootCategories.forEach(cat => {
      map[cat.key] = {
        meta: cat,
        subCategories: isGk ? { 'সকল পরীক্ষা': [] } : {},
        totalExamsCount: 0
      };
    });

    exams.forEach(exam => {
      let rootKey = 'অন্যান্য';
      let subKey = 'সাধারণ টেস্ট';

      if (isGk) {
        const h = getGkCategoryHierarchy(exam);
        rootKey = h.root;
        subKey = h.sub;
      } else {
        const parts = (exam.subCategory || '').split(' > ').map(s => s.trim());
        rootKey = parts[0] || 'অন্যান্য';
        subKey = parts[1] || 'সাধারণ টেস্ট';
      }

      if (!map[rootKey]) {
        map[rootKey] = {
          meta: {
            key: rootKey,
            title: rootKey,
            iconEmoji: isGk ? '🌍' : '📕',
            iconColor: 'text-red-600'
          },
          subCategories: isGk ? { 'সকল পরীক্ষা': [] } : {},
          totalExamsCount: 0
        };
      }

      if (!map[rootKey].subCategories[subKey]) {
        map[rootKey].subCategories[subKey] = [];
      }

      map[rootKey].subCategories[subKey].push(exam);
      if (isGk && subKey !== 'সকল পরীক্ষা') {
        map[rootKey].subCategories['সকল পরীক্ষা'].push(exam);
      }
      map[rootKey].totalExamsCount += 1;
    });

    return map;
  }, [exams, isGk, rootCategories]);

  // Current subcategory list if a root is selected
  const currentSubList = useMemo(() => {
    if (!selectedRoot || !tree[selectedRoot]) return [];
    const keys = Object.keys(tree[selectedRoot].subCategories);
    if (!isGk) return keys;

    return keys.sort((a, b) => {
      if (a === 'সকল পরীক্ষা') return -1;
      if (b === 'সকল পরীক্ষা') return 1;
      const numA = (a.match(/\d+/) || [999])[0];
      const numB = (b.match(/\d+/) || [999])[0];
      if (numA !== numB) return parseInt(numA, 10) - parseInt(numB, 10);
      return a.localeCompare(b, 'bn');
    });
  }, [selectedRoot, tree, isGk]);

  // All exams for selected subcategory, sorted strictly serial-wise
  const allChapterExams = useMemo(() => {
    if (!selectedRoot || !selectedSub || !tree[selectedRoot]?.subCategories[selectedSub]) return [];
    let list = [...tree[selectedRoot].subCategories[selectedSub]];

    // Sort by Chapter Rank serial-wise
    list.sort((a, b) => {
      const rankA = getChapterRank(a.title, a.filePath);
      const rankB = getChapterRank(b.title, b.filePath);
      if (rankA !== rankB) return rankA - rankB;
      return (a.title || '').localeCompare(b.title || '', 'bn');
    });

    return list;
  }, [selectedRoot, selectedSub, tree]);

  // Current exams list filtered by searchQuery
  const currentExamList = useMemo(() => {
    if (!searchQuery.trim()) return allChapterExams;
    const q = searchQuery.toLowerCase().trim();
    const tokens = q.split(/\s+/).filter(Boolean);
    return allChapterExams.filter(e => {
      const displayTitle = formatExamChapterTitle(e.title, e.filePath).toLowerCase();
      const rawTitle = (e.title || '').toLowerCase();
      return tokens.every(tok => displayTitle.includes(tok) || rawTitle.includes(tok));
    });
  }, [allChapterExams, searchQuery]);


  // Reset helpers
  const handleGoHome = () => {
    setSelectedRoot(null);
    setSelectedSub(null);
    setSearchQuery('');
  };

  const handleBackToRoot = () => {
    setSelectedSub(null);
    setSearchQuery('');
  };

  return (
    <div className={`w-full rounded-2xl border transition-all duration-300 font-sans shadow-xs ${
      isDark ? 'bg-[#0f131d] border-white/[0.08]' : 'bg-white border-gray-200'
    }`}>
      {/* Outer Card Header: Dynamic Title with clean minimal back button on left */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {(selectedRoot || selectedSub) && (
            <button
              type="button"
              onClick={selectedSub ? handleBackToRoot : handleGoHome}
              title="আগের ধাপে ফিরে যান"
              className={`p-1.5 -ml-1.5 rounded-lg transition-colors cursor-pointer border-none flex items-center justify-center shrink-0 ${
                isDark 
                  ? 'bg-white/[0.06] hover:bg-white/[0.12] text-gray-200 hover:text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900'
              }`}
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <h2 className={`text-base sm:text-lg font-bold tracking-tight truncate ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {selectedSub ? selectedSub : (selectedRoot ? selectedRoot : (category?.title?.split('|')[0]?.trim() || (isGk ? 'জিকে ফুল কোর্স ২৬' : 'RTDS Unlimited')))}
          </h2>
        </div>
      </div>


      {/* Outer Card Body: Directly inside RTDS Unlimited White Box */}
      <div className="p-5 sm:p-7">


          {/* ========================================================================= */}
          {/* LEVEL 1: ROOT BUTTONS (SCREENSHOT EXACT MATCH, FULL WIDTH)                */}
          {/* ========================================================================= */}
          {!selectedRoot && (
            <div className="flex flex-col gap-2.5 max-w-3xl mx-auto w-full">
              {rootCategories.map((catMeta) => {
                const rootKey = catMeta.key;
                const rootData = tree[rootKey];
                const subCount = rootData ? Object.keys(rootData.subCategories).length : 0;

                return (
                  <button
                    key={rootKey}
                    type="button"
                    onClick={() => {
                      setSelectedRoot(rootKey);
                      setSelectedSub(null);
                    }}
                    className={`w-full py-3.5 px-4 sm:px-5 rounded-xl border text-left font-bold text-xs sm:text-sm md:text-base transition-all duration-200 cursor-pointer shadow-2xs hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between gap-3 group ${
                      isDark
                        ? 'bg-[#121622] hover:bg-[#181f30] border-white/[0.08] hover:border-red-500/50 text-white'
                        : 'bg-white hover:bg-red-50/30 border-gray-200 hover:border-red-400 text-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {catMeta.iconEmoji ? (
                        <span className={`text-lg sm:text-xl shrink-0 ${catMeta.iconColor || ''}`}>
                          {catMeta.iconEmoji}
                        </span>
                      ) : null}
                      <span className="truncate tracking-tight font-bold">
                        {catMeta.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-gray-400 group-hover:text-red-500 transition-colors">
                      <span className="text-xs sm:text-sm font-semibold opacity-70 tabular-nums">
                        {isGk ? (rootData?.totalExamsCount || 0) : subCount}
                      </span>
                      <ChevronRight size={18} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ========================================================================= */}
          {/* LEVEL 2: SUBCATEGORY / WRITER BUTTONS (CLICKED FROM ROOT CATEGORY)        */}
          {/* ========================================================================= */}
          {selectedRoot && !selectedSub && (
            <div className="flex flex-col gap-2.5 max-w-3xl mx-auto w-full animate-fadeIn">
              {currentSubList.map((subName) => {
                const examList = tree[selectedRoot]?.subCategories[subName] || [];

                return (
                  <button
                    key={subName}
                    type="button"
                    onClick={() => setSelectedSub(subName)}
                    className={`w-full py-3.5 px-4 sm:px-5 rounded-xl border text-left font-bold text-xs sm:text-sm md:text-base transition-all duration-200 cursor-pointer shadow-2xs hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between gap-4 group ${
                      isDark
                        ? 'bg-[#121622] hover:bg-[#181f30] border-white/[0.08] hover:border-red-500/50 text-white'
                        : 'bg-white hover:bg-red-50/30 border-gray-200 hover:border-red-400 text-gray-800'
                    }`}
                  >
                    <span className="truncate tracking-tight font-semibold sm:font-bold">
                      {subName}
                    </span>

                    <div className="flex items-center gap-2 shrink-0 text-gray-400 group-hover:text-red-500 transition-colors">
                      <span className="text-xs sm:text-sm font-semibold opacity-70 tabular-nums">
                        {examList.length}
                      </span>
                      <ChevronRight size={18} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ========================================================================= */}
          {/* LEVEL 3: CHAPTER-WISE EXAMS LIST (CLICKED FROM AUTHOR/SUBJECT)            */}
          {/* ========================================================================= */}
          {selectedRoot && selectedSub && (
            <div className="flex flex-col gap-3 max-w-3xl mx-auto w-full animate-fadeIn">
              {/* Search Bar: Permanently mounted if chapter has >3 exams or user is searching */}
              {(allChapterExams.length > 3 || searchQuery) && (
                <div className="relative w-full">
                  <Search size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                    searchQuery ? 'text-red-500' : 'text-gray-400'
                  }`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setSearchQuery('');
                      }
                    }}
                    placeholder="Search exam..."
                    autoComplete="off"
                    spellCheck="false"
                    className={`w-full pl-9 pr-20 py-2.5 rounded-xl text-xs sm:text-sm border outline-none transition-colors ${
                      isDark
                        ? 'bg-white/[0.04] border-white/[0.08] text-white placeholder-gray-500 focus:border-red-500'
                        : 'bg-gray-50/80 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-red-500'
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer bg-transparent border-none rounded-full"
                        title="ক্লিয়ার করুন"
                      >
                        <X size={14} />
                      </button>
                    )}
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-200/80 text-gray-600'
                    }`}>
                      {currentExamList.length}/{allChapterExams.length}
                    </span>
                  </div>
                </div>
              )}

              {/* Chapter Exams Stack */}
              <div className="flex flex-col gap-2.5">
                {currentExamList.length === 0 ? (
                  <div className="py-10 text-center flex flex-col items-center justify-center">
                    <Search size={28} className="text-gray-400 mb-2 opacity-50" />
                    <p className={`text-xs sm:text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      কোনো এক্সাম পাওয়া যায়নি
                    </p>
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="mt-3 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white cursor-pointer transition-colors border-none"
                      >
                        সার্চ ক্লিয়ার করুন
                      </button>
                    )}
                  </div>
                ) : (
                  currentExamList.map((exam, eIdx) => (
                    <button
                      key={exam.id || eIdx}
                      type="button"
                      onClick={() => {
                        if (onSelectExam) {
                          onSelectExam(exam);
                        }
                      }}
                      className={`w-full py-3.5 px-4 sm:px-5 rounded-xl border text-left transition-all duration-200 cursor-pointer shadow-2xs hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between gap-4 group ${
                        isDark
                          ? 'bg-[#121622] hover:bg-[#181f30] border-white/[0.08] hover:border-red-500/50 text-white'
                          : 'bg-white hover:bg-red-50/30 border-gray-200 hover:border-red-400 text-gray-800'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs sm:text-sm md:text-base font-semibold sm:font-bold truncate group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                          {formatExamChapterTitle(exam.title, exam.filePath)}
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                          {exam.title?.match(/MP3 Topic-\d+/i) && (
                            <>
                              <span className="font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded text-[10px]">
                                {exam.title.match(/MP3 Topic-\d+/i)[0]}
                              </span>
                              <span>•</span>
                            </>
                          )}
                          {exam.title?.match(/\[Set-[AB]\]/i) && (
                            <>
                              <span className="font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 px-1.5 py-0.5 rounded text-[10px]">
                                {exam.title.match(/\[Set-[AB]\]/i)[0]}
                              </span>
                              <span>•</span>
                            </>
                          )}
                          <span className="flex items-center gap-1">
                            <FileText size={11} />
                            {exam.totalQuestions} প্রশ্ন
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {exam.durationMinutes || 30} মিনিট
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center">
                        {!isEnrolled ? (
                          <Lock size={16} strokeWidth={1.8} className="shrink-0 text-gray-400 dark:text-gray-400 group-hover:text-red-500 transition-colors" />
                        ) : (
                          <span className="text-[11px] font-bold px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                            <Play size={11} className="fill-current" />
                            <span>শুরু করি</span>
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

      </div>
    </div>
  );
}

