import { app, BrowserWindow, ipcMain, Menu, dialog } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import started from 'electron-squirrel-startup';
import dotenv from 'dotenv';
import { createClient } from '@libsql/client/web';
import crypto from 'node:crypto';

// Remove a barra de menu nativa padrão (File, Edit, View, Window)
Menu.setApplicationMenu(null);

// Carrega as variáveis do .env na raiz do projeto
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

if (started) {
  app.quit();
}

const dbUrl = process.env.TURSO_DATABASE_URL || '';
const dbToken = process.env.TURSO_AUTH_TOKEN || '';

const turso = createClient({
  url: dbUrl || 'https://placeholder.turso.io',
  authToken: dbToken,
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

// Categorias padrão para finanças pessoais
const CATEGORIAS_PADRAO = [
  { nome: 'Alimentação', cor: '#fb8500' },
  { nome: 'Moradia', cor: '#ffb703' },
  { nome: 'Transporte', cor: '#ffd166' },
  { nome: 'Saúde', cor: '#ffe192' },
  { nome: 'Lazer', cor: '#f4a261' },
  { nome: 'Educação', cor: '#e76f51' },
  { nome: 'Salário & Ganhos', cor: '#2a9d8f' },
  { nome: 'Outros', cor: '#8d99ae' },
];

// Inicializa as 2 tabelas principais (receitas e despesas) e categorias
async function initDatabase() {
  if (!dbUrl) return;

  try {
    // 1. Tabela de Usuários
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha_hash TEXT NOT NULL,
        avatar_url TEXT,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Tabela de Categorias
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id TEXT NOT NULL,
        nome TEXT NOT NULL,
        cor TEXT DEFAULT '#ffe192',
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      );
    `);

    // 3. Tabela de Receitas
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS receitas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id TEXT NOT NULL,
        nome TEXT NOT NULL,
        valor REAL NOT NULL,
        classificacao TEXT DEFAULT 'Outros',
        etiqueta TEXT DEFAULT 'Geral',
        parcelas TEXT DEFAULT '1/1',
        eh_fixa INTEGER DEFAULT 0,
        descricao TEXT,
        mes TEXT NOT NULL,
        ano TEXT NOT NULL,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      );
    `);

    // 4. Tabela de Despesas
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS despesas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id TEXT NOT NULL,
        nome TEXT NOT NULL,
        valor REAL NOT NULL,
        classificacao TEXT DEFAULT 'Outros',
        etiqueta TEXT DEFAULT 'Geral',
        parcelas TEXT DEFAULT '1/1',
        eh_fixa INTEGER DEFAULT 0,
        descricao TEXT,
        mes TEXT NOT NULL,
        ano TEXT NOT NULL,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      );
    `);

    // Índices de Alta Performance
    await turso.execute(`CREATE INDEX IF NOT EXISTS idx_receitas_usuario ON receitas (usuario_id, ano, mes);`);
    await turso.execute(`CREATE INDEX IF NOT EXISTS idx_despesas_usuario ON despesas (usuario_id, ano, mes);`);

    console.log('✅ Banco de Dados SQL na Oracle Cloud inicializado com sucesso.');
  } catch (error) {
    console.error('❌ Erro ao inicializar tabelas:', error);
  }
}

// --- IPC HANDLERS ---

// Registrar Usuário
ipcMain.handle('registrar-usuario', async (event, { nome, email, senha }) => {
  if (!dbUrl) return { success: false, error: 'Banco de dados não configurado no .env' };

  try {
    const checkEmail = await turso.execute({
      sql: 'SELECT id FROM usuarios WHERE email = ?',
      args: [email.toLowerCase().trim()],
    });

    if (checkEmail.rows.length > 0) {
      return { success: false, error: 'Este e-mail já está cadastrado.' };
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const { hashSenha: senhaCriptografada } = hashSenha(senha);

    await turso.execute({
      sql: 'INSERT INTO usuarios (id, nome, email, senha_hash) VALUES (?, ?, ?, ?)',
      args: [userId, nome.trim(), email.toLowerCase().trim(), senhaCriptografada],
    });

    for (const cat of CATEGORIAS_PADRAO) {
      await turso.execute({
        sql: 'INSERT INTO categorias (usuario_id, nome, cor) VALUES (?, ?, ?)',
        args: [userId, cat.nome, cat.cor],
      });
    }

    return {
      success: true,
      user: { id: userId, nome: nome.trim(), email: email.toLowerCase().trim() },
    };
  } catch (error) {
    console.error('Erro no registro:', error);
    return { success: false, error: 'Erro ao cadastrar usuário.' };
  }
});

// Login de Usuário
ipcMain.handle('login-usuario', async (event, { email, senha }) => {
  if (!dbUrl) return { success: false, error: 'Banco de dados não configurado no .env' };

  try {
    const result = await turso.execute({
      sql: 'SELECT * FROM usuarios WHERE email = ?',
      args: [email.toLowerCase().trim()],
    });

    if (result.rows.length === 0) {
      return { success: false, error: 'E-mail ou senha incorretos.' };
    }

    const usuario = result.rows[0];
    const senhaValida = verificarSenha(senha, usuario.senha_hash);

    if (!senhaValida) {
      return { success: false, error: 'E-mail ou senha incorretos.' };
    }

    return {
      success: true,
      user: { id: usuario.id, nome: usuario.nome, email: usuario.email },
    };
  } catch (error) {
    console.error('Erro no login:', error);
    return { success: false, error: 'Erro ao realizar login.' };
  }
});

// Carregar Categorias Pessoais do Usuário
ipcMain.handle('carregar-categorias', async (event, { usuarioId }) => {
  if (!dbUrl || !usuarioId) return CATEGORIAS_PADRAO;

  try {
    const userCheck = await turso.execute({
      sql: 'SELECT id FROM usuarios WHERE id = ?',
      args: [usuarioId],
    });

    if (userCheck.rows.length === 0) {
      return CATEGORIAS_PADRAO;
    }

    const result = await turso.execute({
      sql: 'SELECT * FROM categorias WHERE usuario_id = ? ORDER BY id ASC',
      args: [usuarioId],
    });

    if (result.rows.length === 0) {
      for (const cat of CATEGORIAS_PADRAO) {
        await turso.execute({
          sql: 'INSERT INTO categorias (usuario_id, nome, cor) VALUES (?, ?, ?)',
          args: [usuarioId, cat.nome, cat.cor],
        });
      }
      const newResult = await turso.execute({
        sql: 'SELECT * FROM categorias WHERE usuario_id = ? ORDER BY id ASC',
        args: [usuarioId],
      });
      return newResult.rows;
    }

    return result.rows;
  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
    return CATEGORIAS_PADRAO;
  }
});

// Adicionar Categoria
ipcMain.handle('adicionar-categoria', async (event, { usuarioId, nome, cor }) => {
  if (!dbUrl || !usuarioId) return { success: false, error: 'Sessão inválida.' };

  try {
    await turso.execute({
      sql: 'INSERT INTO categorias (usuario_id, nome, cor) VALUES (?, ?, ?)',
      args: [usuarioId, nome.trim(), cor || '#ffe192'],
    });
    return { success: true };
  } catch (error) {
    console.error('Erro ao adicionar categoria:', error);
    return { success: false, error: error.message };
  }
});

// Deletar Categoria
ipcMain.handle('deletar-categoria', async (event, { id, usuarioId }) => {
  if (!dbUrl || !usuarioId) return { success: false, error: 'Sessão inválida.' };

  try {
    await turso.execute({
      sql: 'DELETE FROM categorias WHERE id = ? AND usuario_id = ?',
      args: [id, usuarioId],
    });
    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar categoria:', error);
    return { success: false, error: error.message };
  }
});

// Carregar Transações (receitas e despesas)
ipcMain.handle('carregar-transacoes', async (event, { usuarioId, mes, ano }) => {
  if (!dbUrl || !usuarioId) return { receitas: [], despesas: [] };

  try {
    const filtrarMes = mes && mes !== 'Todos';

    const sqlReceitas = filtrarMes
      ? 'SELECT * FROM receitas WHERE usuario_id = ? AND ano = ? AND mes = ? ORDER BY id DESC'
      : 'SELECT * FROM receitas WHERE usuario_id = ? AND ano = ? ORDER BY id DESC';

    const sqlDespesas = filtrarMes
      ? 'SELECT * FROM despesas WHERE usuario_id = ? AND ano = ? AND mes = ? ORDER BY id DESC'
      : 'SELECT * FROM despesas WHERE usuario_id = ? AND ano = ? ORDER BY id DESC';

    const args = filtrarMes ? [usuarioId, ano, mes] : [usuarioId, ano];

    const [resReceitas, resDespesas] = await Promise.all([
      turso.execute({ sql: sqlReceitas, args }),
      turso.execute({ sql: sqlDespesas, args }),
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

// Adicionar Transação
ipcMain.handle('adicionar-transacao', async (event, novaTransacao) => {
  if (!dbUrl || !novaTransacao.usuarioId) {
    return { success: false, error: 'Sessão de usuário inválida.' };
  }

  const tabela = getNomeTabela(novaTransacao.tipo);
  const mesesList = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const isReceita = tabela === 'receitas';

  let mesOrigem = novaTransacao.mes;
  if (mesOrigem === 'Todos') {
    const dataAtual = new Date();
    mesOrigem = mesesList[dataAtual.getMonth()];
  }

  const mesInicioIndex = mesesList.indexOf(mesOrigem);
  const anoInicio = parseInt(novaTransacao.ano, 10);

  if (mesInicioIndex === -1 || isNaN(anoInicio)) {
    return { success: false, error: 'Mês ou ano de origem inválidos.' };
  }

  const valorInserido = parseFloat(novaTransacao.valor || 0);

  try {
    if (novaTransacao.ehFixa) {
      for (let m = mesInicioIndex; m < 12; m++) {
        const mesCalculado = mesesList[m];
        await turso.execute({
          sql: `INSERT INTO ${tabela} (usuario_id, nome, valor, classificacao, etiqueta, parcelas, eh_fixa, descricao, mes, ano)
                VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
          args: [
            novaTransacao.usuarioId,
            novaTransacao.nome.trim(),
            valorInserido,
            novaTransacao.classificacao || 'Outros',
            novaTransacao.etiqueta || 'Geral',
            'Fixa',
            novaTransacao.descricao || '',
            mesCalculado,
            novaTransacao.ano,
          ],
        });
      }
      return { success: true };
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

        await turso.execute({
          sql: `INSERT INTO ${tabela} (usuario_id, nome, valor, classificacao, etiqueta, parcelas, eh_fixa, descricao, mes, ano)
                VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
          args: [
            novaTransacao.usuarioId,
            novaTransacao.nome.trim(),
            valorPorParcela,
            novaTransacao.classificacao || 'Outros',
            novaTransacao.etiqueta || 'Geral',
            stringParcela,
            novaTransacao.descricao || '',
            mesCalculado,
            anoCalculado,
          ],
        });
      }
      return { success: true };
    } else {
      const stringParcela = `${parcelaAtual}/${totalParcelas}`;
      await turso.execute({
        sql: `INSERT INTO ${tabela} (usuario_id, nome, valor, classificacao, etiqueta, parcelas, eh_fixa, descricao, mes, ano)
              VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
        args: [
          novaTransacao.usuarioId,
          novaTransacao.nome.trim(),
          valorPorParcela,
          novaTransacao.classificacao || 'Outros',
          novaTransacao.etiqueta || 'Geral',
          stringParcela,
          novaTransacao.descricao || '',
          mesOrigem,
          novaTransacao.ano,
        ],
      });
      return { success: true };
    }
  } catch (error) {
    console.error(`Erro ao adicionar em ${tabela}:`, error);
    return { success: false, error: error.message };
  }
});

