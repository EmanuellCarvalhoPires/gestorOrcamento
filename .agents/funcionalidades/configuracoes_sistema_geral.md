# ⚙️ Configurações Gerais & Perfil Corporativo

## 1. Descrição e Propósito
- **O que a funcionalidade faz:** Centraliza as configurações do aplicativo e preferências de conta do usuário (`SettingsModal.jsx`). Permite alternar e visualizar o Perfil de Uso ativo (**Individual / Pessoal** vs **Comercial / Corporativo**). Quando o perfil é Comercial (`isComercial === true`), a interface inteira adapta automaticamente sua terminologia para o vocabulário financeiro corporativo conforme definido em [`commercial_terminology.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/rules/commercial_terminology.md) (ex: "Faturamento" em vez de "Receita", "Custos" em vez de "Despesas", "Reserva de Lucros" em vez de "Caixinha", "Cliente/Produto" em vez de "Nome").
- **Fluxo de Utilização:**
  1. O usuário clica no ícone de engrenagem no cabeçalho.
  2. O modal `SettingsModal.jsx` é exibido com abas de navegação (Aparência/Cores, Perfil & Conta, Exportação, Importação Nubank, Gestão de Categorias e Administração).
  3. O usuário pode alterar dados do perfil, consultar a versão do aplicativo, visualizar o status da conexão com a nuvem/banco de dados e gerenciar preferências.
- **Componentes e Arquivos Envolvidos:**
  - Interface do usuário: [`src/components/SettingsModal.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/SettingsModal.jsx), [`src/components/UserProfileHeader.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/UserProfileHeader.jsx)
  - Contexto: [`src/contexts/BudgetContext.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/contexts/BudgetContext.jsx)
  - Regra Comercial: [`commercial_terminology.md`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.agents/rules/commercial_terminology.md)

## 2. Impacto no Banco de Dados
- **Altera o banco de dados?** Sim (quando altera perfil ou configurações).
- **Adiciona/Remove dados?** Modifica registros na tabela `usuarios`.
- **Tabelas afetadas**: `usuarios`.
- **Operações detalhadas**:
  - **Read**:
    - `SELECT id, nome, email, perfil_uso, is_admin FROM usuarios WHERE id = $1;`
  - **Update**:
    - `UPDATE usuarios SET perfil_uso = $1 WHERE id = $2;`

## 3. Histórico de Versões e Modificações
| Versão | Data | Autor / Agente | O que foi modificado / Adicionado |
| :--- | :--- | :--- | :--- |
| `v1.0.0` | 2026-08-17 | Antigravity AI | Documentação do hub de configurações gerais e do motor de adaptação dinâmica de vocabulário comercial/corporativo. |
| `v1.1.0` | 2026-08-21 | Antigravity AI | Refinamento estrutural de UI/UX em `SettingsModal.jsx`: remoção completa de emojis do menu lateral e cabeçalhos, suavização de badges (Admin/Caixinha), calibração de contraste em botões de ação e zona de perigo (vermelho puro), hierarquização visual da Caixinha com destaque para o total guardado e unificação de textos de apoio. |
