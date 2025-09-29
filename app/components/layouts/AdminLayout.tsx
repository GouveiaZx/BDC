"use client";

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { FaHome, FaUsers, FaShoppingCart, FaNewspaper, FaChartBar, FaCog, FaBell, FaSignOutAlt, FaUserCog } from 'react-icons/fa';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  // Menu lateral do admin
  const sidebarItems = [
    { name: 'Dashboard', icon: <FaHome className="mr-2" />, href: '/admin' },
    { name: 'Usuários', icon: <FaUsers className="mr-2" />, href: '/admin/usuarios' },
    { name: 'Anúncios', icon: <FaNewspaper className="mr-2" />, href: '/admin/anuncios' },
    { name: 'Destaques', icon: <FaBell className="mr-2" />, href: '/admin/destaques' },
    { name: 'Assinaturas', icon: <FaShoppingCart className="mr-2" />, href: '/admin/assinaturas' },
    { name: 'Config. de Planos', icon: <FaCog className="mr-2" />, href: '/admin/subscription-management' },
    { name: 'Estatísticas', icon: <FaChartBar className="mr-2" />, href: '/admin/dashboard' },
    { name: 'Configurações', icon: <FaUserCog className="mr-2" />, href: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white p-4">
        <div className="text-center p-4 mb-6">
          <h1 className="text-xl font-bold">BuscaAquiBDC Admin</h1>
        </div>
        
        <nav>
          <ul className="space-y-2">
            {sidebarItems.map((item) => (
              <li key={item.name}>
                <Link 
                  href={item.href}
                  className="flex items-center px-4 py-2 hover:bg-gray-700 rounded-md"
                >
                  {item.icon}
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="absolute bottom-0 w-56 mb-4">
          <div className="border-t border-gray-700 pt-4 mt-8">
            <Link 
              href="/admin/logout"
              className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-md"
            >
              <FaSignOutAlt className="mr-2" />
              Sair
            </Link>
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
} 