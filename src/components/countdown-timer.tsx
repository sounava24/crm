"use client";

import { useEffect, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";

interface CountdownTimerProps {
  targetDate: string | Date;
  isOverdue: boolean;
  isDueSoon: boolean;
}

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function calculateTimeLeft(target: number): TimeLeft {
  const now = new Date().getTime();
  const distance = target - now;
  const absoluteDistance = Math.abs(distance);

  return {
    days: Math.floor(absoluteDistance / (1000 * 60 * 60 * 24)),
    hours: Math.floor((absoluteDistance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((absoluteDistance % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((absoluteDistance % (1000 * 60)) / 1000),
  };
}

export function CountdownTimer({ targetDate, isOverdue, isDueSoon }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    const updateTimer = () => {
      setTimeLeft(calculateTimeLeft(target));
    };

    updateTimer(); // Initial call
    const intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [targetDate]);

  if (!timeLeft) {
    return (
      <div className="flex flex-col gap-1 w-full animate-pulse">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-locked-muted">
          <Clock size={14} />
          <span>Calculating...</span>
        </div>
        <div className="h-[52px] w-full bg-locked-panel-solid rounded-lg"></div>
      </div>
    );
  }

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  const colorClass = isOverdue 
    ? 'text-red-500 bg-red-500/10' 
    : isDueSoon 
      ? 'text-amber-500 bg-amber-500/10' 
      : 'text-brand-blue bg-brand-blue/10';

  const iconClass = isOverdue ? 'text-red-500' : isDueSoon ? 'text-amber-500' : 'text-locked-muted';

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${iconClass}`}>
        {isOverdue ? <AlertTriangle size={14} /> : <Clock size={14} />}
        <span>{isOverdue ? 'Payment Overdue By' : 'Payment Due In'}</span>
      </div>
      
      <div className="flex gap-2">
        <div className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg flex-1 ${colorClass} border border-current/20 shadow-inner`}>
          <span className="text-xl font-black font-mono leading-none">{formatNumber(timeLeft.days)}</span>
          <span className="text-[8px] uppercase tracking-widest font-black opacity-60 mt-1">Days</span>
        </div>
        <div className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg flex-1 ${colorClass} border border-current/20 shadow-inner`}>
          <span className="text-xl font-black font-mono leading-none">{formatNumber(timeLeft.hours)}</span>
          <span className="text-[8px] uppercase tracking-widest font-black opacity-60 mt-1">Hrs</span>
        </div>
        <div className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg flex-1 ${colorClass} border border-current/20 shadow-inner`}>
          <span className="text-xl font-black font-mono leading-none">{formatNumber(timeLeft.minutes)}</span>
          <span className="text-[8px] uppercase tracking-widest font-black opacity-60 mt-1">Min</span>
        </div>
        <div className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg flex-1 ${colorClass} border border-current/20 shadow-inner`}>
          <span className="text-xl font-black font-mono leading-none">{formatNumber(timeLeft.seconds)}</span>
          <span className="text-[8px] uppercase tracking-widest font-black opacity-60 mt-1">Sec</span>
        </div>
      </div>
    </div>
  );
}
