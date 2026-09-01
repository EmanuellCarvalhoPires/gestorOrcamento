# 🌐 Autenticação: Google OAuth 2.0

## 1. Descrição e Propósito
- **O que a funcionalidade faz:** Permite que o usuário realize login social e registro com um clique através da conta Google no Electron Desktop.
- **Fluxo de Utilização:**
  1. O usuário clica em "Entrar com Google" no componente `AuthView.jsx`.
  2. O processo principal (`src/main.js`) inicia um servidor HTTP local efêmero (`http://127.0.0.1:<porta_dinamica>/callback`).
  3. Abre o navegador padrão do sistema (`shell.openExternal`) com a URL de consentimento OAuth 2.0 do Google configurada com `client_id`, `redirect_uri` local e `scopes` (`profile`, `email`, `openid`).
  4. O usuário autentica no Google e é redirecionado para o servidor local com o `authorization_code`.
  5. O Electron troca o código pelo `access_token` e `id_token` através do endpoint `https://oauth2.googleapis.com/token`.
  6. Obtém o perfil do usuário (`https://www.googleapis.com/oauth2/v2/userinfo`).
  7. Se o usuário já existir no banco (`google_id` ou e-mail correspondente), efetua o login. Se for novo, cadastra o usuário automaticamente, criando conta e categorias padrão.
- **Componentes e Arquivos Envolvidos:**
  - Interface do usuário: [`src/components/AuthView.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/AuthView.jsx)
  - Preload IPC: [`src/preload.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/preload.js) (`loginGoogle`)
  - Processo Principal Electron: [`src/main.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/main.js)
  - Configuração de credenciais: [`client_secret_*.json`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/client_secret_1023898773119-lpvurepidkav2h4s4opgpqvsjkj26j3d.apps.googleusercontent.com.json)

## 2. Impacto no Banco de Dados
- **Altera o banco de dados?** Sim (em novos cadastros via Google).
- **Adiciona/Remove dados?** Sim (criação de usuário com `google_id`, conta inicial e categorias).
- **Tabelas afetadas**: `usuarios`, `contas`, `categorias`.
- **Operações detalhadas**:
  - **Read**:
    - `SELECT * FROM usuarios WHERE google_id = $1 OR LOWER(email) = LOWER($2);`
  - **Create**:
    - `INSERT INTO usuarios (nome, email, google_id, perfil_uso) VALUES ($1, $2, $3, $4) RETURNING *;`
    - Criação de `contas` e `categorias` padrão caso seja primeiro acesso.
  - **Update**:
    - `UPDATE usuarios SET google_id = $1 WHERE id = $2;` (vincula o `google_id` se a conta existia por e-mail).

## 3. Histórico de Versões e Modificações
| Versão | Data | Autor / Agente | O que foi modificado / Adicionado |
| :--- | :--- | :--- | :--- |
| `v1.0.0` | 2026-08-17 | Antigravity AI | Documentação do fluxo completo OAuth 2.0 loopback local com Google APIs e auto-provisionamento de conta. |
