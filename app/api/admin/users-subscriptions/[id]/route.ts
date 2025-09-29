import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validatePlanChange, applyNewPlanLimits, getUserSubscriptionData } from '../../../../lib/planLimits';

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
  },
  global: {
    headers: {
      'x-client-info': 'supabase-js-admin'
    }
  }
});

export const dynamic = 'force-dynamic';

// Verificar se a requisição tem autenticação válida de admin
function verifyAdminAuth(request: NextRequest): boolean {
  const adminAuth = request.cookies.get('admin-auth')?.value;
  return adminAuth === 'true';
}

/**
 * PUT - Atualizar plano de usuário (criar nova assinatura ou atualizar existente)
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!verifyAdminAuth(request)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Não autenticado' 
      }, { status: 401 });
    }
    
    const id = params.id;
    const { plan_id } = await request.json();
    if (!plan_id) {
      return NextResponse.json({
        success: false,
        message: 'plan_id é obrigatório'
      }, { status: 400 });
    }

    // Extrair userId do ID recebido
    let userId: string;
    let isUserWithoutSubscription = false;
    
    if (id.startsWith('free-')) {
      userId = id.replace('free-', '');
      isUserWithoutSubscription = true;
    } else {
      // O ID recebido é sempre um user_id (não subscription_id)
      userId = id;
      
      // Verificar se existe assinatura ativa para este usuário
      const { data: userSubscription, error: userSubError } = await supabase
        .from('subscriptions')
        .select('id, user_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();
      
      if (userSubscription && !userSubError) {
        isUserWithoutSubscription = false;
      } else {
        // Usuário sem assinatura ativa
        isUserWithoutSubscription = true;
      }
    }
    
    // 1. Validar se a mudança de plano é possível
    const validation = await validatePlanChange(userId, plan_id);
    
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: validation.message
      }, { status: 400 });
    }
    // 2. Verificar se o usuário existe
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', userId)
      .single();
    
    if (userError || !user) {
      return NextResponse.json({
        success: false,
        message: 'Usuário não encontrado'
      }, { status: 404 });
    }
    
    // 3. Verificar se o plano existe
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', plan_id)
      .single();
    
    if (planError || !plan) {
      return NextResponse.json({
        success: false,
        message: 'Plano não encontrado'
      }, { status: 404 });
    }
    
    // 4. Executar mudança de plano
    let limitsResult: any = { success: true, appliedChanges: [] };
    
    try {
      if (isUserWithoutSubscription) {
        // Criar nova assinatura para usuário sem assinatura
        // Primeiro cancelar qualquer assinatura ativa existente (por precaução)
        await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('status', 'active');
        
        // Criar nova assinatura
        const newSubscription = {
          user_id: userId,
          plan_id: plan_id,
          status: 'active',
          starts_at: new Date().toISOString(),
          ends_at: plan.slug === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          payment_method: plan.slug === 'free' ? 'Gratuito' : 'Manual (Admin)',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { error: createError } = await supabase
          .from('subscriptions')
          .insert([newSubscription]);
        
        if (createError) {
          throw new Error('Erro ao criar assinatura: ' + createError.message);
        }
      } else {
        // Atualizar assinatura existente
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({ 
            plan_id: plan_id,
            status: 'active',
            starts_at: new Date().toISOString(),
            ends_at: plan.slug === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            payment_method: plan.slug === 'free' ? 'Gratuito' : 'Manual (Admin)',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('status', 'active');
        
        if (updateError) {
          throw new Error('Erro ao atualizar assinatura: ' + updateError.message);
        }
      }
      
      // 5. Aplicar limitações do novo plano
      limitsResult = await applyNewPlanLimits(userId, plan_id);
      
      if (!limitsResult.success) {
      } else {
      }
      
    } catch (operationError) {
      return NextResponse.json({
        success: false,
        message: operationError instanceof Error ? operationError.message : 'Erro na operação de mudança de plano'
      }, { status: 500 });
    }
    // Mensagem de sucesso com detalhes das limitações aplicadas
    let successMessage = `Plano alterado para "${plan.name}" com sucesso!`;
    if (limitsResult.success && limitsResult.appliedChanges && limitsResult.appliedChanges.length > 0) {
      successMessage += ` Limitações aplicadas: ${limitsResult.appliedChanges.length} itens.`;
    }
    
    return NextResponse.json({
      success: true,
      message: successMessage,
      validation: validation.message,
      planChanges: limitsResult.appliedChanges || []
    });
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor: ' + (error as any).message
    }, { status: 500 });
  }
}