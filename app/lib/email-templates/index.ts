// Exportar todos os templates
export { createWelcomeEmail, type WelcomeEmailProps } from './welcome-email';
export { createAdModerationEmail, type AdModerationEmailProps } from './ad-moderation-email';
export { createAdCreatedEmail, type AdCreatedEmailProps } from './ad-created-email';
export { createPaymentConfirmationEmail, type PaymentConfirmationEmailProps } from './payment-confirmation-email';
export { createBaseTemplate, type BaseTemplateProps } from './base-template';

// Funções utilitárias para envio
import { sendEmailWithRetry, logEmail } from '../resend';
import { createWelcomeEmail, WelcomeEmailProps } from './welcome-email';
import { createAdModerationEmail, AdModerationEmailProps } from './ad-moderation-email';
import { createAdCreatedEmail, AdCreatedEmailProps } from './ad-created-email';
import { createPaymentConfirmationEmail, PaymentConfirmationEmailProps } from './payment-confirmation-email';
import { createBaseTemplate } from './base-template';

// Função para enviar email de boas-vindas
export async function sendWelcomeEmail(props: WelcomeEmailProps) {
  const emailTemplate = createWelcomeEmail(props);
  
  const result = await sendEmailWithRetry({
    to: props.userEmail,
    subject: emailTemplate.subject,
    html: emailTemplate.html,
    text: emailTemplate.text,
    tags: [
      { name: 'template', value: 'welcome' },
      { name: 'user_email', value: props.userEmail }
    ]
  });
  
  await logEmail(
    { to: props.userEmail, subject: emailTemplate.subject, html: emailTemplate.html },
    result,
    'welcome'
  );
  
  return result;
}

// Função para enviar email de moderação
export async function sendAdModerationEmail(props: AdModerationEmailProps & { userEmail: string }) {
  const emailTemplate = createAdModerationEmail(props);
  
  const result = await sendEmailWithRetry({
    to: props.userEmail,
    subject: emailTemplate.subject,
    html: emailTemplate.html,
    text: emailTemplate.text,
    tags: [
      { name: 'template', value: 'ad_moderation' },
      { name: 'ad_id', value: props.adId },
      { name: 'status', value: props.status }
    ]
  });
  
  await logEmail(
    { to: props.userEmail, subject: emailTemplate.subject, html: emailTemplate.html },
    result,
    `ad_moderation_${props.status}`
  );
  
  return result;
}

// Função para enviar email de anúncio criado
export async function sendAdCreatedEmail(props: AdCreatedEmailProps & { userEmail: string }) {
  const emailTemplate = createAdCreatedEmail(props);
  
  const result = await sendEmailWithRetry({
    to: props.userEmail,
    subject: emailTemplate.subject,
    html: emailTemplate.html,
    text: emailTemplate.text,
    tags: [
      { name: 'template', value: 'ad_created' },
      { name: 'ad_id', value: props.adId },
      { name: 'category', value: props.category }
    ]
  });
  
  await logEmail(
    { to: props.userEmail, subject: emailTemplate.subject, html: emailTemplate.html },
    result,
    'ad_created'
  );
  
  return result;
}

// Função para enviar email de confirmação de pagamento
export async function sendPaymentConfirmationEmail(props: PaymentConfirmationEmailProps & { userEmail: string }) {
  const emailTemplate = createPaymentConfirmationEmail(props);
  
  const result = await sendEmailWithRetry({
    to: props.userEmail,
    subject: emailTemplate.subject,
    html: emailTemplate.html,
    text: emailTemplate.text,
    tags: [
      { name: 'template', value: 'payment_confirmation' },
      { name: 'payment_type', value: props.paymentType },
      { name: 'transaction_id', value: props.transactionId }
    ]
  });
  
  await logEmail(
    { to: props.userEmail, subject: emailTemplate.subject, html: emailTemplate.html },
    result,
    'payment_confirmation'
  );
  
  return result;
}

