const fs = require('fs');
const path = require('path');
const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

const extraResources = ['./images'];
if (fs.existsSync(path.resolve(__dirname, '.env'))) {
  extraResources.push('./.env');
}
if (fs.existsSync(path.resolve(__dirname, 'ssh-key-2026-07-30.key'))) {
  extraResources.push('./ssh-key-2026-07-30.key');
}

module.exports = {
  packagerConfig: {
    name: 'SimpleFinances',
    productName: 'Simple Finances',
    icon: path.resolve(__dirname, 'images/app_icon.ico'),
    extraResource: extraResources,
    asar: true,
    overwrite: true,
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'simplefinances',
        authors: 'Emanuell Carvalho Pires',
        description: 'Simple Finances - Aplicativo de Gestão Financeira Pessoal',
        setupExe: 'SimpleFinances-Instalador.exe',
        setupIcon: path.resolve(__dirname, 'images/app_icon.ico'),
        loadingGif: path.resolve(__dirname, 'images/installing_progress.gif'),
        noDelta: true,
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32', 'darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        build: [
          {
            entry: 'src/main.js',
            config: 'vite.main.config.mjs',
            target: 'main',
          },
          {
            entry: 'src/preload.js',
            config: 'vite.preload.config.mjs',
            target: 'preload',
          },
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.renderer.config.mjs',
          },
        ],
      },
    },
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: false,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
