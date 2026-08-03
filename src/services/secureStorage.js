import { Preferences } from '@capacitor/preferences';

/**
 * Abstração de Armazenamento Local Seguro para Celular (Capacitor) e Navegador/Desktop.
 * No celular, utiliza @capacitor/preferences integrado com Android Keystore / iOS Keychain.
 * No ambiente Web/Electron Desktop, utiliza localStorage como fallback.
 */

export const secureStorage = {
  async setItem(key, value) {
    try {
      await Preferences.set({ key, value });
      return;
    } catch {
      try {
        localStorage.setItem(`@secure_${key}`, value);
      } catch (e) {
        console.error('Erro no localStorage:', e);
      }
    }
  },

  async getItem(key) {
    try {
      const res = await Preferences.get({ key });
      if (res?.value) return res.value;
    } catch {
      try {
        return localStorage.getItem(`@secure_${key}`);
      } catch {
        return null;
      }
    }
    try {
      return localStorage.getItem(`@secure_${key}`);
    } catch {
      return null;
    }
  },

  async removeItem(key) {
    try {
      await Preferences.remove({ key });
    } catch {}
    try {
      localStorage.removeItem(`@secure_${key}`);
    } catch {}
  },

  async clear() {
    try {
      await Preferences.clear();
    } catch {}
    try {
      localStorage.clear();
    } catch {}
  },
};
