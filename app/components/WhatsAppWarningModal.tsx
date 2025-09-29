import React from 'react';
import { FaWhatsapp, FaExclamationTriangle, FaShieldAlt, FaLock, FaDownload, FaEye } from 'react-icons/fa';
import Link from 'next/link';

interface WhatsAppWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  phoneNumber: string;
}

const WhatsAppWarningModal: React.FC<WhatsAppWarningModalProps> = ({
  isOpen,
  onClose,
  onProceed,
  phoneNumber
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
              <FaExclamationTriangle className="text-yellow-500 text-2xl" />
            </div>
          </div>
          
          <h2 className="text-xl font-bold text-center text-gray-800 mb-4">
            Aviso importante antes de continuar
          </h2>
          
          <div className="space-y-4 mb-6">
            <div className="flex items-start">
              <FaShieldAlt className="text-primary mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-gray-800">Sua segurança é importante</h3>
                <p className="text-sm text-gray-600">
                  Você está prestes a iniciar uma conversa pelo WhatsApp com um anunciante. 
                  Tenha cuidado com solicitações de pagamentos adiantados ou transferências 
                  bancárias para pessoas desconhecidas.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <FaLock className="text-primary mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-gray-800">Proteja seus dados</h3>
                <p className="text-sm text-gray-600">
                  Não compartilhe informações sensíveis como senhas, dados bancários 
                  ou cópias de documentos pessoais por mensagem.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <FaWhatsapp className="text-green-500 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-gray-800">Sobre esta conexão</h3>
                <p className="text-sm text-gray-600">
                  Ao prosseguir, você será redirecionado para o WhatsApp para iniciar uma 
                  conversa com o número {phoneNumber}.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-6">
            <p className="text-sm text-yellow-800 text-center">
              O BuscaAquiBDC não se responsabiliza por transações ou acordos 
              realizados diretamente entre usuários.
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-6">
            <Link 
              href="/ajuda/dicas-seguranca" 
              target="_blank"
              className="flex items-center justify-center text-blue-700 hover:text-blue-800 font-medium"
            >
              <FaEye className="mr-2" />
              Ver guia completo de dicas de segurança
            </Link>
            <p className="text-xs text-blue-700 text-center mt-1">
              Recomendamos a leitura do nosso guia de segurança antes de realizar qualquer negociação
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onProceed}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center justify-center"
            >
              <FaWhatsapp className="mr-2" />
              Prosseguir para WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppWarningModal; 