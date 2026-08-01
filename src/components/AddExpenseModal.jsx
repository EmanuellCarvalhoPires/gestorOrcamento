import React, { useState, useEffect } from 'react';
import { useBudget } from '../contexts/BudgetContext';

const MESES_LISTA = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function AddExpenseModal() {
  const {
    isModalOpen,
    setIsModalOpen,
    adicionarTransacao,
    categorias,
    etiquetaList,
    isComercial,
    setIsCategoryModalOpen,
    setMesSelecionado,
    setAnoSelecionado,
    abaAtiva,
    setAbaAtiva,
  } = useBudget();

  // Helper para formatar a data/hora local atual para o input datetime-local (YYYY-MM-DDTHH:mm)
  const getNowFormatted = () => {
    const d = new Date();
    const pad = (n) => (n < 10 ? `0${n}` : n);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [tipo, setTipo] = useState('despesa'); // 'despesa' ou 'receita'
  const [nome, setNome] = useState('');
  const [valorFormatado, setValorFormatado] = useState('R$ 0,00');
  const [valorNumerico, setValorNumerico] = useState(0);
  
  const [classificacao, setClassificacao] = useState('');
  const [etiqueta, setEtiqueta] = useState('Geral');
  const [dataTransacao, setDataTransacao] = useState(getNowFormatted());
  
  const [isParcelado, setIsParcelado] = useState(false);
  const [parcelaAtual, setParcelaAtual] = useState(1);
  const [totalParcelas, setTotalParcelas] = useState(1);
  
  const [ehFixa, setEhFixa] = useState(false);
  const [descricao, setDescricao] = useState('');

  // Sincroniza o tipo do modal (Receita x Despesa) com a aba ativa da tabela ao abrir o modal
  useEffect(() => {
    if (isModalOpen) {
      setTipo(abaAtiva === 'receitas' || abaAtiva === 'receita' ? 'receita' : 'despesa');
      setDataTransacao(getNowFormatted());
    }
  }, [isModalOpen, abaAtiva]);

  if (!isModalOpen) return null;

  // Máscara de Caixa Eletrônico (ATM): digita números e formata em R$ 0,00 em tempo real
  const handleValorChange = (e) => {
    const apenasDigitos = e.target.value.replace(/\D/g, '');
    const numero = Number(apenasDigitos) / 100;
    setValorNumerico(numero);

    const formatado = numero.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
    setValorFormatado(formatado);
  };

  const handleTipoChange = (novoTipo) => {
    setTipo(novoTipo);
    setClassificacao('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome.trim() || valorNumerico <= 0) return;

    const catFinal = classificacao || (categorias[0]?.nome || 'Outros');

    // Deriva o Mês e Ano diretamente da Data Selecionada
    const dtObj = dataTransacao ? new Date(dataTransacao) : new Date();
    const mesCalculado = MESES_LISTA[dtObj.getMonth()];
    const anoCalculado = dtObj.getFullYear().toString();

    await adicionarTransacao({
      tipo,
      nome,
      valor: valorNumerico,
      classificacao: catFinal,
      etiqueta: etiqueta.trim() || 'Geral',
      dataTransacao,
      parcelaAtual: isParcelado ? parcelaAtual : 1,
      totalParcelas: isParcelado ? totalParcelas : 1,
      ehFixa,
      descricao,
      mesPersonalizado: mesCalculado,
      ano: anoCalculado,
    });

    setMesSelecionado(mesCalculado);
    setAnoSelecionado(anoCalculado);
    setAbaAtiva(tipo === 'receita' ? 'receitas' : 'despesas');

    // Reset Form
    setNome('');
    setValorFormatado('R$ 0,00');
    setValorNumerico(0);
    setClassificacao('');
    setEtiqueta('Geral');
    setDataTransacao(getNowFormatted());
    setIsParcelado(false);
    setParcelaAtual(1);
    setTotalParcelas(1);
    setEhFixa(false);
    setDescricao('');
    setIsModalOpen(false);
  };

  // Nomenclaturas adaptativas por perfil
  const tituloModal = isComercial
    ? (tipo === 'receita' ? 'Nova Venda / Faturamento Comercial' : 'Novo Custo / Despesa Comercial')
    : (tipo === 'receita' ? 'Adicionar Receita' : 'Adicionar Despesa');

  const labelNome = isComercial
    ? (tipo === 'receita' ? 'Nome do Cliente ou Produto/Venda' : 'Nome do Fornecedor ou Custo')
    : (tipo === 'receita' ? 'Nome da Receita / Origem' : 'Nome da Despesa');

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: '#545454',
          borderRadius: '24px',
          padding: '32px',
          width: '90%',
          maxWidth: '520px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Topo do Modal com Seleção de Tipo - MESMA ORDEM DA TABELA: Receita à Esquerda, Despesa à Direita */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#ffffff', fontSize: '20px', fontWeight: 'bold' }}>
            {tituloModal}
          </h3>

          <div style={{ display: 'flex', gap: '4px', backgroundColor: '#3e3e3e', padding: '3px', borderRadius: '20px' }}>
            <button
              type="button"
              onClick={() => handleTipoChange('receita')}
              style={{
                padding: '6px 14px',
                borderRadius: '16px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
                backgroundColor: tipo === 'receita' ? '#666666' : 'transparent',
                color: tipo === 'receita' ? '#ffe192' : '#aaaaaa',
              }}
            >
              {isComercial ? 'Venda / Entrada' : 'Receita'}
            </button>

            <button
              type="button"
              onClick={() => handleTipoChange('despesa')}
              style={{
                padding: '6px 14px',
                borderRadius: '16px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
                backgroundColor: tipo === 'despesa' ? '#666666' : 'transparent',
                color: tipo === 'despesa' ? '#ffe192' : '#aaaaaa',
              }}
            >
              {isComercial ? 'Custo / Despesa' : 'Despesa'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Nome do Lançamento */}
          <div>
            <label style={{ display: 'block', color: '#dddddd', fontSize: '13px', marginBottom: '6px' }}>
              {labelNome}
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder={isComercial ? (tipo === 'receita' ? 'Ex: Cliente João - Venda de Serviço' : 'Ex: Fornecedor Distribuidora X') : 'Ex: Mercado, Salário...'}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '14px',
                border: '1px solid #737373',
                backgroundColor: '#3e3e3e',
                color: '#ffffff',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              required
            />
          </div>

          {/* Valor com Máscara ATM Real-Time + Data e Hora da Transação */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', color: '#dddddd', fontSize: '13px', marginBottom: '6px' }}>
                Valor Total (R$)
              </label>
              <input
                type="text"
                value={valorFormatado}
                onChange={handleValorChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  border: '1px solid #737373',
                  backgroundColor: '#3e3e3e',
                  color: '#ffe192',
                  fontSize: '17px',
                  fontWeight: 'bold',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            {/* CAMPO DE DATA E HORA */}
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', color: '#dddddd', fontSize: '13px', marginBottom: '6px' }}>
                📅 Data e Hora
              </label>
              <input
                type="datetime-local"
                value={dataTransacao}
                onChange={(e) => setDataTransacao(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px',
                  borderRadius: '14px',
                  border: '1px solid #737373',
                  backgroundColor: '#3e3e3e',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>
          </div>

          {/* Classificação / Categoria e Etiqueta Reutilizável */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {/* Categoria */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ color: '#dddddd', fontSize: '13px' }}>Categoria</label>
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
                  }}
                >
                  + Categorias
                </button>
              </div>
              <select
                value={classificacao}
                onChange={(e) => setClassificacao(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: '1px solid #737373',
                  backgroundColor: '#3e3e3e',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="">Selecione uma Categoria...</option>
                {categorias.map((cat) => (
                  <option key={cat.id || cat.nome} value={cat.nome}>
                    {cat.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* ETIQUETA REUTILIZÁVEL (COM AUTO-COMPLETE DATALIST) */}
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', color: '#dddddd', fontSize: '13px', marginBottom: '6px' }}>
                📌 Etiqueta / Tag
              </label>
              <input
                type="text"
                list="lista-etiquetas-add"
                value={etiqueta}
                onChange={(e) => setEtiqueta(e.target.value)}
                placeholder="Ex: Geral, Nubank..."
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: '1px solid #737373',
                  backgroundColor: '#3e3e3e',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <datalist id="lista-etiquetas-add">
                {etiquetaList.map((etiq) => (
                  <option key={etiq} value={etiq} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Checkbox de Recorrência / Parcelamento */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={ehFixa}
                onChange={(e) => {
                  setEhFixa(e.target.checked);
                  if (e.target.checked) setIsParcelado(false);
                }}
                style={{ accentColor: '#ffe192', width: '16px', height: '16px' }}
              />
              Recorrente / Fixo todos os meses
            </label>

            {tipo === 'despesa' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isParcelado}
                  onChange={(e) => {
                    setIsParcelado(e.target.checked);
                    if (e.target.checked) setEhFixa(false);
                  }}
                  style={{ accentColor: '#ffe192', width: '16px', height: '16px' }}
                />
                Compra Parcelada
              </label>
            )}
          </div>

          {/* Se for Parcelado */}
          {isParcelado && tipo === 'despesa' && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: '#dddddd', fontSize: '12px', marginBottom: '4px' }}>Parcela Atual</label>
                <input
                  type="number"
                  min="1"
                  max={totalParcelas}
                  value={parcelaAtual}
                  onChange={(e) => setParcelaAtual(parseInt(e.target.value, 10) || 1)}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #737373', backgroundColor: '#3e3e3e', color: '#fff' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: '#dddddd', fontSize: '12px', marginBottom: '4px' }}>Total Parcelas</label>
                <input
                  type="number"
                  min="1"
                  max="48"
                  value={totalParcelas}
                  onChange={(e) => setTotalParcelas(parseInt(e.target.value, 10) || 1)}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #737373', backgroundColor: '#3e3e3e', color: '#fff' }}
                />
              </div>
            </div>
          )}

          {/* Botões do Rodapé */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '24px',
                border: 'none',
                backgroundColor: '#737373',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '24px',
                border: 'none',
                backgroundColor: '#ffe192',
                color: '#333333',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
