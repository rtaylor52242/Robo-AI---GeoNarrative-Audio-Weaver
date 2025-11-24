import { GoogleGenAI } from "@google/genai";
import { Coordinates, StoryResponse, TimeOfDay, Vibe } from "../types";

// Safe API Key access
const apiKey = (typeof process !== "undefined" && process.env?.API_KEY) || "";

const ai = new GoogleGenAI({ apiKey });

export const generateStoryText = async (
  coords: Coordinates,
  time: TimeOfDay,
  vibe: Vibe
): Promise<StoryResponse> => {
  try {
    const model = "gemini-2.5-flash";
    const prompt = `
      I am currently at Latitude: ${coords.latitude}, Longitude: ${coords.longitude}.
      The time of day is ${time}.
      
      Please write a very short, immersive audio narrative (approx 150-200 words) set in my current specific location.
      
      The tone/vibe should be: ${vibe}.
      
      Instructions:
      1. Use the Google Maps tool to identify interesting landmarks, parks, buildings, or historical facts immediately around me to weave into the story.
      2. Do not explicitly state coordinates. Make it feel natural, like an audio guide from another dimension.
      3. Focus on sensory details (sound, sight, feeling) matching the time of day and vibe.
      4. Keep it concise but evocative.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: coords.latitude,
              longitude: coords.longitude,
            },
          },
        },
      },
    });

    const text = response.text || "The signal is weak... I cannot weave a story right now.";
    
    // Extract grounding chunks (citations/maps links)
    const groundingSources: { title: string; uri: string }[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          groundingSources.push({ title: chunk.web.title, uri: chunk.web.uri });
        } else if (chunk.maps) {
           // Maps grounding usually provides URI and Title
           groundingSources.push({ 
             title: chunk.maps.title || "Map Location", 
             uri: chunk.maps.uri 
           });
        }
      });
    }

    return { text, groundingSources };
  } catch (error) {
    console.error("Error generating story:", error);
    throw new Error("Failed to weave the narrative thread. The connection to the neural net was interrupted.");
  }
};

export const generateSpeech = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        // Use string literal 'AUDIO' to avoid runtime issues with Modality enum imports
        responseModalities: ["AUDIO" as any], 
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Fenrir" }, // Deep, narrative voice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error("No audio data received from the ether.");
    }
    
    return base64Audio; 

  } catch (error) {
    console.error("Error generating speech:", error);
    throw new Error("Voice synthesis module failed.");
  }
};

// Helper to decode audio for playback (Client side helper)
export const decodeAndPlay = async (base64Data: string, audioContext: AudioContext): Promise<AudioBuffer> => {
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  try {
      // Try standard decode first (if headers exist)
      // Note: ArrayBuffer must be copied because decodeAudioData detaches it
      const bufferCopy = bytes.buffer.slice(0); 
      return await audioContext.decodeAudioData(bufferCopy);
  } catch (e) {
      // Fallback: Manual PCM decoding (assuming 24kHz, 1 channel based on docs)
      // This is a simplified PCM decoder for 16-bit little endian
      const sampleRate = 24000;
      const channels = 1;
      const dataInt16 = new Int16Array(bytes.buffer);
      const frameCount = dataInt16.length;
      const audioBuffer = audioContext.createBuffer(channels, frameCount, sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      
      for (let i = 0; i < frameCount; i++) {
          channelData[i] = dataInt16[i] / 32768.0;
      }
      return audioBuffer;
  }
};
