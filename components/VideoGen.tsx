import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Film, Video, Zap } from 'lucide-react';

export const VideoGen: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<'veo' | 'arkaios' | 'fal'>('arkaios');
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    const key = import.meta.env.VITE_GOOGLE_API_KEY;
    if (key) {
      setHasApiKey(true);
    }
  };

  const handleSelectKey = () => {
    alert("Por favor configura VITE_GOOGLE_API_KEY en tus variables de entorno (.env o Vercel/Render).");
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setStatus('Iniciando generación...');
    setError(null);
    setVideoUri(null);

    try {
      if (provider === 'arkaios') {
        // Arkaios Video Generation
        const baseUrl = import.meta.env.VITE_ARKAIOS_BASE_URL;
        const apiKey = import.meta.env.VITE_PROXY_API_KEY;

        if (!baseUrl || !apiKey) throw new Error("Configuración de Arkaios incompleta.");

        setStatus('Enviando solicitud a Arkaios...');
        const res = await fetch(`${baseUrl}/v1/videos/generations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'minimax-video', // Assuming Minimax via Arkaios
            prompt: prompt,
          })
        });

        if (!res.ok) {
          // Fallback to chat completion if video endpoint doesn't exist
          setStatus('Intentando método alternativo...');
          // ... implementation omitted for brevity, just throw error for now
          const errText = await res.text();
          throw new Error(`Arkaios Error: ${errText}`);
        }

        const data = await res.json();
        const videoUrl = data.data?.[0]?.url || data.video?.url;
        if (videoUrl) {
          setVideoUri(videoUrl);
          setStatus('¡Completado!');
        } else {
          throw new Error("No video URL returned from Arkaios.");
        }

      } else if (provider === 'fal') {
        // Fal Video Generation (Placeholder)
        throw new Error("Fal Video requires VITE_FAL_API_KEY and client implementation.");

      } else {
        // Google Veo Generation
        if (!hasApiKey) {
          handleSelectKey();
          return;
        }

        const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GOOGLE_API_KEY });

        setStatus('Enviando solicitud...');
        let operation = await ai.models.generateVideos({
          model: 'veo-3.1-fast-generate-preview',
          prompt: prompt,
          config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9'
          }
        });

        setStatus('Procesando... Esto puede tomar un minuto.');

        while (!operation.done) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          setStatus('Aún procesando...');
          operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        if (operation.error) {
          throw new Error(operation.error.message || 'Video generation failed');
        }

        const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (uri) {
          const authenticatedUri = `${uri}&key=${import.meta.env.VITE_GOOGLE_API_KEY}`;
          setVideoUri(authenticatedUri);
          setStatus('¡Completado!');
        } else {
          throw new Error('No video URI returned');
        }
      }

    } catch (err: any) {
      console.error("Video gen error:", err);
      if (err.message && err.message.includes('Requested entity was not found')) {
        setError('Error de configuración. Por favor verifica tu configuración.');
      } else {
        setError(err.message || 'Fallo al generar video');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 p-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto w-full space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Creador de Videos</h2>
            <p className="text-slate-400">
              Genera videos de alta calidad a partir de texto.
            </p>
          </div>
          {/* Provider Selector */}
          <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setProvider('arkaios')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${provider === 'arkaios' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <Zap size={14} />
              Arkaios
            </button>
            <button
              onClick={() => setProvider('veo')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${provider === 'veo' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <Video size={14} />
              Veo (Google)
            </button>
            <button
              onClick={() => setProvider('fal')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${provider === 'fal' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <Film size={14} />
              Fal (Direct)
            </button>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Prompt de Video
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Una toma cinematográfica de una ciudad cyberpunk de noche..."
                className="w-full bg-slate-900 text-white placeholder-slate-600 rounded-xl p-4 border border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none h-32"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${isGenerating || !prompt.trim()
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg'
                  }`}
              >
                {isGenerating ? 'Generando Video...' : 'Generar Video'}
              </button>
            </div>
          </div>
        </div>

        {isGenerating && (
          <div className="p-8 text-center bg-slate-800/50 rounded-xl border border-slate-700 border-dashed animate-pulse">
            <p className="text-blue-400 font-medium">{status}</p>
            <p className="text-xs text-slate-500 mt-2">Esto usualmente toma 1-2 minutos.</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {videoUri && (
          <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-xl">
            <h3 className="text-lg font-medium text-white mb-4">Video Generado</h3>
            <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
              <video
                src={videoUri}
                controls
                autoPlay
                loop
                className="w-full h-full object-contain"
              />
            </div>
            <div className="mt-4 flex justify-end">
              <a
                href={videoUri}
                download={`veo-video-${Date.now()}.mp4`}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
              >
                Descargar MP4
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};