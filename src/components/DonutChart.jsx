import React, { useState } from 'react';
import { useBudget } from '../contexts/BudgetContext';
import CategoryDetailModal from './CategoryDetailModal';

export default function DonutChart() {
  const { abaAtiva, receitas, totalReceitas, despesas, totalDespesas, categorias, isComercial } = useBudget();
  const [modalCat, setModalCat] = useState(null);

  const isReceita = abaAtiva === 'receitas' || abaAtiva === 'receita';
  const listaItens = isReceita ? receitas : despesas;
  const totalItens = isReceita ? totalReceitas : totalDespesas;

  const tituloGrafico = isComercial
    ? (isReceita ? 'Vendas & Faturamento' : 'Custos & Despesas')
    : (isReceita ? 'Receitas' : 'Despesas');

  const mensagemVazio = isReceita
    ? 'Nenhuma receita cadastrada neste mês.'
    : 'Nenhuma despesa cadastrada neste mês.';

  // Agrupa transações por categoria
  const itensPorCategoria = (listaItens || []).reduce((acc, item) => {
    const cat = item.classificacao || 'Outros';
    acc[cat] = (acc[cat] || 0) + Number(item.valor);
    return acc;
  }, {});

  const categoriasComValores = Object.keys(itensPorCategoria);

  // Se não houver itens no mês/ano selecionado, exibe o Estado Vazio
  if (totalItens <= 0 || categoriasComValores.length === 0) {
    return (
      <div
        style={{
          backgroundColor: 'var(--surface-bg, #323232)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
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
        <h4 style={{ margin: 0, color: 'var(--text-primary, #ffffff)', fontSize: '15px', fontWeight: '500' }}>
          {tituloGrafico}
        </h4>

        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '2px dashed var(--border-color, #737373)',
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
          <div style={{ color: 'var(--accent-color, #ffe192)', fontWeight: 'bold', fontSize: '15px' }}>
            Gráfico Indisponível
          </div>
          <div style={{ color: 'var(--text-secondary, #dddddd)', fontSize: '12px', marginTop: '4px' }}>
            {mensagemVazio}
          </div>
        </div>
      </div>
    );
  }

  // Mapeia cada categoria com sua cor cadastrada no banco de dados
  const coresFallbacks = ['#ffe192', '#fb8500', '#ffd166', '#ffb703', '#f4a261', '#2a9d8f', '#e76f51'];

  const dadosExibicao = categoriasComValores.map((catNome, idx) => {
    const catEncontrada = categorias.find((c) => c.nome.toLowerCase() === catNome.toLowerCase());
    const cor = catEncontrada?.cor || coresFallbacks[idx % coresFallbacks.length];

    return {
      nome: catNome,
      porcentagem: Math.round((itensPorCategoria[catNome] / totalItens) * 100),
      cor,
    };
  });

  let acumulado = 0;
  const raio = 40;
  const circunferencia = 2 * Math.PI * raio;

  return (
    <>
      <div
        style={{
          backgroundColor: 'var(--surface-bg, #323232)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
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
        <h4 style={{ margin: '0 0 12px 0', color: 'var(--text-primary, #ffffff)', fontSize: '15px', fontWeight: '500' }}>
          {tituloGrafico}
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
                  onClick={() => setModalCat({ categoryName: d.nome, tipo: isReceita ? 'receita' : 'despesas', color: d.cor })}
                  style={{ cursor: 'pointer' }}
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
              backgroundColor: 'var(--surface-bg, #323232)',
              pointerEvents: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
          {dadosExibicao.map((item, i) => (
            <div
              key={i}
              onClick={() => setModalCat({ categoryName: item.nome, tipo: isReceita ? 'receita' : 'despesas', color: item.cor })}
              title="Clique para ver lançamentos"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-primary, #ffffff)', cursor: 'pointer', opacity: 0.9 }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.9'; }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.cor }} />
              <span>{item.nome} {item.porcentagem}%</span>
            </div>
          ))}
        </div>
      </div>

      {modalCat && (
        <CategoryDetailModal
          isOpen={Boolean(modalCat)}
          onClose={() => setModalCat(null)}
          categoryName={modalCat.categoryName}
          tipo={modalCat.tipo}
          color={modalCat.color}
        />
      )}
    </>
  );
}
