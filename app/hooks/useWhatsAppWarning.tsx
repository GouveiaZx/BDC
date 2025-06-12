import { useState } from 'react';

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
    // Formatar o número do telefone (remover caracteres não numéricos)
    const formattedPhone = currentPhoneNumber.replace(/\D/g, '');
    
    // Criar a URL do WhatsApp com o número e a mensagem (se houver)
    let whatsappUrl = `https://wa.me/${formattedPhone}`;
    
    if (additionalMessage) {
      whatsappUrl += `?text=${encodeURIComponent(additionalMessage)}`;
    }
    
    // Se houver uma função de callback personalizada, usá-la
    if (onProceed) {
      onProceed(currentPhoneNumber);
    } else {
      // Caso contrário, abrir o WhatsApp em uma nova janela
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