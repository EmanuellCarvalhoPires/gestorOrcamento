---
description: Regra para isolamento de scripts temporários na pasta scripts_temp, inclusão no .gitignore e exclusão do build.
---

# Regra de Isolamento de Scripts Temporários

1. **Diretório Obrigatório (`scripts_temp/`)**: Qualquer script temporário de migração, teste, manutenção ou automação pontual gerado pela IA DEVE ser salvo exclusivamente dentro do diretório `scripts_temp/` no root do projeto.
2. **Proteção de Repositório (`.gitignore`)**: A pasta `scripts_temp/` DEVE estar listada no `.gitignore` para garantir que scripts temporários jamais sejam comitados no controle de versão.
3. **Exclusão do Build (Vite & Electron Forge)**: Nenhum script contido em `scripts_temp/` deve ser importado, referenciado ou incluído nos pacotes de produção ou executáveis finais (`forge.config.js` ignora `/^\/scripts_temp/`).
