'use client';

import { useState, useEffect } from 'react';
import { FaCheck, FaInfoCircle, FaTimes } from 'react-icons/fa';
import { BusinessCategory, businessCategoryNames } from '../../../models/types';

interface BusinessCategoriesSelectorProps {
  onSave: (categories: BusinessCategory[]) => void;
  onCancel: () => void;
  initialCategories?: BusinessCategory[];
  maxSelections?: number;
}

export default function BusinessCategoriesSelector({
  onSave,
  onCancel,
  initialCategories = [],
  maxSelections = 3
}: BusinessCategoriesSelectorProps) {
  const [selectedCategories, setSelectedCategories] = useState<BusinessCategory[]>(initialCategories);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  // Organizar categorias em ordem alfabética pelo nome de exibição
  const sortedCategories = Object.values(BusinessCategory).sort(
    (a, b) => businessCategoryNames[a].localeCompare(businessCategoryNames[b])
  );
  
  // Filtrar categorias com base no termo de busca
  const filteredCategories = searchTerm
    ? sortedCategories.filter(category => 
        businessCategoryNames[category].toLowerCase().includes(searchTerm.toLowerCase())
      )
    : sortedCategories;

  const handleToggleCategory = (category: BusinessCategory) => {
    setError('');
    
    if (selectedCategories.includes(category)) {
      setSelectedCategories(prev => prev.filter(c => c !== category));
    } else {
      if (selectedCategories.length >= maxSelections) {
        setError(`Você pode selecionar no máximo ${maxSelections} categorias`);
        return;
      }
      
      setSelectedCategories(prev => [...prev, category]);
    }
  };

  const handleSave = () => {
    if (selectedCategories.length === 0) {
      setError('Selecione pelo menos uma categoria');
      return;
    }
    
    onSave(selectedCategories);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Selecione suas categorias de negócio</h2>
          <button 
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="p-4 border-b">
          <p className="text-gray-600 mb-4">
            Selecione até {maxSelections} categorias que melhor descrevem seu negócio. Estas categorias serão usadas para mostrar seu negócio nos classificados.
          </p>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-md border border-red-200 flex items-start">
              <FaInfoCircle className="text-red-500 mt-1 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar categorias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedCategories.map(category => (
              <div 
                key={category}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center"
              >
                <span className="mr-1">{businessCategoryNames[category]}</span>
                <button 
                  onClick={() => handleToggleCategory(category)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <FaTimes size={12} />
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-2 text-sm text-gray-500">
            {selectedCategories.length} de {maxSelections} categorias selecionadas
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredCategories.map(category => {
              const isSelected = selectedCategories.includes(category);
              return (
                <button
                  key={category}
                  onClick={() => handleToggleCategory(category)}
                  className={`p-3 rounded-md text-left flex items-center ${
                    isSelected 
                      ? 'bg-blue-50 border border-blue-300' 
                      : 'border border-gray-200 hover:bg-gray-50'
                  }`}
                  disabled={!isSelected && selectedCategories.length >= maxSelections}
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center mr-3 ${
                    isSelected ? 'bg-blue-500' : 'border border-gray-300'
                  }`}>
                    {isSelected && <FaCheck className="text-white text-xs" />}
                  </div>
                  <span className={isSelected ? 'font-medium' : ''}>
                    {businessCategoryNames[category]}
                  </span>
                </button>
              );
            })}
            
            {filteredCategories.length === 0 && (
              <div className="col-span-2 p-4 text-center text-gray-500">
                Nenhuma categoria encontrada para "{searchTerm}"
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Salvar categorias
          </button>
        </div>
      </div>
    </div>
  );
} 