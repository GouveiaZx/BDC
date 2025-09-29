import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import { Tooltip } from './Tooltip';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ 
  size = 'md', 
  showLabel = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <Tooltip content="Parceiro Verificado - Este anunciante possui um plano pago e foi verificado pela nossa equipe.">
      <div className={`inline-flex items-center ${className}`}>
        <FaCheckCircle className={`text-blue-600 ${sizeClasses[size]}`} />
        {showLabel && (
          <span className={`ml-1 font-medium text-blue-600 ${sizeClasses[size]}`}>
            Verificado
          </span>
        )}
      </div>
    </Tooltip>
  );
}; 