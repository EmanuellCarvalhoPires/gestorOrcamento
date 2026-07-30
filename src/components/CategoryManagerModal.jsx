import React, { useState } from 'react';
import { useBudget } from '../contexts/BudgetContext';

export default function CategoryManagerModal() {
  const { isCategoryModalOpen, setIsCategoryModalOpen, categorias, adicionarCategoria, deletarCategoria } = useBudget();

  const [nome, setNome] = useState('');
  const [cor, setCor] = useState('#fb8500');

  if (!isCategoryModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome.trim()) return;

    await adicionarCategoria({ nome, cor });
    setNome('');
    setCor('#fb8500');
  };

  const handleDeletarComConfirmacao = (cat) => {
    if (window.confirm(`Deseja realmente excluir a categoria "${cat.nome}"?`)) {
      deletarCategoria(cat.id);
    }
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
        zIndex: 2500,
      }}
    >
      <div
        style={{
          backgroundColor: '#545454',
          borderRadius: '16px',
          padding: '24px',
          width: '420px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          color: '#ffe192',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}
      >
        {/* Cabeçalho */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>
            🎨 Categorias Pessoais
          </h2>
          <button
            onClick={() => setIsCategoryModalOpen(false)}
            style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '22px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Formulário de Adicionar Nova Categoria */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px', color: '#ffffff' }}>
              Nova Categoria
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Vestuário, Viagens"
              required
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #737373',
                backgroundColor: '#666666',
                color: '#ffffff',
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ width: '42px' }}>
            <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px', color: '#ffffff' }}>
              Cor
            </label>
            <input
              type="color"
              value={cor}
              onChange={(e) => setCor(e.target.value)}
              style={{
                width: '42px',
                height: '34px',
                padding: 0,
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: 'transparent',
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: '9px 14px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#ffe192',
              color: '#333333',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            + Criar
          </button>
        </form>

        {/* Lista de Categorias Atuais com Trava de Segurança */}
        <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
          {categorias.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#cccccc', textAlign: 'center', padding: '12px' }}>
              Nenhuma categoria cadastrada.
            </div>
          ) : (
            categorias.map((cat) => (
              <div
                key={cat.id || cat.nome}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#666666',
                  padding: '8px 12px',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      backgroundColor: cat.cor || '#ffe192',
                      boxShadow: '0 0 4px rgba(0,0,0,0.3)',
                    }}
                  />
                  <span style={{ color: '#ffffff', fontSize: '13px', fontWeight: '500' }}>
                    {cat.nome}
                  </span>
                </div>

                {cat.id && (
                  <button
                    onClick={() => handleDeletarComConfirmacao(cat)}
                    title="Excluir Categoria"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ff6b6b',
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: '4px',
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
