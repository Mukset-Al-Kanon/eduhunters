/**
 * physicsFinishingTouchData.js
 * Modularized data backup and hardcoded fallback for:
 * Physics 1st paper Finishing Touch Series (course-1791887161017)
 * Contains 5 complete chapters with video lectures, PDFs, and 50-MCQ quizzes (250 questions total).
 */
import { physicsThumbnail } from './physicsChapters/thumbnail.js';
import { lesson1 } from './physicsChapters/chapter1_measurement.js';
import { lesson2 } from './physicsChapters/chapter2_vectors.js';
import { lesson3 } from './physicsChapters/chapter3_dynamics.js';
import { lesson4 } from './physicsChapters/chapter4_newtonian.js';
import { lesson5 } from './physicsChapters/chapter5_work_power.js';

export const physicsFinishingTouchCourseData = {
  id: "course-1791887161017",
  slug: "physics-finishing-touch-series",
  image: physicsThumbnail,
  title: "Physics Finishing Touch Series",
  tagline: "",
  category: "Course",
  features: [
    "HD কোয়ালিটি লাইভ ও রেকর্ডেড ক্লাস",
    "অধ্যায়ভিত্তিক লেকচার নোট ও প্র্যাকটিস শিট",
    "এক্সক্লুসিভ এক্সাম ও সলভ ক্লাস",
    "২৪/৭ টেলিগ্রাম ডাউট সলভিং সাপোর্ট"
  ],
  isActive: true,
  isBundle: false,
  aboutText: "প্রোগ্রাম ফিচার্স (Program Features: \n\nটোটাল ২১টি ক্লাসের মাধ্যমে মেডিকেল ফিজিক্সে 15/15 নিশ্চিতকরণ!\n\nফিজিক্স ১ম পত্র:  ১০টি চ্যাপ্টারের জন্য ১০টি ক্লাস \n\nফিজিক্স ২য় পত্র:  ১১টি চ্যাপ্টারের জন্য ১১টি ক্লাস \n\nএক্সক্লুসিভ ট্রিকস & হ্যান্ড ক্যালকুলেশন হ্যাকস\n\n১৫০ পেইজের ফিনিশিং টাচ বইয়ের দাগানো পিডিএফ\n\nপ্রতি চ্যাপটার এর উপর ১৫-৩০ মিনিটের কমপ্যাক্ট ক্লা",
  salePrice: 499,
  description: "",
  regularPrice: 999,
  supportPhone: "01342227935",
  totalClasses: "21",
  studentsCount: "১২৫০+",
  previewVideoUrl: "",
  curriculum: [
    {
      id: "sec-1791887600016",
      title: "Physics 1st Paper",
      lessons: [
        lesson1,
        lesson2,
        lesson3,
        lesson4,
        lesson5
      ]
    },
    {
      id: "sec-physics-2nd-paper",
      name: "Physics 2nd Paper",
      title: "Physics 2nd Paper",
      chapters: [],
      lessons: []
    }
  ]
};
