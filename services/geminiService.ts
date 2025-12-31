
import { GoogleGenAI, Chat, Type } from "@google/genai";
import { EmotionAnalysis, Message, MuseTheme, MuseStyle } from '../types.ts';

export const getGeminiChat = (): Chat | null => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `Você é o "Espelho Socrático". Sua essência é a clareza radical e a provocação intelectual.
  REGRAS:
  - NUNCA dê conselhos.
  - RESPONDA EM JSON: {"reflexao": "eco do usuário", "pergunta": "pergunta incisiva"}.`;

  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      temperature: 0.7,
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          reflexao: { type: Type.STRING },
          pergunta: { type: Type.STRING }
        },
        required: ["reflexao", "pergunta"]
      }
    },
  });
};

export const generateMirrorReflection = async (history: Message[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const context = history.map(m => `${m.role}: ${m.content}`).join('\n');
  
  const summaryResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analise emocional e sintetize em uma frase. Extraia 10 keywords. CONVERSA:\n${context}`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: { 
          summary: { type: Type.STRING },
          keywords: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { text: { type: Type.STRING }, weight: { type: Type.NUMBER } } } },
          imagePrompt: { type: Type.STRING }
        },
        required: ['summary', 'keywords', 'imagePrompt']
      }
    }
  });
  
  const data = JSON.parse(summaryResponse.text || '{}');
  const imageResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: `Minimalist art: ${data.imagePrompt}` }] },
  });

  let imageUrl = null;
  const parts = imageResponse.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData) imageUrl = `data:image/png;base64,${part.inlineData.data}`;
  }

  return { ...data, image: imageUrl };
};

export const analyzeEmotionalState = async (text: string): Promise<EmotionAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
  return JSON.parse(response.text || '{}');
};

export const generateMuseImage = async (text: string, emotion: EmotionAnalysis, theme: MuseTheme, style: MuseStyle) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Abstract representation of ${emotion.label}. Context: ${text}. Theme: ${theme}. Style: ${style}.`;
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
  });
  let imageUrl = null;
  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData) imageUrl = `data:image/png;base64,${part.inlineData.data}`;
  }
  return { imageUrl, visualPrompt: prompt };
};

export const findQuietPlaces = async (lat: number, lng: number) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Lugar silencioso para meditar num raio de 5km.",
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: { retrievalConfig: { latLng: { latitude: lat, longitude: lng } } }
    },
  });
  return (response.candidates?.[0]?.groundingMetadata?.groundingChunks || []).map((c: any) => ({
    title: c.maps?.title,
    uri: c.maps?.uri,
    snippet: c.maps?.placeAnswerSources?.[0]?.reviewSnippets?.[0]
  })).filter((i: any) => i.uri);
};

export const generateRitualSuggestion = async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'Sugira um exercício curto de presença (mindfulness) de 1 frase.'
    });
    return res.text;
};
