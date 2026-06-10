'use client';

import { Check, ChevronDown, Sparkles, Zap } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ModelSwitcherProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  models: { id: string; name: string }[];
  darkMode?: boolean;
}

const getIsLoadBalance = (modelId: string): boolean => {
  return modelId.startsWith('loadbalance/');
};

export default function ModelSwitcher({ selectedModel, onModelChange, models, darkMode = true }: ModelSwitcherProps) {
  const currentModel = models.find(m => m.id === selectedModel);

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
      <DropdownMenuContent align="end" className={`w-72 p-2 ${darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-2 px-3 py-2 mb-2">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'} uppercase tracking-wider`}>
            Select Model
          </span>
        </div>
        <div className="space-y-1">
          {models.map((model) => {
            const isLoadBalance = getIsLoadBalance(model.id);
            const isSelected = model.id === selectedModel;

            return (
              <DropdownMenuItem
                key={model.id}
                onClick={() => onModelChange(model.id)}
                className={`gap-3 cursor-pointer p-3 rounded-lg transition-colors ${
                  isSelected 
                    ? `${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-100'}` 
                    : `${darkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100'}`
                }`}
              >
                <div className="flex items-center gap-3">
                  {isLoadBalance ? (
                    <Zap className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                  )}
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{model.name}</p>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-emerald-500 ml-auto" />
                )}
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
