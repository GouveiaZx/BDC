'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Store, Ad } from '../models/types';
import { formatCurrency } from '../utils/formatters';
import AdCard from './AdCard';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

interface StoreProductsProps {
  store: Store;
}

export default function StoreProducts({ store }: StoreProductsProps) {
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Obter todas as categorias disponíveis para o filtro, ordenadas por quantidade de anúncios
  const categoriesCount = store.categories.reduce((acc, cat) => {
    const count = store.products.filter(product => product.category === cat).length;
    return [...acc, { category: cat, count }];
  }, [] as { category: string; count: number }[])
  .sort((a, b) => b.count - a.count);
  
  // Filtrar os produtos com base na categoria selecionada
  const filteredProducts = categoryFilter
    ? store.products.filter(product => product.category === categoryFilter)
    : store.products;
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Anúncios</h2>
          <span className="text-gray-500 text-sm">{store.products.length} {store.products.length === 1 ? 'anúncio' : 'anúncios'}</span>
        </div>
      </div>
      
      {/* Filtros por categoria para lojas com múltiplas categorias */}
      {store.categories.length > 1 && (
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-between w-full text-left text-gray-700 font-medium"
          >
            <span>Filtrar por categoria</span>
            {showFilters ? <FaChevronUp className="h-4 w-4" /> : <FaChevronDown className="h-4 w-4" />}
          </button>
          
          {showFilters && (
            <div className="mt-2 space-y-1">
              <button
                onClick={() => setCategoryFilter(null)}
                className={`block px-3 py-2 text-sm rounded-md w-full text-left ${
                  categoryFilter === null 
                    ? 'bg-primary text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Todas as categorias <span className="text-xs ml-1">({store.products.length})</span>
              </button>
              
              {categoriesCount.map(({ category, count }) => (
                <button
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  className={`block px-3 py-2 text-sm rounded-md w-full text-left flex items-center justify-between ${
                    categoryFilter === category 
                      ? 'bg-primary text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{category}</span>
                  <span className={`text-xs ${categoryFilter === category ? 'text-white' : 'text-gray-500'}`}>
                    ({count})
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Grid de produtos */}
      <div className="p-6">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <AdCard 
                key={product.id} 
                ad={product} 
                featured={product.featured}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {categoryFilter 
                ? `Não há anúncios na categoria "${categoryFilter}".` 
                : 'Este vendedor ainda não tem anúncios.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 