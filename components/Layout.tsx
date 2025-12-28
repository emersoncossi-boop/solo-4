import React, { useState, useEffect } from 'react';
import { Feather, Waves, MessageSquare, Compass, Home, Settings as SettingsIcon } from 'lucide-react';
import { AppView } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  isImmersive?: boolean;
}

const InnerSpaceLogo = () => (
  <svg 
    viewBox="0 0 24 24" 
    className="w-5 h-5 text-starlight opacity-30 hover:opacity-100 transition-all duration-700 cursor-pointer" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1"
    aria-label="Logo InnerSpace"
  >
    <path d="M12 4V10" strokeLinecap="square" />
    <path d="M12 14V20" strokeLinecap="square" />
    <circle cx="12" cy="12" r="0.5" fill="currentColor" stroke="none" />
    <path d="M8 12C8 12 10 10 12 10C14 10 16 12 16 12" strokeLinecap="round" opacity="0.5" />
    <path d="M8 12C8 12 10 14 12 14C14 14 16 12 16 12" strokeLinecap="round" opacity="0.5" />
  </svg>
);

const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView, isImmersive = false }) => {
  const [displayChildren, setDisplayChildren] = useState<React.ReactNode>(children);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [lastView, setLastView] = useState(currentView);

  useEffect(() => {
    // Forçar modo escuro como padrão se nenhuma preferência existir
    const savedTheme = localStorage.getItem('theme');
    const shouldBeDark = savedTheme !== 'light';
    
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const savedFont = localStorage.getItem('pref_font') || 'sans';
    document.body.classList.remove('font-sans', 'font-display', 'font-mono');
    document.body.classList.add(`font-${savedFont}`);
  }, []);

  useEffect(() => {
    if (currentView !== lastView) {
      const updateContent = () => {
        setDisplayChildren(children);
        setLastView(currentView);
      };

      // Check for View Transitions API support
      if ((document as any).startViewTransition) {
        (document as any).startViewTransition(() => {
          updateContent();
        });
      } else {
        // Fallback for browsers that don't support View Transitions API
        setIsTransitioning(true);
        const timer = setTimeout(() => {
          updateContent();
          setIsTransitioning(false);
        }, 400);
        return () => clearTimeout(timer);
      }
    } else {
      setDisplayChildren(children);
    }
  }, [currentView, children, lastView]);

  const triggerHaptic = () => {
    if (navigator.vibrate) navigator.vibrate(8);
  };

  const navItems = [
    { id: AppView.HOME, icon: Home, label: 'Início' },
    { id: AppView.MUSE, icon: Feather, label: 'Musa' },
    { id: AppView.SOUNDTRACK, icon: Waves, label: 'Trilha' },
    { id: AppView.MIRROR, icon: MessageSquare, label: 'Espelho' },
    { id: AppView.RITUALS, icon: Compass, label: 'Rituais' },
    { id: AppView.SETTINGS, icon: SettingsIcon, label: 'Ajustes' },
  ];

  return (
    <div className="w-screen h-screen flex flex-col bg-void text-starlight overflow-hidden transition-colors duration-1000">
      
      {/* Top Identity Anchor */}
      <header className="fixed top-0 left-0 w-full h-14 flex items-center justify-center z-[60] pointer-events-none">
        <div 
          className="pointer-events-auto cursor-pointer p-3 transition-transform active:scale-90"
          onClick={() => {
            triggerHaptic();
            onChangeView(AppView.HOME);
          }}
        >
          <InnerSpaceLogo />
        </div>
      </header>

      {/* Main content with space reserved for nav bar */}
      <main className="flex-1 relative overflow-hidden h-[calc(100vh-72px)]">
        <div 
          className={`w-full h-full transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) transform ${
            isTransitioning ? 'opacity-0 scale-[0.98] blur-xl translate-y-4' : 'opacity-100 scale-100 blur-0 translate-y-0'
          }`}
        >
          {displayChildren}
        </div>
      </main>

      {/* Global Introspection Bottom Bar (Fixed, Non-Pill) */}
      <nav className="h-[72px] w-full z-[130] bg-surface/80 dark:bg-zinc-950/80 backdrop-blur-3xl border-t border-mist/20 dark:border-white/10 px-4 py-1 flex items-center justify-around shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)]">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (currentView !== item.id) {
                  triggerHaptic();
                  onChangeView(item.id);
                }
              }}
              className={`relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-500 group ${
                isActive ? 'text-starlight' : 'text-ash/40 hover:text-starlight'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-500 ${isActive ? 'bg-starlight/5' : 'group-hover:bg-white/5'}`}>
                <Icon className={`w-5 h-5 transition-all duration-500 ${isActive ? 'stroke-[1.8px] drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'stroke-[1.2px]'}`} />
              </div>
              
              <span className={`text-[7px] md:text-[8px] uppercase tracking-[0.2em] mt-0.5 font-bold transition-all duration-500 ${
                isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
              }`}>
                {item.label}
              </span>

              {/* Active Indicator Bar */}
              <div className={`absolute top-0 w-1/2 h-[1px] bg-starlight transition-all duration-700 rounded-b-full shadow-[0_0_10px_rgba(255,255,255,0.5)] ${
                isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
              }`} />
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;