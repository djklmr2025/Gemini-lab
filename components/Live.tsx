import React from 'react';

export const Live: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-slate-900 items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-6">
        <div className="text-6xl mb-4">🎙️</div>
        <h2 className="text-3xl font-bold text-white">Arkaios en Línea</h2>
        <p className="text-slate-400">
          La funcionalidad de voz en vivo ahora está integrada directamente en el Chat.
        </p>
        <p className="text-slate-500 text-sm">
          Usa el botón de "Radio" <span className="inline-block align-middle"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" /><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" /><circle cx="12" cy="12" r="2" /><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" /><path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1" /></svg></span> en la interfaz de chat para iniciar una conversación continua.
        </p>
      </div>
    </div>
  );
};