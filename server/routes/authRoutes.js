import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { query } from '../db.js';
import { authLimiter } from '../middleware/securityMiddleware.js';
import { enviarEmailVerificacao, enviarEmailRecuperacao } from '../services/emailService.js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'gestor_orcamento_jwt_secret_key_2026_super_secure';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'gestor_orcamento_refresh_secret_key_2026_super_secure';

// Mapa em memória para armazenar códigos de verificação de cadastro temporários
// chave: email -> { codigo, expiraEm, nome }
const codigosCadastro = new Map();

// Categorias Padrão
const CATEGORIAS_INDIVIDUAL = [
  { nome: 'Alimentação', cor: '#fb8500' },
  { nome: 'Moradia', cor: '#ffb703' },
  { nome: 'Transporte', cor: '#ffd166' },
  { nome: 'Saúde', cor: '#ffe192' },
  { nome: 'Lazer', cor: '#f4a261' },
  { nome: 'Educação', cor: '#e76f51' },
  { nome: 'Salário & Ganhos', cor: '#2a9d8f' },
  { nome: 'Outros', cor: '#8d99ae' },
];

const CATEGORIAS_COMERCIAL = [
  { nome: 'Vendas & Produtos', cor: '#2a9d8f' },
  { nome: 'Fornecedores & Estoque', cor: '#e76f51' },
  { nome: 'Serviços Prestados', cor: '#fb8500' },
  { nome: 'Aluguel & Infraestrutura', cor: '#ffb703' },
  { nome: 'Manutenção & Equipamentos', cor: '#ffd166' },
  { nome: 'Marketing & Anúncios', cor: '#f4a261' },
  { nome: 'Pessoal & RH', cor: '#e07a5f' },
  { nome: 'Impostos & Taxas', cor: '#457b9d' },
  { nome: 'Outros', cor: '#8d99ae' },
];

const ETIQUETAS_PADRAO = ['Geral', 'Fixa', 'Variável', 'Urgente', 'Investimento'];

/**
 * Auxiliar para gerar Access Token (JWT - 15m) e Refresh Token (7 dias)
 */
async function gerartokens(usuarioId, email) {
  const accessToken = jwt.sign({ id: usuarioId, email }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: usuarioId }, REFRESH_SECRET, { expiresIn: '7d' });

  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await query('UPDATE refresh_tokens SET revoked = TRUE WHERE usuario_id = $1', [usuarioId]);
  await query(
    'INSERT INTO refresh_tokens (usuario_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [usuarioId, tokenHash, expiresAt]
  );

  return { accessToken, refreshToken };
}

/**
 * Validação de integridade do formato de e-mail
 */
function isEmailValido(email) {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

// ====================================================================
// 1. VERIFICAÇÃO DE CADASTRO POR E-MAIL
// ====================================================================

// POST /api/auth/send-verification-code - Envia código de 6 dígitos para o e-mail de cadastro
router.post('/send-verification-code', authLimiter, async (req, res) => {
  const { email, nome } = req.body;

  if (!email || !isEmailValido(email)) {
    return res.status(400).json({ success: false, error: 'Forneça um endereço de e-mail válido.' });
  }

  const emailLimpo = email.trim().toLowerCase();

  try {
    const checkEmail = await query('SELECT id FROM usuarios WHERE LOWER(email) = LOWER($1)', [emailLimpo]);
    if (checkEmail.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Este e-mail já está cadastrado no sistema.' });
    }

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expiraEm = Date.now() + 10 * 60 * 1000; // 10 minutos

    codigosCadastro.set(emailLimpo, { codigo, expiraEm, nome: (nome || '').trim() });

    await enviarEmailVerificacao(emailLimpo, nome || 'Usuário', codigo);

    res.json({
      success: true,
      message: `Código de verificação enviado para ${emailLimpo}! Verifique sua caixa de entrada.`
    });
  } catch (err) {
    console.error('Erro em send-verification-code:', err);
    res.status(500).json({
      success: false,
      error: 'Não foi possível enviar o e-mail de verificação. Verifique sua conexão e tente novamente.'
    });
  }
});

// POST /api/auth/verify-code - Valida o código digitado pelo usuário
router.post('/verify-code', async (req, res) => {
  const { email, codigo } = req.body;

  if (!email || !codigo) {
    return res.status(400).json({ success: false, error: 'E-mail e código de verificação são obrigatórios.' });
  }

  const emailLimpo = email.trim().toLowerCase();
  const registro = codigosCadastro.get(emailLimpo);

  if (!registro) {
    return res.status(400).json({
      success: false,
      error: 'Nenhum código foi solicitado para este e-mail ou o código expirou.'
    });
  }

  if (Date.now() > registro.expiraEm) {
    codigosCadastro.delete(emailLimpo);
    return res.status(400).json({
      success: false,
      error: 'O código de verificação expirou. Solicite um novo código.'
    });
  }

  if (registro.codigo !== codigo.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Código de verificação incorreto. Confira os 6 dígitos digitados.'
    });
  }

  res.json({ success: true, message: 'Código verificado com sucesso!' });
});

