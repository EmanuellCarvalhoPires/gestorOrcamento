import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api.js';

const BudgetContext = createContext();

export const PALETAS_PREDEFINIDAS = [
  {
    id: 'dourado_nobre',
    nome: '👑 Dourado Nobre',
    descricao: 'Tema escuro clássico com detalhes dourados',
    cores: {
      bgPrimary: '#3a3a3a',
      cardBg: '#545454',
      surfaceBg: '#3e3e3e',
      accentColor: '#ffe192',
      textPrimary: '#ffffff',
    },
  },
  {
    id: 'esmeralda_cyber',
    nome: '🌿 Esmeralda Cyber',
    descricao: 'Tema tecnológico moderno em tons de verde neon',
    cores: {
      bgPrimary: '#1e293b',
      cardBg: '#334155',
      surfaceBg: '#0f172a',
      accentColor: '#50fa7b',
      textPrimary: '#ffffff',
    },
  },
  {
    id: 'ciano_tech',
    nome: '⚡ Ciano Tech',
    descricao: 'Estilo cyber futurista com ciano vibrante',
    cores: {
      bgPrimary: '#121824',
      cardBg: '#1f293d',
      surfaceBg: '#161f30',
      accentColor: '#00f5d4',
      textPrimary: '#ffffff',
    },
  },
  {
    id: 'violeta_amethyst',
    nome: '🔮 Violeta Amethyst',
    descricao: 'Visual místico e elegante em tons de roxo profundo',
    cores: {
      bgPrimary: '#1a102f',
      cardBg: '#281a46',
      surfaceBg: '#1e1337',
      accentColor: '#c084fc',
      textPrimary: '#ffffff',
    },
  },
  {
    id: 'sunset_coral',
    nome: '🌅 Sunset Coral',
    descricao: 'Cores quentes e acolhedoras em tons de vinho e coral',
    cores: {
      bgPrimary: '#2b1e1e',
      cardBg: '#3f2d2d',
      surfaceBg: '#221616',
      accentColor: '#ff758f',
      textPrimary: '#ffffff',
    },
  },
  {
    id: 'ocean_deep',
    nome: '🌊 Azul Oceano',
    descricao: 'Tons de azul profundo e marinho com azul céu',
    cores: {
      bgPrimary: '#0f172a',
      cardBg: '#1e293b',
      surfaceBg: '#111827',
      accentColor: '#38bdf8',
      textPrimary: '#ffffff',
    },
  },
  {
    id: 'modo_claro',
    nome: '☀️ Modo Claro Elegante',
    descricao: 'Tema claro limpo, elegante e de alto contraste',
    cores: {
      bgPrimary: '#f3f4f6',
      cardBg: '#d9d9d9',
      surfaceBg: '#e5e7eb',
      accentColor: '#d97706',
      textPrimary: '#1f2937',
    },
  },
];

const PALETA_PADRAO = PALETAS_PREDEFINIDAS[0].cores;

