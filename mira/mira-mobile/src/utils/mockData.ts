import { EnrolledPerson } from '../types';
import { SoundEffectType } from './soundSynthesizer';

export const INITIAL_ENROLLED_PERSONS: EnrolledPerson[] = [
  {
    id: 'person-1',
    name: 'Priya Hazarika',
    relation: 'Your Daughter (Guwahati)',
    coreMemory: 'Loves to prepare warm Assam CTC tea with fresh ginger for you every morning at 7:30 AM.',
    photoUri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop',
    createdAt: '2026-08-01T10:00:00Z',
    location: 'Guwahati, Assam',
    heritageTag: 'Muga Silk Gamosa'
  },
  {
    id: 'person-2',
    name: 'Rohan Sangma',
    relation: 'Your Grandson (Shillong)',
    coreMemory: 'Plays Rabindra Sangeet and acoustic guitar for you under the pine trees on Shillong visits.',
    photoUri: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600&auto=format&fit=crop',
    createdAt: '2026-08-05T14:30:00Z',
    location: 'Shillong, Meghalaya',
    heritageTag: 'Khasi Traditional Weave'
  },
  {
    id: 'person-3',
    name: 'Lalrinmawii (Rini)',
    relation: 'Your Caretaker & Niece (Aizawl)',
    coreMemory: 'Brings traditional Mizo bamboo shoot stew and fresh sweet mountain oranges from Aizawl.',
    photoUri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop',
    createdAt: '2026-08-10T09:15:00Z',
    location: 'Aizawl, Mizoram',
    heritageTag: 'Puanchei Motif'
  },
  {
    id: 'person-4',
    name: 'Dr. Amarjit Singh',
    relation: 'Your Geriatrician (Imphal)',
    coreMemory: 'Your caring family physician from Imphal who visits every second Thursday for health checkups.',
    photoUri: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=600&auto=format&fit=crop',
    createdAt: '2026-08-12T11:00:00Z',
    location: 'Imphal, Manipur',
    heritageTag: 'Phanek Pattern'
  },
  {
    id: 'person-5',
    name: 'Tenzing Dorjee',
    relation: 'Your Brother (Tawang)',
    coreMemory: 'Shares cherished childhood memories near Tawang Monastery and walks in the mountain snow.',
    photoUri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop',
    createdAt: '2026-08-15T16:20:00Z',
    location: 'Tawang, Arunachal Pradesh',
    heritageTag: 'Monpa Woolen Shawl'
  }
];

export interface SoundQuestionOption {
  id: string;
  label: string;
  labelAs: string;
  imageUrl: string;
  isCorrect: boolean;
}

export interface SoundQuestion {
  id: string;
  soundType: SoundEffectType;
  soundName: string;
  soundNameAs: string;
  soundDescription: string;
  options: SoundQuestionOption[];
}

export const SOUND_QUESTIONS: SoundQuestion[] = [
  {
    id: 'sq-1',
    soundType: 'BIHU_DHOL',
    soundName: 'Bihu Dhol Rhythm',
    soundNameAs: 'বিহু ঢোলৰ মাত',
    soundDescription: 'Rhythmic traditional folk drum rhythm celebrating spring Rongali Bihu',
    options: [
      {
        id: 'opt-1a',
        label: 'Bihu Dhol (Folk Drum)',
        labelAs: 'বিহু ঢোল',
        imageUrl: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?q=80&w=400&auto=format&fit=crop',
        isCorrect: true
      },
      {
        id: 'opt-1b',
        label: 'Kamakhya Temple Bell',
        labelAs: 'মন্দিৰৰ ঘণ্টা',
        imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=400&auto=format&fit=crop',
        isCorrect: false
      },
      {
        id: 'opt-1c',
        label: 'Tea Garden Rain',
        labelAs: 'চাহ বাগানৰ বৰষুণ',
        imageUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=400&auto=format&fit=crop',
        isCorrect: false
      }
    ]
  },
  {
    id: 'sq-2',
    soundType: 'TEMPLE_BELL',
    soundName: 'Kamakhya Prayer Bell',
    soundNameAs: 'কামাখ্যা মন্দিৰৰ ঘণ্টা',
    soundDescription: 'Resonant sacred brass prayer bell ringing in the morning breeze',
    options: [
      {
        id: 'opt-2a',
        label: 'Traditional Pepa Horn',
        labelAs: "ম'হৰ শিঙৰ পেঁপা",
        imageUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=400&auto=format&fit=crop',
        isCorrect: false
      },
      {
        id: 'opt-2b',
        label: 'Kamakhya Temple Bell',
        labelAs: 'কামাখ্যাৰ মন্দিৰৰ ঘণ্টা',
        imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=400&auto=format&fit=crop',
        isCorrect: true
      },
      {
        id: 'opt-2c',
        label: 'Bihu Dhol (Drum)',
        labelAs: 'বিহু ঢোল',
        imageUrl: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?q=80&w=400&auto=format&fit=crop',
        isCorrect: false
      }
    ]
  },
  {
    id: 'sq-3',
    soundType: 'FLUTE_PEPA',
    soundName: 'Traditional Pepa / Flute Melody',
    soundNameAs: 'পেঁপা আৰু বাঁহীৰ সুৰ',
    soundDescription: 'Sweet melody played on traditional bamboo flute and buffalo horn pepa',
    options: [
      {
        id: 'opt-3a',
        label: 'Bamboo Cane Basket',
        labelAs: 'বাঁহৰ সাজ-বাচন',
        imageUrl: 'https://images.unsplash.com/photo-1584589167171-541ce45f1eea?q=80&w=400&auto=format&fit=crop',
        isCorrect: false
      },
      {
        id: 'opt-3b',
        label: 'Bihu Dhol (Drum)',
        labelAs: 'বিহু ঢোল',
        imageUrl: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?q=80&w=400&auto=format&fit=crop',
        isCorrect: false
      },
      {
        id: 'opt-3c',
        label: 'Traditional Pepa / Flute',
        labelAs: 'পেঁপা / বাঁহীৰ সুৰ',
        imageUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=400&auto=format&fit=crop',
        isCorrect: true
      }
    ]
  },
  {
    id: 'sq-4',
    soundType: 'TEA_GARDEN_RAIN',
    soundName: 'Cherrapunji Rain & Tea Ambience',
    soundNameAs: 'চেৰাপুঞ্জীৰ বৰষুণৰ শব্দ',
    soundDescription: 'Gentle soothing raindrops falling on green tea leaves and tin roofs',
    options: [
      {
        id: 'opt-4a',
        label: 'Tea Garden Rain',
        labelAs: 'চাহ বাগানৰ বৰষুণ',
        imageUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=400&auto=format&fit=crop',
        isCorrect: true
      },
      {
        id: 'opt-4b',
        label: 'Temple Bell',
        labelAs: 'মন্দিৰৰ ঘণ্টা',
        imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=400&auto=format&fit=crop',
        isCorrect: false
      },
      {
        id: 'opt-4c',
        label: 'Bihu Dhol',
        labelAs: 'বিহু ঢোল',
        imageUrl: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?q=80&w=400&auto=format&fit=crop',
        isCorrect: false
      }
    ]
  }
];
