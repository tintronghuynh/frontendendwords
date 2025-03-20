import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../hooks/use-toast";
import { Word } from "@shared/schema";
import { playCelebrationSound } from "../lib/sounds";

interface StudyWord extends Word {
  progress?: {
    level: number;
    nextStudyDate: Date;
    isMastered: boolean;
  };
}

interface UseStudyWordsOptions {
  groupId: string;
  mode: "normal" | "mastered";
}

export function useStudyWords({ groupId, mode }: UseStudyWordsOptions) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedWords, setCompletedWords] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showConfettiEffect, setShowConfettiEffect] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const timerIntervalRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);

  // Fetch group details
  const { data: groupDetails } = useQuery<any[], Error, { id: number; name: string; description: string } | null>({
    queryKey: [`/api/groups`],
    select: (groups) => groups.find(g => g.id.toString() === groupId) || null,
  });

  // Fetch words based on mode
  const { data: words, isLoading: isLoadingWords } = useQuery<StudyWord[]>({
    queryKey: [`/api/groups/${groupId}/${mode === "mastered" ? "mastered" : "study"}`],
    enabled: !!groupId,
    refetchOnMount: true, // Always fetch fresh data when component mounts
    staleTime: 0, // Consider data stale immediately
    cacheTime: 0, // Don't cache the data
  });

  const studyWords = words || [];

  // Timer
  useEffect(() => {
    timerIntervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        setElapsedTime(prev => prev + 1);
      }
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNext = async (onRedirect: () => void) => {
    if (!studyWords || !isMountedRef.current || isRedirecting) return;

    try {
      const newCompletedWords = completedWords + 1;
      setCompletedWords(newCompletedWords);

      // Check if all words completed
      if (newCompletedWords >= studyWords.length) {
        setIsRedirecting(true);
        setShowConfettiEffect(true);
        playCelebrationSound();

        toast({
          title: "Chúc mừng! 🎉",
          description: mode === "mastered" 
            ? "Bạn đã hoàn thành ôn tập tất cả các từ đã thuộc."
            : "Bạn đã hoàn thành tất cả các từ trong phiên học này.",
          variant: "default",
        });

        // Force refetch all queries to update data
        queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });

        if (groupId) {
          queryClient.invalidateQueries({ 
            queryKey: [`/api/groups/${groupId}/words`],
            refetchType: 'all'
          });
          queryClient.invalidateQueries({ 
            queryKey: [`/api/groups/${groupId}/progress`],
            refetchType: 'all'
          });
          queryClient.invalidateQueries({
            queryKey: [`/api/groups/${groupId}/mastered`],
            refetchType: 'all'
          });
        }

        // Schedule redirection after delay
        setTimeout(() => {
          if (isMountedRef.current) {
            onRedirect();
          }
        }, 2000);
        return;
      }

      // Move to next word
      if (isMountedRef.current) {
        setCurrentIndex(currentIndex + 1);
      }
    } catch (error) {
      console.error("Error in handleNext:", error);
      if (isMountedRef.current) {
        toast({
          title: "Có lỗi xảy ra",
          description: "Không thể chuyển sang từ tiếp theo",
          variant: "destructive",
        });
      }
    }
  };

  return {
    groupDetails,
    studyWords,
    currentIndex,
    completedWords,
    elapsedTime,
    showConfettiEffect,
    isLoadingWords,
    formatTime,
    handleNext,
  };
}