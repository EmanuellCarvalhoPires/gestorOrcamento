import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useBudget } from '../contexts/BudgetContext';
import iconLixeira from '../../images/lixeira-de-reciclagem.png';
import DeleteConfirmModal from './DeleteConfirmModal';
import TransactionDetailsModal from './TransactionDetailsModal';

export default function TransactionTable() {
  const {
    abaAtiva,
    setAbaAtiva,
    transacoesTabela,
    setIsModalOpen,
    totalReceitas,
    totalDespesas,
    totalReservas = 0,
    isComercial,
    editarTransacao,
    deletarTransacao,
    setMesSelecionado,
    setAnoSelecionado,
    mesSelecionado,
    categorias = [],
  } = useBudget();

  const getCorCategoria = (nomeCat) => {
    if (!nomeCat) return '#737373';
    const cat = (categorias || []).find((c) => c?.nome?.toLowerCase() === nomeCat.toLowerCase());
    return cat?.cor || '#fb8500';
  };

  const renderCategoriaTag = (nomeCat) => {
    if (!nomeCat) return <span style={{ color: 'var(--text-secondary, #888888)' }}>—</span>;
    const corCat = getCorCategoria(nomeCat);
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '2px 8px',
          borderRadius: '6px',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          border: `1px solid ${corCat}33`,
          width: 'fit-content',
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: corCat,
            display: 'inline-block',
            flexShrink: 0,
            opacity: 0.85,
          }}
        />
        <span style={{ color: '#d0d0d0', fontWeight: '500', fontSize: '12px' }}>{nomeCat}</span>
      </div>
    );
  };

  const formatarDisplayParcela = (parcelaStr, ehFixa) => {
    if (ehFixa === 1 || parcelaStr === 'Fixa') return 'Fixa';
    if (!parcelaStr || parcelaStr === '1/1') return 'À vista';
    if (typeof parcelaStr === 'string' && parcelaStr.includes('/')) {
      const [num, total] = parcelaStr.split('/');
      if (total && total !== '1') {
        return `${num} de ${total}`;
      }
    }
    return parcelaStr;
  };

  const [buscaTexto, setBuscaTexto] = useState('');
  const [ordem, setOrdem] = useState('recente');
  const [isOrdemOpen, setIsOrdemOpen] = useState(false);
  const [hoveredOrdem, setHoveredOrdem] = useState(null);
  const [itemParaDeletar, setItemParaDeletar] = useState(null);
  const [itemParaDetalhes, setItemParaDetalhes] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [menuAbertoId, setMenuAbertoId] = useState(null);
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const ordemRef = useRef(null);
  const menuAcoesRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ordemRef.current && !ordemRef.current.contains(event.target)) {
        setIsOrdemOpen(false);
      }
      if (menuAcoesRef.current && !menuAcoesRef.current.contains(event.target)) {
        setMenuAbertoId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleGroup = (groupKey, e) => {
    if (e) e.stopPropagation();
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const totalExibido = abaAtiva === 'receitas' ? totalReceitas : totalDespesas;

  // Filtro de Busca em Tempo Real por Nome, Etiqueta, Classificação ou Data
  const transacoesFiltradasPelaBusca = transacoesTabela.filter((t) => {
    if (!buscaTexto.trim()) return true;
    const termo = buscaTexto.toLowerCase().trim();
    const dataStr = t.data_transacao ? new Date(t.data_transacao).toLocaleString('pt-BR') : '';

    return (
      (t.nome && t.nome.toLowerCase().includes(termo)) ||
      (t.etiqueta && t.etiqueta.toLowerCase().includes(termo)) ||
      (t.classificacao && t.classificacao.toLowerCase().includes(termo)) ||
      dataStr.toLowerCase().includes(termo)
    );
  });

  const opcoesOrdem = [
    { value: 'recente', label: '📅 Mais Recente' },
    { value: 'antigo', label: '📅 Mais Antigo' },
    { value: 'valor_desc', label: '💲 Maior Valor' },
    { value: 'valor_asc', label: '💲 Menor Valor' },
    { value: 'nome_asc', label: '🔤 Nome (A - Z)' },
    { value: 'nome_desc', label: '🔤 Nome (Z - A)' },
    { value: 'etiqueta_asc', label: '🏷️ Etiqueta (A - Z)' },
    { value: 'etiqueta_desc', label: '🏷️ Etiqueta (Z - A)' },
  ];

  const itemOrdemAtual = opcoesOrdem.find((o) => o.value === ordem) || opcoesOrdem[0];

  // Função auxiliar para verificar se o lançamento é parcelado ou recorrente
  const isSpecialItem = (t) => {
    if (!t) return false;
    if (t.eh_fixa === 1) return true;
    if (t.parcelas && typeof t.parcelas === 'string' && t.parcelas.includes('/')) {
      const partes = t.parcelas.split('/');
      const total = parseInt(partes[1], 10);
      if (!isNaN(total) && total > 1) return true;
    }
    return false;
  };

  // Aplicação da Ordenação Priorizando Lançamentos Parcelados e Recorrentes
  const transacoesOrdenadas = [...transacoesFiltradasPelaBusca].sort((a, b) => {
    const aSpec = isSpecialItem(a) ? 0 : 1;
    const bSpec = isSpecialItem(b) ? 0 : 1;

    // Ordenação por Etiqueta (A-Z ou Z-A)
    if (ordem === 'etiqueta_asc' || ordem === 'etiqueta_desc') {
      const cmp = (a.etiqueta || '').localeCompare(b.etiqueta || '', 'pt-BR', { sensitivity: 'base' });
      if (cmp !== 0) {
        return ordem === 'etiqueta_asc' ? cmp : -cmp;
      }
      // Dentro da mesma etiqueta, parcelados e recorrentes vêm primeiro!
      if (aSpec !== bSpec) return aSpec - bSpec;
      return new Date(b.data_transacao || 0) - new Date(a.data_transacao || 0);
    }

    // Ordenação por Nome (A-Z ou Z-A)
    if (ordem === 'nome_asc' || ordem === 'nome_desc') {
      const cmp = (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' });
      if (cmp !== 0) {
        return ordem === 'nome_asc' ? cmp : -cmp;
      }
      // Dentro do mesmo nome, parcelados e recorrentes vêm primeiro!
      if (aSpec !== bSpec) return aSpec - bSpec;
      return new Date(b.data_transacao || 0) - new Date(a.data_transacao || 0);
    }

    // Para todas as outras opções de ordenação (Recente, Antigo, Maior Valor, Menor Valor):
    // Parcelados e Recorrentes sempre vêm PRIMEIRO no topo da lista!
    if (aSpec !== bSpec) {
      return aSpec - bSpec;
    }

    if (ordem === 'recente') {
      return new Date(b.data_transacao || 0) - new Date(a.data_transacao || 0);
    }
    if (ordem === 'antigo') {
      return new Date(a.data_transacao || 0) - new Date(b.data_transacao || 0);
    }
    if (ordem === 'valor_desc') {
      return Number(b.valor || 0) - Number(a.valor || 0);
    }
    if (ordem === 'valor_asc') {
      return Number(a.valor || 0) - Number(b.valor || 0);
    }
    return 0;
  });

  // Agrupamento Inteligente de Compras Parceladas e Gastos Recorrentes quando mesSelecionado === 'Todos'
  const itemsProcessados = useMemo(() => {
    if (mesSelecionado !== 'Todos') {
      return transacoesOrdenadas.map((item) => ({ isGroup: false, item }));
    }

    const mapGrupos = new Map();
    const listaFinal = [];

    transacoesOrdenadas.forEach((item) => {
      const isParcelado =
        item.parcelas &&
        typeof item.parcelas === 'string' &&
        item.parcelas.includes('/') &&
        item.eh_fixa !== 1;

      const isRecorrente = item.eh_fixa === 1 || item.parcelas === 'Fixa';

      if (!isParcelado && !isRecorrente) {
        listaFinal.push({ isGroup: false, item });
        return;
      }

      let key = '';
      let tipoGrupo = 'parcelada';
      let totalParcelas = 1;

      if (isParcelado) {
        const partes = item.parcelas.split('/');
        totalParcelas = parseInt(partes[1], 10) || 1;
        key = `p_${(item.nome || '').trim().toLowerCase()}_${(item.classificacao || '').trim().toLowerCase()}_${(item.etiqueta || '').trim().toLowerCase()}_${totalParcelas}`;
        tipoGrupo = 'parcelada';
      } else {
        key = `r_${(item.nome || '').trim().toLowerCase()}_${(item.classificacao || '').trim().toLowerCase()}_${(item.etiqueta || '').trim().toLowerCase()}`;
        tipoGrupo = 'recorrente';
      }

      if (!mapGrupos.has(key)) {
        const grupoObj = {
          isGroup: true,
          groupKey: key,
          tipoGrupo,
          nome: item.nome,
          classificacao: item.classificacao,
          etiqueta: item.etiqueta,
          totalParcelas,
          itens: [item],
        };
        mapGrupos.set(key, grupoObj);
        listaFinal.push(grupoObj);
      } else {
        mapGrupos.get(key).itens.push(item);
      }
    });

    return listaFinal.map((no) => {
      if (no.isGroup && no.itens.length === 1) {
        return { isGroup: false, item: no.itens[0] };
      }
      return no;
    });
  }, [transacoesOrdenadas, mesSelecionado]);

  const handleConfirmDelete = async ({ deletarModo, parcelaNum, ehFixa, mes }) => {
    if (itemParaDeletar) {
      await deletarTransacao(itemParaDeletar.id, {
        deletarModo,
        parcelaNum,
        ehFixa: itemParaDeletar.eh_fixa === 1 || ehFixa,
        mes: itemParaDeletar.mes || mes,
        nome: itemParaDeletar.nome,
        tipo: abaAtiva,
      });
      setItemParaDeletar(null);
    }
  };

  const handleSaveEdit = async (dadosEdicao) => {
    await editarTransacao({
      ...dadosEdicao,
      tipo: abaAtiva,
    });
    setItemParaDetalhes(null);
  };

  const MESES_MAP = {
    Jan: '01', Fev: '02', Mar: '03', Abr: '04',
    Mai: '05', Jun: '06', Jul: '07', Ago: '08',
    Set: '09', Out: '10', Nov: '11', Dez: '12'
  };

  const formatDataHora = (isoStr, itemMes) => {
    if (!isoStr) return '--/--';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '--/--';
    const pad = (n) => (n < 10 ? `0${n}` : n);
    const dia = pad(d.getDate());
    const mesNum = (itemMes && MESES_MAP[itemMes]) ? MESES_MAP[itemMes] : pad(d.getMonth() + 1);
    return `${dia}/${mesNum}`;
  };

  // Nomenclaturas adaptativas por perfil
  const labelAbaReceitas = isComercial ? 'Vendas & Faturamento' : 'Receita do Mês';
  const labelAbaDespesas = isComercial ? 'Custos & Despesas' : 'Despesas do Mês';
  const labelColunaNome = isComercial
    ? (abaAtiva === 'receitas' ? 'Cliente / Produto' : 'Fornecedor / Custo')
    : 'Nome';

  return (
    <div
      style={{
        backgroundColor: 'var(--surface-bg, #323232)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        flex: 1,
        width: '100%',
        minWidth: 0,
        height: '590px',
        maxHeight: '590px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Topo: Alternador de Abas + Campo de Busca + Botão (+) + Totalizador */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>

        {/* As 2 Abas Alternadoras */}
        <div style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(0, 0, 0, 0.3)', padding: '4px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            type="button"
            onClick={() => setAbaAtiva('receitas')}
            style={{
              padding: '7px 18px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '13px',
              backgroundColor: abaAtiva === 'receitas' ? 'var(--accent-color, #ffe192)' : 'transparent',
              color: abaAtiva === 'receitas' ? 'var(--accent-text, #333333)' : 'var(--text-secondary, #aaaaaa)',
              boxShadow: abaAtiva === 'receitas' ? '0 2px 8px rgba(0,0,0,0.35)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {labelAbaReceitas}
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('despesas')}
            style={{
              padding: '7px 18px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '13px',
              backgroundColor: abaAtiva === 'despesas' ? 'var(--accent-color, #ffe192)' : 'transparent',
              color: abaAtiva === 'despesas' ? 'var(--accent-text, #333333)' : 'var(--text-secondary, #aaaaaa)',
              boxShadow: abaAtiva === 'despesas' ? '0 2px 8px rgba(0,0,0,0.35)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {labelAbaDespesas}
          </button>
        </div>

        {/* Campo de Pesquisa, Botão (+) e Totalizador */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Campo de Pesquisa */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="🔍 Buscar..."
              value={buscaTexto}
              onChange={(e) => setBuscaTexto(e.target.value)}
              style={{
                padding: '7px 28px 7px 12px',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                color: 'var(--text-primary, #ffffff)',
                fontSize: '12.5px',
                outline: 'none',
                width: '140px',
              }}
            />
            {buscaTexto && (
              <button
                type="button"
                onClick={() => setBuscaTexto('')}
                title="Limpar busca"
                style={{
                  position: 'absolute',
                  right: '8px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary, #aaaaaa)',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Dropdown Customizado de Ordenação */}
          <div style={{ position: 'relative' }} ref={ordemRef}>
            <button
              type="button"
              onClick={() => setIsOrdemOpen(!isOrdemOpen)}
              title="Ordenar lançamentos"
              style={{
                padding: '7px 12px',
                borderRadius: '16px',
                border: isOrdemOpen ? '1px solid var(--accent-color, #ffe192)' : '1px solid rgba(255, 255, 255, 0.12)',
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                color: 'var(--accent-color, #ffe192)',
                fontWeight: '600',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                height: '33px',
                userSelect: 'none',
                transition: 'border 0.2s',
              }}
            >
              <span>{itemOrdemAtual.label}</span>
              <span style={{ fontSize: '9px', color: 'var(--accent-color, #ffe192)' }}>{isOrdemOpen ? '▲' : '▼'}</span>
            </button>

            {isOrdemOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  zIndex: 200,
                  backgroundColor: 'var(--surface-bg, #282828)',
                  border: '1px solid rgba(255, 225, 146, 0.3)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                  width: '185px',
                  padding: '4px 0',
                }}
              >
                {opcoesOrdem.map((op) => {
                  const isSelected = ordem === op.value;
                  const isHovered = hoveredOrdem === op.value;
                  return (
                    <div
                      key={op.value}
                      onClick={() => {
                        setOrdem(op.value);
                        setIsOrdemOpen(false);
                      }}
                      onMouseEnter={() => setHoveredOrdem(op.value)}
                      onMouseLeave={() => setHoveredOrdem(null)}
                      style={{
                        padding: '8px 14px',
                        cursor: 'pointer',
                        backgroundColor: isSelected
                          ? 'rgba(255, 225, 146, 0.18)'
                          : isHovered
                            ? 'rgba(255, 225, 146, 0.08)'
                            : 'transparent',
                        color: isSelected ? 'var(--accent-color, #ffe192)' : 'var(--text-primary, #ffffff)',
                        fontSize: '12px',
                        fontWeight: isSelected ? 'bold' : 'normal',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'background-color 0.15s',
                      }}
                    >
                      <span>{op.label}</span>
                      {isSelected && <span style={{ color: 'var(--accent-color, #ffe192)', fontSize: '12px' }}>✓</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Botão (+) */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            title="Adicionar lançamento"
            style={{
              width: '33px',
              height: '33px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--accent-color, #ffe192)',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.15s, background-color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 225, 146, 0.2)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
          >
            +
          </button>

          {/* Totalizador (Somado no 'Todos' vs Restante para gastar no Mês Específico) */}
          <div
            title={
              mesSelecionado === 'Todos'
                ? (abaAtiva === 'despesas'
                    ? `Total de despesas no ano: R$ ${totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}${totalReservas > 0 ? ` (R$ ${totalReservas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em reservas)` : ''}`
                    : 'Total acumulado de receitas neste ano')
                : (abaAtiva === 'despesas'
                    ? `Saldo restante para gastar: R$ ${(totalReceitas - totalDespesas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}${totalReservas > 0 ? ` | Valor guardado na Caixinha: R$ ${(totalReceitas - (totalDespesas - totalReservas)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}`
                    : 'Total de receitas deste mês')
            }
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '7px 16px',
              borderRadius: '16px',
              color: mesSelecionado !== 'Todos' && abaAtiva === 'despesas' && (totalReceitas - totalDespesas) < 0 ? '#ff8585' : 'var(--accent-color, #ffe192)',
              fontWeight: 'bold',
              fontSize: '15px',
            }}
          >
            R$ {(
              mesSelecionado === 'Todos'
                ? (abaAtiva === 'despesas' ? totalDespesas : totalReceitas)
                : (abaAtiva === 'despesas' ? (totalReceitas - totalDespesas) : totalReceitas)
            ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Tabela de Lançamentos com rolagem interna fixa */}
      <div style={{ overflowY: 'auto', overflowX: 'hidden', height: '505px', maxHeight: '505px', borderRadius: '10px', backgroundColor: 'rgba(0, 0, 0, 0.12)' }}>
        <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', color: 'var(--text-primary, #ffffff)', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <th style={{ padding: '9px 12px', width: '80px', color: '#9e9e9e', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '600', borderTopLeftRadius: '8px', whiteSpace: 'nowrap' }}>Data</th>
              <th style={{ padding: '9px 12px', color: '#9e9e9e', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '600' }}>{labelColunaNome}</th>
              <th style={{ padding: '9px 12px', width: '130px', color: '#9e9e9e', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '600' }}>Classificação</th>
              <th style={{ padding: '9px 12px', width: '110px', color: '#9e9e9e', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '600' }}>Etiqueta</th>
              <th style={{ padding: '9px 12px', width: '110px', color: '#9e9e9e', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '600' }}>
                {abaAtiva === 'receitas' ? 'Recorrência' : 'Parcelas'}
              </th>
              <th style={{ padding: '9px 12px', width: '130px', textAlign: 'right', color: '#9e9e9e', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '600' }}>Valor</th>
              <th style={{ padding: '9px 8px', width: '110px', textAlign: 'center', color: '#9e9e9e', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '600', borderTopRightRadius: '8px' }}></th>
            </tr>
          </thead>
          <tbody ref={menuAcoesRef}>
            {transacoesFiltradasPelaBusca.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary, #cccccc)' }}>
                  {buscaTexto
                    ? `Nenhum lançamento encontrado para "${buscaTexto}".`
                    : 'Nenhuma transação cadastrada para este mês/ano.'}
                  {buscaTexto && (
                    <div style={{ marginTop: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setBuscaTexto('')}
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          color: '#ffe192',
                          border: '1px solid rgba(255,255,255,0.15)',
                          padding: '5px 14px',
                          borderRadius: '14px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '12px',
                        }}
                      >
                        Limpar Busca
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              itemsProcessados.map((nodo, index) => {
                if (!nodo.isGroup) {
                  const item = nodo.item;
                  const isMenuOpen = menuAbertoId === item.id;
                  const isHovered = hoveredRowId === item.id;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setItemParaDetalhes({ ...item, tipo: abaAtiva })}
                      onMouseEnter={() => setHoveredRowId(item.id)}
                      onMouseLeave={() => setHoveredRowId(null)}
                      style={{
                        backgroundColor: isMenuOpen
                          ? 'rgba(255, 255, 255, 0.08)'
                          : index % 2 === 0
                            ? 'rgba(255, 255, 255, 0.02)'
                            : 'transparent',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {/* Coluna Data / Hora */}
                      <td style={{ padding: '10px 12px', color: '#9e9e9e', fontWeight: '400', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {formatDataHora(item.data_transacao, item.mes)}
                      </td>

                      {/* Coluna Nome */}
                      <td style={{ padding: '10px 12px', fontWeight: '600', fontSize: '13.5px', color: '#ffffff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span>{item.nome}</span>
                          {(item.eh_reserva === 1 || item.eh_reserva === '1' || item.eh_reserva === true) && (
                            <span
                              title="Reserva para Caixinha"
                              style={{
                                fontSize: '10px',
                                fontWeight: '600',
                                backgroundColor: 'rgba(80, 250, 123, 0.1)',
                                color: '#50fa7b',
                                border: '1px solid rgba(80, 250, 123, 0.25)',
                                padding: '1px 5px',
                                borderRadius: '4px',
                              }}
                            >
                              Reserva
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Coluna Classificação (Sutil e refinada) */}
                      <td style={{ padding: '10px 12px' }}>{renderCategoriaTag(item.classificacao)}</td>

                      {/* Coluna Etiqueta */}
                      <td style={{ padding: '10px 12px', color: '#b0b0b0', fontSize: '12px' }}>{item.etiqueta || '—'}</td>

                      {/* Coluna Parcelas / Recorrência */}
                      <td style={{ padding: '10px 12px', color: '#b0b0b0', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {formatarDisplayParcela(item.parcelas, item.eh_fixa)}
                      </td>

                      {/* Coluna Valor (Destaque Principal) */}
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--accent-color, #ffe192)', fontWeight: '700', fontSize: '14.5px' }}>
                        R$ {Number(item.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Coluna Ações (Menu Três Pontinhos contextual no Hover / Clique) */}
                      <td style={{ padding: '10px 8px', textAlign: 'center', position: 'relative' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuAbertoId(isMenuOpen ? null : item.id);
                          }}
                          title="Opções do lançamento"
                          style={{
                            background: isMenuOpen ? 'rgba(255, 255, 255, 0.15)' : 'none',
                            border: 'none',
                            color: isMenuOpen || isHovered ? 'var(--accent-color, #ffe192)' : 'rgba(255, 255, 255, 0.3)',
                            cursor: 'pointer',
                            padding: '3px 6px',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            opacity: isHovered || isMenuOpen ? 1 : 0.4,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          •••
                        </button>

                        {/* Menu Dropdown Suspenso de Ações */}
                        {isMenuOpen && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 'calc(100% - 4px)',
                              right: '8px',
                              zIndex: 150,
                              backgroundColor: 'var(--surface-bg, #262626)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              borderRadius: '10px',
                              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                              width: '140px',
                              padding: '4px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px',
                            }}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuAbertoId(null);
                                setItemParaDetalhes({ ...item, tipo: abaAtiva });
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                width: '100%',
                                padding: '6px 10px',
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-primary, #ffffff)',
                                fontSize: '12px',
                                cursor: 'pointer',
                                borderRadius: '6px',
                                textAlign: 'left',
                                transition: 'background-color 0.15s',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                              <span>✏️</span> Detalhes / Editar
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuAbertoId(null);
                                setItemParaDeletar(item);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                width: '100%',
                                padding: '6px 10px',
                                background: 'none',
                                border: 'none',
                                color: '#ff7b7b',
                                fontSize: '12px',
                                cursor: 'pointer',
                                borderRadius: '6px',
                                textAlign: 'left',
                                transition: 'background-color 0.15s',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 80, 80, 0.12)')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                              <img src={iconLixeira} alt="Excluir" style={{ width: '13px', height: '13px', objectFit: 'contain' }} />
                              <span>Excluir</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                }

                // Renderiza Grupo Unificado (para mesSelecionado === 'Todos')
                const grupo = nodo;
                const isExpanded = !!expandedGroups[grupo.groupKey];
                const isRecorrenteGroup = grupo.tipoGrupo === 'recorrente';
                const temReserva = grupo.itens.some((i) => i.eh_reserva === 1 || i.eh_reserva === '1' || i.eh_reserva === true);

                const itensOrdenados = [...grupo.itens].sort((a, b) => {
                  if (isRecorrenteGroup) {
                    return new Date(a.data_transacao || 0) - new Date(b.data_transacao || 0);
                  }
                  const numA = parseInt(a.parcelas.split('/')[0], 10) || 0;
                  const numB = parseInt(b.parcelas.split('/')[0], 10) || 0;
                  return numA - numB;
                });

                const primeiroItem = itensOrdenados[0];
                const ultimoItem = itensOrdenados[itensOrdenados.length - 1];

                const countItens = grupo.itens.length;
                const valorTotalGrupo = grupo.itens.reduce((acc, curr) => acc + Number(curr.valor || 0), 0);
                const valorUnitario = Number(primeiroItem?.valor || 0);

                const dataInicio = formatDataHora(primeiroItem.data_transacao, primeiroItem.mes);
                const dataFim = formatDataHora(ultimoItem.data_transacao, ultimoItem.mes);
                const dataDisplay = dataInicio === dataFim ? dataInicio : `${dataInicio} a ${dataFim}`;

                const isRealParceladoGroup = !isRecorrenteGroup && (
                  grupo.totalParcelas > 1 || grupo.itens.some((i) => i.parcelas && i.parcelas !== '1/1')
                );

                let parcelasRange = 'Fixa';
                if (isRecorrenteGroup) {
                  parcelasRange = 'Fixa';
                } else if (!isRealParceladoGroup) {
                  parcelasRange = 'À vista';
                } else {
                  const minP = parseInt(primeiroItem.parcelas.split('/')[0], 10) || 1;
                  const maxP = parseInt(ultimoItem.parcelas.split('/')[0], 10) || 1;
                  const totalP = grupo.totalParcelas || 1;

                  if (minP === maxP) {
                    parcelasRange = `${minP} de ${totalP}`;
                  } else {
                    parcelasRange = `${minP}/${maxP} de ${totalP}`;
                  }
                }

                let badgeLabel = `${countItens} compras`;
                let tipoLabelSingular = 'meses';
                if (isRecorrenteGroup) {
                  badgeLabel = `Recorrente (${countItens} meses)`;
                  tipoLabelSingular = 'meses';
                } else if (isRealParceladoGroup) {
                  badgeLabel = `Parcelado (${countItens}x)`;
                  tipoLabelSingular = 'parcelas';
                } else if (abaAtiva === 'receitas') {
                  badgeLabel = `Recorrente (${countItens} meses)`;
                  tipoLabelSingular = 'meses';
                }

                let subpanelTitle = isRecorrenteGroup
                  ? `Lançamentos Mensais de "${grupo.nome}"`
                  : isRealParceladoGroup
                  ? `Parcelas de "${grupo.nome}"`
                  : `Lançamentos de "${grupo.nome}"`;

                let toggleTextOpen = `Ver ${countItens} ${tipoLabelSingular}`;
                let toggleTextClose = `Ocultar ${tipoLabelSingular}`;

                return (
                  <React.Fragment key={grupo.groupKey}>
                    <tr
                      onClick={(e) => toggleGroup(grupo.groupKey, e)}
                      style={{
                        backgroundColor: isExpanded
                          ? 'rgba(255, 255, 255, 0.04)'
                          : (index % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent'),
                        borderBottom: isExpanded ? 'none' : '1px solid rgba(255, 255, 255, 0.04)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '10px 12px', color: '#9e9e9e', fontWeight: '400', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {dataDisplay}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: '600', fontSize: '13.5px', color: '#ffffff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '10px', color: 'var(--accent-color, #ffe192)', opacity: 0.8 }}>{isExpanded ? '▲' : '▼'}</span>
                          <span>{grupo.nome}</span>
                          <span
                            style={{
                              fontSize: '10.5px',
                              backgroundColor: isRecorrenteGroup ? 'rgba(80, 250, 123, 0.1)' : 'rgba(255, 225, 146, 0.12)',
                              color: isRecorrenteGroup ? '#50fa7b' : 'var(--accent-color, #ffe192)',
                              border: isRecorrenteGroup ? '1px solid rgba(80, 250, 123, 0.25)' : '1px solid rgba(255, 225, 146, 0.25)',
                              padding: '1px 6px',
                              borderRadius: '5px',
                              fontWeight: '600',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {badgeLabel}
                          </span>
                          {temReserva && (
                            <span
                              title="Reserva para Caixinha"
                              style={{
                                fontSize: '10px',
                                fontWeight: '600',
                                backgroundColor: 'rgba(80, 250, 123, 0.1)',
                                color: '#50fa7b',
                                border: '1px solid rgba(80, 250, 123, 0.25)',
                                padding: '1px 5px',
                                borderRadius: '4px',
                              }}
                            >
                              Reserva
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>{renderCategoriaTag(grupo.classificacao)}</td>
                      <td style={{ padding: '10px 12px', color: '#b0b0b0', fontSize: '12px' }}>{grupo.etiqueta || '—'}</td>
                      <td style={{ padding: '10px 12px', color: isRecorrenteGroup ? '#50fa7b' : '#b0b0b0', fontSize: '12px', fontWeight: isRecorrenteGroup ? '600' : 'normal' }}>
                        {parcelasRange}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--accent-color, #ffe192)', fontWeight: '700', fontSize: '14.5px' }}>
                        R$ {valorTotalGrupo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        <div style={{ fontSize: '10.5px', color: '#9e9e9e', fontWeight: 'normal', marginTop: '1px' }}>
                          ({countItens}x de R$ {valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                        </div>
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleGroup(grupo.groupKey, e);
                          }}
                          style={{
                            backgroundColor: isExpanded ? 'var(--accent-color, #ffe192)' : 'rgba(255, 255, 255, 0.08)',
                            color: isExpanded ? '#333333' : '#cccccc',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {isExpanded ? toggleTextClose : toggleTextOpen}
                        </button>
                      </td>
                    </tr>

                    {/* Sub-Linha Dropdown com Registros Individuais Limpos e Compactos */}
                    {isExpanded && (
                      <tr>
                        <td colSpan="7" style={{ padding: '0 0 12px 0', backgroundColor: 'rgba(0, 0, 0, 0.15)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                          <div
                            style={{
                              padding: '10px 14px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              marginLeft: '12px',
                              marginRight: '12px',
                              marginTop: '4px',
                              backgroundColor: 'rgba(0, 0, 0, 0.2)',
                              borderRadius: '10px',
                              border: '1px solid rgba(255, 255, 255, 0.05)',
                            }}
                          >
                            <div style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-secondary, #cccccc)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                              {subpanelTitle}
                            </div>
                            {itensOrdenados.map((subItem, subIdx) => {
                              const mesNome = subItem.mes || (subItem.data_transacao ? formatDataHora(subItem.data_transacao).split('/')[1] : '');
                              const identificadorLinha = isRecorrenteGroup
                                ? (mesNome ? `Mês de ${mesNome}` : `Lançamento ${subIdx + 1}`)
                                : isRealParceladoGroup
                                ? formatarDisplayParcela(subItem.parcelas, subItem.eh_fixa)
                                : `Item ${subIdx + 1}`;

                              return (
                                <div
                                  key={subItem.id}
                                  onClick={() => setItemParaDetalhes({ ...subItem, tipo: abaAtiva })}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '6px 12px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(255, 255, 255, 0.03)',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    transition: 'background-color 0.15s ease',
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.07)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)')}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ color: '#8e8e8e', minWidth: '45px', fontSize: '11.5px' }}>
                                      {formatDataHora(subItem.data_transacao, subItem.mes)}
                                    </span>
                                    <span style={{ color: 'var(--text-primary, #ffffff)', fontWeight: '600', fontSize: '12px' }}>
                                      {identificadorLinha}
                                    </span>
                                    {(subItem.eh_reserva === 1 || subItem.eh_reserva === '1' || subItem.eh_reserva === true) && (
                                      <span
                                        title="Reserva para Caixinha"
                                        style={{
                                          fontSize: '9.5px',
                                          fontWeight: '600',
                                          backgroundColor: 'rgba(80, 250, 123, 0.1)',
                                          color: '#50fa7b',
                                          border: '1px solid rgba(80, 250, 123, 0.25)',
                                          padding: '1px 5px',
                                          borderRadius: '4px',
                                        }}
                                      >
                                        Reserva
                                      </span>
                                    )}
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <span style={{ color: 'var(--text-primary, #ffffff)', fontWeight: '600', fontSize: '12.5px' }}>
                                      R$ {Number(subItem.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setItemParaDeletar(subItem);
                                      }}
                                      title="Excluir lançamento"
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '2px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        opacity: 0.5,
                                        transition: 'opacity 0.15s ease',
                                      }}
                                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
                                    >
                                      <img src={iconLixeira} alt="Excluir" style={{ width: '13px', height: '13px', objectFit: 'contain' }} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Tela / Modal de Detalhes do Lançamento com Edição Integrada */}
      <TransactionDetailsModal
        isOpen={!!itemParaDetalhes}
        item={itemParaDetalhes}
        onClose={() => setItemParaDetalhes(null)}
        onSave={handleSaveEdit}
        onDelete={(itemToDelete) => setItemParaDeletar(itemToDelete)}
      />

      {/* Modal Customizado de Confirmação de Exclusão */}
      <DeleteConfirmModal
        isOpen={!!itemParaDeletar}
        item={itemParaDeletar}
        onClose={() => setItemParaDeletar(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