// Editar Transação
ipcMain.handle('editar-transacao', async (event, { id, usuarioId, nome, valor, classificacao, etiqueta, descricao, tipo }) => {
  if (!dbUrl || !usuarioId) return { success: false, error: 'Sessão inválida.' };

  const tabela = getNomeTabela(tipo);

  try {
    await turso.execute({
      sql: `UPDATE ${tabela}
            SET nome = ?, valor = ?, classificacao = ?, etiqueta = ?, descricao = ?
            WHERE id = ? AND usuario_id = ?`,
      args: [
        nome.trim(),
        parseFloat(valor || 0),
        classificacao || 'Outros',
        etiqueta || 'Geral',
        descricao || '',
        id,
        usuarioId,
      ],
    });
    return { success: true };
  } catch (error) {
    console.error(`Erro ao editar em ${tabela}:`, error);
    return { success: false, error: error.message };
  }
});

// Deletar Transação
ipcMain.handle('deletar-transacao', async (event, { id, usuarioId, deletarModo, nome, tipo, parcelaNum, ehFixa, mes }) => {
  if (!dbUrl || !usuarioId) return { success: false, error: 'Sessão inválida.' };

  const tabela = getNomeTabela(tipo);
  const mesesList = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  try {
    if (deletarModo === 'todas' && nome) {
      await turso.execute({
        sql: `DELETE FROM ${tabela} WHERE usuario_id = ? AND LOWER(TRIM(nome)) = LOWER(TRIM(?))`,
        args: [usuarioId, nome.trim()],
      });
    } else if (deletarModo === 'posteriores' && nome) {
      if (ehFixa && mes) {
        const mesIndex = mesesList.indexOf(mes);
        const result = await turso.execute({
          sql: `SELECT id, mes FROM ${tabela} WHERE usuario_id = ? AND LOWER(TRIM(nome)) = LOWER(TRIM(?))`,
          args: [usuarioId, nome.trim()],
        });

        const idsParaDeletar = result.rows
          .filter((row) => {
            const idx = mesesList.indexOf(row.mes);
            return idx !== -1 && idx >= mesIndex;
          })
          .map((row) => row.id);

        for (const rowId of idsParaDeletar) {
          await turso.execute({
            sql: `DELETE FROM ${tabela} WHERE id = ? AND usuario_id = ?`,
            args: [rowId, usuarioId],
          });
        }
      } else if (parcelaNum) {
        const result = await turso.execute({
          sql: `SELECT id, parcelas FROM ${tabela} WHERE usuario_id = ? AND LOWER(TRIM(nome)) = LOWER(TRIM(?))`,
          args: [usuarioId, nome.trim()],
        });

        const idsParaDeletar = result.rows
          .filter((row) => {
            const num = parseInt((row.parcelas || '1/1').split('/')[0], 10);
            return !isNaN(num) && num >= parcelaNum;
          })
          .map((row) => row.id);

        for (const rowId of idsParaDeletar) {
          await turso.execute({
            sql: `DELETE FROM ${tabela} WHERE id = ? AND usuario_id = ?`,
            args: [rowId, usuarioId],
          });
        }
      } else {
        await turso.execute({
          sql: `DELETE FROM ${tabela} WHERE id = ? AND usuario_id = ?`,
          args: [id, usuarioId],
        });
      }
    } else {
      await turso.execute({
        sql: `DELETE FROM ${tabela} WHERE id = ? AND usuario_id = ?`,
        args: [id, usuarioId],
      });
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
    csvContent += 'Tipo;Nome;Classificação;Etiqueta;Parcelas;Valor (R$);Mês;Ano\n';

    for (const item of dados) {
      const isRec = item.tipo === 'receitas' || item.tipo === 'receita';
      const tipoLabel = isRec ? 'Receita' : 'Despesa';
      const nomeSanitizado = (item.nome || '').replace(/;/g, ',');
      const classifSanitizado = (item.classificacao || '').replace(/;/g, ',');
      const etiqSanitizado = (item.etiqueta || '').replace(/;/g, ',');
      const parcelasStr = item.eh_fixa === 1 ? 'Fixa' : (item.parcelas || '1/1');
      const valorStr = (Number(item.valor) || 0).toFixed(2).replace('.', ',');

      csvContent += `${tipoLabel};${nomeSanitizado};${classifSanitizado};${etiqSanitizado};${parcelasStr};${valorStr};${item.mes};${item.ano}\n`;
    }

    fs.writeFileSync(filePath, csvContent, 'utf-8');
    return { success: true, filePath };
  } catch (error) {
    console.error('Erro ao exportar CSV:', error);
    return { success: false, error: error.message };
  }
});

// EXPORTAR RELATÓRIO EXECUTIVO EM PDF FORMATADO E VISUAL
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
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

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
