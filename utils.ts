
/**
 * Gera um ID único robusto, com fallback para navegadores que não suportam crypto.randomUUID
 */
export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fallback se falhar por algum motivo de contexto (ex: não-HTTPS)
    }
  }
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
};

/**
 * Remove undefined properties from an object recursively.
 * Firestore does not support undefined values.
 */
export const cleanObject = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(v => cleanObject(v));
  }

  const cleaned: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (value !== undefined) {
        cleaned[key] = cleanObject(value);
      }
    }
  }
  return cleaned;
};
