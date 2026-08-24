import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { spawn } from 'child_process';
import { autoUpdater } from 'electron-updater';
import { BrowserWindow, ipcMain, Notification, app } from 'electron';

let currentStatus = { state: 'idle' };
let targetWindow = null;
let downloadedInstallerPath = null;

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

function downloadFileWithRedirects(url, destPath, onProgress) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);

    function makeRequest(targetUrl, redirectCount = 0) {
      if (redirectCount > 10) {
        file.close();
        try { fs.unlinkSync(destPath); } catch (e) {}
        return reject(new Error('Excesso de redirecionamentos ao baixar atualização.'));
      }

      const protocol = targetUrl.startsWith('https:') ? https : http;
      const req = protocol.get(
        targetUrl,
        {
          headers: {
            'User-Agent': 'SimpleFinances-DesktopApp',
            'Accept': 'application/octet-stream',
          },
        },
        (res) => {
          if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
            const redirectUrl = res.headers.location;
            if (!redirectUrl) {
              file.close();
              try { fs.unlinkSync(destPath); } catch (e) {}
              return reject(new Error('Redirecionamento sem endereço válido'));
            }
            return makeRequest(redirectUrl, redirectCount + 1);
          }

          if (res.statusCode !== 200) {
            file.close();
            try { fs.unlinkSync(destPath); } catch (e) {}
            return reject(new Error(`Falha no download (Código HTTP ${res.statusCode})`));
          }

          const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
          let transferredBytes = 0;
          let lastReportTime = Date.now();
          let lastReportBytes = 0;

          res.on('data', (chunk) => {
            transferredBytes += chunk.length;
            file.write(chunk);

            const now = Date.now();
            if (now - lastReportTime >= 150) {
              const percent = totalBytes > 0 ? Math.min(100, Math.round((transferredBytes / totalBytes) * 100)) : 0;
              const bytesPerSec = Math.round(((transferredBytes - lastReportBytes) / ((now - lastReportTime) || 1)) * 1000);
              onProgress({
                progress: percent,
                transferred: transferredBytes,
                total: totalBytes,
                bytesPerSecond: bytesPerSec,
              });
              lastReportTime = now;
              lastReportBytes = transferredBytes;
            }
          });

          res.on('end', () => {
            file.end(() => {
              onProgress({
                progress: 100,
                transferred: transferredBytes,
                total: totalBytes,
                bytesPerSecond: 0,
              });
              resolve(destPath);
            });
          });

          res.on('error', (err) => {
            file.close();
            try { fs.unlinkSync(destPath); } catch (e) {}
            reject(err);
          });
        }
      );

      req.on('error', (err) => {
        file.close();
        try { fs.unlinkSync(destPath); } catch (e) {}
        reject(err);
      });
    }

    makeRequest(url);
  });
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

  ipcMain.handle('updater:downloadUpdate', async (event, fallbackUrl) => {
    sendStatusToWindow({ state: 'downloading', progress: 0 });
    downloadedInstallerPath = null;

    // 1. Tenta baixar via autoUpdater oficial
    try {
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (err) {
      console.warn('autoUpdater.downloadUpdate falhou, acionando Downloader Direto de Alta Performance:', err.message);
    }

    // 2. Se o autoUpdater falhar (ou se o app estiver em dev/versão anterior sem electron-updater ativo),
    // baixa o .exe direto da release do GitHub em segundo plano!
    if (!fallbackUrl) {
      const cleanErr = 'URL de download não fornecida para atualização direta.';
      sendStatusToWindow({ state: 'error', errorMessage: cleanErr });
      return { success: false, error: cleanErr };
    }

    try {
      const tempDir = app.getPath('temp');
      const tempFileName = `SimpleFinances-Setup-Update-${Date.now()}.exe`;
      const tempFilePath = path.join(tempDir, tempFileName);

      await downloadFileWithRedirects(fallbackUrl, tempFilePath, (prog) => {
        sendStatusToWindow({
          state: 'downloading',
          progress: prog.progress,
          transferred: prog.transferred,
          total: prog.total,
          bytesPerSecond: prog.bytesPerSecond,
        });
      });

      downloadedInstallerPath = tempFilePath;
      sendStatusToWindow({ state: 'downloaded', downloadedInstallerPath: tempFilePath });
      return { success: true, downloadedInstallerPath: tempFilePath };
    } catch (directErr) {
      console.error('Falha no downloader direto:', directErr);
      const cleanErr = formatUpdaterError(directErr);
      sendStatusToWindow({ state: 'error', errorMessage: cleanErr });
      return { success: false, error: cleanErr };
    }
  });

  ipcMain.handle('updater:quitAndInstall', () => {
    try {
      if (downloadedInstallerPath && fs.existsSync(downloadedInstallerPath)) {
        // Inicia o novo instalador baixado de forma independente
        const child = spawn(downloadedInstallerPath, [], {
          detached: true,
          stdio: 'ignore',
        });
        child.unref();

        setTimeout(() => {
          app.quit();
        }, 500);
        return { success: true };
      }

      autoUpdater.quitAndInstall(false, true);
      return { success: true };
    } catch (err) {
      console.error('Erro ao reiniciar e instalar:', err);
      return { success: false, error: err.message };
    }
  });
}
