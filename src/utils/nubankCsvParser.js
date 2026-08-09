/**
 * Processador utilitário para arquivos CSV de Faturas do Nubank
 * Formato esperado: date,title,amount
 */

const MESES_LIST = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/**
 * Converte string CSV do Nubank em um array de transações processadas e identificadas
 * @param {string} csvText - Conteúdo do arquivo CSV
 * @param {Array} transacoesExistentes - Transações ativas no sistema para checar duplicatas
 * @returns {Object} - Objeto contendo itens processados, estatísticas e resumo
 */
export function parseNubankCsv(csvText, transacoesExistentes = []) {
  if (!csvText || typeof csvText !== 'string') {
    return { success: false, error: 'Conteúdo CSV inválido ou vazio.' };
  }

  const linhas = csvText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (linhas.length < 2) {
    return { success: false, error: 'O arquivo CSV não contém dados suficientes.' };
  }

  // Verifica se o cabeçalho possui o padrão Nubank (date,title,amount)
  const cabecalho = linhas[0].toLowerCase();
  if (!cabecalho.includes('date') || !cabecalho.includes('title') || !cabecalho.includes('amount')) {
    return { success: false, error: 'O formato do CSV não corresponde ao padrão do Nubank (date,title,amount).' };
  }

  const itens = [];
  let qtdNovos = 0;
  let qtdDuplicados = 0;
  let valorTotalNovos = 0;

  for (let i = 1; i < linhas.length; i++) {
    const linha = linhas[i];
    if (!linha) continue;

    // Regex para separar colunas respeitando aspas: date,title,amount
    const partes = linha.match(/(?:^|,)(?:"([^"]*)"|([^,]*))/g);
    if (!partes || partes.length < 3) continue;

    const colunas = partes.map((p) => {
      let val = p.replace(/^,/, '').trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      return val;
    });

    const rawDate = colunas[0];
    const rawTitle = colunas[1];
    const rawAmount = colunas[2];

    if (!rawDate || !rawTitle || rawAmount === undefined) continue;

    // 1. Processamento da Data (YYYY-MM-DD)
    const dataParts = rawDate.split('-');
    if (dataParts.length !== 3) continue;

    const ano = parseInt(dataParts[0], 10);
    const mesIndex = parseInt(dataParts[1], 10) - 1;
    const dia = parseInt(dataParts[2], 10);

    if (isNaN(ano) || isNaN(mesIndex) || isNaN(dia) || mesIndex < 0 || mesIndex > 11) continue;

    const mesStr = MESES_LIST[mesIndex];
    const dataTransacao = new Date(ano, mesIndex, dia, 12, 0, 0);
    const dataIsoString = `${ano}-${String(mesIndex + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

    // 2. Processamento do Valor ("19,80" -> 19.80)
    const valClean = rawAmount.replace(/\./g, '').replace(',', '.');
    const numericVal = parseFloat(valClean);

    if (isNaN(numericVal)) continue;

    // No Nubank: valores positivos na fatura são despesas; valores negativos são estornos/receitas.
    const isDespesa = numericVal > 0;
    const tipo = isDespesa ? 'despesas' : 'receitas';
    const valorAbsoluto = Math.abs(numericVal);

    // 3. Processamento de Nome e Detecção de Parcelas
    // Exemplo: "Mercadolivre*Novalide - Parcela 2/10"
    let nomeLimpo = rawTitle.trim();
    let parcelasStr = '1/1';
    let isParcelado = false;

    const parcelaRegex = /(?:[\s-]+)?parcela\s+(\d+\/\d+)/i;
    const matchParcela = rawTitle.match(parcelaRegex);

    if (matchParcela) {
      parcelasStr = matchParcela[1];
      isParcelado = true;
      nomeLimpo = rawTitle.replace(parcelaRegex, '').trim();
    }

    // 4. Verificação de Duplicatas no Banco de Dados
    const isDuplicado = transacoesExistentes.some((tExistente) => {
      const tTipo = tExistente.tipo || (tExistente.tabela === 'receitas' ? 'receitas' : 'despesas');
      if (tTipo !== tipo) return false;

      const valorIgual = Math.abs(Number(tExistente.valor) - valorAbsoluto) < 0.01;
      if (!valorIgual) return false;

      const nomeExistenteClean = (tExistente.nome || '').trim().toLowerCase();
      const nomeNovoClean = nomeLimpo.toLowerCase();
      const rawTitleClean = rawTitle.trim().toLowerCase();

      const nomeIgual = nomeExistenteClean === nomeNovoClean || nomeExistenteClean === rawTitleClean;
      if (!nomeIgual) return false;

      // Comparação de Data (mesmo YYYY-MM-DD ou mesmo mes/ano/dia)
      if (tExistente.data_transacao) {
        const dtExist = new Date(tExistente.data_transacao);
        const mesmoDia = dtExist.getFullYear() === ano && dtExist.getMonth() === mesIndex && dtExist.getDate() === dia;
        return mesmoDia;
      } else {
        const mesmoMesAno = tExistente.mes === mesStr && String(tExistente.ano) === String(ano);
        return mesmoMesAno;
      }
    });

    if (isDuplicado) {
      qtdDuplicados++;
    } else {
      qtdNovos++;
      valorTotalNovos += valorAbsoluto;
    }

    itens.push({
      idTemp: `nubank_${i}_${Date.now()}`,
      dataIso: dataIsoString,
      dataTransacao: dataTransacao.toISOString(),
      dia,
      mes: mesStr,
      ano: String(ano),
      nomeRaw: rawTitle,
      nome: nomeLimpo,
      valor: valorAbsoluto,
      tipo,
      parcelas: parcelasStr,
      isParcelado,
      isDuplicado,
      classificacao: 'Nubank', // Categoria padrão
      etiqueta: 'Cartão Nubank', // Etiqueta padrão
    });
  }

  return {
    success: true,
    itens,
    totalItens: itens.length,
    qtdNovos,
    qtdDuplicados,
    valorTotalNovos,
  };
}
