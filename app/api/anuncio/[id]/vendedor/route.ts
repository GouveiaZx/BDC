import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../../lib/supabase';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adId = params.id;
    
    if (!adId) {
      return NextResponse.json({ error: 'ID do anúncio não fornecido' }, { status: 400 });
    }
    
    // Buscar o anúncio para obter o ID do vendedor
    const supabase = getSupabaseAdminClient();
    const { data: ad, error } = await supabase
      .from('advertisements')
      .select('user_id')
      .eq('id', adId)
      .single();
    
    if (error || !ad) {
      console.error('Erro ao buscar anúncio:', error || 'Anúncio não encontrado');
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    const userId = ad.user_id;
    
    if (!userId) {
      console.error('ID do vendedor não encontrado para o anúncio:', adId);
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Redirecionar para a página do vendedor
    return NextResponse.redirect(new URL(`/loja/${userId}`, request.url));
    
  } catch (error) {
    console.error('Erro ao processar redirecionamento:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
} 