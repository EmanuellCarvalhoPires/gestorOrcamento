# ✉️ Autenticação: Verificação de E-mail

## 1. Descrição e Propósito
- **O que a funcionalidade faz:** Garante a legitimidade e a posse do endereço de e-mail antes do cadastro do usuário, prevenindo cadastros fraudulentos ou e-mails com erro de digitação.
- **Fluxo de Utilização:**
  1. No formulário de cadastro de `AuthView.jsx`, antes da gravação final, é chamado o validador de sintaxe e domínio de e-mail (`emailValidator.js`).
  2. O backend gera um código temporal de 6 dígitos e despacha via Nodemailer para o e-mail informado.
  3. O modal de inserção de código é exibido para o usuário com temporizador de expiração.
  4. Ao inserir o código correto, a flag de verificação é confirmada e o fluxo de registro é concluído com sucesso.
- **Componentes e Arquivos Envolvidos:**
  - Interface do usuário: [`src/components/AuthView.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/AuthView.jsx)
  - Validador utilitário: [`src/utils/emailValidator.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/utils/emailValidator.js)
  - Preload IPC: [`src/preload.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/preload.js) (`enviarCodigoVerificacao`, `validarCodigoVerificacao`)
  - Processo Principal Electron: [`src/main.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/main.js)
  - Serviço de E-mail: [`server/services/emailService.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/server/services/emailService.js)

## 2. Impacto no Banco de Dados
- **Altera o banco de dados?** Não diretamente (os códigos ficam em mapa de memória com expiração TTL de 15 minutos).
- **Adiciona/Remove dados?** Apenas consulta prévia para verificar se o e-mail já existe na tabela `usuarios`.
- **Tabelas afetadas**: `usuarios` (somente leitura para unicidade).
- **Operações detalhadas**:
  - **Read**: `SELECT id FROM usuarios WHERE LOWER(email) = LOWER($1);`

## 3. Histórico de Versões e Modificações
| Versão | Data | Autor / Agente | O que foi modificado / Adicionado |
| :--- | :--- | :--- | :--- |
| `v1.0.0` | 2026-08-17 | Antigravity AI | Documentação do envio de código de 6 dígitos via SMTP e validação em memória com expiração. |
