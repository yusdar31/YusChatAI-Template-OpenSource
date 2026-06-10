'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, FileText, Square, Image, Brain, MessageSquare, Search, Mic, MicOff } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (content: string, mode: 'chat' | 'reasoning' | 'research' | 'image', attachedFileContent?: string) => void;
  isLoading: boolean;
  onStop?: () => void;
  darkMode?: boolean;
  mode: 'chat' | 'reasoning' | 'research' | 'image';
  onModeChange: (mode: 'chat' | 'reasoning' | 'research' | 'image') => void;
}

const modes = [
  { id: 'chat' as const, label: 'Chat', icon: MessageSquare, color: 'text-emerald-500' },
  { id: 'reasoning' as const, label: 'Thinking', icon: Brain, color: 'text-purple-500' },
  { id: 'research' as const, label: 'Research', icon: Search, color: 'text-blue-500' },
];

export default function ChatInput({ onSendMessage, isLoading, onStop, darkMode = true, mode, onModeChange }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [attachedFile, setAttachedFile] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Check speech recognition support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInput(prev => {
          const base = prev.replace(/\[Listening\.\.\.\]$/, '').trim();
          return base ? `${base} ${transcript}` : transcript;
        });
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInput(prev => prev ? `${prev} ` : '');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Auto-focus textarea
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Handle paste image
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = items[i].getAsFile();
        if (!blob) continue;

        const reader = new FileReader();
        reader.onload = (event) => {
          setAttachedImage(event.target?.result as string);
        };
        reader.readAsDataURL(blob);
        break;
      }
    }
  };

  const handleSubmit = () => {
    if ((!input.trim() && !attachedImage) || isLoading) return;

    let fullContent = input;
    if (attachedImage) {
      fullContent += `\n\n[Attached Image]: ${attachedImage}`;
    }
    if (attachedFile) {
      fullContent += `\n\n[Attached File Context]:\n\`\`\`\n${attachedFile}\n\`\`\``;
    }

    onSendMessage(fullContent, 'chat');
    setInput('');
    setAttachedFile(null);
    setFileName(null);
    setAttachedImage(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setAttachedFile(text);
      setFileName(file.name);
    } catch (error) {
      console.error('Failed to read file:', error);
    }
  };

  const handleImageAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setAttachedFile(null);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = () => {
    setAttachedImage(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  return (
    <div className={`border-t ${darkMode ? 'border-[#2a2a2a] bg-[#171717]' : 'border-gray-200 bg-white'} transition-colors`}>
      <div className="max-w-3xl mx-auto px-4 py-4">
        {/* Mode Selector */}
        <div className="flex items-center gap-2 mb-3">
          {modes.map((m) => {
            const Icon = m.icon;
            const isActive = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onModeChange(m.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? `${darkMode ? 'bg-[#2a2a2a] text-white' : 'bg-gray-200 text-gray-900'}`
                    : `${darkMode ? 'text-gray-500 hover:text-gray-300 hover:bg-[#1f1f1f]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? m.color : ''}`} />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
        {/* File attachment indicator */}
        {attachedFile && fileName && (
          <div className={`mb-3 inline-flex items-center gap-2 px-3 py-2 ${darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-gray-100 border-gray-200'} border rounded-lg text-sm animate-scale-in`}>
            <FileText className="w-4 h-4 text-emerald-500" />
            <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} font-medium max-w-[200px] truncate`}>{fileName}</span>
            <button
              onClick={removeFile}
              className={`ml-1 p-1 ${darkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-200'} rounded transition-colors`}
            >
              <X className={`w-3.5 h-3.5 ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`} />
            </button>
          </div>
        )}

        {/* Image attachment indicator */}
        {attachedImage && (
          <div className="mb-3 relative inline-block animate-scale-in">
            <img 
              src={attachedImage} 
              alt="Attached" 
              className="max-h-32 rounded-lg border border-[#2a2a2a]"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input Area */}
        <div className={`relative ${darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-white border-gray-300'} rounded-2xl border transition-colors`}>
          <div className="flex items-end">
            {/* Attach Buttons */}
            <div className="flex items-center gap-1 ml-2 mb-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className={`p-2 ${darkMode ? 'text-gray-500 hover:text-gray-300 hover:bg-[#2a2a2a]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'} rounded-lg transition-colors disabled:opacity-50`}
                title="Attach file"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <button
                onClick={() => imageInputRef.current?.click()}
                disabled={isLoading}
                className={`p-2 ${darkMode ? 'text-gray-500 hover:text-gray-300 hover:bg-[#2a2a2a]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'} rounded-lg transition-colors disabled:opacity-50`}
                title="Attach image"
              >
                <Image className="w-5 h-5" />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileAttach}
              accept=".txt,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.md,.json,.xml,.html,.css"
            />
            
            <input
              ref={imageInputRef}
              type="file"
              className="hidden"
              onChange={handleImageAttach}
              accept="image/*"
            />

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="Message YusAI..."
              disabled={isLoading}
              className={`flex-1 py-3 px-2 bg-transparent ${darkMode ? 'text-gray-100 placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'} outline-none resize-none text-[15px] leading-relaxed max-h-[200px] min-h-[48px]`}
              rows={1}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />

            {/* Action Buttons */}
            <div className="flex items-center gap-1 p-2 mb-1">
              {speechSupported && !isLoading && (
                <button
                  onClick={toggleVoiceInput}
                  className={`p-2 rounded-lg transition-colors ${
                    isListening
                      ? 'bg-red-500/20 text-red-500 animate-pulse'
                      : `${darkMode ? 'text-gray-500 hover:text-gray-300 hover:bg-[#2a2a2a]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`
                  }`}
                  title={isListening ? 'Stop listening' : 'Voice input'}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              )}
              {isLoading ? (
                <button
                  onClick={onStop}
                  className="p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors shadow-lg shadow-red-500/20"
                  title="Stop generating"
                >
                  <Square className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim() && !attachedImage}
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-[#2a2a2a] disabled:text-gray-600 text-white rounded-xl transition-colors disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 disabled:shadow-none"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'} mt-3 text-center`}>
          AI can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
}
