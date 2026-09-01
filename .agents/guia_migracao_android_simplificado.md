# 📱 Guia de Orientação para a IA: Criação do App Android Simplificado

> **Para a IA que está lendo este documento:**
> Você está encarregada de desenvolver a versão **Mobile Android** do aplicativo **Gestor de Orçamento (SimpleFinances)**. Este guia foi elaborado para fornecer a você todo o contexto do projeto desktop original, ensinar a interpretar a documentação existente e definir os critérios de **simplificação drástica de escopo** para a criação de um aplicativo Android leve, intuitivo e focado no essencial.

---

## 🎯 1. Visão Geral do Projeto Original (Versão Desktop)

O **SimpleFinances / Gestor de Orçamento** é um aplicativo financeiro pessoal e comercial desenvolvido originalmente para Desktop com **Electron**, **React** e banco de dados **PostgreSQL** hospedado na nuvem Oracle Cloud (`147.15.21.81:3000`).

### 📂 Onde Encontrar o Conhecimento do Projeto:
- **Catálogo Central de Funcionalidades**: [`.agents/funcionalidades/README.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/README.md)
- **Esquema de Banco e Endpoints REST**: [`.agents/funcionalidades/banco_de_dados_requisicoes.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/banco_de_dados_requisicoes.md)
- **Schema DDL Original**: [`server/schema.sql`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/server/schema.sql)
- **Serviço de Conexão com a API REST**: [`src/services/api.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/services/api.js)

---

## 📖 2. Como Interpretar a Documentação Existente

Na pasta [`.agents/funcionalidades/`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades), cada funcionalidade está descrita em um arquivo Markdown estruturado em 3 seções obrigatórias:
1. **Descrição e Propósito**: Explica o que a feature faz, qual problema resolve e os componentes envolvidos.
2. **Impacto no Banco de Dados**: Mostra exatamente quais tabelas (`usuarios`, `contas`, `categorias`, `etiquetas`, `receitas`, `despesas`) são afetadas e as consultas SQL/CRUD executadas.
3. **Histórico de Versões**: Mostra o histórico evolutivo daquele módulo.

---

## 🚀 3. O Objetivo do Novo Projeto Android

O aplicativo Android **NÃO DEVE** ser um clone complexo do aplicativo desktop. A experiência mobile exige **agilidade, facilidade de toque, carregamento instantâneo e foco no registro rápido de gastos do dia a dia**.

### Diretrizes Centrais do App Android:
- **Menos é Mais**: Eliminar ferramentas pesadas de desktop (como importação de arquivos locais CSV, geradores de PDF avançados e painéis administrativos complexos).
- **Mobile-First UX**: Telas limpas, botões de ação rápida (FAB - Floating Action Button para adicionar despesa/receita), navegação por abas inferiores (Bottom Navigation) e feedback tátil.
- **Comunicação 100% via API REST**: No Desktop, o Electron usa canais IPC locais (`ipcRenderer.invoke`). No Android, o aplicativo deve se comunicar **exclusivamente via requisições HTTP REST com o backend** (`http://147.15.21.81:3000/api` ou endpoint configurado), utilizando autenticação por cabeçalho `Bearer <accessToken>` e renovação com `refreshToken`.

---

## ⚖️ 4. Matriz de Decisão: O que Manter vs O que Remover

Abaixo está a definição clara do que entra no escopo do **App Android Simplificado (MVP)** e o que deve ser **descartado ou adiado**:

| Módulo / Funcionalidade Desktop | Incluir no Android? | Como Deve ser no Android (Adaptação Simplificada) | Documentação de Referência |
| :--- | :---: | :--- | :--- |
| **Login & Cadastro** | ✅ **SIM** | Tela simples e limpa de Login (E-mail e Senha) e Registro. Armazenar JWT de forma segura no dispositivo. | [`auth_login_registro.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/auth_login_registro.md) |
| **Google OAuth 2.0** | ⚠️ *Opcional* | Pode ser simplificado ou mantido apenas login direto no MVP para acelerar o desenvolvimento inicial. | [`auth_google_oauth.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/auth_google_oauth.md) |
| **Recuperação de Senha** | ✅ **SIM** | Fluxo direto de solicitação de código de 6 dígitos por e-mail e redefinição. | [`auth_recuperacao_senha.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/auth_recuperacao_senha.md) |
| **Painel Admin & Gestão de Usuários** | ❌ **NÃO** | **Remover totalmente**. O app mobile é para o usuário final gerenciar suas finanças. | [`auth_gestao_perfis_admin.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/auth_gestao_perfis_admin.md) |
| **Lançamentos Rápidos (Receitas/Despesas)** | ✅ **SIM** | **Core do App**. Formulário ágil: Valor, Tipo (Receita/Despesa), Categoria, Data e Status (Pago/Pendente). | [`transacoes_lancamentos.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/transacoes_lancamentos.md) |
| **Recorrência & Parcelamento** | 🔄 **SIM (Básico)** | Permitir marcar se o lançamento é parcelado (inserir quantidade de parcelas) de forma simplificada. | [`transacoes_recorrencia_parcelamento.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/transacoes_recorrencia_parcelamento.md) |
| **Tabela/Lista de Transações** | ✅ **SIM** | Lista rolável vertical infinita/mensal, com chips de categoria, valores coloridos (verde/vermelho) e swipe para deletar/editar. | [`transacoes_tabela_e_filtros.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/transacoes_tabela_e_filtros.md) |
| **Dashboard & Resumo Financeiro** | ✅ **SIM (Compacto)** | Cabeçalho com 3 métricas essenciais: **Receitas**, **Despesas** e **Saldo Líquido**. Seletor de Mês simplificado. | [`dashboard_graficos_resumos.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/dashboard_graficos_resumos.md) |
| **Gráfico Donut de Despesas** | 🔄 **SIM (Simples)** | Gráfico compacto de rosca ou barras mostrando as top 5 categorias com maiores gastos. | [`dashboard_graficos_resumos.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/dashboard_graficos_resumos.md) |
| **Gestão de Categorias** | 🔄 **SIM (Básico)** | Seleção de categorias pré-existentes. Criação rápida de novas categorias com seletor básico de cores. | [`categorias_gestao.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/categorias_gestao.md) |
| **Multi-Contas Complexo** | ❌ **NÃO** | **Simplificar**. No Android, focar na conta principal padrão do usuário para evitar sobrecarga cognitiva. | [`contas_gestao.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/contas_gestao.md) |
| **Importação de Faturas Nubank CSV** | ❌ **NÃO** | **Remover**. Funcionalidade impraticável e dispensável no fluxo mobile inicial. | [`importacao_nubank_csv.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/importacao_nubank_csv.md) |
| **Exportação de PDF / CSV** | ❌ **NÃO** | **Remover do MVP**. A geração de relatórios complexos é mantida no Desktop. | [`exportacao_csv_pdf.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/exportacao_csv_pdf.md) |
| **Editor Avançado de Paleta de Cores** | ❌ **NÃO** | **Remover**. Adotar apenas tema padrão moderno com suporte automático a Modo Claro e Modo Escuro nativo do sistema. | [`configuracoes_paleta_cores.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/configuracoes_paleta_cores.md) |
| **Caixinha / Reserva de Emergência** | 🔄 *Opcional / Reduzido* | Se incluído, exibir apenas como um card informativo de saldo guardado, sem simulação complexa de gráficos compostos. | [`caixinha_reserva.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/caixinha_reserva.md) |

---

## 🛠️ 5. Arquitetura Técnica Sugerida para o App Android

### 📱 Camada Frontend Mobile:
- **Tecnologia Recomendada**: React Native (com Expo) ou Flutter / Kotlin / PWA responsivo.
- **Gerenciamento de Estado**: Context API ou Zustand (espelhando a lógica limpa de [`BudgetContext.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/contexts/BudgetContext.jsx)).
- **Armazenamento Seguro de Tokens**: `expo-secure-store` / `AsyncStorage` / `EncryptedSharedPreferences`.

