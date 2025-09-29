"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FaArrowLeft, FaMapMarkerAlt, FaPhone, FaEnvelope, FaStore, FaCalendar, FaStar } from 'react-icons/fa';
import Avatar from '../../components/Avatar';
import AdCard from '../../components/AdCard';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profile_image_url?: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  city?: string;
  verified?: boolean;
}

interface Ad {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  city: string;
  created_at: string;
  status: string;
}

const VendorPage = () => {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [userAds, setUserAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchUserData = async () => {
      try {
        // Buscar dados do usuário
        const userResponse = await fetch(`/api/users/${userId}`);
        if (!userResponse.ok) {
          throw new Error('Usuário não encontrado');
        }
        const userData = await userResponse.json();
        setUser(userData.user);

        // Buscar anúncios do usuário
        const adsResponse = await fetch(`/api/ads?userId=${userId}&status=active`);
        if (adsResponse.ok) {
          const adsData = await adsResponse.json();
          setUserAds(adsData.ads || []);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do vendedor:', error);
        setError('Erro ao carregar informações do vendedor');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#7ad38e] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando perfil do vendedor...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Vendedor não encontrado</h1>
          <p className="text-gray-600 mb-6">{error || 'Este vendedor não existe ou foi removido.'}</p>
          <Link
            href="/"
            className="bg-[#7ad38e] hover:bg-[#5baf6f] text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  const memberSince = new Date(user.created_at).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Voltar
          </button>
        </div>
      </div>

      {/* Perfil do Vendedor */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          {/* Banner do perfil */}
          <div className="bg-gradient-to-r from-[#7ad38e] to-[#5baf6f] h-32 relative">
            <div className="absolute -bottom-16 left-8">
              <div className="w-32 h-32 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg">
                <Avatar
                  src={user.profile_image_url || user.avatar_url}
                  alt={user.name}
                  size={0}
                  fallbackName={user.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Informações do perfil */}
          <div className="pt-20 px-8 pb-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <h1 className="text-3xl font-bold text-gray-900 mr-3">{user.name}</h1>
                  {user.verified && (
                    <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                      <FaStar className="mr-1" />
                      Verificado
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center text-gray-600 text-sm mb-4 gap-4">
                  {user.city && (
                    <div className="flex items-center">
                      <FaMapMarkerAlt className="mr-1" />
                      {user.city}
                    </div>
                  )}
                  <div className="flex items-center">
                    <FaCalendar className="mr-1" />
                    Membro desde {memberSince}
                  </div>
                  <div className="flex items-center">
                    <FaStore className="mr-1" />
                    {userAds.length} anúncio{userAds.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {user.bio && (
                  <p className="text-gray-700 mb-4">{user.bio}</p>
                )}
              </div>

              {/* Informações de contato */}
              <div className="lg:ml-8 mt-4 lg:mt-0">
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-gray-900 mb-3">Contato</h3>

                  {user.phone && (
                    <div className="flex items-center text-gray-600">
                      <FaPhone className="mr-3 text-[#7ad38e]" />
                      <span>{user.phone}</span>
                    </div>
                  )}

                  <div className="flex items-center text-gray-600">
                    <FaEnvelope className="mr-3 text-[#7ad38e]" />
                    <span>{user.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Anúncios do vendedor */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Anúncios ({userAds.length})
          </h2>

          {userAds.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {userAds.map((ad) => (
                <AdCard
                  key={ad.id}
                  {...(ad as any)}
                  createdAt={ad.created_at}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Nenhum anúncio ativo
              </h3>
              <p className="text-gray-500">
                Este vendedor não possui anúncios ativos no momento.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorPage;