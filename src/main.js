import { app, BrowserWindow, ipcMain, Menu, dialog } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import started from 'electron-squirrel-startup';
import dotenv from 'dotenv';
import crypto from 'node:crypto';
import pg from 'pg';

const { Pool } = pg;

// Remove a barra de menu nativa padrão (File, Edit, View, Window)
Menu.setApplicationMenu(null);

// Carrega as variáveis do .env na raiz do projeto
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

if (started) {
  app.quit();
}

const pool = new Pool({
  host: process.env.PG_HOST || '147.15.21.81',
  port: parseInt(process.env.PG_PORT || '5432', 10),
  database: process.env.PG_DATABASE || 'gestor_orcamento',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'admin123',
  connectionTimeoutMillis: 10000,
});

// Hashing de senha seguro via PBKDF2 com Salt
function hashSenha(senha, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(senha, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hashSenha: `${salt}:${hash}` };
}

function verificarSenha(senhaDigitada, hashSalvo) {
  if (!hashSalvo || !hashSalvo.includes(':')) return false;
  const [salt, originalHash] = hashSalvo.split(':');
  const hashDigitado = crypto.pbkdf2Sync(senhaDigitada, salt, 1000, 64, 'sha512').toString('hex');
  return hashDigitado === originalHash;
}

// Mapeia o tipo para a tabela física ('receitas' ou 'despesas')
function getNomeTabela(tipo) {
  if (tipo === 'receita' || tipo === 'receitas') return 'receitas';
  return 'despesas';
}

// Categorias padrão para finanças pessoas físicas
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

// Categorias padrão para perfil comercial / empresas
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

function getCategoriasPadrao(perfilUso) {
  return perfilUso === 'comercial' ? CATEGORIAS_COMERCIAL : CATEGORIAS_INDIVIDUAL;
}

async function salvarEtiquetaSeNova(usuarioId, etiquetaNome) {
  if (!usuarioId || !etiquetaNome || !etiquetaNome.trim()) return;
  const nomeLimpo = etiquetaNome.trim();

  try {
    const check = await pool.query(
      'SELECT id FROM etiquetas WHERE usuario_id = $1 AND LOWER(TRIM(nome)) = LOWER(TRIM($2))',
      [usuarioId, nomeLimpo]
    );

    if (check.rows.length === 0) {
      await pool.query(
        'INSERT INTO etiquetas (usuario_id, nome) VALUES ($1, $2)',
        [usuarioId, nomeLimpo]
      );
    }
  } catch (err) {
    console.error('Erro ao salvar nova etiqueta:', err);
  }
}

// Inicializa as tabelas no PostgreSQL da Oracle Cloud
async function initDatabase() {
  try {
    // 1. Tabela de Usuários
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id VARCHAR(100) PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        senha_hash VARCHAR(255) NOT NULL,
        perfil_uso VARCHAR(50) DEFAULT 'individual',
        avatar_url TEXT,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Tabela de Contas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contas (
        id SERIAL PRIMARY KEY,
        usuario_id VARCHAR(100) NOT NULL,
        nome VARCHAR(255) NOT NULL,
        tipo VARCHAR(50) DEFAULT 'individual',
        descricao TEXT,
        cor VARCHAR(50) DEFAULT '#ffe192',
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      );
    `);

    // 3. Tabela de Categorias
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categorias (
        id SERIAL PRIMARY KEY,
        usuario_id VARCHAR(100) NOT NULL,
        nome VARCHAR(255) NOT NULL,
        cor VARCHAR(50) DEFAULT '#ffe192',
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      );
    `);

    // 4. Tabela de Etiquetas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS etiquetas (
        id SERIAL PRIMARY KEY,
        usuario_id VARCHAR(100) NOT NULL,
        nome VARCHAR(255) NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      );
    `);

    // 5. Tabela de Receitas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS receitas (
        id SERIAL PRIMARY KEY,
        usuario_id VARCHAR(100) NOT NULL,
        conta_id INT,
        nome VARCHAR(255) NOT NULL,
        valor NUMERIC(15,2) NOT NULL,
        classificacao VARCHAR(100) DEFAULT 'Outros',
        etiqueta VARCHAR(100) DEFAULT 'Geral',
        parcelas VARCHAR(50) DEFAULT '1/1',
        eh_fixa INT DEFAULT 0,
        descricao TEXT,
        mes VARCHAR(20) NOT NULL,
        ano VARCHAR(10) NOT NULL,
        data_transacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (conta_id) REFERENCES contas(id) ON DELETE CASCADE
      );
    `);

    // 6. Tabela de Despesas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS despesas (
        id SERIAL PRIMARY KEY,
        usuario_id VARCHAR(100) NOT NULL,
        conta_id INT,
        nome VARCHAR(255) NOT NULL,
        valor NUMERIC(15,2) NOT NULL,
        classificacao VARCHAR(100) DEFAULT 'Outros',
        etiqueta VARCHAR(100) DEFAULT 'Geral',
        parcelas VARCHAR(50) DEFAULT '1/1',
        eh_fixa INT DEFAULT 0,
        descricao TEXT,
        mes VARCHAR(20) NOT NULL,
        ano VARCHAR(10) NOT NULL,
        data_transacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (conta_id) REFERENCES contas(id) ON DELETE CASCADE
      );
    `);

    await pool.query(`ALTER TABLE receitas ADD COLUMN IF NOT EXISTS conta_id INT REFERENCES contas(id) ON DELETE CASCADE;`);
    await pool.query(`ALTER TABLE despesas ADD COLUMN IF NOT EXISTS conta_id INT REFERENCES contas(id) ON DELETE CASCADE;`);
    await pool.query(`ALTER TABLE receitas ADD COLUMN IF NOT EXISTS data_transacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);
    await pool.query(`ALTER TABLE despesas ADD COLUMN IF NOT EXISTS data_transacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_receitas_usuario ON receitas (usuario_id, conta_id, ano, mes);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_despesas_usuario ON despesas (usuario_id, conta_id, ano, mes);`);

    console.log('✅ Banco de Dados PostgreSQL inicializado.');
  } catch (error) {
    console.error('❌ Erro ao inicializar tabelas PostgreSQL:', error);
  }
}

