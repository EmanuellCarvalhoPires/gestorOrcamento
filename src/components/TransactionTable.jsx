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
    if (!nomeCat) return <span style={{ color: 'var(--text-secondary, #aaaaaa)' }}>—</span>;
    const corCat = getCorCategoria(nomeCat);
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
        <span
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: corCat,
            display: 'inline-block',
            boxShadow: `0 0 6px ${corCat}aa`,
            flexShrink: 0,
          }}
        />
        <span style={{ color: 'var(--text-primary, #ffffff)', fontWeight: '500' }}>{nomeCat}</span>
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
  const ordemRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ordemRef.current && !ordemRef.current.contains(event.target)) {
        setIsOrdemOpen(false);
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
        backgroundColor: 'var(--card-bg, #545454)',
        borderRadius: '16px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        flex: 1,
        width: '100%',
        minWidth: 0,
        height: '540px',
        maxHeight: '540px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Topo: Alternador de Abas + Campo de Busca + Botão (+) + Totalizador */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>

        {/* As 2 Abas Alternadoras */}
        <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--surface-bg, #3e3e3e)', padding: '4px', borderRadius: '24px' }}>
          <button
            type="button"
            onClick={() => setAbaAtiva('receitas')}
            style={{
              padding: '8px 20px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              backgroundColor: abaAtiva === 'receitas' ? 'var(--accent-color, #ffe192)' : 'transparent',
              color: abaAtiva === 'receitas' ? 'var(--accent-text, #333333)' : 'var(--text-secondary, #aaaaaa)',
              boxShadow: abaAtiva === 'receitas' ? '0 3px 10px rgba(0,0,0,0.35)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {labelAbaReceitas}
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('despesas')}
            style={{
              padding: '8px 20px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              backgroundColor: abaAtiva === 'despesas' ? 'var(--accent-color, #ffe192)' : 'transparent',
              color: abaAtiva === 'despesas' ? 'var(--accent-text, #333333)' : 'var(--text-secondary, #aaaaaa)',
              boxShadow: abaAtiva === 'despesas' ? '0 3px 10px rgba(0,0,0,0.35)' : 'none',
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
                padding: '8px 30px 8px 14px',
                borderRadius: '20px',
                border: '1px solid var(--border-color, #737373)',
                backgroundColor: 'var(--surface-bg, #3e3e3e)',
                color: 'var(--text-primary, #ffffff)',
                fontSize: '13px',
                outline: 'none',
                width: '150px',
              }}
            />
            {buscaTexto && (
              <button
                type="button"
                onClick={() => setBuscaTexto('')}
                title="Limpar busca"
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary, #aaaaaa)',
                  cursor: 'pointer',
                  fontSize: '14px',
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
                padding: '8px 14px',
                borderRadius: '20px',
                border: isOrdemOpen ? '1px solid var(--accent-color, #ffe192)' : '1px solid var(--border-color, #737373)',
                backgroundColor: 'var(--surface-bg, #3e3e3e)',
                color: 'var(--accent-color, #ffe192)',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                height: '35px',
                userSelect: 'none',
                transition: 'border 0.2s',
              }}
            >
              <span>{itemOrdemAtual.label}</span>
              <span style={{ fontSize: '10px', color: 'var(--accent-color, #ffe192)' }}>{isOrdemOpen ? '▲' : '▼'}</span>
            </button>

            {isOrdemOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  zIndex: 200,
                  backgroundColor: 'var(--surface-bg, #2e2e2e)',
                  border: '1px solid var(--accent-color, #ffe192)',
                  borderRadius: '14px',
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
                          ? 'rgba(255, 225, 146, 0.2)'
                          : isHovered
                            ? 'rgba(255, 225, 146, 0.1)'
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
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'var(--surface-bg, #3e3e3e)',
              color: 'var(--accent-color, #ffe192)',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s',
            }}
          >
            +
          </button>

          {/* Totalizador (Somado no 'Todos' vs Restante para gastar no Mês Específico) */}
          <div
            title={
              mesSelecionado === 'Todos'
                ? (abaAtiva === 'despesas' ? 'Total acumulado de despesas neste ano' : 'Total acumulado de receitas neste ano')
                : (abaAtiva === 'despesas' ? 'Saldo restante disponível para gastar este mês (Receitas - Despesas)' : 'Total de receitas deste mês')
            }
            style={{
              backgroundColor: 'var(--surface-bg, #3e3e3e)',
              padding: '8px 20px',
              borderRadius: '20px',
              color: mesSelecionado !== 'Todos' && abaAtiva === 'despesas' && (totalReceitas - totalDespesas) < 0 ? '#ff8585' : 'var(--accent-color, #ffe192)',
              fontWeight: 'bold',
              fontSize: '16px',
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

      {/* Tabela de Lançamentos */}
      <div style={{ overflowY: 'auto', height: '455px', maxHeight: '455px', borderRadius: '8px' }}>
        <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', color: 'var(--text-primary, #ffffff)', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--header-bg, #666666)', color: 'var(--accent-color, #ffe192)' }}>
              <th style={{ padding: '10px 12px', width: '110px', borderTopLeftRadius: '6px', whiteSpace: 'nowrap' }}>Data</th>
              <th style={{ padding: '10px 12px' }}>{labelColunaNome}</th>
              <th style={{ padding: '10px 12px', width: '120px' }}>Classificação</th>
              <th style={{ padding: '10px 12px', width: '110px' }}>Etiqueta</th>
              <th style={{ padding: '10px 12px', width: '130px' }}>
                {abaAtiva === 'receitas' ? 'Recorrência' : 'Num. de Parcelas'}
              </th>
              <th style={{ padding: '10px 12px', width: '120px' }}>Valor</th>
              <th style={{ padding: '10px 12px', width: '120px', textAlign: 'center', borderTopRightRadius: '6px' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
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
                          backgroundColor: '#737373',
                          color: '#ffe192',
                          border: 'none',
                          padding: '6px 16px',
                          borderRadius: '16px',
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
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setItemParaDetalhes({ ...item, tipo: abaAtiva })}
                      style={{
                        backgroundColor: index % 2 === 0 ? 'var(--surface-bg, #5d5d5d)' : 'var(--card-bg, #525252)',
                        borderBottom: '1px solid var(--border-color, #666666)',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s',
                        color: 'var(--text-primary, #ffffff)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover, #6e6e6e)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'var(--surface-bg, #5d5d5d)' : 'var(--card-bg, #525252)')}
                    >
                      {/* Coluna Data / Hora */}
                      <td style={{ padding: '9px 12px', color: 'var(--accent-color, #ffe192)', fontWeight: '500', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {formatDataHora(item.data_transacao, item.mes)}
                      </td>
                      <td style={{ padding: '9px 12px', fontWeight: '500' }}>{item.nome}</td>
                      <td style={{ padding: '9px 12px' }}>{renderCategoriaTag(item.classificacao)}</td>
                      <td style={{ padding: '9px 12px', color: 'var(--text-secondary, #dddddd)' }}>{item.etiqueta}</td>
                      <td style={{ padding: '9px 12px', color: 'var(--text-secondary, #dddddd)', whiteSpace: 'nowrap' }}>
                        {formatarDisplayParcela(item.parcelas, item.eh_fixa)}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--accent-color, #ffe192)', fontWeight: 'bold' }}>
                        R$ {Number(item.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          {/* Botão de Ver Detalhes / Editar */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setItemParaDetalhes({ ...item, tipo: abaAtiva });
                            }}
                            title="Ver detalhes e editar"
                            style={{
                              backgroundColor: 'var(--surface-bg, #3e3e3e)',
                              border: '1px solid var(--border-color, rgba(255,255,255,0.15))',
                              borderRadius: '12px',
                              color: 'var(--accent-color, #ffe192)',
                              cursor: 'pointer',
                              padding: '4px 12px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              transition: 'all 0.15s',
                            }}
                          >
                            Detalhes
                          </button>

                          {/* Botão de Excluir 🗑️ */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setItemParaDeletar(item);
                            }}
                            title="Excluir lançamento"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <img
                              src={iconLixeira}
                              alt="Excluir"
                              style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                // Renderiza Grupo Unificado (para mesSelecionado === 'Todos')
                const grupo = nodo;
                const isExpanded = !!expandedGroups[grupo.groupKey];
                const isRecorrenteGroup = grupo.tipoGrupo === 'recorrente';

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

                let badgeLabel = `🛒 ${countItens} compras agrupadas`;
                if (isRecorrenteGroup) {
                  badgeLabel = `🔄 ${countItens} meses recorrentes`;
                } else if (isRealParceladoGroup) {
                  badgeLabel = `📦 ${countItens} parcelas unificadas`;
                } else if (abaAtiva === 'receitas') {
                  badgeLabel = `💰 ${countItens} receitas agrupadas`;
                }

                let subpanelTitle = `📋 Compras agrupadas de "${grupo.nome}":`;
                if (isRecorrenteGroup) {
                  subpanelTitle = `📋 Gastos recorrentes de "${grupo.nome}":`;
                } else if (isRealParceladoGroup) {
                  subpanelTitle = `📋 Parcelas de "${grupo.nome}":`;
                } else if (abaAtiva === 'receitas') {
                  subpanelTitle = `📋 Receitas agrupadas de "${grupo.nome}":`;
                }

                let toggleText = `▼ Ver ${countItens} compras`;
                if (isRecorrenteGroup) {
                  toggleText = `▼ Ver ${countItens} meses`;
                } else if (isRealParceladoGroup) {
                  toggleText = `▼ Ver ${countItens} parcelas`;
                } else if (abaAtiva === 'receitas') {
                  toggleText = `▼ Ver ${countItens} receitas`;
                }

                return (
                  <React.Fragment key={grupo.groupKey}>
                    <tr
                      onClick={(e) => toggleGroup(grupo.groupKey, e)}
                      style={{
                        backgroundColor: isExpanded ? 'var(--header-bg, #3e3e3e)' : (index % 2 === 0 ? 'var(--surface-bg, #3e3e3e)' : 'var(--card-bg, #545454)'),
                        borderBottom: isExpanded ? 'none' : '1px solid var(--border-color, #666666)',
                        borderLeft: isRecorrenteGroup ? '4px solid #2a9d8f' : '4px solid var(--accent-color, #ffe192)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        color: 'var(--text-primary, #ffffff)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover, rgba(255,255,255,0.08))')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isExpanded ? 'var(--header-bg, #3e3e3e)' : (index % 2 === 0 ? 'var(--surface-bg, #3e3e3e)' : 'var(--card-bg, #545454)'))}
                    >
                      <td style={{ padding: '9px 12px', color: 'var(--accent-color, #ffe192)', fontWeight: '500', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {dataDisplay}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 'bold' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--accent-color, #ffe192)' }}>{isExpanded ? '▲' : '▼'}</span>
                          <span>{grupo.nome}</span>
                          <span
                            style={{
                              fontSize: '10px',
                              backgroundColor: isRecorrenteGroup ? '#2a9d8f' : (isRealParceladoGroup ? '#e76f51' : 'var(--accent-color, #ffe192)'),
                              color: (isRecorrenteGroup || isRealParceladoGroup) ? '#ffffff' : 'var(--accent-text, #333333)',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontWeight: 'bold',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {badgeLabel}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>{renderCategoriaTag(grupo.classificacao)}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary, #dddddd)' }}>{grupo.etiqueta}</td>
                      <td style={{ padding: '12px 14px', color: isRecorrenteGroup ? '#2a9d8f' : 'var(--accent-color, #ffe192)', fontWeight: 'bold' }}>
                        {parcelasRange}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--accent-color, #ffe192)', fontWeight: 'bold' }}>
                        R$ {valorTotalGrupo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary, #aaaaaa)', fontWeight: 'normal' }}>
                          ({countItens}x de R$ {valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleGroup(grupo.groupKey, e);
                          }}
                          style={{
                            backgroundColor: isExpanded ? 'var(--accent-color, #ffe192)' : 'var(--surface-bg, #3e3e3e)',
                            color: isExpanded ? 'var(--accent-text, #333333)' : 'var(--text-primary, #ffffff)',
                            border: '1px solid var(--border-color, #737373)',
                            borderRadius: '10px',
                            padding: '6px 14px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          {isExpanded ? '▲ Ocultar' : toggleText}
                        </button>
                      </td>
                    </tr>

                    {/* Sub-Linha Dropdown com Todos os Registros Individuais */}
                    {isExpanded && (
                      <tr>
                        <td colSpan="7" style={{ padding: '0 0 12px 0', backgroundColor: 'var(--card-bg, #3e3e3e)', borderBottom: '1px solid var(--border-color, #666666)' }}>
                          <div
                            style={{
                              padding: '12px 16px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                              borderLeft: isRecorrenteGroup ? '4px solid #2a9d8f' : '4px solid var(--accent-color, #ffe192)',
                              marginLeft: '12px',
                              marginRight: '12px',
                              marginTop: '8px',
                              backgroundColor: 'var(--surface-bg, #2e2e2e)',
                              borderRadius: '12px',
                              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.4)',
                            }}
                          >
                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: isRecorrenteGroup ? '#2a9d8f' : 'var(--accent-color, #ffe192)', textTransform: 'uppercase', marginBottom: '4px' }}>
                              {subpanelTitle}
                            </div>
                            {itensOrdenados.map((subItem) => (
                              <div
                                key={subItem.id}
                                onClick={() => setItemParaDetalhes({ ...subItem, tipo: abaAtiva })}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '8px 14px',
                                  backgroundColor: 'var(--card-bg, #3e3e3e)',
                                  borderRadius: '8px',
                                  border: '1px solid var(--border-color, #545454)',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  transition: 'background-color 0.15s',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover, #505050)')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--card-bg, #3e3e3e)')}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                  <span style={{ color: 'var(--accent-color, #ffe192)', fontWeight: 'bold', minWidth: '45px' }}>
                                    {formatDataHora(subItem.data_transacao, subItem.mes)}
                                  </span>
                                  <span style={{ color: 'var(--text-primary, #ffffff)', fontWeight: 'bold' }}>
                                    {subItem.nome}
                                  </span>
                                  <span
                                    style={{
                                      color: isRecorrenteGroup ? '#ffffff' : 'var(--accent-color, #ffe192)',
                                      backgroundColor: isRecorrenteGroup ? '#2a9d8f' : 'var(--surface-bg, #3e3e3e)',
                                      border: '1px solid var(--border-color, rgba(255,255,255,0.15))',
                                      padding: '2px 8px',
                                      borderRadius: '10px',
                                      fontSize: '11px',
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    {isRecorrenteGroup
                                      ? `Recorrente (${subItem.mes || 'Mês'})`
                                      : isRealParceladoGroup
                                        ? formatarDisplayParcela(subItem.parcelas, subItem.eh_fixa)
                                        : (abaAtiva === 'receitas' ? 'Receita' : 'Compra')}
                                  </span>
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary, #cccccc)' }}>
                                    {renderCategoriaTag(subItem.classificacao)}
                                    <span>• {subItem.etiqueta}</span>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <span style={{ color: 'var(--accent-color, #ffe192)', fontWeight: 'bold', fontSize: '13px' }}>
                                    R$ {Number(subItem.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setItemParaDetalhes({ ...subItem, tipo: abaAtiva });
                                    }}
                                    style={{
                                      backgroundColor: 'var(--surface-bg, #3e3e3e)',
                                      border: '1px solid var(--border-color, rgba(255,255,255,0.15))',
                                      borderRadius: '8px',
                                      color: 'var(--accent-color, #ffe192)',
                                      cursor: 'pointer',
                                      padding: '3px 10px',
                                      fontSize: '11px',
                                      fontWeight: 'bold',
                                      transition: 'all 0.15s',
                                    }}
                                  >
                                    Detalhes
                                  </button>

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
                                    }}
                                  >
                                    <img src={iconLixeira} alt="Excluir" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
                                  </button>
                                </div>
                              </div>
                            ))}
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
