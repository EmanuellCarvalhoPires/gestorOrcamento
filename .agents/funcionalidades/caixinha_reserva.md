# 🏦 Caixinha de Economia & Reserva Financeira (Reserva de Lucros)

## 1. Descrição e Propósito
- **O que a funcionalidade faz:** Proporciona um ecossistema completo para gestão de poupança, reserva de emergência ou reserva corporativa de lucros (`CaixinhaDashboard.jsx`). Permite configurar saldo inicial, ativar/desativar o módulo por conta, definir metas, calcular e projetar rendimentos automáticos (com taxa % ao ano/mês e índice de referência como CDI/Selic) e visualizar a curva de evolução patrimonial via gráfico interativo (`CaixinhaChart.jsx`).
- **Fluxo de Utilização:**
  1. O usuário acessa a aba "Caixinha" (ou "Reserva de Lucros" em contas comerciais).
  2. Pode ativar a caixinha e definir o saldo inicial acumulado.
  3. Pode configurar a taxa de rendimento estimada (ex: 100% CDI ou 0.8% a.m.).
  4. Lançamentos com a flag `eh_reserva = 1` (ou categoria configurada como reserva) são contabilizados automaticamente como depósitos/aportes ou resgates da caixinha.
  5. O dashboard exibe métricas: Saldo Atual Guardado, Aportes no Mês, Rendimento Acumulado e Projeção para 6, 12 e 24 meses.
  6. O gráfico de linha/área (`CaixinhaChart.jsx`) plota o histórico real de evolução somado aos juros compostos calculados.
- **Componentes e Arquivos Envolvidos:**
  - Interface do usuário: [`src/components/CaixinhaDashboard.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/CaixinhaDashboard.jsx), [`src/components/CaixinhaChart.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/CaixinhaChart.jsx)
  - Preload IPC: [`src/preload.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/preload.js) (`obterTotalCaixinha`, `obterHistoricoCaixinha`, `salvarConfiguracaoCaixinha`)
  - Processo Principal Electron: [`src/main.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/main.js)
  - Contexto: [`src/contexts/BudgetContext.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/contexts/BudgetContext.jsx)

## 2. Impacto no Banco de Dados
- **Altera o banco de dados?** Sim.
- **Adiciona/Remove dados?** Modifica as configurações de caixinha da conta na tabela `contas` e lê/grava transações marcadas com `eh_reserva`.
- **Tabelas afetadas**: `contas`, `receitas`, `despesas`.
- **Operações detalhadas**:
  - **Read**:
    - `SELECT caixinha_ativa, caixinha_saldo_inicial, caixinha_rendimento_taxa, caixinha_rendimento_periodo FROM contas WHERE id = $1;`
    - `SELECT SUM(valor) FROM receitas WHERE conta_id = $1 AND eh_reserva = 1;`
    - `SELECT SUM(valor) FROM despesas WHERE conta_id = $1 AND eh_reserva = 1;`
    - `SELECT data, valor, 'aporte' as tipo FROM receitas WHERE conta_id = $1 AND eh_reserva = 1 UNION ALL SELECT data, valor, 'resgate' as tipo FROM despesas WHERE conta_id = $1 AND eh_reserva = 1 ORDER BY data ASC;`
  - **Update**:
    - `UPDATE contas SET caixinha_ativa = $1, caixinha_saldo_inicial = $2, caixinha_rendimento_taxa = $3, caixinha_rendimento_periodo = $4 WHERE id = $5;`

## 3. Histórico de Versões e Modificações
| Versão | Data | Autor / Agente | O que foi modificado / Adicionado |
| :--- | :--- | :--- | :--- |
| `v1.2.0` | 2026-08-21 | Antigravity AI | Exibição inteligente do ano ativo/atual no seletor de anos (`YearSelector.jsx`) mesmo quando a aba "Caixinha" estiver selecionada, permitindo navegação rápida e alternância direta de volta aos lançamentos. |
| `v1.1.0` | 2026-08-21 | Antigravity AI | Refinamento estrutural de UI/UX em `CaixinhaDashboard.jsx` e `CaixinhaChart.jsx`: substituição da fileira de 4 botões amarelos por segmented switches integrados, remoção de emojis arbitrários, correção gramatical nos horizontes (singular/plural), redução da régua de períodos para atalhos essenciais (1m, 3m, 6m, 12m, 24m, 36m), destaque primário para o Saldo Final Estimado, eliminação de frases redundantes e suavização dos estados vazios sem ícones destoantes. |
| `v1.0.1` | 2026-08-17 | Antigravity AI | Gráfico da Caixinha (`CaixinhaChart.jsx`) 100% migrado para variáveis CSS temáticas (suporte perfeito ao Modo Claro e temas customizados) e navegação aprimorada ao clicar em meses na barra superior. |
| `v1.0.0` | 2026-08-17 | Antigravity AI | Documentação do módulo de Caixinha / Reserva de Lucros, cálculo de juros compostos, configuração por conta e gráfico patrimonial. |
