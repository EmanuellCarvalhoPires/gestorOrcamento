import React, { useState, useEffect } from 'react';
import { useBudget } from '../contexts/BudgetContext';

export default function EditExpenseModal({ isOpen, item, onClose, onSave }) {
  const { categorias, isComercial, setIsCategoryModalOpen } = useBudget();

  const getFormattedDateTime = (isoOrDate) => {
    if (!isoOrDate) return '';
    const d = new Date(isoOrDate);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => (n < 10 ? `0${n}` : n);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [nome, setNome] = useState('');
  const [valorFormatado, setValorFormatado] = useState('R$ 0,00');
  const [valorNumerico, setValorNumerico] = useState(0);
  const [classificacao, setClassificacao] = useState('');
  const [etiqueta, setEtiqueta] = useState('Geral');
  const [dataTransacao, setDataTransacao] = useState('');
  const [descricao, setDescricao] = useState('');

  useEffect(() => {
    if (item) {
      setNome(item.nome || '');
      const val = Number(item.valor) || 0;
      setValorNumerico(val);
      setValorFormatado(val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
      setClassificacao(item.classificacao || '');
      setEtiqueta(item.etiqueta || 'Geral');
      setDataTransacao(getFormattedDateTime(item.data_transacao));
      setDescricao(item.descricao || '');
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleValorChange = (e) => {
    const apenasDigitos = e.target.value.replace(/\D/g, '');
    const numero = Number(apenasDigitos) / 100;
    setValorNumerico(numero);

    const formatado = numero.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
    setValorFormatado(formatado);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nome.trim() || valorNumerico <= 0) return;

    onSave({
      id: item.id,
      oldNome: item.nome,
      nome,
      valor: valorNumerico,
      classificacao: classificacao || (categorias[0]?.nome || 'Outros'),
      etiqueta,
      dataTransacao,
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
        zIndex: 1500,
      }}
    >
      <div
        style={{
          backgroundColor: '#545454',
          borderRadius: '24px',
          padding: '32px',
          width: '90%',
          maxWidth: '520px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#ffffff', fontSize: '20px', fontWeight: 'bold' }}>
            ✏️ Editar Lançamento
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#aaaaaa', fontSize: '18px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Nome */}
          <div>
            <label style={{ display: 'block', color: '#dddddd', fontSize: '13px', marginBottom: '6px' }}>
              {isComercial ? 'Nome do Cliente / Fornecedor / Lançamento' : 'Nome da Despesa / Receita'}
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '14px',
                border: '1px solid #737373',
                backgroundColor: '#3e3e3e',
                color: '#ffffff',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              required
            />
          </div>

          {/* Valor + Data e Hora */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', color: '#dddddd', fontSize: '13px', marginBottom: '6px' }}>
                Valor (R$)
              </label>
              <input
                type="text"
                value={valorFormatado}
                onChange={handleValorChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  border: '1px solid #737373',
                  backgroundColor: '#3e3e3e',
                  color: '#ffe192',
                  fontSize: '17px',
                  fontWeight: 'bold',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', color: '#dddddd', fontSize: '13px', marginBottom: '6px' }}>
                📅 Data e Hora
              </label>
              <input
                type="datetime-local"
                value={dataTransacao}
                onChange={(e) => setDataTransacao(e.target.value)}
                onClick={(e) => {
                  try {
                    e.target.showPicker();
                  } catch (err) {}
                }}
                style={{
                  width: '100%',
                  padding: '12px 12px',
                  borderRadius: '14px',
                  border: '1px solid #737373',
                  backgroundColor: '#3e3e3e',
                  color: '#ffffff',
                  colorScheme: 'dark',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                }}
                required
              />
            </div>
          </div>

          {/* Classificação */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ color: '#dddddd', fontSize: '13px' }}>Classificação / Categoria</label>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffe192',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                + Gerenciar Categorias
              </button>
            </div>
            <select
              value={classificacao}
              onChange={(e) => setClassificacao(e.target.value)}
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
            >
              <option value="">Selecione uma Categoria...</option>
              {categorias.map((cat) => (
                <option key={cat.id || cat.nome} value={cat.nome}>
                  {cat.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Descrição / Observações (Máx. 200 caracteres) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ color: '#dddddd', fontSize: '13px' }}>Descrição / Observações (Opcional)</label>
              <span style={{ fontSize: '11px', color: (descricao || '').length > 180 ? '#ffe192' : '#aaaaaa' }}>
                {(descricao || '').length}/200
              </span>
            </div>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value.slice(0, 200))}
              maxLength={200}
              placeholder="Observações adicionais (máx. 200 caracteres)..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid #737373',
                backgroundColor: '#3e3e3e',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
                minHeight: '60px',
                maxHeight: '120px',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
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
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
