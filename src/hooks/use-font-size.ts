import { useState, useEffect } from "react";
import { useToast } from "../hooks/use-toast";

export function useFontSize() {
  const [fontSize, setFontSize] = useState(() => {
    return parseInt(localStorage.getItem('fontSize') || '1');
  });
  const { toast } = useToast();

  // Apply font size to the app
  useEffect(() => {
    const app = document.documentElement;
    
    // Remove all existing font size classes
    app.classList.remove('text-sm', 'text-base', 'text-lg');
    
    // Add the appropriate font size class
    switch (fontSize) {
      case 0:
        app.classList.add('text-sm');
        break;
      case 1:
        app.classList.add('text-base');
        break;
      case 2:
        app.classList.add('text-lg');
        break;
      default:
        app.classList.add('text-base');
    }
    
    localStorage.setItem('fontSize', fontSize.toString());
  }, [fontSize]);

  const setAndNotify = (size: number) => {
    if (size !== fontSize) {
      setFontSize(size);
      const sizeNames = ['small', 'medium', 'large'];
      toast({
        title: "Font size changed",
        description: `Font size set to ${sizeNames[size]}`,
        variant: "default",
      });
    }
  };

  return { fontSize, setFontSize: setAndNotify };
}
