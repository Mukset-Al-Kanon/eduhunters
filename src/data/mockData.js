import { 
  heroSlidesData, 
  homeStatsData, 
  categoriesList, 
  homeCoursesData, 
  instructorsData, 
  freeVideosData, 
  whyChooseUsData,
  storeProductsData 
} from './homeData';
import { masterEnglishCourseData } from './masterEnglishCourseData';
import { freeCoursesData } from './freeCoursesData';

// Helper to reliably detect and purge any Zenith Crew / Codervai copied courses
export const isZenithCopiedCourse = (course) => {
  if (!course) return false;
  const VALID_COURSE_IDS = new Set([
    'master-english-30-days',
    'chemistry-1st-dagano-line',
    'zoology-dagano-line-medical',
    'hsc-26-27-step-by-step-guideline'
  ]);
  if (VALID_COURSE_IDS.has(course.id) || VALID_COURSE_IDS.has(course.slug)) {
    return false;
  }
  const str = (
    (course.id || '') + ' ' + 
    (course.slug || '') + ' ' + 
    (course.title || '') + ' ' + 
    (course.name || '') + ' ' + 
    (course.image || '') + ' ' + 
    (course.description || '') + ' ' +
    (course.tagline || '')
  ).toLowerCase();

  return (
    str.includes('mastering') ||
    str.includes('ketab') ||
    str.includes('sanjid') ||
    str.includes('codervai') ||
    str.includes('text book') ||
    str.includes('textbook') ||
    str.includes('text_book') ||
    str.includes('hsc 25') ||
    str.includes('hsc 28') ||
    str.includes('hsc 27') ||
    str.includes('hsc 26') ||
    str.includes('master_all') ||
    str.includes('area_combo') ||
    str.includes('chem_28') ||
    str.includes('bio_28') ||
    str.includes('physics_28') ||
    str.includes('physics all combined') ||
    str.includes('biology_area') ||
    str.includes('zenith')
  );
};

