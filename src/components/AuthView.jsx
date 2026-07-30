import React, { useState } from 'react';
import { useBudget } from '../contexts/BudgetContext';
import logoApp from '../../images/Logo App.png';
import logoGoogle from '../../images/Logo google.png';

export default function AuthView() {
  const { login, registrar } = useBudget();
  const [modo, setModo] = useState('login'); // 'login' ou 'registrar'

  // Campos de Formulário
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  // Mensagens de Feedback
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    if (modo === 'registrar') {
      if (!nome.trim()) {
        setErro('Por favor, informe seu nome de usuário.');
        return;
      }
      if (senha !== confirmarSenha) {
        setErro('As senhas não coincidem. Digite novamente.');
        return;
      }
      if (senha.length < 6) {
        setErro('A senha deve conter pelo menos 6 caracteres.');
        return;
      }
    }

    setLoading(true);

    if (modo === 'login') {
      const res = await login({ email, senha });
      if (!res.success) {
        setErro(res.error || 'Erro ao realizar login.');
      }
    } else {
      const res = await registrar({ nome, email, senha });
      if (!res.success) {
        setErro(res.error || 'Erro ao criar conta.');
      }
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#3a3a3a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          backgroundColor: '#545454',
          borderRadius: '20px',
          padding: '36px',
          width: '100%',
          maxWidth: '420px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
        }}
      >
        {/* Logotipo do App */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <img
            src={logoApp}
            alt="Logo Gestor de Orçamento"
            style={{ width: '90px', height: 'auto', marginBottom: '12px' }}
          />
          <h1 style={{ margin: 0, color: '#ffe192', fontSize: '24px', fontWeight: 'bold' }}>
            Gestor de Orçamento
          </h1>
          <p style={{ margin: '6px 0 0 0', color: '#dddddd', fontSize: '14px' }}>
            {modo === 'login' ? 'Entre na sua conta para continuar' : 'Crie sua conta para gerenciar suas finanças'}
          </p>
        </div>

        {/* Mensagem de Erro */}
        {erro && (
          <div
            style={{
              width: '100%',
              backgroundColor: '#d90429',
              color: '#ffffff',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              textAlign: 'center',
            }}
          >
            {erro}
          </div>
        )}

        {/* Formulário Principal */}
        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {modo === 'registrar' && (
            <div>
              <label style={{ fontSize: '13px', color: '#ffe192', display: 'block', marginBottom: '4px' }}>
                Nome de Usuário*
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                placeholder="Seu nome completo ou apelido"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #737373',
                  backgroundColor: '#666666',
                  color: '#ffffff',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: '13px', color: '#ffe192', display: 'block', marginBottom: '4px' }}>
              E-mail*
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seuemail@exemplo.com"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #737373',
                backgroundColor: '#666666',
                color: '#ffffff',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', color: '#ffe192', display: 'block', marginBottom: '4px' }}>
              Senha*
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              placeholder="Sua senha secreta"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #737373',
                backgroundColor: '#666666',
                color: '#ffffff',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {modo === 'registrar' && (
            <div>
              <label style={{ fontSize: '13px', color: '#ffe192', display: 'block', marginBottom: '4px' }}>
                Confirmar Senha*
              </label>
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required
                placeholder="Repita a senha"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #737373',
                  backgroundColor: '#666666',
                  color: '#ffffff',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          {modo === 'login' && (
            <div style={{ textAlign: 'right', marginTop: '-6px' }}>
              <a
                href="#esqueceu"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Em breve você receberá as instruções de redefinição por e-mail.');
                }}
                style={{ color: '#ffe192', fontSize: '12px', textDecoration: 'none' }}
              >
                Esqueceu sua senha?
              </a>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px',
              borderRadius: '24px',
              border: 'none',
              backgroundColor: '#ffe192',
              color: '#333333',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: loading ? 'wait' : 'pointer',
              marginTop: '10px',
              transition: 'opacity 0.2s',
            }}
          >
            {loading ? 'Aguarde...' : modo === 'login' ? 'Entrar' : 'Cadastrar Conta'}
          </button>
        </form>

        {/* Divisor Visual */}
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', margin: '4px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#737373' }} />
          <span style={{ padding: '0 10px', color: '#aaaaaa', fontSize: '12px' }}>ou</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#737373' }} />
        </div>

        {/* Botão de Entrar com Google (Preparado) */}
        <button
          type="button"
          onClick={() => alert('Autenticação com Google estará disponível em breve!')}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: '24px',
            border: '1px solid #737373',
            backgroundColor: '#666666',
            color: '#ffffff',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
          }}
        >
          <img src={logoGoogle} alt="Google logo" style={{ width: '20px', height: '20px' }} />
          Continuar com o Google
        </button>

        {/* Alternador de Modo (Login vs Registrar) */}
        <div style={{ fontSize: '14px', color: '#dddddd', textAlign: 'center', marginTop: '6px' }}>
          {modo === 'login' ? (
            <>
              Não tem uma conta?{' '}
              <button
                onClick={() => { setModo('registrar'); setErro(''); }}
                style={{ background: 'none', border: 'none', color: '#ffe192', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Cadastre-se
              </button>
            </>
          ) : (
            <>
              Já possui uma conta?{' '}
              <button
                onClick={() => { setModo('login'); setErro(''); }}
                style={{ background: 'none', border: 'none', color: '#ffe192', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Faça Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
