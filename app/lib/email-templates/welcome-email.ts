import { createBaseTemplate } from './base-template';
import { EMAIL_CONFIG } from '../resend';

export interface WelcomeEmailProps {
  userName: string;
  userEmail: string;
}

export function createWelcomeEmail({ userName, userEmail }: WelcomeEmailProps) {
  const content = `
    <p>Seja muito bem-vindo(a) ao <strong>${EMAIL_CONFIG.COMPANY_NAME}</strong>!</p>
    
    <p>Sua conta foi criada com sucesso e você já pode começar a aproveitar nossa plataforma de classificados.</p>
    
    <h3 style="color: #4a5568; margin: 25px 0 15px 0;">O que você pode fazer agora:</h3>
    
    <ul style="margin: 15px 0; padding-left: 20px;">
      <li style="margin-bottom: 8px;"><strong>Complete seu perfil:</strong> Adicione informações sobre sua empresa</li>
      <li style="margin-bottom: 8px;"><strong>Publique anúncios:</strong> Comece a vender seus produtos</li>
      <li style="margin-bottom: 8px;"><strong>Explore categorias:</strong> Descubra oportunidades de negócio</li>
      <li style="margin-bottom: 8px;"><strong>Use destaques:</strong> Ganhe mais visibilidade</li>
    </ul>
    
    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #667eea;">
      <h4 style="color: #4a5568; margin-bottom: 10px;">💡 Dica Importante:</h4>
      <p style="margin: 0; color: #718096;">Complete seu perfil para ganhar mais credibilidade e atrair mais clientes!</p>
    </div>
    
    <p>Se tiver alguma dúvida, nossa equipe de suporte está pronta para ajudar em <a href="mailto:${EMAIL_CONFIG.SUPPORT_EMAIL}" style="color: #667eea;">${EMAIL_CONFIG.SUPPORT_EMAIL}</a>.</p>
    
    <p>Desejamos muito sucesso em suas vendas!</p>
  `;

  return {
    subject: `🎉 Bem-vindo(a) ao ${EMAIL_CONFIG.COMPANY_NAME}!`,
    html: createBaseTemplate({
      title: `Bem-vindo ao ${EMAIL_CONFIG.COMPANY_NAME}`,
      preheader: 'Sua conta foi criada com sucesso! Comece a vender agora.',
      content,
      userName,
      ctaButton: {
        text: 'Acessar Minha Conta',
        url: `${EMAIL_CONFIG.COMPANY_URL}/painel-anunciante`
      },
      footerText: 'Obrigado por escolher o BuscaAquiBdC para suas vendas online!'
    }),
    text: `Bem-vindo ao ${EMAIL_CONFIG.COMPANY_NAME}!\n\nSua conta foi criada com sucesso. Acesse: ${EMAIL_CONFIG.COMPANY_URL}/painel-anunciante`
  };
} 