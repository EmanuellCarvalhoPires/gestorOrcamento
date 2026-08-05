import React, { useState, useEffect } from 'react';
import { useBudget } from '../contexts/BudgetContext';
import { apiService } from '../services/api';
import iconLixeira from '../../images/lixeira-de-reciclagem.png';

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
  } = useBudget();

  const isAdmin = usuarioLogado?.funcao === 'admin' || usuarioLogado?.email?.toLowerCase() === 'emanuell.carvalho.pires@gmail.com';

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

  const [valorInicialStr, setValorInicialStr] = useState(
    saldoInicialCaixinha ? String(saldoInicialCaixinha) : ''
  );

  useEffect(() => {
    setValorInicialStr(saldoInicialCaixinha ? String(saldoInicialCaixinha) : '');
  }, [saldoInicialCaixinha]);

  const handleValorInicialChange = (valStr) => {
    setValorInicialStr(valStr);
    if (valStr === '' || valStr === '-') {
      atualizarSaldoInicialCaixinha(0);
    } else {
      const num = parseFloat(valStr);
      atualizarSaldoInicialCaixinha(isNaN(num) ? 0 : num);
    }
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
          backgroundColor: '#545454',
          borderRadius: '24px',
          width: '90%',
          maxWidth: '720px',
          height: '520px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
          border: '1px solid #666666',
          overflow: 'hidden',
        }}
      >
        {/* Cabeçalho do Modal */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #666666',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#444444',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>⚙️</span>
            <h3 style={{ margin: 0, color: '#ffffff', fontSize: '20px', fontWeight: 'bold' }}>
              Configurações
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#aaaaaa',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '8px',
              transition: 'color 0.2s, background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.target.style.color = '#ffffff';
              e.target.style.backgroundColor = '#555555';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = '#aaaaaa';
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
              backgroundColor: '#3e3e3e',
              borderRight: '1px solid #666666',
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
                color: '#ffe192',
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
                backgroundColor: activeTab === 'perfil' ? '#545454' : 'transparent',
                color: activeTab === 'perfil' ? '#ffe192' : '#ffffff',
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
                <span style={{ fontSize: '12px', color: '#ffe192' }}>●</span>
              )}
            </button>

            {/* Opção Geral */}
            <button
              type="button"
              onClick={() => setActiveTab('geral')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: activeTab === 'geral' ? '#545454' : 'transparent',
                color: activeTab === 'geral' ? '#ffe192' : '#ffffff',
                fontWeight: activeTab === 'geral' ? 'bold' : 'normal',
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                boxShadow: activeTab === 'geral' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>⚙️</span>
                <span>Geral</span>
              </div>
              <span
                style={{
                  fontSize: '10px',
                  backgroundColor: '#666666',
                  color: '#dddddd',
                  padding: '2px 6px',
                  borderRadius: '10px',
                }}
              >
                Em breve
              </span>
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
                  backgroundColor: activeTab === 'usuarios' ? '#545454' : 'transparent',
                  color: activeTab === 'usuarios' ? '#ffe192' : '#ffffff',
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
                    backgroundColor: '#ffe192',
                    color: '#333333',
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
                backgroundColor: activeTab === 'caixinha' ? '#545454' : 'transparent',
                color: activeTab === 'caixinha' ? '#ffe192' : '#ffffff',
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
                  backgroundColor: isCaixinhaAtiva ? '#2a9d8f' : '#666666',
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
                backgroundColor: activeTab === 'exportar' ? '#545454' : 'transparent',
                color: activeTab === 'exportar' ? '#ffe192' : '#ffffff',
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
                <span style={{ fontSize: '12px', color: '#2a9d8f' }}>●</span>
              )}
            </button>
          </div>

          {/* Painel Principal de Conteúdo */}
          <div
            style={{
              flex: 1,
              padding: '24px',
              backgroundColor: '#4a4a4a',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Aba Meu Perfil */}
            {activeTab === 'perfil' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h4 style={{ margin: '0 0 6px 0', color: '#ffe192', fontSize: '18px', fontWeight: 'bold' }}>
                    👤 Meu Perfil
                  </h4>
                  <p style={{ margin: 0, color: '#dddddd', fontSize: '13px' }}>
                    Informações do usuário logado e gerenciamento das suas contas financeiras.
                  </p>
                </div>

                {/* Card de Informações do Usuário */}
                <div
                  style={{
                    backgroundColor: '#3e3e3e',
                    borderRadius: '16px',
                    padding: '20px 24px',
                    border: '1px solid #666666',
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
                      backgroundColor: '#ffe192',
                      color: '#333333',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '24px',
                      border: '3px solid #737373',
                      flexShrink: 0,
                    }}
                  >
                    {usuarioLogado?.nome ? usuarioLogado.nome.charAt(0).toUpperCase() : 'U'}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                    <div style={{ fontSize: '17px', fontWeight: 'bold', color: '#ffffff' }}>
                      {usuarioLogado?.nome || 'Usuário'}
                    </div>
                    
                    <div style={{ fontSize: '13px', color: '#ffe192', fontWeight: 'bold', wordBreak: 'break-all' }}>
                      ✉️ {usuarioLogado?.email || 'Nenhum e-mail cadastrado'}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          backgroundColor: '#545454',
                          color: '#ffffff',
                          padding: '3px 10px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          border: '1px solid #737373',
                        }}
                      >
                        {isComercial ? '🏢 Perfil Comercial / Corporativo' : '👤 Perfil Individual / Pessoal'}
                      </span>

                      {/* Classificação da Conta: Visível Apenas se for Administrador */}
                      {isAdmin && (
                        <span
                          style={{
                            backgroundColor: 'rgba(255, 225, 146, 0.2)',
                            color: '#ffe192',
                            padding: '3px 10px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            border: '1px solid #ffe192',
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
                      <h4 style={{ margin: 0, color: '#ffffff', fontSize: '16px', fontWeight: 'bold' }}>
                        💳 Minhas Contas ({contas.length})
                      </h4>
                      <p style={{ margin: '2px 0 0 0', color: '#cccccc', fontSize: '12px' }}>
                        Alterne entre suas contas financeiras ou crie novas contas para seu orçamento.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenCreateAccount) onOpenCreateAccount();
                      }}
                      style={{
                        backgroundColor: '#ffe192',
                        color: '#333333',
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
                            backgroundColor: '#3e3e3e',
                            borderRadius: '14px',
                            padding: '14px 18px',
                            border: ehAtiva ? '1px solid #ffe192' : '1px solid #666666',
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
                                backgroundColor: c.cor || '#ffe192',
                                flexShrink: 0,
                              }}
                            />
                            <div>
                              <strong style={{ color: '#ffffff', fontSize: '14px', display: 'block' }}>
                                {c.nome}
                              </strong>
                              <span style={{ color: '#aaaaaa', fontSize: '12px', marginTop: '2px', display: 'block' }}>
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
                                backgroundColor: ehAtiva ? '#2b4c3f' : '#545454',
                                color: ehAtiva ? '#2a9d8f' : '#ffffff',
                                border: ehAtiva ? '1px solid #2a9d8f' : '1px solid #737373',
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
                                backgroundColor: '#545454',
                                border: '1px solid #737373',
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
                                e.currentTarget.style.backgroundColor = '#545454';
                                e.currentTarget.style.borderColor = '#737373';
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
              </div>
            )}

            {/* Aba Gestão de Usuários (Visível Exclusivamente para Admin) */}
            {activeTab === 'usuarios' && isAdmin && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h4 style={{ margin: 0, color: '#ffe192', fontSize: '18px', fontWeight: 'bold' }}>
                      👑 Gestão de Usuários ({listaUsuariosAdmin.length})
                    </h4>
                    <p style={{ margin: '4px 0 0 0', color: '#cccccc', fontSize: '13px' }}>
                      Painel exclusivo de administração para controlar, gerenciar permissões e excluir usuários cadastrados.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={carregarUsuariosAdmin}
                    style={{
                      backgroundColor: '#545454',
                      color: '#ffffff',
                      border: '1px solid #737373',
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
                  <div style={{ textAlign: 'center', padding: '32px', color: '#cccccc', fontSize: '14px' }}>
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
                            backgroundColor: '#3e3e3e',
                            borderRadius: '16px',
                            padding: '16px 20px',
                            border: ehAdminUser ? '1px solid #ffe192' : '1px solid #666666',
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
                                backgroundColor: ehAdminUser ? '#ffe192' : '#666666',
                                color: ehAdminUser ? '#333333' : '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: '18px',
                                border: ehAdminUser ? '2px solid #ffffff' : 'none',
                                flexShrink: 0,
                              }}
                            >
                              {u.nome ? u.nome.charAt(0).toUpperCase() : 'U'}
                            </div>

                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <strong style={{ color: '#ffffff', fontSize: '15px' }}>{u.nome}</strong>
                                {ehEuMesmo && (
                                  <span style={{ fontSize: '10px', backgroundColor: '#2a9d8f', color: '#ffffff', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                                    Você (Logado)
                                  </span>
                                )}
                              </div>
                              <span style={{ color: '#ffe192', fontSize: '12px', display: 'block', marginTop: '2px', wordBreak: 'break-all' }}>
                                ✉️ {u.email}
                              </span>
                              <span style={{ color: '#aaaaaa', fontSize: '11px', display: 'block', marginTop: '2px' }}>
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
                                backgroundColor: ehAdminUser ? 'rgba(255, 225, 146, 0.2)' : '#545454',
                                color: ehAdminUser ? '#ffe192' : '#ffffff',
                                border: ehAdminUser ? '1px solid #ffe192' : '1px solid #737373',
                                borderRadius: '10px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                outline: 'none',
                                cursor: u.email.toLowerCase() === 'emanuell.carvalho.pires@gmail.com' ? 'default' : 'pointer',
                              }}
                            >
                              <option value="admin" style={{ backgroundColor: '#333', color: '#ffe192' }}>👑 Admin</option>
                              <option value="comum" style={{ backgroundColor: '#333', color: '#fff' }}>👤 Comum</option>
                            </select>

                            {/* Botão Excluir Usuário do Banco de Dados */}
                            {!ehEuMesmo && (
                              <button
                                type="button"
                                onClick={() => setUsuarioParaDeletar(u)}
                                title="Excluir este usuário do banco de dados"
                                style={{
                                  backgroundColor: '#545454',
                                  border: '1px solid #737373',
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
                                  e.currentTarget.style.backgroundColor = '#545454';
                                  e.currentTarget.style.borderColor = '#737373';
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
                    backgroundColor: '#3e3e3e',
                    borderRadius: '16px',
                    padding: '20px',
                    border: '1px solid #666666',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>Status:</span>
                      <span style={{ color: isCaixinhaAtiva ? '#2a9d8f' : '#aaaaaa' }}>
                        {isCaixinhaAtiva ? '🟢 Ativada' : '⚪ Desativada'}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#bbbbbb', marginTop: '4px' }}>
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
                      backgroundColor: isCaixinhaAtiva ? '#e76f51' : '#ffe192',
                      color: isCaixinhaAtiva ? '#ffffff' : '#333333',
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
                      backgroundColor: '#3e3e3e',
                      borderRadius: '16px',
                      padding: '20px',
                      border: '1px solid #666666',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                    }}
                  >
                    <h5 style={{ margin: 0, color: '#ffe192', fontSize: '14px', fontWeight: 'bold' }}>
                      ⚙️ Saldo Inicial Guardado (Opcional)
                    </h5>

                    <div>
                      <label style={{ display: 'block', color: '#dddddd', fontSize: '12px', marginBottom: '6px' }}>
                        Caso já possuísse algum valor guardado antes de usar o sistema:
                      </label>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{ color: '#ffe192', fontWeight: 'bold' }}>R$</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          value={valorInicialStr}
                          onChange={(e) => handleValorInicialChange(e.target.value)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '10px',
                            border: '1px solid #737373',
                            backgroundColor: '#545454',
                            color: '#ffffff',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            outline: 'none',
                            width: '140px',
                          }}
                        />
                      </div>
                    </div>

                    {/* Resumo do Cálculo */}
                    <div
                      style={{
                        backgroundColor: '#2e2e2e',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        fontSize: '13px',
                        color: '#dddddd',
                        borderLeft: '4px solid #ffe192',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Economia Acumulada (Todos os Meses/Anos):</span>
                        <span style={{ fontWeight: 'bold', color: '#ffffff' }}>
                          R$ {(saldoCaixinhaAcumulado - Number(saldoInicialCaixinha || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Saldo Inicial Configurado:</span>
                        <span style={{ fontWeight: 'bold', color: '#ffffff' }}>
                          R$ {(Number(saldoInicialCaixinha || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #444444', paddingTop: '8px', marginTop: '4px' }}>
                        <span style={{ fontWeight: 'bold', color: '#ffe192' }}>Total Guardado na Caixinha:</span>
                        <span style={{ fontWeight: 'bold', color: '#ffe192', fontSize: '15px' }}>
                          R$ {saldoCaixinhaAcumulado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Aba Exportar */}
            {activeTab === 'exportar' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h4 style={{ margin: 0, color: '#ffffff', fontSize: '18px', fontWeight: 'bold' }}>
                    📤 Exportação de Dados
                  </h4>
                  <p style={{ margin: '6px 0 0 0', color: '#cccccc', fontSize: '13px' }}>
                    Exporte seus lançamentos e relatórios financeiros em formatos padrão de mercado.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Opção 1: Excel / CSV */}
                  <div
                    style={{
                      backgroundColor: '#3e3e3e',
                      borderRadius: '16px',
                      padding: '18px 20px',
                      border: '1px solid #666666',
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
                        <strong style={{ color: '#ffffff', fontSize: '15px', display: 'block' }}>
                          Exportar Excel (.csv)
                        </strong>
                        <span style={{ color: '#aaaaaa', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                          Gera uma planilha compatível com Microsoft Excel, Google Sheets e LibreOffice.
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onExportCSV();
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
                      backgroundColor: '#3e3e3e',
                      borderRadius: '16px',
                      padding: '18px 20px',
                      border: '1px solid #666666',
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
                        <strong style={{ color: '#ffffff', fontSize: '15px', display: 'block' }}>
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
                        onExportPDF();
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
          </div>
        </div>
      </div>
    </div>
  );
}
