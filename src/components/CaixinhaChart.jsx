import React, { useState, useEffect } from 'react';
import { useBudget } from '../contexts/BudgetContext';

const OPCOES_ATUAL = [
  { value: '6_meses', label: 'Últimos 6 Meses', meses: 6 },
  { value: '1_ano', label: 'Último 1 Ano', meses: 12 },
  { value: '2_anos', label: 'Últimos 2 Anos', meses: 24 },
  { value: '3_anos', label: 'Últimos 3 Anos', meses: 36 },
  { value: '4_anos', label: 'Últimos 4 Anos', meses: 48 },
  { value: '5_anos', label: 'Últimos 5 Anos', meses: 60 },
  { value: 'completa', label: 'Histórico Completo', meses: 999 },
];

const OPCOES_PROJETADA = [
  { value: '6_meses', label: 'Próximos 6 Meses', meses: 6 },
  { value: '1_ano', label: 'Próximo 1 Ano', meses: 12 },
  { value: '2_anos', label: 'Próximos 2 Anos', meses: 24 },
  { value: '3_anos', label: 'Próximos 3 Anos', meses: 36 },
  { value: '4_anos', label: 'Próximos 4 Anos', meses: 48 },
  { value: '5_anos', label: 'Próximos 5 Anos', meses: 60 },
  { value: 'completa', label: 'Previsão Completa', meses: 999 },
];

export default function CaixinhaChart() {
  const {
    usuarioLogado,
    contaAtiva,
    saldoInicialCaixinha,
    modoCaixinhaVisao,
    horizontePrevisao,
  } = useBudget();

  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatarMoeda = (valor) => {
    return (Number(valor) || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  useEffect(() => {
    const carregarDadosGrafico = async () => {
      if (!usuarioLogado || !window.apiTurso) return;
      setLoading(true);
      try {
        const res = await window.apiTurso.obterHistoricoCaixinha({
          usuarioId: usuarioLogado.id,
          contaId: contaAtiva?.id,
        });

        if (res?.success && Array.isArray(res.historico)) {
          let acumulado = Number(saldoInicialCaixinha || 0);
          const processado = res.historico.map((item) => {
            const rec = Number(item.receitas || 0);
            const desp = Number(item.despesas || 0);
            const econ = rec - desp;
            if (item.isFechada) {
              acumulado += econ;
            }
            return {
              ...item,
              receitasNum: rec,
              despesasNum: desp,
              economia: econ,
              saldoResultante: acumulado,
            };
          });
          setHistorico(processado);
        } else {
          setHistorico([]);
        }
      } catch (err) {
        console.error('Erro ao carregar gráfico da caixinha:', err);
        setHistorico([]);
      } finally {
        setLoading(false);
      }
    };

    carregarDadosGrafico();
  }, [usuarioLogado?.id, contaAtiva?.id, saldoInicialCaixinha]);

  const isAtual = modoCaixinhaVisao === 'atual';
  const opcoesAtivas = isAtual ? OPCOES_ATUAL : OPCOES_PROJETADA;
  const opcaoAtual = opcoesAtivas.find((o) => o.value === horizontePrevisao) || opcoesAtivas[6];

  const faturasFechadas = historico.filter((h) => h.isFechada);
  const faturasFuturas = historico.filter((h) => !h.isFechada);

  const dadosGrafico = isAtual
    ? (opcaoAtual.value === 'completa' ? faturasFechadas : faturasFechadas.slice(-opcaoAtual.meses))
    : (opcaoAtual.value === 'completa' ? faturasFuturas : faturasFuturas.slice(0, opcaoAtual.meses));

  const titulo = isAtual ? '📈 Progresso da Caixinha' : '📊 Previsão de Economia Futura';
  const subtitulo = isAtual
    ? `Histórico filtrado: ${opcaoAtual.label}`
    : `Previsão filtrada: ${opcaoAtual.label}`;

  // Se não houver dados para o gráfico
  if (loading || dadosGrafico.length === 0) {
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
        <h4 style={{ margin: 0, color: '#ffffff', fontSize: '15px', fontWeight: 'bold' }}>
          {titulo}
        </h4>

        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#545454',
            border: '2px dashed #737373',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            marginTop: '4px',
          }}
        >
          📊
        </div>

        <div>
          <div style={{ color: '#ffe192', fontWeight: 'bold', fontSize: '14px' }}>
            Sem Dados de {isAtual ? 'Faturas Fechadas' : 'Projeção Futura'}
          </div>
          <div style={{ color: '#dddddd', fontSize: '11px', marginTop: '4px' }}>
            {isAtual
              ? 'Ainda não há histórico de meses encerrados no período selecionado.'
              : 'Nenhum lançamento registrado no horizonte selecionado.'}
          </div>
        </div>
      </div>
    );
  }

  // Calcula maior valor absoluto para escala das barras
  const valoresExtraidos = dadosGrafico.map((d) => (isAtual ? d.saldoResultante : d.economia));
  const maxAbsValue = Math.max(...valoresExtraidos.map((v) => Math.abs(v)), 100);

  return (
    <div
      style={{
        backgroundColor: '#666666',
        borderRadius: '16px',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        boxSizing: 'border-box',
        gap: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        overflow: 'hidden',
      }}
    >
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
        <h4 style={{ margin: 0, color: '#ffffff', fontSize: '15px', fontWeight: 'bold' }}>
          {titulo}
        </h4>
        <span style={{ fontSize: '11px', color: '#dddddd', display: 'block' }}>
          {subtitulo}
        </span>
      </div>

      {/* Gráfico de Barras Com Rolagem Horizontal quando houver mais de 8 meses */}
      <div
        style={{
          width: '100%',
          overflowX: dadosGrafico.length > 8 ? 'auto' : 'visible',
          paddingBottom: dadosGrafico.length > 8 ? '6px' : '0px',
        }}
      >
        <div
          style={{
            minWidth: dadosGrafico.length > 8 ? `${dadosGrafico.length * 36}px` : '100%',
            height: '140px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-around',
            gap: '6px',
            padding: '10px 0 6px 0',
            borderBottom: '1px solid #888888',
            boxSizing: 'border-box',
          }}
        >
          {dadosGrafico.map((item) => {
            const val = isAtual ? item.saldoResultante : item.economia;
            const pct = Math.max(Math.min((Math.abs(val) / maxAbsValue) * 100, 100), 12);
            const isPos = val >= 0;
            const corBarra = isPos ? (isAtual ? '#ffe192' : '#2a9d8f') : '#ff8585';

            return (
              <div
                key={`${item.ano}-${item.mes}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1,
                  height: '100%',
                  justifyContent: 'flex-end',
                }}
                title={`${item.mes}/${item.ano}: ${isPos ? '+' : ''}R$ ${formatarMoeda(val)}`}
              >
                {/* Valor Acima da Barra */}
                <span style={{ fontSize: '9px', color: corBarra, fontWeight: 'bold', marginBottom: '2px', whiteSpace: 'nowrap' }}>
                  R${Math.abs(val) >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0)}
                </span>

                {/* Barra */}
                <div
                  style={{
                    width: '100%',
                    maxWidth: '22px',
                    height: `${pct}%`,
                    backgroundColor: corBarra,
                    borderRadius: '6px 6px 2px 2px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    transition: 'height 0.3s ease, background-color 0.2s',
                  }}
                />

                {/* Rótulo do Mês */}
                <span style={{ fontSize: '10px', color: '#ffffff', fontWeight: 'bold', marginTop: '6px' }}>
                  {item.mes}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
