# 🔁 Recorrência & Parcelamento Inteligente

## 1. Descrição e Propósito
- **O que a funcionalidade faz:** Automatiza a criação e a projeção de despesas e receitas futuras através de dois modos inteligentes:
  1. **Lançamentos Fixos / Recorrentes:** Lançamentos que se repetem periodicamente com frequências configuráveis (`mensal`, `quinzenal`, `trimestral`, `semestral`, `anual`), gerando projeções contínuas nos meses subsequentes.
  2. **Lançamentos Parcelados:** Compras ou vendas parceladas (ex: 12 parcelas de R$ 150,00). O sistema calcula os vencimentos de cada mês subsequente, mantendo o controle de índice de parcela (ex: "Compra Notebook (1/12)", "Compra Notebook (2/12)"), com identificadores de agrupamento para edição ou exclusão conjunta.
- **Fluxo de Utilização:**
  1. No modal de criação (`AddExpenseModal.jsx`), o usuário seleciona o tipo de repetição: "Fixo / Recorrente" ou "Parcelado".
  2. Para parcelados: informa a quantidade total de parcelas (ex: 1 a 72). O sistema calcula o valor unitário por parcela ou aceita o valor da parcela digitado.
  3. Para fixos: escolhe a periodicidade da recorrência.
  4. O backend/processo principal gera a série temporal de registros no PostgreSQL, calculando as datas corretas (ajustando para o último dia de meses com 28, 30 ou 31 dias).
- **Componentes e Arquivos Envolvidos:**
  - Interface do usuário: [`src/components/AddExpenseModal.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/AddExpenseModal.jsx)
  - Processo Principal Electron: [`src/main.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/main.js)
  - Contexto: [`src/contexts/BudgetContext.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/contexts/BudgetContext.jsx)

## 2. Impacto no Banco de Dados
- **Altera o banco de dados?** Sim.
- **Adiciona/Remove dados?** Sim (insere múltiplos registros no banco em um único comando ou transação de inserção em lote).
- **Tabelas afetadas**: `receitas`, `despesas`.
- **Operações detalhadas**:
  - **Create (Lote de Parcelas / Recorrência)**:
    - O sistema itera as $N$ parcelas calculando as datas `$data_i = data_base + i \text{ meses}$` e executa:
      `INSERT INTO despesas (usuario_id, conta_id, descricao, valor, data, categoria, etiqueta, tipo_pagamento, pago, eh_reserva, observacao, repetir, frequencia) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);`
  - **Read**: Leitura nos meses de vigência filtrados por data.

## 3. Histórico de Versões e Modificações
| Versão | Data | Autor / Agente | O que foi modificado / Adicionado |
| :--- | :--- | :--- | :--- |
| `v1.0.1` | 2026-08-17 | Antigravity AI | Implementação de `criarDataAjustada` para travar o dia final em meses com 28, 29 ou 30 dias (ex: compras parceladas no dia 31 geram parcelas em 28/Fev e 30/Abr sem transbordar para meses seguintes). |
| `v1.0.0` | 2026-08-17 | Antigravity AI | Documentação do motor de recorrência e parcelamento, projeção mensal e cálculo de vencimentos futuros. |
