export const heroSlidesData = [
  {
    id: 1,
    title: "Extra Info কভার মাত্র ৩ মিনিটে! - As Sami Islam",
    image: "/slides/slide-extra-info.jpg",
    link: "/courses",
    type: "course"
  },
  {
    id: 2,
    title: "৩০ দিনে Master English শেষ করার মিশন",
    image: "/slides/slide-master-english-30days.png",
    link: "/courses",
    type: "course"
  },
  {
    id: 3,
    title: "Noun and Its Classification - মাত্র ৩০ দিনে (Day-1)",
    image: "/slides/slide-noun-day1.png",
    link: "/courses",
    type: "course"
  }
];

export const homeStatsData = [
  { value: "5000+", label: "Students" },
  { value: "50000+", label: "Questions" },
  { value: "800+", label: "Exams" }
];

import { freeCoursesData } from './freeCoursesData';
import { EXAM_BATCHES_AS_COURSES } from './examCategoriesData';

export const categoriesList = [
  "সকল",
  "EXAM BATCH",
  "Medical"
];

export const homeCoursesData = [
  {
    id: "master-english-30-days",
    title: "৩০ দিনে Master English শেষ করার মিশন",
    category: "Free",
    isBundle: false,
    isFree: true,
    image: "/master_english_30_days.png",
    description: "৩০ দিনে সম্পূর্ণ ইংরেজি ব্যাকরণ ও ভোকাবুলারি আয়ত্ত করার ফ্রি স্পেশাল কোর্স!",
    salePrice: 0,
    regularPrice: 1500,
    slug: "master-english-30-days",
    playlistId: "PLCOrbehX14ag"
  },
  ...freeCoursesData.map(c => ({
    id: c.id,
    title: c.title,
    category: c.category,
    isBundle: c.isBundle,
    isFree: c.isFree,
    image: c.image,
    description: c.description,
    salePrice: c.salePrice,
    regularPrice: c.regularPrice,
    slug: c.slug,
    playlistId: c.playlistId
  })),
  ...EXAM_BATCHES_AS_COURSES
];

export const instructorsData = [
  {
    id: 1,
    name: "Dr. As Sami Islam",
    badge: "SAMI",
    designation: "Founder & Instructor",
    bio: "Shaheed Suhrawardy Medical College\nEx-DMCian",
    image: "https://assets.codervai.com/teachers/1781365851410-cropped-image.webp",
    yt: null
  },
  {
    id: 2,
    name: "Tahmid Hasan",
    badge: "Tahmid",
    designation: "FOUNDER & CTO",
    bio: "Department of Civil Engineering, BUET\nEx-Notre Dame College",
    image: "https://assets.codervai.com/teachers/1781365928120-cropped-image.webp",
    yt: null
  },
  {
    id: 3,
    name: "SANJID SIRAJ",
    badge: "SANJID",
    designation: "CEO AND FOUNDER",
    bio: "Dhaka Medical College\nDMC 2ND",
    image: "https://assets.codervai.com/teachers/1781366052322-cropped-image.webp",
    yt: null
  },
  {
    id: 4,
    name: "Tofayel Ahmed",
    badge: "Tofayel",
    designation: "CEO AND FOUNDER",
    bio: "Department of Computer Science & Engineering,\nBangladesh University of Engineering and Technology\nRank 1st (2024-25 session)",
    image: "https://assets.codervai.com/teachers/1781363906472-cropped-image.webp",
    yt: "https://youtube.com/@eduhunters"
  },
  {
    id: 5,
    name: "Nazmuddin Al Aquib",
    badge: "Nazmuddin",
    designation: "PHYSICS INSTRUCTOR",
    bio: "DMC 62TH\nMBBS 2ND YEAR",
    image: "https://assets.codervai.com/teachers/1781465492086-cropped-image.webp",
    yt: null
  },
  {
    id: 6,
    name: "Jaidul Islam Nahian",
    badge: "Jaidul",
    designation: "MENTOR",
    bio: "Chittagong Medical College",
    image: "https://assets.codervai.com/teachers/1781515586459-cropped-image.webp",
    yt: null
  },
  {
    id: 7,
    name: "Sk Tasnim Ferdaus",
    badge: "Sk",
    designation: "FOUNDER AND INSTRUCTOR",
    bio: "Dhaka Medical College (DMC-3rd)",
    image: "https://assets.codervai.com/teachers/1788702054420-cropped-image.webp",
    yt: null
  }
];

export const freeVideosData = [
  {
    id: 1,
    videoId: "rMGOI-A5czA",
    title: "টপাররা কোনোদিনও এই মেথড কারো সাথে শেয়ার করবেনা | Admission Hack",
    desc: "টপাররা কোনোদিনও এই মেথড কারো সাথে শেয়ার করবেনা | Admission Hack"
  },
  {
    id: 2,
    videoId: "8aIGBh4RLuA",
    title: "অ্যাডমিশন টাইমে Topper-রা যেভাবে গ্যাপ পড়ে যাওয়া পড়াগুলো Fillup করে",
    desc: "অ্যাডমিশন টাইমে Topper-রা যেভাবে গ্যাপ পড়ে যাওয়া পড়াগুলো Fillup করে"
  },
  {
    id: 3,
    videoId: "CdNOjNnw0tU",
    title: "চান্স পাওয়ার ক্ষেত্রে আদেও কি কোচিংয়ের মার্ক Matter করে? | Admission Coaching | As Sami Islam",
    desc: "চান্স পাওয়ার ক্ষেত্রে আদেও কি কোচিংয়ের মার্ক Matter করে? | Admission Coaching | As Sami Islam"
  },
  {
    id: 4,
    videoId: "wCQ-oXOFj68",
    title: "HSC 26- এই ট্রিকগুলো জানলে Retina-র সবগুলো ডেইলিতে ৪৫+মার্ক থাকবে।",
    desc: "HSC 26- এই ট্রিকগুলো জানলে Retina-র সবগুলো ডেইলিতে ৪৫+মার্ক থাকবে।"
  }
];

export const whyChooseUsData = [
  {
    number: "01",
    title: "সেরা ক্লাস কিউরেশন",
    desc: "অধ্যায়ভিত্তিকভাবে মানসম্মত ক্লাস ও গাইডলাইন সাজানো থাকে।"
  },
  {
    number: "02",
    title: "সিনিয়র মেন্টরশিপ",
    desc: "বুয়েট, মেডিকেল ও টপ পাবলিক বিশ্ববিদ্যালয়ের সিনিয়রদের টিপস ও সাজেশন।"
  },
  {
    number: "03",
    title: "অ্যানিমেটেড ভিডিও কোর্স",
    desc: "কঠিন টপিকগুলো ভিজ্যুয়ালি সহজ করে শেখার সুযোগ।"
  },
  {
    number: "04",
    title: "ডিজিটাল লার্নিং ম্যাটেরিয়াল",
    desc: "ইন্টারঅ্যাকটিভ বই ও সহায়ক ম্যাটেরিয়াল দিয়ে স্মার্ট প্রস্তুতি।"
  }
];

export const storeProductsData = [];

