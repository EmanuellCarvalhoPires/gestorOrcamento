/**
 * Armazenamento local seguro para ambiente Desktop (Electron).
 * Utiliza localStorage como mecanismo de persistência.
 */

export const secureStorage = {
  async setItem(key, value) {
    try {
      localStorage.setItem(`@secure_${key}`, value);
    } catch (e) {
      console.error('Erro no localStorage:', e);
    }
  },

  async getItem(key) {
    try {
      return localStorage.getItem(`@secure_${key}`);
    } catch {
      return null;
    }
  },

  async removeItem(key) {
    try {
      localStorage.removeItem(`@secure_${key}`);
    } catch {}
  },

  async clear() {
    try {
      localStorage.clear();
    } catch {}
  },
};
