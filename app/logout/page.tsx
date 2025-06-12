'use client';

import { useEffect } from 'react';

export default function LogoutPage() {
  useEffect(() => {
    const performLogout = async () => {
      try {
        // Usar o sistema centralizado de logout
        const { logout } = await import('../lib/authSync');
        await logout();
        
        console.log('✅ Logout centralizado realizado com sucesso');
        
        // Redirecionar para home
        window.location.href = '/';
      } catch (error) {
        console.error('❌ Erro durante logout:', error);
        
        // Fallback: limpar manualmente
        localStorage.clear();
        sessionStorage.clear();
        
        // Limpar todos os cookies
        const cookiesToClear = [
          'bdc_auth_session', 'bdc_user_id', 'bdc_user_email', 'bdc_user_name',
          'sb-access-token', 'sb-refresh-token', 'user-id', 
          'user-email', 'user-name', 'auth-expires'
        ];
        
        cookiesToClear.forEach(cookie => {
          document.cookie = `${cookie}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        });
        
        window.location.href = '/';
      }
    };
    
    performLogout();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">
          Saindo da conta...
        </h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  );
} 