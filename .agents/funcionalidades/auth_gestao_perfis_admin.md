# 👥 Gestão de Usuários, Perfis & Painel Admin

## 1. Descrição e Propósito
- **O que a funcionalidade faz:** Fornece recursos de governança de usuários, permitindo que administradores visualizem a listagem de usuários do sistema, alterem privilégios (usuário comum / administrador) e excluam contas. Também disponibiliza para qualquer usuário a opção de exclusão definitiva e irreversível da sua própria conta com limpeza completa em cascata.
- **Fluxo de Utilização:**
  1. O usuário administrador acessa o Painel Administrativo dentro de `SettingsModal.jsx` (ou componente dedicado).
  2. O sistema busca a lista de usuários cadastrados (`listar-usuarios-admin`).
  3. O admin pode promover/rebaixar funções (`alterar-funcao-usuario-admin`) ou excluir contas de terceiros (`deletar-usuario-admin`).
  4. Para exclusão da própria conta pelo usuário (`excluir-conta-usuario`): o usuário deve digitar textualmente o termo de confirmação (ex: "EXCLUIR"). O sistema apaga todos os registros de transações, contas, categorias, etiquetas e perfil, deslogando a sessão imediatamente.
- **Componentes e Arquivos Envolvidos:**
  - Interface do usuário: [`src/components/SettingsModal.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/SettingsModal.jsx), [`src/components/DeleteConfirmModal.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/DeleteConfirmModal.jsx)
  - Preload IPC: [`src/preload.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/preload.js) (`listarUsuariosAdmin`, `deletarUsuarioAdmin`, `alterarFuncaoUsuarioAdmin`, `excluirContaUsuario`, `obterPerfilUsuario`)
  - Processo Principal Electron: [`src/main.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/main.js)
  - Rotas Backend: [`server/routes/authRoutes.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/server/routes/authRoutes.js)

## 2. Impacto no Banco de Dados
- **Altera o banco de dados?** Sim.
- **Adiciona/Remove dados?** Sim (remove contas de usuários e todos os dados vinculados em cascata; atualiza colunas de privilégio).
- **Tabelas afetadas**: `usuarios`, `contas`, `categorias`, `etiquetas`, `receitas`, `despesas`, `refresh_tokens`.
- **Operações detalhadas**:
  - **Read**:
    - `SELECT id, nome, email, perfil_uso, is_admin, created_at FROM usuarios ORDER BY id ASC;`
    - `SELECT id, nome, email, perfil_uso, is_admin FROM usuarios WHERE id = $1;`
  - **Update**:
    - `UPDATE usuarios SET is_admin = $1 WHERE id = $2;`
    - `UPDATE usuarios SET perfil_uso = $1 WHERE id = $2;`
  - **Delete**:
    - `DELETE FROM usuarios WHERE id = $1;` (as chaves estrangeiras com `ON DELETE CASCADE` garantem a exclusão automática de receitas, despesas, categorias, contas e tokens).

## 3. Histórico de Versões e Modificações
| Versão | Data | Autor / Agente | O que foi modificado / Adicionado |
| :--- | :--- | :--- | :--- |
| `v1.0.0` | 2026-08-17 | Antigravity AI | Documentação da gestão de usuários, painel administrativo e fluxo seguro de autoexclusão com expurgo em cascata. |
