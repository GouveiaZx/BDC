import React from 'react';

// Função para buscar destaques aprovados via API interna
async function getApprovedHighlights() {
  try {
    // Usar URL absoluta para server-side rendering
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/destaques`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      console.error('Erro na API de highlights:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    
    // Verificar se data existe e tem a estrutura esperada
    if (!data || typeof data !== 'object') {
      console.error('Resposta da API inválida:', data);
      return [];
    }
    
    const highlights = data.highlights || [];
    
    if (!Array.isArray(highlights)) {
      console.error('Highlights não é um array:', highlights);
      return [];
    }
    
    if (highlights.length === 0) {
      console.log('Nenhum destaque encontrado');
      return [];
    }
    
    return highlights.map((highlight: any) => {
      // Verificar se highlight existe e tem propriedades básicas
      if (!highlight || typeof highlight !== 'object') {
        console.warn('Highlight inválido:', highlight);
        return null;
      }
      
      return {
        id: highlight.id || Math.random().toString(36),
        title: highlight.title || 'Destaque',
        description: highlight.description || '',
        image: highlight.image_url || highlight.media_url || '/images/placeholder.jpg',
        image_url: highlight.image_url,
        media_url: highlight.media_url,
        createdAt: highlight.created_at || new Date().toISOString(),
        isAdmin: highlight.isAdmin || highlight.is_admin_post || highlight.user_id === '5aa0a2c3-e000-49b4-9102-9b1dbf0d2d18',
        userId: highlight.user_id,
        userName: highlight.userName || highlight.user_name || 'Anunciante',
        userAvatar: highlight.userAvatar || highlight.user_avatar || '/logo.png',
        user_name: highlight.user_name,
        user_avatar: highlight.user_avatar
      };
    }).filter(Boolean); // Remove itens null/undefined
  } catch (error) {
    console.error('Erro ao buscar highlights:', error);
    // Retornar array vazio em caso de erro para não quebrar a página
    return [];
  }
}

export default async function TestHighlightsPage() {
  const highlights = await getApprovedHighlights();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Teste de Destaques</h1>
      
      <div className="mb-4">
        <p><strong>Total de destaques encontrados:</strong> {highlights.length}</p>
      </div>

      {highlights.length > 0 ? (
        <div className="grid gap-4">
          {highlights.map((highlight, index) => (
            <div key={highlight.id} className="border p-4 rounded-lg">
              <h3 className="font-bold">{index + 1}. {highlight.title}</h3>
              <p><strong>ID:</strong> {highlight.id}</p>
              <p><strong>Usuário:</strong> {highlight.userName}</p>
              <p><strong>Criado em:</strong> {highlight.createdAt}</p>
              <p><strong>Admin:</strong> {highlight.isAdmin ? 'Sim' : 'Não'}</p>
              {highlight.description && (
                <p><strong>Descrição:</strong> {highlight.description}</p>
              )}
              {highlight.image && (
                <div className="mt-2">
                  <p><strong>Imagem:</strong> {highlight.image}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">❌ Nenhum destaque encontrado</p>
          <p className="text-sm text-gray-400 mt-2">
            Verifique se há destaques ativos e não expirados no banco de dados.
          </p>
        </div>
      )}
    </div>
  );
}