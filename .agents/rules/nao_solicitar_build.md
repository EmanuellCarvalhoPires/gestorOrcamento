---
description: Regra para NÃO solicitar autorização nem rodar o comando de build automaticamente após alterações de código.
---

# Regra de Execução de Build

1. **NÃO solicitar autorização para build**: O usuário instruiu expressamente que NÃO deseja que a IA solicite autorização para rodar comandos de build (`npx vite build`, `npm run build` ou `electron-forge package`).
2. **Edição Direta e Sucinta**: Realize as alterações no código, salve os arquivos necessários e informe o usuário diretamente e de forma clara sobre o que foi atualizado, sem bloquear o fluxo com pedidos de execução de build.