export const aplicarVariaveisCSS = (cores) => {
  if (!cores) return;
  const root = document.documentElement;

  const bgPrimary = cores.bgPrimary || '#3a3a3a';
  const cardBg = cores.cardBg || '#545454';
  const surfaceBg = cores.surfaceBg || '#3e3e3e';
  const accentColor = cores.accentColor || '#ffe192';

  const getLuminance = (hex) => {
    if (!hex || typeof hex !== 'string') return 0;
    const clean = hex.replace('#', '').trim();
    if (clean.length !== 6 && clean.length !== 3) return 0;
    const r = parseInt(clean.length === 3 ? clean[0] + clean[0] : clean.substring(0, 2), 16);
    const g = parseInt(clean.length === 3 ? clean[1] + clean[1] : clean.substring(2, 4), 16);
    const b = parseInt(clean.length === 3 ? clean[2] + clean[2] : clean.substring(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  };

  const isCardLight = getLuminance(cardBg) > 0.55;
  const isBgLight = getLuminance(bgPrimary) > 0.55;
  const isLight = isCardLight || isBgLight;

  // Garante que se o fundo for claro, o texto principal seja escuro de alto contraste
  let textPrimary = cores.textPrimary || (isLight ? '#1f2937' : '#ffffff');
  if (isCardLight && getLuminance(textPrimary) > 0.5) {
    textPrimary = '#1f2937';
  }

  // Garante que a superficie do input seja legivel e contrastante com o cardBg
  let adjustedSurfaceBg = surfaceBg;
  if (isCardLight && getLuminance(surfaceBg) < 0.3) {
    adjustedSurfaceBg = '#f3f4f6';
  }

  root.style.setProperty('--bg-primary', bgPrimary);
  root.style.setProperty('--card-bg', cardBg);
  root.style.setProperty('--surface-bg', adjustedSurfaceBg);
  root.style.setProperty('--accent-color', accentColor);
  root.style.setProperty('--text-primary', textPrimary);

  // Variáveis derivadas para 100% de cobertura nos componentes
  root.style.setProperty('--header-bg', isLight ? '#e5e7eb' : adjustedSurfaceBg);
  root.style.setProperty('--surface-hover', isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)');
  root.style.setProperty('--text-secondary', isLight ? '#4b5563' : '#cccccc');
  root.style.setProperty('--border-color', isLight ? '#d1d5db' : 'rgba(255, 255, 255, 0.15)');
  
  const accentLuminance = getLuminance(accentColor);
  root.style.setProperty('--accent-text', accentLuminance > 0.5 ? '#1e1e1e' : '#ffffff');

  root.style.colorScheme = isLight ? 'light' : 'dark';
};

const ANOS_LISTA = ['2024', '2025', '2026', '2027'];
const MESES_LISTA = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const BudgetProvider = ({ children }) => {
  // Sessão do Usuário
  const [usuarioLogado, setUsuarioLogado] = useState(() => {
    try {
      const salvo = localStorage.getItem('@gestor_usuario');
      return salvo ? JSON.parse(salvo) : null;
    } catch {
      return null;
    }
  });

  // Múltiplas Contas por Usuário
  const [contas, setContas] = useState([]);
  const [contaAtiva, setContaAtiva] = useState(() => {
    try {
      const salva = localStorage.getItem('@gestor_conta_ativa');
      return salva ? JSON.parse(salva) : null;
    } catch {
      return null;
    }
  });
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // Perfil Ativo (Individual vs Comercial)
  const isComercial = usuarioLogado?.perfilUso === 'comercial' || contaAtiva?.tipo === 'comercial';
  const isIndividual = !isComercial;

  // Filtros de Data e Navegação
  const [anoSelecionado, setAnoSelecionadoState] = useState('2026');
  const ultimoAnoValidoRef = useRef('2026');

  const setAnoSelecionado = (novoAno) => {
    if (novoAno && novoAno !== 'caixinha') {
      ultimoAnoValidoRef.current = novoAno;
    }
    setAnoSelecionadoState(novoAno);
  };

  const [mesSelecionado, setMesSelecionadoState] = useState('Jan');

  const setMesSelecionado = (novoMes) => {
    if (anoSelecionado === 'caixinha') {
      setAnoSelecionadoState(ultimoAnoValidoRef.current || '2026');
    }
    setMesSelecionadoState(novoMes);
  };

  const [abaAtiva, setAbaAtiva] = useState('despesas'); // 'receitas' ou 'despesas'

  // Transações, Categorias e Etiquetas Reutilizáveis
  const [receitas, setReceitas] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [etiquetaList, setEtiquetaList] = useState(['Geral']);

  // Estado da Funcionalidade Caixinha (Opcional)
  const [isCaixinhaAtiva, setIsCaixinhaAtiva] = useState(false);
  const [saldoInicialCaixinha, setSaldoInicialCaixinha] = useState(0);
  const [saldoCaixinhaAcumulado, setSaldoCaixinhaAcumulado] = useState(0);
  const [caixinhaRendimentoTaxa, setCaixinhaRendimentoTaxa] = useState(0);
  const [caixinhaRendimentoPeriodo, setCaixinhaRendimentoPeriodo] = useState('mensal'); // 'mensal' ou 'anual'
  const [modoCaixinhaVisao, setModoCaixinhaVisao] = useState('atual'); // 'atual' ou 'projetada'
  const [horizontePrevisao, setHorizontePrevisao] = useState(() => {
    try {
      return localStorage.getItem('@gestor_caixinha_horizonte') || 'completa';
    } catch {
      return 'completa';
    }
  });

  const [mesesPersonalizados, setMesesPersonalizados] = useState(() => {
    try {
      const salvo = localStorage.getItem('@gestor_caixinha_meses_pers');
      return salvo ? parseInt(salvo, 10) : 7;
    } catch {
      return 7;
    }
  });

  const [tipoPrevisaoEspecifica, setTipoPrevisaoEspecifica] = useState(() => {
    try {
      return localStorage.getItem('@gestor_caixinha_tipo_pers') || 'meses';
    } catch {
      return 'meses';
    }
  });

  const [mesMetaPrevisao, setMesMetaPrevisao] = useState(() => {
    try {
      return localStorage.getItem('@gestor_caixinha_mes_meta') || 'Dez';
    } catch {
      return 'Dez';
    }
  });

  const [anoMetaPrevisao, setAnoMetaPrevisao] = useState(() => {
    try {
      return localStorage.getItem('@gestor_caixinha_ano_meta') || '2027';
    } catch {
      return '2027';
    }
  });

  const [aporteExtraMensal, setAporteExtraMensal] = useState(() => {
    try {
      const salvo = localStorage.getItem('@gestor_caixinha_aporte_extra');
      return salvo ? parseFloat(salvo) : 0;
    } catch {
      return 0;
    }
  });

  const [metaSaldoCaixinha, setMetaSaldoCaixinha] = useState(() => {
    try {
      const salvo = localStorage.getItem('@gestor_caixinha_meta_saldo');
      return salvo ? parseFloat(salvo) : 0;
    } catch {
      return 0;
    }
  });

  const atualizarHorizontePrevisao = (novoHorizonte) => {
    setHorizontePrevisao(novoHorizonte);
    localStorage.setItem('@gestor_caixinha_horizonte', novoHorizonte);
  };

  const atualizarMesesPersonalizados = (num) => {
    const val = Math.max(1, Math.min(120, parseInt(num, 10) || 1));
    setMesesPersonalizados(val);
    localStorage.setItem('@gestor_caixinha_meses_pers', val.toString());
  };

  const atualizarTipoPrevisaoEspecifica = (tipo) => {
    setTipoPrevisaoEspecifica(tipo);
    localStorage.setItem('@gestor_caixinha_tipo_pers', tipo);
  };

  const atualizarDataMetaPrevisao = (mes, ano) => {
    if (mes) {
      setMesMetaPrevisao(mes);
      localStorage.setItem('@gestor_caixinha_mes_meta', mes);
    }
    if (ano) {
      setAnoMetaPrevisao(ano);
      localStorage.setItem('@gestor_caixinha_ano_meta', ano);
    }
  };

  const atualizarAporteExtraMensal = (val) => {
    const num = Math.max(0, parseFloat(val) || 0);
    setAporteExtraMensal(num);
    localStorage.setItem('@gestor_caixinha_aporte_extra', num.toString());
  };

  const atualizarMetaSaldoCaixinha = (val) => {
    const num = Math.max(0, parseFloat(val) || 0);
    setMetaSaldoCaixinha(num);
    localStorage.setItem('@gestor_caixinha_meta_saldo', num.toString());
  };

  // Estado da Paleta de Cores & Temas Dinâmicos
  const [paletaCores, setPaletaCores] = useState(() => {
    try {
      const salva = localStorage.getItem('@gestor_paleta_cores');
      const cores = salva ? JSON.parse(salva) : PALETA_PADRAO;
      aplicarVariaveisCSS(cores);
      return cores;
    } catch {
      aplicarVariaveisCSS(PALETA_PADRAO);
      return PALETA_PADRAO;
    }
  });

  // --- SISTEMA DE ATUALIZAÇÃO AUTOMÁTICA (GITHUB RELEASES & ELECTRON-UPDATER) ---
  const [updateDisponivel, setUpdateDisponivel] = useState(null);
  const [updateStatus, setUpdateStatus] = useState({ state: 'idle', progress: 0 });
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [verificandoUpdate, setVerificandoUpdate] = useState(false);
  const [mensagemUpdate, setMensagemUpdate] = useState('');

  const ignorarVersaoUpdate = (versao) => {
    if (!versao) return;
    try {
      localStorage.setItem('@gestor_update_ignorado', versao);
    } catch (e) {}
  };

  // Escuta os eventos e progresso do electron-updater em tempo real
  useEffect(() => {
    if (window.electronAPI?.onUpdateStatus) {
      const unsubscribe = window.electronAPI.onUpdateStatus((status) => {
        if (status) {
          setUpdateStatus(status);
          if (status.state === 'available' || status.state === 'downloaded') {
            const versaoIgnorada = localStorage.getItem('@gestor_update_ignorado');
            if (versaoIgnorada !== status.version) {
              setIsUpdateModalOpen(true);
            }
          }
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const baixarAtualizacaoNativa = async (urlDownloadCustom) => {
    const url = urlDownloadCustom || updateDisponivel?.urlDownload;
    if (window.electronAPI?.downloadUpdate) {
      return await window.electronAPI.downloadUpdate(url);
    }
    return { success: false, error: 'API não disponível' };
  };

  const reiniciarEAplicarAtualizacao = () => {
    if (window.electronAPI?.quitAndInstallUpdate) {
      window.electronAPI.quitAndInstallUpdate();
    }
  };

  const forcarBuscaEAtualizacao = async (abrirModalSeDisponivel = true) => {
    try {
      localStorage.removeItem('@gestor_update_ignorado');
    } catch (e) {}

    setVerificandoUpdate(true);
    setMensagemUpdate('🔍 Consultando GitHub Releases em tempo real...');

    // 1. Tenta disparar electron-updater nativo
    if (window.electronAPI?.checkForUpdates) {
      try {
        await window.electronAPI.checkForUpdates();
      } catch (e) {
        console.warn('Erro ao chamar checkForUpdates nativo:', e);
      }
    }

    // 2. Consulta a API pública do GitHub como fonte garantida
    if (window.apiTurso?.verificarAtualizacao) {
      try {
        const res = await window.apiTurso.verificarAtualizacao();
        setVerificandoUpdate(false);
        if (res?.success && res.temAtualizacao) {
          setUpdateDisponivel(res);
          if (abrirModalSeDisponivel) {
            setIsUpdateModalOpen(true);
          }
          setMensagemUpdate(`🚀 Nova versão ${res.versaoMaisRecente} disponível para download!`);
          return res;
        } else if (res?.success && !res.temAtualizacao) {
          setMensagemUpdate(`✅ Seu aplicativo já está atualizado na versão mais recente (${res.versaoAtual || 'v1.1.1'}).`);
          return res;
        } else {
          setMensagemUpdate(res?.error || 'Não foi possível verificar atualizações no momento.');
          return res;
        }
      } catch (err) {
        setVerificandoUpdate(false);
        setMensagemUpdate('Falha ao conectar aos servidores do GitHub.');
        return { success: false, error: err.message };
      }
    }

    setVerificandoUpdate(false);
    setMensagemUpdate('API de atualização indisponível.');
    return { success: false, error: 'API indisponível' };
  };

  const verificarAtualizacoesManual = async () => {
    return await forcarBuscaEAtualizacao(true);
  };

  // Verificação Automática ao Entrar no Aplicativo (executa após 2.5 segundos)
  useEffect(() => {
    const timer = setTimeout(async () => {
      // 1. Tenta electron-updater nativo
      if (window.electronAPI?.checkForUpdates) {
        try {
          await window.electronAPI.checkForUpdates();
        } catch (e) {}
      }

      // 2. Verificação de fallback via API REST do GitHub
      if (window.apiTurso?.verificarAtualizacao) {
        try {
          const res = await window.apiTurso.verificarAtualizacao();
          if (res?.success && res.temAtualizacao) {
            const versaoIgnorada = localStorage.getItem('@gestor_update_ignorado');
            if (versaoIgnorada !== res.versaoMaisRecente) {
              setUpdateDisponivel(res);
              setIsUpdateModalOpen(true);
            }
          }
        } catch (e) {
          console.warn('Verificação silenciosa falhou:', e.message);
        }
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const aplicarPaletaCores = async (novaPaleta) => {
    setPaletaCores(novaPaleta);
    aplicarVariaveisCSS(novaPaleta);
    localStorage.setItem('@gestor_paleta_cores', JSON.stringify(novaPaleta));

    if (contaAtiva?.id && window.apiTurso) {
      try {
        await window.apiTurso.salvarPaletaCores({ contaId: contaAtiva.id, paletaCores: novaPaleta });
      } catch (err) {
        console.error('Erro ao salvar paleta de cores no banco:', err);
      }
    }
  };

  // Carrega a paleta salva no banco de dados quando a conta ativa muda
  useEffect(() => {
    if (contaAtiva?.id && window.apiTurso) {
      window.apiTurso.carregarPaletaCores({ contaId: contaAtiva.id }).then((res) => {
        if (res?.success && res.paletaCores) {
          try {
            const cores = typeof res.paletaCores === 'string' ? JSON.parse(res.paletaCores) : res.paletaCores;
            if (cores && typeof cores === 'object') {
              setPaletaCores(cores);
              aplicarVariaveisCSS(cores);
              localStorage.setItem('@gestor_paleta_cores', JSON.stringify(cores));
            }
          } catch (e) {
            console.error('Erro ao fazer parse da paleta de cores:', e);
          }
        }
      });
    }
  }, [contaAtiva?.id]);

  // Modais Globais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const abrirModalAdicionar = (dadosIniciais = null) => {
    setModalInitialData(dadosIniciais);
    setIsModalOpen(true);
  };

  // Login de Usuário (Chamado por AuthView)
  const login = async ({ email, senha }) => {
    try {
      let res = await apiService.loginUsuario({ email, senha });
      if (!res?.success && window.apiTurso) {
        res = await window.apiTurso.loginUsuario({ email, senha });
      }
      if (res?.success && res.user) {
        setUsuarioLogado(res.user);
        localStorage.setItem('@gestor_usuario', JSON.stringify(res.user));
        return { success: true };
      }
      return { success: false, error: res?.error || 'E-mail ou senha incorretos.' };
    } catch (err) {
      console.error('Erro no login:', err);
      return { success: false, error: err.message };
    }
  };

  // Registro de Usuário (Chamado por AuthView)
  const registrar = async ({ nome, email, senha, perfilUso }) => {
    try {
      let res = await apiService.registrarUsuario({ nome, email, senha, perfilUso });
      if (!res?.success && window.apiTurso) {
        res = await window.apiTurso.registrarUsuario({ nome, email, senha, perfilUso });
      }
      if (res?.success && res.user) {
        setUsuarioLogado(res.user);
        localStorage.setItem('@gestor_usuario', JSON.stringify(res.user));
        if (res.contaInicial) {
          setContaAtiva(res.contaInicial);
          localStorage.setItem('@gestor_conta_ativa', JSON.stringify(res.contaInicial));
        }
        return { success: true };
      }
      return { success: false, error: res?.error || 'Erro ao cadastrar usuário.' };
    } catch (err) {
      console.error('Erro no registro:', err);
      return { success: false, error: err.message };
    }
  };

  // Login via Google (Chamado por AuthView)
  const loginGoogle = async ({ perfilUso } = {}) => {
    if (!window.apiTurso) return { success: false, error: 'API indisponível.' };
    try {
      const res = await window.apiTurso.loginGoogle({ perfilUso });
      if (res?.success && res.user) {
        setUsuarioLogado(res.user);
        localStorage.setItem('@gestor_usuario', JSON.stringify(res.user));
        if (res.contaInicial) {
          setContaAtiva(res.contaInicial);
          localStorage.setItem('@gestor_conta_ativa', JSON.stringify(res.contaInicial));
        }
        return { success: true };
      }
      return { success: false, error: res?.error || 'Erro ao realizar login com o Google.' };
    } catch (err) {
      console.error('Erro no login do Google:', err);
      return { success: false, error: err.message };
    }
  };

  const sincronizarUsuarioLogado = async () => {
    if (!usuarioLogado?.id) return;
    try {
      const res = await apiService.obterPerfilUsuario({ usuarioId: usuarioLogado.id });
      if (res?.success && res.user) {
        setUsuarioLogado((ant) => {
          const novo = { ...ant, ...res.user };
          if (JSON.stringify(ant) !== JSON.stringify(novo)) {
            localStorage.setItem('@gestor_usuario', JSON.stringify(novo));
            return novo;
          }
          return ant;
        });
      }
    } catch (err) {
      console.error('Erro ao sincronizar perfil do usuário:', err);
    }
  };

  useEffect(() => {
    if (usuarioLogado?.id) {
      sincronizarUsuarioLogado();
    }
  }, [usuarioLogado?.id]);

  const logout = async () => {
    await apiService.logoutUsuario();
    setUsuarioLogado(null);
    setContas([]);
    setContaAtiva(null);
    localStorage.removeItem('@gestor_usuario');
    localStorage.removeItem('@gestor_conta_ativa');
  };

  // Carrega as Contas do Usuário
  const carregarContas = async (usrId) => {
    if (!usrId || !window.apiTurso) return;
    try {
      const resContas = await window.apiTurso.carregarContas({ usuarioId: usrId });
      const listaContas = Array.isArray(resContas) ? resContas : [];
      setContas(listaContas);

      if (listaContas.length > 0) {
        if (!contaAtiva || !listaContas.find((c) => c.id === contaAtiva?.id)) {
          setContaAtiva(listaContas[0]);
          localStorage.setItem('@gestor_conta_ativa', JSON.stringify(listaContas[0]));
        }
      }
    } catch (err) {
      console.error('Erro ao carregar contas:', err);
      setContas([]);
    }
  };

  const selecionarConta = (conta) => {
    setContaAtiva(conta);
    localStorage.setItem('@gestor_conta_ativa', JSON.stringify(conta));
  };

  const criarNovaConta = async ({ nome, tipo, descricao, cor }) => {
    if (!usuarioLogado || !window.apiTurso) return;
    try {
      const res = await window.apiTurso.criarConta({
        usuarioId: usuarioLogado.id,
        nome,
        tipo,
        descricao,
        cor,
      });

      if (res?.success && res.conta) {
        await carregarContas(usuarioLogado.id);
        selecionarConta(res.conta);
        setIsAccountModalOpen(false);
      }
    } catch (err) {
      console.error('Erro ao criar conta:', err);
    }
  };

  const deletarConta = async (contaId) => {
    if (!usuarioLogado || !contaId) return { success: false, error: 'Sessão ou conta inválida.' };

    if (contas.length <= 1) {
      return { success: false, error: 'Você não pode excluir a sua única conta registrada.' };
    }

    try {
      let res = await apiService.deletarConta({ contaId });
      if (!res?.success && window.apiTurso) {
        res = await window.apiTurso.deletarConta({ contaId, usuarioId: usuarioLogado.id });
      }

      if (res?.success) {
        const contasRestantes = contas.filter((c) => c.id !== contaId);
        setContas(contasRestantes);

        if (contaAtiva?.id === contaId && contasRestantes.length > 0) {
          const proximaConta = contasRestantes[0];
          setContaAtiva(proximaConta);
          localStorage.setItem('@gestor_conta_ativa', JSON.stringify(proximaConta));
        }

        return { success: true };
      }
      return { success: false, error: res?.error || 'Erro ao deletar conta.' };
    } catch (err) {
      console.error('Erro ao deletar conta:', err);
      return { success: false, error: err.message };
    }
  };

  // Carrega Etiquetas Reutilizáveis
  const carregarEtiquetas = async (usrId) => {
    if (!usrId || !window.apiTurso) return;
    try {
      const res = await window.apiTurso.carregarEtiquetas({ usuarioId: usrId });
      setEtiquetaList(Array.isArray(res) && res.length > 0 ? res : ['Geral']);
    } catch (err) {
      console.error('Erro ao carregar etiquetas:', err);
      setEtiquetaList(['Geral']);
    }
  };

  const adicionarEtiqueta = async (nomeEtiq) => {
    if (!usuarioLogado || !nomeEtiq || !window.apiTurso) return;
    try {
      await window.apiTurso.adicionarEtiqueta({ usuarioId: usuarioLogado.id, nome: nomeEtiq });
      await carregarEtiquetas(usuarioLogado.id);
    } catch (err) {
      console.error('Erro ao adicionar etiqueta:', err);
    }
  };

  // Carrega Categorias
  const carregarCategorias = async (usrId) => {
    if (!usrId || !window.apiTurso) return;
    try {
      const cats = await window.apiTurso.carregarCategorias({ usuarioId: usrId });
      setCategorias(Array.isArray(cats) ? cats : []);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
      setCategorias([]);
    }
  };

  // Carrega Transações
  const carregarTransacoes = async () => {
    if (!usuarioLogado || !window.apiTurso) return;
    try {
      const res = await window.apiTurso.carregarTransacoes({
        usuarioId: usuarioLogado.id,
        contaId: contaAtiva?.id,
        mes: mesSelecionado,
        ano: anoSelecionado,
      });
      setReceitas(Array.isArray(res?.receitas) ? res.receitas : []);
      setDespesas(Array.isArray(res?.despesas) ? res.despesas : []);
    } catch (err) {
      console.error('Erro ao carregar transações:', err);
      setReceitas([]);
      setDespesas([]);
    }
  };

  // Carrega Total da Caixinha (Acumulado de todos os meses/anos)
  const carregarTotalCaixinha = async () => {
    if (!usuarioLogado || !window.apiTurso) return;
    try {
      const res = await window.apiTurso.obterTotalCaixinha({
        usuarioId: usuarioLogado.id,
        contaId: contaAtiva?.id,
      });
      const saldoBanco = Number(res?.saldoAcumulado) || 0;
      setSaldoCaixinhaAcumulado(saldoBanco + Number(saldoInicialCaixinha || 0));
    } catch (err) {
      console.error('Erro ao carregar total da caixinha:', err);
    }
  };

  // Carrega configurações da Caixinha ao trocar de conta (banco + localStorage)
  useEffect(() => {
    if (contaAtiva?.id) {
      const dbAtiva = contaAtiva.caixinha_ativa === true || contaAtiva.caixinha_ativa === 'true';
      const dbInicial = parseFloat(contaAtiva.caixinha_saldo_inicial) || 0;
      const dbRendTaxa = parseFloat(contaAtiva.caixinha_rendimento_taxa) || 0;
      const dbRendPeriodo = contaAtiva.caixinha_rendimento_periodo || 'mensal';

      const localAtiva = localStorage.getItem(`@gestor_caixinha_ativa_${contaAtiva.id}`) === 'true';
      const localInicial = parseFloat(localStorage.getItem(`@gestor_caixinha_inicial_${contaAtiva.id}`)) || 0;
      const localRendTaxa = parseFloat(localStorage.getItem(`@gestor_caixinha_rend_taxa_${contaAtiva.id}`)) || 0;
      const localRendPeriodo = localStorage.getItem(`@gestor_caixinha_rend_periodo_${contaAtiva.id}`) || 'mensal';

      const ativaFinal = (contaAtiva.caixinha_ativa !== undefined && contaAtiva.caixinha_ativa !== null) ? dbAtiva : localAtiva;
      const inicialFinal = (contaAtiva.caixinha_saldo_inicial !== undefined && contaAtiva.caixinha_saldo_inicial !== null) ? dbInicial : localInicial;
      const rendTaxaFinal = (contaAtiva.caixinha_rendimento_taxa !== undefined && contaAtiva.caixinha_rendimento_taxa !== null) ? dbRendTaxa : localRendTaxa;
      const rendPeriodoFinal = (contaAtiva.caixinha_rendimento_periodo !== undefined && contaAtiva.caixinha_rendimento_periodo !== null) ? dbRendPeriodo : localRendPeriodo;

      setIsCaixinhaAtiva(ativaFinal);
      setSaldoInicialCaixinha(inicialFinal);
      setCaixinhaRendimentoTaxa(rendTaxaFinal);
      setCaixinhaRendimentoPeriodo(rendPeriodoFinal);

      localStorage.setItem(`@gestor_caixinha_ativa_${contaAtiva.id}`, ativaFinal ? 'true' : 'false');
      localStorage.setItem(`@gestor_caixinha_inicial_${contaAtiva.id}`, inicialFinal.toString());
      localStorage.setItem(`@gestor_caixinha_rend_taxa_${contaAtiva.id}`, rendTaxaFinal.toString());
      localStorage.setItem(`@gestor_caixinha_rend_periodo_${contaAtiva.id}`, rendPeriodoFinal);
    } else {
      setIsCaixinhaAtiva(false);
      setSaldoInicialCaixinha(0);
      setCaixinhaRendimentoTaxa(0);
      setCaixinhaRendimentoPeriodo('mensal');
    }
  }, [contaAtiva]);

  const toggleCaixinha = async (status) => {
    const novoStatus = typeof status === 'boolean' ? status : !isCaixinhaAtiva;
    setIsCaixinhaAtiva(novoStatus);
    if (contaAtiva?.id) {
      localStorage.setItem(`@gestor_caixinha_ativa_${contaAtiva.id}`, novoStatus ? 'true' : 'false');
      setContaAtiva((prev) => (prev ? { ...prev, caixinha_ativa: novoStatus } : prev));
      setContas((prevContas) =>
        prevContas.map((c) => (c.id === contaAtiva.id ? { ...c, caixinha_ativa: novoStatus } : c))
      );

      if (window.apiTurso?.salvarConfiguracaoCaixinha) {
        await window.apiTurso.salvarConfiguracaoCaixinha({
          contaId: contaAtiva.id,
          caixinhaAtiva: novoStatus,
        });
      }
    }
  };

  const atualizarSaldoInicialCaixinha = async (val) => {
    const num = parseFloat(val) || 0;
    setSaldoInicialCaixinha(num);
    if (contaAtiva?.id) {
      localStorage.setItem(`@gestor_caixinha_inicial_${contaAtiva.id}`, num.toString());
      setContaAtiva((prev) => (prev ? { ...prev, caixinha_saldo_inicial: num } : prev));
      setContas((prevContas) =>
        prevContas.map((c) => (c.id === contaAtiva.id ? { ...c, caixinha_saldo_inicial: num } : c))
      );

      if (window.apiTurso?.salvarConfiguracaoCaixinha) {
        await window.apiTurso.salvarConfiguracaoCaixinha({
          contaId: contaAtiva.id,
          caixinhaSaldoInicial: num,
        });
      }
    }
  };

  const atualizarRendimentoCaixinha = async ({ taxa, periodo }) => {
    const numTaxa = parseFloat(taxa) >= 0 ? parseFloat(taxa) : 0;
    const tipoPeriodo = periodo === 'anual' ? 'anual' : 'mensal';

    setCaixinhaRendimentoTaxa(numTaxa);
    setCaixinhaRendimentoPeriodo(tipoPeriodo);

    if (contaAtiva?.id) {
      localStorage.setItem(`@gestor_caixinha_rend_taxa_${contaAtiva.id}`, numTaxa.toString());
      localStorage.setItem(`@gestor_caixinha_rend_periodo_${contaAtiva.id}`, tipoPeriodo);

      setContaAtiva((prev) => (prev ? {
        ...prev,
        caixinha_rendimento_taxa: numTaxa,
        caixinha_rendimento_periodo: tipoPeriodo
      } : prev));

      setContas((prevContas) =>
        prevContas.map((c) => (c.id === contaAtiva.id ? {
          ...c,
          caixinha_rendimento_taxa: numTaxa,
          caixinha_rendimento_periodo: tipoPeriodo
        } : c))
      );

      if (window.apiTurso?.salvarConfiguracaoCaixinha) {
        await window.apiTurso.salvarConfiguracaoCaixinha({
          contaId: contaAtiva.id,
          caixinhaRendimentoTaxa: numTaxa,
          caixinhaRendimentoPeriodo: tipoPeriodo,
        });
      }
    }
  };

  useEffect(() => {
    if (usuarioLogado?.id) {
      carregarContas(usuarioLogado.id);
      carregarCategorias(usuarioLogado.id);
      carregarEtiquetas(usuarioLogado.id);
    }
  }, [usuarioLogado?.id]);

  useEffect(() => {
    if (usuarioLogado?.id) {
      carregarTransacoes();
      carregarTotalCaixinha();
    }
  }, [usuarioLogado?.id, contaAtiva?.id, anoSelecionado, mesSelecionado, saldoInicialCaixinha]);

  const isSubmittingTransacaoRef = useRef(false);

  const adicionarTransacao = async (novaTransacao) => {
    if (!usuarioLogado || !window.apiTurso) return;
    if (isSubmittingTransacaoRef.current) return;
    isSubmittingTransacaoRef.current = true;

    try {
      const res = await window.apiTurso.adicionarTransacao({
        ...novaTransacao,
        usuarioId: usuarioLogado.id,
        contaId: contaAtiva?.id,
        mes: novaTransacao.mesPersonalizado || mesSelecionado,
        ano: novaTransacao.ano || anoSelecionado,
      });

      if (res?.success) {
        if (res.mesCalculado) setMesSelecionado(res.mesCalculado);
        if (res.anoCalculado) setAnoSelecionado(res.anoCalculado);
        await Promise.all([
          carregarTransacoes(),
          carregarEtiquetas(usuarioLogado.id),
        ]);
      }
      return res;
    } catch (err) {
      console.error('Erro ao adicionar transação:', err);
    } finally {
      isSubmittingTransacaoRef.current = false;
    }
  };

  const editarTransacao = async (dadosEdicao) => {
    if (!usuarioLogado || !window.apiTurso) return;
    try {
      const res = await window.apiTurso.editarTransacao({
        ...dadosEdicao,
        usuarioId: usuarioLogado.id,
      });
      if (res?.success) {
        await Promise.all([
          carregarTransacoes(),
          carregarEtiquetas(usuarioLogado.id),
        ]);
      }
      return res;
    } catch (err) {
      console.error('Erro ao editar transação:', err);
    }
  };

  const deletarTransacao = async (idOrObject, opcoesExtra = {}) => {
    if (!usuarioLogado || !window.apiTurso) return;
    const finalId = typeof idOrObject === 'object' && idOrObject !== null ? idOrObject.id : idOrObject;
    const finalExtra = typeof idOrObject === 'object' && idOrObject !== null ? { ...idOrObject, ...opcoesExtra } : opcoesExtra;

    try {
      await window.apiTurso.deletarTransacao({
        id: finalId,
        usuarioId: usuarioLogado.id,
        ...finalExtra,
      });
      await carregarTransacoes();
    } catch (err) {
      console.error('Erro ao deletar transação:', err);
    }
  };

  const importarTransacoesNubankCSV = async (transacoesList, targetContaId = null) => {
    if (!usuarioLogado || !window.apiTurso) return { success: false, error: 'Sessão inválida.' };
    const contaParaUsar = targetContaId || contaAtiva?.id;
    if (!contaParaUsar) return { success: false, error: 'Nenhuma conta bancária selecionada.' };

    try {
      const res = await window.apiTurso.importarTransacoesNubankCSV({
        usuarioId: usuarioLogado.id,
        contaId: contaParaUsar,
        transacoes: transacoesList,
      });
      if (res?.success) {
        await carregarTransacoes();
        await carregarEtiquetas(usuarioLogado.id);
        await carregarCategorias(usuarioLogado.id);
      }
      return res;
    } catch (err) {
      console.error('Erro ao importar transações do Nubank:', err);
      return { success: false, error: err.message };
    }
  };

  const adicionarCategoria = async ({ nome, cor }) => {
    if (!usuarioLogado || !window.apiTurso) return;
    try {
      await window.apiTurso.adicionarCategoria({ usuarioId: usuarioLogado.id, nome, cor });
      await carregarCategorias(usuarioLogado.id);
    } catch (err) {
      console.error('Erro ao adicionar categoria:', err);
    }
  };

  const deletarCategoria = async (catId) => {
    if (!usuarioLogado || !window.apiTurso) return;
    try {
      await window.apiTurso.deletarCategoria({ id: catId, usuarioId: usuarioLogado.id });
      await carregarCategorias(usuarioLogado.id);
    } catch (err) {
      console.error('Erro ao deletar categoria:', err);
    }
  };

  const reordenarCategorias = async (novasCategorias) => {
    if (!usuarioLogado || !window.apiTurso) return;
    setCategorias(novasCategorias);
    const ordemIds = novasCategorias.map((c) => c.id).filter(Boolean);
    try {
      await window.apiTurso.reordenarCategorias({
        usuarioId: usuarioLogado.id,
        ordemIds,
      });
    } catch (err) {
      console.error('Erro ao reordenar categorias:', err);
    }
  };

  const reordenarEtiquetas = async (novasEtiquetas) => {
    if (!usuarioLogado || !window.apiTurso) return;
    setEtiquetaList(novasEtiquetas);
    try {
      await window.apiTurso.reordenarEtiquetas({
        usuarioId: usuarioLogado.id,
        ordemEtiquetas: novasEtiquetas,
      });
    } catch (err) {
      console.error('Erro ao reordenar etiquetas:', err);
    }
  };

  const deletarEtiqueta = async (nome) => {
    if (!usuarioLogado || !window.apiTurso) return;
    try {
      await window.apiTurso.deletarEtiqueta({ usuarioId: usuarioLogado.id, nome });
      await carregarEtiquetas(usuarioLogado.id);
    } catch (err) {
      console.error('Erro ao deletar etiqueta:', err);
    }
  };

  const obterTransacoesParaExportar = async (opcaoParam, anoParam) => {
    if (!window.apiTurso || !usuarioLogado) return { targetReceitas: [], targetDespesas: [], mesLabel: '', anoLabel: '' };

    if (typeof opcaoParam === 'object' && opcaoParam !== null && opcaoParam.modo === 'intervalo') {
      const { mesInicio, anoInicio, mesFim, anoFim } = opcaoParam;
      const res = await window.apiTurso.carregarTransacoes({
        usuarioId: usuarioLogado.id,
        contaId: contaAtiva?.id,
        mes: 'Todos',
        ano: 'Todos',
      });

      const idxInicio = MESES_LISTA.indexOf(mesInicio) >= 0 ? MESES_LISTA.indexOf(mesInicio) : 0;
      const idxFim = MESES_LISTA.indexOf(mesFim) >= 0 ? MESES_LISTA.indexOf(mesFim) : 11;
      const valStart = parseInt(anoInicio, 10) * 12 + idxInicio;
      const valEnd = parseInt(anoFim, 10) * 12 + idxFim;

      const filterFn = (item) => {
        const itemMesIdx = MESES_LISTA.indexOf(item.mes) >= 0 ? MESES_LISTA.indexOf(item.mes) : 0;
        const itemVal = parseInt(item.ano, 10) * 12 + itemMesIdx;
        return itemVal >= valStart && itemVal <= valEnd;
      };

      return {
        targetReceitas: (res?.receitas || []).filter(filterFn),
        targetDespesas: (res?.despesas || []).filter(filterFn),
        mesLabel: `${mesInicio}/${anoInicio} a ${mesFim}/${anoFim}`,
        anoLabel: `${anoInicio}-${anoFim}`,
      };
    } else {
      let m = mesSelecionado;
      let a = anoSelecionado;

      if (typeof opcaoParam === 'object' && opcaoParam !== null) {
        m = opcaoParam.mes || mesSelecionado;
        a = opcaoParam.ano || anoSelecionado;
      } else if (typeof opcaoParam === 'string') {
        m = opcaoParam;
        a = anoParam || anoSelecionado;
      }

      let targetReceitas = receitas || [];
      let targetDespesas = despesas || [];

      if (m === 'Todos' || m !== mesSelecionado || a !== anoSelecionado) {
        const res = await window.apiTurso.carregarTransacoes({
          usuarioId: usuarioLogado.id,
          contaId: contaAtiva?.id,
          mes: m,
          ano: a,
        });
        targetReceitas = Array.isArray(res?.receitas) ? res.receitas : [];
        targetDespesas = Array.isArray(res?.despesas) ? res.despesas : [];
      }

      return {
        targetReceitas,
        targetDespesas,
        mesLabel: m,
        anoLabel: a,
      };
    }
  };

  const exportarCSV = async (opcaoParam, anoParam) => {
    const { targetReceitas, targetDespesas, mesLabel, anoLabel } = await obterTransacoesParaExportar(opcaoParam, anoParam);
    if (!window.apiTurso) return;

    const dadosCombinados = [
      ...targetReceitas.map((r) => ({ ...r, tipo: 'receitas' })),
      ...targetDespesas.map((d) => ({ ...d, tipo: 'despesas' })),
    ];

    return await window.apiTurso.exportarCSV({
      dados: dadosCombinados,
      mes: mesLabel,
      ano: anoLabel,
    });
  };

  const exportarPDF = async (opcaoParam, anoParam) => {
    const { targetReceitas, targetDespesas, mesLabel, anoLabel } = await obterTransacoesParaExportar(opcaoParam, anoParam);
    if (!window.apiTurso) return;

    const totRec = targetReceitas.reduce((acc, curr) => acc + Number(curr.valor || 0), 0);
    const totDesp = targetDespesas.reduce((acc, curr) => acc + Number(curr.valor || 0), 0);
    const econ = totRec - totDesp;

    return await window.apiTurso.exportarPDF({
      receitasList: targetReceitas,
      despesasList: targetDespesas,
      categorias: categorias || [],
      mes: mesLabel,
      ano: anoLabel,
      totalReceitas: totRec,
      totalDespesas: totDesp,
      economia: econ,
      usuarioNome: usuarioLogado?.nome || '',
    });
  };

  const excluirContaUsuario = async ({ confirmacaoText }) => {
    if (!usuarioLogado?.id || !window.apiTurso) return { success: false, error: 'Usuário não identificado.' };
    const res = await window.apiTurso.excluirContaUsuario({
      usuarioId: usuarioLogado.id,
      confirmacaoText,
    });
    if (res?.success) {
      await logout();
    }
    return res;
  };

  const totalReceitas = (receitas || []).reduce((acc, curr) => acc + Number(curr.valor || 0), 0);
  const totalDespesas = (despesas || []).reduce((acc, curr) => acc + Number(curr.valor || 0), 0);
  const totalReservas = (despesas || []).reduce(
    (acc, curr) => (curr.eh_reserva === 1 || curr.eh_reserva === '1' || curr.eh_reserva === true || curr.ehReserva ? acc + Number(curr.valor || 0) : acc),
    0
  );
  const despesasReais = totalDespesas - totalReservas;
  const saldoLivre = totalReceitas - totalDespesas;
  // Economia / Valor a ser guardado na Caixinha:
  // As reservas não são subtraídas da caixinha (somam ao valor guardado)
  const economia = totalReceitas - despesasReais;
  const transacoesTabela = abaAtiva === 'receitas' ? (receitas || []) : (despesas || []);

  return (
    <BudgetContext.Provider
      value={{
        usuarioLogado,
        sincronizarUsuarioLogado,
        login,
        loginGoogle,
        registrar,
        logout,
        contas: contas || [],
        contaAtiva,
        criarNovaConta,
        deletarConta,
        selecionarConta,
        isAccountModalOpen,
        setIsAccountModalOpen,
        isComercial,
        isIndividual,
        anoSelecionado,
        setAnoSelecionado,
        mesSelecionado,
        setMesSelecionado,
        abaAtiva,
        setAbaAtiva,
        receitas: receitas || [],
        despesas: despesas || [],
        categorias: categorias || [],
        etiquetaList: etiquetaList || ['Geral'],
        carregarEtiquetas,
        adicionarEtiqueta,
        transacoesTabela: transacoesTabela || [],
        totalReceitas,
        totalDespesas,
        totalReservas,
        despesasReais,
        saldoLivre,
        economia,
        isModalOpen,
        setIsModalOpen,
        modalInitialData,
        setModalInitialData,
        abrirModalAdicionar,
        isCategoryModalOpen,
        setIsCategoryModalOpen,
        adicionarTransacao,
        editarTransacao,
        deletarTransacao,
        importarTransacoesNubankCSV,
        adicionarCategoria,
        deletarCategoria,
        reordenarCategorias,
        reordenarEtiquetas,
        deletarEtiqueta,
        exportarCSV,
        exportarPDF,
        excluirContaUsuario,
        ANOS_LISTA,
        MESES_LISTA,
        isCaixinhaAtiva,
        toggleCaixinha,
        saldoInicialCaixinha,
        atualizarSaldoInicialCaixinha,
        caixinhaRendimentoTaxa,
        caixinhaRendimentoPeriodo,
        atualizarRendimentoCaixinha,
        saldoCaixinhaAcumulado,
        carregarTotalCaixinha,
        modoCaixinhaVisao,
        setModoCaixinhaVisao,
        horizontePrevisao,
        setHorizontePrevisao: atualizarHorizontePrevisao,
        mesesPersonalizados,
        setMesesPersonalizados: atualizarMesesPersonalizados,
        tipoPrevisaoEspecifica,
        setTipoPrevisaoEspecifica: atualizarTipoPrevisaoEspecifica,
        mesMetaPrevisao,
        anoMetaPrevisao,
        atualizarDataMetaPrevisao,
        aporteExtraMensal,
        setAporteExtraMensal: atualizarAporteExtraMensal,
        metaSaldoCaixinha,
        setMetaSaldoCaixinha: atualizarMetaSaldoCaixinha,
        paletaCores,
        aplicarPaletaCores,
        PALETAS_PREDEFINIDAS,
        updateDisponivel,
        updateStatus,
        isUpdateModalOpen,
        setIsUpdateModalOpen,
        verificandoUpdate,
        mensagemUpdate,
        verificarAtualizacoesManual,
        forcarBuscaEAtualizacao,
        ignorarVersaoUpdate,
        baixarAtualizacaoNativa,
        reiniciarEAplicarAtualizacao,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => useContext(BudgetContext);
