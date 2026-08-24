import React, { useState, useEffect, useMemo } from 'react';
import { useBudget } from '../contexts/BudgetContext';
import CategoryDetailModal from './CategoryDetailModal';

const MESES_LISTA = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function SummaryCards() {
  const {
    abaAtiva,
    receitas,
    despesas,
    totalReceitas,
    totalDespesas,
    totalReservas = 0,
    economia,
    categorias,
    isCaixinhaAtiva,
    saldoCaixinhaAcumulado,
    mesSelecionado,
    anoSelecionado,
    isComercial,
    abrirModalAdicionar,
  } = useBudget();

  const [isReceitasOpen, setIsReceitasOpen] = useState(abaAtiva === 'receitas');
  const [isDespesasOpen, setIsDespesasOpen] = useState(abaAtiva === 'despesas');
  const [modalCat, setModalCat] = useState(null); // { categoryName, tipo, color }

  // Sincroniza a abertura dos dropdowns com a aba ativa selecionada (Receitas x Despesas)
  useEffect(() => {
    if (abaAtiva === 'receitas') {
      setIsReceitasOpen(true);
      setIsDespesasOpen(false);
    } else if (abaAtiva === 'despesas') {
      setIsDespesasOpen(true);
      setIsReceitasOpen(false);
    }
  }, [abaAtiva]);

  const formatarMoeda = (valor) => {
    return (Number(valor) || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Agrupa e calcula valores totais de Receitas por categoria em ordem decrescente
  const categoriasReceitaCalculadas = useMemo(() => {
    const agrupado = (receitas || []).reduce((acc, item) => {
      const cat = item.classificacao || 'Outros';
      acc[cat] = (acc[cat] || 0) + Number(item.valor || 0);
      return acc;
    }, {});

    const coresFallbacks = ['#2a9d8f', '#ffe192', '#fb8500', '#e76f51', '#457b9d', '#9d4edd', '#f4a261'];

    return Object.entries(agrupado)
      .map(([nome, valor], idx) => {
        const catObj = (categorias || []).find((c) => c.nome?.toLowerCase() === nome?.toLowerCase());
        const cor = catObj?.cor || coresFallbacks[idx % coresFallbacks.length];
        const porcentagem = totalReceitas > 0 ? (valor / totalReceitas) * 100 : 0;
        return { nome, valor, cor, porcentagem };
      })
      .sort((a, b) => b.valor - a.valor);
  }, [receitas, totalReceitas, categorias]);

  // Agrupa e calcula valores totais de Despesas por categoria em ordem decrescente
  const categoriasDespesaCalculadas = useMemo(() => {
    const agrupado = (despesas || []).reduce((acc, item) => {
      const cat = item.classificacao || 'Outros';
      acc[cat] = (acc[cat] || 0) + Number(item.valor || 0);
      return acc;
    }, {});

    const coresFallbacks = ['#ffe192', '#fb8500', '#ffd166', '#ffb703', '#f4a261', '#2a9d8f', '#e76f51'];

    return Object.entries(agrupado)
      .map(([nome, valor], idx) => {
        const catObj = (categorias || []).find((c) => c.nome?.toLowerCase() === nome?.toLowerCase());
        const cor = catObj?.cor || coresFallbacks[idx % coresFallbacks.length];
        const porcentagem = totalDespesas > 0 ? (valor / totalDespesas) * 100 : 0;
        return { nome, valor, cor, porcentagem };
      })
      .sort((a, b) => b.valor - a.valor);
  }, [despesas, totalDespesas, categorias]);

  // Verifica se o mês selecionado é 'Todos' ou um mês específico
  const isTodos = mesSelecionado === 'Todos';

  // Verifica se o ano/mês selecionado é atual ou futuro
  const agora = new Date();
  const anoAtual = agora.getFullYear();
  const mesAtualIdx = agora.getMonth(); // 0 a 11

  const anoSelInt = parseInt(anoSelecionado, 10) || anoAtual;
  const mesSelIdx = isTodos ? 11 : MESES_LISTA.indexOf(mesSelecionado);

  const isFuturo = anoSelInt > anoAtual || (anoSelInt === anoAtual && mesSelIdx >= mesAtualIdx);
  const sufixoTempo = isTodos ? 'este ano' : 'este mês';

  // Cálculo da projeção anual considerando meses fechados (resultado real) + meses abertos/futuros (apenas reservas)
  const economiaProjetadaAno = useMemo(() => {
    if (!isTodos) return 0;
    const mapaMeses = {};
    MESES_LISTA.forEach((m, idx) => {
      mapaMeses[m] = {
        mes: m,
        isFechado: anoSelInt < anoAtual || (anoSelInt === anoAtual && idx < mesAtualIdx),
        receitas: 0,
        despesasComuns: 0,
        reservas: 0,
      };
    });

    (receitas || []).forEach((r) => {
      if (mapaMeses[r.mes]) {
        mapaMeses[r.mes].receitas += Number(r.valor || 0);
      }
    });

    (despesas || []).forEach((d) => {
      if (mapaMeses[d.mes]) {
        const val = Number(d.valor || 0);
        const ehRes = d.eh_reserva === 1 || d.eh_reserva === '1' || d.eh_reserva === true || d.ehReserva;
        if (ehRes) {
          mapaMeses[d.mes].reservas += val;
        } else {
          mapaMeses[d.mes].despesasComuns += val;
        }
      }
    });

    return Object.values(mapaMeses).reduce((acc, m) => {
      if (m.isFechado) {
        return acc + (m.receitas - m.despesasComuns);
      } else {
        return acc + m.reservas;
      }
    }, 0);
  }, [isTodos, anoSelInt, anoAtual, mesAtualIdx, receitas, despesas]);

  // Rótulos adaptativos por perfil (Comercial vs Individual) e por escala de tempo
  const sufixoEscala = isTodos ? ' Anual' : '';
  const labelReceita = isComercial ? `Faturamento${sufixoEscala}` : `Receita${sufixoEscala}`;
  const labelDespesas = isComercial ? `Custos & Despesas${sufixoEscala}` : `Despesas${sufixoEscala}`;
  const labelEconomia = isComercial ? `Lucro Líquido${sufixoEscala}` : `Economia${sufixoEscala}`;
  const labelCaixinha = isComercial ? 'Reserva de Lucros' : 'Caixinha Total';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
      {/* Dropdown Receita / Faturamento */}
      <div
        style={{
          width: '100%',
          borderRadius: '16px',
          backgroundColor: 'var(--surface-bg, #323232)',
          border: '1px solid rgba(42, 157, 143, 0.25)',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          transition: 'all 0.2s ease',
        }}
      >
        <button
          type="button"
          onClick={() => setIsReceitasOpen(!isReceitasOpen)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '16px',
            border: 'none',
            backgroundColor: 'transparent',
            color: '#2a9d8f',
            fontWeight: 'bold',
            fontSize: '14.5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: 'var(--text-secondary, #cccccc)', fontWeight: 'normal' }}>{labelReceita}:</span>
            <span style={{ color: '#50fa7b' }}>R$ {formatarMoeda(totalReceitas)}</span>
          </span>
          <span style={{ fontSize: '11px', marginLeft: '8px', color: '#50fa7b', transition: 'transform 0.2s' }}>
            {isReceitasOpen ? '▲' : '▼'}
          </span>
        </button>

        {isReceitasOpen && (
          <div
            style={{
              padding: '8px 12px 12px 12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.07)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              maxHeight: '260px',
              overflowY: 'auto',
            }}
          >
            {categoriasReceitaCalculadas.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-secondary, #cccccc)', textAlign: 'center', padding: '6px 0' }}>
                Nenhuma receita cadastrada neste período.
              </div>
            ) : (
              categoriasReceitaCalculadas.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setModalCat({ categoryName: item.nome, tipo: 'receita', color: item.cor })}
                  title="Clique para ver os lançamentos desta categoria"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '8px',
                    padding: '7px 9px',
                    gap: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12.5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary, #ffffff)', fontWeight: '500', minWidth: 0 }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: item.cor, flexShrink: 0 }} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                        {item.nome}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ color: '#50fa7b', fontWeight: 'bold', fontSize: '13px' }}>
                        R$ {formatarMoeda(item.valor)}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirModalAdicionar({
                            tipo: 'receita',
                            classificacao: item.nome,
                          });
                        }}
                        title={`Adicionar novo lançamento em ${item.nome}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '19px',
                          height: '19px',
                          borderRadius: '5px',
                          border: 'none',
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          color: '#50fa7b',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          lineHeight: 1,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#2a9d8f';
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                          e.currentTarget.style.color = '#50fa7b';
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Barra de Progresso Visual */}
                  <div style={{ width: '100%', height: '3px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, Math.max(0, item.porcentagem))}%`,
                        height: '100%',
                        backgroundColor: item.cor,
                        borderRadius: '2px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Dropdown Despesas / Custos */}
      <div
        style={{
          width: '100%',
          borderRadius: '16px',
          backgroundColor: 'var(--surface-bg, #323232)',
          border: '1px solid rgba(255, 225, 146, 0.2)',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          transition: 'all 0.2s ease',
        }}
      >
        <button
          type="button"
          onClick={() => setIsDespesasOpen(!isDespesasOpen)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '16px',
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--accent-color, #ffe192)',
            fontWeight: 'bold',
            fontSize: '14.5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: 'var(--text-secondary, #cccccc)', fontWeight: 'normal' }}>{labelDespesas}:</span>
            <span style={{ color: 'var(--accent-color, #ffe192)' }}>R$ {formatarMoeda(totalDespesas)}</span>
          </span>
          <span style={{ fontSize: '11px', marginLeft: '8px', color: 'var(--accent-color, #ffe192)', transition: 'transform 0.2s' }}>
            {isDespesasOpen ? '▲' : '▼'}
          </span>
        </button>

        {isDespesasOpen && (
          <div
            style={{
              padding: '8px 12px 12px 12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.07)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              maxHeight: '260px',
              overflowY: 'auto',
            }}
          >
            {categoriasDespesaCalculadas.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-secondary, #cccccc)', textAlign: 'center', padding: '6px 0' }}>
                Nenhuma despesa cadastrada neste período.
              </div>
            ) : (
              categoriasDespesaCalculadas.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setModalCat({ categoryName: item.nome, tipo: 'despesas', color: item.cor })}
                  title="Clique para ver os lançamentos desta categoria"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '8px',
                    padding: '7px 9px',
                    gap: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12.5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary, #ffffff)', fontWeight: '500', minWidth: 0 }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: item.cor, flexShrink: 0 }} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                        {item.nome}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ color: 'var(--accent-color, #ffe192)', fontWeight: 'bold', fontSize: '13px' }}>
                        R$ {formatarMoeda(item.valor)}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirModalAdicionar({
                            tipo: 'despesa',
                            classificacao: item.nome,
                          });
                        }}
                        title={`Adicionar novo lançamento em ${item.nome}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '19px',
                          height: '19px',
                          borderRadius: '5px',
                          border: 'none',
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          color: 'var(--accent-color, #ffe192)',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          lineHeight: 1,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--accent-color, #ffe192)';
                          e.currentTarget.style.color = '#000000';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                          e.currentTarget.style.color = 'var(--accent-color, #ffe192)';
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Barra de Progresso Visual */}
                  <div style={{ width: '100%', height: '3px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, Math.max(0, item.porcentagem))}%`,
                        height: '100%',
                        backgroundColor: item.cor,
                        borderRadius: '2px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Card Economia / Lucro Líquido (Exibido apenas se a Caixinha NÃO estiver ativa) */}
      {!isCaixinhaAtiva && (
        <div
          style={{
            backgroundColor: 'var(--card-bg, #666666)',
            padding: '12px 20px',
            borderRadius: '24px',
            color: 'var(--accent-color, #ffe192)',
            fontWeight: 'bold',
            fontSize: '15px',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
          }}
        >
          <div>{labelEconomia}: R$ {formatarMoeda(economia)}</div>
          {totalReservas > 0 && (
            <div style={{ fontSize: '11px', color: '#50fa7b', marginTop: '3px', fontWeight: 'normal' }}>
              (inclui R$ {formatarMoeda(totalReservas)} em reservas)
            </div>
          )}
        </div>
      )}

      {/* Card Caixinha / Reserva de Lucros (Exibido quando Ativada) */}
      {isCaixinhaAtiva && (
        <div
          style={{
            backgroundColor: 'var(--surface-bg, #3e3e3e)',
            padding: '16px 18px',
            borderRadius: '24px',
            border: '1px solid var(--accent-color, #ffe192)',
            color: 'var(--accent-color, #ffe192)',
            fontWeight: 'bold',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ fontSize: '13px', color: 'var(--text-primary, #ffffff)', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <span>📦</span> {labelCaixinha}:
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: saldoCaixinhaAcumulado >= 0 ? 'var(--accent-color, #ffe192)' : '#ff8585' }}>
            R$ {formatarMoeda(saldoCaixinhaAcumulado)}
          </div>

          <div
            style={{
              marginTop: '4px',
              paddingTop: '8px',
              borderTop: '1px solid var(--border-color, #545454)',
              fontSize: '14px',
              fontWeight: 'bold',
              color: isFuturo
                ? (isTodos ? (economiaProjetadaAno >= 0 ? '#2a9d8f' : '#ff8585') : (totalReservas > 0 ? '#50fa7b' : '#aaaaaa'))
                : (economia > 0 ? '#2a9d8f' : economia < 0 ? '#ff8585' : '#aaaaaa'),
              lineHeight: '1.3',
            }}
          >
            {isFuturo ? (
              isTodos ? (
                economiaProjetadaAno > 0
                  ? (isComercial ? `▲ +R$ ${formatarMoeda(economiaProjetadaAno)} projetado para a reserva ${sufixoTempo}` : `▲ +R$ ${formatarMoeda(economiaProjetadaAno)} projetado para a caixinha ${sufixoTempo}`)
                  : economiaProjetadaAno < 0
                  ? (isComercial ? `▼ -R$ ${formatarMoeda(Math.abs(economiaProjetadaAno))} estimado a ser retirado ${sufixoTempo}` : `▼ -R$ ${formatarMoeda(Math.abs(economiaProjetadaAno))} estimado a ser retirado ${sufixoTempo}`)
                  : `• Sem variação projetada ${sufixoTempo}`
              ) : (
                totalReservas > 0
                  ? (isComercial ? `▲ +R$ ${formatarMoeda(totalReservas)} a ser guardado em reserva ${sufixoTempo}` : `▲ +R$ ${formatarMoeda(totalReservas)} a ser guardado em reserva ${sufixoTempo}`)
                  : `• Sem reservas definidas ${sufixoTempo}`
              )
            ) : (
              economia > 0
                ? (isComercial ? `▲ +R$ ${formatarMoeda(economia)} destinados à reserva ${sufixoTempo}` : `▲ +R$ ${formatarMoeda(economia)} guardados ${sufixoTempo}`)
                : economia < 0
                ? (isComercial ? `▼ -R$ ${formatarMoeda(Math.abs(economia))} retirados da reserva ${sufixoTempo}` : `▼ -R$ ${formatarMoeda(Math.abs(economia))} retirados ${sufixoTempo}`)
                : `• Sem variação no período`
            )}
          </div>
        </div>
      )}

      {/* Modal de Detalhes da Categoria Selecionada */}
      {modalCat && (
        <CategoryDetailModal
          isOpen={Boolean(modalCat)}
          onClose={() => setModalCat(null)}
          categoryName={modalCat.categoryName}
          tipo={modalCat.tipo}
          color={modalCat.color}
        />
      )}
    </div>
  );
}
