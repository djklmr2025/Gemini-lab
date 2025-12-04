import React, { useState } from 'react';
import { Navigation } from './components/Navigation';
import { Chat } from './components/Chat';
import { ImageGen } from './components/ImageGen';
import { AppMode } from './types';

const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>(AppMode.Chat);

  const renderContent = () => {
    switch (currentMode) {
      case AppMode.Chat:
        return <Chat />;
      case AppMode.Image:
        return <ImageGen />;
      default:
        return <Chat />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-slate-950 text-slate-200">
      <Navigation currentMode={currentMode} onModeChange={setCurrentMode} />

      <main className="flex-1 h-full overflow-hidden relative">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;