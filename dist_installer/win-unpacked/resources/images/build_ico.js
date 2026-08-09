const pngToIco = require('png-to-ico').default;
const fs = require('fs');
const path = require('path');

const inputPng = path.join(__dirname, 'app_icon.png');
const outputIco = path.join(__dirname, 'app_icon.ico');

pngToIco(inputPng)
  .then(buf => {
    fs.writeFileSync(outputIco, buf);
    console.log('✅ Arquivo app_icon.ico multi-resolução gerado com sucesso! Tamanho:', buf.length, 'bytes');
  })
  .catch(err => {
    console.error('❌ Erro ao gerar ico:', err);
    process.exit(1);
  });
