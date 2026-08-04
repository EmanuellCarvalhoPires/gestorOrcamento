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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
      {/* Card Receita */}
      <div
        style={{
          backgroundColor: '#666666',
          padding: '12px 20px',
          borderRadius: '24px',
          color: '#ffe192',
          fontWeight: 'bold',
          fontSize: '15px',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
        }}
      >
        Receita: R$ {formatarMoeda(totalReceitas)}
      </div>

      {/* Card Despesas */}
      <div
        style={{
          backgroundColor: '#666666',
          padding: '12px 20px',
          borderRadius: '24px',
          color: '#ffe192',
          fontWeight: 'bold',
          fontSize: '15px',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
        }}
      >
        Despesas: R$ {formatarMoeda(totalDespesas)}
      </div>

      {/* Card Economia (Exibido apenas se a Caixinha NÃO estiver ativa) */}
      {!isCaixinhaAtiva && (
        <div
          style={{
            backgroundColor: '#666666',
            padding: '12px 20px',
            borderRadius: '24px',
            color: '#ffe192',
            fontWeight: 'bold',
            fontSize: '15px',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
          }}
        >
          Economia: R$ {formatarMoeda(economia)}
        </div>
      )}

      {/* Card Caixinha (Exibido quando Ativada) */}
      {isCaixinhaAtiva && (
        <div
          style={{
            backgroundColor: '#3e3e3e',
            padding: '16px 18px',
            borderRadius: '24px',
            border: '1px solid #ffe192',
            color: '#ffe192',
            fontWeight: 'bold',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <span>📦</span> Caixinha Total:
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: saldoCaixinhaAcumulado >= 0 ? '#ffe192' : '#ff8585' }}>
            R$ {formatarMoeda(saldoCaixinhaAcumulado)}
          </div>

          <div
            style={{
              marginTop: '4px',
              paddingTop: '8px',
              borderTop: '1px solid #545454',
              fontSize: '14px',
              fontWeight: 'bold',
              color: economia > 0 ? '#2a9d8f' : economia < 0 ? '#ff8585' : '#aaaaaa',
              lineHeight: '1.3',
            }}
          >
            {isFuturo ? (
              economia > 0
                ? `▲ +R$ ${formatarMoeda(economia)} a ser guardado ${sufixoTempo}`
                : economia < 0
                ? `▼ -R$ ${formatarMoeda(Math.abs(economia))} a ser retirado ${sufixoTempo}`
                : `• Sem variação a ser guardada ${sufixoTempo}`
            ) : (
              economia > 0
                ? `▲ +R$ ${formatarMoeda(economia)} guardados ${sufixoTempo}`
                : economia < 0
                ? `▼ -R$ ${formatarMoeda(Math.abs(economia))} retirados ${sufixoTempo}`
                : `• Sem variação no período`
            )}
          </div>
        </div>
      )}
    </div>
  );
}
