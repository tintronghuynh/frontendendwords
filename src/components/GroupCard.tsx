import { useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Pencil, Trash, Plus, Layers, Keyboard, Calendar, GraduationCap, FileDown } from "lucide-react";
import { VocabularyGroup } from "@shared/schema";
import { useLocation } from "wouter";
import WordListModal from "./WordListModal";
import { useToast } from "../hooks/use-toast";

interface GroupCardProps {
  group: VocabularyGroup & {
    totalWords: number;
    masteredWords: number;
    dueCount: number;
    nextDueDate?: Date | null;
  };
  onEdit: (group: VocabularyGroup) => void;
  onDelete: (group: VocabularyGroup) => void;
  onAddWords: (group: VocabularyGroup) => void;
}

const GroupCard = ({ group, onEdit, onDelete, onAddWords }: GroupCardProps) => {
  const [, setLocation] = useLocation();
  const [showWordListModal, setShowWordListModal] = useState(false);
  const [showMasteredWordsModal, setShowMasteredWordsModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const progress = group.totalWords > 0
    ? Math.floor((group.masteredWords / group.totalWords) * 100)
    : 0;

  const handleExportToExcel = async () => {
    try {
      setIsExporting(true);
      window.location.href = `/api/groups/${group.id}/export-excel`;
      toast({
        title: "Xuất Excel thành công",
        description: "Đang tải xuống file Excel cho nhóm từ vựng.",
      });
    } catch (error) {
      console.error("Export Excel error:", error);
      toast({
        title: "Xuất Excel thất bại",
        description: "Không thể tải xuống file Excel. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{group.name}</h3>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(group)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={() => onDelete(group)}
              className="text-slate-400 hover:text-error-500 p-1"
            >
              <Trash size={16} />
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center text-sm text-slate-700 dark:text-slate-300">
          <Layers className="mr-2" size={16} />
          <button 
            onClick={() => setShowWordListModal(true)} 
            className="hover:underline hover:text-primary-600 dark:hover:text-primary-400"
          >
            Xem danh sách từ
          </button>
          <span className="mx-2">•</span>
          <button 
            onClick={() => setShowMasteredWordsModal(true)}
            className="hover:underline hover:text-primary-600 dark:hover:text-primary-400"
          >
            Xem từ đã thuộc
          </button>
          <span className="mx-2">•</span>
          <span>{group.totalWords} từ</span>
          <span className="mx-2">•</span>
          <span>{group.masteredWords} từ đã thuộc</span>
        </div>

        {group.dueCount > 0 && (
          <div className="mb-4 px-3 py-2 bg-amber-50 dark:bg-amber-900/30 rounded-md border border-amber-200 dark:border-amber-800">
            <div className="flex items-center text-sm text-amber-700 dark:text-amber-300">
              <Calendar className="mr-2 flex-shrink-0" size={14} />
              <span><strong>{group.dueCount}</strong> từ cần ôn tập</span>
            </div>
            {group.nextDueDate && (
              <div className="text-xs text-amber-600 dark:text-amber-400 mt-1 ml-6">
                Ngày ôn tập tiếp theo: {new Date(group.nextDueDate).toLocaleDateString()}
              </div>
            )}
          </div>
        )}

        <Progress value={progress} className="h-2 mb-6 bg-slate-200 dark:bg-slate-700" />

        <div className="mb-4">
          <div className="flex-none text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Chọn phương pháp học:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              onClick={() => setLocation(`/study/flashcard/${group.id}`)}
              className="flex flex-col h-auto py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <div className="flex items-center justify-center w-full">
                <Layers className="mr-2" size={18} />
                <span className="font-medium">Flashcard</span>
              </div>
            </Button>
            <Button
              onClick={() => setLocation(`/study/input/${group.id}`)}
              className="flex flex-col h-auto py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <div className="flex items-center justify-center w-full">
                <Keyboard className="mr-2" size={18} />
                <span className="font-medium">Input Mode</span>
              </div>
            </Button>
            {group.masteredWords > 0 && (
              <Button
                onClick={() => setLocation(`/study/mastered/${group.id}`)}
                className="flex flex-col h-auto py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white col-span-2"
              >
                <div className="flex items-center justify-center w-full">
                  <GraduationCap className="mr-2" size={18} />
                  <span className="font-medium">Ôn tập từ đã thuộc ({group.masteredWords})</span>
                </div>
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onAddWords(group)}
            className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-300"
          >
            <Plus className="mr-2" size={16} />
            Thêm từ mới
          </Button>

          <Button
            variant="outline"
            onClick={handleExportToExcel}
            disabled={isExporting || group.totalWords === 0}
            className="px-3 py-2 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-900 dark:text-emerald-300"
          >
            <FileDown className="mr-2" size={16} />
            Tải Excel
          </Button>
        </div>
      </CardContent>

      <WordListModal
        isOpen={showWordListModal}
        onClose={() => setShowWordListModal(false)}
        groupId={group.id}
        title={`Tất cả từ trong "${group.name}"`}
        type="all"
      />

      <WordListModal
        isOpen={showMasteredWordsModal}
        onClose={() => setShowMasteredWordsModal(false)}
        groupId={group.id}
        title={`Từ đã thuộc trong "${group.name}"`}
        type="mastered"
      />
    </Card>
  );
};

export default GroupCard;