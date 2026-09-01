# 🚀 Atualizador Automático & CI/CD via GitHub Releases (electron-updater + GitHub Actions)

## 1. Descrição e Propósito
O sistema de atualização automática do **Simple Finances** combina o poder do **`electron-updater` nativo** e do fluxo contínuo de **CI/CD com GitHub Actions** para distribuir e atualizar novas versões do aplicativo de forma transparente, silenciosa e com controle total do usuário.

### Fluxo de Funcionamento:
1. **CI/CD na Nuvem (GitHub Actions)**:
   - Ao alterar a versão no [`package.json`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/package.json) e realizar o `git push` para a branch `main`, o fluxo `.github/workflows/release.yml` é disparado automaticamente.
   - O GitHub cria uma máquina virtual Windows, compila os arquivos do Vite, executa o `electron-builder` e anexa o instalador `.exe`, o arquivo de manifesto `latest.yml` e o mapa de integridade `.blockmap` diretamente na aba **Releases** do repositório ([`EmanuellCarvalhoPires/gestorOrcamento/releases`](https://github.com/EmanuellCarvalhoPires/gestorOrcamento/releases)).
2. **Detecção no Aplicativo Instalado**:
   - 2,5 segundos após abrir o aplicativo, o serviço [`updaterService.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/services/updaterService.js) consulta silenciosamente o manifesto `latest.yml` no GitHub.
3. **Notificação Visual & Modal Interativo**:
   - Se houver atualização disponível, o [`UpdateModal.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/UpdateModal.jsx) surge na tela apresentando comparativo de versões, notas de versão (*Changelog*) e o botão **"Atualizar Agora"**.
4. **Download em Segundo Plano com Progresso**:
   - Ao clicar em "Atualizar Agora", o `electron-updater` baixa o pacote diretamente dentro do app, exibindo barra de progresso em tempo real (`0% a 100%`).
5. **Reinicialização & Aplicação**:
   - Ao concluir o download, o botão muda para **"🔄 Reiniciar & Aplicar Agora"**, aplicando a nova versão instantaneamente sem necessidade de reinstalação manual pelo usuário.

### Arquivos e Componentes Envolvidos:
- [`.github/workflows/release.yml`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/.github/workflows/release.yml): Pipeline de CI/CD do GitHub Actions.
- [`electron-builder.json`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/electron-builder.json): Configuração de publicação apontando para o repositório GitHub.
- [`src/services/updaterService.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/services/updaterService.js): Gerenciador nativo de eventos do `electron-updater` com IPC handlers.
- [`src/main.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/main.js): Inicialização dos canais IPC e conexão do auto-updater com a janela principal.
- [`src/preload.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/preload.js): Exposição do `window.electronAPI` via `contextBridge`.
- [`src/components/UpdateModal.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/UpdateModal.jsx): Interface visual de notificação, progresso de download e botão de reinicialização.
- [`src/contexts/BudgetContext.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/contexts/BudgetContext.jsx): Gerenciamento global de estados de atualização e escuta de eventos nativos.
- [`src/components/SettingsModal.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/SettingsModal.jsx): Painel de atualizações manuais e diagnóstico.

---

## 2. Impacto no Banco de Dados
- **Altera o banco de dados?**: **Não**.
- Toda a orquestração e verificação de versões ocorre exclusivamente na camada da aplicação cliente e na infraestrutura do GitHub.

---

## 3. Histórico de Versões e Modificações

| Versão | Data | Autor / Agente | Detalhamento do que foi modificado |
| :--- | :--- | :--- | :--- |
| **1.0.1** | 21/08/2026 | Antigravity AI | Implementação completa da infraestrutura de CI/CD via GitHub Actions (`release.yml`), integração nativa do `electron-updater`, bridge `electronAPI`, modal com progresso percentual e auto-instalação ao reiniciar. |
| **1.1.1** | 24/08/2026 | Antigravity AI | Adicionado o botão de **Forçar Busca de Atualizações** em tempo real ignorando versões adiadas, barra de progresso dinâmico e botão para reiniciar e aplicar diretamente pelas Configurações. |
| **1.1.5** | 24/08/2026 | Antigravity AI | Implementação do **Downloader Direto de Alta Performance com Streams Node.js** e execução automática do instalador ao reiniciar, eliminando qualquer necessidade de download manual pelo navegador. |