// --- IPC HANDLERS ---

ipcMain.handle('registrar-usuario', async (event, { nome, email, senha, perfilUso = 'individual' }) => {
  try {
    const checkEmail = await pool.query(
      'SELECT id FROM usuarios WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );

    if (checkEmail.rows.length > 0) {
      return { success: false, error: 'Este e-mail já está cadastrado.' };
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const { hashSenha: senhaCriptografada } = hashSenha(senha);
    const perfilFinal = perfilUso === 'comercial' ? 'comercial' : 'individual';

    await pool.query(
      'INSERT INTO usuarios (id, nome, email, senha_hash, perfil_uso) VALUES ($1, $2, $3, $4, $5)',
      [userId, nome.trim(), email.toLowerCase().trim(), senhaCriptografada, perfilFinal]
    );

    const nomeContaInicial = perfilFinal === 'comercial' ? 'Conta Comercial' : 'Conta Pessoal';
    const resConta = await pool.query(
      'INSERT INTO contas (usuario_id, nome, tipo, descricao, cor) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, nomeContaInicial, perfilFinal, 'Conta inicial padrão', '#ffe192']
    );

    const catPadrao = getCategoriasPadrao(perfilFinal);
    for (const cat of catPadrao) {
      await pool.query(
        'INSERT INTO categorias (usuario_id, nome, cor) VALUES ($1, $2, $3)',
        [userId, cat.nome, cat.cor]
      );
    }

    for (const etiq of ETIQUETAS_PADRAO) {
      await pool.query(
        'INSERT INTO etiquetas (usuario_id, nome) VALUES ($1, $2)',
        [userId, etiq]
      );
    }

    return {
      success: true,
      user: { id: userId, nome: nome.trim(), email: email.toLowerCase().trim(), perfilUso: perfilFinal },
      contaInicial: resConta.rows[0],
    };
  } catch (error) {
    console.error('Erro no registro:', error);
    return { success: false, error: 'Erro ao cadastrar usuário.' };
  }
});

ipcMain.handle('login-usuario', async (event, { email, senha }) => {
  try {
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );

    if (result.rows.length === 0) {
      return { success: false, error: 'E-mail não cadastrado.' };
    }

    const usuario = result.rows[0];
    const senhaValida = verificarSenha(senha, usuario.senha_hash);

    if (!senhaValida) {
      return { success: false, error: 'Senha incorreta.' };
    }

    return {
      success: true,
      user: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfilUso: usuario.perfil_uso || 'individual' },
    };
  } catch (error) {
    console.error('Erro no login:', error);
    return { success: false, error: 'Erro ao realizar login.' };
  }
});

ipcMain.handle('carregar-contas', async (event, { usuarioId }) => {
  if (!usuarioId) return [];

  try {
    const result = await pool.query(
      'SELECT * FROM contas WHERE usuario_id = $1 ORDER BY id ASC',
      [usuarioId]
    );

    if (result.rows.length === 0) {
      const userCheck = await pool.query('SELECT perfil_uso FROM usuarios WHERE id = $1', [usuarioId]);
      const perfilUso = userCheck.rows[0]?.perfil_uso || 'individual';
      const nomeConta = perfilUso === 'comercial' ? 'Conta Comercial' : 'Conta Pessoal';

      const resConta = await pool.query(
        'INSERT INTO contas (usuario_id, nome, tipo, descricao, cor) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [usuarioId, nomeConta, perfilUso, 'Conta padrão', '#ffe192']
      );

      return resConta.rows;
    }

    return result.rows;
  } catch (error) {
    console.error('Erro ao carregar contas:', error);
    return [];
  }
});

