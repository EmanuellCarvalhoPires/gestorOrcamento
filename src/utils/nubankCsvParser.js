/**
 * Processador utilitário inteligente para arquivos CSV do Nubank
 * Suporta múltiplos formatos:
 * 1. Extrato da Conta / NuConta: Data,Valor,Identificador,Descrição (DD/MM/YYYY)
 * 2. Fatura do Cartão de Crédito: date,title,amount (YYYY-MM-DD ou DD/MM/YYYY)
 * 3. Formatos variantes com separador por vírgula (,) ou ponto-e-vírgula (;)
 */

const MESES_LIST = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/**
 * Faz o parsing de uma linha CSV respeitando aspas
 */
function parseCsvLine(line, delimiter = ',') {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Limpa títulos longos do Nubank mantendo a informação essencial legível
 */
function cleanTransactionTitle(rawTitle) {
  if (!rawTitle) return 'Transação Nubank';
  let title = rawTitle.trim();

  // Caso: "Transferência recebida pelo Pix - NOME - CPF/CNPJ - BANCO..." ou "Transferência Recebida - NOME..."
  const pixRecMatch = title.match(/^Transferência\s+recebida(?:\s+pelo\s+Pix)?\s*-\s*([^-]+)/i);
  if (pixRecMatch) {
    const nomePessoa = pixRecMatch[1].trim();
    return `Pix: ${nomePessoa}`;
  }

  // Caso: "Transferência enviada pelo Pix - NOME (Transferência enviada)" ou "... - NOME - CNPJ..."
  const pixEnvMatch = title.match(/^Transferência\s+enviada(?:\s+pelo\s+Pix)?\s*-\s*([^-]+)/i);
  if (pixEnvMatch) {
    let nomePessoa = pixEnvMatch[1].trim();
    nomePessoa = nomePessoa.replace(/\s*\(Transferência enviada\)\s*/i, '').trim();
    return `Pix Enviado: ${nomePessoa}`;
  }

  // Caso: "Compra no débito - ESTABELECIMENTO"
  const debitoMatch = title.match(/^Compra\s+(?:no\s+)?débito\s*-\s*(.+)/i);
  if (debitoMatch) {
    return `Débito: ${debitoMatch[1].trim()}`;
  }

  // Remove sufixos repetitivos entre parênteses
  title = title.replace(/\s*\(Transferência recebida\)\s*/i, '');
  title = title.replace(/\s*\(Transferência enviada\)\s*/i, '');

  return title;
}

/**
 * Sugere categoria e etiqueta com base no texto da transação
 */
function suggestCategoryAndEtiqueta(rawTitle, tipo) {
  const lower = (rawTitle || '').toLowerCase();
  if (
    lower.includes('aplicação rdb') ||
    lower.includes('aplicacao rdb') ||
    lower.includes('resgate rdb') ||
    lower.includes('guardado') ||
    lower.includes('caixinha')
  ) {
    return { classificacao: 'Investimentos', etiqueta: 'RDB / Caixinha' };
  }
  if (lower.includes('pagamento de fatura') || lower.includes('fatura')) {
    return { classificacao: 'Cartão de Crédito', etiqueta: 'Fatura Nubank' };
  }
  if (lower.includes('pix') || lower.includes('transferência') || lower.includes('transferencia')) {
    return { classificacao: 'Transferências', etiqueta: 'Pix' };
  }
  if (lower.includes('estorno') || lower.includes('reembolso')) {
    return { classificacao: 'Reembolso', etiqueta: 'Estorno' };
  }
  return {
    classificacao: 'Nubank',
    etiqueta: tipo === 'receitas' ? 'Receita Nubank' : 'Despesa Nubank',
  };
}

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

  // Detectar delimitador (, ou ;)
  const headerLine = linhas[0];
  const countComma = (headerLine.match(/,/g) || []).length;
  const countSemicolon = (headerLine.match(/;/g) || []).length;
  const delimiter = countSemicolon > countComma ? ';' : ',';

  const rawHeaders = parseCsvLine(headerLine, delimiter).map((h) =>
    h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  );

  let idxDate = -1;
  let idxAmount = -1;
  let idxTitle = -1;
  let idxId = -1;
  let idxCategory = -1;

  rawHeaders.forEach((h, index) => {
    if (h === 'data' || h === 'date' || h.includes('data')) {
      if (idxDate === -1) idxDate = index;
    } else if (h === 'valor' || h === 'amount' || h === 'value' || h.includes('valor')) {
      if (idxAmount === -1) idxAmount = index;
    } else if (h === 'descricao' || h === 'description' || h === 'title' || h === 'titulo' || h === 'estabelecimento') {
      if (idxTitle === -1) idxTitle = index;
    } else if (h === 'identificador' || h === 'id' || h === 'identifier' || h.includes('identificador')) {
      if (idxId === -1) idxId = index;
    } else if (h === 'categoria' || h === 'category') {
      if (idxCategory === -1) idxCategory = index;
    }
  });

  // No extrato da conta (Data, Valor, Identificador, Descrição):
  // valores negativos = Saída/Despesa, valores positivos = Entrada/Receita
  // Na fatura do cartão de crédito (date, title, amount):
  // valores positivos = Despesa na fatura, valores negativos = Estorno/Pagamento
  const isExtratoConta = rawHeaders.includes('identificador') || rawHeaders.includes('descricao');

  if (idxDate === -1 || idxAmount === -1) {
    if (rawHeaders.length >= 4) {
      idxDate = 0;
      idxAmount = 1;
      idxId = 2;
      idxTitle = 3;
    } else if (rawHeaders.length >= 3) {
      idxDate = 0;
      idxTitle = 1;
      idxAmount = 2;
    } else {
      return {
        success: false,
        error: 'Cabeçalho CSV não reconhecido. Esperado formato com Data, Valor e Descrição.',
      };
    }
  }

  if (idxTitle === -1) {
    idxTitle = rawHeaders.length > 3 ? 3 : (idxDate === 0 && idxAmount === 1 ? 2 : 1);
  }

  const itens = [];
  let qtdNovos = 0;
  let qtdDuplicados = 0;
  let qtdIgnorados = 0;
  let valorTotalNovos = 0;
  let valorTotalReceitas = 0;
  let valorTotalDespesas = 0;

  for (let i = 1; i < linhas.length; i++) {
    const cols = parseCsvLine(linhas[i], delimiter);
    if (!cols || cols.length < 2) continue;

    const rawDate = cols[idxDate] || '';
    const rawAmount = cols[idxAmount] || '';
    const rawTitle = cols[idxTitle] || (idxId !== -1 && idxId !== idxTitle ? cols[idxId] : '') || 'Transação Nubank';
    const rawId = idxId !== -1 ? (cols[idxId] || '') : '';

    if (!rawDate || rawAmount === undefined || rawAmount === '') continue;

    // 1. Processamento da Data (suporta DD/MM/YYYY e YYYY-MM-DD)
    let ano, mesIndex, dia;
    if (rawDate.includes('/')) {
      const parts = rawDate.split(' ')[0].split('/');
      dia = parseInt(parts[0], 10);
      mesIndex = parseInt(parts[1], 10) - 1;
      ano = parseInt(parts[2], 10);
      if (ano < 100) ano += 2000;
    } else if (rawDate.includes('-')) {
      const parts = rawDate.split(' ')[0].split('-');
      if (parts[0].length === 4) {
        ano = parseInt(parts[0], 10);
        mesIndex = parseInt(parts[1], 10) - 1;
        dia = parseInt(parts[2], 10);
      } else {
        dia = parseInt(parts[0], 10);
        mesIndex = parseInt(parts[1], 10) - 1;
        ano = parseInt(parts[2], 10);
        if (ano < 100) ano += 2000;
      }
    } else {
      continue;
    }

    if (isNaN(ano) || isNaN(mesIndex) || isNaN(dia) || mesIndex < 0 || mesIndex > 11) continue;

    const mesStr = MESES_LIST[mesIndex];
    const dataTransacao = new Date(ano, mesIndex, dia, 12, 0, 0);
    const dataIsoString = `${ano}-${String(mesIndex + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

    // 2. Processamento do Valor
    let valClean = rawAmount.replace(/R\$\s*/gi, '').trim();
    if (valClean.includes(',') && valClean.includes('.')) {
      if (valClean.lastIndexOf(',') > valClean.lastIndexOf('.')) {
        valClean = valClean.replace(/\./g, '').replace(',', '.');
      } else {
        valClean = valClean.replace(/,/g, '');
      }
    } else if (valClean.includes(',')) {
      valClean = valClean.replace(',', '.');
    }

    const numericVal = parseFloat(valClean);
    if (isNaN(numericVal)) continue;

    // 3. Determinação de Tipo (Despesa ou Receita)
    let tipo = 'despesas';
    if (isExtratoConta) {
      tipo = numericVal < 0 ? 'despesas' : 'receitas';
    } else {
      tipo = numericVal > 0 ? 'despesas' : 'receitas';
    }

    // Validações semânticas adicionais pela descrição
    const lowerTitle = rawTitle.toLowerCase();
    if (
      lowerTitle.includes('transferência recebida') ||
      lowerTitle.includes('transferencia recebida') ||
      lowerTitle.includes('pix recebido') ||
      lowerTitle.includes('resgate rdb') ||
      lowerTitle.includes('aplicação rdb') ||
      lowerTitle.includes('aplicacao rdb') ||
      lowerTitle.includes('guardado na caixinha') ||
      lowerTitle.includes('caixinha')
    ) {
      tipo = 'receitas';
    } else if (
      lowerTitle.includes('transferência enviada') ||
      lowerTitle.includes('transferencia enviada') ||
      lowerTitle.includes('pix enviado') ||
      lowerTitle.includes('pagamento de fatura') ||
      lowerTitle.includes('compra no débito')
    ) {
      tipo = 'despesas';
    }

    const valorAbsoluto = Math.abs(numericVal);

    // 4. Limpeza de Nome e Detecção de Parcelas
    const nomeLimpo = cleanTransactionTitle(rawTitle);
    let parcelasStr = '1/1';
    let isParcelado = false;

    const parcelaRegex = /(?:[\s-]+)?parcela\s+(\d+\/\d+|\d+\s+de\s+\d+)/i;
    const matchParcela = rawTitle.match(parcelaRegex);
    if (matchParcela) {
      parcelasStr = matchParcela[1].replace(/\s+de\s+/i, '/');
      isParcelado = true;
    }

    // Sugestão de Categoria e Etiqueta
    const sugestao = suggestCategoryAndEtiqueta(rawTitle, tipo);

    // 5. Verificação Anti-Duplicata
    const isDuplicado = transacoesExistentes.some((tExistente) => {
      const tTipo = tExistente.tipo || (tExistente.tabela === 'receitas' ? 'receitas' : 'despesas');
      if (tTipo !== tipo) return false;

      const valorIgual = Math.abs(Number(tExistente.valor) - valorAbsoluto) < 0.01;
      if (!valorIgual) return false;

      if (rawId && tExistente.descricao && tExistente.descricao.includes(rawId)) {
        return true;
      }

      const nomeExistenteClean = (tExistente.nome || '').trim().toLowerCase();
      const nomeNovoClean = nomeLimpo.toLowerCase();
      const rawTitleClean = rawTitle.trim().toLowerCase();

      const nomeIgual =
        nomeExistenteClean === nomeNovoClean ||
        nomeExistenteClean === rawTitleClean ||
        rawTitleClean.includes(nomeExistenteClean);
      if (!nomeIgual) return false;

      if (tExistente.data_transacao) {
        const dtExist = new Date(tExistente.data_transacao);
        return dtExist.getFullYear() === ano && dtExist.getMonth() === mesIndex && dtExist.getDate() === dia;
      } else {
        return tExistente.mes === mesStr && String(tExistente.ano) === String(ano);
      }
    });

    // Verificação de movimentação interna ignorada (Qualquer operação com RDB ou Caixinha)
    const isRdbIgnorado =
      lowerTitle.includes('rdb') ||
      lowerTitle.includes('resgate caixinha') ||
      lowerTitle.includes('aplicação caixinha') ||
      lowerTitle.includes('aplicacao caixinha') ||
      lowerTitle.includes('guardado na caixinha');

    if (isDuplicado) {
      qtdDuplicados++;
    } else if (isRdbIgnorado) {
      qtdIgnorados++;
    } else {
      qtdNovos++;
      valorTotalNovos += valorAbsoluto;
      if (tipo === 'receitas') {
        valorTotalReceitas += valorAbsoluto;
      } else {
        valorTotalDespesas += valorAbsoluto;
      }
    }

    const descricaoCompleta = rawId ? `${rawTitle} (ID: ${rawId})` : rawTitle;

    itens.push({
      idTemp: `nubank_${i}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      identificador: rawId,
      dataIso: dataIsoString,
      dataTransacao: dataTransacao.toISOString(),
      dia,
      mes: mesStr,
      ano: String(ano),
      nomeRaw: rawTitle,
      nome: nomeLimpo,
      descricao: descricaoCompleta,
      valor: valorAbsoluto,
      tipo,
      parcelas: parcelasStr,
      isParcelado,
      isDuplicado,
      isIgnorado: isRdbIgnorado,
      classificacao: isRdbIgnorado ? 'RDB / Caixinha' : sugestao.classificacao,
      etiqueta: isRdbIgnorado ? 'RDB Ignorado' : sugestao.etiqueta,
      selecionado: !isDuplicado && !isRdbIgnorado,
    });
  }

  return {
    success: true,
    itens,
    totalItens: itens.length,
    qtdNovos,
    qtdDuplicados,
    qtdIgnorados,
    valorTotalNovos,
    valorTotalReceitas,
    valorTotalDespesas,
  };
}
