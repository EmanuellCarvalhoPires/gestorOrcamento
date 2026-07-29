import React from 'react';
import { useBudget } from '../contexts/BudgetContext';

export default function MonthSelector() {
  const { mesSelecionado, setMesSelecionado } = useBudget();
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '12px', backgroundColor: '#545454', borderRadius: '10px', width: 'fit-content' }}>
      {meses.map((mes) => {
        const isSelected = mesSelecionado === mes;

        return (
          <button
            key={mes}
            onClick={() => setMesSelecionado(mes)}
            style={{
              padding: '10px 22px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              backgroundColor: isSelected ? '#a6a6a6' : '#737373',
              color: isSelected ? '#ffe192' : '#ffffff',
              transition: 'background-color 0.2s, color 0.2s',
              fontSize: '15px',
            }}
          >
            {mes}
          </button>
        );
      })}
    </div>
  );
}