ipcMain.handle('criar-conta', async (event, { usuarioId, nome, tipo, descricao, cor }) => {
  if (!usuarioId || !nome) return { success: false, error: 'Dados da conta inválidos.' };

  try {
    const result = await pool.query(
      'INSERT INTO contas (usuario_id, nome, tipo, descricao, cor) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [usuarioId, nome.trim(), tipo || 'individual', descricao || '', cor || '#ffe192']
    );

    return { success: true, conta: result.rows[0] };
  } catch (error) {
    console.error('Erro ao criar conta:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('deletar-conta', async (event, { contaId, usuarioId }) => {
  if (!usuarioId || !contaId) return { success: false, error: 'Sessão inválida.' };

  try {
    await pool.query(
      'DELETE FROM contas WHERE id = $1 AND usuario_id = $2',
      [contaId, usuarioId]
    );
    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar conta:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('carregar-etiquetas', async (event, { usuarioId }) => {
  if (!usuarioId) return ETIQUETAS_PADRAO;

  try {
    const result = await pool.query(
      'SELECT DISTINCT nome FROM etiquetas WHERE usuario_id = $1 ORDER BY nome ASC',
      [usuarioId]
    );

    if (!result.rows || result.rows.length === 0) {
      for (const etiq of ETIQUETAS_PADRAO) {
        await pool.query(
          'INSERT INTO etiquetas (usuario_id, nome) VALUES ($1, $2)',
          [usuarioId, etiq]
        );
      }
      return ETIQUETAS_PADRAO;
    }

    return result.rows.map((r) => r.nome);
  } catch (error) {
    console.error('Erro ao carregar etiquetas:', error);
    return ETIQUETAS_PADRAO;
  }
});

ipcMain.handle('adicionar-etiqueta', async (event, { usuarioId, nome }) => {
  if (!usuarioId || !nome || !nome.trim()) return { success: false };

  try {
    await salvarEtiquetaSeNova(usuarioId, nome.trim());
    return { success: true };
  } catch (error) {
    console.error('Erro ao adicionar etiqueta:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('carregar-categorias', async (event, { usuarioId }) => {
  if (!usuarioId) return CATEGORIAS_INDIVIDUAL;

  try {
    const userCheck = await pool.query(
      'SELECT id, perfil_uso FROM usuarios WHERE id = $1',
      [usuarioId]
    );

    if (userCheck.rows.length === 0) {
      return CATEGORIAS_INDIVIDUAL;
    }

    const perfilUso = userCheck.rows[0].perfil_uso || 'individual';
    const catPadrao = getCategoriasPadrao(perfilUso);

    const result = await pool.query(
      'SELECT * FROM categorias WHERE usuario_id = $1 ORDER BY id ASC',
      [usuarioId]
    );

    if (result.rows.length === 0) {
      for (const cat of catPadrao) {
        await pool.query(
          'INSERT INTO categorias (usuario_id, nome, cor) VALUES ($1, $2, $3)',
          [usuarioId, cat.nome, cat.cor]
        );
      }
      const newResult = await pool.query(
        'SELECT * FROM categorias WHERE usuario_id = $1 ORDER BY id ASC',
        [usuarioId]
      );
      return newResult.rows;
    }

    return result.rows;
  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
    return CATEGORIAS_INDIVIDUAL;
  }
});

ipcMain.handle('adicionar-categoria', async (event, { usuarioId, nome, cor }) => {
  if (!usuarioId) return { success: false, error: 'Sessão inválida.' };

  try {
    await pool.query(
      'INSERT INTO categorias (usuario_id, nome, cor) VALUES ($1, $2, $3)',
      [usuarioId, nome.trim(), cor || '#ffe192']
    );
    return { success: true };
  } catch (error) {
    console.error('Erro ao adicionar categoria:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('deletar-categoria', async (event, { id, usuarioId }) => {
  if (!usuarioId) return { success: false, error: 'Sessão inválida.' };

  try {
    await pool.query(
      'DELETE FROM categorias WHERE id = $1 AND usuario_id = $2',
      [id, usuarioId]
    );
    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar categoria:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('carregar-transacoes', async (event, { usuarioId, contaId, mes, ano }) => {
  if (!usuarioId) return { receitas: [], despesas: [] };

  try {
    const filtrarMes = mes && mes !== 'Todos';
    const filtrarConta = !!contaId;

    let sqlReceitas = 'SELECT * FROM receitas WHERE usuario_id = $1 AND ano = $2';
    let sqlDespesas = 'SELECT * FROM despesas WHERE usuario_id = $1 AND ano = $2';
    const args = [usuarioId, ano];

    let paramIndex = 3;
    if (filtrarConta) {
      sqlReceitas += ` AND (conta_id = $${paramIndex} OR conta_id IS NULL)`;
      sqlDespesas += ` AND (conta_id = $${paramIndex} OR conta_id IS NULL)`;
      args.push(contaId);
      paramIndex++;
    }

    if (filtrarMes) {
      sqlReceitas += ` AND mes = $${paramIndex}`;
      sqlDespesas += ` AND mes = $${paramIndex}`;
      args.push(mes);
    }

    sqlReceitas += ' ORDER BY data_transacao DESC, id DESC';
    sqlDespesas += ' ORDER BY data_transacao DESC, id DESC';

    const [resReceitas, resDespesas] = await Promise.all([
      pool.query(sqlReceitas, args),
      pool.query(sqlDespesas, args),
    ]);

    return {
      receitas: resReceitas.rows || [],
      despesas: resDespesas.rows || [],
    };
  } catch (error) {
    console.error('Erro ao carregar transações:', error);
    return { receitas: [], despesas: [] };
  }
});

ipcMain.handle('adicionar-transacao', async (event, novaTransacao) => {
  if (!novaTransacao.usuarioId) {
    return { success: false, error: 'Sessão de usuário inválida.' };
  }

  const tabela = getNomeTabela(novaTransacao.tipo);
  const mesesList = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const isReceita = tabela === 'receitas';

  const dataFinal = novaTransacao.dataTransacao ? new Date(novaTransacao.dataTransacao) : new Date();
  const mesOrigem = mesesList[dataFinal.getMonth()];
  const anoOrigem = dataFinal.getFullYear().toString();

  const mesInicioIndex = mesesList.indexOf(mesOrigem);
  const anoInicio = parseInt(anoOrigem, 10);

  const valorInserido = parseFloat(novaTransacao.valor || 0);
  const etiqFinal = novaTransacao.etiqueta ? novaTransacao.etiqueta.trim() : 'Geral';

  await salvarEtiquetaSeNova(novaTransacao.usuarioId, etiqFinal);

  try {
    if (novaTransacao.ehFixa) {
      for (let m = mesInicioIndex; m < 12; m++) {
        const mesCalculado = mesesList[m];
        await pool.query(
          `INSERT INTO ${tabela} (usuario_id, conta_id, nome, valor, classificacao, etiqueta, parcelas, eh_fixa, descricao, mes, ano, data_transacao)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 1, $8, $9, $10, $11)`,
          [
            novaTransacao.usuarioId,
            novaTransacao.contaId || null,
            novaTransacao.nome.trim(),
            valorInserido,
            novaTransacao.classificacao || 'Outros',
            etiqFinal,
            'Fixa',
            novaTransacao.descricao || '',
            mesCalculado,
            anoOrigem,
            dataFinal,
          ]
        );
      }
      return { success: true, mesCalculado: mesOrigem, anoCalculado: anoOrigem };
    }

    const parcelaAtual = parseInt(novaTransacao.parcelaAtual || '1', 10);
    const totalParcelas = parseInt(novaTransacao.totalParcelas || '1', 10);

    const valorPorParcela = (!isReceita && totalParcelas > 1 && valorInserido > 0)
      ? Number((valorInserido / totalParcelas).toFixed(2))
      : valorInserido;

    if (totalParcelas > 1 && totalParcelas >= parcelaAtual) {
      for (let k = parcelaAtual; k <= totalParcelas; k++) {
        const offset = k - parcelaAtual;
        const totalMeses = mesInicioIndex + offset;
        const mesIndex = totalMeses % 12;
        const anosAdicionais = Math.floor(totalMeses / 12);

        const mesCalculado = mesesList[mesIndex];
        const anoCalculado = (anoInicio + anosAdicionais).toString();
        const stringParcela = `${k}/${totalParcelas}`;

        await pool.query(
          `INSERT INTO ${tabela} (usuario_id, conta_id, nome, valor, classificacao, etiqueta, parcelas, eh_fixa, descricao, mes, ano, data_transacao)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, $10, $11)`,
          [
            novaTransacao.usuarioId,
            novaTransacao.contaId || null,
            novaTransacao.nome.trim(),
            valorPorParcela,
            novaTransacao.classificacao || 'Outros',
            etiqFinal,
            stringParcela,
            novaTransacao.descricao || '',
            mesCalculado,
            anoCalculado,
            dataFinal,
          ]
        );
      }
      return { success: true, mesCalculado: mesOrigem, anoCalculado: anoOrigem };
    } else {
      const stringParcela = `${parcelaAtual}/${totalParcelas}`;
      await pool.query(
        `INSERT INTO ${tabela} (usuario_id, conta_id, nome, valor, classificacao, etiqueta, parcelas, eh_fixa, descricao, mes, ano, data_transacao)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, $10, $11)`,
        [
          novaTransacao.usuarioId,
          novaTransacao.contaId || null,
          novaTransacao.nome.trim(),
          valorPorParcela,
          novaTransacao.classificacao || 'Outros',
          etiqFinal,
          stringParcela,
          novaTransacao.descricao || '',
          mesOrigem,
          anoOrigem,
          dataFinal,
        ]
      );
      return { success: true, mesCalculado: mesOrigem, anoCalculado: anoOrigem };
    }
  } catch (error) {
    console.error(`Erro ao adicionar em ${tabela}:`, error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('editar-transacao', async (event, { id, usuarioId, nome, valor, classificacao, etiqueta, descricao, tipo, dataTransacao, oldNome }) => {
  if (!usuarioId) return { success: false, error: 'Sessão inválida.' };

  const tabela = getNomeTabela(tipo);
  const mesesList = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const dataFinal = dataTransacao ? new Date(dataTransacao) : new Date();
  const mesOrigem = mesesList[dataFinal.getMonth()];
  const anoOrigem = dataFinal.getFullYear().toString();
  const nomeBusca = (oldNome || nome).trim();
  const etiqFinal = etiqueta ? etiqueta.trim() : 'Geral';

  await salvarEtiquetaSeNova(usuarioId, etiqFinal);

  try {
    const resAtual = await pool.query(`SELECT parcelas, eh_fixa, nome FROM ${tabela} WHERE id = $1 AND usuario_id = $2`, [id, usuarioId]);
    const itemAtual = resAtual.rows[0];

    const isFixaOuParcelada = itemAtual && (itemAtual.eh_fixa === 1 || (itemAtual.parcelas && itemAtual.parcelas !== '1/1'));

    if (isFixaOuParcelada && nomeBusca) {
      await pool.query(
        `UPDATE ${tabela}
         SET nome = $1, classificacao = $2, etiqueta = $3, descricao = $4
         WHERE usuario_id = $5 AND LOWER(TRIM(nome)) = LOWER(TRIM($6))`,
        [
          nome.trim(),
          classificacao || 'Outros',
          etiqFinal,
          descricao || '',
          usuarioId,
          nomeBusca,
        ]
      );

      await pool.query(
        `UPDATE ${tabela}
         SET valor = $1, mes = $2, ano = $3, data_transacao = $4
         WHERE id = $5 AND usuario_id = $6`,
        [
          parseFloat(valor || 0),
          mesOrigem,
          anoOrigem,
          dataFinal,
          id,
          usuarioId,
        ]
      );
    } else {
      await pool.query(
        `UPDATE ${tabela}
         SET nome = $1, valor = $2, classificacao = $3, etiqueta = $4, descricao = $5, mes = $6, ano = $7, data_transacao = $8
         WHERE id = $9 AND usuario_id = $10`,
        [
          nome.trim(),
          parseFloat(valor || 0),
          classificacao || 'Outros',
          etiqFinal,
          descricao || '',
          mesOrigem,
          anoOrigem,
          dataFinal,
          id,
          usuarioId,
        ]
      );
    }

    return { success: true, mesCalculado: mesOrigem, anoCalculado: anoOrigem };
  } catch (error) {
    console.error(`Erro ao editar em ${tabela}:`, error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('deletar-transacao', async (event, { id, usuarioId, deletarModo, nome, tipo, parcelaNum, ehFixa, mes }) => {
  if (!usuarioId) return { success: false, error: 'Sessão inválida.' };

  const tabela = getNomeTabela(tipo);
  const mesesList = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  try {
    if (deletarModo === 'todas' && nome) {
      await pool.query(
        `DELETE FROM ${tabela} WHERE usuario_id = $1 AND LOWER(TRIM(nome)) = LOWER(TRIM($2))`,
        [usuarioId, nome.trim()]
      );
    } else if (deletarModo === 'posteriores' && nome) {
      if (ehFixa && mes) {
        const mesIndex = mesesList.indexOf(mes);
        const result = await pool.query(
          `SELECT id, mes FROM ${tabela} WHERE usuario_id = $1 AND LOWER(TRIM(nome)) = LOWER(TRIM($2))`,
          [usuarioId, nome.trim()]
        );

        const idsParaDeletar = result.rows
          .filter((row) => {
            const idx = mesesList.indexOf(row.mes);
            return idx !== -1 && idx >= mesIndex;
          })
          .map((row) => row.id);

        for (const rowId of idsParaDeletar) {
          await pool.query(`DELETE FROM ${tabela} WHERE id = $1 AND usuario_id = $2`, [rowId, usuarioId]);
        }
      } else if (parcelaNum) {
        const result = await pool.query(
          `SELECT id, parcelas FROM ${tabela} WHERE usuario_id = $1 AND LOWER(TRIM(nome)) = LOWER(TRIM($2))`,
          [usuarioId, nome.trim()]
        );

        const idsParaDeletar = result.rows
          .filter((row) => {
            const num = parseInt((row.parcelas || '1/1').split('/')[0], 10);
            return !isNaN(num) && num >= parcelaNum;
          })
          .map((row) => row.id);

        for (const rowId of idsParaDeletar) {
          await pool.query(`DELETE FROM ${tabela} WHERE id = $1 AND usuario_id = $2`, [rowId, usuarioId]);
        }
      } else {
        await pool.query(`DELETE FROM ${tabela} WHERE id = $1 AND usuario_id = $2`, [id, usuarioId]);
      }
    } else {
      await pool.query(`DELETE FROM ${tabela} WHERE id = $1 AND usuario_id = $2`, [id, usuarioId]);
    }
    return { success: true };
  } catch (error) {
    console.error(`Erro ao deletar de ${tabela}:`, error);
    return { success: false, error: error.message };
  }
});

// EXPORTAR RELATÓRIO EM CSV (EXCEL)
ipcMain.handle('exportar-csv', async (event, { dados, mes, ano }) => {
  try {
    const defaultFilename = `Relatorio_Financeiro_${mes}_${ano}.csv`;
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Exportar Relatório Financeiro (Excel)',
      defaultPath: defaultFilename,
      filters: [{ name: 'Planilha CSV (*.csv)', extensions: ['csv'] }],
    });

    if (canceled || !filePath) return { success: false };

    let csvContent = '\uFEFF';
    csvContent += 'Tipo;Data/Hora;Nome;Classificação;Etiqueta;Parcelas;Valor (R$);Mês;Ano\n';

    for (const item of dados) {
      const isRec = item.tipo === 'receitas' || item.tipo === 'receita';
      const tipoLabel = isRec ? 'Receita' : 'Despesa';
      const dtStr = item.data_transacao ? new Date(item.data_transacao).toLocaleString('pt-BR') : '';
      const nomeSanitizado = (item.nome || '').replace(/;/g, ',');
      const classifSanitizado = (item.classificacao || '').replace(/;/g, ',');
      const etiqSanitizado = (item.etiqueta || '').replace(/;/g, ',');
      const parcelasStr = item.eh_fixa === 1 ? 'Fixa' : (item.parcelas || '1/1');
      const valorStr = (Number(item.valor) || 0).toFixed(2).replace('.', ',');

      csvContent += `${tipoLabel};${dtStr};${nomeSanitizado};${classifSanitizado};${etiqSanitizado};${parcelasStr};${valorStr};${item.mes};${item.ano}\n`;
    }

    fs.writeFileSync(filePath, csvContent, 'utf-8');
    return { success: true, filePath };
  } catch (error) {
    console.error('Erro ao exportar CSV:', error);
    return { success: false, error: error.message };
  }
});

// EXPORTAR RELATÓRIO EXECUTIVO EM PDF
ipcMain.handle('exportar-pdf', async (event, { receitasList = [], despesasList = [], categorias = [], mes, ano, totalReceitas = 0, totalDespesas = 0, economia = 0, usuarioNome = '' }) => {
  try {
    const defaultFilename = `Relatorio_Executivo_${mes}_${ano}.pdf`;
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Salvar Relatório Executivo em PDF',
      defaultPath: defaultFilename,
      filters: [{ name: 'Arquivo PDF (*.pdf)', extensions: ['pdf'] }],
    });

    if (canceled || !filePath) return { success: false };

    const pdfWindow = new BrowserWindow({
      show: false,
      webPreferences: { nodeIntegration: true },
    });

    const taxaEconomia = totalReceitas > 0 ? Math.max(0, Math.round((economia / totalReceitas) * 100)) : 0;
    const porcGasto = totalReceitas > 0 ? Math.min(100, Math.round((totalDespesas / totalReceitas) * 100)) : (totalDespesas > 0 ? 100 : 0);

    const despesasPorCategoria = despesasList.reduce((acc, item) => {
      const cat = item.classificacao || 'Outros';
      acc[cat] = (acc[cat] || 0) + Number(item.valor);
      return acc;
    }, {});

    const categoriasComValor = Object.keys(despesasPorCategoria).map((catNome) => {
      const catObj = categorias.find((c) => c.nome.toLowerCase() === catNome.toLowerCase());
      const val = despesasPorCategoria[catNome];
      const pct = totalDespesas > 0 ? Math.round((val / totalDespesas) * 100) : 0;
      return {
        nome: catNome,
        valor: val,
        porcentagem: pct,
        cor: catObj?.cor || '#fb8500',
      };
    }).sort((a, b) => b.valor - a.valor);

    const dataHoje = new Date().toLocaleDateString('pt-BR');

    let categoriasHTML = '';
    if (categoriasComValor.length === 0) {
      categoriasHTML = '<div style="font-size: 12px; color: #a0aec0; text-align: center; padding: 12px;">Nenhuma despesa para categorizar.</div>';
    } else {
      categoriasHTML = categoriasComValor.slice(0, 4).map((c) => `
        <div class="cat-item">
          <div class="cat-header">
            <span>${c.nome}</span>
            <span>R$ ${c.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${c.porcentagem}%)</span>
          </div>
          <div class="cat-bar-bg">
            <div class="cat-bar-fill" style="width: ${c.porcentagem}%; background-color: ${c.cor};"></div>
          </div>
        </div>
      `).join('');
    }

    let receitasRows = '';
    if (receitasList.length > 0) {
      receitasRows = `
        <div class="section-title">🟢 Detalhamento das Receitas</div>
        <table>
          <thead>
            <tr>
              <th class="th-receita">Data/Hora</th>
              <th class="th-receita">Nome</th>
              <th class="th-receita">Categoria</th>
              <th class="th-receita">Etiqueta</th>
              <th class="th-receita">Tipo</th>
              <th class="th-receita" style="text-align: right;">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${receitasList.map((r) => `
              <tr>
                <td>${r.data_transacao ? new Date(r.data_transacao).toLocaleString('pt-BR') : ''}</td>
                <td><strong>${r.nome}</strong></td>
                <td>${r.classificacao || 'Salário & Ganhos'}</td>
                <td><span class="badge-tag">${r.etiqueta || 'Geral'}</span></td>
                <td>${r.eh_fixa === 1 ? 'Fixa' : 'Recorrente'}</td>
                <td class="val-rec" style="text-align: right;">R$ ${Number(r.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    let despesasRows = '';
    if (despesasList.length === 0) {
      despesasRows = '<div style="font-size: 12px; color: #a0aec0; padding: 16px; background: #f7fafc; border-radius: 8px; text-align: center;">Nenhuma despesa registrada neste período.</div>';
    } else {
      despesasRows = `
        <table>
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Nome</th>
              <th>Categoria</th>
              <th>Etiqueta</th>
              <th>Parcelas</th>
              <th style="text-align: right;">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${despesasList.map((d) => `
              <tr>
                <td>${d.data_transacao ? new Date(d.data_transacao).toLocaleString('pt-BR') : ''}</td>
                <td><strong>${d.nome}</strong></td>
                <td>${d.classificacao || 'Outros'}</td>
                <td><span class="badge-tag">${d.etiqueta || 'Geral'}</span></td>
                <td>${d.eh_fixa === 1 ? 'Fixa' : (d.parcelas || '1/1')}</td>
                <td class="val-desp" style="text-align: right;">R$ ${Number(d.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Relatório Executivo - ${mes}/${ano}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 32px; color: #2d3748; background: #ffffff; margin: 0; }
          .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #ffe192; padding-bottom: 16px; margin-bottom: 24px; }
          .brand { font-size: 24px; font-weight: 800; color: #1a202c; letter-spacing: -0.5px; }
          .brand span { color: #d69e2e; }
          .meta-info { text-align: right; font-size: 12px; color: #718096; line-height: 1.5; }
          .meta-info strong { color: #2d3748; }
          .kpi-container { display: flex; gap: 16px; margin-bottom: 24px; }
          .kpi-card { flex: 1; padding: 16px; border-radius: 12px; background: #f7fafc; border: 1px solid #e2e8f0; border-top: 4px solid #cbd5e0; }
          .kpi-card.receita { border-top-color: #38a169; background: #f0fff4; }
          .kpi-card.despesa { border-top-color: #e53e3e; background: #fff5f5; }
          .kpi-card.economia { border-top-color: #d69e2e; background: #fffff0; }
          .kpi-title { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #718096; letter-spacing: 0.5px; }
          .kpi-val { font-size: 20px; font-weight: 800; margin-top: 6px; color: #1a202c; }
          .kpi-badge { display: inline-block; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 12px; margin-top: 6px; background: #edf2f7; color: #4a5568; }
          .charts-section { display: flex; gap: 24px; margin-bottom: 28px; }
          .chart-box { flex: 1; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; }
          .chart-title { font-size: 13px; font-weight: 700; color: #2d3748; margin-bottom: 12px; border-bottom: 1px solid #edf2f7; padding-bottom: 6px; }
          .balance-bar-wrapper { height: 16px; border-radius: 8px; background: #e2e8f0; overflow: hidden; display: flex; margin-top: 12px; }
          .balance-bar-used { background: #e53e3e; height: 100%; }
          .balance-bar-saved { background: #38a169; height: 100%; }
          .cat-item { margin-bottom: 10px; }
          .cat-header { display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; margin-bottom: 4px; color: #4a5568; }
          .cat-bar-bg { height: 8px; background: #edf2f7; border-radius: 4px; overflow: hidden; }
          .cat-bar-fill { height: 100%; border-radius: 4px; }
          .section-title { font-size: 15px; font-weight: 700; color: #1a202c; margin-top: 24px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
          th { background: #2d3748; color: #ffffff; font-weight: 600; padding: 10px 12px; text-align: left; }
          th.th-receita { background: #276749; }
          td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; color: #4a5568; }
          tr:nth-child(even) { background: #f7fafc; }
          .val-rec { color: #276749; font-weight: 700; }
          .val-desp { color: #c53030; font-weight: 700; }
          .badge-tag { background: #edf2f7; padding: 2px 6px; border-radius: 4px; font-size: 10px; color: #4a5568; }
          .footer { margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center; font-size: 11px; color: #a0aec0; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">GESTOR <span>DE ORÇAMENTO</span></div>
            <div style="font-size: 13px; color: #718096; margin-top: 2px;">Relatório Financeiro Executivo</div>
          </div>
          <div class="meta-info">
            <div>Período: <strong>${mes} / ${ano}</strong></div>
            <div>Titular: <strong>${usuarioNome || 'Usuário'}</strong></div>
            <div>Emitido em: <strong>${dataHoje}</strong></div>
          </div>
        </div>

        <div class="kpi-container">
          <div class="kpi-card receita">
            <div class="kpi-title">Receita Total</div>
            <div class="kpi-val">R$ ${Number(totalReceitas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <div class="kpi-badge">${receitasList.length} registro(s)</div>
          </div>

          <div class="kpi-card despesa">
            <div class="kpi-title">Despesas Totais</div>
            <div class="kpi-val">R$ ${Number(totalDespesas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <div class="kpi-badge">${despesasList.length} registro(s)</div>
          </div>

          <div class="kpi-card economia">
            <div class="kpi-title">Saldo / Economia</div>
            <div class="kpi-val">R$ ${Number(economia).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <div class="kpi-badge" style="background: #fefcbf; color: #744210;">Taxa de Economia: ${taxaEconomia}%</div>
          </div>
        </div>

        <div class="charts-section">
          <div class="chart-box">
            <div class="chart-title">📊 Balanço Orçamentário (Gastos x Saldo)</div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 8px;">
              <span>Comprometido: <strong>${porcGasto}%</strong></span>
              <span>Livre: <strong>${100 - porcGasto}%</strong></span>
            </div>
            <div class="balance-bar-wrapper">
              <div class="balance-bar-used" style="width: ${porcGasto}%;"></div>
              <div class="balance-bar-saved" style="width: ${100 - porcGasto}%;"></div>
            </div>
            <div style="display: flex; gap: 16px; margin-top: 12px; font-size: 11px; color: #718096;">
              <div><span style="color: #e53e3e;">■</span> Despesas (R$ ${totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})</div>
              <div><span style="color: #38a169;">■</span> Saldo Livre (R$ ${Math.max(0, economia).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})</div>
            </div>
          </div>

          <div class="chart-box">
            <div class="chart-title">🏷️ Gastos por Categoria</div>
            ${categoriasHTML}
          </div>
        </div>

        ${receitasRows}

        <div class="section-title">🔴 Detalhamento das Despesas</div>
        ${despesasRows}

        <div class="footer">
          Documento gerado automaticamente pelo aplicativo Gestor de Orçamento • Página 1 de 1
        </div>
      </body>
      </html>
    `;

    await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
    const pdfBuffer = await pdfWindow.webContents.printToPDF({
      marginsType: 0,
      printBackground: true,
      pageSize: 'A4',
    });

    fs.writeFileSync(filePath, pdfBuffer);
    pdfWindow.close();
    return { success: true, filePath };
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    return { success: false, error: error.message };
  }
});

const createWindow = () => {
  const iconPng = path.resolve(process.cwd(), 'images/app_icon.png');
  const iconJpg = path.resolve(process.cwd(), 'images/app_icon.jpg');
  const finalIcon = fs.existsSync(iconPng) ? iconPng : iconJpg;

  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    title: 'Gestor de Orçamento',
    icon: finalIcon,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.setTitle('Gestor de Orçamento');
  mainWindow.setMenu(null);

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }
};

app.whenReady().then(async () => {
  await initDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
