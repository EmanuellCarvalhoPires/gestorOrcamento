import React, { useState } from 'react';
import { useBudget } from '../contexts/BudgetContext';
import appIcon from '../../images/app_icon.jpg';

export default function AuthView() {
  const { login, registrar } = useBudget();
  const [isRegistro, setIsRegistro] = useState(false);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [perfilUso, setPerfilUso] = useState('individual'); // 'individual' ou 'comercial'
  
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (isRegistro) {
      if (!nome.trim() || !email.trim() || !senha.trim()) {
        setErrorMsg('Preencha todos os campos obrigatórios.');
        setLoading(false);
        return;
      }
      const res = await registrar({ nome, email, senha, perfilUso });
      if (!res?.success) {
        setErrorMsg(res?.error || 'Erro ao realizar cadastro.');
      }
    } else {
      if (!email.trim() || !senha.trim()) {
        setErrorMsg('Preencha o e-mail e a senha.');
        setLoading(false);
        return;
      }
      const res = await login({ email, senha });
      if (!res?.success) {
        setErrorMsg(res?.error || 'Falha ao realizar login.');
      }
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#3e3e3e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          backgroundColor: '#545454',
          borderRadius: '24px',
          padding: '36px',
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Logo do Aplicativo */}
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            overflow: 'hidden',
            marginBottom: '14px',
            border: '2px solid #ffe192',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}
        >
          <img src={appIcon} alt="Logo Gestor de Orçamento" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        {/* Título e Subtítulo */}
        <h2 style={{ margin: '0 0 8px 0', color: '#ffe192', fontSize: '26px', textAlign: 'center' }}>
          Gestor de Orçamento
        </h2>
        <p style={{ margin: '0 0 24px 0', color: '#dddddd', fontSize: '14px', textAlign: 'center' }}>
          {isRegistro ? 'Crie sua conta e escolha seu modo de uso' : 'Faça login para acessar suas finanças'}
        </p>

        {/* Mensagem de Erro */}
        {errorMsg && (
          <div
            style={{
              backgroundColor: '#d90429',
              color: '#ffffff',
              padding: '10px 16px',
              borderRadius: '12px',
              fontSize: '13px',
              marginBottom: '16px',
              width: '100%',
              textAlign: 'center',
              fontWeight: '500',
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isRegistro && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cccccc', marginBottom: '6px' }}>
                Seu Nome Completo
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Emanuel Carvalho"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid #737373',
                  backgroundColor: '#3e3e3e',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#cccccc', marginBottom: '6px' }}>
              Endereço de E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@exemplo.com"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1px solid #737373',
                backgroundColor: '#3e3e3e',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#cccccc', marginBottom: '6px' }}>
              Sua Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1px solid #737373',
                backgroundColor: '#3e3e3e',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Seletor de Perfil no Cadastro */}
          {isRegistro && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#ffe192', marginBottom: '8px', fontWeight: 'bold' }}>
                Objetivo de Uso do App:
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setPerfilUso('individual')}
                  style={{
                    flex: 1,
                    padding: '12px 10px',
                    borderRadius: '14px',
                    border: perfilUso === 'individual' ? '2px solid #ffe192' : '1px solid #737373',
                    backgroundColor: perfilUso === 'individual' ? '#666666' : '#3e3e3e',
                    color: perfilUso === 'individual' ? '#ffe192' : '#aaaaaa',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: '20px' }}>👤</span>
                  <span>Uso Individual</span>
                  <span style={{ fontSize: '10px', fontWeight: 'normal', color: '#dddddd' }}>Finanças Pessoais</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPerfilUso('comercial')}
                  style={{
                    flex: 1,
                    padding: '12px 10px',
                    borderRadius: '14px',
                    border: perfilUso === 'comercial' ? '2px solid #ffe192' : '1px solid #737373',
                    backgroundColor: perfilUso === 'comercial' ? '#666666' : '#3e3e3e',
                    color: perfilUso === 'comercial' ? '#ffe192' : '#aaaaaa',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: '20px' }}>🏢</span>
                  <span>Uso Comercial</span>
                  <span style={{ fontSize: '10px', fontWeight: 'normal', color: '#dddddd' }}>Empresas & Comércio</span>
                </button>
              </div>
            </div>
          )}

          {/* Botão Submeter */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '10px',
              padding: '14px',
              borderRadius: '24px',
              border: 'none',
              backgroundColor: '#ffe192',
              color: '#333333',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              transition: 'transform 0.1s',
            }}
          >
            {loading ? 'Processando...' : isRegistro ? 'Criar Conta' : 'Entrar no Sistema'}
          </button>
        </form>

        {/* Alternar entre Login e Cadastro */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            onClick={() => {
              setIsRegistro(!isRegistro);
              setErrorMsg('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#aaaaaa',
              fontSize: '13px',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            {isRegistro ? 'Já possui uma conta? Faça Login' : 'Ainda não tem conta? Cadastre-se'}
          </button>
        </div>
      </div>
    </div>
  );
}
