import { createBaseTemplate } from './base-template';
import { EMAIL_CONFIG } from '../resend';

export interface AdCreatedEmailProps {
  userName: string;
  adTitle: string;
  adId: string;
  category: string;
  moderationNote?: string;
}

export function createAdCreatedEmail({
  userName,
  adTitle,
  adId,
  category,
  moderationNote
}: AdCreatedEmailProps) {
  
  const content = `
    <p>Seu anúncio foi recebido com sucesso e está sendo analisado pela nossa equipe de moderação.</p>
    
    <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #0ea5e9;">
      <h4 style="color: #0c4a6e; margin-bottom: 10px;">📝 Anúncio Recebido</h4>
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid #bae6fd;">
          <td style="padding: 8px 0; color: #0284c7;"><strong>Título:</strong></td>
          <td style="padding: 8px 0; color: #0c4a6e;">${adTitle}</td>
        </tr>
        <tr style="border-bottom: 1px solid #bae6fd;">
          <td style="padding: 8px 0; color: #0284c7;"><strong>Categoria:</strong></td>
          <td style="padding: 8px 0; color: #0c4a6e;">${category}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #0284c7;"><strong>Status:</strong></td>
          <td style="padding: 8px 0; color: #0c4a6e;">Aguardando Moderação</td>
        </tr>
      </table>
    </div>
    
    <h3 style="color: #4a5568; margin: 25px 0 15px 0;">O que acontece agora?</h3>
    
    <ul style="margin: 15px 0; padding-left: 20px;">
      <li style="margin-bottom: 8px;"><strong>Análise:</strong> Nossa equipe verificará se o anúncio está conforme as políticas</li>
      <li style="margin-bottom: 8px;"><strong>Tempo:</strong> O processo de moderação leva até 24 horas</li>
      <li style="margin-bottom: 8px;"><strong>Notificação:</strong> Você receberá um email quando for aprovado</li>
      <li style="margin-bottom: 8px;"><strong>Publicação:</strong> Após aprovado, seu anúncio ficará visível por 90 dias</li>
    </ul>
    
    ${moderationNote ? `
    <div style="background: #fff7ed; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 3px solid #f59e0b;">
      <h4 style="color: #92400e; margin-bottom: 10px;">💡 Dica de Moderação</h4>
      <p style="margin: 0; color: #92400e;">${moderationNote}</p>
    </div>
    ` : ''}
    
    <h3 style="color: #4a5568; margin: 25px 0 15px 0;">Enquanto aguarda a aprovação:</h3>
    
    <ul style="margin: 15px 0; padding-left: 20px;">
      <li style="margin-bottom: 8px;"><strong>Prepare-se:</strong> Organize informações adicionais se necessário</li>
      <li style="margin-bottom: 8px;"><strong>Planeje:</strong> Pense em como divulgar após a aprovação</li>
      <li style="margin-bottom: 8px;"><strong>Considere:</strong> Destacar o anúncio para maior visibilidade</li>
      <li style="margin-bottom: 8px;"><strong>Monitore:</strong> Acompanhe pelo painel de anunciante</li>
    </ul>
    
    <p>Obrigado por escolher nossa plataforma para anunciar. Trabalhamos para que seu produto tenha máxima visibilidade!</p>
  `;

  return {
    subject: `📝 Anúncio Recebido: ${adTitle}`,
    html: createBaseTemplate({
      title: 'Anúncio Recebido',
      preheader: `Seu anúncio "${adTitle}" está sendo analisado pela nossa equipe.`,
      content,
      userName,
      ctaButton: {
        text: 'Acompanhar Status',
        url: `${EMAIL_CONFIG.COMPANY_URL}/painel-anunciante/meus-anuncios`
      },
      footerText: 'Seu sucesso é o nosso objetivo!'
    }),
    text: `Anúncio Recebido: ${adTitle}\n\nSeu anúncio está sendo analisado e você será notificado quando for aprovado.\n\nAcompanhe: ${EMAIL_CONFIG.COMPANY_URL}/painel-anunciante/meus-anuncios`
  };
} 