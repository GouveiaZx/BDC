import { NextRequest, NextResponse } from 'next/server';

// Simular banco de dados com um objeto na memória
// Em um ambiente real, isso seria armazenado em um banco de dados
interface ViewsData {
  [adId: string]: {
    totalViews: number;
    uniqueViews: number; // Visitantes únicos baseados em IP/SessionID
    viewsByDate: {
      [date: string]: number;
    };
    lastViewedAt: Date;
  };
}

let viewsDatabase: ViewsData = {};

// API para registrar uma visualização em um anúncio
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { adId, userId } = data;

    if (!adId) {
      return NextResponse.json(
        { error: 'ID do anúncio é obrigatório' },
        { status: 400 }
      );
    }

    // Simular registro de IP ou sessionId para contar visualizações únicas
    const visitorId = userId || req.ip || 'anonymous';
    
    // Inicializar dados para este anúncio se não existirem
    if (!viewsDatabase[adId]) {
      viewsDatabase[adId] = {
        totalViews: 0,
        uniqueViews: 0,
        viewsByDate: {},
        lastViewedAt: new Date()
      };
    }
    
    // Incrementar visualizações totais
    viewsDatabase[adId].totalViews += 1;
    
    // Registrar data da visualização
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    viewsDatabase[adId].viewsByDate[today] = (viewsDatabase[adId].viewsByDate[today] || 0) + 1;
    
    // Atualizar data da última visualização
    viewsDatabase[adId].lastViewedAt = new Date();
    
    // Aqui poderíamos verificar se o visitante já visualizou e incrementar apenas se for único
    // Para simplicidade, incrementamos sempre (em um app real verificaríamos cookies/sessão)
    viewsDatabase[adId].uniqueViews += 1;
    
    return NextResponse.json({
      success: true,
      views: viewsDatabase[adId].totalViews,
      uniqueViews: viewsDatabase[adId].uniqueViews,
      lastViewedAt: viewsDatabase[adId].lastViewedAt
    });
    
  } catch (error) {
    console.error('Erro ao registrar visualização:', error);
    return NextResponse.json(
      { error: 'Erro ao registrar visualização' },
      { status: 500 }
    );
  }
}

// API para obter estatísticas de visualizações de um anúncio específico
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const adId = searchParams.get('adId');
    const userId = searchParams.get('userId');
    
    // Se adId for fornecido, retornar estatísticas para esse anúncio específico
    if (adId) {
      const adViews = viewsDatabase[adId] || {
        totalViews: 0,
        uniqueViews: 0,
        viewsByDate: {},
        lastViewedAt: null
      };
      
      return NextResponse.json({
        success: true,
        adId,
        views: adViews
      });
    }
    
    // Se userId for fornecido, retornar estatísticas de todos os anúncios desse usuário
    if (userId) {
      // Em um app real, faríamos uma query no banco para buscar todos os anúncios do usuário
      // Aqui vamos simular isso usando IDs fictícios para demonstração
      const userAdIds = ['ad-1', 'ad-2', 'ad-3']; // Simulando IDs de anúncios deste usuário
      
      // Calcular visualizações totais e por dia para todos os anúncios do usuário
      let totalViewsAllAds = 0;
      let viewsByDateAllAds: {[date: string]: number} = {};
      
      userAdIds.forEach(id => {
        if (viewsDatabase[id]) {
          totalViewsAllAds += viewsDatabase[id].totalViews;
          
          // Agregar visualizações por data
          Object.entries(viewsDatabase[id].viewsByDate).forEach(([date, count]) => {
            viewsByDateAllAds[date] = (viewsByDateAllAds[date] || 0) + count;
          });
        }
      });
      
      // Construir dados detalhados de cada anúncio
      const adsData = userAdIds.map(id => ({
        adId: id,
        views: viewsDatabase[id]?.totalViews || 0,
        uniqueViews: viewsDatabase[id]?.uniqueViews || 0,
        lastViewedAt: viewsDatabase[id]?.lastViewedAt || null
      }));
      
      return NextResponse.json({
        success: true,
        userId,
        totalViews: totalViewsAllAds,
        viewsByDate: viewsByDateAllAds,
        ads: adsData
      });
    }
    
    return NextResponse.json(
      { error: 'É necessário fornecer adId ou userId' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Erro ao buscar estatísticas de visualizações:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas de visualizações' },
      { status: 500 }
    );
  }
} 