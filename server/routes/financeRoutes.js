import { Router } from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Todas as rotas de finanças exigem autenticação JWT
router.use(authenticateToken);

/**
 * --------------------------------------------------------------------
 * CONTAS BANCÁRIAS / CARTEIRAS
 * --------------------------------------------------------------------
 */

// GET /api/contas
router.get('/contas', async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const result = await query(
      'SELECT id, nome, tipo, cor, is_padrao AS "isPadrao" FROM contas WHERE usuario_id = $1 ORDER BY id ASC',
      [usuarioId]
    );
    res.json({ success: true, contas: result.rows });
  } catch (err) {
    console.error('Erro ao carregar contas:', err);
    res.status(500).json({ success: false, error: 'Erro ao carregar contas.' });
  }
});

// POST /api/contas
router.post('/contas', async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const { nome, tipo, cor } = req.body;
    if (!nome) return res.status(400).json({ success: false, error: 'Nome da conta é obrigatório.' });

    const result = await query(
      'INSERT INTO contas (usuario_id, nome, tipo, cor, is_padrao) VALUES ($1, $2, $3, $4, FALSE) RETURNING id, nome, tipo, cor, is_padrao AS "isPadrao"',
      [usuarioId, nome.trim(), tipo || 'individual', cor || '#fb8500']
    );
    res.json({ success: true, conta: result.rows[0] });
  } catch (err) {
    console.error('Erro ao criar conta:', err);
    res.status(500).json({ success: false, error: 'Erro ao criar conta.' });
  }
});

// DELETE /api/contas/:id
router.delete('/contas/:id', async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const contaId = req.params.id;
    await query('DELETE FROM contas WHERE id = $1 AND usuario_id = $2', [contaId, usuarioId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao deletar conta:', err);
    res.status(500).json({ success: false, error: 'Erro ao deletar conta.' });
  }
});

/**
 * --------------------------------------------------------------------
 * CATEGORIAS E ETIQUETAS
 * --------------------------------------------------------------------
 */

// GET /api/categorias
router.get('/categorias', async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const result = await query(
      'SELECT id, nome, cor FROM categorias WHERE usuario_id = $1 OR usuario_id IS NULL ORDER BY id ASC',
      [usuarioId]
    );
    res.json({ success: true, categorias: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao carregar categorias.' });
  }
});

// POST /api/categorias
router.post('/categorias', async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const { nome, cor } = req.body;
    if (!nome) return res.status(400).json({ success: false, error: 'Nome da categoria é obrigatório.' });

    const result = await query(
      'INSERT INTO categorias (usuario_id, nome, cor) VALUES ($1, $2, $3) RETURNING id, nome, cor',
      [usuarioId, nome.trim(), cor || '#8d99ae']
    );
    res.json({ success: true, categoria: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao criar categoria.' });
  }
});

// GET /api/etiquetas
router.get('/etiquetas', async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const result = await query('SELECT nome FROM etiquetas WHERE usuario_id = $1 ORDER BY nome ASC', [usuarioId]);
    const nomes = result.rows.map((r) => r.nome);
    res.json({ success: true, etiquetas: Array.from(new Set(['Geral', ...nomes])) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao carregar etiquetas.' });
  }
});

// POST /api/etiquetas
router.post('/etiquetas', async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const { nome } = req.body;
    if (!nome || !nome.trim()) return res.status(400).json({ success: false, error: 'Nome inválido.' });

    await query('INSERT INTO etiquetas (usuario_id, nome) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
      usuarioId,
      nome.trim(),
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao salvar etiqueta.' });
  }
});

/**
 * --------------------------------------------------------------------
 * TRANSAÇÕES (RECEITAS E DESPESAS)
 * --------------------------------------------------------------------
 */

function getNomeTabela(tipo) {
  return tipo === 'receita' || tipo === 'receitas' ? 'receitas' : 'despesas';
}

