import React, { useState } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';

interface ImageGenModalProps {
    onClose: () => void;
    onImageGenerated: (imageUrl: string, prompt: string) => void;
}

const ImageGenModal: React.FC<ImageGenModalProps> = ({ onClose, onImageGenerated }) => {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim() || isGenerating) return;

        setIsGenerating(true);
        setError(null);

        try {
            if (window.puter && window.puter.ai && window.puter.ai.txt2img) {
                const imageElement = await window.puter.ai.txt2img(prompt);
                let imageUrl = '';

                if (imageElement && imageElement.src) {
                    imageUrl = imageElement.src;
                } else if (imageElement instanceof HTMLImageElement) {
                    imageUrl = imageElement.src;
                } else {
                    throw new Error("Puter did not return a valid image source.");
                }

                onImageGenerated(imageUrl, prompt);
                onClose();
            } else {
                throw new Error("System not initialized or txt2img not available.");
            }
        } catch (err: any) {
            console.error("Image gen error:", err);
            setError(err.message || "Failed to generate image");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-slate-900 border border-blue-500/50 p-6 rounded-2xl max-w-lg w-full shadow-[0_0_50px_rgba(59,130,246,0.4)]">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <ImageIcon className="w-6 h-6 text-blue-400" />
                        <h3 className="text-2xl font-bold text-white">Generar Imagen</h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-4">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe la imagen que quieres crear..."
                        className="w-full bg-slate-800 text-white p-4 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none resize-none text-lg h-32"
                    />

                    {error && (
                        <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !prompt.trim()}
                        className="w-full py-3 rounded-xl font-bold text-white transition-all shadow-lg flex justify-center items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? 'Generando...' : 'Crear Imagen'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageGenModal;
