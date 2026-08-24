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

const MESES_LISTA = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// GET /api/transacoes?tipo=despesas&contaId=14
router.get('/transacoes', async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const { tipo, contaId } = req.query;
    const tabela = getNomeTabela(tipo);

    let sql = `
      SELECT 
        id, 
        usuario_id AS "usuarioId", 
        conta_id AS "contaId", 
        COALESCE(NULLIF(nome, ''), NULLIF(descricao, ''), 'Sem descrição') AS descricao,
        COALESCE(NULLIF(nome, ''), NULLIF(descricao, ''), 'Sem descrição') AS nome,
        valor, 
        COALESCE(data::text, TO_CHAR(data_transacao, 'YYYY-MM-DD'), TO_CHAR(criado_em, 'YYYY-MM-DD'), TO_CHAR(created_at, 'YYYY-MM-DD'), '2026-08-17') AS data,
        COALESCE(mes, 'Ago') AS mes,
        COALESCE(ano, '2026') AS ano,
        COALESCE(NULLIF(classificacao, ''), NULLIF(categoria, ''), 'Geral') AS categoria,
        COALESCE(NULLIF(classificacao, ''), NULLIF(categoria, ''), 'Geral') AS classificacao,
        COALESCE(NULLIF(etiqueta, ''), 'Geral') AS etiqueta,
        COALESCE(tipo_pagamento, 'Outros') AS "tipoPagamento",
        COALESCE(pago, true) AS pago,
        COALESCE(observacao, descricao, '') AS observacao,
        COALESCE(anexo, '') AS anexo,
        COALESCE(repetir, (eh_fixa = 1), false) AS repetir,
        COALESCE(frequencia, 'mensal') AS frequencia,
        COALESCE(eh_reserva, 0) AS "ehReserva"
      FROM ${tabela}
      WHERE usuario_id = $1
    `;
    const params = [usuarioId];

    if (contaId) {
      params.push(parseInt(contaId, 10));
      sql += ` AND conta_id = $${params.length}`;
    }

    sql += ' ORDER BY COALESCE(data_transacao, data::timestamp, criado_em, created_at) DESC, id DESC';
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
      nome,
      valor,
      data,
      categoria,
      classificacao,
      etiqueta,
      tipoPagamento,
      pago,
      observacao,
      anexo,
      repetir,
      frequencia,
      ehReserva,
      eh_reserva,
    } = req.body;

    const tabela = getNomeTabela(tipo);
    const titulo = (descricao || nome || 'Sem descrição').trim();
    const catFinal = (categoria || classificacao || 'Geral').trim();
    const etiqFinal = (etiqueta || 'Geral').trim();
    const valorNum = parseFloat(valor) || 0;
    const dataStr = data || new Date().toISOString().split('T')[0];
    const dtTransacao = new Date(dataStr + 'T12:00:00');
    const mesCalculado = MESES_LISTA[dtTransacao.getMonth()] || 'Ago';
    const anoCalculado = dtTransacao.getFullYear().toString();
    const ehReservaVal = (ehReserva === 1 || ehReserva === true || eh_reserva === 1 || eh_reserva === true) ? 1 : 0;
    const ehFixaVal = (repetir === true || repetir === 1) ? 1 : 0;
    const contaIdFinal = contaId ? parseInt(contaId, 10) : null;

    const sql = `
      INSERT INTO ${tabela} (
        usuario_id, conta_id, nome, descricao, valor, data, data_transacao, mes, ano, categoria, classificacao, etiqueta, tipo_pagamento, pago, observacao, anexo, repetir, eh_fixa, frequencia, eh_reserva
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING 
        id, 
        usuario_id AS "usuarioId", 
        conta_id AS "contaId", 
        nome AS descricao, 
        nome,
        valor, 
        TO_CHAR(data, 'YYYY-MM-DD') AS data, 
        categoria, 
        etiqueta, 
        tipo_pagamento AS "tipoPagamento", 
        pago, 
        observacao, 
        anexo, 
        repetir, 
        frequencia, 
        eh_reserva AS "ehReserva"
    `;

    const params = [
      usuarioId,
      contaIdFinal,
      titulo,
      observacao || titulo,
      valorNum,
      dataStr,
      dtTransacao,
      mesCalculado,
      anoCalculado,
      catFinal,
      catFinal,
      etiqFinal,
      tipoPagamento || 'Outros',
      pago !== undefined ? pago : true,
      observacao || '',
      anexo || '',
      repetir || false,
      ehFixaVal,
      frequencia || 'mensal',
      ehReservaVal,
    ];

    const result = await query(sql, params);

    // Salvar etiqueta caso seja nova
    if (etiqFinal && etiqFinal.trim()) {
      await query('INSERT INTO etiquetas (usuario_id, nome) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
        usuarioId,
        etiqFinal.trim(),
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
      nome,
      valor,
      data,
      categoria,
      classificacao,
      etiqueta,
      tipoPagamento,
      pago,
      observacao,
      anexo,
      repetir,
      frequencia,
      ehReserva,
      eh_reserva,
    } = req.body;

    const tabela = getNomeTabela(tipo);
    const titulo = (descricao || nome || 'Sem descrição').trim();
    const catFinal = (categoria || classificacao || 'Geral').trim();
    const etiqFinal = (etiqueta || 'Geral').trim();
    const valorNum = parseFloat(valor) || 0;
    const dataStr = data || new Date().toISOString().split('T')[0];
    const dtTransacao = new Date(dataStr + 'T12:00:00');
    const mesCalculado = MESES_LISTA[dtTransacao.getMonth()] || 'Ago';
    const anoCalculado = dtTransacao.getFullYear().toString();
    const ehReservaVal = (ehReserva === 1 || ehReserva === true || eh_reserva === 1 || eh_reserva === true) ? 1 : 0;
    const ehFixaVal = (repetir === true || repetir === 1) ? 1 : 0;
    const contaIdFinal = contaId ? parseInt(contaId, 10) : null;

    const sql = `
      UPDATE ${tabela} SET
        conta_id = $1, nome = $2, descricao = $3, valor = $4, data = $5, data_transacao = $6, mes = $7, ano = $8,
        categoria = $9, classificacao = $10, etiqueta = $11, tipo_pagamento = $12, pago = $13,
        observacao = $14, anexo = $15, repetir = $16, eh_fixa = $17, frequencia = $18, eh_reserva = $19
      WHERE id = $20 AND usuario_id = $21
      RETURNING 
        id, 
        usuario_id AS "usuarioId", 
        conta_id AS "contaId", 
        nome AS descricao, 
        nome,
        valor, 
        TO_CHAR(data, 'YYYY-MM-DD') AS data, 
        categoria, 
        etiqueta, 
        tipo_pagamento AS "tipoPagamento", 
        pago, 
        observacao, 
        anexo, 
        repetir, 
        frequencia, 
        eh_reserva AS "ehReserva"
    `;

    const params = [
      contaIdFinal,
      titulo,
      observacao || titulo,
      valorNum,
      dataStr,
      dtTransacao,
      mesCalculado,
      anoCalculado,
      catFinal,
      catFinal,
      etiqFinal,
      tipoPagamento || 'Outros',
      pago !== undefined ? pago : true,
      observacao || '',
      anexo || '',
      repetir || false,
      ehFixaVal,
      frequencia || 'mensal',
      ehReservaVal,
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

// POST /api/transacoes/importar-nubank
router.post('/transacoes/importar-nubank', async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const { contaId, transacoes = [] } = req.body;

    if (!Array.isArray(transacoes) || transacoes.length === 0) {
      return res.status(400).json({ success: false, error: 'Lista de transações vazia ou inválida.' });
    }

    let inseridosCount = 0;

    for (const item of transacoes) {
      if (item.isDuplicado || item.selecionado === false) continue;

      const tabela = item.tipo === 'receitas' ? 'receitas' : 'despesas';
      const valorNum = parseFloat(item.valor || 0);
      const cat = item.classificacao || 'Nubank';
      const etiq = item.etiqueta || 'Nubank';
      const dtTransacao = item.dataTransacao ? new Date(item.dataTransacao) : new Date();
      const descCompleta = item.descricao || item.nomeRaw || 'Importado via CSV Nubank';
      const mesItem = item.mes || MESES_LISTA[dtTransacao.getMonth()] || 'Ago';
      const anoItem = item.ano || dtTransacao.getFullYear().toString();

      if (etiq && etiq.trim()) {
        await query('INSERT INTO etiquetas (usuario_id, nome) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
          usuarioId,
          etiq.trim(),
        ]);
      }

      await query(
        `INSERT INTO ${tabela} (usuario_id, conta_id, nome, valor, classificacao, categoria, etiqueta, parcelas, eh_fixa, descricao, mes, ano, data_transacao, data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9, $10, $11, $12, $13)`,
        [
          usuarioId,
          contaId ? parseInt(contaId, 10) : null,
          (item.nome || item.nomeRaw || 'Transação Nubank').trim(),
          valorNum,
          cat,
          cat,
          etiq,
          item.parcelas || '1/1',
          descCompleta,
          mesItem,
          anoItem,
          dtTransacao,
          dtTransacao.toISOString().split('T')[0],
        ]
      );
      inseridosCount++;
    }

    res.json({ success: true, inseridosCount });
  } catch (err) {
    console.error('Erro ao importar transações do Nubank em lote:', err);
    res.status(500).json({ success: false, error: 'Erro ao importar transações do Nubank.' });
  }
});

export default router;
