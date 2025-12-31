import React, { useState, useEffect, useRef } from 'react';
import { Palette, Loader2, Sparkles, X, History, Trash2, Download } from 'lucide-react';
import { generateMuseImage, analyzeEmotionalState } from '../services/geminiService.ts';
import { MuseTheme, MuseStyle, EmotionAnalysis, MuseEntry } from '../types.ts';

const InnerMuse: React.FC = () => {
  const [text, setText] = useState('');
  const [isSessionActive, setIsSessionActive] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [emotion, setEmotion] = useState<EmotionAnalysis | null>(null);
  const [history, setHistory] = useState<MuseEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    const saved = localStorage.getItem('muse_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let particles: { x: number, y: number, vx: number, vy: number, size: number, alpha: number }[] = [];
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const particleColor = emotion?.color || (document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)');
      
      if (typingSpeed > 0 && particles.length < 100) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * (1 + typingSpeed * 5),
          vy: (Math.random() - 0.5) * (1 + typingSpeed * 5),
          size: Math.random() * 2 + 1,
          alpha: Math.random() * 0.5 + 0.2
        });
      }

      particles = particles.filter(p => p.alpha > 0.01);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.005;
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = particleColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };
    const frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, [typingSpeed, emotion]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const now = Date.now();
    if (lastKeyTimeRef.current > 0) {
      const diff = now - lastKeyTimeRef.current;
      setTypingSpeed(Math.max(0, Math.min(1, 1000 / diff)));
    }
    lastKeyTimeRef.current = now;
    setTimeout(() => {
      if (Date.now() - lastKeyTimeRef.current >= 800) setTypingSpeed(0);
    }, 1000);
  };

  const handleCristalize = async () => {
    if (!text.trim() || isGenerating) return;
    setIsGenerating(true);
    setIsSessionActive(false);

    try {
      const emo = await analyzeEmotionalState(text);
      setEmotion(emo);
      
      const theme = (localStorage.getItem('muse_theme') as MuseTheme) || MuseTheme.NEURAL;
      const style = (localStorage.getItem('muse_style') as MuseStyle) || MuseStyle.NEURAL;
      
      const { imageUrl } = await generateMuseImage(text, emo, theme, style);
      setCurrentImage(imageUrl);

      const entry: MuseEntry = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        text,
        emotion: emo,
        imageUrl,
        theme,
        style
      };

      const newHistory = [entry, ...history].slice(0, 10);
      setHistory(newHistory);
      localStorage.setItem('muse_history', JSON.stringify(newHistory));
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full h-full bg-void flex flex-col items-center justify-center relative overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-2xl px-6 flex flex-col items-center">
        {isSessionActive ? (
          <div className="w-full space-y-12 animate-fade-in-up">
            <header className="text-center space-y-2">
               <h2 className="text-4xl md:text-6xl font-display font-thin text-starlight tracking-tighter">Musa <span className="italic opacity-60">Interior</span></h2>
               <p className="text-[10px] uppercase tracking-[0.5em] text-zinc-500 font-bold">Onde o Sentimento se torna Forma</p>
            </header>

            <textarea
              value={text}
              onChange={handleTextChange}
              placeholder="Escreva sua verdade sem filtros..."
              className="w-full h-48 bg-transparent text-starlight text-2xl md:text-3xl font-light text-center outline-none border-none placeholder:text-zinc-800 resize-none scrollbar-hide"
              autoFocus
            />

            <div className="flex flex-col items-center gap-6">
              <button 
                onClick={handleCristalize}
                disabled={!text.trim() || isGenerating}
                className="group relative px-12 py-5 rounded-full bg-starlight text-void font-bold text-[10px] uppercase tracking-[0.3em] overflow-hidden transition-all hover:scale-105 active:scale-95 disabled:opacity-30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                Cristalizar Sentimento
              </button>
              
              <button onClick={() => setShowHistory(true)} className="flex items-center gap-2 text-[8px] uppercase tracking-widest text-zinc-500 hover:text-starlight transition-colors font-bold">
                <History className="w-3 h-3" /> Ver Registros Anteriores
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center space-y-10 animate-zoom-in">
             <div className="relative">
                {isGenerating ? (
                  <div className="w-80 h-80 rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-3xl flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-starlight/20" />
                    <span className="text-[8px] uppercase tracking-[0.4em] text-zinc-600 animate-pulse">Sintetizando...</span>
                  </div>
                ) : (
                  <div className="group relative">
                    <img src={currentImage!} alt="Arte Gerada" className="w-80 h-80 object-cover rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)] border border-white/10" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem] flex items-center justify-center gap-4 backdrop-blur-sm">
                       <button className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white"><Download className="w-5 h-5" /></button>
                    </div>
                  </div>
                )}
             </div>

             <div className="text-center space-y-4 max-w-sm">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: emotion?.color }} />
                  <h3 className="text-[10px] uppercase tracking-[0.4em] font-bold text-starlight">{emotion?.label || 'Sentimento'}</h3>
                </div>
                <p className="text-lg text-ash font-light italic leading-relaxed">"{text}"</p>
             </div>

             <button onClick={() => { setIsSessionActive(true); setText(''); setEmotion(null); setCurrentImage(null); }} className="px-8 py-3 rounded-full border border-mist text-[10px] uppercase tracking-widest text-ash hover:text-starlight hover:border-starlight transition-all">
                Nova Imersão
             </button>
          </div>
        )}
      </div>

      {showHistory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-fade-in" onClick={() => setShowHistory(false)} />
          <div className="relative w-full max-w-4xl h-full max-h-[85vh] bg-surface rounded-[3rem] border border-mist/30 overflow-hidden flex flex-col animate-slide-up shadow-2xl">
             <header className="p-8 border-b border-mist/20 flex items-center justify-between shrink-0">
                <h3 className="text-[10px] uppercase tracking-[0.6em] font-bold text-starlight">Museu do Eu</h3>
                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-black/5 rounded-full transition-all"><X className="w-5 h-5 text-ash" /></button>
             </header>
             <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {history.map(item => (
                     <div key={item.id} className="group flex flex-col gap-4">
                        <img src={item.imageUrl!} className="w-full aspect-square object-cover rounded-2xl grayscale hover:grayscale-0 transition-all duration-700 shadow-md" />
                        <p className="text-[10px] text-ash italic line-clamp-2 leading-relaxed">"{item.text}"</p>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InnerMuse;