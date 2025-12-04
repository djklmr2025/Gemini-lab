import React, { useState } from 'react';
import { Image, X, Upload, Zap, Sparkles, Globe } from 'lucide-react';

export const ImageGen: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [provider, setProvider] = useState<'puter' | 'a1art' | 'arkaios' | 'bfl'>('arkaios');

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => setSelectedImage(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      if (provider === 'arkaios') {
        // Arkaios Flux Generation
        const baseUrl = import.meta.env.VITE_ARKAIOS_BASE_URL;
        const apiKey = import.meta.env.VITE_PROXY_API_KEY;

        if (!baseUrl || !apiKey) throw new Error("Configuración de Arkaios incompleta.");

        const res = await fetch(`${baseUrl}/v1/images/generations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'flux-pro-1.1', // Default to Flux Pro via Arkaios
            prompt: prompt,
            n: 1,
            size: '1024x1024'
          })
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Arkaios Error: ${errText}`);
        }

        const data = await res.json();
        const imageUrl = data.data?.[0]?.url;
        if (imageUrl) {
          setGeneratedImage(imageUrl);
        } else {
          throw new Error("No image returned from Arkaios.");
        }

      } else if (provider === 'bfl') {
        // Direct BFL Generation (Requires VITE_BFL_API_KEY)
        const apiKey = import.meta.env.VITE_BFL_API_KEY;
        if (!apiKey) throw new Error("VITE_BFL_API_KEY no configurada.");

        // BFL API call (simplified)
        const res = await fetch('https://api.bfl.ai/v1/flux-pro-1.1', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-key': apiKey
          },
          body: JSON.stringify({
            prompt: prompt,
            width: 1024,
            height: 1024
          })
        });

        if (!res.ok) throw new Error("BFL API Error");
        const data = await res.json();
        // BFL is async, this is a simplification. Real implementation needs polling.
        // For now, we'll assume the user might not have this key set up perfectly and this is a placeholder for the "direct" option.
        throw new Error("BFL Direct requires async polling implementation. Use Arkaios provider instead.");

      } else if (provider === 'a1art') {
        // A1.art Generation via Proxy
        const res = await fetch('/api/a1art', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: prompt,
            image: selectedImage,
            model: 'default'
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error generating with A1.art');
        const imageUrl = data.image_url || data.output_url || data.image || data[0];
        if (imageUrl) setGeneratedImage(imageUrl);
        else throw new Error('No image URL in response.');

      } else {
        // Puter Generation
        if (window.puter && window.puter.ai && window.puter.ai.txt2img) {
          const imageElement = await window.puter.ai.txt2img(prompt);
          if (imageElement && imageElement.src) {
            setGeneratedImage(imageElement.src);
          } else if (imageElement instanceof HTMLImageElement) {
            setGeneratedImage(imageElement.src);
          } else {
            throw new Error("Puter did not return a valid image source.");
          }
        } else {
          throw new Error("System not initialized or txt2img not available.");
        }
      }

    } catch (err: any) {
      console.error("Image gen error:", err);
      setError(err.message || "Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 p-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto w-full space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Creador de Imágenes</h2>
            <p className="text-slate-400">
              Crea visuales impresionantes con el poder de Arkaios y Flux.
            </p>
          </div>

          {/* Provider Selector */}
          <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 overflow-x-auto">
            <button
              onClick={() => setProvider('arkaios')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${provider === 'arkaios' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <Sparkles size={14} />
              Flux (Arkaios)
            </button>
            <button
              onClick={() => setProvider('puter')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${provider === 'puter' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Estándar
            </button>
            <button
              onClick={() => setProvider('a1art')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${provider === 'a1art' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <Zap size={14} />
              Sin Filtros
            </button>
            <button
              onClick={() => setProvider('bfl')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${provider === 'bfl' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <Globe size={14} />
              Flux Direct
            </button>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Prompt
              </label>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={provider === 'a1art' ? "Describe tu imagen sin censura..." : "Una ciudad futurista con autos voladores..."}
                  className="w-full bg-slate-900 text-white placeholder-slate-600 rounded-xl p-4 border border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none h-32"
                />

                {selectedImage && (
                  <div className="absolute bottom-4 left-4 group">
                    <div className="relative">
                      <img
                        src={selectedImage}
                        alt="Reference"
                        className="h-16 w-16 object-cover rounded-lg border-2 border-blue-500 shadow-lg"
                      />
                      <button
                        onClick={clearImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove image"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg cursor-pointer transition-colors group">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <Upload size={18} className="group-hover:text-blue-400 transition-colors" />
                  <span className="text-sm font-medium">Adjuntar Imagen</span>
                </label>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className={`px-6 py-3 rounded-lg font-medium transition-all transform active:scale-95 flex items-center gap-2 ${isGenerating || !prompt.trim()
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : provider === 'a1art'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg'
                  }`}
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Generando...</span>
                  </>
                ) : (
                  <>
                    <Image size={20} />
                    <span>Generar Imagen</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {generatedImage && (
          <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-xl animate-fade-in">
            <div className="aspect-square relative rounded-xl overflow-hidden bg-slate-900">
              <img
                src={generatedImage}
                alt="Generated"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="mt-4 flex justify-end">
              <a
                href={generatedImage}
                download={`generated-image-${Date.now()}.png`}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
              >
                Descargar
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};