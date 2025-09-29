"use client";

import React from 'react';
import Image from 'next/image';
import { 
  FaTimes, FaCalendarAlt, FaMapMarkerAlt, FaPhone, FaWhatsapp, 
  FaEnvelope, FaUser, FaIdCard, FaGlobe, FaHistory, FaBuilding, 
  FaCheckCircle, FaExternalLinkAlt
} from 'react-icons/fa';

interface UserProfileData {
  id: string;
  name: string;
  email: string;
  avatar: string;
  type: 'personal' | 'business';
  phone?: string;
  whatsapp?: string;
  location?: string;
  website?: string;
  createdAt?: string;
  lastLogin?: string;
  isVerified?: boolean;
  bio?: string;
  status?: string;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: UserProfileData;
}

export default function UserProfileModal({ isOpen, onClose, userData }: UserProfileModalProps) {
  if (!isOpen) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <FaUser className="mr-2 text-blue-600" />
            Perfil do Usuário
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Header do Usuário */}
          <div className="flex items-center mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-100 mr-4 ring-4 ring-white shadow-lg">
              <Image 
                src={userData.avatar || 'https://ui-avatars.io/api/?name=' + encodeURIComponent(userData.name) + '&background=0d6efd&color=fff'} 
                alt={userData.name}
                width={80}
                height={80}
                className="object-cover h-full w-full"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <h2 className="text-2xl font-bold text-gray-900">{userData.name}</h2>
                {userData.isVerified && (
                  <FaCheckCircle className="text-blue-500 ml-2 text-lg" title="Usuário Verificado" />
                )}
              </div>
              <div className="flex items-center text-gray-600 mb-2">
                {userData.type === 'business' ? (
                  <>
                    <FaBuilding className="mr-1" />
                    <span>Empresa</span>
                  </>
                ) : (
                  <>
                    <FaUser className="mr-1" />
                    <span>Pessoa Física</span>
                  </>
                )}
              </div>
              {userData.status && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  userData.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  <FaCheckCircle className={`mr-1 ${userData.status === 'active' ? 'text-green-500' : 'text-red-500'}`} />
                  {userData.status === 'active' ? 'Conta Ativa' : 'Conta Inativa'}
                </span>
              )}
            </div>
          </div>

          {/* Informações de Contato */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <FaEnvelope className="mr-2 text-blue-600" />
                Informações de Contato
              </h4>
              <div className="space-y-3">
                <div className="flex items-start">
                  <FaEnvelope className="text-gray-400 mr-3 mt-1" />
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Email</div>
                    <div className="text-sm font-medium text-gray-900">{userData.email}</div>
                  </div>
                </div>
                
                {userData.phone && (
                  <div className="flex items-start">
                    <FaPhone className="text-gray-400 mr-3 mt-1" />
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Telefone</div>
                      <div className="text-sm font-medium text-gray-900">{userData.phone}</div>
                    </div>
                  </div>
                )}
                
                {userData.whatsapp && (
                  <div className="flex items-start">
                    <FaWhatsapp className="text-green-500 mr-3 mt-1" />
                    <div>
                      <div className="text-xs text-gray-500 mb-1">WhatsApp</div>
                      <div className="text-sm font-medium text-gray-900">{userData.whatsapp}</div>
                    </div>
                  </div>
                )}
                
                {userData.location && (
                  <div className="flex items-start">
                    <FaMapMarkerAlt className="text-gray-400 mr-3 mt-1" />
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Localização</div>
                      <div className="text-sm font-medium text-gray-900">{userData.location}</div>
                    </div>
                  </div>
                )}
                
                {userData.website && (
                  <div className="flex items-start">
                    <FaGlobe className="text-gray-400 mr-3 mt-1" />
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Website</div>
                      <div className="text-sm font-medium text-blue-600 hover:text-blue-800">
                        <a href={userData.website} target="_blank" rel="noopener noreferrer" className="flex items-center">
                          {userData.website}
                          <FaExternalLinkAlt className="ml-1 text-xs" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <FaCalendarAlt className="mr-2 text-blue-600" />
                Informações da Conta
              </h4>
              <div className="space-y-3">
                <div className="flex items-start">
                  <FaIdCard className="text-gray-400 mr-3 mt-1" />
                  <div>
                    <div className="text-xs text-gray-500 mb-1">ID do Usuário</div>
                    <div className="text-sm font-mono text-gray-700 bg-white px-2 py-1 rounded border">
                      {userData.id}
                    </div>
                  </div>
                </div>
                
                {userData.createdAt && (
                  <div className="flex items-start">
                    <FaCalendarAlt className="text-gray-400 mr-3 mt-1" />
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Conta Criada em</div>
                      <div className="text-sm font-medium text-gray-900">{formatDate(userData.createdAt)}</div>
                    </div>
                  </div>
                )}
                
                {userData.lastLogin && (
                  <div className="flex items-start">
                    <FaHistory className="text-gray-400 mr-3 mt-1" />
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Último Acesso</div>
                      <div className="text-sm font-medium text-gray-900">{formatDate(userData.lastLogin)}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bio do Usuário */}
          {userData.bio && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                <FaUser className="mr-2 text-blue-600" />
                Sobre o Usuário
              </h4>
              <p className="text-gray-700 text-sm leading-relaxed">{userData.bio}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
} 