'use client';

import { useMemo } from 'react';
import { Check, ChevronDown, Sparkles, Zap } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ModelItem {
  id: string;
  name: string;
  providerId?: string;
  providerName?: string;
}

interface ModelSwitcherProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  models: ModelItem[];
  darkMode?: boolean;
}

export default function ModelSwitcher({ selectedModel, onModelChange, models, darkMode = true }: ModelSwitcherProps) {
  const currentModel = models.find(m => m.id === selectedModel);

  const grouped = useMemo(() => {
    const loadBalance: ModelItem[] = [];
    const groups: Record<string, { providerName: string; models: ModelItem[] }> = {};

    for (const model of models) {
      if (model.id === 'loadbalance/auto') {
        loadBalance.push(model);
        continue;
      }
      const key = model.providerId || model.providerName || 'unknown';
      if (!groups[key]) {
        groups[key] = { providerName: model.providerName || key, models: [] };
      }
      groups[key].models.push(model);
    }

    return { loadBalance, groups };
  }, [models]);

  const hasGroups = Object.keys(grouped.groups).length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${darkMode ? 'border-[#2a2a2a] hover:bg-[#2a2a2a]' : 'border-gray-200 hover:bg-gray-100'} transition-colors outline-none`}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            {currentModel?.name || 'Select Model'}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={`w-80 p-2 max-h-[400px] overflow-y-auto ${darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-2 px-3 py-2 mb-1">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'} uppercase tracking-wider`}>
            Select Model
          </span>
        </div>

        {/* Load Balance */}
        {grouped.loadBalance.map(model => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => onModelChange(model.id)}
            className={`gap-3 cursor-pointer p-3 rounded-lg transition-colors ${
              model.id === selectedModel
                ? `${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`
                : `${darkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100'}`
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{model.name}</p>
            {model.id === selectedModel && (
              <Check className="w-4 h-4 text-emerald-500 ml-auto shrink-0" />
            )}
          </DropdownMenuItem>
        ))}

        {/* Grouped by provider */}
        {Object.entries(grouped.groups).map(([key, group]) => (
          <div key={key}>
            {hasGroups && <DropdownMenuSeparator className={darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-200'} />}
            <DropdownMenuLabel className={`text-[11px] font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'} uppercase tracking-wider px-3`}>
              {group.providerName}
            </DropdownMenuLabel>
            {group.models.map(model => (
              <DropdownMenuItem
                key={model.id}
                onClick={() => onModelChange(model.id)}
                className={`gap-3 cursor-pointer p-3 rounded-lg transition-colors ${
                  model.id === selectedModel
                    ? `${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`
                    : `${darkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100'}`
                }`}
              >
                <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{model.name}</p>
                {model.id === selectedModel && (
                  <Check className="w-4 h-4 text-emerald-500 ml-auto shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
