# 💼 Gestão de Contas Financeiras (Multi-Contas)

## 1. Descrição e Propósito
- **O que a funcionalidade faz:** Permite que o usuário crie e gerencie múltiplas contas financeiras independentes (ex: Carteira, Banco Nubank, Banco Inter, Conta PJ / Comercial, Investimentos), alternando entre elas dinamicamente e mantendo segregação total de lançamentos, saldos e caixinhas.
- **Fluxo de Utilização:**
  1. O usuário visualiza suas contas no cabeçalho/menu através de `AccountManagerModal.jsx` ou `UserProfileHeader.jsx`.
  2. Pode cadastrar uma nova conta informando Nome, Tipo (`individual` / `comercial`) e Cor identificadora personalizada.
  3. Pode definir qual conta é a padrão (`is_padrao`).
  4. Pode excluir contas existentes (com confirmação). Ao excluir uma conta, todas as receitas e despesas vinculadas a ela são removidas.
  5. Ao selecionar uma conta, o contexto global (`BudgetContext.jsx`) recarrega automaticamente as transações, categorias, etiquetas, paletas e caixinha daquela conta.
- **Componentes e Arquivos Envolvidos:**
  - Interface do usuário: [`src/components/AccountManagerModal.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/AccountManagerModal.jsx), [`src/components/UserProfileHeader.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/UserProfileHeader.jsx)
  - Contexto Global: [`src/contexts/BudgetContext.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/contexts/BudgetContext.jsx)
  - Preload IPC: [`src/preload.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/preload.js) (`carregarContas`, `criarConta`, `deletarConta`)
  - Processo Principal Electron: [`src/main.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/main.js)
  - Rotas Backend API: [`server/routes/financeRoutes.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/server/routes/financeRoutes.js)

## 2. Impacto no Banco de Dados
- **Altera o banco de dados?** Sim.
- **Adiciona/Remove dados?** Sim (cria, edita e remove contas da tabela `contas`).
- **Tabelas afetadas**: `contas`, `receitas`, `despesas`.
- **Operações detalhadas**:
  - **Create**:
    - `INSERT INTO contas (usuario_id, nome, tipo, cor, is_padrao) VALUES ($1, $2, $3, $4, $5) RETURNING *;`
  - **Read**:
    - `SELECT * FROM contas WHERE usuario_id = $1 ORDER BY is_padrao DESC, nome ASC;`
  - **Update**:
    - `UPDATE contas SET is_padrao = false WHERE usuario_id = $1;` (ao eleger nova conta padrão)
    - `UPDATE contas SET is_padrao = true WHERE id = $1;`
  - **Delete**:
    - `DELETE FROM contas WHERE id = $1 AND usuario_id = $2;`

## 3. Histórico de Versões e Modificações
| Versão | Data | Autor / Agente | O que foi modificado / Adicionado |
| :--- | :--- | :--- | :--- |
| `v1.0.0` | 2026-08-17 | Antigravity AI | Mapeamento completo do sistema de multi-contas, vinculação de lançamentos por conta e deleção em cascata. |
| `v1.1.0` | 2026-08-21 | Antigravity AI | Refinamento de UI/UX no menu suspenso do cabeçalho (`UserProfileHeader.jsx`): remoção de emojis e ícones de cores arbitrárias, eliminação do texto redundante 'Individual' em todas as contas, redução de divisórias fragmentadas e estilização consistente para o botão 'Sair da Conta'. |
