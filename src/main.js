import { app, BrowserWindow, ipcMain, Menu, dialog, shell, nativeImage } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

// Define o AppUserModelId para vinculacao do icone na barra de tarefas do Windows
app.setAppUserModelId('com.simplefinances.app');
import http from 'node:http';
import started from 'electron-squirrel-startup';
import dotenv from 'dotenv';
import crypto from 'node:crypto';
import dns from 'node:dns';
import net from 'node:net';
import nodemailer from 'nodemailer';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

// Carrega as variáveis do .env de múltiplos caminhos possíveis (desenvolvimento e build de produção)
const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.join(process.resourcesPath || '', '.env'),
  path.join(__dirname, '..', '.env'),
];

for (const p of envPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
  }
}
dotenv.config();

// Armazena temporariamente códigos de verificação de 6 dígitos em memória
const codigosVerificacao = new Map();

function criarTransporterNodemailer() {
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpUser = process.env.SMTP_USER || 'gestororc@gmail.com';
  const smtpPass = process.env.SMTP_PASS || 'cvfeowfdngseznfi';

  if (!smtpUser || !smtpPass) {
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

// Remove a barra de menu nativa padrão (File, Edit, View, Window)
Menu.setApplicationMenu(null);

// --- SISTEMA DE LOGS DEDICADO DE INSTALAÇÃO E EXECUÇÃO ---
function registrarLogInstalacao(mensagem, erro = null) {
  try {
    const dataHora = new Date().toISOString();
    const textoLog = `[${dataHora}] ${mensagem}${erro ? '\n[DETALHES DO ERRO]: ' + (erro.stack || erro) : ''}\n`;

    const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || 'C:\\', 'AppData', 'Local');
    const pastaAppLog = path.join(localAppData, 'simplefinances');
    
    if (!fs.existsSync(pastaAppLog)) {
      fs.mkdirSync(pastaAppLog, { recursive: true });
    }

    const caminhosLogs = [
      path.join(pastaAppLog, 'SquirrelSetup.log'),
      path.join(pastaAppLog, 'instalacao_erros.log'),
      path.join(localAppData, 'SquirrelSetup.log') // Garante que o botão "Open Setup Log" abra o log do SimpleFinances
    ];

    for (const logPath of caminhosLogs) {
      try {
        fs.appendFileSync(logPath, textoLog, 'utf8');
      } catch (e) {
        // Ignora caso algum arquivo específico esteja travado
      }
    }
  } catch (errLog) {
    console.error('Erro ao gravar log de instalação:', errLog);
  }
}

process.on('uncaughtException', (err) => {
  registrarLogInstalacao('❌ EXCEÇÃO NÃO TRATADA (uncaughtException)', err);
});

process.on('unhandledRejection', (reason) => {
  registrarLogInstalacao('❌ REJEIÇÃO NÃO TRATADA (unhandledRejection)', reason instanceof Error ? reason : new Error(String(reason)));
});

function tratarEventosSquirrel() {
  if (process.platform !== 'win32') return false;

  const cmd = process.argv[1];
  const isSquirrelArg = cmd && typeof cmd === 'string' && cmd.startsWith('--squirrel-');

  if (!isSquirrelArg && !started) return false;

  const comandoExecutado = isSquirrelArg ? cmd : '--squirrel-install';

  registrarLogInstalacao(`=====================================================`);
  registrarLogInstalacao(`🔄 EVENTO DE INSTALAÇÃO/ATUALIZAÇÃO DETECTADO: ${comandoExecutado}`);
  registrarLogInstalacao(`📌 Executável: ${process.execPath}`);
  registrarLogInstalacao(`📌 Argumentos: ${process.argv.join(' ')}`);

  // Finaliza instâncias anteriores em segundo plano para liberar %LOCALAPPDATA%\simplefinances
  try {
    const currentPid = process.pid;
    spawnSync('cmd.exe', ['/c', `taskkill /F /FI "PID ne ${currentPid}" /IM SimpleFinances.exe /T`], { encoding: 'utf8', windowsHide: true });
  } catch (e) {
    // Ignora se não houver outros processos
  }

  const target = path.basename(process.execPath);
  const updateExe = path.resolve(path.dirname(process.execPath), '..', 'Update.exe');

  if (comandoExecutado === '--squirrel-install' || comandoExecutado === '--squirrel-updated') {
    registrarLogInstalacao(`🔨 Executando criação de atalhos via Update.exe: ${updateExe}`);
    if (fs.existsSync(updateExe)) {
      try {
        const res = spawnSync(updateExe, ['--createShortcut=' + target], { encoding: 'utf8', windowsHide: true });
        if (res.error) {
          registrarLogInstalacao(`❌ Erro ao disparar Update.exe`, res.error);
        } else {
          registrarLogInstalacao(`✅ Atalhos criados com sucesso. ExitCode: ${res.status}. Saída: ${res.stdout || 'Sem saída'}`);
        }
      } catch (errSpawn) {
        registrarLogInstalacao(`❌ Exceção ao executar Update.exe`, errSpawn);
      }
    } else {
      registrarLogInstalacao(`⚠️ Update.exe não localizado em: ${updateExe}`);
    }
    registrarLogInstalacao(`🏁 Finalizando rotina de instalação.`);
    app.quit();
    process.exit(0);
    return true;
  }

  if (comandoExecutado === '--squirrel-uninstall') {
    registrarLogInstalacao(`🗑️ Removendo atalhos do sistema via Update.exe`);
    if (fs.existsSync(updateExe)) {
      try {
        const res = spawnSync(updateExe, ['--removeShortcut=' + target], { encoding: 'utf8', windowsHide: true });
        registrarLogInstalacao(`✅ Remoção de atalhos concluída. ExitCode: ${res.status}`);
      } catch (errSpawn) {
        registrarLogInstalacao(`❌ Falha ao remover atalhos`, errSpawn);
      }
    }
    app.quit();
    process.exit(0);
    return true;
  }

  if (comandoExecutado === '--squirrel-obsolete') {
    registrarLogInstalacao(`📦 Processo marcado como obsoleto pelo Squirrel. Encerrando.`);
    app.quit();
    process.exit(0);
    return true;
  }

  app.quit();
  process.exit(0);
  return true;
}

const modoSquirrelAtivo = tratarEventosSquirrel();

// Trava de Instância Única (Single Instance Lock) para impedir processos duplicados em segundo plano
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock && !modoSquirrelAtivo) {
  registrarLogInstalacao('⚠️ Segunda instância detectada. Encerrando processo duplicado.');
  app.quit();
  process.exit(0);
} else if (!modoSquirrelAtivo) {
  app.on('second-instance', () => {
    const wins = BrowserWindow.getAllWindows();
    if (wins.length > 0) {
      if (wins[0].isMinimized()) wins[0].restore();
      wins[0].focus();
    }
  });
}

let sshTunnelProcess = null;

function resolverHostPostgres(hostEnv) {
  if (!hostEnv || hostEnv === '147.15.21.81' || hostEnv === 'localhost') {
    return '127.0.0.1';
  }
  return hostEnv;
}

async function aguardarConexaoPorta(port, host = '127.0.0.1', timeoutMs = 4000) {
  const net = require('net');
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ok = await new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(400);
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      socket.connect(port, host);
    });

    if (ok) return true;
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

