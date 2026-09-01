# 💰 Lançamentos de Receitas e Despesas

## 1. Descrição e Propósito
- **O que a funcionalidade faz:** Mecanismo central para inserção e registro de entradas financeiras (receitas/faturamento) e saídas financeiras (despesas/custos). Oferece campos completos para valor monetário formatado, data, descrição, categoria, etiqueta, tipo de pagamento (Pix, Dinheiro, Cartão de Crédito, Boleto, etc.), observação, comprovante em anexo, status pago/pendente e flag de reserva/caixinha. Possui proteção nativa contra múltiplos cliques involuntários.
- **Fluxo de Utilização:**
  1. O usuário clica no botão "Adicionar Receita" ou "Adicionar Despesa" (ou atalho no dashboard).
  2. O modal `AddExpenseModal.jsx` é exibido adaptando títulos e rótulos de acordo com o tipo (Receita vs Despesa) e perfil de uso (Individual vs Comercial/Corporativo).
  3. O usuário preenche os dados, seleciona a categoria, etiqueta e escolhe se o lançamento já está realizado/pago ou pendente/previsto.
  4. Pode anexar comprovantes em formato de imagem/documento (armazenado em base64 ou caminho local).
  5. Clica em "Salvar". O formulário desativa os botões para prevenir duplo envio (`isSubmitting`), envia a carga para o processo principal / API, atualiza o banco e reflete imediatamente nos cards e tabelas.
- **Componentes e Arquivos Envolvidos:**
  - Interface do usuário: [`src/components/AddExpenseModal.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/AddExpenseModal.jsx)
  - Contexto: [`src/contexts/BudgetContext.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/contexts/BudgetContext.jsx)
  - Preload IPC: [`src/preload.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/preload.js) (`adicionarTransacao`)
  - Processo Principal Electron: [`src/main.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/main.js)
  - Rotas Backend API: [`server/routes/financeRoutes.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/server/routes/financeRoutes.js)

## 2. Impacto no Banco de Dados
- **Altera o banco de dados?** Sim.
- **Adiciona/Remove dados?** Sim (insere novos registros em `receitas` ou `despesas`).
- **Tabelas afetadas**: `receitas`, `despesas`.
- **Operações detalhadas**:
  - **Create**:
    - Para Receita:
      `INSERT INTO receitas (usuario_id, conta_id, descricao, valor, data, categoria, etiqueta, tipo_pagamento, pago, eh_reserva, observacao, anexo, repetir, frequencia) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *;`
    - Para Despesa:
      `INSERT INTO despesas (usuario_id, conta_id, descricao, valor, data, categoria, etiqueta, tipo_pagamento, pago, eh_reserva, observacao, anexo, repetir, frequencia) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *;`

## 3. Histórico de Versões e Modificações
| Versão | Data | Autor / Agente | O que foi modificado / Adicionado |
| :--- | :--- | :--- | :--- |
| `v1.0.0` | 2026-08-17 | Antigravity AI | Documentação do motor de lançamento de transações financeiras, suporte a anexos, flag de reserva e proteção contra duplo envio. |
| `v1.1.0` | 2026-08-21 | Antigravity AI | Refinamento abrangente de UI/UX: remoção de todos os emojis em botões e opções, eliminação de textos em itálico competindo com os rótulos, contraste nítido nos estados de seleção (Segmented Buttons), integração do atalho '+ Gerenciar Categorias' dentro do dropdown e alinhamento do seletor Receita/Despesa no topo. |
