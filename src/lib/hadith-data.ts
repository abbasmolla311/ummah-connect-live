export type Hadith = {
  id: string;
  collection: string;
  number: string;
  narrator: string;
  arabic?: string;
  english: string;
  bengali: string;
};

export const HADITHS: Hadith[] = [
  { id: "nawawi-1", collection: "40 Hadith Nawawi", number: "1", narrator: "Umar ibn al-Khattab (RA)",
    arabic: "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى",
    english: "Actions are judged by intentions, and every person will get what they intended.",
    bengali: "নিশ্চয়ই সকল আমল নিয়তের উপর নির্ভরশীল, এবং প্রত্যেক ব্যক্তি তা-ই পাবে যা সে নিয়ত করেছে।" },
  { id: "nawawi-2", collection: "40 Hadith Nawawi", number: "2", narrator: "Umar ibn al-Khattab (RA)",
    english: "Islam is to testify that there is no god but Allah and Muhammad is His Messenger, to establish prayer, give zakat, fast Ramadan, and perform Hajj if able. Iman is to believe in Allah, His angels, books, messengers, the Last Day, and divine decree. Ihsan is to worship Allah as if you see Him, and though you do not see Him, He surely sees you.",
    bengali: "ইসলাম হলো সাক্ষ্য দেওয়া যে আল্লাহ ছাড়া কোন উপাস্য নেই এবং মুহাম্মদ ﷺ তাঁর রাসূল, নামাজ কায়েম করা, যাকাত দেওয়া, রমজানের রোজা রাখা এবং সামর্থ্য থাকলে হজ করা। ঈমান হলো আল্লাহ, তাঁর ফেরেশতা, কিতাবসমূহ, রাসূলগণ, আখিরাত ও তাকদীরের উপর বিশ্বাস। ইহসান হলো আল্লাহর ইবাদত এমনভাবে করা যেন তুমি তাঁকে দেখছ, আর যদিও তুমি তাঁকে দেখছ না, তিনি অবশ্যই তোমাকে দেখছেন।" },
  { id: "nawawi-13", collection: "40 Hadith Nawawi", number: "13", narrator: "Anas ibn Malik (RA)",
    arabic: "لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",
    english: "None of you truly believes until he loves for his brother what he loves for himself.",
    bengali: "তোমাদের কেউ ততক্ষণ পর্যন্ত প্রকৃত মুমিন হতে পারবে না, যতক্ষণ না সে তার ভাইয়ের জন্য তাই পছন্দ করবে যা সে নিজের জন্য পছন্দ করে।" },
  { id: "nawawi-15", collection: "40 Hadith Nawawi", number: "15", narrator: "Abu Hurayrah (RA)",
    english: "Whoever believes in Allah and the Last Day, let him speak good or remain silent. And whoever believes in Allah and the Last Day, let him honor his neighbor. And whoever believes in Allah and the Last Day, let him honor his guest.",
    bengali: "যে ব্যক্তি আল্লাহ ও আখিরাতে বিশ্বাস করে, সে যেন ভাল কথা বলে অথবা চুপ থাকে। যে আল্লাহ ও আখিরাতে বিশ্বাস করে সে যেন প্রতিবেশীর সম্মান করে। যে আল্লাহ ও আখিরাতে বিশ্বাস করে সে যেন মেহমানের সম্মান করে।" },
  { id: "nawawi-25", collection: "40 Hadith Nawawi", number: "25", narrator: "Abu Dharr (RA)",
    english: "Some of the companions of the Messenger of Allah ﷺ said: 'O Messenger of Allah, the wealthy have taken away all the rewards.' He said: 'Has not Allah made things for you to give in charity? Every Tasbih is charity, every Takbir is charity, every Tahmid is charity, every Tahlil is charity, enjoining good is charity, forbidding evil is charity, and in the sexual act of each of you is charity.'",
    bengali: "রাসূল ﷺ এর কিছু সাহাবী বললেন: 'হে আল্লাহর রাসূল, ধনীরা সব সওয়াব নিয়ে গেছে।' তিনি বললেন: 'আল্লাহ কি তোমাদের জন্য সদকা করার বিষয় রাখেননি? প্রতিটি তাসবিহ সদকা, প্রতিটি তাকবির সদকা, প্রতিটি তাহমিদ সদকা, প্রতিটি তাহলিল সদকা, ভালো কাজের আদেশ সদকা, মন্দ কাজে বাধা সদকা।'" },
  { id: "bukhari-1", collection: "Sahih Bukhari", number: "1", narrator: "Umar ibn al-Khattab (RA)",
    english: "I heard Allah's Messenger ﷺ saying: The reward of deeds depends upon the intention and every person will get the reward according to what he has intended.",
    bengali: "আমি রাসূলুল্লাহ ﷺ কে বলতে শুনেছি: আমলের প্রতিদান নিয়তের উপর নির্ভরশীল এবং প্রত্যেক ব্যক্তি তার নিয়ত অনুযায়ী প্রতিদান পাবে।" },
  { id: "bukhari-6", collection: "Sahih Bukhari", number: "6", narrator: "Ibn Abbas (RA)",
    english: "The Prophet ﷺ was the most generous of all the people, and he used to become more generous in Ramadan when Gabriel met him.",
    bengali: "নবী ﷺ সকল মানুষের মধ্যে সবচেয়ে দানশীল ছিলেন, এবং রমজানে যখন জিবরাঈল (আঃ) তাঁর সাথে সাক্ষাৎ করতেন তখন তিনি আরো বেশি দানশীল হয়ে উঠতেন।" },
  { id: "bukhari-2442", collection: "Sahih Bukhari", number: "2442", narrator: "Abdullah ibn Umar (RA)",
    english: "A Muslim is a brother of another Muslim. He does not oppress him, nor does he hand him over to an oppressor. Whoever fulfilled the needs of his brother, Allah will fulfill his needs.",
    bengali: "একজন মুসলিম অপর মুসলিমের ভাই। সে তার উপর জুলুম করে না, এবং তাকে জালিমের হাতে তুলে দেয় না। যে তার ভাইয়ের প্রয়োজন পূরণ করবে, আল্লাহ তার প্রয়োজন পূরণ করবেন।" },
  { id: "muslim-2564", collection: "Sahih Muslim", number: "2564", narrator: "Abu Hurayrah (RA)",
    english: "Allah does not look at your appearance or wealth, but rather He looks at your hearts and actions.",
    bengali: "আল্লাহ তোমাদের চেহারা বা সম্পদের দিকে তাকান না, বরং তিনি তোমাদের অন্তর ও আমলের দিকে তাকান।" },
  { id: "muslim-91", collection: "Sahih Muslim", number: "91", narrator: "Abdullah ibn Masud (RA)",
    english: "No one who has the weight of a mustard seed of arrogance in his heart will enter Paradise.",
    bengali: "যার অন্তরে সরিষার দানা পরিমাণ অহংকার আছে, সে জান্নাতে প্রবেশ করতে পারবে না।" },
  { id: "tirmidhi-1924", collection: "Jami at-Tirmidhi", number: "1924", narrator: "Abdullah ibn Amr (RA)",
    english: "Those who are merciful will be shown mercy by the Most Merciful. Be merciful to those on the earth and the One in the heavens will have mercy upon you.",
    bengali: "যারা দয়া করে, পরম দয়াময় তাদের প্রতি দয়া করবেন। তোমরা পৃথিবীবাসীর প্রতি দয়া কর, আসমানের অধিপতি তোমাদের প্রতি দয়া করবেন।" },
  { id: "tirmidhi-2018", collection: "Jami at-Tirmidhi", number: "2018", narrator: "Abu Hurayrah (RA)",
    english: "Fear Allah wherever you are, follow a bad deed with a good one to wipe it out, and treat people with good character.",
    bengali: "যেখানেই থাক আল্লাহকে ভয় কর, মন্দ কাজের পরে ভাল কাজ কর যা তা মুছে দেবে, এবং মানুষের সাথে সদাচরণ কর।" },
  { id: "abudawud-4943", collection: "Sunan Abi Dawud", number: "4943", narrator: "Abdullah ibn Amr (RA)",
    english: "He who does not show mercy to our young ones, and does not realize the rights of our elders, is not from us.",
    bengali: "যে আমাদের ছোটদের প্রতি দয়া করে না এবং বড়দের অধিকার বোঝে না, সে আমাদের অন্তর্ভুক্ত নয়।" },
];
