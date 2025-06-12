import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdminClient } from '../../../lib/supabase';
import { BusinessModerationStatus } from '../../../models/types';

// Obter todas as empresas com filtro de status
export async function GET(request: Request) {
  try {
    console.log('===============================================');
    console.log('API /api/admin/businesses SENDO CHAMADA');
    console.log('===============================================');
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    console.log('Parâmetros da requisição:', { status, category, search, limit, offset });
    
    // Obter cliente admin do Supabase
    const admin = getSupabaseAdminClient();
    
    // Array final de empresas formatadas
    let formattedBusinesses: any[] = [];
    
    try {
      // DIAGNÓSTICO: Verificar tabelas existentes
      console.log('DIAGNÓSTICO: Verificando tabelas existentes...');
      
      try {
        // Verificar tabela de empresas
        const { data: businessSample, error: businessSampleError } = await admin
          .from('businesses')
          .select('id')
          .limit(1);
          
        console.log('Teste de acesso à tabela businesses:', 
          businessSampleError ? `ERRO: ${businessSampleError.message}` : `OK (${businessSample?.length || 0} registros)`);
          
        // Verificar tabela business_profiles
        const { data: profileSample, error: profileSampleError } = await admin
          .from('business_profiles')
          .select('id')
          .limit(1);
          
        console.log('Teste de acesso à tabela business_profiles:', 
          profileSampleError ? `ERRO: ${profileSampleError.message}` : `OK (${profileSample?.length || 0} registros)`);
          
        // Verificar tabela de usuários
        const { data: userSample, error: userSampleError } = await admin
          .from('users')
          .select('id')
          .limit(1);
          
        console.log('Teste de acesso à tabela users:', 
          userSampleError ? `ERRO: ${userSampleError.message}` : `OK (${userSample?.length || 0} registros)`);
          
        // Verificar tabela profiles
        const { data: profilesSample, error: profilesSampleError } = await admin
          .from('profiles')
          .select('id')
          .limit(1);
          
        console.log('Teste de acesso à tabela profiles:', 
          profilesSampleError ? `ERRO: ${profilesSampleError.message}` : `OK (${profilesSample?.length || 0} registros)`);
      } catch (diagError) {
        console.error('Erro durante diagnóstico de tabelas:', diagError);
      }
      
      // PARTE 1: Obter perfis da tabela 'businesses'
      console.log('Buscando empresas da tabela businesses...');
      let query = admin
        .from('businesses')
        .select(`
          *,
          user:users (
            id,
            email,
            name,
            phone,
            user_type,
            created_at,
            avatar_url,
            is_blocked,
            is_verified
          )
        `);
      
      // Aplicar filtros se fornecidos
      if (status) {
        console.log(`Aplicando filtro de status: ${status}`);
        query = query.eq('moderation_status', status);
      }
      
      if (category) {
        console.log(`Aplicando filtro de categoria: ${category}`);
        query = query.contains('categories', [category]);
      }
      
      if (search) {
        console.log(`Aplicando filtro de busca: ${search}`);
        query = query.or(`business_name.ilike.%${search}%,contact_name.ilike.%${search}%,description.ilike.%${search}%`);
      }
      
      // Executar consulta
      const { data: businesses, error: businessesError } = await query
        .order('created_at', { ascending: false });
      
      if (businessesError) {
        console.error('Erro ao buscar empresas da tabela businesses:', businessesError);
      } else {
        console.log(`Encontradas ${businesses?.length || 0} empresas na tabela businesses.`);
        
        // Processar empresas da tabela 'businesses'
        if (businesses && businesses.length > 0) {
          const businessesList = businesses.map(business => ({
            id: business.id,
            businessName: business.business_name,
            contactName: business.contact_name,
            phone: business.phone,
            email: business.email,
            address: business.address,
            city: business.city,
            state: business.state,
            logo: business.logo_url,
            banner: business.banner_url,
            description: business.description,
            categories: business.categories || [],
            website: business.website,
            socialMedia: {
              facebook: business.facebook,
              instagram: business.instagram,
              whatsapp: business.whatsapp,
              other: business.other_social
            },
            verified: business.is_verified || false,
            userId: business.user_id,
            createdAt: business.created_at,
            updatedAt: business.updated_at,
            moderationStatus: business.moderation_status || BusinessModerationStatus.PENDING,
            moderationReason: business.moderation_reason,
            moderationDate: business.moderation_date,
            moderatedBy: business.moderated_by,
            user: business.user ? {
              id: business.user.id,
              email: business.user.email,
              name: business.user.name,
              phone: business.user.phone,
              type: business.user.user_type,
              createdAt: business.user.created_at,
              avatarUrl: business.user.avatar_url,
              isBlocked: business.user.is_blocked,
              isVerified: business.user.is_verified
            } : null,
            source: 'businesses'
          }));
          
          formattedBusinesses = [...formattedBusinesses, ...businessesList];
        }
      }
      
      // PARTE 2: Obter perfis da tabela 'business_profiles'
      console.log('Buscando perfis de negócios da tabela business_profiles...');
      let profileQuery = admin
        .from('business_profiles')
        .select(`
          *,
          profiles (
            id,
            name,
            email,
            phone,
            account_type,
            avatar_url
          )
        `);
      
      // Adicionar filtros se fornecidos
      if (search) {
        profileQuery = profileQuery.or(`company_name.ilike.%${search}%,description.ilike.%${search}%`);
      }
      
      // Executar consulta
      const { data: businessProfiles, error: profilesError } = await profileQuery
        .order('created_at', { ascending: false });
      
      if (profilesError) {
        console.error('Erro ao buscar perfis de negócios:', profilesError);
      } else {
        console.log(`Encontrados ${businessProfiles?.length || 0} perfis de negócios na tabela business_profiles.`);
        
        // Processar perfis de negócios
        if (businessProfiles && businessProfiles.length > 0) {
          // Array para controlar user_ids já adicionados para evitar duplicidades
          const existingUserIds = formattedBusinesses.map(b => b.userId);
          
          const businessProfilesList = businessProfiles
            // Filtrar para evitar duplicatas com a mesma user_id
            .filter(profile => !profile.user_id || !existingUserIds.includes(profile.user_id))
            .map(profile => ({
              id: profile.id,
              businessName: profile.company_name || 'Sem nome',
              contactName: profile.profiles?.name || 'Contato não informado',
              phone: profile.contact_phone || profile.profiles?.phone || 'Não informado',
              email: profile.contact_email || profile.profiles?.email || 'Não informado',
              address: profile.address || 'Não informado',
              city: profile.city || 'Não informado',
              state: profile.state || 'Não informado',
              logo: profile.logo_url || profile.profiles?.avatar_url || '',
              banner: profile.banner_url || '',
              description: profile.description || '',
              categories: (profile.metadata && profile.metadata.categories) 
                ? profile.metadata.categories 
                : ['outros'],
              website: profile.website || '',
              socialMedia: {
                facebook: profile.facebook || '',
                instagram: profile.instagram || '',
                whatsapp: profile.contact_phone || profile.profiles?.phone || '',
                other: ''
              },
              verified: true,
              userId: profile.user_id,
              createdAt: profile.created_at,
              updatedAt: profile.updated_at,
              moderationStatus: BusinessModerationStatus.APPROVED, // Assumimos que perfis de business_profiles já estão aprovados
              moderationReason: '',
              moderationDate: null,
              moderatedBy: '',
              user: profile.profiles ? {
                id: profile.profiles.id,
                email: profile.profiles.email,
                name: profile.profiles.name,
                phone: profile.profiles.phone,
                type: profile.profiles.account_type,
                createdAt: profile.created_at,
                avatarUrl: profile.profiles.avatar_url,
                isBlocked: false,
                isVerified: true
              } : null,
              source: 'business_profiles'
            }));
          
          // Adicionar perfis de negócios à lista
          formattedBusinesses = [...formattedBusinesses, ...businessProfilesList];
          console.log(`Adicionados ${businessProfilesList.length} perfis de negócios à resposta.`);
        }
      }
      
      // PARTE 3: Se necessário, adicionar perfis pessoais para completar
      if (formattedBusinesses.length === 0) {
        console.log('Nenhuma empresa encontrada. Buscando perfis pessoais como fallback...');
        
        // Buscar perfis pessoais
        const { data: profiles, error: profilesError } = await admin
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);
        
        if (profilesError) {
          console.error('Erro ao buscar perfis pessoais:', profilesError);
        } else if (profiles && profiles.length > 0) {
          console.log(`Encontrados ${profiles.length} perfis pessoais.`);
          
          // Formatar perfis pessoais como empresas
          const personalProfiles = profiles.map((profile, index) => ({
            id: `personal-${profile.id}`,
            businessName: profile.name || `Usuário ${index + 1}`,
            contactName: profile.name || 'Não informado',
            phone: profile.phone || 'Não informado',
            email: profile.email || 'Não informado',
            address: 'Não informado',
            city: 'Não informado',
            state: 'Não informado',
            logo: profile.avatar_url || '',
            banner: '',
            description: 'Perfil pessoal',
            categories: [],
            website: '',
            socialMedia: {
              facebook: '',
              instagram: '',
              whatsapp: profile.phone || '',
              other: ''
            },
            verified: false,
            userId: profile.id,
            createdAt: profile.created_at,
            updatedAt: profile.updated_at,
            moderationStatus: BusinessModerationStatus.APPROVED,
            moderationReason: '',
            moderationDate: null,
            moderatedBy: '',
            user: {
              id: profile.id,
              email: profile.email,
              name: profile.name,
              phone: profile.phone,
              type: profile.account_type || 'personal',
              createdAt: profile.created_at,
              avatarUrl: profile.avatar_url,
              isBlocked: false,
              isVerified: false
            },
            source: 'profiles'
          }));
          
          // Adicionar perfis pessoais à lista
          formattedBusinesses = [...formattedBusinesses, ...personalProfiles];
        }
      }
      
      // Aplicar paginação
      const startIndex = offset;
      const endIndex = Math.min(offset + limit, formattedBusinesses.length);
      const paginatedBusinesses = formattedBusinesses.slice(startIndex, endIndex);
      
      console.log(`Retornando ${paginatedBusinesses.length} de ${formattedBusinesses.length} perfis formatados para o frontend`);
      
      return NextResponse.json({
        success: true,
        data: paginatedBusinesses,
        pagination: {
          total: formattedBusinesses.length,
          offset,
          limit
        }
      });
      
    } catch (error) {
      console.error('Erro durante o processamento:', error);
      
      // Se tudo falhar, retornar array vazio
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          offset,
          limit
        }
      });
    }
    
  } catch (error) {
    console.error('Erro ao processar solicitação de empresas:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

// Atualizar status de moderação de uma empresa
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, moderationStatus, moderationReason } = data;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID da empresa não fornecido'
      }, { status: 400 });
    }
    
    // Obter cliente admin do Supabase
    const admin = getSupabaseAdminClient();
    
    // Verificar se o ID pertence a business_profiles
    if (id.startsWith('personal-')) {
      // Não é possível modificar perfis pessoais
      return NextResponse.json({
        success: true,
        message: 'Perfis pessoais não podem ser moderados'
      });
    }
    
    // Primeiro verificar se existe na tabela business_profiles
    const { data: businessProfile, error: profileError } = await admin
      .from('business_profiles')
      .select('id')
      .eq('id', id)
      .single();
      
    if (!profileError && businessProfile) {
      // É um perfil da tabela business_profiles
      // Não é possível modificar diretamente estes perfis
      return NextResponse.json({
        success: true,
        message: 'Perfis de business_profiles são sempre aprovados por padrão'
      });
    }
    
    // Preparar dados para atualização na tabela businesses
    const updateData: any = {
      moderation_status: moderationStatus,
      moderation_date: new Date().toISOString(),
      moderated_by: 'admin' // Idealmente, este seria o ID do admin atual
    };
    
    if (moderationReason) {
      updateData.moderation_reason = moderationReason;
    }
    
    // Se estiver aprovando, definir verified como true
    if (moderationStatus === BusinessModerationStatus.APPROVED) {
      updateData.is_verified = true;
    }
    
    // Atualizar no banco de dados
    const { error } = await admin
      .from('businesses')
      .update(updateData)
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao atualizar empresa:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Empresa atualizada com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao processar atualização de empresa:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

