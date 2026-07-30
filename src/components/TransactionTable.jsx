import React, { useState } from 'react';
import { useBudget } from '../contexts/BudgetContext';
import iconLixeira from '../../images/lixeira-de-reciclagem.png';
import DeleteConfirmModal from './DeleteConfirmModal';
import EditExpenseModal from './EditExpenseModal';

export default function TransactionTable() {
  const {
    abaAtiva,
    setAbaAtiva,
    transacoesTabela,
    setIsModalOpen,
    totalReceitas,
    totalDespesas,
    editarTransacao,
    deletarTransacao,
  } = useBudget();

  const [buscaTexto, setBuscaTexto] = useState('');
  const [itemParaDeletar, setItemParaDeletar] = useState(null);
  const [itemParaEditar, setItemParaEditar] = useState(null);

  const totalExibido = abaAtiva === 'receitas' ? totalReceitas : totalDespesas;

  // Filtro de Busca em Tempo Real por Nome, Etiqueta ou Classificação
  const transacoesFiltradasPelaBusca = transacoesTabela.filter((t) => {
    if (!buscaTexto.trim()) return true;
    const termo = buscaTexto.toLowerCase().trim();
    return (
      (t.nome && t.nome.toLowerCase().includes(termo)) ||
      (t.etiqueta && t.etiqueta.toLowerCase().includes(termo)) ||
      (t.classificacao && t.classificacao.toLowerCase().includes(termo))
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
    await editarTransacao({
      ...dadosEdicao,
      tipo: abaAtiva,
    });
    setItemParaEditar(null);
  };

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
            Receita do Mês
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
            Despesas do Mês
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
              placeholder="🔍 Buscar lançamento..."
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
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#ffffff', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#666666', color: '#ffe192' }}>
              <th style={{ padding: '12px 16px', borderTopLeftRadius: '6px' }}>Nome</th>
              <th style={{ padding: '12px 16px' }}>Classificação</th>
              <th style={{ padding: '12px 16px' }}>Etiqueta</th>
              <th style={{ padding: '12px 16px' }}>
                {abaAtiva === 'receitas' ? 'Recorrência' : 'Num. de Parcelas'}
              </th>
              <th style={{ padding: '12px 16px' }}>Valor</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', borderTopRightRadius: '6px' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {transacoesFiltradasPelaBusca.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#cccccc' }}>
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
                  style={{
                    backgroundColor: index % 2 === 0 ? '#5d5d5d' : '#525252',
                    borderBottom: '1px solid #666666',
                  }}
                >
                  <td style={{ padding: '12px 16px', fontWeight: '500' }}>{item.nome}</td>
                  <td style={{ padding: '12px 16px', color: '#dddddd' }}>{item.classificacao}</td>
                  <td style={{ padding: '12px 16px', color: '#dddddd' }}>{item.etiqueta}</td>
                  <td style={{ padding: '12px 16px', color: '#dddddd' }}>
                    {item.eh_fixa === 1 ? 'Fixa' : item.parcelas}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#ffe192', fontWeight: 'bold' }}>
                    R$ {Number(item.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      {/* Botão de Editar ✏️ */}
                      <button
                        onClick={() => setItemParaEditar(item)}
                        title="Editar lançamento"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          fontSize: '16px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'transform 0.1s',
                        }}
                      >
                        ✏️
                      </button>

                      {/* Botão de Excluir 🗑️ */}
                      <button
                        onClick={() => setItemParaDeletar(item)}
                        title="Excluir lançamento"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'transform 0.1s',
                        }}
                      >
                        <img
                          src={iconLixeira}
                          alt="Excluir"
                          style={{ width: '20px', height: '20px', objectFit: 'contain' }}
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

      {/* Modal Customizado de Edição */}
      <EditExpenseModal
        isOpen={!!itemParaEditar}
        item={itemParaEditar}
        onClose={() => setItemParaEditar(null)}
        onSave={handleSaveEdit}
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
