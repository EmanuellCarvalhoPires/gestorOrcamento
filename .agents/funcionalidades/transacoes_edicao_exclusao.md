# ✏️ Edição e Exclusão Avançada de Lançamentos

## 1. Descrição e Propósito
- **O que a funcionalidade faz:** Permite que o usuário altere os dados de qualquer transação financeira cadastrada (valor, nome, categoria, etiqueta, observações, status pago/pendente, status de reserva/caixinha) ou a exclua do banco de dados com suporte a modos inteligentes para transações recorrentes e parceladas.
- **Fluxo de Utilização:**
  1. Ao clicar no botão de editar (ícone de lápis) na tabela ou modal de detalhes:
     - O modal `EditExpenseModal.jsx` é aberto carregando os dados preexistentes.
     - O usuário ajusta os campos necessários e salva. Se a transação for parte de um grupo recorrente/parcelado, o sistema oferece a opção de aplicar alterações apenas ao registro atual ou a todos os registros vinculados.
  2. Ao clicar no botão de excluir (ícone de lixeira):
     - Se o lançamento for simples: abre modal de confirmação direta (`DeleteConfirmModal.jsx`).
     - Se o lançamento for parcelado ou recorrente: apresenta opções de exclusão (`deletarModo`):
       - `apenas_este`: Exclui apenas a ocorrência/parcela do mês selecionado.
       - `este_e_proximos`: Exclui a ocorrência atual e todas as subsequentes.
       - `todos`: Exclui todas as parcelas/ocorrências daquele grupo (passadas e futuras).
- **Componentes e Arquivos Envolvidos:**
  - Interface do usuário: [`src/components/EditExpenseModal.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/EditExpenseModal.jsx), [`src/components/DeleteConfirmModal.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/DeleteConfirmModal.jsx)
  - Preload IPC: [`src/preload.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/preload.js) (`editarTransacao`, `deletarTransacao`)
  - Processo Principal Electron: [`src/main.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/main.js)
  - Rotas Backend API: [`server/routes/financeRoutes.js`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/server/routes/financeRoutes.js)

## 2. Impacto no Banco de Dados
- **Altera o banco de dados?** Sim.
- **Adiciona/Remove dados?** Sim (atualiza e remove registros das tabelas `receitas` e `despesas`).
- **Tabelas afetadas**: `receitas`, `despesas`.
- **Operações detalhadas**:
  - **Update**:
    - `UPDATE despesas SET descricao = $1, valor = $2, categoria = $3, etiqueta = $4, tipo_pagamento = $5, data = $6, pago = $7, eh_reserva = $8, observacao = $9 WHERE id = $10 AND usuario_id = $11;`
    - `UPDATE receitas SET descricao = $1, valor = $2, categoria = $3, etiqueta = $4, tipo_pagamento = $5, data = $6, pago = $7, eh_reserva = $8, observacao = $9 WHERE id = $10 AND usuario_id = $11;`
  - **Delete**:
    - Exclusão pontual: `DELETE FROM despesas WHERE id = $1 AND usuario_id = $2;`
    - Exclusão de grupo/parcelas: `DELETE FROM despesas WHERE usuario_id = $1 AND descricao LIKE $2;` (ou por ID de agrupamento / data >= mês atual).

## 3. Histórico de Versões e Modificações
| Versão | Data | Autor / Agente | O que foi modificado / Adicionado |
| :--- | :--- | :--- | :--- |
| `v1.1.0` | 2026-09-01 | Antigravity AI | Sincronização 100% dinâmica de paleta de cores e temas na modal de exclusão (`DeleteConfirmModal.jsx`), utilizando as variáveis CSS ativas (`card-bg`, `surface-bg`, `accent-color`, `accent-text`, `text-primary`, `border-color`) e adicionando efeitos interativos de hover. |
| `v1.0.1` | 2026-08-17 | Antigravity AI | Adicionado isolamento estrito por `conta_id` em operações de edição e exclusão em lote de recorrências, e suporte a passagem de ID numérico ou objeto de transação completo. |
| `v1.0.0` | 2026-08-17 | Antigravity AI | Documentação completa dos modos de edição e exclusão seletiva para lançamentos únicos, recorrentes e parcelados. |

