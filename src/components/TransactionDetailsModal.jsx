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
        {/* Topo do Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color, #666666)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
                backgroundColor: isReceita ? '#2a9d8f' : '#e76f51',
                color: '#ffffff',
              }}
            >
              {isReceita ? (isComercial ? '🏢 Entrada / Venda' : '🟢 Receita') : (isComercial ? '🏢 Custo / Despesa' : '🔴 Despesa')}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-primary, #ffffff)', fontWeight: '500' }}>
              {modoEdicao ? 'Editando Lançamento' : 'Detalhes do Lançamento'}
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#aaaaaa',
              fontSize: '22px',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* MODO VISUALIZAÇÃO (DETALHES COMPLETOS) */}
        {!modoEdicao ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Aviso de Conta Encerrada */}
            {isEncerrada && (
              <div
                style={{
                  backgroundColor: '#5a2d2d',
                  color: '#ffcccc',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: '1px solid #e76f51',
                }}
              >
                <span>🔒</span>
                <span>Conta Encerrada: Os registros desta fatura estão bloqueados para edição ou exclusão.</span>
              </div>
            )}
            
            {/* Bloco de Valor em Grande Destaque */}
            <div
              style={{
                backgroundColor: 'var(--surface-bg, #383838)',
                borderRadius: '18px',
                padding: '20px',
                textAlign: 'center',
                border: '1px solid var(--border-color, #5d5d5d)',
              }}
            >
              <div style={{ fontSize: '12px', color: 'var(--text-secondary, #aaaaaa)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                {totalCompraParcelada ? 'Valor desta Parcela' : 'Valor Total do Lançamento'}
              </div>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: '800',
                  color: isReceita ? '#2a9d8f' : 'var(--accent-color, #ffe192)',
                }}
              >
                R$ {Number(item.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>

              {/* Se for compra parcelada, exibe o Valor Total da Compra */}
              {totalCompraParcelada && (
                <div
                  style={{
                    marginTop: '10px',
                    paddingTop: '10px',
                    borderTop: '1px dashed var(--border-color, #555555)',
                    fontSize: '13px',
                    color: 'var(--accent-color, #ffe192)',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <span>💳</span>
                  <span>
                    Valor Total da Compra: R$ {totalCompraParcelada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({totalParcelasNum}x de R$ {Number(item.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                  </span>
                </div>
              )}
            </div>

            {/* Grid de Informações Detalhadas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              
              {/* Nome */}
              <div style={{ backgroundColor: 'var(--surface-bg, #3e3e3e)', padding: '12px 14px', borderRadius: '14px', border: '1px solid var(--border-color, #5d5d5d)', gridColumn: 'span 2' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary, #aaaaaa)', display: 'block', marginBottom: '2px' }}>
                  {isComercial ? (isReceita ? 'Cliente / Produto' : 'Fornecedor / Custo') : 'Nome do Lançamento'}
                </span>
                <strong style={{ fontSize: '16px', color: 'var(--text-primary, #ffffff)' }}>{item.nome}</strong>
              </div>

              {/* Data e Hora */}
              <div style={{ backgroundColor: 'var(--surface-bg, #3e3e3e)', padding: '12px 14px', borderRadius: '14px', border: '1px solid var(--border-color, #5d5d5d)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary, #aaaaaa)', display: 'block', marginBottom: '2px' }}>📅 Data e Hora</span>
                <strong style={{ fontSize: '13px', color: 'var(--text-primary, #ffffff)' }}>{dataExtenso}</strong>
              </div>

              {/* Categoria / Classificação */}
              <div style={{ backgroundColor: 'var(--surface-bg, #3e3e3e)', padding: '12px 14px', borderRadius: '14px', border: '1px solid var(--border-color, #5d5d5d)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary, #aaaaaa)', display: 'block', marginBottom: '2px' }}>🏷️ Categoria</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: corCat }} />
                  <strong style={{ fontSize: '13px', color: 'var(--text-primary, #ffffff)' }}>{item.classificacao || 'Outros'}</strong>
                </div>
              </div>

              {/* Etiqueta / Tag */}
              <div style={{ backgroundColor: 'var(--surface-bg, #3e3e3e)', padding: '12px 14px', borderRadius: '14px', border: '1px solid var(--border-color, #5d5d5d)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary, #aaaaaa)', display: 'block', marginBottom: '2px' }}>📌 Etiqueta / Tag</span>
                <strong style={{ fontSize: '13px', color: 'var(--text-primary, #ffffff)' }}>{item.etiqueta || 'Geral'}</strong>
              </div>

              {/* Parcelamento / Recorrência */}
              <div style={{ backgroundColor: 'var(--surface-bg, #3e3e3e)', padding: '12px 14px', borderRadius: '14px', border: '1px solid var(--border-color, #5d5d5d)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary, #aaaaaa)', display: 'block', marginBottom: '2px' }}>🔢 Recorrência / Parcela</span>
                <strong style={{ fontSize: '13px', color: 'var(--text-primary, #ffffff)' }}>
                  {item.eh_fixa === 1 ? 'Fixa todos os meses' : (item.parcelas || '1/1')}
                </strong>
                {totalCompraParcelada && (
                  <span style={{ fontSize: '11px', color: 'var(--accent-color, #ffe192)', display: 'block', marginTop: '3px', fontWeight: 'bold' }}>
                    Total: R$ {totalCompraParcelada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>

              {/* Descrição / Observações */}
              {item.descricao && (
                <div style={{ backgroundColor: 'var(--surface-bg, #3e3e3e)', padding: '12px 14px', borderRadius: '14px', border: '1px solid var(--border-color, #5d5d5d)', gridColumn: 'span 2' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary, #aaaaaa)', display: 'block', marginBottom: '2px' }}>📝 Descrição / Observações</span>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary, #dddddd)', whiteSpace: 'pre-wrap' }}>{item.descricao}</p>
                </div>
              )}
            </div>

            {/* Ações do Rodapé no Modo Visualização */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                onClick={() => setModoEdicao(true)}
                style={{
                  flex: 2,
                  padding: '12px',
                  borderRadius: '20px',
                  border: 'none',
                  backgroundColor: 'var(--accent-color, #ffe192)',
                  color: 'var(--accent-text, #333333)',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
              >
                ✏️ Editar Informações
              </button>

              <button
                onClick={() => {
                  onDelete(item);
                  onClose();
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '20px',
                  border: 'none',
                  backgroundColor: '#e76f51',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                🗑️ Excluir
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
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor: catObj.cor || 'var(--accent-color, #ffe192)',
                              display: 'inline-block',
                              flexShrink: 0,
                              boxShadow: `0 0 6px ${catObj.cor || '#ffe192'}aa`,
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
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor: cat.cor || 'var(--accent-color, #ffe192)',
                              display: 'inline-block',
                              flexShrink: 0,
                              boxShadow: `0 0 6px ${cat.cor || '#ffe192'}aa`,
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
                    📌 Etiqueta / Tag
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
                  borderRadius: '20px',
                  border: 'none',
                  backgroundColor: 'var(--surface-bg, #737373)',
                  color: 'var(--text-primary, #ffffff)',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                ← Voltar aos Detalhes
              </button>
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '20px',
                  border: 'none',
                  backgroundColor: 'var(--accent-color, #ffe192)',
                  color: 'var(--accent-text, #333333)',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
              >
                💾 Salvar Alterações
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
