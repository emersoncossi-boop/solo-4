
/**
 * ImageStore: Módulo de gerenciamento de cache para imagens geradas.
 * Utiliza LRU (Least Recently Used) para manter o localStorage dentro dos limites.
 * Agora inclui compressão automática para imagens grandes.
 */

const CACHE_KEY = 'innerspace_image_cache';
const MAX_CACHE_SIZE = 12; // Reduzido ligeiramente para acomodar metadados com segurança
const MAX_BASE64_LENGTH = 1048576 * 1.33; // ~1MB em bytes convertido para base64 chars

interface CachedImage {
  hash: string;
  data: string;
  timestamp: number;
}

// Função de hash simples para strings
const generateHash = (text: string, emotion: string): string => {
  const str = `${text.trim().toLowerCase()}_${emotion}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
};

/**
 * Comprime uma string base64 se necessário usando Canvas
 */
const compressImage = async (base64Data: string): Promise<string> => {
  if (base64Data.length <= MAX_BASE64_LENGTH) return base64Data;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Redimensiona se for muito grande (ex: maior que 1024px)
      const maxDim = 1024;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height *= maxDim / width;
          width = maxDim;
        } else {
          width *= maxDim / height;
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Data);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      // Exporta como JPEG com qualidade reduzida para economizar espaço
      const compressed = canvas.toDataURL('image/jpeg', 0.7);
      resolve(compressed);
    };
    img.onerror = () => resolve(base64Data);
    img.src = base64Data;
  });
};

export const getCachedImage = (text: string, emotion: string): string | null => {
  try {
    const hash = generateHash(text, emotion);
    const rawCache = localStorage.getItem(CACHE_KEY);
    if (!rawCache) return null;

    const cache: CachedImage[] = JSON.parse(rawCache);
    const entryIndex = cache.findIndex(item => item.hash === hash);

    if (entryIndex !== -1) {
      const entry = cache[entryIndex];
      // Atualiza o timestamp para manter no topo do LRU
      entry.timestamp = Date.now();
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      return entry.data;
    }
    return null;
  } catch (e) {
    console.warn("Erro ao ler cache de imagens", e);
    return null;
  }
};

export const saveImageToCache = async (text: string, emotion: string, imageData: string) => {
  try {
    const compressedData = await compressImage(imageData);
    const hash = generateHash(text, emotion);
    const rawCache = localStorage.getItem(CACHE_KEY);
    let cache: CachedImage[] = rawCache ? JSON.parse(rawCache) : [];

    // Remove duplicata se existir
    cache = cache.filter(item => item.hash !== hash);

    // Adiciona nova entrada
    cache.push({
      hash,
      data: compressedData,
      timestamp: Date.now()
    });

    // Ordena por timestamp e aplica limite LRU
    if (cache.length > MAX_CACHE_SIZE) {
      cache.sort((a, b) => a.timestamp - b.timestamp);
      while (cache.length > MAX_CACHE_SIZE) {
        cache.shift();
      }
    }

    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn("Erro ao salvar no cache de imagens", e);
    // Se o localStorage estiver cheio, limpa o cache e tenta novamente ou apenas limpa
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
       localStorage.removeItem(CACHE_KEY);
    }
  }
};
