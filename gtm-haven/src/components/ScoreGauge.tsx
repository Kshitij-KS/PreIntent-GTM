'use client';

import React, { useEffect, useState } from 'next';

export default function ScoreGauge({ score }: { score: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let current = 0;
    const increment = score / 20;
    const interval = setInterval(() => {
      current += increment;
      if (current >= score) {
        setAnimatedScore(score);
        clearInterval(interval);
      } else {
        setAnimatedScore(Math.floor(current));
      }
    }, 30);
    return () => clearInterval(interval);
  }, [score]);

  // Determine color based on score severity
  let color = 'text-green-400';
  let glow = 'shadow-[0_0_30px_rgba(74,222,128,0.3)]';
  let label = 'Low Risk';

  if (score >= 60) {
    color = 'text-red-500';
    glow = 'shadow-[0_0_30px_rgba(239,68,68,0.3)]';
    label = 'High Instability';
  } else if (score >= 30) {
    color = 'text-yellow-400';
    glow = 'shadow-[0_0_30px_rgba(250,204,21,0.3)]';
    label = 'Moderate Risk';
  }

  return (
    <div className={`glass-panel p-8 flex flex-col items-center justify-center animate-slide-up w-full max-w-sm mx-auto ${glow} transition-shadow duration-700`}>
      <h2 className="text-sm uppercase tracking-wider text-gray-400 font-semibold mb-2">Strategic Instability Score</h2>
      
      <div className="relative flex items-center justify-center mt-4">
        {/* Simple CSS gauge circle */}
        <div className="w-40 h-40 rounded-full border-8 border-gray-800 flex items-center justify-center relative">
          <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-current opacity-70" style={{ color: 'inherit' }} />
          <span className={`text-6xl font-bold ${color}`}>{animatedScore}</span>
        </div>
      </div>
      
      <p className={`mt-6 font-medium text-lg ${color}`}>{label}</p>
    </div>
  );
}
