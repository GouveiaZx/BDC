import { EMAIL_CONFIG } from '../resend';

export interface BaseTemplateProps {
  title: string;
  preheader?: string;
  content: string;
  userName?: string;
  footerText?: string;
  ctaButton?: {
    text: string;
    url: string;
  };
}

export function createBaseTemplate({
  title,
  preheader,
  content,
  userName,
  footerText,
  ctaButton
}: BaseTemplateProps): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f8fafc;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 30px 20px;
      text-align: center;
    }
    
    .logo {
      color: #ffffff;
      font-size: 24px;
      font-weight: bold;
      text-decoration: none;
      display: inline-block;
    }
    
    .content {
      padding: 30px 20px;
    }
    
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      color: #4a5568;
    }
    
    .main-content {
      font-size: 16px;
      line-height: 1.8;
      margin-bottom: 30px;
    }
    
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 30px;
      border-radius: 6px;
      font-weight: 600;
      text-align: center;
      margin: 20px 0;
    }
    
    .cta-button:hover {
      opacity: 0.9;
    }
    
    .footer {
      background-color: #f7fafc;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    
    .footer-text {
      font-size: 14px;
      color: #718096;
      margin-bottom: 10px;
    }
    
    .social-links {
      margin: 15px 0;
    }
    
    .social-links a {
      color: #667eea;
      text-decoration: none;
      margin: 0 10px;
      font-size: 14px;
    }
    
    .unsubscribe {
      font-size: 12px;
      color: #a0aec0;
    }
    
    .unsubscribe a {
      color: #a0aec0;
    }
    
    @media only screen and (max-width: 600px) {
      .container {
        border-radius: 0;
        margin: 0;
      }
      
      .content {
        padding: 20px 15px;
      }
      
      .header {
        padding: 20px 15px;
      }
    }
  </style>
</head>
<body>
  ${preheader ? `
  <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: sans-serif; max-height: 0; max-width: 0; opacity: 0; overflow: hidden;">
    ${preheader}
  </div>
  ` : ''}
  
  <div style="padding: 20px 0;">
    <div class="container">
      <div class="header">
        <a href="${EMAIL_CONFIG.COMPANY_URL}" class="logo">
          ${EMAIL_CONFIG.COMPANY_NAME}
        </a>
      </div>
      
      <div class="content">
        ${userName ? `<div class="greeting">Olá, ${userName}!</div>` : ''}
        
        <div class="main-content">
          ${content}
        </div>
        
        ${ctaButton ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${ctaButton.url}" class="cta-button">
            ${ctaButton.text}
          </a>
        </div>
        ` : ''}
      </div>
      
      <div class="footer">
        <div class="footer-text">
          ${footerText || `Obrigado por usar o ${EMAIL_CONFIG.COMPANY_NAME}!`}
        </div>
        
        <div class="social-links">
          <a href="${EMAIL_CONFIG.COMPANY_URL}">Site</a>
          <a href="${EMAIL_CONFIG.COMPANY_URL}/ajuda">Ajuda</a>
          <a href="mailto:${EMAIL_CONFIG.SUPPORT_EMAIL}">Suporte</a>
        </div>
        
        <div class="unsubscribe">
          Este email foi enviado para você porque possui uma conta no ${EMAIL_CONFIG.COMPANY_NAME}.<br>
          Se não deseja mais receber emails, <a href="${EMAIL_CONFIG.COMPANY_URL}/unsubscribe">clique aqui</a>.
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
} 