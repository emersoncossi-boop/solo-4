
import React, { useState, useEffect } from 'react';
import { Palette, Sparkles, Sliders, Volume2, Type, Smartphone, Eye, Sun, Moon } from 'lucide-react';
import { MuseTheme, MuseStyle } from '../types';

const Settings: React.FC = () => {
  const [theme, setTheme] = useState<MuseTheme>(() => 
    (localStorage.getItem('muse_theme') as MuseTheme) || MuseTheme.NEURAL
  );
  const [style, setStyle] = useState<MuseStyle>(() => 
    (localStorage.getItem('muse_style') as MuseStyle) || MuseStyle.NEURAL
  );
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [haptics, setHaptics] = useState(() => 
    localStorage.getItem('pref_haptics') !== 'false'
  );
  const [animationLevel, setAnimationLevel] = useState(() => 
    localStorage.getItem('pref_animation') || 'low'
  );
  const [fontStyle, setFontStyle] = useState(() => 
    localStorage.getItem('pref_font') || 'sans'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-animation-level', animationLevel);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    document.body.classList.remove('font-sans', 'font-display', 'font-mono');
    document.body.classList.add(`font-${fontStyle}`);
  }, [animationLevel, isDark, fontStyle]);

  const updateSetting = (key: string, value: string) => {
    localStorage.setItem(key, value);
    if (haptics && navigator.vibrate) navigator.vibrate(10);
  };

  const handleAnimationLevelChange = (level: string) => {
    setAnimationLevel(level);
    updateSetting('pref_animation', level);
    document.documentElement.setAttribute('data-animation-level', level);
  };

  const toggleAppearance = (dark: boolean) => {
    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    if (haptics && navigator.vibrate) navigator.vibrate(15);
  };

  const applyFont = (fontId: string) => {
    setFontStyle(fontId);
    localStorage.setItem('pref_font', fontId);
    document.body.classList.remove('font-sans', 'font-display', 'font-mono');
    document.body.classList.add(`font-${fontId}`);
    if (haptics && navigator.vibrate) navigator.vibrate(10);
  };

  const themeOptions = [
    { id: MuseTheme.NEURAL, label: 'Neural', color: 'from-blue-500 via-purple-500 to-yellow-500' },
    { id: MuseTheme.OCEAN, label: 'Oceano Profundo', color: 'from-indigo-900 via-blue-700 to-cyan-400' },
    { id: MuseTheme.FOREST, label: 'Floresta Crepuscular', color: 'from-emerald-900 via-green-700 to-amber-600' },
    { id: MuseTheme.AURORA, label: 'Aurora Boreal', color: 'from-magenta-500 via-teal-400 to-violet-600' },
  ];

  const styleOptions = [
    { id: MuseStyle.NEURAL, label: 'Essência Neural' },
    { id: MuseStyle.WATERCOLOR, label: 'Aquarela Abstrata' },
    { id: MuseStyle.VAPORWAVE, label: 'Grafite Vaporwave' },
    { id: MuseStyle.ICE, label: 'Escultura de Gelo' },
  ];

  return (
    <div className="w-full h-full overflow-y-auto bg-void p-6 md:p-12 transition-colors duration-500 scrollbar-hide">
      <div className="max-w-3xl mx-auto space-y-12 pb-20">
        <header className="space-y-2">
          <h2 className="text-4xl font-display font-light text-starlight tracking-tight">Personalização</h2>
          <p className="text-ash font-light">Refine a experiência sensorial do seu santuário.</p>
        </header>

        <section className="space-y-6">
          <div className="flex items-center gap-3 text-zinc-400">
            <Palette className="w-5 h-5" />
            <h3 className="text-sm uppercase tracking-widest font-medium">Visual da Musa</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-xs text-ash uppercase tracking-wider block">Prisma Cromático (Tema)</label>
              <div className="grid grid-cols-2 gap-2">
                {themeOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => { setTheme(opt.id); updateSetting('muse_theme', opt.id); }}
                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                      theme === opt.id ? 'bg-starlight/10 border-starlight/20 text-starlight' : 'bg-starlight/5 border-transparent text-ash hover:bg-starlight/10'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-gradient-to-tr ${opt.color} shadow-lg`} />
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-xs text-ash uppercase tracking-wider block">Estilo da Alma (Arte)</label>
              <div className="grid grid-cols-2 gap-2">
                {styleOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => { setStyle(opt.id); updateSetting('muse_style', opt.id); }}
                    className={`p-3 rounded-2xl border transition-all text-center ${
                      style === opt.id ? 'bg-starlight/10 border-starlight/20 text-starlight shadow-xl' : 'bg-starlight/5 border-transparent text-ash hover:bg-starlight/10'
                    }`}
                  >
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6 pt-6 border-t border-mist/30">
          <div className="flex items-center gap-3 text-zinc-400">
            <Sliders className="w-5 h-5" />
            <h3 className="text-sm uppercase tracking-widest font-medium">Interface e Sistema</h3>
          </div>
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-xs text-ash uppercase tracking-wider block px-2">Aparência do Solo</label>
              <div className="flex gap-2 p-1 bg-surface/40 rounded-3xl border border-mist/20">
                <button
                  onClick={() => toggleAppearance(false)}
                  className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-2xl transition-all ${
                    !isDark ? 'bg-starlight text-void shadow-xl' : 'text-ash hover:text-starlight'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Claro</span>
                </button>
                <button
                  onClick={() => toggleAppearance(true)}
                  className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-2xl transition-all ${
                    isDark ? 'bg-starlight text-void shadow-xl' : 'text-ash hover:text-starlight'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Escuro</span>
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-surface/40 rounded-3xl border border-mist/20">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-void flex items-center justify-center text-ash border border-mist/10">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div><h4 className="text-sm font-medium text-starlight">Feedback Háptico</h4><p className="text-xs text-ash">Vibrações sutis ao interagir.</p></div>
              </div>
              <button 
                onClick={() => { const newVal = !haptics; setHaptics(newVal); updateSetting('pref_haptics', String(newVal)); }}
                className={`w-12 h-6 rounded-full transition-all relative ${haptics ? 'bg-starlight' : 'bg-mist/30'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-void transition-all ${haptics ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4 px-2"><Eye className="w-5 h-5 text-ash" /><h4 className="text-sm font-medium text-starlight">Intensidade Visual</h4></div>
              <div className="flex gap-2 p-1 bg-surface/40 rounded-2xl border border-mist/20">
                {['low', 'normal', 'high'].map((level) => (
                  <button
                    key={level}
                    onClick={() => handleAnimationLevelChange(level)}
                    className={`flex-1 py-2 rounded-xl text-[10px] uppercase tracking-widest font-bold transition-all ${
                      animationLevel === level ? 'bg-starlight text-void shadow-lg' : 'text-ash hover:text-starlight'
                    }`}
                  >
                    {level === 'low' ? 'Sutil' : level === 'normal' ? 'Padrão' : 'Imersivo'}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4 px-2"><Type className="w-5 h-5 text-ash" /><h4 className="text-sm font-medium text-starlight">Tipografia do Sistema</h4></div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'sans', label: 'Moderna', class: 'font-sans' },
                  { id: 'display', label: 'Elegante', class: 'font-display' },
                  { id: 'mono', label: 'Mantra', class: 'font-mono' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => applyFont(f.id)}
                    className={`p-4 rounded-2xl border transition-all text-center ${
                      fontStyle === f.id ? 'bg-starlight/10 border-starlight/20 text-starlight' : 'bg-starlight/5 border-transparent text-ash hover:bg-starlight/10'
                    }`}
                  >
                    <span className={`text-lg block mb-1 ${f.class}`}>Aa</span>
                    <span className="text-[10px] uppercase tracking-widest">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
        <footer className="pt-12 text-center text-[10px] text-zinc-700 font-mono tracking-[0.2em] uppercase">InnerSpace Premium Experience • Solo System v1.1.0</footer>
      </div>
    </div>
  );
};

export default Settings;
