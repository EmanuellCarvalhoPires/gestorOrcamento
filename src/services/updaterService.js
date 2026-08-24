import { autoUpdater } from 'electron-updater';
import { BrowserWindow, ipcMain, Notification, app } from 'electron';

let currentStatus = { state: 'idle' };
let targetWindow = null;

function sendStatusToWindow(status) {
  currentStatus = { ...currentStatus, ...status };
  if (targetWindow && !targetWindow.isDestroyed()) {
    targetWindow.webContents.send('updater:status', currentStatus);
  }
}

function formatUpdaterError(err) {
  if (!err) return 'Erro desconhecido ao verificar atualizações';
  const str = typeof err === 'string' ? err : (err.message || String(err));
  if (str.includes('404') || str.includes('latest.yml')) {
    return 'Nenhuma Release publicada no GitHub ainda.';
  }
  return str.split('\n')[0].trim();
}

export function initAutoUpdater(win) {
  targetWindow = win;

  // Não baixa nem instala sem a confirmação do usuário
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on('checking-for-update', () => {
    sendStatusToWindow({ state: 'checking' });
  });

  autoUpdater.on('update-available', (info) => {
    sendStatusToWindow({
      state: 'available',
      version: info.version,
      releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : (Array.isArray(info.releaseNotes) ? info.releaseNotes.map(n => n.note).join('\n') : ''),
      releaseDate: info.releaseDate,
    });

    try {
      if (Notification.isSupported()) {
        new Notification({
          title: '🚀 Nova Atualização Disponível!',
          body: `A versão v${info.version} do Simple Finances está disponível para download.`,
        }).show();
      }
    } catch (e) {
      // Ignora erro de notificação
    }
  });

  autoUpdater.on('update-not-available', (info) => {
    sendStatusToWindow({ state: 'not-available', version: info.version || app.getVersion() });
  });

  autoUpdater.on('error', (err) => {
    sendStatusToWindow({ state: 'error', errorMessage: formatUpdaterError(err) });
  });

  autoUpdater.on('download-progress', (progressObj) => {
    sendStatusToWindow({
      state: 'downloading',
      progress: Math.round(progressObj.percent || 0),
      bytesPerSecond: progressObj.bytesPerSecond || 0,
      transferred: progressObj.transferred || 0,
      total: progressObj.total || 0,
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    sendStatusToWindow({ state: 'downloaded', version: info.version });
  });
}

export function registerUpdaterIpc() {
  ipcMain.handle('updater:getStatus', () => currentStatus);

  ipcMain.handle('updater:checkForUpdates', async () => {
    sendStatusToWindow({ state: 'checking', errorMessage: undefined });
    try {
      const result = await autoUpdater.checkForUpdates();
      return { success: true, result };
    } catch (err) {
      const cleanErr = formatUpdaterError(err);
      sendStatusToWindow({ state: 'error', errorMessage: cleanErr });
      return { success: false, error: cleanErr };
    }
  });

  ipcMain.handle('updater:downloadUpdate', async () => {
    sendStatusToWindow({ state: 'downloading', progress: 0 });
    try {
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (err) {
      const cleanErr = formatUpdaterError(err);
      sendStatusToWindow({ state: 'error', errorMessage: cleanErr });
      return { success: false, error: cleanErr };
    }
  });

  ipcMain.handle('updater:quitAndInstall', () => {
    try {
      autoUpdater.quitAndInstall(false, true);
      return { success: true };
    } catch (err) {
      console.error('Erro ao reiniciar e instalar:', err);
      return { success: false, error: err.message };
    }
  });
}