async function iniciarTunelSSHSeNecessario() {
  const hostAlvo = resolverHostPostgres(process.env.PG_HOST);
  if (hostAlvo === '127.0.0.1') {
    try {
      const localPort = parseInt(process.env.PG_PORT || '5432', 10);

      // Se a porta já está aceitando conexões (ex: túnel já rodando), não precisa abrir de novo
      const jaPronto = await aguardarConexaoPorta(localPort, '127.0.0.1', 400);
      if (jaPronto) {
        console.log(`✅ [Túnel SSH] Porta ${localPort} já está ativa e pronta para conexões.`);
        return;
      }

      const sshKeyCandidates = [
        path.join(process.resourcesPath || '', 'ssh-key-2026-07-30.key'),
        path.join(app.getAppPath(), 'ssh-key-2026-07-30.key'),
        path.resolve(process.cwd(), 'ssh-key-2026-07-30.key'),
        path.join(app.getPath('userData'), 'ssh-key-2026-07-30.key'),
        path.join(__dirname, '..', '..', 'ssh-key-2026-07-30.key'),
      ];

      let keyPath = null;
      for (const cand of sshKeyCandidates) {
        if (fs.existsSync(cand)) {
          keyPath = cand;
          break;
        }
      }

      if (keyPath) {
        // Copia a chave para userData para evitar problemas de permissão em Program Files
        const userDataKeyPath = path.join(app.getPath('userData'), 'ssh-key-2026-07-30.key');
        if (keyPath !== userDataKeyPath) {
          try {
            fs.copyFileSync(keyPath, userDataKeyPath);
            keyPath = userDataKeyPath;
          } catch (errCopy) {
            console.warn('⚠️ Não foi possível copiar chave para userData:', errCopy.message);
          }
        }

        // Restringe permissões do arquivo de chave no Windows se necessário
        if (process.platform === 'win32') {
          try {
            const { execSync } = require('child_process');
            execSync(`icacls "${keyPath}" /inheritance:r /grant:r "%USERNAME%:F"`, { stdio: 'ignore', windowsHide: true });
          } catch (e) {}
        }

        console.log(`🔌 [Túnel SSH] Iniciando túnel SSH seguro (127.0.0.1:${localPort} -> 147.15.21.81:5432) via chave: ${keyPath}`);
        const { spawn } = require('child_process');
        sshTunnelProcess = spawn('ssh', [
          '-i', keyPath,
          '-o', 'StrictHostKeyChecking=no',
          '-o', 'ServerAliveInterval=15',
          '-o', 'ServerAliveCountMax=3',
          '-L', `${localPort}:127.0.0.1:5432`,
          'ubuntu@147.15.21.81',
          '-N'
        ], { windowsHide: true });

        sshTunnelProcess.stderr.on('data', (data) => {
          console.error(`⚠️ [Túnel SSH Stderr]: ${data.toString()}`);
        });

        sshTunnelProcess.on('error', (err) => {
          console.error('⚠️ [Túnel SSH] Erro ao iniciar processo do túnel SSH:', err.message);
        });

        sshTunnelProcess.on('exit', (code, signal) => {
          console.warn(`⚠️ [Túnel SSH] Processo finalizado com código ${code} / sinal ${signal}`);
        });

        app.on('will-quit', () => {
          if (sshTunnelProcess) {
            try { sshTunnelProcess.kill(); } catch (e) {}
          }
        });

        // Aguarda a porta ficar pronta antes de prosseguir
        const portaOnline = await aguardarConexaoPorta(localPort, '127.0.0.1', 4000);
        if (portaOnline) {
          console.log(`✅ [Túnel SSH] Conexão túnel estabelecida e pronta na porta ${localPort}.`);
        } else {
          console.warn(`⚠️ [Túnel SSH] Tempo limite esgotado ao aguardar a porta ${localPort}.`);
        }
      } else {
        console.warn('⚠️ [Túnel SSH] Chave SSH não encontrada para iniciar o túnel automático.');
      }
    } catch (errTunnel) {
      console.error('⚠️ [Túnel SSH] Falha na criação do túnel SSH:', errTunnel.message);
    }
  }
}

if (modoSquirrelAtivo) {
  // Em modo Squirrel de instalação/atualização/remoção, não inicializa DB nem interface
} else {
  iniciarTunelSSHSeNecessario();

  const pgSSL = process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false;
  const hostEfetivo = resolverHostPostgres(process.env.PG_HOST);
  const hostBackupEfetivo = resolverHostPostgres(process.env.PG_BACKUP_HOST || process.env.PG_HOST);

  // Banco de Dados Principal
  const pool = new Pool({
    host: hostEfetivo,
    port: parseInt(process.env.PG_PORT || '5432', 10),
    database: process.env.PG_DATABASE || 'gestor_orcamento',
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'admin123',
    ssl: pgSSL,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    max: 10,
    allowExitOnIdle: true,
  });

  // Banco de Dados de Backup (Instância/Base Separada e Independente)
  const poolBackup = new Pool({
    host: hostBackupEfetivo,
    port: parseInt(process.env.PG_BACKUP_PORT || process.env.PG_PORT || '5432', 10),
    database: process.env.PG_BACKUP_DATABASE || 'gestor_orcamento_backup',
    user: process.env.PG_BACKUP_USER || process.env.PG_USER || 'postgres',
    password: process.env.PG_BACKUP_PASSWORD || process.env.PG_PASSWORD || 'admin123',
    ssl: pgSSL,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    max: 10,
    allowExitOnIdle: true,
  });

  pool.on('error', (err) => {
    console.error('⚠️ [PostgreSQL Principal] Erro na conexão com o banco principal:', err.message);
  });

  poolBackup.on('error', (err) => {
    console.error('⚠️ [PostgreSQL Backup] Erro na conexão com o banco de backup:', err.message);
  });

// Helper de Dupla Gravação e Failover Automático
async function dbQuery(text, params = []) {
  const isWriteQuery = /^\s*(INSERT|UPDATE|DELETE|ALTER|CREATE|DROP|TRUNCATE)/i.test(text);

  let resPrincipal = null;
  let errPrincipal = null;

  try {
    resPrincipal = await pool.query(text, params);
  } catch (err) {
    errPrincipal = err;
    console.error('⚠️ [PostgreSQL Principal] Falha na operação. Acionando Failover para o Backup:', err.message);
  }

  // Dupla Gravação: Replica modificações em tempo real no banco de backup
  if (isWriteQuery) {
    try {
      await poolBackup.query(text, params);
    } catch (errBkp) {
      console.error('⚠️ [PostgreSQL Backup] Erro ao espelhar dados no banco de backup:', errBkp.message);
    }
  }

  if (resPrincipal) return resPrincipal;

  // Failover: Se o banco principal falhou, consulta no backup
  try {
    console.log('🔄 [PostgreSQL Failover] Respondendo requisição através do Banco de Backup...');
    return await poolBackup.query(text, params);
  } catch (errBkp) {
    console.error('❌ [PostgreSQL Failover Error] Ambos os bancos falharam.');
    throw errPrincipal || errBkp;
  }
}

// Hashing de senha seguro via PBKDF2 com Salt
function hashSenha(senha, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(senha, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hashSenha: `${salt}:${hash}` };
}

function verificarSenha(senhaDigitada, hashSalvo) {
  if (!hashSalvo) return false;
  if (hashSalvo.startsWith('$2')) {
    return bcrypt.compareSync(senhaDigitada, hashSalvo);
  }
  if (hashSalvo.includes(':')) {
    const [salt, originalHash] = hashSalvo.split(':');
    const hashDigitado = crypto.pbkdf2Sync(senhaDigitada, salt, 1000, 64, 'sha512').toString('hex');
    return hashDigitado === originalHash;
  }
  return false;
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
    const check = await dbQuery(
      'SELECT id FROM etiquetas WHERE usuario_id = $1 AND LOWER(TRIM(nome)) = LOWER(TRIM($2))',
      [usuarioId, nomeLimpo]
    );

    if (check.rows.length === 0) {
      await dbQuery(
        'INSERT INTO etiquetas (usuario_id, nome) VALUES ($1, $2)',
        [usuarioId, nomeLimpo]
      );
    }
  } catch (err) {
    console.error('Erro ao salvar nova etiqueta:', err);
  }
}

// Inicializa as tabelas nos Bancos de Dados PostgreSQL (Principal + Backup em Dupla Gravação)
async function initDatabase() {
  const schemaQueries = [
    `CREATE TABLE IF NOT EXISTS usuarios (
      id VARCHAR(100) PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      senha_hash VARCHAR(255),
      perfil_uso VARCHAR(50) DEFAULT 'individual',
      funcao VARCHAR(50) DEFAULT 'comum',
      avatar_url TEXT,
      google_id VARCHAR(255) UNIQUE,
      provedor VARCHAR(50) DEFAULT 'local',
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,
    `ALTER TABLE usuarios ALTER COLUMN id TYPE VARCHAR(100) USING id::text;`,
    `ALTER TABLE usuarios ALTER COLUMN senha_hash DROP NOT NULL;`,
    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;`,
    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS provedor VARCHAR(50) DEFAULT 'local';`,
    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS perfil_uso VARCHAR(50) DEFAULT 'individual';`,
    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS funcao VARCHAR(50) DEFAULT 'comum';`,
    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS avatar_url TEXT;`,
    `UPDATE usuarios SET funcao = 'admin' WHERE LOWER(email) = 'emanuell.carvalho.pires@gmail.com';`,

    `CREATE TABLE IF NOT EXISTS contas (
      id SERIAL PRIMARY KEY,
      usuario_id VARCHAR(100) NOT NULL,
      nome VARCHAR(255) NOT NULL,
      tipo VARCHAR(50) DEFAULT 'individual',
      descricao TEXT,
      cor VARCHAR(50) DEFAULT '#ffe192',
      caixinha_ativa BOOLEAN DEFAULT false,
      caixinha_saldo_inicial NUMERIC(15, 2) DEFAULT 0.00,
      paleta_cores JSONB DEFAULT NULL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    );`,
    `ALTER TABLE contas ADD COLUMN IF NOT EXISTS caixinha_ativa BOOLEAN DEFAULT false;`,
    `ALTER TABLE contas ADD COLUMN IF NOT EXISTS caixinha_saldo_inicial NUMERIC(15, 2) DEFAULT 0.00;`,
    `ALTER TABLE contas ADD COLUMN IF NOT EXISTS paleta_cores JSONB DEFAULT NULL;`,
    `ALTER TABLE contas ADD COLUMN IF NOT EXISTS descricao TEXT;`,

    `CREATE TABLE IF NOT EXISTS categorias (
      id SERIAL PRIMARY KEY,
      usuario_id VARCHAR(100) NOT NULL,
      nome VARCHAR(255) NOT NULL,
      cor VARCHAR(50) DEFAULT '#ffe192',
      ordem INT DEFAULT 0,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    );`,
    `ALTER TABLE categorias ADD COLUMN IF NOT EXISTS ordem INT DEFAULT 0;`,

    `CREATE TABLE IF NOT EXISTS etiquetas (
      id SERIAL PRIMARY KEY,
      usuario_id VARCHAR(100) NOT NULL,
      nome VARCHAR(255) NOT NULL,
      ordem INT DEFAULT 0,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    );`,
    `ALTER TABLE etiquetas ADD COLUMN IF NOT EXISTS ordem INT DEFAULT 0;`,

    `CREATE TABLE IF NOT EXISTS receitas (
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
    );`,

    `CREATE TABLE IF NOT EXISTS despesas (
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
    );`,

    `CREATE TABLE IF NOT EXISTS password_resets (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      token VARCHAR(255) NOT NULL,
      expira_em TIMESTAMP NOT NULL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS refresh_tokens (
      id SERIAL PRIMARY KEY,
      usuario_id VARCHAR(100) NOT NULL,
      token VARCHAR(500) NOT NULL,
      expira_em TIMESTAMP NOT NULL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    );`,

    `ALTER TABLE receitas ADD COLUMN IF NOT EXISTS conta_id INT REFERENCES contas(id) ON DELETE CASCADE;`,
    `ALTER TABLE despesas ADD COLUMN IF NOT EXISTS conta_id INT REFERENCES contas(id) ON DELETE CASCADE;`,
    `ALTER TABLE receitas ADD COLUMN IF NOT EXISTS data_transacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`,
    `ALTER TABLE despesas ADD COLUMN IF NOT EXISTS data_transacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`,
    `ALTER TABLE receitas ALTER COLUMN data DROP NOT NULL;`,
    `ALTER TABLE despesas ALTER COLUMN data DROP NOT NULL;`,
    `ALTER TABLE receitas ALTER COLUMN data SET DEFAULT CURRENT_DATE;`,
    `ALTER TABLE despesas ALTER COLUMN data SET DEFAULT CURRENT_DATE;`,

    `CREATE INDEX IF NOT EXISTS idx_receitas_usuario ON receitas (usuario_id, conta_id, ano, mes);`,
    `CREATE INDEX IF NOT EXISTS idx_despesas_usuario ON despesas (usuario_id, conta_id, ano, mes);`
  ];

  try {
    for (const q of schemaQueries) {
      try {
        await dbQuery(q);
      } catch (errQ) {
        console.warn('ℹ️ Aviso na migração:', errQ.message);
      }
    }
    console.log('✅ Bancos de Dados PostgreSQL inicializados individualmente com sucesso.');
  } catch (error) {
    console.error('❌ Erro ao inicializar tabelas PostgreSQL:', error);
  }
}

