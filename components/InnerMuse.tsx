
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StopCircle, Save, BookOpen, X, Edit3, Loader2, Download, RotateCcw, Wand2, Zap, Palette, Check, RefreshCw } from 'lucide-react';
import { generateMuseImage, analyzeEmotionalState, generateMuseSuggestions } from '../services/geminiService.ts';
import { getCachedImage, saveImageToCache } from '../services/imageStore.ts';
import { EmotionAnalysis, MuseEntry, MuseTheme, MuseStyle } from '../types.ts';

// --- BIOLUMINESCENT FIBER ENGINE ---
class FiberParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    history: {x: number, y: number}[];
    maxLength: number;
    speed: number;
    angle: number;
    age: number;
    lifeSpan: number;
    
    constructor(w: number, h: number) {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.vx = 0;
        this.vy = 0;
        this.history = [];
        this.maxLength = Math.random() * 20 + 10;
        this.speed = Math.random() * 0.4 + 0.1;
        this.angle = 0;
        this.age = 0;
        this.lifeSpan = Math.random() * 300 + 200;
    }

    reset(w: number, h: number) {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.history = [];
        this.age = 0;
    }

    update(w: number, h: number, typingActivity: number, time: number) {
        this.age++;
        const scale = 0.0015;
        const noise = Math.sin(this.x * scale + time) * Math.cos(this.y * scale + time) * Math.PI * 4;
        const turbulence = 0.5 + typingActivity * 3;
        this.angle = noise + (Math.random() - 0.5) * turbulence * 0.1;
        this.vx = Math.cos(this.angle) * (this.speed + typingActivity * 2);
        this.vy = Math.sin(this.angle) * (this.speed + typingActivity * 2);
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0) this.x = w;
        if (this.x > w) this.x = 0;
        if (this.y < 0) this.y = h;
        if (this.y > h) this.y = 0;
        this.history.push({ x: this.x, y: this.y });
        if (this.history.length > this.maxLength) this.history.shift();
        if (this.age > this.lifeSpan) this.reset(w, h);
    }
}

const NeuralBackground: React.FC<{ typingActivity: number; theme: MuseTheme; }> = ({ typingActivity, theme }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<FiberParticle[]>([]);
    const requestRef = useRef<number>(0);
    const timeRef = useRef<number>(0);

    useEffect(() => {
        const init = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const w = canvas.width = window.innerWidth;
            const h = canvas.height = window.innerHeight;
            
            const level = document.documentElement.getAttribute('data-animation-level') || 'normal';
            const count = level === 'low' ? 80 : level === 'normal' ? 250 : 500;
            
            particlesRef.current = Array.from({ length: count }, () => new FiberParticle(w, h));
        };
        init();
        window.addEventListener('resize', init);
        return () => window.removeEventListener('resize', init);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const isLow = document.documentElement.getAttribute('data-animation-level') === 'low';
        
        const animate = () => {
            const w = canvas.width;
            const h = canvas.height;
            timeRef.current += 0.004 + (typingActivity * 0.008);
            
            ctx.fillStyle = isLow ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, w, h);
            
            ctx.globalCompositeOperation = 'lighter';
            particlesRef.current.forEach(p => {
                p.update(w, h, typingActivity, timeRef.current);
                const xRatio = p.x / w;
                let color = '';
                if (theme === MuseTheme.OCEAN) {
                    const t = xRatio;
                    color = `rgb(${Math.floor(0 + t * 50)}, ${Math.floor(100 + t * 155)}, ${Math.floor(180 + t * 75)})`;
                } else if (theme === MuseTheme.FOREST) {
                    const t = xRatio;
                    color = `rgb(${Math.floor(20 + t * 40)}, ${Math.floor(120 + t * 135)}, ${Math.floor(20 + t * 40)})`;
                } else if (theme === MuseTheme.AURORA) {
                    const t = xRatio;
                    if (t < 0.5) {
                        const it = t * 2;
                        const r = Math.floor(255 * (1 - it) + 0 * it);
                        const g = Math.floor(0 * (1 - it) + 128 * it);
                        const b = Math.floor(255 * (1 - it) + 128 * it);
                        color = `rgb(${r}, ${g}, ${b})`;
                    } else {
                        const it = (t - 0.5) * 2;
                        const r = Math.floor(0 * (1 - it) + 139 * it);
                        const g = Math.floor(128 * (1 - it) + 0 * it);
                        const b = Math.floor(128 * (1 - it) + 255 * it);
                        color = `rgb(${r}, ${g}, ${b})`;
                    }
                } else {
                    if (xRatio < 0.33) {
                        const t = xRatio / 0.33;
                        color = `rgb(${Math.floor(0 + t * 128)},${Math.floor(255 - t * 255)},255)`;
                    } else if (xRatio < 0.66) {
                        const t = (xRatio - 0.33) / 0.33;
                        color = `rgb(${Math.floor(128 + t * 127)},0,${Math.floor(128 + t * 127)})`;
                    } else {
                        const t = (xRatio - 0.66) / 0.34;
                        color = `rgb(255,${Math.floor(t * 255)},${Math.floor(255 - t * 255)})`;
                    }
                }
                ctx.strokeStyle = color;
                ctx.lineWidth = isLow ? 0.5 : 1 + (typingActivity * 2);
                if (p.history.length > 1) {
                    ctx.beginPath();
                    ctx.moveTo(p.history[p.history.length-2].x, p.history[p.history.length-2].y);
                    ctx.lineTo(p.x, p.y);
                    ctx.stroke();
                }
            });
            ctx.globalCompositeOperation = 'source-over';
            requestRef.current = requestAnimationFrame(animate);
        };
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [typingActivity, theme]);
    return <canvas ref={canvasRef} className="absolute inset-0 z-0 bg-black" />;
};

