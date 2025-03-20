import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { queryClient } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { X } from "lucide-react";
import { VocabularyGroup } from "@shared/schema";

interface DeleteGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: VocabularyGroup | null;
}

export default function DeleteGroupModal({ isOpen, onClose, group }: DeleteGroupModalProps) {
  const { toast } = useToast();

  const deleteGroupMutation = useMutation({
    mutationFn: async () => {
      if (!group) throw new Error("Group not found");
      const res = await apiRequest("DELETE", `/api/groups/${group.id}`, undefined);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({
        title: "Success",
        description: "Vocabulary group deleted successfully!",

      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete vocabulary group. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    deleteGroupMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-slate-800 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading font-bold">Delete Vocabulary Group</DialogTitle>
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X size={18} />
          </button>
        </DialogHeader>
        <div className="mb-6">
          <p className="mb-4">
            Are you sure you want to delete the group "<span className="font-medium">{group?.name}</span>"?
          </p>
          <p className="text-error-600 dark:text-error-400">
            This will permanently remove all words in this group and cannot be undone.
          </p>
        </div>
        <DialogFooter className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Cancel
          </Button>
          <Button 
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteGroupMutation.isPending}
            className="bg-error-600 hover:bg-error-700 text-white"
          >
            {deleteGroupMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
