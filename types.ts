export enum AppMode {
  Chat = 'chat',
  Image = 'image',
  Video = 'video',
  Live = 'live'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string;
  timestamp: number;
}

export interface VideoState {
  isGenerating: boolean;
  videoUri: string | null;
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