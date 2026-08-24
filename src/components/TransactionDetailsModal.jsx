import React, { useState, useEffect, useRef } from 'react';
import { useBudget } from '../contexts/BudgetContext';

export default function TransactionDetailsModal({ isOpen, item, onClose, onSave, onDelete, isEncerrada }) {
  const { categorias, etiquetaList, isComercial, setIsCategoryModalOpen } = useBudget();

  const [modoEdicao, setModoEdicao] = useState(false);

  // Estados dos dropdowns customizados
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [hoveredCat, setHoveredCat] = useState(null);
  const catRef = useRef(null);

  const [isEtiqOpen, setIsEtiqOpen] = useState(false);
  const [hoveredEtiq, setHoveredEtiq] = useState(null);
  const etiqRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (catRef.current && !catRef.current.contains(e.target)) {
        setIsCatOpen(false);
      }
      if (etiqRef.current && !etiqRef.current.contains(e.target)) {
        setIsEtiqOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Estados dos campos de edição
  const [nome, setNome] = useState('');
  const [valorFormatado, setValorFormatado] = useState('R$ 0,00');
  const [valorNumerico, setValorNumerico] = useState(0);
  const [classificacao, setClassificacao] = useState('');
  const [etiqueta, setEtiqueta] = useState('Geral');
  const [dataTransacao, setDataTransacao] = useState('');
  const [descricao, setDescricao] = useState('');
  const [ehReserva, setEhReserva] = useState(false);

  const getFormattedDateTime = (isoOrDate) => {
    if (!isoOrDate) return '';
    const d = new Date(isoOrDate);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => (n < 10 ? `0${n}` : n);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  useEffect(() => {
    if (item) {
      setModoEdicao(false);
      setNome(item.nome || '');
      const val = Number(item.valor) || 0;
      setValorNumerico(val);
      setValorFormatado(val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
      setClassificacao(item.classificacao || '');
      setEtiqueta(item.etiqueta || 'Geral');
      setDataTransacao(getFormattedDateTime(item.data_transacao));
      setDescricao(item.descricao || '');
      setEhReserva(item.eh_reserva === 1 || item.eh_reserva === '1' || item.eh_reserva === true || Boolean(item.ehReserva));
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

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

  const handleSaveSubmit = (e) => {
    e.preventDefault();
    if (!nome.trim() || valorNumerico <= 0) return;

    onSave({
      id: item.id,
      oldNome: item.nome,
      nome,
      valor: valorNumerico,
      classificacao: classificacao || (categorias[0]?.nome || 'Outros'),
      etiqueta: etiqueta.trim() || 'Geral',
      dataTransacao,
      descricao,
      ehReserva: (!isReceita && ehReserva) ? 1 : 0,
      tipo: item.tipo,
    });
    setModoEdicao(false);
  };

  const isReceita = item.tipo === 'receitas' || item.tipo === 'receita';
  const dataExtenso = item.data_transacao ? new Date(item.data_transacao).toLocaleString('pt-BR') : 'Não informada';
  const catEncontrada = categorias.find((c) => c.nome.toLowerCase() === (item.classificacao || '').toLowerCase());
  const corCat = catEncontrada?.cor || '#ffe192';

  const isParcelado = item?.parcelas && item.parcelas.includes('/');
  let totalParcelasNum = 1;
  let totalCompraParcelada = null;

  if (isParcelado) {
    const parts = item.parcelas.split('/');
    totalParcelasNum = parseInt(parts[1], 10) || 1;
    if (totalParcelasNum > 1) {
      totalCompraParcelada = (Number(item.valor) || 0) * totalParcelasNum;
    }
  }

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
        zIndex: 1500,
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--card-bg, #4a4a4a)',
          borderRadius: '24px',
          padding: '28px',
          width: '90%',
          maxWidth: '540px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
          maxHeight: '90vh',
          overflowY: 'auto',
          color: 'var(--text-primary, #ffffff)',
        }}
      >
        {/* Topo do Modal (Sem badge redundante) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary, #ffffff)' }}>
              {modoEdicao ? 'Editar Lançamento' : 'Detalhes do Lançamento'}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary, #aaaaaa)', marginTop: '2px' }}>
              {isReceita ? (isComercial ? 'Venda / Faturamento' : 'Receita') : (isComercial ? 'Custo / Despesa' : 'Despesa')}
            </span>
          </div>

          <button
            onClick={onClose}
            title="Fechar"
            style={{
              background: 'none',
              border: 'none',
              color: '#aaaaaa',
              fontSize: '22px',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '4px',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#aaaaaa')}
          >
            ✕
          </button>
        </div>

        {/* MODO VISUALIZAÇÃO (DETALHES COMPLETOS COM HIERARQUIA REFINADA) */}
        {!modoEdicao ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Aviso de Conta Encerrada */}
            {isEncerrada && (
              <div
                style={{
                  backgroundColor: 'rgba(231, 111, 81, 0.15)',
                  color: '#ffb4a2',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  fontSize: '12.5px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: '1px solid rgba(231, 111, 81, 0.4)',
                }}
              >
                <span>Conta Encerrada: Os registros desta fatura estão bloqueados para edição ou exclusão.</span>
              </div>
            )}
            
            {/* Bloco de Valor e Nome em Grande Destaque */}
            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                borderRadius: '16px',
                padding: '20px 18px',
                textAlign: 'center',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-secondary, #9e9e9e)', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '600', marginBottom: '4px' }}>
                {totalCompraParcelada ? 'Valor desta Parcela' : 'Valor do Lançamento'}
              </div>
              <div
                style={{
                  fontSize: '30px',
                  fontWeight: '800',
                  color: isReceita ? '#50fa7b' : 'var(--accent-color, #ffe192)',
                  letterSpacing: '-0.5px',
                }}
              >
                R$ {Number(item.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>

              <div style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', marginTop: '6px' }}>
                {item.nome}
              </div>

              {/* Se for compra parcelada, exibe o Valor Total da Compra */}
              {totalCompraParcelada && (
                <div
                  style={{
                    marginTop: '10px',
                    paddingTop: '8px',
                    borderTop: '1px dashed rgba(255, 255, 255, 0.1)',
                    fontSize: '12.5px',
                    color: 'var(--accent-color, #ffe192)',
                    fontWeight: 'bold',
                  }}
                >
                  Total da Compra: R$ {totalCompraParcelada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({totalParcelasNum}x de R$ {Number(item.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                </div>
              )}
            </div>

            {/* Painel Unificado de Metadados e Informações */}
            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.18)',
                borderRadius: '16px',
                padding: '16px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Linha 1: Categoria + Etiqueta */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    Categoria
                  </span>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${corCat}44`,
                    }}
                  >
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: corCat, flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>
                      {item.classificacao || 'Outros'}
                    </span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    Etiqueta
                  </span>
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#dddddd',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    {item.etiqueta || 'Geral'}
                  </span>
                </div>
              </div>

              {/* Linha 2: Data e Hora + Recorrência/Parcelas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '10px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    Data e Hora
                  </span>
                  <span style={{ fontSize: '13px', color: '#e0e0e0', fontWeight: '500' }}>
                    {dataExtenso}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    Recorrência / Parcela
                  </span>
                  <span style={{ fontSize: '13px', color: '#e0e0e0', fontWeight: '500' }}>
                    {item.eh_fixa === 1 ? 'Fixa todos os meses' : (!item.parcelas || item.parcelas === '1/1' ? 'À vista' : item.parcelas)}
                  </span>
                </div>
              </div>

              {/* Linha 3: Finalidade (se despesa) */}
              {!isReceita && (
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '10px' }}>
                  <span style={{ fontSize: '11px', color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    Finalidade
                  </span>
                  <span
                    style={{
                      fontSize: '12.5px',
                      fontWeight: '600',
                      color: (item.eh_reserva === 1 || item.eh_reserva === '1' || item.eh_reserva === true) ? '#50fa7b' : '#cccccc',
                    }}
                  >
                    {(item.eh_reserva === 1 || item.eh_reserva === '1' || item.eh_reserva === true) ? 'Reserva para Caixinha' : 'Despesa Comum'}
                  </span>
                </div>
              )}

              {/* Descrição / Observações */}
              {item.descricao && (
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '10px' }}>
                  <span style={{ fontSize: '11px', color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    Descrição / Observações
                  </span>
                  <p style={{ margin: 0, fontSize: '13px', color: '#cccccc', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                    {item.descricao}
                  </p>
                </div>
              )}
            </div>

            {/* Ações do Rodapé: Botão Principal de Edição + Botão Secundário/Discreto de Exclusão */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => {
                  onDelete(item);
                  onClose();
                }}
                style={{
                  padding: '11px 18px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 107, 107, 0.35)',
                  backgroundColor: 'transparent',
                  color: '#ff7b7b',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 107, 107, 0.12)';
                  e.currentTarget.style.borderColor = '#ff7b7b';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'rgba(255, 107, 107, 0.35)';
                }}
              >
                Excluir Lançamento
              </button>

              <button
                type="button"
                onClick={() => setModoEdicao(true)}
                style={{
                  flex: 1,
                  padding: '11px 20px',
                  borderRadius: '14px',
                  border: 'none',
                  backgroundColor: 'var(--accent-color, #ffe192)',
                  color: 'var(--accent-text, #333333)',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                Editar Informações
              </button>
            </div>
          </div>
        ) : (
          /* MODO EDIÇÃO (FORMULÁRIO EDITÁVEL) */
          <form onSubmit={handleSaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Nome */}
            <div>
              <label style={{ display: 'block', color: '#dddddd', fontSize: '13px', marginBottom: '6px' }}>
                {isComercial ? 'Nome do Cliente / Fornecedor / Lançamento' : 'Nome da Despesa / Receita'}
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  border: '1px solid var(--border-color, #737373)',
                  backgroundColor: 'var(--surface-bg, #3e3e3e)',
                  color: 'var(--text-primary, #ffffff)',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            {/* Finalidade da Despesa no Modo Edição */}
            {!isReceita && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ color: 'var(--text-primary, #dddddd)', fontSize: '13px', fontWeight: 'bold' }}>
                    Finalidade do Lançamento
                  </label>
                  <span style={{ fontSize: '11px', color: ehReserva ? '#50fa7b' : 'var(--text-secondary, #aaaaaa)', fontStyle: 'italic' }}>
                    {ehReserva ? 'Reserva: Soma na Caixinha' : 'Comum: Gasto real do mês'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setEhReserva(false)}
                    style={{
                      flex: 1,
                      height: '38px',
                      borderRadius: '12px',
                      border: !ehReserva ? '2px solid var(--accent-color, #ffe192)' : '1px solid var(--border-color, #737373)',
                      backgroundColor: !ehReserva ? 'rgba(255, 225, 146, 0.15)' : 'var(--surface-bg, #3e3e3e)',
                      color: !ehReserva ? 'var(--accent-color, #ffe192)' : 'var(--text-secondary, #cccccc)',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Despesa Comum
                  </button>

                  <button
                    type="button"
                    onClick={() => setEhReserva(true)}
                    style={{
                      flex: 1,
                      height: '38px',
                      borderRadius: '12px',
                      border: ehReserva ? '2px solid #50fa7b' : '1px solid var(--border-color, #737373)',
                      backgroundColor: ehReserva ? 'rgba(80, 250, 123, 0.15)' : 'var(--surface-bg, #3e3e3e)',
                      color: ehReserva ? '#50fa7b' : 'var(--text-secondary, #cccccc)',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Reserva para Caixinha
                  </button>
                </div>
              </div>
            )}

            {/* Valor + Data e Hora */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: 'var(--text-primary, #dddddd)', fontSize: '13px', marginBottom: '6px' }}>
                  Valor (R$)
                </label>
                <input
                  type="text"
                  value={valorFormatado}
                  onChange={handleValorChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '14px',
                    border: '1px solid var(--border-color, #737373)',
                    backgroundColor: 'var(--surface-bg, #3e3e3e)',
                    color: 'var(--accent-color, #ffe192)',
                    fontSize: '17px',
                    fontWeight: 'bold',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  required
                />
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: 'var(--text-primary, #dddddd)', fontSize: '13px', marginBottom: '6px' }}>
                  Data e Hora
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
                    border: '1px solid var(--border-color, #737373)',
                    backgroundColor: 'var(--surface-bg, #3e3e3e)',
                    color: 'var(--text-primary, #ffffff)',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                  }}
                  required
                />
              </div>
            </div>

            {/* Classificação / Categoria e Etiqueta Reutilizável */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1, position: 'relative' }} ref={catRef}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', height: '18px' }}>
                  <label style={{ color: 'var(--text-primary, #dddddd)', fontSize: '13px', lineHeight: '18px' }}>Categoria</label>
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-color, #ffe192)',
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
                    height: '44px',
                    padding: '0 14px',
                    borderRadius: '14px',
                    border: isCatOpen ? '1px solid var(--accent-color, #ffe192)' : '1px solid var(--border-color, #737373)',
                    backgroundColor: 'var(--surface-bg, #3e3e3e)',
                    color: classificacao ? 'var(--text-primary, #ffffff)' : 'var(--text-secondary, #aaaaaa)',
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    {(() => {
                      const catObj = categorias.find((c) => c.nome.toLowerCase() === (classificacao || '').toLowerCase());
                      if (catObj) {
                        return (
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: catObj.cor || 'var(--accent-color, #ffe192)',
                              display: 'inline-block',
                              flexShrink: 0,
                            }}
                          />
                        );
                      }
                      return null;
                    })()}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {classificacao || 'Selecione uma Categoria...'}
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--accent-color, #ffe192)', marginLeft: '6px' }}>
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
                      backgroundColor: 'var(--card-bg, #2e2e2e)',
                      border: '1px solid var(--accent-color, #ffe192)',
                      borderRadius: '14px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                      maxHeight: '180px',
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
                            padding: '8px 14px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            backgroundColor: isSelected ? 'var(--surface-bg, #525252)' : isHovered ? 'var(--surface-hover, rgba(255,255,255,0.08))' : 'transparent',
                            color: isSelected ? 'var(--accent-color, #ffe192)' : 'var(--text-primary, #ffffff)',
                            fontWeight: isSelected ? 'bold' : 'normal',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'background-color 0.15s',
                          }}
                        >
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: cat.cor || 'var(--accent-color, #ffe192)',
                              display: 'inline-block',
                              flexShrink: 0,
                            }}
                          />
                          <span>{cat.nome}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ETIQUETA CUSTOM COMBOBOX */}
              <div style={{ flex: 1, position: 'relative' }} ref={etiqRef}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', height: '18px' }}>
                  <label style={{ display: 'block', color: 'var(--text-primary, #dddddd)', fontSize: '13px', lineHeight: '18px' }}>
                    Etiqueta
                  </label>
                </div>

                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    type="text"
                    value={etiqueta}
                    onFocus={() => {
                      setIsEtiqOpen(true);
                    }}
                    onChange={(e) => {
                      setEtiqueta(e.target.value);
                      setIsEtiqOpen(true);
                    }}
                    placeholder="Ex: Geral, Nubank..."
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '0 32px 0 14px',
                      borderRadius: '14px',
                      border: isEtiqOpen ? '1px solid var(--accent-color, #ffe192)' : '1px solid var(--border-color, #737373)',
                      backgroundColor: 'var(--surface-bg, #3e3e3e)',
                      color: 'var(--text-primary, #ffffff)',
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
                      color: 'var(--accent-color, #ffe192)',
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
                      backgroundColor: 'var(--card-bg, #2e2e2e)',
                      border: '1px solid var(--accent-color, #ffe192)',
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
                              padding: '8px 14px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              backgroundColor: isSelected ? 'var(--surface-bg, #525252)' : isHovered ? 'var(--surface-hover, rgba(255,255,255,0.08))' : 'transparent',
                              color: isSelected ? 'var(--accent-color, #ffe192)' : 'var(--text-primary, #ffffff)',
                              fontWeight: isSelected ? 'bold' : 'normal',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              transition: 'background-color 0.15s',
                            }}
                          >
                            <span>{etiq}</span>
                            {isSelected && <span style={{ color: 'var(--accent-color, #ffe192)', fontSize: '12px' }}>✓</span>}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* Descrição / Observações (Máx. 200 caracteres) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ color: 'var(--text-primary, #dddddd)', fontSize: '13px' }}>Descrição / Observações (Opcional)</label>
                <span style={{ fontSize: '11px', color: (descricao || '').length > 180 ? 'var(--accent-color, #ffe192)' : 'var(--text-secondary, #aaaaaa)' }}>
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
                  border: '1px solid var(--border-color, #737373)',
                  backgroundColor: 'var(--surface-bg, #3e3e3e)',
                  color: 'var(--text-primary, #ffffff)',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  minHeight: '60px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Botões do Rodapé no Modo Edição */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setModoEdicao(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  color: 'var(--text-primary, #ffffff)',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                }}
              >
                Voltar
              </button>
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '16px',
                  border: 'none',
                  backgroundColor: 'var(--accent-color, #ffe192)',
                  color: 'var(--accent-text, #333333)',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