// ====================================================================
// 2. CADASTRO & LOGIN (EMAIL / SENHA & GOOGLE)
// ====================================================================

// POST /api/auth/register - Registra o usuário após confirmação
router.post('/register', authLimiter, async (req, res) => {
  const { nome, email, senha, perfilUso } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ success: false, error: 'Nome, e-mail e senha são obrigatórios.' });
  }

  const emailLimpo = email.trim().toLowerCase();

  try {
    const userCheck = await query('SELECT id FROM usuarios WHERE LOWER(email) = LOWER($1)', [emailLimpo]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Este e-mail já está cadastrado.' });
    }

    const senhaHash = await bcrypt.hash(senha, 12);
    const perfil = perfilUso === 'comercial' ? 'comercial' : 'individual';
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const insertUser = await query(
      'INSERT INTO usuarios (id, nome, email, senha_hash, perfil_uso) VALUES ($1, $2, $3, $4, $5) RETURNING id, nome, email, perfil_uso',
      [userId, nome.trim(), emailLimpo, senhaHash, perfil]
    );
    const novoUsuario = insertUser.rows[0];

    codigosCadastro.delete(emailLimpo);

    const nomeConta = perfil === 'comercial' ? 'Conta Empresa' : 'Conta Pessoal';
    const corConta = perfil === 'comercial' ? '#2a9d8f' : '#fb8500';
    const insertConta = await query(
      'INSERT INTO contas (usuario_id, nome, tipo, cor, is_padrao) VALUES ($1, $2, $3, $4, TRUE) RETURNING *',
      [novoUsuario.id, nomeConta, perfil, corConta]
    );

    const categorias = perfil === 'comercial' ? CATEGORIAS_COMERCIAL : CATEGORIAS_INDIVIDUAL;
    for (const cat of categorias) {
      await query('INSERT INTO categorias (usuario_id, nome, cor) VALUES ($1, $2, $3)', [
        novoUsuario.id,
        cat.nome,
        cat.cor,
      ]);
    }

    for (const etq of ETIQUETAS_PADRAO) {
      await query('INSERT INTO etiquetas (usuario_id, nome) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
        novoUsuario.id,
        etq,
      ]);
    }

    const { accessToken, refreshToken } = await gerartokens(novoUsuario.id, novoUsuario.email);

    res.json({
      success: true,
      user: {
        id: novoUsuario.id,
        nome: novoUsuario.nome,
        email: novoUsuario.email,
        perfilUso: novoUsuario.perfil_uso,
      },
      contaInicial: insertConta.rows[0],
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error('Erro no registro:', err);
    res.status(500).json({ success: false, error: 'Erro interno ao registrar usuário.' });
  }
});

