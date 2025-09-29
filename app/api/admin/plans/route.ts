import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuração direta do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Validação de ambiente
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Variáveis de ambiente Supabase obrigatórias não configuradas');
}
// Cliente com privilégios de service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

// Usar renderização dinâmica
export const dynamic = 'force-dynamic';

/**
 * Verifica se a requisição vem de um administrador autenticado
 */
function verifyAdminAuth(request: NextRequest): boolean {
  const authCookie = request.cookies.get('admin-auth')?.value;
  return authCookie === 'true';
}

/**
 * GET - Listar planos disponíveis
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    if (!verifyAdminAuth(request)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Não autenticado' 
      }, { status: 401 });
    }
    // Testar conexão primeiro
    const { data: testData, error: testError } = await supabase
      .from('plans')
      .select('count', { count: 'exact', head: true });
    if (testError) {
      return NextResponse.json({
        success: false,
        message: 'Erro de conexão com o banco: ' + testError.message,
        details: testError
      }, { status: 500 });
    }
    
    // Buscar todos os planos ativos
    const { data: plans, error } = await supabase
      .from('plans')
      .select('*');
    if (error) {
      return NextResponse.json({
        success: false,
        message: 'Erro ao buscar planos: ' + error.message,
        details: error
      }, { status: 500 });
    }
    // Formatar dados para o frontend
    const formattedPlans = (plans || []).map(plan => {
      // Gerar recursos dinamicamente baseado nas características do plano
      const features = [];
      
      // Recursos baseados nos dados existentes
      if (plan.max_ads) {
        if (plan.max_ads === 1) {
          features.push('1 anúncio ativo');
        } else {
          features.push(`${plan.max_ads} anúncios ativos`);
        }
      }
      
      if (plan.max_highlights_per_day > 0) {
        features.push(`${plan.max_highlights_per_day} destaques por dia`);
      } else {
        features.push('Publicação básica');
      }
      
      if (plan.ad_duration_days) {
        features.push(`Válido por ${plan.ad_duration_days} dias`);
      }
      
      if (plan.max_photos_per_ad > 5) {
        features.push(`Até ${plan.max_photos_per_ad} fotos por anúncio`);
      }
      
      if (plan.has_premium_features) {
        features.push('Recursos premium inclusos');
      }
      
      // Recursos específicos por nome do plano
      if (plan.name === 'Gratuito') {
        features.push('Suporte por email', 'Publicação simples');
      } else if (plan.name === 'Microempresa') {
        features.push('Destaque básico', 'Suporte prioritário', 'Relatórios simples');
      } else if (plan.name === 'Pequena Empresa') {
        features.push('Destaque premium', 'Relatórios avançados', 'Logo da empresa', 'Múltiplas categorias');
      } else if (plan.name === 'Empresa') {
        features.push('Destaque máximo', 'CRM básico', 'Prioridade na busca', 'Relatórios completos');
      } else if (plan.name === 'Empresa Plus') {
        features.push('Destaque ilimitado', 'CRM completo', 'Suporte 24/7', 'API de integração', 'Gerente de conta');
      }
      
      return {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: parseFloat(plan.price_monthly || '0'),
        priceMonthly: parseFloat(plan.price_monthly || '0'),
        priceYearly: parseFloat(plan.price_yearly || '0'),
        features: features.length > 0 ? features : ['Recursos básicos'],
        maxAds: plan.max_ads || 0,
        highlighted: plan.is_featured || false,
        userType: plan.slug || 'personal',
        active: plan.is_active || true,
        order: 0
      };
    });
    return NextResponse.json({
      success: true,
      plans: formattedPlans, // Mudança para 'plans' (compatível com frontend)
      data: formattedPlans    // Mantém 'data' para retrocompatibilidade
    });
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 