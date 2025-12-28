
import React, { useState } from 'react';
import { AppView } from '../types';

interface HomeProps {
  onChangeView: (view: AppView) => void;
}

const Home: React.FC<HomeProps> = ({ onChangeView }) => {
  const [scrollY, setScrollY] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollY(e.currentTarget.scrollTop);
  };

  return (
    <div 
      className="relative w-full h-full overflow-hidden"
      onScroll={handleScroll}
    >
      {/* Parallax Background Layer */}
      <div 
        className="fixed inset-0 w-full h-full -z-20 pointer-events-none select-none opacity-60 dark:opacity-40"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1483086437240-a41b86a28da2?q=80&w=2560&auto=format&fit=crop')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: `translateY(-${scrollY * 0.15}px)`, 
          willChange: 'transform'
        }}
      />

      <div className="fixed inset-0 w-full h-full bg-void/90 backdrop-blur-sm -z-10 pointer-events-none" />
      
      <div className="h-full flex flex-col items-center justify-center p-6 md:p-8">
        <div className="relative z-10 max-w-2xl w-full text-center space-y-8 md:space-y-12 animate-fade-in-up">
          
          <div className="space-y-2 md:space-y-4">
            <h1 className="text-5xl md:text-8xl font-display font-thin tracking-tighter text-starlight opacity-90">
              SOLO
            </h1>
            <p className="text-base md:text-xl text-ash font-light tracking-wide">
              O Espelho, Não a Muleta.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <button 
              onClick={() => onChangeView(AppView.MUSE)}
              className="group p-4 md:p-6 bg-surface/50 backdrop-blur-md border border-mist hover:bg-surface hover:border-starlight/20 rounded-xl text-left transition-all shadow-sm hover:shadow-md"
            >
              <h3 className="text-lg md:text-xl text-starlight font-light group-hover:translate-x-1 transition-transform">Musa Interior</h3>
              <p className="text-[10px] md:text-sm text-ash mt-1 md:mt-2">Transforme emoção em arte generativa.</p>
            </button>

            <button 
              onClick={() => onChangeView(AppView.SOUNDTRACK)}
              className="group p-4 md:p-6 bg-surface/50 backdrop-blur-md border border-mist hover:bg-surface hover:border-starlight/20 rounded-xl text-left transition-all shadow-sm hover:shadow-md"
            >
              <h3 className="text-lg md:text-xl text-starlight font-light group-hover:translate-x-1 transition-transform">Trilha Sonora</h3>
              <p className="text-[10px] md:text-sm text-ash mt-1 md:mt-2">Áudio biométrico para foco profundo.</p>
            </button>

             <button 
              onClick={() => onChangeView(AppView.MIRROR)}
              className="group p-4 md:p-6 bg-surface/50 backdrop-blur-md border border-mist hover:bg-surface hover:border-starlight/20 rounded-xl text-left transition-all shadow-sm hover:shadow-md"
            >
              <h3 className="text-lg md:text-xl text-starlight font-light group-hover:translate-x-1 transition-transform">Espelho Socrático</h3>
              <p className="text-[10px] md:text-sm text-ash mt-1 md:mt-2">Perguntas para encontrar suas próprias respostas.</p>
            </button>

            <button 
              onClick={() => onChangeView(AppView.RITUALS)}
              className="group p-4 md:p-6 bg-surface/50 backdrop-blur-md border border-mist hover:bg-surface hover:border-starlight/20 rounded-xl text-left transition-all shadow-sm hover:shadow-md"
            >
              <h3 className="text-lg md:text-xl text-starlight font-light group-hover:translate-x-1 transition-transform">Rituais do Ser</h3>
              <p className="text-[10px] md:text-sm text-ash mt-1 md:mt-2">Ações práticas para presença sagrada.</p>
            </button>

             <button 
              onClick={() => onChangeView(AppView.SETTINGS)}
              className="group p-4 md:p-6 bg-surface/50 backdrop-blur-md border border-mist hover:bg-surface hover:border-starlight/20 rounded-xl text-left transition-all shadow-sm hover:shadow-md md:col-span-2"
            >
              <h3 className="text-lg md:text-xl text-starlight font-light group-hover:translate-x-1 transition-transform">Ajustes Finos</h3>
              <p className="text-[10px] md:text-sm text-ash mt-1 md:mt-2">Configure sua experiência premium.</p>
            </button>
          </div>

        </div>
        
        <div className="mt-8 md:mt-16 text-[10px] text-ash font-mono opacity-70">
          v1.1.0 • Sistemas InnerSpace
        </div>
      </div>
    </div>
  );
};

export default Home;
