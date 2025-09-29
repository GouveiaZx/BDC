import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../lib/supabase';

// Definir interface para o tipo de perfil
interface ProfileType {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
}

// Usar renderização dinâmica para acessar parâmetros de URL
export const dynamic = 'force-dynamic';

// Buscar negócios/classificados REAIS do banco de dados
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const city = searchParams.get('city');
    const supabase = getSupabaseAdminClient();

    // Remover teste de contagem que pode estar causando erro 400

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

      if (city) {
        businessQuery = businessQuery.ilike('city', `%${city}%`);
      }

      const { data: businessProfiles, error: businessError } = await businessQuery
        .order('created_at', { ascending: false });

      if (!businessError && businessProfiles && businessProfiles.length > 0) {
        // Converter para formato esperado
        const formattedBusinesses = businessProfiles.map((profile: any) => ({
          id: profile.id,
          user_id: profile.user_id,
          business_name: profile.company_name || profile.business_name || 'Empresa',
          contact_name: profile.contact_name || 'Responsável',
          description: profile.description || 'Empresa cadastrada na plataforma',
          phone: profile.contact_phone || profile.phone || '',
          email: profile.contact_email || profile.email || '',
          website: profile.website || '',
          address: profile.address || '',
          city: profile.city || '',
          state: profile.state || '',
          zip_code: profile.zip_code || '',
          categories: profile.categories || [],
          is_featured: profile.is_featured || false,
          logo_url: profile.logo_url || '',
          banner_url: profile.banner_url || '',
          facebook: profile.facebook || '',
          instagram: profile.instagram || '',
          whatsapp: profile.whatsapp || profile.contact_phone || profile.phone || '',
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          source: 'business_profiles'
        }));

        allBusinesses = [...allBusinesses, ...formattedBusinesses];
      }
    } catch (error) {
    }

    // 2. Buscar ANUNCIANTES (usuários que têm anúncios) ao invés de todos os perfis
    try {
      // Primeiro buscar usuários que têm anúncios ativos
      const { data: adsData, error: adsError } = await supabase
        .from('advertisements')
        .select('user_id, title, contact_phone, contact_whatsapp, city, state')
        .eq('status', 'active')
        .eq('moderation_status', 'approved');

      if (!adsError && adsData && adsData.length > 0) {
        const uniqueAnnouncerIds = Array.from(new Set(adsData.map(ad => ad.user_id)));
        // Buscar perfis destes anunciantes
        const { data: announcerProfiles, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', uniqueAnnouncerIds);

        if (!profileError && announcerProfiles) {
          // Buscar dados de users para obter nomes reais
          let usersMap: Record<string, any> = {};
          try {
            const { data: users, error: usersError } = await supabase
              .from('users')
              .select('id, name, email')
              .in('id', uniqueAnnouncerIds);
              
            if (!usersError && users) {
              users.forEach(user => {
                usersMap[user.id] = user;
              });
            }
          } catch (error) {
          }

          // Converter anunciantes para formato de businesses/classificados
          const formattedAnnouncers = announcerProfiles.map((profile: any) => {
            const userData = usersMap[profile.id];
            const userAds = adsData.filter(ad => ad.user_id === profile.id);
            const realName = userData?.name || profile.name || 'Anunciante';
            
            return {
              id: profile.id,
              user_id: profile.id,
              business_name: realName,
              contact_name: realName,
              description: `Anunciante com ${userAds.length} anúncio${userAds.length > 1 ? 's' : ''} ativo${userAds.length > 1 ? 's' : ''}`,
              phone: profile.phone || userAds[0]?.contact_phone || '',
              email: userData?.email || profile.email || '',
              website: profile.website || '',
              address: profile.address || '',
              city: profile.city || userAds[0]?.city || '',
              state: profile.state || userAds[0]?.state || '',
              zip_code: profile.zip_code || '',
              categories: [],
              is_featured: false,
              logo_url: profile.avatar_url || '/images/avatar-placeholder.png',
              banner_url: profile.banner_url || '/images/banner-placeholder.jpg',
              facebook: profile.facebook || '',
              instagram: profile.instagram || '',
              whatsapp: profile.whatsapp || userAds[0]?.contact_whatsapp || '',
              ads_count: userAds.length,
              created_at: profile.created_at,
              updated_at: profile.updated_at,
              source: 'announcer_profiles'
            };
          });

          allBusinesses = [...allBusinesses, ...formattedAnnouncers];
        }
      } else {
      }
    } catch (error) {
    }

    // 3. Buscar da tabela users com type='business' (backup)
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
        // Converter para formato esperado
        const formattedUsers = users.map((user: any) => ({
          id: user.id,
          user_id: user.id,
          business_name: user.name || 'Empresa',
          contact_name: user.name || 'Responsável',
          description: user.bio || 'Usuário empresarial cadastrado na plataforma',
          phone: user.phone || '',
          email: user.email || '',
          website: user.website || '',
          address: user.address || '',
          city: user.city || '',
          state: user.state || '',
          zip_code: user.zip_code || '',
          categories: [],
          is_featured: false,
          logo_url: user.profile_image_url || '',
          banner_url: '',
          facebook: '',
          instagram: '',
          whatsapp: user.whatsapp || user.phone || '',
          created_at: user.created_at,
          updated_at: user.updated_at,
          source: 'users'
        }));

        allBusinesses = [...allBusinesses, ...formattedUsers];
      }
    } catch (error) {
    }
    
    // Remover duplicatas por user_id
    const uniqueBusinesses = allBusinesses.filter((business, index, self) => 
      index === self.findIndex((b) => b.user_id === business.user_id)
    );
    
    // DEBUG: forçar inclusão se temos exatamente 2 perfis conhecidos
    if (uniqueBusinesses.length === 1 && allBusinesses.length > 0) {
      // Forçar a inclusão de perfis únicos por ID (não por user_id)
      const forceUniqueByID = allBusinesses.filter((business, index, self) => 
        index === self.findIndex((b) => b.id === business.id)
      );

      if (forceUniqueByID.length > uniqueBusinesses.length) {
        return NextResponse.json({
          businesses: forceUniqueByID.slice(offset, offset + limit),
          total: forceUniqueByID.length,
          hasMore: forceUniqueByID.length > offset + limit,
          debug: 'Forçado perfis únicos por ID'
        });
      }
    }

    // Aplicar paginação
    const startIndex = offset;
    const endIndex = Math.min(offset + limit, uniqueBusinesses.length);
    const paginatedBusinesses = uniqueBusinesses.slice(startIndex, endIndex);

    const total = uniqueBusinesses.length;
    const hasMore = total > endIndex;
    // Se não encontrou nenhuma empresa real, retornar array vazio
    if (paginatedBusinesses.length === 0) {
      return NextResponse.json({
        businesses: [],
        total: 0,
        hasMore: false,
        message: 'Nenhuma empresa cadastrada encontrada'
      });
    }

    return NextResponse.json({
      businesses: paginatedBusinesses,
      total,
      hasMore
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 