import React, { useState, useEffect } from 'react';
import { Fingerprint, ArrowRight, Loader2, Mail, Lock } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

const SoloLogo = () => (
  <div className="flex justify-center mb-10 select-none">
    <h1 className="text-6xl md:text-8xl font-display font-thin tracking-tighter text-starlight opacity-90">
      SOLO
    </h1>
  </div>
);

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBiometric, setIsBiometric] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulação de autenticação premium
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 2000);
  };

  const handleBiometric = () => {
    setIsBiometric(true);
    setTimeout(() => {
      setIsBiometric(false);
      onLogin();
    }, 1500);
  };

  return (
    <div className="relative w-screen h-screen flex items-center justify-center bg-[#050505] overflow-hidden p-6">
      {/* Background Dinâmico (Nebula) */}
      <div 
        className="absolute inset-0 opacity-40 transition-all duration-1000 ease-out pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(60, 60, 80, 0.3) 0%, transparent 50%)`,
        }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-900/10 rounded-full blur-[160px] animate-pulse-subtle pointer-events-none" />

      {/* Card de Login */}
      <div className="relative z-10 w-full max-w-md animate-zoom-in-suttle">
        <div className="bg-zinc-900/40 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-8 md:p-12 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]">
          
          <div className="text-center space-y-3 mb-10">
            <SoloLogo />
            <p className="text-[10px] uppercase tracking-[0.5em] text-zinc-500 font-bold ml-[0.5em]">Identificação de Consciência</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-1.5 group">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-zinc-400 transition-colors" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Assinatura (E-mail)"
                  className="w-full bg-white/[0.02] border border-white/5 focus:border-white/20 rounded-2xl px-12 py-4 text-sm text-white placeholder:text-zinc-700 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 group">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-zinc-400 transition-colors" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Chave de Acesso"
                  className="w-full bg-white/[0.02] border border-white/5 focus:border-white/20 rounded-2xl px-12 py-4 text-sm text-white placeholder:text-zinc-700 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading || isBiometric}
              className="w-full bg-white text-black py-4 rounded-2xl font-bold text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 mt-8 shadow-2xl"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  Entrar no Santuário
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-white/5 text-center">
            <button 
              onClick={handleBiometric}
              disabled={isLoading || isBiometric}
              className="group flex flex-col items-center gap-3 mx-auto transition-all"
            >
              <div className={`p-4 rounded-full border border-white/10 group-hover:border-white/30 transition-all ${isBiometric ? 'bg-white text-black scale-90' : 'bg-white/5 text-zinc-500'}`}>
                {isBiometric ? <Loader2 className="w-6 h-6 animate-spin" /> : <Fingerprint className="w-6 h-6" />}
              </div>
              <span className="text-[8px] uppercase tracking-[0.4em] font-bold text-zinc-600 group-hover:text-zinc-400">Biometria Ativa</span>
            </button>
          </div>
        </div>

        <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <button className="text-[9px] uppercase tracking-widest text-zinc-700 hover:text-zinc-400 transition-colors font-bold">
            Esqueceu sua chave de acesso?
          </button>
        </div>
      </div>

      {/* Rodapé Legal Minimalista */}
      <footer className="absolute bottom-8 left-0 w-full text-center px-6">
        <p className="text-[7px] text-zinc-800 uppercase tracking-[0.6em] font-bold">
          SOLO SYSTEM • PRIVACIDADE RADICAL • INNERSPACE ENCRYPTED
        </p>
      </footer>
    </div>
  );
};

export default Login;