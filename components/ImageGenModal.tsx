import React, { useState } from 'react';
import { X, Image as ImageIcon, Sparkles, ShieldCheck } from 'lucide-react';
import { generatePerchanceImage } from '../utils/perchanceGenerator';

interface ImageGenModalProps {
    onClose: () => void;
    onImageGenerated: (imageUrl: string, prompt: string) => void;
}

const ImageGenModal: React.FC<ImageGenModalProps> = ({ onClose, onImageGenerated }) => {
    const [prompt, setPrompt] = useState('');
    const [engine, setEngine] = useState<'perchance' | 'puter'>('perchance');
    const [resolution, setResolution] = useState<'768x768' | '512x768' | '768x512'>('768x768');
    const [artStyle, setArtStyle] = useState<string>('Painted Anime');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim() || isGenerating) return;

        setIsGenerating(true);
        setError(null);

        try {
            if (engine === 'perchance') {
                const dataUrl = await generatePerchanceImage(prompt, {
                    resolution,
                    artStyle,
                    negativePrompt: 'blurry, low quality, distorted, bad anatomy, deformed, mutated, censored, mosaic, bar, watermark, text'
                });
                onImageGenerated(dataUrl, prompt);
                onClose();
            } else {
                if (window.puter && window.puter.ai && window.puter.ai.txt2img) {
                    const imageElement = await window.puter.ai.txt2img(prompt);
                    let imageUrl = '';

                    if (imageElement && imageElement.src) {
                        imageUrl = imageElement.src;
                    } else if (imageElement instanceof HTMLImageElement) {
                        imageUrl = imageElement.src;
                    } else {
                        throw new Error("Puter no devolvió una imagen válida.");
                    }

                    onImageGenerated(imageUrl, prompt);
                    onClose();
                } else {
                    throw new Error("Sistema Puter no disponible, usando Perchance.");
                }
            }
        } catch (err: any) {
            console.error("Image gen error:", err);
            setError(err.message || "Error al generar imagen");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-slate-900 border border-blue-500/50 p-6 rounded-2xl max-w-lg w-full shadow-[0_0_50px_rgba(59,130,246,0.4)]">
                <div className="flex justify-between items-center mb-5">
                    <div className="flex items-center gap-2">
                        <ImageIcon className="w-6 h-6 text-blue-400" />
                        <h3 className="text-xl font-bold text-white">Generar Imagen con IA</h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Motor Switch */}
                <div className="flex gap-2 p-1 bg-slate-800/80 rounded-xl mb-4 border border-slate-700">
                    <button
                        type="button"
                        onClick={() => setEngine('perchance')}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            engine === 'perchance'
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        Motor Perchance.org (Sin Filtros)
                    </button>
                    <button
                        type="button"
                        onClick={() => setEngine('puter')}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                            engine === 'puter'
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        Puter AI
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe la imagen que quieres crear (Medicina, forense, arte, ciencia, etc.)..."
                            className="w-full bg-slate-800 text-white p-3.5 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none resize-none text-sm h-28"
                        />
                    </div>

                    {/* Selector de Tamaño */}
                    <div className="flex items-center justify-between bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60">
                        <span className="text-xs text-slate-400 font-medium">Formato / Proporción:</span>
                        <select
                            value={resolution}
                            onChange={(e) => setResolution(e.target.value as any)}
                            className="bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 focus:border-blue-500 focus:outline-none"
                        >
                            <option value="768x768">Cuadrado (768×768)</option>
                            <option value="512x768">Vertical (512×768)</option>
                            <option value="768x512">Horizontal (768×512)</option>
                        </select>
                    </div>

                    {/* Selector de Estilo Perchance */}
                    {engine === 'perchance' && (
                        <div className="flex items-center justify-between bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60">
                            <span className="text-xs text-slate-400 font-medium">Estilo Perchance:</span>
                            <select
                                value={artStyle}
                                onChange={(e) => setArtStyle(e.target.value)}
                                className="bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 focus:border-blue-500 focus:outline-none"
                            >
                                <option value="Painted Anime">🎨 Painted Anime (Pixiv / Kantoku / WLOP)</option>
                                <option value="Manga">📖 Manga B&W (Inoue / Otomo / Akamatsu)</option>
                                <option value="Casual Photo">📷 Casual Photo (DSLR Hiperrealista)</option>
                                <option value="Cinematic">🎬 Cinematic (Panavision / 8K HDR)</option>
                                <option value="Digital Painting">🖌️ Digital Painting (Artstation)</option>
                                <option value="Concept Art">⚔️ Concept Art</option>
                                <option value="Forensic / Medical">🔬 Forense / Médico (Sin Censura)</option>
                                <option value="none">Libre (Solo Prompt)</option>
                            </select>
                        </div>
                    )}

                    {engine === 'perchance' && (
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 p-2 rounded-lg">
                            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                            <span>Motor Perchance libre sin censura habilitado para tareas médicas, forenses y científicas.</span>
                        </div>
                    )}

                    {error && (
                        <div className="text-red-400 text-xs bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !prompt.trim()}
                        className="w-full py-3 rounded-xl font-bold text-white transition-all shadow-lg flex justify-center items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        {isGenerating ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Generando con Perchance...</span>
                            </>
                        ) : (
                            '✨ Crear Imagen con IA'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageGenModal;
