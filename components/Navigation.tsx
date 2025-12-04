import React from 'react';
import { AppMode } from '../types';

interface NavigationProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentMode, onModeChange }) => {
  const navItems = [
    { id: AppMode.Chat, label: 'Chat', icon: '💬' },
    { id: AppMode.Image, label: 'Creador de Imágenes', icon: '🎨' },
    { id: AppMode.Video, label: 'Creador de Videos', icon: '🎥' },
    { id: AppMode.Live, label: 'Arkaios en Línea', icon: '🎙️' },
  ];

  return (
    <nav className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col p-4">
      <div className="mb-8 px-2">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Gemini Suite
        </h1>
        <p className="text-xs text-slate-500 mt-1">Multimodal AI Studio</p>
      </div>

      <div className="flex-1 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onModeChange(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${currentMode === item.id
                ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-auto px-4 py-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
        <p className="text-xs text-slate-400 leading-relaxed">
          Powered by Puter.js & Arkaios.
          <br />
          Gemini 2.5 Flash & Pro (Legacy)
          <br />
          Veo 3.1 & Live API (Legacy)
        </p>
      </div>
    </nav>
  );
};