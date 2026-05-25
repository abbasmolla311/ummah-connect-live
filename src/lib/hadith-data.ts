export type Hadith = {
  id: string;
  collection: string;
  number: string;
  narrator: string;
  arabic?: string;
  english: string;
};

export const HADITHS: Hadith[] = [
  { id: "nawawi-1", collection: "40 Hadith Nawawi", number: "1", narrator: "Umar ibn al-Khattab (RA)",
    arabic: "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى",
    english: "Actions are judged by intentions, and every person will get what they intended." },
  { id: "nawawi-2", collection: "40 Hadith Nawawi", number: "2", narrator: "Umar ibn al-Khattab (RA)",
    english: "Islam is to testify that there is no god but Allah and Muhammad is His Messenger, to establish prayer, give zakat, fast Ramadan, and perform Hajj if able. Iman is to believe in Allah, His angels, books, messengers, the Last Day, and divine decree. Ihsan is to worship Allah as if you see Him, and though you do not see Him, He surely sees you." },
  { id: "nawawi-13", collection: "40 Hadith Nawawi", number: "13", narrator: "Anas ibn Malik (RA)",
    arabic: "لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",
    english: "None of you truly believes until he loves for his brother what he loves for himself." },
  { id: "nawawi-15", collection: "40 Hadith Nawawi", number: "15", narrator: "Abu Hurayrah (RA)",
    english: "Whoever believes in Allah and the Last Day, let him speak good or remain silent. And whoever believes in Allah and the Last Day, let him honor his neighbor. And whoever believes in Allah and the Last Day, let him honor his guest." },
  { id: "nawawi-25", collection: "40 Hadith Nawawi", number: "25", narrator: "Abu Dharr (RA)",
    english: "Some of the companions of the Messenger of Allah ﷺ said: 'O Messenger of Allah, the wealthy have taken away all the rewards.' He said: 'Has not Allah made things for you to give in charity? Every Tasbih is charity, every Takbir is charity, every Tahmid is charity, every Tahlil is charity, enjoining good is charity, forbidding evil is charity, and in the sexual act of each of you is charity.'" },
  { id: "bukhari-1", collection: "Sahih Bukhari", number: "1",  narrator: "Umar ibn al-Khattab (RA)",
    english: "I heard Allah's Messenger ﷺ saying: The reward of deeds depends upon the intention and every person will get the reward according to what he has intended." },
  { id: "bukhari-6", collection: "Sahih Bukhari", number: "6",  narrator: "Ibn Abbas (RA)",
    english: "The Prophet ﷺ was the most generous of all the people, and he used to become more generous in Ramadan when Gabriel met him." },
  { id: "bukhari-2442", collection: "Sahih Bukhari", number: "2442", narrator: "Abdullah ibn Umar (RA)",
    english: "A Muslim is a brother of another Muslim. He does not oppress him, nor does he hand him over to an oppressor. Whoever fulfilled the needs of his brother, Allah will fulfill his needs." },
  { id: "muslim-2564", collection: "Sahih Muslim", number: "2564", narrator: "Abu Hurayrah (RA)",
    english: "Allah does not look at your appearance or wealth, but rather He looks at your hearts and actions." },
  { id: "muslim-91", collection: "Sahih Muslim", number: "91", narrator: "Abdullah ibn Masud (RA)",
    english: "No one who has the weight of a mustard seed of arrogance in his heart will enter Paradise." },
  { id: "tirmidhi-1924", collection: "Jami at-Tirmidhi", number: "1924", narrator: "Abdullah ibn Amr (RA)",
    english: "Those who are merciful will be shown mercy by the Most Merciful. Be merciful to those on the earth and the One in the heavens will have mercy upon you." },
  { id: "tirmidhi-2018", collection: "Jami at-Tirmidhi", number: "2018", narrator: "Abu Hurayrah (RA)",
    english: "Fear Allah wherever you are, follow a bad deed with a good one to wipe it out, and treat people with good character." },
  { id: "abudawud-4943", collection: "Sunan Abi Dawud", number: "4943", narrator: "Abdullah ibn Amr (RA)",
    english: "He who does not show mercy to our young ones, and does not realize the rights of our elders, is not from us." },
];
