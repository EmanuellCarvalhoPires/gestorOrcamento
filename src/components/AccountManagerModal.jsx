import React, { useState } from 'react';

export default function AccountManagerModal({ isOpen, onClose, onCreateAccount }) {
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('individual'); // 'individual' ou 'comercial'
  const [descricao, setDescricao] = useState('');
  const [cor, setCor] = useState('#ffe192');

  const CORES_DISPONIVEIS = ['#ffe192', '#2a9d8f', '#fb8500', '#e76f51', '#457b9d', '#9d4edd', '#f4a261'];

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome.trim()) return;

    await onCreateAccount({
      nome: nome.trim(),
      tipo,
      descricao: descricao.trim(),
      cor,
    });

    // Reset Form
    setNome('');
    setTipo('individual');
    setDescricao('');
    setCor('#ffe192');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
    >
      <div
        style={{
          backgroundColor: '#545454',
          borderRadius: '24px',
          padding: '32px',
          width: '90%',
          maxWidth: '460px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#ffffff', fontSize: '20px', fontWeight: 'bold' }}>
            ➕ Criar Nova Conta
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#aaaaaa',
              fontSize: '18px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Nome da Conta */}
          <div>
            <label style={{ display: 'block', color: '#dddddd', fontSize: '13px', marginBottom: '6px' }}>
              Nome da Conta *
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Minha Carteira, Empresa Mei, Farmácia..."
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '14px',
                border: '1px solid #737373',
                backgroundColor: '#3e3e3e',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              required
            />
          </div>

          {/* Tipo da Conta (Individual vs Comercial) */}
          <div>
            <label style={{ display: 'block', color: '#ffe192', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>
              Tipo / Objetivo da Conta
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setTipo('individual')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '12px',
                  border: tipo === 'individual' ? '2px solid #ffe192' : '1px solid #737373',
                  backgroundColor: tipo === 'individual' ? '#666666' : '#3e3e3e',
                  color: tipo === 'individual' ? '#ffe192' : '#aaaaaa',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                👤 Uso Individual
              </button>

              <button
                type="button"
                onClick={() => setTipo('comercial')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '12px',
                  border: tipo === 'comercial' ? '2px solid #ffe192' : '1px solid #737373',
                  backgroundColor: tipo === 'comercial' ? '#666666' : '#3e3e3e',
                  color: tipo === 'comercial' ? '#ffe192' : '#aaaaaa',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                🏢 Uso Comercial
              </button>
            </div>
          </div>

          {/* Descrição / Observação */}
          <div>
            <label style={{ display: 'block', color: '#dddddd', fontSize: '13px', marginBottom: '6px' }}>
              Descrição / Observações (Opcional)
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Conta destinada às compras do comércio ou despesas pessoais do mês..."
              rows={2}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid #737373',
                backgroundColor: '#3e3e3e',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Cor da Conta */}
          <div>
            <label style={{ display: 'block', color: '#dddddd', fontSize: '13px', marginBottom: '6px' }}>
              Cor da Etiqueta
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {CORES_DISPONIVEIS.map((c) => (
                <div
                  key={c}
                  onClick={() => setCor(c)}
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: c,
                    cursor: 'pointer',
                    border: cor === c ? '2px solid #ffffff' : 'none',
                    boxShadow: cor === c ? '0 0 6px rgba(255,255,255,0.8)' : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Botões do Rodapé */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '24px',
                border: 'none',
                backgroundColor: '#737373',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '24px',
                border: 'none',
                backgroundColor: '#ffe192',
                color: '#333333',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              Criar Conta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