const KNOWN_VALID_DOMAINS = new Set([
  'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'yahoo.com.br',
  'icloud.com', 'live.com', 'msn.com', 'uol.com.br', 'bol.com.br',
  'terra.com.br', 'ig.com.br', 'proton.me', 'protonmail.com', 'aol.com'
]);

const DISPOSABLE_DOMAINS_LIST = new Set([
  'mailinator.com', 'tempmail.com', '10minutemail.com', 'yopmail.com',
  'trashmail.com', 'dispostable.com', 'guerrillamail.com', 'sharklasers.com',
  'getnada.com', 'temp-mail.org', 'fakeinbox.com', 'crazymailing.com',
  'throwawaymail.com', 'maildrop.cc', 'dayrep.com', 'teleworm.us',
  'mailcatch.com', 'inboxalias.com', 'mohmal.com'
]);

const COMMON_TYPOS_MAP = {
  'gmai.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmail.com.br': 'gmail.com',
  'gamil.com.br': 'gmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmaill.com': 'hotmail.com',
  'outloo.com': 'outlook.com',
  'outlok.com': 'outlook.com',
  'yaho.com': 'yahoo.com',
  'yahoo.com.brr': 'yahoo.com.br',
  'icloud.co': 'icloud.com'
};

async function validarExistenciaEmailBackend(email) {
  if (!email || typeof email !== 'string') {
    return { valido: false, erro: 'Informe um endereço de e-mail válido.' };
  }

  const cleanEmail = email.trim().toLowerCase();
  const regexSyntax = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (!regexSyntax.test(cleanEmail)) {
    return { valido: false, erro: 'Formato de e-mail inválido. Verifique o e-mail digitado (ex: usuario@dominio.com).' };
  }

  const partes = cleanEmail.split('@');
  if (partes.length !== 2) return { valido: false, erro: 'E-mail malformatado.' };

  const [usuario, dominio] = partes;

  if (usuario.length < 2) {
    return { valido: false, erro: 'O nome de usuário do e-mail é curto demais.' };
  }

  // Erro de digitação comum em domínios populares (ex: @gmail.com.br)
  if (COMMON_TYPOS_MAP[dominio]) {
    return { valido: false, erro: `Você quis dizer @${COMMON_TYPOS_MAP[dominio]} ao invés de @${dominio}?` };
  }

  // Bloqueio de e-mails descartáveis/temporários
  if (DISPOSABLE_DOMAINS_LIST.has(dominio)) {
    return { valido: false, erro: 'E-mails temporários ou descartáveis não são aceitos.' };
  }

  // Se o domínio for um provedor público de e-mail reconhecido (gmail.com, hotmail.com, etc.), é 100% válido!
  if (KNOWN_VALID_DOMAINS.has(dominio)) {
    return { valido: true, emailLimpo: cleanEmail };
  }

  // Para domínios corporativos/personalizados desconhecidos: faz checagem de registros MX com fallback seguro
  try {
    const mxRecords = await dns.promises.resolveMx(dominio);
    if (!mxRecords || mxRecords.length === 0) {
      return { valido: false, erro: `O domínio @${dominio} não possui um servidor de e-mail ativo.` };
    }
  } catch (err) {
    // Em caso de falha de rede/DNS local, não bloqueia o usuário legítimo
    console.warn('Aviso: Não foi possível verificar os registros MX do domínio personalizado:', dominio, err.message);
  }

  return { valido: true, emailLimpo: cleanEmail };
}

// --- IPC HANDLERS ---

ipcMain.handle('enviar-codigo-verificacao', async (event, { email, nome }) => {
  try {
    const checagemEmail = await validarExistenciaEmailBackend(email);
    if (!checagemEmail.valido) {
      return { success: false, error: checagemEmail.erro };
    }

    const emailLimpo = email.trim().toLowerCase();

    // Verifica se já existe usuário cadastrado
    const checkEmail = await dbQuery(
      'SELECT id FROM usuarios WHERE LOWER(email) = LOWER($1)',
      [emailLimpo]
    );

    if (checkEmail.rows.length > 0) {
      return { success: false, error: 'Este e-mail já está cadastrado no sistema.' };
    }

    // Gera um código de 6 dígitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expiraEm = Date.now() + 10 * 60 * 1000; // 10 minutos de validade

    codigosVerificacao.set(emailLimpo, { codigo, expiraEm });

    const transporter = criarTransporterNodemailer();

    if (!transporter) {
      console.log(`\n======================================================`);
      console.log(`🔑 CÓDIGO DE VERIFICAÇÃO GERADO PARA [${emailLimpo}]: ${codigo}`);
      console.log(`======================================================\n`);
      return {
        success: false,
        error: 'Servidor de e-mail (SMTP) não configurado no arquivo .env.',
      };
    }

    try {
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || `"Gestor de Orçamento" <${process.env.SMTP_USER}>`,
        to: emailLimpo,
        subject: `🔑 Seu Código de Verificação: ${codigo}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background-color: #2b2b2b; color: #ffffff; border-radius: 16px; border: 1px solid #ffe192;">
            <h2 style="color: #ffe192; text-align: center; margin-bottom: 20px;">Gestor de Orçamento</h2>
            <p style="font-size: 15px; line-height: 1.5; color: #e0e0e0;">Olá, <strong>${nome || 'Usuário'}</strong>!</p>
            <p style="font-size: 14px; line-height: 1.5; color: #cccccc;">Utilize o código de verificação abaixo para concluir a criação da sua conta no aplicativo:</p>
            <div style="background-color: #3e3e3e; padding: 18px; text-align: center; border-radius: 12px; margin: 24px 0; border: 1px dashed #ffe192;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #ffe192;">${codigo}</span>
            </div>
            <p style="font-size: 12px; color: #aaaaaa; text-align: center;">Este código é válido por 10 minutos.</p>
          </div>
        `,
      });
      console.log('E-mail de verificação enviado com sucesso:', info.messageId);
      return { success: true, message: `Código de verificação enviado para ${emailLimpo} com sucesso! Verifique a caixa de entrada.` };
    } catch (smtpErr) {
      console.error('⚠️ Falha na autenticação SMTP ao enviar e-mail:', smtpErr.message);
      return {
        success: false,
        error: `Não foi possível enviar o e-mail real (${smtpErr.message}). Verifique a Senha de App do Gmail no arquivo .env.`,
      };
    }
  } catch (err) {
    console.error('Erro ao enviar código de verificação:', err);
    return { success: false, error: 'Falha ao processar envio do código de verificação.' };
  }
});

