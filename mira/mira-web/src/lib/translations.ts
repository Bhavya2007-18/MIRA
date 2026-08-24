export type WebSupportedLanguage = 'en' | 'as' | 'bn' | 'mni' | 'kha' | 'hi';

export interface WebLanguageOption {
  code: WebSupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  speechCode: string;
}

export const WEB_SUPPORTED_LANGUAGES: WebLanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', speechCode: 'en-US' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', flag: '🇮🇳', speechCode: 'as-IN' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳', speechCode: 'bn-IN' },
  { code: 'mni', name: 'Manipuri', nativeName: 'মৈতৈলোন্', flag: '🇮🇳', speechCode: 'mni-IN' },
  { code: 'kha', name: 'Khasi', nativeName: 'Ktien Khasi', flag: '🇮🇳', speechCode: 'en-IN' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', speechCode: 'hi-IN' }
];

export interface WebTranslationDictionary {
  portalTitle: string;
  portalSubtitle: string;
  dashboard: string;
  uploadPerson: string;
  signOut: string;
  googleVerified: string;
  linkedPatients: string;
  activeLanguage: string;
  
  // Dashboard Metrics & Headers
  clinicalStability: string;
  optimalResponse: string;
  totalSessions: string;
  totalSessionsSub: string;
  cognitiveStability: string;
  cognitiveStabilitySub: string;
  avgReactionSpeed: string;
  avgReactionSpeedSub: string;
  activeAlerts: string;
  activeAlertsSub: string;
  stableStatus: string;
  
  // Charts
  reactionTrendTitle: string;
  reactionTrendSubtitle: string;
  measuredReaction: string;
  alertBaseline: string;
  withinNormal: string;
  aboveThreshold: string;
  accuracyBreakdownTitle: string;
  accuracyBreakdownSubtitle: string;
  totalPlays: string;
  
  // Feed
  recentTelemetryTitle: string;
  recentTelemetrySubtitle: string;
  liveStream: string;
  optimalBadge: string;
  stableBadge: string;
  reviewBadge: string;
  duration: string;
  errors: string;
  
  // Upload Page
  prosthesisEngineTag: string;
  enrollLovedOnesTitle: string;
  enrollLovedOnesDesc: string;
  addNewMember: string;
  photoDropzone: string;
  dropzoneHint: string;
  dropzoneSub: string;
  presets: string;
  fullName: string;
  fullNamePlaceholder: string;
  relationLabel: string;
  relationPlaceholder: string;
  coreMemoryLabel: string;
  coreMemoryPlaceholder: string;
  coreMemoryHint: string;
  enrollButton: string;
  enrolledCircleTitle: string;
  syncedApp: string;
  testAudio: string;
  speakingAudio: string;
  editMemory: string;
  saveChanges: string;
  cancel: string;
  delete: string;
  
  // Login Page
  caretakerSignIn: string;
  caretakerSignInSub: string;
  patientIdLabel: string;
  patientIdPlaceholder: string;
  patientIdHint: string;
  signInWithGoogle: string;
  authenticating: string;
  missionHeading: string;
  missionSub: string;
  hipaaReady: string;
}

