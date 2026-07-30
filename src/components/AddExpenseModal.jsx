import React, { useState } from 'react';
import { useBudget } from '../contexts/BudgetContext';
import CategoryManagerModal from './CategoryManagerModal';

const mesesList = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function AddExpenseModal() {
  const {
    isModalOpen,
    setIsModalOpen,
    adicionarTransacao,
    abaAtiva,
    mesSelecionado,
    categorias,
    setIsCategoryModalOpen,
  } = useBudget();

  const [nome, setNome] = useState('');
  const [valorRaw, setValorRaw] = useState(0);
  const [valorExibido, setValorExibido] = useState('');
  const [parcelaAtual, setParcelaAtual] = useState('1');
  const [totalParcelas, setTotalParcelas] = useState('1');
  const [ehFixa, setEhFixa] = useState(false);
  const [etiqueta, setEtiqueta] = useState('');
  const [classificacao, setClassificacao] = useState('Alimentação');
  const [descricao, setDescricao] = useState('');

  const [mesOrigem, setMesOrigem] = useState(() => mesesList[new Date().getMonth()]);

  if (!isModalOpen) return null;

  const isReceita = abaAtiva === 'receitas';
  const isAbaTodos = mesSelecionado === 'Todos';

  // Máscara de valor estilo Caixa Eletrônico (sem necessidade de digitar vírgulas ou pontos)
  const handleValorChange = (e) => {
    const apenasNumeros = e.target.value.replace(/\D/g, '');

    if (!apenasNumeros) {
      setValorRaw(0);
      setValorExibido('');
      return;
    }

    const valorNumerico = parseFloat(apenasNumeros) / 100;
    setValorRaw(valorNumerico);
    setValorExibido(
      valorNumerico.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nome || valorRaw <= 0) return;

    adicionarTransacao({
      nome,
      valor: valorRaw,
      parcelaAtual: parseInt(parcelaAtual, 10) || 1,
      totalParcelas: parseInt(totalParcelas, 10) || 1,
      ehFixa,
      etiqueta: etiqueta || 'Geral',
      classificacao: classificacao || (categorias[0]?.nome || 'Outros'),
      descricao,
      tipo: abaAtiva,
      mesPersonalizado: isAbaTodos ? mesOrigem : mesSelecionado,
    });

    // Limpa o formulário e fecha o modal
    setNome('');
    setValorRaw(0);
    setValorExibido('');
    setParcelaAtual('1');
    setTotalParcelas('1');
    setEhFixa(false);
    setEtiqueta('');
    setClassificacao('Alimentação');
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
          width: '390px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          color: '#ffe192',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>
            {isReceita ? 'Registro de Receita' : 'Registro de Despesa'}
          </h2>
          <button
            onClick={() => setIsModalOpen(false)}
            style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '22px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Se estiver na aba Todos, exibe o seletor do Mês de Origem */}
          {isAbaTodos && (
            <div>
              <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', fontWeight: 'bold', color: '#ffe192' }}>
                Mês de Origem*
              </label>
              <select
                value={mesOrigem}
                onChange={(e) => setMesOrigem(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ffe192', backgroundColor: '#666666', color: '#ffe192', fontWeight: 'bold', boxSizing: 'border-box' }}
              >
                {mesesList.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
              {isReceita ? 'Nome da Receita*' : 'Nome da Despesa*'}
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              placeholder={isReceita ? 'Ex: Salário, Freelance, Rendimentos' : 'Ex: Supermercado, Aluguel, Farmácia'}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #737373', backgroundColor: '#666666', color: '#ffffff', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
              {isReceita
                ? 'Valor Recorrente (R$)*'
                : (ehFixa ? 'Valor Mensal da Despesa (R$)*' : 'Valor Total da Compra (R$)*')}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={valorExibido}
              onChange={handleValorChange}
              required
              placeholder="0,00"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #737373', backgroundColor: '#666666', color: '#ffffff', boxSizing: 'border-box' }}
            />
          </div>

          {/* Opção Checkbox de Despesa/Receita Fixa */}
          <div
            onClick={() => setEhFixa(!ehFixa)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: '#666666',
              padding: '10px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              border: ehFixa ? '1px solid #ffe192' : '1px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            <input
              type="checkbox"
              checked={ehFixa}
              onChange={(e) => setEhFixa(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#ffe192' }}
            />
            <span style={{ fontSize: '13px', color: '#ffffff', fontWeight: '500' }}>
              {isReceita
                ? 'Marcar como Receita Fixa (repetir até Dez)'
                : 'Marcar como Despesa Fixa (repetir até Dez)'}
            </span>
          </div>

          {/* Seção de Recorrência / Parcelamento (Somente se não for Fixa) */}
          {!ehFixa && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                  {isReceita ? 'Recorrência Atual*' : 'Parcela Atual*'}
                </label>
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
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                  {isReceita ? 'Total Recorrências*' : 'Total Parcelas*'}
                </label>
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
          )}

          {/* Classificação com Botão de Gerenciar Categorias */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '12px' }}>Classificação / Categoria</label>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffe192',
                  fontSize: '11px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontWeight: 'bold',
                }}
              >
                🎨 Gerenciar
              </button>
            </div>

            <select
              value={classificacao}
              onChange={(e) => setClassificacao(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #737373', backgroundColor: '#666666', color: '#ffffff', boxSizing: 'border-box' }}
            >
              {categorias.length === 0 ? (
                <option value="Outros">Outros</option>
              ) : (
                categorias.map((cat) => (
                  <option key={cat.id || cat.nome} value={cat.nome}>
                    {cat.nome}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Etiqueta</label>
            <input
              type="text"
              value={etiqueta}
              onChange={(e) => setEtiqueta(e.target.value)}
              placeholder={isReceita ? 'Ex: Fixo, Variável, Bônus' : 'Ex: Fixo, Variável, Cartão'}
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
            Adicionar {isReceita ? 'Receita' : 'Despesa'}
          </button>
        </form>

        {/* Modal Gerenciador de Categorias */}
        <CategoryManagerModal />
      </div>
    </div>
  );
}
