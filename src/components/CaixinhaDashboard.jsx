import React, { useState, useEffect } from 'react';
import { useBudget } from '../contexts/BudgetContext';

export const OPCOES_ATUAL = [
  { value: 'mes_anterior', label: 'Mês anterior (1 mês)', meses: 1 },
  { value: '2_meses', label: 'Últimos 2 meses', meses: 2 },
  { value: '3_meses', label: 'Últimos 3 meses', meses: 3 },
  { value: '4_meses', label: 'Últimos 4 meses', meses: 4 },
  { value: '5_meses', label: 'Últimos 5 meses', meses: 5 },
  { value: '6_meses', label: 'Últimos 6 meses', meses: 6 },
  { value: '1_ano', label: 'Último 1 ano (12 meses)', meses: 12 },
  { value: '2_anos', label: 'Últimos 2 anos (24 meses)', meses: 24 },
  { value: '3_anos', label: 'Últimos 3 anos (36 meses)', meses: 36 },
  { value: '4_anos', label: 'Últimos 4 anos (48 meses)', meses: 48 },
  { value: '5_anos', label: 'Últimos 5 anos (60 meses)', meses: 60 },
  { value: 'personalizada', label: 'Período Personalizado...', meses: 0 },
  { value: 'completa', label: 'Histórico Completo', meses: 0 },
];

export const OPCOES_PROJETADA = [
  { value: 'mes_seguinte', label: 'Mês seguinte (1 mês)', meses: 1 },
  { value: '2_meses', label: 'Próximos 2 meses', meses: 2 },
  { value: '3_meses', label: 'Próximos 3 meses', meses: 3 },
  { value: '4_meses', label: 'Próximos 4 meses', meses: 4 },
  { value: '5_meses', label: 'Próximos 5 meses', meses: 5 },
  { value: '6_meses', label: 'Próximos 6 meses', meses: 6 },
  { value: '1_ano', label: 'Próximo 1 ano (12 meses)', meses: 12 },
  { value: '2_anos', label: 'Próximos 2 anos (24 meses)', meses: 24 },
  { value: '3_anos', label: 'Próximos 3 anos (36 meses)', meses: 36 },
  { value: '4_anos', label: 'Próximos 4 anos (48 meses)', meses: 48 },
  { value: '5_anos', label: 'Próximos 5 anos (60 meses)', meses: 60 },
  { value: 'personalizada', label: 'Previsão Específica...', meses: 0 },
  { value: 'completa', label: 'Meses Cadastrados', meses: 0 },
];

export const MESES_LISTA_ORDEM = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function getProximoMesAno(mesStr, anoStr, incremento = 1) {
  const mesIndex = MESES_LISTA_ORDEM.indexOf(mesStr);
  const anoInt = parseInt(anoStr, 10) || new Date().getFullYear();
  if (mesIndex === -1) return { mes: 'Jan', ano: (anoInt + 1).toString() };

  const totalMeses = mesIndex + incremento;
  const novoMesIndex = ((totalMeses % 12) + 12) % 12;
  const anosAdicionais = Math.floor(totalMeses / 12);
  const novoAno = anoInt + anosAdicionais;

  return {
    mes: MESES_LISTA_ORDEM[novoMesIndex],
    ano: novoAno.toString(),
  };
}

export function calcularMesesAteData(mesAlvo, anoAlvo, mesReferencia, anoReferencia) {
  const mesIdxRef = MESES_LISTA_ORDEM.indexOf(mesReferencia);
  const anoRef = parseInt(anoReferencia, 10) || new Date().getFullYear();

  const mesIdxAlvo = MESES_LISTA_ORDEM.indexOf(mesAlvo);
  const anoAlvoInt = parseInt(anoAlvo, 10) || anoRef;

  if (mesIdxRef === -1 || mesIdxAlvo === -1) return 1;

  const diff = (anoAlvoInt - anoRef) * 12 + (mesIdxAlvo - mesIdxRef) + 1;
  return Math.max(1, diff);
}

