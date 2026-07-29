import React from 'react';
import { useBudget } from '../contexts/BudgetContext';

export default function TransactionTable() {
  const {
    abaAtiva,
    setAbaAtiva,
    transacoesTabela,
    setIsModalOpen,
    totalDespesas,
    totalReceitas,
  } = useBudget();

  const totalExibido = abaAtiva === 'despesas' ? totalDespesas : totalReceitas;

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
      {/* Topo: Alternador de Abas + Botão (+) + Totalizador */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        
        {/* Abas Alternadoras */}
        <div style={{ display: 'flex', gap: '6px', backgroundColor: '#3e3e3e', padding: '4px', borderRadius: '24px' }}>
          <button
            onClick={() => setAbaAtiva('receitas')}
            style={{
              padding: '8px 20px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
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
              backgroundColor: abaAtiva === 'despesas' ? '#666666' : 'transparent',
              color: abaAtiva === 'despesas' ? '#ffe192' : '#aaaaaa',
              transition: 'all 0.2s',
            }}
          >
            Despesas do Mês
          </button>
        </div>

        {/* Botão (+) e Valor Total Exibido */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
            R$ {totalExibido.toLocaleString('pt-BR')}
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
              <th style={{ padding: '12px 16px' }}>Num. de Parcelas</th>
              <th style={{ padding: '12px 16px', borderTopRightRadius: '6px' }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {transacoesTabela.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: '#cccccc' }}>
                  Nenhuma transação cadastrada para este mês/ano.
                </td>
              </tr>
            ) : (
              transacoesTabela.map((item, index) => (
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
                  <td style={{ padding: '12px 16px', color: '#dddddd' }}>{item.parcelas}</td>
                  <td style={{ padding: '12px 16px', color: '#ffe192', fontWeight: 'bold' }}>
                    R$ {Number(item.valor).toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
