import React, { useState } from 'react';

export default function MonthSelector() {
  // 1. Criamos um array com os meses
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  // 2. Criamos o estado que vai guardar a seleção atual. 
  // O valor inicial aqui é 'Jan'.
  const [mesSelecionado, setMesSelecionado] = useState('Jan');

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '16px', backgroundColor: '#545454', width: 'fit-content', borderRadius: '8px' }}>
      
      {meses.map((mes) => {
        // 3. Verificamos se o mês deste botão é o mês que está guardado no estado
        const isSelected = mesSelecionado === mes;

        return (
          <button
            key={mes} // O React exige uma 'key' única em listas
            onClick={() => setMesSelecionado(mes)} // Ao clicar, atualiza o estado
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
            {mes}
          </button>
        );
      })}
      
    </div>
  );
}