// POST /api/auth/login - Login com Bcrypt
router.post('/login', authLimiter, async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ success: false, error: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const result = await query('SELECT * FROM usuarios WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'E-mail ou senha incorretos.' });
    }

    const user = result.rows[0];
    let senhaValida = false;

    if (user.senha_hash && user.senha_hash.startsWith('$2')) {
      senhaValida = await bcrypt.compare(senha, user.senha_hash);
    } else if (user.senha_hash && user.senha_hash.includes(':')) {
      const [salt, originalHash] = user.senha_hash.split(':');
      const hashDigitado = crypto.pbkdf2Sync(senha, salt, 1000, 64, 'sha512').toString('hex');
      senhaValida = (hashDigitado === originalHash);
      if (senhaValida) {
        const novaHashBcrypt = await bcrypt.hash(senha, 12);
        await query('UPDATE usuarios SET senha_hash = $1 WHERE id = $2', [novaHashBcrypt, user.id]);
      }
    }

    if (!senhaValida) {
      return res.status(401).json({ success: false, error: 'E-mail ou senha incorretos.' });
    }

    const { accessToken, refreshToken } = await gerartokens(user.id, user.email);

    res.json({
      success: true,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        perfilUso: user.perfil_uso,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ success: false, error: 'Erro interno ao realizar login.' });
  }
});

