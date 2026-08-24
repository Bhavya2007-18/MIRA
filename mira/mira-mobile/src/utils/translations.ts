export type SupportedLanguage = 'en' | 'as' | 'bn' | 'mni' | 'kha' | 'hi';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  speechCode: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', speechCode: 'en-US' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', flag: '🇮🇳', speechCode: 'as-IN' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳', speechCode: 'bn-IN' },
  { code: 'mni', name: 'Manipuri', nativeName: 'মৈতৈলোন্', flag: '🇮🇳', speechCode: 'mni-IN' },
  { code: 'kha', name: 'Khasi', nativeName: 'Ktien Khasi', flag: '🇮🇳', speechCode: 'en-IN' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', speechCode: 'hi-IN' }
];

export interface TranslationDictionary {
  // Navigation & Common
  appTitle: string;
  appSubtitle: string;
  home: string;
  back: string;
  done: string;
  cancel: string;
  save: string;
  saved: string;
  tapToContinue: string;
  voiceHelp: string;
  voiceAssistant: string;
  readingAloud: string;
  pauseVoice: string;
  screenInstructions: string;
  connectedCaretaker: string;
  
  // Home Screen
  goodMorning: string;
  aiVisionTitle: string;
  aiVisionSubtitle: string;
  aiVisionDesc: string;
  gamesTitle: string;
  gamesSubtitle: string;
  gamesDesc: string;
  uploadTitle: string;
  uploadSubtitle: string;
  uploadDesc: string;
  
  // Login Screen
  signInGoogle: string;
  signingIn: string;
  appMission: string;
  securityNotice: string;
  
  // AI Vision
  aiVisionActive: string;
  matchVerified: string;
  scanNext: string;
  coreMemoryPrompt: string;
  speakAloudBtn: string;
  
  // Brain Games Hub
  brainGamesTitle: string;
  brainGamesSubtitle: string;
  cardGameTitle: string;
  cardGameDesc: string;
  cardGameTag: string;
  auditoryGameTitle: string;
  auditoryGameDesc: string;
  auditoryGameTag: string;
  mathsGameTitle: string;
  mathsGameDesc: string;
  mathsGameTag: string;
  
  // 4x4 Card Game
  cardMatchTitle: string;
  cardMatchSubtitle: string;
  moves: string;
  errors: string;
  tapToFlip: string;
  matchFound: string;
  tryAgain: string;
  victoryTitle: string;
  victorySubtitle: string;
  playAgain: string;
  allGames: string;
  timeSpent: string;
  telemetrySaved: string;
  
  // Auditory Game
  auditoryTitle: string;
  auditorySubtitle: string;
  playSoundBtn: string;
  playingSound: string;
  whichSoundMatches: string;
  soundCorrect: string;
  soundWrong: string;
  soundMaster: string;
  soundMasterDesc: string;
  
  // Maths Game
  mathsTitle: string;
  mathsSubtitle: string;
  tapLarger: string;
  largerCorrect: string;
  smallerTryAgain: string;
  mathsStar: string;
  mathsStarDesc: string;
  
  // Upload Person
  uploadPersonTitle: string;
  uploadPersonSubtitle: string;
  choosePhoto: string;
  pickFamilyPreset: string;
  personName: string;
  personNamePlaceholder: string;
  relation: string;
  relationPlaceholder: string;
  coreMemoryLabel: string;
  coreMemoryPlaceholder: string;
  saveMemoryBtn: string;
  savedToMemories: string;
}

