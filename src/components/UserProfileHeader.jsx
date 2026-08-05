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
  const [mensagemExport, setMensagemExport] = useState('');

  if (!usuarioLogado) return null;

  const listContas = Array.isArray(contas) ? contas : [];

  const handleExportCSV = async () => {
    setIsDropdownOpen(false);
    setMensagemExport('Exportando planilha Excel...');
    const res = await exportarCSV();
    if (res?.success) {
      setMensagemExport('✅ Excel exportado com sucesso!');
    } else {
      setMensagemExport('');
    }
    setTimeout(() => setMensagemExport(''), 4000);
  };

  const handleExportPDF = async () => {
    setIsDropdownOpen(false);
    setMensagemExport('Gerando relatório PDF...');
    const res = await exportarPDF();
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
          backgroundColor: '#3e3e3e',
          border: '1px solid #737373',
          padding: '4px 14px',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: '#ffffff',
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
        <span style={{ fontWeight: 'bold', color: '#ffe192' }}>
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
          backgroundColor: '#3e3e3e',
          border: '1px solid #737373',
          padding: '6px 14px',
          borderRadius: '20px',
          color: '#ffffff',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: '#ffe192',
            color: '#333333',
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
        <span style={{ fontSize: '10px', color: '#aaaaaa' }}>▼</span>
      </button>

      {/* Dropdown Menu de Perfil e Múltiplas Contas */}
      {isDropdownOpen && (
        <div
          style={{
            position: 'absolute',
            top: '48px',
            right: 0,
            backgroundColor: '#545454',
            borderRadius: '16px',
            padding: '10px 0',
            width: '260px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* SEÇÃO: Minhas Contas */}
          <div style={{ padding: '8px 16px 4px 16px', fontSize: '11px', color: '#ffe192', fontWeight: 'bold', textTransform: 'uppercase' }}>
            Minhas Contas ({listContas.length})
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
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    backgroundColor: ehAtiva ? '#666666' : 'transparent',
                    border: 'none',
                    color: ehAtiva ? '#ffe192' : '#ffffff',
                    textAlign: 'left',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: c.cor || '#ffe192' }} />
                    <span style={{ fontWeight: ehAtiva ? 'bold' : 'normal' }}>{c.nome}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '10px', color: '#aaaaaa' }}>
                      {ehCom ? '🏢 Comercial' : '👤 Individual'}
                    </span>
                    {ehAtiva && <span style={{ color: '#2a9d8f', fontWeight: 'bold' }}>✓</span>}
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{ height: '1px', backgroundColor: '#666666', margin: '4px 0' }} />

          {/* Configurações */}
          <button
            onClick={() => {
              setIsDropdownOpen(false);
              setIsSettingsModalOpen(true);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#ffffff',
              textAlign: 'left',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#666666')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
          >
            <span>⚙️</span> Configurações
          </button>

          <div style={{ height: '1px', backgroundColor: '#666666', margin: '4px 0' }} />

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
              color: '#ff8585',
              textAlign: 'left',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#666666')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
          >
            <span>🚪</span> Sair da Conta
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
