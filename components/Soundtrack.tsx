
import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Zap, Heart } from 'lucide-react';

const Soundtrack: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);

  const start = () => {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.type = 'sine';
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    audioCtxRef.current = ctx;
    oscRef.current = osc;
    setIsPlaying(true);
  };

  const stop = () => {
    if (oscRef.current) oscRef.current.stop();
    setIsPlaying(false);
  };

  return (
    <div className="w-full h-full bg-[#050505] flex flex-col items-center justify-center p-10 space-y-10">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-display font-thin text-white tracking-tighter">Trilha do <span className="italic opacity-50">Agora</span></h2>
        <p className="text-xs text-zinc-600 uppercase tracking-widest">Sintetizador Bio-adaptativo</p>
      </div>
      <button onClick={isPlaying ? stop : start} className={`w-32 h-32 rounded-full border transition-all duration-700 flex items-center justify-center ${isPlaying ? 'border-white/40 bg-white/5 shadow-inner' : 'bg-white text-black'}`}>
        {isPlaying ? <Square fill="white" /> : <Play fill="black" className="ml-1" />}
      </button>
      <div className="flex gap-10 opacity-20 text-[9px] uppercase tracking-widest font-bold">
        <div className="flex items-center gap-2"><Zap className="w-3 h-3" /> Alpha Waves</div>
        <div className="flex items-center gap-2"><Heart className="w-3 h-3" /> Bio-Sync</div>
      </div>
    </div>
  );
};
export default Soundtrack;
