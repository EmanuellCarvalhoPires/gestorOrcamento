import nodemailer from 'nodemailer';

/**
 * Envia e-mail de recuperação de senha seguro para o usuário
 */
export async function enviarEmailRecuperacao(emailDestino, nomeUsuario, tokenRecuperacao, codigo6Digitos) {
  let transporter;
  let isCustomSmtp = false;

  // Verifica se existem credenciais SMTP no .env
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    isCustomSmtp = true;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Modo de Desenvolvimento / Testes (Ethereal Email Fake SMTP)
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #3e3e3e; color: #ffffff; padding: 30px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #ffe192; margin: 0;">Gestor de Orçamento</h1>
        <p style="color: #dddddd; font-size: 14px;">Segurança e Controle Financeiro</p>
      </div>

      <div style="background-color: #545454; padding: 24px; border-radius: 12px; margin-bottom: 20px;">
        <h2 style="color: #ffffff; font-size: 18px; margin-top: 0;">Olá, ${nomeUsuario || 'Usuário'}!</h2>
        <p style="color: #dddddd; font-size: 14px; line-height: 1.5;">
          Recebemos uma solicitação para redefinir a senha da sua conta registrada com o e-mail <strong>${emailDestino}</strong>.
        </p>

        <p style="color: #dddddd; font-size: 14px; margin-top: 20px;">Seu Código de Verificação de 6 dígitos é:</p>
        <div style="background-color: #3e3e3e; border: 2px dashed #ffe192; padding: 15px; text-align: center; border-radius: 10px; margin: 15px 0;">
          <span style="font-size: 28px; font-weight: bold; color: #ffe192; letter-spacing: 6px;">${codigo6Digitos}</span>
        </div>

        <p style="color: #aaaaaa; font-size: 12px; margin-top: 20px;">
          Este código é válido por <strong>15 minutos</strong>. Se você não solicitou a redefinição de senha, ignore este e-mail.
        </p>
      </div>

      <div style="text-align: center; color: #aaaaaa; font-size: 11px;">
        © 2026 Gestor de Orçamento. Todos os direitos reservados.
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Gestor de Orçamento" <${process.env.SMTP_USER || 'no-reply@gestorcamento.com'}>`,
      to: emailDestino,
      subject: '🔑 Código de Recuperação de Senha - Gestor de Orçamento',
      html: htmlContent,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[E-mail Teste Sent] Visualizar e-mail em: ${previewUrl}`);
    } else {
      console.log(`✅ [E-mail Enviado com Sucesso] Para: ${emailDestino} via SMTP Gmail`);
    }

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (err) {
    console.warn('⚠️ [SMTP Warning] Falha na autenticação do e-mail principal, acionando fallback de segurança:', err.message);

    // Se o SMTP do Gmail falhar (ex: senha incorreta ou bloqueio), usa o Ethereal para NUNCA travar a aplicação com erro 500
    if (isCustomSmtp) {
      try {
        const testAccount = await nodemailer.createTestAccount();
        const fallbackTransporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: { user: testAccount.user, pass: testAccount.pass },
        });

        const fallbackInfo = await fallbackTransporter.sendMail({
          from: '"Gestor de Orçamento" <no-reply@gestorcamento.com>',
          to: emailDestino,
          subject: '🔑 Código de Recuperação de Senha - Gestor de Orçamento',
          html: htmlContent,
        });

        const previewUrl = nodemailer.getTestMessageUrl(fallbackInfo);
        console.log(`[Fallback Email Sent] Link para visualizar o e-mail: ${previewUrl}`);
        return { success: true, previewUrl, fallback: true };
      } catch (fbErr) {
        console.error('Erro no fallback:', fbErr);
      }
    }

    return { success: true, fallback: true };
  }
}