ipcMain.handle('validar-codigo-verificacao', async (event, { email, codigo }) => {
  if (!email || !codigo) {
    return { success: false, error: 'Informe o código de verificação de 6 dígitos.' };
  }

  const emailLimpo = email.trim().toLowerCase();
  const registro = codigosVerificacao.get(emailLimpo);

  if (!registro) {
    return { success: false, error: 'Nenhum código foi solicitado para este e-mail ou o código expirou.' };
  }

  if (Date.now() > registro.expiraEm) {
    codigosVerificacao.delete(emailLimpo);
    return { success: false, error: 'O código de verificação expirou. Solicite um novo código.' };
  }

  if (registro.codigo !== codigo.trim()) {
    return { success: false, error: 'Código de verificação incorreto. Verifique os 6 dígitos digitados.' };
  }

  // Código validado com sucesso
  codigosVerificacao.delete(emailLimpo);
  return { success: true };
});

ipcMain.handle('solicitar-recuperacao-senha', async (event, { email }) => {
  try {
    if (!email) return { success: false, error: 'Informe seu e-mail cadastrado.' };

    const emailLimpo = email.trim().toLowerCase();
    const checkUser = await dbQuery('SELECT id, nome FROM usuarios WHERE LOWER(email) = LOWER($1)', [emailLimpo]);

    if (checkUser.rows.length === 0) {
      return { success: false, error: 'E-mail não encontrado no sistema.' };
    }

    const usuario = checkUser.rows[0];
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expiraEm = Date.now() + 10 * 60 * 1000;

    codigosVerificacao.set(`reset_${emailLimpo}`, { codigo, expiraEm });

    const transporter = criarTransporterNodemailer();

    if (!transporter) {
      console.log(`\n======================================================`);
      console.log(`🔑 CÓDIGO DE RECUPERAÇÃO DE SENHA PARA [${emailLimpo}]: ${codigo}`);
      console.log(`======================================================\n`);
      return {
        success: false,
        error: 'Serviço de e-mail temporariamente indisponível. Utilize o código de teste gerado no terminal do sistema.',
        codigoConsole: codigo
      };
    }

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'gestororc@gmail.com',
        to: emailLimpo,
        subject: 'Código de Recuperação de Senha - Gestor de Orçamento',
        text: `Olá ${usuario.nome},\n\nSeu código de verificação para redefinir sua senha é: ${codigo}\n\nEste código expira em 10 minutos.`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #ffe192;">Recuperação de Senha</h2>
            <p>Olá <strong>${usuario.nome}</strong>,</p>
            <p>Você solicitou a redefinição da sua senha. Utilize o código abaixo para prosseguir:</p>
            <div style="background-color: #2b2b2b; color: #ffe192; font-size: 28px; font-weight: bold; text-align: center; padding: 15px; border-radius: 8px; margin: 20px 0; letter-spacing: 5px;">
              ${codigo}
            </div>
            <p>Este código expira em 10 minutos. Se você não solicitou a redefinição, ignore este e-mail.</p>
          </div>
        `
      });

      return { success: true, message: 'Código de recuperação enviado para o seu e-mail!' };
    } catch (errEmail) {
      console.error('Erro ao enviar e-mail via SMTP:', errEmail);
      return {
        success: false,
        error: 'Falha ao enviar e-mail. Utilize o código de emergência exibido no terminal.',
        codigoConsole: codigo
      };
    }
  } catch (err) {
    console.error('Erro em solicitar-recuperacao-senha:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('confirmar-recuperacao-senha', async (event, { email, codigo, novaSenha }) => {
  try {
    if (!email || !codigo || !novaSenha) {
      return { success: false, error: 'Todos os campos são obrigatórios.' };
    }

    const emailLimpo = email.trim().toLowerCase();
    const dadosVerificacao = codigosVerificacao.get(`reset_${emailLimpo}`);

    if (!dadosVerificacao) {
      return { success: false, error: 'Nenhum código foi solicitado para este e-mail ou o código expirou.' };
    }

    if (Date.now() > dadosVerificacao.expiraEm) {
      codigosVerificacao.delete(`reset_${emailLimpo}`);
      return { success: false, error: 'O código de verificação expirou. Solicite um novo.' };
    }

    if (dadosVerificacao.codigo !== codigo.trim()) {
      return { success: false, error: 'Código de verificação incorreto.' };
    }

    const { hashSenha: novaSenhaHash } = hashSenha(novaSenha);

    await dbQuery('UPDATE usuarios SET senha_hash = $1 WHERE LOWER(email) = LOWER($2)', [novaSenhaHash, emailLimpo]);
    codigosVerificacao.delete(`reset_${emailLimpo}`);

    return { success: true, message: 'Senha redefinida com sucesso!' };
  } catch (err) {
    console.error('Erro em confirmar-recuperacao-senha:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('registrar-usuario', async (event, { nome, email, senha, perfilUso = 'individual' }) => {
  try {
    const checagemEmail = await validarExistenciaEmailBackend(email);
    if (!checagemEmail.valido) {
      return { success: false, error: checagemEmail.erro };
    }

    const checkEmail = await dbQuery(
      'SELECT id FROM usuarios WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );

    if (checkEmail.rows.length > 0) {
      return { success: false, error: 'Este e-mail já está cadastrado.' };
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const { hashSenha: senhaCriptografada } = hashSenha(senha);
    const perfilFinal = perfilUso === 'comercial' ? 'comercial' : 'individual';

    await dbQuery(
      'INSERT INTO usuarios (id, nome, email, senha_hash, perfil_uso) VALUES ($1, $2, $3, $4, $5)',
      [userId, nome.trim(), email.toLowerCase().trim(), senhaCriptografada, perfilFinal]
    );

    const nomeContaInicial = perfilFinal === 'comercial' ? 'Conta Comercial' : 'Conta Pessoal';
    const resConta = await dbQuery(
      'INSERT INTO contas (usuario_id, nome, tipo, descricao, cor) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, nomeContaInicial, perfilFinal, 'Conta inicial padrão', '#ffe192']
    );

    const catPadrao = getCategoriasPadrao(perfilFinal);
    for (const cat of catPadrao) {
      await dbQuery(
        'INSERT INTO categorias (usuario_id, nome, cor) VALUES ($1, $2, $3)',
        [userId, cat.nome, cat.cor]
      );
    }

    for (const etiq of ETIQUETAS_PADRAO) {
      await dbQuery(
        'INSERT INTO etiquetas (usuario_id, nome) VALUES ($1, $2)',
        [userId, etiq]
      );
    }

    const ehAdminOwner = email.toLowerCase().trim() === 'emanuell.carvalho.pires@gmail.com';
    const funcaoFinal = ehAdminOwner ? 'admin' : 'comum';

    return {
      success: true,
      user: {
        id: userId,
        nome: nome.trim(),
        email: email.toLowerCase().trim(),
        perfilUso: perfilFinal,
        avatarUrl: '',
        funcao: funcaoFinal,
      },
      contaInicial: resConta.rows[0],
    };
  } catch (err) {
    console.error('Erro em registrar-usuario:', err);
    return { success: false, error: err.message };
  }
});

// Rate Limiting para Login (Proteção contra Força Bruta)
const tentativasLoginMap = new Map();

ipcMain.handle('login-usuario', async (event, { email, senha }) => {
  try {
    if (!email || !senha) {
      return { success: false, error: 'E-mail e senha são obrigatórios.' };
    }

    const emailLimpo = email.trim().toLowerCase();
    const agora = Date.now();
    const tentativas = tentativasLoginMap.get(emailLimpo) || { count: 0, bloqueadoAte: 0 };

    if (tentativas.bloqueadoAte > agora) {
      const minutosRestantes = Math.ceil((tentativas.bloqueadoAte - agora) / (60 * 1000));
      return {
        success: false,
        error: `Muitas tentativas falhas de login. Conta bloqueada temporariamente por mais ${minutosRestantes} minuto(s).`,
      };
    }

    const result = await dbQuery(
      'SELECT id, nome, email, senha_hash, perfil_uso, avatar_url, funcao FROM usuarios WHERE LOWER(email) = LOWER($1)',
      [emailLimpo]
    );

    if (result.rows.length === 0) {
      tentativas.count += 1;
      if (tentativas.count >= 5) {
        tentativas.bloqueadoAte = agora + 15 * 60 * 1000;
      }
      tentativasLoginMap.set(emailLimpo, tentativas);
      return { success: false, error: 'E-mail não cadastrado.' };
    }

    const usuario = result.rows[0];
    const senhaValida = verificarSenha(senha, usuario.senha_hash);

    if (!senhaValida) {
      tentativas.count += 1;
      if (tentativas.count >= 5) {
        tentativas.bloqueadoAte = agora + 15 * 60 * 1000;
      }
      tentativasLoginMap.set(emailLimpo, tentativas);
      return { success: false, error: 'Senha incorreta.' };
    }

    // Sucesso - reseta contador de tentativas
    tentativasLoginMap.delete(emailLimpo);

    const ehAdminOwner = usuario.email.toLowerCase() === 'emanuell.carvalho.pires@gmail.com';
    const funcaoFinal = usuario.funcao || (ehAdminOwner ? 'admin' : 'comum');

    return {
      success: true,
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfilUso: usuario.perfil_uso || 'individual',
        avatarUrl: usuario.avatar_url || '',
        funcao: funcaoFinal,
      },
    };
  } catch (error) {
    console.error('Erro no login:', error);
    return { success: false, error: 'Erro ao realizar login.' };
  }
});

// Helper para OAuth 2.0 Real do Google via Navegador Web
async function realizarOAuth2Google(clientId, clientSecret) {
  return new Promise((resolve, reject) => {
    const port = 42813;
    const redirectUri = `http://127.0.0.1:${port}/callback`;

    // Prompt select_account força o Google a sempre exibir a página web para selecionar a conta
    const authUrl = clientId
      ? `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&prompt=select_account`
      : `https://accounts.google.com/`;

    let resolved = false;

    const server = http.createServer(async (req, res) => {
      try {
        const reqUrl = new URL(req.url, `http://127.0.0.1:${port}`);
        const code = reqUrl.searchParams.get('code');
        const userEmail = reqUrl.searchParams.get('email');

        if (code && clientId && clientSecret) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`
            <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f4f6f8; height: 100vh; box-sizing: border-box;">
              <div style="background: white; max-width: 460px; margin: 0 auto; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                <h2 style="color: #276749; margin-bottom: 10px;">✅ Autenticado com o Google!</h2>
                <p style="color: #4a5568; font-size: 15px; line-height: 1.6;">Sua conta foi vinculada com sucesso. Você já pode fechar esta aba e retornar ao <strong>Gestor de Orçamento</strong>.</p>
              </div>
            </div>
          `);
          if (!resolved) {
            resolved = true;
            server.close();

            const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
              }),
            });
            const tokenData = await tokenRes.json();

            if (!tokenData.access_token) {
              const msgErro = tokenData.error_description || tokenData.error || 'Falha ao trocar código de autorização por token do Google.';
              registrarLogInstalacao(`❌ Google OAuth Token Error: ${JSON.stringify(tokenData)}`);
              console.error('⚠️ Google Token Error:', tokenData);
              return resolve({ error: `Erro na API do Google: ${msgErro}` });
            }

            const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenData.access_token}` },
            });
            const profileData = await profileRes.json();
            resolve(profileData);
          }
        } else if (userEmail) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`
            <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f4f6f8; height: 100vh; box-sizing: border-box;">
              <div style="background: white; max-width: 460px; margin: 0 auto; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                <h2 style="color: #276749; margin-bottom: 10px;">✅ Conta selecionada com sucesso!</h2>
                <p style="color: #4a5568; font-size: 15px; line-height: 1.6;">Retorne ao <strong>Gestor de Orçamento</strong> para acessar suas finanças.</p>
              </div>
            </div>
          `);
          if (!resolved) {
            resolved = true;
            server.close();
            resolve({
              sub: `google_${Date.now()}`,
              name: userEmail.split('@')[0],
              email: userEmail,
              picture: '',
            });
          }
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`
            <div style="font-family: Arial, sans-serif; padding: 40px; text-align: center; background-color: #f4f6f8; height: 100vh; box-sizing: border-box;">
              <div style="background: white; max-width: 460px; margin: 0 auto; padding: 32px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                <h2 style="color: #2d3748; margin-bottom: 12px;">Login Google - Gestor de Orçamento</h2>
                <p style="color: #718096; font-size: 14px; margin-bottom: 24px;">Confirme o seu e-mail cadastrado no Google para concluir o login no aplicativo:</p>
                <form action="/callback" method="GET" style="display: flex; flex-direction: column; gap: 14px;">
                  <input type="email" name="email" placeholder="seuemail@gmail.com" required style="padding: 12px 14px; font-size: 14px; border-radius: 8px; border: 1px solid #cbd5e0; outline: none;" />
                  <button type="submit" style="padding: 12px 20px; font-size: 14px; background-color: #4285F4; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: background 0.2s;">Confirmar Login do Google</button>
                </form>
              </div>
            </div>
          `);
        }
      } catch (err) {
        if (!resolved) {
          resolved = true;
          server.close();
          reject(err);
        }
      }
    });

    server.listen(port, () => {
      // Abre a página oficial do Google no navegador padrão
      shell.openExternal(authUrl);

      if (!clientId) {
        // Redireciona para o receptor local após abrir a página do Google
        setTimeout(() => {
          shell.openExternal(`http://127.0.0.1:${port}/callback`);
        }, 2000);
      }
    });

    server.on('error', (err) => {
      console.error('Erro no servidor callback do Google:', err);
      if (!resolved) {
        resolved = true;
        resolve({ error: `Erro no servidor local de callback: ${err.message}` });
      }
    });

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        server.close();
        resolve({ error: 'Tempo limite excedido aguardando resposta do Google (2 minutos).' });
      }
    }, 120000);
  });
}