export const TRANSLATIONS: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    appTitle: 'MIRA',
    appSubtitle: 'Your Memory Companion',
    home: 'HOME',
    back: 'BACK',
    done: 'Done',
    cancel: 'Cancel',
    save: 'Save',
    saved: 'Saved',
    tapToContinue: 'Tap any card to continue. MIRA is here with you.',
    voiceHelp: '🔊 Tap for Voice Help',
    voiceAssistant: 'Voice Assistant',
    readingAloud: 'Reading Aloud...',
    pauseVoice: 'Tap to pause voice',
    screenInstructions: '🔊 Tap for voice instructions',
    connectedCaretaker: 'Connected with Caretaker',

    goodMorning: 'Good Morning',
    aiVisionTitle: 'AI VISION',
    aiVisionSubtitle: 'Who is this?',
    aiVisionDesc: 'Point camera to see names & memories',
    gamesTitle: 'BRAIN GAMES',
    gamesSubtitle: 'Memory exercises',
    gamesDesc: 'Cards, sounds, and number puzzles',
    uploadTitle: 'UPLOAD PERSON',
    uploadSubtitle: 'Add a loved one',
    uploadDesc: 'Save a family photo and core story',

    signInGoogle: 'Sign in with Google',
    signingIn: 'Signing you in securely...',
    appMission: 'Assisting your daily memory, recognizing loved ones, and exercising your mind.',
    securityNotice: 'Private & Secure Caretaker Connected',

    aiVisionActive: 'MIRA AI ACTIVE',
    matchVerified: 'Verified Match',
    scanNext: 'Scan Next Face',
    coreMemoryPrompt: 'CORE MEMORY PROMPT',
    speakAloudBtn: '🔊 Speak Aloud',

    brainGamesTitle: 'BRAIN GAMES',
    brainGamesSubtitle: 'Select an exercise to train your mind',
    cardGameTitle: '4x4 Memory Cards',
    cardGameDesc: 'Match 8 pairs of family & NER heritage',
    cardGameTag: 'VISUAL MEMORY (4x4)',
    auditoryGameTitle: 'Sound Recall',
    auditoryGameDesc: 'Listen to folk instruments & identify them',
    auditoryGameTag: 'ACOUSTIC RECOGNITION',
    mathsGameTitle: 'Number Compare',
    mathsGameDesc: 'Compare numbers: find the greater one',
    mathsGameTag: 'NUMERICAL LOGIC',

    cardMatchTitle: 'CARD MATCH (4x4)',
    cardMatchSubtitle: 'Find matching pairs of family & culture',
    moves: 'MOVES',
    errors: 'ERRORS',
    tapToFlip: 'TAP',
    matchFound: 'Match found!',
    tryAgain: 'Not a match, try again.',
    victoryTitle: 'Wonderful Job!',
    victorySubtitle: 'You matched all 8 pairs successfully.',
    playAgain: 'Play Again',
    allGames: 'All Games',
    timeSpent: 'Time',
    telemetrySaved: 'Telemetry saved to Caretaker portal',

    auditoryTitle: 'SOUND RECALL',
    auditorySubtitle: 'Listen carefully & identify the sound',
    playSoundBtn: 'Play Sound 🎵',
    playingSound: 'Playing Sound 🎵...',
    whichSoundMatches: 'Which picture made this sound?',
    soundCorrect: 'Correct! Great ear.',
    soundWrong: 'Not quite, listen again.',
    soundMaster: 'Sound Master!',
    soundMasterDesc: 'You recognized all regional sounds accurately.',

    mathsTitle: 'FIND THE GREATER',
    mathsSubtitle: 'Compare numbers & choose the larger one',
    tapLarger: 'Tap the LARGER number',
    largerCorrect: 'Correct! That number is greater.',
    smallerTryAgain: 'That number is smaller. Try the bigger one!',
    mathsStar: 'Maths Star!',
    mathsStarDesc: 'You found all greater numbers successfully.',

    uploadPersonTitle: 'ADD A LOVED ONE',
    uploadPersonSubtitle: 'Save face & memory prompt',
    choosePhoto: '1. CHOOSE PHOTO',
    pickFamilyPreset: 'Or pick a family portrait:',
    personName: "PERSON'S NAME",
    personNamePlaceholder: 'e.g. Priya Hazarika',
    relation: 'RELATION TO YOU',
    relationPlaceholder: 'e.g. Your Daughter (Guwahati)',
    coreMemoryLabel: 'CORE MEMORY PROMPT',
    coreMemoryPlaceholder: 'e.g. Loves to prepare warm Assam CTC tea for you every morning.',
    saveMemoryBtn: 'Save to Memories',
    savedToMemories: 'Saved to Memories!'
  },

  as: {
    appTitle: 'মিৰা (MIRA)',
    appSubtitle: 'আপোনাৰ স্মৃতি সহায়ক',
    home: 'মূল পৃষ্ঠা',
    back: 'উভতি যাওক',
    done: 'সম্পন্ন',
    cancel: 'বাতিল',
    save: 'সংৰক্ষণ কৰক',
    saved: 'সংৰক্ষিত হ’ল',
    tapToContinue: 'আগবাঢ়িবলৈ যিকোনো বুটাম টিপক। মিৰা আপোনাৰ লগতে আছে।',
    voiceHelp: '🔊 মাত শুনিবলৈ টিপক',
    voiceAssistant: 'ভইচ সহায়ক',
    readingAloud: 'পঢ়ি শুনোৱা হৈছে...',
    pauseVoice: 'মাত বন্ধ কৰিবলৈ টিপক',
    screenInstructions: '🔊 স্ক্ৰীণৰ নিৰ্দেশনা শুনিবলৈ টিপক',
    connectedCaretaker: 'যত্নশীল পৰিয়ালৰ সৈতে সংযুক্ত',

    goodMorning: 'শুভ প্ৰভাত',
    aiVisionTitle: 'এআই দৃষ্টি (AI Vision)',
    aiVisionSubtitle: 'এইজন কোন চিনি পাওক?',
    aiVisionDesc: 'কেমেৰা ধৰি নাম আৰু স্মৃতি জানক',
    gamesTitle: 'মগজুৰ খেল',
    gamesSubtitle: 'স্মৃতিশক্তিৰ অনুশীলন',
    gamesDesc: 'কাৰ্ড, শব্দ আৰু সংখ্যাৰ খেল',
    uploadTitle: 'পৰিয়ালৰ সদস্য যোগ',
    uploadSubtitle: 'আপোনজনক যোগ কৰক',
    uploadDesc: 'পৰিয়ালৰ ফটো আৰু বিশেষ স্মৃতি সাঁচক',

    signInGoogle: 'গুগলৰ সৈতে প্ৰৱেশ কৰক',
    signingIn: 'প্ৰৱেশ কৰা হৈছে...',
    appMission: 'আপোনাৰ দৈনিক স্মৃতি, আত্মীয়ক চিনাক্তকৰণ আৰু মগজুৰ সুস্থতাত সহায় কৰে।',
    securityNotice: 'সুৰক্ষিত আৰু পৰিয়ালৰ সৈতে সংযোজিত',

    aiVisionActive: 'মিৰা এআই সক্ৰিয়',
    matchVerified: 'চিনাক্ত নিশ্চিত হ’ল',
    scanNext: 'পৰৱৰ্তী মুখখন চাওক',
    coreMemoryPrompt: 'মূল স্মৃতিৰ বাৰ্তা',
    speakAloudBtn: '🔊 পঢ়ি শুনাওক',

    brainGamesTitle: 'মগজুৰ খেলসমূহ',
    brainGamesSubtitle: 'স্মৃতিশক্তি বৃদ্ধিৰ বাবে খেল বাছক',
    cardGameTitle: '৪x৪ কাৰ্ড খেল (১৬ কাৰ্ড)',
    cardGameDesc: 'পৰিয়াল আৰু উত্তৰ-পূব ঐতিহ্যৰ ৮টা যোৰ মিলাওক',
    cardGameTag: 'দৃষ্টি স্মৃতি (৪x৪)',
    auditoryGameTitle: 'শব্দ চিনাক্তকৰণ',
    auditoryGameDesc: 'ঢোল, পেঁপা আৰু প্ৰকৃতিৰ শব্দ চিনক',
    auditoryGameTag: 'শব্দৰ পৰীক্ষা',
    mathsGameTitle: 'সংখ্যাৰ তুলনা',
    mathsGameDesc: 'ডাঙৰ সংখ্যাটো বাছি উলিয়াওক',
    mathsGameTag: 'গণিতৰ খেল',

    cardMatchTitle: 'কাৰ্ড মিলাওক (৪x৪)',
    cardMatchSubtitle: 'কাৰ্ডত টিপি মিলি থকা যোৰ বিচাৰক',
    moves: 'প্ৰচেষ্টা',
    errors: 'ভুল',
    tapToFlip: 'টিপক',
    matchFound: 'যোৰ মিলিল!',
    tryAgain: 'মিল খোৱা নাই, পুনৰ চেষ্টা কৰক।',
    victoryTitle: 'অসাধাৰণ কাম!',
    victorySubtitle: 'আপুনি আটাইকেইটা কাৰ্ড সফলতাৰে মিলালে।',
    playAgain: 'পুনৰ খেলক',
    allGames: 'সকলো খেল',
    timeSpent: 'সময়',
    telemetrySaved: 'পৰিয়ালৰ প’ৰ্টেলত সংৰক্ষিত হ’ল',

    auditoryTitle: 'শব্দ চিনাক্তকৰণ খেল',
    auditorySubtitle: 'মন দি শুনক আৰু কোনটো শব্দ কওক',
    playSoundBtn: 'শব্দ শুনক 🎵',
    playingSound: 'শব্দ বাজি আছে 🎵...',
    whichSoundMatches: 'এই শব্দটো কোনটো ছবিয়ে কৰিছে?',
    soundCorrect: 'সঠিক উত্তৰ! বৰ ধুনীয়া।',
    soundWrong: 'সঠিক হোৱা নাই, আকৌ শুনক।',
    soundMaster: 'শব্দৰ ওজা!',
    soundMasterDesc: 'আপুনি সকলো শব্দ সঠিকভাৱে চিনি পালে।',

    mathsTitle: 'ডাঙৰ সংখ্যা বাছক',
    mathsSubtitle: 'দুটা সংখ্যাৰ ভিতৰত ডাঙৰটো টিপক',
    tapLarger: 'ডাঙৰ সংখ্যাটোত টিপক',
    largerCorrect: 'সঠিক! এই সংখ্যাটো ডাঙৰ।',
    smallerTryAgain: 'এইটো সৰু সংখ্যা। ডাঙৰটোত টিপক!',
    mathsStar: 'গণিতৰ পুৰস্কাৰ!',
    mathsStarDesc: 'আপুনি আটাইবোৰ ডাঙৰ সংখ্যা চিনি পালে।',

    uploadPersonTitle: 'আপোনজনৰ নাম সাঁচক',
    uploadPersonSubtitle: 'ফটো আৰু স্মৃতি সংৰক্ষণ কৰক',
    choosePhoto: '১. ফটো বাছক',
    pickFamilyPreset: 'বা পৰিয়ালৰ ছবি নিৰ্বাচন কৰক:',
    personName: 'ব্যক্তিজনৰ নাম',
    personNamePlaceholder: 'যেনে: প্ৰিয়া হাজৰিকা',
    relation: 'আপোনাৰ সৈতে সম্বন্ধ',
    relationPlaceholder: 'যেনে: আপোনাৰ জীয়াৰী (গুৱাহাটী)',
    coreMemoryLabel: 'মূল স্মৃতিৰ কথা',
    coreMemoryPlaceholder: 'যেনে: ৰাতিপুৱা আপোনাৰ বাবে আদা দিয়া অসমীয়া চাহ তৈয়াৰ কৰে।',
    saveMemoryBtn: 'স্মৃতিত সংৰক্ষণ কৰক',
    savedToMemories: 'স্মৃতিত সাঁচি ৰখা হ’ল!'
  },

  bn: {
    appTitle: 'মিরা (MIRA)',
    appSubtitle: 'আপনার স্মৃতি সহায়ক',
    home: 'মূল পাতা',
    back: 'ফিরে যান',
    done: 'সম্পন্ন',
    cancel: 'বাতিল',
    save: 'সংরক্ষণ',
    saved: 'সংরক্ষিত',
    tapToContinue: 'এগিয়ে যেতে যেকোনো বোতামে চাপ দিন। মিরা আপনার পাশে আছে।',
    voiceHelp: '🔊 কথা শুনতে চাপ দিন',
    voiceAssistant: 'ভয়েস সহকারী',
    readingAloud: 'পড়ে শোনানো হচ্ছে...',
    pauseVoice: 'কণ্ঠ থামাতে চাপ দিন',
    screenInstructions: '🔊 পর্দার নির্দেশাবলী শুনুন',
    connectedCaretaker: 'পরিবারের সাথে সংযুক্ত',

    goodMorning: 'সুপ্রভাত',
    aiVisionTitle: 'এআই দৃষ্টি (AI Vision)',
    aiVisionSubtitle: 'ইনি কে চিনুন?',
    aiVisionDesc: 'ক্যামেরা ধরে নাম ও স্মৃতি জানুন',
    gamesTitle: 'মস্তিষ্কের খেলা',
    gamesSubtitle: 'স্মৃতিশক্তির অনুশীলন',
    gamesDesc: 'কার্ড, শব্দ ও সংখ্যার খেলা',
    uploadTitle: 'পরিজন যোগ করুন',
    uploadSubtitle: 'প্রিয়জনকে যোগ করুন',
    uploadDesc: 'পরিবারের ছবি ও স্মৃতি সংরক্ষণ করুন',

    signInGoogle: 'গুগল দিয়ে সাইন ইন করুন',
    signingIn: 'সাইন ইন হচ্ছে...',
    appMission: 'দৈনন্দিন স্মৃতি, প্রিয়জনদের চেনা এবং মনের চর্চায় সাহায্য করে।',
    securityNotice: 'নিরাপদ ও পরিবারের সাথে সংযুক্ত',

    aiVisionActive: 'মিরা এআই সক্রিয়',
    matchVerified: 'মিল নিশ্চিত হয়েছে',
    scanNext: 'পরের মুখটি দেখুন',
    coreMemoryPrompt: 'মূল স্মৃতির কথা',
    speakAloudBtn: '🔊 মুখে বলুন',

    brainGamesTitle: 'মস্তিষ্কের খেলা',
    brainGamesSubtitle: 'স্মৃতিশক্তি অনুশীলনের জন্য খেলা বেছে নিন',
    cardGameTitle: '৪x৪ কার্ড মেমোরি',
    cardGameDesc: 'পরিবার ও ঐতিহ্যের ৮ জোড়া কার্ড মেলান',
    cardGameTag: 'স্মৃতি খেলা (৪x৪)',
    auditoryGameTitle: 'শব্দ চেনার খেলা',
    auditoryGameDesc: 'ঢোল, বাঁশি ও মন্দিরের ঘণ্টা চিনুন',
    auditoryGameTag: 'শব্দ পরীক্ষা',
    mathsGameTitle: 'সংখ্যার তুলনা',
    mathsGameDesc: 'বড় সংখ্যাটি বেছে নিন',
    mathsGameTag: 'গণিতের খেলা',

    cardMatchTitle: 'কার্ড ম্যাচ (৪x৪)',
    cardMatchSubtitle: 'কার্ডে চাপ দিয়ে জোড়া মেলান',
    moves: 'চেষ্টা',
    errors: 'ভুল',
    tapToFlip: 'চাপুন',
    matchFound: 'জোড়া মিলেছে!',
    tryAgain: 'মেলেনি, আবার চেষ্টা করুন।',
    victoryTitle: 'দুর্দান্ত কাজ!',
    victorySubtitle: 'আপনি সবকটি কার্ড সফলভাবে মেলালেন।',
    playAgain: 'আবার খেলুন',
    allGames: 'সব খেলা',
    timeSpent: 'সময়',
    telemetrySaved: 'কেয়ারটেকার পোর্টালে সংরক্ষিত হয়েছে',

    auditoryTitle: 'শব্দ চেনার খেলা',
    auditorySubtitle: 'মন দিয়ে শুনুন এবং সঠিক ছবি বাছুন',
    playSoundBtn: 'শব্দ শুনুন 🎵',
    playingSound: 'শব্দ বাজছে 🎵...',
    whichSoundMatches: 'এই শব্দ কোন ছবির সাথে মেলে?',
    soundCorrect: 'একদম সঠিক! চমৎকার।',
    soundWrong: 'সঠিক নয়, আবার শুনুন।',
    soundMaster: 'শব্দ বিশারদ!',
    soundMasterDesc: 'আপনি সবকটি শব্দ নির্ভুলভাবে চিনলেন।',

    mathsTitle: 'বড় সংখ্যা খুঁজুন',
    mathsSubtitle: 'দুটি সংখ্যার মধ্যে বড়টিতে চাপ দিন',
    tapLarger: 'বড় সংখ্যাটিতে চাপ দিন',
    largerCorrect: 'সঠিক! এটি বড় সংখ্যা।',
    smallerTryAgain: 'এটি ছোট সংখ্যা। বড়টিতে চাপ দিন!',
    mathsStar: 'গণিত বিজয়ী!',
    mathsStarDesc: 'আপনি সবকটি বড় সংখ্যা সঠিকভাবে খুঁজে পেয়েছেন।',

    uploadPersonTitle: 'প্রিয়জনকে যোগ করুন',
    uploadPersonSubtitle: 'ছবি ও স্মৃতির বিবরণ সংরক্ষণ করুন',
    choosePhoto: '১. ছবি বাছুন',
    pickFamilyPreset: 'অথবা পারিবারিক ছবি বেছে নিন:',
    personName: 'ব্যক্তির নাম',
    personNamePlaceholder: 'যেমন: প্রিয়া হাজারিকা',
    relation: 'আপনার সাথে সম্পর্ক',
    relationPlaceholder: 'যেমন: আপনার কন্যা (গুয়াহাটি)',
    coreMemoryLabel: 'মূল স্মৃতির বিবরণ',
    coreMemoryPlaceholder: 'যেমন: প্রতিদিন সকালে আপনার সাথে আদা চা বানায়।',
    saveMemoryBtn: 'স্মৃতিতে সংরক্ষণ করুন',
    savedToMemories: 'স্মৃতিতে সংরক্ষিত হয়েছে!'
  },

  mni: {
    appTitle: 'মিরা (MIRA)',
    appSubtitle: 'নহাক্কী নীংশিং সহায়ক',
    home: 'য়ুম',
    back: 'হনবা',
    done: 'লোইরে',
    cancel: 'লেপপা',
    save: 'থম্বা',
    saved: 'থমলবনি',
    tapToContinue: 'মখা চত্থনবা নম্মু। মিরা নহাক্কা লোয়ননা লৈ।',
    voiceHelp: '🔊 খোঞ্জেল তানবা নম্মু',
    voiceAssistant: 'খোঞ্জেল সহায়ক',
    readingAloud: 'পাথোক্লি...',
    pauseVoice: 'খোঞ্জেল লেপনবা নম্মু',
    screenInstructions: '🔊 পাউতাক তানবা নম্মু',
    connectedCaretaker: 'ইমুং-মনুংগা শম্নরে',

    goodMorning: 'অয়ুক্কী য়াইফ-পাউজেল',
    aiVisionTitle: 'এআই মিৎয়েং (AI Vision)',
    aiVisionSubtitle: 'মসি কনানো খঙদোকউ?',
    aiVisionDesc: 'কেমেরা থম্লগা মমিং অমসুং নীংশিং খঙউ',
    gamesTitle: 'লৌশিংগী শান্নপোৎ',
    gamesSubtitle: 'নীংশিং থৌনাগী শান্নবা',
    gamesDesc: 'কার্দ, খোঞ্জেল অমসুং মশীংগী শান্নবা',
    uploadTitle: 'ইমুংগী মী হাপচিনবা',
    uploadSubtitle: 'নুংশিবা মী অমসুং নীংশিং হাপউ',
    uploadDesc: 'ফোতো অমসুং নীংশিংগী ৱারী থম্মী',

    signInGoogle: 'গুগলগা লোয়ননা চঙবা',
    signingIn: 'চঙশিনবদা মতম খর চংই...',
    appMission: 'নুমিৎ খুদিংগী নীংশিংবা, নক্নবশিং খঙদোকপা অমসুং ৱাখল ফহন্বদা মতেং পাংই।',
    securityNotice: 'অরুবা অমসুং শম্নবা',

    aiVisionActive: 'মিরা এআই থবক তৌরি',
    matchVerified: 'চপ চাখ্রে',
    scanNext: 'মথংগী মাইথোং য়েংবা',
    coreMemoryPrompt: 'মরুওইবা নীংশিং ৱারী',
    speakAloudBtn: '🔊 ফোঙনা হায়বা',

    brainGamesTitle: 'লৌশিং শান্নপোৎ',
    brainGamesSubtitle: 'নীংশিং থৌনা কনখৎনবা শান্নবা খনউ',
    cardGameTitle: '৪x৪ কাৰ্দ শান্নবা',
    cardGameDesc: 'ইমুং অমসুং লমদমগী মশক ৮ য়োল্লগা চপ চানবা পুন্সিনবা',
    cardGameTag: 'মিৎয়েং নীংশিং (৪x৪)',
    auditoryGameTitle: 'খোঞ্জেল খঙদোকপা',
    auditoryGameDesc: 'ঢোল, পেঁপা অমসুং মন্দিরগী ঘণ্টা খঙউ',
    auditoryGameTag: 'খোঞ্জেলগী পরীখা',
    mathsGameTitle: 'মশীং চাংদম্নবা',
    mathsGameDesc: 'অচৌবা মশীং খনবা',
    mathsGameTag: 'মশীংগী শান্নবা',

    cardMatchTitle: 'কাৰ্দ চানবা (৪x৪)',
    cardMatchSubtitle: 'কার্দ অনি নম্লগা মান্নবা খনউ',
    moves: 'হোৎনবা',
    errors: 'অশোইবা',
    tapToFlip: 'নম্মু',
    matchFound: 'চানরে!',
    tryAgain: 'চানদে, অমুক হন্না হোৎনৌ।',
    victoryTitle: 'য়াম্না ফরে!',
    victorySubtitle: 'নহাক্না কাৰ্দ পুম্নমক চপ চানা শান্নরে।',
    playAgain: 'অমুক হন্না শান্নবা',
    allGames: 'শান্নবা পুম্নমক',
    timeSpent: 'মতম',
    telemetrySaved: 'কেয়ারটেকরদা য়ৌরে',

    auditoryTitle: 'খোঞ্জেল খঙদোকপা',
    auditorySubtitle: 'তাজন্না তারি অমসুং মশক খঙদোকউ',
    playSoundBtn: 'খোঞ্জেল তাউ 🎵',
    playingSound: 'খোঞ্জেল তারি 🎵...',
    whichSoundMatches: 'খোঞ্জেল অসিমগা চানবা লাই কনানো?',
    soundCorrect: 'চুম্মে! য়াম্না ফরে।',
    soundWrong: 'চুমদে, অমুক হন্না তাউ।',
    soundMaster: 'খোঞ্জেলগী ইপুংগোই!',
    soundMasterDesc: 'নহাক্না খোঞ্জেল পুম্নমক চপ চানা খঙলে।',

    mathsTitle: 'অচৌবা মশীং খনবা',
    mathsSubtitle: 'অনিগী মনুংদা অচৌবা মশীং নম্মু',
    tapLarger: 'অচৌবা মশীংদা নম্মু',
    largerCorrect: 'চুম্মে! মসি অচৌবা মশীংনি।',
    smallerTryAgain: 'মসি অপিকপনি, অচৌবদা নম্মু!',
    mathsStar: 'মশীংগী থোইদোকপা!',
    mathsStarDesc: 'নহাক্না অচৌবা মশীং পুম্নমক ফংলে।',

    uploadPersonTitle: 'নুংশিবা মী হাপচিনবা',
    uploadPersonSubtitle: 'মাইথোং অমসুং নীংশিং থম্বা',
    choosePhoto: '১. ফোতো খনবা',
    pickFamilyPreset: 'অথবা ইমুংগী লাই খনউ:',
    personName: 'মীগী মমিং',
    personNamePlaceholder: 'য়েনে: প্রিয়া হাজারিকা',
    relation: 'নহাক্কা লৈনবা মরী',
    relationPlaceholder: 'য়েনে: নচানুপী (গুৱাহাটী)',
    coreMemoryLabel: 'মরুওইবা নীংশিং ৱারী',
    coreMemoryPlaceholder: 'য়েনে: অয়ুক খুদিংগী চা শাদুনা লোয়ননা থকপা।',
    saveMemoryBtn: 'নীংশিংদা থম্বা',
    savedToMemories: 'নীংশিংদা থম্লবনি!'
  },

  kha: {
    appTitle: 'MIRA',
    appSubtitle: 'Uba Iarap Ia Ka Jingkynmaw',
    home: 'IING',
    back: 'DIEN',
    done: 'Dep',
    cancel: 'Wad',
    save: 'Kynshew',
    saved: 'La Kynshew',
    tapToContinue: 'Shon ban bteng. Ka MIRA ka don ryngkat bad phi.',
    voiceHelp: '🔊 Shon ban sngap ia ka jingkren',
    voiceAssistant: 'Uba Iarap Kren',
    readingAloud: 'Dang pule...',
    pauseVoice: 'Shon ban sangeh',
    screenInstructions: '🔊 Jingbthah lyngba ka sur kren',
    connectedCaretaker: 'La iasoh bad ka iing ka sem',

    goodMorning: 'Khublei Step',
    aiVisionTitle: 'AI VISION',
    aiVisionSubtitle: 'Uei une / kane?',
    aiVisionDesc: 'Buh ka camera ban ithuh kyrteng bad jingkynmaw',
    gamesTitle: 'JINGIALEH KYNMAW',
    gamesSubtitle: 'Jingpynmlien ia ka bor pyrkhat',
    gamesDesc: 'Ki kot, ki sur bad ki jingkhein',
    uploadTitle: 'THEP BRIEW',
    uploadSubtitle: 'Thep ia kiba ieid',
    uploadDesc: 'Kynshew ka dur bad ka jingkynmaw ba kyrpang',

    signInGoogle: 'Psiah da ka Google',
    signingIn: 'Dang psiah...',
    appMission: 'Ban iarap ia ka jingkynmaw man ka sngi bad ban ithuh ia kiba ieid.',
    securityNotice: 'La Iada Bha & Iasoh bad ka Iing',

    aiVisionActive: 'MIRA AI KHA LASTE',
    matchVerified: 'La Ithuh Bha',
    scanNext: 'Peit ia uba bud',
    coreMemoryPrompt: 'JINGKYNMAW BA KYRPANG',
    speakAloudBtn: '🔊 Kren jam',

    brainGamesTitle: 'KI JINGIALEH BOR PYRKHAT',
    brainGamesSubtitle: 'Jied ia ka jingialeh ban pynkhlain jingkynmaw',
    cardGameTitle: 'Jingialeh Kot 4x4 (16 Tylli)',
    cardGameDesc: 'Pyniasoh 8 tylli ki jur dur kiba iadei',
    cardGameTag: 'JINGITHUH DUR (4x4)',
    auditoryGameTitle: 'Jingithuh Sur',
    auditoryGameDesc: 'Sngap ia ki ksing, besli bad kynruh ksha',
    auditoryGameTag: 'SUR JINGITHUH',
    mathsGameTitle: 'Jingnujor Jingkhein',
    mathsGameDesc: 'Jied ia u nombor uba kham khraw',
    mathsGameTag: 'JINGKHEIN',

    cardMatchTitle: 'PYNIASOH KOT (4x4)',
    cardMatchSubtitle: 'Shon ar tylli ki kot ban iasoh jur',
    moves: 'KINTA',
    errors: 'LAKHEIN',
    tapToFlip: 'SHON',
    matchFound: 'Iasoh Bha!',
    tryAgain: 'Ym shym iasoh, pyrshang biang.',
    victoryTitle: 'Kaba Phylla Bha!',
    victorySubtitle: 'Phi la lah ban pyniasoh ia baroh 8 jur ki kot.',
    playAgain: 'Ialeh Biang',
    allGames: 'Baroh ki Jingialeh',
    timeSpent: 'Por',
    telemetrySaved: 'La kynshew ha ka portal',

    auditoryTitle: 'JINGIALEH ITHUH SUR',
    auditorySubtitle: 'Sngap bha bad jied ia ka dur kaba dei',
    playSoundBtn: 'Sngap Sur 🎵',
    playingSound: 'Dang riew ka sur 🎵...',
    whichSoundMatches: 'Kano ka dur kaba pynmih ia kane ka sur?',
    soundCorrect: 'Dei Bha! Khublei shibun.',
    soundWrong: 'Ym dei, sngap biang.',
    soundMaster: 'Uba Nang Sngap Bha!',
    soundMasterDesc: 'Phi la ithuh ia baroh ki sur.',

    mathsTitle: 'JIED IA U NOMBOR UBA KHRAW',
    mathsSubtitle: 'Shon ia u nombor uba kham heh',
    tapLarger: 'Shon ia uba kham HEH',
    largerCorrect: 'Dei Bha! Une u nombor u kham heh.',
    smallerTryAgain: 'Une u rit. Shon ia uba kham heh!',
    mathsStar: 'Khlur Jingkhein!',
    mathsStarDesc: 'Phi la shem ia baroh ki nombor kiba heh.',

    uploadPersonTitle: 'THEP IA KIBA IEID',
    uploadPersonSubtitle: 'Kynshew dur & jingkynmaw',
    choosePhoto: '1. JIED KA DUR',
    pickFamilyPreset: 'Lane jied na ki dur ba la don lypa:',
    personName: 'KYRTENG U BRIEW',
    personNamePlaceholder: 'kumba: Rohan Sangma',
    relation: 'JINGIASOH BAD PHI',
    relationPlaceholder: 'kumba: U Khun Ksiew (Shillong)',
    coreMemoryLabel: 'JINGKYNMAW BA KYRPANG',
    coreMemoryPlaceholder: 'kumba: Uba sngewtynnat ban tem guitar bad phi ha Shillong.',
    saveMemoryBtn: 'Kynshew ha Jingkynmaw',
    savedToMemories: 'La kynshew ha Jingkynmaw!'
  },

  hi: {
    appTitle: 'मीरा (MIRA)',
    appSubtitle: 'आपकी स्मृति साथी',
    home: 'होम',
    back: 'पीछे',
    done: 'संपन्न',
    cancel: 'रद्द करें',
    save: 'सहेजें',
    saved: 'सहेजा गया',
    tapToContinue: 'आगे बढ़ने के लिए कोई भी बटन दबाएं। मीरा आपके साथ है।',
    voiceHelp: '🔊 आवाज़ सुनने के लिए दबाएं',
    voiceAssistant: 'वॉयस सहायक',
    readingAloud: 'बोलकर सुनाया जा रहा है...',
    pauseVoice: 'आवाज़ रोकने के लिए दबाएं',
    screenInstructions: '🔊 स्क्रीन निर्देश सुनने के लिए दबाएं',
    connectedCaretaker: 'देखभालकर्ता से जुड़ा हुआ',

    goodMorning: 'शुभ प्रभात',
    aiVisionTitle: 'एआई दृष्टि (AI Vision)',
    aiVisionSubtitle: 'यह कौन हैं पहचानें',
    aiVisionDesc: 'कैमरा दिखाकर नाम और यादें जानें',
    gamesTitle: 'दिमागी खेल',
    gamesSubtitle: 'स्मृति अभ्यास',
    gamesDesc: 'कार्ड, आवाज़ और संख्याओं के खेल',
    uploadTitle: 'परिजन जोड़ें',
    uploadSubtitle: 'अपनों को जोड़ें',
    uploadDesc: 'पारिवारिक फोटो और विशेष यादें सहेजें',

    signInGoogle: 'गूगल से साइन इन करें',
    signingIn: 'साइन इन हो रहा है...',
    appMission: 'आपकी दैनिक स्मृति, प्रियजनों की पहचान और दिमागी तंदुरुस्ती में सहायक।',
    securityNotice: 'सुरक्षित और परिजनों से जुड़ा हुआ',

    aiVisionActive: 'मीरा एआई सक्रिय',
    matchVerified: 'पहचान सत्यापित',
    scanNext: 'अगला चेहरा देखें',
    coreMemoryPrompt: 'मुख्य स्मृति संदेश',
    speakAloudBtn: '🔊 बोलकर सुनाएं',

    brainGamesTitle: 'दिमागी खेल',
    brainGamesSubtitle: 'स्मृति शक्ति बढ़ाने के लिए खेल चुनें',
    cardGameTitle: '४x४ कार्ड मेमोरी (१६ कार्ड)',
    cardGameDesc: 'परिवार और पूर्वोत्तर संस्कृति के ८ जोड़े मिलाएं',
    cardGameTag: 'दृश्य स्मृति (४x४)',
    auditoryGameTitle: 'ध्वनि पहचान',
    auditoryGameDesc: 'ढोल, बांसुरी और प्राकृतिक ध्वनियां पहचानें',
    auditoryGameTag: 'ध्वनि परीक्षण',
    mathsGameTitle: 'संख्या तुलना',
    mathsGameDesc: 'बड़ी संख्या चुनकर पहचानें',
    mathsGameTag: 'गणित का खेल',

    cardMatchTitle: 'कार्ड मिलान (४x४)',
    cardMatchSubtitle: 'कार्ड पर टैप करके समान जोड़े खोजें',
    moves: 'प्रयास',
    errors: 'गलतियां',
    tapToFlip: 'टैप करें',
    matchFound: 'जोड़ा मिल गया!',
    tryAgain: 'मेल नहीं खाया, पुनः प्रयास करें।',
    victoryTitle: 'शानदार कार्य!',
    victorySubtitle: 'आपने सभी ८ जोड़ों को सफलतापूर्वक मिला दिया।',
    playAgain: 'पुनः खेलें',
    allGames: 'सभी खेल',
    timeSpent: 'समय',
    telemetrySaved: 'केयरटेकर पोर्टल पर सहेजा गया',

    auditoryTitle: 'ध्वनि पहचान खेल',
    auditorySubtitle: 'ध्यान से सुनें और सही चित्र चुनें',
    playSoundBtn: 'ध्वनि सुनें 🎵',
    playingSound: 'ध्वनि बज रही है 🎵...',
    whichSoundMatches: 'यह ध्वनि किस चित्र से संबंधित है?',
    soundCorrect: 'बिल्कुल सही! बहुत बढ़िया।',
    soundWrong: 'सही नहीं है, पुनः सुनें।',
    soundMaster: 'ध्वनि के उस्ताद!',
    soundMasterDesc: 'आपने सभी ध्वनियों को सही पहचाना।',

    mathsTitle: 'बड़ी संख्या खोजें',
    mathsSubtitle: 'दो संख्याओं में से बड़ी संख्या पर टैप करें',
    tapLarger: 'बड़ी संख्या पर टैप करें',
    largerCorrect: 'सही! यह संख्या बड़ी है।',
    smallerTryAgain: 'यह संख्या छोटी है। बड़ी संख्या चुनें!',
    mathsStar: 'गणित सितारा!',
    mathsStarDesc: 'आपने सभी बड़ी संख्याएं सही पहचानी हैं।',

    uploadPersonTitle: 'अपनों को जोड़ें',
    uploadPersonSubtitle: 'चेहरा और स्मृति विवरण सहेजें',
    choosePhoto: '१. फोटो चुनें',
    pickFamilyPreset: 'या पारिवारिक फोटो चुनें:',
    personName: 'व्यक्ति का नाम',
    personNamePlaceholder: 'उदा. प्रिया हजारिका',
    relation: 'आपसे संबंध',
    relationPlaceholder: 'उदा. आपकी सुपुत्री (गुवाहाटी)',
    coreMemoryLabel: 'मुख्य स्मृति प्रॉम्ट',
    coreMemoryPlaceholder: 'उदा. रोज़ सुबह आपके लिए असमिया अदरक वाली चाय बनाती हैं।',
    saveMemoryBtn: 'स्मृति में सहेजें',
    savedToMemories: 'स्मृति में सहेज लिया गया!'
  }
};

export const getTranslation = (lang: SupportedLanguage = 'en'): TranslationDictionary => {
  return TRANSLATIONS[lang] || TRANSLATIONS.en;
};
