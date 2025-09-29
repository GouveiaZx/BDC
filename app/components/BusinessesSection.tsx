"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import CompanyCard from './CompanyCard';

interface Business {
  id: string | number;
  name: string;
  type: string;
  logo: string;
  banner: string;
  address: string;
  rating?: number;
  description: string;
  phone: string;
  verified: boolean;
  plan?: string;
  city?: string;
  state?: string;
  userId?: string; // ID do usuário proprietário da empresa
  reviewsCount?: number;
  totalViews?: number;
}

interface BusinessesSectionProps {
  limit?: number;
}

export default function BusinessesSection({ limit = 3 }: BusinessesSectionProps) {
  const [companies, setCompanies] = useState<Business[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setLoading(true);
        
        // Buscar classificados (anunciantes com anúncios ativos) - fallback para businesses se classificados não estiver disponível
        const timestamp = new Date().getTime();
        const randomParam = Math.random().toString(36).substring(7);
        
        let businessesData = [];
        
        // Tentar primeiro a API de classificados
        try {
          const classResponse = await fetch(
            `/api/classificados?limit=${limit}&_t=${timestamp}&_r=${randomParam}`, 
            { 
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
              }
            }
          );
          
          if (classResponse.ok) {
            const classData = await classResponse.json();
            console.log('✅ Resposta da API classificados:', classData);
            businessesData = classData.classificados || classData.data || [];
          } else {
            throw new Error(`Classificados API retornou ${classResponse.status}`);
          }
        } catch (classError) {
          console.warn('⚠️ API classificados não disponível, usando fallback para businesses:', classError);
          
          // Fallback para a API de businesses
          try {
            const bizResponse = await fetch(
              `/api/businesses?limit=${limit}&_t=${timestamp}&_r=${randomParam}`, 
              { 
                cache: 'no-store',
                headers: {
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache',
                  'Expires': '0'
                }
              }
            );
            
            if (bizResponse.ok) {
              const bizData = await bizResponse.json();
              console.log('📊 Resposta da API businesses (fallback):', bizData);
              businessesData = bizData.businesses || bizData.data || [];
            }
          } catch (bizError) {
            console.error('❌ Erro em ambas as APIs:', bizError);
          }
        }
          
        if (businessesData.length > 0) {
          const formattedCompanies = businessesData.map((business: any) => {
            // Melhor lógica para determinar o nome
            let businessName = business.businessName || business.name || business.company_name || business.business_name;
            
            // Se não tem nome comercial, tentar usar o nome do usuário
            if (!businessName && business.userName) {
              businessName = business.userName;
            }
            
            // Se ainda não tem nome, tentar outras propriedades
            if (!businessName) {
              businessName = business.user_name || business.contact_name || 'Classificado';
            }
            
            return {
              id: business.id,
              name: businessName,
              type: business.categories && business.categories[0] ? business.categories[0] : 'other',
              logo: business.logo || business.logo_url || business.avatar_url || '/images/avatar-placeholder.png',
              banner: business.banner || business.banner_url || '/images/placeholder-banner.jpg',
              address: business.address ? 
                      `${business.address}${business.city ? ', ' + business.city : ''}${business.state ? ' - ' + business.state : ''}` :
                      `${business.city || ''} ${business.state ? ' - ' + business.state : ''}`,
              description: business.description || 'Classificado cadastrado na plataforma BDC',
              phone: business.phone || business.contact_phone || '',
              verified: business.isVerified || business.is_verified || false,
              rating: business.rating || 4.5,
              reviewsCount: business.reviewsCount || business.reviews_count || 0,
              totalViews: business.totalViews || business.total_views || 0,
              plan: business.ads_count ? `${business.ads_count} anúncio${business.ads_count > 1 ? 's' : ''}` : 'Classificado',
              city: business.city,
              state: business.state,
              userId: business.userId || business.user_id || business.id
            };
          });
          
          setCompanies(formattedCompanies);
          console.log('Classificados formatados via API:', formattedCompanies.length);
          return;
        }
        
        // Se chegou até aqui, não encontrou empresas ou houve erro na API
        console.log('Nenhum classificado encontrado via API');
        setCompanies([]);
        
      } catch (error) {
        console.error('Erro ao buscar classificados:', error);
        setError('Não foi possível carregar os classificados.');
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBusinesses();
    
    // Buscar novamente a cada 30 segundos para garantir dados atualizados
    const intervalId = setInterval(fetchBusinesses, 30000);
    
    return () => clearInterval(intervalId);
  }, [limit]);

  // Se está carregando, mostrar um spinner
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(limit)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden h-96 animate-pulse">
            <div className="h-48 bg-gray-300"></div>
            <div className="p-4 space-y-3">
              <div className="h-6 bg-gray-300 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              <div className="h-20 bg-gray-300 rounded"></div>
              <div className="h-10 bg-gray-300 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Se não há empresas, exibir mensagem com um link para cadastro
  if (companies.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8 text-center shadow-sm">
        <p className="text-gray-700 mb-4">Nenhum classificado cadastrado no momento.</p>
        <Link href="/cadastro" className="text-primary hover:underline font-medium">
          Cadastre-se como anunciante
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {companies.map(company => (
        <div key={company.id} className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <CompanyCard company={company} />
        </div>
      ))}
    </div>
  );
} 