import React, { useState } from 'react';
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
  const [itemParaDeletar, setItemParaDeletar] = useState(null);
  const [itemParaDetalhes, setItemParaDetalhes] = useState(null);

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
    const res = await editarTransacao({
      ...dadosEdicao,
      tipo: abaAtiva,
    });
    if (res?.mesCalculado) setMesSelecionado(res.mesCalculado);
    if (res?.anoCalculado) setAnoSelecionado(res.anoCalculado);
    setItemParaDetalhes(null);
  };

  const formatDataHora = (isoStr) => {
    if (!isoStr) return '--/--';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '--/--';
    const pad = (n) => (n < 10 ? `0${n}` : n);
    const diaMes = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
    const hora = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    return `${diaMes} ${hora}`;
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
              value={buscaTexto}
              onChange={(e) => setBuscaTexto(e.target.value)}
              placeholder="🔍 Buscar por nome, data..."
              style={{
                padding: '8px 30px 8px 14px',
                borderRadius: '20px',
                border: '1px solid #737373',
                backgroundColor: '#3e3e3e',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none',
                width: '180px',
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
              <th style={{ padding: '12px 14px', borderTopLeftRadius: '6px' }}>Data / Hora</th>
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
              transacoesFiltradasPelaBusca.map((item, index) => (
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
                    {formatDataHora(item.data_transacao)}
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
