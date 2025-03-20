import { useState, useEffect, useRef, FormEvent } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Volume2, ChevronRight, Lightbulb } from "lucide-react";
import { useSpeech } from "../hooks/use-speech";
import { useConfetti } from "../hooks/use-confetti";
import { Confetti } from "../components/ui/confetti";
import { useToast } from "../hooks/use-toast";
import { Word } from "@shared/schema";
import { playCelebrationSound, playErrorSound } from "../lib/sounds";
import { useLocation } from "wouter";

interface WordCardInputProps {
  word: Word;
  onNext: () => Promise<void>;
  currentIndex: number;
  totalWords: number;
  isMasteredReview?: boolean;
}

export default function WordCardInput({
  word,
  onNext,
  currentIndex,
  totalWords,
  isMasteredReview = false,
}: WordCardInputProps) {
  const [userInput, setUserInput] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [readyForNext, setReadyForNext] = useState(false);
  const [isProcessingNext, setIsProcessingNext] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [currentIndexState, setCurrentIndex] = useState(currentIndex);
  const [checkCount, setCheckCount] = useState(0); // Thêm state để theo dõi số lần kiểm tra
  const inputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);
  const redirectTimeoutRef = useRef<NodeJS.Timeout>();
  const { speak: originalSpeak } = useSpeech();
  const { showConfetti } = useConfetti();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessingAnswer, setIsProcessingAnswer] = useState(false);

  const currentNumber = currentIndexState;
  const isLastWord = currentIndexState === totalWords;

  useEffect(() => {
    if (!isMountedRef.current) return;

    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
    }
    setCheckCount(0); // Reset checkCount when word changes
    setUserInput("");
    setIsCorrect(null);
    setIsFlipped(false);
    setHintsUsed(0);
    setReadyForNext(false);
    setIsProcessingNext(false);
    setIsCompleted(false);

    // Auto focus input when component mounts or word changes
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [word.id]);

  const speak = (text: string) => {
    try {
      if (isMountedRef.current) {
        originalSpeak(text);
      }
    } catch (error) {
      console.error("Error speaking:", error);
    }
  };

  const validateInput = (input: string): boolean => {
    const trimmedInput = input.trim();
    if (!trimmedInput) {
      toast({
        title: "Thông báo",
        description: "Vui lòng nhập từ trước khi kiểm tra",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isFlipped && !isProcessingAnswer) {
      checkAnswer();
    }
  };

  const checkAnswer = async () => {
    if (isProcessingAnswer) return;

    const trimmedInput = userInput.trim();
    if (!validateInput(trimmedInput)) return;

    try {
      setIsProcessingAnswer(true);
      const isAnswerCorrect = trimmedInput.toLowerCase() === word.word.toLowerCase();

      // Chỉ cập nhật tiến độ nếu là lần kiểm tra đầu tiên
      if (checkCount === 0) {
        try {
          await fetch(`/api/words/${word.id}/progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isCorrect: isAnswerCorrect, isMasteredReview })
          });
        } catch (error) {
          console.error("Error updating word progress:", error);
        }
      }

      setCheckCount(prev => prev + 1);

      if (isAnswerCorrect) {
        if (!isMountedRef.current) return;

        setIsCorrect(true);
        setIsFlipped(true);
        setReadyForNext(true);
        setAnsweredCount((prev) => prev + 1);
        triggerConfetti();
        speak(word.word);
        playCelebrationSound();

        if (isMountedRef.current) {
          if (isLastWord) {
            setIsCompleted(true);
            triggerConfetti();
            toast({
              title: "Chúc mừng!",
              description: "Bạn đã hoàn thành bài học này! Quay về trang chủ trong vài giây...",
              variant: "default",
            });

            if (isMountedRef.current) {
              setLocation("/");
            }
          } else {
            toast({
              title: "Chính xác!",
              description: "Nhấn mũi tên phải hoặc nút 'Từ tiếp theo' để tiếp tục",
              variant: "default",
            });
          }
        }
      } else {
        if (!isMountedRef.current) return;

        setIsCorrect(false);
        playErrorSound();

        if (inputRef.current) {
          inputRef.current.classList.remove("animate-[shake_0.5s_ease-in-out]");
          void inputRef.current.offsetWidth;
          inputRef.current.classList.add("animate-[shake_0.5s_ease-in-out]");
          inputRef.current.focus();
        }

        toast({
          title: "Không chính xác",
          description: "Thử lại hoặc sử dụng gợi ý nếu cần",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error checking answer:", error);
    } finally {
      setIsProcessingAnswer(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !isFlipped && userInput.trim() && !isProcessingAnswer) {
        e.preventDefault();
        checkAnswer();
      } else if (e.key === "ArrowRight" && readyForNext && !isProcessingNext && !isCompleted) {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [readyForNext, isProcessingNext, isCompleted, isFlipped, userInput, isProcessingAnswer]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);


  const handleNext = async () => {
    if (!isMountedRef.current || !isFlipped || !readyForNext || isProcessingNext || isCompleted) {
      return;
    }

    if (isLastWord) {
      setIsCompleted(true);
      triggerConfetti();
      toast({
        title: "Chúc mừng!",
        description: "Bạn đã hoàn thành tất cả các từ trong bài học này! Quay về trang chủ trong vài giây...",
        variant: "default",
      });

      if (isMountedRef.current) {
        setLocation("/");
      }
      return;
    }

    try {
      setIsProcessingNext(true);
      await onNext();

      // Focus input after moving to next word
      if (inputRef.current && isMountedRef.current) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    } catch (error) {
      console.error("Error in handleNext:", error);
      if (isMountedRef.current) {
        setIsProcessingNext(false);
        toast({
          title: "Có lỗi xảy ra",
          description: "Không thể chuyển sang từ tiếp theo",
          variant: "destructive",
        });
      }
    }
  };

  const generateHint = () => {
    if (hintsUsed >= 4) return "Không còn gợi ý nào.";

    switch (hintsUsed) {
      case 0:
        return `Từ này có ${word.word.length} chữ cái và bắt đầu bằng "${word.word[0]}"`;
      case 1:
        return `Từ bắt đầu bằng "${word.word[0]}" và kết thúc bằng "${word.word[word.word.length - 1]}"`;
      case 2:
        const pattern = word.word.split("").map((c, i) => (i % 2 === 0 ? c : "_")).join("");
        return `Mẫu từ: ${pattern}`;
      case 3:
        const random = Math.floor(Math.random() * (word.word.length - 2)) + 1;
        const almost = word.word.split("").map((c, i) => (i === random ? "_" : c)).join("");
        return `Gần hoàn chỉnh: ${almost}`;
      default:
        return "Không còn gợi ý nào.";
    }
  };

  const handleHint = () => {
    if (!isMountedRef.current || hintsUsed >= 4) {
      toast({
        title: "Hết gợi ý",
        description: "Bạn đã dùng hết gợi ý cho từ này.",
        variant: "destructive",
      });
      return;
    }

    const hint = generateHint();
    setHintsUsed((prev) => prev + 1);

    toast({
      title: `Gợi ý ${hintsUsed + 1}/4`,
      description: hint,
      variant: "default",
    });

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const [showConfettiEffect, setShowConfettiEffect] = useState(false);

  const triggerConfetti = (callback?: () => void) => {
    setShowConfettiEffect(true);
    showConfetti();

    setTimeout(() => {
      setShowConfettiEffect(false);
      if (callback) callback();
    }, 3000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-0">
      {showConfettiEffect && <Confetti count={80} duration={3000} />}

      {/* Word content section - Equal height columns */}
      <div className="mb-6 grid grid-cols-4 gap-6 h-[400px]">
        {/* Definition section - 1/4 width */}
        <div className="col-span-1 p-6 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl font-semibold text-emerald-600 dark:text-emerald-400">Definition:</h4>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => speak(word.word)}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Volume2 className="text-emerald-600 dark:text-emerald-400" size={20} />
            </Button>
          </div>
          <div className="space-y-4">
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">{word.definition}</p>
            <p className="text-base text-slate-500 dark:text-slate-400 italic">{word.partOfSpeech}</p>
          </div>
        </div>

        {/* Vietnamese section - 3/4 width */}
        <div className="col-span-3 p-6 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 overflow-y-auto">
          <h4 className="text-xl font-semibold text-emerald-600 dark:text-emerald-400 mb-4">Nghĩa & Ví dụ:</h4>
          <div className="grid grid-cols-2 gap-5 auto-rows-min">
            {(word.meanings as any[]).map((meaning, index) => (
              <div
                key={index}
                className="p-5 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col"
              >
                <p className="text-xl mb-3 font-medium text-emerald-700 dark:text-emerald-300">
                  {meaning.meaning}
                </p>
                <div className="flex-grow space-y-3">
                  {meaning.examples.map((example: any, exIndex: number) => (
                    <div
                      key={exIndex}
                      className="pl-4 border-l-3 border-primary-300 dark:border-primary-700 py-1.5"
                    >
                      <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                        {example.vi}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Input section with buttons */}
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <label htmlFor="word-input" className="block text-lg font-medium text-slate-700 dark:text-slate-300">
            Enter the English word for this definition:
          </label>
          <div className="text-sm font-medium flex items-center text-slate-700 dark:text-slate-300">
            <Lightbulb className="inline-block mr-1 text-amber-500 dark:text-yellow-400" size={16} />
            <span className="font-bold">{4 - hintsUsed}</span> hints remaining
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            id="word-input"
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            className={`flex-1 px-4 py-3 h-12 text-lg text-slate-900 dark:text-white ${
              isCorrect === true
                ? "border-success-500 focus-visible:ring-success-500"
                : isCorrect === false
                ? "border-error-500 focus-visible:ring-error-500"
                : ""
            }`}
            placeholder="Type your answer here..."
            disabled={isFlipped || isCompleted}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            data-form-type="other"
            autoFocus
          />
          <Button
            type="button"
            onClick={handleHint}
            disabled={hintsUsed >= 4 || isFlipped || isCompleted}
            className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white dark:bg-yellow-500 dark:hover:bg-yellow-600 dark:text-black font-bold"
          >
            <Lightbulb className="text-white dark:text-black" size={20} />
          </Button>
          {isFlipped ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={isProcessingNext || !readyForNext || isCompleted}
              className={`font-bold px-6 py-2 ${
                isCompleted
                  ? "bg-green-600 hover:bg-green-700 text-white cursor-not-allowed opacity-50"
                  : "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
              }`}
            >
              {isCompleted ? (
                "Bài học đã hoàn thành"
              ) : (
                <>
                  Từ tiếp theo
                  <ChevronRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          ) : (
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 font-bold px-6 py-2"
            >
              Kiểm tra
            </Button>
          )}
        </div>
      </form>

      {/* Bottom guide text */}
      <div className="mt-4 text-sm text-slate-500 dark:text-slate-400 text-center">
        {isFlipped ? (
          isCompleted ? (
            <span>Chúc mừng! Bạn đã hoàn thành bài học</span>
          ) : (
            <span>Nhấn mũi tên phải hoặc nút 'Từ tiếp theo' để tiếp tục</span>
          )
        ) : (
          <span>
            Nhấn{" "}
            <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-md shadow-sm">
              Enter
            </kbd>{" "}
            để kiểm tra
          </span>
        )}
      </div>
    </div>
  );
}