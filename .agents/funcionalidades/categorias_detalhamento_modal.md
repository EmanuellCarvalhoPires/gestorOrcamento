# 🔍 Detalhamento & Análise de Gastos por Categoria

## 1. Descrição e Propósito
- **O que a funcionalidade faz:** Disponibiliza uma visão analítica aprofundada de uma categoria específica (`CategoryDetailModal.jsx`), apresentando o total consumido, percentual representativo sobre o total de gastos do mês, listagem cronológica de todos os lançamentos que compõem aquele grupo e histórico comparativo.
- **Fluxo de Utilização:**
  1. O usuário clica sobre uma fatia do gráfico de rosca (`DonutChart.jsx`) ou sobre o badge/chip de categoria na tabela ou dashboard.
  2. O modal de detalhamento abre exibindo o nome e a cor da categoria.
  3. Lista todas as receitas ou despesas daquele mês pertencentes àquela categoria, com data, valor individual, descrição, forma de pagamento e status.
  4. Mostra o somatório total acumulado no período filtrado.
  5. Permite ação rápida para editar ou visualizar os detalhes de qualquer transação da lista.
- **Componentes e Arquivos Envolvidos:**
  - Interface do usuário: [`src/components/CategoryDetailModal.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/CategoryDetailModal.jsx), [`src/components/DonutChart.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/DonutChart.jsx)
  - Contexto: [`src/contexts/BudgetContext.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/contexts/BudgetContext.jsx)

## 2. Impacto no Banco de Dados
- **Altera o banco de dados?** Não (funcionalidade estritamente analítica e de leitura).
- **Adiciona/Remove dados?** Não.
- **Tabelas afetadas**: `despesas`, `receitas` (leitura em memória / consultas filtradas).
- **Operações detalhadas**:
  - **Read**:
    - Os dados são filtrados a partir da lista já sincronizada no estado global (`BudgetContext`), ou consultados por período:
    - `SELECT * FROM despesas WHERE usuario_id = $1 AND conta_id = $2 AND categoria = $3 AND EXTRACT(MONTH FROM data) = $4 AND EXTRACT(YEAR FROM data) = $5 ORDER BY data DESC;`

## 3. Histórico de Versões e Modificações
| Versão | Data | Autor / Agente | O que foi modificado / Adicionado |
| :--- | :--- | :--- | :--- |
| `v1.0.0` | 2026-08-17 | Antigravity AI | Documentação do modal de detalhamento de categorias, métricas consolidadas e integração com gráfico Donut. |
| `v1.0.1` | 2026-08-17 | Antigravity AI | Integração com `DeleteConfirmModal.jsx` para confirmação antes de apagar itens a partir do modal de categoria, e correção do parâmetro de ID enviado ao banco de dados. |
| `v1.1.0` | 2026-08-21 | Antigravity AI | Refinamento de UI/UX: remoção de botões duplicados "+ Adicionar", eliminação do botão redundante "Fechar" (mantendo o "✕" universal), remoção do badge de contagem óbvia, remoção da bolinha de cor no título, limpeza de emojis nas etiquetas e padronização do formato de parcelas ("À vista" vs "Fixa" vs "X de Y"). |
