// Types for the models từ schema chung
export type VocabularyGroup = {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  totalWords?: number;
  masteredWords?: number;
  dueCount?: number;
  nextDueDate?: Date | null;
};

export type Word = {
  id: number;
  groupId: number;
  word: string;
  ipa: string | null;
  partOfSpeech: string | null;
  definition: string;
  meanings: Meaning[];
  level: number;
  createdAt: Date;
};

export type Progress = {
  id: number;
  wordId: number;
  level: number;
  studyCount: number;
  correctFirstTry: boolean;
  lastStudied: Date;
  nextStudyDate: Date;
  isMastered: boolean;
};

export type Stats = {
  id: number;
  daysLearned: number;
  lastLearningDate: Date;
  streak: number;
};

export type User = {
  id: number;
  username: string;
  email: string;
  createdAt: Date;
};

// Types for meanings
export type Example = {
  en: string;
  vi: string;
};

export type Meaning = {
  meaning: string;
  examples: Example[];
};

// Type for dictionary import/export
export type DictionaryEntry = {
  word: string;
  IPA?: string | null;
  partOfSpeech?: string | null;
  definition: string;
  meanings: Meaning[];
};

export type Dictionary = DictionaryEntry[] | { dictionary: DictionaryEntry[] };