# 🗄️ Banco de Dados PostgreSQL, APIs & IPCs

## 1. Descrição e Propósito
- **O que a funcionalidade faz:** Camada integral de persistência, comunicação e dados do aplicativo **Gestor de Orçamento (SimpleFinances)**. Opera com banco de dados relacional **PostgreSQL**, arquitetura com suporte a conexão direta via driver nativo `pg` (com túnel e failover para nuvem Oracle Cloud / servidor local) e API REST Express em [`server/`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/server). Toda a comunicação entre o Renderer React e o Main Process Electron é mediada com segurança através do [`src/preload.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/preload.js) via canais IPC tipados.
- **Componentes e Arquivos Envolvidos:**
  - Script SQL de Schema: [`server/schema.sql`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/server/schema.sql)
  - Conexão e Pool Backend: [`server/db.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/server/db.js), [`server/index.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/server/index.js)
  - Rotas da API REST: [`server/routes/authRoutes.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/server/routes/authRoutes.js), [`server/routes/financeRoutes.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/server/routes/financeRoutes.js)
  - Processo Principal Electron: [`src/main.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/main.js)
  - Ponte de Segurança IPC: [`src/preload.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/preload.js)
  - Cliente de Requisições: [`src/services/api.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/services/api.js)

---

## 2. Impacto no Banco de Dados & Estrutura de Schemas

### 📊 Estrutura Completa de Tabelas (DDL)

#### Tabela `usuarios`
```sql
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash VARCHAR(255),
  google_id VARCHAR(255) UNIQUE,
  perfil_uso VARCHAR(50) DEFAULT 'individual',
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabela `refresh_tokens`
```sql
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  revoked BOOLEAN DEFAULT FALSE
);
```

#### Tabela `contas`
```sql
CREATE TABLE IF NOT EXISTS contas (
  id SERIAL PRIMARY KEY,
  usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) DEFAULT 'individual',
  cor VARCHAR(50) DEFAULT '#fb8500',
  is_padrao BOOLEAN DEFAULT FALSE,
  caixinha_ativa BOOLEAN DEFAULT TRUE,
  caixinha_saldo_inicial NUMERIC(15, 2) DEFAULT 0,
  caixinha_rendimento_taxa NUMERIC(5, 2) DEFAULT 0,
  caixinha_rendimento_periodo VARCHAR(20) DEFAULT 'mensal',
  paleta_cores JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabela `categorias`
```sql
CREATE TABLE IF NOT EXISTS categorias (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  cor VARCHAR(50) DEFAULT '#8d99ae',
  ordem INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabela `etiquetas`
```sql
CREATE TABLE IF NOT EXISTS etiquetas (
  id SERIAL PRIMARY KEY,
  usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  ordem INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_usuario_etiqueta UNIQUE(usuario_id, nome)
);
```

#### Tabela `receitas`
```sql
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
```

#### Tabela `despesas`
```sql
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
```

---

## 3. Mapeamento de Canais IPC (`preload.js` / `main.js`)

| Canal IPC (`ipcRenderer.invoke`) | Parâmetros Recebidos | Finalidade |
| :--- | :--- | :--- |
| `registrar-usuario` | `{ nome, email, senha, perfilUso }` | Cadastra novo usuário com hash de senha e cria estruturas iniciais |
| `login-usuario` | `{ email, senha }` | Autentica usuário por credenciais |
| `login-google` | `{ perfilUso }` | Inicia fluxo OAuth 2.0 loopback local com Google |
| `enviar-codigo-verificacao` | `{ email, nome }` | Dispara e-mail SMTP com código temporal de 6 dígitos |
| `validar-codigo-verificacao` | `{ email, codigo }` | Valida código de 6 dígitos em memória |
| `solicitar-recuperacao-senha` | `{ email }` | Envia código de redefinição de senha para o e-mail |
| `confirmar-recuperacao-senha` | `{ email, codigo, novaSenha }` | Valida código e atualiza `senha_hash` do usuário |
| `obter-perfil-usuario` | `{ usuarioId }` | Consulta dados cadastrais e privilégios do usuário |
| `listar-usuarios-admin` | `{ usuarioId }` | Lista todos os usuários cadastrados (somente admin) |
| `deletar-usuario-admin` | `{ targetUserId, usuarioId }` | Exclui usuário pelo painel administrativo |
| `alterar-funcao-usuario-admin`| `{ targetUserId, novaFuncao, usuarioId }` | Altera status admin do usuário alvo |
| `excluir-conta-usuario` | `{ usuarioId, confirmacaoText }` | Remove definitivamente a conta do próprio usuário em cascata |
| `carregar-contas` | `{ usuarioId }` | Retorna todas as contas financeiras do usuário |
| `criar-conta` | `{ usuarioId, nome, tipo, descricao, cor }` | Cria uma nova conta bancária/carteira |
| `deletar-conta` | `{ contaId, usuarioId }` | Exclui conta financeira e seus lançamentos |
| `salvar-configuracao-caixinha` | `{ contaId, caixinhaAtiva, caixinhaSaldoInicial, caixinhaRendimentoTaxa, caixinhaRendimentoPeriodo }` | Salva parâmetros da caixinha/reserva |
| `salvar-paleta-cores` | `{ contaId, paletaCores }` | Salva tema visual customizado no banco |
| `carregar-paleta-cores` | `{ contaId }` | Carrega tema visual customizado |
| `carregar-categorias` | `{ usuarioId }` | Retorna categorias ordenadas do usuário |
| `adicionar-categoria` | `{ usuarioId, nome, cor }` | Cria nova categoria |
| `deletar-categoria` | `{ id, usuarioId }` | Exclui categoria |
| `reordenar-categorias` | `{ usuarioId, ordemIds }` | Salva nova ordem de exibição das categorias |
| `carregar-etiquetas` | `{ usuarioId }` | Retorna etiquetas/tags do usuário |
| `adicionar-etiqueta` | `{ usuarioId, nome }` | Cria nova etiqueta |
| `deletar-etiqueta` | `{ usuarioId, nome }` | Exclui etiqueta |
| `reordenar-etiquetas` | `{ usuarioId, ordemEtiquetas }` | Salva nova ordem de exibição das etiquetas |
| `carregar-transacoes` | `{ usuarioId, contaId, mes, ano }` | Carrega receitas e despesas do período |
| `adicionar-transacao` | `novaTransacao` (objeto completo) | Insere receita/despesa (simples, fixa ou parcelada) |
| `editar-transacao` | `{ id, usuarioId, ... }` | Atualiza transação existente |
| `deletar-transacao` | `{ id, usuarioId, deletarModo, ... }` | Exclui transação pontual ou em lote/parcelas |
| `obter-total-caixinha` | `{ usuarioId, contaId }` | Retorna saldo consolidado da caixinha |
| `obter-historico-caixinha` | `{ usuarioId, contaId }` | Retorna série temporal de aportes/resgates |
| `importar-transacoes-nubank-csv` | `{ usuarioId, contaId, transacoes }` | Importa em lote faturas do Nubank |
| `exportar-csv` | `{ dados, mes, ano }` | Gera e salva arquivo `.csv` no disco |
| `exportar-pdf` | `{ receitasList, despesasList, categorias, ... }` | Renderiza e salva relatório `.pdf` |

---

## 4. Histórico de Versões e Modificações
| Versão | Data | Autor / Agente | O que foi modificado / Adicionado |
| :--- | :--- | :--- | :--- |
| `v1.0.0` | 2026-08-17 | Antigravity AI | Mapeamento exaustivo da arquitetura de dados PostgreSQL, DDL de tabelas, índices e todos os 35 canais IPC. |
