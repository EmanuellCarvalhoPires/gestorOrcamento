import React, { useState } from 'react';
import { useBudget } from '../contexts/BudgetContext';

export default function AddExpenseModal() {
  const { isModalOpen, setIsModalOpen, adicionarTransacao, abaAtiva } = useBudget();

  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');
  const [parcelaAtual, setParcelaAtual] = useState('1');
  const [totalParcelas, setTotalParcelas] = useState('1');
  const [etiqueta, setEtiqueta] = useState('');
  const [classificacao, setClassificacao] = useState('Vendas');
  const [descricao, setDescricao] = useState('');

  if (!isModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nome || !valor) return;

    // Formata o parcelamento (ex: "1/1", "1/6", "3/10")
    const stringParcelas = `${parcelaAtual || 1}/${totalParcelas || 1}`;

    adicionarTransacao({
      nome,
      valor: parseFloat(valor),
      parcelas: stringParcelas,
      etiqueta: etiqueta || 'Geral',
      classificacao: classificacao || 'Outros',
      descricao,
      tipo: abaAtiva === 'receitas' ? 'receita' : 'despesa',
    });

    // Limpa o formulário e fecha o modal
    setNome('');
    setValor('');
    setParcelaAtual('1');
    setTotalParcelas('1');
    setEtiqueta('');
    setClassificacao('Vendas');
    setDescricao('');
    setIsModalOpen(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: '#545454',
          borderRadius: '16px',
          padding: '24px',
          width: '380px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          color: '#ffe192',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>
            Registro de {abaAtiva === 'receitas' ? 'Receitas' : 'Despesas'}
          </h2>
          <button
            onClick={() => setIsModalOpen(false)}
            style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '22px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Nome*</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              placeholder="Ex: Aluguel, Venda de Serviço"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #737373', backgroundColor: '#666666', color: '#ffffff', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Valor*</label>
            <input
              type="number"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
              placeholder="0,00"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #737373', backgroundColor: '#666666', color: '#ffffff', boxSizing: 'border-box' }}
            />
          </div>

          {/* Seção de Parcelamento Flexível */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Parcela Atual*</label>
              <input
                type="number"
                min="1"
                value={parcelaAtual}
                onChange={(e) => setParcelaAtual(e.target.value)}
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #737373', backgroundColor: '#666666', color: '#ffffff', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Total Parcelas*</label>
              <input
                type="number"
                min="1"
                value={totalParcelas}
                onChange={(e) => setTotalParcelas(e.target.value)}
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #737373', backgroundColor: '#666666', color: '#ffffff', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Classificação / Categoria</label>
            <select
              value={classificacao}
              onChange={(e) => setClassificacao(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #737373', backgroundColor: '#666666', color: '#ffffff', boxSizing: 'border-box' }}
            >
              <option value="Vendas">Vendas</option>
              <option value="Finanças">Finanças</option>
              <option value="Marketing">Marketing</option>
              <option value="RH">RH</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Etiqueta</label>
            <input
              type="text"
              value={etiqueta}
              onChange={(e) => setEtiqueta(e.target.value)}
              placeholder="Ex: Fixo, Variável, Campanha"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #737373', backgroundColor: '#666666', color: '#ffffff', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Descrição</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows="2"
              placeholder="Observações adicionais"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #737373', backgroundColor: '#666666', color: '#ffffff', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: '12px',
              borderRadius: '24px',
              border: 'none',
              backgroundColor: '#ffe192',
              color: '#333333',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: 'pointer',
              marginTop: '8px',
            }}
          >
            Adicionar {abaAtiva === 'receitas' ? 'Receita' : 'Gasto'}
          </button>
        </form>
      </div>
    </div>
  );
}
