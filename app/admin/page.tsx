"use client";

import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/layouts/AdminLayout';
import {
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Line,
  BarChart,
  Bar,
  Tooltip,
  Legend,
} from 'recharts';

// Tipo para as estatísticas
type DashboardStats = {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  avgSessionTime: string;
  contentCount: number;
  completionRate: number;
};

// Dados de exemplo para o gráfico de usuários
const userData = [
  { name: 'Jan', ativos: 400, total: 650 },
  { name: 'Fev', ativos: 500, total: 800 },
  { name: 'Mar', ativos: 600, total: 950 },
  { name: 'Abr', ativos: 700, total: 1200 },
  { name: 'Mai', ativos: 850, total: 1400 },
  { name: 'Jun', ativos: 1000, total: 1600 },
];

// Dados de exemplo para o gráfico de receita
const revenueData = [
  { name: 'Jan', valor: 4000 },
  { name: 'Fev', valor: 5000 },
  { name: 'Mar', valor: 6000 },
  { name: 'Abr', valor: 7000 },
  { name: 'Mai', valor: 8500 },
  { name: 'Jun', valor: 10000 },
];

export default function AdminDashboard() {
  // Estado para armazenar as estatísticas
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalRevenue: 0,
    avgSessionTime: '0m 0s',
    contentCount: 0,
    completionRate: 0
  });

  // Buscar estatísticas do dashboard
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Tentar usar a nova API de estatísticas primeiro
        const response = await fetch('/api/admin/dashboard-stats');
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.stats) {
            setStats({
              totalUsers: data.stats.users?.total || 0,
              activeUsers: data.stats.users?.paid || 0,
              totalRevenue: data.stats.revenue?.monthly * 6 || 0,
              avgSessionTime: '12m 30s', // Dados estáticos para exemplo
              contentCount: 250, // Dados estáticos para exemplo
              completionRate: 68 // Dados estáticos para exemplo
            });
            return;
          }
        }
        
        // Se a API nova falhar, tentar a API de estatísticas de assinaturas
        console.log('Usando API alternativa para estatísticas...');
        const fallbackResponse = await fetch('/api/admin/subscriptions-stats');
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.success && fallbackData.stats) {
            setStats({
              totalUsers: fallbackData.stats.total || 0,
              activeUsers: fallbackData.stats.active || 0,
              totalRevenue: fallbackData.stats.revenue?.monthly * 6 || 0,
              avgSessionTime: '12m 30s', // Dados estáticos para exemplo
              contentCount: 250, // Dados estáticos para exemplo
              completionRate: 68 // Dados estáticos para exemplo
            });
            return;
          }
        }
        
        // Se ambas as APIs falharem, usar dados da API de assinaturas
        console.log('Usando API de assinaturas completa para estatísticas...');
        const subsResponse = await fetch('/api/admin/subscriptions-all?limit=200');
        
        if (subsResponse.ok) {
          const subsData = await subsResponse.json();
          if (subsData.success && subsData.stats) {
            setStats({
              totalUsers: subsData.stats.totalUsers || 0,
              activeUsers: subsData.stats.active || subsData.stats.paidUsers || 0,
              totalRevenue: subsData.stats.revenue?.monthly * 6 || 0,
              avgSessionTime: '12m 30s', // Dados estáticos para exemplo
              contentCount: 250, // Dados estáticos para exemplo
              completionRate: 68 // Dados estáticos para exemplo
            });
            return;
          }
        }
        
        throw new Error('Error 404: Not Found');
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      }
    };
    
    fetchStats();
  }, []);

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Painel de Controle</h1>
        
        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total de Usuários</p>
                  <h3 className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</h3>
                </div>
                <div className="bg-blue-100 p-2 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-gray-500">
                  <span className="text-green-500">+{Math.floor(stats.totalUsers * 0.15)}</span> novos este mês
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Assinaturas Ativas</p>
                  <h3 className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</h3>
                </div>
                <div className="bg-green-100 p-2 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-gray-500">
                  Taxa de conversão: {Math.round((stats.activeUsers / stats.totalUsers) * 100 || 0)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Receita Total</p>
                  <h3 className="text-2xl font-bold">
                    R$ {stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                </div>
                <div className="bg-purple-100 p-2 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-purple-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-gray-500">
                  <span className="text-green-500">+{Math.floor(stats.totalRevenue * 0.12)}</span> comparado ao mês anterior
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <button className="px-4 py-2 bg-gray-200 rounded-lg">Usuários</button>
            <button className="px-4 py-2 bg-white rounded-lg">Receita</button>
          </div>

          <div className="mt-6">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h4 className="text-lg font-medium mb-4">Crescimento de Usuários</h4>
                <div className="w-full overflow-auto">
                  <BarChart
                    width={800}
                    height={300}
                    data={userData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="ativos" fill="#22c55e" name="Usuários Ativos" />
                    <Bar dataKey="total" fill="#3b82f6" name="Total de Usuários" />
                  </BarChart>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h4 className="text-lg font-medium mb-4">Receita Mensal</h4>
                <div className="w-full overflow-auto">
                  <LineChart
                    width={800}
                    height={300}
                    data={revenueData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`R$ ${value}`, 'Valor']} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="valor"
                      stroke="#8b5cf6"
                      name="Receita (R$)"
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 