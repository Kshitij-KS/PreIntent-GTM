'use client';

import React from 'next';

export default function EventTimeline({ events }: { events: any[] }) {
  if (!events || events.length === 0) {
    return (
      <div className="glass-panel p-6 mt-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <h3 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">Recent Strategic Events</h3>
        <p className="text-gray-400 italic text-sm">No significant events detected recently.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 mt-8 animate-slide-up w-full max-w-4xl mx-auto" style={{ animationDelay: '0.2s' }}>
      <h3 className="text-xl font-semibold mb-6 border-b border-gray-700/50 pb-3 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
        Recent Strategic Events
      </h3>
      
      <div className="relative border-l border-indigo-500/30 ml-3 md:ml-4 space-y-8">
        {events.map((event, idx) => {
          // Choose an icon color based on impact
          let dotColor = 'bg-indigo-500';
          if (event.calculatedScore >= 20) dotColor = 'bg-red-500';
          else if (event.calculatedScore >= 10) dotColor = 'bg-yellow-400';
          else if (event.calculatedScore === 0) dotColor = 'bg-green-500';

          return (
            <div key={event.id || idx} className="pl-6 relative animate-fade-in" style={{ animationDelay: `${0.3 + (idx * 0.1)}s` }}>
              {/* Timeline dot */}
              <div className={`absolute w-3 h-3 rounded-full ${dotColor} -left-[6.5px] top-1.5 shadow-[0_0_10px_currentColor]`} />
              
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-medium px-2 py-0.5 rounded bg-gray-800/80 border border-gray-700 text-gray-300">
                      {event.type}
                    </span>
                    <span className="text-xs text-gray-500">{new Date(event.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric'})}</span>
                  </div>
                  <p className="text-gray-200 mt-2">{event.description}</p>
                </div>
                
                {/* Score impact bubble */}
                <div className="mt-2 md:mt-0 flex flex-col items-end shrink-0">
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-1.5 text-center shadow-inner">
                    <span className="block text-xs text-gray-500 mb-0.5 uppercase tracking-wide">Impact</span>
                    <span className={`text-lg font-bold ${event.calculatedScore > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      +{event.calculatedScore}
                    </span>
                  </div>
                  {event.decayApplied > 0 && (
                    <span className="text-[10px] text-gray-500 mt-1">Decay: -{event.decayApplied} pts</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
