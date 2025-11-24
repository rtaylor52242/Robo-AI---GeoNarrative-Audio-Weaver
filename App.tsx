import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, Play, Pause, RefreshCw, AlertTriangle, Navigation, ExternalLink } from 'lucide-react';
import { AppState, Coordinates, TimeOfDay, Vibe } from './types';
import { decodeAndPlay, generateSpeech, generateStoryText } from './services/gemini';
import VibeSelector from './components/VibeSelector';
import Visualizer from './components/Visualizer';

const App: React.FC = () => {
  // --- State ---
  const [state, setState] = useState<AppState>({
    coords: null,
    timeOfDay: TimeOfDay.MORNING,
    selectedVibe: Vibe.MYSTERIOUS,
    isGenerating: false,
    storyText: null,
    audioUrl: null,
    groundingSources: [],
    error: null,
    statusMessage: "Initializing Systems...",
  });

  const [isPlaying, setIsPlaying] = useState(false);
  
  // --- Audio Refs ---
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

  // --- Effects ---

  // 1. Determine Time of Day
  useEffect(() => {
    const hour = new Date().getHours();
    let tod = TimeOfDay.NIGHT;
    if (hour >= 5 && hour < 12) tod = TimeOfDay.MORNING;
    else if (hour >= 12 && hour < 17) tod = TimeOfDay.AFTERNOON;
    else if (hour >= 17 && hour < 21) tod = TimeOfDay.EVENING;
    
    setState(prev => ({ ...prev, timeOfDay: tod }));
  }, []);

  // 2. Get Geolocation
  useEffect(() => {
    setState(prev => ({ ...prev, statusMessage: "Acquiring Satellites..." }));
    
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: "Geolocation module not found.", statusMessage: "System Error" }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState(prev => ({
          ...prev,
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          },
          statusMessage: "Ready to Weave",
          error: null
        }));
      },
      (error) => {
        console.error(error);
        setState(prev => ({ 
          ...prev, 
          error: "Access to location denied. Please enable GPS.", 
          statusMessage: "Location Signal Lost" 
        }));
      },
      { enableHighAccuracy: true }
    );
  }, []);

  // --- Audio Logic ---

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const playAudio = useCallback(() => {
    initAudioContext();
    const ctx = audioContextRef.current;
    const buffer = audioBufferRef.current;

    if (!ctx || !buffer) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    
    // Start logic handling pause/resume
    const offset = pausedAtRef.current % buffer.duration;
    source.start(0, offset);
    startTimeRef.current = ctx.currentTime - offset;
    
    audioSourceRef.current = source;
    setIsPlaying(true);

    source.onended = () => {
        // Check if it actually finished or was stopped
        // Simple check: if we manually stopped, isPlaying might be false already
        // But if it ends naturally:
        if (ctx.currentTime - startTimeRef.current >= buffer.duration) {
            setIsPlaying(false);
            pausedAtRef.current = 0;
        }
    };
  }, []);

  const pauseAudio = useCallback(() => {
    if (audioSourceRef.current && audioContextRef.current) {
        audioSourceRef.current.stop();
        pausedAtRef.current = audioContextRef.current.currentTime - startTimeRef.current;
        audioSourceRef.current = null;
        setIsPlaying(false);
    }
  }, []);

  const stopAudio = useCallback(() => {
      if (audioSourceRef.current) {
          audioSourceRef.current.stop();
          audioSourceRef.current = null;
      }
      pausedAtRef.current = 0;
      setIsPlaying(false);
  }, []);

  // --- Core Generation Logic ---

  const handleGenerate = async () => {
    if (!state.coords) return;

    // Reset Audio
    stopAudio();
    audioBufferRef.current = null;

    setState(prev => ({ ...prev, isGenerating: true, error: null, storyText: null, groundingSources: [] }));

    try {
      // Step 1: Generate Text
      setState(prev => ({ ...prev, statusMessage: "Scanning Environment..." }));
      const storyResponse = await generateStoryText(state.coords, state.timeOfDay, state.selectedVibe);
      
      setState(prev => ({ 
        ...prev, 
        storyText: storyResponse.text,
        groundingSources: storyResponse.groundingSources,
        statusMessage: "Synthesizing Voice..." 
      }));

      // Step 2: Generate Audio
      const base64Audio = await generateSpeech(storyResponse.text);
      
      // Step 3: Decode Audio
      initAudioContext();
      if (audioContextRef.current) {
         const buffer = await decodeAndPlay(base64Audio, audioContextRef.current);
         audioBufferRef.current = buffer;
         setState(prev => ({ ...prev, isGenerating: false, statusMessage: "Narrative Ready" }));
         playAudio(); // Auto-play
      } else {
         throw new Error("Audio system failure");
      }

    } catch (err) {
      console.error("Generation Error:", err);
      let errorMessage = "Unknown system failure";
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object') {
        try {
            // Attempt to stringify if it's a plain object (rare, but handles [object Object] cases)
            errorMessage = JSON.stringify(err);
        } catch {
            errorMessage = "An unspecified error occurred.";
        }
      }

      setState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        error: errorMessage,
        statusMessage: "Process Aborted"
      }));
    }
  };

  // --- Render ---

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-900/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      </div>

      <main className="w-full max-w-lg z-10 relative">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 neon-text mb-2">
            ROBO AI
          </h1>
          <p className="text-slate-400 text-sm tracking-widest uppercase">
            GeoNarrative Audio Weaver
          </p>
        </div>

        {/* Main Card */}
        <div className="glass-panel rounded-2xl p-6 shadow-2xl neon-glow">
          
          {/* Status Bar */}
          <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
            <div className="flex items-center space-x-2 text-cyan-300">
              <Navigation size={16} className={state.coords ? "animate-pulse" : ""} />
              <span className="text-xs font-mono">
                {state.coords 
                  ? `${state.coords.latitude.toFixed(4)}, ${state.coords.longitude.toFixed(4)}` 
                  : "NO SIGNAL"}
              </span>
            </div>
            <div className="text-xs font-mono text-purple-300">
              TIME: {state.timeOfDay.toUpperCase()}
            </div>
          </div>

          {/* Error Display */}
          {state.error && (
             <div className="bg-red-900/20 border border-red-500/50 rounded p-3 mb-4 flex items-center gap-2 text-red-200 text-sm break-all">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{state.error}</span>
             </div>
          )}

          {/* Vibe Selection */}
          <div className="mb-6">
            <VibeSelector 
              selectedVibe={state.selectedVibe} 
              onSelect={(v) => setState(s => ({ ...s, selectedVibe: v }))}
              disabled={state.isGenerating}
            />
          </div>

          {/* Action Area */}
          <div className="flex flex-col items-center space-y-6">
            
            {/* Main Button */}
            {!audioBufferRef.current || state.isGenerating ? (
              <button
                onClick={handleGenerate}
                disabled={state.isGenerating || !state.coords}
                className={`
                  group relative w-full h-16 rounded-xl overflow-hidden font-bold tracking-widest text-lg
                  transition-all duration-300 flex items-center justify-center
                  ${state.isGenerating 
                    ? 'cursor-wait' 
                    : 'hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]'
                  }
                `}
              >
                <div className={`absolute inset-0 bg-gradient-to-r from-cyan-600 to-purple-600 transition-transform duration-500 ${state.isGenerating ? 'animate-pulse' : 'group-hover:scale-105'}`}></div>
                <div className="relative z-10 flex items-center space-x-2 text-white">
                  {state.isGenerating ? (
                    <>
                       <RefreshCw className="animate-spin" />
                       <span>{state.statusMessage}</span>
                    </>
                  ) : (
                    <>
                       <MapPin />
                       <span>GENERATE NARRATIVE</span>
                    </>
                  )}
                </div>
              </button>
            ) : (
              /* Playback Controls */
              <div className="w-full flex flex-col items-center animate-fade-in">
                <Visualizer isPlaying={isPlaying} />
                
                <div className="flex items-center justify-center gap-6 mt-4 mb-2">
                   <button 
                     onClick={handleGenerate}
                     className="p-3 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                     title="Regenerate"
                   >
                      <RefreshCw size={20} />
                   </button>
                   
                   <button 
                    onClick={isPlaying ? pauseAudio : playAudio}
                    className="p-6 rounded-full bg-cyan-500 text-black shadow-lg shadow-cyan-500/40 hover:scale-105 transition-transform"
                   >
                     {isPlaying ? <Pause size={32} fill="black" /> : <Play size={32} fill="black" className="ml-1"/>}
                   </button>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-2">AUDIO STREAM ACTIVE</p>
              </div>
            )}
          </div>
        </div>

        {/* Story Text / Transcript */}
        {state.storyText && !state.isGenerating && (
          <div className="mt-6 p-6 glass-panel rounded-2xl border-t border-purple-500/30 animate-slide-up">
            <h3 className="text-purple-300 font-bold text-sm mb-3 uppercase tracking-wider">Transcript</h3>
            <p className="text-slate-300 leading-relaxed font-light text-sm md:text-base">
              {state.storyText}
            </p>
            
            {/* Grounding / Maps Links */}
            {state.groundingSources.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-800">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Detected In Proximity</h4>
                <div className="flex flex-wrap gap-2">
                  {state.groundingSources.map((source, idx) => (
                    <a 
                      key={idx} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-800 text-xs text-cyan-400 hover:bg-slate-700 transition-colors"
                    >
                      <MapPin size={10} />
                      {source.title}
                      <ExternalLink size={10} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
};

export default App;
