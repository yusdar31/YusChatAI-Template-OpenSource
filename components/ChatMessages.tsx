'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Bot, Copy, Check, ThumbsUp, ThumbsDown, RotateCcw, Pencil, Trash2, Volume2, ExternalLink, Brain, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;
  timestamp: Date;
}

interface ChatMessagesProps {
  messages: Message[];
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  editingMessageId?: string | null;
  editContent?: string;
  onEditContentChange?: (content: string) => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
  onRegenerate?: () => void;
  isLoading?: boolean;
  darkMode?: boolean;
}

function CodeBlock({ language, code, darkMode = true }: { language: string; code: string; darkMode?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`relative group my-4 rounded-xl overflow-hidden border ${darkMode ? 'bg-[#0d0d0d] border-[#2a2a2a]' : 'bg-gray-50 border-gray-200'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-2.5 ${darkMode ? 'bg-[#1a1a1a]' : 'bg-gray-100'} border-b ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{language}</span>
        </div>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
            copied 
              ? 'bg-emerald-500/20 text-emerald-500' 
              : `${darkMode ? 'bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      
      {/* Code */}
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: 0,
          background: 'transparent',
          padding: '16px',
          fontSize: '13px',
          lineHeight: '1.7',
        }}
        preTagStyle={{
          margin: 0,
          borderRadius: 0,
        }}
        codeTagProps={{
          style: {
            fontFamily: 'var(--font-jetbrains), monospace',
          }
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

function ThinkingBlock({ thinking, darkMode }: { thinking: string; darkMode: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!thinking) return null;

  return (
    <div className={`mb-3 rounded-xl border overflow-hidden ${darkMode ? 'border-[#2a2a2a] bg-[#1a1a1a]' : 'border-gray-200 bg-gray-50'}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center gap-2 px-4 py-3 text-left transition-colors ${darkMode ? 'hover:bg-[#222]' : 'hover:bg-gray-100'}`}
      >
        <Brain className={`w-4 h-4 shrink-0 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
        <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Thinking
        </span>
        <div className={`flex-1 h-px mx-2 ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-200'}`} />
        {isExpanded ? (
          <ChevronDown className={`w-4 h-4 shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
        ) : (
          <ChevronRight className={`w-4 h-4 shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
        )}
      </button>
      {isExpanded && (
        <div className={`px-4 pb-4 text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'} border-t ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-200'} pt-3`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                const codeString = String(children).replace(/\n$/, '');
                return !inline && match ? (
                  <CodeBlock language={match[1]} code={codeString} darkMode={darkMode} />
                ) : (
                  <code className={`${darkMode ? 'bg-[#1f1f1f] text-purple-400 border-[#2a2a2a]' : 'bg-purple-50 text-purple-600 border-gray-200'} px-1.5 py-0.5 rounded text-[13px] font-mono border`} {...props}>
                    {children}
                  </code>
                );
              },
              p({ children }) {
                return <p className="mb-2 last:mb-0">{children}</p>;
              },
            }}
          >
            {thinking}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}

function ThinkingIndicator({ darkMode }: { darkMode: boolean }) {
  return (
    <div className="flex items-center gap-3 py-4">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${darkMode ? 'bg-emerald-500' : 'bg-emerald-600'} animate-pulse`}
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Thinking...</span>
      </div>
    </div>
  );
}

export default function ChatMessages({ 
  messages, 
  onEdit, 
  onDelete, 
  editingMessageId, 
  editContent, 
  onEditContentChange, 
  onSaveEdit, 
  onCancelEdit,
  onRegenerate,
  isLoading,
  darkMode = true
}: ChatMessagesProps) {
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const handleCopyMessage = (messageId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  };

  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="space-y-6">
      {messages.map((message, index) => (
        <div key={message.id} className="animate-slide-in group">
          {message.role === 'user' ? (
            /* User Message */
            <div className="flex justify-end mb-6">
              {editingMessageId === message.id ? (
                /* Edit Mode */
                <div className="max-w-[85%] w-full">
                  <textarea
                    value={editContent || ''}
                    onChange={(e) => onEditContentChange?.(e.target.value)}
                    className={`w-full p-4 rounded-xl font-sans text-[15px] leading-relaxed ${darkMode ? 'bg-[#2a2a2a] text-gray-100 border-[#3a3a3a]' : 'bg-gray-100 text-gray-900 border-gray-300'} border outline-none resize-none`}
                    rows={3}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={onCancelEdit}
                      className={`px-4 py-2 text-sm font-medium rounded-lg ${darkMode ? 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} transition-colors`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={onSaveEdit}
                      className="px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                    >
                      Save & Regenerate
                    </button>
                  </div>
                </div>
              ) : (
                /* Normal Mode */
                <div className="max-w-[85%] flex items-end gap-3">
                  <div className={`${darkMode ? 'bg-[#2a2a2a] text-gray-100' : 'bg-blue-500 text-white'} px-4 py-3 rounded-2xl rounded-br-md`}>
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                  
                  {/* User Action Buttons */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pb-1">
                    <button
                      onClick={() => onEdit?.(message.id, message.content)}
                      className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-[#2a2a2a] text-gray-500 hover:text-gray-300' : 'hover:bg-gray-200 text-gray-400 hover:text-gray-600'} transition-colors`}
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete?.(message.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Assistant Message */
            <div className="flex gap-3 mb-6">
              {/* Avatar */}
              <div className="shrink-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>YusAI</span>
                  <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{formatTimestamp(message.timestamp)}</span>
                </div>

                {/* Thinking Block */}
                {message.thinking && <ThinkingBlock thinking={message.thinking} darkMode={darkMode} />}

                <div className={`prose prose-sm max-w-none ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        const codeString = String(children).replace(/\n$/, '');

                        return !inline && match ? (
                          <CodeBlock language={match[1]} code={codeString} darkMode={darkMode} />
                        ) : (
                          <code
                            className={`${darkMode ? 'bg-[#1f1f1f] text-emerald-400 border-[#2a2a2a]' : 'bg-gray-100 text-emerald-600 border-gray-200'} px-1.5 py-0.5 rounded text-[13px] font-mono border`}
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                      p({ children }) {
                        return <p className="mb-3 last:mb-0 leading-[1.75] text-[15px]">{children}</p>;
                      },
                      ul({ children }) {
                        return <ul className="list-disc pl-5 space-y-2 mb-4 text-[15px]">{children}</ul>;
                      },
                      ol({ children }) {
                        return <ol className="list-decimal pl-5 space-y-2 mb-4 text-[15px]">{children}</ol>;
                      },
                      li({ children }) {
                        return <li className="leading-[1.75]">{children}</li>;
                      },
                      h1({ children }) {
                        return <h1 className={`text-xl font-bold mb-4 mt-6 first:mt-0 tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{children}</h1>;
                      },
                      h2({ children }) {
                        return <h2 className={`text-lg font-bold mb-3 mt-5 first:mt-0 tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{children}</h2>;
                      },
                      h3({ children }) {
                        return <h3 className={`text-base font-semibold mb-3 mt-4 first:mt-0 tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{children}</h3>;
                      },
                      h4({ children }) {
                        return <h4 className={`text-sm font-semibold mb-2 mt-4 first:mt-0 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{children}</h4>;
                      },
                      blockquote({ children }) {
                        return (
                          <blockquote className={`border-l-4 border-emerald-500 pl-4 py-3 ${darkMode ? 'text-gray-400 bg-[#1a1a1a]' : 'text-gray-600 bg-gray-50'} my-4 rounded-r-lg italic`}>
                            {children}
                          </blockquote>
                        );
                      },
                      a({ children, href }) {
                        return (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 underline underline-offset-4 decoration-emerald-400/30 hover:decoration-emerald-400/60 transition-colors font-medium"
                          >
                            {children}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        );
                      },
                      strong({ children }) {
                        return <strong className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{children}</strong>;
                      },
                      em({ children }) {
                        return <em className="italic">{children}</em>;
                      },
                      table({ children }) {
                        return (
                          <div className="overflow-x-auto my-4 rounded-lg border border-[#2a2a2a]">
                            <table className="w-full border-collapse text-[14px]">{children}</table>
                          </div>
                        );
                      },
                      thead({ children }) {
                        return <thead className={`${darkMode ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`}>{children}</thead>;
                      },
                      tbody({ children }) {
                        return <tbody className={`divide-y ${darkMode ? 'divide-[#2a2a2a]' : 'divide-gray-200'}`}>{children}</tbody>;
                      },
                      tr({ children }) {
                        return <tr className={`border-b ${darkMode ? 'border-[#2a2a2a] hover:bg-[#1a1a1a]/50' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}>{children}</tr>;
                      },
                      th({ children }) {
                        return (
                          <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300 border-[#2a2a2a] bg-[#1a1a1a]' : 'text-gray-700 border-gray-200 bg-gray-100'} border`}>
                            {children}
                          </th>
                        );
                      },
                      td({ children }) {
                        return (
                          <td className={`px-4 py-3 text-[14px] ${darkMode ? 'text-gray-300 border-[#2a2a2a]' : 'text-gray-700 border-gray-200'} border`}>
                            {children}
                          </td>
                        );
                      },
                      hr() {
                        return <hr className={`${darkMode ? 'border-[#2a2a2a]' : 'border-gray-200'} my-6`} />;
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>

                {/* Assistant Action Buttons */}
                {!isLoading && message.content && (
                  <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCopyMessage(message.id, message.content)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        copiedMessageId === message.id 
                          ? 'bg-emerald-500/20 text-emerald-500' 
                          : `${darkMode ? 'hover:bg-[#2a2a2a] text-gray-500 hover:text-gray-300' : 'hover:bg-gray-200 text-gray-400 hover:text-gray-600'}`
                      }`}
                      title="Copy"
                    >
                      {copiedMessageId === message.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleSpeak(message.content)}
                      className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-[#2a2a2a] text-gray-500 hover:text-gray-300' : 'hover:bg-gray-200 text-gray-400 hover:text-gray-600'} transition-colors`}
                      title="Read aloud"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-[#2a2a2a] text-gray-500 hover:text-gray-300' : 'hover:bg-gray-200 text-gray-400 hover:text-gray-600'} transition-colors`}
                      title="Good response"
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button
                      className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-[#2a2a2a] text-gray-500 hover:text-gray-300' : 'hover:bg-gray-200 text-gray-400 hover:text-gray-600'} transition-colors`}
                      title="Bad response"
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                    {index === messages.length - 1 && message.role === 'assistant' && onRegenerate && (
                      <button
                        onClick={onRegenerate}
                        className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-[#2a2a2a] text-gray-500 hover:text-gray-300' : 'hover:bg-gray-200 text-gray-400 hover:text-gray-600'} transition-colors`}
                        title="Regenerate"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
