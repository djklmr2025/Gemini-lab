import React, { useState, useRef, useEffect } from 'react';

// ============================================================
// ARKAIOS EduAgent - Icono flotante + panel de chat
// Recibe peticiones educativas en lenguaje natural y genera
// plantillas con imágenes automáticamente
// ============================================================

interface EduMessage {
  role: 'user' | 'agent';
  text: string;
  templateUrl?: string;
  pdfUrl?: string;
  templateLabel?: string;
  mode?: string;
  images?: { url: string; alt: string }[];
  grid?: string;
  topic?: string;
}

const SUGGESTIONS = [
  'Necesito 9 imágenes de dinosaurios en cuadrícula 3x3',
  'Crea una plantilla con 12 fotos de animales del océano',
  'Quiero 16 imágenes de figuras geométricas para primaria',
  'Dame 4 imágenes grandes de planetas del sistema solar',
  'Plantilla con 25 frutas tropicales para preescolar',
];

export const EduAgent: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<EduMessage[]>([
    {
      role: 'agent',
      text: '🎓 Soy ARKAIOS Edu. Dime qué plantilla educativa necesitas y yo la armo: tema, cantidad de imágenes, tamaño... ¡tú pides, yo surto!'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 200);
  }, [isOpen]);

  const sendRequest = async (requestText: string) => {
    if (!requestText.trim() || isLoading) return;

    const userMsg: EduMessage = { role: 'user', text: requestText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Mensaje de "pensando"
    const thinkingMsg: EduMessage = {
      role: 'agent',
      text: '⚙️ Analizando tu petición... buscando imágenes... preparando plantilla...'
    };
    setMessages(prev => [...prev, thinkingMsg]);

    try {
      const response = await fetch('/api/edu-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request: requestText })
      });

      const data = await response.json();

      if (!data.ok) throw new Error(data.error || 'Error desconocido');

      // Reemplazar mensaje de "pensando" con resultado
      const resultMsg: EduMessage = {
        role: 'agent',
        text: data.mode === 'prefill'
          ? `✅ **Plantilla prellenada!** Preparé material editable para "${data.topic}".\n\n🧩 Plantilla: ${data.templateLabel || data.templateFile}\n\n💡 ${data.reasoning}`
          : `✅ **Plantilla lista!** Encontré ${data.imageCount} imágenes de "${data.topic}" en configuración ${data.grid}.\n\n🧩 Plantilla: ${data.templateLabel || data.templateFile}\n\n💡 ${data.reasoning}`,
        templateUrl: data.templateUrl,
        pdfUrl: data.pdfUrl,
        templateLabel: data.templateLabel,
        mode: data.mode,
        images: data.images?.slice(0, 4),
        grid: data.grid,
        topic: data.topic
      };

      setMessages(prev => [...prev.slice(0, -1), resultMsg]);

    } catch (error: any) {
      const errMsg: EduMessage = {
        role: 'agent',
        text: `❌ Error: ${error.message}. Intenta de nuevo con otra descripción.`
      };
      setMessages(prev => [...prev.slice(0, -1), errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendRequest(input);
    }
  };

  return (
    <>
      {/* ====== BOTÓN FLOTANTE ====== */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-2xl transition-all duration-300 hover:scale-110"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: isOpen
            ? '0 0 0 4px rgba(102,126,234,0.4), 0 8px 32px rgba(118,75,162,0.6)'
            : '0 8px 32px rgba(118,75,162,0.5)'
        }}
        title="ARKAIOS Edu - Generador de Plantillas"
      >
        {isOpen ? '✕' : '🎓'}
      </button>

      {/* ====== PANEL DE CHAT ====== */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          style={{
            height: '520px',
            background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)',
            border: '1px solid rgba(102,126,234,0.3)'
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center gap-3"
            style={{ background: 'linear-gradient(90deg, #667eea, #764ba2)' }}
          >
            <span className="text-2xl">🎓</span>
            <div>
              <div className="font-bold text-white text-sm">ARKAIOS Edu</div>
              <div className="text-xs text-purple-200">Generador de Plantillas Inteligente</div>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-xs text-green-300">Activo</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3" style={{ scrollbarWidth: 'thin' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[85%] rounded-xl px-3 py-2 text-sm"
                  style={{
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, #667eea, #764ba2)'
                      : 'rgba(255,255,255,0.07)',
                    color: 'white',
                    border: msg.role === 'agent' ? '1px solid rgba(102,126,234,0.2)' : 'none'
                  }}
                >
                  {/* Texto del mensaje */}
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                  {/* Preview de imágenes */}
                  {msg.images && msg.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-1 mt-2">
                      {msg.images.map((img, j) => (
                        <img
                          key={j}
                          src={img.url}
                          alt={img.alt}
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}

                  {/* Botón abrir plantilla */}
                  {msg.templateUrl && (
                    <div className="mt-3 flex flex-col gap-2">
                      <button
                        onClick={() => window.open(msg.templateUrl, '_blank')}
                        className="w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all hover:scale-105"
                        style={{
                          background: 'linear-gradient(90deg, #10b981, #059669)',
                          color: 'white'
                        }}
                      >
                        {msg.mode === 'prefill' ? '📝 Abrir Plantilla Prellenada' : '📄 Abrir Plantilla'}
                      </button>

                      {msg.pdfUrl && (
                        <button
                          onClick={() => window.open(msg.pdfUrl, '_blank')}
                          className="w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all hover:scale-105"
                          style={{
                            background: 'linear-gradient(90deg, #2563eb, #1d4ed8)',
                            color: 'white'
                          }}
                        >
                          📄 Abrir PDF Final
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Sugerencias iniciales */}
            {messages.length === 1 && (
              <div className="flex flex-col gap-1 mt-1">
                <p className="text-xs text-slate-500 px-1">💡 Ejemplos:</p>
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendRequest(s)}
                    className="text-left text-xs px-3 py-2 rounded-lg transition-all hover:scale-[1.02]"
                    style={{
                      background: 'rgba(102,126,234,0.1)',
                      border: '1px solid rgba(102,126,234,0.2)',
                      color: '#a5b4fc'
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            className="p-3 flex gap-2"
            style={{ borderTop: '1px solid rgba(102,126,234,0.2)' }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ej: 12 imágenes de volcanes para 6° grado..."
              disabled={isLoading}
              className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(102,126,234,0.3)',
                color: 'white'
              }}
            />
            <button
              onClick={() => sendRequest(input)}
              disabled={isLoading || !input.trim()}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-lg">🚀</span>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default EduAgent;