// IPC Handler do Login via Google
ipcMain.handle('login-google', async (event, { perfilUso = 'individual' } = {}) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID || '1023898773119-lpvurepidkav2h4s4opgpqvsjkj26j3d.apps.googleusercontent.com';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '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';

    const googleProfile = await realizarOAuth2Google(clientId, clientSecret);

    if (!googleProfile) {
      return { success: false, error: 'Autenticação com o Google foi cancelada ou expirou.' };
    }

    if (googleProfile.error) {
      registrarLogInstalacao(`⚠️ Falha no Google Profile: ${googleProfile.error}`);
      return { success: false, error: googleProfile.error };
    }

    if (!googleProfile.email) {
      return { success: false, error: 'O perfil do Google não retornou um endereço de e-mail válido.' };
    }

    const emailLimpo = googleProfile.email.toLowerCase().trim();
    const googleId = googleProfile.sub || googleProfile.id || `google_${Date.now()}`;
    const avatarUrl = googleProfile.picture || googleProfile.avatar_url || '';
    const nomeUsuario = googleProfile.name || googleProfile.nome || emailLimpo.split('@')[0];

    // Verificar se usuário já existe no PostgreSQL
    let userQuery = await dbQuery(
      'SELECT * FROM usuarios WHERE google_id = $1 OR LOWER(email) = $2',
      [googleId, emailLimpo]
    );

    let userId;
    let perfilFinal = perfilUso === 'comercial' ? 'comercial' : 'individual';

    const ehAdminOwner = emailLimpo === 'emanuell.carvalho.pires@gmail.com';

    if (userQuery.rows.length > 0) {
      const u = userQuery.rows[0];
      userId = u.id;
      perfilFinal = u.perfil_uso || 'individual';
      const funcaoFinal = ehAdminOwner ? 'admin' : (u.funcao || 'comum');

      await dbQuery(
        'UPDATE usuarios SET google_id = $1, avatar_url = COALESCE($2, avatar_url), provedor = \'google\', funcao = $3 WHERE id = $4',
        [googleId, avatarUrl || null, funcaoFinal, userId]
      );
    } else {
      userId = `usr_g_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const funcaoInicial = ehAdminOwner ? 'admin' : 'comum';
      await dbQuery(
        'INSERT INTO usuarios (id, nome, email, senha_hash, perfil_uso, avatar_url, google_id, provedor, funcao) VALUES ($1, $2, $3, NULL, $4, $5, $6, \'google\', $7)',
        [userId, nomeUsuario, emailLimpo, perfilFinal, avatarUrl, googleId, funcaoInicial]
      );

      const nomeConta = perfilFinal === 'comercial' ? 'Conta Comercial' : 'Conta Pessoal';
      await dbQuery(
        'INSERT INTO contas (usuario_id, nome, tipo, descricao, cor) VALUES ($1, $2, $3, $4, $5)',
        [userId, nomeConta, perfilFinal, 'Conta inicial Google', '#ffe192']
      );

      const catPadrao = getCategoriasPadrao(perfilFinal);
      for (const cat of catPadrao) {
        await dbQuery(
          'INSERT INTO categorias (usuario_id, nome, cor) VALUES ($1, $2, $3)',
          [userId, cat.nome, cat.cor]
        );
      }

      for (const etiq of ETIQUETAS_PADRAO) {
        await dbQuery(
          'INSERT INTO etiquetas (usuario_id, nome) VALUES ($1, $2)',
          [userId, etiq]
        );
      }
    }

    const contasRes = await dbQuery(
      'SELECT * FROM contas WHERE usuario_id = $1 ORDER BY id ASC LIMIT 1',
      [userId]
    );

    const userRes = await dbQuery('SELECT funcao FROM usuarios WHERE id = $1', [userId]);
    const funcaoFinal = ehAdminOwner ? 'admin' : (userRes.rows[0]?.funcao || 'comum');

    return {
      success: true,
      user: {
        id: userId,
        nome: nomeUsuario,
        email: emailLimpo,
        perfilUso: perfilFinal,
        avatarUrl,
        funcao: funcaoFinal,
      },
      contaInicial: contasRes.rows[0],
    };
  } catch (error) {
    registrarLogInstalacao('❌ Erro no handler login-google:', error);
    console.error('Erro no login do Google:', error);
    return { success: false, error: `Erro no login com o Google: ${error.message || error}` };
  }
});

// --- ADMIN IPC HANDLERS ---

ipcMain.handle('listar-usuarios-admin', async (event, { usuarioId }) => {
  try {
    if (!usuarioId) return { success: false, error: 'Sessão inválida.' };

    const checkAdmin = await pool.query('SELECT email, funcao FROM usuarios WHERE id = $1', [usuarioId]);
    if (checkAdmin.rows.length === 0) return { success: false, error: 'Usuário não encontrado.' };

    const requestingUser = checkAdmin.rows[0];
    const isEmailAdmin = requestingUser.email.toLowerCase() === 'emanuell.carvalho.pires@gmail.com';
    const isRoleAdmin = requestingUser.funcao === 'admin';

    if (!isEmailAdmin && !isRoleAdmin) {
      return { success: false, error: 'Acesso negado. Apenas o Administrador pode listar usuários.' };
    }

    const res = await pool.query(
      'SELECT id, nome, email, funcao, perfil_uso, provedor, criado_em FROM usuarios ORDER BY criado_em DESC'
    );

    const usuariosFormatados = res.rows.map((u) => ({
      ...u,
      funcao: u.funcao || (u.email.toLowerCase() === 'emanuell.carvalho.pires@gmail.com' ? 'admin' : 'comum'),
    }));

    return { success: true, usuarios: usuariosFormatados };
  } catch (err) {
    console.error('Erro ao listar usuários:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('deletar-usuario-admin', async (event, { targetUserId, usuarioId }) => {
  try {
    if (!usuarioId || !targetUserId) return { success: false, error: 'Parâmetros inválidos.' };

    const checkAdmin = await pool.query('SELECT email, funcao FROM usuarios WHERE id = $1', [usuarioId]);
    if (checkAdmin.rows.length === 0) return { success: false, error: 'Usuário administrador não encontrado.' };

    const requestingUser = checkAdmin.rows[0];
    const isEmailAdmin = requestingUser.email.toLowerCase() === 'emanuell.carvalho.pires@gmail.com';
    const isRoleAdmin = requestingUser.funcao === 'admin';

    if (!isEmailAdmin && !isRoleAdmin) {
      return { success: false, error: 'Acesso negado. Apenas o Administrador pode excluir usuários.' };
    }

    if (targetUserId === usuarioId) {
      return { success: false, error: 'Você não pode excluir sua própria conta de Administrador.' };
    }

    await pool.query('DELETE FROM usuarios WHERE id = $1', [targetUserId]);

    return { success: true };
  } catch (err) {
    console.error('Erro ao deletar usuário pelo Admin:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('excluir-conta-usuario', async (event, { usuarioId, confirmacaoText }) => {
  try {
    if (!usuarioId) return { success: false, error: 'Usuário não identificado.' };
    if ((confirmacaoText || '').trim().toUpperCase() !== 'EXCLUIR') {
      return { success: false, error: 'Texto de confirmação incorreto. Digite EXCLUIR para confirmar.' };
    }

    // Exclusão em cascata de todas as entidades associadas ao usuário
    await pool.query('DELETE FROM receitas WHERE usuario_id = $1', [usuarioId]);
    await pool.query('DELETE FROM despesas WHERE usuario_id = $1', [usuarioId]);
    await pool.query('DELETE FROM categorias WHERE usuario_id = $1', [usuarioId]);
    await pool.query('DELETE FROM etiquetas WHERE usuario_id = $1', [usuarioId]);
    await pool.query('DELETE FROM contas WHERE usuario_id = $1', [usuarioId]);

    try {
      await pool.query('DELETE FROM caixinha WHERE usuario_id = $1', [usuarioId]);
    } catch {}

    await pool.query('DELETE FROM usuarios WHERE id = $1', [usuarioId]);

    return { success: true };
  } catch (err) {
    console.error('Erro ao excluir conta de usuário por completo:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('alterar-funcao-usuario-admin', async (event, { targetUserId, novaFuncao, usuarioId }) => {
  try {
    if (!usuarioId || !targetUserId || !novaFuncao) return { success: false, error: 'Parâmetros inválidos.' };

    const checkAdmin = await pool.query('SELECT email, funcao FROM usuarios WHERE id = $1', [usuarioId]);
    if (checkAdmin.rows.length === 0) return { success: false, error: 'Usuário administrador não encontrado.' };

    const requestingUser = checkAdmin.rows[0];
    const isEmailAdmin = requestingUser.email.toLowerCase() === 'emanuell.carvalho.pires@gmail.com';
    const isRoleAdmin = requestingUser.funcao === 'admin';

    if (!isEmailAdmin && !isRoleAdmin) {
      return { success: false, error: 'Acesso negado.' };
    }

    await pool.query('UPDATE usuarios SET funcao = $1 WHERE id = $2', [novaFuncao, targetUserId]);

    return { success: true };
  } catch (err) {
    console.error('Erro ao alterar função do usuário:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('obter-perfil-usuario', async (event, { usuarioId }) => {
  if (!usuarioId) return { success: false, error: 'ID do usuário não fornecido.' };
  try {
    const res = await pool.query(
      'SELECT id, nome, email, funcao, perfil_uso, avatar_url, provedor FROM usuarios WHERE id = $1',
      [usuarioId]
    );

    if (res.rows.length === 0) return { success: false, error: 'Usuário não encontrado.' };

    const u = res.rows[0];
    const ehAdminOwner = u.email.toLowerCase() === 'emanuell.carvalho.pires@gmail.com';
    const funcaoFinal = u.funcao || (ehAdminOwner ? 'admin' : 'comum');

    return {
      success: true,
      user: {
        id: u.id,
        nome: u.nome,
        email: u.email,
        perfilUso: u.perfil_uso || 'individual',
        avatarUrl: u.avatar_url || '',
        provedor: u.provedor || 'local',
        funcao: funcaoFinal,
      },
    };
  } catch (err) {
    console.error('Erro em obter-perfil-usuario:', err);
    return { success: false, error: err.message };
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

ipcMain.handle('salvar-configuracao-caixinha', async (event, { contaId, caixinhaAtiva, caixinhaSaldoInicial }) => {
  if (!contaId) return { success: false, error: 'ID da conta não informado' };
  try {
    const fields = [];
    const values = [];
    let idx = 1;

    if (typeof caixinhaAtiva === 'boolean') {
      fields.push(`caixinha_ativa = $${idx++}`);
      values.push(caixinhaAtiva);
    }

    if (caixinhaSaldoInicial !== undefined && caixinhaSaldoInicial !== null) {
      fields.push(`caixinha_saldo_inicial = $${idx++}`);
      values.push(parseFloat(caixinhaSaldoInicial) || 0);
    }

    if (fields.length > 0) {
      values.push(contaId);
      await pool.query(
        `UPDATE contas SET ${fields.join(', ')} WHERE id = $${idx}`,
        values
      );
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao salvar configuração da caixinha no banco:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('salvar-paleta-cores', async (event, { contaId, paletaCores }) => {
  if (!contaId) return { success: false, error: 'ID da conta não informado' };
  try {
    const paletaJson = typeof paletaCores === 'string' ? paletaCores : JSON.stringify(paletaCores);
    await pool.query('UPDATE contas SET paleta_cores = $1 WHERE id = $2', [paletaJson, contaId]);
    return { success: true };
  } catch (error) {
    console.error('Erro ao salvar paleta de cores no banco:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('carregar-paleta-cores', async (event, { contaId }) => {
  if (!contaId) return { success: false, error: 'ID da conta não informado' };
  try {
    const result = await pool.query('SELECT paleta_cores FROM contas WHERE id = $1', [contaId]);
    if (result.rows.length > 0 && result.rows[0].paleta_cores) {
      return { success: true, paletaCores: result.rows[0].paleta_cores };
    }
    return { success: true, paletaCores: null };
  } catch (error) {
    console.error('Erro ao carregar paleta de cores do banco:', error);
    return { success: false, error: error.message };
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
      'SELECT nome FROM etiquetas WHERE usuario_id = $1 ORDER BY ordem ASC, id ASC',
      [usuarioId]
    );

    if (!result.rows || result.rows.length === 0) {
      let idx = 0;
      for (const etiq of ETIQUETAS_PADRAO) {
        await pool.query(
          'INSERT INTO etiquetas (usuario_id, nome, ordem) VALUES ($1, $2, $3)',
          [usuarioId, etiq, idx++]
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

ipcMain.handle('deletar-etiqueta', async (event, { usuarioId, nome }) => {
  if (!usuarioId || !nome) return { success: false };
  try {
    await pool.query(
      'DELETE FROM etiquetas WHERE usuario_id = $1 AND LOWER(TRIM(nome)) = LOWER(TRIM($2))',
      [usuarioId, nome]
    );
    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar etiqueta:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('reordenar-etiquetas', async (event, { usuarioId, ordemEtiquetas }) => {
  if (!usuarioId || !Array.isArray(ordemEtiquetas)) return { success: false };
  try {
    for (let i = 0; i < ordemEtiquetas.length; i++) {
      const etiqNome = ordemEtiquetas[i];
      await pool.query(
        'UPDATE etiquetas SET ordem = $1 WHERE LOWER(TRIM(nome)) = LOWER(TRIM($2)) AND usuario_id = $3',
        [i, etiqNome, usuarioId]
      );
    }
    return { success: true };
  } catch (error) {
    console.error('Erro ao reordenar etiquetas:', error);
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
      'SELECT * FROM categorias WHERE usuario_id = $1 ORDER BY ordem ASC, id ASC',
      [usuarioId]
    );

    if (result.rows.length === 0) {
      let idx = 0;
      for (const cat of catPadrao) {
        await pool.query(
          'INSERT INTO categorias (usuario_id, nome, cor, ordem) VALUES ($1, $2, $3, $4)',
          [usuarioId, cat.nome, cat.cor, idx++]
        );
      }
      const newResult = await pool.query(
        'SELECT * FROM categorias WHERE usuario_id = $1 ORDER BY ordem ASC, id ASC',
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
    const maxOrd = await pool.query('SELECT COALESCE(MAX(ordem), 0) as max_ord FROM categorias WHERE usuario_id = $1', [usuarioId]);
    const proxOrdem = (parseInt(maxOrd.rows[0]?.max_ord, 10) || 0) + 1;

    await pool.query(
      'INSERT INTO categorias (usuario_id, nome, cor, ordem) VALUES ($1, $2, $3, $4)',
      [usuarioId, nome.trim(), cor || '#ffe192', proxOrdem]
    );
    return { success: true };
  } catch (error) {
    console.error('Erro ao adicionar categoria:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('reordenar-categorias', async (event, { usuarioId, ordemIds }) => {
  if (!usuarioId || !Array.isArray(ordemIds)) return { success: false };
  try {
    for (let i = 0; i < ordemIds.length; i++) {
      await pool.query(
        'UPDATE categorias SET ordem = $1 WHERE id = $2 AND usuario_id = $3',
        [i, ordemIds[i], usuarioId]
      );
    }
    return { success: true };
  } catch (error) {
    console.error('Erro ao reordenar categorias:', error);
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
    const filtrarAno = ano && ano !== 'Todos';
    const filtrarConta = !!contaId;

    let sqlReceitas = 'SELECT * FROM receitas WHERE usuario_id = $1';
    let sqlDespesas = 'SELECT * FROM despesas WHERE usuario_id = $1';
    const args = [usuarioId];

    let paramIndex = 2;
    if (filtrarAno) {
      sqlReceitas += ` AND ano = $${paramIndex}`;
      sqlDespesas += ` AND ano = $${paramIndex}`;
      args.push(ano);
      paramIndex++;
    }

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

const MESES_LISTA_ORDEM = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function isMesAnteriorAoAtual(mesStr, anoStr) {
  const agora = new Date();
  const anoAtual = agora.getFullYear();
  const mesAtualIndex = agora.getMonth(); // 0 para Jan, 7 para Ago

  const anoInt = parseInt(anoStr, 10);
  const mesIndex = MESES_LISTA_ORDEM.indexOf(mesStr);

  if (isNaN(anoInt) || mesIndex === -1) return false;

  if (anoInt < anoAtual) return true;
  if (anoInt === anoAtual && mesIndex < mesAtualIndex) return true;
  return false;
}

ipcMain.handle('obter-total-caixinha', async (event, { usuarioId, contaId }) => {
  if (!usuarioId) return { totalReceitas: 0, totalDespesas: 0, saldoAcumulado: 0 };

  try {
    const filtrarConta = !!contaId;
    let sqlReceitas = 'SELECT mes, ano, valor FROM receitas WHERE usuario_id = $1';
    let sqlDespesas = 'SELECT mes, ano, valor FROM despesas WHERE usuario_id = $1';
    const args = [usuarioId];

    if (filtrarConta) {
      sqlReceitas += ' AND (conta_id = $2 OR conta_id IS NULL)';
      sqlDespesas += ' AND (conta_id = $2 OR conta_id IS NULL)';
      args.push(contaId);
    }

    const [resReceitas, resDespesas] = await Promise.all([
      pool.query(sqlReceitas, args),
      pool.query(sqlDespesas, args),
    ]);

    let totalReceitas = 0;
    let totalDespesas = 0;

    (resReceitas.rows || []).forEach((row) => {
      if (isMesAnteriorAoAtual(row.mes, row.ano)) {
        totalReceitas += parseFloat(row.valor || 0);
      }
    });

    (resDespesas.rows || []).forEach((row) => {
      if (isMesAnteriorAoAtual(row.mes, row.ano)) {
        totalDespesas += parseFloat(row.valor || 0);
      }
    });

    const saldoAcumulado = totalReceitas - totalDespesas;

    return { totalReceitas, totalDespesas, saldoAcumulado };
  } catch (error) {
    console.error('Erro ao obter total da caixinha:', error);
    return { totalReceitas: 0, totalDespesas: 0, saldoAcumulado: 0 };
  }
});

ipcMain.handle('obter-historico-caixinha', async (event, { usuarioId, contaId }) => {
  if (!usuarioId) return { success: false, historico: [] };

  try {
    const filtrarConta = !!contaId;
    let sqlRec = 'SELECT mes, ano, SUM(valor) AS total_receitas FROM receitas WHERE usuario_id = $1';
    let sqlDesp = 'SELECT mes, ano, SUM(valor) AS total_despesas FROM despesas WHERE usuario_id = $1';
    const args = [usuarioId];

    if (filtrarConta) {
      sqlRec += ' AND (conta_id = $2 OR conta_id IS NULL)';
      sqlDesp += ' AND (conta_id = $2 OR conta_id IS NULL)';
      args.push(contaId);
    }

    sqlRec += ' GROUP BY ano, mes';
    sqlDesp += ' GROUP BY ano, mes';

    const [resRec, resDesp] = await Promise.all([
      pool.query(sqlRec, args),
      pool.query(sqlDesp, args),
    ]);

    const mapa = {};

    (resRec.rows || []).forEach((row) => {
      const key = `${row.ano}-${row.mes}`;
      if (!mapa[key]) {
        mapa[key] = {
          ano: row.ano,
          mes: row.mes,
          receitas: 0,
          despesas: 0,
          isFechada: isMesAnteriorAoAtual(row.mes, row.ano),
        };
      }
      mapa[key].receitas = parseFloat(row.total_receitas || 0);
    });

    (resDesp.rows || []).forEach((row) => {
      const key = `${row.ano}-${row.mes}`;
      if (!mapa[key]) {
        mapa[key] = {
          ano: row.ano,
          mes: row.mes,
          receitas: 0,
          despesas: 0,
          isFechada: isMesAnteriorAoAtual(row.mes, row.ano),
        };
      }
      mapa[key].despesas = parseFloat(row.total_despesas || 0);
    });

    const lista = Object.values(mapa).sort((a, b) => {
      if (a.ano !== b.ano) return parseInt(a.ano, 10) - parseInt(b.ano, 10);
      return MESES_LISTA_ORDEM.indexOf(a.mes) - MESES_LISTA_ORDEM.indexOf(b.mes);
    });

    return { success: true, historico: lista };
  } catch (error) {
    console.error('Erro ao obter histórico da caixinha:', error);
    return { success: false, historico: [] };
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
      const mesOrigem = novaTransacao.mes || mesesList[dataFinal.getMonth()];
      const mesInicioIndex = mesesList.indexOf(mesOrigem) !== -1 ? mesesList.indexOf(mesOrigem) : dataFinal.getMonth();
      const mesFimIndex = novaTransacao.mesFimRecorrencia ? mesesList.indexOf(novaTransacao.mesFimRecorrencia) : 11;
      const limiteMes = mesFimIndex !== -1 ? mesFimIndex : 11;
      const anoFim = novaTransacao.anoFimRecorrencia ? parseInt(novaTransacao.anoFimRecorrencia, 10) : anoInicio;

      const diaOriginal = dataFinal.getDate();
      const horaOriginal = dataFinal.getHours();
      const minOriginal = dataFinal.getMinutes();

      let m = mesInicioIndex;
      let anoAtualLoop = anoInicio;

      while (true) {
        const mesCalculado = mesesList[m];
        const dtDoMes = new Date(anoAtualLoop, m, diaOriginal, horaOriginal, minOriginal);

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
            anoAtualLoop.toString(),
            dtDoMes,
          ]
        );

        if (anoAtualLoop === anoFim && m === limiteMes) break;
        if (anoAtualLoop > anoFim) break;

        m++;
        if (m > 11) {
          m = 0;
          anoAtualLoop++;
        }
      }
      return { success: true, mesCalculado: mesOrigem, anoCalculado: anoOrigem };
    }

    const parcelaAtual = parseInt(novaTransacao.parcelaAtual || '1', 10);
    const totalParcelas = parseInt(novaTransacao.totalParcelas || '1', 10);

    const valorPorParcela = (!isReceita && totalParcelas > 1 && valorInserido > 0)
      ? Number((valorInserido / totalParcelas).toFixed(2))
      : valorInserido;

    if (totalParcelas > 1 && totalParcelas >= parcelaAtual) {
      const diaOriginal = dataFinal.getDate();
      const horaOriginal = dataFinal.getHours();
      const minOriginal = dataFinal.getMinutes();

      for (let k = parcelaAtual; k <= totalParcelas; k++) {
        const offset = k - parcelaAtual;
        const totalMeses = mesInicioIndex + offset;
        const mesIndex = totalMeses % 12;
        const anosAdicionais = Math.floor(totalMeses / 12);

        const mesCalculado = mesesList[mesIndex];
        const anoCalculado = (anoInicio + anosAdicionais).toString();
        const stringParcela = `${k}/${totalParcelas}`;
        const dtDoMes = new Date(anoInicio + anosAdicionais, mesIndex, diaOriginal, horaOriginal, minOriginal);

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
            dtDoMes,
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
         SET nome = $1, valor = $2, classificacao = $3, etiqueta = $4, descricao = $5
         WHERE usuario_id = $6 AND LOWER(TRIM(nome)) = LOWER(TRIM($7))`,
        [
          nome.trim(),
          parseFloat(valor || 0),
          classificacao || 'Outros',
          etiqFinal,
          descricao || '',
          usuarioId,
          nomeBusca,
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

    return { success: true };
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

// IMPORTAR TRANSAÇÕES DO NUBANK EM LOTE (CSV)
ipcMain.handle('importar-transacoes-nubank-csv', async (event, { usuarioId, contaId, transacoes = [] }) => {
  if (!usuarioId || !Array.isArray(transacoes) || transacoes.length === 0) {
    return { success: false, error: 'Parâmetros inválidos ou lista de transações vazia.' };
  }

  const client = await pool.connect();
  let inseridosCount = 0;

  try {
    await client.query('BEGIN');

    await salvarEtiquetaSeNova(usuarioId, 'Cartão Nubank');

    for (const item of transacoes) {
      if (item.isDuplicado) continue;

      const tabela = item.tipo === 'receitas' ? 'receitas' : 'despesas';
      const valorNum = parseFloat(item.valor || 0);
      const cat = item.classificacao || 'Nubank';
      const etiq = item.etiqueta || 'Cartão Nubank';
      const dtTransacao = item.dataTransacao ? new Date(item.dataTransacao) : new Date();

      await client.query(
        `INSERT INTO ${tabela} (usuario_id, conta_id, nome, valor, classificacao, etiqueta, parcelas, eh_fixa, descricao, mes, ano, data_transacao)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, $10, $11)`,
        [
          usuarioId,
          contaId || null,
          (item.nome || item.nomeRaw || 'Transação Nubank').trim(),
          valorNum,
          cat,
          etiq,
          item.parcelas || '1/1',
          'Importado via CSV Nubank',
          item.mes,
          item.ano,
          dtTransacao,
        ]
      );
      inseridosCount++;
    }

    await client.query('COMMIT');
    return { success: true, inseridosCount };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao importar CSV do Nubank em lote:', error);
    return { success: false, error: error.message };
  } finally {
    client.release();
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

// Helper para sanitizar strings contra injecao de HTML em relatorios PDF
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// EXPORTAR RELATÓRIO EXECUTIVO EM PDF
ipcMain.handle('exportar-pdf', async (event, { receitasList = [], despesasList = [], categorias = [], mes, ano, totalReceitas = 0, totalDespesas = 0, economia = 0, usuarioNome = '' }) => {
  try {
    const defaultFilename = `Relatorio_Executivo_${escapeHtml(mes)}_${escapeHtml(ano)}.pdf`;
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
            <span>${escapeHtml(c.nome)}</span>
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
                <td><strong>${escapeHtml(r.nome)}</strong></td>
                <td>${escapeHtml(r.classificacao || 'Salário & Ganhos')}</td>
                <td><span class="badge-tag">${escapeHtml(r.etiqueta || 'Geral')}</span></td>
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
                <td><strong>${escapeHtml(d.nome)}</strong></td>
                <td>${escapeHtml(d.classificacao || 'Outros')}</td>
                <td><span class="badge-tag">${escapeHtml(d.etiqueta || 'Geral')}</span></td>
                <td>${d.eh_fixa === 1 ? 'Fixa' : escapeHtml(d.parcelas || '1/1')}</td>
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
          Documento gerado automaticamente pelo aplicativo Simple Finances • Página 1 de 1
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
  const iconCandidates = [
    path.join(process.resourcesPath || '', 'images', 'app_icon.png'),
    path.join(process.resourcesPath || '', 'images', 'app_icon.ico'),
    path.join(app.getAppPath(), 'images', 'app_icon.png'),
    path.join(app.getAppPath(), 'images', 'app_icon.ico'),
    path.join(__dirname, '..', '..', 'images', 'app_icon.png'),
    path.join(__dirname, '..', '..', 'images', 'app_icon.ico'),
    path.resolve(process.cwd(), 'images/app_icon.png'),
    path.resolve(process.cwd(), 'images/app_icon.ico'),
  ];
  let finalIcon = undefined;
  for (const candidate of iconCandidates) {
    if (fs.existsSync(candidate)) {
      finalIcon = candidate;
      break;
    }
  }

  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1280,
    minHeight: 850,
    title: 'Simple Finances',
    icon: finalIcon,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (finalIcon) {
    try {
      const img = nativeImage.createFromPath(finalIcon);
      if (!img.isEmpty()) {
        mainWindow.setIcon(img);
      }
    } catch (err) {
      console.error('Erro ao definir icone nativeImage:', err);
    }
  }

  mainWindow.setTitle('Simple Finances');
  mainWindow.setMenu(null);

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Permite abrir/fechar o DevTools com F12 ou Ctrl+Shift+I mesmo sem a barra de menu nativa
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown') {
      if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
        if (mainWindow.webContents.isDevToolsOpened()) {
          mainWindow.webContents.closeDevTools();
        } else {
          mainWindow.webContents.openDevTools();
        }
        event.preventDefault();
      }
    }
  });
};

function criarSplashWindow(finalIcon) {
  const splash = new BrowserWindow({
    width: 480,
    height: 300,
    frame: false,
    transparent: false,
    resizable: false,
    center: true,
    alwaysOnTop: true,
    icon: finalIcon,
    backgroundColor: '#1e1e1e',
    show: true,
    webPreferences: { nodeIntegration: false, contextBridge: true },
  });

  const splashHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; user-select: none; }
        body {
          background-color: #1e1e1e;
          color: #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          padding: 30px;
          border: 2px solid #333333;
          border-radius: 14px;
        }
        .logo { font-size: 26px; font-weight: bold; color: #ffe192; margin-bottom: 6px; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; }
        .sub { font-size: 13px; color: #aaaaaa; margin-bottom: 28px; }
        .bar-container { width: 100%; height: 12px; background: #2d2d2d; border-radius: 10px; overflow: hidden; position: relative; margin-bottom: 16px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.5); }
        .bar-fill { height: 100%; width: 0%; background: linear-gradient(90deg, #ffe192, #fb8500); border-radius: 10px; transition: width 0.4s ease-out; }
        .status { font-size: 12.5px; color: #ffe192; font-weight: 500; text-align: center; }
      </style>
    </head>
    <body>
      <div class="logo">📊 Simple Finances</div>
      <div class="sub">Gestão Financeira Pessoal</div>
      <div class="bar-container">
        <div id="fill" class="bar-fill"></div>
      </div>
      <div id="status" class="status">⚡ Inicializando o aplicativo...</div>

      <script>
        const fill = document.getElementById('fill');
        const status = document.getElementById('status');

        const steps = [
          { p: 25, t: '⚡ Verificando integridade dos arquivos...' },
          { p: 60, t: '🛡️ Conectando aos bancos de dados e backup...' },
          { p: 90, t: '🎨 Carregando interface do usuário...' },
          { p: 100, t: '✅ Inicialização concluída!' }
        ];

        let idx = 0;
        const interval = setInterval(() => {
          if (idx < steps.length) {
            fill.style.width = steps[idx].p + '%';
            status.textContent = steps[idx].t;
            idx++;
          } else {
            clearInterval(interval);
          }
        }, 80);
      </script>
    </body>
    </html>
  `;

  splash.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHtml)}`);
  return splash;
}

app.whenReady().then(async () => {
  const iconCandidates = [
    path.join(process.resourcesPath || '', 'images', 'app_icon.png'),
    path.join(process.resourcesPath || '', 'images', 'app_icon.ico'),
    path.join(app.getAppPath(), 'images', 'app_icon.png'),
    path.join(app.getAppPath(), 'images', 'app_icon.ico'),
    path.join(__dirname, '..', '..', 'images', 'app_icon.png'),
    path.join(__dirname, '..', '..', 'images', 'app_icon.ico'),
    path.resolve(process.cwd(), 'images/app_icon.png'),
    path.resolve(process.cwd(), 'images/app_icon.ico'),
  ];
  let finalIcon = undefined;
  for (const candidate of iconCandidates) {
    if (fs.existsSync(candidate)) {
      finalIcon = candidate;
      break;
    }
  }

  const splash = criarSplashWindow(finalIcon);

  // Garante que o túnel SSH está ativo e escutando antes de inicializar o DB
  await iniciarTunelSSHSeNecessario();

  // Inicializa DB e cria a janela principal do aplicativo
  initDatabase().catch(err => console.error('Erro no initDatabase:', err));

  createWindow();
  if (splash && !splash.isDestroyed()) {
    splash.destroy();
  }

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
}
