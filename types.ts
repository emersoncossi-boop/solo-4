
export enum AppView {
  HOME = 'HOME',
  MUSE = 'MUSE',
  SOUNDTRACK = 'SOUNDTRACK',
  MIRROR = 'MIRROR',
  RITUALS = 'RITUALS',
  SETTINGS = 'SETTINGS',
}

export enum MuseTheme {
  NEURAL = 'neural',
  OCEAN = 'ocean',
  FOREST = 'forest',
  AURORA = 'aurora',
}

export enum MuseStyle {
  NEURAL = 'neural',
  WATERCOLOR = 'watercolor',
  VAPORWAVE = 'vaporwave',
  ICE = 'ice',
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  imageUrl?: string;
}

export interface Ritual {
  id: string;
  title: string;
  description: string;
  duration: string;
  type: 'observation' | 'disconnection' | 'movement';
}

export interface AudioState {
  isPlaying: boolean;
  volume: number;
  mood: 'calm' | 'focus' | 'deep';
}

export interface EmotionAnalysis {
  label: string;
  color: string;
  intensity: number;
  valence: number; // -1.0 (Negative) to 1.0 (Positive)
}

export interface MuseEntry {
  id: string;
  timestamp: number;
  text: string;
  emotion: EmotionAnalysis;
  imageUrl: string | null;
  visualPrompt?: string | null;
  theme?: MuseTheme;
  style?: MuseStyle;
}
