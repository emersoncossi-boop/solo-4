
import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Sparkles, Loader2, Disc, Focus, X, Mic, MicOff, ChevronDown, AlertCircle, RefreshCw, Save, Archive, Share2, Check, MoreHorizontal } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { getGeminiChat, generateMirrorReflection } from '../services/geminiService.ts';
import { Message } from '../types.ts';

interface ReflectionData {
  summary: string;
  keywords: { text: string; weight: number }[];
  image: string | null;
}

// Funções Auxiliares de Áudio e Base64
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const SocraticMirrors: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'model',
      content: "Eu sou um espelho, não um conselheiro. Diga-me o que pulsa em seu interior e eu o ajudarei a examinar.",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReflecting, setIsReflecting] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isVoiceOverlayOpen, setIsVoiceOverlayOpen] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [reflection, setReflection] = useState<ReflectionData | null>(null);
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState(0);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  
  const chatSessionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const liveSessionRef = useRef<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const activeChunksCountRef = useRef<number>(0);

  const userMessagesCount = messages.filter(m => m.role === 'user').length;

  useEffect(() => {
    chatSessionRef.current = getGeminiChat();
    return () => stopVoiceSession();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowActionMenu(false);
      }
    };
    if (showActionMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showActionMenu]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    try {
      if (!chatSessionRef.current) chatSessionRef.current = getGeminiChat();
      const result = await chatSessionRef.current.sendMessage({ message: userMsg.content });
      
      let processedContent = "";
      try {
        const jsonResponse = JSON.parse(result.text || '{}');
        if (jsonResponse.reflexao && jsonResponse.pergunta) {
          processedContent = `${jsonResponse.reflexao}\n\n${jsonResponse.pergunta}`;
        } else {
          processedContent = result.text || "O espelho permanece em silêncio.";
        }
      } catch (parseError) {
        processedContent = result.text || "O espelho oscilou. Sua verdade é complexa.";
      }

      const modelMsg: Message = { id: Date.now().toString(), role: 'model', content: processedContent, timestamp: Date.now() };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error("Erro no chat:", error);
      setMessages(prev => [...prev, { id: 'err-' + Date.now(), role: 'model', content: "O reflexo oscilou. Pode repetir?", timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConversation = () => {
    if (messages.length <= 1) return;
    const sessionData = JSON.stringify(messages);
    localStorage.setItem(`mirror_session_${Date.now()}`, sessionData);
    showActionFeedback("Sessão Salva");
    setShowActionMenu(false);
  };

  const handleArchiveConversation = () => {
    if (messages.length <= 1) return;
    const archives = JSON.parse(localStorage.getItem('mirror_archives') || '[]');
    archives.unshift({
      id: Date.now().toString(),
      timestamp: Date.now(),
      messages: messages,
      reflection: reflection
    });
    localStorage.setItem('mirror_archives', JSON.stringify(archives));
    showActionFeedback("Arquivado");
    setMessages([{
      id: 'init',
      role: 'model',
      content: "Sua conversa anterior foi arquivada. O que pulsa em seu interior agora?",
      timestamp: Date.now()
    }]);
    setReflection(null);
    setShowActionMenu(false);
  };

  const handleShareConversation = async () => {
    const text = messages.map(m => `${m.role === 'user' ? 'Eu' : 'Espelho'}: ${m.content}`).join('\n\n');
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'InnerSpace Reflection',
          text: `Minha conversa com o Espelho Socrático:\n\n${text}`,
        });
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      navigator.clipboard.writeText(text);
      showActionFeedback("Copiado");
    }
    setShowActionMenu(false);
  };

  const showActionFeedback = (text: string) => {
    setShowFeedback(text);
    setTimeout(() => setShowFeedback(null), 2000);
  };

  const startVoiceSession = async () => {
    try {
      setVoiceError(null);
      setIsVoiceActive(true);
      setIsVoiceOverlayOpen(true);
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let currentInputTranscription = '';
      let currentOutputTranscription = '';

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            const inCtx = inputAudioContextRef.current!;
            const outCtx = outputAudioContextRef.current!;
            
            const source = inCtx.createMediaStreamSource(stream);
            const scriptProcessor = inCtx.createScriptProcessor(4096, 1, 1);
            const inAnalyser = inCtx.createAnalyser();
            inAnalyser.fftSize = 256;
            inputAnalyserRef.current = inAnalyser;
            scriptProcessorRef.current = scriptProcessor;

            const outAnalyser = outCtx.createAnalyser();
            outAnalyser.fftSize = 256;
            outputAnalyserRef.current = outAnalyser;
            outAnalyser.connect(outCtx.destination);

            const updateVolume = () => {
              const analyser = activeChunksCountRef.current > 0 ? outputAnalyserRef.current : inputAnalyserRef.current;
              if (!analyser) {
                animationFrameRef.current = requestAnimationFrame(updateVolume);
                return;
              }
              const dataArray = new Uint8Array(analyser.frequencyBinCount);
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
              setVoiceVolume(sum / dataArray.length / 128); 
              animationFrameRef.current = requestAnimationFrame(updateVolume);
            };
            updateVolume();

            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(inAnalyser);
            source.connect(scriptProcessor);
            scriptProcessor.connect(inCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              currentOutputTranscription += message.serverContent.outputTranscription.text;
            } else if (message.serverContent?.inputTranscription) {
              currentInputTranscription += message.serverContent.inputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
              if (currentInputTranscription) {
                setMessages(prev => [...prev, { id: 'vi-' + Date.now(), role: 'user', content: currentInputTranscription, timestamp: Date.now() }]);
              }
              if (currentOutputTranscription) {
                setMessages(prev => [...prev, { id: 'vo-' + Date.now(), role: 'model', content: currentOutputTranscription, timestamp: Date.now() }]);
              }
              currentInputTranscription = '';
              currentOutputTranscription = '';
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current && outputAnalyserRef.current) {
              const ctx = outputAudioContextRef.current;
              const analyser = outputAnalyserRef.current;
              
              if (ctx.state === 'suspended') await ctx.resume();

              try {
                const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(analyser);
                
                const now = ctx.currentTime;
                if (nextStartTimeRef.current < now) {
                  nextStartTimeRef.current = now;
                }
                
                const startAt = nextStartTimeRef.current;
                source.start(startAt);
                nextStartTimeRef.current += audioBuffer.duration;
                
                activeChunksCountRef.current++;
                setIsAISpeaking(true);
                audioSourcesRef.current.add(source);

                source.onended = () => {
                  audioSourcesRef.current.delete(source);
                  activeChunksCountRef.current--;
                  
                  if (activeChunksCountRef.current <= 0) {
                    activeChunksCountRef.current = 0;
                    setIsAISpeaking(false);
                    if (ctx.currentTime >= nextStartTimeRef.current) {
                        nextStartTimeRef.current = 0;
                    }
                  }
                };
              } catch (decErr) {
                console.error("Erro na decodificação:", decErr);
              }
            }

            if (message.serverContent?.interrupted) stopAllAudioPlayback();
          },
          onerror: (e) => {
            console.error('Erro Live API:', e);
            setVoiceError("O vácuo está instável no momento. Tente novamente em instantes.");
          },
          onclose: (e) => {
            console.log('Sessão encerrada', e);
            if (!e.wasClean && !voiceError) {
              setVoiceError("Conexão interrompida. O espelho precisa de um momento.");
            }
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: 'Você é o Espelho Socrático. Responda de forma curta, profunda e questionadora. Fale como um ser humano calmo e introspectivo. Use pausas naturais.',
        }
      });
      liveSessionRef.current = await sessionPromise;
    } catch (e: any) {
      console.error('Falha ao iniciar modo de voz:', e);
      setIsVoiceActive(false);
      setVoiceError("O serviço está temporariamente indisponível. Aguarde a sintonização.");
    }
  };

  const stopAllAudioPlayback = () => {
    audioSourcesRef.current.forEach(s => { 
      try { 
        s.onended = null;
        s.stop(); 
        s.disconnect();
      } catch (e) {} 
    });
    audioSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    activeChunksCountRef.current = 0;
    setIsAISpeaking(false);
  };

  const stopVoiceSession = () => {
    setIsVoiceActive(false);
    setIsVoiceOverlayOpen(false);
    setVoiceVolume(0);
    setVoiceError(null);
    stopAllAudioPlayback();
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (liveSessionRef.current) {
      try { liveSessionRef.current.close(); } catch(e) {}
      liveSessionRef.current = null;
    }
    
    if (scriptProcessorRef.current) {
      try { scriptProcessorRef.current.disconnect(); } catch(e) {}
      scriptProcessorRef.current = null;
    }
    
    if (inputAudioContextRef.current) {
      const ctx = inputAudioContextRef.current;
      inputAudioContextRef.current = null;
      if (ctx.state !== 'closed') {
        ctx.close().catch(() => {});
      }
    }
    
    if (outputAudioContextRef.current) {
      const ctx = outputAudioContextRef.current;
      outputAudioContextRef.current = null;
      if (ctx.state !== 'closed') {
        ctx.close().catch(() => {});
      }
    }
  };

  const handleCrystallize = async () => {
    if (isLoading || isReflecting) return;
    setIsReflecting(true);
    try {
      const data = await generateMirrorReflection(messages);
      setReflection(data);
      setShowReflectionModal(true);
    } catch (error) {
      console.error("Erro ao cristalizar:", error);
    } finally {
      setIsReflecting(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#09090b] text-[#f4f4f5] overflow-hidden relative">
      {/* Immersive Voice Overlay */}
      {isVoiceOverlayOpen && (
        <div className="fixed inset-0 z-[150] bg-black flex flex-col items-center justify-between py-16 animate-fade-in overflow-hidden">
          <div className={`absolute inset-0 transition-opacity duration-[2000ms] ${isAISpeaking ? 'opacity-30' : 'opacity-15'}`} 
               style={{ 
                 background: `radial-gradient(circle at center, ${voiceError ? '#ef4444' : (isAISpeaking ? '#8b5cf6' : '#4f46e5')} 0%, transparent 70%)`,
                 filter: 'blur(120px)'
               }} 
          />
          
          <header className="relative z-10 w-full px-10 flex justify-end">
            <button 
              onClick={stopVoiceSession}
              className="p-4 rounded-full bg-white/[0.03] border border-white/10 hover:bg-white/10 hover:border-white/20 text-zinc-500 hover:text-white transition-all backdrop-blur-xl"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
          </header>

          <div className="relative flex flex-col items-center justify-center">
            {voiceError ? (
              <div className="flex flex-col items-center gap-6 animate-fade-in text-center px-8">
                <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-2">
                  <AlertCircle className="w-10 h-10 text-red-500/60" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-zinc-400 font-light text-lg">Sinal Oscilante</h4>
                  <p className="text-zinc-600 text-xs max-w-xs leading-relaxed uppercase tracking-widest">{voiceError}</p>
                </div>
                <button 
                  onClick={startVoiceSession}
                  className="mt-4 flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all"
                >
                  <RefreshCw className="w-3 h-3" /> Tentar Sintonizar
                </button>
              </div>
            ) : (
              <div className="relative flex items-center justify-center scale-100 md:scale-125">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {Array.from({ length: 48 }).map((_, i) => (
                    <div 
                      key={i}
                      className="absolute w-[0.5px] transition-all duration-300 origin-bottom"
                      style={{ 
                        height: '500px',
                        background: `linear-gradient(to top, transparent, ${isAISpeaking ? '#a78bfa33' : '#6366f133'}, transparent)`,
                        transform: `rotate(${i * (360/48)}deg) translateY(-50%) scaleY(${0.05 + voiceVolume * 2.5})`,
                        opacity: 0.1 + voiceVolume * 0.6,
                      }}
                    />
                  ))}
                </div>

                <div 
                  className={`relative w-48 h-48 rounded-full border-[0.5px] backdrop-blur-[80px] flex items-center justify-center shadow-2xl transition-all duration-[1500ms] ease-out ${
                    isAISpeaking 
                      ? 'border-violet-400/50 bg-gradient-to-tr from-violet-600/30 via-indigo-600/20 to-transparent shadow-[0_0_80px_-20px_rgba(139,92,246,0.5)] scale-[1.02]' 
                      : 'border-indigo-500/10 bg-white/[0.02] shadow-none'
                  }`}
                  style={{ transform: `scale(${1 + voiceVolume * 0.15})` }}
                >
                  {isAISpeaking && (
                    <div className="absolute inset-0 rounded-full animate-pulse-subtle bg-violet-500/5 blur-xl pointer-events-none" />
                  )}
                  <div 
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-1000 ${
                      isAISpeaking 
                        ? 'bg-violet-400 scale-[2.5] shadow-[0_0_25px_#a78bfa]' 
                        : 'bg-indigo-400 scale-[1.8] shadow-[0_0_15px_#818cf8]'
                    }`} 
                  />
                  <div className="absolute inset-0 rounded-full border border-white/5 animate-spin-slow opacity-20" />
                </div>

                {[0.1, 0.3, 0.5].map((delay, i) => (
                  <div 
                    key={i}
                    className={`absolute rounded-full border-[0.5px] transition-all duration-[2s] ease-out ${
                      isAISpeaking ? 'border-violet-500/15' : 'border-indigo-500/10'
                    }`}
                    style={{
                      width: `${220 + i * 110}px`,
                      height: `${220 + i * 110}px`,
                      transform: `scale(${1 + voiceVolume * (0.3 + i * 0.2)})`,
                      opacity: 0.08 - (i * 0.02) + (voiceVolume * 0.1)
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="relative z-10 text-center space-y-10 animate-fade-in-up">
            {!voiceError && (
              <>
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-[1em] text-zinc-500 ml-[1em]">
                    {isAISpeaking ? 'Neural Mirror' : 'Listening Truth'}
                  </h3>
                  <p className="text-sm font-light italic text-zinc-400 opacity-60 max-w-[280px] mx-auto leading-relaxed">
                    {isAISpeaking 
                      ? "Sua verdade sendo refletida pelo vácuo inteligente." 
                      : "O silêncio é a tela onde sua voz desenha o ser."}
                  </p>
                </div>
                <div className="flex gap-1.5 items-end justify-center h-10">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <div 
                      key={i}
                      className={`w-[1px] rounded-full transition-all duration-150 ${isAISpeaking ? 'bg-violet-500/40' : 'bg-indigo-500/40'}`}
                      style={{ 
                        height: `${10 + Math.random() * (voiceVolume * 220)}%`,
                        opacity: 0.1 + voiceVolume 
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#09090b]/80 backdrop-blur-xl z-[140] relative">
        <div className="flex items-center gap-3">
          {(isVoiceActive || isAISpeaking) && (
             <div className="flex gap-1 items-center animate-pulse">
                <div className={`w-0.5 h-3 rounded-full ${isAISpeaking ? 'bg-white' : 'bg-zinc-600'}`} />
                <div className={`w-0.5 h-5 rounded-full ${isAISpeaking ? 'bg-white' : 'bg-zinc-600'}`} />
             </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Disc className={`w-3 h-3 ${isLoading || isReflecting || isAISpeaking ? 'animate-spin text-white' : 'text-zinc-800'}`} />
          <h2 className="text-[10px] font-display font-bold tracking-[0.5em] text-zinc-500 uppercase">Espelho Socrático</h2>
        </div>

        <div className="flex items-center gap-4">
          {userMessagesCount >= 1 && (
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setShowActionMenu(!showActionMenu)}
                className={`p-2 rounded-full border transition-all ${showActionMenu ? 'bg-white/10 border-white/30 text-white' : 'border-white/5 text-zinc-600 hover:text-white'}`}
                title="Ações"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              
              {showActionMenu && (
                <div className="absolute right-0 top-12 w-48 bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-1.5 shadow-2xl animate-zoom-in-suttle z-[210]">
                  <button 
                    onClick={handleSaveConversation}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest"
                  >
                    <Save className="w-4 h-4" /> Salvar Sessão
                  </button>
                  <button 
                    onClick={handleArchiveConversation}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest"
                  >
                    <Archive className="w-4 h-4" /> Arquivar
                  </button>
                  <button 
                    onClick={handleShareConversation}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest"
                  >
                    <Share2 className="w-4 h-4" /> Compartilhar
                  </button>
                </div>
              )}
            </div>
          )}

          {userMessagesCount >= 3 ? (
            <button onClick={handleCrystallize} disabled={isReflecting} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-500 hover:text-white transition-all text-[9px] font-bold uppercase tracking-widest disabled:opacity-50">
              {isReflecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Focus className="w-3 h-3" />}
              {isReflecting ? 'Cristalizando...' : 'Cristalizar'}
            </button>
          ) : <div className="w-10" />}
        </div>

        {/* Action Feedback Toast */}
        {showFeedback && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-white/10 rounded-full shadow-2xl animate-slide-up z-[200]">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">{showFeedback}</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Conversation Stream */}
        <div className="flex-1 overflow-y-auto px-4 md:px-24 lg:px-64 py-8 space-y-10 scrollbar-hide">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex w-full animate-fade-in-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[80%] flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar Personalizado */}
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border transition-all ${msg.role === 'user' ? 'bg-[#0a0a0c] border-zinc-800/50 shadow-inner' : 'bg-gradient-to-br from-violet-900/20 to-indigo-900/30 border-violet-500/20 shadow-[0_0_15px_-5px_rgba(139,92,246,0.3)]'}`}>
                  {msg.role === 'user' ? (
                    <User className="w-4 h-4 text-zinc-700" strokeWidth={1.5} />
                  ) : (
                    <div className="relative flex items-center justify-center transform scale-90 rotate-12">
                      <Disc className="w-5 h-5 text-violet-500 opacity-60 absolute animate-pulse" />
                      <Disc className="w-4 h-4 text-indigo-400 opacity-90 relative" />
                    </div>
                  )}
                </div>
                
                <div className={`flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {/* Card de Mensagem Tema Escuro */}
                  <div className={`p-4 md:p-5 rounded-3xl border transition-all duration-300 ${
                    msg.role === 'user' 
                      ? 'bg-black/40 border-white/5 text-zinc-300 rounded-tr-none shadow-2xl backdrop-blur-sm' 
                      : 'bg-white/[0.02] border-white/5 text-zinc-400 italic font-light rounded-tl-none'
                  }`}>
                    <p className="text-sm md:text-base leading-relaxed font-light whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  <span className="text-[8px] text-zinc-700 uppercase tracking-widest font-bold">{msg.role === 'user' ? 'Consciência' : 'Reflexo'}</span>
                </div>
              </div>
            </div>
          ))}
          {(isLoading || (isAISpeaking && !isVoiceOverlayOpen)) && (
            <div className="flex justify-start w-full animate-fade-in">
              <div className="flex gap-4 max-w-[70%]">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-900/20 to-indigo-900/30 border border-violet-500/20 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin text-violet-400 opacity-40" />
                  </div>
                  <div className="flex gap-1.5 p-4 rounded-2xl bg-white/[0.01] border border-white/5 items-center">
                    <div className="w-1 h-1 rounded-full bg-zinc-800 animate-bounce" />
                    <div className="w-1 h-1 rounded-full bg-zinc-800 animate-bounce [animation-delay:0.2s]" />
                  </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-6 md:px-32 lg:px-64 bg-[#09090b]/95 border-t border-white/5 shrink-0 z-[135]">
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
            <div className="relative flex items-center gap-3">
                <button 
                    onClick={isVoiceActive ? stopVoiceSession : startVoiceSession}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl border ${
                        isVoiceActive ? 'bg-white/10 border-white/40 text-white' : 'bg-zinc-900 border-white/5 text-zinc-600 hover:text-white'
                    }`}
                >
                    {isVoiceActive ? <Mic className="w-6 h-6 animate-pulse" /> : <MicOff className="w-6 h-6" />}
                </button>

                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Exponha seu pensamento..."
                    className="flex-1 bg-zinc-900/30 border border-white/10 rounded-full px-7 py-4 text-sm text-white focus:outline-none focus:border-zinc-500 transition-all"
                />

                <button 
                  onClick={handleSend} 
                  disabled={!input.trim() || isLoading} 
                  className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-10"
                >
                  <Send className="w-5 h-5 ml-0.5" />
                </button>
            </div>
        </div>
      </div>

      {/* Reflection Modal */}
      {showReflectionModal && reflection && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl animate-fade-in" onClick={() => setShowReflectionModal(false)} />
          <div className="relative w-full max-w-4xl h-full max-h-[85vh] bg-[#09090b] border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col animate-zoom-in-suttle">
            <button onClick={() => setShowReflectionModal(false)} className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 z-50"><X className="w-5 h-5 text-zinc-600" /></button>
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              <div className="flex-1 flex flex-col items-center justify-center p-10 border-b md:border-b-0 md:border-r border-white/5">
                {reflection.image ? <img src={reflection.image} alt="Reflexo" className="w-64 h-64 md:w-80 md:h-80 object-cover rounded-3xl border border-white/10 shadow-2xl grayscale" /> : <div className="w-64 h-64 md:w-80 md:h-80 rounded-3xl bg-zinc-900 border border-white/10 flex items-center justify-center italic text-zinc-700">Visão pendente...</div>}
                <div className="mt-8 text-center max-w-sm"><p className="text-lg md:text-xl text-white font-display font-light italic">"{reflection.summary}"</p></div>
              </div>
              <div className="w-full md:w-80 flex flex-col p-8 bg-zinc-950/50">
                <div className="flex-1">
                  <span className="text-[8px] text-zinc-600 uppercase tracking-widest block mb-6">Frequências Mentais</span>
                  <div className="flex flex-wrap gap-2">
                    {reflection.keywords.map((kw, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-full border border-white/5 bg-white/[0.02] text-zinc-500 text-[10px]">{kw.text}</span>
                    ))}
                  </div>
                </div>
                
                <div className="mt-auto flex gap-3">
                  <button 
                    onClick={handleShareConversation}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest font-bold hover:bg-white/10 transition-all"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Compartilhar
                  </button>
                  <button 
                    onClick={handleArchiveConversation}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white text-black text-[10px] uppercase tracking-widest font-bold hover:scale-[1.02] transition-all"
                  >
                    <Archive className="w-3.5 h-3.5" /> Arquivar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocraticMirrors;
