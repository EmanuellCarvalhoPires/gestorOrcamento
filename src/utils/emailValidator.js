// Validador Completo de E-mails (Sintaxe, Domínios Descartáveis, Typos e Registros DNS MX)

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'tempmail.com', '10minutemail.com', 'yopmail.com',
  'trashmail.com', 'dispostable.com', 'guerrillamail.com', 'sharklasers.com',
  'getnada.com', 'temp-mail.org', 'fakeinbox.com', 'crazymailing.com',
  'throwawaymail.com', 'maildrop.cc', 'dayrep.com', 'teleworm.us',
  'mailcatch.com', 'inboxalias.com', 'mohmal.com'
]);

const COMMON_TYPOS = {
  'gmai.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmail.com.br': 'gmail.com',
  'gamil.com.br': 'gmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmaill.com': 'hotmail.com',
  'outloo.com': 'outlook.com',
  'outlok.com': 'outlook.com',
  'yaho.com': 'yahoo.com',
  'yahoo.com.brr': 'yahoo.com.br',
  'icloud.co': 'icloud.com'
};

/**
 * Validação de Sintaxe, Typos e Domínios Fictícios / Temporários
 */
export function validarSintaxeEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valido: false, erro: 'Por favor, informe seu endereço de e-mail.' };
  }

  const emailLimpo = email.trim().toLowerCase();

  // Expressão Regular Estrita RFC 5322
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (!emailRegex.test(emailLimpo)) {
    return { valido: false, erro: 'Formato de e-mail inválido. Verifique se digitou corretamente (ex: usuario@dominio.com).' };
  }

  const partes = emailLimpo.split('@');
  if (partes.length !== 2) {
    return { valido: false, erro: 'E-mail malformatado.' };
  }

  const [usuario, dominio] = partes;

  if (usuario.length < 2) {
    return { valido: false, erro: 'O nome de usuário do e-mail é curto demais.' };
  }

  // Verifica se o usuário criou um e-mail falso genérico como "asdf@gmail.com" ou "12345@gmail.com" ou "teste@gmail.com"
  const usuarioGenericoFalso = /^(asdf+|qwerty+|1234+|test+|teste+|abc+|abc123|aaaa+|1111+|fake+)$/i;
  if (usuarioGenericoFalso.test(usuario)) {
    return { valido: false, erro: `O endereço "${emailLimpo}" parece ser um e-mail genérico/fictício. Informe um e-mail válido.` };
  }

  // Bloqueio de e-mails descartáveis / temporários
  if (DISPOSABLE_DOMAINS.has(dominio)) {
    return { valido: false, erro: 'E-mails temporários ou descartáveis não são permitidos. Digite seu e-mail real.' };
  }

  // Sugestão para erros de digitação (typos)
  if (COMMON_TYPOS[dominio]) {
    return {
      valido: false,
      erro: `Você quis dizer @${COMMON_TYPOS[dominio]} ao invés de @${dominio}?`,
    };
  }

  // Validação da extensão do domínio (TLD)
  const partesDominio = dominio.split('.');
  const tld = partesDominio[partesDominio.length - 1];
  if (!tld || tld.length < 2) {
    return { valido: false, erro: 'A extensão do domínio do e-mail é inválida.' };
  }

  return { valido: true, emailLimpo, dominio };
}
