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
        backgroundColor: 'var(--card-bg, #545454)',
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
              backgroundColor: isSelected ? 'var(--accent-color, #ffe192)' : 'var(--surface-bg, #737373)',
              color: isSelected ? 'var(--accent-text, #333333)' : 'var(--text-primary, #ffffff)',
              boxShadow: isSelected ? '0 3px 10px rgba(0, 0, 0, 0.3)' : 'none',
              transform: isSelected ? 'translateY(-1px)' : 'none',
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
