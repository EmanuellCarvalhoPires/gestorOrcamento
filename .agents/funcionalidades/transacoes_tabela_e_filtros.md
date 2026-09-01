# 📊 Tabela de Transações, Filtros & Status

## 1. Descrição e Propósito
- **O que a funcionalidade faz:** Apresenta a listagem completa e detalhada de lançamentos (receitas e despesas) do mês e ano selecionados (`TransactionTable.jsx`). Oferece visualização clara de data, descrição, valor, categoria com chip colorido, etiqueta, forma de pagamento, badge de parcelas (ex: `1/12`), status de pagamento (Pago/Recebido vs Pendente/Previsto com alternância rápida por checkbox/toggle) e ações contextuais de visualização, edição e exclusão.
- **Fluxo de Utilização:**
  1. A tabela carrega as transações sincronizadas no estado do `BudgetContext`.
  2. O usuário pode alternar entre abas ("Todas", "Receitas", "Despesas" ou "Caixinha / Reserva").
  3. Pode realizar buscas instantâneas por texto (filtrando por nome, categoria ou etiqueta em tempo real).
  4. Pode clicar no checkbox de status para marcar rapidamente uma despesa como paga ou receita como recebida.
  5. As linhas exibem formatação monetária em Real (`BRL`), cores diferenciadas para receitas (verde) e despesas (vermelho/laranja), e indicadores visuais de reserva.
- **Componentes e Arquivos Envolvidos:**
  - Interface do usuário: [`src/components/TransactionTable.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/TransactionTable.jsx)
  - Seletores de Data: [`src/components/MonthSelector.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/MonthSelector.jsx), [`src/components/YearSelector.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/YearSelector.jsx) (Dropdown compacto de anos com rolagem, gerenciamento de anos, remoção/exclusão com 🗑️, adição de anos e navegação rápida ❮ ❯)
  - Contexto: [`src/contexts/BudgetContext.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/contexts/BudgetContext.jsx)

## 2. Impacto no Banco de Dados
- **Altera o banco de dados?** Sim (quando o usuário altera o status pago/pendente diretamente na tabela).
- **Adiciona/Remove dados?** Modifica o campo `pago`.
- **Tabelas afetadas**: `receitas`, `despesas`.
- **Operações detalhadas**:
  - **Read**:
    - `SELECT * FROM receitas WHERE usuario_id = $1 AND conta_id = $2 AND EXTRACT(MONTH FROM data) = $3 AND EXTRACT(YEAR FROM data) = $4 ORDER BY data DESC, id DESC;`
    - `SELECT * FROM despesas WHERE usuario_id = $1 AND conta_id = $2 AND EXTRACT(MONTH FROM data) = $3 AND EXTRACT(YEAR FROM data) = $4 ORDER BY data DESC, id DESC;`
  - **Update**:
    - `UPDATE despesas SET pago = $1 WHERE id = $2 AND usuario_id = $3;`
    - `UPDATE receitas SET pago = $1 WHERE id = $2 AND usuario_id = $3;`

## 3. Histórico de Versões e Modificações
| Versão | Data | Autor / Agente | O que foi modificado / Adicionado |
| :--- | :--- | :--- | :--- |
| `v1.0.0` | 2026-08-17 | Antigravity AI | Documentação da tabela de transações, busca dinâmica, chips de cores e alternância rápida de status de pagamento. |
| `v1.1.0` | 2026-08-21 | Antigravity AI | Transformação do seletor de anos em Dropdown moderno com lista rolável, exclusão de anos indesejados, adição de novos anos, navegação rápida ❮ ❯ e persistência em `localStorage`. |
| `v1.8.1` | 2026-08-25 | Antigravity AI | Calibração de altura da tabela (`TransactionTable.jsx`): aumento do container para `710px` e da área interna de rolagem para `625px`, permitindo a visualização imediata de 15 a 16 registros simultâneos, mantendo o tamanho fixo estável e ativando a barra de rolagem interna exclusivamente quando o número de transações excede esse limite. |
| `v1.7.0` | 2026-08-25 | Antigravity AI | Correção e aprimoramento completo do sistema de ordenação (sorter): inclusão de ordenação por Classificação/Categoria (A-Z e Z-A), cabeçalhos de colunas clicáveis com indicadores visuais de direção (`▲`/`▼`), remoção de priorização forçada que quebrava ordenação de datas e valores, e sincronização bidirecional entre dropdown e colunas da tabela. |
| `v1.6.0` | 2026-08-21 | Antigravity AI | Fixação da altura constante do container de `TransactionTable.jsx` em 590px (e 505px para a grade interna), garantindo que o background permaneça com tamanho fixo e estável sem se esticar verticalmente com a quantidade de lançamentos. |
| `v1.5.0` | 2026-08-21 | Antigravity AI | Calibração de larguras de colunas no `<thead>` de `TransactionTable.jsx` e adição de `overflowX: hidden` no wrapper rolável, eliminando scrollbar horizontal e corrigindo o alinhamento do valor e botões com o topo do card. |
| `v1.4.0` | 2026-08-21 | Antigravity AI | Expansão responsiva do background da tabela (`TransactionTable.jsx`): remoção da trava fixa de 540px, passando para `flex: 1` e `height: 100%` para preencher toda a altura vertical da tela e nivelar com a coluna de resumos. |
| `v1.3.0` | 2026-08-21 | Antigravity AI | Refinamento da visão unificada/expandida de grupos ("Todos"): eliminação da repetição massiva de nomes e categorias em subitens, substituição de bordas laterais coloridas por recuo e fundo translúcido sutil, harmonização de badges (`Recorrente` vs `Parcelado`), inclusão do badge `Reserva` no item pai, verbos simétricos de toggle (`Ver X meses` / `Ocultar meses`) e indicador de escala anual no painel lateral de resumos (`SummaryCards.jsx`). |
| `v1.2.0` | 2026-08-21 | Antigravity AI | Refinamento completo de UI/UX: remoção de botões 'Detalhes' redundantes, linha inteira clicável, tags de classificação suaves e discretas, menu de ações contextuais `···`, e forte hierarquia visual destacando o Valor financeiro e Nome. |
