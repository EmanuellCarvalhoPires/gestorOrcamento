import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api.js';

const BudgetContext = createContext();

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
  const [anoSelecionado, setAnoSelecionado] = useState('2026');
  const [mesSelecionado, setMesSelecionado] = useState('Jan');
  const [abaAtiva, setAbaAtiva] = useState('despesas'); // 'receitas' ou 'despesas'

  // Transações, Categorias e Etiquetas Reutilizáveis
  const [receitas, setReceitas] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [etiquetaList, setEtiquetaList] = useState(['Geral']);

  // Modais Globais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

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
    }
  }, [usuarioLogado?.id, contaAtiva?.id, anoSelecionado, mesSelecionado]);

  const adicionarTransacao = async (novaTransacao) => {
    if (!usuarioLogado || !window.apiTurso) return;

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
        await carregarTransacoes();
        await carregarEtiquetas(usuarioLogado.id);
      }
    } catch (err) {
      console.error('Erro ao adicionar transação:', err);
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
        await carregarTransacoes();
        await carregarEtiquetas(usuarioLogado.id);
      }
      return res;
    } catch (err) {
      console.error('Erro ao editar transação:', err);
    }
  };

  const deletarTransacao = async (id, opcoesExtra = {}) => {
    if (!usuarioLogado || !window.apiTurso) return;
    try {
      await window.apiTurso.deletarTransacao({
        id,
        usuarioId: usuarioLogado.id,
        ...opcoesExtra,
      });
      await carregarTransacoes();
    } catch (err) {
      console.error('Erro ao deletar transação:', err);
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

  const exportarCSV = async () => {
    if (!window.apiTurso) return;
    const dadosCombinados = [
      ...(receitas || []).map((r) => ({ ...r, tipo: 'receitas' })),
      ...(despesas || []).map((d) => ({ ...d, tipo: 'despesas' })),
    ];
    return await window.apiTurso.exportarCSV({
      dados: dadosCombinados,
      mes: mesSelecionado,
      ano: anoSelecionado,
    });
  };

  const exportarPDF = async () => {
    if (!window.apiTurso) return;
    return await window.apiTurso.exportarPDF({
      receitasList: receitas || [],
      despesasList: despesas || [],
      categorias: categorias || [],
      mes: mesSelecionado,
      ano: anoSelecionado,
      totalReceitas,
      totalDespesas,
      economia,
      usuarioNome: usuarioLogado?.nome || '',
    });
  };

  const totalReceitas = (receitas || []).reduce((acc, curr) => acc + Number(curr.valor || 0), 0);
  const totalDespesas = (despesas || []).reduce((acc, curr) => acc + Number(curr.valor || 0), 0);
  const economia = totalReceitas - totalDespesas;
  const transacoesTabela = abaAtiva === 'receitas' ? (receitas || []) : (despesas || []);

  return (
    <BudgetContext.Provider
      value={{
        usuarioLogado,
        login,
        loginGoogle,
        registrar,
        logout,
        contas: contas || [],
        contaAtiva,
        selecionarConta,
        criarNovaConta,
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
        economia,
        isModalOpen,
        setIsModalOpen,
        isCategoryModalOpen,
        setIsCategoryModalOpen,
        adicionarTransacao,
        editarTransacao,
        deletarTransacao,
        adicionarCategoria,
        deletarCategoria,
        exportarCSV,
        exportarPDF,
        ANOS_LISTA,
        MESES_LISTA,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => useContext(BudgetContext);