export const WEB_TRANSLATIONS: Record<WebSupportedLanguage, WebTranslationDictionary> = {
  en: {
    portalTitle: 'MIRA',
    portalSubtitle: 'CARETAKER TELEMETRY',
    dashboard: 'Dashboard',
    uploadPerson: 'Upload Person',
    signOut: 'Sign Out',
    googleVerified: 'Google Verified',
    linkedPatients: 'Linked Patients',
    activeLanguage: 'Language',

    clinicalStability: 'Clinical Stability',
    optimalResponse: 'Optimal Response',
    totalSessions: 'Total Sessions Completed',
    totalSessionsSub: '+18 sessions completed this week',
    cognitiveStability: 'Cognitive Stability Index',
    cognitiveStabilitySub: 'Calculated across 4x4 cards, sound & logic',
    avgReactionSpeed: 'Avg Reaction Speed',
    avgReactionSpeedSub: '180ms faster than clinical baseline',
    activeAlerts: 'Active Alerts',
    activeAlertsSub: 'Zero degradation anomalies detected',
    stableStatus: 'Stable',

    reactionTrendTitle: 'Cognitive Reaction Time Trend',
    reactionTrendSubtitle: 'Continuous 14-day telemetry vs 1,500ms MCI clinical baseline',
    measuredReaction: 'Measured Speed (ms)',
    alertBaseline: 'Alert Threshold (1,500ms)',
    withinNormal: '✓ Within Normal Range',
    aboveThreshold: '⚠ Above Baseline Threshold',
    accuracyBreakdownTitle: '4x4 Cards, Sound & Logic Accuracy',
    accuracyBreakdownSubtitle: 'Performance across 3 cognitive game domains',
    totalPlays: 'Total Sessions',

    recentTelemetryTitle: 'Real-Time Cognitive Telemetry Feed',
    recentTelemetrySubtitle: 'Live game trials from patient mobile app with telemetry logging',
    liveStream: 'Live Telemetry',
    optimalBadge: 'Optimal',
    stableBadge: 'Stable',
    reviewBadge: 'Review',
    duration: 'Duration',
    errors: 'Errors',

    prosthesisEngineTag: 'Facial Memory Prosthesis Engine',
    enrollLovedOnesTitle: 'Enroll Family Members & Core Memories',
    enrollLovedOnesDesc: 'When the patient points their mobile camera at an enrolled loved one, MIRA automatically recognizes their face, announces their relationship, and speaks their personalized core memory snippet aloud.',
    addNewMember: 'Add New Family Member',
    photoDropzone: 'Photo Upload Dropzone',
    dropzoneHint: 'Drag & Drop portrait here, or pick an authentic NER preset below',
    dropzoneSub: 'Front-facing photos with clear lighting work best for AI Vision recognition',
    presets: 'Presets',
    fullName: 'Full Name',
    fullNamePlaceholder: 'e.g. Priya Hazarika',
    relationLabel: 'Relation to Patient',
    relationPlaceholder: 'e.g. Daughter (Guwahati)',
    coreMemoryLabel: 'Core Memory Prompt (Spoken Aloud)',
    coreMemoryPlaceholder: 'e.g. Loves to prepare warm Assam CTC tea with ginger for you every morning at 7:30 AM.',
    coreMemoryHint: 'Keep it sensory, uplifting, and specific to evoke recognition without cognitive distress.',
    enrollButton: 'Enroll Memory Prosthetic',
    enrolledCircleTitle: 'Enrolled Family & Loved Ones',
    syncedApp: 'Synced with Mobile App',
    testAudio: 'Test Voice',
    speakingAudio: 'Speaking...',
    editMemory: 'Edit Enrolled Memory',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    delete: 'Delete',

    caretakerSignIn: 'Caretaker Sign In',
    caretakerSignInSub: 'Sign in with your Google account to access clinical telemetry & family memory bank',
    patientIdLabel: 'Patient ID / Linking Code',
    patientIdPlaceholder: 'e.g. MIRA-8821',
    patientIdHint: 'Found on the patient’s MIRA Mobile home screen.',
    signInWithGoogle: 'Sign in with Google',
    authenticating: 'Authenticating with Google...',
    missionHeading: 'Empowering Dignity & Memory for Dementia Patients.',
    missionSub: 'Monitor real-time cognitive stability, track reaction times against clinical baselines, and remotely manage family memory prosthetics from any browser.',
    hipaaReady: 'Private & Caretaker Linked'
  },

  as: {
    portalTitle: 'মিৰা (MIRA)',
    portalSubtitle: 'যত্নশীল পৰিয়ালৰ প’ৰ্টেল',
    dashboard: 'ডেশ্বব’ৰ্ড',
    uploadPerson: 'আপোনজনক যোগ কৰক',
    signOut: 'প্ৰস্থান',
    googleVerified: 'গুগল প্ৰমাণিত',
    linkedPatients: 'সংযোজিত ব্যক্তি',
    activeLanguage: 'ভাষা',

    clinicalStability: 'স্বাস্থ্যৰ স্থিৰতা',
    optimalResponse: 'উত্তম প্ৰতিক্ৰিয়া',
    totalSessions: 'মুঠ খেলৰ সংখ্যা',
    totalSessionsSub: 'এই সপ্তাহত ১৮টা খেল সম্পন্ন হৈছে',
    cognitiveStability: 'স্মৃতি স্থিৰতা সূচক',
    cognitiveStabilitySub: '৪x৪ কাৰ্ড, শব্দ আৰু গণিতৰ আধাৰত',
    avgReactionSpeed: 'গড় প্ৰতিক্ৰিয়াৰ গতি',
    avgReactionSpeedSub: 'স্বাভাৱিক মাত্ৰাতকৈ ১৮০ মিল্লিছেকেণ্ড ক্ষিপ্ৰ',
    activeAlerts: 'সতৰ্কবাৰ্তা',
    activeAlertsSub: 'কোনো অৱনতিৰ সংকেত নাই',
    stableStatus: 'সুস্থিৰ',

    reactionTrendTitle: 'প্ৰতিক্ৰিয়া সময়ৰ ধাৰা',
    reactionTrendSubtitle: '১৪ দিনৰ নিৰন্তৰ তথ্য বনাম ১,৫০০ মিল্লিছেকেণ্ড সীমা',
    measuredReaction: 'পৰিমাপ কৰা গতি (ms)',
    alertBaseline: 'সতৰ্কতাৰ সীমা (1,500ms)',
    withinNormal: '✓ স্বাভাৱিক মাত্ৰাৰ ভিতৰত',
    aboveThreshold: '⚠ সীমাৰ বাহিৰত',
    accuracyBreakdownTitle: 'কাৰ্ড, শব্দ আৰু গণিতৰ নিখুঁততা',
    accuracyBreakdownSubtitle: '৩টা খেলৰ ক্ষেত্ৰত দক্ষতাৰ পৰিসংখ্যা',
    totalPlays: 'মুঠ খেল',

    recentTelemetryTitle: 'পোনপটীয়া খেলৰ তথ্য সংগ্ৰহ',
    recentTelemetrySubtitle: 'ৰোগীৰ মোবাইল এপৰ পৰা প্ৰাপ্ত লাইভ তথ্য',
    liveStream: 'লাইভ তথ্য',
    optimalBadge: 'উত্তম',
    stableBadge: 'স্থিৰ',
    reviewBadge: 'নিৰীক্ষণ',
    duration: 'সময়',
    errors: 'ভুল',

    prosthesisEngineTag: 'মুখ চিনাক্ত আৰু স্মৃতি সহায়ক ইঞ্জিন',
    enrollLovedOnesTitle: 'পৰিয়ালৰ সদস্য আৰু স্মৃতি যোগ কৰক',
    enrollLovedOnesDesc: 'যেতিয়া ৰোগীয়ে মোবাইলৰ কেমেৰা পৰিয়ালৰ সদস্যৰ ওপৰত ধৰে, মিৰাই মুখখন চিনি পায় আৰু সম্পৰ্ক তথা বিশেষ স্মৃতিটো উচ্চাৰণ কৰি শুনায়।',
    addNewMember: 'নতুন আত্মীয় যোগ কৰক',
    photoDropzone: 'ফটো আপলোড এলেকা',
    dropzoneHint: 'ছবি ইয়াত টানি আনক বা তলৰ ছবি বাছক',
    dropzoneSub: 'স্পষ্ট পোহৰত তোলা সন্মুখৰ ছবি এআই চিনাক্তকৰণৰ বাবে শ্ৰেষ্ঠ',
    presets: 'নমুনা ছবি',
    fullName: 'সম্পূৰ্ণ নাম',
    fullNamePlaceholder: 'যেনে: প্ৰিয়া হাজৰিকা',
    relationLabel: 'ৰোগীৰ সৈতে সম্পৰ্ক',
    relationPlaceholder: 'যেনে: কন্যা (গুৱাহাটী)',
    coreMemoryLabel: 'মূল স্মৃতিৰ বাৰ্তা (পঢ়ি শুনাওক)',
    coreMemoryPlaceholder: 'যেনে: ৰাতিপুৱা ৭:৩০ বজাত আপোনাৰ বাবে আদা চাহ বনায়।',
    coreMemoryHint: 'স্মৃতি জাগ্ৰত কৰিবলৈ ইতিবাচক আৰু সুন্দৰ স্মৃতি বাছক।',
    enrollButton: 'স্মৃতি প’ৰ্টেলত যোগ কৰক',
    enrolledCircleTitle: 'সংযোজিত পৰিয়াল আৰু আত্মীয়',
    syncedApp: 'মোবাইল এপৰ সৈতে সংযোজিত',
    testAudio: 'কণ্ঠ পৰীক্ষা',
    speakingAudio: 'কৈ থকা হৈছে...',
    editMemory: 'স্মৃতি সম্পাদনা কৰক',
    saveChanges: 'সংৰক্ষণ কৰক',
    cancel: 'বাতিল',
    delete: 'মচি পেলাওক',

    caretakerSignIn: 'যত্নশীল ব্যক্তিৰ প্ৰৱেশ',
    caretakerSignInSub: 'গুগল একাউণ্টৰ জৰিয়তে তথ্য আৰু স্মৃতি ভঁৰালত প্ৰৱেশ কৰক',
    patientIdLabel: 'ৰোগীৰ ক’ড / আইডি',
    patientIdPlaceholder: 'যেনে: MIRA-8821',
    patientIdHint: 'ৰোগীৰ মিৰা মোবাইল এপৰ হোম স্ক্ৰীণত উপলব্ধ।',
    signInWithGoogle: 'গুগলৰ সৈতে প্ৰৱেশ কৰক',
    authenticating: 'প্ৰৱেশ কৰা হৈছে...',
    missionHeading: 'স্মৃতিহীনতাৰ ৰোগীৰ বাবে মৰ্যাদা আৰু স্মৃতিৰ সুৰক্ষা।',
    missionSub: 'যিকোনো ব্ৰাউজাৰৰ পৰা ক্ষিপ্ৰতা আৰু স্মৃতিৰ তথ্য নিৰীক্ষণ কৰক।',
    hipaaReady: 'সম্পূৰ্ণ সুৰক্ষিত আৰু পৰিয়ালৰ সৈতে সংযুক্ত'
  },

  bn: {
    portalTitle: 'মিরা (MIRA)',
    portalSubtitle: 'পরিচর্যাকরীর ড্যাশবোর্ড',
    dashboard: 'ড্যাশবোর্ড',
    uploadPerson: 'প্রিয়জন যোগ করুন',
    signOut: 'প্রস্থান',
    googleVerified: 'গুগল যাচাইকৃত',
    linkedPatients: 'সংযুক্ত রোগী',
    activeLanguage: 'ভাষা',

    clinicalStability: 'ক্লিনিকাল স্থায়িত্ব',
    optimalResponse: 'অনুকূল প্রতিক্রিয়া',
    totalSessions: 'মোট সম্পন্ন সেশন',
    totalSessionsSub: 'এই সপ্তাহে ১৮টি সেশন সম্পন্ন',
    cognitiveStability: 'স্মৃতি স্থায়িত্ব সূচক',
    cognitiveStabilitySub: '৪x৪ কার্ড, শব্দ ও গণিতের ওপর ভিত্তি করে',
    avgReactionSpeed: 'গড় প্রতিক্রিয়া গতি',
    avgReactionSpeedSub: 'স্বাভাবিক গতির চেয়ে ১৮০ms দ্রুত',
    activeAlerts: 'সতর্কবার্তা',
    activeAlertsSub: 'কোনো অবনতির লক্ষণ নেই',
    stableStatus: 'স্থিতিশীল',

    reactionTrendTitle: 'প্রতিক্রিয়া সময়ের প্রবণতা',
    reactionTrendSubtitle: '১৪ দিনের ডেটা বনাম ১,৫০০ms স্ট্যান্ডার্ড বেসলাইন',
    measuredReaction: 'পরিমাপকৃত গতি (ms)',
    alertBaseline: 'সতর্কতা সীমা (1,500ms)',
    withinNormal: '✓ স্বাভাবিক সীমার মধ্যে',
    aboveThreshold: '⚠ সীমার বাইরে',
    accuracyBreakdownTitle: 'কার্ড, শব্দ ও গণিতের নির্ভুলতা',
    accuracyBreakdownSubtitle: '৩টি কগনিটিভ ডোমেনে দক্ষতার পরিসংখ্যান',
    totalPlays: 'মোট সেশন',

    recentTelemetryTitle: 'রিয়েল-টাইম টেলিমেট্রি ফিড',
    recentTelemetrySubtitle: 'পেশেন্ট মোবাইল অ্যাপ থেকে লাইভ তথ্য স্ট্রিম',
    liveStream: 'লাইভ স্ট্রিম',
    optimalBadge: 'সেরা',
    stableBadge: 'স্থিতিশীল',
    reviewBadge: 'পর্যালোচনা',
    duration: 'সময়',
    errors: 'ভুল',

    prosthesisEngineTag: 'ফেসিয়াল মেমোরি প্রস্থেটিক ইঞ্জিন',
    enrollLovedOnesTitle: 'পরিজন ও বিশেষ স্মৃতি যোগ করুন',
    enrollLovedOnesDesc: 'রোগী যখন মোবাইল ক্যামেরা কারো দিকে ধরবেন, মিরা মুখ চিনে সম্পর্ক ও স্মৃতি মুখে বলে দেবে।',
    addNewMember: 'নতুন পরিজন যোগ করুন',
    photoDropzone: 'ছবি আপলোড জোন',
    dropzoneHint: 'ছবি ড্রপ করুন অথবা প্রিসেট বেছে নিন',
    dropzoneSub: 'সামনাসামনি পরিষ্কার আলোয় তোলা ছবি এআই এর জন্য সবচেয়ে ভালো',
    presets: 'প্রিসেট ছবি',
    fullName: 'সম্পূর্ণ নাম',
    fullNamePlaceholder: 'যেমন: প্রিয়া হাজারিকা',
    relationLabel: 'সম্পর্ক',
    relationPlaceholder: 'যেমন: কন্যা (গুয়াহাটি)',
    coreMemoryLabel: 'মূল স্মৃতির বাক্য (মুখে বলা হবে)',
    coreMemoryPlaceholder: 'যেমন: প্রতিদিন সকালে আপনার সাথে আদা চা বানায়।',
    coreMemoryHint: 'ইতিবাচক ও স্পষ্ট স্মৃতি উল্লেখ করুন।',
    enrollButton: 'স্মৃতিভাণ্ডারে যোগ করুন',
    enrolledCircleTitle: 'যুক্ত পরিবার ও পরিজন',
    syncedApp: 'মোবাইলের সাথে সিঙ্ক করা',
    testAudio: 'অডিও শুনুন',
    speakingAudio: 'বলা হচ্ছে...',
    editMemory: 'স্মৃতি সম্পাদনা',
    saveChanges: 'সংরক্ষণ',
    cancel: 'বাতিল',
    delete: 'মুছুন',

    caretakerSignIn: 'পরিচর্যাকরীর সাইন ইন',
    caretakerSignInSub: 'গুগল অ্যাকাউন্টের মাধ্যমে টেলিমেট্রি অ্যাক্সেস করুন',
    patientIdLabel: 'রোগীর আইডি / কোড',
    patientIdPlaceholder: 'যেমন: MIRA-8821',
    patientIdHint: 'পেশেন্টের মিরা মোবাইল অ্যাপের মূল পর্দায় পাবেন।',
    signInWithGoogle: 'গুগল দিয়ে সাইন ইন',
    authenticating: 'সাইন ইন হচ্ছে...',
    missionHeading: 'ডিমেনশিয়া রোগীদের মর্যাদা ও স্মৃতির সুরক্ষা।',
    missionSub: 'ব্রাউজার থেকে রোগীর মেমোরি ট্রেনিং ও স্মৃতি পর্যবেক্ষণ করুন।',
    hipaaReady: 'সম্পূর্ণ সুরক্ষিত ও সংযুক্ত'
  },

  mni: {
    portalTitle: 'মিরা (MIRA)',
    portalSubtitle: 'কেয়ারটেকরগী পোর্তেল',
    dashboard: 'দেশবোর্ড',
    uploadPerson: 'মী হাপচিনবা',
    signOut: 'থোকপা',
    googleVerified: 'গুগলনা চপ চারে',
    linkedPatients: 'শম্নরবা মীওই',
    activeLanguage: 'লোন',

    clinicalStability: 'হকশেলগী ফিভম',
    optimalResponse: 'য়াম্না ফবা পাউখুম',
    totalSessions: 'লোইখ্রবা শান্নবা মশীং',
    totalSessionsSub: 'চয়োল অসিদা ১৮ লোইরে',
    cognitiveStability: 'নীংশিং থৌনাগী চাং',
    cognitiveStabilitySub: '৪x৪ কাৰ্দ, খোঞ্জেল অমসুং মশীংদা য়ুম্ফম ওইবা',
    avgReactionSpeed: 'চাংচৎ পাউখুম খোঙজেল',
    avgReactionSpeedSub: 'স্বাভাবিক চাংদগী ১৮০ms থুই',
    activeAlerts: 'চেকশিন-ৱা',
    activeAlertsSub: 'অশোইবা অমত্তা য়াওদে',
    stableStatus: 'সুস্থির',

    reactionTrendTitle: 'খোঙজেলগী ফিভম',
    reactionTrendSubtitle: 'নুমিৎ ১৪ গী রিয়েল টাইম রেকোর্দ',
    measuredReaction: 'খোঙজেল (ms)',
    alertBaseline: 'চেকশিন সীমা (1,500ms)',
    withinNormal: '✓ স্বাভাবিক মনুংদা লৈ',
    aboveThreshold: '⚠ সীমার ৱাংমা লৈ',
    accuracyBreakdownTitle: 'কাৰ্দ, খোঞ্জেল অমসুং মশীংগী চপ চাবা',
    accuracyBreakdownSubtitle: 'শান্নপোৎ অহুমগী মখলগী চাং',
    totalPlays: 'শান্নবা পুম্নমক',

    recentTelemetryTitle: 'লাইভ টেলিমেট্রি ফীদ',
    recentTelemetrySubtitle: 'পেশেন্ট মোবাইল এপ্লিকেসন্দগী লাইভ ফীদ',
    liveStream: 'লাইভ ফীদ',
    optimalBadge: 'খ্বাইদগী ফবা',
    stableBadge: 'সুস্থির',
    reviewBadge: 'য়েংশিনবা',
    duration: 'মতম',
    errors: 'অশোইবা',

    prosthesisEngineTag: 'মশক খঙদোকপা অমসুং নীংশিং ইঞ্জিন',
    enrollLovedOnesTitle: 'ইমুংগী মী অমসুং নীংশিং হাপচিনবা',
    enrollLovedOnesDesc: 'মোবাইল কেমেরা মীওইদুগী মাইকৈদা থম্বদা মিরা এআইনা মশক খঙদোক্লগা ৱারী ফোঙনা হায়রি।',
    addNewMember: 'অনৌবা মী হাপউ',
    photoDropzone: 'ফোতো হাপফম',
    dropzoneHint: 'ফোতো চিংথদুনা থম্মু অথবা প্রিসেত খনউ',
    dropzoneSub: 'ময়েক শেংবা ফোতোনা এআইদা য়াম্না মতেং ওই',
    presets: 'প্রিসেতশিং',
    fullName: 'মপুং ফাবা মমিং',
    fullNamePlaceholder: 'য়েনে: প্রিয়া হাজারিকা',
    relationLabel: 'মরী',
    relationPlaceholder: 'য়েনে: নচানুপী (গুৱাহাটী)',
    coreMemoryLabel: 'মরুওইবা নীংশিংগী ৱারী',
    coreMemoryPlaceholder: 'য়েনে: অয়ুক খুদিংগী চা শাদুনা থকপা।',
    coreMemoryHint: 'হরাওবা অমসুং নুংশিবা নীংশিং হাপউ।',
    enrollButton: 'নীংশিংদা হাপচিনবা',
    enrolledCircleTitle: 'হাপচিল্লবা ইমুং-মনুং',
    syncedApp: 'মোবাইল এপকা শম্নরে',
    testAudio: 'খোঞ্জেল তাউ',
    speakingAudio: 'হাইরি...',
    editMemory: 'শেমদোকপা',
    saveChanges: 'সংরক্ষণ',
    cancel: 'লেপপা',
    delete: 'মুত্থৎপা',

    caretakerSignIn: 'কেয়ারটেকরগী চঙফম',
    caretakerSignInSub: 'গুগল একাউন্টগা লোয়ননা টেলিমেট্রি পোর্তেলদা চঙউ',
    patientIdLabel: 'আইডি / কোদ',
    patientIdPlaceholder: 'য়েনে: MIRA-8821',
    patientIdHint: 'পেশেন্ট মোবাইল স্ক্রিনদা ফংগনি।',
    signInWithGoogle: 'গুগলগা লোয়ননা চঙবা',
    authenticating: 'চঙলি...',
    missionHeading: 'নীংশিংবা ৱাৎপা মীওইশিংগী ইকায় খুম্নবা ঙাকপা।',
    missionSub: 'ব্রাউজার খুদিংমক্তগী হকশেল অমসুং নীংশিং য়েংশিনবা।',
    hipaaReady: 'অরুবা অমসুং শম্নবা'
  },

  kha: {
    portalTitle: 'MIRA',
    portalSubtitle: 'PORTAL JINGSUMAR',
    dashboard: 'Dashboard',
    uploadPerson: 'Thep Briew',
    signOut: 'Mih noh',
    googleVerified: 'La Pynskhem da Google',
    linkedPatients: 'Ki Nongpang ba la Iasoh',
    activeLanguage: 'Ktien',

    clinicalStability: 'Jingsuk ha ka Koit ka Khiah',
    optimalResponse: 'Jingtreikam Bha',
    totalSessions: 'Baroh ki Jingialeh',
    totalSessionsSub: '+18 tylli ki jingialeh kane ka taiew',
    cognitiveStability: 'Ka Bor Jingkynmaw',
    cognitiveStabilitySub: 'La khein na ki kot 4x4, sur bad jingkhein',
    avgReactionSpeed: 'Jingsuk ha ka por jubab',
    avgReactionSpeedSub: '180ms kham kloi ban ia ka rukom',
    activeAlerts: 'Jingmaham',
    activeAlertsSub: 'Ym don kano kano ka jinghiar',
    stableStatus: 'Skhem',

    reactionTrendTitle: 'Rukom Jingkloi ka Por Jubab',
    reactionTrendSubtitle: '14 sngi ka jingkhein pyrshah ia ka 1,500ms',
    measuredReaction: 'Jingkloi (ms)',
    alertBaseline: 'Jingmaham (1,500ms)',
    withinNormal: '✓ Don hapoh ka rukom',
    aboveThreshold: '⚠ Palat ia ka rukom',
    accuracyBreakdownTitle: 'Jingbiang ha ki Kot, Sur & Jingkhein',
    accuracyBreakdownSubtitle: 'Jinglah ha baroh 3 tylli ki jingialeh',
    totalPlays: 'Baroh ki Sosion',

    recentTelemetryTitle: 'Jingtip Telemetry ha ka Por ba shisha',
    recentTelemetrySubtitle: 'Jingtip live na ka mobile jong u nongpang',
    liveStream: 'Jingtip Live',
    optimalBadge: 'Bha Tam',
    stableBadge: 'Skhem',
    reviewBadge: 'Peit bniah',
    duration: 'Por',
    errors: 'Jingbakla',

    prosthesisEngineTag: 'Engine Jingithuh Dur & Jingkynmaw',
    enrollLovedOnesTitle: 'Thep ia kiba ieid & ki Jingkynmaw',
    enrollLovedOnesDesc: 'Mano mano ba u nongpang u peit da ka camera, ka MIRA kan ithuh bad kan kren jam ia ka kyrteng bad jingkynmaw.',
    addNewMember: 'Thep Briew Thymmai',
    photoDropzone: 'Buh Dur Hangne',
    dropzoneHint: 'Tring ka dur hangne lane jied na ki preset',
    dropzoneSub: 'Ki dur kiba shai ki kham iarap ia ka AI',
    presets: 'Ki Dur Preset',
    fullName: 'Kyrteng Bha',
    fullNamePlaceholder: 'kumba: Priya Hazarika',
    relationLabel: 'Jingiasoh bad u Nongpang',
    relationPlaceholder: 'kumba: Ka Khun (Guwahati)',
    coreMemoryLabel: 'Jingkynmaw ba kyrpang (Ban kren jam)',
    coreMemoryPlaceholder: 'kumba: Ka shet sha ryngkat bad phi man ka step.',
    coreMemoryHint: 'Buh ia ki jingkynmaw kiba pynsngewbha.',
    enrollButton: 'Thep ha ka Memory',
    enrolledCircleTitle: 'Kiba la don ha ka Memory',
    syncedApp: 'La iasoh bad ka Mobile',
    testAudio: 'Sngap Sur Kren',
    speakingAudio: 'Dang kren...',
    editMemory: 'Pynkylla Jingkynmaw',
    saveChanges: 'Kynshew',
    cancel: 'Wad',
    delete: 'Pynkhein',

    caretakerSignIn: 'Psiah u Nongsumar',
    caretakerSignInSub: 'Psiah da ka Google ban iohi ia ki jingkhein',
    patientIdLabel: 'Code / ID Nongpang',
    patientIdPlaceholder: 'kumba: MIRA-8821',
    patientIdHint: 'Don ha ka home screen jong ka app.',
    signInWithGoogle: 'Psiah da ka Google',
    authenticating: 'Dang psiah...',
    missionHeading: 'Ka Jingiarap ia ka Jingkynmaw jong kiba pang Dementia.',
    missionSub: 'Peit ia ka bor pyrkhat bad pyniaid ia ki jingkynmaw na kano kano ka browser.',
    hipaaReady: 'La Iada Bha & Iasoh'
  },

  hi: {
    portalTitle: 'मीरा (MIRA)',
    portalSubtitle: 'देखभालकर्ता पोर्टल',
    dashboard: 'डैशबोर्ड',
    uploadPerson: 'परिजन जोड़ें',
    signOut: 'साइन आउट',
    googleVerified: 'गूगल सत्यापित',
    linkedPatients: 'जुड़े हुए मरीज',
    activeLanguage: 'भाषा',

    clinicalStability: 'नैदानिक स्थिरता',
    optimalResponse: 'उत्कृष्ट प्रतिक्रिया',
    totalSessions: 'कुल पूर्ण सत्र',
    totalSessionsSub: 'इस सप्ताह १८ सत्र पूर्ण हुए',
    cognitiveStability: 'स्मृति स्थिरता सूचकांक',
    cognitiveStabilitySub: '४x४ कार्ड, ध्वनि और गणित के आधार पर',
    avgReactionSpeed: 'औसत प्रतिक्रिया गति',
    avgReactionSpeedSub: 'मानक से १८०ms अधिक तेज',
    activeAlerts: 'सक्रिय अलर्ट',
    activeAlertsSub: 'गिरावट का कोई संकेत नहीं',
    stableStatus: 'स्थिर',

    reactionTrendTitle: 'प्रतिक्रिया समय प्रवृत्ति',
    reactionTrendSubtitle: '१४ दिनों का डेटा बनाम १,५००ms बेसलाइन',
    measuredReaction: 'मापा गया समय (ms)',
    alertBaseline: 'अलर्ट सीमा (1,500ms)',
    withinNormal: '✓ सामान्य सीमा के भीतर',
    aboveThreshold: '⚠ सीमा से अधिक',
    accuracyBreakdownTitle: 'कार्ड, ध्वनि और गणित सटीकता',
    accuracyBreakdownSubtitle: '३ दिमागी खेलों में प्रदर्शन विवरण',
    totalPlays: 'कुल सत्र',

    recentTelemetryTitle: 'रीयल-टाइम टेलीमेट्री फीड',
    recentTelemetrySubtitle: 'रोगी के मोबाइल ऐप से लाइव गेम परिणाम',
    liveStream: 'लाइव स्ट्रीम',
    optimalBadge: 'उत्तम',
    stableBadge: 'स्थिर',
    reviewBadge: 'समीक्षा',
    duration: 'अवधि',
    errors: 'गलतियां',

    prosthesisEngineTag: 'चेहरा पहचान एवं स्मृति सहायक प्रणाली',
    enrollLovedOnesTitle: 'प्रियजनों और मुख्य यादों को जोड़ें',
    enrollLovedOnesDesc: 'जब मरीज मोबाइल कैमरा किसी प्रियजन पर करते हैं, मीरा चेहरा पहचानकर संबंध और याद बोलकर सुनाती है।',
    addNewMember: 'नया सदस्य जोड़ें',
    photoDropzone: 'फोटो अपलोड क्षेत्र',
    dropzoneHint: 'फोटो यहां खींचकर लाएं या नीचे से चुनें',
    dropzoneSub: 'स्पष्ट रोशनी वाली फोटो एआई पहचान के लिए सबसे उपयुक्त है',
    presets: 'पूर्वनिर्धारित फोटो',
    fullName: 'पूरा नाम',
    fullNamePlaceholder: 'उदा. प्रिया हजारिका',
    relationLabel: 'मरीज से संबंध',
    relationPlaceholder: 'उदा. सुपुत्री (गुवाहाटी)',
    coreMemoryLabel: 'मुख्य स्मृति संदेश (बोलकर सुनाया जाएगा)',
    coreMemoryPlaceholder: 'उदा. रोज़ सुबह ७:३० बजे आपके लिए असमिया चाय बनाती हैं।',
    coreMemoryHint: 'सकारात्मक और स्पष्ट यादें दर्ज करें।',
    enrollButton: 'स्मृति सहायक में जोड़ें',
    enrolledCircleTitle: 'दर्ज परिजन एवं मित्र',
    syncedApp: 'मोबाइल ऐप से सिंक',
    testAudio: 'आवाज़ जांचें',
    speakingAudio: 'बोल रहे हैं...',
    editMemory: 'स्मृति संपादित करें',
    saveChanges: 'बदलाव सहेजें',
    cancel: 'रद्द करें',
    delete: 'हटाएं',

    caretakerSignIn: 'देखभालकर्ता साइन इन',
    caretakerSignInSub: 'टेलीमेट्री और स्मृति बैंक तक पहुंचने के लिए गूगल से लॉगिन करें',
    patientIdLabel: 'मरीज आईडी / कोड',
    patientIdPlaceholder: 'उदा. MIRA-8821',
    patientIdHint: 'रोगी की मीरा मोबाइल होम स्क्रीन पर उपलब्ध है।',
    signInWithGoogle: 'गूगल से साइन इन करें',
    authenticating: 'लॉगिन हो रहा है...',
    missionHeading: 'डिमेंशिया रोगियों के आत्मसम्मान और स्मृति की सुरक्षा।',
    missionSub: 'ब्राउज़र से रोगी की संज्ञानात्मक स्थिति और पारिवारिक यादों का प्रबंधन करें।',
    hipaaReady: 'सुरक्षित और मरीज से जुड़ा'
  }
};

export const getWebTranslation = (lang: WebSupportedLanguage = 'en'): WebTranslationDictionary => {
  return WEB_TRANSLATIONS[lang] || WEB_TRANSLATIONS.en;
};
