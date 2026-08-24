import nodemailer from 'nodemailer';

/**
 * Cria o transporter SMTP configurado para o Gmail oficial do Gestor de Orçamento
 */
function criarTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER || 'gestororc@gmail.com';
  const pass = process.env.SMTP_PASS || 'cvfeowfdngseznfi';

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

/**
 * Template base visual Flowly Finance / Gestor de Orçamento (Dark + Dourado Nobre)
 */
function gerarHtmlEmail({ titulo, nomeUsuario, mensagem, codigo, aviso }) {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #1f2227; color: #ffffff; padding: 32px; border-radius: 18px; border: 1px solid #343840;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #ffe192; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 0.5px;">Simple Finances</h1>
        <p style="color: #8d99ae; font-size: 13px; margin: 4px 0 0 0;">Gestor de Orçamento & Controle Financeiro</p>
      </div>

      <div style="background-color: #282b32; padding: 24px; border-radius: 14px; border: 1px solid #3e434d;">
        <h2 style="color: #ffffff; font-size: 18px; margin-top: 0;">Olá, <strong>${nomeUsuario || 'Usuário'}</strong>!</h2>
        <p style="color: #c5c9d1; font-size: 14px; line-height: 1.6; margin: 12px 0;">
          ${mensagem}
        </p>

        <p style="color: #8d99ae; font-size: 13px; margin-top: 20px; margin-bottom: 8px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">
          Seu Código de Verificação:
        </p>
        
        <div style="background-color: #1f2227; border: 2px dashed #ffe192; padding: 16px; text-align: center; border-radius: 12px; margin: 12px 0;">
          <span style="font-size: 32px; font-weight: 800; color: #ffe192; letter-spacing: 8px; font-family: monospace;">${codigo}</span>
        </div>

        <p style="color: #8d99ae; font-size: 12px; line-height: 1.5; margin-top: 18px; margin-bottom: 0;">
          ${aviso || 'Este código é de uso exclusivo e expira em 10 minutos. Caso não tenha solicitado, ignore esta mensagem com segurança.'}
        </p>
      </div>

      <div style="text-align: center; color: #6b7280; font-size: 11px; margin-top: 24px;">
        © 2026 Simple Finances / Gestor de Orçamento. Todos os direitos reservados.
      </div>
    </div>
  `;
}

/**
 * Envia E-mail de Código de Verificação de Cadastro (6 dígitos)
 */
export async function enviarEmailVerificacao(emailDestino, nomeUsuario, codigo6Digitos) {
  const transporter = criarTransporter();
  const htmlContent = gerarHtmlEmail({
    titulo: 'Verificação de Conta',
    nomeUsuario,
    mensagem: `Obrigado por se cadastrar no <strong>Simple Finances</strong>! Para concluir seu registro e ativar sua conta com segurança, insira o código de 6 dígitos abaixo no aplicativo:`,
    codigo: codigo6Digitos,
    aviso: 'Este código é válido por 10 minutos. Se você não solicitou este cadastro, pode desconsiderar este e-mail.'
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Simple Finances" <gestororc@gmail.com>',
    to: emailDestino,
    subject: '✨ Código de Verificação de Cadastro - Simple Finances',
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [E-mail de Cadastro Enviado] Para: ${emailDestino} | ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('❌ [Erro SMTP Cadastro]:', err.message);
    throw err;
  }
}

/**
 * Envia E-mail de Recuperação de Senha (6 dígitos)
 */
export async function enviarEmailRecuperacao(emailDestino, nomeUsuario, codigo6Digitos) {
  const transporter = criarTransporter();
  const htmlContent = gerarHtmlEmail({
    titulo: 'Recuperação de Senha',
    nomeUsuario,
    mensagem: `Recebemos uma solicitação para redefinir a senha da sua conta vinculada ao e-mail <strong>${emailDestino}</strong>. Utilize o código de 6 dígitos abaixo no aplicativo para criar uma nova senha:`,
    codigo: codigo6Digitos,
    aviso: 'Este código é válido por 15 minutos. Se você não solicitou a redefinição de senha, nenhuma alteração será feita na sua conta.'
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Simple Finances" <gestororc@gmail.com>',
    to: emailDestino,
    subject: '🔑 Código de Recuperação de Senha - Simple Finances',
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [E-mail de Recuperação Enviado] Para: ${emailDestino} | ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('❌ [Erro SMTP Recuperação]:', err.message);
    throw err;
  }
}
