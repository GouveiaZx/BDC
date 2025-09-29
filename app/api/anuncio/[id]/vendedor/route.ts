import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '../../../../lib/secureSupabase';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adId = params.id;

    if (!adId) {
      return NextResponse.json({ error: 'ID do anúncio não fornecido' }, { status: 400 });
    }

    // Buscar o anúncio para obter o ID do vendedor (consulta pública)
    const supabase = createSupabaseClient();
    const { data: ad, error } = await supabase
      .from('advertisements')
      .select('user_id')
      .eq('id', adId)
      .single();
    
    if (error || !ad) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    const userId = ad.user_id;
    
    if (!userId) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Redirecionar para a página do vendedor
    return NextResponse.redirect(new URL(`/loja/${userId}`, request.url));
    
  } catch (error) {
    return NextResponse.redirect(new URL('/', request.url));
  }
} 