# 🎨 Personalização de Paleta de Cores e Temas

## 1. Descrição e Propósito
- **O que a funcionalidade faz:** Sistema de tematização dinâmica e personalização visual da interface do usuário. Permite que o usuário selecione paletas de cores pré-definidas (ex: *👑 Dourado Nobre*, *🌿 Esmeralda Cyber*, *⚡ Ciano Tech*, *🔮 Violeta Amethyst*, *🌅 Sunset Coral*, *🌊 Azul Oceano*, *☀️ Modo Claro Elegante*) ou personalize individualmente cada token visual (Fundo Principal, Fundo de Cards, Superfície, Cor de Destaque / Accent e Texto). As cores são persistidas no banco de dados por conta e aplicadas imediatamente às variáveis globais CSS (`:root`).
- **Fluxo de Utilização:**
  1. O usuário acessa o menu de Temas e Aparência dentro de `SettingsModal.jsx`.
  2. Pode clicar em qualquer cartão de tema pré-definido para aplicá-lo instantaneamente em tempo real.
  3. Pode usar os seletores de cor (color pickers hexadecimais) para ajustes finos.
  4. O sistema executa a função `aplicarVariaveisCSS()` atualizando as variáveis de ambiente CSS (`--bg-primary`, `--card-bg`, `--surface-bg`, `--accent-color`, `--text-primary`, etc.).
  5. Clica em "Salvar Paleta" para persistir a configuração na coluna `paleta_cores` da conta no PostgreSQL.
- **Componentes e Arquivos Envolvidos:**
  - Interface do usuário: [`src/components/SettingsModal.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/SettingsModal.jsx)
  - Contexto Global: [`src/contexts/BudgetContext.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/contexts/BudgetContext.jsx) (`PALETAS_PREDEFINIDAS`, `aplicarVariaveisCSS`)
  - Preload IPC: [`src/preload.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/preload.js) (`salvarPaletaCores`, `carregarPaletaCores`)
  - Processo Principal Electron: [`src/main.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/main.js)
  - Folha de Estilos: [`src/index.css`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/index.css)

## 2. Impacto no Banco de Dados
- **Altera o banco de dados?** Sim.
- **Adiciona/Remove dados?** Modifica a coluna de paleta de cores na tabela `contas`.
- **Tabelas afetadas**: `contas`.
- **Operações detalhadas**:
  - **Read**:
    - `SELECT paleta_cores FROM contas WHERE id = $1;`
  - **Update**:
    - `UPDATE contas SET paleta_cores = $1 WHERE id = $2;` (armazena JSON serializado com os códigos hex).

## 3. Histórico de Versões e Modificações
| Versão | Data | Autor / Agente | O que foi modificado / Adicionado |
| :--- | :--- | :--- | :--- |
| `v1.0.0` | 2026-08-17 | Antigravity AI | Documentação do motor de estilização CSS reativa, paletas pré-definidas e persistência de tema por conta. |
