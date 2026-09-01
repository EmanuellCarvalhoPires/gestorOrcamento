# 🔑 Autenticação: Recuperação de Senha por E-mail

## 1. Descrição e Propósito
- **O que a funcionalidade faz:** Permite que usuários que esqueceram a senha possam redefini-la com segurança através de um código de verificação numérico de 6 dígitos enviado para seu e-mail cadastrado.
- **Fluxo de Utilização:**
  1. O usuário clica em "Esqueci minha senha" no `AuthView.jsx`.
  2. Informa seu e-mail cadastrado.
  3. O backend (`main.js` ou API Express) verifica a existência do e-mail no PostgreSQL.
  4. Gera um código criptograficamente seguro de 6 dígitos (`crypto.randomInt(100000, 999999)`), com validade de 15 minutos.
  5. Envia o código por e-mail com template visual estilizado via Nodemailer / SMTP.
  6. O usuário digita o código de 6 dígitos recebido e sua nova senha (com confirmação).
  7. O backend valida o código, faz o hash da nova senha com `bcryptjs` e atualiza o registro no banco.
- **Componentes e Arquivos Envolvidos:**
  - Interface do usuário: [`src/components/AuthView.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/AuthView.jsx)
  - Serviço Frontend: [`src/services/api.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/services/api.js)
  - Preload IPC: [`src/preload.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/preload.js) (`solicitarRecuperacaoSenha`, `confirmarRecuperacaoSenha`)
  - Processo Principal Electron: [`src/main.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/main.js)
  - Serviço de E-mail: [`server/services/emailService.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/server/services/emailService.js)
  - Rotas Backend: [`server/routes/authRoutes.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/server/routes/authRoutes.js)

## 2. Impacto no Banco de Dados
- **Altera o banco de dados?** Sim.
- **Adiciona/Remove dados?** Modifica (`senha_hash` do usuário na confirmação).
- **Tabelas afetadas**: `usuarios`.
- **Operações detalhadas**:
  - **Read**:
    - `SELECT id, nome, email FROM usuarios WHERE LOWER(email) = LOWER($1);`
  - **Update**:
    - `UPDATE usuarios SET senha_hash = $1 WHERE LOWER(email) = LOWER($2);`

## 3. Histórico de Versões e Modificações
| Versão | Data | Autor / Agente | O que foi modificado / Adicionado |
| :--- | :--- | :--- | :--- |
| `v1.0.0` | 2026-08-17 | Antigravity AI | Documentação da recuperação de senha com verificação em duas etapas via token de 6 dígitos temporário e atualização de hash bcrypt. |
