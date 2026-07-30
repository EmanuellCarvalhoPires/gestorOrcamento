import React, { useState, useRef, useEffect } from 'react';
import { useBudget } from '../contexts/BudgetContext';
import iconUser from '../../images/Icone de User.png';

export default function UserProfileHeader() {
  const { usuarioLogado, logout, exportarCSV, exportarPDF } = useBudget();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fecha o dropdown se o usuário clicar fora dele
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!usuarioLogado) return null;

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Botão com Avatar e Nome do Usuário */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: '#545454',
          border: '1px solid #737373',
          padding: '6px 14px',
          borderRadius: '24px',
          cursor: 'pointer',
          color: '#ffe192',
          fontWeight: '600',
          transition: 'background-color 0.2s',
        }}
      >
        <img
          src={iconUser}
          alt="Avatar do Usuário"
          style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
        />
        <span style={{ fontSize: '14px' }}>{usuarioLogado.nome}</span>
        <span style={{ fontSize: '10px', color: '#aaaaaa' }}>▼</span>
      </button>

      {/* Menu Dropdown Suspenso do Perfil */}
      {menuOpen && (
        <div
          style={{
            position: 'absolute',
            top: '46px',
            right: 0,
            backgroundColor: '#545454',
            border: '1px solid #737373',
            borderRadius: '12px',
            width: '230px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            zIndex: 1000,
            padding: '8px 0',
            overflow: 'hidden',
          }}
        >
          {/* Cabeçalho do Perfil */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #666666' }}>
            <div style={{ fontWeight: 'bold', color: '#ffe192', fontSize: '14px' }}>
              {usuarioLogado.nome}
            </div>
            <div style={{ color: '#aaaaaa', fontSize: '12px', wordBreak: 'break-all' }}>
              {usuarioLogado.email}
            </div>
          </div>

          {/* Opções de Perfil e Configurações */}
          <button
            onClick={() => {
              alert(`Perfil de ${usuarioLogado.nome}\nE-mail: ${usuarioLogado.email}`);
              setMenuOpen(false);
            }}
            style={{
              width: '100%',
              padding: '10px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#ffffff',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            👤 Ver Meu Perfil
          </button>

          <button
            onClick={() => {
              alert('Configurações do aplicativo em desenvolvimento.');
              setMenuOpen(false);
            }}
            style={{
              width: '100%',
              padding: '10px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#ffffff',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            ⚙️ Configurações
          </button>

          <div style={{ height: '1px', backgroundColor: '#666666', margin: '4px 0' }} />

          {/* Opções de Exportação de Relatório (Posicionadas de forma discreta) */}
          <button
            onClick={async () => {
              setMenuOpen(false);
              await exportarCSV();
            }}
            style={{
              width: '100%',
              padding: '10px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#ffffff',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            🟢 Exportar Excel (.csv)
          </button>

          <button
            onClick={async () => {
              setMenuOpen(false);
              await exportarPDF();
            }}
            style={{
              width: '100%',
              padding: '10px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#ffffff',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            🔴 Exportar PDF (.pdf)
          </button>

          <div style={{ height: '1px', backgroundColor: '#666666', margin: '4px 0' }} />

          {/* Botão de Logout */}
          <button
            onClick={() => {
              setMenuOpen(false);
              logout();
            }}
            style={{
              width: '100%',
              padding: '10px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#ff6b6b',
              fontWeight: 'bold',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            🚪 Sair da Conta
          </button>
        </div>
      )}
    </div>
  );
}
