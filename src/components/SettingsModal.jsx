import React, { useState, useEffect } from 'react';
import { useBudget } from '../contexts/BudgetContext';

export default function SettingsModal({ isOpen, onClose, onExportCSV, onExportPDF, onOpenCreateAccount }) {
  const [activeTab, setActiveTab] = useState('geral');
  const {
    contas = [],
    contaAtiva,
    selecionarConta,
    isCaixinhaAtiva,
    toggleCaixinha,
    saldoInicialCaixinha,
    atualizarSaldoInicialCaixinha,
    saldoCaixinhaAcumulado,
  } = useBudget();

  const [valorInicialStr, setValorInicialStr] = useState(
    saldoInicialCaixinha ? String(saldoInicialCaixinha) : ''
  );

  useEffect(() => {
    setValorInicialStr(saldoInicialCaixinha ? String(saldoInicialCaixinha) : '');
  }, [saldoInicialCaixinha]);

  const handleValorInicialChange = (valStr) => {
    setValorInicialStr(valStr);
    if (valStr === '' || valStr === '-') {
      atualizarSaldoInicialCaixinha(0);
    } else {
      const num = parseFloat(valStr);
      atualizarSaldoInicialCaixinha(isNaN(num) ? 0 : num);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          backgroundColor: '#545454',
          borderRadius: '24px',
          width: '90%',
          maxWidth: '720px',
          height: '520px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
          border: '1px solid #666666',
          overflow: 'hidden',
        }}
      >
        {/* Cabeçalho do Modal */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #666666',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#444444',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>⚙️</span>
            <h3 style={{ margin: 0, color: '#ffffff', fontSize: '20px', fontWeight: 'bold' }}>
              Configurações
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#aaaaaa',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '8px',
              transition: 'color 0.2s, background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.target.style.color = '#ffffff';
              e.target.style.backgroundColor = '#555555';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = '#aaaaaa';
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            ✕
          </button>
        </div>

        {/* Corpo do Modal: Sidebar + Conteúdo */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Menu Lateral / Lista de Opções */}
          <div
            style={{
              width: '220px',
              backgroundColor: '#3e3e3e',
              borderRight: '1px solid #666666',
              padding: '16px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 'bold',
                color: '#ffe192',
                textTransform: 'uppercase',
                padding: '4px 12px',
                marginBottom: '4px',
                letterSpacing: '0.5px',
              }}
            >
              Opções
            </div>

            {/* Opção Geral */}
            <button
              type="button"
              onClick={() => setActiveTab('geral')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: activeTab === 'geral' ? '#545454' : 'transparent',
                color: activeTab === 'geral' ? '#ffe192' : '#ffffff',
                fontWeight: activeTab === 'geral' ? 'bold' : 'normal',
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                boxShadow: activeTab === 'geral' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>⚙️</span>
                <span>Geral</span>
              </div>
              <span
                style={{
                  fontSize: '10px',
                  backgroundColor: '#666666',
                  color: '#dddddd',
                  padding: '2px 6px',
                  borderRadius: '10px',
                }}
              >
                Em breve
              </span>
            </button>

            {/* Opção Contas */}
            <button
              type="button"
              onClick={() => setActiveTab('contas')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: activeTab === 'contas' ? '#545454' : 'transparent',
                color: activeTab === 'contas' ? '#ffe192' : '#ffffff',
                fontWeight: activeTab === 'contas' ? 'bold' : 'normal',
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                boxShadow: activeTab === 'contas' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>💳</span>
                <span>Contas</span>
              </div>
              <span
                style={{
                  fontSize: '10px',
                  backgroundColor: '#666666',
                  color: '#ffffff',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                }}
              >
                {contas.length}
              </span>
            </button>

            {/* Opção Caixinha */}
            <button
              type="button"
              onClick={() => setActiveTab('caixinha')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: activeTab === 'caixinha' ? '#545454' : 'transparent',
                color: activeTab === 'caixinha' ? '#ffe192' : '#ffffff',
                fontWeight: activeTab === 'caixinha' ? 'bold' : 'normal',
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                boxShadow: activeTab === 'caixinha' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>📦</span>
                <span>Caixinha</span>
              </div>
              <span
                style={{
                  fontSize: '10px',
                  backgroundColor: isCaixinhaAtiva ? '#2a9d8f' : '#666666',
                  color: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                }}
              >
                {isCaixinhaAtiva ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Opção Exportar */}
            <button
              type="button"
              onClick={() => setActiveTab('exportar')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: activeTab === 'exportar' ? '#545454' : 'transparent',
                color: activeTab === 'exportar' ? '#ffe192' : '#ffffff',
                fontWeight: activeTab === 'exportar' ? 'bold' : 'normal',
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                boxShadow: activeTab === 'exportar' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>📤</span>
                <span>Exportar</span>
              </div>
              {activeTab === 'exportar' && (
                <span style={{ fontSize: '12px', color: '#2a9d8f' }}>●</span>
              )}
            </button>
          </div>

          {/* Painel Principal de Conteúdo */}
          <div
            style={{
              flex: 1,
              padding: '24px',
              backgroundColor: '#4a4a4a',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Aba Geral */}
            {activeTab === 'geral' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ margin: 0, color: '#ffffff', fontSize: '18px', fontWeight: 'bold' }}>
                  ⚙️ Configurações Gerais
                </h4>
                <div
                  style={{
                    backgroundColor: '#3e3e3e',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid #666666',
                    textAlign: 'center',
                    color: '#cccccc',
                  }}
                >
                  <p style={{ margin: 0, fontSize: '14px' }}>
                    Novas opções de personalização e preferências gerais serão disponibilizadas nesta seção.
                  </p>
                </div>
              </div>
            )}

            {/* Aba Contas */}
            {activeTab === 'contas' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h4 style={{ margin: 0, color: '#ffffff', fontSize: '18px', fontWeight: 'bold' }}>
                      💳 Minhas Contas
                    </h4>
                    <p style={{ margin: '4px 0 0 0', color: '#cccccc', fontSize: '13px' }}>
                      Alterne entre suas contas financeiras ou crie novas contas para seu orçamento.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenCreateAccount) onOpenCreateAccount();
                    }}
                    style={{
                      backgroundColor: '#ffe192',
                      color: '#333333',
                      border: 'none',
                      padding: '10px 18px',
                      borderRadius: '14px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span>➕</span> Criar Nova Conta
                  </button>
                </div>

                {/* Lista de Contas Cadastradas */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                  {contas.map((c) => {
                    const ehAtiva = c.id === contaAtiva?.id;
                    const ehComercial = c.tipo === 'comercial';
                    return (
                      <div
                        key={c.id}
                        style={{
                          backgroundColor: '#3e3e3e',
                          borderRadius: '16px',
                          padding: '16px 20px',
                          border: ehAtiva ? '1px solid #ffe192' : '1px solid #666666',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '16px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span
                            style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              backgroundColor: c.cor || '#ffe192',
                              flexShrink: 0,
                            }}
                          />
                          <div>
                            <strong style={{ color: '#ffffff', fontSize: '15px', display: 'block' }}>
                              {c.nome}
                            </strong>
                            <span style={{ color: '#aaaaaa', fontSize: '12px', marginTop: '2px', display: 'block' }}>
                              {ehComercial ? '🏢 Conta Comercial' : '👤 Conta Individual'} {c.descricao ? `• ${c.descricao}` : ''}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (!ehAtiva) selecionarConta(c.id);
                          }}
                          style={{
                            backgroundColor: ehAtiva ? '#2b4c3f' : '#545454',
                            color: ehAtiva ? '#2a9d8f' : '#ffffff',
                            border: ehAtiva ? '1px solid #2a9d8f' : '1px solid #737373',
                            padding: '8px 16px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: ehAtiva ? 'default' : 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {ehAtiva ? '✓ Conta Ativa' : 'Alternar para esta conta'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Aba Caixinha */}
            {activeTab === 'caixinha' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h4 style={{ margin: 0, color: '#ffffff', fontSize: '18px', fontWeight: 'bold' }}>
                    📦 Caixinha de Economia
                  </h4>
                  <p style={{ margin: '6px 0 0 0', color: '#cccccc', fontSize: '13px', lineHeight: '1.4' }}>
                    A Caixinha acumula a métrica de Economia (Receitas - Despesas) de todos os meses e anos da sua conta. O valor economizado em cada mês é automaticamente somado ou subtraído no saldo guardado total.
                  </p>
                </div>

                {/* Card de Ativação / Status */}
                <div
                  style={{
                    backgroundColor: '#3e3e3e',
                    borderRadius: '16px',
                    padding: '20px',
                    border: '1px solid #666666',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>Status:</span>
                      <span style={{ color: isCaixinhaAtiva ? '#2a9d8f' : '#aaaaaa' }}>
                        {isCaixinhaAtiva ? '🟢 Ativada' : '⚪ Desativada'}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#bbbbbb', marginTop: '4px' }}>
                      {isCaixinhaAtiva
                        ? 'A Caixinha está ativa e acumulando os saldos de todos os meses.'
                        : 'Clique no botão ao lado para ativar a funcionalidade da Caixinha.'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleCaixinha()}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '20px',
                      border: 'none',
                      backgroundColor: isCaixinhaAtiva ? '#e76f51' : '#ffe192',
                      color: isCaixinhaAtiva ? '#ffffff' : '#333333',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      transition: 'transform 0.15s',
                    }}
                  >
                    {isCaixinhaAtiva ? 'Desativar caixinha' : 'Ativar caixinha'}
                  </button>
                </div>

                {/* Configurações Adicionais (se ativa) */}
                {isCaixinhaAtiva && (
                  <div
                    style={{
                      backgroundColor: '#3e3e3e',
                      borderRadius: '16px',
                      padding: '20px',
                      border: '1px solid #666666',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                    }}
                  >
                    <h5 style={{ margin: 0, color: '#ffe192', fontSize: '14px', fontWeight: 'bold' }}>
                      ⚙️ Saldo Inicial Guardado (Opcional)
                    </h5>

                    <div>
                      <label style={{ display: 'block', color: '#dddddd', fontSize: '12px', marginBottom: '6px' }}>
                        Caso já possuísse algum valor guardado antes de usar o sistema:
                      </label>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{ color: '#ffe192', fontWeight: 'bold' }}>R$</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          value={valorInicialStr}
                          onChange={(e) => handleValorInicialChange(e.target.value)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '10px',
                            border: '1px solid #737373',
                            backgroundColor: '#545454',
                            color: '#ffffff',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            outline: 'none',
                            width: '140px',
                          }}
                        />
                      </div>
                    </div>

                    {/* Resumo do Cálculo */}
                    <div
                      style={{
                        backgroundColor: '#2e2e2e',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        fontSize: '13px',
                        color: '#dddddd',
                        borderLeft: '4px solid #ffe192',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Economia Acumulada (Todos os Meses/Anos):</span>
                        <span style={{ fontWeight: 'bold', color: '#ffffff' }}>
                          R$ {(saldoCaixinhaAcumulado - Number(saldoInicialCaixinha || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Saldo Inicial Configurado:</span>
                        <span style={{ fontWeight: 'bold', color: '#ffffff' }}>
                          R$ {(Number(saldoInicialCaixinha || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #444444', paddingTop: '8px', marginTop: '4px' }}>
                        <span style={{ fontWeight: 'bold', color: '#ffe192' }}>Total Guardado na Caixinha:</span>
                        <span style={{ fontWeight: 'bold', color: '#ffe192', fontSize: '15px' }}>
                          R$ {saldoCaixinhaAcumulado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Aba Exportar */}
            {activeTab === 'exportar' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h4 style={{ margin: 0, color: '#ffffff', fontSize: '18px', fontWeight: 'bold' }}>
                    📤 Exportação de Dados
                  </h4>
                  <p style={{ margin: '6px 0 0 0', color: '#cccccc', fontSize: '13px' }}>
                    Exporte seus lançamentos e relatórios financeiros em formatos padrão de mercado.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Opção 1: Excel / CSV */}
                  <div
                    style={{
                      backgroundColor: '#3e3e3e',
                      borderRadius: '16px',
                      padding: '18px 20px',
                      border: '1px solid #666666',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      transition: 'border-color 0.2s, transform 0.1s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                      <div
                        style={{
                          fontSize: '28px',
                          backgroundColor: '#2b4c3f',
                          padding: '10px',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        📊
                      </div>
                      <div>
                        <strong style={{ color: '#ffffff', fontSize: '15px', display: 'block' }}>
                          Exportar Excel (.csv)
                        </strong>
                        <span style={{ color: '#aaaaaa', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                          Gera uma planilha compatível com Microsoft Excel, Google Sheets e LibreOffice.
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onExportCSV();
                      }}
                      style={{
                        backgroundColor: '#2a9d8f',
                        color: '#ffffff',
                        border: 'none',
                        padding: '10px 18px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        transition: 'background-color 0.2s, transform 0.1s',
                      }}
                      onMouseEnter={(e) => (e.target.style.backgroundColor = '#238377')}
                      onMouseLeave={(e) => (e.target.style.backgroundColor = '#2a9d8f')}
                    >
                      Exportar .csv
                    </button>
                  </div>

                  {/* Opção 2: PDF */}
                  <div
                    style={{
                      backgroundColor: '#3e3e3e',
                      borderRadius: '16px',
                      padding: '18px 20px',
                      border: '1px solid #666666',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      transition: 'border-color 0.2s, transform 0.1s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                      <div
                        style={{
                          fontSize: '28px',
                          backgroundColor: '#4c2b2b',
                          padding: '10px',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        📄
                      </div>
                      <div>
                        <strong style={{ color: '#ffffff', fontSize: '15px', display: 'block' }}>
                          Exportar PDF Executivo
                        </strong>
                        <span style={{ color: '#aaaaaa', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                          Relatório executivo formatado com resumos financeiros para impressão ou envio.
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onExportPDF();
                      }}
                      style={{
                        backgroundColor: '#e76f51',
                        color: '#ffffff',
                        border: 'none',
                        padding: '10px 18px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        transition: 'background-color 0.2s, transform 0.1s',
                      }}
                      onMouseEnter={(e) => (e.target.style.backgroundColor = '#d45d40')}
                      onMouseLeave={(e) => (e.target.style.backgroundColor = '#e76f51')}
                    >
                      Gerar PDF
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