// GET /api/transacoes?tipo=despesas&ano=2026&mes=Jan&contaId=1
router.get('/transacoes', async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const { tipo, contaId } = req.query;
    const tabela = getNomeTabela(tipo);

    let sql = `SELECT id, usuario_id AS "usuarioId", conta_id AS "contaId", descricao, valor, data, categoria, etiqueta, tipo_pagamento AS "tipoPagamento", pago, observacao, anexo, repetir, frequencia FROM ${tabela} WHERE usuario_id = $1`;
    const params = [usuarioId];

    if (contaId) {
      params.push(contaId);
      sql += ` AND conta_id = $${params.length}`;
    }

    sql += ' ORDER BY data DESC, id DESC';
    const result = await query(sql, params);
    res.json({ success: true, transacoes: result.rows });
  } catch (err) {
    console.error('Erro ao carregar transações:', err);
    res.status(500).json({ success: false, error: 'Erro ao carregar transações.' });
  }
});

// POST /api/transacoes
router.post('/transacoes', async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const {
      tipo,
      contaId,
      descricao,
      valor,
      data,
      categoria,
      etiqueta,
      tipoPagamento,
      pago,
      observacao,
      anexo,
      repetir,
      frequencia,
    } = req.body;

    const tabela = getNomeTabela(tipo);

    const sql = `
      INSERT INTO ${tabela} (
        usuario_id, conta_id, descricao, valor, data, categoria, etiqueta, tipo_pagamento, pago, observacao, anexo, repetir, frequencia
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, usuario_id AS "usuarioId", conta_id AS "contaId", descricao, valor, data, categoria, etiqueta, tipo_pagamento AS "tipoPagamento", pago, observacao, anexo, repetir, frequencia
    `;

    const params = [
      usuarioId,
      contaId || null,
      descricao,
      parseFloat(valor) || 0,
      data,
      categoria || 'Geral',
      etiqueta || 'Geral',
      tipoPagamento || 'Outros',
      pago !== undefined ? pago : true,
      observacao || '',
      anexo || '',
      repetir || false,
      frequencia || 'mensal',
    ];

    const result = await query(sql, params);

    // Salvar etiqueta caso seja nova
    if (etiqueta && etiqueta.trim()) {
      await query('INSERT INTO etiquetas (usuario_id, nome) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
        usuarioId,
        etiqueta.trim(),
      ]);
    }

    res.json({ success: true, transacao: result.rows[0] });
  } catch (err) {
    console.error('Erro ao adicionar transação:', err);
    res.status(500).json({ success: false, error: 'Erro ao adicionar transação.' });
  }
});

// PUT /api/transacoes/:id
router.put('/transacoes/:id', async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const transacaoId = req.params.id;
    const {
      tipo,
      contaId,
      descricao,
      valor,
      data,
      categoria,
      etiqueta,
      tipoPagamento,
      pago,
      observacao,
      anexo,
      repetir,
      frequencia,
    } = req.body;

    const tabela = getNomeTabela(tipo);

    const sql = `
      UPDATE ${tabela} SET
        conta_id = $1, descricao = $2, valor = $3, data = $4, categoria = $5, etiqueta = $6,
        tipo_pagamento = $7, pago = $8, observacao = $9, anexo = $10, repetir = $11, frequencia = $12
      WHERE id = $13 AND usuario_id = $14
      RETURNING id, usuario_id AS "usuarioId", conta_id AS "contaId", descricao, valor, data, categoria, etiqueta, tipo_pagamento AS "tipoPagamento", pago, observacao, anexo, repetir, frequencia
    `;

    const params = [
      contaId || null,
      descricao,
      parseFloat(valor) || 0,
      data,
      categoria || 'Geral',
      etiqueta || 'Geral',
      tipoPagamento || 'Outros',
      pago !== undefined ? pago : true,
      observacao || '',
      anexo || '',
      repetir || false,
      frequencia || 'mensal',
      transacaoId,
      usuarioId,
    ];

    const result = await query(sql, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Transação não encontrada.' });
    }

    res.json({ success: true, transacao: result.rows[0] });
  } catch (err) {
    console.error('Erro ao editar transação:', err);
    res.status(500).json({ success: false, error: 'Erro ao editar transação.' });
  }
});

// DELETE /api/transacoes/:id
router.delete('/transacoes/:id', async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const transacaoId = req.params.id;
    const { tipo } = req.query;
    const tabela = getNomeTabela(tipo);

    await query(`DELETE FROM ${tabela} WHERE id = $1 AND usuario_id = $2`, [transacaoId, usuarioId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao deletar transação:', err);
    res.status(500).json({ success: false, error: 'Erro ao deletar transação.' });
  }
});

export default router;
