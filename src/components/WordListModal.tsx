import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "../components/ui/skeleton";
import { Word, Progress } from "@shared/schema";

interface WordListModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: number;
  title: string;
  type: 'all' | 'mastered';
}

type WordWithProgress = Word & { progress?: Progress };

export default function WordListModal({ isOpen, onClose, groupId, title, type }: WordListModalProps) {
  // Lấy danh sách các từ và cho phép reload khi có invalidate hoặc mở lại modal
  const { data: words, isLoading: isLoadingWords } = useQuery<Word[]>({
    queryKey: [type === 'mastered' ? `/api/groups/${groupId}/mastered` : `/api/groups/${groupId}/words`],
    enabled: isOpen,
    staleTime: 0, // Cho phép reload khi có invalidate
    refetchOnMount: true, // Reload khi modal mở lại
    refetchOnWindowFocus: false,
  });

  // Lấy thông tin tiến độ học cho mỗi từ và cho phép reload khi có invalidate hoặc mở lại modal
  const { data: progressData, isLoading: isLoadingProgress } = useQuery<Progress[]>({
    queryKey: [`/api/groups/${groupId}/progress`],
    enabled: isOpen && words && words.length > 0,
    staleTime: 0, // Cho phép reload khi có invalidate
    refetchOnMount: true, // Reload khi modal mở lại
    refetchOnWindowFocus: false,
  });

  // Kết hợp thông tin từ và tiến độ
  const wordsWithProgress: WordWithProgress[] = words?.map(word => {
    const progress = progressData?.find(p => p.wordId === word.id);
    return { ...word, progress };
  }) || [];

  // Sắp xếp từ theo cấp độ từ thấp đến cao
  const sortedWords = [...(wordsWithProgress || [])].sort((a, b) => {
    const levelA = a.progress?.level || 0;
    const levelB = b.progress?.level || 0;
    return levelA - levelB;
  });

  const isLoading = isLoadingWords || isLoadingProgress;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-slate-800 sm:max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading font-bold text-slate-900 dark:text-white">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : sortedWords && sortedWords.length > 0 ? (
            <div className="space-y-4">
              {sortedWords.map((word) => (
                <div
                  key={word.id}
                  className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <p className="text-slate-900 dark:text-white">
                          <span className="font-medium">{word.word}:</span>{" "}
                          {word.definition}
                        </p>
                      </div>
                      {word.ipa && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          {word.ipa}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-600 dark:text-slate-400">
              No {type === 'mastered' ? 'mastered words' : 'words'} in this group
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}