import React, { useState, useEffect } from 'react';
import { useBudget } from '../contexts/BudgetContext';
import { apiService } from '../services/api';
import iconLixeira from '../../images/lixeira-de-reciclagem.png';
import { parseNubankCsv } from '../utils/nubankCsvParser';

export default function SettingsModal({ isOpen, onClose, onExportCSV, onExportPDF, onOpenCreateAccount }) {
  const [activeTab, setActiveTab] = useState('perfil');
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
  } = useBudget();

  const [customCores, setCustomCores] = useState(paletaCores || {});
  const [salvoPaletaFeedback, setSalvoPaletaFeedback] = useState(false);

  // Estados para Importação de CSV do Nubank
  const [csvFile, setCsvFile] = useState(null);
  const [parsedCsvResult, setParsedCsvResult] = useState(null);
  const [categoriaImportacao, setCategoriaImportacao] = useState('Nubank');
  const [importandoNubank, setImportandoNubank] = useState(false);
  const [importFeedbackNubank, setImportFeedbackNubank] = useState(null);

  const handleCsvFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setImportFeedbackNubank(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const allExisting = [...receitas, ...despesas, ...transacoesTabela];
      const res = parseNubankCsv(text, allExisting);
      setParsedCsvResult(res);
    };
    reader.readAsText(file);
  };

  const handleConfirmarImportacaoNubank = async () => {
    if (!parsedCsvResult?.success || !parsedCsvResult.itens) return;
    setImportandoNubank(true);
    setImportFeedbackNubank(null);

    const itensParaEnviar = parsedCsvResult.itens.map((item) => ({
      ...item,
      classificacao: categoriaImportacao || 'Nubank',
    }));

    const res = await importarTransacoesNubankCSV(itensParaEnviar);
    setImportandoNubank(false);

    if (res?.success) {
      setImportFeedbackNubank({
        tipo: 'sucesso',
        mensagem: `🎉 Sucesso! ${res.inseridosCount || parsedCsvResult.qtdNovos} lançamentos foram importados para a conta "${contaAtiva?.nome || 'ativa'}".`,
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

  useEffect(() => {
    setValorInicialInput(saldoInicialCaixinha ? formatarCurrencyValue(saldoInicialCaixinha) : '');
  }, [saldoInicialCaixinha]);

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
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color, #666666)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--header-bg, #444444)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>⚙️</span>
            <h3 style={{ margin: 0, color: 'var(--text-primary, #ffffff)', fontSize: '20px', fontWeight: 'bold' }}>
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
              backgroundColor: 'var(--surface-bg, #3e3e3e)',
              borderRight: '1px solid var(--border-color, #666666)',
              padding: '16px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 'bold',
                color: 'var(--accent-color, #ffe192)',
                textTransform: 'uppercase',
                padding: '4px 12px',
                marginBottom: '4px',
                letterSpacing: '0.5px',
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
                padding: '12px 14px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: activeTab === 'perfil' ? 'var(--card-bg, #545454)' : 'transparent',
                color: activeTab === 'perfil' ? 'var(--accent-color, #ffe192)' : 'var(--text-primary, #ffffff)',
                fontWeight: activeTab === 'perfil' ? 'bold' : 'normal',
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                boxShadow: activeTab === 'perfil' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>👤</span>
                <span>Meu Perfil</span>
              </div>
              {activeTab === 'perfil' && (
                <span style={{ fontSize: '12px', color: 'var(--accent-color, #ffe192)' }}>●</span>
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
                padding: '12px 14px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: activeTab === 'aparencia' ? 'var(--card-bg, #545454)' : 'transparent',
                color: activeTab === 'aparencia' ? 'var(--accent-color, #ffe192)' : 'var(--text-primary, #ffffff)',
                fontWeight: activeTab === 'aparencia' ? 'bold' : 'normal',
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                boxShadow: activeTab === 'aparencia' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>🎨</span>
                <span>Aparência & Cores</span>
              </div>
              {activeTab === 'aparencia' && (
                <span style={{ fontSize: '12px', color: 'var(--accent-color, #ffe192)' }}>●</span>
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
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: activeTab === 'usuarios' ? 'var(--card-bg, #545454)' : 'transparent',
                  color: activeTab === 'usuarios' ? 'var(--accent-color, #ffe192)' : 'var(--text-primary, #ffffff)',
                  fontWeight: activeTab === 'usuarios' ? 'bold' : 'normal',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  boxShadow: activeTab === 'usuarios' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>👑</span>
                  <span>Gestão de Usuários</span>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    backgroundColor: 'var(--accent-color, #ffe192)',
                    color: 'var(--accent-text, #333333)',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                  }}
                >
                  ADMIN
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
                padding: '12px 14px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: activeTab === 'caixinha' ? 'var(--card-bg, #545454)' : 'transparent',
                color: activeTab === 'caixinha' ? 'var(--accent-color, #ffe192)' : 'var(--text-primary, #ffffff)',
                fontWeight: activeTab === 'caixinha' ? 'bold' : 'normal',
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                boxShadow: activeTab === 'caixinha' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>📦</span>
                <span>Caixinha</span>
              </div>
              <span
                style={{
                  fontSize: '10px',
                  backgroundColor: isCaixinhaAtiva ? '#2a9d8f' : 'var(--border-color, #666666)',
                  color: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                }}
              >
                {isCaixinhaAtiva ? 'ON' : 'OFF'}
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
                padding: '12px 14px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: activeTab === 'exportar' ? 'var(--card-bg, #545454)' : 'transparent',
                color: activeTab === 'exportar' ? 'var(--accent-color, #ffe192)' : 'var(--text-primary, #ffffff)',
                fontWeight: activeTab === 'exportar' ? 'bold' : 'normal',
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                boxShadow: activeTab === 'exportar' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>📤</span>
                <span>Exportar</span>
              </div>
              {activeTab === 'exportar' && (
                <span style={{ fontSize: '12px', color: 'var(--accent-color, #ffe192)' }}>●</span>
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
                padding: '12px 14px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: activeTab === 'importar_nubank' ? 'var(--card-bg, #545454)' : 'transparent',
                color: activeTab === 'importar_nubank' ? 'var(--accent-color, #ffe192)' : 'var(--text-primary, #ffffff)',
                fontWeight: activeTab === 'importar_nubank' ? 'bold' : 'normal',
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                boxShadow: activeTab === 'importar_nubank' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>📥</span>
                <span>Importar Nubank</span>
              </div>
              {activeTab === 'importar_nubank' && (
                <span style={{ fontSize: '12px', color: 'var(--accent-color, #ffe192)' }}>●</span>
              )}
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
                    👤 Meu Perfil
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
                    border: '1px solid var(--border-color, #666666)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  }}
                >
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-color, #ffe192)',
                      color: 'var(--accent-text, #333333)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '24px',
                      border: '3px solid var(--border-color, #737373)',
                      flexShrink: 0,
                    }}
                  >
                    {usuarioLogado?.nome ? usuarioLogado.nome.charAt(0).toUpperCase() : 'U'}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                    <div style={{ fontSize: '17px', fontWeight: 'bold', color: 'var(--text-primary, #ffffff)' }}>
                      {usuarioLogado?.nome || 'Usuário'}
                    </div>
                    
                    <div style={{ fontSize: '13px', color: 'var(--accent-color, #ffe192)', fontWeight: 'bold', wordBreak: 'break-all' }}>
                      ✉️ {usuarioLogado?.email || 'Nenhum e-mail cadastrado'}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          backgroundColor: 'var(--card-bg, #545454)',
                          color: 'var(--text-primary, #ffffff)',
                          padding: '3px 10px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          border: '1px solid var(--border-color, #737373)',
                        }}
                      >
                        {isComercial ? '🏢 Perfil Comercial / Corporativo' : '👤 Perfil Individual / Pessoal'}
                      </span>

                      {/* Classificação da Conta: Visível Apenas se for Administrador */}
                      {isAdmin && (
                        <span
                          style={{
                            backgroundColor: 'rgba(255, 225, 146, 0.15)',
                            color: 'var(--accent-color, #ffe192)',
                            padding: '3px 10px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            border: '1px solid var(--accent-color, #ffe192)',
                          }}
                        >
                          👑 Administrador do Sistema (Admin)
                        </span>
                      )}

                      <span
                        style={{
                          backgroundColor: 'rgba(42, 157, 143, 0.2)',
                          color: '#2a9d8f',
                          padding: '3px 10px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          border: '1px solid #2a9d8f',
                        }}
                      >
                        🟢 Status: Ativo
                      </span>
                    </div>
                  </div>
                </div>

                {/* Seção Minhas Contas dentro do Perfil */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h4 style={{ margin: 0, color: 'var(--text-primary, #ffffff)', fontSize: '16px', fontWeight: 'bold' }}>
                        💳 Minhas Contas ({contas.length})
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
                        padding: '8px 16px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span>➕</span> Criar Nova Conta
                    </button>
                  </div>

                  {/* Mensagem de Erro ao tentar excluir conta */}
                  {erroDeletarConta && (
                    <div
                      style={{
                        backgroundColor: '#d90429',
                        color: '#ffffff',
                        padding: '10px 16px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                      }}
                    >
                      {erroDeletarConta}
                    </div>
                  )}

                  {/* Lista de Contas Cadastradas */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {contas.map((c) => {
                      const ehAtiva = c.id === contaAtiva?.id;
                      const ehComercial = c.tipo === 'comercial';
                      return (
                        <div
                          key={c.id}
                          style={{
                            backgroundColor: 'var(--surface-bg, #3e3e3e)',
                            borderRadius: '14px',
                            padding: '14px 18px',
                            border: ehAtiva ? '2px solid var(--accent-color, #ffe192)' : '1px solid var(--border-color, #666666)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '14px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span
                              style={{
                                width: '12px',
                                height: '12px',
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
                                {ehComercial ? '🏢 Conta Comercial' : '👤 Conta Individual'} {c.descricao ? `• ${c.descricao}` : ''}
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
                                backgroundColor: ehAtiva ? 'rgba(42, 157, 143, 0.2)' : 'var(--card-bg, #545454)',
                                color: ehAtiva ? '#2a9d8f' : 'var(--text-primary, #ffffff)',
                                border: ehAtiva ? '1px solid #2a9d8f' : '1px solid var(--border-color, #737373)',
                                padding: '6px 14px',
                                borderRadius: '10px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                cursor: ehAtiva ? 'default' : 'pointer',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {ehAtiva ? '✓ Conta Ativa' : 'Alternar para esta conta'}
                            </button>

                            {/* Botão Deletar Conta (Lixeira) */}
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
                                backgroundColor: 'var(--card-bg, #545454)',
                                border: '1px solid var(--border-color, #737373)',
                                borderRadius: '10px',
                                padding: '6px 10px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#782b2b';
                                e.currentTarget.style.borderColor = '#ff8585';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--card-bg, #545454)';
                                e.currentTarget.style.borderColor = 'var(--border-color, #737373)';
                              }}
                            >
                              <img src={iconLixeira} alt="Excluir conta" style={{ width: '15px', height: '15px', objectFit: 'contain' }} />
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
                    backgroundColor: 'rgba(231, 111, 81, 0.08)',
                    border: '1px solid rgba(231, 111, 81, 0.4)',
                    borderRadius: '16px',
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e76f51', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ⚠️ Zona de Perigo • Excluir Conta Permanentemente
                  </div>
                  <p style={{ margin: 0, color: '#cccccc', fontSize: '12px', lineHeight: '1.4' }}>
                    Ao excluir sua conta, todos os seus dados (contas financeiras, receitas, despesas, categorias, etiquetas e caixinha) serão deletados permanentemente de nossos servidores. Esta ação é <strong>irreversível</strong>.
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
                      border: 'none',
                      backgroundColor: '#e76f51',
                      color: '#ffffff',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      transition: 'background-color 0.2s, transform 0.1s',
                    }}
                    onMouseEnter={(e) => (e.target.style.backgroundColor = '#d45d40')}
                    onMouseLeave={(e) => (e.target.style.backgroundColor = '#e76f51')}
                  >
                    🗑️ Excluir Minha Conta por Completo
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
                      👑 Gestão de Usuários ({listaUsuariosAdmin.length})
                    </h4>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary, #cccccc)', fontSize: '13px' }}>
                      Painel exclusivo de administração para controlar, gerenciar permissões e excluir usuários cadastrados.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={carregarUsuariosAdmin}
                    style={{
                      backgroundColor: 'var(--surface-bg, #545454)',
                      color: 'var(--text-primary, #ffffff)',
                      border: '1px solid var(--border-color, #737373)',
                      padding: '8px 14px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    🔄 Atualizar Lista
                  </button>
                </div>

                {mensagemAdmin && (
                  <div
                    style={{
                      backgroundColor: '#d90429',
                      color: '#ffffff',
                      padding: '10px 16px',
                      borderRadius: '12px',
                      fontSize: '12px',
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
                            border: ehAdminUser ? '2px solid var(--accent-color, #ffe192)' : '1px solid var(--border-color, #666666)',
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
                                backgroundColor: ehAdminUser ? 'var(--accent-color, #ffe192)' : 'var(--border-color, #666666)',
                                color: ehAdminUser ? 'var(--accent-text, #333333)' : 'var(--text-primary, #ffffff)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: '18px',
                                border: ehAdminUser ? '2px solid var(--text-primary, #ffffff)' : 'none',
                                flexShrink: 0,
                              }}
                            >
                              {u.nome ? u.nome.charAt(0).toUpperCase() : 'U'}
                            </div>

                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <strong style={{ color: 'var(--text-primary, #ffffff)', fontSize: '15px' }}>{u.nome}</strong>
                                {ehEuMesmo && (
                                  <span style={{ fontSize: '10px', backgroundColor: '#2a9d8f', color: '#ffffff', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                                    Você (Logado)
                                  </span>
                                )}
                              </div>
                              <span style={{ color: 'var(--accent-color, #ffe192)', fontSize: '12px', display: 'block', marginTop: '2px', wordBreak: 'break-all' }}>
                                ✉️ {u.email}
                              </span>
                              <span style={{ color: 'var(--text-secondary, #aaaaaa)', fontSize: '11px', display: 'block', marginTop: '2px' }}>
                                {u.perfil_uso === 'comercial' ? '🏢 Perfil Comercial' : '👤 Perfil Individual'} • Cadastro: {u.provedor === 'google' ? '🌐 Conta Google' : '🔑 E-mail & Senha'}
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
                                backgroundColor: ehAdminUser ? 'rgba(255, 225, 146, 0.15)' : 'var(--card-bg, #545454)',
                                color: ehAdminUser ? 'var(--accent-color, #ffe192)' : 'var(--text-primary, #ffffff)',
                                border: ehAdminUser ? '1px solid var(--accent-color, #ffe192)' : '1px solid var(--border-color, #737373)',
                                borderRadius: '10px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                outline: 'none',
                                cursor: u.email.toLowerCase() === 'emanuell.carvalho.pires@gmail.com' ? 'default' : 'pointer',
                              }}
                            >
                              <option value="admin" style={{ backgroundColor: 'var(--card-bg, #333)', color: 'var(--accent-color, #ffe192)' }}>👑 Admin</option>
                              <option value="comum" style={{ backgroundColor: 'var(--card-bg, #333)', color: 'var(--text-primary, #fff)' }}>👤 Comum</option>
                            </select>

                            {/* Botão Excluir Usuário do Banco de Dados */}
                            {!ehEuMesmo && (
                              <button
                                type="button"
                                onClick={() => setUsuarioParaDeletar(u)}
                                title="Excluir este usuário do banco de dados"
                                style={{
                                  backgroundColor: 'var(--card-bg, #545454)',
                                  border: '1px solid var(--border-color, #737373)',
                                  borderRadius: '10px',
                                  padding: '6px 12px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  color: '#ff8585',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#782b2b';
                                  e.currentTarget.style.borderColor = '#ff8585';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'var(--card-bg, #545454)';
                                  e.currentTarget.style.borderColor = 'var(--border-color, #737373)';
                                }}
                              >
                                <img src={iconLixeira} alt="Excluir usuário" style={{ width: '15px', height: '15px', objectFit: 'contain' }} />
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
                  <h4 style={{ margin: 0, color: '#ffffff', fontSize: '18px', fontWeight: 'bold' }}>
                    📦 Caixinha de Economia
                  </h4>
                  <p style={{ margin: '6px 0 0 0', color: '#cccccc', fontSize: '13px', lineHeight: '1.4' }}>
                    A Caixinha acumula a métrica de Economia (Receitas - Despesas) de todos os meses e anos da sua conta. O valor economizado em cada mês é automaticamente somado ou subtraído no saldo guardado total.
                  </p>
                </div>

                {/* Card de Ativação / Status */}
                <div
                  style={{
                    backgroundColor: 'var(--surface-bg, #3e3e3e)',
                    borderRadius: '16px',
                    padding: '20px',
                    border: '1px solid var(--border-color, #666666)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary, #ffffff)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>Status:</span>
                      <span style={{ color: isCaixinhaAtiva ? '#2a9d8f' : 'var(--text-secondary, #aaaaaa)' }}>
                        {isCaixinhaAtiva ? '🟢 Ativada' : '⚪ Desativada'}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary, #bbbbbb)', marginTop: '4px' }}>
                      {isCaixinhaAtiva
                        ? 'A Caixinha está ativa e acumulando os saldos de todos os meses.'
                        : 'Clique no botão ao lado para ativar a funcionalidade da Caixinha.'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleCaixinha()}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '20px',
                      border: 'none',
                      backgroundColor: isCaixinhaAtiva ? '#e76f51' : 'var(--accent-color, #ffe192)',
                      color: isCaixinhaAtiva ? '#ffffff' : 'var(--accent-text, #333333)',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      transition: 'transform 0.15s',
                    }}
                  >
                    {isCaixinhaAtiva ? 'Desativar caixinha' : 'Ativar caixinha'}
                  </button>
                </div>

                {/* Configurações Adicionais (se ativa) */}
                {isCaixinhaAtiva && (
                  <div
                    style={{
                      backgroundColor: 'var(--surface-bg, #3e3e3e)',
                      borderRadius: '16px',
                      padding: '20px',
                      border: '1px solid var(--border-color, #666666)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                    }}
                  >
                    <h5 style={{ margin: 0, color: 'var(--accent-color, #ffe192)', fontSize: '14px', fontWeight: 'bold' }}>
                      ⚙️ Saldo Inicial Guardado (Opcional)
                    </h5>

                    <div>
                      <label style={{ display: 'block', color: 'var(--text-secondary, #dddddd)', fontSize: '12px', marginBottom: '6px' }}>
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
                            border: '1px solid var(--border-color, #737373)',
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
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                          }}
                        >
                          {salvoFeedback ? '✓ Salvo!' : '💾 Salvar Saldo Inicial'}
                        </button>
                      </div>
                    </div>

                    {/* Resumo do Cálculo */}
                    <div
                      style={{
                        backgroundColor: 'var(--card-bg, #2e2e2e)',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        fontSize: '13px',
                        color: 'var(--text-secondary, #dddddd)',
                        borderLeft: '4px solid var(--accent-color, #ffe192)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Economia Acumulada (Todos os Meses/Anos):</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--text-primary, #ffffff)' }}>
                          R$ {(saldoCaixinhaAcumulado - Number(saldoInicialCaixinha || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Saldo Inicial Configurado:</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--text-primary, #ffffff)' }}>
                          R$ {(Number(saldoInicialCaixinha || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color, #444444)', paddingTop: '8px', marginTop: '4px' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--accent-color, #ffe192)' }}>Total Guardado na Caixinha:</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--accent-color, #ffe192)', fontSize: '15px' }}>
                          R$ {saldoCaixinhaAcumulado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
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
                    🎨 Aparência & Paleta de Cores
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
                    ✓ Paleta de cores aplicada e salva com sucesso!
                  </div>
                )}

                {/* 1. Presets Temáticos Prontos */}
                <div>
                  <label style={{ display: 'block', color: 'var(--text-primary, #ffffff)', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
                    👑 Temas Pré-definidos
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
                            border: isSelected ? '2px solid var(--accent-color, #ffe192)' : '1px solid var(--border-color, #666666)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            boxShadow: isSelected ? '0 4px 14px rgba(0,0,0,0.3)' : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ color: isSelected ? 'var(--accent-color, #ffe192)' : 'var(--text-primary, #ffffff)', fontSize: '13px' }}>
                              {preset.nome}
                            </strong>
                            {isSelected && (
                              <span style={{ fontSize: '10px', backgroundColor: 'var(--accent-color, #ffe192)', color: 'var(--accent-text, #333333)', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                                ✓ Ativo
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary, #aaaaaa)' }}>{preset.descricao}</span>

                          {/* Faixa de Amostra das Cores */}
                          <div style={{ display: 'flex', height: '14px', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', marginTop: '4px' }}>
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
                    border: '1px solid var(--border-color, #666666)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  <label style={{ color: 'var(--accent-color, #ffe192)', fontSize: '14px', fontWeight: 'bold' }}>
                    🎨 Personalizar Cor por Cor
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {/* Cor de Destaque / Accent */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--card-bg, #484848)', padding: '10px 14px', borderRadius: '12px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-primary, #dddddd)', fontWeight: '500' }}>⭐ Cor de Destaque</span>
                      <input
                        type="color"
                        value={customCores?.accentColor || '#ffe192'}
                        onChange={(e) => setCustomCores({ ...customCores, accentColor: e.target.value })}
                        style={{ border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'transparent' }}
                      />
                    </div>

                    {/* Fundo Principal */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--card-bg, #484848)', padding: '10px 14px', borderRadius: '12px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-primary, #dddddd)', fontWeight: '500' }}>🖥️ Fundo Principal</span>
                      <input
                        type="color"
                        value={customCores?.bgPrimary || '#3a3a3a'}
                        onChange={(e) => setCustomCores({ ...customCores, bgPrimary: e.target.value })}
                        style={{ border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'transparent' }}
                      />
                    </div>

                    {/* Quadros e Cards */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--card-bg, #484848)', padding: '10px 14px', borderRadius: '12px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-primary, #dddddd)', fontWeight: '500' }}>📊 Quadros e Painéis</span>
                      <input
                        type="color"
                        value={customCores?.cardBg || '#545454'}
                        onChange={(e) => setCustomCores({ ...customCores, cardBg: e.target.value })}
                        style={{ border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'transparent' }}
                      />
                    </div>

                    {/* Superfície de Inputs */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--card-bg, #484848)', padding: '10px 14px', borderRadius: '12px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-primary, #dddddd)', fontWeight: '500' }}>🔲 Superfície de Botões</span>
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
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      }}
                    >
                      💾 Aplicar Cores Customizadas
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
                        border: '1px solid var(--border-color, #737373)',
                        backgroundColor: 'var(--card-bg, #4a4a4a)',
                        color: 'var(--text-primary, #ffffff)',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      🔄 Restaurar Padrão
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
                    📤 Exportação de Dados
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
                      border: '1px solid var(--accent-color, #ffe192)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--accent-color, #ffe192)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🗓️ Selecione o Período a Exportar
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
                          border: modoExportacao === 'mes_a_mes' ? '2px solid var(--accent-color, #ffe192)' : '1px solid var(--border-color, #666666)',
                          backgroundColor: modoExportacao === 'mes_a_mes' ? 'var(--card-bg, #525252)' : 'var(--surface-bg, #2e2e2e)',
                          color: modoExportacao === 'mes_a_mes' ? 'var(--accent-color, #ffe192)' : 'var(--text-secondary, #cccccc)',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        🗓️ Mês
                      </button>

                      <button
                        type="button"
                        onClick={() => setModoExportacao('ano_a_ano')}
                        style={{
                          flex: 1,
                          minWidth: '90px',
                          padding: '8px 10px',
                          borderRadius: '10px',
                          border: modoExportacao === 'ano_a_ano' ? '2px solid var(--accent-color, #ffe192)' : '1px solid var(--border-color, #666666)',
                          backgroundColor: modoExportacao === 'ano_a_ano' ? 'var(--card-bg, #525252)' : 'var(--surface-bg, #2e2e2e)',
                          color: modoExportacao === 'ano_a_ano' ? 'var(--accent-color, #ffe192)' : 'var(--text-secondary, #cccccc)',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        📅 Ano
                      </button>

                      <button
                        type="button"
                        onClick={() => setModoExportacao('intervalo')}
                        style={{
                          flex: 1.4,
                          minWidth: '160px',
                          padding: '8px 10px',
                          borderRadius: '10px',
                          border: modoExportacao === 'intervalo' ? '2px solid var(--accent-color, #ffe192)' : '1px solid var(--border-color, #666666)',
                          backgroundColor: modoExportacao === 'intervalo' ? 'var(--card-bg, #525252)' : 'var(--surface-bg, #2e2e2e)',
                          color: modoExportacao === 'intervalo' ? 'var(--accent-color, #ffe192)' : 'var(--text-secondary, #cccccc)',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        📆 Período Selecionado
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
                              border: '1px solid var(--border-color, #737373)',
                              backgroundColor: 'var(--card-bg, #2e2e2e)',
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
                              border: '1px solid var(--border-color, #737373)',
                              backgroundColor: 'var(--card-bg, #2e2e2e)',
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
                            Ano de Exportação (Ano Inteiro):
                          </label>
                          <select
                            value={exportAno}
                            onChange={(e) => setExportAno(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '9px 12px',
                              borderRadius: '10px',
                              border: '1px solid var(--border-color, #737373)',
                              backgroundColor: 'var(--card-bg, #2e2e2e)',
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
                        <div style={{ flex: 1, minWidth: '180px', backgroundColor: 'var(--card-bg, #2e2e2e)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color, #545454)' }}>
                          <span style={{ fontSize: '11px', color: 'var(--accent-color, #ffe192)', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                            🟢 De (Mês/Ano Início):
                          </span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <select
                              value={intervaloMesInicio}
                              onChange={(e) => setIntervaloMesInicio(e.target.value)}
                              style={{ flex: 1.2, padding: '7px', borderRadius: '6px', backgroundColor: 'var(--surface-bg, #3e3e3e)', color: 'var(--text-primary, #fff)', border: '1px solid var(--border-color, #737373)', fontSize: '12px' }}
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
                              style={{ flex: 1, padding: '7px', borderRadius: '6px', backgroundColor: 'var(--surface-bg, #3e3e3e)', color: 'var(--text-primary, #fff)', border: '1px solid var(--border-color, #737373)', fontSize: '12px' }}
                            >
                              {Array.from({ length: 7 }, (_, i) => 2024 + i).map((ano) => (
                                <option key={ano} value={ano.toString()}>{ano}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Até */}
                        <div style={{ flex: 1, minWidth: '180px', backgroundColor: 'var(--card-bg, #2e2e2e)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color, #545454)' }}>
                          <span style={{ fontSize: '11px', color: '#e76f51', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                            🔴 Até (Mês/Ano Fim):
                          </span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <select
                              value={intervaloMesFim}
                              onChange={(e) => setIntervaloMesFim(e.target.value)}
                              style={{ flex: 1.2, padding: '7px', borderRadius: '6px', backgroundColor: '#3e3e3e', color: '#fff', border: '1px solid #737373', fontSize: '12px' }}
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
                              style={{ flex: 1, padding: '7px', borderRadius: '6px', backgroundColor: '#3e3e3e', color: '#fff', border: '1px solid #737373', fontSize: '12px' }}
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
                      border: '1px solid var(--border-color, #666666)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      transition: 'border-color 0.2s, transform 0.1s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                      <div
                        style={{
                          fontSize: '28px',
                          backgroundColor: '#2b4c3f',
                          padding: '10px',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        📊
                      </div>
                      <div>
                        <strong style={{ color: 'var(--text-primary, #ffffff)', fontSize: '15px', display: 'block' }}>
                          Exportar Excel (.csv)
                        </strong>
                        <span style={{ color: 'var(--text-secondary, #aaaaaa)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                          Gera uma planilha compatível com Microsoft Excel, Google Sheets e LibreOffice.
                        </span>
                      </div>
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
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        transition: 'background-color 0.2s, transform 0.1s',
                      }}
                      onMouseEnter={(e) => (e.target.style.backgroundColor = '#238377')}
                      onMouseLeave={(e) => (e.target.style.backgroundColor = '#2a9d8f')}
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
                      border: '1px solid var(--border-color, #666666)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      transition: 'border-color 0.2s, transform 0.1s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                      <div
                        style={{
                          fontSize: '28px',
                          backgroundColor: '#4c2b2b',
                          padding: '10px',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        📄
                      </div>
                      <div>
                        <strong style={{ color: 'var(--text-primary, #ffffff)', fontSize: '15px', display: 'block' }}>
                          Exportar PDF Executivo
                        </strong>
                        <span style={{ color: '#aaaaaa', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                          Relatório executivo formatado com resumos financeiros para impressão ou envio.
                        </span>
                      </div>
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
                        backgroundColor: '#e76f51',
                        color: '#ffffff',
                        border: 'none',
                        padding: '10px 18px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        transition: 'background-color 0.2s, transform 0.1s',
                      }}
                      onMouseEnter={(e) => (e.target.style.backgroundColor = '#d45d40')}
                      onMouseLeave={(e) => (e.target.style.backgroundColor = '#e76f51')}
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
                    📥 Importar Fatura do Nubank (CSV)
                  </h4>
                  <p style={{ margin: 0, color: 'var(--text-secondary, #cccccc)', fontSize: '13px', lineHeight: '1.5' }}>
                    Selecione o arquivo <strong>.csv</strong> de fatura exportado diretamente do seu aplicativo ou Web do <strong>Nubank</strong>. O sistema processará as transações, identificará parcelamentos automaticamente e <strong>impedirá a criação de registros duplicados</strong>.
                  </p>
                </div>

                {importFeedbackNubank && (
                  <div
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      backgroundColor: importFeedbackNubank.tipo === 'sucesso' ? 'rgba(42, 157, 143, 0.2)' : 'rgba(231, 111, 81, 0.2)',
                      border: `1px solid ${importFeedbackNubank.tipo === 'sucesso' ? '#2a9d8f' : '#e76f51'}`,
                      color: importFeedbackNubank.tipo === 'sucesso' ? '#2a9d8f' : '#ff6b6b',
                      fontSize: '13px',
                      fontWeight: 'bold',
                    }}
                  >
                    {importFeedbackNubank.mensagem}
                  </div>
                )}

                {/* Passo 1: Seleção do Arquivo CSV */}
                {!parsedCsvResult && (
                  <div
                    style={{
                      border: '2px dashed var(--border-color, #666666)',
                      borderRadius: '16px',
                      padding: '36px 24px',
                      textAlign: 'center',
                      backgroundColor: 'rgba(0, 0, 0, 0.15)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '14px',
                    }}
                  >
                    <div style={{ fontSize: '42px' }}>📄</div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary, #ffffff)', marginBottom: '4px' }}>
                        Clique para selecionar o arquivo CSV da fatura Nubank
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary, #aaaaaa)' }}>
                        Formato esperado: date, title, amount (ex: 2026-08-02, Dl*99 Ride, "19,80")
                      </div>
                    </div>

                    <label
                      htmlFor="nubank-csv-input"
                      style={{
                        backgroundColor: 'var(--accent-color, #ffe192)',
                        color: 'var(--accent-text, #333333)',
                        padding: '10px 22px',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        transition: 'transform 0.2s',
                        display: 'inline-block',
                      }}
                    >
                      📁 Escolher Arquivo CSV
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

                {/* Passo 2: Prévia e Validação Anti-Duplicata */}
                {parsedCsvResult && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Cards de Resumo */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                      <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color, #555555)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary, #aaaaaa)', fontWeight: 'bold' }}>TOTAL NO CSV</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary, #ffffff)', marginTop: '4px' }}>
                          {parsedCsvResult.totalItens} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>itens</span>
                        </div>
                      </div>

                      <div style={{ backgroundColor: 'rgba(42, 157, 143, 0.15)', padding: '12px 14px', borderRadius: '12px', border: '1px solid #2a9d8f' }}>
                        <div style={{ fontSize: '11px', color: '#2a9d8f', fontWeight: 'bold' }}>NOVOS A IMPORTAR</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2a9d8f', marginTop: '4px' }}>
                          {parsedCsvResult.qtdNovos} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>itens</span>
                        </div>
                      </div>

                      <div style={{ backgroundColor: 'rgba(231, 111, 81, 0.15)', padding: '12px 14px', borderRadius: '12px', border: '1px solid #e76f51' }}>
                        <div style={{ fontSize: '11px', color: '#e76f51', fontWeight: 'bold' }}>DUPLICADOS (IGNORADOS)</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#e76f51', marginTop: '4px' }}>
                          {parsedCsvResult.qtdDuplicados} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>itens</span>
                        </div>
                      </div>

                      <div style={{ backgroundColor: 'rgba(255, 225, 146, 0.15)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--accent-color, #ffe192)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--accent-color, #ffe192)', fontWeight: 'bold' }}>VALOR TOTAL NOVOS</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--accent-color, #ffe192)', marginTop: '4px' }}>
                          R$ {formatarCurrencyValue(parsedCsvResult.valorTotalNovos)}
                        </div>
                      </div>
                    </div>

                    {/* Seleção de Categoria Padrão */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '12px' }}>
                      <label style={{ color: 'var(--text-primary, #ffffff)', fontSize: '13px', fontWeight: 'bold' }}>
                        Categoria Padrão para os Novos Lançamentos:
                      </label>
                      <select
                        value={categoriaImportacao}
                        onChange={(e) => setCategoriaImportacao(e.target.value)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color, #666)',
                          backgroundColor: 'var(--surface-bg, #333)',
                          color: 'var(--text-primary, #fff)',
                          fontSize: '13px',
                          outline: 'none',
                        }}
                      >
                        <option value="Nubank">Nubank (Padrão)</option>
                        {categorias.map((cat) => (
                          <option key={cat.id || cat.nome} value={cat.nome}>
                            {cat.nome}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Tabela de Prévia */}
                    <div style={{ maxHeight: '440px', overflowY: 'auto', borderRadius: '12px', border: '1px solid var(--border-color, #555)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'rgba(0,0,0,0.4)', color: 'var(--accent-color, #ffe192)', borderBottom: '1px solid var(--border-color, #555)' }}>
                            <th style={{ padding: '10px 12px' }}>Status</th>
                            <th style={{ padding: '10px 12px' }}>Data</th>
                            <th style={{ padding: '10px 12px' }}>Título / Estabelecimento</th>
                            <th style={{ padding: '10px 12px' }}>Parcela</th>
                            <th style={{ padding: '10px 12px' }}>Tipo</th>
                            <th style={{ padding: '10px 12px', textAlign: 'right' }}>Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedCsvResult.itens.map((item, idx) => (
                            <tr
                              key={item.idTemp || idx}
                              style={{
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                backgroundColor: item.isDuplicado ? 'rgba(231, 111, 81, 0.08)' : 'transparent',
                                opacity: item.isDuplicado ? 0.6 : 1,
                              }}
                            >
                              <td style={{ padding: '8px 12px' }}>
                                {item.isDuplicado ? (
                                  <span style={{ color: '#e76f51', fontWeight: 'bold', fontSize: '11px', backgroundColor: 'rgba(231,111,81,0.2)', padding: '2px 8px', borderRadius: '6px' }}>
                                    ⚠️ Duplicado (Ignorado)
                                  </span>
                                ) : (
                                  <span style={{ color: '#2a9d8f', fontWeight: 'bold', fontSize: '11px', backgroundColor: 'rgba(42,157,143,0.2)', padding: '2px 8px', borderRadius: '6px' }}>
                                    ✅ Novo
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '8px 12px', color: 'var(--text-secondary, #ccc)' }}>
                                {item.dia}/{item.mes}/{item.ano}
                              </td>
                              <td style={{ padding: '8px 12px', color: 'var(--text-primary, #fff)', fontWeight: 'bold' }}>
                                {item.nome}
                              </td>
                              <td style={{ padding: '8px 12px', color: 'var(--text-secondary, #aaa)' }}>
                                {item.parcelas}
                              </td>
                              <td style={{ padding: '8px 12px' }}>
                                <span style={{ color: item.tipo === 'receitas' ? '#2a9d8f' : '#e76f51', fontWeight: 'bold' }}>
                                  {item.tipo === 'receitas' ? 'Receita' : 'Despesa'}
                                </span>
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-primary, #fff)', fontWeight: 'bold' }}>
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
                        🔄 Cancelar / Escolher Outro
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
                        {importandoNubank ? 'Importando Lançamentos...' : `📥 Confirmar Importação de ${parsedCsvResult.qtdNovos} Novos Lançamentos`}
                      </button>
                    </div>
                  </div>
                )}
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
