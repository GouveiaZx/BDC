import { createBaseTemplate } from './base-template';
import { EMAIL_CONFIG } from '../resend';

export interface AdModerationEmailProps {
  userName: string;
  adTitle: string;
  adId: string;
  status: 'approved' | 'rejected';
  rejectionReason?: string;
  moderationNotes?: string;
}

export function createAdModerationEmail({
  userName,
  adTitle,
  adId,
  status,
  rejectionReason,
  moderationNotes
}: AdModerationEmailProps) {
  
  if (status === 'approved') {
    const content = `
      <p>Temos uma ótima notícia! Seu anúncio foi <strong style="color: #10b981;">aprovado</strong> e já está disponível na plataforma.</p>
      
      <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #10b981;">
        <h4 style="color: #065f46; margin-bottom: 10px;">📢 Anúncio Aprovado</h4>
        <p style="margin: 0; color: #047857;"><strong>${adTitle}</strong></p>
      </div>
      
      <h3 style="color: #4a5568; margin: 25px 0 15px 0;">Próximos passos:</h3>
      
      <ul style="margin: 15px 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;"><strong>Compartilhe:</strong> Divulgue seu anúncio nas redes sociais</li>
        <li style="margin-bottom: 8px;"><strong>Destaque:</strong> Considere criar um destaque para mais visibilidade</li>
        <li style="margin-bottom: 8px;"><strong>Acompanhe:</strong> Monitore as visualizações no seu painel</li>
        <li style="margin-bottom: 8px;"><strong>Responda:</strong> Mantenha contato rápido com interessados</li>
      </ul>
      
      <p>Seu anúncio está agora disponível para milhares de usuários da nossa plataforma!</p>
    `;

    return {
      subject: `✅ Anúncio Aprovado: ${adTitle}`,
      html: createBaseTemplate({
        title: 'Anúncio Aprovado',
        preheader: `Seu anúncio "${adTitle}" foi aprovado e está no ar!`,
        content,
        userName,
        ctaButton: {
          text: 'Ver Meu Anúncio',
          url: `${EMAIL_CONFIG.COMPANY_URL}/anuncio/${adId}`
        },
        footerText: 'Desejamos muito sucesso em suas vendas!'
      }),
      text: `Anúncio Aprovado: ${adTitle}\n\nSeu anúncio foi aprovado e já está disponível. Acesse: ${EMAIL_CONFIG.COMPANY_URL}/anuncio/${adId}`
    };
  } else {
    const content = `
      <p>Infelizmente, seu anúncio não pôde ser aprovado no momento e precisa de algumas correções.</p>
      
      <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f87171;">
        <h4 style="color: #991b1b; margin-bottom: 10px;">❌ Anúncio Rejeitado</h4>
        <p style="margin: 0; color: #dc2626;"><strong>${adTitle}</strong></p>
      </div>
      
      ${rejectionReason ? `
      <h3 style="color: #4a5568; margin: 25px 0 15px 0;">Motivo da rejeição:</h3>
      <div style="background: #fff7ed; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 3px solid #f59e0b;">
        <p style="margin: 0; color: #92400e;">${rejectionReason}</p>
      </div>
      ` : ''}
      
      ${moderationNotes ? `
      <h3 style="color: #4a5568; margin: 25px 0 15px 0;">Observações da moderação:</h3>
      <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
        <p style="margin: 0; color: #4a5568;">${moderationNotes}</p>
      </div>
      ` : ''}
      
      <h3 style="color: #4a5568; margin: 25px 0 15px 0;">Como corrigir:</h3>
      
      <ul style="margin: 15px 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;"><strong>Revise o conteúdo:</strong> Verifique se está conforme nossas políticas</li>
        <li style="margin-bottom: 8px;"><strong>Atualize as informações:</strong> Corrija dados incompletos</li>
        <li style="margin-bottom: 8px;"><strong>Melhore as imagens:</strong> Use fotos de boa qualidade</li>
        <li style="margin-bottom: 8px;"><strong>Republique:</strong> Após as correções, publique novamente</li>
      </ul>
      
      <p>Nossa equipe analisará novamente após suas correções. Se tiver dúvidas, entre em contato conosco.</p>
    `;

    return {
      subject: `❌ Anúncio Rejeitado: ${adTitle}`,
      html: createBaseTemplate({
        title: 'Anúncio Rejeitado',
        preheader: `Seu anúncio "${adTitle}" precisa de correções.`,
        content,
        userName,
        ctaButton: {
          text: 'Editar Anúncio',
          url: `${EMAIL_CONFIG.COMPANY_URL}/painel-anunciante/meus-anuncios`
        },
        footerText: 'Estamos aqui para ajudar você a vender mais!'
      }),
      text: `Anúncio Rejeitado: ${adTitle}\n\n${rejectionReason || 'Seu anúncio precisa de correções.'}\n\nAcesse: ${EMAIL_CONFIG.COMPANY_URL}/painel-anunciante/meus-anuncios`
    };
  }
} 