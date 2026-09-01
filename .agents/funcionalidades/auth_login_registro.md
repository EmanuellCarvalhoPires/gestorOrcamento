# 🔐 Autenticação: Login & Registro

## 1. Descrição e Propósito
- **O que a funcionalidade faz:** Gerencia o cadastro inicial de novos usuários no sistema (com nome, e-mail, senha criptografada e escolha de perfil de uso: Individual ou Comercial) e o login por credenciais (e-mail e senha).
- **Fluxo de Utilização:**
  1. O usuário acessa a tela de autenticação (`AuthView.jsx`).
  2. Para cadastro: insere nome, e-mail corporativo ou pessoal, senha (com confirmação de senha) e seleciona o perfil de uso desejado. É disparado o processo de validação de e-mail por código numérico antes da persistência.
  3. A senha é criptografada com `bcryptjs` (salt de 10 rounds).
  4. O sistema cria automaticamente as categorias padrão (`Alimentação`, `Transporte`, `Moradia`, `Lazer`, `Salário`, `Outros`, etc.) e uma conta padrão ("Conta Principal" / "Conta PJ").
  5. Para login: o usuário informa e-mail e senha. As credenciais são validadas contra o banco PostgreSQL; na versão API, são gerados tokens JWT (`accessToken` e `refreshToken`).
- **Componentes e Arquivos Envolvidos:**
  - Interface do usuário: [`src/components/AuthView.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/AuthView.jsx)
  - Serviço Frontend: [`src/services/api.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/services/api.js)
  - Preload IPC: [`src/preload.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/preload.js) (`registrarUsuario`, `loginUsuario`)
  - Processo Principal Electron: [`src/main.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/main.js)
  - Rotas Backend API: [`server/routes/authRoutes.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/server/routes/authRoutes.js)

## 2. Impacto no Banco de Dados
- **Altera o banco de dados?** Sim.
- **Adiciona/Remove dados?** Sim (adiciona novos usuários, contas padrão e categorias padrão; lê credenciais para login).
- **Tabelas afetadas**: `usuarios`, `contas`, `categorias`, `refresh_tokens`.
- **Operações detalhadas**:
  - **Create**:
    - `INSERT INTO usuarios (nome, email, senha_hash, perfil_uso) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, perfil_uso, is_admin;`
    - `INSERT INTO contas (usuario_id, nome, tipo, is_padrao) VALUES ($1, 'Conta Principal', 'individual', true);`
    - `INSERT INTO categorias (usuario_id, nome, cor) VALUES ($1, $2, $3);`
    - `INSERT INTO refresh_tokens (usuario_id, token_hash, expires_at) VALUES ($1, $2, $3);`
  - **Read**:
    - `SELECT id, nome, email, senha_hash, perfil_uso, is_admin FROM usuarios WHERE LOWER(email) = LOWER($1);`
  - **Update**: Atualização de último acesso ou preferências.
  - **Delete**: Não aplicável nesta rotina (veja gestão de exclusão de conta).

## 3. Histórico de Versões e Modificações
| Versão | Data | Autor / Agente | O que foi modificado / Adicionado |
| :--- | :--- | :--- | :--- |
| `v1.0.0` | 2026-08-17 | Antigravity AI | Mapeamento e documentação completa do fluxo de registro com hashing bcrypt, criação automática de contas/categorias iniciais e login seguro. |
