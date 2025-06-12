"use client";

import React from 'react';
import Link from 'next/link';
import { FaCreditCard } from 'react-icons/fa';

interface ManagePaymentButtonProps {
  className?: string;
  variant?: 'primary' | 'secondary' | 'blue';
  size?: 'sm' | 'md' | 'lg';
}

export default function ManagePaymentButton({ 
  className = '',
  variant = 'primary',
  size = 'md'
}: ManagePaymentButtonProps) {
  
  const getButtonStyles = () => {
    let baseStyle = 'inline-flex items-center justify-center rounded-md font-medium transition-colors';
    
    // Variantes de cor
    if (variant === 'primary') {
      baseStyle += ' bg-primary text-black hover:bg-primary-dark focus:ring-primary';
    } else if (variant === 'secondary') {
      baseStyle += ' bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-300';
    } else if (variant === 'blue') {
      baseStyle += ' bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500';
    }
    
    // Tamanhos
    if (size === 'sm') {
      baseStyle += ' px-3 py-1.5 text-sm';
    } else if (size === 'md') {
      baseStyle += ' px-4 py-2';
    } else if (size === 'lg') {
      baseStyle += ' px-5 py-2.5 text-lg';
    }
    
    // Adicionar classes personalizadas
    return `${baseStyle} ${className}`;
  };
  
  return (
    <Link
      href="/painel-anunciante/pagamentos"
      className={getButtonStyles()}
    >
      <FaCreditCard className="mr-2" />
      Gerenciar pagamento
    </Link>
  );
} 