import React from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import useWhatsAppWarning from '../hooks/useWhatsAppWarning';
import WhatsAppWarningModal from './WhatsAppWarningModal';

interface WhatsAppButtonProps {
  phoneNumber?: string;
  message?: string;
  buttonText?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outlined' | 'text';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  iconOnly?: boolean;
  disabled?: boolean;
}

const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  phoneNumber = '',
  message = '',
  buttonText = 'Contato',
  className = '',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  iconOnly = false,
  disabled = false
}) => {
  const {
    isWhatsAppModalOpen,
    currentPhoneNumber,
    openWhatsAppModal,
    closeWhatsAppModal,
    proceedToWhatsApp
  } = useWhatsAppWarning();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (phoneNumber) {
      openWhatsAppModal(phoneNumber, message);
    }
  };

  // Classes padrão baseadas nas props
  let baseClasses = "flex items-center justify-center rounded-lg transition-colors duration-300 ";
  
  // Variantes
  if (variant === 'primary') {
    baseClasses += "bg-primary text-white hover:bg-primary-dark ";
  } else if (variant === 'secondary') {
    baseClasses += "bg-green-500 text-white hover:bg-green-600 ";
  } else if (variant === 'outlined') {
    baseClasses += "bg-white text-primary border border-primary hover:bg-primary/10 ";
  } else if (variant === 'text') {
    baseClasses += "bg-transparent text-primary hover:bg-primary/10 ";
  }
  
  // Tamanhos
  if (size === 'sm') {
    baseClasses += iconOnly ? "p-1.5 " : "px-2 py-1.5 text-xs ";
  } else if (size === 'md') {
    baseClasses += iconOnly ? "p-2 " : "px-3 py-2 text-sm ";
  } else if (size === 'lg') {
    baseClasses += iconOnly ? "p-3 " : "px-4 py-3 text-base ";
  }
  
  // Largura
  if (fullWidth) {
    baseClasses += "w-full ";
  }
  
  // Disabled
  if (disabled || !phoneNumber) {
    baseClasses += "opacity-50 cursor-not-allowed ";
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={`${baseClasses} ${className}`}
        disabled={disabled || !phoneNumber}
      >
        <FaWhatsapp className={iconOnly ? "" : "mr-2"} />
        {!iconOnly && <span>{buttonText}</span>}
      </button>
      
      <WhatsAppWarningModal
        isOpen={isWhatsAppModalOpen}
        onClose={closeWhatsAppModal}
        onProceed={proceedToWhatsApp}
        phoneNumber={currentPhoneNumber}
      />
    </>
  );
};

export default WhatsAppButton; 