import { contextBridge, ipcRenderer } from 'electron';

// Exposição segura da ponte IPC para a interface React
contextBridge.exposeInMainWorld('apiTurso', {
  registrarUsuario: (dados) => ipcRenderer.invoke('registrar-usuario', dados),
  loginUsuario: (credenciais) => ipcRenderer.invoke('login-usuario', credenciais),
  carregarCategorias: (usuarioId) => ipcRenderer.invoke('carregar-categorias', { usuarioId }),
  adicionarCategoria: (dados) => ipcRenderer.invoke('adicionar-categoria', dados),
  deletarCategoria: (id, usuarioId) => ipcRenderer.invoke('deletar-categoria', { id, usuarioId }),
  carregarTransacoes: (usuarioId, mes, ano) => ipcRenderer.invoke('carregar-transacoes', { usuarioId, mes, ano }),
  adicionarTransacao: (novaTransacao) => ipcRenderer.invoke('adicionar-transacao', novaTransacao),
  editarTransacao: (dadosEdicao) => ipcRenderer.invoke('editar-transacao', dadosEdicao),
  deletarTransacao: (id, usuarioId, opcoes = {}) => ipcRenderer.invoke('deletar-transacao', { id, usuarioId, ...opcoes }),
  exportarCSV: (dadosExportacao) => ipcRenderer.invoke('exportar-csv', dadosExportacao),
  exportarPDF: (dadosExportacao) => ipcRenderer.invoke('exportar-pdf', dadosExportacao),
});
