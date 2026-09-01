# 🏷️ Gestão de Categorias

## 1. Descrição e Propósito
- **O que a funcionalidade faz:** Permite o gerenciamento completo de categorias financeiras para classificação de receitas e despesas (ex: Alimentação, Moradia, Transporte, Saúde, Vendas, Serviços). Suporta criação com cor em hexadecimal personalizada, deleção com verificação de uso e reordenação interativa (ordem personalizada de exibição).
- **Fluxo de Utilização:**
  1. O usuário abre o modal de categorias (`CategoryManagerModal.jsx`).
  2. Pode digitar o nome de uma nova categoria, selecionar uma cor visual e salvar.
  3. Pode reordenar a sequência de exibição arrastando ou usando controles de posição (`reordenar-categorias`).
  4. Pode excluir categorias que não estejam mais em uso (`deletar-categoria`).
  5. As categorias cadastradas alimentam automaticamente os dropdowns dos modais de lançamentos (`AddExpenseModal.jsx`, `EditExpenseModal.jsx`), a tabela de transações e os filtros analíticos.
- **Componentes e Arquivos Envolvidos:**
  - Interface do usuário: [`src/components/CategoryManagerModal.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/CategoryManagerModal.jsx)
  - Contexto: [`src/contexts/BudgetContext.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/contexts/BudgetContext.jsx)
  - Preload IPC: [`src/preload.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/preload.js) (`carregarCategorias`, `adicionarCategoria`, `deletarCategoria`, `reordenarCategorias`)
  - Processo Principal Electron: [`src/main.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/main.js)
  - Rotas Backend API: [`server/routes/financeRoutes.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/server/routes/financeRoutes.js)

## 2. Impacto no Banco de Dados
- **Altera o banco de dados?** Sim.
- **Adiciona/Remove dados?** Sim (criação, reordenação e deleção de registros na tabela `categorias`).
- **Tabelas afetadas**: `categorias`.
- **Operações detalhadas**:
  - **Create**:
    - `INSERT INTO categorias (usuario_id, nome, cor) VALUES ($1, $2, $3) RETURNING *;`
  - **Read**:
    - `SELECT * FROM categorias WHERE usuario_id = $1 OR usuario_id IS NULL ORDER BY ordem ASC, nome ASC;`
  - **Update**:
    - `UPDATE categorias SET ordem = $1 WHERE id = $2 AND usuario_id = $3;` (ao reordenar a listagem)
  - **Delete**:
    - `DELETE FROM categorias WHERE id = $1 AND usuario_id = $2;`

## 3. Histórico de Versões e Modificações
| Versão | Data | Autor / Agente | O que foi modificado / Adicionado |
| :--- | :--- | :--- | :--- |
| `v1.0.0` | 2026-08-17 | Antigravity AI | Documentação do CRUD de categorias, suporte a paleta de cores hexadecimais e ordenação dinâmica de exibição. |
