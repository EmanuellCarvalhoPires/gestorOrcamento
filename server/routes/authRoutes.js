import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { query } from '../db.js';
import { authLimiter } from '../middleware/securityMiddleware.js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'gestor_orcamento_jwt_secret_key_2026_super_secure';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'gestor_orcamento_refresh_secret_key_2026_super_secure';

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
 * Auxiliar para gerar Access Token (JWT - Expiracao 15m) e Refresh Token (7 dias)
 */
async function gerartokens(usuarioId, email) {
  const accessToken = jwt.sign({ id: usuarioId, email }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: usuarioId }, REFRESH_SECRET, { expiresIn: '7d' });

  // Hash do Refresh Token para guardar no BD com seguranca
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Invalida tokens antigos e insere novo
  await query('UPDATE refresh_tokens SET revoked = TRUE WHERE usuario_id = $1', [usuarioId]);
  await query(
    'INSERT INTO refresh_tokens (usuario_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [usuarioId, tokenHash, expiresAt]
  );

  return { accessToken, refreshToken };
}

/**
 * Função para verificar senhas antigas em PBKDF2 para suporte de migração transparente
 */
function verificarPBKDF2(senhaDigitada, hashSalvo) {
  if (!hashSalvo || !hashSalvo.includes(':')) return false;
  const [salt, originalHash] = hashSalvo.split(':');
  const hashDigitado = crypto.pbkdf2Sync(senhaDigitada, salt, 1000, 64, 'sha512').toString('hex');
  return hashDigitado === originalHash;
}

// POST /api/auth/register - Cadastro de Usuário com Bcrypt
router.post('/register', authLimiter, async (req, res) => {
  const { nome, email, senha, perfilUso } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ success: false, error: 'Nome, e-mail e senha são obrigatórios.' });
  }

  try {
    const userCheck = await query('SELECT id FROM usuarios WHERE email = $1', [email.trim().toLowerCase()]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'E-mail já cadastrado.' });
    }

    // Hash forte com Bcrypt (12 salt rounds)
    const senhaHash = await bcrypt.hash(senha, 12);
    const perfil = perfilUso === 'comercial' ? 'comercial' : 'individual';

    const insertUser = await query(
      'INSERT INTO usuarios (nome, email, senha_hash, perfil_uso) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, perfil_uso',
      [nome.trim(), email.trim().toLowerCase(), senhaHash, perfil]
    );
    const novoUsuario = insertUser.rows[0];

    // Criar Conta Principal do Usuário
    const nomeConta = perfil === 'comercial' ? 'Conta Empresa' : 'Conta Principal';
    const corConta = perfil === 'comercial' ? '#2a9d8f' : '#fb8500';
    const insertConta = await query(
      'INSERT INTO contas (usuario_id, nome, tipo, cor, is_padrao) VALUES ($1, $2, $3, $4, TRUE) RETURNING *',
      [novoUsuario.id, nomeConta, perfil, corConta]
    );

    // Criar Categorias Padrão
    const categorias = perfil === 'comercial' ? CATEGORIAS_COMERCIAL : CATEGORIAS_INDIVIDUAL;
    for (const cat of categorias) {
      await query('INSERT INTO categorias (usuario_id, nome, cor) VALUES ($1, $2, $3)', [
        novoUsuario.id,
        cat.nome,
        cat.cor,
      ]);
    }

    // Criar Etiquetas Padrão
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

// POST /api/auth/login - Login com Bcrypt & Suporte de Migração de Hash
router.post('/login', authLimiter, async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ success: false, error: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const result = await query('SELECT * FROM usuarios WHERE email = $1', [email.trim().toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'E-mail ou senha incorretos.' });
    }

    const user = result.rows[0];
    let senhaValida = false;

    if (user.senha_hash && user.senha_hash.startsWith('$2')) {
      // Formato de hash Bcrypt
      senhaValida = await bcrypt.compare(senha, user.senha_hash);
    } else if (user.senha_hash && user.senha_hash.includes(':')) {
      // Migração transparente de hash PBKDF2 antigo para Bcrypt
      senhaValida = verificarPBKDF2(senha, user.senha_hash);
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

// POST /api/auth/refresh - Renovação de Access Token via Refresh Token
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

// POST /api/auth/logout - Revoga o Refresh Token no Banco de Dados
router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await query('UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1', [tokenHash]);
  }
  res.json({ success: true, message: 'Logout realizado com sucesso.' });
});

