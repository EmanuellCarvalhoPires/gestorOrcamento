import React from 'react';
import { useBudget } from '../contexts/BudgetContext';

export default function DonutChart() {
  const { despesas, totalDespesas, categorias } = useBudget();

  // Agrupa despesas por categoria
  const despesasPorCategoria = despesas.reduce((acc, item) => {
    const cat = item.classificacao || 'Outros';
    acc[cat] = (acc[cat] || 0) + Number(item.valor);
    return acc;
  }, {});

  const categoriasComDespesa = Object.keys(despesasPorCategoria);

  // Se não houver despesas no mês/ano selecionado, exibe o Estado Vazio bonito
  if (totalDespesas <= 0 || categoriasComDespesa.length === 0) {
    return (
      <div
        style={{
          backgroundColor: '#666666',
          borderRadius: '16px',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          boxSizing: 'border-box',
          minHeight: '235px',
          textAlign: 'center',
          gap: '8px',
        }}
      >
        <h4 style={{ margin: 0, color: '#ffffff', fontSize: '15px', fontWeight: '500' }}>
          Despesas
        </h4>

        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            backgroundColor: '#545454',
            border: '2px dashed #737373',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '30px',
            marginTop: '4px',
          }}
        >
          📊
        </div>

        <div>
          <div style={{ color: '#ffe192', fontWeight: 'bold', fontSize: '15px' }}>
            Gráfico Indisponível
          </div>
          <div style={{ color: '#dddddd', fontSize: '12px', marginTop: '4px' }}>
            Nenhuma despesa cadastrada neste mês.
          </div>
        </div>
      </div>
    );
  }

  // Mapeia cada categoria com sua cor cadastrada no banco de dados
  const coresFallbacks = ['#fb8500', '#ffd166', '#ffb703', '#ffe192', '#f4a261', '#2a9d8f', '#e76f51'];

  const dadosExibicao = categoriasComDespesa.map((catNome, idx) => {
    const catEncontrada = categorias.find((c) => c.nome.toLowerCase() === catNome.toLowerCase());
    const cor = catEncontrada?.cor || coresFallbacks[idx % coresFallbacks.length];

    return {
      nome: catNome,
      porcentagem: Math.round((despesasPorCategoria[catNome] / totalDespesas) * 100),
      cor,
    };
  });

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
        minHeight: '235px',
      }}
    >
      <h4 style={{ margin: '0 0 12px 0', color: '#ffffff', fontSize: '15px', fontWeight: '500' }}>
        Despesas
      </h4>

      <div style={{ position: 'relative', width: '150px', height: '150px' }}>
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          {dadosExibicao.map((d, index) => {
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

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
        {dadosExibicao.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#ffffff' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.cor }} />
            <span>{item.nome} {item.porcentagem}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
