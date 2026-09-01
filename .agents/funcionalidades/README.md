# 📚 Catálogo Central de Documentação de Funcionalidades

Esta pasta armazena o arquivo Markdown individual e dedicado para cada componente e funcionalidade do aplicativo **Gestor de Orçamento (SimpleFinances)**, em conformidade com a [Regra de Documentação Modular](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/regra_documentacao_funcionalidades.md).

> 📱 **Novo Projeto Android / Mobile?**
> Consulte o [**Guia de Orientação para a IA: Versão Android Simplificada**](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/guia_migracao_android_simplificado.md) para entender a matriz de decisão de corte e adaptação de escopo.

---

## 🗂️ Índice Completo de Funcionalidades Documentadas

### 1. 🔐 Autenticação & Acesso
- [`auth_login_registro.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/auth_login_registro.md): Registro cadastral com senha hash (`bcrypt`), login por e-mail/senha e geração de tokens JWT.
- [`auth_google_oauth.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/auth_google_oauth.md): Fluxo de autenticação Google OAuth 2.0 via servidor loopback HTTP local temporário e troca de tokens.
- [`auth_recuperacao_senha.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/auth_recuperacao_senha.md): Recuperação de conta com envio de código numérico de 6 dígitos via SMTP/Nodemailer e redefinição de senha.
- [`auth_verificacao_email.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/auth_verificacao_email.md): Validação de autenticidade de e-mail via código temporal de 6 dígitos antes da liberação de cadastro.
- [`auth_gestao_perfis_admin.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/auth_gestao_perfis_admin.md): Painel de administração de usuários, atribuição de funções (admin/user) e exclusão total de contas.

### 2. 💼 Gestão de Contas Financeiras (Multi-Contas)
- [`contas_gestao.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/contas_gestao.md): Criação, personalização de cores, chaveamento de contas (pessoal/corporativo) e exclusão com cascata.

### 3. 🏷️ Categorias & Etiquetas
- [`categorias_gestao.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/categorias_gestao.md): Cadastro, personalização de cores em hex, reordenação e exclusão de categorias.
- [`etiquetas_gestao.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/etiquetas_gestao.md): Criação de tags/etiquetas de granularidade, reordenação e vínculos com receitas e despesas.
- [`categorias_detalhamento_modal.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/categorias_detalhamento_modal.md): Modal analítico de histórico de gastos e métricas agrupadas por categoria.

### 4. 💰 Lançamentos & Gestão de Transações
- [`transacoes_lancamentos.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/transacoes_lancamentos.md): Criação de receitas e despesas, status pago/pendente, forma de pagamento, anexos e notas.
- [`transacoes_recorrencia_parcelamento.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/transacoes_recorrencia_parcelamento.md): Motor de geração em lote de parcelas (ex: 1/10) e repetição recorrente (mensal, quinzenal, etc.).
- [`transacoes_edicao_exclusao.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/transacoes_edicao_exclusao.md): Edição granular/em lote e exclusão segura (somente atual, todas do grupo ou todas as parcelas).
- [`transacoes_tabela_e_filtros.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/transacoes_tabela_e_filtros.md): Tabela de lançamentos reativa com busca instantânea, status pago, chips visuais e ordenação.
- [`transacoes_detalhes_modal.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/transacoes_detalhes_modal.md): Modal de inspeção detalhada de dados do lançamento, comprovantes/anexos e observações.

### 5. 🏦 Caixinha de Economia & Reserva Financeira
- [`caixinha_reserva.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/caixinha_reserva.md): Dashboard da Caixinha / Reserva de Lucros, controle de aportes/resgates, taxa de rendimento e projeção patrimonial.

### 6. 📈 Dashboard & Relatórios
- [`dashboard_graficos_resumos.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/dashboard_graficos_resumos.md): Cards de resumo financeiro (Realizado vs Previsto), gráfico Donut interativo e seletores temporais.
- [`exportacao_csv_pdf.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/exportacao_csv_pdf.md): Motor de exportação de dados em planilhas CSV e documentos PDF formatados com totais.

### 7. 💳 Integrações Bancárias
- [`importacao_nubank_csv.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/importacao_nubank_csv.md): Importador inteligente de extratos Nubank em CSV com detecção de parcelas e autocategorização.

### 8. 🎨 Personalização & Sistema
- [`configuracoes_paleta_cores.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/configuracoes_paleta_cores.md): Seletor de paletas pré-definidas e customização de tema com persistência no banco e injeção em CSS root.
- [`configuracoes_sistema_geral.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/configuracoes_sistema_geral.md): Modal de configurações globais, perfil corporativo vs individual e gerenciamento de preferências.
- [`atualizacao_automatica_github.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/atualizacao_automatica_github.md): Buscador e notificador de novas versões do aplicativo via GitHub Releases com download em um clique.

### 9. 🗄️ Arquitetura de Dados & Camada de Persistência
- [`banco_de_dados_requisicoes.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/funcionalidades/banco_de_dados_requisicoes.md): Mapeamento exaustivo de todas as tabelas PostgreSQL, consultas SQL, endpoints REST e canais IPC.

---

> **Diretriz de Manutenção:** Sempre que qualquer código-fonte for modificado no projeto, o arquivo Markdown correspondente nesta pasta DEVE ser atualizado com o novo impacto e incremento na tabela de histórico de versões.
