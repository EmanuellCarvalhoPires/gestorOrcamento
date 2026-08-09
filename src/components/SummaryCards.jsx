import React from 'react';
import { useBudget } from '../contexts/BudgetContext';

const MESES_LISTA = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function SummaryCards() {
  const {
    totalReceitas,
    totalDespesas,
    economia,
    isCaixinhaAtiva,
    saldoCaixinhaAcumulado,
    mesSelecionado,
    anoSelecionado,
    isComercial,
  } = useBudget();

  const formatarMoeda = (valor) => {
    return (Number(valor) || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

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

  // Rótulos adaptativos por perfil (Comercial vs Individual)
  const labelReceita = isComercial ? 'Vendas & Faturamento' : 'Receita';
  const labelDespesas = isComercial ? 'Custos & Despesas' : 'Despesas';
  const labelEconomia = isComercial ? 'Lucro Líquido' : 'Economia';
  const labelCaixinha = isComercial ? 'Reserva de Lucros' : 'Caixinha Total';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
      {/* Card Receita / Faturamento */}
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
        {labelReceita}: R$ {formatarMoeda(totalReceitas)}
      </div>

      {/* Card Despesas / Custos */}
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
        {labelDespesas}: R$ {formatarMoeda(totalDespesas)}
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
          {labelEconomia}: R$ {formatarMoeda(economia)}
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
              color: economia > 0 ? '#2a9d8f' : economia < 0 ? '#ff8585' : '#aaaaaa',
              lineHeight: '1.3',
            }}
          >
            {isFuturo ? (
              economia > 0
                ? (isComercial ? `▲ +R$ ${formatarMoeda(economia)} a ser destinado à reserva ${sufixoTempo}` : `▲ +R$ ${formatarMoeda(economia)} a ser guardado ${sufixoTempo}`)
                : economia < 0
                ? (isComercial ? `▼ -R$ ${formatarMoeda(Math.abs(economia))} a ser retirado da reserva ${sufixoTempo}` : `▼ -R$ ${formatarMoeda(Math.abs(economia))} a ser retirado ${sufixoTempo}`)
                : `• Sem variação ${sufixoTempo}`
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
    </div>
  );
}
