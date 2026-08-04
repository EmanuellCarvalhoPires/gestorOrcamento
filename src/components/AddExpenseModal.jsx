import React, { useState, useEffect, useRef } from 'react';
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
    mesSelecionado,
    setMesSelecionado,
    anoSelecionado,
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
  const [etiqueta, setEtiqueta] = useState('');
  const [dataTransacao, setDataTransacao] = useState(getNowFormatted());
  
  const [isParcelado, setIsParcelado] = useState(false);
  const [parcelaAtual, setParcelaAtual] = useState(1);
  const [totalParcelas, setTotalParcelas] = useState(1);
  
  const [ehFixa, setEhFixa] = useState(false);
  const [mesFimRecorrencia, setMesFimRecorrencia] = useState('Dez');
  const [descricao, setDescricao] = useState('');

  // Dropdowns personalizados
  const catRef = useRef(null);
  const etiqRef = useRef(null);
  const mesFimRef = useRef(null);
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [isEtiqOpen, setIsEtiqOpen] = useState(false);
  const [isMesFimOpen, setIsMesFimOpen] = useState(false);
  const [hoveredCat, setHoveredCat] = useState(null);
  const [hoveredEtiq, setHoveredEtiq] = useState(null);
  const [hoveredMesFim, setHoveredMesFim] = useState(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (catRef.current && !catRef.current.contains(e.target)) {
        setIsCatOpen(false);
      }
      if (etiqRef.current && !etiqRef.current.contains(e.target)) {
        setIsEtiqOpen(false);
      }
      if (mesFimRef.current && !mesFimRef.current.contains(e.target)) {
        setIsMesFimOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

    let mesCalculado = mesSelecionado;
    let anoCalculado = anoSelecionado;
    let finalDataTransacao = dataTransacao;

    if (mesSelecionado !== 'Todos') {
      const mesIndex = MESES_LISTA.indexOf(mesSelecionado);
      const anoNum = parseInt(anoSelecionado, 10) || new Date().getFullYear();
      
      const agora = new Date();
      if (agora.getMonth() === mesIndex && agora.getFullYear() === anoNum) {
        finalDataTransacao = getNowFormatted(); // Usa data atual se estiver adicionando no mês atual
      } else {
        const fakeDate = new Date(anoNum, mesIndex, 1, 12, 0, 0); // Primeiro dia do mês ao meio-dia
        const pad = (n) => (n < 10 ? `0${n}` : n);
        finalDataTransacao = `${fakeDate.getFullYear()}-${pad(fakeDate.getMonth() + 1)}-${pad(fakeDate.getDate())}T${pad(fakeDate.getHours())}:${pad(fakeDate.getMinutes())}`;
      }
    } else {
      const dtObj = dataTransacao ? new Date(dataTransacao) : new Date();
      mesCalculado = MESES_LISTA[dtObj.getMonth()];
      anoCalculado = dtObj.getFullYear().toString();
    }

    await adicionarTransacao({
      tipo,
      nome,
      valor: valorNumerico,
      classificacao: catFinal,
      etiqueta: etiqueta.trim() || 'Geral',
      dataTransacao: finalDataTransacao,
      parcelaAtual: isParcelado ? (parseInt(parcelaAtual, 10) || 1) : 1,
      totalParcelas: isParcelado ? (parseInt(totalParcelas, 10) || 1) : 1,
      ehFixa,
      mesFimRecorrencia,
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
    setEtiqueta('');
    setDataTransacao(getNowFormatted());
    setIsParcelado(false);
    setParcelaAtual(1);
    setTotalParcelas(1);
    setEhFixa(false);
    setMesFimRecorrencia('Dez');
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
          padding: '28px 32px',
          width: '90%',
          maxWidth: '585px',
          display: 'flex',
          flexDirection: 'column',
          gap: '21px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
          position: 'relative',
          overflow: 'visible',
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '19px' }}>
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
          <div style={{ display: 'flex', gap: '17px' }}>
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
            {mesSelecionado === 'Todos' && (
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: '#dddddd', fontSize: '13px', marginBottom: '6px' }}>
                  📅 Data e Hora
                </label>
                <input
                  type="datetime-local"
                  value={dataTransacao}
                  onChange={(e) => setDataTransacao(e.target.value)}
                  onClick={(e) => {
                    try {
                      e.target.showPicker();
                    } catch (err) {}
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 12px',
                    borderRadius: '14px',
                    border: '1px solid #737373',
                    backgroundColor: '#3e3e3e',
                    color: '#ffffff',
                    colorScheme: 'dark',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                  }}
                  required
                />
              </div>
            )}
          </div>

          {/* Classificação / Categoria e Etiqueta Reutilizável */}
          <div style={{ display: 'flex', gap: '17px' }}>
            {/* CATEGORIA CUSTOM DROPDOWN */}
            <div style={{ flex: 1, position: 'relative' }} ref={catRef}>
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

              <div
                onClick={() => setIsCatOpen(!isCatOpen)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: isCatOpen ? '1px solid #ffe192' : '1px solid #737373',
                  backgroundColor: '#3e3e3e',
                  color: classificacao ? '#ffffff' : '#aaaaaa',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxSizing: 'border-box',
                  userSelect: 'none',
                  transition: 'border 0.2s',
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {classificacao || 'Selecione uma Categoria...'}
                </span>
                <span style={{ fontSize: '10px', color: '#ffe192', marginLeft: '6px' }}>
                  {isCatOpen ? '▲' : '▼'}
                </span>
              </div>

              {isCatOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    right: 0,
                    zIndex: 200,
                    backgroundColor: '#2e2e2e',
                    border: '1px solid #ffe192',
                    borderRadius: '14px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                    maxHeight: '150px',
                    overflowY: 'auto',
                    padding: '6px 0',
                  }}
                >
                  {categorias.map((cat) => {
                    const isHovered = hoveredCat === cat.nome;
                    const isSelected = classificacao === cat.nome;
                    return (
                      <div
                        key={cat.id || cat.nome}
                        onMouseEnter={() => setHoveredCat(cat.nome)}
                        onMouseLeave={() => setHoveredCat(null)}
                        onClick={() => {
                          setClassificacao(cat.nome);
                          setIsCatOpen(false);
                        }}
                        style={{
                          padding: '7px 12px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          color: isHovered || isSelected ? '#ffe192' : '#ffffff',
                          backgroundColor: isHovered || isSelected ? 'rgba(255, 225, 146, 0.15)' : 'transparent',
                          fontWeight: isSelected ? 'bold' : 'normal',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>{cat.nome}</span>
                        {isSelected && <span style={{ color: '#ffe192', fontSize: '12px' }}>✓</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ETIQUETA CUSTOM COMBOBOX */}
            <div style={{ flex: 1, position: 'relative' }} ref={etiqRef}>
              <label style={{ display: 'block', color: '#dddddd', fontSize: '13px', marginBottom: '6px' }}>
                📌 Etiqueta / Tag
              </label>

              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type="text"
                  value={etiqueta}
                  onFocus={() => {
                    setEtiqueta('');
                    setIsEtiqOpen(true);
                  }}
                  onChange={(e) => {
                    setEtiqueta(e.target.value);
                    setIsEtiqOpen(true);
                  }}
                  placeholder="Ex: Geral, Nubank..."
                  style={{
                    width: '100%',
                    padding: '12px 32px 12px 14px',
                    borderRadius: '14px',
                    border: isEtiqOpen ? '1px solid #ffe192' : '1px solid #737373',
                    backgroundColor: '#3e3e3e',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border 0.2s',
                  }}
                />
                <span
                  onClick={() => setIsEtiqOpen(!isEtiqOpen)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '10px',
                    color: '#ffe192',
                    cursor: 'pointer',
                  }}
                >
                  {isEtiqOpen ? '▲' : '▼'}
                </span>
              </div>

              {isEtiqOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    right: 0,
                    zIndex: 200,
                    backgroundColor: '#2e2e2e',
                    border: '1px solid #ffe192',
                    borderRadius: '14px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                    maxHeight: '150px',
                    overflowY: 'auto',
                    padding: '6px 0',
                  }}
                >
                  {etiquetaList
                    .filter((etiq) => etiq.toLowerCase().includes((etiqueta || '').toLowerCase()))
                    .map((etiq) => {
                      const isHovered = hoveredEtiq === etiq;
                      const isSelected = etiqueta === etiq;
                      return (
                        <div
                          key={etiq}
                          onMouseEnter={() => setHoveredEtiq(etiq)}
                          onMouseLeave={() => setHoveredEtiq(null)}
                          onClick={() => {
                            setEtiqueta(etiq);
                            setIsEtiqOpen(false);
                          }}
                          style={{
                            padding: '7px 12px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            color: isHovered || isSelected ? '#ffe192' : '#ffffff',
                            backgroundColor: isHovered || isSelected ? 'rgba(255, 225, 146, 0.15)' : 'transparent',
                            fontWeight: isSelected ? 'bold' : 'normal',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span>{etiq}</span>
                          {isSelected && <span style={{ color: '#ffe192', fontSize: '12px' }}>✓</span>}
                        </div>
                      );
                    })}

                  {etiqueta && !etiquetaList.some((e) => e.toLowerCase() === etiqueta.toLowerCase()) && (
                    <div
                      onMouseEnter={() => setHoveredEtiq('__NOVA__')}
                      onMouseLeave={() => setHoveredEtiq(null)}
                      onClick={() => setIsEtiqOpen(false)}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: '#ffe192',
                        backgroundColor: hoveredEtiq === '__NOVA__' ? 'rgba(255, 225, 146, 0.2)' : 'rgba(255, 225, 146, 0.08)',
                        borderTop: '1px solid #444444',
                        fontWeight: 'bold',
                      }}
                    >
                      + Usar nova etiqueta: "{etiqueta}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Opções de Frequência / Pagamento (Choice Chips) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ color: '#dddddd', fontSize: '13px' }}>Tipo de Lançamento</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setEhFixa(false);
                  setIsParcelado(false);
                }}
                style={{
                  flex: 1,
                  minWidth: '120px',
                  height: '42px',
                  borderRadius: '12px',
                  border: !ehFixa && !isParcelado ? '1px solid #ffe192' : '1px solid #737373',
                  backgroundColor: !ehFixa && !isParcelado ? 'rgba(255, 225, 146, 0.15)' : '#3e3e3e',
                  color: !ehFixa && !isParcelado ? '#ffe192' : '#cccccc',
                  fontSize: '13px',
                  fontWeight: !ehFixa && !isParcelado ? 'bold' : 'normal',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                  boxShadow: !ehFixa && !isParcelado ? '0 2px 8px rgba(255, 225, 146, 0.15)' : 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>🎯</span> Pontual
              </button>

              {tipo === 'receita' && (
                <button
                  type="button"
                  onClick={() => {
                    setEhFixa(true);
                    setIsParcelado(false);
                  }}
                  style={{
                    flex: 1,
                    minWidth: '120px',
                    height: '42px',
                    borderRadius: '12px',
                    border: ehFixa ? '1px solid #ffe192' : '1px solid #737373',
                    backgroundColor: ehFixa ? 'rgba(255, 225, 146, 0.15)' : '#3e3e3e',
                    color: ehFixa ? '#ffe192' : '#cccccc',
                    fontSize: '13px',
                    fontWeight: ehFixa ? 'bold' : 'normal',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                    boxShadow: ehFixa ? '0 2px 8px rgba(255, 225, 146, 0.15)' : 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span>🔄</span> Recorrente / Fixo
                </button>
              )}

              {tipo === 'despesa' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsParcelado(true);
                    setEhFixa(false);
                  }}
                  style={{
                    flex: 1,
                    minWidth: '120px',
                    height: '42px',
                    borderRadius: '12px',
                    border: isParcelado ? '1px solid #ffe192' : '1px solid #737373',
                    backgroundColor: isParcelado ? 'rgba(255, 225, 146, 0.15)' : '#3e3e3e',
                    color: isParcelado ? '#ffe192' : '#cccccc',
                    fontSize: '13px',
                    fontWeight: isParcelado ? 'bold' : 'normal',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                    boxShadow: isParcelado ? '0 2px 8px rgba(255, 225, 146, 0.15)' : 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span>💳</span> Compra Parcelada
                </button>
              )}
            </div>
          </div>

          {/* Se for Recorrente / Fixo (Receita) */}
          {ehFixa && tipo === 'receita' && (
            <div style={{ flex: 1, position: 'relative' }} ref={mesFimRef}>
              <label style={{ display: 'block', color: '#dddddd', fontSize: '13px', marginBottom: '6px' }}>
                🔁 Registrar esta receita recorrente até o mês de:
              </label>

              <div
                onClick={() => setIsMesFimOpen(!isMesFimOpen)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: isMesFimOpen ? '1px solid #ffe192' : '1px solid #737373',
                  backgroundColor: '#3e3e3e',
                  color: '#ffe192',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxSizing: 'border-box',
                  userSelect: 'none',
                  transition: 'border 0.2s',
                }}
              >
                <span>
                  Até {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][MESES_LISTA.indexOf(mesFimRecorrencia)]} ({mesFimRecorrencia})
                </span>
                <span style={{ fontSize: '10px', color: '#ffe192', marginLeft: '6px' }}>
                  {isMesFimOpen ? '▲' : '▼'}
                </span>
              </div>

              {isMesFimOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    right: 0,
                    zIndex: 200,
                    backgroundColor: '#2e2e2e',
                    border: '1px solid #ffe192',
                    borderRadius: '14px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                    maxHeight: '150px',
                    overflowY: 'auto',
                    padding: '4px 0',
                  }}
                >
                  {MESES_LISTA.map((m, index) => {
                    const nomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
                    const isHovered = hoveredMesFim === m;
                    const isSelected = mesFimRecorrencia === m;
                    const labelText = `Até ${nomes[index]} (${m})`;
                    return (
                      <div
                        key={m}
                        onMouseEnter={() => setHoveredMesFim(m)}
                        onMouseLeave={() => setHoveredMesFim(null)}
                        onClick={() => {
                          setMesFimRecorrencia(m);
                          setIsMesFimOpen(false);
                        }}
                        style={{
                          padding: '7px 12px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          color: isHovered || isSelected ? '#ffe192' : '#ffffff',
                          backgroundColor: isHovered || isSelected ? 'rgba(255, 225, 146, 0.15)' : 'transparent',
                          fontWeight: isSelected ? 'bold' : 'normal',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>{labelText}</span>
                        {isSelected && <span style={{ color: '#ffe192', fontSize: '12px' }}>✓</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Se for Parcelado */}
          {isParcelado && tipo === 'despesa' && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: '#dddddd', fontSize: '12px', marginBottom: '4px' }}>Parcela Atual</label>
                <input
                  type="number"
                  min="1"
                  max={totalParcelas || 48}
                  value={parcelaAtual}
                  onChange={(e) => setParcelaAtual(e.target.value)}
                  onBlur={() => {
                    if (!parcelaAtual || parseInt(parcelaAtual, 10) < 1) {
                      setParcelaAtual(1);
                    }
                  }}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #737373', backgroundColor: '#3e3e3e', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: '#dddddd', fontSize: '12px', marginBottom: '4px' }}>Total Parcelas</label>
                <input
                  type="number"
                  min="1"
                  max="48"
                  value={totalParcelas}
                  onChange={(e) => setTotalParcelas(e.target.value)}
                  onBlur={() => {
                    if (!totalParcelas || parseInt(totalParcelas, 10) < 1) {
                      setTotalParcelas(1);
                    }
                  }}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #737373', backgroundColor: '#3e3e3e', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          )}

          {/* Descrição / Observações (Máx. 200 caracteres) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ color: '#dddddd', fontSize: '13px' }}>Descrição / Observações (Opcional)</label>
              <span style={{ fontSize: '11px', color: (descricao || '').length > 180 ? '#ffe192' : '#aaaaaa' }}>
                {(descricao || '').length}/200
              </span>
            </div>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value.slice(0, 200))}
              maxLength={200}
              placeholder="Observações adicionais (máx. 200 caracteres)..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid #737373',
                backgroundColor: '#3e3e3e',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
                minHeight: '60px',
                maxHeight: '120px',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

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
