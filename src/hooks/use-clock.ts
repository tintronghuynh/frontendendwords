import { useState, useEffect } from "react";

export function useClock() {
  const [isClockVisible, setIsClockVisible] = useState(false);

  useEffect(() => {
    const handleToggleClock = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.toggle) {
        // Toggle the clock if toggle is true
        setIsClockVisible(prevState => !prevState);
      } else {
        // Otherwise just set to the specified state
        setIsClockVisible(customEvent.detail.show);
      }
    };

    document.addEventListener('toggle-clock', handleToggleClock);

    return () => {
      document.removeEventListener('toggle-clock', handleToggleClock);
    };
  }, []);

  return { isClockVisible, setIsClockVisible };
}
