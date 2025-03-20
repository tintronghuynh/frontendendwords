import { useEffect, useState } from "react";
import { getRandomQuote } from "../lib/motivational-quotes";

interface ClockModalProps {
  isOpen: boolean;
}

export default function ClockModal({ isOpen }: ClockModalProps) {
  const [time, setTime] = useState(new Date());
  const [temperature, setTemperature] = useState(Math.floor(20 + Math.random() * 5));
  const [quote, setQuote] = useState(getRandomQuote());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Change quote every 2 days
    const quoteDayCheck = localStorage.getItem('lastQuoteDay');
    const today = new Date().getDate();

    if (!quoteDayCheck || (parseInt(quoteDayCheck) + 1) % 30 < today % 30) {
      localStorage.setItem('lastQuoteDay', today.toString());
      setQuote(getRandomQuote());
    }

    // Simulate temperature update
    const tempTimer = setInterval(() => {
      setTemperature(Math.floor(20 + Math.random() * 5));
    }, 60000);

    return () => clearInterval(tempTimer);
  }, []);

  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return time.toLocaleDateString('en-US', options);
  };

  const formatTime = () => {
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const seconds = time.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center">
      <div className="text-center">
        <div className="text-8xl font-mono text-white tracking-widest mb-4 font-bold font-variant-numeric tabular-nums">
          {formatTime()}
        </div>
        <div className="text-3xl text-white/80 font-light mb-8">
          {formatDate()}
        </div>
        <div className="text-2xl text-white/70 mb-10">
          {temperature}°C
        </div>
        <div className="max-w-xl mx-auto px-6 py-4 rounded-lg bg-white/10 backdrop-blur-sm">
          <p className="text-xl text-white/90 italic">{quote}</p>
        </div>
      </div>
    </div>
  );
}