import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

// API para verificar e sincronizar cidades
export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();

    // Cidades hardcoded no frontend que deveriam existir no banco
    const cidadesEsperadas = [
      "Barra do Corda",
      "Fernando Falcão", 
      "Jenipapo dos Vieiras",
      "Presidente Dutra",
      "Grajaú",
      "Formosa da Serra Negra",
      "Itaipava do Grajaú",
      "Esperantinópolis"
    ];
    // Buscar todas as cidades no banco
    const { data: existingCities, error } = await supabase
      .from('cities')
      .select('name, state, is_active')
      .eq('state', 'MA')
      .order('name');

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar cidades'
      }, { status: 500 });
    }

    const existingCityNames = existingCities.map(city => city.name);
    const missingCities = cidadesEsperadas.filter(city => 
      !existingCityNames.includes(city)
    );
    return NextResponse.json({
      success: true,
      esperadas: cidadesEsperadas,
      existentes: existingCityNames,
      faltando: missingCities,
      total_banco: existingCities.length,
      cidades_banco: existingCities
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}

// POST - Inserir cidades faltando
export async function POST() {
  try {
    const supabase = getSupabaseAdminClient();

    const cidadesParaInserir = [
      "Barra do Corda",
      "Fernando Falcão", 
      "Jenipapo dos Vieiras",
      "Presidente Dutra",
      "Grajaú",
      "Formosa da Serra Negra",
      "Itaipava do Grajaú",
      "Esperantinópolis"
    ];
    const cidadesData = cidadesParaInserir.map(cidade => ({
      name: cidade,
      state: 'MA',
      is_active: true
    }));

    const { data: insertedCities, error } = await supabase
      .from('cities')
      .upsert(cidadesData, { 
        onConflict: 'name,state',
        ignoreDuplicates: true 
      })
      .select();

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao inserir cidades: ' + error.message
      }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      message: `${cidadesData.length} cidades sincronizadas com sucesso`,
      inserted: insertedCities
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
} 