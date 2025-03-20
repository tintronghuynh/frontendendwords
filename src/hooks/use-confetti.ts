import { useState, useCallback } from "react";

export function useConfetti() {
  const [isVisible, setIsVisible] = useState(false);

  const showConfetti = useCallback((onComplete?: () => void) => {
    setIsVisible(true);
    
    // Tự động tắt confetti sau 3 giây
    setTimeout(() => {
      setIsVisible(false);
      if (onComplete) {
        onComplete();
      }
    }, 3000);
  }, []);

  return { 
    showConfetti, 
    isVisible
  };
}
