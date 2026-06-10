'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Clock, Hash, Trash2, X } from 'lucide-react';

interface UsageRecord {
  model: string;
  inputTokens: number;
  outputTokens: number;
  timestamp: number;
  duration: number;
}

interface UsageTrackerProps {
  darkMode: boolean;
}

export default function UsageTracker({ darkMode }: UsageTrackerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [records, setRecords] = useState<UsageRecord[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('yusai-usage');
    if (saved) {
      try { setRecords(JSON.parse(saved)); } catch { /* ignore */ }
    }

    const handleNewRecord = (e: CustomEvent) => {
      const record = e.detail as UsageRecord;
      setRecords(prev => {
        const newRecords = [...prev, record];
        localStorage.setItem('yusai-usage', JSON.stringify(newRecords));
        return newRecords;
      });
    };

    window.addEventListener('usage-record' as any, handleNewRecord);
    return () => window.removeEventListener('usage-record' as any, handleNewRecord);
  }, []);

  const clearRecords = () => {
    setRecords([]);
    localStorage.removeItem('yusai-usage');
  };

  const totalInputTokens = records.reduce((s, r) => s + r.inputTokens, 0);
  const totalOutputTokens = records.reduce((s, r) => s + r.outputTokens, 0);
  const totalRequests = records.length;
  const avgDuration = records.length > 0
    ? Math.round(records.reduce((s, r) => s + r.duration, 0) / records.length)
    : 0;

  const modelStats = records.reduce((acc, r) => {
    if (!acc[r.model]) {
      acc[r.model] = { requests: 0, inputTokens: 0, outputTokens: 0 };
    }
    acc[r.model].requests++;
    acc[r.model].inputTokens += r.inputTokens;
    acc[r.model].outputTokens += r.outputTokens;
    return acc;
  }, {} as Record<string, { requests: number; inputTokens: number; outputTokens: number }>);

  const formatTokens = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toString();
  };

  const todayRecords = records.filter(r => {
    const d = new Date(r.timestamp);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-[#2a2a2a] text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}`}
        title="Usage Stats"
      >
        <BarChart3 className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-lg max-h-[85vh] mx-4 rounded-2xl border shadow-2xl flex flex-col ${darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Usage Statistics</h2>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Track your API usage</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-[#2a2a2a] text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'} transition-colors`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Today's Stats */}
              <div>
                <h3 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Today</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-xl ${darkMode ? 'bg-[#171717] border border-[#2a2a2a]' : 'bg-gray-50 border border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Hash className="w-3.5 h-3.5 text-emerald-500" />
                      <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Requests</span>
                    </div>
                    <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{todayRecords.length}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${darkMode ? 'bg-[#171717] border border-[#2a2a2a]' : 'bg-gray-50 border border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Avg Time</span>
                    </div>
                    <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{avgDuration}s</p>
                  </div>
                </div>
              </div>

              {/* All Time */}
              <div>
                <h3 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>All Time</h3>
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-[#171717] border border-[#2a2a2a]' : 'bg-gray-50 border border-gray-200'}`}>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{totalRequests}</p>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Requests</p>
                    </div>
                    <div>
                      <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatTokens(totalInputTokens)}</p>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Input</p>
                    </div>
                    <div>
                      <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatTokens(totalOutputTokens)}</p>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Output</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Per Model */}
              {Object.keys(modelStats).length > 0 && (
                <div>
                  <h3 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>By Model</h3>
                  <div className="space-y-2">
                    {Object.entries(modelStats).map(([model, stats]) => (
                      <div key={model} className={`flex items-center justify-between p-3 rounded-xl ${darkMode ? 'bg-[#171717] border border-[#2a2a2a]' : 'bg-gray-50 border border-gray-200'}`}>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{model}</p>
                          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{stats.requests} requests</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            {formatTokens(stats.inputTokens + stats.outputTokens)}
                          </p>
                          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>tokens</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {records.length === 0 && (
                <div className="text-center py-8">
                  <BarChart3 className={`w-10 h-10 mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                  <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No usage data yet</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'} mt-1`}>Start chatting to see statistics</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`flex items-center justify-between px-6 py-4 border-t ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
              <p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                {records.length} total records
              </p>
              <button
                onClick={clearRecords}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${darkMode ? 'text-gray-400 hover:text-red-400 hover:bg-[#2a2a2a]' : 'text-gray-600 hover:text-red-500 hover:bg-gray-100'}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
