import React, { useState } from 'react';
import { useBudget } from '../contexts/BudgetContext';

export default function YearSelector() {
  const { ANOS_LISTA, anoSelecionado, setAnoSelecionado } = useBudget();
  const [anosLocais, setAnosLocais] = useState(ANOS_LISTA || ['2024', '2025', '2026', '2027']);

  const handleAdicionarAno = () => {
    const ultimoAno = anosLocais[anosLocais.length - 1] || '2026';
    const proximoAno = (parseInt(ultimoAno, 10) + 1).toString();
    const novaLista = [...anosLocais, proximoAno];
    setAnosLocais(novaLista);
    setAnoSelecionado(proximoAno);
  };

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      {(anosLocais || []).map((ano) => {
        const isSelected = anoSelecionado === ano;

        return (
          <button
            key={ano}
            onClick={() => setAnoSelecionado(ano)}
            style={{
              padding: '8px 22px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              backgroundColor: isSelected ? '#a6a6a6' : '#666666',
              color: isSelected ? '#ffe192' : '#ffffff',
              transition: 'all 0.2s',
              fontSize: '15px',
            }}
          >
            {ano}
          </button>
        );
      })}

      <button
        onClick={handleAdicionarAno}
        title="Adicionar novo ano"
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: '#666666',
          color: '#ffe192',
          fontSize: '20px',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.2s',
        }}
      >
        +
      </button>
    </div>
  );
}