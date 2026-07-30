import React from 'react';
import { useBudget } from '../contexts/BudgetContext';

export default function MonthSelector() {
  const { mesSelecionado, setMesSelecionado } = useBudget();
  const meses = ['Todos', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  return (
    <div
      style={{
        display: 'flex',
        gap: '6px',
        padding: '8px 12px',
        backgroundColor: '#545454',
        borderRadius: '12px',
        width: '100%',
        boxSizing: 'border-box',
        alignItems: 'center',
      }}
    >
      {meses.map((mes) => {
        const isSelected = mesSelecionado === mes;

        return (
          <button
            key={mes}
            onClick={() => setMesSelecionado(mes)}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: isSelected ? 'bold' : '600',
              backgroundColor: isSelected ? '#a6a6a6' : '#737373',
              color: isSelected ? '#ffe192' : '#ffffff',
              transition: 'all 0.2s',
              fontSize: '14px',
              textAlign: 'center',
            }}
          >
            {mes}
          </button>
        );
      })}
    </div>
  );
}
