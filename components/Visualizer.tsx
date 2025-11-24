import React from 'react';

interface VisualizerProps {
  isPlaying: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ isPlaying }) => {
  return (
    <div className="flex items-center justify-center space-x-1 h-12 w-full max-w-[200px]">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className={`w-2 bg-cyan-400 rounded-full transition-all duration-300 ${
            isPlaying ? 'audio-visualizer-bar' : 'h-2'
          }`}
          style={{
            animationDelay: `${i * 0.1}s`,
            opacity: 0.6 + (i % 2) * 0.4
          }}
        ></div>
      ))}
    </div>
  );
};

export default Visualizer;
