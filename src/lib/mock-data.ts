export type Mosque = {
  id: string;
  name: string;
  arabicName?: string;
  imam: string;
  village: string;
  city: string;
  distanceKm: number;
  isLive: boolean;
  listeners?: number;
  followers: number;
};

export const mosques: Mosque[] = [
  { id: "m1", name: "Masjid Al-Noor", arabicName: "مسجد النور", imam: "Imam Abdullah Rahman", village: "Greenfield", city: "Hyderabad", distanceKm: 1.2, isLive: true, listeners: 342, followers: 2840 },
  { id: "m2", name: "Jamia Masjid", arabicName: "الجامع الكبير", imam: "Imam Yusuf Khan", village: "Old Town", city: "Hyderabad", distanceKm: 2.8, isLive: false, followers: 5210 },
  { id: "m3", name: "Masjid Al-Rahma", arabicName: "مسجد الرحمة", imam: "Imam Ibrahim Siddiqui", village: "Banjara Hills", city: "Hyderabad", distanceKm: 4.5, isLive: false, followers: 1820 },
  { id: "m4", name: "Masjid Al-Hidaya", arabicName: "مسجد الهداية", imam: "Imam Muhammad Ali", village: "Mehdipatnam", city: "Hyderabad", distanceKm: 6.1, isLive: false, followers: 980 },
  { id: "m5", name: "Madina Masjid", arabicName: "مسجد المدينة", imam: "Imam Zakir Hussain", village: "Tolichowki", city: "Hyderabad", distanceKm: 7.4, isLive: false, followers: 3120 },
  { id: "m6", name: "Masjid Al-Falah", arabicName: "مسجد الفلاح", imam: "Imam Sulaiman Ahmad", village: "Charminar", city: "Hyderabad", distanceKm: 9.2, isLive: true, listeners: 128, followers: 4500 },
];

export type PrayerTimes = {
  fajr: string;
  sunrise: string;
  zuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
};

export const todayPrayers: PrayerTimes = {
  fajr: "05:12",
  sunrise: "06:28",
  zuhr: "12:24",
  asr: "15:48",
  maghrib: "18:14",
  isha: "19:36",
};

export const hijriDate = "14 Jumada al-Akhirah 1447";
export const gregorianDate = "Tuesday, 19 May 2026";

export function getNextPrayer(): { name: string; time: string; in: string } {
  // Simplified — return Maghrib as next for the demo
  return { name: "Maghrib", time: "18:14", in: "2h 47m" };
}

export const dailyHadith = {
  text: "The best among you are those who have the best manners and character.",
  source: "Sahih al-Bukhari 3559",
  narrator: "Abdullah ibn Amr",
};

export const dailyAyah = {
  arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
  translation: "Indeed, with hardship comes ease.",
  reference: "Surah Ash-Sharh 94:6",
};
