import { useState, useEffect, useRef } from "react";
import { Button } from "../components/ui/button";
import { Volume2, ChevronLeft, ChevronRight } from "lucide-react";
import { useSpeech } from "../hooks/use-speech";
import { Word } from "@shared/schema";

interface WordCardFlashcardProps {
  word: Word;
  onPrevious: () => void;
  onNext: () => void;
  currentIndex: number;
  totalWords: number;
  answeredCount: number;
}

export default function WordCardFlashcard({ 
  word, 
  onPrevious, 
  onNext,
  currentIndex,
  totalWords,
  answeredCount
}: WordCardFlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const { speak: originalSpeak } = useSpeech();
  const speakTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Hiển thị chính xác số thứ tự từ vựng
  const currentNumber = currentIndex + 1;

  // Tính toán % tiến trình:
  // - Nếu chưa hoàn thành từ nào, hiển thị 0%
  // - Nếu đã hoàn thành ít nhất 1 từ, tính % dựa trên số từ đã hoàn thành
  const progressPercentage = answeredCount === 0
    ? 0
    : Math.floor((answeredCount / totalWords) * 100);

  const speak = (text: string) => {
    try {
      originalSpeak(text);
    } catch (e) {
      // Silently ignore any errors
    }
  };

  useEffect(() => {
    setIsFlipped(false);
    speak(word.word);

    if (speakTimerRef.current) {
      clearInterval(speakTimerRef.current);
    }

    speakTimerRef.current = setInterval(() => {
      speak(word.word);
    }, 4000);

    return () => {
      if (speakTimerRef.current) {
        clearInterval(speakTimerRef.current);
      }
    };
  }, [word.id]);

  const handleFlip = () => {
    setIsFlipped(prevState => !prevState);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
      }

      switch (e.key) {
        case "Enter":
          handleFlip();
          break;
        case "ArrowLeft":
          onPrevious();
          break;
        case "ArrowRight":
          onNext();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onPrevious, onNext]);

  return (
    <div className="w-full max-w-[90rem] mx-auto">
      <div className="mb-4 max-w-[90rem] mx-auto">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Từ {currentNumber} / {totalWords}
          </span>
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {progressPercentage}% Hoàn thành
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div 
            className="bg-primary-500 h-2 rounded-full transition-all duration-300 ease-in-out" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      <div className="flip-card h-[400px] w-full max-w-[90rem] mx-auto mb-6 perspective-1000">
        <div 
          className={`relative w-full h-full transition-transform duration-600 transform-style-preserve-3d ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          <div className="absolute inset-0 backface-hidden bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 flex flex-col items-center justify-center text-center">
            <div className="px-5 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full mb-6">
              <p className="text-xl font-medium uppercase tracking-wide">{word.partOfSpeech}</p>
            </div>
            <h2 className="text-6xl font-bold text-slate-900 dark:text-white mb-6">{word.word}</h2>
            <p className="text-2xl font-mono mb-8 text-slate-600 dark:text-slate-400">{word.ipa}</p>
            <button 
              onClick={() => speak(word.word)}
              className="p-4 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <Volume2 className="text-primary-600 dark:text-primary-400" size={32} />
            </button>
          </div>

          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 overflow-y-auto">
            <div className="mb-8">
              <h3 className="text-2xl font-semibold text-primary-600 dark:text-primary-400 mb-4">Definition</h3>
              <div className="p-5 bg-primary-50 dark:bg-primary-900/30 rounded-lg border border-primary-200 dark:border-primary-800">
                <p className="text-xl font-medium text-slate-800 dark:text-slate-200">
                  {word.definition}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-primary-600 dark:text-primary-400 mb-4">Examples</h3>
              <div className="space-y-4">
                {(word.meanings as any[]).map((meaning, index) => (
                  <div key={index} className="p-5 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                    <p className="text-xl mb-3 font-medium text-slate-700 dark:text-slate-300">{meaning.meaning}</p>
                    <div className="space-y-3">
                      {meaning.examples.map((example: any, exIndex: number) => (
                        <div key={exIndex} className="pl-4 border-l-3 border-primary-300 dark:border-primary-700">
                          <p className="mb-2 text-lg text-slate-800 dark:text-slate-200">
                            <span className="font-medium text-primary-600 dark:text-primary-400">EN:</span> {example.en}
                          </p>
                          <p className="text-lg text-slate-700 dark:text-slate-300">
                            <span className="font-medium text-primary-600 dark:text-primary-400">VI:</span> {example.vi}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between max-w-[90rem] mx-auto">
        <Button
          onClick={onPrevious}
          className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 shadow-sm"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button
          onClick={handleFlip}
          className="px-6 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900/50 border-none"
        >
          {isFlipped ? "Mặt trước" : "Mặt sau"} (Enter)
        </Button>
        <Button
          onClick={onNext}
          className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 shadow-sm"
        >
          Next
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}