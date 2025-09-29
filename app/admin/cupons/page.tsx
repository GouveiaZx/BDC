"use client";

import React, { useState, useEffect } from 'react';
import { 
  FaPlus, FaEdit, FaTrash, FaSearch, 
  FaFilter, FaCopy, FaCheck, FaPercentage,
  FaDollarSign, FaCalendarAlt, FaTimes, FaInfoCircle,
  FaSyncAlt, FaRegCheckCircle, FaRegTimesCircle
} from 'react-icons/fa';
import { Coupon, SubscriptionPlan } from '../../models/types';
import { getSupabaseClient } from '../../lib/supabase';

// Mapeamento de planos para nomes amigáveis
const planNames = {
  [SubscriptionPlan.FREE]: 'Gratuito',
  [SubscriptionPlan.MICRO_BUSINESS]: 'Micro Empresa',
  [SubscriptionPlan.SMALL_BUSINESS]: 'Pequena Empresa',
  [SubscriptionPlan.BUSINESS_SIMPLE]: 'Empresa',
  [SubscriptionPlan.BUSINESS_PLUS]: 'Empresa Plus'
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    discount: 0,
    type: 'percentage' as 'percentage' | 'fixed',
    validUntil: '',
    maxUses: 100,
    planId: '',
    description: '',
    isActive: true
  });
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Carregar dados dos cupons
  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Chamar a API de cupons
      const response = await fetch('/api/admin/coupons');
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar cupons: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Os dados já vêm convertidos da API, mas vamos garantir compatibilidade
        const formattedCoupons = data.data.map((coupon: any) => ({
          id: coupon.id,
          code: coupon.code,
          name: coupon.name,
          description: coupon.description,
          // Usar estrutura correta do banco
          discount_value: coupon.discount_value,
          discount_type: coupon.discount_type,
          usage_limit: coupon.usage_limit,
          usage_count: coupon.usage_count,
          plan_ids: coupon.plan_ids,
          valid_until: coupon.valid_until,
          is_active: coupon.is_active,
          
          // Campos legados para compatibilidade com o frontend
          discount: coupon.discount_value || coupon.discount,
          type: coupon.discount_type || coupon.type,
          validUntil: new Date(coupon.valid_until || coupon.validUntil),
          maxUses: coupon.usage_limit || coupon.maxUses,
          currentUses: coupon.usage_count || coupon.currentUses,
          planId: coupon.plan_ids ? (Array.isArray(coupon.plan_ids) ? coupon.plan_ids[0] : coupon.plan_ids) : (coupon.planId || ''),
          isActive: coupon.is_active !== undefined ? coupon.is_active : coupon.isActive
        }));
        
        setCoupons(formattedCoupons);
      } else {
        setError(data.error || 'Erro ao carregar dados');
        setCoupons([]);
      }
    } catch (error) {
      console.error('Erro ao carregar cupons:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar cupons');
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCoupons();
  }, []);

  // Filtrar cupons com base no termo de busca
  const filteredCoupons = coupons.filter(coupon => 
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (coupon.description && coupon.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Iniciar edição de um cupom
  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount: coupon.discount_value || coupon.discount || 0,
      type: (coupon.discount_type || coupon.type || 'percentage') as 'percentage' | 'fixed',
      validUntil: new Date(coupon.valid_until || coupon.validUntil).toISOString().split('T')[0],
      maxUses: coupon.usage_limit || coupon.maxUses || 100,
      planId: coupon.plan_ids ? (Array.isArray(coupon.plan_ids) ? coupon.plan_ids[0] : coupon.plan_ids) : (coupon.planId || ''),
      description: coupon.description || '',
      isActive: coupon.is_active !== undefined ? coupon.is_active : (coupon.isActive !== undefined ? coupon.isActive : true)
    });
    setShowForm(true);
  };

  // Iniciar criação de um novo cupom
  const handleNewCoupon = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      discount: 0,
      type: 'percentage',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      maxUses: 100,
      planId: '',
      description: '',
      isActive: true
    });
    setShowForm(true);
  };

  // Lidar com mudanças nos campos do formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      // @ts-ignore - precisamos tratar o caso específico do checkbox
      setFormData(prevData => ({
        ...prevData,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else {
      setFormData(prevData => ({
        ...prevData,
        [name]: name === 'discount' || name === 'maxUses' 
          ? Number(value) 
          : name === 'planId' && value !== '' 
            ? value as SubscriptionPlan 
            : value
      }));
    }
  };

  // Salvar o cupom (novo ou editado)
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const url = '/api/admin/coupons';
      const method = editingCoupon ? 'PUT' : 'POST';
      const body = {
        ...(editingCoupon ? { id: editingCoupon.id } : {}),
        code: formData.code,
        discount: formData.discount,
        type: formData.type,
        validUntil: formData.validUntil,
        maxUses: formData.maxUses,
        planId: formData.planId || undefined,
        description: formData.description,
        isActive: formData.isActive
      };
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`Cupom ${editingCoupon ? 'atualizado' : 'criado'} com sucesso!`);
        
        // Atualizar lista de cupons
        await fetchCoupons();
        
        // Fechar o formulário
        setShowForm(false);
        setEditingCoupon(null);
      } else {
        setError(data.error || `Erro ao ${editingCoupon ? 'atualizar' : 'criar'} cupom`);
      }
    } catch (error) {
      console.error('Erro ao salvar cupom:', error);
      setError(error instanceof Error ? error.message : 'Erro ao salvar cupom');
    } finally {
      setLoading(false);
    }
  };

  // Excluir um cupom
  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm('Tem certeza que deseja excluir este cupom?')) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch(`/api/admin/coupons?id=${couponId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Cupom excluído com sucesso!');
        
        // Atualizar lista de cupons
        await fetchCoupons();
      } else {
        setError(data.error || 'Erro ao excluir cupom');
      }
    } catch (error) {
      console.error('Erro ao excluir cupom:', error);
      setError(error instanceof Error ? error.message : 'Erro ao excluir cupom');
    } finally {
      setLoading(false);
    }
  };

  // Copiar código do cupom para a área de transferência
  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    
    // Remover a mensagem de "copiado" após 2 segundos
    setTimeout(() => {
      setCopied(null);
    }, 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gerenciar Cupons de Desconto</h1>
        <div className="flex gap-2">
          <button 
            onClick={fetchCoupons}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={loading}
          >
            <FaSyncAlt className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </button>
          <button 
            onClick={handleNewCoupon}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            disabled={loading}
          >
            <FaPlus className="mr-2" /> Novo Cupom
          </button>
        </div>
      </div>
      
      {/* Mensagens de erro e sucesso */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-md flex items-start">
          <FaRegTimesCircle className="mr-2 mt-1 flex-shrink-0" />
          <div>{error}</div>
          <button 
            onClick={() => setError(null)} 
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <FaTimes />
          </button>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-300 text-green-700 rounded-md flex items-start">
          <FaRegCheckCircle className="mr-2 mt-1 flex-shrink-0" />
          <div>{success}</div>
          <button 
            onClick={() => setSuccess(null)} 
            className="ml-auto text-green-500 hover:text-green-700"
          >
            <FaTimes />
          </button>
        </div>
      )}
      
      {/* Barra de pesquisa */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex items-center">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar cupons por código ou descrição..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      {/* Formulário de criação/edição de cupom */}
      {showForm && (
        <div className="mb-6 bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}
            </h2>
            <button 
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes />
            </button>
          </div>
          
          <form onSubmit={handleSaveCoupon}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                  Código do cupom
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  required
                  placeholder="ex: WELCOME20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!!editingCoupon} // Não permitir editar o código
                />
                {editingCoupon && (
                  <p className="mt-1 text-xs text-gray-500">O código não pode ser alterado após a criação.</p>
                )}
              </div>
              
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de desconto
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="percentage">Percentual (%)</option>
                  <option value="fixed">Valor fixo (R$)</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="discount" className="block text-sm font-medium text-gray-700 mb-1">
                  Valor do desconto
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {formData.type === 'percentage' ? (
                      <FaPercentage className="text-gray-500" />
                    ) : (
                      <FaDollarSign className="text-gray-500" />
                    )}
                  </div>
                  <input
                    type="number"
                    id="discount"
                    name="discount"
                    min="0"
                    max={formData.type === 'percentage' ? "100" : undefined}
                    value={formData.discount}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="validUntil" className="block text-sm font-medium text-gray-700 mb-1">
                  Válido até
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaCalendarAlt className="text-gray-500" />
                  </div>
                  <input
                    type="date"
                    id="validUntil"
                    name="validUntil"
                    value={formData.validUntil}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="maxUses" className="block text-sm font-medium text-gray-700 mb-1">
                  Número máximo de usos
                </label>
                <input
                  type="number"
                  id="maxUses"
                  name="maxUses"
                  min="1"
                  value={formData.maxUses}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="planId" className="block text-sm font-medium text-gray-700 mb-1">
                  Plano específico (opcional)
                </label>
                <select
                  id="planId"
                  name="planId"
                  value={formData.planId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos os planos</option>
                  <option value={SubscriptionPlan.MICRO_BUSINESS}>{planNames[SubscriptionPlan.MICRO_BUSINESS]}</option>
                  <option value={SubscriptionPlan.SMALL_BUSINESS}>{planNames[SubscriptionPlan.SMALL_BUSINESS]}</option>
                  <option value={SubscriptionPlan.BUSINESS_SIMPLE}>{planNames[SubscriptionPlan.BUSINESS_SIMPLE]}</option>
                  <option value={SubscriptionPlan.BUSINESS_PLUS}>{planNames[SubscriptionPlan.BUSINESS_PLUS]}</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Descrição do cupom (opcional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Cupom ativo</span>
                </label>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
              <div className="flex items-start">
                <FaInfoCircle className="text-blue-500 mt-1 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Informações importantes</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Códigos de cupom são case-sensitive (diferencia maiúsculas e minúsculas)</li>
                    <li>Uma vez criado, um cupom não pode ter seu código alterado</li>
                    <li>Cupons expirados ainda aparecem no sistema, mas não podem ser usados</li>
                    <li>Ao atingir o número máximo de usos, o cupom é automaticamente desativado</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                {loading && <FaSyncAlt className="animate-spin mr-2" />}
                {editingCoupon ? 'Atualizar Cupom' : 'Criar Cupom'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Lista de cupons */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading && !showForm ? (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">Carregando cupons...</p>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {searchTerm ? 'Nenhum cupom encontrado com este termo de busca.' : 'Nenhum cupom cadastrado.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Desconto
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plano
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Validade
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usos
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCoupons.map((coupon) => {
                  const isExpired = new Date(coupon.valid_until) < new Date();
                  const isMaxedOut = coupon.usage_count >= coupon.usage_limit;
                  const isActive = coupon.is_active && !isExpired && !isMaxedOut;
                  
                  return (
                    <tr key={coupon.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="font-medium text-gray-900">{coupon.code}</div>
                          <button 
                            onClick={() => handleCopyCoupon(coupon.code)}
                            title="Copiar código"
                            className="ml-2 text-gray-400 hover:text-gray-600"
                          >
                            {copied === coupon.code ? <FaCheck className="text-green-500" /> : <FaCopy />}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {coupon.discount_type === 'percentage' ? (
                          <span className="text-gray-900">{coupon.discount_value || 0}%</span>
                        ) : (
                          <span className="text-gray-900">R$ {(coupon.discount_value || 0).toFixed(2)}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {coupon.plan_ids ? (
                          <span className="text-gray-900">Planos Específicos</span>
                        ) : (
                          <span className="text-gray-500">Todos os planos</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-900">{new Date(coupon.valid_until).toLocaleDateString('pt-BR')}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-900">
                          {coupon.usage_count || 0} / {coupon.usage_limit || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isActive ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            Ativo
                          </span>
                        ) : isExpired ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                            Expirado
                          </span>
                        ) : isMaxedOut ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                            Esgotado
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                            Inativo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditCoupon(coupon)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          title="Editar"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(coupon.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Excluir"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 