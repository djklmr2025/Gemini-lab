import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';

export const ImageGen: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useHighQuality, setUseHighQuality] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GOOGLE_API_KEY });
      const modelName = useHighQuality ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

      const response = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [{ text: prompt }]
        },
        // Config to ensure we get an image if possible
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: useHighQuality ? "1K" : undefined // imageSize only for Pro
          }
        }
      });

      // Find image part
      let foundImage = false;
      const parts = response.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
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
        // Fallback if model decided to chat instead
        setError("The model did not generate an image. Try refining your prompt.");
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
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Imagine</h2>
          <p className="text-slate-400">
            Create stunning visuals from text descriptions using Gemini's image generation capabilities.
          </p>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A futuristic city with flying cars, neon lights, digital art style..."
                className="w-full bg-slate-900 text-white placeholder-slate-600 rounded-xl p-4 border border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none h-32"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={useHighQuality}
                  onChange={(e) => setUseHighQuality(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 bg-slate-900"
                />
                <span>Use High Quality (Gemini 3 Pro)</span>
              </label>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className={`px-6 py-3 rounded-lg font-medium transition-all transform active:scale-95 ${isGenerating || !prompt.trim()
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg hover:shadow-blue-500/25'
                  }`}
              >
                {isGenerating ? 'Generating...' : 'Generate Image'}
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
                download={`gemini-image-${Date.now()}.png`}
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