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
import { EXAM_CATEGORIES_METADATA } from './examCategoriesData';

// Helper to reliably detect and purge any Zenith Crew / Codervai copied courses
export const isZenithCopiedCourse = (course) => {
  if (!course) return false;
  const VALID_COURSE_IDS = new Set([
    'master-english-30-days',
    'chemistry-1st-dagano-line',
    'zoology-dagano-line-medical',
    'hsc-26-27-step-by-step-guideline',
    'sureshot',
    'medical',
    'rtds',
    'english_master',
    'gk_course',
    'medilogy'
  ]);
  if (
    course.isExamBatch ||
    VALID_COURSE_IDS.has(course.id) ||
    VALID_COURSE_IDS.has(course.slug) ||
    VALID_COURSE_IDS.has(course.key)
  ) {
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
    facebookPage: "https://www.facebook.com/profile.php?id=61585769408167",
    youtubeChannel: "https://www.youtube.com/channel/UC1XpmoV-Phk1q1N5D2PTd0g",
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

  // Multi-Course Discounted Combo Bundles (Admin Fully Customizable)
  bundles: [
    {
      id: "bundle-medical-mega-combo",
      title: "Medical Dream Combo Pack",
      subtitle: "SureShot + Medical Special + RTDS + Medilogy Intensive",
      description: "মেডিকেল ভর্তি পরীক্ষার পূর্ণাঙ্গ প্রস্তুতি নিশ্চিত করতে আমাদের ৪টি প্রিমিয়ার এক্সাম ব্যাচ ও স্পেশাল গাইডলাইন কোর্স একসাথে বিশেষ ছাড়ের বান্ডিলে এনরোল করুন।",
      image: "https://assets.codervai.com/courses/1781447985147-extra_info_batch.webp",
      badge: "Save 45% • 4-in-1 Combo",
      regularPrice: 2200,
      salePrice: 1199,
      courseIds: ["sureshot", "medical", "rtds", "medilogy"],
      enrolledCount: "৪,৮৫০+",
      studentsCount: "4850+",
      features: [
        "৪টি সম্পূর্ণ মেডিকেল এক্সাম ও প্র্যাকটিস ব্যাচে আনলিমিটেড অ্যাক্সেস",
        "অধ্যায়ভিত্তিক দাগানো বইয়ের PDF ও শর্টকাট চার্ট",
        "লাইভ মেরিট লিস্ট, নেগেটিভ মার্কিং অ্যানালাইসিস ও লিডারবোর্ড",
        "মেডিকেল টপারদের সাথে ডেডিকেটেড ডাউট সলভিং সাপোর্ট"
      ],
      status: "ACTIVE"
    },
    {
      id: "bundle-hsc-english-science-combo",
      title: "HSC 26 Complete Foundation Combo",
      subtitle: "Master English 30 Days + Chemistry & Zoology Dagano Line",
      description: "HSC ও এডমিশন ফাউন্ডেশন মজবুত করার জন্য ইংরেজি এবং সায়েন্স দাগানো বইয়ের স্পেশাল লেকচার সিরিজ একসাথে আকর্ষণীয় ডিসকাউন্টে।",
      image: "/master_english_30_days.png",
      badge: "Best Seller • 3-in-1 Combo",
      regularPrice: 2500,
      salePrice: 1450,
      courseIds: ["master-english-30-days", "chemistry-1st-dagano-line", "zoology-dagano-line-medical"],
      enrolledCount: "৩,৯২০+",
      studentsCount: "3920+",
      features: [
        "৩টি প্রিমিয়ার ফাউন্ডেশন কোর্সের সম্পূর্ণ লেকচার অ্যাক্সেস",
        "সম্পূর্ণ ইংরেজি গ্রামার ও ভোকাবুলারি মাস্টারক্লাস",
        "বোর্ড স্ট্যান্ডার্ড হ্যান্ডনোট ও অধ্যায়ভিত্তিক প্র্যাকটিস শিট",
        "লাইভ সলভ সেশন ও পার্সোনালাইজড প্রোগ্রেস ট্র্যাকিং"
      ],
      status: "ACTIVE"
    }
  ],

  // Exam Batches & Mega Test Series (Fully controllable from Admin Panel)
  examBatches: EXAM_CATEGORIES_METADATA,

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
        id: "TRX-94825",
        studentName: "মেহেদী হাসান শুভ",
        studentPhone: "01789-456123",
        itemTitle: "SureShot মেডিকেল স্পেশাল এক্সাম ব্যাচ",
        type: "INCOME",
        amount: 399,
        method: "bKash",
        trxId: "BL9X48210P",
        date: "2026-10-09",
        status: "Pending"
      },
      {
        id: "TRX-94824",
        studentName: "নুসরাত জাহান মিম",
        studentPhone: "01912-887766",
        itemTitle: "Master English in 30 Days (Complete Live Course)",
        type: "INCOME",
        amount: 1500,
        method: "Nagad",
        trxId: "NG7T33910K",
        date: "2026-10-09",
        status: "Pending"
      },
      {
        id: "TRX-94823",
        studentName: "ফারহান আহমেদ",
        studentPhone: "01644-223399",
        itemTitle: "সাধারণ জ্ঞান পূর্ণাঙ্গ লাইভ ও চ্যাপ্টার ফাইনাল এক্সাম",
        type: "INCOME",
        amount: 299,
        method: "bKash",
        trxId: "BK5M77102Z",
        date: "2026-10-08",
        status: "Pending"
      },
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
  ],
  termsAndConditions: {
    lastUpdated: "৫ অক্টোবর, ২০২৬",
    intro: "EduHunters একটি শিক্ষামূলক অনলাইন প্ল্যাটফর্ম, যেখানে বিভিন্ন Paid & Free Course, Exam, Quiz এবং অন্যান্য শিক্ষামূলক সেবা প্রদান করা হয়। আমাদের ওয়েবসাইট বা যেকোনো সেবা ব্যবহার করার মাধ্যমে আপনি নিচের শর্তগুলোতে সম্মত হচ্ছেন।",
    clauses: [
      {
        id: 1,
        title: "অ্যাকাউন্ট ও ব্যবহার",
        points: [
          "একটি অ্যাকাউন্ট শুধুমাত্র সংশ্লিষ্ট শিক্ষার্থীর ব্যক্তিগত ব্যবহারের জন্য।",
          "Account, Password বা Course Access অন্য কারও সঙ্গে শেয়ার করা যাবে না।",
          "একাধিক ব্যক্তি একই অ্যাকাউন্ট ব্যবহার করলে বা অস্বাভাবিক/অননুমোদিত ব্যবহার শনাক্ত হলে EduHunters প্রয়োজন অনুযায়ী অ্যাকাউন্ট সীমিত, স্থগিত বা বাতিল করতে পারে।"
        ]
      },
      {
        id: 2,
        title: "কোর্স ও কনটেন্ট",
        points: [
          "Paid ও Free Course-এর Access Duration ও সুবিধা সংশ্লিষ্ট Course অনুযায়ী নির্ধারিত হবে।",
          "Course-এর Video, PDF, Notes, Question, Solution বা অন্য কোনো Content Copy, Record, Distribute বা Resell করা যাবে না।",
          "প্রয়োজন অনুযায়ী Course-এর Syllabus, Class Schedule বা Content পরিবর্তন, সংযোজন বা সংশোধন করা হতে পারে।"
        ]
      },
      {
        id: 3,
        title: "পরীক্ষা ও Result",
        points: [
          "সকল Exam/Test-এ নির্ধারিত নিয়ম মেনে অংশগ্রহণ করতে হবে।",
          "অন্যের হয়ে পরীক্ষা দেওয়া, Cheating, প্রশ্ন/উত্তর শেয়ার করা বা কোনো ধরনের Unfair Means ব্যবহার করা নিষিদ্ধ।",
          "কোনো অনিয়ম প্রমাণিত হলে সংশ্লিষ্ট Exam/Result বাতিল করা অথবা Account-এর বিরুদ্ধে প্রয়োজনীয় ব্যবস্থা নেওয়া হতে পারে।"
        ]
      },
      {
        id: 4,
        title: "পেমেন্ট ও Refund",
        points: [
          "Course বা অন্যান্য Paid Service-এর মূল্য ও Payment Information Checkout-এর সময় প্রদর্শিত হবে।",
          "Payment সফল হওয়ার পর নির্ধারিত নিয়ম অনুযায়ী Course Access প্রদান করা হবে।",
          "Refund বা Cancellation-এর নিয়ম সংশ্লিষ্ট Course-এর Refund Policy অনুযায়ী প্রযোজ্য হবে।"
        ]
      },
      {
        id: 5,
        title: "শিক্ষার্থীর আচরণ",
        points: [
          "শিক্ষক, শিক্ষার্থী বা Support Team-এর সঙ্গে অসম্মানজনক আচরণ, Harassment, Spam বা অননুমোদিত Promotional Activity করা যাবে না।",
          "নিয়ম ভঙ্গ করলে Community, Course বা Account Access সীমিত করা হতে পারে।"
        ]
      },
      {
        id: 6,
        title: "Technical Issues",
        points: [
          "Internet Connection, Device, Server বা Third-party Service-এর সমস্যার কারণে সাময়িকভাবে কোনো Service ব্যাহত হতে পারে।",
          "এ ধরনের পরিস্থিতিতে Service স্বাভাবিক করার জন্য EduHunters যথাসাধ্য চেষ্টা করবে।"
        ]
      },
      {
        id: 7,
        title: "Account Suspension",
        points: [
          "Account Sharing, Content Piracy, Cheating, Fraud বা এই Terms & Conditions-এর গুরুতর লঙ্ঘনের ক্ষেত্রে EduHunters প্রয়োজন অনুযায়ী Account Suspend বা Terminate করতে পারে।"
        ]
      },
      {
        id: 8,
        title: "Terms পরিবর্তন",
        points: [
          "EduHunters প্রয়োজন অনুযায়ী এই Terms & Conditions পরিবর্তন বা আপডেট করার অধিকার রাখে। পরিবর্তিত Terms Website-এ প্রকাশের পর কার্যকর হবে।"
        ]
      }
    ],
    agreementText: "EduHunters-এর Website, Course, Exam বা অন্যান্য Service ব্যবহার করার মাধ্যমে আপনি উপরোক্ত Terms & Conditions মেনে চলতে সম্মত হচ্ছেন।"
  },
  refundPolicy: {
    lastUpdated: "৫ অক্টোবর, ২০২৬",
    notice: "EduHunters-এ কোনো Course বা Paid Service কেনার আগে সংশ্লিষ্ট Course-এর সকল তথ্য ও শর্ত ভালোভাবে দেখে নেওয়ার জন্য অনুরোধ করা হচ্ছে।",
    clauses: [
      {
        id: 1,
        title: "রিফান্ড সংক্রান্ত সাধারণ নীতি",
        points: [
          "EduHunters-এর কোনো Course বা Paid Service কেনার আগে Course-এর নাম, মূল্য, সিলেবাস, সুবিধা ও Access Period ভালোভাবে দেখে নেওয়ার জন্য অনুরোধ করা হচ্ছে।",
          "Course কেনার পর শুধুমাত্র মত পরিবর্তন, Course পছন্দ না হওয়া অথবা Course-এর Content ব্যবহার শুরু করার কারণে সাধারণত রিফান্ড প্রদান করা হবে না।"
        ]
      },
      {
        id: 2,
        title: "কোন ক্ষেত্রে রিফান্ড প্রযোজ্য হতে পারে",
        points: [
          "একই Course-এর জন্য ভুলবশত একাধিকবার Payment করা হলে।",
          "Payment সফল হওয়ার পরও নির্ধারিত সময়ের মধ্যে Course Access না পেলে এবং সমস্যাটি আমাদের পক্ষ থেকে হয়ে থাকলে।",
          "আমাদের কোনো Technical বা System সমস্যার কারণে Paid Course-এর Service প্রদান করা সম্ভব না হলে।"
        ]
      },
      {
        id: 3,
        title: "কোন ক্ষেত্রে রিফান্ড প্রযোজ্য নয়",
        points: [
          "Course কেনার পর মত পরিবর্তন করলে।",
          "Course-এর Content দেখা বা ব্যবহার শুরু করার পর।",
          "Course-এর Syllabus, Teaching Style বা Content পছন্দ না হলে।",
          "নিজের Device, Internet Connection বা ব্যক্তিগত Technical সমস্যার কারণে Course ব্যবহার করতে না পারলে।",
          "Course Access অন্য কারও সঙ্গে Share করার পর।"
        ]
      },
      {
        id: 4,
        title: "ভুল Course বা Duplicate Payment",
        points: [
          "ভুল Course-এ Payment করা হলে অথবা একই Course-এর জন্য একাধিকবার Payment হয়ে গেলে দ্রুত EduHunters Support Team-এর সঙ্গে যোগাযোগ করতে হবে।",
          "বিষয়টি যাচাই করে প্রয়োজন অনুযায়ী Course পরিবর্তন, Duplicate Payment-এর সমাধান বা Refund প্রদান করা হতে পারে।"
        ]
      },
      {
        id: 5,
        title: "রিফান্ডের পদ্ধতি",
        points: [
          "Refund অনুমোদিত হলে সম্ভব হলে যে Payment Method-এর মাধ্যমে টাকা প্রদান করা হয়েছিল, সেই মাধ্যমেই Refund করা হবে।",
          "Payment Gateway, ব্যাংক বা সংশ্লিষ্ট Payment Provider-এর কারণে Refund সম্পন্ন হতে অতিরিক্ত সময় লাগতে পারে।"
        ]
      },
      {
        id: 6,
        title: "Refund Request",
        points: [
          "Refund-এর জন্য যোগাযোগ করার সময় Transaction ID, Payment-এর তথ্য এবং সমস্যার সংক্ষিপ্ত বিবরণ প্রদান করতে হবে।",
          "প্রতিটি Refund Request আলাদাভাবে যাচাই করা হবে এবং প্রযোজ্য আইন ও EduHunters-এর নীতিমালা অনুযায়ী সিদ্ধান্ত নেওয়া হবে।"
        ]
      },
      {
        id: 7,
        title: "যোগাযোগ",
        points: [
          "Email: support@eduhunters.com",
          "WhatsApp: +880 1700-000000",
          "Support Time: সকাল ১০:০০ টা - রাত ১০:০০ টা (প্রতিদিন)"
        ]
      }
    ]
  },
  privacyPolicy: {
    lastUpdated: "৫ অক্টোবর, ২০২৬",
    intro: "EduHunters ওয়েবসাইটে আমাদের প্রধান অগ্রাধিকারগুলির মধ্যে একটি হল আমাদের ইউজার ও শিক্ষার্থীদের তথ্যের গোপনীয়তা। EduHunters ওয়েবসাইট থেকে আমরা কী কী তথ্য সংগ্রহ করি এবং কীভাবে সেটি ব্যবহার করি, সে সম্পর্কে বিস্তারিত তথ্য এই ডকুমেন্টে রয়েছে।",
    clauses: [
      {
        id: 1,
        title: "সম্মতি ও নীতিমালা",
        points: [
          "আমাদের ওয়েবসাইট ব্যবহার করে, আপনি এতদ্বারা আমাদের প্রাইভেসি পলিসি এবং শর্তাবলীতে সম্মত হচ্ছেন বলে ধরে নেওয়া হবে।",
          "আপনার অনুমতি ব্যতীত ব্যক্তিগত তথ্য কারো কাছে শেয়ার বা বিক্রয় করা হয় না।"
        ]
      },
      {
        id: 2,
        title: "আমরা কী কী তথ্য সংগ্রহ করি",
        points: [
          "অ্যাকাউন্ট খোলার সময় নাম, মোবাইল নম্বর, ইমেইল এড্রেস ইত্যাদি তথ্য সংগ্রহ করা হয়।",
          "আপনি যদি সরাসরি আমাদের সাথে যোগাযোগ করেন, আমরা আপনার নাম, ফোন নম্বর ও সহায়তার মেসেজ নিরাপদে সংরক্ষণ করি।"
        ]
      },
      {
        id: 3,
        title: "ব্যক্তিগত পাসওয়ার্ডের গোপনীয়তা",
        points: [
          "লগইন পাসওয়ার্ড আমাদের ডাটাবেজে ক্রিপ্টোগ্রাফিক হ্যাশ আকারে সংরক্ষিত থাকে, যা সিস্টেম অ্যাডমিনরাও দেখতে পারেন না।",
          "পাসওয়ার্ডের গোপনীয়তা রক্ষার স্বার্থে কখনো আপনার পাসওয়ার্ড কারো সাথে শেয়ার না করার জন্য অনুরোধ করা হচ্ছে।"
        ]
      },
      {
        id: 4,
        title: "আমরা কীভাবে আপনার তথ্য ব্যবহার করি",
        points: [
          "আমাদের ওয়েবসাইটে কোর্স ও এক্সাম পরিচালনা এবং অ্যাক্সেস রক্ষণাবেক্ষণ করার জন্য।",
          "ওয়েবসাইটের ব্রাউজিং অভিজ্ঞতা আরো উন্নত ও মসৃণ করার জন্য।",
          "জরুরি একাডেমিক আপডেট, নোটিফিকেশন ও এসএমএস বার্তা প্রেরণের জন্য।",
          "কোনো ধরনের অনলাইন জালিয়াতি ও পাইরেসি প্রতিরোধে।"
        ]
      },
      {
        id: 5,
        title: "লগ ফাইল ও কুকিজ",
        points: [
          "ইউজার এক্সপেরিয়েন্স ও সিকিউরিটি পর্যবেক্ষণে স্ট্যান্ডার্ড এনক্রিপ্টেড সেশন ও কুকিজ ব্যবহার করা হয়, যা ব্যক্তিগতভাবে শনাক্তযোগ্য নয়।"
        ]
      },
      {
        id: 6,
        title: "যোগাযোগ ও হেল্পডেস্ক",
        points: [
          "Email: support@eduhunters.com",
          "WhatsApp: +880 1700-000000",
          "Support Time: সকাল ১০:০০ টা - রাত ১০:০০ টা (প্রতিদিন)"
        ]
      }
    ]
  }
};
