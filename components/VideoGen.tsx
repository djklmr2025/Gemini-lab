import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';

export const VideoGen: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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

    if (!hasApiKey) {
      handleSelectKey();
      return;
    }

    setIsGenerating(true);
    setStatus('Iniciando generación...');
    setError(null);
    setVideoUri(null);

    try {
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

  if (!hasApiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-900 p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            🎥
          </div>
          <h2 className="text-2xl font-bold text-white">Creador de Videos</h2>
          <p className="text-slate-400">
            Para usar el modelo de video, debes tener la configuración correcta.
          </p>
          <button
            onClick={handleSelectKey}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20"
          >
            Verificar Configuración
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 p-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto w-full space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Creador de Videos</h2>
          <p className="text-slate-400">
            Genera videos de alta calidad a partir de texto.
          </p>
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