export default function CaixinhaDashboard() {
  const {
    usuarioLogado,
    contaAtiva,
    saldoInicialCaixinha,
    modoCaixinhaVisao,
    setModoCaixinhaVisao,
    horizontePrevisao,
    setHorizontePrevisao,
    mesesPersonalizados,
    setMesesPersonalizados,
    tipoPrevisaoEspecifica,
    setTipoPrevisaoEspecifica,
    mesMetaPrevisao,
    anoMetaPrevisao,
    atualizarDataMetaPrevisao,
    aporteExtraMensal,
    setAporteExtraMensal,
    metaSaldoCaixinha,
    setMetaSaldoCaixinha,
    caixinhaRendimentoTaxa = 0,
    caixinhaRendimentoPeriodo = 'mensal',
    atualizarRendimentoCaixinha,
    isComercial,
  } = useBudget();

  const [historicoBruto, setHistoricoBruto] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPainelEspecificoAberto, setIsPainelEspecificoAberto] = useState(horizontePrevisao === 'personalizada');

  const formatarMoeda = (valor) => {
    return (Number(valor) || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  useEffect(() => {
    const carregarHistorico = async () => {
      if (!usuarioLogado || !window.apiTurso) return;
      setLoading(true);
      try {
        const res = await window.apiTurso.obterHistoricoCaixinha({
          usuarioId: usuarioLogado.id,
          contaId: contaAtiva?.id,
        });

        if (res?.success && Array.isArray(res.historico)) {
          setHistoricoBruto(res.historico);
        } else {
          setHistoricoBruto([]);
        }
      } catch (err) {
        console.error('Erro ao carregar histórico da caixinha:', err);
        setHistoricoBruto([]);
      } finally {
        setLoading(false);
      }
    };

    carregarHistorico();
  }, [usuarioLogado?.id, contaAtiva?.id, saldoInicialCaixinha]);

  // Lista de opções conforme o modo de visão (Atual vs Projetada)
  const opcoesAtivas = modoCaixinhaVisao === 'atual' ? OPCOES_ATUAL : OPCOES_PROJETADA;
  const opcaoHorizonte = opcoesAtivas.find((o) => o.value === horizontePrevisao) || opcoesAtivas[opcoesAtivas.length - 1];

  // Identificação dos meses de referência
  const fechadas = historicoBruto.filter((h) => h.isFechada);
  const futurasExistentes = historicoBruto.filter((h) => !h.isFechada);

  const hoje = new Date();
  const mesAtualNome = MESES_LISTA_ORDEM[hoje.getMonth()];
  const anoAtualNome = hoje.getFullYear().toString();

  const mesRef = futurasExistentes.length > 0 ? futurasExistentes[0].mes : mesAtualNome;
  const anoRef = futurasExistentes.length > 0 ? futurasExistentes[0].ano : anoAtualNome;

  // Cálculo da quantidade de meses limite
  let mesesLimite = 1;
  if (horizontePrevisao === 'personalizada') {
    if (tipoPrevisaoEspecifica === 'data_alvo') {
      mesesLimite = calcularMesesAteData(mesMetaPrevisao, anoMetaPrevisao, mesRef, anoRef);
    } else {
      mesesLimite = Math.max(1, parseInt(mesesPersonalizados, 10) || 1);
    }
  } else if (horizontePrevisao === 'completa') {
    mesesLimite = modoCaixinhaVisao === 'atual' ? (fechadas.length || 1) : (futurasExistentes.length || 1);
  } else {
    mesesLimite = opcaoHorizonte?.meses || 1;
  }

  // Label descritiva do horizonte selecionado com gramática correta
  const getLabelHorizonte = () => {
    if (horizontePrevisao === 'personalizada') {
      if (tipoPrevisaoEspecifica === 'data_alvo') {
        return `Até ${mesMetaPrevisao}/${anoMetaPrevisao} (${mesesLimite} ${mesesLimite === 1 ? 'mês' : 'meses'})`;
      }
      return modoCaixinhaVisao === 'atual'
        ? (mesesLimite === 1 ? 'Último 1 mês' : `Últimos ${mesesLimite} meses`)
        : (mesesLimite === 1 ? 'Próximo 1 mês' : `Próximos ${mesesLimite} meses`);
    }
    return opcaoHorizonte?.label || 'Meses Cadastrados';
  };

  const labelAtiva = getLabelHorizonte();

  // Filtragem e Projeção Sintética dos Itens
  let historicoFiltrado = [];

  if (modoCaixinhaVisao === 'atual') {
    historicoFiltrado = horizontePrevisao === 'completa'
      ? fechadas
      : fechadas.slice(-mesesLimite);
  } else {
    if (horizontePrevisao === 'completa') {
      historicoFiltrado = [...fechadas, ...futurasExistentes];
    } else {
      let futurasParaIncluir = [];
      if (futurasExistentes.length >= mesesLimite) {
        futurasParaIncluir = futurasExistentes.slice(0, mesesLimite);
      } else {
        futurasParaIncluir = [...futurasExistentes];
        const mesesFaltantes = mesesLimite - futurasExistentes.length;

        const baseMes = futurasExistentes.length > 0
          ? futurasExistentes[futurasExistentes.length - 1].mes
          : mesRef;
        const baseAno = futurasExistentes.length > 0
          ? futurasExistentes[futurasExistentes.length - 1].ano
          : anoRef;

        for (let i = 1; i <= mesesFaltantes; i++) {
          const prox = getProximoMesAno(baseMes, baseAno, i);
          futurasParaIncluir.push({
            ano: prox.ano,
            mes: prox.mes,
            receitas: 0,
            despesas: 0,
            reservas: 0, // Apenas registros reais contam reservas. Meses sem registros recebem 0.
            isFechada: false,
            isEstimada: true,
          });
        }
      }

      historicoFiltrado = [...fechadas, ...futurasParaIncluir];
    }
  }

  // Cálculo da Taxa Mensal Equivalente de Rendimento
  const taxaNum = Number(caixinhaRendimentoTaxa || 0);
  const taxaMensal = taxaNum > 0
    ? (caixinhaRendimentoPeriodo === 'anual'
        ? Math.pow(1 + (taxaNum / 100), 1 / 12) - 1
        : taxaNum / 100)
    : 0;

  // Processamento Acumulativo de Saldo + Rendimento + Aporte Extra/Estimado Simulado
  let acumulado = Number(saldoInicialCaixinha || 0);
  let totalRendimentosAcumulados = 0;

  const historicoProcessado = historicoFiltrado.map((item) => {
    const rec = Number(item.receitas || 0);
    const desp = Number(item.despesas || 0); // despesas comuns
    const res = Number(item.reservas || 0);  // despesas classificadas como reserva
    const aporteEstimado = (!item.isFechada && modoCaixinhaVisao === 'projetada') ? Number(aporteExtraMensal || 0) : 0;
    const somaNesteModo = modoCaixinhaVisao === 'projetada' || item.isFechada;
    
    let rendimentoDoMes = 0;
    let aporteTotal = 0;
    let econ = 0;

    if (item.isFechada) {
      // Meses fechados: consolida o resultado real (receitas - despesas_comuns = reservas + sobra ou falta real)
      econ = (rec - desp);
      if (somaNesteModo) {
        acumulado += econ;
      }
    } else {
      // Meses abertos / projeção futura:
      aporteTotal = item.isEstimada ? aporteEstimado : res;
      rendimentoDoMes = (taxaMensal > 0 && acumulado > 0) ? (acumulado * taxaMensal) : 0;
      econ = aporteTotal + rendimentoDoMes;

      if (somaNesteModo) {
        acumulado += econ;
        totalRendimentosAcumulados += rendimentoDoMes;
      }
    }

    return {
      ...item,
      receitasNum: rec,
      despesasNum: desp,
      reservasNum: res,
      aporteExtraNum: aporteEstimado,
      aporteTotalNum: aporteTotal,
      rendimentoNum: rendimentoDoMes,
      economia: econ,
      saldoResultante: somaNesteModo ? acumulado : null,
      somaNesteModo,
    };
  });

  const itensSomados = historicoProcessado.filter((h) => h.somaNesteModo);
  const saldoFinalCaixinha = itensSomados.length > 0
    ? itensSomados[itensSomados.length - 1].saldoResultante
    : Number(saldoInicialCaixinha || 0);

  // Cálculos de Meta Financeira
  const metaNum = Number(metaSaldoCaixinha || 0);
  const itemAlcancouMeta = metaNum > 0 ? itensSomados.find((i) => i.saldoResultante >= metaNum) : null;
  const progressoMeta = metaNum > 0 ? Math.min(100, Math.max(0, (saldoFinalCaixinha / metaNum) * 100)) : 0;

  // Próximo mês/ano calculado para exibição rápida
  const dataFinalCalculada = getProximoMesAno(mesRef, anoRef, mesesLimite - 1);

  // Lista de anos para seletor de data alvo
  const anoAtualInt = parseInt(anoAtualNome, 10);
  const anosPrevisao = Array.from({ length: 12 }, (_, i) => (anoAtualInt + i).toString());

  return (
    <div
      style={{
        backgroundColor: 'var(--card-bg, #545454)',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        flex: 1,
        boxSizing: 'border-box',
        width: '100%',
      }}
    >
      {/* Top Header & Modo Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ margin: 0, color: 'var(--accent-color, #ffe192)', fontSize: '18px', fontWeight: 'bold' }}>
            {isComercial ? 'Reserva de Lucros Corporativa' : 'Caixinha de Economia'}
          </h3>
          <span style={{ color: 'var(--text-secondary, #cccccc)', fontSize: '12px', marginTop: '2px', display: 'block' }}>
            {modoCaixinhaVisao === 'atual'
              ? `Faturas fechadas consolidadas • ${labelAtiva}`
              : `Projeção orçamentária futura • ${labelAtiva}`}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Segmented Switch: Saldo Atual vs Projeção Futura */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              padding: '3px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <button
              type="button"
              onClick={() => setModoCaixinhaVisao('atual')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: modoCaixinhaVisao === 'atual' ? 'var(--accent-color, #ffe192)' : 'transparent',
                color: modoCaixinhaVisao === 'atual' ? 'var(--accent-text, #333333)' : 'var(--text-secondary, #aaaaaa)',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {isComercial ? 'Realizado' : 'Saldo Atual'}
            </button>
            <button
              type="button"
              onClick={() => setModoCaixinhaVisao('projetada')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: modoCaixinhaVisao === 'projetada' ? 'var(--accent-color, #ffe192)' : 'transparent',
                color: modoCaixinhaVisao === 'projetada' ? 'var(--accent-text, #333333)' : 'var(--text-secondary, #aaaaaa)',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {isComercial ? 'Projeção' : 'Projeção Futura'}
            </button>
          </div>

          {/* Select de Horizonte */}
          <select
            value={horizontePrevisao}
            onChange={(e) => {
              const novoVal = e.target.value;
              setHorizontePrevisao(novoVal);
              if (novoVal === 'personalizada') {
                setIsPainelEspecificoAberto(true);
              } else {
                setIsPainelEspecificoAberto(false);
              }
            }}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              color: 'var(--text-primary, #ffffff)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '600',
              outline: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {opcoesAtivas.map((opt) => (
              <option key={opt.value} value={opt.value} style={{ backgroundColor: 'var(--card-bg, #2e2e2e)', color: 'var(--text-primary, #ffffff)' }}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Botão de Previsão Específica */}
          <button
            type="button"
            onClick={() => {
              if (horizontePrevisao !== 'personalizada') {
                setHorizontePrevisao('personalizada');
                setIsPainelEspecificoAberto(true);
              } else {
                setIsPainelEspecificoAberto(!isPainelEspecificoAberto);
                if (isPainelEspecificoAberto) {
                  setHorizontePrevisao('completa');
                }
              }
            }}
            title="Configurar Previsão Específica"
            style={{
              padding: '6px 12px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backgroundColor: (horizontePrevisao === 'personalizada' && isPainelEspecificoAberto) ? 'rgba(255, 225, 146, 0.15)' : 'transparent',
              color: (horizontePrevisao === 'personalizada' && isPainelEspecificoAberto) ? 'var(--accent-color, #ffe192)' : 'var(--text-secondary, #cccccc)',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            {(horizontePrevisao === 'personalizada' && isPainelEspecificoAberto) ? 'Fechar Simulador' : 'Simulador'}
          </button>
        </div>
      </div>

      {/* PAINEL DE PREVISÃO ESPECÍFICA & SIMULADOR */}
      {(horizontePrevisao === 'personalizada' && isPainelEspecificoAberto) && (
        <div
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
            <h4 style={{ margin: 0, color: 'var(--text-primary, #ffffff)', fontSize: '14.5px', fontWeight: 'bold' }}>
              Simulador de Previsão
            </h4>

            {/* Seletor Segmentado: Quantidade de Meses vs Data Alvo */}
            <div style={{ display: 'flex', gap: '3px', backgroundColor: 'rgba(0, 0, 0, 0.25)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <button
                type="button"
                onClick={() => setTipoPrevisaoEspecifica('meses')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: tipoPrevisaoEspecifica === 'meses' ? 'var(--accent-color, #ffe192)' : 'transparent',
                  color: tipoPrevisaoEspecifica === 'meses' ? 'var(--accent-text, #222)' : 'var(--text-secondary, #aaaaaa)',
                  fontSize: '11.5px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Por Quantidade de Meses
              </button>
              <button
                type="button"
                onClick={() => setTipoPrevisaoEspecifica('data_alvo')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: tipoPrevisaoEspecifica === 'data_alvo' ? 'var(--accent-color, #ffe192)' : 'transparent',
                  color: tipoPrevisaoEspecifica === 'data_alvo' ? 'var(--accent-text, #222)' : 'var(--text-secondary, #aaaaaa)',
                  fontSize: '11.5px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Até Data / Mês Alvo
              </button>
            </div>
          </div>

          {/* Linha de Controles Interativos de Horizonte */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', alignItems: 'center' }}>
            {tipoPrevisaoEspecifica === 'meses' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-primary, #ffffff)', fontWeight: '600' }}>
                    Meses à Frente:
                  </label>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--accent-color, #ffe192)', backgroundColor: 'rgba(255,225,146,0.12)', padding: '2px 8px', borderRadius: '6px' }}>
                    {mesesPersonalizados} {mesesPersonalizados === 1 ? 'mês' : 'meses'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setMesesPersonalizados(Math.max(1, mesesPersonalizados - 1))}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      color: 'var(--text-primary, #fff)',
                      fontSize: '15px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    -
                  </button>

                  <input
                    type="range"
                    min="1"
                    max="60"
                    value={mesesPersonalizados}
                    onChange={(e) => setMesesPersonalizados(parseInt(e.target.value, 10))}
                    style={{ flex: 1, accentColor: 'var(--accent-color, #ffe192)', cursor: 'pointer' }}
                  />

                  <button
                    type="button"
                    onClick={() => setMesesPersonalizados(Math.min(120, mesesPersonalizados + 1))}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      color: 'var(--text-primary, #fff)',
                      fontSize: '15px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    +
                  </button>
                </div>

                {/* Atalhos Rápidos Essenciais */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                  {[1, 3, 6, 12, 24, 36].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setMesesPersonalizados(n)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: mesesPersonalizados === n ? '1px solid var(--accent-color, #ffe192)' : '1px solid rgba(255, 255, 255, 0.08)',
                        backgroundColor: mesesPersonalizados === n ? 'rgba(255, 225, 146, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                        color: mesesPersonalizados === n ? 'var(--accent-color, #ffe192)' : 'var(--text-secondary, #aaaaaa)',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {n}m
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-primary, #ffffff)', fontWeight: '600' }}>
                  Mês e Ano Alvo:
                </label>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <select
                    value={mesMetaPrevisao}
                    onChange={(e) => atualizarDataMetaPrevisao(e.target.value, null)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      color: 'var(--text-primary, #fff)',
                      fontSize: '13px',
                      fontWeight: '600',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {MESES_LISTA_ORDEM.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>

                  <select
                    value={anoMetaPrevisao}
                    onChange={(e) => atualizarDataMetaPrevisao(null, e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      color: 'var(--text-primary, #fff)',
                      fontSize: '13px',
                      fontWeight: '600',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {anosPrevisao.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                <span style={{ fontSize: '11px', color: 'var(--text-secondary, #aaaaaa)' }}>
                  Distância: <strong style={{ color: 'var(--accent-color, #ffe192)' }}>{mesesLimite} {mesesLimite === 1 ? 'mês' : 'meses'}</strong> a partir do mês atual.
                </span>
              </div>
            )}

            {/* Simulação: Economia Estimada Mensal & Meta Financeira */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary, #cccccc)', fontWeight: '600' }}>
                  Economia Estimada por Mês (R$):
                </label>
                <input
                  type="number"
                  step="50"
                  min="0"
                  placeholder="Ex: 500,00"
                  value={aporteExtraMensal || ''}
                  onChange={(e) => setAporteExtraMensal(e.target.value)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    color: 'var(--text-primary, #ffffff)',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    outline: 'none',
                  }}
                />
                <span style={{ fontSize: '10px', color: 'var(--text-secondary, #9e9e9e)' }}>
                  Aplica nos meses futuros sem registros.
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary, #cccccc)', fontWeight: '600' }}>
                  Meta de Saldo Alvo (R$):
                </label>
                <input
                  type="number"
                  step="500"
                  min="0"
                  placeholder="Ex: 20000"
                  value={metaSaldoCaixinha || ''}
                  onChange={(e) => setMetaSaldoCaixinha(e.target.value)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    color: 'var(--accent-color, #ffe192)',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Cards de Resumo da Previsão Específica com Hierarquia Clara */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              padding: '14px 18px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              alignItems: 'center',
            }}
          >
            {/* Saldo Final Estimado em Destaque Primário */}
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary, #aaaaaa)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Saldo Final Estimado
              </span>
              <strong style={{ fontSize: '20px', fontWeight: '800', color: saldoFinalCaixinha >= 0 ? 'var(--accent-color, #ffe192)' : '#ff8585' }}>
                R$ {formatarMoeda(saldoFinalCaixinha)}
              </strong>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary, #aaaaaa)', display: 'block' }}>Extensão do Cálculo</span>
              <span style={{ fontSize: '13px', color: '#ffffff', fontWeight: '600' }}>
                {mesesLimite} {mesesLimite === 1 ? 'mês' : 'meses'} (até {dataFinalCalculada.mes}/{dataFinalCalculada.ano})
              </span>
            </div>

            {taxaNum > 0 && modoCaixinhaVisao === 'projetada' && (
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary, #aaaaaa)', display: 'block' }}>Rendimentos Ganhos</span>
                <strong style={{ fontSize: '13px', color: '#50fa7b' }}>
                  +R$ {formatarMoeda(totalRendimentosAcumulados)}
                </strong>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary, #888888)', display: 'block' }}>
                  ({taxaNum}% {caixinhaRendimentoPeriodo === 'anual' ? 'a.a.' : 'a.m.'})
                </span>
              </div>
            )}

            {metaNum > 0 && (
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary, #aaaaaa)', display: 'block' }}>
                  Meta de R$ {formatarMoeda(metaNum)}
                </span>
                {itemAlcancouMeta ? (
                  <span style={{ fontSize: '12px', color: '#50fa7b', fontWeight: 'bold' }}>
                    Alcançada em {itemAlcancouMeta.mes}/{itemAlcancouMeta.ano}
                  </span>
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--accent-color, #ffe192)', fontWeight: '600' }}>
                    Progresso: {progressoMeta.toFixed(1)}%
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Card de Destaque do Saldo Consolidado / Projetado */}
      <div
        style={{
          backgroundColor: 'var(--surface-bg, #3e3e3e)',
          padding: '18px 22px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <span style={{ fontSize: '12px', color: 'var(--accent-color, #ffe192)', fontWeight: '700', display: 'block', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            {isComercial
              ? (modoCaixinhaVisao === 'atual' ? 'Saldo em Reserva de Lucros' : 'Saldo Projetado da Reserva')
              : (modoCaixinhaVisao === 'atual' ? 'Saldo Guardado na Caixinha' : 'Saldo Futuro Projetado')}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary, #aaaaaa)', display: 'block', marginTop: '2px' }}>
            {modoCaixinhaVisao === 'atual'
              ? `Consolidado de faturas encerradas (${labelAtiva})`
              : `Projeção acumulada no período (${labelAtiva})`}
          </span>
        </div>

        <span
          style={{
            fontSize: '26px',
            fontWeight: '800',
            color: saldoFinalCaixinha >= 0 ? 'var(--accent-color, #ffe192)' : '#ff8585',
            letterSpacing: '0.5px',
          }}
        >
          R$ {formatarMoeda(saldoFinalCaixinha)}
        </span>
      </div>

      {/* Tabela de Evolução da Caixinha */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h4 style={{ margin: 0, color: 'var(--text-primary, #ffffff)', fontSize: '14.5px', fontWeight: 'bold' }}>
          {isComercial ? 'Evolução da Reserva' : 'Evolução da Caixinha'}
        </h4>

        <div style={{ overflowY: 'auto', maxHeight: '340px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary, #ffffff)', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--header-bg, #3a3a3a)', color: 'var(--accent-color, #ffe192)' }}>
                <th style={{ padding: '10px 14px' }}>Mês / Ano</th>
                <th style={{ padding: '10px 14px' }}>Status</th>
                <th style={{ padding: '10px 14px' }}>{isComercial ? 'Faturamento' : 'Receitas'}</th>
                <th style={{ padding: '10px 14px' }}>{isComercial ? 'Custos' : 'Despesas'}</th>
                <th style={{ padding: '10px 14px' }}>{isComercial ? 'Resultado' : 'Economia'}</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>{isComercial ? 'Saldo Reserva' : 'Saldo Caixinha'}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary, #aaaaaa)' }}>
                    Carregando histórico...
                  </td>
                </tr>
              ) : historicoProcessado.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary, #aaaaaa)' }}>
                    Nenhum registro encontrado no período selecionado.
                  </td>
                </tr>
              ) : (
                historicoProcessado.map((item, index) => (
                  <tr
                    key={`${item.ano}-${item.mes}-${index}`}
                    style={{
                      backgroundColor: index % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      opacity: item.somaNesteModo ? 1 : 0.6,
                    }}
                  >
                    <td style={{ padding: '10px 14px', fontWeight: 'bold', color: 'var(--accent-color, #ffe192)' }}>
                      {item.mes} / {item.ano}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {item.isFechada ? (
                        <span style={{ color: '#50fa7b', backgroundColor: 'rgba(80, 250, 123, 0.12)', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>
                          Fechada
                        </span>
                      ) : item.isEstimada ? (
                        <span style={{ color: '#64dfdf', backgroundColor: 'rgba(100, 223, 223, 0.12)', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>
                          Estimada
                        </span>
                      ) : (
                        <span style={{ color: modoCaixinhaVisao === 'projetada' ? 'var(--accent-color, #ffe192)' : 'var(--text-secondary, #aaaaaa)', backgroundColor: modoCaixinhaVisao === 'projetada' ? 'rgba(255, 225, 146, 0.12)' : 'rgba(255, 255, 255, 0.04)', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>
                          {modoCaixinhaVisao === 'projetada' ? 'Projetada' : 'Em Aberto'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-primary, #ffffff)' }}>
                      {item.isFechada
                        ? `R$ ${formatarMoeda(item.receitasNum)}`
                        : (item.isEstimada ? '—' : (item.receitasNum > 0 ? `R$ ${formatarMoeda(item.receitasNum)}` : '—'))}
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-primary, #ffffff)' }}>
                      {item.isFechada ? (
                        `R$ ${formatarMoeda(item.despesasNum)}`
                      ) : item.reservasNum > 0 ? (
                        <div>
                          <span style={{ fontWeight: 'bold', color: '#50fa7b' }}>
                            R$ {formatarMoeda(item.reservasNum)}
                          </span>
                          <span style={{ fontSize: '10px', display: 'block', color: 'var(--text-secondary, #aaaaaa)' }}>
                            (reserva)
                          </span>
                        </div>
                      ) : item.aporteTotalNum > 0 ? (
                        <div>
                          <span style={{ fontWeight: 'bold', color: '#2a9d8f' }}>
                            R$ {formatarMoeda(item.aporteTotalNum)}
                          </span>
                          <span style={{ fontSize: '10px', display: 'block', color: 'var(--text-secondary, #aaaaaa)' }}>
                            (estimado)
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-secondary, #888888)' }}>—</span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: '10px 14px',
                        fontWeight: 'bold',
                        color: item.economia > 0 ? '#50fa7b' : item.economia < 0 ? '#ff8585' : 'var(--text-secondary, #aaaaaa)',
                      }}
                    >
                      {item.economia > 0 ? '+' : ''}R$ {formatarMoeda(item.economia)}
                      <span style={{ fontSize: '10px', display: 'block', color: item.isFechada ? 'var(--text-secondary, #aaaaaa)' : '#50fa7b', fontWeight: 'normal' }}>
                        {item.isFechada
                          ? '(resultado consolidado)'
                          : (item.aporteTotalNum > 0 && item.rendimentoNum > 0)
                          ? `(${item.isEstimada ? 'estimado' : 'reserva'} R$ ${formatarMoeda(item.aporteTotalNum)} + R$ ${formatarMoeda(item.rendimentoNum)} rend.)`
                          : item.aporteTotalNum > 0
                          ? `(+R$ ${formatarMoeda(item.aporteTotalNum)} ${item.isEstimada ? 'estimado' : 'reserva'})`
                          : item.rendimentoNum > 0
                          ? `(+R$ ${formatarMoeda(item.rendimentoNum)} rendimento)`
                          : '• Sem novos aportes'}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '10px 14px',
                        fontWeight: 'bold',
                        textAlign: 'right',
                        color: item.somaNesteModo ? (item.saldoResultante >= 0 ? 'var(--accent-color, #ffe192)' : '#ff8585') : 'var(--text-secondary, #888888)',
                      }}
                    >
                      {item.somaNesteModo ? `R$ ${formatarMoeda(item.saldoResultante)}` : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
