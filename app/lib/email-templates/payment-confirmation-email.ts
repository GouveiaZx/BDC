import { createBaseTemplate } from './base-template';
import { EMAIL_CONFIG } from '../resend';

export interface PaymentConfirmationEmailProps {
  userName: string;
  paymentType: 'subscription' | 'highlight';
  amount: number;
  planName?: string;
  highlightTitle?: string;
  paymentMethod: string;
  transactionId: string;
  expiryDate?: string;
}

export function createPaymentConfirmationEmail({
  userName,
  paymentType,
  amount,
  planName,
  highlightTitle,
  paymentMethod,
  transactionId,
  expiryDate
}: PaymentConfirmationEmailProps) {
  
  const formattedAmount = amount.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  let content: string;
  let subject: string;
  let ctaText: string;
  let ctaUrl: string;

  if (paymentType === 'subscription') {
    subject = `✅ Pagamento Confirmado - Plano ${planName}`;
    ctaText = 'Acessar Minha Conta';
    ctaUrl = `${EMAIL_CONFIG.COMPANY_URL}/painel-anunciante`;
    
    content = `
      <p>Seu pagamento foi processado com sucesso! Seu plano <strong>${planName}</strong> já está ativo.</p>
      
      <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #10b981;">
        <h4 style="color: #065f46; margin-bottom: 15px;">💳 Detalhes do Pagamento</h4>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #d1fae5;">
            <td style="padding: 8px 0; color: #047857;"><strong>Plano:</strong></td>
            <td style="padding: 8px 0; color: #065f46;">${planName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #d1fae5;">
            <td style="padding: 8px 0; color: #047857;"><strong>Valor:</strong></td>
            <td style="padding: 8px 0; color: #065f46;">${formattedAmount}</td>
          </tr>
          <tr style="border-bottom: 1px solid #d1fae5;">
            <td style="padding: 8px 0; color: #047857;"><strong>Método:</strong></td>
            <td style="padding: 8px 0; color: #065f46;">${paymentMethod}</td>
          </tr>
          <tr style="border-bottom: 1px solid #d1fae5;">
            <td style="padding: 8px 0; color: #047857;"><strong>ID Transação:</strong></td>
            <td style="padding: 8px 0; color: #065f46;">${transactionId}</td>
          </tr>
          ${expiryDate ? `
          <tr>
            <td style="padding: 8px 0; color: #047857;"><strong>Válido até:</strong></td>
            <td style="padding: 8px 0; color: #065f46;">${expiryDate}</td>
          </tr>
          ` : ''}
        </table>
      </div>
      
      <h3 style="color: #4a5568; margin: 25px 0 15px 0;">Benefícios do seu plano:</h3>
      
      <ul style="margin: 15px 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;"><strong>Mais anúncios:</strong> Publique mais produtos</li>
        <li style="margin-bottom: 8px;"><strong>Duração estendida:</strong> Anúncios ficam mais tempo online</li>
        <li style="margin-bottom: 8px;"><strong>Destaques inclusos:</strong> Maior visibilidade</li>
        <li style="margin-bottom: 8px;"><strong>Suporte prioritário:</strong> Atendimento especial</li>
      </ul>
      
      <p>Aproveite todos os recursos do seu novo plano e aumente suas vendas!</p>
    `;
  } else {
    subject = `✅ Destaque Confirmado - ${highlightTitle}`;
    ctaText = 'Ver Meus Destaques';
    ctaUrl = `${EMAIL_CONFIG.COMPANY_URL}/painel-anunciante/meus-destaques`;
    
    content = `
      <p>Seu destaque foi criado com sucesso e já está ativo na plataforma!</p>
      
      <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
        <h4 style="color: #92400e; margin-bottom: 15px;">🎯 Detalhes do Destaque</h4>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #fde68a;">
            <td style="padding: 8px 0; color: #d97706;"><strong>Destaque:</strong></td>
            <td style="padding: 8px 0; color: #92400e;">${highlightTitle}</td>
          </tr>
          <tr style="border-bottom: 1px solid #fde68a;">
            <td style="padding: 8px 0; color: #d97706;"><strong>Valor:</strong></td>
            <td style="padding: 8px 0; color: #92400e;">${formattedAmount}</td>
          </tr>
          <tr style="border-bottom: 1px solid #fde68a;">
            <td style="padding: 8px 0; color: #d97706;"><strong>Método:</strong></td>
            <td style="padding: 8px 0; color: #92400e;">${paymentMethod}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #d97706;"><strong>ID Transação:</strong></td>
            <td style="padding: 8px 0; color: #92400e;">${transactionId}</td>
          </tr>
        </table>
      </div>
      
      <h3 style="color: #4a5568; margin: 25px 0 15px 0;">Seu destaque está ativo:</h3>
      
      <ul style="margin: 15px 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;"><strong>Visibilidade máxima:</strong> Aparece no topo da home</li>
        <li style="margin-bottom: 8px;"><strong>Formato stories:</strong> Chamada visual atrativa</li>
        <li style="margin-bottom: 8px;"><strong>Duração:</strong> Ativo por 3 dias</li>
        <li style="margin-bottom: 8px;"><strong>Estatísticas:</strong> Acompanhe o desempenho</li>
      </ul>
      
      <p>Seu destaque já está atraindo mais clientes para seu negócio!</p>
    `;
  }

  return {
    subject,
    html: createBaseTemplate({
      title: 'Pagamento Confirmado',
      preheader: `Pagamento de ${formattedAmount} processado com sucesso!`,
      content,
      userName,
      ctaButton: {
        text: ctaText,
        url: ctaUrl
      },
      footerText: 'Obrigado por confiar no BuscaAquiBdC!'
    }),
    text: `${subject}\n\nSeu pagamento de ${formattedAmount} foi confirmado.\nID: ${transactionId}\n\nAcesse: ${ctaUrl}`
  };
} 