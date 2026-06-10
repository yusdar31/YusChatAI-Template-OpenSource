'use client';

import { useState, useEffect } from 'react';
import { X, Save, RotateCcw, User, Cpu, Thermometer, AlertTriangle, Server } from 'lucide-react';
import ProviderManager from '@/components/ProviderManager';
import { CustomProvider, loadCustomProviders, saveCustomProviders } from '@/lib/provider-types';

export interface SettingsData {
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
}

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
}

const defaultSettings: SettingsData = {
  systemPrompt: '',
  temperature: 0.7,
  maxTokens: 2000,
};

const presetPrompts = [
  { name: 'Default', prompt: '' },
  { name: 'Coding Assistant', prompt: 'You are an expert software engineer. Write clean, efficient, and well-documented code. Always explain your decisions and suggest best practices.' },
  { name: 'Creative Writer', prompt: 'You are a creative writing assistant. Help with storytelling, brainstorming ideas, and crafting engaging content. Be imaginative and expressive.' },
  { name: 'Teacher', prompt: 'You are a patient and knowledgeable teacher. Explain concepts clearly with examples. Adapt your explanations to the student\'s level. Encourage learning.' },
  { name: 'Translator', prompt: 'You are a professional translator. Translate text accurately while preserving tone, context, and cultural nuances. Mention the source language when translating.' },
  { name: 'Data Analyst', prompt: 'You are a data analyst expert. Help analyze data, create insights, suggest visualizations, and write SQL/Python code for data processing.' },
  { name: 'Concise', prompt: 'Be concise and direct. Answer in as few words as possible while being accurate and helpful. No unnecessary explanations.' },
];

type Tab = 'general' | 'providers';

export default function Settings({ isOpen, onClose, darkMode }: SettingsProps) {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [providers, setProviders] = useState<CustomProvider[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const savedSettings = localStorage.getItem('yusai-settings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings({
            systemPrompt: parsed.systemPrompt ?? defaultSettings.systemPrompt,
            temperature: parsed.temperature ?? defaultSettings.temperature,
            maxTokens: parsed.maxTokens ?? defaultSettings.maxTokens,
          });
        } catch {
          setSettings(defaultSettings);
        }
      }
      setProviders(loadCustomProviders());
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('yusai-settings', JSON.stringify(settings));
    saveCustomProviders(providers);
    window.dispatchEvent(new Event('settings-updated'));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('yusai-settings');
    window.dispatchEvent(new Event('settings-updated'));
  };

  if (!isOpen) return null;

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: 'general', label: 'General', icon: User },
    { id: 'providers', label: 'Providers', icon: Server },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className={`w-full max-w-2xl max-h-[85vh] mx-4 rounded-2xl border shadow-2xl flex flex-col ${darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Settings</h2>
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Customize your AI experience</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-[#2a2a2a] text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'} transition-colors`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex px-6 border-b ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? `border-emerald-500 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`
                    : `border-transparent ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* System Prompt */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <User className={`w-4 h-4 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <label className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>System Prompt</label>
                </div>
                <p className={`text-xs mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Set how the AI behaves. This is sent with every message.
                </p>
                <textarea
                  value={settings.systemPrompt}
                  onChange={(e) => setSettings(s => ({ ...s, systemPrompt: e.target.value }))}
                  placeholder="You are a helpful assistant..."
                  rows={4}
                  className={`w-full px-4 py-3 rounded-xl text-sm resize-none outline-none transition-colors ${darkMode ? 'bg-[#171717] border border-[#2a2a2a] text-gray-200 placeholder-gray-600 focus:border-emerald-500/50' : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-emerald-500/50'}`}
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {presetPrompts.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setSettings(s => ({ ...s, systemPrompt: preset.prompt }))}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors ${
                        settings.systemPrompt === preset.prompt
                          ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                          : `${darkMode ? 'bg-[#2a2a2a] text-gray-400 hover:text-gray-300 border border-transparent' : 'bg-gray-100 text-gray-600 hover:text-gray-800 border border-transparent'}`
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Model Parameters */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Thermometer className={`w-4 h-4 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                  <label className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Model Parameters</label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Temperature</label>
                      <span className={`text-xs font-mono ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{settings.temperature}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={settings.temperature}
                      onChange={(e) => setSettings(s => ({ ...s, temperature: parseFloat(e.target.value) }))}
                      className="w-full accent-emerald-500"
                    />
                    <div className="flex justify-between mt-1">
                      <span className={`text-[10px] ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>Precise</span>
                      <span className={`text-[10px] ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>Creative</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Max Tokens</label>
                      <span className={`text-xs font-mono ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{settings.maxTokens}</span>
                    </div>
                    <input
                      type="range"
                      min="256"
                      max="8192"
                      step="256"
                      value={settings.maxTokens}
                      onChange={(e) => setSettings(s => ({ ...s, maxTokens: parseInt(e.target.value) }))}
                      className="w-full accent-emerald-500"
                    />
                    <div className="flex justify-between mt-1">
                      <span className={`text-[10px] ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>Short</span>
                      <span className={`text-[10px] ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>Long</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'providers' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Cpu className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <label className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Custom Providers</label>
                </div>
                <p className={`text-xs mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Add any OpenAI-compatible API: Ollama, OpenRouter, vLLM, LM Studio, etc.
                </p>
              </div>
              <ProviderManager providers={providers} onChange={setProviders} darkMode={darkMode} />
            </div>
          )}
        </div>

        {/* Warning */}
        <div className={`px-6 pb-2`}>
          <div className={`flex items-start gap-3 p-3 rounded-xl ${darkMode ? 'bg-amber-500/5 border border-amber-500/10' : 'bg-amber-50 border border-amber-200'}`}>
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              API keys are stored in your browser&apos;s localStorage. They are never sent to any server except the API endpoint you configure.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between px-6 py-4 border-t ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
          <button
            onClick={handleReset}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-[#2a2a2a]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg transition-colors ${
              saved
                ? 'bg-emerald-500/20 text-emerald-500'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
            }`}
          >
            <Save className="w-4 h-4" />
            {saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
