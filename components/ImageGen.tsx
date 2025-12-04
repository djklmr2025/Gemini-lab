import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Image, X, Upload, Zap } from 'lucide-react';

export const ImageGen: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useHighQuality, setUseHighQuality] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [provider, setProvider] = useState<'gemini' | 'a1art'>('gemini');

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
      if (provider === 'a1art') {
        // A1.art Generation via Proxy
        const res = await fetch('/api/a1art', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: prompt,
            image: selectedImage, // Sending base64 if present
            model: 'default' // Placeholder, API might ignore or require specific model
          })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || data.message || 'Error generating with A1.art');
        }

        // Assuming A1.art returns { image_url: "..." } or { image: "base64..." }
        // We'll need to adjust based on actual response. 
        // Common pattern: data.output_url or data.image
        const imageUrl = data.image_url || data.output_url || data.image || data[0];

        if (imageUrl) {
          setGeneratedImage(imageUrl);
        } else {
          console.error("A1.art unexpected response:", data);
          throw new Error('No image URL in response. Data: ' + JSON.stringify(data));
        }

      } else {
        // Gemini Generation (Existing Logic)
        const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GOOGLE_API_KEY });

        const generateRequest = async (model: string) => {
          const parts: any[] = [{ text: prompt }];

          if (selectedImage) {
            const base64Data = selectedImage.split(',')[1];
            const mimeType = selectedImage.split(';')[0].split(':')[1];
            parts.push({
              inlineData: { data: base64Data, mimeType: mimeType }
            });
          }

          return await ai.models.generateContent({
            model: model,
            contents: { parts: parts },
            config: {
              imageConfig: {
                aspectRatio: "1:1",
                imageSize: model.includes('pro') ? "1K" : undefined
              }
            }
          });
        };

        let response;
        let usedModel = useHighQuality ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

        try {
          response = await generateRequest(usedModel);
        } catch (firstError: any) {
          if (useHighQuality && (firstError.message?.includes('429') || firstError.message?.includes('Quota') || firstError.message?.includes('RESOURCE_EXHAUSTED'))) {
            console.warn("Pro model quota exceeded, falling back to Flash...");
            setError("Pro quota exceeded. Falling back to Flash model...");
            usedModel = 'gemini-2.5-flash-image';
            response = await generateRequest(usedModel);
          } else {
            throw firstError;
          }
        }

        let foundImage = false;
        const responseParts = response.candidates?.[0]?.content?.parts;
        if (responseParts) {
          for (const part of responseParts) {
            if (part.inlineData) {
              const base64Data = part.inlineData.data;
              const mimeType = part.inlineData.mimeType || 'image/png';
              setGeneratedImage(`data:${mimeType};base64,${base64Data}`);
              foundImage = true;
              break;
            }
          }
        }

        if (!foundImage) {
          setError("The model did not generate an image. Try refining your prompt.");
        } else if (usedModel !== (useHighQuality ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image')) {
          setError("Generated using Flash model (Pro quota exceeded).");
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
            <h2 className="text-3xl font-bold text-white mb-2">Imagine</h2>
            <p className="text-slate-400">
              Create stunning visuals from text descriptions.
            </p>
          </div>

          {/* Provider Selector */}
          <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setProvider('gemini')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${provider === 'gemini' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Gemini
            </button>
            <button
              onClick={() => setProvider('a1art')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${provider === 'a1art' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <Zap size={14} />
              A1.art (Uncensored)
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
                  placeholder={provider === 'a1art' ? "Describe your uncensored image..." : "A futuristic city with flying cars, neon lights, digital art style..."}
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
                  <span className="text-sm font-medium">Attach Image</span>
                </label>

                {provider === 'gemini' && (
                  <label className="flex items-center space-x-2 cursor-pointer text-slate-300 select-none">
                    <input
                      type="checkbox"
                      checked={useHighQuality}
                      onChange={(e) => setUseHighQuality(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 bg-slate-900"
                    />
                    <span className="text-sm">High Quality (Pro)</span>
                  </label>
                )}
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
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Image size={20} />
                    <span>Generate Image</span>
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
                Download
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};