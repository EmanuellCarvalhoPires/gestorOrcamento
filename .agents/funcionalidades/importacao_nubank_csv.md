# 💳 Importação de Faturas Nubank CSV

## 1. Descrição e Propósito
- **O que a funcionalidade faz:** Permite que o usuário importe extratos e faturas de cartão de crédito exportadas do aplicativo Nubank no formato `.csv`, convertendo automaticamente os lançamentos em despesas ou receitas no aplicativo com categorização inteligente e detecção de compras parceladas.
- **Fluxo de Utilização:**
  1. O usuário clica em "Importar Fatura Nubank" no modal de configurações ou ações.
  2. Seleciona o arquivo `.csv` baixado do Nubank.
  3. O parser utilitário (`nubankCsvParser.js`) processa o arquivo:
     - Lê as colunas padrão (`date`, `title`, `amount`, `category`).
     - Detecta pagamentos de fatura (estornos/pagamentos de fatura como receitas ou ignorados para não duplicar).
     - Identifica compras parceladas pelo título (ex: "Mercado Livre - Parcela 01/05").
     - Sugere categorias correspondentes baseadas nas regras de palavras-chave.
  4. Apresenta uma tela de pré-visualização para o usuário revisar e confirmar os itens.
  5. O backend insere os lançamentos no PostgreSQL vinculados à conta selecionada, evitando registros duplicados.
- **Componentes e Arquivos Envolvidos:**
  - Utilitário de Parser: [`src/utils/nubankCsvParser.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/utils/nubankCsvParser.js)
  - Interface do usuário: [`src/components/SettingsModal.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/SettingsModal.jsx)
  - Preload IPC: [`src/preload.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/preload.js) (`importarTransacoesNubankCSV`)
  - Processo Principal Electron: [`src/main.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/main.js)
  - Rotas Backend API: [`server/routes/financeRoutes.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/server/routes/financeRoutes.js)

## 2. Impacto no Banco de Dados
- **Altera o banco de dados?** Sim.
- **Adiciona/Remove dados?** Sim (insere em lote novos registros nas tabelas `despesas` e `receitas`).
- **Tabelas afetadas**: `despesas`, `receitas`.
- **Operações detalhadas**:
  - **Create (em lote)**:
    - `INSERT INTO despesas (usuario_id, conta_id, descricao, valor, data, categoria, etiqueta, tipo_pagamento, pago) VALUES ($1, $2, $3, $4, $5, $6, $7, 'Cartão de Crédito', true);`

## 3. Histórico de Versões e Modificações
| Versão | Data | Autor / Agente | O que foi modificado / Adicionado |
| :--- | :--- | :--- | :--- |
| `v1.0.0` | 2026-08-17 | Antigravity AI | Documentação do parser de extratos Nubank, mapeamento de regras de autocategorização e importação em lote. |
