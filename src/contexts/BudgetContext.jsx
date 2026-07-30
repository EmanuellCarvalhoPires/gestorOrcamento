import React, { createContext, useContext, useState, useEffect } from 'react';

export const BudgetContext = createContext();

const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function BudgetProvider({ children }) {
  const dataAtual = new Date();
  const anoAtualStr = dataAtual.getFullYear().toString();
  const mesAtualStr = mesesNomes[dataAtual.getMonth()];

  // Estado do Usuário Autenticado
  const [usuarioLogado, setUsuarioLogado] = useState(() => {
    try {
      const usuarioSalvo = localStorage.getItem('usuarioLogado');
      return usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
    } catch {
      return null;
    }
  });

  // Lista de Anos
  const [anos, setAnos] = useState(() => {
    const baseAnos = ['2024', '2025', '2026', '2027'];
    if (!baseAnos.includes(anoAtualStr)) {
      return [...baseAnos, anoAtualStr].sort();
    }
    return baseAnos;
  });

  // Inicializa Mês e Ano reais de hoje
  const [anoSelecionado, setAnoSelecionado] = useState(anoAtualStr);
  const [mesSelecionado, setMesSelecionado] = useState(mesAtualStr);
  
  // Controle da Aba Ativa: 'receitas' ou 'despesas'
  const [abaAtiva, setAbaAtiva] = useState('despesas');

  // Controle de Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Estados principais
  const [categorias, setCategorias] = useState([]);
  const [receitas, setReceitas] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [loading, setLoading] = useState(false);

  // Carrega Categorias
  const carregarCategoriasDoBanco = async () => {
    if (!usuarioLogado) return;
    if (window.apiTurso) {
      try {
        const list = await window.apiTurso.carregarCategorias(usuarioLogado.id);
        setCategorias(list || []);
      } catch (err) {
        console.error('Erro ao carregar categorias:', err);
      }
    }
  };

  // Carrega transações de receitas e despesas no Turso
  const carregarTransacoesDoBanco = async () => {
    if (!usuarioLogado) {
      setReceitas([]);
      setDespesas([]);
      return;
    }

    if (window.apiTurso) {
      setLoading(true);
      try {
        const dados = await window.apiTurso.carregarTransacoes(usuarioLogado.id, mesSelecionado, anoSelecionado);
        setReceitas(dados.receitas || []);
        setDespesas(dados.despesas || []);
      } catch (err) {
        console.error('Erro ao buscar dados do Turso:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    carregarCategoriasDoBanco();
    carregarTransacoesDoBanco();
  }, [usuarioLogado, mesSelecionado, anoSelecionado]);

  // Login
  const login = async ({ email, senha }) => {
    if (window.apiTurso) {
      const res = await window.apiTurso.loginUsuario({ email, senha });
      if (res.success) {
        setUsuarioLogado(res.user);
        localStorage.setItem('usuarioLogado', JSON.stringify(res.user));
        return { success: true };
      }
      return { success: false, error: res.error };
    }
    return { success: false, error: 'API do Turso não disponível.' };
  };

  // Registro
  const registrar = async ({ nome, email, senha }) => {
    if (window.apiTurso) {
      const res = await window.apiTurso.registrarUsuario({ nome, email, senha });
      if (res.success) {
        setUsuarioLogado(res.user);
        localStorage.setItem('usuarioLogado', JSON.stringify(res.user));
        return { success: true };
      }
      return { success: false, error: res.error };
    }
    return { success: false, error: 'API do Turso não disponível.' };
  };

  // Logout
  const logout = () => {
    setUsuarioLogado(null);
    setReceitas([]);
    setDespesas([]);
    setCategorias([]);
    localStorage.removeItem('usuarioLogado');
  };

  // Adicionar Nova Categoria Customizada
  const adicionarCategoria = async ({ nome, cor }) => {
    if (!usuarioLogado) return;
    if (window.apiTurso) {
      const res = await window.apiTurso.adicionarCategoria({
        usuarioId: usuarioLogado.id,
        nome,
        cor,
      });
      if (res.success) {
        await carregarCategoriasDoBanco();
      }
    }
  };

  // Deletar Categoria
  const deletarCategoria = async (id) => {
    if (!usuarioLogado) return;
    if (window.apiTurso) {
      const res = await window.apiTurso.deletarCategoria(id, usuarioLogado.id);
      if (res.success) {
        await carregarCategoriasDoBanco();
      }
    }
  };

  // Adicionar Ano
  const adicionarAno = () => {
    const ultimoAno = parseInt(anos[anos.length - 1], 10);
    const novoAno = (ultimoAno + 1).toString();
    setAnos([...anos, novoAno]);
    setAnoSelecionado(novoAno);
  };

  // Adicionar Transação
  const adicionarTransacao = async (novaTransacao) => {
    if (!usuarioLogado) return;

    const mesOrigemCalculado = (novaTransacao.mesPersonalizado && novaTransacao.mesPersonalizado !== 'Todos')
      ? novaTransacao.mesPersonalizado
      : (mesSelecionado !== 'Todos' ? mesSelecionado : mesesNomes[new Date().getMonth()]);

    const itemParaSalvar = {
      ...novaTransacao,
      usuarioId: usuarioLogado.id,
      mes: mesOrigemCalculado,
      ano: anoSelecionado,
    };

    if (window.apiTurso) {
      const res = await window.apiTurso.adicionarTransacao(itemParaSalvar);
      if (res.success) {
        await carregarTransacoesDoBanco();
      }
    }
  };

  // Editar Transação
  const editarTransacao = async (dadosEdicao) => {
    if (!usuarioLogado) return;

    const itemParaSalvar = {
      ...dadosEdicao,
      usuarioId: usuarioLogado.id,
    };

    if (window.apiTurso) {
      const res = await window.apiTurso.editarTransacao(itemParaSalvar);
      if (res.success) {
        await carregarTransacoesDoBanco();
      }
    }
  };

  // Deletar Transação
  const deletarTransacao = async (id, opcoes = {}) => {
    if (!usuarioLogado) return;

    if (window.apiTurso) {
      const res = await window.apiTurso.deletarTransacao(id, usuarioLogado.id, opcoes);
      if (res.success) {
        await carregarTransacoesDoBanco();
      }
    }
  };

  // Exportar Excel (CSV)
  const exportarCSV = async () => {
    if (!usuarioLogado || !window.apiTurso) return;

    const dadosUnificados = [
      ...receitas.map((r) => ({ ...r, tipo: 'receitas' })),
      ...despesas.map((d) => ({ ...d, tipo: 'despesas' })),
    ];

    return await window.apiTurso.exportarCSV({
      dados: dadosUnificados,
      mes: mesSelecionado,
      ano: anoSelecionado,
    });
  };

  // Exportar PDF Executivo
  const exportarPDF = async () => {
    if (!usuarioLogado || !window.apiTurso) return;

    const totalRec = receitas.reduce((acc, item) => acc + Number(item.valor), 0);
    const totalDesp = despesas.reduce((acc, item) => acc + Number(item.valor), 0);

    return await window.apiTurso.exportarPDF({
      receitasList: receitas,
      despesasList: despesas,
      categorias,
      mes: mesSelecionado,
      ano: anoSelecionado,
      totalReceitas: totalRec,
      totalDespesas: totalDesp,
      economia: totalRec - totalDesp,
      usuarioNome: usuarioLogado.nome,
    });
  };

  // --- CÁLCULOS E FILTROS ---

  const transacoesTabela = abaAtiva === 'receitas' ? receitas : despesas;

  const totalReceitas = receitas.reduce((acc, item) => acc + Number(item.valor), 0);
  const totalDespesas = despesas.reduce((acc, item) => acc + Number(item.valor), 0);
  const economia = totalReceitas - totalDespesas;

  return (
    <BudgetContext.Provider
      value={{
        usuarioLogado,
        login,
        registrar,
        logout,
        anos,
        anoSelecionado,
        setAnoSelecionado,
        adicionarAno,
        mesSelecionado,
        setMesSelecionado,
        abaAtiva,
        setAbaAtiva,
        isModalOpen,
        setIsModalOpen,
        isCategoryModalOpen,
        setIsCategoryModalOpen,
        categorias,
        adicionarCategoria,
        deletarCategoria,
        transacoesTabela,
        receitas,
        despesas,
        totalReceitas,
        totalDespesas,
        economia,
        loading,
        adicionarTransacao,
        editarTransacao,
        deletarTransacao,
        exportarCSV,
        exportarPDF,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget deve ser usado dentro de um BudgetProvider');
  }
  return context;
}
