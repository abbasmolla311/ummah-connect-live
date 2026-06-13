export type Dua = {
  id: string;
  category: string;
  categoryBn: string;
  title: string;
  titleBn: string;
  arabic: string;
  transliteration: string;
  english: string;
  bengali: string;
  reference?: string;
};

export const DUAS: Dua[] = [
  { id: "morning-1", category: "Morning", categoryBn: "সকাল", title: "Upon waking up", titleBn: "ঘুম থেকে উঠে",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
    transliteration: "Alhamdu lillahil-ladhi ahyana ba'da ma amatana wa ilayhin-nushur",
    english: "All praise is for Allah who gave us life after taking it from us, and unto Him is the resurrection.",
    bengali: "সমস্ত প্রশংসা আল্লাহর, যিনি আমাদের মৃত্যুর পর জীবিত করেছেন এবং তাঁরই দিকে পুনরুত্থান।",
    reference: "Bukhari" },
  { id: "morning-2", category: "Morning", categoryBn: "সকাল", title: "Morning remembrance", titleBn: "সকালের জিকির",
    arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ",
    transliteration: "Asbahna wa asbahal-mulku lillah, walhamdu lillah",
    english: "We have reached the morning and at this time all sovereignty belongs to Allah, and all praise is for Allah.",
    bengali: "আমরা সকালে উপনীত হলাম এবং সমস্ত রাজত্ব আল্লাহরই, আর সমস্ত প্রশংসা আল্লাহর।",
    reference: "Muslim" },
  { id: "evening-1", category: "Evening", categoryBn: "সন্ধ্যা", title: "Evening remembrance", titleBn: "সন্ধ্যার জিকির",
    arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ",
    transliteration: "Amsayna wa amsal-mulku lillah",
    english: "We have reached the evening and at this time all sovereignty belongs to Allah.",
    bengali: "আমরা সন্ধ্যায় উপনীত হলাম এবং সমস্ত রাজত্ব আল্লাহরই।",
    reference: "Muslim" },
  { id: "sleep-1", category: "Sleep", categoryBn: "ঘুম", title: "Before sleeping", titleBn: "ঘুমানোর আগে",
    arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
    transliteration: "Bismika Allahumma amutu wa ahya",
    english: "In Your name O Allah, I die and I live.",
    bengali: "হে আল্লাহ, আপনার নামেই আমি মরি এবং আপনার নামেই আমি জীবিত হই।",
    reference: "Bukhari" },
  { id: "eat-1", category: "Eating", categoryBn: "খাবার", title: "Before eating", titleBn: "খাওয়ার আগে",
    arabic: "بِسْمِ اللَّهِ",
    transliteration: "Bismillah",
    english: "In the name of Allah.",
    bengali: "আল্লাহর নামে শুরু করছি।",
    reference: "Abu Dawud" },
  { id: "eat-2", category: "Eating", categoryBn: "খাবার", title: "After eating", titleBn: "খাওয়ার পরে",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ",
    transliteration: "Alhamdu lillahil-ladhi at'amani hadha wa razaqaniih",
    english: "All praise is for Allah who fed me this and provided it for me.",
    bengali: "সমস্ত প্রশংসা আল্লাহর, যিনি আমাকে এই খাবার খাইয়েছেন এবং রিজিক দিয়েছেন।",
    reference: "Tirmidhi" },
  { id: "travel-1", category: "Travel", categoryBn: "ভ্রমণ", title: "When traveling", titleBn: "ভ্রমণের সময়",
    arabic: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ",
    transliteration: "Subhanal-ladhi sakhkhara lana hadha wa ma kunna lahu muqrinin",
    english: "Glory be to Him who has subjected this for us, and we were not able to do it.",
    bengali: "পবিত্র সেই সত্তা, যিনি এটি আমাদের অধীন করে দিয়েছেন, অথচ আমরা একে বশীভূত করতে সক্ষম ছিলাম না।",
    reference: "Muslim" },
  { id: "protection-1", category: "Protection", categoryBn: "সুরক্ষা", title: "Seeking refuge from evil", titleBn: "অনিষ্ট থেকে আশ্রয়",
    arabic: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
    transliteration: "A'udhu bi kalimatillahit-tammati min sharri ma khalaq",
    english: "I seek refuge in the perfect words of Allah from the evil of what He has created.",
    bengali: "আমি আল্লাহর পরিপূর্ণ কালেমার আশ্রয় নিচ্ছি, তাঁর সৃষ্টির অনিষ্ট থেকে।",
    reference: "Muslim" },
  { id: "anxiety-1", category: "Anxiety", categoryBn: "দুশ্চিন্তা", title: "When in distress", titleBn: "কষ্টের সময়",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ",
    transliteration: "Allahumma inni a'udhu bika minal-hammi wal-hazan",
    english: "O Allah, I seek refuge in You from anxiety and grief.",
    bengali: "হে আল্লাহ, আমি আপনার কাছে দুশ্চিন্তা ও দুঃখ থেকে আশ্রয় চাই।",
    reference: "Bukhari" },
  { id: "forgiveness-1", category: "Forgiveness", categoryBn: "ক্ষমা", title: "Master of seeking forgiveness", titleBn: "সাইয়িদুল ইস্তিগফার",
    arabic: "اللَّهُمَّ أَنْتَ رَبِّي لاَ إِلَهَ إِلاَّ أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ",
    transliteration: "Allahumma anta Rabbi la ilaha illa anta, khalaqtani wa ana 'abduk",
    english: "O Allah, You are my Lord, none has the right to be worshipped except You. You created me and I am Your servant.",
    bengali: "হে আল্লাহ, আপনিই আমার রব, আপনি ছাড়া কোন উপাস্য নেই। আপনি আমাকে সৃষ্টি করেছেন এবং আমি আপনার বান্দা।",
    reference: "Bukhari" },
];
