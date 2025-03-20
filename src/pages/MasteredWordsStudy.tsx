import { useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Timer } from "lucide-react";
import WordCardInput from "../components/WordCardInput";
import { Button } from "../components/ui/button";
import { Confetti } from "../components/ui/confetti";
import { playCelebrationSound } from "../lib/sounds";
import { Skeleton } from "../components/ui/skeleton";
import { useStudyWords } from "../hooks/useStudyWords";

export default function MasteredWordsStudy() {
  const { groupId } = useParams<{ groupId: string }>();
  const [, setLocation] = useLocation();
  const isMountedRef = useRef(true);

  const {
    groupDetails,
    studyWords,
    currentIndex,
    completedWords,
    elapsedTime,
    showConfettiEffect,
    isLoadingWords,
    formatTime,
    handleNext,
  } = useStudyWords({
    groupId,
    mode: "mastered"
  });

  const handleRedirect = () => {
    if (isMountedRef.current) {
      setLocation("/");
    }
  };

  // Cleanup when unmounting
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  if (isLoadingWords) {
    return (
      <div className="py-8 px-4 max-w-7xl mx-auto w-full">
        <LoadingState />
      </div>
    );
  }

  if (!studyWords || studyWords.length === 0) {
    return (
      <div className="py-8 px-4 max-w-7xl mx-auto w-full">
        <EmptyState groupName={groupDetails?.name} onBack={handleRedirect} />
      </div>
    );
  }

  return (
    <div className="py-8 px-4 max-w-7xl mx-auto w-full">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={handleRedirect}
            className="mr-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <ArrowLeft size={20} />
          </Button>
          <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">
            Ôn tập từ đã thuộc: {groupDetails?.name}
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center text-sm text-slate-700 dark:text-slate-300">
            <Timer className="mr-2" size={16} />
            <span>{formatTime(elapsedTime)}</span>
          </div>
        </div>
      </div>

      <div className="mb-4 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Ôn tập từ đã thuộc: {completedWords + 1}/{studyWords.length}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center">
        {studyWords[currentIndex] && (
          <WordCardInput
            word={studyWords[currentIndex]}
            onNext={() => handleNext(handleRedirect)}
            currentIndex={currentIndex + 1}
            totalWords={studyWords.length}
            isMasteredReview={true}
          />
        )}
      </div>

      {showConfettiEffect && (
        <>
          <Confetti count={50} duration={3000} />
          {playCelebrationSound()}
        </>
      )}
    </div>
  );
}

const LoadingState = () => (
  <div className="space-y-8">
    <div className="flex items-center">
      <Skeleton className="h-10 w-10 mr-4" />
      <Skeleton className="h-8 w-64" />
    </div>
    <div className="space-y-6">
      <Skeleton className="h-64 w-full max-w-4xl mx-auto" />
      <Skeleton className="h-12 w-full max-w-lg mx-auto" />
    </div>
  </div>
);

const EmptyState = ({ groupName, onBack }: { groupName?: string; onBack: () => void }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <h3 className="text-xl font-medium text-slate-700 dark:text-slate-300 mb-4">
      Không có từ nào đã thuộc
    </h3>
    <p className="text-slate-600 dark:text-slate-400 mb-6">
      Hãy học thêm từ vựng để có thể ôn tập lại sau này
    </p>
    <Button
      onClick={onBack}
      className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600"
    >
      Quay lại trang chủ
    </Button>
  </div>
);