// Template para denúncia (para admins)
export async function sendReportNotificationEmail(data: {
  adTitle: string;
  adId: string;
  reportReason: string;
  reporterEmail: string;
  reportedUserName: string;
}) {
  const content = `
    <p>Uma nova denúncia foi recebida na plataforma e precisa de análise.</p>
    
    <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f87171;">
      <h4 style="color: #991b1b; margin-bottom: 15px;">🚨 Nova Denúncia</h4>
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid #fecaca;">
          <td style="padding: 8px 0; color: #dc2626;"><strong>Anúncio:</strong></td>
          <td style="padding: 8px 0; color: #991b1b;">${data.adTitle}</td>
        </tr>
        <tr style="border-bottom: 1px solid #fecaca;">
          <td style="padding: 8px 0; color: #dc2626;"><strong>Motivo:</strong></td>
          <td style="padding: 8px 0; color: #991b1b;">${data.reportReason}</td>
        </tr>
        <tr style="border-bottom: 1px solid #fecaca;">
          <td style="padding: 8px 0; color: #dc2626;"><strong>Denunciante:</strong></td>
          <td style="padding: 8px 0; color: #991b1b;">${data.reporterEmail}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #dc2626;"><strong>Usuário Reportado:</strong></td>
          <td style="padding: 8px 0; color: #991b1b;">${data.reportedUserName}</td>
        </tr>
      </table>
    </div>
    
    <p>Acesse o painel administrativo para analisar e tomar as devidas providências.</p>
  `;

  const emailTemplate = {
    subject: `🚨 Nova Denúncia: ${data.adTitle}`,
    html: createBaseTemplate({
      title: 'Nova Denúncia',
      preheader: `Denúncia recebida para o anúncio: ${data.adTitle}`,
      content,
      ctaButton: {
        text: 'Analisar Denúncia',
        url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/denuncias`
      },
      footerText: 'Sistema de moderação BuscaAquiBdC'
    }),
    text: `Nova denúncia: ${data.adTitle}\nMotivo: ${data.reportReason}\nDenunciante: ${data.reporterEmail}`
  };
  
  const result = await sendEmailWithRetry({
    to: process.env.RESEND_ADMIN_EMAIL || 'gouveiarx@gmail.com',
    subject: emailTemplate.subject,
    html: emailTemplate.html,
    text: emailTemplate.text,
    tags: [
      { name: 'template', value: 'report_notification' },
      { name: 'ad_id', value: data.adId }
    ]
  });
  
  return result;
}

// Emails de expiração de anúncios
export async function sendAdExpirationEmail(data: {
  userName: string;
  userEmail: string;
  adTitle: string;
  adId: string;
  daysUntilExpiry: number;
}) {
  const content = `
    <p>Seu anúncio está próximo do vencimento e será removido automaticamente da plataforma.</p>
    
    <div style="background: #fff7ed; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
      <h4 style="color: #92400e; margin-bottom: 10px;">⏰ Anúncio Expirando</h4>
      <p style="margin: 0; color: #d97706;"><strong>${data.adTitle}</strong></p>
      <p style="margin: 10px 0 0 0; color: #92400e;">Expira em: <strong>${data.daysUntilExpiry} dia(s)</strong></p>
    </div>
    
    <h3 style="color: #4a5568; margin: 25px 0 15px 0;">O que você pode fazer:</h3>
    
    <ul style="margin: 15px 0; padding-left: 20px;">
      <li style="margin-bottom: 8px;"><strong>Renovar:</strong> Estenda a duração do anúncio</li>
      <li style="margin-bottom: 8px;"><strong>Editar:</strong> Atualize informações e reative</li>
      <li style="margin-bottom: 8px;"><strong>Destacar:</strong> Dê mais visibilidade</li>
      <li style="margin-bottom: 8px;"><strong>Upgrade:</strong> Considere um plano melhor</li>
    </ul>
    
    <p>Não perca vendas! Mantenha seus anúncios sempre ativos.</p>
  `;

  const emailTemplate = {
    subject: `⏰ Anúncio Expirando: ${data.adTitle}`,
    html: createBaseTemplate({
      title: 'Anúncio Expirando',
      preheader: `Seu anúncio "${data.adTitle}" expira em ${data.daysUntilExpiry} dia(s)`,
      content,
      userName: data.userName,
      ctaButton: {
        text: 'Gerenciar Anúncios',
        url: `${process.env.NEXT_PUBLIC_APP_URL}/painel-anunciante/meus-anuncios`
      },
      footerText: 'Mantenha suas vendas ativas!'
    }),
    text: `Anúncio Expirando: ${data.adTitle}\nExpira em ${data.daysUntilExpiry} dia(s)\nAcesse: ${process.env.NEXT_PUBLIC_APP_URL}/painel-anunciante/meus-anuncios`
  };
  
  const result = await sendEmailWithRetry({
    to: data.userEmail,
    subject: emailTemplate.subject,
    html: emailTemplate.html,
    text: emailTemplate.text,
    tags: [
      { name: 'template', value: 'ad_expiration' },
      { name: 'ad_id', value: data.adId },
      { name: 'days_until_expiry', value: data.daysUntilExpiry.toString() }
    ]
  });
  
  return result;
} 