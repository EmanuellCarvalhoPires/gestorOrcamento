import React from 'react';
import { useBudget } from '../contexts/BudgetContext';

export default function DonutChart() {
  const { transacoesFiltradas, totalDespesas } = useBudget();

  // Calcular despesas por categoria
  const despesasPorCategoria = transacoesFiltradas
    .filter((t) => t.tipo === 'despesa')
    .reduce((acc, item) => {
      const cat = item.classificacao || 'Outros';
      acc[cat] = (acc[cat] || 0) + Number(item.valor);
      return acc;
    }, {});

  const categorias = Object.keys(despesasPorCategoria);

  // Paleta de cores fiéis ao Canva (amarelos, laranjas e cremes)
  const cores = ['#ffb703', '#fb8500', '#ffd166', '#f4a261', '#e9c46a'];

  // Se não houver despesas, mostra dados padrão da imagem
  const dadosExibição = totalDespesas > 0
    ? categorias.map((cat, idx) => ({
        nome: cat,
        porcentagem: Math.round((despesasPorCategoria[cat] / totalDespesas) * 100),
        cor: cores[idx % cores.length],
      }))
    : [
        { nome: 'Vendas', porcentagem: 55, cor: '#fb8500' },
        { nome: 'Finanças', porcentagem: 25, cor: '#ffd166' },
        { nome: 'Marketing', porcentagem: 15, cor: '#ffb703' },
        { nome: 'RH', porcentagem: 5, cor: '#ffe192' },
      ];

  // Cálculo dos arcos do SVG
  let acumulado = 0;
  const raio = 40;
  const circunferencia = 2 * Math.PI * raio;

  return (
    <div
      style={{
        backgroundColor: '#666666',
        borderRadius: '16px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <h4 style={{ margin: '0 0 12px 0', color: '#ffffff', fontSize: '15px', fontWeight: '500' }}>
        Despesas
      </h4>

      <div style={{ position: 'relative', width: '150px', height: '150px' }}>
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          {dadosExibição.map((d, index) => {
            const dashArray = (d.porcentagem / 100) * circunferencia;
            const strokeOffset = (acumulado / 100) * circunferencia;
            acumulado += d.porcentagem;

            return (
              <circle
                key={index}
                cx="50"
                cy="50"
                r={raio}
                fill="transparent"
                stroke={d.cor}
                strokeWidth="18"
                strokeDasharray={`${dashArray} ${circunferencia - dashArray}`}
                strokeDashoffset={-strokeOffset}
              />
            );
          })}
        </svg>

        {/* Furo central do donut */}
        <div
          style={{
            position: 'absolute',
            top: '30px',
            left: '30px',
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            backgroundColor: '#666666',
          }}
        />
      </div>

      {/* Legenda de Porcentagens */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
        {dadosExibição.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#ffffff' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.cor }} />
            <span>{item.nome} {item.porcentagem}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
