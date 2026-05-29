'use client';

import React, { useState } from 'next';
import ScoreGauge from '@/components/ScoreGauge';
import EventTimeline from '@/components/EventTimeline';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`/api/score?name=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch data');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-6 md:p-12 lg:p-24 flex flex-col items-center">
      
      {/* Header */}
      <div className="w-full max-w-4xl text-center mb-12 animate-fade-in">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-4 drop-shadow-sm">
          GTM Haven
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Predictive competitive intelligence. Act before the market reacts.
        </p>
      </div>

      {/* Search Section */}
      <div className="w-full max-w-xl mb-12 animate-slide-up">
        <form onSubmit={handleSearch} className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-4 glass-panel bg-gray-900/40 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg transition-all duration-300 shadow-inner"
            placeholder="Search competitor (e.g. Acme Corp, Initech)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute inset-y-2 right-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-lg shadow-md transition-colors duration-200 disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : 'Analyze'}
          </button>
        </form>
        {error && (
          <div className="mt-4 p-4 text-sm text-red-400 bg-red-900/20 border border-red-900/50 rounded-lg animate-fade-in text-center">
            {error}
          </div>
        )}
      </div>

      {/* Results Section */}
      {result && (
        <div className="w-full flex flex-col items-center">
          <div className="w-full max-w-4xl text-center mb-6 animate-fade-in">
            <h2 className="text-3xl font-bold text-gray-100">{result.companyName}</h2>
            <p className="text-indigo-400">{result.domain}</p>
          </div>
          
          <ScoreGauge score={result.instabilityScore} />
          
          <EventTimeline events={result.events} />
        </div>
      )}

    </main>
  );
}
