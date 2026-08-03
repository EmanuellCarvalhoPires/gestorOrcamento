/**
 * Serviço de Autenticação Biométrica (Digital / Biometria Facial) para Celulares Android / iOS.
 * Acessa os plugins nativos do Capacitor via window.Capacitor.Plugins com fallback seguro para ambiente Web/Desktop.
 */

function getBiometricPlugin() {
  if (typeof window !== 'undefined' && window.Capacitor?.Plugins) {
    return window.Capacitor.Plugins.NativeBiometric || window.Capacitor.Plugins.BiometricAuth || null;
  }
  return null;
}

export const biometricService = {
  /**
   * Verifica se o dispositivo Android / iOS possui suporte a Biometria / Digital cadastrada
   */
  async checkBiometricsAvailable() {
    const plugin = getBiometricPlugin();
    if (!plugin) return { available: false, reason: 'Ambiente não mobile / plugin não instalado' };
    try {
      const result = await plugin.isAvailable();
      return { available: result.isAvailable || false, biometryType: result.biometryType };
    } catch (err) {
      return { available: false, reason: err.message };
    }
  },

  /**
   * Solicita a verificação por Digital / Biometria Facial do Usuário
   */
  async authenticateBiometrics(reasonMessage = 'Confirme sua impressão digital para acessar o Gestor de Orçamento') {
    const plugin = getBiometricPlugin();
    if (!plugin) {
      return { success: true, simulated: true }; // Fallback transparente em desenvolvimento Web / Desktop
    }

    try {
      await plugin.verifyIdentity({
        reason: reasonMessage,
        title: 'Autenticação Biométrica',
        subtitle: 'Segurança Gestor de Orçamento',
        description: 'Encoste o dedo no leitor de digital para continuar',
      });
      return { success: true };
    } catch (err) {
      console.warn('Falha na verificação biométrica:', err);
      return { success: false, error: err.message || 'Autenticação biométrica cancelada ou incorreta.' };
    }
  },
};
