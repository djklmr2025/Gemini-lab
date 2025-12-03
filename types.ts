export enum AppMode {
  Chat = 'chat',
  Image = 'image',
  Video = 'video',
  Live = 'live'
  error: string | null;
progress: string;
}

export interface ImageState {
  isGenerating: boolean;
  images: string[];
  error: string | null;
}

// Augment window for AudioContext and Speech Recognition
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}