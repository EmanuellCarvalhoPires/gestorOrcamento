import React, { useState } from 'react';
import { useBudget } from '../contexts/BudgetContext';
import { apiService } from '../services/api';
import { validarSintaxeEmail } from '../utils/emailValidator';
import appIcon from '../../images/app_icon.jpg';
import logoGoogle from '../../images/Logo google - fundo branco.png';

export default function AuthView() {
  const { login, loginGoogle, registrar } = useBudget();
  const [isRegistro, setIsRegistro] = useState(false);
  const [isEsqueciSenha, setIsEsqueciSenha] = useState(false);
  const [passoRecuperacao, setPassoRecuperacao] = useState(1); // 1 = solicitar e-mail, 2 = digitar código e nova senha

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [codigoRecuperacao, setCodigoRecuperacao] = useState('');
  const [perfilUso, setPerfilUso] = useState('individual');
  const [passoRegistro, setPassoRegistro] = useState(1); // 1 = preencher dados, 2 = código de 6 dígitos enviado por e-mail
  const [codigoVerificacao, setCodigoVerificacao] = useState('');
  
  const [showSenha, setShowSenha] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    if (isEsqueciSenha) {
      if (passoRecuperacao === 1) {
        if (!email.trim()) {
          setErrorMsg('Digite seu e-mail cadastrado.');
          setLoading(false);
          return;
        }
        try {
          const res = await apiService.solicitarRecuperacaoSenha({ email });
          if (res?.success) {
            setSuccessMsg(res.message || 'Código de 6 dígitos enviado para seu e-mail.');
            setPassoRecuperacao(2);
            setCodigoRecuperacao('');
            setConfirmarSenha('');
            if (res.previewUrl) setPreviewUrl(res.previewUrl);
          } else {
            setErrorMsg(res?.error || 'Erro ao enviar e-mail de recuperação.');
          }
        } catch (err) {
          setErrorMsg(err.message || 'Erro ao solicitar e-mail de recuperação.');
        }
        setLoading(false);
        return;
      }

      if (passoRecuperacao === 2) {
        if (!codigoRecuperacao.trim() || !novaSenha.trim() || !confirmarSenha.trim()) {
          setErrorMsg('Preencha o código de 6 dígitos, a nova senha e a confirmação de senha.');
          setLoading(false);
          return;
        }

        if (novaSenha !== confirmarSenha) {
          setErrorMsg('A nova senha e a confirmação de senha não coincidem.');
          setLoading(false);
          return;
        }

        try {
          const res = await apiService.confirmarRecuperacaoSenha({
            email,
            codigo: codigoRecuperacao,
            novaSenha,
          });
          if (res?.success) {
            setSuccessMsg(res.message || 'Senha redefinida com sucesso!');
            setIsEsqueciSenha(false);
            setPassoRecuperacao(1);
            setSenha(novaSenha);
            setNovaSenha('');
            setConfirmarSenha('');
            setCodigoRecuperacao('');
          } else {
            setErrorMsg(res?.error || 'Erro ao redefinir senha.');
          }
        } catch (err) {
          setErrorMsg(err.message || 'Erro ao redefinir a senha.');
        }
        setLoading(false);
        return;
      }
    }

    if (isRegistro) {
      if (passoRegistro === 1) {
        if (!nome.trim() || !email.trim() || !senha.trim() || !confirmarSenha.trim()) {
          setErrorMsg('Preencha todos os campos obrigatórios.');
          setLoading(false);
          return;
        }

        if (senha !== confirmarSenha) {
          setErrorMsg('As senhas digitadas não coincidem. Verifique a confirmação de senha.');
          setLoading(false);
          return;
        }

        // Validação estrita de sintaxe, domínios falsos/temporários e typos
        const validacaoEmail = validarSintaxeEmail(email);
        if (!validacaoEmail.valido) {
          setErrorMsg(validacaoEmail.erro);
          setLoading(false);
          return;
        }

        // Envia o código de verificação para o e-mail informado
        const resEnvio = await apiService.enviarCodigoVerificacao({
          email: validacaoEmail.emailLimpo,
          nome,
        });

        if (resEnvio?.success) {
          setSuccessMsg(resEnvio.message || `Código enviado para ${validacaoEmail.emailLimpo}! Check a sua caixa de entrada.`);
          setPassoRegistro(2);
          setCodigoVerificacao('');
        } else {
          setErrorMsg(resEnvio?.error || 'Erro ao enviar código de verificação para este e-mail.');
        }

        setLoading(false);
        return;
      }

      if (passoRegistro === 2) {
        if (!codigoVerificacao.trim()) {
          setErrorMsg('Digite o código de 6 dígitos enviado para o seu e-mail.');
          setLoading(false);
          return;
        }

        // Valida o código de verificação recebido
        const resValida = await apiService.validarCodigoVerificacao({
          email,
          codigo: codigoVerificacao,
        });

        if (!resValida?.success) {
          setErrorMsg(resValida?.error || 'Código de verificação incorreto.');
          setLoading(false);
          return;
        }

        // Se o código estiver correto, efetua a criação da conta
        const res = await registrar({ nome, email, senha, perfilUso });
        if (!res?.success) {
          setErrorMsg(res?.error || 'Erro ao realizar cadastro.');
        }
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

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    const res = await loginGoogle({ perfilUso });
    if (!res?.success) {
      setErrorMsg(res?.error || 'Erro ao realizar login com o Google.');
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#3e3e3e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontFamily: 'sans-serif',
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          backgroundColor: '#545454',
          borderRadius: '24px',
          padding: '28px 20px',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxSizing: 'border-box',
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
          {isEsqueciSenha
            ? 'Redefina sua senha de acesso'
            : isRegistro
            ? 'Crie sua conta e escolha seu modo de uso'
            : 'Faça login para acessar suas finanças'}
        </p>

        {/* Mensagens de Erro e Sucesso */}
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

        {successMsg && (
          <div
            style={{
              backgroundColor: '#2a9d8f',
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
            {successMsg}
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isRegistro && passoRegistro === 2 ? (
            /* Passo 2 do Cadastro: Digitar Código de 6 Dígitos */
            <div>
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '28px' }}>🔑</span>
                <h4 style={{ margin: '6px 0 2px 0', color: '#ffe192', fontSize: '18px' }}>
                  Verificação de E-mail
                </h4>
                <p style={{ margin: 0, color: '#cccccc', fontSize: '13px', lineHeight: '1.4' }}>
                  Digite os 6 dígitos enviados para:<br />
                  <strong style={{ color: '#ffffff' }}>{email}</strong>
                </p>
              </div>

              <label style={{ display: 'block', fontSize: '12px', color: '#ffe192', marginBottom: '6px', fontWeight: 'bold', textAlign: 'center' }}>
                Código de Verificação
              </label>
              <input
                type="text"
                maxLength={6}
                value={codigoVerificacao}
                onChange={(e) => setCodigoVerificacao(e.target.value)}
                placeholder="000000"
                autoFocus
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '14px',
                  border: '2px solid #ffe192',
                  backgroundColor: '#3e3e3e',
                  color: '#ffe192',
                  fontSize: '22px',
                  fontWeight: 'bold',
                  letterSpacing: '8px',
                  textAlign: 'center',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />

              <div style={{ marginTop: '12px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    setPassoRegistro(1);
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#aaaaaa',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  ⬅️ Digitei o e-mail errado / Voltar
                </button>
              </div>
            </div>
          ) : (
            /* Passo 1 do Cadastro / Form de Login / Recuperação */
            <>
              {isRegistro && !isEsqueciSenha && (
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

              {!isEsqueciSenha ? (
                <>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '12px', color: '#cccccc' }}>Sua Senha</label>
                      {!isRegistro && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsEsqueciSenha(true);
                            setErrorMsg('');
                            setSuccessMsg('');
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ffe192',
                            fontSize: '12px',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                          }}
                        >
                          Esqueci minha senha
                        </button>
                      )}
                    </div>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <input
                        type={showSenha ? 'text' : 'password'}
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="••••••••"
                        style={{
                          width: '100%',
                          padding: '12px 42px 12px 14px',
                          borderRadius: '12px',
                          border: '1px solid #737373',
                          backgroundColor: '#3e3e3e',
                          color: '#ffffff',
                          fontSize: '14px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSenha(!showSenha)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#cccccc',
                          cursor: 'pointer',
                          fontSize: '16px',
                        }}
                        title={showSenha ? 'Ocultar Senha' : 'Ver Senha'}
                      >
                        {showSenha ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  {/* Campo Confirmar Senha no Cadastro */}
                  {isRegistro && (
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#cccccc', marginBottom: '6px' }}>
                        Confirmar Sua Senha
                      </label>
                      <div style={{ position: 'relative', width: '100%' }}>
                        <input
                          type={showSenha ? 'text' : 'password'}
                          value={confirmarSenha}
                          onChange={(e) => setConfirmarSenha(e.target.value)}
                          placeholder="••••••••"
                          style={{
                            width: '100%',
                            padding: '12px 42px 12px 14px',
                            borderRadius: '12px',
                            border: senha && confirmarSenha && senha !== confirmarSenha ? '1px solid #ff8585' : '1px solid #737373',
                            backgroundColor: '#3e3e3e',
                            color: '#ffffff',
                            fontSize: '14px',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSenha(!showSenha)}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: '#cccccc',
                            cursor: 'pointer',
                            fontSize: '16px',
                          }}
                          title={showSenha ? 'Ocultar Senha' : 'Ver Senha'}
                        >
                          {showSenha ? '🙈' : '👁️'}
                        </button>
                      </div>
                      {senha && confirmarSenha && senha !== confirmarSenha && (
                        <span style={{ color: '#ff8585', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                          ⚠️ As senhas não coincidem
                        </span>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {passoRecuperacao === 2 && (
                    <>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#ffe192', marginBottom: '6px', fontWeight: 'bold' }}>
                          Código de Verificação (6 Dígitos)
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={codigoRecuperacao}
                          onChange={(e) => setCodigoRecuperacao(e.target.value)}
                          placeholder="Ex: 123456"
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            borderRadius: '12px',
                            border: '2px solid #ffe192',
                            backgroundColor: '#3e3e3e',
                            color: '#ffe192',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            letterSpacing: '4px',
                            textAlign: 'center',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#cccccc', marginBottom: '6px' }}>
                          Sua Nova Senha
                        </label>
                        <div style={{ position: 'relative', width: '100%' }}>
                          <input
                            type={showSenha ? 'text' : 'password'}
                            value={novaSenha}
                            onChange={(e) => setNovaSenha(e.target.value)}
                            placeholder="Digite sua nova senha"
                            style={{
                              width: '100%',
                              padding: '12px 42px 12px 14px',
                              borderRadius: '12px',
                              border: '1px solid #737373',
                              backgroundColor: '#3e3e3e',
                              color: '#ffffff',
                              fontSize: '14px',
                              outline: 'none',
                              boxSizing: 'border-box',
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowSenha(!showSenha)}
                            style={{
                              position: 'absolute',
                              right: '10px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              color: '#cccccc',
                              cursor: 'pointer',
                              fontSize: '16px',
                            }}
                          >
                            {showSenha ? '🙈' : '👁️'}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#cccccc', marginBottom: '6px' }}>
                          Confirmar Nova Senha
                        </label>
                        <div style={{ position: 'relative', width: '100%' }}>
                          <input
                            type={showSenha ? 'text' : 'password'}
                            value={confirmarSenha}
                            onChange={(e) => setConfirmarSenha(e.target.value)}
                            placeholder="Repita sua nova senha"
                            style={{
                              width: '100%',
                              padding: '12px 42px 12px 14px',
                              borderRadius: '12px',
                              border: novaSenha && confirmarSenha && novaSenha !== confirmarSenha ? '1px solid #ff8585' : '1px solid #737373',
                              backgroundColor: '#3e3e3e',
                              color: '#ffffff',
                              fontSize: '14px',
                              outline: 'none',
                              boxSizing: 'border-box',
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowSenha(!showSenha)}
                            style={{
                              position: 'absolute',
                              right: '10px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              color: '#cccccc',
                              cursor: 'pointer',
                              fontSize: '16px',
                            }}
                          >
                            {showSenha ? '🙈' : '👁️'}
                          </button>
                        </div>
                        {novaSenha && confirmarSenha && novaSenha !== confirmarSenha && (
                          <span style={{ color: '#ff8585', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                            ⚠️ As senhas não coincidem
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </>
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
            {loading
              ? 'Processando...'
              : isEsqueciSenha
              ? passoRecuperacao === 1
                ? 'Enviar E-mail de Recuperação'
                : 'Confirmar Nova Senha'
              : isRegistro
              ? passoRegistro === 1
                ? 'Enviar Código de Verificação'
                : 'Confirmar Código e Criar Conta'
              : 'Entrar no Sistema'}
          </button>
        </form>

        {/* Divisor Visual */}
        {!isEsqueciSenha && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', margin: '18px 0 14px 0', gap: '10px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#737373' }} />
              <span style={{ fontSize: '11px', color: '#aaaaaa', textTransform: 'uppercase', letterSpacing: '1px' }}>ou</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#737373' }} />
            </div>

            {/* Botão Entrar com o Google */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{
                width: '100%',
                padding: '15px 20px',
                borderRadius: '28px',
                border: '1px solid #737373',
                backgroundColor: '#ffffff',
                color: '#222222',
                fontWeight: 'bold',
                fontSize: '15px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                transition: 'all 0.2s',
              }}
            >
              <img src={logoGoogle} alt="Google Logo" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
              <span>Continuar com o Google</span>
            </button>
          </>
        )}

        {/* Alternar entre Login, Cadastro e Esqueci Senha */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          {isEsqueciSenha ? (
            <button
              onClick={() => {
                setIsEsqueciSenha(false);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffe192',
                fontSize: '13px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Voltar para o Login
            </button>
          ) : (
            <button
              onClick={() => {
                setIsRegistro(!isRegistro);
                setErrorMsg('');
                setSuccessMsg('');
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
          )}
        </div>
      </div>
    </div>
  );
}
