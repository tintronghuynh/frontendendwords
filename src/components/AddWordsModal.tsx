import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { queryClient } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { X, Upload, FileJson } from "lucide-react";
import { VocabularyGroup } from "@shared/schema";

interface AddWordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: VocabularyGroup | null;
}

export default function AddWordsModal({ isOpen, onClose, group }: AddWordsModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const importWordsMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!group) throw new Error("Group not found");

      try {
        const fileContent = await file.text();
        console.log("File content:", fileContent); // Add logging

        const jsonData = JSON.parse(fileContent);
        console.log("Parsed JSON data:", jsonData); // Add logging

        // Check if data is an array and wrap it in dictionary object if needed
        const data = Array.isArray(jsonData) ? { dictionary: jsonData } : jsonData;
        console.log("Data to send:", data); // Add logging

        const res = await apiRequest("POST", `/api/groups/${group.id}/import`, data);
        return await res.json();
      } catch (error) {
        console.error("Import error in frontend:", error); // Add logging
        throw new Error(error instanceof Error ? error.message : "Invalid JSON file format");
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${group?.id}/words`] });
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${group?.id}/study`] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });

      toast({
        title: "Thêm từ thành công",
        description: `Đã thêm ${data.wordsAdded} từ mới vào nhóm "${group?.name}"`,
        variant: "default",
      });

      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: error instanceof Error
          ? error.message
          : "Không thể thêm từ. Vui lòng kiểm tra định dạng file và thử lại.",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      console.log("Selected file:", file.name); // Add logging
      setSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      console.log("Dropped file:", file.name); // Add logging
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
  };

  const handleImport = () => {
    if (!selectedFile) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn file để thêm từ",
        variant: "destructive",
      });
      return;
    }

    importWordsMutation.mutate(selectedFile);
  };

  const handleClose = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white dark:bg-slate-800 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading font-bold text-slate-900 dark:text-white">
            Add words to "{group?.name}"
          </DialogTitle>
        </DialogHeader>
        <div>
          <div className="border border-slate-300 dark:border-slate-600 rounded-lg p-4 bg-white dark:bg-slate-800">
            <p className="mb-4 text-sm text-slate-700 dark:text-slate-300">
              Tải lên file JSON chứa danh sách từ vựng theo định dạng sau:
            </p>
            <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg mb-4 font-mono text-xs overflow-x-auto text-slate-900 dark:text-slate-100">
              {`{
  "dictionary": [
    {
      "word": "Suitcase",
      "IPA": "/ˈsuːtkeɪs/",
      "partOfSpeech": "Noun",
      "definition": "A portable container...",
      "meanings": [
        {
          "meaning": "A piece of luggage with a handle...",
          "examples": [
            { "en": "She packed all her clothes...", "vi": "Cô ấy đóng gói..." }
          ]
        }
      ]
    }
  ]
}`}
            </div>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FileJson className="mb-2 text-slate-400 dark:text-slate-500" size={30} />
                  <p className="mb-1 text-sm text-slate-700 dark:text-slate-300">
                    Click để tải lên hoặc kéo thả file
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Chỉ chấp nhận file JSON
                  </p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
              </label>
            </div>
            {selectedFile && (
              <div className="mt-3 text-sm text-slate-700 dark:text-slate-300">
                <span className="font-medium">File đã chọn:</span>
                <span className="ml-2">{selectedFile.name}</span>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleImport}
            disabled={importWordsMutation.isPending || !selectedFile}
            className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {importWordsMutation.isPending ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              "Import Words"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}