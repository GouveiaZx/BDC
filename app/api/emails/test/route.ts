import { NextRequest, NextResponse } from 'next/server';
import { 
  sendWelcomeEmail,
  sendAdModerationEmail,
  sendPaymentConfirmationEmail,
  sendReportNotificationEmail,
  sendAdExpirationEmail
} from '../../../lib/email-templates';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, testData } = body;

    console.log('[Email Test] Testando email tipo:', type);

    let result;

    switch (type) {
      case 'welcome':
        result = await sendWelcomeEmail({
          userName: testData.userName || 'Eduardo Gouveia',
          userEmail: testData.userEmail || 'gouveiarx@gmail.com'
        });
        break;

      case 'ad_approved':
        result = await sendAdModerationEmail({
          userName: testData.userName || 'Eduardo Gouveia',
          userEmail: testData.userEmail || 'gouveiarx@gmail.com',
          adTitle: testData.adTitle || 'iPhone 14 Pro Max 256GB',
          adId: testData.adId || 'test-ad-123',
          status: 'approved'
        });
        break;

      case 'ad_rejected':
        result = await sendAdModerationEmail({
          userName: testData.userName || 'Eduardo Gouveia',
          userEmail: testData.userEmail || 'gouveiarx@gmail.com',
          adTitle: testData.adTitle || 'iPhone 14 Pro Max 256GB',
          adId: testData.adId || 'test-ad-123',
          status: 'rejected',
          rejectionReason: testData.rejectionReason || 'Imagens de baixa qualidade. Por favor, use fotos mais claras do produto.',
          moderationNotes: testData.moderationNotes || 'O produto parece estar em bom estado, mas as fotos não permitem avaliar adequadamente.'
        });
        break;

      case 'payment_subscription':
        result = await sendPaymentConfirmationEmail({
          userName: testData.userName || 'Eduardo Gouveia',
          userEmail: testData.userEmail || 'gouveiarx@gmail.com',
          paymentType: 'subscription',
          amount: testData.amount || 149.90,
          planName: testData.planName || 'Pequena Empresa',
          paymentMethod: testData.paymentMethod || 'PIX',
          transactionId: testData.transactionId || 'TXN123456789',
          expiryDate: testData.expiryDate || '30/04/2025'
        });
        break;

      case 'payment_highlight':
        result = await sendPaymentConfirmationEmail({
          userName: testData.userName || 'Eduardo Gouveia',
          userEmail: testData.userEmail || 'gouveiarx@gmail.com',
          paymentType: 'highlight',
          amount: testData.amount || 14.90,
          highlightTitle: testData.highlightTitle || 'iPhone 14 Pro Max - Super Promoção!',
          paymentMethod: testData.paymentMethod || 'Cartão de Crédito',
          transactionId: testData.transactionId || 'TXN987654321'
        });
        break;

      case 'report_notification':
        result = await sendReportNotificationEmail({
          adTitle: testData.adTitle || 'iPhone 14 Pro Max Suspeito',
          adId: testData.adId || 'test-ad-456',
          reportReason: testData.reportReason || 'Produto falsificado',
          reporterEmail: testData.reporterEmail || 'usuario@exemplo.com',
          reportedUserName: testData.reportedUserName || 'João Silva'
        });
        break;

      case 'ad_expiration':
        result = await sendAdExpirationEmail({
          userName: testData.userName || 'Eduardo Gouveia',
          userEmail: testData.userEmail || 'gouveiarx@gmail.com',
          adTitle: testData.adTitle || 'Samsung Galaxy S24 Ultra',
          adId: testData.adId || 'test-ad-789',
          daysUntilExpiry: testData.daysUntilExpiry || 3
        });
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Tipo de email inválido. Tipos disponíveis: welcome, ad_approved, ad_rejected, payment_subscription, payment_highlight, report_notification, ad_expiration'
        }, { status: 400 });
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Email de teste "${type}" enviado com sucesso!`,
        emailId: result.id,
        sentTo: testData.userEmail || 'gouveiarx@gmail.com'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[Email Test] Erro:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}

// GET para listar tipos de teste disponíveis
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'API de teste de emails funcionando',
    availableTests: [
      {
        type: 'welcome',
        description: 'Email de boas-vindas',
        requiredFields: ['userName', 'userEmail']
      },
      {
        type: 'ad_approved',
        description: 'Email de anúncio aprovado',
        requiredFields: ['userName', 'userEmail', 'adTitle', 'adId']
      },
      {
        type: 'ad_rejected',
        description: 'Email de anúncio rejeitado',
        requiredFields: ['userName', 'userEmail', 'adTitle', 'adId', 'rejectionReason']
      },
      {
        type: 'payment_subscription',
        description: 'Email de confirmação de assinatura',
        requiredFields: ['userName', 'userEmail', 'amount', 'planName', 'paymentMethod', 'transactionId']
      },
      {
        type: 'payment_highlight',
        description: 'Email de confirmação de destaque',
        requiredFields: ['userName', 'userEmail', 'amount', 'highlightTitle', 'paymentMethod', 'transactionId']
      },
      {
        type: 'report_notification',
        description: 'Email de denúncia para admin',
        requiredFields: ['adTitle', 'adId', 'reportReason', 'reporterEmail', 'reportedUserName']
      },
      {
        type: 'ad_expiration',
        description: 'Email de expiração de anúncio',
        requiredFields: ['userName', 'userEmail', 'adTitle', 'adId', 'daysUntilExpiry']
      }
    ],
    example: {
      type: 'welcome',
      testData: {
        userName: 'Eduardo Gouveia',
        userEmail: 'gouveiarx@gmail.com'
      }
    }
  });
} 