export enum Vibe {
  MYSTERIOUS = 'Mysterious',
  WHIMSICAL = 'Whimsical',
  HISTORICAL = 'Historical',
  FUTURISTIC = 'Futuristic',
  REFLECTIVE = 'Reflective',
  HORROR = 'Urban Legend',
  ACTION = 'High Octane'
}

export enum TimeOfDay {
  MORNING = 'Morning',
  AFTERNOON = 'Afternoon',
  EVENING = 'Evening',
  NIGHT = 'Night'
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface StoryResponse {
  text: string;
  groundingSources: GroundingSource[];
}

export interface AppState {
  coords: Coordinates | null;
  timeOfDay: TimeOfDay;
  selectedVibe: Vibe;
  isGenerating: boolean;
  storyText: string | null;
  audioUrl: string | null;
  groundingSources: GroundingSource[];
  error: string | null;
  statusMessage: string;
}
