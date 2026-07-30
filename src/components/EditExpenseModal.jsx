import React, { useState, useEffect } from 'react';
import { useBudget } from '../contexts/BudgetContext';

export default function EditExpenseModal({ isOpen, item, onClose, onSave }) {
  const { categorias } = useBudget();

  const [nome, setNome] = useState('');
  const [valorRaw, setValorRaw] = useState(0);
  const [valorExibido, setValorExibido] = useState('');
  const [etiqueta, setEtiqueta] = useState('');
  const [classificacao, setClassificacao] = useState('Outros');
  const [descricao, setDescricao] = useState('');

  useEffect(() => {
    if (item) {
      setNome(item.nome || '');
      const numValor = Number(item.valor) || 0;
      setValorRaw(numValor);
      setValorExibido(
        numValor.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      );
      setEtiqueta(item.etiqueta || '');
      setClassificacao(item.classificacao || (categorias[0]?.nome || 'Outros'));
      setDescricao(item.descricao || '');
    }
  }, [item, categorias]);

  if (!isOpen || !item) return null;

  const handleValorChange = (e) => {
    const apenasNumeros = e.target.value.replace(/\D/g, '');

    if (!apenasNumeros) {
      setValorRaw(0);
      setValorExibido('');
      return;
    }

    const valorNumerico = parseFloat(apenasNumeros) / 100;
    setValorRaw(valorNumerico);
    setValorExibido(
      valorNumerico.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nome || valorRaw <= 0) return;

    onSave({
      id: item.id,
      nome,
      valor: valorRaw,
      classificacao,
      etiqueta,
      descricao,
    });
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
          borderRadius: '16px',
          padding: '24px',
          width: '390px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          color: '#ffe192',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>
            Editar Lançamento
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '22px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Nome*</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #737373', backgroundColor: '#666666', color: '#ffffff', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Valor (R$)*</label>
            <input
              type="text"
              inputMode="numeric"
              value={valorExibido}
              onChange={handleValorChange}
              required
              placeholder="0,00"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #737373', backgroundColor: '#666666', color: '#ffffff', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Classificação / Categoria</label>
            <select
              value={classificacao}
              onChange={(e) => setClassificacao(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #737373', backgroundColor: '#666666', color: '#ffffff', boxSizing: 'border-box' }}
            >
              {categorias.length === 0 ? (
                <option value="Outros">Outros</option>
              ) : (
                categorias.map((cat) => (
                  <option key={cat.id || cat.nome} value={cat.nome}>
                    {cat.nome}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Etiqueta</label>
            <input
              type="text"
              value={etiqueta}
              onChange={(e) => setEtiqueta(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #737373', backgroundColor: '#666666', color: '#ffffff', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Descrição</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows="2"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #737373', backgroundColor: '#666666', color: '#ffffff', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
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
                fontSize: '15px',
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
                fontSize: '15px',
                cursor: 'pointer',
              }}
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
