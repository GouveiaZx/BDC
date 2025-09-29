import { useState } from 'react';
import { createWhatsAppUrl } from '../utils/formatters';

interface UseWhatsAppWarningProps {
  onProceed?: (phoneNumber: string) => void;
}

export const useWhatsAppWarning = ({ onProceed }: UseWhatsAppWarningProps = {}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPhoneNumber, setCurrentPhoneNumber] = useState('');
  const [additionalMessage, setAdditionalMessage] = useState('');

  const openWhatsAppModal = (phoneNumber: string, message: string = '') => {
    setCurrentPhoneNumber(phoneNumber);
    setAdditionalMessage(message);
    setIsModalOpen(true);
  };

  const closeWhatsAppModal = () => {
    setIsModalOpen(false);
  };

  const proceedToWhatsApp = () => {
    console.log('🚀 Iniciando contato via WhatsApp:', {
      phone: currentPhoneNumber,
      message: additionalMessage
    });
    
    // ✅ Usar a nova função universal de formatação
    const whatsappUrl = createWhatsAppUrl(currentPhoneNumber, additionalMessage);
    
    // Se houver uma função de callback personalizada, usá-la
    if (onProceed) {
      onProceed(currentPhoneNumber);
    } else {
      // Caso contrário, abrir o WhatsApp em uma nova janela
      console.log('📱 Abrindo WhatsApp:', whatsappUrl);
      window.open(whatsappUrl, '_blank');
    }
    
    // Fechar o modal
    closeWhatsAppModal();
  };

  return {
    isWhatsAppModalOpen: isModalOpen,
    currentPhoneNumber,
    openWhatsAppModal,
    closeWhatsAppModal,
    proceedToWhatsApp
  };
};

export default useWhatsAppWarning; 