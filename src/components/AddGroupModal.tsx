import { useState } from "react";
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

interface AddGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddGroupModal({ isOpen, onClose }: AddGroupModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const createGroupMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const res = await apiRequest("POST", "/api/groups", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({
        title: "Success",
        description: "Vocabulary group created successfully!",
      });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create vocabulary group. Please try again.",
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

    createGroupMutation.mutate({ name, description });
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white dark:bg-slate-800 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading font-bold">Create Vocabulary Group</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="group-name" className="text-sm font-medium">Group Name</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Business English, Travel Vocabulary"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="group-description" className="text-sm font-medium">Description (optional)</Label>
            <Textarea
              id="group-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe this vocabulary group"
              className="mt-1 resize-none h-24"
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            onClick={handleSubmit}
            disabled={createGroupMutation.isPending}
            className="bg-primary-600 hover:bg-primary-700 text-slate-900 dark:text-white"
          >
            {createGroupMutation.isPending ? "Creating..." : "Create Group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}