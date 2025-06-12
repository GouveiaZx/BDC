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
        
        // Primeiro tentar buscar via API
        try {
          const timestamp = new Date().getTime();
          const randomParam = Math.random().toString(36).substring(7);
          
          const response = await fetch(
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
          
          if (response.ok) {
            const data = await response.json();
            console.log('Resposta da API businesses:', data);
            
            const businessesData = data.businesses || data.data || [];
            
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
                  businessName = business.user_name || business.contact_name || 'Empresa';
                }
                
                return {
                  id: business.id,
                  name: businessName,
                  type: business.categories && business.categories[0] ? business.categories[0] : 'other',
                  logo: business.logo || business.logo_url || '/images/avatar-placeholder.png',
                  banner: business.banner || business.banner_url || '/images/placeholder-banner.jpg',
                  address: business.address ? 
                          `${business.address}${business.city ? ', ' + business.city : ''}${business.state ? ' - ' + business.state : ''}` :
                          `${business.city || ''} ${business.state ? ' - ' + business.state : ''}`,
                  description: business.description || 'Empresa cadastrada na plataforma BDC',
                  phone: business.phone || business.contact_phone || '',
                  verified: business.isVerified || business.is_verified || false,
                  rating: business.rating || 0,
                  reviewsCount: business.reviewsCount || business.reviews_count || 0,
                  totalViews: business.totalViews || business.total_views || 0,
                  plan: business.tipo === 'personal' ? 'Anunciante' : 'Classificado',
                  city: business.city,
                  state: business.state,
                  userId: business.userId || business.user_id || business.id
                };
              });
              
              setCompanies(formattedCompanies);
              console.log('Empresas formatadas via API:', formattedCompanies.length);
              return;
            }
          }
        } catch (apiError) {
          console.error('Erro na API, tentando fallback direto no Supabase:', apiError);
        }
        
        // Fallback: buscar diretamente do Supabase
        try {
          console.log('Tentando buscar empresas diretamente do Supabase...');
          
          const supabase = await import('../lib/supabase').then(mod => mod.getSupabaseAdminClient());
          
          // Primeiro tentar buscar da tabela businesses
          let businessesFromDB = [];
          
          const { data: businessesData, error: businessesError } = await supabase
            .from('businesses')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);
          
          if (!businessesError && businessesData) {
            businessesFromDB = businessesData.map((business: any) => ({
              id: business.id,
              name: business.business_name || 'Empresa',
              type: business.categories && business.categories[0] ? business.categories[0] : 'other',
              logo: business.logo_url || '/images/avatar-placeholder.png',
              banner: business.banner_url || '/images/placeholder-banner.jpg',
              address: business.address ? 
                      `${business.address}${business.city ? ', ' + business.city : ''}${business.state ? ' - ' + business.state : ''}` :
                      `${business.city || ''} ${business.state ? ' - ' + business.state : ''}`,
              description: business.description || 'Empresa cadastrada na plataforma BDC',
              phone: business.phone || '',
              verified: business.is_verified || false,
              rating: business.rating || 0,
              reviewsCount: business.reviewsCount || business.reviews_count || 0,
              totalViews: business.totalViews || business.total_views || 0,
              plan: 'Classificado',
              city: business.city,
              state: business.state,
              userId: business.user_id || business.id
            }));
          }
          
          // Também tentar buscar da tabela business_profiles
          const { data: profilesData, error: profilesError } = await supabase
            .from('business_profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);
          
          if (!profilesError && profilesData) {
            const profileBusinesses = profilesData.map((profile: any) => ({
              id: profile.id,
              name: profile.company_name || 'Empresa',
              type: 'business',
              logo: profile.logo_url || '/images/avatar-placeholder.png',
              banner: profile.banner_url || '/images/placeholder-banner.jpg',
              address: profile.address ? 
                      `${profile.address}${profile.city ? ', ' + profile.city : ''}${profile.state ? ' - ' + profile.state : ''}` :
                      `${profile.city || ''} ${profile.state ? ' - ' + profile.state : ''}`,
              description: profile.description || 'Empresa cadastrada na plataforma BDC',
              phone: profile.contact_phone || '',
              verified: true,
              rating: profile.rating || 0,
              reviewsCount: profile.reviews_count || 0,
              totalViews: profile.total_views || 0,
              plan: 'Classificado',
              city: profile.city,
              state: profile.state,
              userId: profile.user_id || profile.id
            }));
            
            businessesFromDB = [...businessesFromDB, ...profileBusinesses];
          }
          
          // Se encontrou empresas, usar elas
          if (businessesFromDB.length > 0) {
            // Remover duplicatas por userId
            const uniqueBusinesses = businessesFromDB.filter((business, index, self) => 
              index === self.findIndex((b) => b.userId === business.userId)
            );
            
            setCompanies(uniqueBusinesses.slice(0, limit));
            console.log('Empresas carregadas do Supabase direto:', uniqueBusinesses.length);
            return;
          }
          
        } catch (supabaseError) {
          console.error('Erro ao buscar do Supabase direto:', supabaseError);
        }
        
        // Se chegou até aqui, não encontrou empresas
        setCompanies([]);
        console.log('Nenhuma empresa encontrada em nenhuma fonte');
        
      } catch (error) {
        console.error('Erro geral ao buscar empresas:', error);
        setError('Não foi possível carregar as empresas classificadas.');
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
        <p className="text-gray-700 mb-4">Nenhuma empresa classificada cadastrada no momento.</p>
        <Link href="/cadastro" className="text-primary hover:underline font-medium">
          Cadastre sua empresa
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