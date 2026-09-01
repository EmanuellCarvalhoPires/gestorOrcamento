# 📈 Dashboard, Resumos & Gráfico Donut

## 1. Descrição e Propósito
- **O que a funcionalidade faz:** Painel central executivo do aplicativo que consolida as métricas financeiras vitais do mês e ano selecionados. Apresenta cards de resumo (`SummaryCards.jsx`), balanço em tempo real (Receitas vs Despesas), saldo previsto vs realizado, economia acumulada e um gráfico interativo de rosca/donut (`DonutChart.jsx`) para distribuição percentual dos gastos por categoria.
- **Fluxo de Utilização:**
  1. Ao abrir o aplicativo ou navegar entre meses/anos (`MonthSelector.jsx`, `YearSelector.jsx`), o contexto recalcula os somatórios.
  2. Os cards exibem:
     - **Total de Receitas / Faturamento:** Somatório de todas as receitas do mês (destaque para recebidas vs a receber).
     - **Total de Despesas / Custos:** Somatório de todas as despesas do mês (destaque para pagas vs pendentes).
     - **Saldo do Mês / Resultado:** Diferença líquida (`Receitas - Despesas`).
     - **Saldo Guardado na Caixinha / Reserva:** Total acumulado na caixinha.
  3. O gráfico de rosca (`DonutChart.jsx`) renderiza visualmente a fatia proporcional de cada categoria de despesa com legenda dinâmica, porcentagens relativas e tooltip interativo.
- **Componentes e Arquivos Envolvidos:**
  - Interface do usuário: [`src/components/SummaryCards.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/SummaryCards.jsx), [`src/components/DonutChart.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/DonutChart.jsx)
  - Controles de Período: [`src/components/MonthSelector.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/MonthSelector.jsx), [`src/components/YearSelector.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/YearSelector.jsx)
  - Contexto: [`src/contexts/BudgetContext.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/contexts/BudgetContext.jsx)

## 2. Impacto no Banco de Dados
- **Altera o banco de dados?** Não (módulo de consolidação analítica e visualização).
- **Adiciona/Remove dados?** Não.
- **Tabelas afetadas**: `receitas`, `despesas`, `contas` (leitura em memória / queries agregadas).
- **Operações detalhadas**:
  - **Read**:
    - `SELECT SUM(valor) FROM receitas WHERE usuario_id = $1 AND conta_id = $2 AND EXTRACT(MONTH FROM data) = $3 AND EXTRACT(YEAR FROM data) = $4 AND pago = true;`
    - `SELECT SUM(valor) FROM despesas WHERE usuario_id = $1 AND conta_id = $2 AND EXTRACT(MONTH FROM data) = $3 AND EXTRACT(YEAR FROM data) = $4 AND pago = true;`
    - Agrupamento para o gráfico Donut: `SELECT categoria, SUM(valor) as total FROM despesas WHERE usuario_id = $1 AND conta_id = $2 AND EXTRACT(MONTH FROM data) = $3 AND EXTRACT(YEAR FROM data) = $4 GROUP BY categoria ORDER BY total DESC;`

## 3. Histórico de Versões e Modificações
| Versão | Data | Autor / Agente | O que foi modificado / Adicionado |
| :--- | :--- | :--- | :--- |
| `v1.0.0` | 2026-08-17 | Antigravity AI | Documentação do painel de resumos financeiros, cards de resultado e renderização do gráfico de rosca de despesas. |
| `v1.1.0` | 2026-08-21 | Antigravity AI | Refinamento dos painéis de resumo: remoção da porcentagem em texto redundante ao lado do valor nas categorias (mantendo a barra visual de progresso), e diferenciação visual das bordas e superfícies dos cards e do DonutChart. |
