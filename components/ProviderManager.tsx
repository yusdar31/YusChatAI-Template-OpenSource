'use client';

import { useState } from 'react';
import { Plus, Trash2, Save, X, Eye, EyeOff, Loader2, Check, AlertCircle, Server, Cpu, ToggleLeft, ToggleRight, Pencil } from 'lucide-react';
import { CustomProvider, CustomModel, saveCustomProviders } from '@/lib/provider-types';

interface ProviderManagerProps {
  providers: CustomProvider[];
  onChange: (providers: CustomProvider[]) => void;
  darkMode: boolean;
}

const inputClass = (dark: boolean) =>
  `w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors ${
    dark
      ? 'bg-[#171717] border border-[#2a2a2a] text-gray-200 placeholder-gray-600 focus:border-emerald-500/50'
      : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-emerald-500/50'
  }`;

export default function ProviderManager({ providers, onChange, darkMode }: ProviderManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; ok: boolean; msg: string } | null>(null);

  const [form, setForm] = useState({
    name: '',
    baseURL: '',
    apiKey: '',
    models: [] as CustomModel[],
  });

  const [newModelId, setNewModelId] = useState('');
  const [newModelName, setNewModelName] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  const resetForm = () => {
    setForm({ name: '', baseURL: '', apiKey: '', models: [] });
    setEditingId(null);
    setIsAdding(false);
    setNewModelId('');
    setNewModelName('');
    setShowApiKey(false);
    setTestResult(null);
  };

  const startEdit = (provider: CustomProvider) => {
    setEditingId(provider.id);
    setIsAdding(false);
    setForm({
      name: provider.name,
      baseURL: provider.baseURL,
      apiKey: provider.apiKey,
      models: [...provider.models],
    });
    setNewModelId('');
    setNewModelName('');
    setShowApiKey(false);
    setTestResult(null);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.baseURL.trim()) return;

    let updated: CustomProvider[];
    if (editingId) {
      updated = providers.map(p =>
        p.id === editingId
          ? { ...p, name: form.name.trim(), baseURL: form.baseURL.trim(), apiKey: form.apiKey, models: form.models }
          : p
      );
    } else {
      const newProvider: CustomProvider = {
        id: Math.random().toString(36).substring(2, 15),
        name: form.name.trim(),
        baseURL: form.baseURL.trim(),
        apiKey: form.apiKey,
        models: form.models,
        enabled: true,
      };
      updated = [...providers, newProvider];
    }

    onChange(updated);
    saveCustomProviders(updated);
    resetForm();
  };

  const handleDelete = (id: string) => {
    const updated = providers.filter(p => p.id !== id);
    onChange(updated);
    saveCustomProviders(updated);
    if (editingId === id) resetForm();
  };

  const handleToggle = (id: string) => {
    const updated = providers.map(p =>
      p.id === id ? { ...p, enabled: !p.enabled } : p
    );
    onChange(updated);
    saveCustomProviders(updated);
  };

  const handleFetchModels = async () => {
    if (!form.baseURL.trim()) return;
    setFetchingModels(true);
    setTestResult(null);

    try {
      let url = form.baseURL.trim();
      if (!url.endsWith('/')) url += '/';
      if (!url.endsWith('v1/')) {
        if (!url.includes('/v1')) url += 'v1';
        url += '/';
      }

      const headers: Record<string, string> = {};
      if (form.apiKey) {
        headers['Authorization'] = `Bearer ${form.apiKey}`;
      }

      const res = await fetch(`${url}models`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const modelList: CustomModel[] = (data.data || data || []).map((m: { id?: string; name?: string }) => ({
        id: m.id || m.name || String(m),
        name: m.name || m.id || String(m),
      }));

      if (modelList.length === 0) {
        setTestResult({ id: 'fetch', ok: false, msg: 'No models found at this endpoint' });
      } else {
        setForm(f => ({ ...f, models: modelList }));
        setTestResult({ id: 'fetch', ok: true, msg: `Found ${modelList.length} models` });
      }
    } catch (err) {
      setTestResult({ id: 'fetch', ok: false, msg: err instanceof Error ? err.message : 'Connection failed' });
    } finally {
      setFetchingModels(false);
    }
  };

  const handleTestConnection = async (provider: CustomProvider) => {
    setTestingId(provider.id);
    setTestResult(null);

    try {
      let url = provider.baseURL;
      if (!url.endsWith('/')) url += '/';
      if (!url.endsWith('v1/')) {
        if (!url.includes('/v1')) url += 'v1';
        url += '/';
      }

      const headers: Record<string, string> = {};
      if (provider.apiKey) {
        headers['Authorization'] = `Bearer ${provider.apiKey}`;
      }

      const res = await fetch(`${url}models`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const count = (data.data || data || []).length;

      setTestResult({ id: provider.id, ok: true, msg: `Connected! ${count} models available` });
    } catch (err) {
      setTestResult({ id: provider.id, ok: false, msg: err instanceof Error ? err.message : 'Connection failed' });
    } finally {
      setTestingId(null);
    }
  };

  const addManualModel = () => {
    if (!newModelId.trim()) return;
    const model: CustomModel = {
      id: newModelId.trim(),
      name: newModelName.trim() || newModelId.trim(),
    };
    setForm(f => ({ ...f, models: [...f.models, model] }));
    setNewModelId('');
    setNewModelName('');
  };

  const removeModel = (modelId: string) => {
    setForm(f => ({ ...f, models: f.models.filter(m => m.id !== modelId) }));
  };

  return (
    <div className="space-y-4">
      {/* Provider List */}
      {providers.length > 0 && (
        <div className="space-y-2">
          {providers.map(provider => {
            const isEditing = editingId === provider.id;

            if (isEditing) {
              return (
                <div key={provider.id} className={`p-4 rounded-xl border space-y-3 ${darkMode ? 'bg-[#171717] border-emerald-500/30' : 'bg-gray-50 border-emerald-300'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'} uppercase tracking-wider`}>Editing Provider</span>
                    <button onClick={resetForm} className={`p-1 rounded ${darkMode ? 'hover:bg-[#2a2a2a] text-gray-500' : 'hover:bg-gray-200 text-gray-400'}`}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`text-xs font-medium mb-1 block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Name</label>
                      <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="My Provider" className={inputClass(darkMode)} />
                    </div>
                    <div>
                      <label className={`text-xs font-medium mb-1 block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Base URL</label>
                      <input value={form.baseURL} onChange={e => setForm(f => ({ ...f, baseURL: e.target.value }))} placeholder="http://localhost:11434/v1" className={inputClass(darkMode)} />
                    </div>
                  </div>

                  <div>
                    <label className={`text-xs font-medium mb-1 block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>API Key (optional)</label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={form.apiKey}
                        onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))}
                        placeholder="sk-... (leave empty if not needed)"
                        className={`${inputClass(darkMode)} pr-10`}
                      />
                      <button onClick={() => setShowApiKey(!showApiKey)} className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Fetch & Test buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleFetchModels}
                      disabled={fetchingModels || !form.baseURL.trim()}
                      className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${darkMode ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'} disabled:opacity-50`}
                    >
                      {fetchingModels ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Server className="w-3.5 h-3.5" />}
                      {fetchingModels ? 'Fetching...' : 'Fetch Models'}
                    </button>
                    <button
                      onClick={() => handleTestConnection({ id: 'test', name: '', baseURL: form.baseURL, apiKey: form.apiKey, models: [], enabled: true })}
                      disabled={!form.baseURL.trim()}
                      className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${darkMode ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'} disabled:opacity-50`}
                    >
                      Test Connection
                    </button>
                  </div>

                  {/* Test result */}
                  {testResult && testResult.id === 'fetch' && (
                    <div className={`flex items-center gap-2 p-2 rounded-lg text-xs ${testResult.ok ? (darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : (darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600')}`}>
                      {testResult.ok ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      {testResult.msg}
                    </div>
                  )}

                  {/* Model List */}
                  <div>
                    <label className={`text-xs font-medium mb-2 block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Models ({form.models.length})</label>
                    <div className={`max-h-40 overflow-y-auto space-y-1 p-2 rounded-lg ${darkMode ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-gray-100 border border-gray-200'}`}>
                      {form.models.map(model => (
                        <div key={model.id} className={`flex items-center justify-between px-2 py-1.5 rounded text-sm ${darkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-200'}`}>
                          <span className={`font-mono text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{model.id}</span>
                          <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{model.name}</span>
                        </div>
                      ))}
                      {form.models.length === 0 && (
                        <p className={`text-xs text-center py-2 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>No models. Fetch or add manually below.</p>
                      )}
                    </div>
                  </div>

                  {/* Add model manually */}
                  <div className="flex gap-2">
                    <input value={newModelId} onChange={e => setNewModelId(e.target.value)} placeholder="model-id" className={`${inputClass(darkMode)} flex-1`} onKeyDown={e => e.key === 'Enter' && addManualModel()} />
                    <input value={newModelName} onChange={e => setNewModelName(e.target.value)} placeholder="Display name" className={`${inputClass(darkMode)} flex-1`} onKeyDown={e => e.key === 'Enter' && addManualModel()} />
                    <button onClick={addManualModel} disabled={!newModelId.trim()} className={`px-3 py-2 rounded-lg text-xs font-medium ${darkMode ? 'bg-[#2a2a2a] text-gray-300 hover:text-white' : 'bg-gray-200 text-gray-700 hover:text-gray-900'} disabled:opacity-50`}>
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Save */}
                  <div className="flex justify-end">
                    <button
                      onClick={handleSave}
                      disabled={!form.name.trim() || !form.baseURL.trim()}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:shadow-none"
                    >
                      <Save className="w-4 h-4" />
                      {editingId ? 'Update Provider' : 'Add Provider'}
                    </button>
                  </div>
                </div>
              );
            }

            // Normal provider card
            return (
              <div key={provider.id} className={`p-3 rounded-xl border transition-colors ${darkMode ? 'bg-[#171717] border-[#2a2a2a] hover:border-[#3a3a3a]' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleToggle(provider.id)} className="shrink-0">
                    {provider.enabled ? (
                      <ToggleRight className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-gray-600" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Cpu className={`w-4 h-4 shrink-0 ${provider.enabled ? (darkMode ? 'text-emerald-400' : 'text-emerald-600') : (darkMode ? 'text-gray-600' : 'text-gray-400')}`} />
                      <span className={`text-sm font-semibold truncate ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{provider.name}</span>
                    </div>
                    <p className={`text-xs font-mono truncate mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{provider.baseURL}</p>
                    <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{provider.models.length} model{provider.models.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleTestConnection(provider)}
                      disabled={testingId === provider.id}
                      className={`p-1.5 rounded-lg text-xs transition-colors ${darkMode ? 'hover:bg-[#2a2a2a] text-gray-500 hover:text-emerald-400' : 'hover:bg-gray-200 text-gray-400 hover:text-emerald-600'} disabled:opacity-50`}
                      title="Test connection"
                    >
                      {testingId === provider.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Server className="w-4 h-4" />}
                    </button>
                    <button onClick={() => startEdit(provider)} className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-[#2a2a2a] text-gray-500 hover:text-gray-300' : 'hover:bg-gray-200 text-gray-400 hover:text-gray-600'}`} title="Edit">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(provider.id)} className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-[#2a2a2a] text-gray-500 hover:text-red-400' : 'hover:bg-gray-200 text-gray-400 hover:text-red-500'}`} title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Test result */}
                {testResult && testResult.id === provider.id && (
                  <div className={`mt-2 flex items-center gap-2 p-2 rounded-lg text-xs ${testResult.ok ? (darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : (darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600')}`}>
                    {testResult.ok ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {testResult.msg}
                  </div>
                )}

                {/* Model chips */}
                {provider.enabled && provider.models.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {provider.models.slice(0, 5).map(model => (
                      <span key={model.id} className={`px-2 py-0.5 rounded text-[10px] font-mono ${darkMode ? 'bg-[#2a2a2a] text-gray-400' : 'bg-gray-200 text-gray-600'}`}>
                        {model.id}
                      </span>
                    ))}
                    {provider.models.length > 5 && (
                      <span className={`px-2 py-0.5 rounded text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        +{provider.models.length - 5} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Provider Button / Form */}
      {isAdding ? (
        <div className={`p-4 rounded-xl border space-y-3 ${darkMode ? 'bg-[#171717] border-emerald-500/30' : 'bg-gray-50 border-emerald-300'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'} uppercase tracking-wider`}>New Provider</span>
            <button onClick={resetForm} className={`p-1 rounded ${darkMode ? 'hover:bg-[#2a2a2a] text-gray-500' : 'hover:bg-gray-200 text-gray-400'}`}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`text-xs font-medium mb-1 block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Provider Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Ollama, OpenRouter, vLLM" className={inputClass(darkMode)} autoFocus />
            </div>
            <div>
              <label className={`text-xs font-medium mb-1 block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Base URL</label>
              <input value={form.baseURL} onChange={e => setForm(f => ({ ...f, baseURL: e.target.value }))} placeholder="http://localhost:11434/v1" className={inputClass(darkMode)} />
            </div>
          </div>

          <div>
            <label className={`text-xs font-medium mb-1 block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>API Key (optional)</label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={form.apiKey}
                onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))}
                placeholder="sk-... (leave empty if not needed)"
                className={`${inputClass(darkMode)} pr-10`}
              />
              <button onClick={() => setShowApiKey(!showApiKey)} className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleFetchModels}
              disabled={fetchingModels || !form.baseURL.trim()}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${darkMode ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'} disabled:opacity-50`}
            >
              {fetchingModels ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Server className="w-3.5 h-3.5" />}
              {fetchingModels ? 'Fetching...' : 'Fetch Models'}
            </button>
            <button
              onClick={() => handleTestConnection({ id: 'test', name: '', baseURL: form.baseURL, apiKey: form.apiKey, models: [], enabled: true })}
              disabled={!form.baseURL.trim()}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${darkMode ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'} disabled:opacity-50`}
            >
              Test Connection
            </button>
          </div>

          {/* Test result */}
          {testResult && testResult.id === 'fetch' && (
            <div className={`flex items-center gap-2 p-2 rounded-lg text-xs ${testResult.ok ? (darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : (darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600')}`}>
              {testResult.ok ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              {testResult.msg}
            </div>
          )}

          {/* Model List */}
          <div>
            <label className={`text-xs font-medium mb-2 block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Models ({form.models.length})</label>
            <div className={`max-h-40 overflow-y-auto space-y-1 p-2 rounded-lg ${darkMode ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-gray-100 border border-gray-200'}`}>
              {form.models.map(model => (
                <div key={model.id} className={`flex items-center justify-between px-2 py-1.5 rounded text-sm group ${darkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-200'}`}>
                  <span className={`font-mono text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{model.id}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{model.name}</span>
                    <button onClick={() => removeModel(model.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 transition-all">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
              {form.models.length === 0 && (
                <p className={`text-xs text-center py-2 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>No models yet. Click &quot;Fetch Models&quot; or add manually below.</p>
              )}
            </div>
          </div>

          {/* Add model manually */}
          <div className="flex gap-2">
            <input value={newModelId} onChange={e => setNewModelId(e.target.value)} placeholder="model-id (e.g. llama3)" className={`${inputClass(darkMode)} flex-1`} onKeyDown={e => e.key === 'Enter' && addManualModel()} />
            <input value={newModelName} onChange={e => setNewModelName(e.target.value)} placeholder="Display name" className={`${inputClass(darkMode)} flex-1`} onKeyDown={e => e.key === 'Enter' && addManualModel()} />
            <button onClick={addManualModel} disabled={!newModelId.trim()} className={`px-3 py-2 rounded-lg text-xs font-medium ${darkMode ? 'bg-[#2a2a2a] text-gray-300 hover:text-white' : 'bg-gray-200 text-gray-700 hover:text-gray-900'} disabled:opacity-50`}>
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={!form.name.trim() || !form.baseURL.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:shadow-none"
            >
              <Save className="w-4 h-4" />
              Add Provider
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => { setIsAdding(true); resetForm(); setIsAdding(true); }}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed transition-colors ${darkMode ? 'border-[#2a2a2a] hover:border-emerald-500/30 text-gray-500 hover:text-emerald-400' : 'border-gray-300 hover:border-emerald-400 text-gray-400 hover:text-emerald-600'}`}
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Add Custom Provider</span>
        </button>
      )}

      {providers.length === 0 && !isAdding && (
        <div className="text-center py-6">
          <Server className={`w-10 h-10 mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
          <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No custom providers yet</p>
          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>Add Ollama, OpenRouter, vLLM, or any OpenAI-compatible API</p>
        </div>
      )}
    </div>
  );
}
