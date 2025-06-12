"use client";

import React from 'react';
import Link from 'next/link';
import { FaCreditCard } from 'react-icons/fa';

interface PremiumBadgeProps {
  planName: string;
  renewalDate?: string;
}

export default function PremiumBadge({ planName, renewalDate }: PremiumBadgeProps) {
  return (
    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Seu plano atual: <span className="font-bold">{planName || 'Premium'}</span>
          </h2>
          {renewalDate && (
            <p className="text-gray-600 mt-1">
              Renovação automática em {renewalDate}
            </p>
          )}
        </div>
        <div className="mt-3 md:mt-0">
          <Link 
            href="/painel-anunciante/pagamentos" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          >
            <FaCreditCard className="mr-2" /> 
            Gerenciar pagamento
          </Link>
        </div>
      </div>
    </div>
  );
} 