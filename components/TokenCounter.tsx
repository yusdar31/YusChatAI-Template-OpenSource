'use client';

import { useState, useEffect } from 'react';
import { Hash, TrendingUp, Zap } from 'lucide-react';

interface TokenCounterProps {
  messages: { role: string; content: string }[];
  darkMode?: boolean;
}

// Approximate token count (rough estimate: 1 token ≈ 4 characters for English)
function estimateTokens(text: string): number {
  if (!text) return 0;
  // More accurate estimate considering mixed languages
  const englishChars = text.replace(/[^\x00-\x7F]/g, '').length;
  const nonEnglishChars = text.length - englishChars;
  return Math.ceil(englishChars / 4) + Math.ceil(nonEnglishChars / 2);
}

export default function TokenCounter({ messages, darkMode = true }: TokenCounterProps) {
  const [totalTokens, setTotalTokens] = useState(0);
  const [userTokens, setUserTokens] = useState(0);
  const [assistantTokens, setAssistantTokens] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    let userTotal = 0;
    let assistantTotal = 0;

    messages.forEach((msg) => {
      const tokens = estimateTokens(msg.content);
      if (msg.role === 'user') {
        userTotal += tokens;
      } else {
        assistantTotal += tokens;
      }
    });

    setUserTokens(userTotal);
    setAssistantTokens(assistantTotal);
    setTotalTokens(userTotal + assistantTotal);
  }, [messages]);

  if (messages.length === 0) return null;

  const formatTokens = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          darkMode 
            ? 'bg-[#1f1f1f] hover:bg-[#2a2a2a] text-gray-400 hover:text-gray-300 border border-[#2a2a2a]' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-700 border border-gray-200'
        }`}
      >
        <Hash className="w-3.5 h-3.5" />
        <span>{formatTokens(totalTokens)} tokens</span>
      </button>

      {isExpanded && (
        <div className={`absolute bottom-full right-0 mb-2 w-64 p-4 rounded-xl border shadow-xl animate-scale-in z-50 ${
          darkMode 
            ? 'bg-[#1f1f1f] border-[#2a2a2a] shadow-black/50' 
            : 'bg-white border-gray-200 shadow-gray-200/50'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Token Usage</span>
            <button
              onClick={() => setIsExpanded(false)}
              className={`text-xs ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            {/* Total */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total</span>
              </div>
              <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatTokens(totalTokens)}
              </span>
            </div>

            {/* User */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-blue-500/20 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                </div>
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>You</span>
              </div>
              <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatTokens(userTokens)}
              </span>
            </div>

            {/* Assistant */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>YusAI</span>
              </div>
              <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatTokens(assistantTokens)}
              </span>
            </div>

            {/* Divider */}
            <div className={`border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`} />

            {/* Messages count */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
                </div>
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Messages</span>
              </div>
              <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {messages.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
