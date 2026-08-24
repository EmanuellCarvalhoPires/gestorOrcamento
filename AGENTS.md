# 🚨 REGRAS OBRIGATÓRIAS DO WORKSPACE (ANTIGRAVITY / AGENTE IA)

> **ATENÇÃO MÁXIMA AO AGENTE DE IA:**
> Estas instruções estão injetadas diretamente no seu contexto do sistema e são de cumprimento **MANDATÓRIO E INEGOCIÁVEL** em **TODAS** as mensagens e conversas neste workspace do projeto **Gestor de Orçamento / SimpleFinances**.

---

## 🛑 1. REGRA DE OURO: DOCUMENTAÇÃO OBRIGATÓRIA DE FUNCIONALIDADES

Toda e qualquer alteração de código, criação de arquivos, refatoração ou adição de features no projeto **DEVE OBRIGATORIAMENTE** ser acompanhada da criação ou atualização do respectivo arquivo Markdown em [`.agents/funcionalidades/`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades).

### 📋 Protocolo de Execução Obrigatório a Cada Modificação:
1. **Identificar o Módulo Afetado**: Antes ou durante a alteração de qualquer código em `src/`, `server/`, scripts ou configurações, localize o arquivo correspondente em `.agents/funcionalidades/<nome_da_funcionalidade>.md`.
2. **Atualizar / Criar o Markdown Imediatamente**: Na mesma resposta em que o código for alterado, você **DEVE** editar ou criar o Markdown daquela funcionalidade.
3. **Estrutura Obrigatória de Cada Markdown**:
   - **1. Descrição e Propósito**: O que a funcionalidade faz, fluxo de uso, componentes e arquivos envolvidos.
   - **2. Impacto no Banco de Dados**: Se altera o banco (Sim/Não), se adiciona/remove/modifica dados, tabelas afetadas, esquema e requisições/operações SQL/CRUD detalhadas.
   - **3. Histórico de Versões e Modificações**: Tabela estruturada com `Versão`, `Data`, `Autor / Agente` e o `Detalhamento do que foi modificado`.
4. **Atualizar o Catálogo**: Se for criada uma nova funcionalidade, adicione o link correspondente em [`.agents/funcionalidades/README.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/README.md).

---

## 🎯 2. CONSULTA OBRIGATÓRIA AO CONTEXTO LOCAL (`.agents/`)
Antes de propor diagnósticos, planos ou alterações técnicas:
1. Inspecione os arquivos da pasta [`.agents/`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents) para respeitar a arquitetura existente.
2. Não presuma estruturas de banco, rotas ou nomes de métodos IPC: consulte [`banco_de_dados_requisicoes.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/banco_de_dados_requisicoes.md), [`server/schema.sql`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/server/schema.sql), [`src/preload.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/preload.js) e [`src/services/api.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/services/api.js).
3. Consulte as regras comerciais em [`commercial_terminology.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/rules/commercial_terminology.md) para perfis corporativos (`isComercial === true`).

---

## 📌 3. PADRÕES DE QUALIDADE E COMUNICAÇÃO
- **Links Clicáveis Obrigatórios**: Sempre referencie arquivos e pastas no formato Markdown clicável com `file:///` (ex: `[AuthView.jsx](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/AuthView.jsx)`).
- **Preservação de Código**: Mantenha comentários, tipos e docstrings intactos ao editar arquivos.
- **Registro de Logs de IA**: Registre e atualize os logs de solicitações contínuos na pasta [`.agents/logs-IA/`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/logs-IA) conforme estabelecido em [`log_solicitacoes_ia.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/rules/log_solicitacoes_ia.md).
- **Idioma**: Todas as respostas e documentações devem ser escritas em **Português**.

---

## 🗂️ 4. Mapa das Funcionalidades Registradas
- 📱 [**Guia de Migração & Versão Android Simplificada**](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/guia_migracao_android_simplificado.md)
- 🔐 [Autenticação: Login & Registro](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/auth_login_registro.md)
- 🌐 [Autenticação: Google OAuth 2.0](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/auth_google_oauth.md)
- 🔑 [Autenticação: Recuperação de Senha por E-mail](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/auth_recuperacao_senha.md)
- ✉️ [Autenticação: Verificação de E-mail](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/auth_verificacao_email.md)
- 👥 [Gestão de Usuários, Perfis & Painel Admin](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/auth_gestao_perfis_admin.md)
- 💼 [Gestão de Contas Financeiras (Multi-Contas)](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/contas_gestao.md)
- 🏷️ [Gestão de Categorias](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/categorias_gestao.md)
- 🔖 [Gestão de Etiquetas (Tags)](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/etiquetas_gestao.md)
- 🔍 [Detalhamento & Análise de Gastos por Categoria](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/categorias_detalhamento_modal.md)
- 💰 [Lançamentos de Receitas e Despesas](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/transacoes_lancamentos.md)
- 🔁 [Recorrência & Parcelamento Inteligente](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/transacoes_recorrencia_parcelamento.md)
- ✏️ [Edição e Exclusão Avançada de Lançamentos](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/transacoes_edicao_exclusao.md)
- 📊 [Tabela de Transações, Filtros & Status](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/transacoes_tabela_e_filtros.md)
- 👁️ [Visualizador & Detalhes de Transação](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/transacoes_detalhes_modal.md)
- 🏦 [Caixinha de Economia & Reserva de Lucros](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/caixinha_reserva.md)
- 📈 [Dashboard, Resumos & Gráfico Donut](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/dashboard_graficos_resumos.md)
- 📄 [Exportação de Relatórios CSV e PDF](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/exportacao_csv_pdf.md)
- 💳 [Importação de Faturas Nubank CSV](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/importacao_nubank_csv.md)
- 🎨 [Personalização de Paleta de Cores e Temas](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/configuracoes_paleta_cores.md)
- ⚙️ [Configurações Gerais & Perfil Corporativo](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/configuracoes_sistema_geral.md)
- 🗄️ [Banco de Dados PostgreSQL, APIs & IPCs](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/banco_de_dados_requisicoes.md)
