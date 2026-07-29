import React, { createContext, useContext, useState } from 'react';

// 1. Cria a Central de Dados (Contexto)
export const BudgetContext = createContext();

export function BudgetProvider({ children }) {
  // Lista de Anos e seleção atual
  const [anos, setAnos] = useState(['2024', '2025', '2026', '2027']);
  const [anoSelecionado, setAnoSelecionado] = useState('2026');
  
  // Seleção de Mês
  const [mesSelecionado, setMesSelecionado] = useState('Jan');
  
  // Controle da Aba Ativa da Tabela ('despesas' ou 'receitas')
  const [abaAtiva, setAbaAtiva] = useState('despesas');

  // Controle de visibilidade do Modal de Cadastro
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Lista Inicial de Transações (Receitas e Despesas)
  const [transacoes, setTransacoes] = useState([
    { id: 1, nome: 'Venda de Projeto', classificacao: 'Vendas', etiqueta: 'Clientes', parcelas: '1/1', valor: 5300, tipo: 'receita', mes: 'Jan', ano: '2026' },
    { id: 2, nome: 'Aluguel do Escritório', classificacao: 'Finanças', etiqueta: 'Fixo', parcelas: '1/12', valor: 2500, tipo: 'despesa', mes: 'Jan', ano: '2026' },
    { id: 3, nome: 'Anúncios Google', classificacao: 'Marketing', etiqueta: 'Campanha', parcelas: '1/1', valor: 1500, tipo: 'despesa', mes: 'Jan', ano: '2026' },
    { id: 4, nome: 'Sistemas RH', classificacao: 'RH', etiqueta: 'Licença', parcelas: '1/1', valor: 600, tipo: 'despesa', mes: 'Jan', ano: '2026' },
  ]);

  // Função para criar um novo ano na lista
  const adicionarAno = () => {
    const ultimoAno = parseInt(anos[anos.length - 1], 10);
    const novoAno = (ultimoAno + 1).toString();
    setAnos([...anos, novoAno]);
    setAnoSelecionado(novoAno);
  };

  // Função para adicionar uma nova transação (Receita ou Despesa)
  const adicionarTransacao = (novaTransacao) => {
    const item = {
      id: Date.now(),
      ...novaTransacao,
      mes: mesSelecionado,
      ano: anoSelecionado,
    };
    setTransacoes((prev) => [...prev, item]);
  };

  // --- CÁLCULOS AUTOMÁTICOS ---

  // 1. Transações filtradas para o Mês e Ano ativos
  const transacoesFiltradas = transacoes.filter(
    (t) => t.mes === mesSelecionado && t.ano === anoSelecionado
  );

  // 2. Transações para exibição na tabela (filtradas por receita vs despesa)
  const transacoesTabela = transacoesFiltradas.filter(
    (t) => t.tipo === (abaAtiva === 'receitas' ? 'receita' : 'despesa')
  );

  // 3. Totais Financeiros
  const totalReceitas = transacoesFiltradas
    .filter((t) => t.tipo === 'receita')
    .reduce((acc, item) => acc + Number(item.valor), 0);

  const totalDespesas = transacoesFiltradas
    .filter((t) => t.tipo === 'despesa')
    .reduce((acc, item) => acc + Number(item.valor), 0);

  const economia = totalReceitas - totalDespesas;

  return (
    <BudgetContext.Provider
      value={{
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
        transacoesFiltradas,
        transacoesTabela,
        totalReceitas,
        totalDespesas,
        economia,
        adicionarTransacao,
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
