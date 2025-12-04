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
  timestamp: number;
  image?: string;
  video?: string;
}

export interface ImageState {
  isGenerating: boolean;
  images: string[];
  error: string | null;
}

// Augment window for AudioContext and Speech Recognition and Puter
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    puter: any;
  }
}