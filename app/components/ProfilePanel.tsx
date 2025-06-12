import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaUser, FaMapMarkerAlt, FaCrown } from 'react-icons/fa';
import { UserProfile } from '../lib/useProfileSync';

interface ProfilePanelProps {
  profile: UserProfile | null;
  name?: string;
  avatar?: string;
  planName: string;
}

const ProfilePanel: React.FC<ProfilePanelProps> = ({ 
  profile, 
  name, 
  avatar, 
  planName 
}) => {
  const displayName = profile?.name || name;
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="font-semibold text-gray-800 flex items-center mb-4">
        <FaUser className="mr-2 text-gray-600" /> Meu perfil
      </h3>
      <div className="flex items-center mb-4">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mr-4 overflow-hidden relative">
          {profile?.avatar || avatar ? (
            <div className="w-full h-full rounded-full overflow-hidden">
              <img 
                src={profile?.avatar || avatar} 
                alt="Avatar do usuário" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.classList.add('bg-blue-500');
                  target.parentElement!.innerHTML = `<span class="text-white text-xl font-bold">${displayName ? displayName.charAt(0).toUpperCase() : 'U'}</span>`;
                }}
              />
            </div>
          ) : (
            <div className="w-full h-full rounded-full flex items-center justify-center bg-blue-500 text-white">
              <span className="text-xl font-bold">
                {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
          )}
        </div>
        <div>
          <p className="font-medium text-gray-800">{displayName}</p>
        </div>
      </div>
      <div className="space-y-2 mb-4">
        {profile && profile.city && profile.state && (
          <div className="flex items-start">
            <FaMapMarkerAlt className="text-gray-500 mt-1 mr-2" />
            <span className="text-gray-700 text-sm">
              {`${profile.city}, ${profile.state}`}
            </span>
          </div>
        )}
        <div className="flex items-start">
          <FaCrown className="text-amber-500 mt-1 mr-2" />
          <span className="text-gray-700 text-sm">Plano: {planName}</span>
        </div>
      </div>
      <div className="flex space-x-3">
        <Link
          href="/painel-anunciante/meu-perfil"
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Gerenciar perfil e empresa
        </Link>
        <Link
          href="/painel-anunciante/planos"
          className="text-green-600 hover:text-green-800 text-sm"
        >
          Meu plano
        </Link>
      </div>
    </div>
  );
};

export default ProfilePanel; 