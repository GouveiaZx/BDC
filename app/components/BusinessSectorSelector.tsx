import React, { useState, useEffect } from 'react';
import { FaBuilding, FaCheck } from 'react-icons/fa';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

interface BusinessSelectorProps {
  currentSector?: string;
  currentSectorId?: string;
  onSectorChange: (sectorId: string, sectorName: string) => void;
  disabled?: boolean;
  isPaidUser?: boolean;
}

const BusinessSectorSelector: React.FC<BusinessSelectorProps> = ({
  currentSector,
  currentSectorId,
  onSectorChange,
  disabled = false,
  isPaidUser = false
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSector, setSelectedSector] = useState<string>(currentSectorId || '');

  // Carregar categorias da API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.categories) {
            // Filtrar apenas categorias mais adequadas para ramo de atividade
            const businessCategories = data.categories.filter((cat: Category) => {
              const businessKeywords = [
                'serviços', 'consultoria', 'reformas', 'limpeza', 'beleza', 'eventos', 
                'transporte', 'automotivos', 'comercial', 'equipamentos', 'materiais',
                'fitness', 'saúde', 'educação', 'alimentação', 'tecnologia'
              ];
              
              return businessKeywords.some(keyword => 
                cat.name.toLowerCase().includes(keyword) || 
                cat.slug.toLowerCase().includes(keyword)
              );
            });
            
            setCategories(businessCategories);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const handleSectorSelect = (categoryId: string, categoryName: string) => {
    setSelectedSector(categoryId);
    onSectorChange(categoryId, categoryName);
  };

  if (!isPaidUser) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <FaBuilding className="text-blue-500 mr-3" />
          <div>
            <h4 className="font-medium text-blue-800">Ramo de Atividade</h4>
            <p className="text-sm text-blue-600">
              Disponível apenas para usuários com planos pagos. 
              <a href="/planos" className="underline ml-1">Assine um plano</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Ramo de Atividade
        <span className="text-xs text-gray-500 ml-2">(Apenas para planos pagos)</span>
      </label>
      
      <div className="relative">
        <select
          value={selectedSector}
          onChange={(e) => {
            const selectedCategory = categories.find(cat => cat.id === e.target.value);
            if (selectedCategory) {
              handleSectorSelect(selectedCategory.id, selectedCategory.name);
            }
          }}
          disabled={disabled}
          className={`
            w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          `}
        >
          <option value="">Selecione seu ramo de atividade</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.icon} {category.name}
            </option>
          ))}
        </select>
        
        {selectedSector && (
          <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
            <FaCheck className="text-green-500" />
          </div>
        )}
      </div>
      
      {currentSector && (
        <div className="text-sm text-gray-600">
          <strong>Ramo atual:</strong> {currentSector}
        </div>
      )}
      
      <p className="text-xs text-gray-500">
        Seu ramo de atividade ajuda os clientes a encontrarem sua empresa nos filtros dos Classificados.
      </p>
    </div>
  );
};

export default BusinessSectorSelector; 