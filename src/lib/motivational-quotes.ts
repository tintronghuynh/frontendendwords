// A collection of motivational quotes about learning and vocabulary
export const motivationalQuotes = [
  "The only way to learn vocabulary effectively is through spaced repetition and consistent practice.",
  "Learning a new word is like making a new friend; it enriches your life in ways you never expected.",
  "Vocabulary is the paint with which you color your thoughts and express your ideas.",
  "The difference between the right word and the almost right word is like the difference between lightning and a lightning bug.",
  "A rich vocabulary makes complex thoughts possible.",
  "Your vocabulary is your personal toolkit for expressing yourself with precision and clarity.",
  "The limits of my language mean the limits of my world.",
  "Words are free. It's how you use them that may cost you.",
  "Learning new words is investing in your most powerful communication asset.",
  "A single word has the power to change the entire meaning of a conversation.",
  "Words have energy and power with the ability to help and to heal.",
  "The more words you know, the more clearly and powerfully you will think.",
  "Learning vocabulary is not about memorization; it's about meaningful connections.",
  "Spaced repetition isn't just a learning technique; it's the way our brains naturally remember.",
  "Every new word you learn gives you a new perspective on the world.",
  "The quality of your vocabulary reflects the quality of your thinking.",
  "Your vocabulary is the foundation upon which all your communication is built.",
  "Words are the building blocks of comprehension and expression.",
  "Today's vocabulary practice is tomorrow's eloquent speech.",
  "The journey of a thousand words begins with a single flashcard.",
  "Great minds are built one word at a time.",
  "Words are the currency of thought; the richer your vocabulary, the wealthier your thinking.",
  "Like physical exercise, vocabulary building strengthens your mental muscles.",
  "Each word you learn is a stepping stone to more sophisticated ideas.",
  "Vocabulary is to thought what water is to plants – essential for growth.",
  "Consistency in learning vocabulary is more important than intensity.",
  "The best investment in your future is the expansion of your vocabulary.",
  "Words are the lens through which you view the world; change your words, change your perspective.",
  "Your vocabulary doesn't just reflect your knowledge; it shapes how you understand new concepts.",
  "The more precisely you can name things, the more clearly you can think about them."
];

export function getRandomQuote(): string {
  return motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
}
