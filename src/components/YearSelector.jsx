import React, { useState } from 'react';

export default function YearSelector() {
  // 1. Criamos um array com os anos
  const anos = ['2024', '2025', '2026'];

  // 2. Criamos o estado que vai guardar a seleção atual. 
  // O valor inicial aqui é '2026'.
  const [anoSelecionado, setAnoSelecionado] = useState('2026');

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '16px', backgroundColor: '#545454', width: 'fit-content', borderRadius: '8px' }}>
      
      {anos.map((ano) => {
        // 3. Verificamos se o ano deste botão é o ano que está guardado no estado
        const isSelected = anoSelecionado === ano;

        return (
          <button
            key={ano} // O React exige uma 'key' única em listas
            onClick={() => setAnoSelecionado(ano)} // Ao clicar, atualiza o estado
            style={{
              padding: '12px 26px',
              borderRadius: '6px',
              border: isSelected ? '1px solid #737373' : '1px solid #737373',
              cursor: 'pointer',
              fontWeight: '600',
              // 4. A mágica visual acontece aqui: a cor muda dependendo da variável isSelected
              backgroundColor: isSelected ? '#a6a6a6' : '#737373',
              color: isSelected ? '#ffe192' : '#ffe192',
              transition: 'background-color 0.2s, color 0.2s',
              fontSize: '16px',
            }}
          >
            {ano}
          </button>
        );
      })}
      
    </div>
  );
}