// Initial state seed for Edu Hunters with full customizability & accounting
export const initialData = {
  // Brand & Site Settings
  siteSettings: {
    siteName: "EDU HUNTERS",
    siteTagline: "সেরা এডটেক লার্নিং ও এক্সাম প্ল্যাটফর্ম",
    logoUrl: "/logo.png",
    contactPhone: "+880 1700-000000",
    contactEmail: "support@eduhunters.com",
    facebookPage: "https://facebook.com",
    youtubeChannel: "https://youtube.com/@eduhunters",
    youtubeApiKey: "AIzaSyBLThxPP9oO8Uwbyftprjpg1J7_MwpH2YA"
  },

  announcement: "🎉 নতুন স্পেশাল অফার: HSC ও এডমিশন স্পেশাল মেগা পিডিএফ কিনলেই আনলিমিটেড লাইভ এক্সাম সম্পূর্ণ ফ্রি!",
  
  // 100% A to Z Custom Section Headings, Badges, Text & Descriptions
  sectionTexts: {
    // Courses Section
    coursesTitle: "কোর্সসমূহ",
    coursesBtnText: "View all",
    
    // Faculty Section
    facultyBadge: "আমার পরিচয়",
    facultyTitle: "Meet Our Expert Faculty",
    facultyBtnText: "View all",
    
    // Free Videos Section
    videosBadge: "ইউটিউব কন্টেন্ট",
    videosTitle1: "প্লে করে দেখো",
    videosTitle2: "আমার সেরা কিছু ভিডিও",
    videosBtnText: "View All Free Videos",
    
    // Why Choose Us Section
    whyChooseBadge: "কি কি দিয়ে",
    whyChooseTitle: "তোমার পাঁশে আছি",
    
    // Student Reviews Section
    reviewsBadge: "সামাজিক মাধ্যমে পাওয়া রিভিউ",
    reviewsTitle: "শিক্ষার্থীদের রিভিউ",
    
    // 24/7 AI Section
    aiBadge: "Edu Hunters AI",
    aiTitle: "তোমার ২৪/৭ AI স্টাডি পার্টনার",
    aiDesc: "Edu Hunters AI শুধু সাধারণ চ্যাটবট না। সে তোমার কোর্স, এক্সাম, প্রগ্রেস, লাইভ ক্লাস, নোট আর পার্সোনাল PDF বুঝে পড়াশোনাকে আরও দ্রুত, স্পষ্ট এবং ব্যক্তিগত করে তোলে।",
    aiBtn1: "Details",
    aiBtn2: "Live Demo",
    aiCard1Title: "Concept Tutor",
    aiCard1Desc: "Physics, Math, Chemistry বা Biology এর কঠিন টপিক সহজ ভাষায় বুঝিয়ে দেয়।",
    aiCard2Title: "Exam Assistant",
    aiCard2Desc: "চলমান এক্সাম, প্রস্তুতির সারাংশ, সাবমিট করা প্রশ্ন ও ব্যাখ্যা খুঁজে দেয়।",
    aiCard3Title: "Progress Tracker",
    aiCard3Desc: "তোমার কোর্স, অসম্পূর্ণ লেসন ও সামনে থাকা লাইভ ক্লাস মনে করিয়ে দেয়।",
    aiCard4Title: "Private Notes AI",
    aiCard4Desc: "নিজের আপলোড করা PDF ও নোট থেকে ব্যক্তিগতভাবে উত্তর পেতে সাহায্য করে।",
    aiQuestionHeader: "Ask Edu Hunters AI",
    aiQuestionSub: "যে প্রশ্নগুলো করতে পারো",
    aiQuote: "“তোমার পড়া কোথায় আটকে আছে বলো, আমি সহজ করে বুঝিয়ে দিচ্ছি।”",
    
    // Contact Section
    contactTitle: "আমাদের সাথে যোগাযোগ করো",
    contactDesc: "যেকোনো কোর্স এনরোলমেন্ট বা একাডেমিক সহায়তায় আমাদের ফেসবুক পেজ এবং স্টাডি কমিউনিটিতে যুক্ত থাকুন।",
    contactPageTitle: "পেজে মেসেজ করো",
    contactPageSub: "Reach out on our page",
    contactCommunityTitle: "আমাদের কমিউনিটি তে যুক্ত হও",
    contactCommunitySub: "Connect with other learners",

    // Footer
    footerDesc: "দেশের সেরা শিক্ষকমন্ডলী ও মেন্টরদের তত্ত্বাবধানে তোমার স্বপ্নের প্রস্তুতি নিশ্চিত করো।",
    footerCopyright: "© 2026 Edu Hunters. All rights reserved."
  },
  // Hero peek carousel slides (fully editable)
  heroSlides: heroSlidesData,

  // Home counter stats (e.g. 3000+, 70000+, 15+)
  homeStats: homeStatsData,

  // Course categories
  categories: categoriesList,

  // Home courses & bundles
  courses: homeCoursesData.map((course) => {
    if (course.id === 'master-english-30-days') {
      return {
        ...course,
        tagline: masterEnglishCourseData.tagline,
        aboutText: masterEnglishCourseData.aboutText,
        totalClasses: masterEnglishCourseData.totalClasses,
        features: masterEnglishCourseData.features,
        supportPhone: masterEnglishCourseData.supportPhone,
        previewVideoUrl: masterEnglishCourseData.previewVideoUrl,
        curriculum: masterEnglishCourseData.curriculum
      };
    }
    const foundFree = freeCoursesData.find(c => c.id === course.id || c.slug === course.slug);
    if (foundFree) {
      return {
        ...foundFree,
        ...course,
        curriculum: foundFree.curriculum
      };
    }
    return course;
  }),

  // Faculty & Teachers
  instructors: instructorsData,

  // Free YouTube video lectures
  freeVideos: freeVideosData,

  // Why choose us cards
  whyChooseUs: whyChooseUsData,

  // Store Products / Books / PDFs
  storeProducts: storeProductsData,

  // Accounting & Financial Ledger (হিসাব-নিকাশ)
  accounting: {
    totalRevenue: 284500,
    totalExpenses: 42300,
    netProfit: 242200,
    totalOrders: 342,
    transactions: [
      {
        id: "TRX-94821",
        studentName: "মোঃ তানভীর হাসান",
        studentPhone: "01712-345678",
        itemTitle: "SureShot এইচএসসি স্পেশাল এক্সাম ব্যাচ",
        type: "INCOME",
        amount: 2999,
        method: "bKash",
        trxId: "9KJ34LA01X",
        date: "2026-09-30",
        status: "Completed"
      },
      {
        id: "TRX-94820",
        studentName: "আফরোজা সুলতানা",
        studentPhone: "01987-654321",
        itemTitle: "Biology Extra Info Compact PDF",
        type: "INCOME",
        amount: 299,
        method: "Nagad",
        trxId: "8BN52QP99Y",
        date: "2026-09-30",
        status: "Completed"
      },
      {
        id: "TRX-94819",
        studentName: "সার্ভার হোস্টিং & CDN",
        studentPhone: "Cloudflare / AWS",
        itemTitle: "Monthly Server & Video Streaming CDN",
        type: "EXPENSE",
        amount: 5200,
        method: "Bank",
        trxId: "INV-202609-01",
        date: "2026-09-29",
        status: "Completed"
      },
      {
        id: "TRX-94818",
        studentName: "রাকিবুল ইসলাম",
        studentPhone: "01823-998877",
        itemTitle: "মেডিকেল স্পেশাল পূর্ণাঙ্গ এক্সাম সিরিজ",
        type: "INCOME",
        amount: 4999,
        method: "bKash",
        trxId: "7TX11AZ44K",
        date: "2026-09-29",
        status: "Completed"
      },
      {
        id: "TRX-94817",
        studentName: "আবির মাহমুদ",
        studentPhone: "01511-223344",
        itemTitle: "Chemistry Formula Sheet & Reaction Map",
        type: "INCOME",
        amount: 1199,
        method: "Rocket",
        trxId: "6PL90VC33M",
        date: "2026-09-28",
        status: "Completed"
      }
    ]
  },

  // Interactive Online Exams
  exams: [
    {
      id: "exam-1",
      title: "এইচএসসি পদার্থবিজ্ঞান ১ম পত্র: ভেক্টর ও বলবিদ্যা মেগা টেস্ট",
      subject: "Physics",
      durationMinutes: 15,
      totalMarks: 15,
      totalQuestions: 5,
      passMarks: 8,
      negativeMarking: 0.25,
      isFree: true,
      questions: [
        {
          id: 1,
          question: "যদি দুইটি সমান মানের বলের লব্ধি তাদের যেকোনো একটির মানের সমান হয়, তবে তাদের মধ্যবর্তী কোণ কত?",
          options: ["60°", "90°", "120°", "180°"],
          correctIndex: 2,
          explanation: "R² = P² + Q² + 2PQ cosθ। যখন R = P = Q হয়, তখন P² = 2P²(1 + cosθ) => cosθ = -1/2, অতএব θ = 120°।"
        },
        {
          id: 2,
          question: "নিচের কোন রাশিটি ঘূর্ণন গতির ক্ষেত্রে বলের অনুরূপ ভৌত রাশি?",
          options: ["জড়তার ভ্রামক", "কৌণিক ভরবেগ", "টর্ক (Torque)", "কৌণিক ত্বরণ"],
          correctIndex: 2,
          explanation: "রৈখিক গতিতে বল (Force) যা করে, কৌণিক গতিতে টর্ক (τ) ঠিক একই ভূমিকা পালন করে।"
        },
        {
          id: 3,
          question: "একটি বস্তুর ভরবেগ দ্বিগুণ করা হলে তার গতিশক্তি কতগুণ বৃদ্ধি পাবে?",
          options: ["২ গুণ", "৩ গুণ", "৪ গুণ", "৮ গুণ"],
          correctIndex: 1,
          explanation: "Ek = p²/(2m)। ভরবেগ দ্বিগুণ হলে নতুন গতিশক্তি হবে ৪ গুণ। অতএব বৃদ্ধি পাবে (৪ - ১) = ৩ গুণ।"
        },
        {
          id: 4,
          question: "শূন্য মাধ্যমে বা একই মাধ্যমে দুটি সমমুখী সমান্তরাল ভেক্টরের ভেক্টর গুণফল (Cross Product) কত?",
          options: ["১", "০", "-১", "ভেক্টরদ্বয়ের মানের গুণফল"],
          correctIndex: 1,
          explanation: "সমান্তরাল ভেক্টরের মধ্যবর্তী কোণ θ = 0°। sin(0°) = 0, সুতরাং A × B = 0।"
        },
        {
          id: 5,
          question: "লিফটে দাঁড়ানো একজন ব্যক্তি কখন নিজেকে ওজনহীন অনুভব করবেন?",
          options: ["যখন লিফট g ত্বরণে নিচে নামে", "যখন লিফট g ত্বরণে উপরে ওঠে", "যখন লিফট সমবেগে নিচে নামে", "যখন লিফট স্থির থাকে"],
          correctIndex: 0,
          explanation: "R = m(g - a)। যদি a = g হয়, তবে R = m(g - g) = 0 (প্রতিক্রিয়া বল শূন্য)।"
        }
      ]
    },
    {
      id: "exam-2",
      title: "মেডিকেল স্পেশাল বায়োলজি: মানব শারীরতত্ত্ব ও সংবহন কুইক মক",
      subject: "Biology",
      durationMinutes: 10,
      totalMarks: 10,
      totalQuestions: 2,
      passMarks: 6,
      negativeMarking: 0.25,
      isFree: false,
      questions: [
        {
          id: 1,
          question: "মানুষের হৃদপিণ্ডের প্রাকৃতিক পেসমেকার (Natural Pacemaker) কোনটি?",
          options: ["AV Node", "SA Node", "Bundle of His", "Purkinje Fibers"],
          correctIndex: 1,
          explanation: "SA Node (Sinoatrial node) হৃদস্পন্দন তৈরি করে, তাই একে প্রাকৃতিক পেসমেকার বলা হয়।"
        },
        {
          id: 2,
          question: "কোন রক্তকণিকাকে ফ্যাগোসাইটোসিস প্রক্রিয়ার প্রধান সৈনিক বলা হয়?",
          options: ["ইওসিনোফিল ও বেসোফিল", "নিউট্রোফিল ও মনোসাইট", "লিম্ফোসাইট", "অণুচক্রিকা"],
          correctIndex: 1,
          explanation: "নিউট্রোফিল এবং মনোসাইট ফ্যাগোসাইটোসিস প্রক্রিয়ায় ব্যাক্টেরিয়া ও জীবাণু ধ্বংস করে।"
        }
      ]
    }
  ]
};
