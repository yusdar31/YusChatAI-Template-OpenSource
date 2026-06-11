'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import ModelSwitcher from '@/components/ModelSwitcher';
import ChatMessages from '@/components/ChatMessages';
import ChatInput from '@/components/ChatInput';
import TokenCounter from '@/components/TokenCounter';
import Settings from '@/components/Settings';
import UsageTracker from '@/components/UsageTracker';
import { CustomProvider, loadCustomProviders } from '@/lib/provider-types';
import UserMenu from '@/components/UserMenu';
import { Sparkles, Menu, Code, FlaskConical, Plane, Wrench, Download, Sun, Moon, X, AlertTriangle, Settings as SettingsIcon } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;
  timestamp: Date;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  folderId?: string | null;
}

// Confirmation Dialog Component
function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  darkMode 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string; 
  message: string;
  darkMode: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`${darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-white border-gray-200'} border rounded-2xl p-6 max-w-md mx-4 shadow-2xl animate-fade-in`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
        </div>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const [selectedModel, setSelectedModel] = useState('9router/kr/claude-sonnet-4.5');
  const [availableModels, setAvailableModels] = useState<{ id: string; name: string }[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; chatId: string | null }>({ isOpen: false, chatId: null });
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'chat' | 'reasoning' | 'research' | 'image'>('chat');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [customProviders, setCustomProviders] = useState<CustomProvider[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load chats from localStorage
  useEffect(() => {
    const savedChats = localStorage.getItem('yusai-chats');
    if (savedChats) {
      try {
        const parsed = JSON.parse(savedChats);
        setChats(parsed.map((chat: any) => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          updatedAt: new Date(chat.updatedAt),
          messages: chat.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        })));
      } catch (e) {
        console.error('Failed to parse saved chats');
      }
    }
    
    const savedDarkMode = localStorage.getItem('yusai-darkmode');
    if (savedDarkMode !== null) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  // Save chats to localStorage
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem('yusai-chats', JSON.stringify(chats));
    }
  }, [chats]);

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('yusai-darkmode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load custom providers from localStorage
  useEffect(() => {
    setCustomProviders(loadCustomProviders());

    const handleProvidersUpdated = () => {
      setCustomProviders(loadCustomProviders());
    };
    window.addEventListener('providers-updated', handleProvidersUpdated);
    return () => window.removeEventListener('providers-updated', handleProvidersUpdated);
  }, []);

  // Load models (merges config file + custom providers)
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const providers = loadCustomProviders();
        const res = await fetch('/api/models', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customProviders: providers }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.models && data.models.length > 0) {
            setAvailableModels(data.models);
            setSelectedModel(data.models[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load models:', err);
      }
    };
    fetchModels();
  }, [customProviders]);

  // Smart auto scroll - only if user is near bottom
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    
    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // Only auto-scroll if user is within 200px of the bottom
    if (distanceFromBottom < 200) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substring(2, 15);

  // Create new chat
  const handleNewChat = () => {
    const newChat: Chat = {
      id: generateId(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setMessages([]);
    setError(null);
  };

  // Select chat
  const handleSelectChat = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setCurrentChatId(chatId);
      setMessages(chat.messages);
      setError(null);
    }
  };

  // Delete chat
  const handleDeleteChat = (chatId: string) => {
    setDeleteConfirm({ isOpen: true, chatId });
  };

  // Move chat to folder
  const handleMoveChat = (chatId: string, folderId: string | null) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, folderId } : chat
    ));
  };

  const confirmDeleteChat = () => {
    if (deleteConfirm.chatId) {
      setChats(prev => prev.filter(c => c.id !== deleteConfirm.chatId));
      if (currentChatId === deleteConfirm.chatId) {
        setCurrentChatId(null);
        setMessages([]);
      }
    }
    setDeleteConfirm({ isOpen: false, chatId: null });
  };

  // Update chat in localStorage
  const updateChat = useCallback((chatId: string, newMessages: Message[]) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        const title = newMessages.length > 0 
          ? newMessages[0].content.substring(0, 40) + (newMessages[0].content.length > 40 ? '...' : '')
          : 'New Chat';
        return { ...chat, messages: newMessages, title, updatedAt: new Date() };
      }
      return chat;
    }));
  }, []);

  // Send message
  const handleSendMessage = async (
    content: string,
    mode: 'chat' | 'reasoning' | 'research' | 'image' = 'chat',
    attachedFileContent?: string
  ) => {
    setError(null);
    let fullContent = content;
    if (attachedFileContent) {
      fullContent += `\n\n[Attached File Context]:\n\`\`\`\n${attachedFileContent}\n\`\`\``;
    }

    const userMessage: Message = { 
      id: generateId(),
      role: 'user', 
      content,
      timestamp: new Date()
    };
    
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setIsLoading(true);
    setIsStopped(false);
    const startTime = Date.now();

    // Create or update chat
    let chatId = currentChatId;
    if (!chatId) {
      const newChat: Chat = {
        id: generateId(),
        title: content.substring(0, 40) + (content.length > 40 ? '...' : ''),
        messages: currentMessages,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setChats(prev => [newChat, ...prev]);
      chatId = newChat.id;
      setCurrentChatId(chatId);
    } else {
      updateChat(chatId, currentMessages);
    }

    // Add placeholder assistant message
    const assistantMessage: Message = { id: generateId(), role: 'assistant', content: '', timestamp: new Date() };
    setMessages(prev => [...prev, assistantMessage]);

    let assistantText = '';

    try {
      abortControllerRef.current = new AbortController();
      
      const savedSettings = JSON.parse(localStorage.getItem('yusai-settings') || '{}');
      const providers = loadCustomProviders();
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: fullContent }],
          mode,
          model: selectedModel,
          systemPrompt: savedSettings.systemPrompt || undefined,
          temperature: savedSettings.temperature,
          maxTokens: savedSettings.maxTokens,
          customProviders: providers,
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to get response');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let thinkingText = '';
      let buffer = '';

      while (true) {
        if (isStopped) break;
        
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Process complete tokens
        const THINKING_PREFIX = '__THINKING__';
        let processed = '';
        let tempBuffer = buffer;
        
        while (tempBuffer.length > 0) {
          const thinkIdx = tempBuffer.indexOf(THINKING_PREFIX);
          
          if (thinkIdx === -1) {
            // No more thinking prefixes, rest is content
            processed += tempBuffer;
            tempBuffer = '';
          } else if (thinkIdx === 0) {
            // Starts with thinking prefix
            const afterPrefix = tempBuffer.substring(THINKING_PREFIX.length);
            const nextThinkIdx = afterPrefix.indexOf(THINKING_PREFIX);
            if (nextThinkIdx === -1) {
              // Rest is all thinking
              thinkingText += afterPrefix;
              tempBuffer = '';
            } else {
              thinkingText += afterPrefix.substring(0, nextThinkIdx);
              tempBuffer = afterPrefix.substring(nextThinkIdx);
            }
          } else {
            // Has content before thinking prefix
            processed += tempBuffer.substring(0, thinkIdx);
            tempBuffer = tempBuffer.substring(thinkIdx);
          }
        }
        
        buffer = '';
        assistantText += processed;

        setMessages(prev => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = { 
              ...updated[updated.length - 1], 
              content: assistantText,
              thinking: thinkingText || undefined,
            };
          }
          return updated;
        });
      }

      // Update chat with final messages
      const finalMessages = [...currentMessages, { 
        id: assistantMessage.id,
        role: 'assistant' as const, 
        content: assistantText,
        thinking: thinkingText || undefined,
        timestamp: new Date()
      }];
      
      if (chatId) {
        updateChat(chatId, finalMessages);
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setMessages(prev => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = { 
              ...updated[updated.length - 1], 
              content: updated[updated.length - 1].content || '*Generation stopped*'
            };
          }
          return updated;
        });
      } else {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        setError(errorMsg);
        setMessages(prev => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = { 
              ...updated[updated.length - 1],
              content: ''
            };
          }
          return updated;
        });
      }
    } finally {
      const duration = (Date.now() - startTime) / 1000;
      
      // Estimate token usage
      const estimateTokens = (text: string) => {
        if (!text) return 0;
        const englishChars = text.replace(/[^\x00-\x7F]/g, '').length;
        const nonEnglishChars = text.length - englishChars;
        return Math.ceil(englishChars / 4) + Math.ceil(nonEnglishChars / 2);
      };

      const inputTokens = messages.reduce((sum, m) => sum + estimateTokens(m.content), 0) + estimateTokens(fullContent);
      const outputTokens = estimateTokens(assistantText);

      window.dispatchEvent(new CustomEvent('usage-record', {
        detail: {
          model: selectedModel,
          inputTokens,
          outputTokens,
          timestamp: Date.now(),
          duration,
        }
      }));

      setIsLoading(false);
      setIsStopped(false);
      abortControllerRef.current = null;
    }
  };

  // Stop generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStopped(true);
  };

  // Edit message
  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditContent(content);
  };

  // Save edited message
  const handleSaveEdit = async () => {
    if (!editingMessageId || !editContent.trim()) return;

    const messageIndex = messages.findIndex(m => m.id === editingMessageId);
    if (messageIndex === -1) return;

    const updatedMessages = messages.map(m => 
      m.id === editingMessageId ? { ...m, content: editContent } : m
    );
    
    const newMessages = updatedMessages.slice(0, messageIndex + 1);
    setMessages(newMessages);
    setEditingMessageId(null);
    setEditContent('');

    if (currentChatId) {
      updateChat(currentChatId, newMessages);
    }

    setIsLoading(true);
    setIsStopped(false);

    const assistantMessage: Message = { id: generateId(), role: 'assistant', content: '', timestamp: new Date() };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      abortControllerRef.current = new AbortController();

      const savedSettings = JSON.parse(localStorage.getItem('yusai-settings') || '{}');
      const providers = loadCustomProviders();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          model: selectedModel,
          systemPrompt: savedSettings.systemPrompt || undefined,
          temperature: savedSettings.temperature,
          maxTokens: savedSettings.maxTokens,
          customProviders: providers,
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) throw new Error('Failed to get response');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';
      let thinkingText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        const THINKING_PREFIX = '__THINKING__';
        let processed = '';
        let tempBuffer = buffer;
        
        while (tempBuffer.length > 0) {
          const thinkIdx = tempBuffer.indexOf(THINKING_PREFIX);
          if (thinkIdx === -1) {
            processed += tempBuffer;
            tempBuffer = '';
          } else if (thinkIdx === 0) {
            const afterPrefix = tempBuffer.substring(THINKING_PREFIX.length);
            const nextThinkIdx = afterPrefix.indexOf(THINKING_PREFIX);
            if (nextThinkIdx === -1) {
              thinkingText += afterPrefix;
              tempBuffer = '';
            } else {
              thinkingText += afterPrefix.substring(0, nextThinkIdx);
              tempBuffer = afterPrefix.substring(nextThinkIdx);
            }
          } else {
            processed += tempBuffer.substring(0, thinkIdx);
            tempBuffer = tempBuffer.substring(thinkIdx);
          }
        }
        
        buffer = '';
        assistantText += processed;
        setMessages(prev => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = { ...updated[updated.length - 1], content: assistantText, thinking: thinkingText || undefined };
          }
          return updated;
        });
      }

      const finalMessages = [...newMessages, { id: assistantMessage.id, role: 'assistant' as const, content: assistantText, thinking: thinkingText || undefined, timestamp: new Date() }];
      if (currentChatId) updateChat(currentChatId, finalMessages);

    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        setError(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  // Delete message
  const handleDeleteMessage = (messageId: string) => {
    const newMessages = messages.filter(m => m.id !== messageId);
    setMessages(newMessages);
    if (currentChatId) {
      updateChat(currentChatId, newMessages);
    }
  };

  // Regenerate last response
  const handleRegenerate = async () => {
    if (messages.length < 2 || isLoading) return;

    const newMessages = messages.slice(0, -1);
    setMessages(newMessages);

    setIsLoading(true);
    const assistantMessage: Message = { id: generateId(), role: 'assistant', content: '', timestamp: new Date() };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      abortControllerRef.current = new AbortController();

      const savedSettings = JSON.parse(localStorage.getItem('yusai-settings') || '{}');
      const providers = loadCustomProviders();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          model: selectedModel,
          systemPrompt: savedSettings.systemPrompt || undefined,
          temperature: savedSettings.temperature,
          maxTokens: savedSettings.maxTokens,
          customProviders: providers,
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) throw new Error('Failed to get response');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';
      let thinkingText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        const THINKING_PREFIX = '__THINKING__';
        let processed = '';
        let tempBuffer = buffer;
        
        while (tempBuffer.length > 0) {
          const thinkIdx = tempBuffer.indexOf(THINKING_PREFIX);
          if (thinkIdx === -1) {
            processed += tempBuffer;
            tempBuffer = '';
          } else if (thinkIdx === 0) {
            const afterPrefix = tempBuffer.substring(THINKING_PREFIX.length);
            const nextThinkIdx = afterPrefix.indexOf(THINKING_PREFIX);
            if (nextThinkIdx === -1) {
              thinkingText += afterPrefix;
              tempBuffer = '';
            } else {
              thinkingText += afterPrefix.substring(0, nextThinkIdx);
              tempBuffer = afterPrefix.substring(nextThinkIdx);
            }
          } else {
            processed += tempBuffer.substring(0, thinkIdx);
            tempBuffer = tempBuffer.substring(thinkIdx);
          }
        }
        
        buffer = '';
        assistantText += processed;
        setMessages(prev => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = { ...updated[updated.length - 1], content: assistantText, thinking: thinkingText || undefined };
          }
          return updated;
        });
      }

      const finalMessages = [...newMessages, { id: assistantMessage.id, role: 'assistant' as const, content: assistantText, thinking: thinkingText || undefined, timestamp: new Date() }];
      if (currentChatId) updateChat(currentChatId, finalMessages);

    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        setError(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Export chat as markdown
  const handleExportChat = () => {
    if (messages.length === 0) return;

    const md = messages.map(m => {
      const role = m.role === 'user' ? '**You**' : '**YusAI**';
      const time = new Date(m.timestamp).toLocaleString();
      return `### ${role} *(${time})*\n\n${m.content}`;
    }).join('\n\n---\n\n');

    const header = `# YusAI Chat Export\n\n*Exported on ${new Date().toLocaleString()}*\n\n---\n\n`;
    const blob = new Blob([header + md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yusai-chat-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Share chat via URL
  const handleShareChat = async () => {
    if (messages.length === 0) return;

    try {
      const shareData = messages.map(m => ({
        r: m.role,
        c: m.content,
      }));
      const compressed = btoa(encodeURIComponent(JSON.stringify(shareData)));
      const shareUrl = `${window.location.origin}?share=${compressed}`;
      
      await navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');
    } catch {
      alert('Failed to generate share link');
    }
  };

  // Load shared chat from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareData = params.get('share');
    if (shareData) {
      try {
        const decoded = JSON.parse(decodeURIComponent(atob(shareData)));
        const sharedMessages: Message[] = decoded.map((m: any) => ({
          id: Math.random().toString(36).substring(2, 15),
          role: m.r,
          content: m.c,
          timestamp: new Date(),
        }));
        setMessages(sharedMessages);
        window.history.replaceState({}, '', window.location.pathname);
      } catch {
        // Invalid share data, ignore
      }
    }
  }, []);

  // Suggestions
  const suggestions = [
    { text: 'Explain how async/await works in JavaScript', icon: Code, color: 'from-blue-500 to-blue-600', description: 'Learn about asynchronous programming' },
    { text: 'Help me debug a React component', icon: FlaskConical, color: 'from-purple-500 to-purple-600', description: 'Get help with React issues' },
    { text: 'Write a Python script for data processing', icon: Plane, color: 'from-orange-500 to-orange-600', description: 'Create data processing scripts' },
    { text: 'Suggest best practices for API design', icon: Wrench, color: 'from-emerald-500 to-emerald-600', description: 'Learn API design patterns' },
  ];

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-[#171717]' : 'bg-gray-50'} overflow-hidden transition-colors`}>
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, chatId: null })}
        onConfirm={confirmDeleteChat}
        title="Delete Chat"
        message="Are you sure you want to delete this chat? This action cannot be undone."
        darkMode={darkMode}
      />

      <Settings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        darkMode={darkMode}
      />

      <Sidebar 
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onMoveChat={handleMoveChat}
        chats={chats}
        currentChatId={currentChatId}
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
        darkMode={darkMode}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${darkMode ? 'border-[#2a2a2a] bg-[#171717]' : 'border-gray-200 bg-white'} transition-colors`}>
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-[#2a2a2a] text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'} transition-colors`}
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <ModelSwitcher
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              models={availableModels}
              darkMode={darkMode}
            />
          </div>
          
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <TokenCounter messages={messages} darkMode={darkMode} />
            )}
            
            {messages.length > 0 && (
              <button
                onClick={handleExportChat}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-[#2a2a2a] text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'} transition-colors`}
                title="Export chat"
              >
                <Download className="w-5 h-5" />
              </button>
            )}
            
            {messages.length > 0 && (
              <button
                onClick={handleShareChat}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-[#2a2a2a] text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'} transition-colors`}
                title="Share chat"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
              </button>
            )}
            
            <UsageTracker darkMode={darkMode} />
            
            <button
              onClick={() => setSettingsOpen(true)}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-[#2a2a2a] text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'} transition-colors`}
              title="Settings"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-[#2a2a2a] text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'} transition-colors`}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <UserMenu darkMode={darkMode} />
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-4 mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-slide-in">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-500 flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Messages Area */}
        <div ref={scrollContainerRef} className={`flex-1 overflow-y-auto ${darkMode ? '' : 'bg-gray-50'}`}>
          {messages.length === 0 ? (
            /* Welcome Screen */
            <div className="h-full flex items-center justify-center p-4 sm:p-8">
              <div className="text-center max-w-2xl w-full">
                {/* Logo */}
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 mb-6 shadow-lg shadow-emerald-500/20">
                  <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                
                {/* Title */}
                <h1 className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3`}>
                  Hi, I'm YusAI
                </h1>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-base sm:text-lg mb-8 sm:mb-10 px-4`}>
                  How can I help you today?
                </p>

                {/* Suggestions Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto px-4">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(suggestion.text)}
                      className={`group flex items-start gap-3 p-4 text-left rounded-xl border ${darkMode ? 'border-[#2a2a2a] bg-[#1f1f1f] hover:bg-[#2a2a2a] hover:border-[#3a3a3a]' : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'} transition-all duration-200`}
                    >
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${suggestion.color} flex items-center justify-center shrink-0`}>
                        <suggestion.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-medium ${darkMode ? 'text-gray-200 group-hover:text-white' : 'text-gray-700 group-hover:text-gray-900'} transition-colors line-clamp-2`}>
                          {suggestion.text}
                        </span>
                        <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-1 block`}>
                          {suggestion.description}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Keyboard shortcuts hint */}
                <div className={`mt-8 text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                  <span className={`px-2 py-1 rounded ${darkMode ? 'bg-[#1f1f1f]' : 'bg-gray-100'}`}>Enter</span> to send · <span className={`px-2 py-1 rounded ${darkMode ? 'bg-[#1f1f1f]' : 'bg-gray-100'}`}>Shift + Enter</span> for new line · <span className={`px-2 py-1 rounded ${darkMode ? 'bg-[#1f1f1f]' : 'bg-gray-100'}`}>Ctrl + V</span> to paste image
                </div>
              </div>
            </div>
          ) : (
            /* Chat Messages */
            <div className="max-w-3xl mx-auto px-4 py-6">
              <ChatMessages 
                messages={messages} 
                onEdit={handleEditMessage}
                onDelete={handleDeleteMessage}
                editingMessageId={editingMessageId}
                editContent={editContent}
                onEditContentChange={setEditContent}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
                onRegenerate={handleRegenerate}
                isLoading={isLoading}
                darkMode={darkMode}
              />

              {isLoading && (
                <div className="flex items-center gap-3 py-4 animate-slide-in">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-white animate-pulse-dot"
                          style={{ animationDelay: `${i * 200}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Thinking...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <ChatInput 
          onSendMessage={handleSendMessage} 
          isLoading={isLoading}
          onStop={handleStopGeneration}
          darkMode={darkMode}
          mode={mode}
          onModeChange={setMode}
        />
      </div>
    </div>
  );
}
