import { Store } from '../models/types';
import { FaTag } from 'react-icons/fa';

interface StoreDescriptionProps {
  store: Store;
}

export default function StoreDescription({ store }: StoreDescriptionProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Sobre a Loja</h2>
      
      <p className="text-gray-700 whitespace-pre-line">{store.description}</p>
      
      {store.categories.length > 0 && (
        <div className="mt-5">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Categorias</h3>
          <div className="flex flex-wrap gap-2">
            {store.categories.map((category, index) => (
              <span 
                key={index} 
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
              >
                <FaTag className="mr-1.5 text-xs" />
                {category}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-5 pt-5 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Informações de Contato</h3>
        <div className="space-y-2 text-gray-700">
          {store.contactInfo && (
            <>
              <p>Email: {store.contactInfo.email}</p>
              <p>Telefone: {store.contactInfo.phone}</p>
              <p>WhatsApp: {store.contactInfo.whatsapp}</p>
            </>
          )}
          {store.location && <p>Localização: {store.location}</p>}
        </div>
      </div>
    </div>
  );
} 