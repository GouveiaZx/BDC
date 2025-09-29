import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdminClient } from '../../../lib/supabase';
import { BusinessModerationStatus } from '../../../models/types';

// Obter todas as empresas REAIS com filtro de status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const supabase = getSupabaseAdminClient();
    let allBusinesses: any[] = [];

    // 1. Buscar da tabela business_profiles (empresas cadastradas)
    try {
      let businessQuery = supabase
        .from('business_profiles')
        .select('*');

      // Aplicar filtros se fornecidos
      if (search) {
        businessQuery = businessQuery.or(
          `company_name.ilike.%${search}%,description.ilike.%${search}%,contact_name.ilike.%${search}%`
        );
      }

      if (category && category !== 'all') {
        businessQuery = businessQuery.contains('categories', [category]);
      }

      const { data: businessProfiles, error: businessError } = await businessQuery
        .order('created_at', { ascending: false });

      if (!businessError && businessProfiles && businessProfiles.length > 0) {
        // Converter para formato esperado pelo admin
        const formattedBusinesses = businessProfiles.map((profile: any) => ({
          id: profile.id,
          businessName: profile.company_name || profile.business_name || 'Empresa',
          contactName: profile.contact_name || 'Responsável',
          phone: profile.contact_phone || profile.phone || '',
          email: profile.contact_email || profile.email || '',
          address: profile.address || '',
          city: profile.city || '',
          state: profile.state || '',
          logo: profile.logo_url || '',
          banner: profile.banner_url || '',
          description: profile.description || 'Empresa cadastrada na plataforma',
          categories: profile.categories || [],
          website: profile.website || '',
          socialMedia: {
            facebook: profile.facebook || '',
            instagram: profile.instagram || '',
            whatsapp: profile.whatsapp || profile.contact_phone || profile.phone || '',
            other: ''
          },
          verified: profile.is_verified || true, // business_profiles são sempre verificados
          userId: profile.user_id,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
          moderationStatus: BusinessModerationStatus.APPROVED, // business_profiles são sempre aprovados
          moderationReason: '',
          moderationDate: null,
          moderatedBy: '',
          source: 'business_profiles'
        }));

        allBusinesses = [...allBusinesses, ...formattedBusinesses];
      }
    } catch (error) {
    }

    // 2. Buscar da tabela profiles com type='business'
    try {
      let profileQuery = supabase
        .from('profiles')
        .select('*')
        .eq('type', 'business');

      if (search) {
        profileQuery = profileQuery.or(
          `name.ilike.%${search}%,bio.ilike.%${search}%,business_name.ilike.%${search}%`
        );
      }

      const { data: profiles, error: profileError } = await profileQuery
        .order('created_at', { ascending: false });

      if (!profileError && profiles && profiles.length > 0) {
        const formattedProfiles = profiles.map((profile: any) => ({
          id: `profile-${profile.id}`,
          businessName: profile.business_name || profile.name || 'Empresa',
          contactName: profile.name || 'Responsável',
          phone: profile.phone || '',
          email: profile.email || '',
          address: profile.address || '',
          city: profile.city || '',
          state: profile.state || '',
          logo: profile.avatar_url || '',
          banner: profile.banner_url || '',
          description: profile.bio || 'Perfil de empresa cadastrado na plataforma',
          categories: profile.categories || [],
          website: profile.website || '',
          socialMedia: {
            facebook: profile.facebook || '',
            instagram: profile.instagram || '',
            whatsapp: profile.whatsapp || profile.phone || '',
            other: ''
          },
          verified: profile.is_verified || false,
          userId: profile.id,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
          moderationStatus: profile.moderation_status || BusinessModerationStatus.APPROVED,
          moderationReason: profile.moderation_reason || '',
          moderationDate: profile.moderation_date || null,
          moderatedBy: profile.moderated_by || '',
          source: 'profiles'
        }));

        allBusinesses = [...allBusinesses, ...formattedProfiles];
      }
    } catch (error) {
    }

    // 3. Buscar da tabela users com user_type='business'
    try {
      let userQuery = supabase
        .from('users')
        .select('*')
        .eq('user_type', 'business');

      if (search) {
        userQuery = userQuery.or(
          `name.ilike.%${search}%,bio.ilike.%${search}%`
        );
      }

      const { data: users, error: userError } = await userQuery
        .order('created_at', { ascending: false });

      if (!userError && users && users.length > 0) {
        const formattedUsers = users.map((user: any) => ({
          id: `user-${user.id}`,
          businessName: user.name || 'Empresa',
          contactName: user.name || 'Responsável',
          phone: user.phone || '',
          email: user.email || '',
          address: user.address || '',
          city: user.city || '',
          state: user.state || '',
          logo: user.profile_image_url || '',
          banner: '',
          description: user.bio || 'Usuário empresarial cadastrado na plataforma',
          categories: [],
          website: user.website || '',
          socialMedia: {
            facebook: '',
            instagram: '',
            whatsapp: user.whatsapp || user.phone || '',
            other: ''
          },
          verified: user.email_verified || false,
          userId: user.id,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          moderationStatus: BusinessModerationStatus.APPROVED,
          moderationReason: '',
          moderationDate: null,
          moderatedBy: '',
          source: 'users'
        }));

        allBusinesses = [...allBusinesses, ...formattedUsers];
      }
    } catch (error) {
    }

    // Buscar dados dos usuários para enriquecer as informações
    const userIds = allBusinesses.map(b => b.userId).filter(Boolean);
    const uniqueUserIds = Array.from(new Set(userIds));
    
    let usersMap: Record<string, any> = {};
    
    if (uniqueUserIds.length > 0) {
      try {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, name, email, phone, created_at, is_active')
          .in('id', uniqueUserIds);
        
        if (!usersError && users) {
          users.forEach(user => {
            usersMap[user.id] = {
              id: user.id,
              email: user.email,
              name: user.name,
              phone: user.phone,
              type: 'business',
              createdAt: user.created_at,
              avatarUrl: '',
              isBlocked: !user.is_active,
              isVerified: true
            };
          });
        }
      } catch (error) {
      }
    }

    // Adicionar dados do usuário a cada empresa
    allBusinesses = allBusinesses.map(business => ({
      ...business,
      user: usersMap[business.userId] || null
    }));

    // Aplicar filtros adicionais
    let filteredBusinesses = allBusinesses;
    
    if (status && status !== 'all') {
      filteredBusinesses = filteredBusinesses.filter(business => 
        business.moderationStatus === status
      );
    }

    // Remover duplicatas por userId
    const uniqueBusinesses = filteredBusinesses.filter((business, index, self) => 
      index === self.findIndex((b) => b.userId === business.userId)
    );

    // Aplicar paginação
    const startIndex = offset;
    const endIndex = Math.min(offset + limit, uniqueBusinesses.length);
    const paginatedBusinesses = uniqueBusinesses.slice(startIndex, endIndex);
    // Se não encontrou nenhuma empresa real, retornar array vazio
    if (paginatedBusinesses.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          offset,
          limit
        },
        message: 'Nenhuma empresa cadastrada encontrada'
      });
    }
    
    return NextResponse.json({
      success: true,
      data: paginatedBusinesses,
      pagination: {
        total: uniqueBusinesses.length,
        offset,
        limit
      }
    });
    
  } catch (error) {
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
    // Verificar autenticação admin primeiro
    if (!verifyAdminAuth(request)) {
      return NextResponse.json({
        success: false,
        error: 'Acesso negado. Autenticação de administrador necessária.'
      }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID da empresa não fornecido'
      }, { status: 400 });
    }
    
    // Obter cliente admin do Supabase
    const admin = getSupabaseAdminClient();
    
    // Verificar se o ID pertence a perfis pessoais (começam com "personal-")
    if (id.startsWith('personal-')) {
      // Extrair o user_id real do prefixo "personal-"
      const userId = id.replace('personal-', '');
      // Excluir da tabela profiles
      const { error: profileDeleteError } = await admin
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (profileDeleteError) {
        return NextResponse.json({
          success: false,
          error: `Erro ao excluir perfil pessoal: ${profileDeleteError.message}`
        }, { status: 500 });
      }
      return NextResponse.json({
        success: true,
        message: 'Perfil pessoal excluído com sucesso'
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
      const { error: deleteError } = await admin
        .from('business_profiles')
        .delete()
        .eq('id', id);
      
      if (deleteError) {
        return NextResponse.json({
          success: false,
          error: deleteError.message
        }, { status: 500 });
      }
      return NextResponse.json({
        success: true,
        message: 'Perfil de negócio excluído com sucesso'
      });
    }
    // Excluir empresa da tabela businesses
    const { error } = await admin
      .from('businesses')
      .delete()
      .eq('id', id);
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      message: 'Empresa excluída com sucesso'
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 