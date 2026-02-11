// Word pairs: English -> Russian
// Curated for common, recognizable words that work well with speech recognition
const wordPairs = [
  { en: "Apple", ru: "яблоко", emoji: "🍎" },
  { en: "Water", ru: "вода", emoji: "💧" },
  { en: "Sun", ru: "солнце", emoji: "☀️" },
  { en: "Cat", ru: "кот", emoji: "🐱" },
  { en: "Dog", ru: "собака", emoji: "🐶" },
  { en: "House", ru: "дом", emoji: "🏠" },
  { en: "Book", ru: "книга", emoji: "📖" },
  { en: "Fire", ru: "огонь", emoji: "🔥" },
  { en: "Moon", ru: "луна", emoji: "🌙" },
  { en: "Star", ru: "звезда", emoji: "⭐" },
  { en: "Tree", ru: "дерево", emoji: "🌳" },
  { en: "Fish", ru: "рыба", emoji: "🐟" },
  { en: "Bird", ru: "птица", emoji: "🐦" },
  { en: "Snow", ru: "снег", emoji: "❄️" },
  { en: "Rain", ru: "дождь", emoji: "🌧️" },
  { en: "Heart", ru: "сердце", emoji: "❤️" },
  { en: "Music", ru: "музыка", emoji: "🎵" },
  { en: "Time", ru: "время", emoji: "⏰" },
  { en: "Love", ru: "любовь", emoji: "💕" },
  { en: "Friend", ru: "друг", emoji: "🤝" },
  { en: "Night", ru: "ночь", emoji: "🌃" },
  { en: "Flower", ru: "цветок", emoji: "🌸" },
  { en: "Cloud", ru: "облако", emoji: "☁️" },
  { en: "Wind", ru: "ветер", emoji: "💨" },
  { en: "Light", ru: "свет", emoji: "💡" },
  { en: "Mountain", ru: "гора", emoji: "⛰️" },
  { en: "River", ru: "река", emoji: "🏞️" },
  { en: "Earth", ru: "земля", emoji: "🌍" },
  { en: "King", ru: "король", emoji: "👑" },
  { en: "Dream", ru: "мечта", emoji: "💭" },
];

export function getShuffledWords() {
  const shuffled = [...wordPairs];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default wordPairs;