/**
 * Verifica se a requisição vem de um administrador autenticado
 */
function verifyAdminAuth(request: Request): boolean {
  const url = new URL(request.url);
  const cookies = request.headers.get('cookie');
  if (!cookies) return false;
  
  const cookieEntries = cookies.split(';').map(c => c.trim());
  for (const cookie of cookieEntries) {
    const [name, value] = cookie.split('=');
    if (name === 'admin-auth' && value === 'true') {
      return true;
    }
  }
  return false;
}

// Excluir uma empresa
export async function DELETE(request: Request) {
  try {
    console.log('[DELETE] Iniciando exclusão de empresa/perfil');
    
    // Verificar autenticação admin primeiro
    if (!verifyAdminAuth(request)) {
      console.log('[DELETE] Tentativa de acesso sem autenticação admin');
      return NextResponse.json({
        success: false,
        error: 'Acesso negado. Autenticação de administrador necessária.'
      }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    console.log('[DELETE] Tentando excluir empresa/perfil ID:', id);
    
    if (!id) {
      console.log('[DELETE] ID não fornecido');
      return NextResponse.json({
        success: false,
        error: 'ID da empresa não fornecido'
      }, { status: 400 });
    }
    
    // Obter cliente admin do Supabase
    const admin = getSupabaseAdminClient();
    
    // Verificar se o ID pertence a perfis pessoais (começam com "personal-")
    if (id.startsWith('personal-')) {
      console.log('[DELETE] Tentativa de exclusão de perfil pessoal detectada');
      
      // Extrair o user_id real do prefixo "personal-"
      const userId = id.replace('personal-', '');
      console.log('[DELETE] Tentando excluir perfil pessoal com user_id:', userId);
      
      // Excluir da tabela profiles
      const { error: profileDeleteError } = await admin
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (profileDeleteError) {
        console.error('[DELETE] Erro ao excluir perfil pessoal:', profileDeleteError);
        return NextResponse.json({
          success: false,
          error: `Erro ao excluir perfil pessoal: ${profileDeleteError.message}`
        }, { status: 500 });
      }
      
      console.log('[DELETE] Perfil pessoal excluído com sucesso');
      return NextResponse.json({
        success: true,
        message: 'Perfil pessoal excluído com sucesso'
      });
    }
    
    console.log('[DELETE] Verificando se existe na tabela business_profiles...');
    
    // Primeiro verificar se existe na tabela business_profiles
    const { data: businessProfile, error: profileError } = await admin
      .from('business_profiles')
      .select('id')
      .eq('id', id)
      .single();
      
    if (!profileError && businessProfile) {
      console.log('[DELETE] Encontrado na tabela business_profiles, excluindo...');
      
      // É um perfil da tabela business_profiles
      const { error: deleteError } = await admin
        .from('business_profiles')
        .delete()
        .eq('id', id);
      
      if (deleteError) {
        console.error('[DELETE] Erro ao excluir perfil de business_profiles:', deleteError);
        return NextResponse.json({
          success: false,
          error: deleteError.message
        }, { status: 500 });
      }
      
      console.log('[DELETE] Perfil de business_profiles excluído com sucesso');
      return NextResponse.json({
        success: true,
        message: 'Perfil de negócio excluído com sucesso'
      });
    }
    
    console.log('[DELETE] Não encontrado em business_profiles, tentando excluir da tabela businesses...');
    
    // Excluir empresa da tabela businesses
    const { error } = await admin
      .from('businesses')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('[DELETE] Erro ao excluir empresa da tabela businesses:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }
    
    console.log('[DELETE] Empresa excluída com sucesso da tabela businesses');
    return NextResponse.json({
      success: true,
      message: 'Empresa excluída com sucesso'
    });
    
  } catch (error) {
    console.error('[DELETE] Erro ao processar exclusão de empresa:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 