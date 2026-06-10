'use client';

import { useState, useMemo } from 'react';
import { MessageSquare, Plus, Settings, User, Search, Trash2, PanelLeftClose, Folder, FolderOpen, FolderPlus, ChevronRight, MoreHorizontal, Pencil } from 'lucide-react';

interface Chat {
  id: string;
  title: string;
  messages: any[];
  createdAt: Date;
  updatedAt: Date;
  folderId?: string | null;
}

interface Folder {
  id: string;
  name: string;
  isExpanded: boolean;
}

interface SidebarProps {
  onNewChat: () => void;
  onSelectChat?: (chatId: string) => void;
  onDeleteChat?: (chatId: string) => void;
  onMoveChat?: (chatId: string, folderId: string | null) => void;
  chats?: Chat[];
  currentChatId?: string | null;
  isOpen?: boolean;
  onToggle?: () => void;
  darkMode?: boolean;
}

export default function Sidebar({ 
  onNewChat, 
  onSelectChat, 
  onDeleteChat,
  onMoveChat,
  chats = [], 
  currentChatId,
  isOpen = true, 
  onToggle,
  darkMode = true
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [folders, setFolders] = useState<Folder[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('yusai-folders');
      if (saved) {
        try { return JSON.parse(saved); } catch { return []; }
      }
    }
    return [];
  });
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ chatId: string; x: number; y: number } | null>(null);

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const q = searchQuery.toLowerCase();
    return chats.filter(chat => 
      chat.title.toLowerCase().includes(q) ||
      chat.messages.some(m => m.content?.toLowerCase().includes(q))
    );
  }, [chats, searchQuery]);

  const unfiledChats = useMemo(() => 
    filteredChats.filter(c => !c.folderId), 
    [filteredChats]
  );

  const chatsByFolder = useMemo(() => {
    const map: Record<string, Chat[]> = {};
    folders.forEach(f => { map[f.id] = []; });
    filteredChats.forEach(chat => {
      if (chat.folderId && map[chat.folderId]) {
        map[chat.folderId].push(chat);
      }
    });
    return map;
  }, [filteredChats, folders]);

  const saveFolders = (newFolders: Folder[]) => {
    setFolders(newFolders);
    localStorage.setItem('yusai-folders', JSON.stringify(newFolders));
  };

  const handleCreateFolder = () => {
    const newFolder: Folder = {
      id: Math.random().toString(36).substring(2, 15),
      name: 'New Folder',
      isExpanded: true,
    };
    saveFolders([...folders, newFolder]);
    setEditingFolderId(newFolder.id);
    setEditFolderName('New Folder');
  };

  const handleRenameFolder = (folderId: string) => {
    if (!editFolderName.trim()) {
      setEditingFolderId(null);
      return;
    }
    saveFolders(folders.map(f => 
      f.id === folderId ? { ...f, name: editFolderName.trim() } : f
    ));
    setEditingFolderId(null);
  };

  const handleDeleteFolder = (folderId: string) => {
    chats.forEach(chat => {
      if (chat.folderId === folderId && onMoveChat) {
        onMoveChat(chat.id, null);
      }
    });
    saveFolders(folders.filter(f => f.id !== folderId));
  };

  const handleToggleFolder = (folderId: string) => {
    saveFolders(folders.map(f => 
      f.id === folderId ? { ...f, isExpanded: !f.isExpanded } : f
    ));
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const renderChatItem = (chat: Chat) => (
    <div
      key={chat.id}
      className={`group relative w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer ${
        currentChatId === chat.id 
          ? `${darkMode ? 'bg-[#2a2a2a] text-white shadow-lg shadow-black/10' : 'bg-gray-200 text-gray-900'}` 
          : `${darkMode ? 'text-gray-400 hover:bg-[#1f1f1f] hover:text-gray-200' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`
      }`}
      onClick={() => onSelectChat?.(chat.id)}
      onContextMenu={(e) => {
        e.preventDefault();
        setContextMenu({ chatId: chat.id, x: e.clientX, y: e.clientY });
      }}
    >
      <div className="flex items-center gap-3">
        <MessageSquare className={`w-4 h-4 shrink-0 ${currentChatId === chat.id ? 'text-emerald-500' : darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
        <div className="flex-1 min-w-0">
          <p className="text-[14px] truncate font-medium">{chat.title}</p>
          <p className={`text-[12px] ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-0.5`}>{formatTime(chat.updatedAt)}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteChat?.(chat.id);
          }}
          className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${darkMode ? 'hover:bg-[#3a3a3a] text-gray-500 hover:text-red-400' : 'hover:bg-gray-300 text-gray-400 hover:text-red-500'}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className={`${isOpen ? 'w-72' : 'w-0'} ${darkMode ? 'bg-[#171717]' : 'bg-gray-50'} flex flex-col h-full transition-all duration-300 overflow-hidden border-r ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
        <div className="w-72 flex flex-col h-full">
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="text-white font-bold text-sm tracking-tight">Y</span>
              </div>
              <span className={`${darkMode ? 'text-white' : 'text-gray-900'} font-semibold text-[15px] tracking-tight`}>YusAI</span>
            </div>
            <button 
              onClick={onToggle}
              className={`w-8 h-8 rounded-lg ${darkMode ? 'hover:bg-[#2a2a2a] text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'} flex items-center justify-center transition-colors`}
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* New Chat & New Folder */}
          <div className="p-3 flex gap-2">
            <button
              onClick={onNewChat}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border ${darkMode ? 'border-[#2a2a2a] hover:bg-[#2a2a2a] text-gray-300 hover:text-white' : 'border-gray-300 hover:bg-gray-100 text-gray-700 hover:text-gray-900'} transition-all duration-200 font-medium text-[14px]`}
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              <span>New chat</span>
            </button>
            <button
              onClick={handleCreateFolder}
              className={`px-3 py-3 rounded-xl border ${darkMode ? 'border-[#2a2a2a] hover:bg-[#2a2a2a] text-gray-400 hover:text-white' : 'border-gray-300 hover:bg-gray-100 text-gray-600 hover:text-gray-900'} transition-all duration-200`}
              title="New folder"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="px-3 pb-3">
            <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg ${darkMode ? 'bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a]' : 'bg-gray-100 border-gray-200 hover:border-gray-300'} border transition-colors`}>
              <Search className={`w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <input 
                type="text" 
                placeholder="Search chats..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`bg-transparent text-[14px] ${darkMode ? 'text-gray-300 placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'} outline-none flex-1`}
              />
            </div>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto px-3 py-1">
            {/* Folders */}
            {folders.map(folder => (
              <div key={folder.id} className="mb-1">
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer group transition-colors ${
                    darkMode ? 'hover:bg-[#1f1f1f]' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => handleToggleFolder(folder.id)}
                >
                  {folder.isExpanded ? (
                    <FolderOpen className={`w-4 h-4 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  ) : (
                    <Folder className={`w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  )}
                  {editingFolderId === folder.id ? (
                    <input
                      value={editFolderName}
                      onChange={(e) => setEditFolderName(e.target.value)}
                      onBlur={() => handleRenameFolder(folder.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameFolder(folder.id);
                        if (e.key === 'Escape') setEditingFolderId(null);
                      }}
                      autoFocus
                      className={`flex-1 text-[13px] font-medium bg-transparent outline-none ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className={`flex-1 text-[13px] font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {folder.name}
                    </span>
                  )}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingFolderId(folder.id);
                        setEditFolderName(folder.name);
                      }}
                      className={`p-1 rounded ${darkMode ? 'hover:bg-[#2a2a2a] text-gray-500' : 'hover:bg-gray-200 text-gray-400'}`}
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(folder.id);
                      }}
                      className={`p-1 rounded ${darkMode ? 'hover:bg-[#2a2a2a] text-gray-500 hover:text-red-400' : 'hover:bg-gray-200 text-gray-400 hover:text-red-500'}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                {folder.isExpanded && (
                  <div className="ml-2 space-y-0.5">
                    {chatsByFolder[folder.id]?.map(renderChatItem)}
                    {(!chatsByFolder[folder.id] || chatsByFolder[folder.id].length === 0) && (
                      <p className={`text-[12px] px-3 py-2 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>No chats</p>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Unfiled chats */}
            {unfiledChats.length > 0 && (
              <>
                {folders.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 mt-2 mb-1">
                    <span className={`text-[11px] font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'} uppercase tracking-wider`}>
                      Recent
                    </span>
                  </div>
                )}
                {folders.length === 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 mb-1">
                    <span className={`text-[11px] font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'} uppercase tracking-wider`}>
                      Recent
                    </span>
                  </div>
                )}
                <div className="space-y-0.5">
                  {unfiledChats.map(renderChatItem)}
                </div>
              </>
            )}

            {filteredChats.length === 0 && chats.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare className={`w-8 h-8 mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={`text-[14px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  No chats yet
                </p>
                <p className={`text-[12px] ${darkMode ? 'text-gray-600' : 'text-gray-400'} mt-1`}>
                  Start a new conversation
                </p>
              </div>
            )}

            {filteredChats.length === 0 && chats.length > 0 && (
              <div className="text-center py-8">
                <Search className={`w-8 h-8 mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={`text-[14px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  No results found
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`p-3 border-t ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
            <button className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl ${darkMode ? 'text-gray-400 hover:bg-[#1f1f1f] hover:text-gray-200' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'} transition-colors`}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className={`text-[14px] font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Andi Yusdar</p>
                <p className={`text-[12px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Free Plan</p>
              </div>
              <Settings className={`w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setContextMenu(null)} 
          />
          <div 
            className={`fixed z-50 w-52 py-1.5 rounded-xl border shadow-xl ${darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            {folders.map(folder => (
              <button
                key={folder.id}
                onClick={() => {
                  onMoveChat?.(contextMenu.chatId, folder.id);
                  setContextMenu(null);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] ${darkMode ? 'text-gray-300 hover:bg-[#2a2a2a]' : 'text-gray-700 hover:bg-gray-100'} transition-colors`}
              >
                <Folder className="w-4 h-4" />
                Move to {folder.name}
              </button>
            ))}
            {contextMenu && (() => {
              const chat = chats.find(c => c.id === contextMenu.chatId);
              if (chat?.folderId) {
                return (
                  <button
                    onClick={() => {
                      onMoveChat?.(contextMenu.chatId, null);
                      setContextMenu(null);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] ${darkMode ? 'text-gray-300 hover:bg-[#2a2a2a]' : 'text-gray-700 hover:bg-gray-100'} transition-colors`}
                  >
                    <FolderOpen className="w-4 h-4" />
                    Remove from folder
                  </button>
                );
              }
              return null;
            })()}
            <div className={`mx-2 my-1 border-t ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-200'}`} />
            <button
              onClick={() => {
                onDeleteChat?.(contextMenu.chatId);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete chat
            </button>
          </div>
        </>
      )}
    </>
  );
}