// POST /api/auth/forgot-password - Envia E-mail de Recuperação de Senha
router.post('/forgot-password', authLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email || !email.trim()) {
    return res.status(400).json({ success: false, error: 'Endereço de e-mail é obrigatório.' });
  }

  try {
    // Garante que a tabela password_resets existe
    await query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        codigo VARCHAR(10) NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const userResult = await query('SELECT id, nome, email FROM usuarios WHERE LOWER(email) = $1', [
      email.trim().toLowerCase(),
    ]);

    if (userResult.rows.length === 0) {
      return res.status(444 || 404).json({
        success: false,
        error: 'E-mail não encontrado no sistema. Verifique o endereço digitado.',
      });
    }

    const usuario = userResult.rows[0];

    // Gera Código de 6 dígitos e Token Aleatório
    const codigo6Digitos = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Válido por 15 min

    // Cancela códigos antigos do mesmo e-mail
    await query('UPDATE password_resets SET used = TRUE WHERE LOWER(email) = $1', [usuario.email]);

    // Registra o novo código no banco
    await query(
      'INSERT INTO password_resets (email, codigo, token, expires_at) VALUES ($1, $2, $3, $4)',
      [usuario.email, codigo6Digitos, token, expiresAt]
    );

    // Envia o e-mail via Nodemailer (com fallback fake SMTP / preview URL em desenvolvimento)
    const emailResult = await import('../services/emailService.js').then((m) =>
      m.enviarEmailRecuperacao(usuario.email, usuario.nome, token, codigo6Digitos)
    );

    res.json({
      success: true,
      message: `Código de verificação enviado para ${usuario.email}. Confira sua caixa de entrada.`,
      previewUrl: emailResult.previewUrl,
    });
  } catch (err) {
    console.error('Erro em forgot-password:', err);
    res.status(500).json({ success: false, error: 'Erro ao enviar e-mail de recuperação.' });
  }
});

// POST /api/auth/reset-password - Valida Código e Redefine Senha com Bcrypt
router.post('/reset-password', authLimiter, async (req, res) => {
  const { email, codigo, novaSenha } = req.body;

  if (!email || !codigo || !novaSenha) {
    return res.status(400).json({ success: false, error: 'E-mail, código de 6 dígitos e nova senha são obrigatórios.' });
  }

  try {
    // Verifica se o código é válido e não expirou
    const resetCheck = await query(
      'SELECT * FROM password_resets WHERE LOWER(email) = $1 AND codigo = $2 AND used = FALSE AND expires_at > CURRENT_TIMESTAMP ORDER BY id DESC LIMIT 1',
      [email.trim().toLowerCase(), codigo.trim()]
    );

    if (resetCheck.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Código de verificação inválido ou expirado.' });
    }

    const resetReg = resetCheck.rows[0];

    // Busca o usuário
    const userResult = await query('SELECT id FROM usuarios WHERE LOWER(email) = $1', [email.trim().toLowerCase()]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado.' });
    }

    const userId = userResult.rows[0].id;
    const novaHashBcrypt = await bcrypt.hash(novaSenha, 12);

    // Atualiza a senha no banco de dados com Bcrypt
    await query('UPDATE usuarios SET senha_hash = $1 WHERE id = $2', [novaHashBcrypt, userId]);

    // Marca o código como utilizado
    await query('UPDATE password_resets SET used = TRUE WHERE id = $1', [resetReg.id]);

    // Revoga tokens antigos de refresh por segurança
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
