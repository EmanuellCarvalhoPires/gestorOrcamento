import React, { useState, useEffect } from 'react';
import { useBudget } from '../contexts/BudgetContext';
import { apiService } from '../services/api';
import iconLixeira from '../../images/lixeira-de-reciclagem.png';
import { parseNubankCsv } from '../utils/nubankCsvParser';

export default function SettingsModal({
  isOpen,
  onClose,
  onExportCSV,
  onExportPDF,
  onOpenCreateAccount,
  initialTab = 'perfil',
}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'perfil');
  const [contaParaDeletar, setContaParaDeletar] = useState(null);
  const [erroDeletarConta, setErroDeletarConta] = useState('');

  const {
    usuarioLogado,
    sincronizarUsuarioLogado,
    contas = [],
    contaAtiva,
    selecionarConta,
    deletarConta,
    isCaixinhaAtiva,
    toggleCaixinha,
    saldoInicialCaixinha,
    atualizarSaldoInicialCaixinha,
    caixinhaRendimentoTaxa = 0,
    caixinhaRendimentoPeriodo = 'mensal',
    atualizarRendimentoCaixinha,
    saldoCaixinhaAcumulado,
    isComercial,
    mesSelecionado,
    anoSelecionado,
    excluirContaUsuario,
    paletaCores,
    aplicarPaletaCores,
    PALETAS_PREDEFINIDAS,
    receitas = [],
    despesas = [],
    transacoesTabela = [],
    categorias = [],
    importarTransacoesNubankCSV,
    updateDisponivel,
    updateStatus,
    verificandoUpdate,
    mensagemUpdate,
    verificarAtualizacoesManual,
    forcarBuscaEAtualizacao,
    setIsUpdateModalOpen,
    baixarAtualizacaoNativa,
    reiniciarEAplicarAtualizacao,
  } = useBudget();

  const [customCores, setCustomCores] = useState(paletaCores || {});
  const [salvoPaletaFeedback, setSalvoPaletaFeedback] = useState(false);

  // Estados para Importação de CSV do Nubank
  const [csvFile, setCsvFile] = useState(null);
  const [parsedCsvResult, setParsedCsvResult] = useState(null);
  const [categoriaImportacao, setCategoriaImportacao] = useState('Nubank');
  const [contaDestinoId, setContaDestinoId] = useState(contaAtiva?.id || null);
  const [filtroImport, setFiltroImport] = useState('todos');
  const [buscaImport, setBuscaImport] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [importandoNubank, setImportandoNubank] = useState(false);
  const [importFeedbackNubank, setImportFeedbackNubank] = useState(null);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (contaAtiva?.id && !contaDestinoId) {
      setContaDestinoId(contaAtiva.id);
    }
  }, [contaAtiva]);

  const recalcularEstatisticas = (novosItens) => {
    let qtdNovos = 0;
    let qtdDuplicados = 0;
    let qtdIgnorados = 0;
    let valorTotalNovos = 0;
    let valorTotalReceitas = 0;
    let valorTotalDespesas = 0;

    novosItens.forEach((it) => {
      if (it.isDuplicado) {
        qtdDuplicados++;
      } else if (it.isIgnorado && it.selecionado === false) {
        qtdIgnorados++;
      } else if (it.selecionado !== false) {
        qtdNovos++;
        valorTotalNovos += it.valor || 0;
        if (it.tipo === 'receitas') {
          valorTotalReceitas += it.valor || 0;
        } else {
          valorTotalDespesas += it.valor || 0;
        }
      } else {
        qtdIgnorados++;
      }
    });

    setParsedCsvResult((prev) => ({
      ...prev,
      itens: novosItens,
      totalItens: novosItens.length,
      qtdNovos,
      qtdDuplicados,
      qtdIgnorados,
      valorTotalNovos,
      valorTotalReceitas,
      valorTotalDespesas,
    }));
  };

  const processarTextoCsv = (text, fileObj) => {
    setCsvFile(fileObj);
    setImportFeedbackNubank(null);
    const allExisting = [...receitas, ...despesas, ...transacoesTabela];
    const res = parseNubankCsv(text, allExisting);
    setParsedCsvResult(res);
  };

  const handleCsvFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      processarTextoCsv(e.target.result, file);
    };
    reader.readAsText(file);
  };

  const handleDropCsv = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      processarTextoCsv(event.target.result, file);
    };
    reader.readAsText(file);
  };

  const toggleItemSelecionado = (idTemp) => {
    if (!parsedCsvResult?.itens) return;
    const novosItens = parsedCsvResult.itens.map((it) => {
      if (it.idTemp === idTemp) {
        return { ...it, selecionado: it.selecionado === false ? true : false };
      }
      return it;
    });
    recalcularEstatisticas(novosItens);
  };

  const toggleTodosSelecionados = (marcar) => {
    if (!parsedCsvResult?.itens) return;
    const novosItens = parsedCsvResult.itens.map((it) => {
      if (it.isDuplicado) return it;
      if (it.isIgnorado && marcar) return it; // Não seleciona resgates ignorados ao marcar todos
      return { ...it, selecionado: marcar };
    });
    recalcularEstatisticas(novosItens);
  };

  const alterarItemPropriedade = (idTemp, campo, valor) => {
    if (!parsedCsvResult?.itens) return;
    const novosItens = parsedCsvResult.itens.map((it) => {
      if (it.idTemp === idTemp) {
        return { ...it, [campo]: valor };
      }
      return it;
    });
    recalcularEstatisticas(novosItens);
  };

  const handleConfirmarImportacaoNubank = async () => {
    if (!parsedCsvResult?.success || !parsedCsvResult.itens) return;
    setImportandoNubank(true);
    setImportFeedbackNubank(null);

    const itensParaEnviar = parsedCsvResult.itens
      .filter((item) => !item.isDuplicado && item.selecionado !== false)
      .map((item) => ({
        ...item,
        classificacao: item.classificacao || categoriaImportacao || 'Nubank',
      }));

    if (itensParaEnviar.length === 0) {
      setImportandoNubank(false);
      setImportFeedbackNubank({
        tipo: 'erro',
        mensagem: 'Nenhum lançamento novo selecionado para importação.',
      });
      return;
    }

    const contaDestinoFinal = contaDestinoId || contaAtiva?.id;
    const contaSelecionadaObj = contas.find((c) => c.id === contaDestinoFinal) || contaAtiva;
    const res = await importarTransacoesNubankCSV(itensParaEnviar, contaDestinoFinal);
    setImportandoNubank(false);

    if (res?.success) {
      setImportFeedbackNubank({
        tipo: 'sucesso',
        mensagem: `🎉 Sucesso! ${res.inseridosCount || itensParaEnviar.length} lançamentos foram importados para a conta "${contaSelecionadaObj?.nome || 'ativa'}".`,
      });
      setCsvFile(null);
      setParsedCsvResult(null);
    } else {
      setImportFeedbackNubank({
        tipo: 'erro',
        mensagem: res?.error || 'Erro ao importar transações.',
      });
    }
  };

  useEffect(() => {
    if (paletaCores) {
      setCustomCores(paletaCores);
    }
  }, [paletaCores, isOpen]);

  const [exportMes, setExportMes] = useState(mesSelecionado || 'Jan');
  const [exportAno, setExportAno] = useState(anoSelecionado || '2026');

  // Modos de Filtro de Período de Exportação
  const [modoExportacao, setModoExportacao] = useState('mes_a_mes'); // 'mes_a_mes', 'ano_a_ano', 'intervalo'
  const [intervaloMesInicio, setIntervaloMesInicio] = useState('Jan');
  const [intervaloAnoInicio, setIntervaloAnoInicio] = useState(anoSelecionado || '2026');
  const [intervaloMesFim, setIntervaloMesFim] = useState('Dez');
  const [intervaloAnoFim, setIntervaloAnoFim] = useState(anoSelecionado || '2026');

  // Estados da Exclusão Permanente de Perfil/Conta
  const [isConfirmExcluirContaOpen, setIsConfirmExcluirContaOpen] = useState(false);
  const [confirmTextoInput, setConfirmTextoInput] = useState('');
  const [erroExcluirConta, setErroExcluirConta] = useState('');
  const [carregandoExclusao, setCarregandoExclusao] = useState(false);

  useEffect(() => {
    if (mesSelecionado) setExportMes(mesSelecionado);
    if (anoSelecionado) {
      setExportAno(anoSelecionado);
      setIntervaloAnoInicio(anoSelecionado);
      setIntervaloAnoFim(anoSelecionado);
    }
  }, [mesSelecionado, anoSelecionado]);

  const isAdmin = usuarioLogado?.funcao === 'admin';

  const [listaUsuariosAdmin, setListaUsuariosAdmin] = useState([]);
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false);
  const [usuarioParaDeletar, setUsuarioParaDeletar] = useState(null);
  const [mensagemAdmin, setMensagemAdmin] = useState('');

  const carregarUsuariosAdmin = async () => {
    if (!isAdmin || !usuarioLogado) return;
    setCarregandoUsuarios(true);
    setMensagemAdmin('');
    try {
      const res = await apiService.listarUsuariosAdmin({ usuarioId: usuarioLogado.id });
      if (res?.success) {
        setListaUsuariosAdmin(res.usuarios || []);
      } else {
        setMensagemAdmin(res?.error || 'Erro ao carregar usuários.');
      }
    } catch (err) {
      console.error('Erro ao carregar usuários admin:', err);
    }
    setCarregandoUsuarios(false);
  };

  useEffect(() => {
    if (isOpen && activeTab === 'usuarios' && isAdmin) {
      carregarUsuariosAdmin();
    }
  }, [isOpen, activeTab]);

  const formatarCurrencyValue = (valNumerico) => {
    if (!valNumerico && valNumerico !== 0) return '';
    return Number(valNumerico).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const [valorInicialInput, setValorInicialInput] = useState(
    saldoInicialCaixinha ? formatarCurrencyValue(saldoInicialCaixinha) : ''
  );
  const [salvoFeedback, setSalvoFeedback] = useState(false);

  const [rendimentoTaxaInput, setRendimentoTaxaInput] = useState(
    caixinhaRendimentoTaxa ? caixinhaRendimentoTaxa.toString() : ''
  );
  const [rendimentoPeriodoInput, setRendimentoPeriodoInput] = useState(
    caixinhaRendimentoPeriodo || 'mensal'
  );
  const [salvoRendimentoFeedback, setSalvoRendimentoFeedback] = useState(false);

  useEffect(() => {
    setValorInicialInput(saldoInicialCaixinha ? formatarCurrencyValue(saldoInicialCaixinha) : '');
  }, [saldoInicialCaixinha]);

  useEffect(() => {
    setRendimentoTaxaInput(caixinhaRendimentoTaxa ? caixinhaRendimentoTaxa.toString() : '');
    setRendimentoPeriodoInput(caixinhaRendimentoPeriodo || 'mensal');
  }, [caixinhaRendimentoTaxa, caixinhaRendimentoPeriodo]);

  const handleValorInicialChange = (e) => {
    const apenasDigitos = e.target.value.replace(/\D/g, '');
    if (!apenasDigitos) {
      setValorInicialInput('');
      return;
    }
    const numero = Number(apenasDigitos) / 100;
    setValorInicialInput(formatarCurrencyValue(numero));
  };

  const handleSalvarSaldoInicial = () => {
    const apenasDigitos = (valorInicialInput || '').replace(/\D/g, '');
    const num = apenasDigitos ? Number(apenasDigitos) / 100 : 0;
    atualizarSaldoInicialCaixinha(num);
    setSalvoFeedback(true);
    setTimeout(() => setSalvoFeedback(false), 2500);
  };

  const handleSalvarRendimento = () => {
    const cleanTaxa = parseFloat((rendimentoTaxaInput || '0').replace(',', '.')) || 0;
    if (atualizarRendimentoCaixinha) {
      atualizarRendimentoCaixinha({
        taxa: cleanTaxa,
        periodo: rendimentoPeriodoInput,
      });
    }
    setSalvoRendimentoFeedback(true);
    setTimeout(() => setSalvoRendimentoFeedback(false), 2500);
  };

  const taxaNumCalculada = parseFloat((rendimentoTaxaInput || '0').replace(',', '.')) || 0;
  const taxaMensalEquivalente = rendimentoPeriodoInput === 'mensal'
    ? taxaNumCalculada
    : ((Math.pow(1 + (taxaNumCalculada / 100), 1 / 12) - 1) * 100);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--card-bg, #545454)',
          borderRadius: '24px',
          width: '94%',
          maxWidth: '1140px',
          height: '760px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
          border: '1px solid var(--border-color, #666666)',
          overflow: 'hidden',
          color: 'var(--text-primary, #ffffff)',
        }}
      >
        {/* Cabeçalho do Modal */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--header-bg, #3a3a3a)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary, #ffffff)', fontSize: '19px', fontWeight: 'bold' }}>
              Configurações
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary, #aaaaaa)',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '8px',
              transition: 'color 0.2s, background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.target.style.color = 'var(--text-primary, #ffffff)';
              e.target.style.backgroundColor = 'var(--surface-hover, #555555)';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = 'var(--text-secondary, #aaaaaa)';
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            ✕
          </button>
        </div>

        {/* Corpo do Modal: Sidebar + Conteúdo */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Menu Lateral / Lista de Opções */}
          <div
            style={{
              width: '220px',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '16px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: '600',
                color: 'var(--text-secondary, #9e9e9e)',
                textTransform: 'uppercase',
                padding: '4px 12px',
                marginBottom: '4px',
                letterSpacing: '0.6px',
              }}
            >
              Opções
            </div>

            {/* Opção Meu Perfil */}
            <button
              type="button"
              onClick={() => setActiveTab('perfil')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: activeTab === 'perfil' ? 'rgba(255, 225, 146, 0.12)' : 'transparent',
                color: activeTab === 'perfil' ? 'var(--accent-color, #ffe192)' : 'var(--text-primary, #ffffff)',
                fontWeight: activeTab === 'perfil' ? 'bold' : '500',
                fontSize: '13.5px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <span>Meu Perfil</span>
              {activeTab === 'perfil' && (
                <span style={{ fontSize: '10px', color: 'var(--accent-color, #ffe192)' }}>●</span>
              )}
            </button>

            {/* Opção Aparência & Cores */}
            <button
              type="button"
              onClick={() => setActiveTab('aparencia')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: activeTab === 'aparencia' ? 'rgba(255, 225, 146, 0.12)' : 'transparent',
                color: activeTab === 'aparencia' ? 'var(--accent-color, #ffe192)' : 'var(--text-primary, #ffffff)',
                fontWeight: activeTab === 'aparencia' ? 'bold' : '500',
                fontSize: '13.5px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <span>Aparência & Cores</span>
              {activeTab === 'aparencia' && (
                <span style={{ fontSize: '10px', color: 'var(--accent-color, #ffe192)' }}>●</span>
              )}
            </button>

            {/* Opção Gestão de Usuários (Apenas para Admin) */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('usuarios');
                  carregarUsuariosAdmin();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: activeTab === 'usuarios' ? 'rgba(255, 225, 146, 0.12)' : 'transparent',
                  color: activeTab === 'usuarios' ? 'var(--accent-color, #ffe192)' : 'var(--text-primary, #ffffff)',
                  fontWeight: activeTab === 'usuarios' ? 'bold' : '500',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>Gestão de Usuários</span>
                <span
                  style={{
                    fontSize: '9.5px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: activeTab === 'usuarios' ? 'var(--accent-color, #ffe192)' : '#aaaaaa',
                    padding: '2px 6px',
                    borderRadius: '6px',
                    fontWeight: '600',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  Admin
                </span>
              </button>
            )}

            {/* Opção Caixinha */}
            <button
              type="button"
              onClick={() => setActiveTab('caixinha')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: activeTab === 'caixinha' ? 'rgba(255, 225, 146, 0.12)' : 'transparent',
                color: activeTab === 'caixinha' ? 'var(--accent-color, #ffe192)' : 'var(--text-primary, #ffffff)',
                fontWeight: activeTab === 'caixinha' ? 'bold' : '500',
                fontSize: '13.5px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <span>Caixinha</span>
              <span
                style={{
                  fontSize: '9.5px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: isCaixinhaAtiva ? '#50fa7b' : '#888888',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                {isCaixinhaAtiva ? 'Ativa' : 'Inativa'}
              </span>
            </button>

            {/* Opção Exportar */}
            <button
              type="button"
              onClick={() => setActiveTab('exportar')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: activeTab === 'exportar' ? 'rgba(255, 225, 146, 0.12)' : 'transparent',
                color: activeTab === 'exportar' ? 'var(--accent-color, #ffe192)' : 'var(--text-primary, #ffffff)',
                fontWeight: activeTab === 'exportar' ? 'bold' : '500',
                fontSize: '13.5px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <span>Exportar Dados</span>
              {activeTab === 'exportar' && (
                <span style={{ fontSize: '10px', color: 'var(--accent-color, #ffe192)' }}>●</span>
              )}
            </button>

            {/* Opção Importar Nubank (CSV) */}
            <button
              type="button"
              onClick={() => setActiveTab('importar_nubank')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: activeTab === 'importar_nubank' ? 'rgba(255, 225, 146, 0.12)' : 'transparent',
                color: activeTab === 'importar_nubank' ? 'var(--accent-color, #ffe192)' : 'var(--text-primary, #ffffff)',
                fontWeight: activeTab === 'importar_nubank' ? 'bold' : '500',
                fontSize: '13.5px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <span>Importar Nubank</span>
              {activeTab === 'importar_nubank' && (
                <span style={{ fontSize: '10px', color: 'var(--accent-color, #ffe192)' }}>●</span>
              )}
            </button>

            {/* Opção Atualizações do Sistema */}
            <button
              type="button"
              onClick={() => setActiveTab('atualizacoes')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: activeTab === 'atualizacoes' ? 'rgba(255, 225, 146, 0.12)' : 'transparent',
                color: activeTab === 'atualizacoes' ? 'var(--accent-color, #ffe192)' : 'var(--text-primary, #ffffff)',
                fontWeight: activeTab === 'atualizacoes' ? 'bold' : '500',
                fontSize: '13.5px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <span>Atualizações</span>
              {updateDisponivel?.temAtualizacao ? (
                <span
                  style={{
                    fontSize: '9px',
                    backgroundColor: '#e76f51',
                    color: '#ffffff',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                  }}
                >
                  Nova
                </span>
              ) : activeTab === 'atualizacoes' ? (
                <span style={{ fontSize: '10px', color: 'var(--accent-color, #ffe192)' }}>●</span>
              ) : null}
            </button>
          </div>

          {/* Painel Principal de Conteúdo */}
          <div
            style={{
              flex: 1,
              padding: '24px',
              backgroundColor: 'var(--card-bg, #545454)',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Aba Meu Perfil */}
            {activeTab === 'perfil' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h4 style={{ margin: '0 0 6px 0', color: 'var(--accent-color, #ffe192)', fontSize: '18px', fontWeight: 'bold' }}>
                    Meu Perfil
                  </h4>
                  <p style={{ margin: 0, color: 'var(--text-secondary, #dddddd)', fontSize: '13px' }}>
                    Informações do usuário logado e gerenciamento das suas contas financeiras.
                  </p>
                </div>

                {/* Card de Informações do Usuário */}
                <div
                  style={{
                    backgroundColor: 'var(--surface-bg, #3e3e3e)',
                    borderRadius: '16px',
                    padding: '20px 24px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                  }}
                >
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-color, #ffe192)',
                      color: 'var(--accent-text, #333333)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '22px',
                      border: '2px solid rgba(255, 255, 255, 0.1)',
                      flexShrink: 0,
                    }}
                  >
                    {usuarioLogado?.nome ? usuarioLogado.nome.charAt(0).toUpperCase() : 'U'}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                    <div style={{ fontSize: '17px', fontWeight: 'bold', color: 'var(--text-primary, #ffffff)' }}>
                      {usuarioLogado?.nome || 'Usuário'}
                    </div>
                    
                    <div style={{ fontSize: '13px', color: 'var(--accent-color, #ffe192)', fontWeight: '500', wordBreak: 'break-all' }}>
                      {usuarioLogado?.email || 'Nenhum e-mail cadastrado'}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.06)',
                          color: '#e0e0e0',
                          padding: '3px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: '600',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                        }}
                      >
                        {isComercial ? 'Perfil Comercial' : 'Perfil Individual'}
                      </span>

                      {/* Classificação da Conta: Visível Apenas se for Administrador */}
                      {isAdmin && (
                        <span
                          style={{
                            backgroundColor: 'rgba(255, 225, 146, 0.12)',
                            color: 'var(--accent-color, #ffe192)',
                            padding: '3px 10px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: '600',
                            border: '1px solid rgba(255, 225, 146, 0.25)',
                          }}
                        >
                          Administrador (Admin)
                        </span>
                      )}

                      <span
                        style={{
                          backgroundColor: 'rgba(42, 157, 143, 0.15)',
                          color: '#50fa7b',
                          padding: '3px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: '600',
                          border: '1px solid rgba(42, 157, 143, 0.3)',
                        }}
                      >
                        Status: Ativo
                      </span>
                    </div>
                  </div>
                </div>

                {/* Seção Minhas Contas dentro do Perfil */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h4 style={{ margin: 0, color: 'var(--text-primary, #ffffff)', fontSize: '16px', fontWeight: 'bold' }}>
                        Minhas Contas ({contas.length})
                      </h4>
                      <p style={{ margin: '2px 0 0 0', color: 'var(--text-secondary, #cccccc)', fontSize: '12px' }}>
                        Alterne entre suas contas financeiras ou crie novas contas para seu orçamento.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenCreateAccount) onOpenCreateAccount();
                      }}
                      style={{
                        backgroundColor: 'var(--accent-color, #ffe192)',
                        color: 'var(--accent-text, #333333)',
                        border: 'none',
                        padding: '9px 18px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      + Criar Nova Conta
                    </button>
                  </div>

                  {/* Mensagem de Erro ao tentar excluir conta */}
                  {erroDeletarConta && (
                    <div
                      style={{
                        backgroundColor: 'rgba(217, 4, 41, 0.15)',
                        color: '#ff8585',
                        border: '1px solid rgba(217, 4, 41, 0.4)',
                        padding: '10px 16px',
                        borderRadius: '12px',
                        fontSize: '12.5px',
                        fontWeight: '600',
                        textAlign: 'center',
                      }}
                    >
                      {erroDeletarConta}
                    </div>
                  )}

                  {/* Lista de Contas Cadastradas */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {contas.map((c) => {
                      const ehAtiva = c.id === contaAtiva?.id;
                      const ehComercial = c.tipo === 'comercial';
                      return (
                        <div
                          key={c.id}
                          style={{
                            backgroundColor: ehAtiva ? 'rgba(255, 225, 146, 0.08)' : 'var(--surface-bg, #3e3e3e)',
                            borderRadius: '14px',
                            padding: '12px 18px',
                            border: ehAtiva ? '1px solid var(--accent-color, #ffe192)' : '1px solid rgba(255, 255, 255, 0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '14px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span
                              style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                backgroundColor: c.cor || 'var(--accent-color, #ffe192)',
                                flexShrink: 0,
                              }}
                            />
                            <div>
                              <strong style={{ color: 'var(--text-primary, #ffffff)', fontSize: '14px', display: 'block' }}>
                                {c.nome}
                              </strong>
                              <span style={{ color: 'var(--text-secondary, #aaaaaa)', fontSize: '12px', marginTop: '2px', display: 'block' }}>
                                {ehComercial ? 'Conta Comercial (PJ)' : 'Conta Individual'} {c.descricao ? `• ${c.descricao}` : ''}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                if (!ehAtiva) selecionarConta(c.id);
                              }}
                              style={{
                                backgroundColor: ehAtiva ? 'rgba(42, 157, 143, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                                color: ehAtiva ? '#50fa7b' : 'var(--text-primary, #ffffff)',
                                border: ehAtiva ? '1px solid rgba(42, 157, 143, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                                padding: '6px 14px',
                                borderRadius: '10px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: ehAtiva ? 'default' : 'pointer',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {ehAtiva ? '✓ Ativa' : 'Selecionar'}
                            </button>

                            {/* Botão Deletar Conta */}
                            <button
                              type="button"
                              onClick={() => {
                                if (contas.length <= 1) {
                                  setErroDeletarConta('Você não pode excluir a sua única conta cadastrada.');
                                  setTimeout(() => setErroDeletarConta(''), 4000);
                                  return;
                                }
                                setContaParaDeletar(c);
                              }}
                              title="Excluir esta conta"
                              style={{
                                backgroundColor: 'transparent',
                                border: '1px solid rgba(255, 107, 107, 0.3)',
                                borderRadius: '10px',
                                padding: '6px 10px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 107, 107, 0.12)';
                                e.currentTarget.style.borderColor = '#ff7b7b';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.borderColor = 'rgba(255, 107, 107, 0.3)';
                              }}
                            >
                              <img src={iconLixeira} alt="Excluir conta" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Zona de Perigo - Exclusão Permanente da Conta do Usuário */}
                <div
                  style={{
                    marginTop: '20px',
                    backgroundColor: 'rgba(230, 57, 70, 0.06)',
                    border: '1px solid rgba(230, 57, 70, 0.35)',
                    borderRadius: '16px',
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: '#ff6b6b' }}>
                    Zona de Perigo • Excluir Conta Permanentemente
                  </div>
                  <p style={{ margin: 0, color: '#cccccc', fontSize: '12px', lineHeight: '1.4' }}>
                    Ao excluir sua conta, todos os seus dados (contas financeiras, receitas, despesas, categorias, etiquetas e caixinha) serão deletados permanentemente. Esta ação é <strong>irreversível</strong>.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setConfirmTextoInput('');
                      setErroExcluirConta('');
                      setIsConfirmExcluirContaOpen(true);
                    }}
                    style={{
                      alignSelf: 'flex-start',
                      padding: '9px 18px',
                      borderRadius: '10px',
                      border: '1px solid rgba(230, 57, 70, 0.5)',
                      backgroundColor: 'transparent',
                      color: '#ff6b6b',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e63946';
                      e.currentTarget.style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#ff6b6b';
                    }}
                  >
                    Excluir Minha Conta por Completo
                  </button>
                </div>
              </div>
            )}

            {/* Aba Gestão de Usuários (Visível Exclusivamente para Admin) */}
            {activeTab === 'usuarios' && isAdmin && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h4 style={{ margin: 0, color: 'var(--accent-color, #ffe192)', fontSize: '18px', fontWeight: 'bold' }}>
                      Gestão de Usuários ({listaUsuariosAdmin.length})
                    </h4>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary, #cccccc)', fontSize: '13px' }}>
                      Painel exclusivo de administração para controlar, gerenciar permissões e excluir usuários cadastrados.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={carregarUsuariosAdmin}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      color: 'var(--text-primary, #ffffff)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      padding: '8px 14px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)')}
                  >
                    Atualizar Lista
                  </button>
                </div>

                {mensagemAdmin && (
                  <div
                    style={{
                      backgroundColor: 'rgba(217, 4, 41, 0.15)',
                      color: '#ff8585',
                      border: '1px solid rgba(217, 4, 41, 0.4)',
                      padding: '10px 16px',
                      borderRadius: '12px',
                      fontSize: '12.5px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                    }}
                  >
                    {mensagemAdmin}
                  </div>
                )}

                {carregandoUsuarios ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary, #cccccc)', fontSize: '14px' }}>
                    Carregando usuários do banco de dados...
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {listaUsuariosAdmin.map((u) => {
                      const ehAdminUser = u.funcao === 'admin' || u.email.toLowerCase() === 'emanuell.carvalho.pires@gmail.com';
                      const ehEuMesmo = u.id === usuarioLogado?.id;
                      return (
                        <div
                          key={u.id}
                          style={{
                            backgroundColor: 'var(--surface-bg, #3e3e3e)',
                            borderRadius: '16px',
                            padding: '16px 20px',
                            border: ehAdminUser ? '1px solid var(--accent-color, #ffe192)' : '1px solid rgba(255, 255, 255, 0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '16px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div
                              style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '50%',
                                backgroundColor: ehAdminUser ? 'var(--accent-color, #ffe192)' : 'rgba(255, 255, 255, 0.1)',
                                color: ehAdminUser ? 'var(--accent-text, #333333)' : 'var(--text-primary, #ffffff)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: '17px',
                                flexShrink: 0,
                              }}
                            >
                              {u.nome ? u.nome.charAt(0).toUpperCase() : 'U'}
                            </div>

                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <strong style={{ color: 'var(--text-primary, #ffffff)', fontSize: '14.5px' }}>{u.nome}</strong>
                                {ehEuMesmo && (
                                  <span style={{ fontSize: '10px', backgroundColor: 'rgba(42, 157, 143, 0.2)', color: '#50fa7b', padding: '2px 8px', borderRadius: '8px', fontWeight: 'bold', border: '1px solid rgba(42, 157, 143, 0.4)' }}>
                                    Você (Logado)
                                  </span>
                                )}
                              </div>
                              <span style={{ color: 'var(--accent-color, #ffe192)', fontSize: '12px', display: 'block', marginTop: '2px', wordBreak: 'break-all' }}>
                                {u.email}
                              </span>
                              <span style={{ color: 'var(--text-secondary, #9e9e9e)', fontSize: '11px', display: 'block', marginTop: '2px' }}>
                                {u.perfil_uso === 'comercial' ? 'Perfil Comercial' : 'Perfil Individual'} • Cadastro: {u.provedor === 'google' ? 'Conta Google' : 'E-mail & Senha'}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {/* Classificação / Alterar Função (Admin vs Comum) */}
                            <select
                              value={u.funcao || 'comum'}
                              disabled={u.email.toLowerCase() === 'emanuell.carvalho.pires@gmail.com'}
                              onChange={async (e) => {
                                const novaFn = e.target.value;
                                const res = await apiService.alterarFuncaoUsuarioAdmin({
                                  targetUserId: u.id,
                                  novaFuncao: novaFn,
                                  usuarioId: usuarioLogado.id,
                                });
                                if (res?.success) {
                                  carregarUsuariosAdmin();
                                  if (sincronizarUsuarioLogado) sincronizarUsuarioLogado();
                                }
                              }}
                              style={{
                                backgroundColor: ehAdminUser ? 'rgba(255, 225, 146, 0.12)' : 'var(--card-bg, #545454)',
                                color: ehAdminUser ? 'var(--accent-color, #ffe192)' : 'var(--text-primary, #ffffff)',
                                border: ehAdminUser ? '1px solid var(--accent-color, #ffe192)' : '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '10px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                outline: 'none',
                                cursor: u.email.toLowerCase() === 'emanuell.carvalho.pires@gmail.com' ? 'default' : 'pointer',
                              }}
                            >
                              <option value="admin" style={{ backgroundColor: 'var(--card-bg, #333)', color: 'var(--accent-color, #ffe192)' }}>Admin</option>
                              <option value="comum" style={{ backgroundColor: 'var(--card-bg, #333)', color: 'var(--text-primary, #fff)' }}>Comum</option>
                            </select>

                            {/* Botão Excluir Usuário */}
                            {!ehEuMesmo && (
                              <button
                                type="button"
                                onClick={() => setUsuarioParaDeletar(u)}
                                title="Excluir este usuário do banco de dados"
                                style={{
                                  backgroundColor: 'transparent',
                                  border: '1px solid rgba(255, 107, 107, 0.3)',
                                  borderRadius: '10px',
                                  padding: '6px 12px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  color: '#ff7b7b',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = 'rgba(255, 107, 107, 0.12)';
                                  e.currentTarget.style.borderColor = '#ff7b7b';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.borderColor = 'rgba(255, 107, 107, 0.3)';
                                }}
                              >
                                <img src={iconLixeira} alt="Excluir usuário" style={{ width: '13px', height: '13px', objectFit: 'contain' }} />
                                Excluir
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Modal Confirmar Exclusão de Conta */}
            {contaParaDeletar && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  zIndex: 3000,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <div
                  style={{
                    backgroundColor: '#444444',
                    borderRadius: '20px',
                    padding: '24px',
                    width: '90%',
                    maxWidth: '420px',
                    border: '1px solid #ff8585',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>🗑️</span>
                    <h3 style={{ margin: 0, color: '#ff8585', fontSize: '18px', fontWeight: 'bold' }}>
                      Excluir Conta
                    </h3>
                  </div>

                  <p style={{ margin: 0, color: '#ffffff', fontSize: '14px', lineHeight: '1.4' }}>
                    Tem certeza que deseja excluir permanentemente a conta <strong style={{ color: '#ffe192' }}>"{contaParaDeletar.nome}"</strong>?
                  </p>
                  
                  <p style={{ margin: 0, color: '#ff8585', fontSize: '12px', lineHeight: '1.3' }}>
                    ⚠️ Todos os lançamentos e históricos de receitas e despesas vinculados a esta conta serão removidos permanentemente.
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setContaParaDeletar(null)}
                      style={{
                        backgroundColor: '#666666',
                        color: '#ffffff',
                        border: 'none',
                        padding: '10px 18px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                      }}
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        const res = await deletarConta(contaParaDeletar.id);
                        if (res?.success) {
                          setContaParaDeletar(null);
                        } else {
                          setErroDeletarConta(res?.error || 'Erro ao excluir conta.');
                          setContaParaDeletar(null);
                        }
                      }}
                      style={{
                        backgroundColor: '#d90429',
                        color: '#ffffff',
                        border: 'none',
                        padding: '10px 18px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(217, 4, 41, 0.4)',
                      }}
                    >
                      Sim, Excluir Conta
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Confirmar Exclusão de Usuário pelo Admin */}
            {usuarioParaDeletar && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.85)',
                  zIndex: 3000,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <div
                  style={{
                    backgroundColor: '#444444',
                    borderRadius: '20px',
                    padding: '24px',
                    width: '90%',
                    maxWidth: '440px',
                    border: '1px solid #ff8585',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>🚨</span>
                    <h3 style={{ margin: 0, color: '#ff8585', fontSize: '18px', fontWeight: 'bold' }}>
                      Excluir Usuário do Banco de Dados
                    </h3>
                  </div>

                  <p style={{ margin: 0, color: '#ffffff', fontSize: '14px', lineHeight: '1.4' }}>
                    Tem certeza que deseja excluir permanentemente o usuário <strong style={{ color: '#ffe192' }}>"{usuarioParaDeletar.nome}"</strong> (<span style={{ color: '#ffe192' }}>{usuarioParaDeletar.email}</span>)?
                  </p>

                  <p style={{ margin: 0, color: '#ff8585', fontSize: '12px', lineHeight: '1.3' }}>
                    ⚠️ Todos os dados deste usuário (contas, receitas, despesas, categorias e etiquetas) serão permanentemente apagados do banco de dados PostgreSQL.
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setUsuarioParaDeletar(null)}
                      style={{
                        backgroundColor: '#666666',
                        color: '#ffffff',
                        border: 'none',
                        padding: '10px 18px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                      }}
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        const res = await apiService.deletarUsuarioAdmin({
                          targetUserId: usuarioParaDeletar.id,
                          usuarioId: usuarioLogado.id,
                        });
                        if (res?.success) {
                          setUsuarioParaDeletar(null);
                          carregarUsuariosAdmin();
                        } else {
                          setMensagemAdmin(res?.error || 'Erro ao excluir usuário.');
                          setUsuarioParaDeletar(null);
                        }
                      }}
                      style={{
                        backgroundColor: '#d90429',
                        color: '#ffffff',
                        border: 'none',
                        padding: '10px 18px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(217, 4, 41, 0.4)',
                      }}
                    >
                      Sim, Excluir Usuário
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Aba Caixinha */}
            {activeTab === 'caixinha' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h4 style={{ margin: 0, color: 'var(--text-primary, #ffffff)', fontSize: '18px', fontWeight: 'bold' }}>
                    Caixinha de Economia
                  </h4>
                  <p style={{ margin: '6px 0 0 0', color: 'var(--text-secondary, #cccccc)', fontSize: '13px', lineHeight: '1.4' }}>
                    A Caixinha acumula o saldo de economia (Receitas - Despesas) de todos os meses. O valor economizado mensalmente é somado ou subtraído automaticamente.
                  </p>
                </div>

                {/* Card de Resumo Principal do Saldo Guardado */}
                {isCaixinhaAtiva && (
                  <div
                    style={{
                      backgroundColor: 'rgba(255, 225, 146, 0.08)',
                      borderRadius: '16px',
                      padding: '20px 24px',
                      border: '1px solid var(--accent-color, #ffe192)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent-color, #ffe192)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Total Guardado na Caixinha
                      </span>
                      <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--accent-color, #ffe192)', marginTop: '4px' }}>
                        R$ {saldoCaixinhaAcumulado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text-secondary, #cccccc)' }}>
                      <div>Economia: <strong>R$ {(saldoCaixinhaAcumulado - Number(saldoInicialCaixinha || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div>
                      <div>Inicial: <strong>R$ {(Number(saldoInicialCaixinha || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div>
                    </div>
                  </div>
                )}

                {/* Card de Ativação / Status */}
                <div
                  style={{
                    backgroundColor: 'var(--surface-bg, #3e3e3e)',
                    borderRadius: '16px',
                    padding: '18px 20px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14.5px', fontWeight: 'bold', color: 'var(--text-primary, #ffffff)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>Status:</span>
                      <span style={{ color: isCaixinhaAtiva ? '#50fa7b' : 'var(--text-secondary, #aaaaaa)', fontWeight: '600' }}>
                        {isCaixinhaAtiva ? 'Ativa' : 'Desativada'}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary, #aaaaaa)', marginTop: '4px' }}>
                      {isCaixinhaAtiva
                        ? 'A Caixinha está ativa e acumulando os saldos mensais.'
                        : 'Ative a Caixinha para acumular suas reservas financeiras.'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleCaixinha()}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '10px',
                      border: isCaixinhaAtiva ? '1px solid rgba(255, 255, 255, 0.15)' : 'none',
                      backgroundColor: isCaixinhaAtiva ? 'transparent' : 'var(--accent-color, #ffe192)',
                      color: isCaixinhaAtiva ? 'var(--text-primary, #ffffff)' : 'var(--accent-text, #333333)',
                      fontWeight: 'bold',
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (isCaixinhaAtiva) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 107, 107, 0.12)';
                        e.currentTarget.style.borderColor = '#ff7b7b';
                        e.currentTarget.style.color = '#ff7b7b';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isCaixinhaAtiva) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                        e.currentTarget.style.color = 'var(--text-primary, #ffffff)';
                      }
                    }}
                  >
                    {isCaixinhaAtiva ? 'Desativar Caixinha' : 'Ativar Caixinha'}
                  </button>
                </div>

                {/* Configurações Adicionais (se ativa) */}
                {isCaixinhaAtiva && (
                  <div
                    style={{
                      backgroundColor: 'var(--surface-bg, #3e3e3e)',
                      borderRadius: '16px',
                      padding: '20px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '18px',
                    }}
                  >
                    <div>
                      <h5 style={{ margin: '0 0 4px 0', color: 'var(--accent-color, #ffe192)', fontSize: '14px', fontWeight: 'bold' }}>
                        Saldo Inicial Guardado
                      </h5>
                      <label style={{ display: 'block', color: 'var(--text-secondary, #aaaaaa)', fontSize: '12px', marginBottom: '8px' }}>
                        Caso já possuísse algum valor guardado antes de usar o sistema:
                      </label>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{ color: 'var(--accent-color, #ffe192)', fontWeight: 'bold' }}>R$</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="0,00"
                          value={valorInicialInput}
                          onChange={handleValorInicialChange}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '10px',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            backgroundColor: 'var(--card-bg, #545454)',
                            color: 'var(--text-primary, #ffffff)',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            outline: 'none',
                            width: '140px',
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleSalvarSaldoInicial}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '10px',
                            border: 'none',
                            backgroundColor: salvoFeedback ? '#2a9d8f' : 'var(--accent-color, #ffe192)',
                            color: salvoFeedback ? '#ffffff' : 'var(--accent-text, #333333)',
                            fontWeight: 'bold',
                            fontSize: '12.5px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {salvoFeedback ? '✓ Salvo!' : 'Salvar Saldo'}
                        </button>
                      </div>
                    </div>

                    {/* Configuração de Rendimento da Aplicação */}
                    <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h5 style={{ margin: 0, color: 'var(--accent-color, #ffe192)', fontSize: '14px', fontWeight: 'bold' }}>
                          Rendimento da Aplicação / Investimento
                        </h5>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary, #aaaaaa)', fontWeight: '500' }}>
                          {taxaNumCalculada > 0 ? `~${taxaMensalEquivalente.toFixed(2)}% ao mês` : 'Sem rendimento configurado'}
                        </span>
                      </div>

                      <label style={{ display: 'block', color: 'var(--text-secondary, #aaaaaa)', fontSize: '12px' }}>
                        Taxa de rendimento para calcular projeções automaticamente sobre o saldo:
                      </label>

                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginTop: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="text"
                            placeholder="0.00"
                            value={rendimentoTaxaInput}
                            onChange={(e) => setRendimentoTaxaInput(e.target.value.replace(/[^0-9.,]/g, ''))}
                            style={{
                              padding: '8px 14px',
                              borderRadius: '10px',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              backgroundColor: 'var(--card-bg, #545454)',
                              color: 'var(--accent-color, #ffe192)',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              outline: 'none',
                              width: '90px',
                              textAlign: 'center',
                            }}
                          />
                          <span style={{ color: 'var(--accent-color, #ffe192)', fontWeight: 'bold' }}>%</span>
                        </div>

                        {/* Seletor de Periodicidade: Mensal vs Anual */}
                        <div style={{ display: 'flex', backgroundColor: 'rgba(0,0,0,0.25)', padding: '3px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <button
                            type="button"
                            onClick={() => setRendimentoPeriodoInput('mensal')}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: rendimentoPeriodoInput === 'mensal' ? 'var(--accent-color, #ffe192)' : 'transparent',
                              color: rendimentoPeriodoInput === 'mensal' ? 'var(--accent-text, #222)' : 'var(--text-secondary, #ccc)',
                              fontWeight: 'bold',
                              fontSize: '12px',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            % ao mês (a.m.)
                          </button>
                          <button
                            type="button"
                            onClick={() => setRendimentoPeriodoInput('anual')}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: rendimentoPeriodoInput === 'anual' ? 'var(--accent-color, #ffe192)' : 'transparent',
                              color: rendimentoPeriodoInput === 'anual' ? 'var(--accent-text, #222)' : 'var(--text-secondary, #ccc)',
                              fontWeight: 'bold',
                              fontSize: '12px',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            % ao ano (a.a.)
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={handleSalvarRendimento}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '10px',
                            border: 'none',
                            backgroundColor: salvoRendimentoFeedback ? '#2a9d8f' : 'var(--accent-color, #ffe192)',
                            color: salvoRendimentoFeedback ? '#ffffff' : 'var(--accent-text, #333333)',
                            fontWeight: 'bold',
                            fontSize: '12.5px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {salvoRendimentoFeedback ? '✓ Salvo!' : 'Salvar Rendimento'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Aba Aparência & Cores */}
            {activeTab === 'aparencia' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h4 style={{ margin: 0, color: 'var(--accent-color, #ffe192)', fontSize: '18px', fontWeight: 'bold' }}>
                    Aparência & Paleta de Cores
                  </h4>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary, #cccccc)', fontSize: '13px' }}>
                    Escolha entre os temas pré-definidos do sistema ou selecione cores customizadas para a interface do aplicativo.
                  </p>
                </div>

                {salvoPaletaFeedback && (
                  <div
                    style={{
                      backgroundColor: 'rgba(42, 157, 143, 0.2)',
                      border: '1px solid #2a9d8f',
                      color: '#50fa7b',
                      padding: '10px 16px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                    }}
                  >
                    ✓ Paleta de cores aplicada com sucesso!
                  </div>
                )}

                {/* 1. Presets Temáticos Prontos */}
                <div>
                  <label style={{ display: 'block', color: 'var(--text-primary, #ffffff)', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
                    Temas Pré-definidos
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '12px' }}>
                    {(PALETAS_PREDEFINIDAS || []).map((preset) => {
                      const isSelected =
                        paletaCores?.accentColor?.toLowerCase() === preset.cores.accentColor.toLowerCase() &&
                        paletaCores?.bgPrimary?.toLowerCase() === preset.cores.bgPrimary.toLowerCase();

                      return (
                        <div
                          key={preset.id}
                          onClick={() => {
                            aplicarPaletaCores(preset.cores);
                            setCustomCores(preset.cores);
                            setSalvoPaletaFeedback(true);
                            setTimeout(() => setSalvoPaletaFeedback(false), 2000);
                          }}
                          style={{
                            backgroundColor: 'var(--surface-bg, #3e3e3e)',
                            borderRadius: '14px',
                            padding: '14px',
                            border: isSelected ? '2px solid var(--accent-color, #ffe192)' : '1px solid rgba(255, 255, 255, 0.08)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ color: isSelected ? 'var(--accent-color, #ffe192)' : 'var(--text-primary, #ffffff)', fontSize: '13px' }}>
                              {preset.nome}
                            </strong>
                            {isSelected && (
                              <span style={{ fontSize: '10px', backgroundColor: 'var(--accent-color, #ffe192)', color: 'var(--accent-text, #333333)', padding: '2px 6px', borderRadius: '6px', fontWeight: 'bold' }}>
                                Ativo
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary, #aaaaaa)' }}>{preset.descricao}</span>

                          {/* Faixa de Amostra das Cores */}
                          <div style={{ display: 'flex', height: '12px', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', marginTop: '4px' }}>
                            <div style={{ flex: 1, backgroundColor: preset.cores.bgPrimary }} title="Fundo" />
                            <div style={{ flex: 1, backgroundColor: preset.cores.cardBg }} title="Cards" />
                            <div style={{ flex: 1, backgroundColor: preset.cores.surfaceBg }} title="Superfície" />
                            <div style={{ flex: 1, backgroundColor: preset.cores.accentColor }} title="Destaque" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Personalizador de Cores Customizadas */}
                <div
                  style={{
                    backgroundColor: 'var(--surface-bg, #3e3e3e)',
                    borderRadius: '16px',
                    padding: '18px 20px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  <label style={{ color: 'var(--accent-color, #ffe192)', fontSize: '14px', fontWeight: 'bold' }}>
                    Personalizar Cor por Cor
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {/* Cor de Destaque */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--card-bg, #484848)', padding: '10px 14px', borderRadius: '12px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-primary, #dddddd)', fontWeight: '500' }}>Cor de Destaque</span>
                      <input
                        type="color"
                        value={customCores?.accentColor || '#ffe192'}
                        onChange={(e) => setCustomCores({ ...customCores, accentColor: e.target.value })}
                        style={{ border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'transparent' }}
                      />
                    </div>

                    {/* Fundo Principal */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--card-bg, #484848)', padding: '10px 14px', borderRadius: '12px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-primary, #dddddd)', fontWeight: '500' }}>Fundo Principal</span>
                      <input
                        type="color"
                        value={customCores?.bgPrimary || '#3a3a3a'}
                        onChange={(e) => setCustomCores({ ...customCores, bgPrimary: e.target.value })}
                        style={{ border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'transparent' }}
                      />
                    </div>

                    {/* Quadros e Cards */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--card-bg, #484848)', padding: '10px 14px', borderRadius: '12px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-primary, #dddddd)', fontWeight: '500' }}>Quadros e Painéis</span>
                      <input
                        type="color"
                        value={customCores?.cardBg || '#545454'}
                        onChange={(e) => setCustomCores({ ...customCores, cardBg: e.target.value })}
                        style={{ border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'transparent' }}
                      />
                    </div>

                    {/* Superfície de Botões */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--card-bg, #484848)', padding: '10px 14px', borderRadius: '12px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-primary, #dddddd)', fontWeight: '500' }}>Superfície de Botões</span>
                      <input
                        type="color"
                        value={customCores?.surfaceBg || '#3e3e3e'}
                        onChange={(e) => setCustomCores({ ...customCores, surfaceBg: e.target.value })}
                        style={{ border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'transparent' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        aplicarPaletaCores(customCores);
                        setSalvoPaletaFeedback(true);
                        setTimeout(() => setSalvoPaletaFeedback(false), 2500);
                      }}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '10px',
                        border: 'none',
                        backgroundColor: 'var(--accent-color, #ffe192)',
                        color: 'var(--accent-text, #333333)',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      Aplicar Cores Customizadas
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const padrao = PALETAS_PREDEFINIDAS[0].cores;
                        aplicarPaletaCores(padrao);
                        setCustomCores(padrao);
                        setSalvoPaletaFeedback(true);
                        setTimeout(() => setSalvoPaletaFeedback(false), 2500);
                      }}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        color: 'var(--text-primary, #ffffff)',
                        fontWeight: '600',
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)')}
                    >
                      Restaurar Padrão
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Aba Exportar */}
            {activeTab === 'exportar' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h4 style={{ margin: 0, color: 'var(--accent-color, #ffe192)', fontSize: '18px', fontWeight: 'bold' }}>
                    Exportação de Dados
                  </h4>
                  <p style={{ margin: '6px 0 0 0', color: 'var(--text-secondary, #cccccc)', fontSize: '13px' }}>
                    Exporte seus lançamentos e relatórios financeiros em formatos padrão de mercado.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Seleção do Período */}
                  <div
                    style={{
                      backgroundColor: 'var(--surface-bg, #3e3e3e)',
                      borderRadius: '16px',
                      padding: '18px 20px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--accent-color, #ffe192)' }}>
                      Selecione o Período a Exportar
                    </div>

                    {/* Botões de Seleção do Modo de Período */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setModoExportacao('mes_a_mes');
                          if (exportMes === 'Todos') setExportMes(mesSelecionado !== 'Todos' ? mesSelecionado : 'Jan');
                        }}
                        style={{
                          flex: 1,
                          minWidth: '90px',
                          padding: '8px 10px',
                          borderRadius: '10px',
                          border: modoExportacao === 'mes_a_mes' ? '1px solid var(--accent-color, #ffe192)' : '1px solid rgba(255, 255, 255, 0.08)',
                          backgroundColor: modoExportacao === 'mes_a_mes' ? 'rgba(255, 225, 146, 0.12)' : 'rgba(0, 0, 0, 0.2)',
                          color: modoExportacao === 'mes_a_mes' ? 'var(--accent-color, #ffe192)' : 'var(--text-secondary, #cccccc)',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        Mês
                      </button>

                      <button
                        type="button"
                        onClick={() => setModoExportacao('ano_a_ano')}
                        style={{
                          flex: 1,
                          minWidth: '90px',
                          padding: '8px 10px',
                          borderRadius: '10px',
                          border: modoExportacao === 'ano_a_ano' ? '1px solid var(--accent-color, #ffe192)' : '1px solid rgba(255, 255, 255, 0.08)',
                          backgroundColor: modoExportacao === 'ano_a_ano' ? 'rgba(255, 225, 146, 0.12)' : 'rgba(0, 0, 0, 0.2)',
                          color: modoExportacao === 'ano_a_ano' ? 'var(--accent-color, #ffe192)' : 'var(--text-secondary, #cccccc)',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        Ano
                      </button>

                      <button
                        type="button"
                        onClick={() => setModoExportacao('intervalo')}
                        style={{
                          flex: 1.4,
                          minWidth: '160px',
                          padding: '8px 10px',
                          borderRadius: '10px',
                          border: modoExportacao === 'intervalo' ? '1px solid var(--accent-color, #ffe192)' : '1px solid rgba(255, 255, 255, 0.08)',
                          backgroundColor: modoExportacao === 'intervalo' ? 'rgba(255, 225, 146, 0.12)' : 'rgba(0, 0, 0, 0.2)',
                          color: modoExportacao === 'intervalo' ? 'var(--accent-color, #ffe192)' : 'var(--text-secondary, #cccccc)',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        Período Selecionado
                      </button>
                    </div>

                    {/* MENSAGEM / PAINEL DINÂMICO CONFORME O MODO SELECIONADO */}
                    {modoExportacao === 'mes_a_mes' && (
                      <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                        {/* Seletor de Mês */}
                        <div style={{ flex: 1.2 }}>
                          <label style={{ display: 'block', color: 'var(--text-secondary, #dddddd)', fontSize: '12px', marginBottom: '4px' }}>
                            Mês Referência:
                          </label>
                          <select
                            value={exportMes === 'Todos' ? (mesSelecionado !== 'Todos' ? mesSelecionado : 'Jan') : exportMes}
                            onChange={(e) => setExportMes(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '9px 12px',
                              borderRadius: '10px',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              backgroundColor: 'rgba(0,0,0,0.3)',
                              color: 'var(--accent-color, #ffe192)',
                              fontWeight: 'bold',
                              fontSize: '13px',
                              outline: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((m, idx) => (
                              <option key={m} value={m}>
                                {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][idx]} ({m})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Seletor de Ano */}
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', color: 'var(--text-secondary, #dddddd)', fontSize: '12px', marginBottom: '4px' }}>
                            Ano Referência:
                          </label>
                          <select
                            value={exportAno}
                            onChange={(e) => setExportAno(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '9px 12px',
                              borderRadius: '10px',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              backgroundColor: 'rgba(0,0,0,0.3)',
                              color: 'var(--accent-color, #ffe192)',
                              fontWeight: 'bold',
                              fontSize: '13px',
                              outline: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            {Array.from({ length: 7 }, (_, i) => 2024 + i).map((ano) => (
                              <option key={ano} value={ano.toString()}>
                                Ano {ano}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {modoExportacao === 'ano_a_ano' && (
                      <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', color: 'var(--text-secondary, #dddddd)', fontSize: '12px', marginBottom: '4px' }}>
                            Ano de Exportação:
                          </label>
                          <select
                            value={exportAno}
                            onChange={(e) => setExportAno(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '9px 12px',
                              borderRadius: '10px',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              backgroundColor: 'rgba(0,0,0,0.3)',
                              color: 'var(--accent-color, #ffe192)',
                              fontWeight: 'bold',
                              fontSize: '13px',
                              outline: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            <option value="Todos">Todos os Anos (Histórico Completo)</option>
                            {Array.from({ length: 7 }, (_, i) => 2024 + i).map((ano) => (
                              <option key={ano} value={ano.toString()}>
                                Ano Inteiro {ano}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {modoExportacao === 'intervalo' && (
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* De */}
                        <div style={{ flex: 1, minWidth: '180px', backgroundColor: 'rgba(0,0,0,0.25)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <span style={{ fontSize: '11px', color: 'var(--accent-color, #ffe192)', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                            De (Mês/Ano Início):
                          </span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <select
                              value={intervaloMesInicio}
                              onChange={(e) => setIntervaloMesInicio(e.target.value)}
                              style={{ flex: 1.2, padding: '7px', borderRadius: '6px', backgroundColor: 'var(--surface-bg, #3e3e3e)', color: 'var(--text-primary, #fff)', border: '1px solid rgba(255,255,255,0.12)', fontSize: '12px' }}
                            >
                              {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((m, idx) => (
                                <option key={m} value={m}>
                                  {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][idx]}
                                </option>
                              ))}
                            </select>
                            <select
                              value={intervaloAnoInicio}
                              onChange={(e) => setIntervaloAnoInicio(e.target.value)}
                              style={{ flex: 1, padding: '7px', borderRadius: '6px', backgroundColor: 'var(--surface-bg, #3e3e3e)', color: 'var(--text-primary, #fff)', border: '1px solid rgba(255,255,255,0.12)', fontSize: '12px' }}
                            >
                              {Array.from({ length: 7 }, (_, i) => 2024 + i).map((ano) => (
                                <option key={ano} value={ano.toString()}>{ano}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Até */}
                        <div style={{ flex: 1, minWidth: '180px', backgroundColor: 'rgba(0,0,0,0.25)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <span style={{ fontSize: '11px', color: '#ff7b7b', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                            Até (Mês/Ano Fim):
                          </span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <select
                              value={intervaloMesFim}
                              onChange={(e) => setIntervaloMesFim(e.target.value)}
                              style={{ flex: 1.2, padding: '7px', borderRadius: '6px', backgroundColor: '#3e3e3e', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', fontSize: '12px' }}
                            >
                              {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((m, idx) => (
                                <option key={m} value={m}>
                                  {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][idx]}
                                </option>
                              ))}
                            </select>
                            <select
                              value={intervaloAnoFim}
                              onChange={(e) => setIntervaloAnoFim(e.target.value)}
                              style={{ flex: 1, padding: '7px', borderRadius: '6px', backgroundColor: '#3e3e3e', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', fontSize: '12px' }}
                            >
                              {Array.from({ length: 7 }, (_, i) => 2024 + i).map((ano) => (
                                <option key={ano} value={ano.toString()}>{ano}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Opção 1: Excel / CSV */}
                  <div
                    style={{
                      backgroundColor: 'var(--surface-bg, #3e3e3e)',
                      borderRadius: '16px',
                      padding: '18px 20px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                    }}
                  >
                    <div>
                      <strong style={{ color: 'var(--text-primary, #ffffff)', fontSize: '15px', display: 'block' }}>
                        Exportar Excel (.csv)
                      </strong>
                      <span style={{ color: 'var(--text-secondary, #aaaaaa)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                        Gera uma planilha compatível com Microsoft Excel, Google Sheets e LibreOffice.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (modoExportacao === 'mes_a_mes') {
                          onExportCSV(exportMes, exportAno);
                        } else if (modoExportacao === 'ano_a_ano') {
                          onExportCSV('Todos', exportAno);
                        } else if (modoExportacao === 'intervalo') {
                          onExportCSV({
                            modo: 'intervalo',
                            mesInicio: intervaloMesInicio,
                            anoInicio: intervaloAnoInicio,
                            mesFim: intervaloMesFim,
                            anoFim: intervaloAnoFim,
                          });
                        }
                      }}
                      style={{
                        backgroundColor: '#2a9d8f',
                        color: '#ffffff',
                        border: 'none',
                        padding: '10px 18px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'opacity 0.15s ease',
                      }}
                    >
                      Exportar .csv
                    </button>
                  </div>

                  {/* Opção 2: PDF */}
                  <div
                    style={{
                      backgroundColor: 'var(--surface-bg, #3e3e3e)',
                      borderRadius: '16px',
                      padding: '18px 20px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                    }}
                  >
                    <div>
                      <strong style={{ color: 'var(--text-primary, #ffffff)', fontSize: '15px', display: 'block' }}>
                        Exportar Relatório PDF
                      </strong>
                      <span style={{ color: '#aaaaaa', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                        Relatório executivo estruturado com resumos financeiros para impressão ou arquivamento.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (modoExportacao === 'mes_a_mes') {
                          onExportPDF(exportMes, exportAno);
                        } else if (modoExportacao === 'ano_a_ano') {
                          onExportPDF('Todos', exportAno);
                        } else if (modoExportacao === 'intervalo') {
                          onExportPDF({
                            modo: 'intervalo',
                            mesInicio: intervaloMesInicio,
                            anoInicio: intervaloAnoInicio,
                            mesFim: intervaloMesFim,
                            anoFim: intervaloAnoFim,
                          });
                        }
                      }}
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'var(--text-primary, #ffffff)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        padding: '10px 18px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
                    >
                      Gerar PDF
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Aba Importar Nubank (CSV) */}
            {activeTab === 'importar_nubank' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h4 style={{ margin: '0 0 6px 0', color: 'var(--accent-color, #ffe192)', fontSize: '18px', fontWeight: 'bold' }}>
                    Importar Extrato ou Fatura do Nubank (CSV)
                  </h4>
                  <p style={{ margin: 0, color: 'var(--text-secondary, #cccccc)', fontSize: '13px', lineHeight: '1.5' }}>
                    Selecione ou arraste o arquivo <strong>.csv</strong> exportado do aplicativo ou Web do <strong>Nubank</strong>. Suporta extratos de conta e faturas de cartão com detecção anti-duplicata automática.
                  </p>
                </div>

                {importFeedbackNubank && (
                  <div
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      backgroundColor: importFeedbackNubank.tipo === 'sucesso' ? 'rgba(42, 157, 143, 0.2)' : 'rgba(231, 111, 81, 0.2)',
                      border: `1px solid ${importFeedbackNubank.tipo === 'sucesso' ? '#2a9d8f' : '#e76f51'}`,
                      color: importFeedbackNubank.tipo === 'sucesso' ? '#50fa7b' : '#ff6b6b',
                      fontSize: '13px',
                      fontWeight: 'bold',
                    }}
                  >
                    {importFeedbackNubank.mensagem}
                  </div>
                )}

                {/* Passo 1: Seleção / Drag & Drop do Arquivo CSV */}
                {!parsedCsvResult && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDropCsv}
                    style={{
                      border: isDragOver ? '2px dashed var(--accent-color, #ffe192)' : '2px dashed rgba(255, 255, 255, 0.15)',
                      borderRadius: '16px',
                      padding: '40px 24px',
                      textAlign: 'center',
                      backgroundColor: isDragOver ? 'rgba(255, 225, 146, 0.08)' : 'rgba(0, 0, 0, 0.15)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '14px',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      document.getElementById('nubank-csv-input')?.click();
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary, #ffffff)', marginBottom: '6px' }}>
                        Clique ou arraste o arquivo CSV do Nubank aqui
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary, #aaaaaa)', maxWidth: '460px', margin: '0 auto', lineHeight: '1.4' }}>
                        Formatos aceitos: <code>Data, Valor, Identificador, Descrição</code> ou <code>date, title, amount</code>
                      </div>
                    </div>

                    <label
                      htmlFor="nubank-csv-input"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        backgroundColor: 'var(--accent-color, #ffe192)',
                        color: 'var(--accent-text, #333333)',
                        padding: '10px 24px',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'inline-block',
                      }}
                    >
                      Escolher Arquivo CSV
                    </label>
                    <input
                      id="nubank-csv-input"
                      type="file"
                      accept=".csv"
                      onChange={handleCsvFileUpload}
                      style={{ display: 'none' }}
                    />
                  </div>
                )}

                {/* Passo 2: Prévia, Filtros e Validação Anti-Duplicata */}
                {parsedCsvResult && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Cards de Métricas e Resumo */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                      <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary, #aaaaaa)', fontWeight: 'bold' }}>TOTAL NO CSV</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary, #ffffff)', marginTop: '4px' }}>
                          {parsedCsvResult.totalItens} <span style={{ fontSize: '11px', fontWeight: 'normal' }}>itens</span>
                        </div>
                      </div>

                      <div style={{ backgroundColor: 'rgba(42, 157, 143, 0.15)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(42, 157, 143, 0.3)' }}>
                        <div style={{ fontSize: '11px', color: '#50fa7b', fontWeight: 'bold' }}>A IMPORTAR</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#50fa7b', marginTop: '4px' }}>
                          {parsedCsvResult.qtdNovos} <span style={{ fontSize: '11px', fontWeight: 'normal' }}>itens</span>
                        </div>
                      </div>

                      <div style={{ backgroundColor: 'rgba(231, 111, 81, 0.15)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(231, 111, 81, 0.3)' }}>
                        <div style={{ fontSize: '11px', color: '#ff7b7b', fontWeight: 'bold' }}>DUPLICADOS</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff7b7b', marginTop: '4px' }}>
                          {parsedCsvResult.qtdDuplicados} <span style={{ fontSize: '11px', fontWeight: 'normal' }}>itens</span>
                        </div>
                      </div>

                      <div style={{ backgroundColor: 'rgba(42, 157, 143, 0.12)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(42, 157, 143, 0.3)' }}>
                        <div style={{ fontSize: '11px', color: '#50fa7b', fontWeight: 'bold' }}>TOTAL RECEITAS</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#50fa7b', marginTop: '4px' }}>
                          R$ {formatarCurrencyValue(parsedCsvResult.valorTotalReceitas || 0)}
                        </div>
                      </div>

                      <div style={{ backgroundColor: 'rgba(231, 111, 81, 0.12)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(231, 111, 81, 0.3)' }}>
                        <div style={{ fontSize: '11px', color: '#ff7b7b', fontWeight: 'bold' }}>TOTAL DESPESAS</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ff7b7b', marginTop: '4px' }}>
                          R$ {formatarCurrencyValue(parsedCsvResult.valorTotalDespesas || 0)}
                        </div>
                      </div>
                    </div>

                    {/* Controles de Configuração da Importação */}
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '14px',
                        backgroundColor: 'rgba(0,0,0,0.25)',
                        padding: '14px 16px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      {/* Seleção da Conta Destino */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label style={{ color: 'var(--text-primary, #ffffff)', fontSize: '13px', fontWeight: 'bold' }}>
                          Conta Destino:
                        </label>
                        <select
                          value={contaDestinoId || contaAtiva?.id || ''}
                          onChange={(e) => setContaDestinoId(Number(e.target.value))}
                          style={{
                            padding: '7px 12px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.15)',
                            backgroundColor: 'var(--surface-bg, #333)',
                            color: 'var(--text-primary, #fff)',
                            fontSize: '13px',
                            outline: 'none',
                          }}
                        >
                          {contas.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.nome} {c.id === contaAtiva?.id ? '(Ativa)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Seleção de Categoria Padrão */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label style={{ color: 'var(--text-primary, #ffffff)', fontSize: '13px', fontWeight: 'bold' }}>
                          Categoria Geral:
                        </label>
                        <select
                          value={categoriaImportacao}
                          onChange={(e) => {
                            setCategoriaImportacao(e.target.value);
                            // Aplica para itens que estão como 'Nubank'
                            if (parsedCsvResult?.itens) {
                              const novos = parsedCsvResult.itens.map((it) => ({
                                ...it,
                                classificacao: it.classificacao === 'Nubank' ? e.target.value : it.classificacao,
                              }));
                              recalcularEstatisticas(novos);
                            }
                          }}
                          style={{
                            padding: '7px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color, #666)',
                            backgroundColor: 'var(--surface-bg, #333)',
                            color: 'var(--text-primary, #fff)',
                            fontSize: '13px',
                            outline: 'none',
                          }}
                        >
                          <option value="Nubank">Nubank</option>
                          {categorias.map((cat) => (
                            <option key={cat.id || cat.nome} value={cat.nome}>
                              {cat.nome}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Barra de Filtros e Busca da Tabela */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setFiltroImport('todos')}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '16px',
                            border: 'none',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            backgroundColor: filtroImport === 'todos' ? 'var(--accent-color, #ffe192)' : 'rgba(255,255,255,0.08)',
                            color: filtroImport === 'todos' ? 'var(--accent-text, #333333)' : 'var(--text-primary, #ffffff)',
                          }}
                        >
                          Todos ({parsedCsvResult.totalItens})
                        </button>
                        <button
                          type="button"
                          onClick={() => setFiltroImport('novos')}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '16px',
                            border: 'none',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            backgroundColor: filtroImport === 'novos' ? '#2a9d8f' : 'rgba(42, 157, 143, 0.2)',
                            color: filtroImport === 'novos' ? '#ffffff' : '#2a9d8f',
                          }}
                        >
                          A Importar ({parsedCsvResult.qtdNovos})
                        </button>
                        <button
                          type="button"
                          onClick={() => setFiltroImport('duplicados')}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '16px',
                            border: 'none',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            backgroundColor: filtroImport === 'duplicados' ? '#e76f51' : 'rgba(231, 111, 81, 0.2)',
                            color: filtroImport === 'duplicados' ? '#ffffff' : '#e76f51',
                          }}
                        >
                          Duplicados ({parsedCsvResult.qtdDuplicados})
                        </button>
                        <button
                          type="button"
                          onClick={() => setFiltroImport('ignorados')}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '16px',
                            border: 'none',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            backgroundColor: filtroImport === 'ignorados' ? '#888888' : 'rgba(255, 255, 255, 0.08)',
                            color: filtroImport === 'ignorados' ? '#ffffff' : 'var(--text-secondary, #cccccc)',
                          }}
                        >
                          RDB Ignorados ({parsedCsvResult.qtdIgnorados || 0})
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder="Buscar transação..."
                          value={buscaImport}
                          onChange={(e) => setBuscaImport(e.target.value)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color, #666)',
                            backgroundColor: 'var(--surface-bg, #333)',
                            color: 'var(--text-primary, #fff)',
                            fontSize: '12px',
                            outline: 'none',
                            width: '180px',
                          }}
                        />
                      </div>
                    </div>

                    {/* Tabela Interativa de Prévia */}
                    <div style={{ maxHeight: '420px', overflowY: 'auto', borderRadius: '12px', border: '1px solid var(--border-color, #555)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'rgba(0,0,0,0.4)', color: 'var(--accent-color, #ffe192)', borderBottom: '1px solid var(--border-color, #555)' }}>
                            <th style={{ padding: '10px 10px', textAlign: 'center', width: '36px' }}>
                              <input
                                type="checkbox"
                                checked={parsedCsvResult.itens.some((it) => !it.isDuplicado && !it.isIgnorado && it.selecionado !== false)}
                                onChange={(e) => toggleTodosSelecionados(e.target.checked)}
                                title="Marcar / Desmarcar todos os novos"
                                style={{ cursor: 'pointer' }}
                              />
                            </th>
                            <th style={{ padding: '10px 10px' }}>Status</th>
                            <th style={{ padding: '10px 10px' }}>Data</th>
                            <th style={{ padding: '10px 10px' }}>Título / Descrição</th>
                            <th style={{ padding: '10px 10px' }}>Parcela</th>
                            <th style={{ padding: '10px 10px' }}>Tipo</th>
                            <th style={{ padding: '10px 10px' }}>Categoria</th>
                            <th style={{ padding: '10px 10px', textAlign: 'right' }}>Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedCsvResult.itens
                            .filter((item) => {
                              if (filtroImport === 'novos' && (item.isDuplicado || item.isIgnorado)) return false;
                              if (filtroImport === 'duplicados' && !item.isDuplicado) return false;
                              if (filtroImport === 'ignorados' && !item.isIgnorado) return false;
                              if (buscaImport.trim()) {
                                const termo = buscaImport.toLowerCase().trim();
                                const nomeMatch = (item.nome || '').toLowerCase().includes(termo);
                                const descMatch = (item.descricao || '').toLowerCase().includes(termo);
                                const valorMatch = String(item.valor || '').includes(termo);
                                if (!nomeMatch && !descMatch && !valorMatch) return false;
                              }
                              return true;
                            })
                            .map((item) => (
                              <tr
                                key={item.idTemp}
                                style={{
                                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                                  backgroundColor: item.isDuplicado
                                    ? 'rgba(231, 111, 81, 0.08)'
                                    : item.isIgnorado
                                    ? 'rgba(255, 255, 255, 0.03)'
                                    : item.selecionado === false
                                    ? 'rgba(0,0,0,0.2)'
                                    : 'transparent',
                                  opacity: item.isDuplicado || item.isIgnorado || item.selecionado === false ? 0.65 : 1,
                                }}
                              >
                                <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                  <input
                                    type="checkbox"
                                    checked={!item.isDuplicado && item.selecionado !== false}
                                    disabled={item.isDuplicado}
                                    onChange={() => toggleItemSelecionado(item.idTemp)}
                                    style={{ cursor: item.isDuplicado ? 'not-allowed' : 'pointer' }}
                                  />
                                </td>
                                <td style={{ padding: '8px 10px' }}>
                                  {item.isDuplicado ? (
                                    <span style={{ color: '#e76f51', fontWeight: 'bold', fontSize: '10px', backgroundColor: 'rgba(231,111,81,0.2)', padding: '2px 6px', borderRadius: '4px' }}>
                                      ⚠️ Duplicado
                                    </span>
                                  ) : item.isIgnorado ? (
                                    <span style={{ color: '#b0b0b0', fontWeight: 'bold', fontSize: '10px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }} title="Movimentação de RDB / Caixinha ignorada">
                                      ⏸️ RDB (Ignorado)
                                    </span>
                                  ) : item.selecionado === false ? (
                                    <span style={{ color: '#aaa', fontWeight: 'bold', fontSize: '10px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                      ⏸️ Ignorado
                                    </span>
                                  ) : (
                                    <span style={{ color: '#2a9d8f', fontWeight: 'bold', fontSize: '10px', backgroundColor: 'rgba(42,157,143,0.2)', padding: '2px 6px', borderRadius: '4px' }}>
                                      ✅ Novo
                                    </span>
                                  )}
                                </td>
                                <td style={{ padding: '8px 10px', color: 'var(--text-secondary, #ccc)', whiteSpace: 'nowrap' }}>
                                  {item.dia}/{item.mes}/{item.ano}
                                </td>
                                <td style={{ padding: '8px 10px', maxWidth: '280px' }}>
                                  <div style={{ color: 'var(--text-primary, #fff)', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {item.nome}
                                  </div>
                                  {item.descricao && item.descricao !== item.nome && (
                                    <div
                                      style={{
                                        fontSize: '10px',
                                        color: 'var(--text-secondary, #999)',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                      }}
                                      title={item.descricao}
                                    >
                                      {item.descricao}
                                    </div>
                                  )}
                                </td>
                                <td style={{ padding: '8px 10px', color: 'var(--text-secondary, #aaa)', whiteSpace: 'nowrap' }}>
                                  {item.parcelas}
                                </td>
                                <td style={{ padding: '8px 10px' }}>
                                  <select
                                    value={item.tipo}
                                    onChange={(e) => alterarItemPropriedade(item.idTemp, 'tipo', e.target.value)}
                                    style={{
                                      padding: '3px 6px',
                                      borderRadius: '6px',
                                      border: `1px solid ${item.tipo === 'receitas' ? '#2a9d8f' : '#e76f51'}`,
                                      backgroundColor: 'var(--surface-bg, #333)',
                                      color: item.tipo === 'receitas' ? '#2a9d8f' : '#ff8585',
                                      fontSize: '11px',
                                      fontWeight: 'bold',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <option value="despesas">Despesa</option>
                                    <option value="receitas">Receita</option>
                                  </select>
                                </td>
                                <td style={{ padding: '8px 10px' }}>
                                  <select
                                    value={item.classificacao || 'Nubank'}
                                    onChange={(e) => alterarItemPropriedade(item.idTemp, 'classificacao', e.target.value)}
                                    style={{
                                      padding: '3px 6px',
                                      borderRadius: '6px',
                                      border: '1px solid var(--border-color, #666)',
                                      backgroundColor: 'var(--surface-bg, #333)',
                                      color: 'var(--text-primary, #fff)',
                                      fontSize: '11px',
                                      cursor: 'pointer',
                                      maxWidth: '120px',
                                    }}
                                  >
                                    <option value="Nubank">Nubank</option>
                                    <option value="Investimentos">Investimentos</option>
                                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                                    <option value="Transferências">Transferências</option>
                                    {categorias.map((cat) => (
                                      <option key={cat.id || cat.nome} value={cat.nome}>
                                        {cat.nome}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-primary, #fff)', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                  R$ {formatarCurrencyValue(item.valor)}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Botões de Ação da Importação */}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setCsvFile(null);
                          setParsedCsvResult(null);
                        }}
                        disabled={importandoNubank}
                        style={{
                          backgroundColor: 'transparent',
                          color: 'var(--text-secondary, #aaa)',
                          border: '1px solid var(--border-color, #666)',
                          padding: '10px 18px',
                          borderRadius: '12px',
                          fontSize: '13px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                        }}
                      >
                        🔄 Escolher Outro Arquivo
                      </button>

                      <button
                        type="button"
                        onClick={handleConfirmarImportacaoNubank}
                        disabled={importandoNubank || parsedCsvResult.qtdNovos === 0}
                        style={{
                          backgroundColor: parsedCsvResult.qtdNovos > 0 ? 'var(--accent-color, #ffe192)' : '#666',
                          color: parsedCsvResult.qtdNovos > 0 ? 'var(--accent-text, #333333)' : '#aaa',
                          border: 'none',
                          padding: '10px 22px',
                          borderRadius: '12px',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          cursor: parsedCsvResult.qtdNovos > 0 ? 'pointer' : 'not-allowed',
                          boxShadow: parsedCsvResult.qtdNovos > 0 ? '0 4px 12px rgba(0,0,0,0.3)' : 'none',
                        }}
                      >
                        {importandoNubank ? 'Importando Lançamentos...' : `📥 Confirmar Importação de ${parsedCsvResult.qtdNovos} Lançamentos`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Aba Atualizações do Sistema */}
            {activeTab === 'atualizacoes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h4 style={{ margin: '0 0 6px 0', color: 'var(--accent-color, #ffe192)', fontSize: '18px', fontWeight: 'bold' }}>
                    🚀 Atualizações do Aplicativo
                  </h4>
                  <p style={{ margin: 0, color: 'var(--text-secondary, #dddddd)', fontSize: '13px' }}>
                    Verifique se há novas versões disponíveis no GitHub Releases e mantenha seu Simple Finances sempre atualizado.
                  </p>
                </div>

                {/* Card de Status da Versão Atual */}
                <div
                  style={{
                    backgroundColor: 'var(--surface-bg, #3e3e3e)',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid var(--border-color, #666666)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div
                        style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '14px',
                          backgroundColor: updateDisponivel?.temAtualizacao ? 'rgba(231, 111, 81, 0.15)' : 'rgba(42, 157, 143, 0.15)',
                          border: `2px solid ${updateDisponivel?.temAtualizacao ? '#e76f51' : '#2a9d8f'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '26px',
                          flexShrink: 0,
                        }}
                      >
                        {updateDisponivel?.temAtualizacao ? '🚀' : '🛡️'}
                      </div>

                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary, #aaaaaa)' }}>Versão Atual Instalada</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary, #ffffff)' }}>
                          Simple Finances v1.0.1
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--accent-color, #ffe192)', marginTop: '2px' }}>
                          Canal Oficial: GitHub Releases
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => forcarBuscaEAtualizacao(true)}
                      disabled={verificandoUpdate || updateStatus?.state === 'downloading'}
                      style={{
                        backgroundColor: 'var(--accent-color, #ffe192)',
                        color: 'var(--accent-text, #333333)',
                        border: 'none',
                        padding: '10px 22px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        cursor: (verificandoUpdate || updateStatus?.state === 'downloading') ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        opacity: (verificandoUpdate || updateStatus?.state === 'downloading') ? 0.7 : 1,
                        transition: 'filter 0.2s',
                      }}
                      onMouseEnter={(e) => !verificandoUpdate && (e.target.style.filter = 'brightness(1.08)')}
                      onMouseLeave={(e) => (e.target.style.filter = 'none')}
                    >
                      <span>{verificandoUpdate ? '⏳' : '⚡'}</span>
                      <span>{verificandoUpdate ? 'Verificando no GitHub...' : 'Forçar Busca de Atualizações'}</span>
                    </button>
                  </div>

                  {/* Mensagem de Feedback da Busca */}
                  {mensagemUpdate && (
                    <div
                      style={{
                        backgroundColor: updateDisponivel?.temAtualizacao
                          ? 'rgba(255, 225, 146, 0.12)'
                          : 'rgba(42, 157, 143, 0.15)',
                        border: `1px solid ${updateDisponivel?.temAtualizacao ? 'var(--accent-color, #ffe192)' : '#2a9d8f'}`,
                        color: updateDisponivel?.temAtualizacao ? 'var(--accent-color, #ffe192)' : '#48cae4',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: '500',
                      }}
                    >
                      {mensagemUpdate}
                    </div>
                  )}

                  {/* Progresso de Download em Andamento */}
                  {updateStatus?.state === 'downloading' && (
                    <div
                      style={{
                        backgroundColor: 'rgba(42, 157, 143, 0.12)',
                        border: '1px solid #2a9d8f',
                        borderRadius: '14px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                        <span style={{ color: '#ffffff', fontWeight: 'bold' }}>⏳ Baixando atualização em segundo plano...</span>
                        <span style={{ color: 'var(--accent-color, #ffe192)', fontWeight: 'bold' }}>
                          {updateStatus.progress || 0}%
                        </span>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: '10px',
                          backgroundColor: '#2b2b2b',
                          borderRadius: '8px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${updateStatus.progress || 0}%`,
                            backgroundColor: '#2a9d8f',
                            borderRadius: '8px',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Download Concluído - Botão para Reiniciar */}
                  {updateStatus?.state === 'downloaded' && (
                    <div
                      style={{
                        backgroundColor: 'rgba(42, 157, 143, 0.2)',
                        border: '1px solid #2a9d8f',
                        borderRadius: '14px',
                        padding: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '12px', color: '#c4f1e9', fontWeight: 'bold' }}>ATUALIZAÇÃO PRONTA:</span>
                        <h5 style={{ margin: '2px 0 0 0', fontSize: '16px', color: '#ffffff' }}>
                          Download concluído com sucesso!
                        </h5>
                      </div>

                      <button
                        type="button"
                        onClick={reiniciarEAplicarAtualizacao}
                        style={{
                          backgroundColor: '#2a9d8f',
                          color: '#ffffff',
                          border: 'none',
                          padding: '10px 20px',
                          borderRadius: '10px',
                          fontSize: '13px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        }}
                      >
                        <span>🔄</span>
                        <span>Reiniciar e Aplicar Atualização</span>
                      </button>
                    </div>
                  )}

                  {/* Card de Destaque caso haja nova versão disponível e não esteja baixada ainda */}
                  {updateDisponivel?.temAtualizacao && updateStatus?.state !== 'downloaded' && (
                    <div
                      style={{
                        backgroundColor: 'rgba(231, 111, 81, 0.12)',
                        border: '1px solid #e76f51',
                        borderRadius: '14px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <span style={{ fontSize: '12px', color: '#ffb4a2', fontWeight: 'bold' }}>NOVA VERSÃO ENCONTRADA:</span>
                          <h5 style={{ margin: '2px 0 0 0', fontSize: '16px', color: '#ffffff' }}>
                            {updateDisponivel.titulo || `Versão ${updateDisponivel.versaoMaisRecente}`}
                          </h5>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => setIsUpdateModalOpen(true)}
                            style={{
                              backgroundColor: '#2a9d8f',
                              color: '#ffffff',
                              border: 'none',
                              padding: '8px 18px',
                              borderRadius: '10px',
                              fontSize: '13px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            }}
                          >
                            <span>📥</span>
                            <span>Baixar e Atualizar Agora</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card de Informações e Link Externo */}
                <div
                  style={{
                    backgroundColor: 'var(--surface-bg, #3e3e3e)',
                    borderRadius: '16px',
                    padding: '20px 24px',
                    border: '1px solid var(--border-color, #666666)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <h5 style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary, #ffffff)', fontWeight: 'bold' }}>
                    💡 Sobre as Atualizações Automáticas
                  </h5>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary, #cccccc)', lineHeight: '1.6' }}>
                    Ao abrir o Simple Finances, o aplicativo se conecta automaticamente aos servidores do GitHub Releases em segundo plano. Sempre que uma nova versão estável for publicada, você receberá um aviso para baixar o instalador atualizado em apenas um clique.
                  </p>

                  <div style={{ marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const url = 'https://github.com/EmanuellCarvalhoPires/gestorOrcamento/releases';
                        if (window.apiTurso?.abrirUrlExterna) {
                          window.apiTurso.abrirUrlExterna(url);
                        } else {
                          window.open(url, '_blank');
                        }
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-color, #ffe192)',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        textDecoration: 'underline',
                        padding: 0,
                      }}
                    >
                      🔗 Ver histórico completo de versões no GitHub ↗
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Confirmação da Exclusão Permanente da Conta de Usuário */}
      {isConfirmExcluirContaOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#2e2e2e',
              borderRadius: '20px',
              border: '2px solid #e76f51',
              padding: '24px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#e76f51', display: 'flex', alignItems: 'center', gap: '10px' }}>
              🚨 Excluir Sua Conta de Usuário?
            </div>

            <p style={{ margin: 0, color: '#dddddd', fontSize: '13px', lineHeight: '1.5' }}>
              Esta ação excluirá permanentemente o usuário <strong>{usuarioLogado?.nome}</strong> ({usuarioLogado?.email}) e <strong>TODOS os seus dados registrados</strong> (receitas, despesas, contas financeiras e preferências).
            </p>

            <div style={{ backgroundColor: '#3e3e3e', padding: '12px 14px', borderRadius: '10px', border: '1px dashed #e76f51' }}>
              <label style={{ display: 'block', color: '#ffe192', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>
                Digite "EXCLUIR" em maiúsculas para confirmar:
              </label>
              <input
                type="text"
                value={confirmTextoInput}
                onChange={(e) => setConfirmTextoInput(e.target.value)}
                placeholder="EXCLUIR"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #737373',
                  backgroundColor: '#222222',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {erroExcluirConta && (
              <div style={{ color: '#ff6b6b', fontSize: '12px', fontWeight: 'bold' }}>
                ⚠️ {erroExcluirConta}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setIsConfirmExcluirContaOpen(false)}
                disabled={carregandoExclusao}
                style={{
                  backgroundColor: '#545454',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={carregandoExclusao || confirmTextoInput.trim() !== 'EXCLUIR'}
                onClick={async () => {
                  setCarregandoExclusao(true);
                  setErroExcluirConta('');
                  const res = await excluirContaUsuario({ confirmacaoText: confirmTextoInput });
                  setCarregandoExclusao(false);
                  if (!res?.success) {
                    setErroExcluirConta(res?.error || 'Erro ao excluir conta de usuário.');
                  } else {
                    setIsConfirmExcluirContaOpen(false);
                    onClose();
                  }
                }}
                style={{
                  backgroundColor: confirmTextoInput.trim() === 'EXCLUIR' ? '#e76f51' : '#782b2b',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: confirmTextoInput.trim() === 'EXCLUIR' ? 'pointer' : 'not-allowed',
                  opacity: confirmTextoInput.trim() === 'EXCLUIR' ? 1 : 0.6,
                }}
              >
                {carregandoExclusao ? 'Excluindo...' : 'Sim, Excluir Minha Conta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
