import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../utils/audioUtils';

export const Live: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isError, setIsError] = useState<string | null>(null);
  const [status, setStatus] = useState('Ready to connect');

  // Refs for audio handling to avoid re-renders
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const cleanup = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop all playing sources
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) { }
    });
    sourcesRef.current.clear();

    // Close session if possible - logic handled by simply abandoning the promise or creating new one
    // There is no explicit "close" on session promise result in the snippet provided, 
    // but the onclose callback handles the event.
    // In a real app we would call session.close() if available on the resolved object.
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => {
        if (session && typeof session.close === 'function') {
          session.close();
        }
      }).catch(() => { });
      sessionPromiseRef.current = null;
    }
  };

  useEffect(() => {
    return () => cleanup();
  }, []);

  const handleConnect = async () => {
    if (isConnected) {
      cleanup();
      setIsConnected(false);
      setStatus('Disconnected');
      return;
    }

    try {
      setIsError(null);
      setStatus('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      setStatus('Connecting to Gemini Live...');

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContextClass({ sampleRate: 24000 });
      audioContextRef.current = audioCtx;

      // Setup Input Audio Chain (Mic -> Model)
      const inputCtx = new AudioContextClass({ sampleRate: 16000 }); // Input needs specific rate usually? 
      // Actually standardizing on 16k for input pcm blob creation
      // We can use the same context if we resample, but separate is safer for demo.
      // Wait, standard practice: use one context or separate. Let's use separate input context for 16kHz capture if needed or downsample.
      // The snippet uses: inputAudioContext (16000) and outputAudioContext (24000).

      const inputAudioCtx = new AudioContextClass({ sampleRate: 16000 });
      const source = inputAudioCtx.createMediaStreamSource(stream);
      const scriptProcessor = inputAudioCtx.createScriptProcessor(4096, 1, 1);

      source.connect(scriptProcessor);
      scriptProcessor.connect(inputAudioCtx.destination);

      sourceNodeRef.current = source;
      processorRef.current = scriptProcessor;

      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GOOGLE_API_KEY });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('Live session opened');
            setStatus('Connected! Start talking.');
            setIsConnected(true);

            // Start streaming audio
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);

              if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then(session => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              }
            };
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              try {
                const ctx = audioContextRef.current;
                if (!ctx) return;

                // Ensure nextStartTime is at least current time
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);

                const audioBytes = base64ToUint8Array(base64Audio);
                const audioBuffer = await decodeAudioData(audioBytes, ctx, 24000, 1);

                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);

                source.addEventListener('ended', () => {
                  sourcesRef.current.delete(source);
                });

                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
              } catch (e) {
                console.error("Audio decode error", e);
              }
            }

            // Handle Interruptions
            if (message.serverContent?.interrupted) {
              console.log("Interrupted");
              sourcesRef.current.forEach(s => {
                try { s.stop(); } catch (e) { }
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            console.log('Session closed');
            setIsConnected(false);
            setStatus('Disconnected');
          },
          onerror: (err) => {
            console.error('Session error', err);
            setIsError('Connection error occurred.');
            setIsConnected(false);
            cleanup();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          }
        }
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (e: any) {
      console.error(e);
      setIsError(e.message || "Failed to initialize Live session");
      setStatus('Error');
      cleanup();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">

        {/* Visualizer Circle */}
        <div className="relative w-48 h-48 mx-auto">
          {isConnected && (
            <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
          )}
          <div className={`relative w-full h-full rounded-full border-4 flex items-center justify-center transition-all duration-500 ${isConnected ? 'border-blue-500 bg-slate-800' : 'border-slate-700 bg-slate-800/50'
            }`}>
            <div className={`text-6xl transition-transform duration-300 ${isConnected ? 'scale-110' : 'scale-100'}`}>
              {isConnected ? '🎙️' : '🤐'}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-white">Gemini Live</h2>
          <p className="text-slate-400 h-6">{status}</p>
        </div>

        {isError && (
          <div className="bg-red-500/10 text-red-400 p-4 rounded-lg text-sm border border-red-500/30">
            {isError}
          </div>
        )}

        <button
          onClick={handleConnect}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg ${isConnected
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
            }`}
        >
          {isConnected ? 'End Session' : 'Start Live Conversation'}
        </button>

        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          Experience real-time, low-latency voice conversation with Gemini 2.5 Flash Native Audio.
          <br />Requires microphone permission.
        </p>
      </div>
    </div>
  );
};