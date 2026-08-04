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

export default function CaixinhaDashboard() {
  const {
    usuarioLogado,
    contaAtiva,
    saldoInicialCaixinha,
    modoCaixinhaVisao,
    setModoCaixinhaVisao,
    horizontePrevisao,
    setHorizontePrevisao,
  } = useBudget();

  const [historicoBruto, setHistoricoBruto] = useState([]);
  const [loading, setLoading] = useState(true);

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
  const opcaoHorizonte = opcoesAtivas.find((o) => o.value === horizontePrevisao) || opcoesAtivas[6];

  let acumulado = Number(saldoInicialCaixinha || 0);

  // Filtragem dos itens do histórico
  let historicoFiltrado = [];

  if (modoCaixinhaVisao === 'atual') {
    // Apenas faturas fechadas, limitando aos N últimos meses selecionados
    const fechadas = historicoBruto.filter((h) => h.isFechada);
    historicoFiltrado = opcaoHorizonte.value === 'completa'
      ? fechadas
      : fechadas.slice(-opcaoHorizonte.meses);
  } else {
    // Projeção futura: faturas fechadas + futuras limitadas aos N próximos meses
    let contadorFuturas = 0;
    historicoFiltrado = historicoBruto.filter((item) => {
      if (item.isFechada) return true;
      contadorFuturas += 1;
      return contadorFuturas <= opcaoHorizonte.meses;
    });
  }

  const historicoProcessado = historicoFiltrado.map((item) => {
    const rec = Number(item.receitas || 0);
    const desp = Number(item.despesas || 0);
    const econ = rec - desp;
    const somaNesteModo = modoCaixinhaVisao === 'projetada' || item.isFechada;

    if (somaNesteModo) {
      acumulado += econ;
    }

    return {
      ...item,
      receitasNum: rec,
      despesasNum: desp,
      economia: econ,
      saldoResultante: somaNesteModo ? acumulado : null,
      somaNesteModo,
    };
  });

  const itensSomados = historicoProcessado.filter((h) => h.somaNesteModo);
  const saldoFinalCaixinha = itensSomados.length > 0
    ? itensSomados[itensSomados.length - 1].saldoResultante
    : Number(saldoInicialCaixinha || 0);

  return (
    <div
      style={{
        backgroundColor: '#545454',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        flex: 1,
        boxSizing: 'border-box',
        width: '100%',
      }}
    >
      {/* Cabeçalho com Seletor de Modo de Visão e Dropdown de Horizonte em Ambos os Modos */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'nowrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <span style={{ fontSize: '24px', flexShrink: 0 }}>📦</span>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ margin: 0, color: '#ffe192', fontSize: '17px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Caixinha Acumulada
            </h3>
            <span style={{ color: '#dddddd', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
              {modoCaixinhaVisao === 'atual'
                ? `Exibindo faturas fechadas (${opcaoHorizonte.label}).`
                : `Projeção futura (${opcaoHorizonte.label}).`}
            </span>
          </div>
        </div>

        {/* Grupo de Ações do Topo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Seletor de Modos de Visão (Saldo Atual vs Projeção Futura) */}
          <div
            style={{
              display: 'flex',
              gap: '4px',
              backgroundColor: '#3e3e3e',
              padding: '3px',
              borderRadius: '12px',
              border: '1px solid #666666',
            }}
          >
            <button
              type="button"
              onClick={() => setModoCaixinhaVisao('atual')}
              style={{
                padding: '6px 12px',
                borderRadius: '9px',
                border: 'none',
                backgroundColor: modoCaixinhaVisao === 'atual' ? '#ffe192' : 'transparent',
                color: modoCaixinhaVisao === 'atual' ? '#333333' : '#dddddd',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                boxShadow: modoCaixinhaVisao === 'atual' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              🔒 Saldo Atual
            </button>
            <button
              type="button"
              onClick={() => setModoCaixinhaVisao('projetada')}
              style={{
                padding: '6px 12px',
                borderRadius: '9px',
                border: 'none',
                backgroundColor: modoCaixinhaVisao === 'projetada' ? '#ffe192' : 'transparent',
                color: modoCaixinhaVisao === 'projetada' ? '#333333' : '#dddddd',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                boxShadow: modoCaixinhaVisao === 'projetada' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              📊 Projeção Futura
            </button>
          </div>

          {/* Dropdown de Horizonte Presente em Ambos os Modos */}
          <select
            value={horizontePrevisao}
            onChange={(e) => setHorizontePrevisao(e.target.value)}
            style={{
              backgroundColor: '#3e3e3e',
              color: '#ffe192',
              border: '1px solid #ffe192',
              borderRadius: '10px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 'bold',
              outline: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              whiteSpace: 'nowrap',
            }}
          >
            {opcoesAtivas.map((opt) => (
              <option key={opt.value} value={opt.value} style={{ backgroundColor: '#2e2e2e', color: '#ffffff' }}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Banner Principal do Saldo da Caixinha */}
      <div
        style={{
          backgroundColor: '#3e3e3e',
          padding: '20px 24px',
          borderRadius: '16px',
          border: '1px solid #ffe192',
          boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <span style={{ fontSize: '13px', color: '#dddddd', fontWeight: 'bold', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {modoCaixinhaVisao === 'atual' ? '💰 Saldo Atual Guardado na Caixinha' : '📊 Saldo Projetado Total da Caixinha'}
          </span>
          <span style={{ fontSize: '12px', color: '#aaaaaa', marginTop: '2px', display: 'block' }}>
            {modoCaixinhaVisao === 'atual'
              ? `Valor consolidado das economias das faturas encerradas (${opcaoHorizonte.label})`
              : `Valor projetado considerando a extensão (${opcaoHorizonte.label})`}
          </span>
        </div>

        <span
          style={{
            fontSize: '28px',
            fontWeight: '800',
            color: saldoFinalCaixinha >= 0 ? '#ffe192' : '#ff8585',
            letterSpacing: '0.5px',
          }}
        >
          R$ {formatarMoeda(saldoFinalCaixinha)}
        </span>
      </div>

      {/* Histórico Cronológico por Mês/Ano */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h4 style={{ margin: 0, color: '#ffffff', fontSize: '15px', fontWeight: 'bold' }}>
          📊 Evolução da Caixinha ({modoCaixinhaVisao === 'atual' ? `Faturas Fechadas: ${opcaoHorizonte.label}` : `Projeção: ${opcaoHorizonte.label}`})
        </h4>

        <div style={{ overflowY: 'auto', maxHeight: '340px', borderRadius: '12px', border: '1px solid #666666' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#ffffff', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#3e3e3e', color: '#ffe192' }}>
                <th style={{ padding: '12px 14px' }}>Mês / Ano</th>
                <th style={{ padding: '12px 14px' }}>Status</th>
                <th style={{ padding: '12px 14px' }}>Receitas</th>
                <th style={{ padding: '12px 14px' }}>Despesas</th>
                <th style={{ padding: '12px 14px' }}>Economia do Mês</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Saldo da Caixinha</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#aaaaaa' }}>
                    Carregando histórico da Caixinha...
                  </td>
                </tr>
              ) : historicoProcessado.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#aaaaaa' }}>
                    Nenhum lançamento registrado no histórico.
                  </td>
                </tr>
              ) : (
                historicoProcessado.map((item, index) => (
                  <tr
                    key={`${item.ano}-${item.mes}`}
                    style={{
                      backgroundColor: index % 2 === 0 ? '#4d4d4d' : '#444444',
                      borderBottom: '1px solid #5a5a5a',
                      opacity: item.somaNesteModo ? 1 : 0.6,
                    }}
                  >
                    <td style={{ padding: '12px 14px', fontWeight: 'bold', color: '#ffe192' }}>
                      {item.mes} / {item.ano}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {item.isFechada ? (
                        <span style={{ color: '#2a9d8f', backgroundColor: '#1b3b36', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                          🔒 Fechada
                        </span>
                      ) : (
                        <span style={{ color: modoCaixinhaVisao === 'projetada' ? '#ffe192' : '#aaaaaa', backgroundColor: modoCaixinhaVisao === 'projetada' ? '#4c4228' : '#363636', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: modoCaixinhaVisao === 'projetada' ? 'bold' : 'normal' }}>
                          {modoCaixinhaVisao === 'projetada' ? '📊 Projetada' : '⏳ Em Aberto'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#ffffff' }}>
                      R$ {formatarMoeda(item.receitasNum)}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#ffffff' }}>
                      R$ {formatarMoeda(item.despesasNum)}
                    </td>
                    <td
                      style={{
                        padding: '12px 14px',
                        fontWeight: 'bold',
                        color: item.economia > 0 ? '#2a9d8f' : item.economia < 0 ? '#ff8585' : '#aaaaaa',
                      }}
                    >
                      {item.economia > 0 ? '+' : ''}R$ {formatarMoeda(item.economia)}
                    </td>
                    <td
                      style={{
                        padding: '12px 14px',
                        fontWeight: 'bold',
                        textAlign: 'right',
                        color: item.somaNesteModo ? (item.saldoResultante >= 0 ? '#ffe192' : '#ff8585') : '#888888',
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
