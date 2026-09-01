---
description: Regra de Registro Contínuo e Acumulativo de Logs de Solicitações da IA em .agents/logs-IA/
---

# Regra de Registro de Solicitações em `.agents/logs-IA/`

Para TODAS as solicitações do usuário nesta conversa:

1. **Localização**: Todos os arquivos de log devem ser mantidos na pasta `.agents/logs-IA/`.
2. **Novos Assuntos vs Atualizações no Mesmo Assunto**:
   - Se a solicitação for sobre um **novo assunto**, crie um novo arquivo `.md` na pasta `.agents/logs-IA/` (ex: `.agents/logs-IA/08_nome_do_assunto.md`).
   - Se a solicitação for uma **continuação, ajuste ou correção de bug do mesmo assunto**, **NUNCA APAGUE OU SOBREESCREVA** o conteúdo anterior. Mantenha todo o histórico e adicione uma linha divisória (`---`) ao final do arquivo para anexar a nova atualização.
3. **Classificação Obrigatória**: Toda solicitação ou atualização registrada deve conter explicitamente a classificação em uma das opções:
   - **Incidente**
   - **Bug**
   - **Ajuste**
   - **Nova Solicitação**
