# 📋 Regra Obrigatória: Documentação Modular de Funcionalidades

Esta regra define a obrigatoriedade de criação e manutenção contínua de um arquivo Markdown individual para **cada funcionalidade/módulo** do projeto **Gestor de Orçamento (SimpleFinances)**.

---

## 🎯 Objetivo e Diretriz Central
- **Um Markdown por Funcionalidade**: Toda funcionalidade, serviço, módulo ou componente principal do aplicativo deve possuir um arquivo Markdown exclusivo dedicado.
- **Localização Centralizada**: Todos os arquivos de documentação de funcionalidades devem ficar centralizados na pasta:
  📁 [`.agents/funcionalidades/`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades)
- **Atualização Contínua Obrigatória**: Sempre que uma funcionalidade for criada, refatorada ou editada no código-fonte, o Markdown correspondente **DEVE** ser atualizado imediatamente com as novas alterações e o histórico de versão incrementado.

---

## 📐 Estrutura Obrigatória de Cada Markdown de Funcionalidade

Cada arquivo em `.agents/funcionalidades/<nome_da_funcionalidade>.md` deve seguir rigorosamente a estrutura abaixo:

```markdown
# [Nome da Funcionalidade]

## 1. Descrição e Propósito
- O que a funcionalidade faz?
- Qual problema ela resolve e qual é o fluxo de utilização pelo usuário ou sistema?
- Componentes e arquivos envolvidos (`src/...`, `server/...`, `electron/preload.js`, etc.).

## 2. Impacto no Banco de Dados
- **Altera o banco de dados?** (Sim / Não)
- **Adiciona/Remove dados?** (Sim / Não)
- **Tabelas afetadas**: (ex: `usuarios`, `contas`, `categorias`, `etiquetas`, `receitas`, `despesas`, `refresh_tokens`)
- **Operações detalhadas**:
  - Inserções (Create)
  - Consultas (Read)
  - Modificações (Update)
  - Exclusões (Delete)
  - Esquema/Estrutura das tabelas e campos manipulados

## 3. Histórico de Versões e Modificações
| Versão | Data | Autor / Agente | O que foi modificado / Adicionado |
| :--- | :--- | :--- | :--- |
| `v1.0.0` | YYYY-MM-DD | ... | Criação inicial da funcionalidade. |
| `v1.1.0` | YYYY-MM-DD | ... | Detalhamento da alteração realizada... |
```

---

## 🗂️ Mapeamento de Funcionalidades e Componentes do Projeto

O agente deve garantir que existam markdowns para **TODAS** as funcionalidades do aplicativo dentro de `.agents/funcionalidades/`, incluindo:

1. **Autenticação & Controle de Acesso**:
   - `auth_login_registro.md`: Registro de usuários e login com e-mail/senha.
   - `auth_google_oauth.md`: Integração e autenticação OAuth 2.0 via Google.
   - `auth_recuperacao_senha.md`: Recuperação e redefinição de senha por código de 6 dígitos via SMTP.
   - `auth_verificacao_email.md`: Verificação e ativação de e-mail por código.
   - `auth_gestao_perfis_admin.md`: Painel de administração de usuários e exclusão de conta.

2. **Gestão de Contas & Multi-Contas**:
   - `contas_gestao.md`: Criação, customização de cores, alternância e deleção de contas financeiras.

3. **Categorias & Etiquetas**:
   - `categorias_gestao.md`: Gerenciamento, ordenação e customização de cores de categorias.
   - `etiquetas_gestao.md`: Gerenciamento e ordenação de tags/etiquetas de lançamentos.
   - `categorias_detalhamento_modal.md`: Modal analítico de despesas por categoria.

4. **Lançamentos & Transações Financeiras**:
   - `transacoes_lancamentos.md`: Lançamentos de receitas e despesas com status pago/pendente.
   - `transacoes_recorrencia_parcelamento.md`: Lançamentos fixos/recorrentes e parcelamento automático.
   - `transacoes_edicao_exclusao.md`: Edição simples/em lote e exclusão seletiva de transações.
   - `transacoes_tabela_e_filtros.md`: Tabela de transações com busca, filtros mensais e badges.
   - `transacoes_detalhes_modal.md`: Modal de visualização completa da transação e anexos.

5. **Reserva Financeira / Caixinha**:
   - `caixinha_reserva.md`: Painel da Caixinha / Reserva de Lucros, saldo inicial, aportes/resgates e projeção de rendimento.

6. **Relatórios, Gráficos & Dashboards**:
   - `dashboard_graficos_resumos.md`: Cards de resumo, balanço, forecast e gráfico Donut.
   - `exportacao_csv_pdf.md`: Exportação de relatórios tabulares em CSV e relatórios analíticos em PDF.

7. **Importação Bancária**:
   - `importacao_nubank_csv.md`: Parser inteligente e importação de faturas Nubank.

8. **Personalização & Configurações**:
   - `configuracoes_paleta_cores.md`: Editor e persistência de paletas de cores e temas.
   - `configuracoes_sistema_geral.md`: Preferências do usuário, alternância de perfil corporativo.

9. **Banco de Dados & Armazenamento**:
   - `banco_de_dados_requisicoes.md`: Mapeamento de todas as tabelas, consultas SQL, rotas REST e canais IPC.

---

## ⚡ Regra de Execução do Agente
1. Ao implementar ou modificar código em qualquer funcionalidade:
   - Identifique o Markdown correspondente em `.agents/funcionalidades/`.
   - Se o Markdown não existir, crie-o imediatamente com a estrutura padrão.
   - Se já existir, documente a nova modificação na seção de **Impacto no Banco de Dados** (se aplicável) e adicione uma nova entrada na tabela de **Histórico de Versões**.
