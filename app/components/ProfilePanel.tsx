import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaUser, FaMapMarkerAlt, FaCrown } from 'react-icons/fa';
import { UserProfile } from '../lib/useProfileSync';
import Avatar from './Avatar';

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
        <div className="mr-4">
          <Avatar
            src={profile?.avatar || avatar}
            alt="Avatar do usuário"
            size={64}
            fallbackName={displayName}
          />
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