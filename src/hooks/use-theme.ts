import { useState, useEffect } from "react";
import { useToast } from "../hooks/use-toast";

export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark' || 
           (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const { toast } = useToast();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
    toast({
      title: "Theme changed",
      description: `Switched to ${!isDarkMode ? 'dark' : 'light'} mode`,
      variant: "default",
    });
  };

  return { isDarkMode, toggleTheme };
}
