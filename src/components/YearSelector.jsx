import React, { useState, useEffect, useRef } from 'react';
import { useBudget } from '../contexts/BudgetContext';

const STORAGE_KEY = 'flowly_anos_lista';
const DEFAULT_ANOS = ['2024', '2025', '2026', '2027'];

export default function YearSelector() {
  const { ANOS_LISTA, anoSelecionado, setAnoSelecionado, isCaixinhaAtiva, isComercial } = useBudget();
  const [isOpen, setIsOpen] = useState(false);
  const [inputCustomAno, setInputCustomAno] = useState('');
  const [erroAdd, setErroAdd] = useState('');
  const dropdownRef = useRef(null);

  // Inicializa a lista a partir do localStorage ou da lista padrão
  const [anosLocais, setAnosLocais] = useState(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY);
      if (salvo) {
        const parsed = JSON.parse(salvo);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Garante que o ano atualmente selecionado esteja presente na lista caso exista
          if (anoSelecionado && anoSelecionado !== 'caixinha' && !parsed.includes(anoSelecionado)) {
            parsed.push(anoSelecionado);
            parsed.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('Erro ao ler anos do localStorage:', e);
    }
    const base = ANOS_LISTA || DEFAULT_ANOS;
    const lista = [...base];
    if (anoSelecionado && anoSelecionado !== 'caixinha' && !lista.includes(anoSelecionado)) {
      lista.push(anoSelecionado);
      lista.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
    }
    return lista;
  });

  // Salva no localStorage sempre que a lista de anos for alterada
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(anosLocais));
    } catch (e) {
      console.error('Erro ao salvar anos no localStorage:', e);
    }
  }, [anosLocais]);

  // Listener para fechar o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setErroAdd('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectAno = (ano) => {
    setAnoSelecionado(ano);
    setIsOpen(false);
    setErroAdd('');
  };

  const handleAdicionarProximoAno = () => {
    const anosNumericos = anosLocais.map((a) => parseInt(a, 10)).filter((n) => !isNaN(n));
    const maiorAno = anosNumericos.length > 0 ? Math.max(...anosNumericos) : new Date().getFullYear();
    const proximoAno = (maiorAno + 1).toString();

    if (!anosLocais.includes(proximoAno)) {
      const novaLista = [...anosLocais, proximoAno].sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
      setAnosLocais(novaLista);
      setAnoSelecionado(proximoAno);
    }
  };

  const handleAdicionarAnoCustom = (e) => {
    if (e) e.preventDefault();
    const anoFormatado = inputCustomAno.trim();
    if (!anoFormatado || !/^\d{4}$/.test(anoFormatado)) {
      setErroAdd('Digite um ano válido com 4 dígitos (ex: 2028).');
      return;
    }

    if (anosLocais.includes(anoFormatado)) {
      setErroAdd('Este ano já está cadastrado.');
      return;
    }

    const novaLista = [...anosLocais, anoFormatado].sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
    setAnosLocais(novaLista);
    setAnoSelecionado(anoFormatado);
    setInputCustomAno('');
    setErroAdd('');
  };

  const handleExcluirAno = (anoParaExcluir, e) => {
    e.stopPropagation();

    if (anosLocais.length <= 1) {
      alert('É necessário manter ao menos um ano disponível.');
      return;
    }

    const confirmacao = window.confirm(`Deseja realmente remover o ano "${anoParaExcluir}" da lista de seleção?`);
    if (!confirmacao) return;

    const novaLista = anosLocais.filter((a) => a !== anoParaExcluir);
    setAnosLocais(novaLista);

    // Se o ano excluído era o ano selecionado, troca para o mais próximo
    if (anoSelecionado === anoParaExcluir) {
      const anoMaisProximo = novaLista[novaLista.length - 1] || '2026';
      setAnoSelecionado(anoMaisProximo);
    }
  };

  const anoAtualReal = new Date().getFullYear().toString();
  const [ultimoAnoNaoCaixinha, setUltimoAnoNaoCaixinha] = useState(() => {
    if (anoSelecionado && anoSelecionado !== 'caixinha') return anoSelecionado;
    return anosLocais.includes(anoAtualReal) ? anoAtualReal : (anosLocais[0] || '2026');
  });

  useEffect(() => {
    if (anoSelecionado && anoSelecionado !== 'caixinha') {
      setUltimoAnoNaoCaixinha(anoSelecionado);
    }
  }, [anoSelecionado]);

  const anoExibido = anoSelecionado === 'caixinha' ? ultimoAnoNaoCaixinha : (anoSelecionado || '2026');

  // Navegação rápida para ano anterior / próximo
  const handleNavAno = (direcao) => {
    const idx = anosLocais.indexOf(anoExibido);
    if (idx === -1) {
      if (anosLocais.length > 0) setAnoSelecionado(anosLocais[0]);
      return;
    }

    if (direcao === 'prev' && idx > 0) {
      setAnoSelecionado(anosLocais[idx - 1]);
    } else if (direcao === 'next' && idx < anosLocais.length - 1) {
      setAnoSelecionado(anosLocais[idx + 1]);
    }
  };

  const idxReferencia = anosLocais.indexOf(anoExibido);
  const temAnterior = idxReferencia > 0;
  const temProximo = idxReferencia !== -1 && idxReferencia < anosLocais.length - 1;

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative' }} ref={dropdownRef}>
      
      {/* Controles de Navegação e Dropdown */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--surface-bg, #3e3e3e)',
          borderRadius: '8px',
          padding: '2px',
          border: '1px solid var(--border-color, #555555)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        }}
      >
        {/* Botão Ano Anterior */}
        <button
          onClick={() => handleNavAno('prev')}
          disabled={!temAnterior}
          title={temAnterior ? `Ir para ${anosLocais[idxReferencia - 1]}` : 'Nenhum ano anterior'}
          style={{
            background: 'none',
            border: 'none',
            color: temAnterior ? 'var(--text-primary, #ffffff)' : 'var(--text-secondary, #777777)',
            cursor: temAnterior ? 'pointer' : 'default',
            padding: '6px 8px',
            fontSize: '13px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: temAnterior ? 1 : 0.4,
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            if (temAnterior) e.currentTarget.style.backgroundColor = 'var(--surface-hover, #4f4f4f)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          ❮
        </button>

        {/* Botão Trigger do Dropdown do Ano */}
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setErroAdd('');
          }}
          title="Clique para selecionar ou gerenciar anos"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            backgroundColor: isOpen ? 'var(--accent-color, #ffe192)' : 'transparent',
            color: isOpen
              ? 'var(--accent-text, #333333)'
              : anoSelecionado === 'caixinha'
              ? 'var(--text-secondary, #cccccc)'
              : 'var(--accent-color, #ffe192)',
            transition: 'all 0.2s',
            fontSize: '15px',
          }}
        >
          <span>{anoExibido}</span>
          <span
            style={{
              fontSize: '10px',
              transition: 'transform 0.2s',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              color: isOpen ? 'var(--accent-text, #333333)' : 'var(--text-secondary, #aaaaaa)',
            }}
          >
            ▼
          </span>
        </button>

        {/* Botão Próximo Ano */}
        <button
          onClick={() => handleNavAno('next')}
          disabled={!temProximo}
          title={temProximo ? `Ir para ${anosLocais[idxReferencia + 1]}` : 'Nenhum próximo ano'}
          style={{
            background: 'none',
            border: 'none',
            color: temProximo ? 'var(--text-primary, #ffffff)' : 'var(--text-secondary, #777777)',
            cursor: temProximo ? 'pointer' : 'default',
            padding: '6px 8px',
            fontSize: '13px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: temProximo ? 1 : 0.4,
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            if (temProximo) e.currentTarget.style.backgroundColor = 'var(--surface-hover, #4f4f4f)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          ❯
        </button>
      </div>

      {/* Popover / Dropdown Menu Suspenso de Anos */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '46px',
            left: 0,
            backgroundColor: 'var(--card-bg, #545454)',
            borderRadius: '12px',
            border: '1px solid var(--border-color, #666666)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            zIndex: 1100,
            width: '260px',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {/* Cabeçalho do Dropdown */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '2px 4px 6px 4px',
              borderBottom: '1px solid var(--border-color, #666666)',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-color, #ffe192)' }}>
              Selecione o Ano
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary, #aaaaaa)' }}>
              {anosLocais.length} {anosLocais.length === 1 ? 'ano' : 'anos'}
            </span>
          </div>

          {/* Lista de Anos com Scroll */}
          <div
            style={{
              maxHeight: '200px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              paddingRight: '2px',
            }}
          >
            {anosLocais.map((ano) => {
              const isSelected = anoSelecionado === ano;

              return (
                <div
                  key={ano}
                  onClick={() => handleSelectAno(ano)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? 'var(--surface-bg, #3e3e3e)' : 'transparent',
                    border: isSelected ? '1px solid var(--accent-color, #ffe192)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--surface-hover, #4f4f4f)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: isSelected ? 'bold' : '500',
                        color: isSelected ? 'var(--accent-color, #ffe192)' : 'var(--text-primary, #ffffff)',
                      }}
                    >
                      {ano}
                    </span>
                    {isSelected && (
                      <span style={{ fontSize: '11px', color: 'var(--accent-color, #ffe192)', fontWeight: 'bold' }}>
                        ✓
                      </span>
                    )}
                  </div>

                  {/* Botão de Excluir / Esconder Ano */}
                  {anosLocais.length > 1 && (
                    <button
                      onClick={(e) => handleExcluirAno(ano, e)}
                      title={`Remover ano ${ano}`}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary, #999999)',
                        cursor: 'pointer',
                        padding: '4px 6px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#ff6b6b';
                        e.currentTarget.style.backgroundColor = 'rgba(255, 107, 107, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-secondary, #999999)';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Ações de Adição */}
          <div
            style={{
              borderTop: '1px solid var(--border-color, #666666)',
              paddingTop: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            {/* Botão Rápido: Adicionar Próximo Ano */}
            <button
              onClick={handleAdicionarProximoAno}
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px dashed var(--accent-color, #ffe192)',
                backgroundColor: 'rgba(255, 225, 146, 0.08)',
                color: 'var(--accent-color, #ffe192)',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 225, 146, 0.18)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 225, 146, 0.08)')}
            >
              <span>+</span>
              <span>Adicionar Próximo Ano</span>
            </button>

            {/* Input para Adicionar Ano Específico */}
            <form
              onSubmit={handleAdicionarAnoCustom}
              style={{
                display: 'flex',
                gap: '4px',
                marginTop: '2px',
              }}
            >
              <input
                type="number"
                placeholder="Ano (ex: 2028)"
                value={inputCustomAno}
                onChange={(e) => {
                  setInputCustomAno(e.target.value);
                  setErroAdd('');
                }}
                min="1900"
                max="2100"
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color, #666666)',
                  backgroundColor: 'var(--surface-bg, #3e3e3e)',
                  color: 'var(--text-primary, #ffffff)',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                title="Adicionar ano digitado"
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'var(--accent-color, #ffe192)',
                  color: 'var(--accent-text, #333333)',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                +
              </button>
            </form>

            {erroAdd && (
              <span style={{ fontSize: '11px', color: '#ff6b6b', marginTop: '2px' }}>
                {erroAdd}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Botão Caixinha / Reserva de Lucros Junto aos Anos */}
      {isCaixinhaAtiva && (
        <button
          onClick={() => setAnoSelecionado('caixinha')}
          title={isComercial ? 'Ver Reserva de Lucros corporativa' : 'Ver saldo acumulado da Caixinha'}
          style={{
            padding: '8px 18px',
            borderRadius: '6px',
            border: anoSelecionado === 'caixinha' ? '1px solid var(--accent-color, #ffe192)' : 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            backgroundColor: anoSelecionado === 'caixinha' ? 'var(--accent-color, #ffe192)' : 'var(--surface-bg, #3e3e3e)',
            color: anoSelecionado === 'caixinha' ? 'var(--accent-text, #333333)' : 'var(--text-primary, #ffffff)',
            transition: 'all 0.2s',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: anoSelecionado === 'caixinha' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
          }}
        >
          <span>📦</span>
          <span>{isComercial ? 'Reserva de Lucros' : 'Caixinha'}</span>
        </button>
      )}
    </div>
  );
}