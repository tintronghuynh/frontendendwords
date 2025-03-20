import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Plus, Calendar, Book, CheckCircle, Clock, AlertCircle } from "lucide-react";
import AddGroupModal from "../components/AddGroupModal";
import EditGroupModal from "../components/EditGroupModal";
import DeleteGroupModal from "../components/DeleteGroupModal";
import AddWordsModal from "../components/AddWordsModal";
import WordListModal from "../components/WordListModal";
import GroupCard from "../components/GroupCard";
import { VocabularyGroup } from "../../../shared/schema";
import { Skeleton } from "../components/ui/skeleton";

interface Stats {
  daysLearned: number;
  totalWords: number;
  masteredWords: number;
  wordsToLearn: number;
}

interface StatsCardProps {
  title: string;
  value: number | null;
  icon: React.ReactNode;
  color: "primary" | "warning" | "success" | "error";
  onClick?: () => void;
}

export default function Home() {
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [isDeleteGroupModalOpen, setIsDeleteGroupModalOpen] = useState(false);
  const [isAddWordsModalOpen, setIsAddWordsModalOpen] = useState(false);
  const [isWordListModalOpen, setIsWordListModalOpen] = useState(false);
  const [wordListType, setWordListType] = useState<'all' | 'mastered'>('all');
  const [wordListTitle, setWordListTitle] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<VocabularyGroup | null>(null);

  const { data: groups = [], isLoading: isLoadingGroups } = useQuery<VocabularyGroup[]>({
    queryKey: ["/api/groups"],
    refetchInterval: 3000,
  });

  const { data: stats = { daysLearned: 0, totalWords: 0, masteredWords: 0, wordsToLearn: 0 }, isLoading: isLoadingStats } = useQuery<Stats>({
    queryKey: ["/api/stats"],
    refetchInterval: 3000,
  });

  const handleEditGroup = (group: VocabularyGroup) => {
    setSelectedGroup(group);
    setIsEditGroupModalOpen(true);
  };

  const handleDeleteGroup = (group: VocabularyGroup) => {
    setSelectedGroup(group);
    setIsDeleteGroupModalOpen(true);
  };

  const handleAddWords = (group: VocabularyGroup) => {
    setSelectedGroup(group);
    setIsAddWordsModalOpen(true);
  };

  const handleOpenWordList = (groupId: number, title: string, type: 'all' | 'mastered' = 'all') => {
    setSelectedGroup({ id: groupId } as VocabularyGroup);
    setWordListTitle(title);
    setWordListType(type);
    setIsWordListModalOpen(true);
  };

  const handleStatsCardClick = (statType: string) => {
    if (groups && groups.length > 0) {
      const sortedGroups = [...groups].sort((a, b) =>
        (b.totalWords || 0) - (a.totalWords || 0)
      );

      const targetGroup = sortedGroups[0];

      if (targetGroup) {
        switch (statType) {
          case 'totalWords':
            handleOpenWordList(targetGroup.id, `Tất cả từ vựng - ${targetGroup.name}`, 'all');
            break;
          case 'masteredWords':
            handleOpenWordList(targetGroup.id, `Từ vựng đã thuộc - ${targetGroup.name}`, 'mastered');
            break;
          case 'wordsToLearn':
            handleOpenWordList(targetGroup.id, `Từ vựng cần học - ${targetGroup.name}`, 'all');
            break;
        }
      }
    }
  };

  const totalDueWords = !isLoadingGroups && groups ?
    groups.reduce((total: number, group: VocabularyGroup) => total + (group.dueCount || 0), 0) : 0;

  return (
    <div className="py-8 px-4 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-heading font-bold mb-6">Your Learning Progress</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <StatsCard
            title="Days Learning"
            value={isLoadingStats ? null : stats?.daysLearned || 0}
            icon={<Calendar className="text-primary-600 dark:text-primary-400" />}
            color="primary"
          />
          <StatsCard
            title="Total Words"
            value={isLoadingStats ? null : stats?.totalWords || 0}
            icon={<Book className="text-warning-500 dark:text-warning-400" />}
            color="warning"
            onClick={() => handleStatsCardClick('totalWords')}
          />
          <StatsCard
            title="Mastered Words"
            value={isLoadingStats ? null : stats?.masteredWords || 0}
            icon={<CheckCircle className="text-success-500 dark:text-success-400" />}
            color="success"
            onClick={() => handleStatsCardClick('masteredWords')}
          />
          <StatsCard
            title="Words to Learn"
            value={isLoadingStats ? null : stats?.wordsToLearn || 0}
            icon={<Clock className="text-error-500 dark:text-error-400" />}
            color="error"
            onClick={() => handleStatsCardClick('wordsToLearn')}
          />
          <StatsCard
            title="Due Today"
            value={isLoadingGroups ? null : totalDueWords}
            icon={<AlertCircle className="text-amber-500 dark:text-amber-400" />}
            color="warning"
          />
        </div>
      </div>

      <div className="mb-8 flex justify-between items-center">
        <h2 className="text-2xl font-heading font-bold">Your Vocabulary Groups</h2>
        <Button
          onClick={() => setIsAddGroupModalOpen(true)}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white dark:text-white text-slate-900 rounded-lg shadow-sm flex items-center gap-2"
        >
          <Plus size={18} />
          <span>Add Group</span>
        </Button>
      </div>

      {isLoadingGroups ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-2/3 mb-4" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-2 w-full mb-6" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {groups && groups.length > 0 ? (
            groups.map((group: VocabularyGroup) => (
              <GroupCard
                key={group.id}
                group={group}
                onEdit={handleEditGroup}
                onDelete={handleDeleteGroup}
                onAddWords={handleAddWords}
              />
            ))
          ) : (
            <div className="col-span-3 py-12 text-center">
              <h3 className="text-xl font-medium text-gray-600 dark:text-gray-300 mb-4">
                No vocabulary groups yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Get started by creating your first vocabulary group
              </p>
              <Button
                onClick={() => setIsAddGroupModalOpen(true)}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-slate-900 dark:text-white"
              >
                <Plus size={18} className="mr-2" />
                Create Group
              </Button>
            </div>
          )}
        </div>
      )}

      <AddGroupModal
        isOpen={isAddGroupModalOpen}
        onClose={() => setIsAddGroupModalOpen(false)}
      />

      <EditGroupModal
        isOpen={isEditGroupModalOpen}
        onClose={() => setIsEditGroupModalOpen(false)}
        group={selectedGroup}
      />

      <DeleteGroupModal
        isOpen={isDeleteGroupModalOpen}
        onClose={() => setIsDeleteGroupModalOpen(false)}
        group={selectedGroup}
      />

      <AddWordsModal
        isOpen={isAddWordsModalOpen}
        onClose={() => setIsAddWordsModalOpen(false)}
        group={selectedGroup}
      />

      {selectedGroup && (
        <WordListModal
          isOpen={isWordListModalOpen}
          onClose={() => setIsWordListModalOpen(false)}
          groupId={selectedGroup.id}
          title={wordListTitle}
          type={wordListType}
        />
      )}
    </div>
  );
}

function StatsCard({ title, value, icon, color, onClick }: StatsCardProps) {
  const getColorClass = () => {
    switch (color) {
      case "primary": return "bg-primary-100 dark:bg-primary-900/30";
      case "warning": return "bg-warning-100 dark:bg-warning-900/30";
      case "success": return "bg-success-100 dark:bg-success-900/30";
      case "error": return "bg-error-100 dark:bg-error-900/30";
      default: return "bg-slate-100 dark:bg-slate-900/30";
    }
  };

  const isClickable = !!onClick;

  return (
    <Card
      className={`bg-white dark:bg-slate-800 shadow-sm ${isClickable ? 'hover:shadow-md transition-shadow duration-200 cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
            {value === null ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <div className="flex items-center">
                <p className="text-3xl font-bold">{value}</p>
                {isClickable && (
                  <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">(Click để xem)</span>
                )}
              </div>
            )}
          </div>
          <div className={`h-12 w-12 ${getColorClass()} rounded-full flex items-center justify-center`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}