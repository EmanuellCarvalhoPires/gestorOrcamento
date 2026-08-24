-- ====================================================================
-- SCRIPT DE SCHEMA E TABELAS POSTGRESQL PARA GESTOR DE ORÇAMENTO
-- ETAPA 3: SEGURANÇA E REFRESH TOKENS
-- ====================================================================

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash VARCHAR(255),
  google_id VARCHAR(255) UNIQUE,
  perfil_uso VARCHAR(50) DEFAULT 'individual',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Refresh Tokens para Autenticação Segura de Longa Duração
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  revoked BOOLEAN DEFAULT FALSE
);

-- Tabela de Contas Financeiras por Usuário
CREATE TABLE IF NOT EXISTS contas (
  id SERIAL PRIMARY KEY,
  usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) DEFAULT 'individual',
  cor VARCHAR(50) DEFAULT '#fb8500',
  is_padrao BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Categorias por Usuário / Padrão
CREATE TABLE IF NOT EXISTS categorias (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  cor VARCHAR(50) DEFAULT '#8d99ae',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Etiquetas
CREATE TABLE IF NOT EXISTS etiquetas (
  id SERIAL PRIMARY KEY,
  usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_usuario_etiqueta UNIQUE(usuario_id, nome)
);

-- Tabela de Receitas
CREATE TABLE IF NOT EXISTS receitas (
  id SERIAL PRIMARY KEY,
  usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  conta_id INT REFERENCES contas(id) ON DELETE CASCADE,
  descricao VARCHAR(255) NOT NULL,
  valor NUMERIC(15, 2) NOT NULL,
  data DATE NOT NULL,
  categoria VARCHAR(255) DEFAULT 'Geral',
  etiqueta VARCHAR(255) DEFAULT 'Geral',
  tipo_pagamento VARCHAR(100) DEFAULT 'Outros',
  pago BOOLEAN DEFAULT TRUE,
  eh_reserva INT DEFAULT 0,
  observacao TEXT,
  anexo TEXT,
  repetir BOOLEAN DEFAULT FALSE,
  frequencia VARCHAR(50) DEFAULT 'mensal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Despesas
CREATE TABLE IF NOT EXISTS despesas (
  id SERIAL PRIMARY KEY,
  usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  conta_id INT REFERENCES contas(id) ON DELETE CASCADE,
  descricao VARCHAR(255) NOT NULL,
  valor NUMERIC(15, 2) NOT NULL,
  data DATE NOT NULL,
  categoria VARCHAR(255) DEFAULT 'Geral',
  etiqueta VARCHAR(255) DEFAULT 'Geral',
  tipo_pagamento VARCHAR(100) DEFAULT 'Outros',
  pago BOOLEAN DEFAULT TRUE,
  eh_reserva INT DEFAULT 0,
  observacao TEXT,
  anexo TEXT,
  repetir BOOLEAN DEFAULT FALSE,
  frequencia VARCHAR(50) DEFAULT 'mensal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices de Desempenho
CREATE INDEX IF NOT EXISTS idx_receitas_usuario_data ON receitas(usuario_id, data);
CREATE INDEX IF NOT EXISTS idx_despesas_usuario_data ON despesas(usuario_id, data);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_usuario ON refresh_tokens(usuario_id);
