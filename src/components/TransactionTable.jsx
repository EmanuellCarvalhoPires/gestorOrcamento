import React, { useState, useRef, useEffect } from 'react';
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
  } = useBudget();

  const [buscaTexto, setBuscaTexto] = useState('');
  const [ordem, setOrdem] = useState('recente');
  const [isOrdemOpen, setIsOrdemOpen] = useState(false);
  const [hoveredOrdem, setHoveredOrdem] = useState(null);
  const [itemParaDeletar, setItemParaDeletar] = useState(null);
  const [itemParaDetalhes, setItemParaDetalhes] = useState(null);
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

  // Aplicação da Ordenação
  const transacoesOrdenadas = [...transacoesFiltradasPelaBusca].sort((a, b) => {
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
    if (ordem === 'nome_asc') {
      return (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' });
    }
    if (ordem === 'nome_desc') {
      return (b.nome || '').localeCompare(a.nome || '', 'pt-BR', { sensitivity: 'base' });
    }
    if (ordem === 'etiqueta_asc') {
      return (a.etiqueta || '').localeCompare(b.etiqueta || '', 'pt-BR', { sensitivity: 'base' });
    }
    if (ordem === 'etiqueta_desc') {
      return (b.etiqueta || '').localeCompare(a.etiqueta || '', 'pt-BR', { sensitivity: 'base' });
    }
    return 0;
  });

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
        backgroundColor: '#545454',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        flex: 1,
      }}
    >
      {/* Topo: Alternador de Abas + Campo de Busca + Botão (+) + Totalizador */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        
        {/* As 2 Abas Alternadoras */}
        <div style={{ display: 'flex', gap: '6px', backgroundColor: '#3e3e3e', padding: '4px', borderRadius: '24px' }}>
          <button
            onClick={() => setAbaAtiva('receitas')}
            style={{
              padding: '8px 20px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              backgroundColor: abaAtiva === 'receitas' ? '#666666' : 'transparent',
              color: abaAtiva === 'receitas' ? '#ffe192' : '#aaaaaa',
              transition: 'all 0.2s',
            }}
          >
            {labelAbaReceitas}
          </button>

          <button
            onClick={() => setAbaAtiva('despesas')}
            style={{
              padding: '8px 20px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              backgroundColor: abaAtiva === 'despesas' ? '#666666' : 'transparent',
              color: abaAtiva === 'despesas' ? '#ffe192' : '#aaaaaa',
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
                border: '1px solid #737373',
                backgroundColor: '#3e3e3e',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none',
                width: '150px',
              }}
            />
            {buscaTexto && (
              <button
                onClick={() => setBuscaTexto('')}
                title="Limpar busca"
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  color: '#aaaaaa',
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
              onClick={() => setIsOrdemOpen(!isOrdemOpen)}
              title="Ordenar lançamentos"
              style={{
                padding: '8px 14px',
                borderRadius: '20px',
                border: isOrdemOpen ? '1px solid #ffe192' : '1px solid #737373',
                backgroundColor: '#3e3e3e',
                color: '#ffe192',
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
              <span style={{ fontSize: '10px', color: '#ffe192' }}>{isOrdemOpen ? '▲' : '▼'}</span>
            </button>

            {isOrdemOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  zIndex: 200,
                  backgroundColor: '#2e2e2e',
                  border: '1px solid #ffe192',
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
                        color: isSelected ? '#ffe192' : '#ffffff',
                        fontSize: '12px',
                        fontWeight: isSelected ? 'bold' : 'normal',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'background-color 0.15s',
                      }}
                    >
                      <span>{op.label}</span>
                      {isSelected && <span style={{ color: '#ffe192', fontSize: '12px' }}>✓</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Botão (+) */}
          <button
            onClick={() => setIsModalOpen(true)}
            title="Adicionar lançamento"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#666666',
              color: '#ffe192',
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
          
          {/* Totalizador */}
          <div
            style={{
              backgroundColor: '#666666',
              padding: '8px 20px',
              borderRadius: '20px',
              color: '#ffe192',
              fontWeight: 'bold',
              fontSize: '16px',
            }}
          >
            R$ {totalExibido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Tabela de Lançamentos */}
      <div style={{ overflowY: 'auto', maxHeight: '420px', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#ffffff', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#666666', color: '#ffe192' }}>
              <th style={{ padding: '12px 14px', borderTopLeftRadius: '6px' }}>Data</th>
              <th style={{ padding: '12px 14px' }}>{labelColunaNome}</th>
              <th style={{ padding: '12px 14px' }}>Classificação</th>
              <th style={{ padding: '12px 14px' }}>Etiqueta</th>
              <th style={{ padding: '12px 14px' }}>
                {abaAtiva === 'receitas' ? 'Recorrência' : 'Num. de Parcelas'}
              </th>
              <th style={{ padding: '12px 14px' }}>Valor</th>
              <th style={{ padding: '12px 14px', textAlign: 'center', borderTopRightRadius: '6px' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {transacoesFiltradasPelaBusca.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#cccccc' }}>
                  {buscaTexto
                    ? `Nenhum lançamento encontrado para "${buscaTexto}".`
                    : 'Nenhuma transação cadastrada para este mês/ano.'}
                  {buscaTexto && (
                    <div style={{ marginTop: '8px' }}>
                      <button
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
              transacoesOrdenadas.map((item, index) => (
                <tr
                  key={item.id}
                  onClick={() => setItemParaDetalhes({ ...item, tipo: abaAtiva })}
                  style={{
                    backgroundColor: index % 2 === 0 ? '#5d5d5d' : '#525252',
                    borderBottom: '1px solid #666666',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#6e6e6e')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#5d5d5d' : '#525252')}
                >
                  {/* Coluna Data / Hora */}
                  <td style={{ padding: '12px 14px', color: '#ffe192', fontWeight: '500', fontSize: '12px' }}>
                    {formatDataHora(item.data_transacao, item.mes)}
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: '500' }}>{item.nome}</td>
                  <td style={{ padding: '12px 14px', color: '#dddddd' }}>{item.classificacao}</td>
                  <td style={{ padding: '12px 14px', color: '#dddddd' }}>{item.etiqueta}</td>
                  <td style={{ padding: '12px 14px', color: '#dddddd' }}>
                    {item.eh_fixa === 1 ? 'Fixa' : item.parcelas}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#ffe192', fontWeight: 'bold' }}>
                    R$ {Number(item.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      {/* Botão de Ver Detalhes / Editar */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemParaDetalhes({ ...item, tipo: abaAtiva });
                        }}
                        title="Ver detalhes e editar"
                        style={{
                          backgroundColor: '#737373',
                          border: 'none',
                          borderRadius: '12px',
                          color: '#ffffff',
                          cursor: 'pointer',
                          padding: '4px 12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                        }}
                      >
                        Detalhes
                      </button>

                      {/* Botão de Excluir 🗑️ */}
                      <button
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
              ))
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