const InnerMuse: React.FC = () => {
  const [theme, setTheme] = useState<MuseTheme>(() => 
    (localStorage.getItem('muse_theme') as MuseTheme) || MuseTheme.NEURAL
  );
  const [style, setStyle] = useState<MuseStyle>(() => 
    (localStorage.getItem('muse_style') as MuseStyle) || MuseStyle.NEURAL
  );

  const [text, setText] = useState('');
  const [isSessionActive, setIsSessionActive] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [currentVisualPrompt, setCurrentVisualPrompt] = useState<string | null>(null);
  const [prevImage, setPrevImage] = useState<string | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [emotionData, setEmotionData] = useState<EmotionAnalysis>({ label: 'Espaço em Branco', color: '#3f3f46', intensity: 0.1, valence: 0 });
  const [typingActivity, setTypingActivity] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [savedEntries, setSavedEntries] = useState<MuseEntry[]>([]);
  const [showJournal, setShowJournal] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSaveFeedback, setShowSaveFeedback] = useState(false);
  
  const analysisTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('muse_journal');
    if (saved) setSavedEntries(JSON.parse(saved));
  }, []);

  const isCurrentlySaved = useMemo(() => 
    savedEntries.some(e => e.text === text && e.imageUrl === currentImage), 
  [text, currentImage, savedEntries]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setIsTyping(true);
    setTypingActivity(prev => Math.min(prev + 0.15, 1.5));
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 500);
  };

  const cycleTheme = () => {
    const themes = Object.values(MuseTheme);
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    setTheme(nextTheme);
    localStorage.setItem('muse_theme', nextTheme);
  };

  useEffect(() => {
    const decay = setInterval(() => setTypingActivity(prev => Math.max(prev - 0.04, 0)), 50);
    return () => clearInterval(decay);
  }, []);

  useEffect(() => {
    if (!isSessionActive || text.length < 15) return;
    if (analysisTimeoutRef.current) clearTimeout(analysisTimeoutRef.current);
    
    analysisTimeoutRef.current = setTimeout(async () => {
      const analysis = await analyzeEmotionalState(text, savedEntries);
      setEmotionData(analysis);
      
      const level = document.documentElement.getAttribute('data-animation-level');
      if (level !== 'low') {
        setIsLoadingSuggestions(true);
        const newSuggestions = await generateMuseSuggestions(text, analysis);
        setSuggestions(newSuggestions);
        setIsLoadingSuggestions(false);
      }
    }, 5000);
  }, [text, isSessionActive, savedEntries]);

  const handleFinishSession = async () => {
    if (!text.trim()) return;
    setIsSessionActive(false);
    setSuggestions([]);
    
    const cached = getCachedImage(text, emotionData.label);
    if (cached) {
      setIsFromCache(true); 
      setPrevImage(currentImage); 
      setShowCurrent(false); 
      setCurrentImage(cached);
      setCurrentVisualPrompt(null);
      setTimeout(() => setShowCurrent(true), 50); 
      return;
    }

    setIsGenerating(true); 
    setIsFromCache(false);
    try {
        const result = await generateMuseImage(text, emotionData, theme, style);
        if (result && result.imageUrl) {
          setPrevImage(currentImage); 
          setShowCurrent(false); 
          setCurrentImage(result.imageUrl);
          setCurrentVisualPrompt(result.visualPrompt);
          await saveImageToCache(text, emotionData.label, result.imageUrl);
          setTimeout(() => setShowCurrent(true), 50);
        }
    } catch(e) { 
      console.error(e); 
    } finally { 
      setIsGenerating(false); 
    }
  };

  const handleRegenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
        const result = await generateMuseImage(text, emotionData, theme, style, currentVisualPrompt || undefined);
        if (result && result.imageUrl) {
          setPrevImage(currentImage);
          setCurrentImage(result.imageUrl);
          setCurrentVisualPrompt(result.visualPrompt);
          await saveImageToCache(text, emotionData.label, result.imageUrl);
        }
    } catch(e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadImage = () => {
    if (!currentImage) return;
    const link = document.createElement('a');
    link.href = currentImage;
    link.download = `reflexo-${emotionData.label.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleSaveToJournal = () => {
    if (!text.trim() || !currentImage || isCurrentlySaved) return;
    const newEntry: MuseEntry = { 
        id: Date.now().toString(), 
        timestamp: Date.now(), 
        text: text, 
        emotion: emotionData, 
        imageUrl: currentImage, 
        visualPrompt: currentVisualPrompt,
        theme: theme, 
        style: style 
    };
    const updated = [newEntry, ...savedEntries]; setSavedEntries(updated);
    localStorage.setItem('muse_journal', JSON.stringify(updated));
    
    setShowSaveFeedback(true);
    setTimeout(() => setShowSaveFeedback(false), 2000);
  };

  const loadEntry = (entry: MuseEntry) => {
      setPrevImage(currentImage); 
      setShowCurrent(false); 
      setIsFromCache(true);
      setText(entry.text); 
      setEmotionData(entry.emotion); 
      setCurrentImage(entry.imageUrl);
      setCurrentVisualPrompt(entry.visualPrompt || null);
      
      if (entry.theme) setTheme(entry.theme);
      if (entry.style) setStyle(entry.style);

      setIsSessionActive(false); 
      setShowJournal(false);
      setTimeout(() => setShowCurrent(true), 50);
  };

  const handleReturnToView = () => { if (currentImage) { setIsSessionActive(false); setShowCurrent(true); } };

  const useSuggestion = (suggestion: string) => {
    setText(prev => prev.trim() + " " + suggestion); setSuggestions([]);
    if (textAreaRef.current) textAreaRef.current.focus();
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-black">
      {prevImage && <div className="absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms]" style={{ backgroundImage: `url(${prevImage})`, opacity: 0.6, filter: 'blur(4px) brightness(0.4)' }} />}
      <div className="absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms]" style={{ backgroundImage: currentImage ? `url(${currentImage})` : 'none', opacity: (showCurrent && !isSessionActive) ? 0.7 : 0, filter: 'blur(2px) brightness(0.5)' }} />
      {isSessionActive && <NeuralBackground typingActivity={typingActivity} theme={theme} />}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,black_95%)]" />

      <div className="relative z-20 w-full h-full flex flex-col">
        <header className="px-6 py-4 flex justify-between items-start pointer-events-auto shrink-0">
             <div className="flex gap-2">
                <button onClick={() => setShowJournal(true)} className="p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white transition-all backdrop-blur-md">
                    <BookOpen className="w-5 h-5" />
                </button>
                {isSessionActive && (
                  <button onClick={cycleTheme} className="p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white transition-all backdrop-blur-md flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    <span className="text-[9px] uppercase tracking-widest font-bold hidden md:block">{theme}</span>
                  </button>
                )}
             </div>
             <div className="flex flex-col items-center gap-0.5">
                <span className="text-[9px] font-display tracking-[0.4em] uppercase text-zinc-500">Musa Interior</span>
                <span className="text-[11px] font-display tracking-[0.2em] uppercase transition-all duration-1000" style={{ color: emotionData.color, textShadow: `0 0 10px ${emotionData.color}66` }}>{emotionData.label}</span>
             </div>
             <div className="w-10" />
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-6 overflow-hidden">
          {isSessionActive ? (
            <div className="w-full max-w-2xl relative animate-fade-in-up flex flex-col items-center">
               <div className="relative w-full backdrop-blur-xl rounded-[2.5rem] border transition-all duration-500 overflow-hidden"
                 style={{ 
                    backgroundColor: (isTyping || isFocused) ? 'rgba(10,10,10,0.85)' : 'rgba(20,20,20,0.4)',
                    borderColor: (isTyping || isFocused) ? emotionData.color : 'rgba(255,255,255,0.1)',
                    boxShadow: (isTyping || isFocused) ? `0 0 ${40 + typingActivity * 30}px -10px ${emotionData.color}66` : 'none',
                    transform: `scale(${1 + typingActivity * 0.005})`,
                 }}
               >
                   <textarea
                    ref={textAreaRef}
                    value={text}
                    onChange={handleTextChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="O que pulsa no escuro do seu ser?"
                    className="w-full h-48 md:h-64 bg-transparent text-white text-lg md:text-2xl font-light font-sans leading-relaxed placeholder:text-zinc-700 outline-none resize-none p-10 text-center transition-all duration-300"
                    style={{ letterSpacing: `${typingActivity * 0.02}em`, filter: `drop-shadow(0 0 ${typingActivity * 4}px ${emotionData.color}44)` }}
                    spellCheck={false} autoFocus
                   />
               </div>
               <div className="mt-4 flex flex-wrap justify-center gap-2 h-8 overflow-hidden">
                   {isLoadingSuggestions ? (
                       <div className="flex items-center gap-2 text-zinc-600 animate-pulse">
                           <Wand2 className="w-3 h-3" />
                           <span className="text-[9px] uppercase tracking-widest">Tecendo caminhos...</span>
                       </div>
                   ) : suggestions.map((s, i) => (
                       <button key={i} onClick={() => useSuggestion(s)} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all animate-fade-in">{s}</button>
                   ))}
               </div>
               <div className="flex justify-center mt-6 gap-3">
                 {currentImage && !isTyping && (
                   <button onClick={handleReturnToView} className="group flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all hover:scale-105 backdrop-blur-xl">
                     <RotateCcw className="w-4 h-4 text-zinc-500 group-hover:text-white" />
                     <span className="text-xs uppercase tracking-widest text-zinc-500 group-hover:text-white">Cancelar</span>
                   </button>
                 )}
                 {text.length > 5 && !isTyping && (
                   <button onClick={handleFinishSession} className="group flex items-center gap-2 px-8 py-3 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all hover:scale-105 shadow-2xl backdrop-blur-xl">
                     <StopCircle className="w-4 h-4 text-zinc-500 group-hover:text-white" />
                     <span className="text-xs uppercase tracking-widest text-zinc-500 group-hover:text-white">Cristalizar</span>
                   </button>
                 )}
               </div>
            </div>
          ) : (
            <div className="w-full max-w-4xl flex flex-col md:flex-row items-center gap-6 animate-fade-in overflow-y-auto max-h-full py-4 scrollbar-hide">
               <div className="relative group/img w-48 h-48 md:w-80 md:h-80 rounded-3xl border border-white/10 overflow-hidden bg-zinc-900 flex items-center justify-center shadow-2xl shrink-0">
                  {isGenerating ? <div className="flex flex-col items-center gap-4"><Loader2 className="w-8 h-8 text-zinc-600 animate-spin" /><span className="text-[9px] uppercase tracking-widest text-zinc-600">Materializando...</span></div> : currentImage ? (
                    <><img key={currentImage} src={currentImage} alt="Emotion crystallized" className="w-full h-full object-cover animate-zoom-in animate-pulse-subtle" />{isFromCache && <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[7px] uppercase tracking-widest text-zinc-400"><Zap className="w-2.5 h-2.5 text-yellow-500" />Instantâneo</div>}</>
                  ) : <div className="text-zinc-700 italic">Visão obstruída</div>}
               </div>
               <div className="flex-1 w-full text-center md:text-left space-y-4 pointer-events-auto">
                  <div className="space-y-2">
                    <h2 className="text-2xl md:text-3xl font-display font-light italic" style={{ color: emotionData.color }}>{emotionData.label}</h2>
                    <p className="text-base text-white/80 font-light italic leading-relaxed">"{text}"</p>
                  </div>
                  
                  <div className="flex flex-wrap justify-center md:justify-start gap-2">
                     <div className="relative">
                       <button onClick={handleSaveToJournal} disabled={isCurrentlySaved || isGenerating || !currentImage} className={`flex items-center gap-2 px-5 py-2 rounded-full border transition-all ${isCurrentlySaved ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white'}`}>
                          {isCurrentlySaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />} 
                          <span className="text-[10px] uppercase tracking-widest">{isCurrentlySaved ? 'Arquivado' : 'Arquivar'}</span>
                       </button>
                       {showSaveFeedback && (
                         <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-2 text-emerald-400 animate-slide-up bg-zinc-950/80 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-emerald-500/20 shadow-xl z-[30]">
                            <Check className="w-3 h-3" />
                            <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Salvo!</span>
                         </div>
                       )}
                     </div>
                     <button onClick={handleRegenerate} disabled={isGenerating || !currentImage} className="flex items-center gap-2 px-5 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all disabled:opacity-50">
                        <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                        <span className="text-[10px] uppercase tracking-widest">Regenerar</span>
                     </button>
                     <button onClick={handleDownloadImage} disabled={!currentImage || isGenerating} className="flex items-center gap-2 px-5 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all disabled:opacity-50"><Download className="w-4 h-4" /><span className="text-[10px] uppercase tracking-widest">Baixar</span></button>
                     <button onClick={() => setIsSessionActive(true)} className="p-2.5 rounded-full border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white transition-all"><Edit3 className="w-4 h-4" /></button>
                  </div>
               </div>
            </div>
          )}
        </main>
      </div>

      {showJournal && (
          <div className="absolute inset-0 z-50 flex justify-end">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto" onClick={() => setShowJournal(false)} />
              <div className="relative w-full max-w-md h-full bg-zinc-950 border-l border-white/10 shadow-2xl overflow-y-auto animate-fade-in-right pointer-events-auto">
                  <div className="p-6 border-b border-white/5 flex justify-between items-center sticky top-0 bg-zinc-950/95 backdrop-blur-xl z-10">
                      <div><h3 className="text-xl font-display text-white mb-0.5">Arquivos</h3><p className="text-[9px] text-zinc-500 uppercase tracking-[0.3em]">Registros da Alma</p></div>
                      <button onClick={() => setShowJournal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X className="w-5 h-5 text-zinc-600 hover:text-white" /></button>
                  </div>
                  <div className="p-4 space-y-4 pb-24">
                      {savedEntries.length === 0 ? (
                          <div className="h-64 flex flex-col items-center justify-center text-zinc-700 italic text-sm">Nenhum registro encontrado.</div>
                      ) : savedEntries.map((entry) => (
                        <div key={entry.id} className="group bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 transition-all cursor-pointer" onClick={() => loadEntry(entry)}>
                            {entry.imageUrl && (
                                <div className="h-28 w-full overflow-hidden opacity-50 group-hover:opacity-100 transition-opacity">
                                    <img src={entry.imageUrl} alt="Reflexo" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[9px] font-bold uppercase tracking-widest" style={{color: entry.emotion.color}}>{entry.emotion.label}</span>
                                    <span className="text-[9px] text-zinc-600 font-mono">{new Date(entry.timestamp).toLocaleDateString()}</span>
                                </div>
                                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">"{entry.text}"</p>
                            </div>
                        </div>
                      ))}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default InnerMuse;
