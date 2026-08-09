import React, { useState } from 'react';
import { useBudget } from '../contexts/BudgetContext';

export default function CategoryManagerModal() {
  const {
    isCategoryModalOpen,
    setIsCategoryModalOpen,
    categorias,
    adicionarCategoria,
    deletarCategoria,
    reordenarCategorias,
    etiquetaList,
    adicionarEtiqueta,
    deletarEtiqueta,
    reordenarEtiquetas,
  } = useBudget();

  const [activeTab, setActiveTab] = useState('categorias'); // 'categorias' | 'etiquetas'

  // Estados Form Categoria
  const [nomeCat, setNomeCat] = useState('');
  const [corCat, setCorCat] = useState('#fb8500');

  // Estados Form Etiqueta
  const [nomeEtiq, setNomeEtiq] = useState('');

  // Drag & Drop
  const [draggedIdx, setDraggedIdx] = useState(null);

  if (!isCategoryModalOpen) return null;

  // --- HANDLERS CATEGORIA ---
  const handleAddCategoria = async (e) => {
    e.preventDefault();
    if (!nomeCat.trim()) return;
    await adicionarCategoria({ nome: nomeCat, cor: corCat });
    setNomeCat('');
    setCorCat('#fb8500');
  };

  const handleDeletarCat = (cat) => {
    if (window.confirm(`Deseja realmente excluir a categoria "${cat.nome}"?`)) {
      deletarCategoria(cat.id);
    }
  };

  const moverCategoria = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= categorias.length) return;
    const novoArr = [...categorias];
    const [itemRemovido] = novoArr.splice(fromIdx, 1);
    novoArr.splice(toIdx, 0, itemRemovido);
    reordenarCategorias(novoArr);
  };

  // --- HANDLERS ETIQUETA ---
  const handleAddEtiqueta = async (e) => {
    e.preventDefault();
    if (!nomeEtiq.trim()) return;
    await adicionarEtiqueta(nomeEtiq.trim());
    setNomeEtiq('');
  };

  const handleDeletarEtiq = (etiqNome) => {
    if (window.confirm(`Deseja realmente excluir a etiqueta "${etiqNome}"?`)) {
      deletarEtiqueta(etiqNome);
    }
  };

  const moverEtiqueta = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= etiquetaList.length) return;
    const novoArr = [...etiquetaList];
    const [itemRemovido] = novoArr.splice(fromIdx, 1);
    novoArr.splice(toIdx, 0, itemRemovido);
    reordenarEtiquetas(novoArr);
  };

  // Drag & Drop Handlers
  const handleDragStart = (idx) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (dropIdx) => {
    if (draggedIdx === null || draggedIdx === dropIdx) return;
    if (activeTab === 'categorias') {
      moverCategoria(draggedIdx, dropIdx);
    } else {
      moverEtiqueta(draggedIdx, dropIdx);
    }
    setDraggedIdx(null);
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
          backgroundColor: 'var(--card-bg, #545454)',
          borderRadius: '16px',
          padding: '24px',
          width: '460px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          color: 'var(--text-primary, #ffffff)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}
      >
        {/* Cabeçalho com Fechar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary, #ffffff)' }}>
            ⚙️ Gerenciador & Reordenador
          </h2>
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(false)}
            style={{ background: 'none', border: 'none', color: 'var(--text-primary, #ffffff)', fontSize: '22px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Abas Categorias / Etiquetas */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color, #737373)', paddingBottom: '10px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('categorias')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '10px',
              border: activeTab === 'categorias' ? '2px solid var(--accent-color, #ffe192)' : '1px solid var(--border-color, #737373)',
              backgroundColor: activeTab === 'categorias' ? 'var(--surface-bg, #3e3e3e)' : 'var(--surface-bg, #666666)',
              color: activeTab === 'categorias' ? 'var(--accent-color, #ffe192)' : 'var(--text-primary, #ffffff)',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            🎨 Categorias ({categorias.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('etiquetas')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '10px',
              border: activeTab === 'etiquetas' ? '2px solid var(--accent-color, #ffe192)' : '1px solid var(--border-color, #737373)',
              backgroundColor: activeTab === 'etiquetas' ? 'var(--surface-bg, #3e3e3e)' : 'var(--surface-bg, #666666)',
              color: activeTab === 'etiquetas' ? 'var(--accent-color, #ffe192)' : 'var(--text-primary, #ffffff)',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            🏷️ Etiquetas ({etiquetaList.length})
          </button>
        </div>

        {/* ABA 1: CATEGORIAS */}
        {activeTab === 'categorias' && (
          <>
            {/* Formulário de Adicionar Nova Categoria */}
            <form onSubmit={handleAddCategoria} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px', color: 'var(--text-primary, #ffffff)' }}>
                  Nova Categoria
                </label>
                <input
                  type="text"
                  value={nomeCat}
                  onChange={(e) => setNomeCat(e.target.value)}
                  placeholder="Ex: Vestuário, Viagens"
                  required
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color, #737373)',
                    backgroundColor: 'var(--surface-bg, #666666)',
                    color: 'var(--text-primary, #ffffff)',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ width: '42px' }}>
                <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px', color: 'var(--text-primary, #ffffff)' }}>
                  Cor
                </label>
                <input
                  type="color"
                  value={corCat}
                  onChange={(e) => setCorCat(e.target.value)}
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
                  backgroundColor: 'var(--accent-color, #ffe192)',
                  color: 'var(--accent-text, #333333)',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                + Criar
              </button>
            </form>

            <div style={{ fontSize: '11px', color: 'var(--text-secondary, #dddddd)', fontStyle: 'italic' }}>
              💡 Dica: Use os botões ▲ ▼ ou arraste os itens para reordenar a prioridade de exibição.
            </div>

            {/* Lista Reordenável de Categorias */}
            <div style={{ maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categorias.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--text-secondary, #cccccc)', textAlign: 'center', padding: '12px' }}>
                  Nenhuma categoria cadastrada.
                </div>
              ) : (
                categorias.map((cat, idx) => (
                  <div
                    key={cat.id || cat.nome}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: draggedIdx === idx ? 'var(--surface-hover)' : 'var(--surface-bg, #666666)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color, #737373)',
                      cursor: 'grab',
                      transition: 'background-color 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: 'var(--text-secondary, #aaaaaa)', cursor: 'grab', fontSize: '14px' }} title="Arraste para mover">
                        ⣿
                      </span>
                      <span
                        style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          backgroundColor: cat.cor || 'var(--accent-color, #ffe192)',
                          boxShadow: '0 0 4px rgba(0,0,0,0.3)',
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ color: 'var(--text-primary, #ffffff)', fontSize: '13px', fontWeight: '500' }}>
                        {cat.nome}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {/* Botão Subir */}
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moverCategoria(idx, idx - 1)}
                        title="Subir posição"
                        style={{
                          backgroundColor: 'var(--card-bg, #3e3e3e)',
                          color: idx === 0 ? 'var(--text-secondary, #888888)' : 'var(--accent-color, #ffe192)',
                          border: '1px solid var(--border-color, #737373)',
                          borderRadius: '4px',
                          width: '26px',
                          height: '26px',
                          cursor: idx === 0 ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          opacity: idx === 0 ? 0.4 : 1,
                        }}
                      >
                        ▲
                      </button>

                      {/* Botão Descer */}
                      <button
                        type="button"
                        disabled={idx === categorias.length - 1}
                        onClick={() => moverCategoria(idx, idx + 1)}
                        title="Descer posição"
                        style={{
                          backgroundColor: 'var(--card-bg, #3e3e3e)',
                          color: idx === categorias.length - 1 ? 'var(--text-secondary, #888888)' : 'var(--accent-color, #ffe192)',
                          border: '1px solid var(--border-color, #737373)',
                          borderRadius: '4px',
                          width: '26px',
                          height: '26px',
                          cursor: idx === categorias.length - 1 ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          opacity: idx === categorias.length - 1 ? 0.4 : 1,
                        }}
                      >
                        ▼
                      </button>

                      {/* Botão Excluir */}
                      {cat.id && (
                        <button
                          type="button"
                          onClick={() => handleDeletarCat(cat)}
                          title="Excluir Categoria"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ff6b6b',
                            cursor: 'pointer',
                            fontSize: '14px',
                            padding: '4px 6px',
                            marginLeft: '4px',
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* ABA 2: ETIQUETAS */}
        {activeTab === 'etiquetas' && (
          <>
            {/* Formulário de Adicionar Nova Etiqueta */}
            <form onSubmit={handleAddEtiqueta} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px', color: 'var(--text-primary, #ffffff)' }}>
                  Nova Etiqueta
                </label>
                <input
                  type="text"
                  value={nomeEtiq}
                  onChange={(e) => setNomeEtiq(e.target.value)}
                  placeholder="Ex: Trabalho, Projeto A"
                  required
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color, #737373)',
                    backgroundColor: 'var(--surface-bg, #666666)',
                    color: 'var(--text-primary, #ffffff)',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  padding: '9px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'var(--accent-color, #ffe192)',
                  color: 'var(--accent-text, #333333)',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                + Criar
              </button>
            </form>

            <div style={{ fontSize: '11px', color: 'var(--text-secondary, #dddddd)', fontStyle: 'italic' }}>
              💡 Dica: Use os botões ▲ ▼ ou arraste as etiquetas para definir a ordem dos menus.
            </div>

            {/* Lista Reordenável de Etiquetas */}
            <div style={{ maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {etiquetaList.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--text-secondary, #cccccc)', textAlign: 'center', padding: '12px' }}>
                  Nenhuma etiqueta cadastrada.
                </div>
              ) : (
                etiquetaList.map((etiqNome, idx) => (
                  <div
                    key={etiqNome}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: draggedIdx === idx ? 'var(--surface-hover)' : 'var(--surface-bg, #666666)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color, #737373)',
                      cursor: 'grab',
                      transition: 'background-color 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: 'var(--text-secondary, #aaaaaa)', cursor: 'grab', fontSize: '14px' }} title="Arraste para mover">
                        ⣿
                      </span>
                      <span style={{ color: 'var(--accent-color, #ffe192)', fontSize: '12px' }}>🏷️</span>
                      <span style={{ color: 'var(--text-primary, #ffffff)', fontSize: '13px', fontWeight: '500' }}>
                        {etiqNome}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {/* Botão Subir */}
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moverEtiqueta(idx, idx - 1)}
                        title="Subir posição"
                        style={{
                          backgroundColor: 'var(--card-bg, #3e3e3e)',
                          color: idx === 0 ? 'var(--text-secondary, #888888)' : 'var(--accent-color, #ffe192)',
                          border: '1px solid var(--border-color, #737373)',
                          borderRadius: '4px',
                          width: '26px',
                          height: '26px',
                          cursor: idx === 0 ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          opacity: idx === 0 ? 0.4 : 1,
                        }}
                      >
                        ▲
                      </button>

                      {/* Botão Descer */}
                      <button
                        type="button"
                        disabled={idx === etiquetaList.length - 1}
                        onClick={() => moverEtiqueta(idx, idx + 1)}
                        title="Descer posição"
                        style={{
                          backgroundColor: 'var(--card-bg, #3e3e3e)',
                          color: idx === etiquetaList.length - 1 ? 'var(--text-secondary, #888888)' : 'var(--accent-color, #ffe192)',
                          border: '1px solid var(--border-color, #737373)',
                          borderRadius: '4px',
                          width: '26px',
                          height: '26px',
                          cursor: idx === etiquetaList.length - 1 ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          opacity: idx === etiquetaList.length - 1 ? 0.4 : 1,
                        }}
                      >
                        ▼
                      </button>

                      {/* Botão Excluir */}
                      <button
                        type="button"
                        onClick={() => handleDeletarEtiq(etiqNome)}
                        title="Excluir Etiqueta"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ff6b6b',
                          cursor: 'pointer',
                          fontSize: '14px',
                          padding: '4px 6px',
                          marginLeft: '4px',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
