import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { queryClient } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { X } from "lucide-react";
import { VocabularyGroup } from "@shared/schema";

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: VocabularyGroup | null;
}

export default function EditGroupModal({ isOpen, onClose, group }: EditGroupModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (group) {
      setName(group.name);
      setDescription(group.description || "");
    }
  }, [group]);

  const updateGroupMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      if (!group) throw new Error("Group not found");
      const res = await apiRequest("PUT", `/api/groups/${group.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({
        title: "Success",
        description: "Vocabulary group updated successfully!",

      });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update vocabulary group. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a group name",
        variant: "destructive",
      });
      return;
    }

    updateGroupMutation.mutate({ name, description });
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white dark:bg-slate-800 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading font-bold">Edit Vocabulary Group</DialogTitle>
          <button 
            onClick={handleClose}
            className="absolute right-4 top-4 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X size={18} />
          </button>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-group-name" className="text-sm font-medium">Group Name</Label>
            <Input
              id="edit-group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="edit-group-description" className="text-sm font-medium">Description</Label>
            <Textarea
              id="edit-group-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 resize-none h-24"
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            onClick={handleSubmit}
            disabled={updateGroupMutation.isPending}
            className="bg-primary-600 hover:bg-primary-700"
          >
            {updateGroupMutation.isPending ? "Updating..." : "Update Group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
