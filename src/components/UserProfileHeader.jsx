import React, { useState } from 'react';
import { useBudget } from '../contexts/BudgetContext';
import AccountManagerModal from './AccountManagerModal';
import SettingsModal from './SettingsModal';

export default function UserProfileHeader() {
  const {
    usuarioLogado,
    contas = [],
    contaAtiva,
    selecionarConta,
    criarNovaConta,
    isAccountModalOpen,
    setIsAccountModalOpen,
    isComercial,
    logout,
    exportarCSV,
    exportarPDF,
  } = useBudget();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState('perfil');
  const [mensagemExport, setMensagemExport] = useState('');

  if (!usuarioLogado) return null;

  const listContas = Array.isArray(contas) ? contas : [];

  const handleExportCSV = async (mesParam, anoParam) => {
    setIsDropdownOpen(false);
    setMensagemExport('Exportando planilha Excel...');
    const res = await exportarCSV(mesParam, anoParam);
    if (res?.success) {
      setMensagemExport('✅ Excel exportado com sucesso!');
    } else {
      setMensagemExport('');
    }
    setTimeout(() => setMensagemExport(''), 4000);
  };

  const handleExportPDF = async (mesParam, anoParam) => {
    setIsDropdownOpen(false);
    setMensagemExport('Gerando relatório PDF...');
    const res = await exportarPDF(mesParam, anoParam);
    if (res?.success) {
      setMensagemExport('✅ PDF exportado com sucesso!');
    } else {
      setMensagemExport('');
    }
    setTimeout(() => setMensagemExport(''), 4000);
  };

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '12px' }}>
      
      {/* Toast Notificação de Exportação */}
      {mensagemExport && (
        <div
          style={{
            backgroundColor: '#2a9d8f',
            color: '#ffffff',
            padding: '6px 14px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: 'bold',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          {mensagemExport}
        </div>
      )}

      {/* Indicador da Conta Ativa */}
      <div
        style={{
          backgroundColor: 'var(--surface-bg, #3e3e3e)',
          border: '1px solid var(--border-color, #737373)',
          padding: '4px 14px',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: 'var(--text-primary, #ffffff)',
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: contaAtiva?.cor || (isComercial ? '#fb8500' : '#2a9d8f'),
          }}
        />
        <span style={{ fontWeight: 'bold', color: 'var(--accent-color, #ffe192)' }}>
          {contaAtiva?.nome || 'Conta Principal'}
        </span>
      </div>

      {/* Botão de Perfil */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: 'var(--surface-bg, #3e3e3e)',
          border: '1px solid var(--border-color, #737373)',
          padding: '6px 14px',
          borderRadius: '20px',
          color: 'var(--text-primary, #ffffff)',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-color, #ffe192)',
            color: 'var(--accent-text, #333333)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '13px',
          }}
        >
          {usuarioLogado.nome ? usuarioLogado.nome.charAt(0).toUpperCase() : 'U'}
        </div>
        <span style={{ fontSize: '14px', fontWeight: '500' }}>{usuarioLogado.nome}</span>
        <span style={{ fontSize: '10px', color: 'var(--text-secondary, #aaaaaa)' }}>▼</span>
      </button>

      {/* Dropdown Menu de Perfil e Múltiplas Contas */}
      {isDropdownOpen && (
        <div
          style={{
            position: 'absolute',
            top: '48px',
            right: 0,
            backgroundColor: 'var(--card-bg, #424242)',
            borderRadius: '16px',
            padding: '8px 0',
            width: '240px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* SEÇÃO: Minhas Contas */}
          <div style={{ padding: '6px 16px 4px 16px', fontSize: '11px', color: 'var(--text-secondary, #9e9e9e)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Minhas Contas
          </div>

          <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
            {listContas.map((c) => {
              const ehAtiva = contaAtiva?.id === c.id;
              const ehCom = c.tipo === 'comercial';
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    selecionarConta(c);
                    setIsDropdownOpen(false);
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = ehAtiva ? 'rgba(255, 225, 146, 0.1)' : 'transparent')}
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    backgroundColor: ehAtiva ? 'rgba(255, 225, 146, 0.1)' : 'transparent',
                    border: 'none',
                    color: ehAtiva ? 'var(--accent-color, #ffe192)' : 'var(--text-primary, #ffffff)',
                    textAlign: 'left',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: c.cor || 'var(--accent-color, #ffe192)', flexShrink: 0 }} />
                    <span style={{ fontWeight: ehAtiva ? 'bold' : '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.nome}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    {ehCom && (
                      <span style={{ fontSize: '10px', color: '#fb8500', fontWeight: 'bold', backgroundColor: 'rgba(251, 133, 0, 0.15)', padding: '2px 6px', borderRadius: '6px' }}>
                        PJ
                      </span>
                    )}
                    {ehAtiva && <span style={{ color: 'var(--accent-color, #ffe192)', fontWeight: 'bold', fontSize: '12px' }}>✓</span>}
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.06)', margin: '6px 0' }} />

          {/* Importar Fatura / Extrato Nubank */}
          <button
            onClick={() => {
              setIsDropdownOpen(false);
              setSettingsInitialTab('importar_nubank');
              setIsSettingsModalOpen(true);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--text-primary, #ffffff)',
              textAlign: 'left',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              fontWeight: '500',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            Importar Nubank (CSV)
          </button>

          {/* Configurações */}
          <button
            onClick={() => {
              setIsDropdownOpen(false);
              setSettingsInitialTab('perfil');
              setIsSettingsModalOpen(true);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--text-primary, #ffffff)',
              textAlign: 'left',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              fontWeight: '500',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            Configurações
          </button>

          <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.06)', margin: '6px 0' }} />

          {/* Sair da Conta */}
          <button
            onClick={() => {
              setIsDropdownOpen(false);
              logout();
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#ff7b7b',
              textAlign: 'left',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 123, 123, 0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            Sair da Conta
          </button>
        </div>
      )}

      {/* Modal de Gerenciamento / Criação de Contas */}
      <AccountManagerModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onCreateAccount={criarNovaConta}
      />

      {/* Modal de Configurações Gerais */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        initialTab={settingsInitialTab}
        onExportCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
        onOpenCreateAccount={() => {
          setIsSettingsModalOpen(false);
          setIsAccountModalOpen(true);
        }}
      />
    </div>
  );
}
