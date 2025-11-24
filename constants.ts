import { Vibe } from "./types";

export const VIBE_DESCRIPTIONS: Record<Vibe, string> = {
  [Vibe.MYSTERIOUS]: "Secrets hidden in the shadows...",
  [Vibe.WHIMSICAL]: "A touch of magic and wonder...",
  [Vibe.HISTORICAL]: "Echoes of the past resonating now...",
  [Vibe.FUTURISTIC]: "Visions of what is yet to come...",
  [Vibe.REFLECTIVE]: "A moment of inner peace and thought...",
  [Vibe.HORROR]: "Chilling tales from the dark side...",
  [Vibe.ACTION]: "Fast-paced energy and excitement..."
};

export const DEFAULT_COORDS = {
  latitude: 37.7749, // San Francisco fallback
  longitude: -122.4194
};
