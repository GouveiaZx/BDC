import { NextRequest, NextResponse } from 'next/server';
import { sendEmailWithRetry, validateEmail, logEmail, EmailData } from '../../../lib/resend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, html, text, template, templateData, context } = body;

    // Validações básicas
    if (!to || !subject || !html) {
      return NextResponse.json({
        success: false,
        error: 'Campos obrigatórios: to, subject, html'
      }, { status: 400 });
    }

    // Validar formato dos emails
    const emails = Array.isArray(to) ? to : [to];
    for (const email of emails) {
      if (!validateEmail(email)) {
        return NextResponse.json({
          success: false,
          error: `Email inválido: ${email}`
        }, { status: 400 });
      }
    }

    // Preparar dados do email
    const emailData: EmailData = {
      to,
      subject,
      html,
      text,
      tags: [
        { name: 'source', value: 'bdc-classificados' },
        { name: 'context', value: context || 'manual' }
      ]
    };

    // Enviar email
    const result = await sendEmailWithRetry(emailData);

    // Log do resultado
    await logEmail(emailData, result, context);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Email enviado com sucesso',
        id: result.id
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}

// GET para testar a API
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'API de emails funcionando',
    timestamp: new Date().toISOString()
  });
} 