// POST /api/auth/google - Login ou Cadastro Automático com Google
router.post('/google', authLimiter, async (req, res) => {
  const { email, nome, googleId, avatarUrl, perfilUso } = req.body;

  if (!email || !isEmailValido(email)) {
    return res.status(400).json({ success: false, error: 'E-mail do Google inválido ou não fornecido.' });
  }

  const emailLimpo = email.trim().toLowerCase();
  const nomeFinal = nome ? nome.trim() : 'Usuário Google';

  try {
    const checkUser = await query('SELECT * FROM usuarios WHERE LOWER(email) = LOWER($1)', [emailLimpo]);
    let usuario;

    if (checkUser.rows.length > 0) {
      usuario = checkUser.rows[0];
      if (nomeFinal && (!usuario.nome || usuario.nome === 'Usuário')) {
        await query('UPDATE usuarios SET nome = $1 WHERE id = $2', [nomeFinal, usuario.id]);
        usuario.nome = nomeFinal;
      }
    } else {
      const userId = `usr_g_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const perfilFinal = perfilUso === 'comercial' ? 'comercial' : 'individual';

      const insertRes = await query(
        'INSERT INTO usuarios (id, nome, email, perfil_uso, provedor) VALUES ($1, $2, $3, $4, $5) RETURNING id, nome, email, perfil_uso',
        [userId, nomeFinal, emailLimpo, perfilFinal, 'google']
      );
      usuario = insertRes.rows[0];

      const nomeConta = perfilFinal === 'comercial' ? 'Conta Empresa' : 'Conta Pessoal';
      const corConta = perfilFinal === 'comercial' ? '#2a9d8f' : '#fb8500';
      await query(
        'INSERT INTO contas (usuario_id, nome, tipo, cor, is_padrao) VALUES ($1, $2, $3, $4, TRUE)',
        [usuario.id, nomeConta, perfilFinal, corConta]
      );

      const categorias = perfilFinal === 'comercial' ? CATEGORIAS_COMERCIAL : CATEGORIAS_INDIVIDUAL;
      for (const cat of categorias) {
        await query('INSERT INTO categorias (usuario_id, nome, cor) VALUES ($1, $2, $3)', [
          usuario.id,
          cat.nome,
          cat.cor,
        ]);
      }

      for (const etq of ETIQUETAS_PADRAO) {
        await query('INSERT INTO etiquetas (usuario_id, nome) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
          usuario.id,
          etq,
        ]);
      }
    }

    const { accessToken, refreshToken } = await gerartokens(usuario.id, usuario.email);

    res.json({
      success: true,
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfilUso: usuario.perfil_uso,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error('Erro no login Google:', err);
    res.status(500).json({ success: false, error: 'Erro ao autenticar com o Google.' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ success: false, error: 'Refresh Token é obrigatório.' });
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const checkToken = await query(
      'SELECT * FROM refresh_tokens WHERE usuario_id = $1 AND token_hash = $2 AND revoked = FALSE AND expires_at > CURRENT_TIMESTAMP',
      [decoded.id, tokenHash]
    );

    if (checkToken.rows.length === 0) {
      return res.status(403).json({ success: false, error: 'Refresh Token inválido ou revogado.' });
    }

    const userRes = await query('SELECT id, email FROM usuarios WHERE id = $1', [decoded.id]);
    if (userRes.rows.length === 0) {
      return res.status(403).json({ success: false, error: 'Usuário não encontrado.' });
    }

    const user = userRes.rows[0];
    const novosTokens = await gerartokens(user.id, user.email);

    res.json({
      success: true,
      accessToken: novosTokens.accessToken,
      refreshToken: novosTokens.refreshToken,
    });
  } catch (err) {
    return res.status(403).json({ success: false, error: 'Refresh Token inválido ou expirado.' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await query('UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1', [tokenHash]);
  }
  res.json({ success: true, message: 'Logout realizado com sucesso.' });
});

// ====================================================================
// 3. RECUPERAÇÃO DE SENHA
// ====================================================================

// POST /api/auth/forgot-password - Envia E-mail de Recuperação de Senha
router.post('/forgot-password', authLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email || !email.trim()) {
    return res.status(400).json({ success: false, error: 'Endereço de e-mail é obrigatório.' });
  }

  const emailLimpo = email.trim().toLowerCase();

  try {
    const userResult = await query('SELECT id, nome, email FROM usuarios WHERE LOWER(email) = LOWER($1)', [
      emailLimpo,
    ]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'E-mail não encontrado no sistema. Verifique o endereço digitado.',
      });
    }

    const usuario = userResult.rows[0];
    const codigo6Digitos = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await query('DELETE FROM password_resets WHERE LOWER(email) = LOWER($1)', [usuario.email]);

    await query(
      'INSERT INTO password_resets (email, codigo, token, expira_em, expires_at) VALUES ($1, $2, $3, $4, $5)',
      [usuario.email, codigo6Digitos, codigo6Digitos, expiresAt, expiresAt]
    );

    await enviarEmailRecuperacao(usuario.email, usuario.nome, codigo6Digitos);

    res.json({
      success: true,
      message: `Código de verificação enviado para ${usuario.email}! Confira sua caixa de entrada.`,
    });
  } catch (err) {
    console.error('Erro em forgot-password:', err);
    res.status(500).json({ success: false, error: 'Erro ao enviar e-mail de recuperação de senha.' });
  }
});

// POST /api/auth/reset-password - Valida Código e Redefine Senha com Bcrypt
router.post('/reset-password', authLimiter, async (req, res) => {
  const { email, codigo, novaSenha } = req.body;

  if (!email || !codigo || !novaSenha) {
    return res.status(400).json({ success: false, error: 'E-mail, código de 6 dígitos e nova senha são obrigatórios.' });
  }

  const emailLimpo = email.trim().toLowerCase();

  try {
    const resetCheck = await query(
      'SELECT * FROM password_resets WHERE LOWER(email) = LOWER($1) AND (codigo = $2 OR token = $2) AND COALESCE(expires_at, expira_em) > CURRENT_TIMESTAMP ORDER BY id DESC LIMIT 1',
      [emailLimpo, codigo.trim()]
    );

    if (resetCheck.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Código de verificação inválido ou expirado.' });
    }

    const resetReg = resetCheck.rows[0];

    const userResult = await query('SELECT id FROM usuarios WHERE LOWER(email) = LOWER($1)', [emailLimpo]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado.' });
    }

    const userId = userResult.rows[0].id;
    const novaHashBcrypt = await bcrypt.hash(novaSenha, 12);

    await query('UPDATE usuarios SET senha_hash = $1 WHERE id = $2', [novaHashBcrypt, userId]);
    await query('DELETE FROM password_resets WHERE LOWER(email) = LOWER($1)', [emailLimpo]);

    try {
      await query('UPDATE refresh_tokens SET revoked = TRUE WHERE usuario_id::text = $1::text', [userId]);
    } catch {}

    res.json({ success: true, message: 'Senha redefinida com sucesso! Você já pode entrar com a nova senha.' });
  } catch (err) {
    console.error('Erro na redefinição de senha:', err);
    res.status(500).json({ success: false, error: 'Erro interno ao redefinir a senha.' });
  }
});

export default router;
