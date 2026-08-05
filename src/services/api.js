import { secureStorage } from './secureStorage.js';

// URL base da API Backend rodando 24/7 na nuvem da Oracle Cloud (147.15.21.81:3000)
const getApiBaseUrl = () => {
  if (import.meta.env?.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return 'http://147.15.21.81:3000/api';
};

const API_BASE_URL = getApiBaseUrl();

let memoryAccessToken = null;

export function setAccessToken(token) {
  memoryAccessToken = token;
}

export function getAccessToken() {
  return memoryAccessToken;
}

/**
 * Cliente HTTP seguro com suporte a headers de autorização e auto-refresh de JWT
 */
async function fetchWithAuth(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (memoryAccessToken) {
    headers['Authorization'] = `Bearer ${memoryAccessToken}`;
  }

  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (netErr) {
    console.warn(`[API] Não foi possível conectar ao servidor em ${url}:`, netErr.message);
    return { success: false, error: 'Servidor API offline. Certifique-se de que o servidor (npm run dev na pasta server) está rodando na porta 3000.' };
  }

  // Se o Access Token expirou (401/403), tenta renovar usando o Refresh Token
  if (response.status === 401 || response.status === 403) {
    const storedRefreshToken = await secureStorage.getItem('refresh_token');
    if (storedRefreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
        });
        const refreshData = await refreshRes.json();

        if (refreshData?.success && refreshData?.accessToken) {
          memoryAccessToken = refreshData.accessToken;
          await secureStorage.setItem('refresh_token', refreshData.refreshToken);
          headers['Authorization'] = `Bearer ${memoryAccessToken}`;

          // Tenta novamente a requisição original com o novo token
          response = await fetch(url, { ...options, headers });
        } else {
          // Token inválido, limpa sessão
          await secureStorage.removeItem('refresh_token');
          memoryAccessToken = null;
        }
      } catch (err) {
        console.error('Erro na renovação do token:', err);
      }
    }
  }

  return response.json();
}

export const apiService = {
  async registrarUsuario({ nome, email, senha, perfilUso }) {
    const data = await fetchWithAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nome, email, senha, perfilUso }),
    });

    if (data?.success) {
      if (data.accessToken) setAccessToken(data.accessToken);
      if (data.refreshToken) await secureStorage.setItem('refresh_token', data.refreshToken);
    }
    return data;
  },

  async loginUsuario({ email, senha }) {
    const data = await fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    });

    if (data?.success) {
      if (data.accessToken) setAccessToken(data.accessToken);
      if (data.refreshToken) await secureStorage.setItem('refresh_token', data.refreshToken);
    }
    return data;
  },

  async logoutUsuario() {
    const storedRefreshToken = await secureStorage.getItem('refresh_token');
    if (storedRefreshToken) {
      await fetchWithAuth('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });
      await secureStorage.removeItem('refresh_token');
    }
    memoryAccessToken = null;
    return { success: true };
  },

  async carregarContas() {
    return fetchWithAuth('/contas', { method: 'GET' });
  },

  async criarConta({ nome, tipo, cor }) {
    return fetchWithAuth('/contas', {
      method: 'POST',
      body: JSON.stringify({ nome, tipo, cor }),
    });
  },

  async deletarConta({ contaId }) {
    return fetchWithAuth(`/contas/${contaId}`, { method: 'DELETE' });
  },

  async carregarCategorias() {
    return fetchWithAuth('/categorias', { method: 'GET' });
  },

  async adicionarCategoria({ nome, cor }) {
    return fetchWithAuth('/categorias', {
      method: 'POST',
      body: JSON.stringify({ nome, cor }),
    });
  },

  async carregarEtiquetas() {
    return fetchWithAuth('/etiquetas', { method: 'GET' });
  },

  async adicionarEtiqueta({ nome }) {
    return fetchWithAuth('/etiquetas', {
      method: 'POST',
      body: JSON.stringify({ nome }),
    });
  },

  async carregarTransacoes({ tipo, contaId }) {
    const query = new URLSearchParams();
    if (tipo) query.append('tipo', tipo);
    if (contaId) query.append('contaId', contaId);

    return fetchWithAuth(`/transacoes?${query.toString()}`, { method: 'GET' });
  },

  async adicionarTransacao(dados) {
    return fetchWithAuth('/transacoes', {
      method: 'POST',
      body: JSON.stringify(dados),
    });
  },

  async editarTransacao(dados) {
    return fetchWithAuth(`/transacoes/${dados.transacaoId}`, {
      method: 'PUT',
      body: JSON.stringify(dados),
    });
  },

  async deletarTransacao({ transacaoId, tipo }) {
    return fetchWithAuth(`/transacoes/${transacaoId}?tipo=${tipo}`, { method: 'DELETE' });
  },

  async solicitarRecuperacaoSenha({ email }) {
    if (window.apiTurso?.solicitarRecuperacaoSenha) {
      return window.apiTurso.solicitarRecuperacaoSenha({ email });
    }
    return fetchWithAuth('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async confirmarRecuperacaoSenha({ email, codigo, novaSenha }) {
    if (window.apiTurso?.confirmarRecuperacaoSenha) {
      return window.apiTurso.confirmarRecuperacaoSenha({ email, codigo, novaSenha });
    }
    return fetchWithAuth('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, codigo, novaSenha }),
    });
  },

  async enviarCodigoVerificacao({ email, nome }) {
    if (window.apiTurso?.enviarCodigoVerificacao) {
      return window.apiTurso.enviarCodigoVerificacao({ email, nome });
    }
    return fetchWithAuth('/auth/send-verification-code', {
      method: 'POST',
      body: JSON.stringify({ email, nome }),
    });
  },

  async validarCodigoVerificacao({ email, codigo }) {
    if (window.apiTurso?.validarCodigoVerificacao) {
      return window.apiTurso.validarCodigoVerificacao({ email, codigo });
    }
    return fetchWithAuth('/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ email, codigo }),
    });
  },

  async obterPerfilUsuario({ usuarioId }) {
    if (window.apiTurso?.obterPerfilUsuario) {
      return window.apiTurso.obterPerfilUsuario({ usuarioId });
    }
    return fetchWithAuth(`/usuarios/${usuarioId}`, { method: 'GET' });
  },

  async listarUsuariosAdmin({ usuarioId }) {
    if (window.apiTurso?.listarUsuariosAdmin) {
      return window.apiTurso.listarUsuariosAdmin({ usuarioId });
    }
    return fetchWithAuth('/admin/usuarios', { method: 'GET' });
  },

  async deletarUsuarioAdmin({ targetUserId, usuarioId }) {
    if (window.apiTurso?.deletarUsuarioAdmin) {
      return window.apiTurso.deletarUsuarioAdmin({ targetUserId, usuarioId });
    }
    return fetchWithAuth(`/admin/usuarios/${targetUserId}`, { method: 'DELETE' });
  },

  async alterarFuncaoUsuarioAdmin({ targetUserId, novaFuncao, usuarioId }) {
    if (window.apiTurso?.alterarFuncaoUsuarioAdmin) {
      return window.apiTurso.alterarFuncaoUsuarioAdmin({ targetUserId, novaFuncao, usuarioId });
    }
    return fetchWithAuth(`/admin/usuarios/${targetUserId}/funcao`, {
      method: 'PUT',
      body: JSON.stringify({ novaFuncao }),
    });
  },
};
