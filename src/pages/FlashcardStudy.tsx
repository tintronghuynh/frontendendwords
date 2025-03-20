import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Timer } from "lucide-react";
import WordCardFlashcard from "../components/WordCardFlashcard";
import { useConfetti } from "../hooks/use-confetti";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { Confetti } from "../components/ui/confetti";
import { useToast } from "../hooks/use-toast";
import { Word } from "../../../shared/schema";

interface StudyWord extends Word {
  progress?: {
    level: number;
    nextStudyDate: Date;
    isMastered: boolean;
    correctFirstTry?: boolean;
  };
}

interface GroupData {
  id: number;
  name: string;
  description: string;
}

export default function FlashcardStudy() {
  const { groupId } = useParams<{ groupId: string }>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answeredWords, setAnsweredWords] = useState<Set<number>>(new Set());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isProcessingNext, setIsProcessingNext] = useState(false);
  const [, setLocation] = useLocation();
  const { isVisible } = useConfetti();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: groupDetails, isLoading: isLoadingGroup } = useQuery<any[], Error, GroupData | null>({
    queryKey: [`/api/groups`],
    select: (groups) => groups.find(g => g.id.toString() === groupId) || null
  });

  const { data: words, isLoading: isLoadingWords } = useQuery<StudyWord[]>({
    queryKey: [`/api/groups/${groupId}/words`],
    enabled: !!groupId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  const displayWords = words || [];

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = async () => {
    if (!displayWords || isProcessingNext) return;

    setIsProcessingNext(true);
    const currentWord = displayWords[currentIndex];

    try {
      // Kiểm tra nghiêm ngặt: từ hiện tại phải được trả lời đúng
      if (!currentWord.progress?.correctFirstTry) {
        toast({
          title: "Hãy thử lại",
          description: "Bạn cần trả lời đúng từ hiện tại trước khi chuyển sang từ tiếp theo.",
          variant: "destructive",
        });
        setIsProcessingNext(false);
        return;
      }

      // Đánh dấu từ này đã được trả lời đúng
      setAnsweredWords(prev => new Set([...prev, currentWord.id]));

      if (currentIndex >= displayWords.length - 1) {
        toast({
          title: "Chúc mừng!",
          description: "Bạn đã hoàn thành phiên học tập này.",
          variant: "default",
        });

        queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        // Thêm invalidate cho danh sách từ và tiến độ
        if (groupId) {
          queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}/words`] });
          queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}/progress`] });
        }

        setTimeout(() => {
          setLocation("/");
        }, 2000);
      } else {
        setCurrentIndex(currentIndex + 1);
      }
    } catch (error) {
      console.error("Error in handleNext:", error);
      toast({
        title: "Có lỗi xảy ra",
        description: "Không thể chuyển sang từ tiếp theo",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setIsProcessingNext(false);
      }, 500);
    }
  };

  if (isLoadingGroup || isLoadingWords) {
    return (
      <div className="py-8 px-4 max-w-7xl mx-auto w-full">
        <LoadingState />
      </div>
    );
  }

  if (!displayWords || displayWords.length === 0) {
    return (
      <div className="py-8 px-4 max-w-7xl mx-auto w-full">
        <EmptyState groupName={groupDetails?.name} onBack={() => setLocation("/")} />
      </div>
    );
  }

  return (
    <div className="py-8 px-4 max-w-7xl mx-auto w-full">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="mr-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <ArrowLeft size={20} />
          </Button>
          <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">
            Học tập: {groupDetails?.name}
          </h2>
        </div>
        <div className="flex items-center text-sm text-slate-700 dark:text-slate-300">
          <Timer className="mr-2" size={16} />
          <span>{formatTime(elapsedTime)}</span>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center">
        {displayWords && displayWords.length > 0 && (
          <WordCardFlashcard
            word={displayWords[currentIndex]}
            onPrevious={handlePrevious}
            onNext={handleNext}
            currentIndex={currentIndex}
            totalWords={displayWords.length}
            answeredCount={answeredWords.size}
          />
        )}
      </div>

      {isVisible && <Confetti count={50} duration={3000} />}
    </div>
  );
}

const LoadingState = () => (
  <>
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center">
        <Button
          variant="ghost"
          disabled
          className="mr-4 p-2 rounded-full"
        >
          <ArrowLeft size={20} />
        </Button>
        <Skeleton className="h-8 w-64" />
      </div>
      <Skeleton className="h-6 w-24" />
    </div>
    <div className="flex flex-col items-center justify-center">
      <Skeleton className="h-64 w-full max-w-2xl mb-6 rounded-xl" />
      <Skeleton className="h-10 w-full max-w-2xl mb-8" />
      <Skeleton className="h-12 w-full max-w-2xl" />
    </div>
  </>
);

const EmptyState = ({ groupName, onBack }: { groupName?: string, onBack: () => void }) => (
  <>
    <div className="mb-6 flex items-center">
      <Button
        variant="ghost"
        onClick={onBack}
        className="mr-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        <ArrowLeft size={20} />
      </Button>
      <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">
        Học tập: {groupName}
      </h2>
    </div>
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <h3 className="text-xl font-medium text-slate-700 dark:text-slate-300 mb-4">
        Không có từ nào cần học
      </h3>
      <p className="text-slate-600 dark:text-slate-400 mb-6">
        Hãy thêm từ vựng vào nhóm này trước khi bắt đầu học
      </p>
      <Button
        onClick={onBack}
        className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600"
      >
        Quay lại trang chủ
      </Button>
    </div>
  </>
);