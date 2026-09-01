# 👁️ Visualizador & Detalhes de Transação

## 1. Descrição e Propósito
- **O que a funcionalidade faz:** Abre um modal dedicado e completo (`TransactionDetailsModal.jsx`) para exibição profunda de todos os dados e metadados de uma transação específica, incluindo visualização de notas e comprovantes anexados.
- **Fluxo de Utilização:**
  1. O usuário clica sobre a linha de uma transação na tabela ou no botão de visualização (ícone de olho).
  2. O modal abre exibindo:
     - Título e identificação do lançamento.
     - Valor em destaque com formatação monetária.
     - Categoria com badge e cor correspondente.
     - Etiqueta / Tag vinculada.
     - Forma de pagamento e data de realização/vencimento.
     - Status atual (Realizado / Pago vs Pendente).
     - Informações de recorrência ou indicador de parcela (ex: "Parcela 3 de 10").
     - Observações e notas adicionais em texto.
     - Seção de anexo/comprovante com preview de imagem e botão para download ou abertura no sistema.
  3. Oferece botões diretos para editar ou excluir a transação sem sair do modal.
- **Componentes e Arquivos Envolvidos:**
  - Interface do usuário: [`src/components/TransactionDetailsModal.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/TransactionDetailsModal.jsx)
  - Modais de Suporte: [`src/components/EditExpenseModal.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/EditExpenseModal.jsx), [`src/components/DeleteConfirmModal.jsx`](file:///c:/Users/Trabalho/Documents/gestorOrcamento/src/components/DeleteConfirmModal.jsx)

## 2. Impacto no Banco de Dados
- **Altera o banco de dados?** Não diretamente (leitura dos dados já carregados; pode invocar edição/exclusão).
- **Adiciona/Remove dados?** Não na visualização.
- **Tabelas afetadas**: `receitas`, `despesas` (leitura).

## 3. Histórico de Versões e Modificações
| Versão | Data | Autor / Agente | O que foi modificado / Adicionado |
| :--- | :--- | :--- | :--- |
| `v1.0.0` | 2026-08-17 | Antigravity AI | Documentação do modal de detalhes da transação, visualização de anexos/comprovantes e atalhos operacionais. |
| `v1.1.0` | 2026-08-21 | Antigravity AI | Refinamento completo de UI/UX: remoção de emojis inconsistentes em rótulos e botões, eliminação do badge redundante 'Despesa' no cabeçalho, estruturação hierárquica unificada de metadados e diferenciação entre ação primária ('Editar') e secundária/outline discreta ('Excluir'). |