### 🌐 Camada de Conexão com o Backend:
Consumir diretamente os endpoints existentes da API Express já documentados em [`banco_de_dados_requisicoes.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/banco_de_dados_requisicoes.md):
- `POST /api/auth/login` - Autenticação por e-mail e senha.
- `POST /api/auth/register` - Registro de novo usuário.
- `POST /api/auth/refresh` - Renovação de token JWT expirado.
- `GET /api/transacoes?mes=MM&ano=AAAA` - Listagem de receitas e despesas do mês.
- `POST /api/transacoes` - Adicionar novo lançamento.
- `PUT /api/transacoes/:id` - Atualizar lançamento ou alternar status pago.
- `DELETE /api/transacoes/:id` - Remover lançamento.
- `GET /api/categorias` - Listar categorias disponíveis.
- `POST /api/categorias` - Criar nova categoria.

---

## 📋 6. Roteiro Passo a Passo para o Agente de IA Executar

Ao iniciar a criação do projeto Android, siga esta ordem de execução:

1. **Passo 1 - Autenticação e Sessão**:
   - Criar as telas de **Login** e **Cadastro**.
   - Configurar o cliente HTTP (`fetch` / `axios`) com interceptor para injetar o `Bearer Token` e tratar `refresh_token` automático.
2. **Passo 2 - Dashboard Principal Mobile**:
   - Criar a tela inicial contendo o seletor de mês/ano no topo.
   - Exibir os 3 cards de resumo financeiro: **Entradas**, **Saídas** e **Saldo Líquido**.
   - Adicionar o botão de ação flutuante (**+**) para abrir o modal/tela de novo lançamento.
3. **Passo 3 - Lista de Transações (Extrato)**:
   - Renderizar as transações ordenadas cronologicamente.
   - Permitir tocar no item para ver detalhes/editar ou tocar no checkbox para marcar como pago.
4. **Passo 4 - Modal de Lançamento Ágil**:
   - Campos: Tipo (Receita/Despesa), Valor numérico com máscara monetária, Descrição, Categoria e Data.
   - Opção simples para parcelamento (ex: "Repetir em X parcelas").
5. **Passo 5 - Perfil e Configurações Básicas**:
   - Exibir nome e e-mail do usuário conectado.
   - Botão para **Sair da Conta (Logout)**.

---

> **💡 Conclusão para a IA**: Utilize este documento como seu norte estratégico. Consulte os arquivos em [`.agents/funcionalidades/`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades) sempre que precisar entender como uma regra de negócio ou campo do banco de dados funciona, mas **nunca perca de vista a simplicidade e a usabilidade ágil do ambiente mobile**.
