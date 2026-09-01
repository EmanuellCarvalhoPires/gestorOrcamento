# 🔖 Gestão de Etiquetas (Tags)

## 1. Descrição e Propósito
- **O que a funcionalidade faz:** Fornece um nível adicional e transversal de classificação para as transações financeiras (ex: #Viagem, #Reforma, #ClienteX, #Urgente, #CartãoPF). Permite cadastrar novas etiquetas personalizadas por usuário, reordenar a sequência de preferência e excluir etiquetas não utilizadas.
- **Fluxo de Utilização:**
  1. O usuário gerencia suas etiquetas através do modal de gestão (`CategoryManagerModal.jsx` / aba Etiquetas).
  2. Pode adicionar uma nova etiqueta com nome único por usuário.
  3. Pode reordenar a ordem de listagem.
  4. As etiquetas ficam disponíveis para seleção rápida durante o lançamento de receitas e despesas (`AddExpenseModal.jsx`), e são exibidas como badges na tabela de transações.
- **Componentes e Arquivos Envolvidos:**
  - Interface do usuário: [`src/components/CategoryManagerModal.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/CategoryManagerModal.jsx), [`src/components/AddExpenseModal.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/AddExpenseModal.jsx)
  - Contexto: [`src/contexts/BudgetContext.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/contexts/BudgetContext.jsx)
  - Preload IPC: [`src/preload.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/preload.js) (`carregarEtiquetas`, `adicionarEtiqueta`, `deletarEtiqueta`, `reordenarEtiquetas`)
  - Processo Principal Electron: [`src/main.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/main.js)
  - Rotas Backend API: [`server/routes/financeRoutes.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/server/routes/financeRoutes.js)

## 2. Impacto no Banco de Dados
- **Altera o banco de dados?** Sim.
- **Adiciona/Remove dados?** Sim (criação, reordenação e deleção na tabela `etiquetas`).
- **Tabelas afetadas**: `etiquetas`.
- **Operações detalhadas**:
  - **Create**:
    - `INSERT INTO etiquetas (usuario_id, nome) VALUES ($1, $2) ON CONFLICT (usuario_id, nome) DO NOTHING RETURNING *;`
  - **Read**:
    - `SELECT * FROM etiquetas WHERE usuario_id = $1 ORDER BY ordem ASC, nome ASC;`
  - **Update**:
    - `UPDATE etiquetas SET ordem = $1 WHERE usuario_id = $2 AND nome = $3;`
  - **Delete**:
    - `DELETE FROM etiquetas WHERE usuario_id = $1 AND nome = $2;`

## 3. Histórico de Versões e Modificações
| Versão | Data | Autor / Agente | O que foi modificado / Adicionado |
| :--- | :--- | :--- | :--- |
| `v1.0.0` | 2026-08-17 | Antigravity AI | Documentação da gestão de etiquetas, ordenação persistida e vínculos nas transações. |
