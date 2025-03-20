import { useCallback, useState } from "react";
import { useToast } from "../hooks/use-toast";

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { toast } = useToast();

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) {
      // Silent fail - no error toast
      return;
    }

    // Stop any current speech
    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    // Create a new speech synthesis utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set properties for a female British English voice
    utterance.lang = "en-GB";
    utterance.rate = 0.9; // Slightly slower for clearer pronunciation
    utterance.pitch = 1.1; // Slightly higher pitch for female voice
    
    // Try to use a female British English voice if available
    let voiceFound = false;
    const voices = window.speechSynthesis.getVoices();
    
    for (const voice of voices) {
      if ((voice.name.includes("Female") || voice.name.includes("female")) && 
          (voice.lang.includes("en-GB") || voice.lang.includes("en_GB"))) {
        utterance.voice = voice;
        voiceFound = true;
        break;
      }
    }
    
    // If no specific voice found, try any British voice
    if (!voiceFound) {
      for (const voice of voices) {
        if (voice.lang.includes("en-GB") || voice.lang.includes("en_GB")) {
          utterance.voice = voice;
          voiceFound = true;
          break;
        }
      }
    }
    
    // Event handlers
    utterance.onstart = () => {
      setIsSpeaking(true);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    
    utterance.onerror = (event) => {
      setIsSpeaking(false);
      // Silently fail, no error toast
    };
    
    // Speak the text
    window.speechSynthesis.speak(utterance);
  }, [toast]);

  return { speak, isSpeaking };
}
