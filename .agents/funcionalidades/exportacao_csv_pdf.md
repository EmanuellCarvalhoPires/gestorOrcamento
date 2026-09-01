# 📄 Exportação de Relatórios CSV e PDF

## 1. Descrição e Propósito
- **O que a funcionalidade faz:** Gera arquivos de exportação e relatórios financeiros nos formatos CSV (compatível com Excel / Google Sheets com UTF-8 BOM e separador customizado) e PDF profissional formatado (com resumo de totais, balanço mensal, distribuição por categorias e tabelas de lançamentos). Permite escolher o período de exportação (mês atual, ano completo ou intervalo customizado).
- **Fluxo de Utilização:**
  1. O usuário clica na opção "Exportar Relatório" em `SettingsModal.jsx` ou na barra de ações.
  2. Seleciona o formato desejado (`CSV` ou `PDF`) e define o modo de período (ex: Mês Selecionado vs Todos os Meses do Ano).
  3. Para CSV: o processo principal (`src/main.js`) monta o arquivo com cabeçalhos padronizados (`Data;Tipo;Descrição;Categoria;Etiqueta;Valor;Forma Pagamento;Status`) e dispara o diálogo nativo do sistema operacional (`dialog.showSaveDialog`) para salvar o arquivo `.csv`.
  4. Para PDF: o sistema renderiza uma janela HTML estilizada oculta ou gera o PDF via Electron printing/pdfkit com cabeçalho corporativo, cores das categorias e fechamento contábil, salvando o `.pdf` no local selecionado.
- **Componentes e Arquivos Envolvidos:**
  - Interface do usuário: [`src/components/SettingsModal.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/SettingsModal.jsx)
  - Preload IPC: [`src/preload.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/preload.js) (`exportarCSV`, `exportarPDF`)
  - Processo Principal Electron: [`src/main.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/main.js)
  - Contexto: [`src/contexts/BudgetContext.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/contexts/BudgetContext.jsx)

## 2. Impacto no Banco de Dados
- **Altera o banco de dados?** Não (somente leitura dos lançamentos para composição dos relatórios).
- **Adiciona/Remove dados?** Não.
- **Tabelas afetadas**: `receitas`, `despesas`, `categorias`, `usuarios` (leitura).

## 3. Histórico de Versões e Modificações
| Versão | Data | Autor / Agente | O que foi modificado / Adicionado |
| :--- | :--- | :--- | :--- |
| `v1.0.0` | 2026-08-17 | Antigravity AI | Documentação do motor de exportação de planilhas CSV com UTF-8 BOM e geração de relatórios PDF com layout executivo. |
