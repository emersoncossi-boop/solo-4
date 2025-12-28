import { GoogleGenAI, Chat, GenerateContentResponse, Type } from "@google/genai";
import { EmotionAnalysis, MuseEntry, Message, MuseTheme, MuseStyle } from '../types.ts';

export const getGeminiChat = (): Chat | null => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `Você é o "Espelho Socrático" do InnerSpace. 
  Sua essência é a clareza radical, a brevidade empática e a provocação intelectual.
  
  REGRAS DE OURO:
  - NUNCA dê conselhos ou soluções.
  - NUNCA use clichês motivacionais ou validações vazias.
  - RESPONDA SEMPRE em formato JSON estrito.
  - 'reflexao': Uma frase curtíssima (máximo 10 palavras) que apenas ecoa o núcleo do que o usuário expressou.
  - 'pergunta': Uma única pergunta socrática, incisiva e aberta, que devolva o peso da descoberta ao usuário.
  
  OBJETIVO: Ser um espelho perfeitamente polido que reflete a verdade do usuário, forçando-o a olhar para dentro sem distrações.`;

  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      temperature: 0.7,
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          reflexao: { 
            type: Type.STRING, 
            description: "Uma eco breve da essência do usuário." 
          },
          pergunta: { 
            type: Type.STRING, 
            description: "A pergunta socrática pura e incisiva." 
          }
        },
        required: ["reflexao", "pergunta"]
      }
    },
  });
};

export const findQuietPlaces = async (lat: number, lng: number): Promise<any[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Quais são os lugares mais silenciosos e propícios para meditação ou leitura num raio de 5km daqui?",
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: { latitude: lat, longitude: lng }
          }
        }
      },
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return chunks.map((chunk: any) => ({
      title: chunk.maps?.title || "Espaço de Calma",
      uri: chunk.maps?.uri || "#",
      snippet: chunk.maps?.placeAnswerSources?.[0]?.reviewSnippets?.[0] || "Um refúgio para sua mente."
    })).filter((item: any) => item.uri !== "#");
  } catch (error) {
    console.error("Erro ao buscar lugares:", error);
    return [];
  }
};

export const generateMirrorReflection = async (history: Message[]): Promise<{ summary: string, keywords: {text: string, weight: number}[], image: string | null }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const context = history.map(m => `${m.role}: ${m.content}`).join('\n');
  
  try {
    const summaryResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise emocional desta conversa e sintetize em UMA frase curta. Extraia 10 palavras-chave.
      CONVERSA:\n${context}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: { 
            summary: { type: Type.STRING },
            keywords: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT, 
                properties: { 
                  text: { type: Type.STRING }, 
                  weight: { type: Type.NUMBER } 
                } 
              } 
            },
            imagePrompt: { type: Type.STRING }
          },
          required: ['summary', 'keywords', 'imagePrompt']
        }
      }
    });
    
    const { summary, keywords, imagePrompt } = JSON.parse(summaryResponse.text || '{}');

    const imageResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `Peaceful minimalist art: ${imagePrompt}` }] },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });

    let imageUrl = null;
    if (imageResponse.candidates?.[0]?.content?.parts) {
      for (const part of imageResponse.candidates[0].content.parts) {
        if (part.inlineData) imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }

    return { summary, keywords: keywords || [], image: imageUrl };
  } catch (e) {
    return { summary: "Sua verdade reside no silêncio.", keywords: [], image: null };
  }
};

export const analyzeEmotionalState = async (text: string, history: MuseEntry[] = []): Promise<EmotionAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise emocional: "${text}"`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: { label: { type: Type.STRING }, color: { type: Type.STRING }, intensity: { type: Type.NUMBER }, valence: { type: Type.NUMBER } },
          required: ['label', 'color', 'intensity', 'valence'],
        },
      },
    });
    const result = JSON.parse(response.text || '{}');
    return { label: result.label || 'Indefinido', color: result.color || '#6b7280', intensity: result.intensity ?? 0.5, valence: result.valence ?? 0 };
  } catch (e) { return { label: 'Serenidade', color: '#6b7280', intensity: 0.1, valence: 0 }; }
};

export const generateMuseImage = async (
  text: string, 
  emotion: EmotionAnalysis, 
  theme: MuseTheme = MuseTheme.NEURAL, 
  style: MuseStyle = MuseStyle.NEURAL,
  customPrompt?: string
): Promise<{ imageUrl: string | null, visualPrompt: string | null }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    let visualPrompt = customPrompt;
    
    if (!visualPrompt) {
      const promptGenResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Visual prompt: "${text}". Theme: ${theme}. Style: ${style}.`,
      });
      visualPrompt = promptGenResponse.text?.trim() || `Abstract art for "${emotion.label}".`;
    }
    
    const imageResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', 
      contents: { parts: [{ text: visualPrompt }] },
      config: { imageConfig: { aspectRatio: "1:1" } },
    });
    
    let imageUrl = null;
    if (imageResponse.candidates?.[0]?.content?.parts) {
      for (const part of imageResponse.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          break;
        }
      }
    }
    return { imageUrl, visualPrompt };
  } catch (e) { return { imageUrl: null, visualPrompt: null }; }
};

export const generateSocraticSuggestions = async (history: Message[]): Promise<string[]> => { return []; };
export const generateMuseSuggestions = async (text: string, emotion: EmotionAnalysis): Promise<string[]> => { return []; };
export const generateRitualSuggestion = async (): Promise<string> => { return "Observe sua respiração por 10 ciclos sem tentar mudá-la."; };