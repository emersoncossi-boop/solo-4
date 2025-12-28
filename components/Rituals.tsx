import React, { useState } from 'react';
import { MapPin, Eye, ZapOff, RefreshCw, ExternalLink, Loader2, Compass, CheckCircle2, ChevronRight } from 'lucide-react';
import { Ritual } from '../types.ts';
import { generateRitualSuggestion, findQuietPlaces } from '../services/geminiService.ts';

const Rituals: React.FC = () => {
  const [activeRitual, setActiveRitual] = useState<string | null>(null);
  const [generatedMission, setGeneratedMission] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [quietPlaces, setQuietPlaces] = useState<any[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const rituals: Ritual[] = [
    { id: 'geo', title: 'Espaço de Calma', description: 'Encontre refúgios de silêncio na metrópole.', duration: 'Urbe', type: 'movement' },
    { id: 'flight', title: 'Voo Cognitivo', description: 'Desconexão total para reorientar sua bússola.', duration: 'Ativo', type: 'disconnection' },
    { id: 'observe', title: 'Observação IA', description: 'Treine sua percepção do agora.', duration: '5 min', type: 'observation' }
  ];

  const handleGenerateMission = async () => {
    setIsGenerating(true);
    try {
      const mission = await generateRitualSuggestion();
      setGeneratedMission(mission);
    } catch (e) {
      setGeneratedMission("Feche os olhos por 30 segundos e sinta a temperatura do ar.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFetchQuietPlaces = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocalização não suportada.");
      return;
    }

    setIsLoadingPlaces(true);
    setLocationError(null);
    setQuietPlaces([]);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const places = await findQuietPlaces(position.coords.latitude, position.coords.longitude);
          setQuietPlaces(places);
          if (places.length === 0) setLocationError("Nenhum refúgio encontrado por perto.");
        } catch (e) {
          setLocationError("Erro ao buscar lugares.");
        } finally {
          setIsLoadingPlaces(false);
        }
      },
      () => {
        setLocationError("Permissão de localização negada.");
        setIsLoadingPlaces(false);
      }
    );
  };

  const renderActiveRitual = () => {
    switch (activeRitual) {
      case 'geo':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col items-center text-center gap-2 mb-8">
              <div className="p-3 rounded-full bg-blue-500/10 text-blue-400 mb-2">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-display font-light">Refúgios de Silêncio</h3>
              <p className="text-sm text-ash max-w-xs">Lugares próximos onde a alma pode descansar do ruído.</p>
            </div>

            <button 
              onClick={handleFetchQuietPlaces}
              disabled={isLoadingPlaces}
              className="w-full flex items-center justify-center gap-3 py-4 bg-starlight text-void rounded-2xl font-bold text-xs uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {isLoadingPlaces ? <Loader2 className="w-4 h-4 animate-spin" /> : <Compass className="w-4 h-4" />}
              Localizar Refúgios
            </button>

            {locationError && <p className="text-center text-[10px] text-red-400 uppercase tracking-widest">{locationError}</p>}

            <div className="space-y-3 pb-8">
              {quietPlaces.map((place, idx) => (
                <a 
                  key={idx} 
                  href={place.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-4 bg-surface/50 border border-mist hover:border-starlight/20 rounded-2xl transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-starlight group-hover:text-blue-400 transition-colors">{place.title}</h4>
                      <p className="text-xs text-ash line-clamp-2 leading-relaxed">{place.snippet}</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        );

      case 'observe':
        return (
          <div className="space-y-8 animate-fade-in flex flex-col items-center text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400 mb-2">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-display font-light">Missão de Presença</h3>
              <p className="text-sm text-ash max-w-xs">Um exercício curto para ancorar sua mente no presente.</p>
            </div>

            <div className="w-full p-8 bg-surface/30 border border-mist rounded-[2rem] min-h-[160px] flex items-center justify-center relative overflow-hidden group">
               <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
               {isGenerating ? (
                 <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
               ) : (
                 <p className="text-lg text-starlight font-light italic leading-relaxed animate-fade-in">
                   {generatedMission || "Clique para iniciar um novo ciclo de observação."}
                 </p>
               )}
            </div>

            <button 
              onClick={handleGenerateMission}
              disabled={isGenerating}
              className="flex items-center gap-3 px-8 py-4 bg-starlight text-void rounded-full font-bold text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              {generatedMission ? 'Novo Ritual' : 'Iniciar'}
            </button>
          </div>
        );

      case 'flight':
        return (
          <div className="space-y-8 animate-fade-in flex flex-col items-center text-center">
             <div className="flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-purple-500/10 text-purple-400 mb-2">
                <ZapOff className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-display font-light">Voo Cognitivo</h3>
              <p className="text-sm text-ash max-w-xs">Desligue as notificações do mundo. Ative o modo avião por 15 minutos.</p>
            </div>

            <div className="space-y-6 py-6">
              {[
                "Ative o 'Não Perturbe' ou Modo Avião.",
                "Coloque o dispositivo longe do seu alcance visual.",
                "Foque em uma tarefa única ou apenas no silêncio.",
                "Ao terminar, registre um insight no Espelho."
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-4 text-left p-4 bg-surface/20 rounded-2xl border border-mist/10">
                   <div className="w-8 h-8 rounded-full bg-starlight/5 flex items-center justify-center text-[10px] font-bold shrink-0">{i+1}</div>
                   <p className="text-sm text-ash leading-snug">{step}</p>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setActiveRitual(null)}
              className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white font-bold transition-all"
            >
              Voltar aos Rituais
            </button>
          </div>
        );

      default:
        return (
          <div className="space-y-4 animate-fade-in-up">
            <header className="mb-10 text-center md:text-left">
              <h2 className="text-3xl font-display font-light text-starlight mb-2">Sistemas de Reencontro</h2>
              <p className="text-ash font-light text-sm">Ações práticas para transformar a solidão urbana em presença sagrada.</p>
            </header>

            <div className="grid gap-3">
              {rituals.map((ritual) => (
                <button
                  key={ritual.id}
                  onClick={() => setActiveRitual(ritual.id)}
                  className="group flex items-center p-5 bg-surface/40 hover:bg-surface border border-mist hover:border-starlight/30 rounded-[1.8rem] transition-all text-left"
                >
                  <div className={`p-3.5 rounded-2xl mr-5 transition-all ${
                    ritual.type === 'movement' ? 'bg-blue-500/5 text-blue-500' :
                    ritual.type === 'observation' ? 'bg-emerald-500/5 text-emerald-500' :
                    'bg-purple-500/5 text-purple-500'
                  }`}>
                    {ritual.type === 'movement' ? <MapPin className="w-5 h-5" /> : 
                     ritual.type === 'observation' ? <Eye className="w-5 h-5" /> : 
                     <ZapOff className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-0.5">
                      <h3 className="text-base font-medium text-starlight">{ritual.title}</h3>
                      <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">{ritual.duration}</span>
                    </div>
                    <p className="text-xs text-ash leading-relaxed">{ritual.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-starlight group-hover:translate-x-1 transition-all ml-4" />
                </button>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full bg-void flex flex-col">
      <div className="flex-1 overflow-y-auto px-6 py-10 md:px-24 scrollbar-hide">
        <div className="max-w-xl mx-auto pb-10">
          {activeRitual ? (
             <div className="animate-fade-in">
               <button 
                 onClick={() => setActiveRitual(null)} 
                 className="flex items-center gap-2 text-zinc-500 hover:text-starlight transition-colors mb-8 text-[10px] font-bold uppercase tracking-widest"
               >
                 <Compass className="w-3 h-3" /> Catálogo
               </button>
               {renderActiveRitual()}
             </div>
          ) : (
            renderActiveRitual()
          )}
        </div>
      </div>
    </div>
  );
};

export default Rituals;