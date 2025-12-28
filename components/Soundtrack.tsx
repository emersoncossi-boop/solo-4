import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Volume2, Waves, Activity, Zap, Brain, Wind, CloudRain, Heart } from 'lucide-react';
import { AudioState, EmotionAnalysis } from '../types';
import { analyzeEmotionalState } from '../services/geminiService.ts';

// Configurações de Escalas para Arrastamento Neural
const SCALES = {
  anxious: [220, 233.08, 277.18, 311.13, 349.23], // Escala tensa, dissonante
  calm: [220, 246.94, 277.18, 329.63, 369.99],   // Pentatônica maior
  focus: [110, 164.81, 220, 246.94, 329.63],     // Frequências baixas estáveis
  deep: [55, 82.41, 110, 123.47, 164.81]         // Sub-graves
};

const Soundtrack: React.FC = () => {
  const [audioState, setAudioState] = useState<AudioState & { bpm: number; currentScale: number[] }>({
    isPlaying: false,
    volume: 0.5,
    mood: 'calm',
    bpm: 60,
    currentScale: SCALES.calm
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<EmotionAnalysis | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const schedulerRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const activeOscillatorsRef = useRef<Set<OscillatorNode>>(new Set());

  const initAudio = () => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(audioState.volume * 0.4, ctx.currentTime);
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      audioContextRef.current = ctx;
    }
    
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const playNote = (freq: number, startTime: number, duration: number, type: OscillatorType = 'sine') => {
    if (!audioContextRef.current || !masterGainRef.current) return;
    const ctx = audioContextRef.current;
    
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    
    osc.detune.setValueAtTime((Math.random() - 0.5) * 10, startTime);

    env.gain.setValueAtTime(0, startTime);
    env.gain.linearRampToValueAtTime(0.15, startTime + 0.1);
    env.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(env);
    env.connect(masterGainRef.current);

    osc.start(startTime);
    osc.stop(startTime + duration);

    activeOscillatorsRef.current.add(osc);
    osc.onended = () => activeOscillatorsRef.current.delete(osc);
  };

  const scheduler = () => {
    if (!audioContextRef.current || !audioState.isPlaying) return;
    
    const ctx = audioContextRef.current;
    const scheduleAheadTime = 0.1;

    while (nextNoteTimeRef.current < ctx.currentTime + scheduleAheadTime) {
      const scale = audioState.currentScale;
      const freq = scale[Math.floor(Math.random() * scale.length)];
      
      const noteDuration = (60 / audioState.bpm) * (Math.random() > 0.8 ? 2 : 1);
      playNote(freq, nextNoteTimeRef.current, noteDuration, 'sine');
      
      if (Math.random() > 0.7) {
        playNote(scale[0] / 2, nextNoteTimeRef.current, noteDuration * 4, 'triangle');
      }

      nextNoteTimeRef.current += (60 / audioState.bpm);
    }

    schedulerRef.current = window.setTimeout(scheduler, 25);
  };

  const stopAudio = () => {
    if (schedulerRef.current) {
      clearTimeout(schedulerRef.current);
      schedulerRef.current = null;
    }
    activeOscillatorsRef.current.forEach(osc => {
      try { osc.stop(); osc.disconnect(); } catch (e) {}
    });
    activeOscillatorsRef.current.clear();
  };

  const togglePlay = () => {
    if (audioState.isPlaying) {
      stopAudio();
      setAudioState(prev => ({ ...prev, isPlaying: false }));
    } else {
      initAudio();
      nextNoteTimeRef.current = audioContextRef.current!.currentTime;
      setAudioState(prev => ({ ...prev, isPlaying: true }));
    }
  };

  const syncWithSoul = async () => {
    setIsAnalyzing(true);
    const history = localStorage.getItem('muse_journal');
    const recentText = history ? JSON.parse(history)[0]?.text : "Busco clareza e paz no caos.";
    
    try {
      const emotion = await analyzeEmotionalState(recentText || "Silêncio.");
      setAnalysisResult(emotion);
      
      const targetBPM = emotion.valence < 0 ? 45 : 65;
      const targetScale = emotion.valence < 0 ? SCALES.anxious : SCALES.calm;
      
      setAudioState(prev => ({
        ...prev,
        bpm: emotion.intensity > 0.7 ? 90 : 60,
        currentScale: targetScale
      }));

      const interval = setInterval(() => {
        setAudioState(prev => {
          if (Math.abs(prev.bpm - targetBPM) < 1) {
            clearInterval(interval);
            return { ...prev, bpm: targetBPM };
          }
          return { ...prev, bpm: prev.bpm + (targetBPM - prev.bpm) * 0.1 };
        });
      }, 2000);

    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (audioState.isPlaying && !schedulerRef.current) {
      scheduler();
    }
    return () => stopAudio();
  }, [audioState.isPlaying, audioState.bpm, audioState.currentScale]);

  return (
    <div className="w-full h-full flex flex-col bg-[#050505] overflow-y-auto scrollbar-hide relative pb-20">
      {/* Background Generativo */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div 
          className="absolute inset-0 opacity-20 transition-all duration-[3000ms]"
          style={{ 
            background: `radial-gradient(circle at center, ${analysisResult?.color || '#1e1b4b'} 0%, transparent 70%)`,
            transform: `scale(${audioState.isPlaying ? 1.2 + (Math.sin(Date.now() / 1000) * 0.1) : 1})`
          }}
        />
        <div className="grid grid-cols-8 h-full w-full opacity-5">
          {Array.from({ length: 64 }).map((_, i) => (
            <div key={i} className="border-[0.5px] border-white/20" />
          ))}
        </div>
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center px-6 py-10 space-y-8 md:space-y-10">
        
        {/* Header Status */}
        <div className="text-center space-y-3 animate-fade-in shrink-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-xl">
            <div className={`w-1 h-1 rounded-full ${audioState.isPlaying ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]' : 'bg-zinc-600'}`} />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400">
              {audioState.isPlaying ? 'Motor Generativo Ativo' : 'Sintetizador em Repouso'}
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-thin text-white tracking-tighter">
            Trilha do <span className="italic opacity-60">Agora</span>
          </h2>
          <p className="text-xs text-zinc-500 font-light max-w-[280px] mx-auto leading-relaxed">
            Música composta nota a nota, adaptando-se à sua pulsação emocional.
          </p>
        </div>

        {/* Visualizador de Arrastamento Neural */}
        <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center shrink-0">
            <div className={`absolute inset-0 rounded-full border border-white/5 transition-all duration-1000 ${audioState.isPlaying ? 'scale-100' : 'scale-90 opacity-0'}`} />
            <div className={`absolute inset-3 rounded-full border border-white/10 transition-all duration-1000 delay-100 ${audioState.isPlaying ? 'scale-100' : 'scale-85 opacity-0'}`} />
            
            <button 
              onClick={togglePlay}
              className={`group relative w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center transition-all duration-700 z-20 ${
                audioState.isPlaying 
                ? 'bg-zinc-900 border border-white/20 shadow-[0_0_60px_rgba(255,255,255,0.05)] scale-105' 
                : 'bg-white text-black hover:scale-110 active:scale-95 shadow-2xl'
              }`}
            >
              {audioState.isPlaying ? (
                <Square className="w-6 h-6 text-white" fill="white" />
              ) : (
                <Play className="w-6 h-6 ml-1 text-black" fill="black" />
              )}
              {audioState.isPlaying && (
                <div 
                  className="absolute inset-[-15px] rounded-full border border-white/10 opacity-20"
                  style={{ animation: `pulseSubtle ${60 / audioState.bpm}s ease-in-out infinite` }}
                />
              )}
            </button>

            {audioState.isPlaying && Array.from({ length: 12 }).map((_, i) => (
              <div 
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full opacity-40"
                style={{
                  transform: `rotate(${i * 30}deg) translateY(-${90 + Math.sin(Date.now() / 1000 + i) * 15}px)`,
                  transition: 'transform 0.5s ease-out'
                }}
              />
            ))}
        </div>

        {/* Controles de Sincronização e Biométrica */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3 animate-fade-in-up">
          
          <button 
            onClick={syncWithSoul}
            disabled={isAnalyzing}
            className="flex flex-col items-center justify-center p-4 md:p-6 rounded-[1.8rem] bg-white/[0.03] border border-white/5 hover:border-white/20 transition-all group"
          >
            <div className={`p-2.5 rounded-xl mb-2 transition-colors ${isAnalyzing ? 'bg-white/20 text-white' : 'bg-zinc-900 text-zinc-500 group-hover:text-white'}`}>
              {isAnalyzing ? <Brain className="w-4 h-4 animate-pulse" /> : <Zap className="w-4 h-4" />}
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors">Sincronizar</span>
            <span className="text-[7px] text-zinc-700 mt-0.5 uppercase">Ajuste Biométrico</span>
          </button>

          <div className="flex flex-col items-center justify-center p-4 md:p-6 rounded-[1.8rem] bg-white/[0.03] border border-white/5">
             <div className="text-xl md:text-2xl font-display font-thin text-white mb-0.5">{Math.round(audioState.bpm)}</div>
             <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">BPM</span>
             <span className="text-[7px] text-zinc-700 mt-0.5 uppercase">Frequência Cardíaca</span>
          </div>

          <div className="flex flex-col items-center justify-center p-4 md:p-6 rounded-[1.8rem] bg-white/[0.03] border border-white/5">
            <div className="flex gap-1 mb-1.5 h-6 items-center">
              {[0.4, 0.8, 0.6, 0.9].map((val, i) => (
                <div 
                  key={i} 
                  className={`w-[1.5px] rounded-full transition-all duration-500 ${audioState.isPlaying ? 'bg-white' : 'bg-zinc-800'}`}
                  style={{ height: audioState.isPlaying ? `${40 + Math.random() * 60}%` : '20%' }}
                />
              ))}
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Harmonia</span>
            <span className="text-[7px] text-zinc-700 mt-0.5 uppercase truncate max-w-[80px] text-center">{analysisResult?.label || 'Neutra'}</span>
          </div>

        </div>

        {/* Volume e Master */}
        <div className="w-full max-w-xs pt-2">
          <div className="flex items-center gap-4 text-zinc-600">
            <Volume2 className="w-3.5 h-3.5 shrink-0" />
            <input 
              type="range" min="0" max="1" step="0.01" value={audioState.volume} 
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setAudioState(prev => ({ ...prev, volume: v }));
                if (masterGainRef.current) masterGainRef.current.gain.setTargetAtTime(v * 0.4, audioContextRef.current!.currentTime, 0.1);
              }}
              className="w-full h-[1.5px] bg-white/10 rounded-full appearance-none cursor-pointer accent-white"
            />
            <span className="text-[9px] font-mono w-6 text-zinc-500">{Math.round(audioState.volume * 100)}</span>
          </div>
        </div>

        {/* Footer Info */}
        <footer className="w-full flex justify-center gap-6 opacity-30 text-[7px] uppercase tracking-[0.3em] font-bold text-zinc-500 pt-6">
           <div className="flex items-center gap-1.5"><Wind className="w-2.5 h-2.5" /> Alpha</div>
           <div className="flex items-center gap-1.5"><Heart className="w-2.5 h-2.5" /> Coração</div>
           <div className="flex items-center gap-1.5"><CloudRain className="w-2.5 h-2.5" /> Síntese</div>
        </footer>
      </div>
    </div>
  );
};

export default Soundtrack;