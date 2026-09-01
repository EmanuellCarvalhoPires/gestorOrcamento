# 🚨 REGRAS OBRIGATÓRIAS DO WORKSPACE (ANTIGRAVITY / AGENTE IA)

> **ATENÇÃO MÁXIMA AO AGENTE DE IA:**
> Estas instruções são de cumprimento **MANDATÓRIO E INEGOCIÁVEL** em **TODAS** as mensagens e conversas neste workspace do projeto **Gestor de Orçamento / SimpleFinances**.

---

## 🛑 1. REGRA DE OURO: DOCUMENTAÇÃO OBRIGATÓRIA DE FUNCIONALIDADES

Toda e qualquer alteração de código, criação de arquivos, refatoração ou adição de features no projeto **DEVE OBRIGATORIAMENTE** ser acompanhada da criação ou atualização do respectivo arquivo Markdown em [`.agents/funcionalidades/`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades).

### 📋 Protocolo de Execução Obrigatório a Cada Modificação:
1. **Identificar o Módulo Afetado**: Antes ou durante a alteração de qualquer código em `src/`, `server/` ou scripts, localize o arquivo correspondente em `.agents/funcionalidades/<nome_da_funcionalidade>.md`.
2. **Atualizar / Criar o Markdown Imediatamente**: Na mesma resposta em que o código for alterado, você **DEVE** editar ou criar o Markdown daquela funcionalidade.
3. **Estrutura Obrigatória de Cada Markdown**:
   - **1. Descrição e Propósito**: O que a funcionalidade faz, fluxo de uso, componentes e arquivos envolvidos.
   - **2. Impacto no Banco de Dados**: Se altera o banco (Sim/Não), se adiciona/remove/modifica dados, tabelas afetadas, esquema e requisições/operações SQL/CRUD detalhadas.
   - **3. Histórico de Versões e Modificações**: Tabela estruturada com `Versão`, `Data`, `Autor / Agente` e o `Detalhamento do que foi modificado`.
4. **Atualizar o Catálogo**: Se for criada uma nova funcionalidade, adicione o link correspondente em [`.agents/funcionalidades/README.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/README.md).

---

## 🎯 2. CONSULTA OBRIGATÓRIA AO CONTEXTO LOCAL (`.agents/`)
Antes de propor diagnósticos, planos ou alterações técnicas complexas:
1. Inspecione os arquivos da pasta [`.agents/`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents) para respeitar a arquitetura existente.
2. Não presuma estruturas de banco ou nomes de métodos: consulte [`banco_de_dados_requisicoes.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/banco_de_dados_requisicoes.md), [`server/schema.sql`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/server/schema.sql) e [`src/preload.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/preload.js).
3. Consulte e respeite o vocabulário corporativo de [`commercial_terminology.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/rules/commercial_terminology.md).

---

## 📌 3. PADRÕES DE QUALIDADE E COMUNICAÇÃO
- **Links Clicáveis Obrigatórios**: Sempre referencie arquivos e pastas no formato Markdown clicável com `file:///` (ex: `[nome.jsx](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/...)`).
- **Preservação de Código**: Mantenha comentários, tipos e docstrings intactos ao editar arquivos.
- **Registro de Logs de IA**: Registre e atualize os logs na pasta [`.agents/logs-IA/`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/logs-IA).
- **Idioma**: Todas as respostas e documentações devem ser escritas em **Português**.
