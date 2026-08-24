import React, { useState, useEffect, useRef } from 'react';
import { useBudget } from '../contexts/BudgetContext';

const MESES_LISTA = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function AddExpenseModal() {
  const {
    isModalOpen,
    setIsModalOpen,
    modalInitialData,
    setModalInitialData,
    adicionarTransacao,
    categorias,
    etiquetaList,
    isComercial,
    setIsCategoryModalOpen,
    mesSelecionado,
    setMesSelecionado,
    anoSelecionado,
    setAnoSelecionado,
    abaAtiva,
    setAbaAtiva,
  } = useBudget();

  const labelReceitaTab = isComercial ? 'Vendas / Entradas' : 'Receita';
  const labelDespesaTab = isComercial ? 'Custos / Saídas' : 'Despesa';

  // Helper para formatar a data/hora local atual para o input datetime-local (YYYY-MM-DDTHH:mm)
  const getNowFormatted = () => {
    const d = new Date();
    const pad = (n) => (n < 10 ? `0${n}` : n);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tipo, setTipo] = useState('despesa'); // 'despesa' ou 'receita'
  const [hoveredTipo, setHoveredTipo] = useState(null);
  const [nome, setNome] = useState('');
  const [valorFormatado, setValorFormatado] = useState('R$ 0,00');
  const [valorNumerico, setValorNumerico] = useState(0);
  
  const [classificacao, setClassificacao] = useState('');
  const [etiqueta, setEtiqueta] = useState('');
  const [dataTransacao, setDataTransacao] = useState(getNowFormatted());
  
  const [isParcelado, setIsParcelado] = useState(false);
  const [parcelaAtual, setParcelaAtual] = useState(1);
  const [totalParcelas, setTotalParcelas] = useState(1);
  
  const [ehFixa, setEhFixa] = useState(false);
  const [ehReserva, setEhReserva] = useState(false);
  const [mesFimRecorrencia, setMesFimRecorrencia] = useState('Dez');
  const [anoFimRecorrencia, setAnoFimRecorrencia] = useState(new Date().getFullYear().toString());
  const [descricao, setDescricao] = useState('');

  // Modo Calculadora por Frequência / Recorrência
  const [isModoFrequencia, setIsModoFrequencia] = useState(false);
  const [valorUnitarioFormatado, setValorUnitarioFormatado] = useState('R$ 5,00');
  const [valorUnitarioNumerico, setValorUnitarioNumerico] = useState(5);
  const [qtdOcorrencias, setQtdOcorrencias] = useState(1);
  const [tipoFrequencia, setTipoFrequencia] = useState('diario_uteis'); // 'diario_todos', 'diario_uteis', 'semanal', 'mensal'

  // Modo Calculadora de Compra Parcelada
  const [modoParcelamento, setModoParcelamento] = useState('total_compra'); // 'total_compra' | 'valor_parcela'
  const [valorTotalCompraFormatado, setValorTotalCompraFormatado] = useState('R$ 0,00');
  const [valorTotalCompraNumerico, setValorTotalCompraNumerico] = useState(0);
  const [valorParcelaDiretoFormatado, setValorParcelaDiretoFormatado] = useState('R$ 0,00');
  const [valorParcelaDiretoNumerico, setValorParcelaDiretoNumerico] = useState(0);

  // Dropdowns personalizados
  const catRef = useRef(null);
  const etiqRef = useRef(null);
  const mesFimRef = useRef(null);
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [isEtiqOpen, setIsEtiqOpen] = useState(false);
  const [isMesFimOpen, setIsMesFimOpen] = useState(false);
  const [hoveredCat, setHoveredCat] = useState(null);
  const [hoveredEtiq, setHoveredEtiq] = useState(null);
  const [hoveredMesFim, setHoveredMesFim] = useState(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (catRef.current && !catRef.current.contains(e.target)) {
        setIsCatOpen(false);
      }
      if (etiqRef.current && !etiqRef.current.contains(e.target)) {
        setIsEtiqOpen(false);
      }
      if (mesFimRef.current && !mesFimRef.current.contains(e.target)) {
        setIsMesFimOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sincroniza o tipo e dados iniciais ao abrir o modal
  useEffect(() => {
    if (isModalOpen) {
      if (modalInitialData?.tipo) {
        setTipo(modalInitialData.tipo);
      } else {
        setTipo(abaAtiva === 'receitas' || abaAtiva === 'receita' ? 'receita' : 'despesa');
      }

      if (modalInitialData?.classificacao) {
        const catObj = (categorias || []).find(
          (c) => c.nome?.toLowerCase() === modalInitialData.classificacao.toLowerCase()
        );
        setClassificacao(catObj ? catObj.nome : modalInitialData.classificacao);
      } else {
        setClassificacao('');
      }

      if (modalInitialData?.etiqueta) {
        setEtiqueta(modalInitialData.etiqueta);
      } else {
        setEtiqueta('');
      }

      if (modalInitialData?.nome) {
        setNome(modalInitialData.nome);
      } else {
        setNome('');
      }

      setDataTransacao(getNowFormatted());
    }
  }, [isModalOpen, abaAtiva, modalInitialData, categorias]);

  const handleCloseModal = () => {
    if (setModalInitialData) setModalInitialData(null);
    setIsModalOpen(false);
  };

  // Recálculo automático quando no Modo Frequência
  useEffect(() => {
    if (!isModalOpen || !isModoFrequencia) return;

    let multiplicador = 1;
    if (tipoFrequencia === 'diario_todos') {
      multiplicador = 30; // 30 dias no mês
    } else if (tipoFrequencia === 'diario_uteis') {
      multiplicador = 22; // 22 dias úteis no mês
    } else if (tipoFrequencia === 'semanal') {
      multiplicador = 4.33; // 4.33 semanas por mês em média
    } else if (tipoFrequencia === 'mensal') {
      multiplicador = 1; // Ocorrências mensais diretas
    }

    const qtd = Math.max(1, parseInt(qtdOcorrencias, 10) || 1);
    const totalCalculado = valorUnitarioNumerico * qtd * multiplicador;
    setValorNumerico(totalCalculado);

    const formatado = totalCalculado.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
    setValorFormatado(formatado);
  }, [isModalOpen, isModoFrequencia, valorUnitarioNumerico, qtdOcorrencias, tipoFrequencia]);

  // Recálculo automático quando no Modo Compra Parcelada
  useEffect(() => {
    if (!isModalOpen || !isParcelado) return;

    const totParc = Math.max(1, parseInt(totalParcelas, 10) || 1);

    if (modoParcelamento === 'total_compra') {
      const totalCompra = valorTotalCompraNumerico;
      setValorNumerico(totalCompra);

      const formatado = totalCompra.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      });
      setValorFormatado(formatado);
    } else {
      const totalCompra = valorParcelaDiretoNumerico * totParc;
      setValorNumerico(totalCompra);

      const formatado = totalCompra.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      });
      setValorFormatado(formatado);
    }
  }, [isModalOpen, isParcelado, modoParcelamento, valorTotalCompraNumerico, valorParcelaDiretoNumerico, totalParcelas]);

  if (!isModalOpen) return null;

  const handleValorUnitarioChange = (e) => {
    const apenasDigitos = e.target.value.replace(/\D/g, '');
    const numero = Number(apenasDigitos) / 100;
    setValorUnitarioNumerico(numero);

    const formatado = numero.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
    setValorUnitarioFormatado(formatado);
  };

  const handleValorTotalCompraChange = (e) => {
    const apenasDigitos = e.target.value.replace(/\D/g, '');
    const numero = Number(apenasDigitos) / 100;
    setValorTotalCompraNumerico(numero);

    const formatado = numero.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
    setValorTotalCompraFormatado(formatado);
  };

  const handleValorParcelaDiretoChange = (e) => {
    const apenasDigitos = e.target.value.replace(/\D/g, '');
    const numero = Number(apenasDigitos) / 100;
    setValorParcelaDiretoNumerico(numero);

    const formatado = numero.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
    setValorParcelaDiretoFormatado(formatado);
  };

  // Máscara de Caixa Eletrônico (ATM): digita números e formata em R$ 0,00 em tempo real
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

  const handleTipoChange = (novoTipo) => {
    setTipo(novoTipo);
    setClassificacao('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!nome.trim() || valorNumerico <= 0) return;

    setIsSubmitting(true);
    try {
      const catFinal = classificacao || (categorias[0]?.nome || 'Outros');

      let mesCalculado = mesSelecionado;
      let anoCalculado = anoSelecionado;
      let finalDataTransacao = dataTransacao;

      if (mesSelecionado !== 'Todos') {
        const mesIndex = MESES_LISTA.indexOf(mesSelecionado);
        const anoNum = parseInt(anoSelecionado, 10) || new Date().getFullYear();
        
        const agora = new Date();
        if (agora.getMonth() === mesIndex && agora.getFullYear() === anoNum) {
          finalDataTransacao = getNowFormatted(); // Usa data atual se estiver adicionando no mês atual
        } else {
          const fakeDate = new Date(anoNum, mesIndex, 1, 12, 0, 0); // Primeiro dia do mês ao meio-dia
          const pad = (n) => (n < 10 ? `0${n}` : n);
          finalDataTransacao = `${fakeDate.getFullYear()}-${pad(fakeDate.getMonth() + 1)}-${pad(fakeDate.getDate())}T${pad(fakeDate.getHours())}:${pad(fakeDate.getMinutes())}`;
        }
      } else {
        const dtObj = dataTransacao ? new Date(dataTransacao) : new Date();
        mesCalculado = MESES_LISTA[dtObj.getMonth()];
        anoCalculado = dtObj.getFullYear().toString();
      }

      await adicionarTransacao({
        tipo,
        nome,
        valor: valorNumerico,
        classificacao: catFinal,
        etiqueta: etiqueta.trim() || 'Geral',
        dataTransacao: finalDataTransacao,
        parcelaAtual: isParcelado ? (parseInt(parcelaAtual, 10) || 1) : 1,
        totalParcelas: isParcelado ? (parseInt(totalParcelas, 10) || 1) : 1,
        ehFixa,
        ehReserva: (tipo === 'despesa' && ehReserva) ? 1 : 0,
        mesFimRecorrencia,
        anoFimRecorrencia,
        descricao,
        mesPersonalizado: mesCalculado,
        ano: anoCalculado,
      });

      setMesSelecionado(mesCalculado);
      setAnoSelecionado(anoCalculado);
      setAbaAtiva(tipo === 'receita' ? 'receitas' : 'despesas');

      // Reset Form
      setNome('');
      setValorFormatado('R$ 0,00');
      setValorNumerico(0);
      setClassificacao('');
      setEtiqueta('');
      setDataTransacao(getNowFormatted());
      setIsParcelado(false);
      setParcelaAtual(1);
      setTotalParcelas(1);
      setEhFixa(false);
      setEhReserva(false);
      setMesFimRecorrencia('Dez');
      setAnoFimRecorrencia(new Date().getFullYear().toString());
      setDescricao('');
      handleCloseModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Nomenclaturas adaptativas por perfil
  const tituloModal = isComercial
    ? (tipo === 'receita' ? 'Nova Venda / Faturamento Comercial' : 'Novo Custo / Despesa Comercial')
    : (tipo === 'receita' ? 'Adicionar Receita' : 'Adicionar Despesa');

  const labelNome = isComercial
    ? (tipo === 'receita' ? 'Nome do Cliente ou Produto/Venda' : 'Nome do Fornecedor ou Custo')
    : (tipo === 'receita' ? 'Nome da Receita / Origem' : 'Nome da Despesa');

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--card-bg, #545454)',
          borderRadius: '24px',
          padding: '24px 28px',
          width: '90%',
          maxWidth: '585px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
          position: 'relative',
          overflow: 'hidden',
          color: 'var(--text-primary, #ffffff)',
        }}
      >
        {/* Topo do Modal com Título e Toggle Alinhados */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '14px' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--text-primary, #ffffff)', fontSize: '18px', fontWeight: 'bold' }}>
              {tituloModal}
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '2px', backgroundColor: 'rgba(0, 0, 0, 0.3)', padding: '3px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <button
                type="button"
                onClick={() => handleTipoChange('receita')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  backgroundColor: tipo === 'receita' ? '#2a9d8f' : 'transparent',
                  color: tipo === 'receita' ? '#ffffff' : '#9e9e9e',
                  boxShadow: tipo === 'receita' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {labelReceitaTab}
              </button>

              <button
                type="button"
                onClick={() => handleTipoChange('despesa')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  backgroundColor: tipo === 'despesa' ? 'var(--accent-color, #ffe192)' : 'transparent',
                  color: tipo === 'despesa' ? 'var(--accent-text, #333333)' : '#9e9e9e',
                  boxShadow: tipo === 'despesa' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {labelDespesaTab}
              </button>
            </div>

            <button
              type="button"
              onClick={handleCloseModal}
              title="Fechar"
              style={{
                background: 'none',
                border: 'none',
                color: '#aaaaaa',
                fontSize: '20px',
                cursor: 'pointer',
                lineHeight: 1,
                padding: '4px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#aaaaaa')}
            >
              ✕
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            overflowY: 'auto',
            paddingRight: '4px',
            maxHeight: 'calc(90vh - 80px)',
          }}
        >
          {/* 1. Nome do Lançamento */}
          <div>
            <label style={{ display: 'block', color: 'var(--text-primary, #dddddd)', fontSize: '13px', marginBottom: '6px' }}>
              {labelNome}
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder={isComercial ? (tipo === 'receita' ? 'Ex: Cliente João - Venda de Serviço' : 'Ex: Fornecedor Distribuidora X') : 'Ex: Mercado, Salário...'}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '14px',
                border: '1px solid var(--border-color, #737373)',
                backgroundColor: 'var(--surface-bg, #3e3e3e)',
                color: 'var(--text-primary, #ffffff)',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              required
            />
          </div>

          {/* 2. Finalidade da Despesa (Despesa Comum vs Reserva para Caixinha) */}
          {tipo === 'despesa' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: 'var(--text-primary, #dddddd)', fontSize: '13px', fontWeight: '500' }}>
                Finalidade do Lançamento
              </label>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  title="Despesa tradicional que subtrai do orçamento disponível e reduz o valor guardado/caixinha."
                  onClick={() => setEhReserva(false)}
                  style={{
                    flex: 1,
                    height: '40px',
                    borderRadius: '12px',
                    border: !ehReserva ? '1px solid var(--accent-color, #ffe192)' : '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: !ehReserva ? 'var(--accent-color, #ffe192)' : 'rgba(255, 255, 255, 0.04)',
                    color: !ehReserva ? 'var(--accent-text, #333333)' : '#aaaaaa',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    boxShadow: !ehReserva ? '0 2px 8px rgba(0,0,0,0.25)' : 'none',
                  }}
                >
                  Despesa Comum
                </button>

                <button
                  type="button"
                  title="Reserva um valor do orçamento para economia. Não deduz da Caixinha; soma diretamente no 'valor a ser guardado'."
                  onClick={() => setEhReserva(true)}
                  style={{
                    flex: 1,
                    height: '40px',
                    borderRadius: '12px',
                    border: ehReserva ? '1px solid #50fa7b' : '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: ehReserva ? '#50fa7b' : 'rgba(255, 255, 255, 0.04)',
                    color: ehReserva ? '#1e1e1e' : '#aaaaaa',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    boxShadow: ehReserva ? '0 2px 8px rgba(0,0,0,0.25)' : 'none',
                  }}
                >
                  Reserva para Caixinha
                </button>
              </div>

              {ehReserva && (
                <div
                  style={{
                    fontSize: '12px',
                    color: '#50fa7b',
                    backgroundColor: 'rgba(80, 250, 123, 0.08)',
                    border: '1px solid rgba(80, 250, 123, 0.25)',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    lineHeight: '1.4',
                    marginTop: '2px',
                  }}
                >
                  <span>
                    Esta despesa reserva orçamento no mês, mas <strong>não subtrai da Caixinha</strong> — ela é adicionada ao "valor a ser guardado".
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 3. Tipo de Lançamento (Pontual, Recorrente ou Parcelado) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ color: 'var(--text-primary, #dddddd)', fontSize: '13px', fontWeight: '500' }}>
              Tipo de Lançamento
            </label>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {/* Botão Pontual */}
              <button
                type="button"
                title="Lançamento único que ocorre apenas uma vez nesta data especificada (ex: compras à vista, pagamentos pontuais)."
                onClick={() => {
                  setEhFixa(false);
                  setIsParcelado(false);
                  setIsModoFrequencia(false);
                }}
                style={{
                  flex: 1,
                  minWidth: '110px',
                  height: '40px',
                  borderRadius: '12px',
                  border: !ehFixa && !isParcelado ? '1px solid var(--accent-color, #ffe192)' : '1px solid rgba(255, 255, 255, 0.08)',
                  backgroundColor: !ehFixa && !isParcelado ? 'var(--accent-color, #ffe192)' : 'rgba(255, 255, 255, 0.04)',
                  color: !ehFixa && !isParcelado ? 'var(--accent-text, #333333)' : '#aaaaaa',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                  boxShadow: !ehFixa && !isParcelado ? '0 2px 8px rgba(0, 0, 0, 0.25)' : 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                Pontual
              </button>

              {/* Botão Recorrente */}
              <button
                type="button"
                title="Lançamento fixo que se repete automaticamente todos os meses na mesma data (ex: assinatura, aluguel, salário)."
                onClick={() => {
                  setEhFixa(true);
                  setIsParcelado(false);
                }}
                style={{
                  flex: 1,
                  minWidth: '110px',
                  height: '40px',
                  borderRadius: '12px',
                  border: ehFixa ? '1px solid var(--accent-color, #ffe192)' : '1px solid rgba(255, 255, 255, 0.08)',
                  backgroundColor: ehFixa ? 'var(--accent-color, #ffe192)' : 'rgba(255, 255, 255, 0.04)',
                  color: ehFixa ? 'var(--accent-text, #333333)' : '#aaaaaa',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                  boxShadow: ehFixa ? '0 2px 8px rgba(0, 0, 0, 0.25)' : 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                Recorrente
              </button>

              {/* Botão Compra Parcelada */}
              <button
                type="button"
                title="Compra dividida em número fixo de parcelas (ex: 10x no cartão). O sistema projeta cada parcela nos meses seguintes."
                onClick={() => {
                  setIsParcelado(true);
                  setEhFixa(false);
                  setIsModoFrequencia(false);
                }}
                style={{
                  flex: 1,
                  minWidth: '120px',
                  height: '40px',
                  borderRadius: '12px',
                  border: isParcelado ? '1px solid var(--accent-color, #ffe192)' : '1px solid rgba(255, 255, 255, 0.08)',
                  backgroundColor: isParcelado ? 'var(--accent-color, #ffe192)' : 'rgba(255, 255, 255, 0.04)',
                  color: isParcelado ? 'var(--accent-text, #333333)' : '#aaaaaa',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                  boxShadow: isParcelado ? '0 2px 8px rgba(0, 0, 0, 0.25)' : 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                Compra Parcelada
              </button>
            </div>
          </div>

          {/* SUB-PAINEL SE FOR RECORRENTE / FREQUENTE: Alterna entre Valor Fixo x Calcular por Frequência */}
          {ehFixa && (
            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--accent-color, #ffe192)', fontWeight: 'bold' }}>
                  Modo de Cálculo Recorrente
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setIsModoFrequencia(false)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      border: !isModoFrequencia ? '1px solid var(--accent-color, #ffe192)' : '1px solid rgba(255, 255, 255, 0.08)',
                      backgroundColor: !isModoFrequencia ? 'var(--accent-color, #ffe192)' : 'rgba(255, 255, 255, 0.04)',
                      color: !isModoFrequencia ? 'var(--accent-text, #333333)' : '#aaaaaa',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Valor Fixo Direto
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModoFrequencia(true)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      border: isModoFrequencia ? '1px solid var(--accent-color, #ffe192)' : '1px solid rgba(255, 255, 255, 0.08)',
                      backgroundColor: isModoFrequencia ? 'var(--accent-color, #ffe192)' : 'rgba(255, 255, 255, 0.04)',
                      color: isModoFrequencia ? 'var(--accent-text, #333333)' : '#aaaaaa',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Por Frequência
                  </button>
                </div>
              </div>

              {/* Se estiver no modo Frequência */}
              {isModoFrequencia && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {/* Valor por Unidade */}
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', color: 'var(--accent-color, #ffe192)', fontSize: '12px', marginBottom: '4px', fontWeight: 'bold' }}>
                        Valor por Unidade / Consumo (R$)
                      </label>
                      <input
                        type="text"
                        value={valorUnitarioFormatado}
                        onChange={handleValorUnitarioChange}
                        placeholder="R$ 5,00"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-color, #737373)',
                          backgroundColor: 'var(--card-bg, #3e3e3e)',
                          color: 'var(--accent-color, #ffe192)',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    {/* Quantidade por Vez */}
                    <div style={{ width: '90px' }}>
                      <label style={{ display: 'block', color: 'var(--accent-color, #ffe192)', fontSize: '12px', marginBottom: '4px', fontWeight: 'bold' }}>
                        Qtd / Vez
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={qtdOcorrencias}
                        onChange={(e) => setQtdOcorrencias(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-color, #737373)',
                          backgroundColor: 'var(--card-bg, #3e3e3e)',
                          color: 'var(--text-primary, #ffffff)',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  {/* Seleção de Frequência */}
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-primary, #dddddd)', fontSize: '12px', marginBottom: '4px' }}>
                      Frequência de Ocorrência
                    </label>
                    <select
                      value={tipoFrequencia}
                      onChange={(e) => setTipoFrequencia(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color, #737373)',
                        backgroundColor: 'var(--card-bg, #3e3e3e)',
                        color: 'var(--text-primary, #ffffff)',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="diario_uteis">Diário - Dias Úteis (Seg a Sex - ~22 dias/mês)</option>
                      <option value="diario_todos">Diário - Todos os Dias (30 dias/mês)</option>
                      <option value="semanal">Semanal (X vezes por semana - ~4.33x/mês)</option>
                      <option value="mensal">Mensal (X vezes por mês)</option>
                    </select>
                  </div>

                  {/* Resumo explicativo */}
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--accent-color, #ffe192)',
                      backgroundColor: 'rgba(0,0,0,0.25)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                    }}
                  >
                    Cálculo: <strong>{valorUnitarioFormatado}</strong> × <strong>{qtdOcorrencias}</strong> ({
                      tipoFrequencia === 'diario_uteis' ? '22 dias úteis' :
                      tipoFrequencia === 'diario_todos' ? '30 dias' :
                      tipoFrequencia === 'semanal' ? `${(qtdOcorrencias * 4.33).toFixed(1)}x por mês` :
                      `${qtdOcorrencias}x por mês`
                    }) = <strong>{valorFormatado} / mês</strong>
                  </div>
                </div>
              )}

              {/* Mês e Ano Fim da Recorrência (Lado a Lado) */}
              <div style={{ marginTop: '4px' }}>
                <label style={{ display: 'block', color: 'var(--text-primary, #dddddd)', fontSize: '12px', marginBottom: '4px' }}>
                  Registrar este lançamento recorrente até:
                </label>

                <div style={{ display: 'flex', gap: '10px' }}>
                  {/* Seletor de Mês */}
                  <div style={{ flex: 1.5, position: 'relative' }} ref={mesFimRef}>
                    <div
                      onClick={() => setIsMesFimOpen(!isMesFimOpen)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: isMesFimOpen ? '1px solid var(--accent-color, #ffe192)' : '1px solid var(--border-color, #737373)',
                        backgroundColor: 'var(--card-bg, #3e3e3e)',
                        color: 'var(--accent-color, #ffe192)',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        boxSizing: 'border-box',
                        userSelect: 'none',
                        transition: 'border 0.2s',
                      }}
                    >
                      <span>
                        Até {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][MESES_LISTA.indexOf(mesFimRecorrencia)]} ({mesFimRecorrencia})
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--accent-color, #ffe192)', marginLeft: '6px' }}>
                        {isMesFimOpen ? '▲' : '▼'}
                      </span>
                    </div>

                    {isMesFimOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 6px)',
                          left: 0,
                          right: 0,
                          zIndex: 200,
                          backgroundColor: 'var(--card-bg, #2e2e2e)',
                          border: '1px solid var(--accent-color, #ffe192)',
                          borderRadius: '14px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                          maxHeight: '150px',
                          overflowY: 'auto',
                          padding: '4px 0',
                        }}
                      >
                        {MESES_LISTA.map((m, index) => {
                          const nomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
                          const isHovered = hoveredMesFim === m;
                          const isSelected = mesFimRecorrencia === m;
                          const labelText = `Até ${nomes[index]} (${m})`;
                          return (
                            <div
                              key={m}
                              onMouseEnter={() => setHoveredMesFim(m)}
                              onMouseLeave={() => setHoveredMesFim(null)}
                              onClick={() => {
                                setMesFimRecorrencia(m);
                                setIsMesFimOpen(false);
                              }}
                              style={{
                                padding: '7px 12px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                color: isHovered || isSelected ? 'var(--accent-color, #ffe192)' : 'var(--text-primary, #ffffff)',
                                backgroundColor: isHovered || isSelected ? 'var(--surface-hover, rgba(255, 225, 146, 0.15))' : 'transparent',
                                fontWeight: isSelected ? 'bold' : 'normal',
                                transition: 'all 0.15s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <span>{labelText}</span>
                              {isSelected && <span style={{ color: 'var(--accent-color, #ffe192)', fontSize: '12px' }}>✓</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Seletor de Ano */}
                  <div style={{ flex: 1 }}>
                    <select
                      value={anoFimRecorrencia}
                      onChange={(e) => setAnoFimRecorrencia(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color, #737373)',
                        backgroundColor: 'var(--card-bg, #3e3e3e)',
                        color: 'var(--accent-color, #ffe192)',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        cursor: 'pointer',
                      }}
                    >
                      {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() + i).map((ano) => (
                        <option key={ano} value={ano.toString()}>
                          Ano {ano}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-PAINEL SE FOR COMPRA PARCELADA */}
          {isParcelado && (
            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--accent-color, #ffe192)', fontWeight: 'bold' }}>
                  Modo de Cálculo do Parcelamento
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setModoParcelamento('total_compra')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      border: modoParcelamento === 'total_compra' ? '1px solid var(--accent-color, #ffe192)' : '1px solid rgba(255, 255, 255, 0.08)',
                      backgroundColor: modoParcelamento === 'total_compra' ? 'var(--accent-color, #ffe192)' : 'rgba(255, 255, 255, 0.04)',
                      color: modoParcelamento === 'total_compra' ? 'var(--accent-text, #333333)' : '#aaaaaa',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Por Valor Total
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoParcelamento('valor_parcela')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      border: modoParcelamento === 'valor_parcela' ? '1px solid var(--accent-color, #ffe192)' : '1px solid rgba(255, 255, 255, 0.08)',
                      backgroundColor: modoParcelamento === 'valor_parcela' ? 'var(--accent-color, #ffe192)' : 'rgba(255, 255, 255, 0.04)',
                      color: modoParcelamento === 'valor_parcela' ? 'var(--accent-text, #333333)' : '#aaaaaa',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Valor da Parcela Direto
                  </button>
                </div>
              </div>

              {/* Campo principal do modo */}
              {modoParcelamento === 'total_compra' ? (
                <div>
                  <label style={{ display: 'block', color: 'var(--text-primary, #dddddd)', fontSize: '12px', marginBottom: '4px' }}>
                    Valor Total da Compra (R$)
                  </label>
                  <input
                    type="text"
                    value={valorTotalCompraFormatado}
                    onChange={handleValorTotalCompraChange}
                    placeholder="R$ 0,00"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color, #737373)',
                      backgroundColor: 'var(--card-bg, #3e3e3e)',
                      color: 'var(--accent-color, #ffe192)',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', color: 'var(--text-primary, #dddddd)', fontSize: '12px', marginBottom: '4px' }}>
                    Valor de Cada Parcela Mensal (R$)
                  </label>
                  <input
                    type="text"
                    value={valorParcelaDiretoFormatado}
                    onChange={handleValorParcelaDiretoChange}
                    placeholder="R$ 0,00"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color, #737373)',
                      backgroundColor: 'var(--card-bg, #3e3e3e)',
                      color: 'var(--accent-color, #ffe192)',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              {/* Inputs de Parcela Atual e Total de Parcelas */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', color: 'var(--text-primary, #dddddd)', fontSize: '12px', marginBottom: '4px' }}>
                    Parcela Atual
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={totalParcelas || 48}
                    value={parcelaAtual}
                    onChange={(e) => setParcelaAtual(e.target.value)}
                    onBlur={() => {
                      if (!parcelaAtual || parseInt(parcelaAtual, 10) < 1) {
                        setParcelaAtual(1);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color, #737373)',
                      backgroundColor: 'var(--card-bg, #3e3e3e)',
                      color: 'var(--text-primary, #ffffff)',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', color: 'var(--text-primary, #dddddd)', fontSize: '12px', marginBottom: '4px' }}>
                    Total de Parcelas
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="48"
                    value={totalParcelas}
                    onChange={(e) => setTotalParcelas(e.target.value)}
                    onBlur={() => {
                      if (!totalParcelas || parseInt(totalParcelas, 10) < 1) {
                        setTotalParcelas(1);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color, #737373)',
                      backgroundColor: 'var(--card-bg, #3e3e3e)',
                      color: 'var(--text-primary, #ffffff)',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Selo Informativo do Valor Calculado por Parcela */}
              {totalParcelas > 0 && (
                <div
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.25)',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    borderLeft: '3px solid var(--accent-color, #ffe192)',
                  }}
                >
                  <span style={{ fontSize: '12px', color: 'var(--accent-color, #ffe192)', display: 'block' }}>
                    Resultará em: <strong>{totalParcelas}x de {(
                      modoParcelamento === 'total_compra'
                        ? (valorTotalCompraNumerico / Math.max(1, parseInt(totalParcelas, 10) || 1))
                        : valorParcelaDiretoNumerico
                    ).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / mês</strong> (Total {valorFormatado})
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 4. Valor Total (R$) e Data/Hora */}
          <div style={{ display: 'flex', gap: '17px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ color: 'var(--text-primary, #dddddd)', fontSize: '13px' }}>
                  Valor Total (R$)
                </label>
                {(isModoFrequencia || isParcelado) && (
                  <span style={{ fontSize: '11px', color: 'var(--accent-color, #ffe192)', fontWeight: 'bold' }}>
                    {isModoFrequencia ? 'Calculado por Frequência' : 'Calculado das Parcelas'}
                  </span>
                )}
              </div>
              <input
                type="text"
                value={valorFormatado}
                onChange={handleValorChange}
                disabled={isModoFrequencia || isParcelado}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  border: (isModoFrequencia || isParcelado) ? '1px solid var(--accent-color, #ffe192)' : '1px solid var(--border-color, #737373)',
                  backgroundColor: (isModoFrequencia || isParcelado) ? 'var(--card-bg, #3e3e3e)' : 'var(--surface-bg, #3e3e3e)',
                  color: 'var(--accent-color, #ffe192)',
                  fontSize: '17px',
                  fontWeight: 'bold',
                  outline: 'none',
                  boxSizing: 'border-box',
                  cursor: isModoFrequencia ? 'not-allowed' : 'text',
                }}
                required
              />
            </div>

            {/* CAMPO DE DATA E HORA */}
            {mesSelecionado === 'Todos' && (
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: 'var(--text-primary, #dddddd)', fontSize: '13px', marginBottom: '6px' }}>
                  Data e Hora
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
                    border: '1px solid var(--border-color, #737373)',
                    backgroundColor: 'var(--surface-bg, #3e3e3e)',
                    color: 'var(--text-primary, #ffffff)',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                  }}
                  required
                />
              </div>
            )}
          </div>

          {/* 5. Categoria e Etiqueta */}
          <div style={{ display: 'flex', gap: '17px' }}>
            {/* CATEGORIA DROPDOWN */}
            <div style={{ flex: 1, position: 'relative' }} ref={catRef}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', height: '18px' }}>
                <label style={{ color: 'var(--text-primary, #dddddd)', fontSize: '13px', lineHeight: '18px' }}>
                  Categoria
                </label>
              </div>

              <div
                onClick={() => setIsCatOpen(!isCatOpen)}
                style={{
                  width: '100%',
                  height: '44px',
                  padding: '0 14px',
                  borderRadius: '14px',
                  border: isCatOpen ? '1px solid var(--accent-color, #ffe192)' : '1px solid var(--border-color, #737373)',
                  backgroundColor: 'var(--surface-bg, #3e3e3e)',
                  color: classificacao ? 'var(--text-primary, #ffffff)' : 'var(--text-secondary, #aaaaaa)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxSizing: 'border-box',
                  userSelect: 'none',
                  transition: 'border 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  {(() => {
                    const catObj = categorias.find((c) => c.nome.toLowerCase() === (classificacao || '').toLowerCase());
                    if (catObj) {
                      return (
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: catObj.cor || 'var(--accent-color, #ffe192)',
                            display: 'inline-block',
                            flexShrink: 0,
                          }}
                        />
                      );
                    }
                    return null;
                  })()}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {classificacao || 'Selecione uma Categoria...'}
                  </span>
                </div>
                <span style={{ fontSize: '10px', color: 'var(--accent-color, #ffe192)', marginLeft: '6px' }}>
                  {isCatOpen ? '▲' : '▼'}
                </span>
              </div>

              {isCatOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    right: 0,
                    zIndex: 200,
                    backgroundColor: 'var(--card-bg, #2e2e2e)',
                    border: '1px solid var(--accent-color, #ffe192)',
                    borderRadius: '14px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    padding: '6px 0',
                  }}
                >
                  {categorias.map((cat) => {
                    const isHovered = hoveredCat === cat.nome;
                    const isSelected = classificacao === cat.nome;
                    return (
                      <div
                        key={cat.id || cat.nome}
                        onMouseEnter={() => setHoveredCat(cat.nome)}
                        onMouseLeave={() => setHoveredCat(null)}
                        onClick={() => {
                          setClassificacao(cat.nome);
                          setIsCatOpen(false);
                        }}
                        style={{
                          padding: '8px 14px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          backgroundColor: isSelected ? 'var(--surface-bg, #525252)' : isHovered ? 'var(--surface-hover, rgba(255,255,255,0.08))' : 'transparent',
                          color: isSelected ? 'var(--accent-color, #ffe192)' : 'var(--text-primary, #ffffff)',
                          fontWeight: isSelected ? 'bold' : 'normal',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'background-color 0.15s',
                        }}
                      >
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: cat.cor || 'var(--accent-color, #ffe192)',
                            display: 'inline-block',
                            flexShrink: 0,
                          }}
                        />
                        <span>{cat.nome}</span>
                      </div>
                    );
                  })}

                  <div
                    onClick={() => {
                      setIsCatOpen(false);
                      setIsCategoryModalOpen(true);
                    }}
                    style={{
                      padding: '9px 14px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: 'var(--accent-color, #ffe192)',
                      backgroundColor: 'rgba(255, 225, 146, 0.08)',
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                      fontWeight: 'bold',
                      textAlign: 'center',
                    }}
                  >
                    + Gerenciar Categorias
                  </div>
                </div>
              )}
            </div>

            {/* ETIQUETA CUSTOM COMBOBOX */}
            <div style={{ flex: 1, position: 'relative' }} ref={etiqRef}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', height: '18px' }}>
                <label style={{ display: 'block', color: 'var(--text-primary, #dddddd)', fontSize: '13px', lineHeight: '18px' }}>
                  Etiqueta
                </label>
              </div>

              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type="text"
                  value={etiqueta}
                  onFocus={() => {
                    setEtiqueta('');
                    setIsEtiqOpen(true);
                  }}
                  onChange={(e) => {
                    setEtiqueta(e.target.value);
                    setIsEtiqOpen(true);
                  }}
                  placeholder="Ex: Geral, Nubank..."
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 32px 0 14px',
                    borderRadius: '14px',
                    border: isEtiqOpen ? '1px solid var(--accent-color, #ffe192)' : '1px solid var(--border-color, #737373)',
                    backgroundColor: 'var(--surface-bg, #3e3e3e)',
                    color: 'var(--text-primary, #ffffff)',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border 0.2s',
                  }}
                />
                <span
                  onClick={() => setIsEtiqOpen(!isEtiqOpen)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '10px',
                    color: 'var(--accent-color, #ffe192)',
                    cursor: 'pointer',
                  }}
                >
                  {isEtiqOpen ? '▲' : '▼'}
                </span>
              </div>

              {isEtiqOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    right: 0,
                    zIndex: 200,
                    backgroundColor: 'var(--card-bg, #2e2e2e)',
                    border: '1px solid var(--accent-color, #ffe192)',
                    borderRadius: '14px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                    maxHeight: '150px',
                    overflowY: 'auto',
                    padding: '6px 0',
                  }}
                >
                  {etiquetaList
                    .filter((etiq) => etiq.toLowerCase().includes((etiqueta || '').toLowerCase()))
                    .map((etiq) => {
                      const isHovered = hoveredEtiq === etiq;
                      const isSelected = etiqueta === etiq;
                      return (
                        <div
                          key={etiq}
                          onMouseEnter={() => setHoveredEtiq(etiq)}
                          onMouseLeave={() => setHoveredEtiq(null)}
                          onClick={() => {
                            setEtiqueta(etiq);
                            setIsEtiqOpen(false);
                          }}
                          style={{
                            padding: '8px 14px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            color: isHovered || isSelected ? 'var(--accent-color, #ffe192)' : 'var(--text-primary, #ffffff)',
                            backgroundColor: isHovered || isSelected ? 'var(--surface-hover, rgba(255, 225, 146, 0.15))' : 'transparent',
                            fontWeight: isSelected ? 'bold' : 'normal',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span>{etiq}</span>
                          {isSelected && <span style={{ color: 'var(--accent-color, #ffe192)', fontSize: '12px' }}>✓</span>}
                        </div>
                      );
                    })}

                  {etiqueta && !etiquetaList.some((e) => e.toLowerCase() === etiqueta.toLowerCase()) && (
                    <div
                      onMouseEnter={() => setHoveredEtiq('__NOVA__')}
                      onMouseLeave={() => setHoveredEtiq(null)}
                      onClick={() => setIsEtiqOpen(false)}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: 'var(--accent-color, #ffe192)',
                        backgroundColor: hoveredEtiq === '__NOVA__' ? 'var(--surface-hover, rgba(255, 225, 146, 0.2))' : 'rgba(255, 225, 146, 0.08)',
                        borderTop: '1px solid var(--border-color, #444444)',
                        fontWeight: 'bold',
                      }}
                    >
                      + Usar nova etiqueta: "{etiqueta}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 6. Descrição / Observações (Máx. 200 caracteres) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ color: 'var(--text-primary, #dddddd)', fontSize: '13px' }}>Descrição / Observações (Opcional)</label>
              <span style={{ fontSize: '11px', color: (descricao || '').length > 180 ? 'var(--accent-color, #ffe192)' : 'var(--text-secondary, #aaaaaa)' }}>
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
                border: '1px solid var(--border-color, #737373)',
                backgroundColor: 'var(--surface-bg, #3e3e3e)',
                color: 'var(--text-primary, #ffffff)',
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
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={handleCloseModal}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                color: 'var(--text-primary, #ffffff)',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '16px',
                border: 'none',
                backgroundColor: isSubmitting ? '#999999' : 'var(--accent-color, #ffe192)',
                color: isSubmitting ? '#666666' : 'var(--accent-text, #333333)',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: isSubmitting ? 'none' : '0 4px 12px rgba(0,0,0,0.3)',
                opacity: isSubmitting ? 0.7 : 1,
                transition: 'all 0.15s ease',
              }}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Lançamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
