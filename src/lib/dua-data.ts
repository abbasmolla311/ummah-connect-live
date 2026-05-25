export type Dua = {
  id: string;
  category: string;
  title: string;
  arabic: string;
  transliteration: string;
  english: string;
  reference?: string;
};

export const DUAS: Dua[] = [
  { id: "morning-1", category: "Morning", title: "Upon waking up",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
    transliteration: "Alhamdu lillahil-ladhi ahyana ba'da ma amatana wa ilayhin-nushur",
    english: "All praise is for Allah who gave us life after taking it from us, and unto Him is the resurrection.",
    reference: "Bukhari" },
  { id: "morning-2", category: "Morning", title: "Morning remembrance",
    arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ",
    transliteration: "Asbahna wa asbahal-mulku lillah, walhamdu lillah",
    english: "We have reached the morning and at this time all sovereignty belongs to Allah, and all praise is for Allah.",
    reference: "Muslim" },
  { id: "evening-1", category: "Evening", title: "Evening remembrance",
    arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ",
    transliteration: "Amsayna wa amsal-mulku lillah",
    english: "We have reached the evening and at this time all sovereignty belongs to Allah.",
    reference: "Muslim" },
  { id: "sleep-1", category: "Sleep", title: "Before sleeping",
    arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
    transliteration: "Bismika Allahumma amutu wa ahya",
    english: "In Your name O Allah, I die and I live.",
    reference: "Bukhari" },
  { id: "eat-1", category: "Eating", title: "Before eating",
    arabic: "بِسْمِ اللَّهِ",
    transliteration: "Bismillah",
    english: "In the name of Allah.",
    reference: "Abu Dawud" },
  { id: "eat-2", category: "Eating", title: "After eating",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ",
    transliteration: "Alhamdu lillahil-ladhi at'amani hadha wa razaqaniih",
    english: "All praise is for Allah who fed me this and provided it for me.",
    reference: "Tirmidhi" },
  { id: "travel-1", category: "Travel", title: "When traveling",
    arabic: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ",
    transliteration: "Subhanal-ladhi sakhkhara lana hadha wa ma kunna lahu muqrinin",
    english: "Glory be to Him who has subjected this for us, and we were not able to do it.",
    reference: "Muslim" },
  { id: "protection-1", category: "Protection", title: "Seeking refuge from evil",
    arabic: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
    transliteration: "A'udhu bi kalimatillahit-tammati min sharri ma khalaq",
    english: "I seek refuge in the perfect words of Allah from the evil of what He has created.",
    reference: "Muslim" },
  { id: "anxiety-1", category: "Anxiety", title: "When in distress",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ",
    transliteration: "Allahumma inni a'udhu bika minal-hammi wal-hazan",
    english: "O Allah, I seek refuge in You from anxiety and grief.",
    reference: "Bukhari" },
  { id: "forgiveness-1", category: "Forgiveness", title: "Master of seeking forgiveness",
    arabic: "اللَّهُمَّ أَنْتَ رَبِّي لاَ إِلَهَ إِلاَّ أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ",
    transliteration: "Allahumma anta Rabbi la ilaha illa anta, khalaqtani wa ana 'abduk",
    english: "O Allah, You are my Lord, none has the right to be worshipped except You. You created me and I am Your servant.",
    reference: "Bukhari" },
];
