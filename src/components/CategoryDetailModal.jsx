import React, { useState } from 'react';
import { useBudget } from '../contexts/BudgetContext';
import TransactionDetailsModal from './TransactionDetailsModal';
import DeleteConfirmModal from './DeleteConfirmModal';

export default function CategoryDetailModal({ isOpen, onClose, categoryName, tipo, color }) {
  const {
    receitas,
    despesas,
    categorias,
    mesSelecionado,
    anoSelecionado,
    isComercial,
    editarTransacao,
    deletarTransacao,
    abrirModalAdicionar,
  } = useBudget();

  const [selectedItem, setSelectedItem] = useState(null);
  const [itemParaDeletar, setItemParaDeletar] = useState(null);

  if (!isOpen || !categoryName) return null;

  const isReceita = tipo === 'receitas' || tipo === 'receita';
  const listaOriginal = isReceita ? (receitas || []) : (despesas || []);

  // Filtra lançamentos referentes a esta categoria específica
  const itensCategoria = listaOriginal.filter(
    (item) => (item.classificacao || 'Outros').toLowerCase() === categoryName.toLowerCase()
  ).sort((a, b) => new Date(b.data_transacao || 0) - new Date(a.data_transacao || 0));

  // Valor total somado da categoria
  const totalCategoria = itensCategoria.reduce((sum, item) => sum + Number(item.valor || 0), 0);

  const formatarMoeda = (valor) => {
    return (Number(valor) || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatarData = (isoStr) => {
    if (!isoStr) return '--';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '--';
    const pad = (n) => (n < 10 ? `0${n}` : n);
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

  const catObj = (categorias || []).find((c) => c.nome?.toLowerCase() === categoryName.toLowerCase());
  const corFinal = color || catObj?.cor || (isReceita ? '#2a9d8f' : '#ffe192');

  const tituloTipo = isReceita
    ? (isComercial ? 'Vendas & Faturamento' : 'Receitas')
    : (isComercial ? 'Custos & Despesas' : 'Despesas');

  const handleAdicionarNestaCategoria = () => {
    onClose();
    abrirModalAdicionar({
      tipo: isReceita ? 'receita' : 'despesa',
      classificacao: categoryName,
    });
  };

  const handleConfirmDelete = async ({ deletarModo, parcelaNum, ehFixa, mes }) => {
    if (itemParaDeletar) {
      await deletarTransacao(itemParaDeletar.id, {
        deletarModo,
        parcelaNum,
        ehFixa: itemParaDeletar.eh_fixa === 1 || ehFixa,
        mes: itemParaDeletar.mes || mes,
        nome: itemParaDeletar.nome,
        tipo: itemParaDeletar.tipo || (isReceita ? 'receitas' : 'despesas'),
      });
      setItemParaDeletar(null);
      setSelectedItem(null);
    }
  };

  return (
    <>
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
          zIndex: 1400,
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--card-bg, #4a4a4a)',
            borderRadius: '24px',
            padding: '24px',
            width: '90%',
            maxWidth: '620px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
            maxHeight: '85vh',
            color: 'var(--text-primary, #ffffff)',
          }}
        >
          {/* Cabeçalho do Modal (Sem a bolinha colorida redundante) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--border-color, #666666)',
              paddingBottom: '14px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary, #ffffff)' }}>
                {categoryName}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary, #cccccc)', marginTop: '2px' }}>
                {tituloTipo} • {mesSelecionado === 'Todos' ? `Ano ${anoSelecionado}` : `${mesSelecionado} / ${anoSelecionado}`}
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

          {/* Destaque de Resumo de Valores (Limpo, sem contagem óbvia ou botão duplicado) */}
          <div
            style={{
              backgroundColor: 'var(--surface-bg, #383838)',
              borderRadius: '16px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: '1px solid var(--border-color, #5d5d5d)',
            }}
          >
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary, #aaaaaa)', display: 'block' }}>
                Total na Categoria
              </span>
              <span
                style={{
                  fontSize: '22px',
                  fontWeight: '800',
                  color: isReceita ? '#2a9d8f' : 'var(--accent-color, #ffe192)',
                }}
              >
                R$ {formatarMoeda(totalCategoria)}
              </span>
            </div>
          </div>

          {/* Lista de Registros da Categoria */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              overflowY: 'auto',
              maxHeight: '360px',
              paddingRight: '4px',
            }}
          >
            {itensCategoria.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '30px 10px',
                  color: 'var(--text-secondary, #aaaaaa)',
                  fontSize: '14px',
                }}
              >
                Nenhum registro encontrado para esta categoria no período selecionado.
              </div>
            ) : (
              itensCategoria.map((item) => (
                <div
                  key={item.id || item.nome + item.data_transacao}
                  onClick={() => setSelectedItem({ ...item, tipo: item.tipo || (isReceita ? 'receitas' : 'despesas') })}
                  style={{
                    backgroundColor: 'var(--surface-bg, #3e3e3e)',
                    borderRadius: '14px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    border: '1px solid var(--border-color, #545454)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface-hover, #4e4e4e)';
                    e.currentTarget.style.borderColor = 'var(--accent-color, #ffe192)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface-bg, #3e3e3e)';
                    e.currentTarget.style.borderColor = 'var(--border-color, #545454)';
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '65%' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary, #ffffff)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.nome}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-secondary, #bbbbbb)' }}>
                      <span style={{ color: '#9e9e9e' }}>{formatarData(item.data_transacao)}</span>
                      {item.etiqueta && (
                        <span style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', padding: '2px 7px', borderRadius: '5px', color: '#c0c0c0' }}>
                          {item.etiqueta}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: 'bold',
                        color: isReceita ? '#2a9d8f' : 'var(--accent-color, #ffe192)',
                      }}
                    >
                      R$ {formatarMoeda(item.valor)}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary, #aaaaaa)' }}>
                      {formatarDisplayParcela(item.parcelas, item.eh_fixa)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Rodapé do Modal (Apenas a ação principal "+ Adicionar", sem o botão "Fechar" redundante) */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-color, #555555)' }}>
            <button
              onClick={handleAdicionarNestaCategoria}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                borderRadius: '16px',
                border: 'none',
                backgroundColor: isReceita ? '#2a9d8f' : 'var(--accent-color, #ffe192)',
                color: isReceita ? '#ffffff' : '#1e1e1e',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
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
              <span style={{ fontSize: '16px' }}>+</span> Adicionar {isReceita ? (isComercial ? 'Venda' : 'Receita') : (isComercial ? 'Custo' : 'Despesa')}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes e Edição do Item Selecionado */}
      {selectedItem && (
        <TransactionDetailsModal
          isOpen={Boolean(selectedItem)}
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSave={async (dadosEditados) => {
            await editarTransacao(dadosEditados);
            setSelectedItem(null);
          }}
          onDelete={(itemToDelete) => {
            setItemParaDeletar(itemToDelete);
          }}
        />
      )}

      {/* Modal Customizado de Confirmação de Exclusão */}
      {itemParaDeletar && (
        <DeleteConfirmModal
          isOpen={Boolean(itemParaDeletar)}
          item={itemParaDeletar}
          onClose={() => setItemParaDeletar(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
  );
}
