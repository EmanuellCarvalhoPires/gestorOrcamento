import React from 'react';
import { useBudget } from '../contexts/BudgetContext';

export default function SummaryCards() {
  const { totalReceitas, totalDespesas, economia } = useBudget();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
      {/* Card Receita */}
      <div
        style={{
          backgroundColor: '#666666',
          padding: '12px 20px',
          borderRadius: '24px',
          color: '#ffe192',
          fontWeight: 'bold',
          fontSize: '15px',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
        }}
      >
        Receita: R$ {totalReceitas.toLocaleString('pt-BR')}
      </div>

      {/* Card Despesas */}
      <div
        style={{
          backgroundColor: '#666666',
          padding: '12px 20px',
          borderRadius: '24px',
          color: '#ffe192',
          fontWeight: 'bold',
          fontSize: '15px',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
        }}
      >
        Despesas: R$ {totalDespesas.toLocaleString('pt-BR')}
      </div>

      {/* Card Economia */}
      <div
        style={{
          backgroundColor: '#666666',
          padding: '12px 20px',
          borderRadius: '24px',
          color: '#ffe192',
          fontWeight: 'bold',
          fontSize: '15px',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
        }}
      >
        Economia: R$ {economia.toLocaleString('pt-BR')}
      </div>
    </div>
  );
}
