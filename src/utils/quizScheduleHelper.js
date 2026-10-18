/**
 * quizScheduleHelper.js
 * Comprehensive scheduling, lock evaluation, and real-time countdown helpers
 * for EduHunters Exams & Quizzes.
 */

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliDigits(input) {
  if (input === undefined || input === null) return '';
  return String(input).split('').map(char => {
    const digit = parseInt(char, 10);
    return !isNaN(digit) && char >= '0' && char <= '9' ? BN_DIGITS[digit] : char;
  }).join('');
}

export function parseDateSafe(dateVal) {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return isNaN(dateVal.getTime()) ? null : dateVal;
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? null : d;
}

export function formatScheduleDateTimeBn(dateVal) {
  const d = parseDateSafe(dateVal);
  if (!d) return '';

  const MONTHS_BN = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];

  const day = d.getDate();
  const month = MONTHS_BN[d.getMonth()];
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = d.getMinutes();
  let period = 'সকাল';
  if (hours >= 4 && hours < 6) period = 'ভোর';
  else if (hours >= 6 && hours < 12) period = 'সকাল';
  else if (hours >= 12 && hours < 15) period = 'দুপুর';
  else if (hours >= 15 && hours < 18) period = 'বিকাল';
  else if (hours >= 18 && hours < 20) period = 'সন্ধ্যা';
  else period = 'রাত';
  
  const displayHours = hours % 12 || 12;
  const minPad = String(minutes).padStart(2, '0');

  return `${toBengaliDigits(day)} ${month}, ${toBengaliDigits(year)} - ${period} ${toBengaliDigits(displayHours)}:${toBengaliDigits(minPad)} মিনিট`;
}

export function formatScheduleDateTimeEn(dateVal) {
  const d = parseDateSafe(dateVal);
  if (!d) return '';
  return d.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

export function calculateCountdown(targetDate, fromDate = new Date()) {
  const target = parseDateSafe(targetDate);
  const now = parseDateSafe(fromDate) || new Date();

  if (!target) {
    return {
      diffMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      text: '00:00:00',
      bnText: '০০:০০:০০'
    };
  }

  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) {
    return {
      diffMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      text: '00:00:00',
      bnText: '০০:০০:০০'
    };
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
  const seconds = Math.floor((diffMs / 1000) % 60);

  const pad2 = (n) => String(n).padStart(2, '0');

  let text = '';
  let bnText = '';

  if (days > 0) {
    text = `${days}d ${pad2(hours)}h ${pad2(minutes)}m ${pad2(seconds)}s`;
    bnText = `${toBengaliDigits(days)} দিন ${toBengaliDigits(pad2(hours))} ঘণ্টা ${toBengaliDigits(pad2(minutes))} মি.`;
  } else {
    text = `${pad2(hours)}h ${pad2(minutes)}m ${pad2(seconds)}s`;
    bnText = `${toBengaliDigits(pad2(hours))} ঘণ্টা ${toBengaliDigits(pad2(minutes))} মিনিট ${toBengaliDigits(pad2(seconds))} সেকেন্ড`;
  }

  return {
    diffMs,
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
    text,
    bnText
  };
}

export function getQuizScheduleState(quiz, referenceTime = new Date()) {
  return {
    hasSchedule: false,
    isUpcoming: false,
    isLive: true,
    isExpired: false,
    startDate: null,
    endDate: null,
    formattedStartBn: '',
    formattedStartEn: '',
    formattedEndBn: '',
    formattedEndEn: '',
    countdown: null,
    statusTextBn: 'উন্মুক্ত পরীক্ষা',
    statusTextEn: 'Exam Open'
  };
}

