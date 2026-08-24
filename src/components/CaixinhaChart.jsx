import React, { useState, useEffect } from 'react';
import { useBudget } from '../contexts/BudgetContext';
import {
  OPCOES_ATUAL,
  OPCOES_PROJETADA,
  MESES_LISTA_ORDEM,
  getProximoMesAno,
  calcularMesesAteData,
} from './CaixinhaDashboard';

export default function CaixinhaChart() {
  const {
    usuarioLogado,
    contaAtiva,
    saldoInicialCaixinha,
    modoCaixinhaVisao,
    horizontePrevisao,
    mesesPersonalizados,
    tipoPrevisaoEspecifica,
    mesMetaPrevisao,
    anoMetaPrevisao,
    aporteExtraMensal,
    caixinhaRendimentoTaxa = 0,
    caixinhaRendimentoPeriodo = 'mensal',
    isComercial,
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
          setHistorico(res.historico);
        } else {
          setHistorico([]);
        }
      } catch (err) {
        console.error('Erro ao carregar dados do gráfico da caixinha:', err);
        setHistorico([]);
      } finally {
        setLoading(false);
      }
    };

    carregarDadosGrafico();
  }, [usuarioLogado?.id, contaAtiva?.id, saldoInicialCaixinha]);

  const isAtual = modoCaixinhaVisao === 'atual';
  const opcoesAtivas = isAtual ? OPCOES_ATUAL : OPCOES_PROJETADA;
  const opcaoAtual = opcoesAtivas.find((o) => o.value === horizontePrevisao) || opcoesAtivas[opcoesAtivas.length - 1];

  const faturasFechadas = historico.filter((h) => h.isFechada);
  const faturasFuturas = historico.filter((h) => !h.isFechada);

  const hoje = new Date();
  const mesAtualNome = MESES_LISTA_ORDEM[hoje.getMonth()];
  const anoAtualNome = hoje.getFullYear().toString();

  const mesRef = faturasFuturas.length > 0 ? faturasFuturas[0].mes : mesAtualNome;
  const anoRef = faturasFuturas.length > 0 ? faturasFuturas[0].ano : anoAtualNome;

  // Cálculo da quantidade de meses limite
  let mesesLimite = 1;
  if (horizontePrevisao === 'personalizada') {
    if (tipoPrevisaoEspecifica === 'data_alvo') {
      mesesLimite = calcularMesesAteData(mesMetaPrevisao, anoMetaPrevisao, mesRef, anoRef);
    } else {
      mesesLimite = Math.max(1, parseInt(mesesPersonalizados, 10) || 1);
    }
  } else if (horizontePrevisao === 'completa') {
    mesesLimite = isAtual ? (faturasFechadas.length || 1) : (faturasFuturas.length || 1);
  } else {
    mesesLimite = opcaoAtual?.meses || 1;
  }

  // Label descritiva do horizonte
  const getLabelHorizonte = () => {
    if (horizontePrevisao === 'personalizada') {
      if (tipoPrevisaoEspecifica === 'data_alvo') {
        return `Até ${mesMetaPrevisao}/${anoMetaPrevisao} (${mesesLimite} ${mesesLimite === 1 ? 'mês' : 'meses'})`;
      }
      return isAtual
        ? (mesesLimite === 1 ? 'Último 1 mês' : `Últimos ${mesesLimite} meses`)
        : (mesesLimite === 1 ? 'Próximo 1 mês' : `Próximos ${mesesLimite} meses`);
    }
    return opcaoAtual?.label || 'Meses Cadastrados';
  };

  const labelAtiva = getLabelHorizonte();

  // Construção dos dados do gráfico com acumulação e estimativas
  let dadosFiltrados = [];

  if (isAtual) {
    dadosFiltrados = horizontePrevisao === 'completa'
      ? faturasFechadas
      : faturasFechadas.slice(-mesesLimite);
  } else {
    if (horizontePrevisao === 'completa') {
      dadosFiltrados = faturasFuturas;
    } else {
      if (faturasFuturas.length >= mesesLimite) {
        dadosFiltrados = faturasFuturas.slice(0, mesesLimite);
      } else {
        dadosFiltrados = [...faturasFuturas];
        const faltantes = mesesLimite - faturasFuturas.length;

        const baseMes = faturasFuturas.length > 0
          ? faturasFuturas[faturasFuturas.length - 1].mes
          : mesRef;
        const baseAno = faturasFuturas.length > 0
          ? faturasFuturas[faturasFuturas.length - 1].ano
          : anoRef;

        for (let i = 1; i <= faltantes; i++) {
          const prox = getProximoMesAno(baseMes, baseAno, i);
          dadosFiltrados.push({
            ano: prox.ano,
            mes: prox.mes,
            receitas: 0,
            despesas: 0,
            reservas: 0, // Apenas registros reais contam reservas.
            isFechada: false,
            isEstimada: true,
          });
        }
      }
    }
  }

  // Cálculo da Taxa Mensal Equivalente de Rendimento
  const taxaNum = Number(caixinhaRendimentoTaxa || 0);
  const taxaMensal = taxaNum > 0
    ? (caixinhaRendimentoPeriodo === 'anual'
        ? Math.pow(1 + (taxaNum / 100), 1 / 12) - 1
        : taxaNum / 100)
    : 0;

  // Processa acumulação
  let acumulado = Number(saldoInicialCaixinha || 0);
  const dadosGrafico = dadosFiltrados.map((item) => {
    const rec = Number(item.receitas || 0);
    const desp = Number(item.despesas || 0); // despesas comuns
    const res = Number(item.reservas || 0);  // despesas reserva
    const aporte = (!item.isFechada && !isAtual) ? Number(aporteExtraMensal || 0) : 0;
    
    let rendimentoDoMes = 0;
    let econ = 0;

    if (item.isFechada) {
      econ = (rec - desp);
      acumulado += econ;
    } else {
      const aporteTotal = item.isEstimada ? aporte : res;
      rendimentoDoMes = (taxaMensal > 0 && acumulado > 0) ? (acumulado * taxaMensal) : 0;
      econ = aporteTotal + rendimentoDoMes;
      acumulado += econ;
    }

    return {
      ...item,
      receitasNum: rec,
      despesasNum: desp,
      reservasNum: res,
      rendimentoNum: rendimentoDoMes,
      economia: econ,
      saldoResultante: acumulado,
    };
  });

  const titulo = isAtual
    ? (isComercial ? 'Progresso da Reserva de Lucros' : 'Progresso da Caixinha')
    : (isComercial ? 'Projeção Orçamentária Futura' : 'Previsão de Economia');
  const subtitulo = isAtual
    ? `Histórico: ${labelAtiva}`
    : `Previsão: ${labelAtiva}`;

  // Se não houver dados para o gráfico
  if (loading || dadosGrafico.length === 0) {
    return (
      <div
        style={{
          backgroundColor: 'var(--card-bg, #545454)',
          borderRadius: '16px',
          padding: '24px 20px',
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
        <h4 style={{ margin: 0, color: 'var(--text-primary, #ffffff)', fontSize: '14.5px', fontWeight: 'bold' }}>
          {titulo}
        </h4>

        <div style={{ marginTop: '10px' }}>
          <div style={{ color: 'var(--text-secondary, #cccccc)', fontWeight: '600', fontSize: '13px' }}>
            Sem dados no período
          </div>
          <div style={{ color: 'var(--text-secondary, #9e9e9e)', fontSize: '11px', marginTop: '4px', maxWidth: '240px' }}>
            {isAtual
              ? 'Ainda não há faturas fechadas no período selecionado.'
              : 'Nenhum lançamento para projeção no período.'}
          </div>
        </div>
      </div>
    );
  }

  // Cálculo de valores máximos para dimensionamento das barras
  const maxEconomia = Math.max(
    ...dadosGrafico.map((d) => Math.abs(d.economia)),
    100
  );

  return (
    <div
      style={{
        backgroundColor: 'var(--card-bg, #666666)',
        borderRadius: '16px',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        boxSizing: 'border-box',
        border: '1px solid var(--border-color, #777777)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
      }}
    >
      <div>
        <h4 style={{ margin: 0, color: 'var(--text-primary, #ffffff)', fontSize: '15px', fontWeight: 'bold' }}>
          {titulo}
        </h4>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary, #dddddd)', display: 'block', marginTop: '2px' }}>
          {subtitulo}
        </span>
      </div>

      {/* Gráfico de Barras com rolagem horizontal fluida */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '10px',
          height: '140px',
          paddingTop: '16px',
          paddingBottom: '4px',
          borderBottom: '1px solid var(--border-color, #777777)',
          overflowX: 'auto',
          minWidth: '100%',
        }}
      >
        {dadosGrafico.map((d, i) => {
          const isPositivo = d.economia >= 0;
          const alturaPercentual = Math.max(
            15,
            Math.min(100, (Math.abs(d.economia) / maxEconomia) * 100)
          );

          return (
            <div
              key={`${d.ano}-${d.mes}-${i}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: dadosGrafico.length <= 6 ? 1 : '0 0 54px',
                height: '100%',
                justifyContent: 'flex-end',
                minWidth: '46px',
              }}
              title={`${d.mes}/${d.ano}\nEconomia do Mês: R$ ${formatarMoeda(d.economia)}\nSaldo Acumulado: R$ ${formatarMoeda(d.saldoResultante)}`}
            >
              {/* Valor no Topo da Barra */}
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 'bold',
                  color: isPositivo ? 'var(--text-primary, #ffffff)' : '#ff8585',
                  marginBottom: '4px',
                  whiteSpace: 'nowrap',
                }}
              >
                {isPositivo ? '' : '-'}R${Math.abs(d.economia) >= 1000 ? `${(Math.abs(d.economia) / 1000).toFixed(1)}k` : Math.abs(d.economia).toFixed(0)}
              </span>

              {/* Coluna da Barra */}
              <div
                style={{
                  width: '100%',
                  maxWidth: '32px',
                  height: `${alturaPercentual}%`,
                  backgroundColor: isPositivo ? '#2a9d8f' : '#e76f51',
                  borderRadius: '6px 6px 0 0',
                  transition: 'height 0.3s ease, background-color 0.2s ease',
                  cursor: 'pointer',
                  boxShadow: isPositivo
                    ? '0 2px 6px rgba(42, 157, 143, 0.4)'
                    : '0 2px 6px rgba(231, 111, 81, 0.4)',
                }}
              />

              {/* Rótulo do Mês / Ano */}
              <span
                style={{
                  fontSize: '10px',
                  color: 'var(--text-primary, #ffffff)',
                  fontWeight: 'bold',
                  marginTop: '6px',
                  whiteSpace: 'nowrap',
                }}
              >
                {d.mes}
              </span>
              <span
                style={{
                  fontSize: '8px',
                  color: 'var(--text-secondary, #cccccc)',
                  whiteSpace: 'nowrap',
                }}
              >
                {d.ano}
              </span>
            </div>
          );
        })}
      </div>

      {/* Rodapé Informativo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-secondary, #dddddd)' }}>
        <span>Extensão: <strong>{dadosGrafico.length} {dadosGrafico.length === 1 ? 'mês' : 'meses'}</strong></span>
        <span style={{ color: 'var(--accent-color, #ffe192)', fontWeight: 'bold' }}>
          Saldo Final: R$ {formatarMoeda(dadosGrafico[dadosGrafico.length - 1]?.saldoResultante || 0)}
        </span>
      </div>
    </div>
  );
}
