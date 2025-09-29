'use client';

import { Store } from '../models/types';
import AdCard from './AdCard';
import { useRouter } from 'next/navigation';

interface FeaturedProductsProps {
  store: Store;
}

export default function FeaturedProducts({ store }: FeaturedProductsProps) {
  const router = useRouter();
  
  const handleSeeAllClick = () => {
    const element = document.getElementById('all-products');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Destaques da Loja</h2>
        <button
          onClick={handleSeeAllClick}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
        >
          Ver todos os produtos
        </button>
      </div>
      
      {store.featuredProducts && store.featuredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {store.featuredProducts.map((product) => (
            <AdCard key={product.id} ad={product} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 italic">Esta loja ainda não possui produtos em destaque.</p>
      )}
    </div>
  );
} 