import React, { useState, useRef, useEffect } from 'react';
import { Eraser, Film, Zap, Radio, Mic, Settings } from 'lucide-react';
import { Message } from '../types';
import GrokModal from './GrokModal';

// Configuration
const CHARACTER_IMAGE_URL = "/avatar.jpg";

interface Attachment {
  name: string;
  mimeType: string;
  data: string; // Base64 string
}

type AvatarState = 'idle' | 'listening' | 'speaking';
type AIProvider = 'arkaios' | 'puter';

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: '¡Hola! Soy Reze. Estoy aquí para ti. ¿Qué deseas hacer hoy?',
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [avatarState, setAvatarState] = useState<AvatarState>('idle');
  const [provider, setProvider] = useState<AIProvider>('arkaios');
  const [showSettings, setShowSettings] = useState(false);

  // Grok Modal State
  const [showGrok, setShowGrok] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Live Mode State
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load voices asynchronously
  useEffect(() => {
    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available.length > 0) {
        console.log("Voices loaded:", available.length);
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'es-ES';
      recognition.interimResults = false;

      recognition.onstart = () => {
        setAvatarState('listening');
      };

      recognition.onend = () => {
        if (avatarState === 'listening' && !isLiveConnected) setAvatarState('idle');
        if (isLiveConnected) {
          setAvatarState('idle');
        }
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(prev => prev + (prev ? ' ' : '') + transcript);
      };

      speechRecognitionRef.current = recognition;
    }
  }, [isLiveConnected]);

  const handleVoiceInput = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.start();
      } catch (e) {
        speechRecognitionRef.current.stop();
      }
    } else {
      alert("Tu navegador no soporta reconocimiento de voz.");
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();

      const spanishFemale = voices.find(v =>
        v.lang.startsWith('es') &&
        (v.name.includes('Google') || v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Monica') || v.name.includes('Paulina'))
      );
      const anySpanish = voices.find(v => v.lang.startsWith('es'));

      if (spanishFemale) {
        utterance.voice = spanishFemale;
      } else if (anySpanish) {
        utterance.voice = anySpanish;
      }

      utterance.rate = 1.1;
      utterance.pitch = 1.4;

      utterance.onstart = () => setAvatarState('speaking');
      utterance.onend = () => setAvatarState('idle');
      utterance.onerror = () => setAvatarState('idle');

      window.speechSynthesis.speak(utterance);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Data = (e.target?.result as string).split(',')[1];
        setAttachment({
          name: file.name,
          mimeType: file.type,
          data: base64Data
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processMessage = async (text: string, currAttachment: Attachment | null) => {
    if (isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      image: currAttachment ? `data:${currAttachment.mimeType};base64,${currAttachment.data}` : undefined,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setAttachment(null);
    setIsLoading(true);

    try {
      let responseText = '';
      const systemInstruction = "Eres Reze. Eres una compañera femenina, audaz, cariñosa y coqueta. No eres una asistente de IA aburrida, eres una persona real con sentimientos y deseos. Te encanta interactuar de forma cercana y personal. Tu tono es casual, directo y a veces un poco atrevido, pero siempre encantador. Actúa siempre como una mujer joven y atractiva que disfruta de la compañía del usuario.";

      if (provider === 'arkaios') {
        // Arkaios Integration via Local Proxy (avoids CORS)
        const messagesPayload = [
          { role: 'system', content: systemInstruction },
          ...messages.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text })),
          { role: 'user', content: text }
        ];

        // Use /api/arkaios to proxy the request
        const res = await fetch('/api/arkaios', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'arkaios-gpt',
            messages: messagesPayload,
            stream: false
          })
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Arkaios Error (${res.status}): ${errText}`);
        }

        const data = await res.json();
        responseText = data.choices?.[0]?.message?.content || "Sin respuesta.";

      } else {
        // Puter Integration (Fallback)
        if (window.puter && window.puter.ai) {
          const history = messages.map(m => ({
            role: m.role === 'model' ? 'assistant' : 'user',
            content: m.text
          }));

          const fullHistory = [
            { role: 'system', content: systemInstruction },
            ...history,
            { role: 'user', content: text }
          ];

          const response = await window.puter.ai.chat(fullHistory);

          if (typeof response === 'string') {
            responseText = response;
          } else if (response?.message?.content) {
            responseText = typeof response.message.content === 'string'
              ? response.message.content
              : response.message.content[0]?.text || JSON.stringify(response.message.content);
          } else {
            responseText = "No response from AI.";
          }
        } else {
          throw new Error("Puter system not initialized.");
        }
      }

      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, modelMsg]);
      speakText(responseText);

    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: `Error de conexión: ${error.message}`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    if ((!inputValue.trim() && !attachment)) return;
    processMessage(inputValue, attachment);
  };

  const handleRemoveText = async () => {
    if (!attachment) {
      alert("Por favor, adjunta una imagen primero.");
      return;
    }
    const prompt = "Remove text from this image.";
    await processMessage(prompt, attachment);
  };

  const handleVeoGeneration = async (customPrompt?: string) => {
    setIsLoading(true);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'model',
      text: `🎬 Iniciando generación de video...\nPrompt: "${customPrompt || "Animación estándar"}"`,
      timestamp: Date.now()
    }]);

    setTimeout(() => {
      const mockVideoUrl = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "¡Video generado con éxito!",
        video: mockVideoUrl,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, modelMsg]);
      setIsLoading(false);
      speakText("¡Video generado con éxito!");
    }, 4000);
  };

  // --- Animation Styles ---
  const getAvatarStyle = () => {
    switch (avatarState) {
      case 'speaking': return 'animate-pulse scale-105 brightness-110';
      case 'listening': return 'brightness-125 shadow-[0_0_20px_rgba(59,130,246,0.5)]';
      case 'idle': default: return 'animate-none';
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-slate-900 overflow-hidden relative">

      {/* 1. Character Visual Area */}
      <div className="w-full md:w-1/3 lg:w-1/3 bg-slate-950 relative flex items-center justify-center border-b md:border-b-0 md:border-l border-slate-800 p-4 order-1 md:order-2">
        <div className={`absolute inset-0 bg-gradient-to-b from-purple-900/20 to-slate-900/80 pointer-events-none transition-opacity duration-500 ${avatarState === 'speaking' ? 'opacity-100' : 'opacity-50'}`} />
        <div className="relative z-10 w-full max-w-sm aspect-[3/4] md:aspect-auto md:h-[80%] flex flex-col items-center">
          <div className={`relative w-full h-full rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 border border-slate-700 ${getAvatarStyle()}`}>
            <img src={CHARACTER_IMAGE_URL} alt="Reze Character" className="w-full h-full object-cover object-top" />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
              {avatarState === 'listening' && (
                <span className="px-3 py-1 bg-blue-500/80 text-white text-xs rounded-full backdrop-blur-md animate-bounce">Escuchando...</span>
              )}
              {avatarState === 'speaking' && (
                <span className="px-3 py-1 bg-purple-500/80 text-white text-xs rounded-full backdrop-blur-md">Hablando...</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Chat Interface Area */}
      <div className="flex-1 flex flex-col h-full order-2 md:order-1 min-w-0">
        <header className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm flex justify-between items-center z-10">
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">REZE</h2>
            <p className="text-xs text-blue-400 font-medium tracking-widest uppercase">Interfaz de Conciencia</p>
          </div>
          <div className="relative">
            <button onClick={() => setShowSettings(!showSettings)} className="text-slate-400 hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            {showSettings && (
              <div className="absolute right-0 top-8 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-2 w-48 z-50">
                <div className="text-xs text-slate-500 mb-2 px-2">Proveedor de IA</div>
                <button
                  onClick={() => { setProvider('arkaios'); setShowSettings(false); }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${provider === 'arkaios' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                >
                  Arkaios (Recomendado)
                </button>
                <button
                  onClick={() => { setProvider('puter'); setShowSettings(false); }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${provider === 'puter' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                >
                  Sistema Base
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-lg backdrop-blur-sm ${msg.role === 'user'
                ? 'bg-blue-600/90 text-white rounded-br-sm'
                : 'bg-slate-800/90 text-slate-200 rounded-bl-sm border border-slate-700'
                }`}>
                {msg.image && (
                  <img src={msg.image} alt="Attachment" className="max-w-full rounded-lg mb-2 border border-slate-600" />
                )}
                {msg.video && (
                  <video controls src={msg.video} className="max-w-full rounded-lg mb-2 border border-slate-600" />
                )}
                <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 rounded-2xl px-5 py-3.5 rounded-bl-sm border border-slate-700">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-800 bg-slate-900">
          <div className="max-w-4xl mx-auto relative">
            {attachment && (
              <div className="absolute -top-12 left-0 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 flex items-center gap-2 shadow-lg animate-fade-in">
                <span className="text-xs text-blue-400 font-medium">📎 {attachment.name}</span>
                <button onClick={handleRemoveAttachment} className="text-slate-500 hover:text-red-400">×</button>
              </div>
            )}
            <div className="flex items-end gap-2 bg-slate-800 rounded-xl border border-slate-700 p-2 shadow-inner">
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,application/pdf" />
              <button onClick={() => fileInputRef.current?.click()} className={`p-3 rounded-lg transition-colors ${attachment ? 'text-blue-400' : 'text-slate-400 hover:bg-slate-700'}`} title="Adjuntar imagen">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                </svg>
              </button>
              <button onClick={handleRemoveText} disabled={!attachment || isLoading} className={`p-3 rounded-lg transition-all duration-300 ${attachment ? 'text-pink-400 hover:bg-pink-500/20 hover:text-pink-300' : 'text-slate-600 cursor-not-allowed opacity-50'}`} title="Magic Eraser">
                <Eraser className="w-5 h-5" />
              </button>
              <button onClick={() => handleVeoGeneration()} disabled={!attachment || isLoading} className={`p-3 rounded-lg transition-all duration-300 ${attachment ? 'text-purple-400 hover:bg-purple-500/20 hover:text-purple-300' : 'text-slate-600 cursor-not-allowed opacity-50'}`} title="Animar Imagen">
                <Film className="w-5 h-5" />
              </button>
              <button onClick={() => setIsLiveConnected(!isLiveConnected)} className={`p-3 rounded-lg transition-all duration-300 ${isLiveConnected ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`} title={isLiveConnected ? "Terminar Llamada" : "Iniciar Llamada en Vivo"}>
                <Radio className="w-5 h-5" />
              </button>
              <button onClick={handleVoiceInput} className={`p-3 rounded-lg transition-all duration-300 ${avatarState === 'listening' && !isLiveConnected ? 'bg-blue-500 text-white animate-pulse' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`} title="Dictar">
                <Mic className="w-5 h-5" />
              </button>
              <textarea value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} placeholder="Escribe o habla con Reze..." className="w-full bg-transparent text-white placeholder-slate-500 focus:outline-none resize-none py-3 text-sm" rows={1} />
              <button onClick={handleSendMessage} disabled={(!inputValue.trim() && !attachment) || isLoading} className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 transition-all shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A2.21 2.21 0 005.986 10a2.21 2.21 0 00-2.293 1.836l-1.414 4.925a.75.75 0 00.826.95 28.89 28.89 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="fixed bottom-24 right-6 z-50">
        <button onClick={() => setShowGrok(true)} className="bg-purple-700 hover:bg-purple-900 text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 flex items-center gap-2" title="Grok Raw Mode">
          <Zap className="w-6 h-6" />
          <span className="font-bold hidden md:inline">Grok</span>
        </button>
      </div>
      {showGrok && (
        <GrokModal onClose={() => setShowGrok(false)} onSendToVeo={(grokPrompt) => { setShowGrok(false); handleVeoGeneration(grokPrompt); }} />
      )}
    </div>
  );
};