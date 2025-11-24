import React from 'react';
import { Vibe } from '../types';
import { VIBE_DESCRIPTIONS } from '../constants';

interface VibeSelectorProps {
  selectedVibe: Vibe;
  onSelect: (vibe: Vibe) => void;
  disabled: boolean;
}

const VibeSelector: React.FC<VibeSelectorProps> = ({ selectedVibe, onSelect, disabled }) => {
  return (
    <div className="w-full space-y-2">
      <label className="block text-cyan-400 text-sm font-bold tracking-wider uppercase mb-2">
        Select Neural Frequency (Vibe)
      </label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {(Object.values(Vibe) as Vibe[]).map((vibe) => (
          <button
            key={vibe}
            onClick={() => onSelect(vibe)}
            disabled={disabled}
            className={`
              relative overflow-hidden p-3 rounded-lg border transition-all duration-300 text-left group
              ${
                selectedVibe === vibe
                  ? 'bg-cyan-950/50 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                  : 'bg-slate-900/50 border-slate-700 hover:border-cyan-700 hover:bg-slate-800'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="relative z-10">
              <div className={`text-sm font-bold font-orbitron ${selectedVibe === vibe ? 'text-cyan-300' : 'text-slate-300'}`}>
                {vibe}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 group-hover:text-slate-400 leading-tight">
                {VIBE_DESCRIPTIONS[vibe]}
              </div>
            </div>
            {selectedVibe === vibe && (
              <div className="absolute inset-0 bg-cyan-400/5 z-0 animate-pulse" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default VibeSelector;
